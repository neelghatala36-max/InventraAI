import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import DashboardHeader from './DashboardHeader';
import { ScrollArea } from './ui/scroll-area';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <ScrollArea className='h-[calc(100vh-64px)] p-6'>{children}</ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
