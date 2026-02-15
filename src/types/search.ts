export type SearchEntityType = 'lead' | 'client' | 'quote' | 'invoice' | 'inventory';

export interface SearchResult {
    id: string;
    type: SearchEntityType;
    title: string;
    subtitle?: string;
    metadata?: {
        email?: string;
        phone?: string;
        company?: string;
        status?: string;
    };
    href: string;
}

export interface SearchResults {
    leads: SearchResult[];
    clients: SearchResult[];
    quotes: SearchResult[];
    invoices: SearchResult[];
    inventory: SearchResult[];
}

export interface SearchCategory {
    label: string;
    results: SearchResult[];
    icon: React.ReactNode;
}
