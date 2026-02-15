import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'manager' | 'sales';
export type OAuthProvider = 'google' | 'github' | 'azure' | 'facebook';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  regionId: string | null;
  regionName: string;
  avatar?: string;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  loginWithOAuth: (provider: OAuthProvider) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, fullName: string, role: UserRole, regionId?: string) => Promise<{ error: string | null; session?: Session | null }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;
  refreshUser: () => Promise<void>;
  setDemoUser: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing (fallback when DB is not set up)
const demoUsers: Record<UserRole, AppUser> = {
  admin: {
    id: 'admin-1',
    name: 'Peter Admin',
    email: 'admin@artstone.sk',
    role: 'admin',
    regionId: 'all',
    regionName: 'Košický kraj',
    avatar: 'PA',
  },
  manager: {
    id: 'manager-1',
    name: 'Jana Manažérová',
    email: 'manager@artstone.sk',
    role: 'manager',
    regionId: 'region-1',
    regionName: 'Bratislavský kraj',
    avatar: 'JM',
  },
  sales: {
    id: 'sales-1',
    name: 'Marek Obchodník',
    email: 'sales@artstone.sk',
    role: 'sales',
    regionId: 'region-1',
    regionName: 'Bratislavský kraj',
    avatar: 'MO',
  },
};

