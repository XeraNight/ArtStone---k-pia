import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  Users,
  UserCog,
  FileText,
  Receipt,
  Package,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from './AppLayout';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'manager', 'sales'],
  },
  {
    title: 'Leady',
    href: '/leads',
    icon: Inbox,
    roles: ['admin', 'manager', 'sales'],
  },
  {
    title: 'Klienti',
    href: '/clients',
    icon: Users,
    roles: ['admin', 'manager', 'sales'],
  },
  {
    title: 'Obchodníci',
    href: '/salespeople',
    icon: UserCog,
    roles: ['admin', 'manager'],
  },
  {
    title: 'Cenové ponuky',
    href: '/quotes',
    icon: FileText,
    roles: ['admin', 'manager', 'sales'],
  },
  {
    title: 'Faktúry',
    href: '/invoices',
    icon: Receipt,
    roles: ['admin', 'manager'],
  },
  {
    title: 'Sklad',
    href: '/inventory',
    icon: Package,
    roles: ['admin', 'manager', 'sales'],
  },
  {
    title: 'Dokumenty',
    href: '/documents',
    icon: FolderOpen,
    roles: ['admin', 'manager', 'sales'],
  },
  {
    title: 'Nastavenia',
    href: '/settings',
    icon: Settings,
    roles: ['admin', 'manager', 'sales'],
  },
];

export function AppSidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Administrátor';
      case 'manager':
        return 'Manažér';
      case 'sales':
        return 'Obchodník';
    }
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r-2 border-sidebar-border transition-all duration-300 shadow-vintage-lg',
        'relative',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 h-16 flex-shrink-0 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[hsl(35,35%,45%)] dark:from-primary dark:to-[hsl(35,35%,40%)] flex items-center justify-center shadow-vintage">
              <span className="text-primary-foreground font-bold text-sm">AS</span>
            </div>
            <span className="font-display text-lg font-bold text-sidebar-foreground">
              ArtStone
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation - scrollable area */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent',
                'text-sidebar-muted hover:text-sidebar-foreground',
                !isActive && 'hover:bg-sidebar-accent hover:border-sidebar-border/50',
                isActive && 'bg-gradient-to-r from-card to-card/80 text-sidebar-foreground font-semibold border-sidebar-border shadow-vintage vintage-glow-active',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
              {!collapsed && <span className="font-medium">{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User section - fixed at bottom */}
      <div className="p-3 border-t-2 border-sidebar-border flex-shrink-0 bg-sidebar-accent/30">
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg mb-2',
            collapsed && 'justify-center'
          )}
        >
          <Avatar className="h-9 w-9 border-2 border-sidebar-border shadow-vintage">
            <AvatarFallback className="bg-gradient-to-br from-primary to-[hsl(35,35%,45%)] dark:from-primary dark:to-[hsl(35,35%,40%)] text-primary-foreground text-sm font-bold">
              {user.avatar || (user.name ? user.name.slice(0, 2).toUpperCase() : 'U')}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {user.name || 'User'}
              </p>
              <p className="text-xs text-sidebar-muted truncate">
                {getRoleLabel(user.role)}
              </p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size={collapsed ? 'icon-sm' : 'sm'}
          onClick={logout}
          className={cn(
            'w-full text-sidebar-muted hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20',
            collapsed && 'w-auto'
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2 font-medium">Odhlásiť sa</span>}
        </Button>
      </div>
    </aside>
  );
}
