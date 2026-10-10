import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

// In-memory connection tracker for external storefronts
const activeBrandConnections = new Map<string, { connected: boolean; lastPing: string; count: number }>();

const SUPABASE_REST_URL = 'https://jfsmjztrnicqrcvgyzgd.supabase.co/rest/v1/leads';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmc21qenRybmljcXJjdmd5emdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NTI4MTAsImV4cCI6MjEwNzEyODgxMH0.7HoSbFvgijWqE_etVGYM13KHjzS-s8p2vf0DJtQZLhI';

// Forward payload to Supabase leads table with error resilience
async function forwardToSupabase(payload: any) {
  try {
    const brandId = payload.brand_id || payload.brand_api_key;
    if (!brandId) return null;

    const bodyData = {
      brand_id: brandId,
      visitor_name: payload.visitor_name || payload.visitor_identifier || 'Storefront Visitor',
      phone_number: payload.phone_number || payload.visitor_phone || null,
      email: payload.email || payload.visitor_email || null,
      clicked_item: payload.clicked_item || payload.clicked_item_name || 'Apparel Item',
      status: payload.status === 'Cart Abandoned' ? 'Abandoned' : (payload.status || 'Abandoned')
    };

    const res = await fetch(SUPABASE_REST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(bodyData)
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to forward lead to Supabase:', err);
    return false;
  }
}

// Middleware plugin to provide CORS-enabled ingestion and handshake endpoints
function corsApiPlugin(): Plugin {
  return {
    name: 'leadlens-cors-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Universal CORS headers for all external stores (Shopify, WooCommerce, Custom HTML, Webflow)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, apikey, x-brand-key, data-brand-key');
        res.setHeader('Access-Control-Max-Age', '86400');

        // Handle preflight OPTIONS requests immediately
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        const rawUrl = req.url || '';
        const pathname = rawUrl.split('?')[0];

        // 1. Connection Status Poll: /api/connection-status or /api/status
        if ((pathname === '/api/connection-status' || pathname === '/api/status') && req.method === 'GET') {
          const urlObj = new URL(rawUrl, 'http://localhost:3000');
          const requestedKeys = [
            urlObj.searchParams.get('website_id'),
            urlObj.searchParams.get('tracking_id'),
            urlObj.searchParams.get('brand_id'),
            urlObj.searchParams.get('brand_key')
          ].filter(Boolean) as string[];
          
          let statusInfo: any = null;
          for (const k of requestedKeys) {
            if (activeBrandConnections.has(k)) {
              statusInfo = activeBrandConnections.get(k);
              break;
            }
          }

          // Fuzzy search if key prefixes match
          if (!statusInfo && requestedKeys.length > 0) {
            for (const [key, val] of activeBrandConnections.entries()) {
              for (const reqK of requestedKeys) {
                if (key.includes(reqK) || reqK.includes(key)) {
                  statusInfo = val;
                  break;
                }
              }
              if (statusInfo) break;
            }
          }

          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({
            connected: !!statusInfo?.connected,
            last_ping: statusInfo?.lastPing || null,
            total_events: statusInfo?.count || 0
          }));
          return;
        }

        // 2. Handshake Ping: /api/ping or /api/handshake (GET or POST)
        if (pathname === '/api/ping' || pathname === '/api/handshake') {
          if (req.method === 'GET') {
            const urlObj = new URL(rawUrl, 'http://localhost:3000');
            const keysToRecord = [
              urlObj.searchParams.get('website_id'),
              urlObj.searchParams.get('tracking_id'),
              urlObj.searchParams.get('brand_id'),
              urlObj.searchParams.get('brand_key')
            ].filter(Boolean) as string[];
            if (keysToRecord.length === 0) keysToRecord.push('generic');

            const now = new Date().toISOString();
            for (const k of keysToRecord) {
              const existing = activeBrandConnections.get(k) || { connected: true, lastPing: now, count: 0 };
              activeBrandConnections.set(k, { connected: true, lastPing: now, count: existing.count + 1 });
            }

            // Forward handshake ping to Supabase
            forwardToSupabase({
              brand_id: keysToRecord[0],
              visitor_name: 'Storefront Connection Ping',
              clicked_item: 'Handshake Verified',
              status: 'Handshake Ping'
            });

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, connected: true, message: 'Handshake verified successfully', timestamp: now }));
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              let parsed: any = {};
              try { parsed = JSON.parse(body || '{}'); } catch {}
              const keysToRecord = [
                parsed.website_id,
                parsed.tracking_id,
                parsed.brand_id,
                parsed.brand_api_key,
                parsed.brand_key
              ].filter(Boolean) as string[];
              if (keysToRecord.length === 0) keysToRecord.push('generic');

              const now = new Date().toISOString();
              for (const k of keysToRecord) {
                const existing = activeBrandConnections.get(k) || { connected: true, lastPing: now, count: 0 };
                activeBrandConnections.set(k, { connected: true, lastPing: now, count: existing.count + 1 });
              }

              await forwardToSupabase({
                brand_id: keysToRecord[0],
                visitor_name: parsed.visitor_name || parsed.visitor_identifier || 'Storefront Handshake',
                clicked_item: 'Handshake Verified',
                status: 'Handshake Ping'
              });

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, connected: true, message: 'Handshake verified successfully', timestamp: now }));
            });
            return;
          }
        }

        // 3. Event Ingestion: /api/track (POST)
        if (pathname === '/api/track' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            let parsed: any = {};
            try { parsed = JSON.parse(body || '{}'); } catch {}
            
            const keysToRecord = [
              parsed.website_id,
              parsed.tracking_id,
              parsed.brand_id,
              parsed.brand_api_key,
              parsed.brand_key
            ].filter(Boolean) as string[];
            const now = new Date().toISOString();
            for (const k of keysToRecord) {
              const existing = activeBrandConnections.get(k) || { connected: true, lastPing: now, count: 0 };
              activeBrandConnections.set(k, { connected: true, lastPing: now, count: existing.count + 1 });
            }

            const inserted = await forwardToSupabase(parsed);

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              connected: true,
              inserted,
              message: 'Event ingested successfully and synced with Supabase'
            }));
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), corsApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
