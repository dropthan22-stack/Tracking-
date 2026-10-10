import { BrandProfile, Lead, ConnectionTestResult, ConnectionStatusState } from '../types';
import {
  fetchSupabaseLeads,
  insertSupabaseLead,
  subscribeToSupabaseLeads,
  executeSixStepConnectionTest,
  supabase
} from './supabase';

const STORAGE_PROFILES_KEY = 'leadlens_v7_brand_profiles';
const STORAGE_CURRENT_BRAND_KEY = 'leadlens_v7_active_brand_key';
const STORAGE_CURRENT_USER_KEY = 'leadlens_v7_active_user_id';

function generateSecureApiKey(brandId: string): string {
  const chars = 'abcdef0123456789';
  let rand = '';
  for (let i = 0; i < 18; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const cleanId = brandId.replace(/[^a-z0-9]/g, '').slice(0, 8);
  return `ll_live_${cleanId}_${rand}`;
}

// Default brand profile matching the authentic Supabase record for Dropthan
const INITIAL_PROFILES: (BrandProfile & { demoPassword?: string })[] = [
  {
    id: 'bnd_dropthan_521',
    user_id: 'usr_dropthan_admin',
    brand_name: 'Dropthan Apparel',
    api_key: 'll_live_dropthan_521_49a8c17b',
    phone_number: '+91 98000 11223',
    store_url: 'https://dropthan.store',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    demoPassword: 'password123',
    is_connected: true,
    connection_status: 'CONNECTED',
    installation_status: 'Installed'
  }
];

class LeadLensStore {
  private profiles: (BrandProfile & { demoPassword?: string })[] = [];
  private leads: Lead[] = []; // Abandoned leads
  private allEvents: Lead[] = []; // All tracking events
  private activeApiKey: string | null = null;
  private currentUserId: string = 'usr_dropthan_admin';
  private listeners: Set<() => void> = new Set();
  private realtimeUnsub: (() => void) | null = null;
  private supabaseConnected: boolean = false;
  private supabaseError: string | null = null;

  private pollTimer: any = null;

  constructor() {
    this.init();
    if (typeof window !== 'undefined') {
      window.addEventListener('leadlens:track', (e: any) => {
        if (e.detail) {
          this.handleIncomingTrackingEvent(e.detail);
        }
      });

      // Poll connection status and Supabase leads every 3.5 seconds for real-time external store updates
      this.pollTimer = setInterval(() => {
        this.pollConnectionStatus();
      }, 3500);
    }
  }

  private async init() {
    try {
      const storedProfiles = localStorage.getItem(STORAGE_PROFILES_KEY);
      this.profiles = storedProfiles ? JSON.parse(storedProfiles) : INITIAL_PROFILES;

      const storedUser = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      if (storedUser) {
        this.currentUserId = storedUser;
      }

      const storedBrand = localStorage.getItem(STORAGE_CURRENT_BRAND_KEY);
      this.activeApiKey = storedBrand || this.profiles[0]?.api_key || 'll_live_dropthan_521_49a8c17b';
    } catch {
      this.profiles = INITIAL_PROFILES;
      this.activeApiKey = 'll_live_dropthan_521_49a8c17b';
    }

    // Load any remote brand profiles from Supabase
    await this.fetchRemoteBrandProfiles();

    await this.syncWithSupabase();
  }

  /**
   * Fetch Brand Profiles stored in Supabase
   */
  private async fetchRemoteBrandProfiles() {
    try {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'Brand Profile');

      if (data && data.length > 0) {
        let changed = false;
        for (const row of data) {
          const exists = this.profiles.some((p) => p.id === row.brand_id);
          if (!exists) {
            let meta: any = {};
            try {
              meta = JSON.parse(row.clicked_item || '{}');
            } catch {}
            this.profiles.push({
              id: row.brand_id,
              user_id: meta.user_id || `usr_${row.id}`,
              brand_name: row.visitor_name || meta.brand_name || 'Website Store',
              api_key: row.email || meta.api_key || generateSecureApiKey(row.brand_id),
              phone_number: row.phone_number || '',
              store_url: meta.store_url || `https://${row.brand_id}.store`,
              created_at: row.created_at,
              is_connected: true,
              connection_status: 'CONNECTED',
              installation_status: 'Installed'
            });
            changed = true;
          }
        }
        if (changed) {
          this.saveProfiles();
        }
      }
    } catch (err) {
      console.warn('Could not load remote brand profiles:', err);
    }
  }

  private async pollConnectionStatus() {
    const currentProfile = this.getCurrentProfile();
    if (!currentProfile) return;

    // 1. Check server-side active connections registry (for external Shopify, WooCommerce, custom HTML)
    try {
      const res = await fetch(
        `/api/connection-status?brand_key=${encodeURIComponent(currentProfile.api_key)}&brand_id=${encodeURIComponent(currentProfile.id)}`
      );
      if (res.ok) {
        const status = await res.json();
        if (status.connected && currentProfile.connection_status !== 'CONNECTED') {
          this.markStoreConnected(currentProfile.id);
        }
      }
    } catch {}

    // 2. Refresh Supabase leads
    const { allLeads, abandonedLeads, hasPing, error } = await fetchSupabaseLeads({
      id: currentProfile.id,
      api_key: currentProfile.api_key
    });

    if (!error) {
      this.supabaseConnected = true;
      this.supabaseError = null;
      this.allEvents = allLeads;
      this.leads = abandonedLeads;

      if (hasPing || allLeads.length > 0) {
        if (currentProfile.connection_status !== 'CONNECTED') {
          this.markStoreConnected(currentProfile.id);
        }
      }
      this.notify();
    }
  }

  private handleIncomingTrackingEvent(detail: any) {
    const current = this.getCurrentProfile();
    const eventBrandId = detail.brand_id || detail.brand_api_key;
    const isCurrent = current && (current.id === eventBrandId || current.api_key === eventBrandId);

    if (isCurrent) {
      this.markStoreConnected(current.id);

      if (detail.status !== 'Handshake Ping' && detail.status !== 'Purchased') {
        const newLead: Lead = {
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          brand_id: current.id,
          brand_api_key: current.api_key,
          visitor_identifier: detail.visitor_identifier || 'Anonymous Visitor',
          visitor_phone: detail.visitor_phone || null,
          visitor_email: detail.visitor_email || null,
          clicked_item_name: detail.clicked_item_name || 'Storefront Item',
          status: detail.status || 'Cart Abandoned',
          timestamp: detail.timestamp || new Date().toISOString()
        };

        if (!this.leads.some((l) => l.visitor_identifier === newLead.visitor_identifier && l.clicked_item_name === newLead.clicked_item_name)) {
          this.leads.unshift(newLead);
          this.allEvents.unshift(newLead);
          this.notify();
        }
      }
    }
  }

  private saveProfiles() {
    try {
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(this.profiles));
      if (this.activeApiKey) {
        localStorage.setItem(STORAGE_CURRENT_BRAND_KEY, this.activeApiKey);
      }
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, this.currentUserId);
    } catch {}
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getAllProfiles(): BrandProfile[] {
    return this.profiles;
  }

  /**
   * Return profiles/websites belonging to the current user's workspace
   */
  public getUserWebsites(): BrandProfile[] {
    return this.profiles.filter(
      (p) => !p.user_id || p.user_id === this.currentUserId || this.currentUserId === 'usr_dropthan_admin'
    );
  }

  public getCurrentProfile(): BrandProfile | null {
    if (!this.activeApiKey) return this.profiles[0] || null;
    return this.profiles.find((p) => p.api_key === this.activeApiKey || p.id === this.activeApiKey) || this.profiles[0] || null;
  }

  public getActiveBrandLeads(): Lead[] {
    const current = this.getCurrentProfile();
    if (!current) return [];
    return this.leads.filter(
      (l) => l.brand_id === current.id || l.brand_id === current.api_key || l.brand_api_key === current.api_key
    );
  }

  public getAllEvents(): Lead[] {
    const current = this.getCurrentProfile();
    if (!current) return [];
    return this.allEvents.filter(
      (l) => l.brand_id === current.id || l.brand_id === current.api_key || l.brand_api_key === current.api_key
    );
  }

  public isSupabaseConnected(): boolean {
    return this.supabaseConnected;
  }

  public getSupabaseError(): string | null {
    return this.supabaseError;
  }

  public selectBrandByKey(keyOrId: string) {
    const found = this.profiles.find((p) => p.api_key === keyOrId || p.id === keyOrId);
    if (found) {
      this.activeApiKey = found.api_key;
      this.saveProfiles();
      this.syncWithSupabase();
    }
  }

  public async syncWithSupabase() {
    const currentProfile = this.getCurrentProfile();
    if (!currentProfile) {
      this.leads = [];
      this.allEvents = [];
      this.notify();
      return;
    }

    if (this.realtimeUnsub) {
      this.realtimeUnsub();
      this.realtimeUnsub = null;
    }

    const { allLeads, abandonedLeads, error, hasPing } = await fetchSupabaseLeads({
      id: currentProfile.id,
      api_key: currentProfile.api_key
    });

    if (error) {
      this.supabaseConnected = false;
      this.supabaseError = error.message || 'Supabase query error';
    } else {
      this.supabaseConnected = true;
      this.supabaseError = null;
      this.allEvents = allLeads || [];
      this.leads = abandonedLeads || [];

      // If leads exist or handshake ping arrived, mark store as successfully connected
      if (hasPing || (allLeads && allLeads.length > 0) || currentProfile.is_connected) {
        currentProfile.is_connected = true;
        currentProfile.connection_status = 'CONNECTED';
        currentProfile.installation_status = 'Installed';
        this.saveProfiles();
      }
    }

    try {
      this.realtimeUnsub = subscribeToSupabaseLeads(
        { id: currentProfile.id, api_key: currentProfile.api_key },
        (newLead) => {
          this.markStoreConnected(currentProfile.id);

          if ((newLead.status as any) !== 'Handshake Ping' && (newLead.status as any) !== 'Purchased') {
            if (!this.leads.some((l) => l.id === newLead.id)) {
              this.leads.unshift(newLead);
              this.allEvents.unshift(newLead);
              this.notify();
            }
          }
        },
        () => {
          this.markStoreConnected(currentProfile.id);
        }
      );
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }

    this.notify();
  }

  public markStoreConnected(brandId: string) {
    const profile = this.profiles.find((p) => p.id === brandId || p.api_key === brandId);
    if (profile) {
      profile.is_connected = true;
      profile.connection_status = 'CONNECTED';
      profile.installation_status = 'Installed';
      profile.last_ping_at = new Date().toISOString();
      this.saveProfiles();
      this.notify();
    }
  }

  /**
   * Real-Time Handshake Ping & Diagnostic Test (Section 9 - 6-Step Verification)
   */
  public async testConnectionHandshake(brandId: string): Promise<ConnectionTestResult> {
    const profile = this.profiles.find((p) => p.id === brandId || p.api_key === brandId);
    if (!profile) {
      const now = new Date().toISOString();
      return {
        success: false,
        supabaseConnected: false,
        endpointReachable: false,
        brandValid: false,
        eventStored: false,
        eventRetrieved: false,
        storefrontPingDetected: false,
        connectionState: 'CONNECTION ERROR',
        steps: [],
        message: 'Invalid Website Profile',
        timestamp: now,
        details: 'Website profile not found in active workspace.'
      };
    }

    const result = await executeSixStepConnectionTest(profile.id, profile.api_key);

    if (result.success) {
      profile.is_connected = true;
      profile.connection_status = 'CONNECTED';
      profile.installation_status = 'Installed';
      profile.last_ping_at = result.timestamp;
      this.saveProfiles();
      this.notify();
    } else {
      profile.connection_status = result.connectionState;
      this.saveProfiles();
      this.notify();
    }

    return result;
  }

  public loginWithPhone(phoneNumber: string, _pass?: string): { success: boolean; profile?: BrandProfile; error?: string } {
    const cleanPhone = phoneNumber.replace(/[\s-]/g, '').trim();
    const profile = this.profiles.find((p) => {
      const pClean = p.phone_number.replace(/[\s-]/g, '').trim();
      return pClean === cleanPhone || p.phone_number === phoneNumber;
    });

    if (!profile) {
      return { success: false, error: 'No account found with this phone number. Register below to generate an API key.' };
    }

    this.currentUserId = profile.user_id || `usr_${profile.id}`;
    this.activeApiKey = profile.api_key;
    this.saveProfiles();
    this.syncWithSupabase();
    return { success: true, profile };
  }

  /**
   * Register a new Company / User Account with primary website
   */
  public registerBrand(companyName: string, phoneNumber: string, websiteUrl?: string): { success: boolean; profile?: BrandProfile; error?: string } {
    if (!companyName.trim() || !phoneNumber.trim()) {
      return { success: false, error: 'Company name and phone number are required.' };
    }

    const cleanSlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const brandId = `web_${cleanSlug}_${Math.floor(100 + Math.random() * 900)}`;
    const uniqueApiKey = generateSecureApiKey(brandId);
    const userId = `usr_${Date.now()}`;

    const newProfile: BrandProfile = {
      id: brandId,
      user_id: userId,
      brand_name: companyName.trim(),
      api_key: uniqueApiKey,
      phone_number: phoneNumber.trim(),
      store_url: websiteUrl || `https://${cleanSlug}.store`,
      created_at: new Date().toISOString(),
      is_connected: false,
      connection_status: 'AWAITING INSTALLATION',
      installation_status: 'Not Installed'
    };

    this.profiles.unshift(newProfile);
    this.currentUserId = userId;
    this.activeApiKey = newProfile.api_key;
    this.leads = [];
    this.allEvents = [];
    this.saveProfiles();

    // Persist brand profile into Supabase
    insertSupabaseLead({
      brand_id: brandId,
      visitor_name: companyName.trim(),
      phone_number: phoneNumber.trim(),
      email: uniqueApiKey,
      clicked_item: JSON.stringify({
        brand_name: companyName.trim(),
        api_key: uniqueApiKey,
        user_id: userId,
        store_url: newProfile.store_url
      }),
      status: 'Brand Profile'
    }).catch((err) => console.warn('Could not persist brand to Supabase:', err));

    this.syncWithSupabase();
    return { success: true, profile: newProfile };
  }

  /**
   * Register an additional Website under the current authenticated workspace
   */
  public registerAdditionalWebsite(websiteName: string, websiteUrl: string): { success: boolean; profile?: BrandProfile; error?: string } {
    if (!websiteName.trim()) {
      return { success: false, error: 'Website name is required.' };
    }

    const cleanSlug = websiteName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const websiteId = `web_${cleanSlug}_${Math.floor(100 + Math.random() * 900)}`;
    const uniqueApiKey = generateSecureApiKey(websiteId);

    const current = this.getCurrentProfile();
    const phone = current?.phone_number || '';

    const newWebsite: BrandProfile = {
      id: websiteId,
      user_id: this.currentUserId,
      brand_name: websiteName.trim(),
      api_key: uniqueApiKey,
      phone_number: phone,
      store_url: websiteUrl.trim() || `https://${cleanSlug}.com`,
      created_at: new Date().toISOString(),
      is_connected: false,
      connection_status: 'AWAITING INSTALLATION',
      installation_status: 'Not Installed'
    };

    this.profiles.push(newWebsite);
    this.activeApiKey = uniqueApiKey;
    this.leads = [];
    this.allEvents = [];
    this.saveProfiles();

    insertSupabaseLead({
      brand_id: websiteId,
      visitor_name: websiteName.trim(),
      phone_number: phone,
      email: uniqueApiKey,
      clicked_item: JSON.stringify({
        brand_name: websiteName.trim(),
        api_key: uniqueApiKey,
        user_id: this.currentUserId,
        store_url: newWebsite.store_url
      }),
      status: 'Brand Profile'
    }).catch((err) => console.warn('Could not persist additional website to Supabase:', err));

    this.syncWithSupabase();
    return { success: true, profile: newWebsite };
  }

  public regenerateApiKey(brandId: string): string | null {
    const profile = this.profiles.find((p) => p.id === brandId);
    if (!profile) return null;

    const newKey = generateSecureApiKey(profile.id);
    profile.api_key = newKey;
    profile.is_connected = false;
    profile.connection_status = 'AWAITING INSTALLATION';
    profile.installation_status = 'Not Installed';

    if (this.activeApiKey === profile.api_key) {
      this.activeApiKey = newKey;
    }

    this.saveProfiles();

    insertSupabaseLead({
      brand_id: profile.id,
      visitor_name: profile.brand_name,
      phone_number: profile.phone_number,
      email: newKey,
      clicked_item: JSON.stringify({
        brand_name: profile.brand_name,
        api_key: newKey,
        rotated_at: new Date().toISOString()
      }),
      status: 'Brand Profile'
    }).catch((err) => console.warn('Could not sync key rotation to Supabase:', err));

    this.notify();
    return newKey;
  }

  public logout() {
    if (this.realtimeUnsub) {
      this.realtimeUnsub();
      this.realtimeUnsub = null;
    }
    this.activeApiKey = null;
    this.leads = [];
    this.allEvents = [];
    this.saveProfiles();
    this.notify();
  }
}

export const leadStore = new LeadLensStore();
