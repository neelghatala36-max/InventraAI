'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from './ui/sidebar';
import { usePathname } from 'next/navigation';

const breadcrumb_lists: Record<string, string[]> = {
  '/profile': ['My Profile'],
};

const DashboardHeader = () => {
  const pathname = usePathname();

  const breadcrumbs = breadcrumb_lists[pathname] || ['Dashboard'];

  return (
    <header className='flex h-16 border-b shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, i) => (
              <>
                {breadcrumbs.length - 1 === i ? (
                  <BreadcrumbItem key={i}>
                    <BreadcrumbPage>{crumb}</BreadcrumbPage>
                  </BreadcrumbItem>
                ) : (
                  <BreadcrumbItem key={i}>
                    <BreadcrumbLink href='#'>{crumb}</BreadcrumbLink>
                  </BreadcrumbItem>
                )}
                {i !== breadcrumbs.length - 1 && <BreadcrumbSeparator key={`sep-${i}`} />}
              </>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
};

export default DashboardHeader;
