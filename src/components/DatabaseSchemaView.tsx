import React, { useState } from 'react';
import { SUPABASE_SQL_SCHEMA, SUPABASE_JS_CLIENT_SNIPPET } from '../lib/supabase-schema';
import { ShieldCheck, Copy, Check, Download, Database, Key, Lock, Terminal, FileCode, CheckCircle2 } from 'lucide-react';

export const DatabaseSchemaView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sql' | 'client' | 'architecture'>('sql');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'leadlens_supabase_schema.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#111726] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Database Architecture &amp; RLS
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">PostgreSQL / Supabase Ready</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Multi-Tenant Schema &amp; Row Level Security
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Strict isolation enforced at the database kernel level. No brand can ever read, query, or leak another clothing store’s leads.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(activeTab === 'sql' ? SUPABASE_SQL_SCHEMA : SUPABASE_JS_CLIENT_SNIPPET)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-950/40"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Script!' : 'Copy SQL Script'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .sql</span>
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex gap-2 pt-4 border-slate-800">
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'sql'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Complete PostgreSQL Schema &amp; RLS</span>
          </button>

          <button
            onClick={() => setActiveTab('client')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'client'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Supabase JS Client SDK Code</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'architecture'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>RLS Security Breakdown</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'sql' && (
        <div className="bg-[#0a0d14] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-5 py-3 bg-[#0d121f] border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-mono">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>leadlens_supabase_schema.sql (PostgreSQL 14+)</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Includes Profiles, Leads, FKs, Indexes &amp; RLS
            </span>
          </div>

          <div className="p-5 overflow-x-auto max-h-[550px] overflow-y-auto">
            <pre className="font-mono text-xs text-slate-300 whitespace-pre leading-relaxed">
              <code>{SUPABASE_SQL_SCHEMA}</code>
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'client' && (
        <div className="bg-[#0a0d14] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-5 py-3 bg-[#0d121f] border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-mono">
              <FileCode className="w-3.5 h-3.5 text-sky-400" />
              <span>supabaseClient.ts (TypeScript)</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              @supabase/supabase-js
            </span>
          </div>

          <div className="p-5 overflow-x-auto max-h-[550px] overflow-y-auto">
            <pre className="font-mono text-xs text-slate-300 whitespace-pre leading-relaxed">
              <code>{SUPABASE_JS_CLIENT_SNIPPET}</code>
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'architecture' && (
        <div className="space-y-4">
          <div className="bg-[#111726] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>How Row Level Security (RLS) Isolates Brand Data</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-emerald-400 font-semibold text-sm">
                  1. Profile Ownership Policy
                </div>
                <p className="text-slate-400 leading-relaxed">
                  When a clothing brand owner authenticates via Supabase Auth (<code className="text-slate-200">auth.uid()</code>), their user ID is matched against <code className="text-slate-200">profiles.user_id</code>. They cannot inspect other brand records.
                </p>
                <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-slate-300">
                  USING (auth.uid() = user_id)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-sky-400 font-semibold text-sm">
                  2. Strict Leads Isolation (Tenant Sandbox)
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Even if a malicious user inspects network requests or queries the <code className="text-slate-200">leads</code> table directly, PostgreSQL executes the subquery to ensure they only receive rows matching their registered <code className="text-slate-200">brand_api_key</code>.
                </p>
                <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-slate-300">
                  USING (brand_api_key = (SELECT api_key FROM profiles WHERE user_id = auth.uid()))
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="text-amber-400 font-semibold text-sm">
                3. Secure Tracker Anonymous Ingestion
              </div>
              <p className="text-slate-400 leading-relaxed">
                The universal JavaScript tracker embedded on customer clothing websites needs to insert leads without requiring visitor authentication. The insertion policy permits <code className="text-slate-200">INSERT</code> operations only if the incoming <code className="text-slate-200">brand_api_key</code> exists in registered profiles:
              </p>
              <div className="p-2 rounded bg-slate-950 font-mono text-[11px] text-slate-300">
                WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.api_key = leads.brand_api_key))
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
