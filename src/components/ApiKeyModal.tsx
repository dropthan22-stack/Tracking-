import React, { useState } from 'react';
import { BrandProfile } from '../types';
import { Key, Copy, Check, ShieldAlert, ShieldCheck, RefreshCw, X, Code2 } from 'lucide-react';

interface ApiKeyModalProps {
  profile: BrandProfile;
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: () => void;
  isFirstReveal?: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  profile,
  isOpen,
  onClose,
  onRegenerate,
  isFirstReveal = false
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [showKeyText, setShowKeyText] = useState(true);
  const [showConfirmRegen, setShowConfirmRegen] = useState(false);

  if (!isOpen) return null;

  const trackerOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://leadlens.io';
  const embedSnippet = `<script src="${trackerOrigin}/tracker.js" data-brand-key="${profile.api_key}" defer></script>`;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(profile.api_key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-neutral-200 rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                Multi-Tenant Security
              </span>
              <span className="text-neutral-300">·</span>
              <span className="text-xs text-neutral-500 font-mono">{profile.id}</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
              {profile.brand_name} Integration Key
            </h2>
          </div>
        </div>

        {/* Security Warning Callout */}
        <div className="mb-5 p-3.5 rounded-xl bg-orange-50/80 border border-orange-200/80 text-orange-950 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-900">
              {isFirstReveal ? 'Secure One-Time Key Display' : 'Confidential Store Secret'}
            </p>
            <p className="text-orange-800/90 mt-0.5 leading-relaxed">
              This API key authenticates your Shopify / Custom store against Supabase. All rows in <code className="font-mono text-orange-950 font-semibold">public.leads</code> are isolated to this key via Row Level Security (RLS). Store it safely.
            </p>
          </div>
        </div>

        {/* Brand Details */}
        <div className="space-y-4">
          
          {/* Brand ID Field */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Brand Identifier (<span className="font-mono">brand_id</span>)
            </label>
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-800">
              <span>{profile.id}</span>
              <span className="text-[11px] text-neutral-500 uppercase font-sans font-medium">Tenant ID</span>
            </div>
          </div>

          {/* Secret API Key Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-neutral-700">
                Secret Integration Key (<span className="font-mono">api_key</span>)
              </label>
              <button
                type="button"
                onClick={() => setShowKeyText(!showKeyText)}
                className="text-[11px] text-orange-600 hover:text-orange-700 font-medium underline"
              >
                {showKeyText ? 'Mask Key' : 'Reveal Key'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-mono truncate select-all">
                {showKeyText ? profile.api_key : '••••••••••••••••••••••••••••••••••••'}
              </div>
              <button
                type="button"
                onClick={handleCopyKey}
                className="px-3.5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
              >
                {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Embed Script Snippet */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5 text-neutral-500" />
                <span>Shopify / Custom HTML Tracker Tag</span>
              </label>
              <button
                type="button"
                onClick={handleCopySnippet}
                className="text-[11px] text-orange-600 hover:text-orange-700 font-medium"
              >
                {copiedSnippet ? 'Copied Tag!' : 'Copy Tag'}
              </button>
            </div>
            <pre className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-[11px] font-mono text-neutral-800 overflow-x-auto whitespace-pre">
              <code>{embedSnippet}</code>
            </pre>
          </div>

          {/* Supabase RLS Note */}
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 text-xs text-neutral-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>RLS Active:</strong> Supabase validates that incoming events match <code className="font-mono text-neutral-900 font-semibold">{profile.api_key.substring(0, 16)}...</code> preventing cross-tenant leaks.
            </span>
          </div>

          {/* Regenerate Key Action */}
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
            {!showConfirmRegen ? (
              <button
                type="button"
                onClick={() => setShowConfirmRegen(true)}
                className="text-xs text-neutral-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Rotate / Regenerate API Key</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-red-600 font-medium">Existing store connections will break. Proceed?</span>
                <button
                  type="button"
                  onClick={() => {
                    onRegenerate();
                    setShowConfirmRegen(false);
                  }}
                  className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-medium"
                >
                  Confirm Rotate
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmRegen(false)}
                  className="px-2 py-1 text-neutral-500 hover:text-neutral-800"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Modal Primary Action */}
        <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
          >
            I Have Saved My Key
          </button>
        </div>

      </div>
    </div>
  );
};
