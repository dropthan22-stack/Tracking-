import React, { useState } from 'react';
import { BrandProfile, ClothingProduct, AbandonmentStatus } from '../types';
import { CLOTHING_PRODUCTS } from '../lib/products';
import { insertSupabaseLead } from '../lib/supabase';
import {
  ShoppingBag,
  Eye,
  Check,
  User,
  Phone,
  Mail,
  ArrowRight,
  Store
} from 'lucide-react';

interface StorefrontSimulatorProps {
  currentProfile: BrandProfile;
  onLeadCaptured: (detail: any) => void;
  onGoToDashboard: () => void;
}

export const StorefrontSimulator: React.FC<StorefrontSimulatorProps> = ({
  currentProfile,
  onLeadCaptured,
  onGoToDashboard
}) => {
  const [visitorName, setVisitorName] = useState('Riya S');
  const [visitorPhone, setVisitorPhone] = useState('+91 98765 43210');
  const [visitorEmail, setVisitorEmail] = useState('riya.sharma@gmail.com');
  const [recentCapture, setRecentCapture] = useState<any | null>(null);

  const triggerTrack = async (product: ClothingProduct, status: AbandonmentStatus) => {
    const sessionId = 'sess_' + Math.random().toString(36).substring(2, 7);
    const visitorIdentifier = visitorName.trim()
      ? `${visitorName.trim()} (${sessionId})`
      : `Anonymous Visitor (${sessionId})`;

    const labeledItem = `[Sandbox] ${product.name}`;

    const payload = {
      brand_id: currentProfile.id,
      brand_api_key: currentProfile.api_key,
      visitor_name: visitorIdentifier,
      visitor_identifier: visitorIdentifier,
      phone_number: visitorPhone.trim() || null,
      visitor_phone: visitorPhone.trim() || null,
      email: visitorEmail.trim() || null,
      visitor_email: visitorEmail.trim() || null,
      clicked_item: labeledItem,
      clicked_item_name: labeledItem,
      status: status,
      price: product.price,
      timestamp: new Date().toISOString()
    };

    // 1. Direct Supabase insertion for end-to-end cloud pipeline
    try {
      await insertSupabaseLead({
        brand_id: currentProfile.id,
        visitor_name: visitorIdentifier,
        phone_number: visitorPhone.trim() || null,
        email: visitorEmail.trim() || null,
        clicked_item: labeledItem,
        status: status
      });
    } catch (e) {
      console.warn('Sandbox direct Supabase error:', e);
    }

    // 2. Dispatch DOM event for instant reactivity
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('leadlens:track', { detail: payload });
      window.dispatchEvent(event);
    }

    onLeadCaptured(payload);
    setRecentCapture(payload);
  };

  const quickPresets = [
    { name: 'Rahul S', phone: '+91 98765 43210', email: 'rahul.s@gmail.com' },
    { name: 'Priya M', phone: '+91 91234 56789', email: 'priya.m@outlook.com' },
    { name: 'Vikram K', phone: '+91 99887 76655', email: 'vikram.k@gmail.com' },
    { name: 'Anonymous Visitor', phone: '', email: '' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Sandbox Control Header */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Universal Sandbox Simulator
              </span>
              <span className="text-neutral-300">·</span>
              <span className="text-xs text-neutral-500 font-mono">Brand: {currentProfile.id}</span>
              <span className="text-neutral-300">·</span>
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Live Supabase Pipeline Active
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900">
              Universal Storefront Simulation Sandbox
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Simulate visitor journeys across Electronics, Apparel, Cosmetics, Home Goods, and B2B WhatsApp Enquiries. Synchronized directly into Supabase.
            </p>
          </div>

          <button
            onClick={onGoToDashboard}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 self-start lg:self-auto shadow-xs"
          >
            <span>View In Tracker Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Shopper identity inputs */}
        <div className="pt-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-neutral-700 mb-1">
              Visitor Name / ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="e.g. Rahul S"
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-neutral-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="tel"
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-mono placeholder-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-neutral-700 mb-1">
              Email ID (If captured)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="email"
                value={visitorEmail}
                onChange={(e) => setVisitorEmail(e.target.value)}
                placeholder="e.g. rahul@example.com"
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-neutral-700 mb-1">
              Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setVisitorName(p.name === 'Anonymous Visitor' ? '' : p.name);
                    setVisitorPhone(p.phone);
                    setVisitorEmail(p.email);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                    visitorName === p.name || (p.name === 'Anonymous Visitor' && !visitorName)
                      ? 'bg-orange-50 border-orange-300 text-orange-800'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time capture toast */}
      {recentCapture && (
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-orange-950">
                Visitor Event Logged to Supabase public.leads!
              </p>
              <p className="text-orange-900/80 text-[11px]">
                {recentCapture.visitor_identifier} · Item: <strong className="text-neutral-900">{recentCapture.clicked_item_name}</strong> · Status: <span className="font-bold text-orange-700">{recentCapture.status}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onGoToDashboard}
            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold self-start sm:self-auto transition-colors"
          >
            Check In Dashboard
          </button>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CLOTHING_PRODUCTS.map((product) => (
          <div
            key={product.id}
            className="bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:border-orange-300 transition-all flex flex-col group shadow-xs hover:shadow-md"
          >
            <div className="relative aspect-[16/10] bg-neutral-100 overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
              />
              <div className="absolute top-2.5 left-2.5">
                <span className="px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-md text-[10px] font-bold text-neutral-800 shadow-xs">
                  {product.category}
                </span>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 mt-0.5 group-hover:text-orange-600 transition-colors">
                  {product.name}
                </h3>
                {product.price > 0 ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-mono font-bold text-neutral-900">
                      ₹{product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs font-mono text-neutral-400 line-through">
                        ₹{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs font-bold text-emerald-700 mt-1">
                    Enquiry Only (No Buy Button)
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 space-y-2">
                {product.hasBuyButton !== false ? (
                  <>
                    <button
                      onClick={() => triggerTrack(product, 'Cart Abandoned')}
                      className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Simulate Add-to-Cart Abandonment</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => triggerTrack(product, 'Checkout Started')}
                        className="py-1.5 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold transition-colors text-center"
                      >
                        Checkout Started
                      </button>

                      <button
                        onClick={() => triggerTrack(product, 'Purchased')}
                        className="py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors text-center"
                        title="Simulates completed checkout order (clears from abandoned list)"
                      >
                        Order Completed
                      </button>
                    </div>

                    <button
                      onClick={() => triggerTrack(product, 'Viewed but Not Bought')}
                      className="w-full py-1.5 px-3 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-neutral-400" />
                      <span>View Details Only</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => triggerTrack(product, 'WhatsApp Enquiry')}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <span>Inquire on WhatsApp</span>
                    </button>

                    <button
                      onClick={() => triggerTrack(product, 'Contact Enquiry')}
                      className="w-full py-1.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Submit Quote Request</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
