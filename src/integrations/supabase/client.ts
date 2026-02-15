import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ekcoejynnkyaedfjiqtz.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrY29lanlubmt5YWVkZmppcXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODEzODAsImV4cCI6MjA3ODM1NzM4MH0.gVXeTu5k06L803ARzr0RLrQfdC5rI3SjEeeOgc35GYc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
