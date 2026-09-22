import {
  Archive,
  Buildings,
  ChartPieSlice,
  Package,
  PlusCircle,
  ShoppingCart,
  UserCircle,
  TrendUp,
  Warehouse,
} from '@phosphor-icons/react';
import { NavLink } from 'react-router-dom';

export const sidebarItems = [
  {
    key: 'Dashboard',
    label: <NavLink to='/'>Dashboard</NavLink>,
    icon: <ChartPieSlice size={22} />,
  },
  {
    key: 'Demand Forecast',
    label: <NavLink to='/demand-forecast'>AI Forecasting</NavLink>,
    icon: <TrendUp size={22} color='#6366F1' weight='bold' />,
  },
  {
    key: 'Add Product',
    label: <NavLink to='/create-product'>Add Product</NavLink>,
    icon: <PlusCircle size={22} />,
  },
  {
    key: 'Products',
    label: <NavLink to='/product-search'>Products</NavLink>,
    icon: <Package size={22} />,
  },
  {
    key: 'Manage Products',
    label: <NavLink to='/products'>Inventory</NavLink>,
    icon: <Warehouse size={22} />,
  },
  {
    key: 'Manage Sales',
    label: <NavLink to='/sales'>Sales</NavLink>,
    icon: <ShoppingCart size={22} />,
  },
  {
    key: 'Manage Seller',
    label: <NavLink to='/sellers'>Sellers</NavLink>,
    icon: <Buildings size={22} />,
  },
  {
    key: 'Manage Purchase',
    label: <NavLink to='/purchases'>Purchases</NavLink>,
    icon: <Archive size={22} />,
  },
  {
    key: 'Profile',
    label: <NavLink to='/profile'>Profile</NavLink>,
    icon: <UserCircle size={22} />,
  },
];
