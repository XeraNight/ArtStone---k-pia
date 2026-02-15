export type AppRole = 'admin' | 'manager' | 'sales';
export type LeadStatus = 'new' | 'contacted' | 'offer' | 'won' | 'lost' | 'waiting';
export type LeadSource = 'facebook_lead_ads' | 'facebook_ads' | 'google_ads' | 'website_form' | 'manual';
export type ClientStatus = 'active' | 'inactive' | 'prospect' | 'completed';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'status_change';
export type DocumentCategory = 'pricelist' | 'manual' | 'internal' | 'marketing' | 'legal';

export interface Region {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role?: AppRole;
  phone: string | null;
  avatar_url: string | null;
  region_id: string | null;
  theme_preference: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  region?: Region;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Lead {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
  region_id: string | null;
  status: LeadStatus;
  source_type: LeadSource;
  source_campaign: string | null;
  source_adset: string | null;
  source_ad: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  external_lead_id: string | null;
  assigned_user_id: string | null;
  duplicate_of_lead_id: string | null;
  converted_to_client_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  region?: Region;
  assigned_user?: Profile;
  created_by_user?: Profile;
}

export interface Client {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
  region_id: string | null;
  status: ClientStatus;
  assigned_user_id: string | null;
  lead_origin_id: string | null;
  total_value: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  region?: Region;
  assigned_user?: Profile;
}

export interface Activity {
  id: string;
  entity_type: 'lead' | 'client';
  entity_id: string;
  activity_type: ActivityType;
  title: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  created_by_user?: Profile;
}

export interface InventoryCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category_id: string | null;
  qty_available: number;
  qty_reserved: number;
  min_stock: number;
  purchase_price: number | null;
  sale_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category?: InventoryCategory;
}

export interface Quote {
  id: string;
  quote_number: string;
  client_id: string | null;
  status: QuoteStatus;
  valid_until: string | null;
  subtotal: number;
  discount: number; // New field
  shipping: number; // New field
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  pdf_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  created_by_user?: Profile;
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  inventory_item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string | null;
  quote_id: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  pdf_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  created_by_user?: Profile;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  inventory_item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface Reservation {
  id: string;
  inventory_item_id: string;
  client_id: string | null;
  quote_id: string | null;
  quantity: number;
  status: string;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  category: DocumentCategory;
  file_url: string;
  file_type: string | null;
  file_size: string | null;
  allowed_roles: AppRole[];
  allowed_user_ids: string[];
  created_by: string | null;
  created_at: string;
  created_by_user?: Profile;
}

export interface LeadImportLog {
  id: string;
  source_type: LeadSource;
  result: 'created' | 'duplicate' | 'failed';
  message: string | null;
  external_lead_id: string | null;
  mapped_email: string | null;
  mapped_phone: string | null;
  lead_id: string | null;
  imported_at: string;
}
