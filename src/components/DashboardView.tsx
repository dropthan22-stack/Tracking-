import React, { useState, useMemo } from 'react';
import { BrandProfile, Lead, ConnectionTestResult, ConnectionStatusState } from '../types';
import { SUPABASE_PROJECT_URL, SUPABASE_MIGRATION_SQL } from '../lib/supabase';
import {
  Copy,
  Check,
  Search,
  MessageCircle,
  Mail,
  RefreshCw,
  Code2,
  Radio,
  ShieldCheck,
  Database,
  Download,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  Eye,
  MousePointerClick,
  ShoppingCart,
  ShoppingBag,
  Clock,
  Filter,
  Calendar,
  Building2
} from 'lucide-react';

interface DashboardViewProps {
  profile: BrandProfile;
  leads: Lead[];
  allEvents?: Lead[];
  onRegenerateKey: () => void;
  onTestConnection: () => Promise<ConnectionTestResult>;
  supabaseConnected: boolean;
  supabaseError: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  leads,
  allEvents = [],
  onRegenerateKey,
  onTestConnection,
  supabaseConnected,
  supabaseError
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'abandoned' | 'checkout' | 'inquiries' | 'purchased'>('all');

  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [pingSuccess, setPingSuccess] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<ConnectionTestResult | null>(null);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);

  const trackerOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://leadlens.io';
  const embedCode = `<script 
  src="${trackerOrigin}/tracker.js" 
  data-website-id="${profile.id}" 
  data-tracking-id="${profile.api_key}" 
  defer>
</script>`;

  // Determine actual connection state
  const connectionState: ConnectionStatusState = useMemo(() => {
    if (diagnosticResult?.connectionState) return diagnosticResult.connectionState;
    if (profile.connection_status) return profile.connection_status;
    if (profile.is_connected || leads.length > 0 || allEvents.length > 0 || pingSuccess) return 'CONNECTED';
    return 'AWAITING INSTALLATION';
  }, [profile, leads, allEvents, pingSuccess, diagnosticResult]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(profile.api_key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleDownloadTrackerScript = () => {
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
      })
      .catch(() => {
        alert('Could not download tracker script directly. You can copy the code snippet.');
      });
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_MIGRATION_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCopyPhone = (leadId: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(leadId);
    setTimeout(() => setCopiedPhoneId(null), 1500);
  };

  const handleTriggerTestConnection = async () => {
    setIsPinging(true);
    setPingSuccess(false);
    try {
      const res = await onTestConnection();
      setDiagnosticResult(res);
      if (res.success) {
        setPingSuccess(true);
      }
    } finally {
      setIsPinging(false);
    }
  };

  // Derive all events stream (fallback to leads if allEvents is empty)
  const combinedStream = useMemo(() => {
    const list = allEvents.length > 0 ? allEvents : leads;
    return list;
  }, [allEvents, leads]);

  // Real Analytics Metrics directly computed from Supabase event records
  const metrics = useMemo(() => {
    const totalEvents = combinedStream.length;
    const uniqueVisitors = new Set(combinedStream.map((l) => l.visitor_identifier)).size;
    const productClicks = combinedStream.filter(
      (l) => l.status === 'Viewed but Not Bought' || l.status === 'Viewed' || (l as any).event_type === 'Product Clicked'
    ).length;
    const cartAdds = combinedStream.filter((l) => l.status === 'Cart Abandoned').length;
    const checkouts = combinedStream.filter((l) => l.status === 'Checkout Started').length;
    const purchases = combinedStream.filter((l) => l.status === 'Purchased').length;
    const abandonedCarts = leads.length;
    const identifiedLeads = combinedStream.filter(
      (l) => (l.visitor_phone && l.visitor_phone.trim().length > 0) || (l.visitor_email && l.visitor_email.trim().length > 0)
    ).length;

    return {
      uniqueVisitors,
      totalEvents,
      productClicks,
      cartAdds,
      checkouts,
      purchases,
      abandonedCarts,
      identifiedLeads
    };
  }, [combinedStream, leads]);

  // Filtered Leads Stream (Active Cart Abandonments table strictly excludes 'Purchased' and 'Handshake Ping')
  const filteredLeads = useMemo(() => {
    let result = leads.filter((l) => l.status !== 'Purchased' && l.status !== 'Handshake Ping');

    // Date filtering
    if (dateFilter !== 'all') {
      const now = Date.now();
      const cutoff =
        dateFilter === '24h'
          ? now - 24 * 3600 * 1000
          : dateFilter === '7d'
          ? now - 7 * 86400 * 1000
          : now - 30 * 86400 * 1000;
      result = result.filter((l) => new Date(l.timestamp).getTime() >= cutoff);
    }

    // Status filtering
    if (statusFilter === 'abandoned') {
      result = result.filter((l) => l.status === 'Cart Abandoned');
    } else if (statusFilter === 'checkout') {
      result = result.filter((l) => l.status === 'Checkout Started');
    } else if (statusFilter === 'inquiries') {
      result = result.filter((l) => l.status === 'WhatsApp Enquiry' || l.status === 'Contact Enquiry');
    }

    // Search query filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((lead) => {
        const matchVisitor = lead.visitor_identifier.toLowerCase().includes(q);
        const matchPhone = lead.visitor_phone ? lead.visitor_phone.toLowerCase().includes(q) : false;
        const matchEmail = lead.visitor_email ? lead.visitor_email.toLowerCase().includes(q) : false;
        const matchItem = lead.clicked_item_name.toLowerCase().includes(q);
        return matchVisitor || matchPhone || matchEmail || matchItem;
      });
    }

    return result;
  }, [leads, searchQuery, dateFilter, statusFilter]);

  const generateWhatsAppLink = (lead: Lead) => {
    if (!lead.visitor_phone) return '#';
    const rawPhone = lead.visitor_phone.replace(/\D/g, '');
    const namePart = lead.visitor_identifier.split('(')[0].trim();
    const greeting = namePart.includes('vis_') || namePart.includes('sess_') || namePart.includes('Anonymous') ? 'Hello' : `Hi ${namePart}`;
    const text = `${greeting}! We saw you checking out the ${lead.clicked_item_name} on ${profile.brand_name}. Would you like an exclusive 10% coupon: LENS10 to complete your purchase today?`;
    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(text)}`;
  };

  const generateEmailLink = (lead: Lead) => {
    if (!lead.visitor_email) return '#';
    const subject = `Complete your order for ${lead.clicked_item_name} - ${profile.brand_name}`;
    const body = `Hi! You left the ${lead.clicked_item_name} in your bag. Use code LENS10 for 10% off today.`;
    return `mailto:${lead.visitor_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* 1. STORE INTEGRATION & REAL-TIME CONNECTION VERIFICATION */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-7 shadow-xs">
        
        {/* Header & Real-time Connection Status Badge */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Integration Setup
              </span>
              <span className="text-neutral-300">·</span>
              <span className="text-xs text-neutral-500 font-mono">Website ID: {profile.id}</span>
              <span className="text-neutral-300">·</span>
              <span className="text-xs text-neutral-500">
                Supabase: <code className="font-mono text-neutral-800">{SUPABASE_PROJECT_URL.replace('https://', '')}</code>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-orange-600" />
              <span>{profile.brand_name} Storefront Connection</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Copy or download the JavaScript tracking client into your storefront header to stream real-time visitor drop-offs.
            </p>
          </div>

          {/* DYNAMIC CONNECTION STATUS BADGES (Section 9) */}
          <div className="flex flex-wrap items-center gap-3">
            {connectionState === 'CONNECTED' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-xs shadow-emerald-500/10">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="tracking-wide">Connected Successfully</span>
              </div>
            )}

            {connectionState === 'AWAITING INSTALLATION' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
                <span className="tracking-wide">Awaiting Installation...</span>
              </div>
            )}

            {connectionState === 'TRACKING SCRIPT DETECTED' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 text-sky-800 border border-sky-300 text-xs font-bold">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                <span>Tracking Script Detected</span>
              </div>
            )}

            {connectionState === 'ENDPOINT CONNECTED' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-300 text-xs font-bold">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span>Endpoint Connected</span>
              </div>
            )}

            {connectionState === 'TEST EVENT RECEIVED' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-800 border border-teal-300 text-xs font-bold">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                <span>Test Event Received</span>
              </div>
            )}

            {connectionState === 'CONNECTION ERROR' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 text-red-800 border border-red-300 text-xs font-bold">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span>Connection Error</span>
              </div>
            )}

            {/* Test Connection Button (6-Step Genuine Verification) */}
            <button
              onClick={handleTriggerTestConnection}
              disabled={isPinging}
              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              title="Test real-time connection handshake with Supabase"
            >
              <Zap className={`w-3.5 h-3.5 text-orange-400 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Testing Handshake...' : pingSuccess ? 'Handshake Verified!' : 'Test Connection'}</span>
            </button>

            {/* Rotate API Key Button */}
            <button
              onClick={() => setShowRotateConfirm(true)}
              className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 transition-colors flex items-center gap-1.5"
              title="Rotate API Key"
            >
              <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
              <span>Rotate Key</span>
            </button>
          </div>
        </div>

        {/* Rotate Confirmation Modal */}
        {showRotateConfirm && (
          <div className="my-4 p-4 rounded-xl bg-orange-50 border border-orange-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-neutral-900">Are you sure you want to rotate your tracking key?</p>
              <p className="text-neutral-600 mt-0.5">
                External websites using the old key will need to be updated with the newly generated key.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  onRegenerateKey();
                  setShowRotateConfirm(false);
                }}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-colors"
              >
                Yes, Rotate Key
              </button>
              <button
                onClick={() => setShowRotateConfirm(false)}
                className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Code Snippet & Key Grid */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          
          {/* Unique Tracking API Key Card */}
          <div className="lg:col-span-5 bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Unique Tracking Identifier
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">Tied to {profile.id}</span>
              </div>
              <div className="mt-1.5 font-mono text-xs font-bold text-neutral-900 break-all select-all bg-white p-2.5 rounded-lg border border-neutral-200">
                {profile.api_key}
              </div>
              <p className="text-[11px] text-neutral-500 mt-2">
                This public tracking key isolates all events specifically to your website workspace.
              </p>
            </div>

            <button
              onClick={handleCopyKey}
              className="mt-3 w-full py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey ? 'Tracking Key Copied!' : 'Copy Tracking Key'}</span>
            </button>
          </div>

          {/* Generated JavaScript Snippet Card + Download Button */}
          <div className="lg:col-span-7 bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-orange-600" />
                  <span>JavaScript Tracking Snippet (Zero UI Client)</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Runs Invisibly &lt; 12KB
                </span>
              </div>
              <pre className="mt-1.5 p-2.5 bg-white border border-neutral-200 rounded-lg font-mono text-[11px] text-neutral-800 overflow-x-auto whitespace-pre">
                <code>{embedCode}</code>
              </pre>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleCopyScript}
                className="py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {copiedScript ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedScript ? 'Snippet Copied!' : 'Copy Script Tag (1-Click)'}</span>
              </button>

              <button
                onClick={handleDownloadTrackerScript}
                className="py-2 px-3 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                title="Download tracker.js to host on Shopify, WordPress, or your own CDN"
              >
                <Download className="w-4 h-4 text-neutral-600" />
                <span>Download tracker.js</span>
              </button>
            </div>
          </div>

        </div>

        {/* 6-STEP DIAGNOSTIC VERIFICATION REPORT MODAL / PANEL */}
        {diagnosticResult && (
          <div className="mt-5 p-5 rounded-xl border border-neutral-200 bg-neutral-50/80 text-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-5 h-5 ${diagnosticResult.success ? 'text-emerald-600' : 'text-red-600'}`} />
                <span className="font-bold text-neutral-900 text-sm">{diagnosticResult.message}</span>
                <span className="text-neutral-400">·</span>
                <span className="text-neutral-500 font-mono text-[11px]">
                  {new Date(diagnosticResult.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <button
                onClick={() => setDiagnosticResult(null)}
                className="text-neutral-400 hover:text-neutral-600 p-1"
                title="Dismiss diagnostic report"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 6 Diagnostic Steps List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {diagnosticResult.steps.map((st) => (
                <div
                  key={st.step}
                  className={`p-3 rounded-lg border bg-white ${
                    st.status === 'success'
                      ? 'border-emerald-200 text-emerald-950'
                      : st.status === 'failed'
                      ? 'border-red-200 text-red-950'
                      : 'border-neutral-200 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-neutral-100 flex items-center justify-center text-[10px]">
                        {st.step}
                      </span>
                      <span>{st.name}</span>
                    </span>
                    {st.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {st.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-600" />}
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-snug">{st.details || st.description}</p>
                </div>
              ))}
            </div>

            {diagnosticResult.details && (
              <p className="text-[11px] text-neutral-500 pt-1 font-mono">{diagnosticResult.details}</p>
            )}
          </div>
        )}

        {/* Installation Instructions & Architecture Notice */}
        <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-neutral-500 gap-2">
          <p>
            <strong className="text-neutral-700">Safe Client Guarantee:</strong> The script operates invisibly in the background. It will never render the LeadLens dashboard, never create iframes, and never alter your storefront layout.
          </p>

          <button
            onClick={() => setShowSqlModal(true)}
            className="text-xs text-orange-600 hover:text-orange-700 font-bold underline inline-flex items-center gap-1 shrink-0"
          >
            <Database className="w-3.5 h-3.5" />
            <span>View PostgreSQL RLS Schema</span>
          </button>
        </div>

      </div>

      {/* 2. REAL SUPABASE ANALYTICS METRICS (Section 10) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Visitors</span>
            <Users className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="text-xl font-extrabold text-neutral-900 tabular-nums">{metrics.uniqueVisitors}</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Unique Sessions</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Events</span>
            <Eye className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="text-xl font-extrabold text-neutral-900 tabular-nums">{metrics.totalEvents}</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Total Captured</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Clicks</span>
            <MousePointerClick className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="text-xl font-extrabold text-neutral-900 tabular-nums">{metrics.productClicks}</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Product Views</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cart Adds</span>
            <ShoppingCart className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="text-xl font-extrabold text-orange-600 tabular-nums">{metrics.cartAdds}</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Added to Bag</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Checkout</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-neutral-900 tabular-nums">{metrics.checkouts}</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Checkout Starts</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Purchased</span>
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-extrabold text-emerald-600 tabular-nums">{metrics.purchases}</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Orders Confirmed</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Abandoned</span>
            <Radio className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="text-xl font-extrabold text-red-600 tabular-nums">{metrics.abandonedCarts}</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Pending Recovery</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Identified</span>
            <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-xl font-extrabold text-sky-600 tabular-nums">{metrics.identifiedLeads}</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Phone or Email</div>
        </div>
      </div>

      {/* 3. CART ABANDONMENT & VISITOR TRACKER TABLE */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Table Filter & Search Controls */}
        <div className="p-5 border-b border-neutral-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${connectionState === 'CONNECTED' ? 'bg-emerald-500' : 'bg-orange-500'} animate-pulse`} />
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Cart Abandonment Tracker
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Exclusively displaying visitors who viewed products and left without purchasing.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-700 font-medium focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Drop-offs</option>
              <option value="abandoned">Cart Abandoned</option>
              <option value="checkout">Checkout Started</option>
              <option value="inquiries">WhatsApp / Contact Enquiries</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-700 font-medium focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visitor, phone, email..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>
        </div>

        {/* Content Area: Clean Empty State OR Strict Real-Time Table */}
        {filteredLeads.length === 0 ? (
          /* EXACT REQUIRED EMPTY STATE DESIGN */
          <div className="py-24 px-6 text-center max-w-xl mx-auto flex flex-col items-center justify-center">
            
            {/* Minimalist Live Beacon Icon */}
            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 mb-5 relative">
              <Radio className="w-7 h-7" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
              </span>
            </div>

            {/* Exact Required Message */}
            <h3 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
              Your tracker is ready. Add your unique API Key to start seeing real-time visitor activity.
            </h3>

            <p className="text-xs sm:text-sm text-neutral-500 mt-2 leading-relaxed">
              Once the snippet is placed on your external storefront, visitor drop-offs (phone, email, and viewed products) will automatically stream directly into this dashboard via Supabase.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleCopyScript}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedScript ? 'Snippet Copied!' : 'Copy Integration Snippet'}</span>
              </button>

              <button
                onClick={handleDownloadTrackerScript}
                className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-neutral-600" />
                <span>Download tracker.js</span>
              </button>

              <button
                onClick={handleTriggerTestConnection}
                disabled={isPinging}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-orange-400" />
                <span>Test Connection Handshake</span>
              </button>
            </div>
          </div>
        ) : (
          /* STRICT FILTERED DATA TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-[11px] uppercase font-bold tracking-wider">
                <tr>
                  <th scope="col" className="py-3 px-5">Visitor Name / ID</th>
                  <th scope="col" className="py-3 px-5">Phone Number</th>
                  <th scope="col" className="py-3 px-5">Email ID</th>
                  <th scope="col" className="py-3 px-5">Clicked Item Name</th>
                  <th scope="col" className="py-3 px-5">Status</th>
                  <th scope="col" className="py-3 px-5 text-right">Outreach</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredLeads.map((lead) => {
                  const isCartAbandoned = lead.status === 'Cart Abandoned';
                  const isCheckout = lead.status === 'Checkout Started';
                  const isEnquiry = lead.status === 'WhatsApp Enquiry' || lead.status === 'Contact Enquiry';

                  return (
                    <tr key={lead.id} className="hover:bg-neutral-50/70 transition-colors group">
                      
                      {/* 1. Visitor Name / ID */}
                      <td className="py-3.5 px-5 font-bold text-neutral-900">
                        <span className="truncate max-w-[220px] block font-mono text-xs" title={lead.visitor_identifier}>
                          {lead.visitor_identifier || 'Anonymous Visitor'}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-normal">
                          {new Date(lead.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(lead.timestamp).toLocaleDateString()}
                        </span>
                      </td>

                      {/* 2. Phone Number (Only if legitimately provided) */}
                      <td className="py-3.5 px-5 font-mono text-xs tabular-nums text-neutral-800">
                        {lead.visitor_phone ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-neutral-900">{lead.visitor_phone}</span>
                            <button
                              onClick={() => handleCopyPhone(lead.id, lead.visitor_phone!)}
                              className="text-neutral-400 hover:text-neutral-700 p-0.5 transition-colors"
                              title="Copy Phone Number"
                            >
                              {copiedPhoneId === lead.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-neutral-400 font-sans italic text-xs">Not Provided</span>
                        )}
                      </td>

                      {/* 3. Email ID (Only if legitimately provided) */}
                      <td className="py-3.5 px-5 text-neutral-700">
                        {lead.visitor_email ? (
                          <span className="font-mono text-xs text-neutral-800">{lead.visitor_email}</span>
                        ) : (
                          <span className="text-neutral-400 font-sans italic text-xs">Not Provided</span>
                        )}
                      </td>

                      {/* 4. Clicked Item Name */}
                      <td className="py-3.5 px-5 font-semibold text-neutral-900">
                        <span className="truncate max-w-[240px] block" title={lead.clicked_item_name}>
                          {lead.clicked_item_name}
                        </span>
                      </td>

                      {/* 5. Status */}
                      <td className="py-3.5 px-5">
                        {isCartAbandoned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                            <span>Cart Abandoned</span>
                          </span>
                        ) : isCheckout ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            <span>Checkout Started</span>
                          </span>
                        ) : isEnquiry ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>{lead.status}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                            <span>{lead.status}</span>
                          </span>
                        )}
                      </td>

                      {/* 6. Outreach Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.visitor_phone ? (
                            <a
                              href={generateWhatsAppLink(lead)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs"
                              title="Send WhatsApp recovery message"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                          ) : null}

                          {lead.visitor_email ? (
                            <a
                              href={generateEmailLink(lead)}
                              className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1"
                              title="Send recovery email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Email</span>
                            </a>
                          ) : null}

                          {!lead.visitor_phone && !lead.visitor_email && (
                            <span className="text-[11px] text-neutral-400 italic">No contact yet</span>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* SQL Migration Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-orange-600" />
                <h3 className="font-extrabold text-neutral-900 text-base">
                  Supabase PostgreSQL RLS Schema
                </h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Run this in your Supabase SQL Editor if you need to manually inspect the Row Level Security (RLS) policies for multi-tenant isolation.
            </p>

            <pre className="p-3 bg-neutral-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto flex-1">
              <code>{SUPABASE_MIGRATION_SQL}</code>
            </pre>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleCopySql}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {copiedSql ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
              </button>

              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
