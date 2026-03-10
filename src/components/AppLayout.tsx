import { ReactNode, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
  onSearch?: (query: string) => void;
  searchValue?: string;
}

export function AppLayout({ children, onSearch, searchValue }: AppLayoutProps) {
  const [localSearch, setLocalSearch] = useState('');
  const search = searchValue ?? localSearch;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center gap-3 border-b bg-card px-4 shrink-0">
            <SidebarTrigger className="text-muted-foreground" />
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search articles, sources, notes…"
                className="h-8 pl-8 text-xs bg-muted/50 border-0"
                value={search}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  onSearch?.(e.target.value);
                }}
              />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
