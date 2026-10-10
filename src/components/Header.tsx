import React, { useState } from 'react';
import { BrandProfile } from '../types';
import { LogOut, LogIn, ChevronDown, ShieldCheck, ShoppingBag, Layers, Plus, Globe } from 'lucide-react';

interface HeaderProps {
  currentProfile: BrandProfile | null;
  allProfiles: BrandProfile[];
  currentTab: 'dashboard' | 'simulator';
  onSelectTab: (tab: 'dashboard' | 'simulator') => void;
  onSelectBrand: (apiKey: string) => void;
  onLogout: () => void;
  onOpenLogin: () => void;
  onAddWebsite?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProfile,
  allProfiles,
  currentTab,
  onSelectTab,
  onSelectBrand,
  onLogout,
  onOpenLogin,
  onAddWebsite
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand Wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-xs group-hover:bg-orange-500 transition-colors">
                <span className="font-mono font-bold text-sm tracking-tight">LL</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-tight text-neutral-900 group-hover:text-orange-600 transition-colors">
                  LeadLens
                </span>
              </div>
            </button>
            <span className="hidden sm:inline-block text-neutral-300">/</span>
            <span className="hidden sm:inline-block text-xs font-semibold text-neutral-500">
              Universal Website Tracking SaaS
            </span>
          </div>

          {/* Simple Navigation Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 ${
                currentTab === 'dashboard'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Layers className="w-4 h-4 text-orange-600" />
              <span>Abandoned Leads</span>
            </button>

            <button
              onClick={() => onSelectTab('simulator')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 ${
                currentTab === 'simulator'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-orange-600" />
              <span>Test Store Sandbox</span>
            </button>
          </div>

          {/* Tenant Switcher & Account */}
          <div className="flex items-center gap-2.5">
            {currentProfile ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs sm:text-sm text-neutral-800 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="font-bold max-w-[130px] sm:max-w-[160px] truncate text-neutral-900">
                    {currentProfile.brand_name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-72 bg-white border border-neutral-200 rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <div className="px-3.5 py-2 border-b border-neutral-100">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Supabase Workspace Tenant</span>
                      </div>
                      <p className="text-neutral-900 font-bold truncate mt-0.5">
                        {currentProfile.brand_name}
                      </p>
                      <p className="text-neutral-500 font-mono text-[11px] truncate">
                        ID: {currentProfile.id}
                      </p>
                      {currentProfile.store_url && (
                        <p className="text-neutral-400 font-mono text-[10px] truncate">
                          {currentProfile.store_url}
                        </p>
                      )}
                    </div>

                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                          Registered Websites
                        </p>
                        {onAddWebsite && (
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              onAddWebsite();
                            }}
                            className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Website</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {allProfiles.map((p) => (
                          <button
                            key={p.api_key}
                            onClick={() => {
                              onSelectBrand(p.api_key);
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                              p.api_key === currentProfile.api_key
                                ? 'bg-orange-50 text-orange-950 font-bold border border-orange-200'
                                : 'text-neutral-700 hover:bg-neutral-50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span className="truncate">{p.brand_name}</span>
                            </div>
                            {p.api_key === currentProfile.api_key && (
                              <span className="text-[10px] font-mono text-orange-600 font-bold shrink-0">Active</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 px-2 space-y-1">
                      {onAddWebsite && (
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onAddWebsite();
                          }}
                          className="w-full px-2.5 py-1.5 text-left text-neutral-700 hover:bg-neutral-50 rounded-lg flex items-center gap-2 transition-colors font-medium"
                        >
                          <Plus className="w-3.5 h-3.5 text-orange-600" />
                          <span>Register New Website</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full px-2.5 py-1.5 text-left text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {currentProfile ? (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 text-xs sm:text-sm font-bold text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
