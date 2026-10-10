/**
 * LeadLens Universal Website Tracking Client
 * Version: 5.2.0 (Dropthan Universal SaaS Engine)
 * 
 * STRICT CLIENT BOUNDARY:
 * - Ultra-lightweight vanilla JavaScript tracking client (< 12KB)
 * - Runs 100% invisibly in the background on external websites
 * - NEVER renders any UI, HTML, CSS, or iframes
 * - NEVER imports or mounts React dashboard components
 * - NEVER modifies or redirects the host website
 * - Dual-destination delivery: Dispatches directly to Supabase REST and LeadLens /api/track
 * 
 * Embed Syntax:
 * <script 
 *   src="https://your-domain.com/tracker.js" 
 *   data-website-id="YOUR_WEBSITE_ID" 
 *   data-tracking-id="YOUR_TRACKING_ID" 
 *   defer>
 * </script>
 */
(function (window, document) {
  'use strict';

  // Prevent multiple initializations on the same page
  if (window.__LEADLENS_INITIALIZED__) {
    return;
  }
  window.__LEADLENS_INITIALIZED__ = true;

  // 1. Locate current script element and extract configuration attributes
  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var s = scripts[i];
      if (
        s.getAttribute('data-tracking-id') ||
        s.getAttribute('data-website-id') ||
        s.getAttribute('data-brand-key') ||
        s.getAttribute('data-brand-id')
      ) {
        return s;
      }
    }
    return null;
  })();

  // Resolve Website and Tracking Identifiers (supports new and legacy syntax)
  var trackingId = (currentScript ? (currentScript.getAttribute('data-tracking-id') || currentScript.getAttribute('data-brand-key')) : null) ||
    window.LEADLENS_TRACKING_ID ||
    window.LEADLENS_BRAND_KEY ||
    null;

  var websiteId = (currentScript ? (currentScript.getAttribute('data-website-id') || currentScript.getAttribute('data-brand-id')) : null) ||
    window.LEADLENS_WEBSITE_ID ||
    window.LEADLENS_BRAND_ID ||
    trackingId;

  var customEndpoint = (currentScript ? currentScript.getAttribute('data-endpoint') : null) || window.LEADLENS_ENDPOINT || null;

  // Resolve LeadLens server host URL from script source, with safe fallback
  var leadLensHost = (function () {
    if (customEndpoint) return customEndpoint.replace(/\/$/, '');
    if (currentScript && currentScript.src) {
      try {
        var u = new URL(currentScript.src);
        return u.origin;
      } catch (e) {}
    }
    return '';
  })();

  // Supabase REST configuration (Direct CORS-enabled pipeline)
  var SUPABASE_URL = 'https://jfsmjztrnicqrcvgyzgd.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmc21qenRybmljcXJjdmd5emdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NTI4MTAsImV4cCI6MjEwNzEyODgxMH0.7HoSbFvgijWqE_etVGYM13KHjzS-s8p2vf0DJtQZLhI';

  var STORAGE_KEY_SESSION = 'leadlens_session_v5';
  var STORAGE_KEY_VISITOR = 'leadlens_visitor_v5';
  var STORAGE_KEY_PHONE = 'leadlens_customer_phone';
  var STORAGE_KEY_EMAIL = 'leadlens_customer_email';
  var STORAGE_KEY_NAME = 'leadlens_customer_name';

  // 2. Persistent Visitor and Session Identifiers
  var visitorId = '';
  var sessionId = '';

  try {
    visitorId = window.localStorage.getItem(STORAGE_KEY_VISITOR);
    if (!visitorId) {
      visitorId = 'vis_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
      window.localStorage.setItem(STORAGE_KEY_VISITOR, visitorId);
    }
  } catch (e) {
    visitorId = 'vis_' + Math.random().toString(36).substring(2, 9);
  }

  try {
    sessionId = window.sessionStorage.getItem(STORAGE_KEY_SESSION);
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 8) + Date.now().toString(36).substring(4);
      window.sessionStorage.setItem(STORAGE_KEY_SESSION, sessionId);
    }
  } catch (e) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 8);
  }

  // 3. Customer Identity (Permitted Contact Capture only)
  var customerData = {
    name: null,
    phone: null,
    email: null
  };

  try {
    customerData.name = window.sessionStorage.getItem(STORAGE_KEY_NAME) || null;
    customerData.phone = window.sessionStorage.getItem(STORAGE_KEY_PHONE) || null;
    customerData.email = window.sessionStorage.getItem(STORAGE_KEY_EMAIL) || null;
  } catch (e) {}

  function cleanPhone(val) {
    if (!val || typeof val !== 'string') return null;
    var trimmed = val.trim();
    var digits = trimmed.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) {
      return trimmed;
    }
    return null;
  }

  function cleanEmail(val) {
    if (!val || typeof val !== 'string') return null;
    var trimmed = val.trim();
    if (trimmed.indexOf('@') > 0 && trimmed.indexOf('.') > 2 && trimmed.length <= 80) {
      return trimmed.toLowerCase();
    }
    return null;
  }

  function cleanName(val) {
    if (!val || typeof val !== 'string') return null;
    var trimmed = val.trim();
    if (trimmed.length >= 2 && trimmed.length <= 60 && trimmed.indexOf('@') === -1 && !/^\d+$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  }

  // 4. Safe Form Input Monitoring for explicit Contact Fields only
  // (Strict rule: NEVER touches passwords, PINs, card numbers, or OTPs)
  function monitorContactInputs() {
    function onInput(e) {
      var input = e.target;
      if (!input) return;
      var tag = (input.tagName || '').toLowerCase();
      if (tag !== 'input' && tag !== 'textarea') return;

      var type = (input.type || '').toLowerCase();
      // Explicit security check: skip sensitive credentials
      if (type === 'password' || type === 'hidden' || type === 'file') return;

      var nameAttr = (input.name || '').toLowerCase();
      var idAttr = (input.id || '').toLowerCase();
      var autocomplete = (input.autocomplete || '').toLowerCase();
      var val = (input.value || '').trim();

      // Check for security keywords
      if (nameAttr.indexOf('pass') > -1 || nameAttr.indexOf('cvv') > -1 || nameAttr.indexOf('card') > -1 || nameAttr.indexOf('otp') > -1) {
        return;
      }

      // Telephone capture
      if (type === 'tel' || nameAttr.indexOf('phone') > -1 || nameAttr.indexOf('mobile') > -1 || nameAttr.indexOf('whatsapp') > -1 || idAttr.indexOf('phone') > -1 || autocomplete === 'tel') {
        var validPhone = cleanPhone(val);
        if (validPhone) {
          customerData.phone = validPhone;
          try { window.sessionStorage.setItem(STORAGE_KEY_PHONE, validPhone); } catch (err) {}
        }
      }

      // Email capture
      if (type === 'email' || nameAttr.indexOf('email') > -1 || idAttr.indexOf('email') > -1 || autocomplete === 'email') {
        var validEmail = cleanEmail(val);
        if (validEmail) {
          customerData.email = validEmail;
          try { window.sessionStorage.setItem(STORAGE_KEY_EMAIL, validEmail); } catch (err) {}
        }
      }

      // Name capture (only if explicitly named)
      if ((nameAttr.indexOf('fname') > -1 || nameAttr.indexOf('lname') > -1 || nameAttr.indexOf('customer_name') > -1 || idAttr.indexOf('customer') > -1 || autocomplete.indexOf('name') > -1) && !customerData.name) {
        var validN = cleanName(val);
        if (validN) {
          customerData.name = validN;
          try { window.sessionStorage.setItem(STORAGE_KEY_NAME, validN); } catch (err) {}
        }
      }
    }

    document.addEventListener('input', onInput, true);
    document.addEventListener('change', onInput, true);
  }

  // 5. Intelligent Product Name and Price Detection
  function detectProductContext(element) {
    var result = {
      name: '',
      price: null,
      id: null
    };

    if (!element || element === document.body) {
      result.name = document.title || 'General Website Item';
      return result;
    }

    var el = element;
    while (el && el !== document.body) {
      if (el.getAttribute('data-product-name')) result.name = el.getAttribute('data-product-name');
      if (el.getAttribute('data-item-name') && !result.name) result.name = el.getAttribute('data-item-name');
      if (el.getAttribute('data-product-id')) result.id = el.getAttribute('data-product-id');
      if (el.getAttribute('data-product-price') && !result.price) {
        var pr = parseFloat(el.getAttribute('data-product-price'));
        if (!isNaN(pr)) result.price = pr;
      }

      if (result.name) break;

      // Class-based product title heuristics
      var titleNode = el.querySelector(
        '.product-title, .product__title, .product-name, [data-role="product-title"], .item-title, [itemprop="name"], .woocommerce-loop-product__title, h1, h2, h3'
      );
      if (titleNode && titleNode.textContent && titleNode.textContent.trim().length > 2 && titleNode.textContent.trim().length < 120) {
        result.name = titleNode.textContent.trim();
        break;
      }

      var img = el.querySelector('img[alt]');
      if (img && img.alt && img.alt.trim().length > 3) {
        result.name = img.alt.trim();
        break;
      }

      el = el.parentElement;
    }

    if (!result.name && element.textContent && element.textContent.trim().length > 2 && element.textContent.trim().length < 80) {
      result.name = element.textContent.trim();
    }

    if (!result.name) {
      result.name = document.title || 'Storefront Product';
    }

    return result;
  }

  // 6. Robust Multi-Destination Dispatcher
  function sendTrackingEvent(eventData) {
    var activeKey = trackingId || (currentScript ? (currentScript.getAttribute('data-tracking-id') || currentScript.getAttribute('data-brand-key')) : null);
    var activeWebsite = websiteId || (currentScript ? (currentScript.getAttribute('data-website-id') || currentScript.getAttribute('data-brand-id')) : null) || activeKey;

    if (!activeKey && !activeWebsite) {
      return;
    }

    var effectiveIdentifier = activeWebsite || activeKey;
    var eventType = eventData.event_type || eventData.status || 'Product Viewed';

    // Map customer name or anonymous visitor
    var customerName = eventData.customer_name || customerData.name || null;
    var visitorNameFormatted = customerName
      ? (customerName + ' (' + sessionId + ')')
      : ('Anonymous Visitor (' + sessionId + ')');

    var phone = eventData.phone_number !== undefined ? eventData.phone_number : customerData.phone;
    var email = eventData.email !== undefined ? eventData.email : customerData.email;

    var productName = eventData.product_name || eventData.clicked_item || 'Storefront Item';
    var status = eventData.status || 'Abandoned';

    var unifiedPayload = {
      brand_id: effectiveIdentifier,
      brand_api_key: activeKey,
      visitor_name: visitorNameFormatted,
      phone_number: phone || null,
      email: email || null,
      clicked_item: productName,
      status: status
    };

    // 1. Dispatch DOM CustomEvent for in-page test suites & simulators
    try {
      var evt = new CustomEvent('leadlens:track', {
        detail: {
          brand_id: effectiveIdentifier,
          brand_api_key: activeKey,
          visitor_identifier: visitorNameFormatted,
          visitor_phone: phone || null,
          visitor_email: email || null,
          clicked_item_name: productName,
          status: status,
          event_type: eventType,
          page_url: window.location.href,
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(evt);
    } catch (e) {}

    // 2. Direct POST to Supabase REST API (Permissive Global CORS, bypasses dev-server auth checks)
    try {
      fetch(SUPABASE_URL + '/rest/v1/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': 'Bearer ' + SUPABASE_ANON,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(unifiedPayload),
        mode: 'cors',
        keepalive: true
      }).catch(function () {});
    } catch (e) {}

    // 3. Direct POST to LeadLens server /api/track (if reachable)
    if (leadLensHost) {
      try {
        fetch(leadLensHost + '/api/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-brand-key': activeKey || ''
          },
          body: JSON.stringify(unifiedPayload),
          mode: 'cors',
          keepalive: true
        }).catch(function () {});
      } catch (e) {}
    }
  }

  // 7. Handshake Signal on Initial Script Load
  function sendInitializationPing() {
    var key = trackingId || (currentScript ? (currentScript.getAttribute('data-tracking-id') || currentScript.getAttribute('data-brand-key')) : null);
    var bId = websiteId || (currentScript ? (currentScript.getAttribute('data-website-id') || currentScript.getAttribute('data-brand-id')) : null) || key;
    if (!key && !bId) return;

    var pingPayload = {
      brand_api_key: key,
      brand_id: bId,
      visitor_name: 'Storefront Initialized (' + sessionId + ')',
      phone_number: null,
      email: null,
      clicked_item: 'Storefront Script Handshake',
      status: 'Handshake Ping',
      event_type: 'Handshake Ping'
    };

    // Notify backend ping endpoint
    if (leadLensHost) {
      try {
        fetch(leadLensHost + '/api/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pingPayload),
          mode: 'cors',
          keepalive: true
        }).catch(function () {});

        var pixel = new Image();
        pixel.src = leadLensHost + '/api/ping?brand_key=' + encodeURIComponent(key || '') + '&brand_id=' + encodeURIComponent(bId || '') + '&t=' + Date.now();
      } catch (e) {}
    }

    sendTrackingEvent(pingPayload);
  }

  // 8. Purchase Verification (Only on verified checkout confirmation pages)
  function checkPurchaseConfirmation() {
    var pathname = window.location.pathname.toLowerCase();
    var href = window.location.href.toLowerCase();

    var isOrderCompleted =
      pathname.indexOf('thank_you') > -1 ||
      pathname.indexOf('order-received') > -1 ||
      pathname.indexOf('checkout/success') > -1 ||
      pathname.indexOf('orders/confirmation') > -1 ||
      href.indexOf('status=completed') > -1 ||
      href.indexOf('order_id=') > -1;

    if (isOrderCompleted) {
      // Prevent duplicate purchase reports for same session
      var purchaseReportedKey = 'leadlens_purchased_' + sessionId;
      try {
        if (window.sessionStorage.getItem(purchaseReportedKey)) {
          return true;
        }
        window.sessionStorage.setItem(purchaseReportedKey, '1');
      } catch (e) {}

      sendTrackingEvent({
        customer_name: customerData.name,
        phone_number: customerData.phone,
        email: customerData.email,
        clicked_item: 'Completed Checkout Order',
        status: 'Purchased',
        event_type: 'Purchase Completed'
      });
      return true;
    }
    return false;
  }

  // 9. Delegated Event Listeners for Clicks, WhatsApp, Cart & Checkout
  function setupDelegatedListeners() {
    var throttleTime = 0;
    var lastItem = '';

    document.addEventListener('click', function (e) {
      var target = e.target;
      if (!target) return;

      var actionable = target.closest('button, a, input[type="submit"], .product-card, [data-track-lead], [data-add-to-cart], [data-checkout]');
      if (!actionable) return;

      var text = (actionable.textContent || '').toLowerCase();
      var href = (actionable.getAttribute('href') || '').toLowerCase();
      var context = detectProductContext(actionable);

      var now = Date.now();
      if (now - throttleTime < 800 && lastItem === context.name) return;
      throttleTime = now;
      lastItem = context.name;

      var isWhatsApp = href.indexOf('wa.me') > -1 || href.indexOf('whatsapp.com') > -1 || text.indexOf('whatsapp') > -1;
      var isContact = href.indexOf('mailto:') > -1 || href.indexOf('tel:') > -1 || text.indexOf('contact') > -1 || text.indexOf('enquir') > -1 || text.indexOf('quote') > -1;
      var isCart = text.indexOf('cart') > -1 || text.indexOf('bag') > -1 || text.indexOf('buy now') > -1 || text.indexOf('order now') > -1 || actionable.hasAttribute('data-add-to-cart');
      var isCheckout = text.indexOf('checkout') > -1 || text.indexOf('proceed to payment') > -1 || actionable.hasAttribute('data-checkout');

      var status = 'Viewed but Not Bought';
      var eventType = 'Product Clicked';

      if (isWhatsApp) {
        status = 'WhatsApp Enquiry';
        eventType = 'WhatsApp Clicked';
      } else if (isContact) {
        status = 'Contact Enquiry';
        eventType = 'Contact Clicked';
      } else if (isCheckout) {
        status = 'Checkout Started';
        eventType = 'Checkout Started';
      } else if (isCart) {
        status = 'Cart Abandoned';
        eventType = 'Added to Cart';
      }

      sendTrackingEvent({
        customer_name: customerData.name,
        phone_number: customerData.phone,
        email: customerData.email,
        clicked_item: context.name,
        product_name: context.name,
        status: status,
        event_type: eventType
      });
    }, true);
  }

  // 10. Initialization Routine
  function init() {
    monitorContactInputs();
    checkPurchaseConfirmation();
    setupDelegatedListeners();
    sendInitializationPing();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 11. Public Developer API (Zero UI, Safe Helper Methods)
  window.LeadLens = {
    version: '5.2.0',
    init: function (config) {
      if (typeof config === 'string') {
        trackingId = config;
        websiteId = config;
      } else if (config && typeof config === 'object') {
        if (config.trackingId) trackingId = config.trackingId;
        if (config.websiteId) websiteId = config.websiteId;
        if (config.endpoint) leadLensHost = config.endpoint.replace(/\/$/, '');
      }
      sendInitializationPing();
    },
    ping: function () {
      sendInitializationPing();
    },
    getTrackingId: function () {
      return trackingId;
    },
    getWebsiteId: function () {
      return websiteId;
    },
    identify: function (user) {
      if (!user || typeof user !== 'object') return;
      if (user.phone) {
        customerData.phone = cleanPhone(user.phone);
        try { window.sessionStorage.setItem(STORAGE_KEY_PHONE, customerData.phone); } catch (e) {}
      }
      if (user.email) {
        customerData.email = cleanEmail(user.email);
        try { window.sessionStorage.setItem(STORAGE_KEY_EMAIL, customerData.email); } catch (e) {}
      }
      if (user.name) {
        customerData.name = cleanName(user.name);
        try { window.sessionStorage.setItem(STORAGE_KEY_NAME, customerData.name); } catch (e) {}
      }
    },
    track: function (eventName, data) {
      var d = data || {};
      sendTrackingEvent({
        customer_name: d.name || customerData.name,
        phone_number: d.phone || customerData.phone,
        email: d.email || customerData.email,
        clicked_item: d.productName || d.product_name || d.item || eventName || 'Custom Event',
        product_name: d.productName || d.product_name || d.item || eventName,
        status: d.status || (eventName === 'Purchase' ? 'Purchased' : (eventName === 'Add to Cart' ? 'Cart Abandoned' : 'Viewed but Not Bought')),
        event_type: eventName || 'Custom Event'
      });
    },
    trackPurchase: function (order) {
      var o = order || {};
      sendTrackingEvent({
        customer_name: o.customerName || customerData.name,
        phone_number: o.phone || customerData.phone,
        email: o.email || customerData.email,
        clicked_item: o.productName || ('Order #' + (o.orderId || Date.now())),
        product_name: o.productName || ('Order #' + (o.orderId || Date.now())),
        status: 'Purchased',
        event_type: 'Purchase Completed'
      });
    }
  };

})(window, document);
