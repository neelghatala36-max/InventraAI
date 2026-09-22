import {
  AirplayIcon,
  CirclePileIcon,
  LayoutDashboardIcon,
  LucideIcon,
  PackageSearchIcon,
  TicketPercentIcon,
} from 'lucide-react';

export interface ISidebarItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
}

export const sidebarData: ISidebarItem[] = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboardIcon,
    isActive: true,
    items: [],
  },
  {
    title: 'Products',
    url: '/products',
    icon: PackageSearchIcon,
    items: [
      {
        title: 'Products List',
        url: '/products/all',
      },
      {
        title: 'Create Product',
        url: '/products/create',
      },
    ],
  },
  {
    title: 'Orders',
    url: '/orders',
    icon: AirplayIcon,
    items: [
      {
        title: 'Orders List',
        url: '/orders/all',
      },
      {
        title: 'Create Order',
        url: '/orders/create',
      },
    ],
  },
  {
    title: 'Vendors',
    url: '#',
    icon: CirclePileIcon,
    items: [
      {
        title: 'Vendors List',
        url: '/vendors/all',
      },
      {
        title: 'Create Vendor',
        url: '/vendors/create',
      },
    ],
  },
  {
    title: 'Procurement',
    url: '#',
    icon: TicketPercentIcon,
    items: [
      {
        title: 'Purchase Orders',
        url: '/procurement/purchase-orders',
      },
      {
        title: 'Create Purchase Order',
        url: '/procurement/create-purchase-order',
      },
    ],
  },
];
