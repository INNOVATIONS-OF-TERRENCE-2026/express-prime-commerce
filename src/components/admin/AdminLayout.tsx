import { ReactNode } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Bot, 
  Settings, 
  Upload,
  ChevronRight,
  LogOut,
  User
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ADMIN_ROUTES } from '@/lib/constants';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const location = useLocation();
  const { user, isAdmin, signOut, isLoading } = useAuth();

  const navItems = [
    { href: ADMIN_ROUTES.dashboard, icon: LayoutDashboard, label: 'Dashboard' },
    { href: ADMIN_ROUTES.products, icon: Package, label: 'Products' },
    { href: ADMIN_ROUTES.orders, icon: ShoppingCart, label: 'Orders' },
    { href: ADMIN_ROUTES.aiDecisions, icon: Bot, label: 'AI Decisions' },
    { href: ADMIN_ROUTES.bulkImport, icon: Upload, label: 'Bulk Import' },
    { href: ADMIN_ROUTES.settings, icon: Settings, label: 'Settings' },
  ];

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // For demo purposes, allow access without strict auth
  // In production, uncomment the redirect
  // if (!user || !isAdmin) {
  //   return <Navigate to="/auth/login" replace />;
  // }

  return (
    <div className="h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F172A] text-white flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <Link to="/admin">
            <Logo size="sm" />
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary text-white" 
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User Section */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.email || 'Admin User'}
              </p>
              <p className="text-xs text-white/50 capitalize">
                {user?.role || 'founder'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-white/70 hover:text-white hover:bg-white/10"
              asChild
            >
              <Link to="/">View Store</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => signOut()}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link to="/admin" className="hover:text-primary">Admin</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{title}</span>
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm mt-1">{description}</p>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
