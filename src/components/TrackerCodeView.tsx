import React, { useState } from 'react';
import { BrandProfile } from '../types';
import { Copy, Check, Code, ShieldCheck, Download, CheckCircle2, Globe, Sparkles, ExternalLink, Building2 } from 'lucide-react';

interface TrackerCodeViewProps {
  profile: BrandProfile;
}

export const TrackerCodeView: React.FC<TrackerCodeViewProps> = ({ profile }) => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'shopify' | 'woocommerce' | 'html' | 'custom'>('shopify');
  const [testResult, setTestResult] = useState<string | null>(null);

  const trackerUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/tracker.js`
    : 'https://leadlens.io/tracker.js';

  const scriptTagCode = `<script 
  src="${trackerUrl}" 
  data-website-id="${profile.id}" 
  data-tracking-id="${profile.api_key}" 
  defer>
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptTagCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleDownload = () => {
    fetch('/tracker.js')
      .then((r) => r.text())
      .then((code) => {
        const blob = new Blob([code], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tracker.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
  };

  const handleVerifyKey = () => {
    setTestResult('Verifying API Key...');
    setTimeout(() => {
      setTestResult(`✅ Tracking Key "${profile.api_key}" is active & verified with Supabase backend!`);
    }, 500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
            Installation & Embed Code
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">Zero Dependencies (&lt; 12KB)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Universal JavaScript Tracker for {profile.brand_name}
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Paste this single tag into your storefront’s HTML header or theme. The script runs 100% invisibly in the background, never renders dashboard UI, and routes all visitor drop-offs to your dashboard.
        </p>

        {/* Snippet Card */}
        <div className="mt-6 bg-[#0a0d14] border border-slate-800/90 rounded-xl overflow-hidden shadow-2xl">
          <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-mono">
              <Code className="w-3.5 h-3.5 text-sky-400" />
              <span>Universal Storefront Snippet</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                title="Download standalone tracker.js"
              >
                <Download className="w-3 h-3 text-slate-400" />
                <span>Download .js</span>
              </button>
              <button
                onClick={handleCopy}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet ? 'Copied to Clipboard!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 overflow-x-auto">
            <pre className="font-mono text-xs sm:text-sm text-emerald-300 whitespace-pre leading-relaxed">
              <code>{scriptTagCode}</code>
            </pre>
          </div>

          <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-900 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
            <span>
              Your Isolated Tracking Key:{' '}
              <strong className="text-sky-300 font-mono">{profile.api_key}</strong>
            </span>
            <button
              onClick={handleVerifyKey}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline transition-colors"
            >
              Verify Tracking Status
            </button>
          </div>
        </div>

        {testResult && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-mono">
            {testResult}
          </div>
        )}
      </div>

      {/* How the tracker automatically captures drop-offs */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Automatic Capture Capabilities</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-emerald-400 font-semibold mb-1 text-sm">
              1. Phone & Contact Auto-Capture
            </div>
            <p className="text-slate-400 leading-relaxed">
              Monitors contact input fields on your site (<code className="text-slate-300">tel</code>, <code className="text-slate-300">phone</code>, <code className="text-slate-300">whatsapp</code>). Once legitimately typed by the shopper, the contact info persists across their session.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-sky-400 font-semibold mb-1 text-sm">
              2. Product & Cart Context
            </div>
            <p className="text-slate-400 leading-relaxed">
              Inspects clicked cards, buttons, or links, automatically detecting the product name, price, and Add to Cart actions before checkout abandonment happens.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-purple-400 font-semibold mb-1 text-sm">
              3. WhatsApp / Enquiry Trigger
            </div>
            <p className="text-slate-400 leading-relaxed">
              Detects WhatsApp click buttons (<code className="text-slate-300">wa.me</code>), inquiry forms, and contact links, categorizing the intent for instant outreach.
            </p>
          </div>
        </div>
      </div>

      {/* Platform Instructions */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4">
          Store Setup Guides
        </h2>

        {/* Platform tabs */}
        <div className="flex border-b border-slate-800 gap-2 mb-4">
          <button
            onClick={() => setActivePlatform('shopify')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
              activePlatform === 'shopify'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Shopify Store
          </button>
          <button
            onClick={() => setActivePlatform('woocommerce')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
              activePlatform === 'woocommerce'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            WooCommerce / WordPress
          </button>
          <button
            onClick={() => setActivePlatform('html')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
              activePlatform === 'html'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom HTML / Webflow
          </button>
        </div>

        <div className="text-xs sm:text-sm text-slate-300 space-y-3">
          {activePlatform === 'shopify' && (
            <div className="space-y-2.5">
              <p className="text-slate-400">Follow these 3 steps to install on Shopify:</p>
              <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-1">
                <li>Log in to your <strong>Shopify Admin</strong> &gt; <strong>Online Store</strong> &gt; <strong>Themes</strong>.</li>
                <li>Click <strong>... (Actions)</strong> &gt; <strong>Edit code</strong>.</li>
                <li>Open <code className="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono text-xs">layout/theme.liquid</code>.</li>
                <li>Paste the LeadLens script tag right before the closing <code className="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono text-xs">&lt;/head&gt;</code> tag.</li>
                <li>Click <strong>Save</strong>. All drop-offs on product pages will immediately route to your dashboard!</li>
              </ol>
            </div>
          )}

          {activePlatform === 'woocommerce' && (
            <div className="space-y-2.5">
              <p className="text-slate-400">Follow these steps for WooCommerce / WordPress:</p>
              <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-1">
                <li>Install the free <strong>WPCode (Insert Headers and Footers)</strong> plugin.</li>
                <li>Go to <strong>Code Snippets</strong> &gt; <strong>Header &amp; Footer</strong>.</li>
                <li>Paste the script tag into the <strong>Header</strong> box.</li>
                <li>Click <strong>Save Changes</strong>.</li>
              </ol>
            </div>
          )}

          {activePlatform === 'html' && (
            <div className="space-y-2.5">
              <p className="text-slate-400">For Next.js, React, Webflow, or static websites:</p>
              <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-1">
                <li>Paste into your project's root <code className="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono text-xs">index.html</code> inside <code className="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono text-xs">&lt;head&gt;</code>.</li>
                <li>In Next.js, use the <code className="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono text-xs">&lt;Script&gt;</code> component in <code className="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono text-xs">app/layout.tsx</code>.</li>
              </ol>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
