/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SignInPanel } from './components/SignInPanel';
import { DashboardView } from './components/DashboardView';
import { StorefrontSimulator } from './components/StorefrontSimulator';
import { leadStore } from './lib/store';
import { BrandProfile, Lead } from './types';
import { Globe, Plus, X } from 'lucide-react';

export default function App() {
  const [currentProfile, setCurrentProfile] = useState<BrandProfile | null>(leadStore.getCurrentProfile());
  const [allProfiles, setAllProfiles] = useState<BrandProfile[]>(leadStore.getAllProfiles());
  const [leads, setLeads] = useState<Lead[]>(leadStore.getActiveBrandLeads());
  const [allEvents, setAllEvents] = useState<Lead[]>(leadStore.getAllEvents());
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'simulator'>('dashboard');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showAddWebsiteModal, setShowAddWebsiteModal] = useState(false);
  const [newWebsiteName, setNewWebsiteName] = useState('');
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(leadStore.isSupabaseConnected());
  const [supabaseError, setSupabaseError] = useState<string | null>(leadStore.getSupabaseError());

  useEffect(() => {
    const unsubscribe = leadStore.subscribe(() => {
      setCurrentProfile(leadStore.getCurrentProfile());
      setAllProfiles(leadStore.getAllProfiles());
      setLeads(leadStore.getActiveBrandLeads());
      setAllEvents(leadStore.getAllEvents());
      setSupabaseConnected(leadStore.isSupabaseConnected());
      setSupabaseError(leadStore.getSupabaseError());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectBrand = (apiKey: string) => {
    leadStore.selectBrandByKey(apiKey);
    const updated = leadStore.getCurrentProfile();
    setCurrentProfile(updated);
    setLeads(leadStore.getActiveBrandLeads());
    setAllEvents(leadStore.getAllEvents());
    if (updated) {
      triggerToast(`Switched to ${updated.brand_name} · Supabase Synced`);
    }
  };

  const handleLogout = () => {
    leadStore.logout();
    setCurrentProfile(null);
    setLeads([]);
    setAllEvents([]);
    setShowSignInModal(true);
    triggerToast('Logged out of LeadLens');
  };

  const handleLoginSuccess = (profile: BrandProfile, isNewRegistration = false) => {
    setCurrentProfile(profile);
    setLeads(leadStore.getActiveBrandLeads());
    setAllEvents(leadStore.getAllEvents());
    setShowSignInModal(false);
    if (isNewRegistration) {
      triggerToast(`Company "${profile.brand_name}" created! Unique Tracking Key generated.`);
    } else {
      triggerToast(`Welcome back to ${profile.brand_name}`);
    }
  };

  const handleRegenerateKey = () => {
    if (!currentProfile) return;
    const newKey = leadStore.regenerateApiKey(currentProfile.id);
    if (newKey) {
      triggerToast('Tracking Key rotated! Update your external storefront embed tag.');
    }
  };

  const handleCreateWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebsiteName.trim()) return;

    const res = leadStore.registerAdditionalWebsite(newWebsiteName.trim(), newWebsiteUrl.trim());
    if (res.success && res.profile) {
      setCurrentProfile(res.profile);
      setShowAddWebsiteModal(false);
      setNewWebsiteName('');
      setNewWebsiteUrl('');
      triggerToast(`Registered "${res.profile.brand_name}" with ID ${res.profile.id}`);
    } else {
      triggerToast(res.error || 'Failed to register website');
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans selection:bg-orange-500/20 selection:text-orange-950">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        currentProfile={currentProfile}
        allProfiles={allProfiles}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onSelectBrand={handleSelectBrand}
        onLogout={handleLogout}
        onOpenLogin={() => setShowSignInModal(true)}
        onAddWebsite={() => setShowAddWebsiteModal(true)}
      />

      {/* Main Responsive Canvas with Free Vertical Scrolling */}
      <main className="flex-1 pb-16">
        {!currentProfile || showSignInModal ? (
          <SignInPanel
            onSuccess={handleLoginSuccess}
            onLogin={(phone, pass) => leadStore.loginWithPhone(phone, pass)}
            onRegister={(name, phone) => leadStore.registerBrand(name, phone)}
          />
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                profile={currentProfile}
                leads={leads}
                allEvents={allEvents}
                onRegenerateKey={handleRegenerateKey}
                onTestConnection={() => leadStore.testConnectionHandshake(currentProfile.id)}
                supabaseConnected={supabaseConnected}
                supabaseError={supabaseError}
              />
            )}

            {currentTab === 'simulator' && (
              <StorefrontSimulator
                currentProfile={currentProfile}
                onLeadCaptured={(detail) => {
                  triggerToast(`Supabase Ingest: ${detail.visitor_identifier} (${detail.clicked_item_name})`);
                }}
                onGoToDashboard={() => setCurrentTab('dashboard')}
              />
            )}
          </>
        )}
      </main>

      {/* Register New Website Modal */}
      {showAddWebsiteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-600" />
                <h3 className="font-extrabold text-neutral-900 text-base">
                  Register New Website
                </h3>
              </div>
              <button
                onClick={() => setShowAddWebsiteModal(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWebsite} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Website / Store Name
                </label>
                <input
                  type="text"
                  required
                  value={newWebsiteName}
                  onChange={(e) => setNewWebsiteName(e.target.value)}
                  placeholder="e.g. Dropthan Electronics"
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={newWebsiteUrl}
                  onChange={(e) => setNewWebsiteUrl(e.target.value)}
                  placeholder="e.g. https://dropthan-electronics.store"
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <p className="text-[11px] text-neutral-500">
                A separate Website ID and secure tracking identifier will be generated specifically for this domain.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddWebsiteModal(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Website</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-neutral-200 bg-white py-6 px-4 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-neutral-900">LeadLens</span>
            <span>·</span>
            <span>Universal Website Tracking SaaS · Dropthan</span>
          </div>

          <div className="flex items-center gap-3 text-neutral-400 font-mono text-[11px]">
            <span>Project: jfsmjztrnicqrcvgyzgd</span>
            <span>·</span>
            <span>RLS Active</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