async function fetchUserData(userId: string, authEmail?: string): Promise<AppUser | null> {
  try {
    console.log('[Auth] Fetching user data for:', userId);

    // Try to fetch profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, regions(name)')
      .eq('id', userId)
      .maybeSingle();

    console.log('[Auth] Profile fetch result:', { profile, error: profileError });

    // If no profile exists, create fallback from auth data
    if (!profile) {
      console.log('[Auth] No profile found, creating fallback');
      // 1. Get fallback data from auth metadata
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const email = authEmail || authUser?.email || 'unknown@email.com';
      const fullName = authUser?.user_metadata?.full_name || email.split('@')[0];
      const metaRole = authUser?.user_metadata?.role as UserRole;
      const metaRegionId = authUser?.user_metadata?.region_id;

      // 2. Try to fetch role from user_roles as secondary fallback
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('[Auth] Role fallback:', { roleData, metaRole });

      // Prioritize metadata role > user_roles > default 'sales'
      const role = metaRole || (roleData?.role as UserRole) || 'sales';
      // Use metadata region or null
      const regionId = metaRegionId || null;

      // 3. Self-healing: Create the missing profile using available data
      console.log('[Auth] Self-healing: Creating missing profile from metadata');

      // First check if profile was just created (to avoid race condition with signup)
      const { data: checkProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!checkProfile) {
        const { error: healError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            full_name: fullName,
            role: role,
            region_id: regionId,
            updated_at: new Date().toISOString()
          });

        if (healError) {
          console.error('[Auth] Self-healing failed:', healError);
        } else {
          console.log('[Auth] Self-healing successful');
        }
      } else {
        console.log('[Auth] Profile already exists, skipping self-healing');
      }

      return {
        id: userId,
        name: fullName,
        email: email,
        role,
        regionId: regionId,
        regionName: 'Košický kraj', // We don't have the region name joined yet, user needs to refresh or we could fetch it, but keeping it simple for now
        avatar: fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U',
      };
    }

    // Fetch role from user_roles table (legacy/backup)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('[Auth] Role fetch result:', { roleData, error: roleError, profileRole: profile.role });

    // Prioritize role from profile, then user_roles, then default to sales
    // Prioritize role from profile, then user_roles, then default to sales
    const role = (profile.role as UserRole) || (roleData?.role as UserRole) || 'sales';

    // Safely extract region name, handling potential array return from Supabase
    let regionName = 'Neurčený región';
    if (profile.regions) {
      if (Array.isArray(profile.regions) && profile.regions.length > 0) {
        regionName = profile.regions[0].name;
      } else if (typeof profile.regions === 'object' && 'name' in profile.regions) {
        regionName = (profile.regions as any).name;
      }
    }

    console.log('[Auth] Final user role:', role);
    console.log('[Auth] Region data:', {
      region_id: profile.region_id,
      regions_raw: profile.regions,
      final_regionName: regionName
    });

    return {
      id: profile.id,
      name: profile.full_name || profile.email,
      email: profile.email,
      role,
      regionId: profile.region_id,
      regionName: regionName,
      avatar: profile.avatar_url || profile.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
    };
  } catch (error) {
    console.error('[Auth] Error in fetchUserData:', error);
    // Fallback from auth user on any error
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const email = authEmail || authUser.email || 'unknown@email.com';
      const fullName = authUser.user_metadata?.full_name || email.split('@')[0];
      return {
        id: userId,
        name: fullName,
        email: email,
        role: 'sales' as UserRole,
        regionId: null,
        regionName: 'Neurčený región',
        avatar: fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U',
      };
    }
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    const stored = localStorage.getItem('artstone-user');
    return stored ? JSON.parse(stored) : null;
  });
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(() => {
    const stored = localStorage.getItem('artstone-demo-mode');
    return stored === 'true';
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);

        if (currentSession?.user) {
          // Clear demo mode when we have a real session
          setIsDemo(false);
          localStorage.removeItem('artstone-demo-mode');

          // Defer Supabase calls with setTimeout to avoid deadlock
          setTimeout(async () => {
            const userData = await fetchUserData(currentSession.user.id);
            if (userData) {
              setUser(userData);
              localStorage.setItem('artstone-user', JSON.stringify(userData));
            }
            setIsLoading(false);
          }, 0);
        } else {
          // Only clear user if we're not using demo mode
          const storedUser = localStorage.getItem('artstone-user');
          if (!storedUser || event === 'SIGNED_OUT') {
            setUser(null);
            localStorage.removeItem('artstone-user');
          }
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession?.user) {
        // Clear demo mode when we have a real session
        setIsDemo(false);
        localStorage.removeItem('artstone-demo-mode');

        fetchUserData(existingSession.user.id).then(async (userData) => {
          if (userData) {
            setUser(userData);
            localStorage.setItem('artstone-user', JSON.stringify(userData));
          }
          setIsLoading(false);
        });
      } else {
        const storedUser = localStorage.getItem('artstone-user');
        if (!storedUser) {
          setUser(null);
          localStorage.removeItem('artstone-user');
        }
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      // CLEAR localStorage cache BEFORE login to ensure fresh data
      console.log('[Auth] Clearing localStorage cache before login');
      localStorage.removeItem('artstone-user');
      localStorage.removeItem('artstone-demo-mode');
      setUser(null);
      setIsDemo(false);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Nesprávny email alebo heslo' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: 'Email ešte nebol potvrdený. Skontrolujte svoju emailovú schránku.' };
        }
        return { error: error.message };
      }

      if (data.user) {
        console.log('[Auth] Login successful, fetching fresh user data');
        const userData = await fetchUserData(data.user.id, email);
        console.log('[Auth] User data after login:', userData);
        if (userData) {
          setUser(userData);
          setIsDemo(false);
          localStorage.setItem('artstone-user', JSON.stringify(userData));
          localStorage.removeItem('artstone-demo-mode');
        }
      }

      return { error: null };
    } catch (err) {
      console.error('[Auth] Login error:', err);
      return { error: 'Nastala chyba pri prihlásení' };
    }
  };

  const signup = async (email: string, password: string, fullName: string, role: UserRole = 'sales', regionId?: string): Promise<{ error: string | null; session?: Session | null }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            role: role,
            region_id: regionId
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          return { error: 'Tento email je už zaregistrovaný' };
        }
        return { error: error.message };
      }

      if (data.user) {
        console.log('[Auth] Attempting to create profile for user:', data.user.id);
        // Explicitly create/update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: role,
            region_id: regionId || null,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (profileError) {
          console.error('[Auth] Manual profile creation failed:', profileError);
          // Alert the user if it's likely a permission issue
          if (profileError.code === '42501' || profileError.message.includes('security policy')) {
            console.error('CRITICAL: Database RLS policy is blocking profile creation.');
            // We don't return error here to allow login, but we log loud
          }
        }
      }

      if (data.user && !data.session) {
        return { error: null, session: null }; // Email confirmation required
      }

      return { error: null, session: data.session };
    } catch (err) {
      return { error: 'Nastala chyba pri registrácii' };
    }
  };

  const loginWithOAuth = async (provider: OAuthProvider): Promise<{ error: string | null }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error('[Auth] OAuth error:', error);
        return { error: error.message };
      }

      // OAuth will redirect, so we don't need to do anything else here
      return { error: null };
    } catch (err) {
      console.error('[Auth] OAuth error:', err);
      return { error: 'Nastala chyba pri OAuth prihlásení' };
    }
  };

  const logout = async () => {
    if (!isDemo) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setIsDemo(false);
    localStorage.removeItem('artstone-user');
    localStorage.removeItem('artstone-demo-mode');
  };

  const deleteAccount = async (): Promise<{ error: string | null }> => {
    if (!user || !session) return { error: 'Nie ste prihlásený' };

    try {
      console.log('[Auth] Deleting account for:', user.id);

      // 1. Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.error('[Auth] Error deleting profile:', profileError);
        // Continue anyway to try to clean up other things
      }

      // 2. Delete user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);

      if (roleError) {
        console.error('[Auth] Error deleting user role:', roleError);
      }

      // 3. Try to call RPC to delete from auth.users (if exists)
      // This might fail if the RPC function doesn't exist, which is expected in some setups
      const { error: rpcError } = await supabase.rpc('delete_user');

      if (rpcError) {
        console.warn('[Auth] RPC delete_user failed (this is expected if function is missing):', rpcError);
      }

      // 4. Logout cleanup
      await logout();

      return { error: null };
    } catch (err: any) {
      console.error('[Auth] Delete account error:', err);
      return { error: err.message || 'Nastala chyba pri mazaní účtu' };
    }
  };

  const refreshUser = async () => {
    if (!session?.user?.id || isDemo) {
      return;
    }

    try {
      const userData = await fetchUserData(session.user.id, session.user.email || '');
      if (userData) {
        setUser(userData);
        localStorage.setItem('artstone-user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('[Auth] Refresh user error:', error);
    }
  };

  const setDemoUser = (role: UserRole) => {
    const demoUser = demoUsers[role];
    setUser(demoUser);
    setIsDemo(true);
    localStorage.setItem('artstone-user', JSON.stringify(demoUser));
    localStorage.setItem('artstone-demo-mode', 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        isDemo,
        login,
        loginWithOAuth,
        signup,
        logout,
        deleteAccount,
        refreshUser,
        setDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
