import { z } from 'zod';

// Lead validation schema
export const leadSchema = z.object({
  contact_name: z.string().trim().min(1, 'Meno je povinné').max(100, 'Meno je príliš dlhé'),
  company_name: z.string().trim().max(100, 'Názov firmy je príliš dlhý').nullable().optional(),
  email: z.string().trim().email('Neplatný email').max(255, 'Email je príliš dlhý').nullable().optional().or(z.literal('')),
  phone: z.string().trim().max(20, 'Telefón je príliš dlhý').nullable().optional(),
  address: z.string().trim().max(200, 'Adresa je príliš dlhá').nullable().optional(),
  postal_code: z.string().trim().max(10, 'PSČ je príliš dlhé').nullable().optional(),
  region_id: z.string().uuid().nullable().optional(),
  status: z.enum(['new', 'contacted', 'offer', 'won', 'lost', 'waiting']).default('new'),
  source_type: z.enum(['facebook_lead_ads', 'facebook_ads', 'google_ads', 'website_form', 'manual']).default('manual'),
  assigned_user_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(1000, 'Poznámky sú príliš dlhé').nullable().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

// Client validation schema
export const clientSchema = z.object({
  contact_name: z.string().trim().min(1, 'Meno je povinné').max(100, 'Meno je príliš dlhé'),
  company_name: z.string().trim().max(100, 'Názov firmy je príliš dlhý').nullable().optional(),
  email: z.string().trim().email('Neplatný email').max(255, 'Email je príliš dlhý').nullable().optional().or(z.literal('')),
  phone: z.string().trim().max(20, 'Telefón je príliš dlhý').nullable().optional(),
  address: z.string().trim().max(200, 'Adresa je príliš dlhá').nullable().optional(),
  postal_code: z.string().trim().max(10, 'PSČ je príliš dlhé').nullable().optional(),
  region_id: z.string().uuid().nullable().optional(),
  status: z.enum(['active', 'inactive', 'prospect', 'completed']).default('active'),
  assigned_user_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(1000, 'Poznámky sú príliš dlhé').nullable().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// Quote item validation schema
export const quoteItemSchema = z.object({
  inventory_item_id: z.string().uuid().nullable().optional(),
  description: z.string().trim().min(1, 'Popis je povinný').max(500, 'Popis je príliš dlhý'),
  quantity: z.number().min(0.01, 'Množstvo musí byť väčšie ako 0'),
  unit_price: z.number().min(0, 'Cena nemôže byť záporná'),
});

// Quote validation schema
export const quoteSchema = z.object({
  client_id: z.string().uuid('Vyberte klienta'),
  valid_until: z.string().nullable().optional(),
  notes: z.string().max(1000, 'Poznámky sú príliš dlhé').nullable().optional(),
  items: z.array(quoteItemSchema).min(1, 'Pridajte aspoň jednu položku'),
});

export type QuoteFormData = z.infer<typeof quoteSchema>;

// Inventory item validation schema
export const inventoryItemSchema = z.object({
  name: z.string().trim().min(1, 'Názov je povinný').max(200, 'Názov je príliš dlhý'),
  sku: z.string().trim().min(1, 'SKU je povinné').max(50, 'SKU je príliš dlhé'),
  category_id: z.string().uuid().nullable().optional(),
  qty_available: z.number().int().min(0, 'Množstvo nemôže byť záporné').default(0),
  min_stock: z.number().int().min(0, 'Minimálny stav nemôže byť záporný').default(0),
  purchase_price: z.number().min(0, 'Nákupná cena nemôže byť záporná').nullable().optional(),
  sale_price: z.number().min(0, 'Predajná cena nemôže byť záporná').nullable().optional(),
  notes: z.string().max(500, 'Poznámky sú príliš dlhé').nullable().optional(),
});

export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

// Document validation schema
export const documentSchema = z.object({
  title: z.string().trim().min(1, 'Názov je povinný').max(200, 'Názov je príliš dlhý'),
  category: z.enum(['pricelist', 'manual', 'internal', 'marketing', 'legal']),
  allowed_roles: z.array(z.enum(['admin', 'manager', 'sales'])).min(1, 'Vyberte aspoň jednu rolu'),
});

export type DocumentFormData = z.infer<typeof documentSchema>;

// Activity validation schema  
export const activitySchema = z.object({
  activity_type: z.enum(['call', 'email', 'meeting', 'note', 'status_change']),
  title: z.string().trim().min(1, 'Názov je povinný').max(200, 'Názov je príliš dlhý'),
  description: z.string().max(1000, 'Popis je príliš dlhý').nullable().optional(),
});

export type ActivityFormData = z.infer<typeof activitySchema>;

// User profile update schema
export const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(1, 'Meno je povinné').max(100, 'Meno je príliš dlhé'),
  phone: z.string().trim().max(20, 'Telefón je príliš dlhý').nullable().optional(),
  region_id: z.string().uuid().nullable().optional(),
  theme_preference: z.enum(['light', 'dark', 'system']).default('system'),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
