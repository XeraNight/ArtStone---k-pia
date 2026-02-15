import { Bell, HelpCircle, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { GlobalSearch } from './GlobalSearch';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSidebar } from './AppLayout';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const { user } = useAuth();
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-40 h-16 border-b-2 border-border bg-card/95 backdrop-blur shadow-vintage">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left side */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {title && (
            <h1 className="font-display text-lg md:text-xl font-bold text-foreground">
              {title}
            </h1>
          )}
          {user && (
            <Badge
              variant="secondary"
              className="font-medium bg-primary/15 text-foreground border border-border hover:bg-primary/25"
            >
              {user.regionName}
            </Badge>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Global Search */}
          <div className="hidden md:block">
            <GlobalSearch className="w-80" />
          </div>

          {/* Notifications */}
          <NotificationDropdown />

          {/* Help */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Nová funkcia bude dostupná čoskoro</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
