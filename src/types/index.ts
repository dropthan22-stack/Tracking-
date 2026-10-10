export type ConnectionStatusState =
  | 'NOT CONFIGURED'
  | 'AWAITING INSTALLATION'
  | 'TRACKING SCRIPT DETECTED'
  | 'ENDPOINT CONNECTED'
  | 'TEST EVENT RECEIVED'
  | 'CONNECTED'
  | 'CONNECTION ERROR';

export type TrackingEventType =
  | 'Page Viewed'
  | 'Product Viewed'
  | 'Product Clicked'
  | 'Button Clicked'
  | 'Link Clicked'
  | 'Contact Clicked'
  | 'WhatsApp Clicked'
  | 'Enquiry Clicked'
  | 'Added to Cart'
  | 'Checkout Started'
  | 'Purchase Completed'
  | 'Cart Abandoned'
  | 'Handshake Ping';

export type AbandonmentStatus =
  | 'Cart Abandoned'
  | 'Viewed but Not Bought'
  | 'Viewed'
  | 'WhatsApp Enquiry'
  | 'Contact Enquiry'
  | 'Checkout Started'
  | 'Purchased'
  | 'Handshake Ping'
  | 'Brand Profile';

export interface Lead {
  id: string;
  brand_id: string;
  brand_api_key: string;
  visitor_identifier: string; // Real session identifier or customer name
  visitor_phone: string | null; // Customer phone (or null -> 'Not Provided')
  visitor_email: string | null; // Customer email (or null -> 'Not Provided')
  clicked_item_name: string; // Product or interactive element interacted with
  status: AbandonmentStatus; // Tracking event status
  timestamp: string; // Event ISO timestamp
  price?: number;
  category?: string;
  page_url?: string;
  last_action?: string;
  order_id?: string;
}

export interface BrandProfile {
  id: string; // Unique Website/Brand ID (e.g. bnd_dropthan_521 or web_dropthan_101)
  user_id: string; // Owner User ID
  brand_name: string; // Website / Store Name
  api_key: string; // Unique publishable tracking identifier
  phone_number: string;
  store_url?: string; // Registered Website URL
  created_at: string;
  is_connected?: boolean;
  connection_status?: ConnectionStatusState;
  installation_status?: 'Installed' | 'Not Installed';
  last_ping_at?: string;
}

export type WebsiteProfile = BrandProfile;

export interface TrackedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: 'Apparel' | 'Electronics' | 'Beauty & Cosmetics' | 'Home & Kitchen' | 'Services / Custom';
  tags: string[];
  hasBuyButton?: boolean;
}

export type ClothingProduct = TrackedProduct;

export interface ConnectionTestStep {
  step: number;
  name: string;
  description: string;
  status: 'pending' | 'success' | 'failed';
  details?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  supabaseConnected: boolean;
  endpointReachable: boolean;
  brandValid: boolean;
  eventStored: boolean;
  eventRetrieved: boolean;
  storefrontPingDetected: boolean;
  connectionState: ConnectionStatusState;
  steps: ConnectionTestStep[];
  message: string;
  timestamp: string;
  details?: string;
}
