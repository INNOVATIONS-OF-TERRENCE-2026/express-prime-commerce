import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ShopifyCartDrawer } from './ShopifyCartDrawer';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export function Layout({ children, showFooter = true }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-[calc(2.5rem+4rem)] md:pt-[calc(2.5rem+5rem)]">
        {children}
      </main>
      {showFooter && <Footer />}
      <ShopifyCartDrawer />
    </div>
  );
}
