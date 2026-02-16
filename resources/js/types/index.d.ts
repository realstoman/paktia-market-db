import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
    permissions: string[];
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    can?: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    roles?: (Role | string)[];
    role_ids?: number[];
    country?: string | null;
    country_id?: number | null;
    province?: string | null;
    province_id?: number | null;
    branch?: string | null;
    branch_id?: number | null;
    is_active?: boolean;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface Role {
    id: number;
    name: string;
    permissions?: Permission[];
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface Permission {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface Branch {
    id: number;
    name: string;
    country?: Country | string | null;
    country_id?: number | null;
    country_object?: Country | null;
    province?: Province | string | null;
    province_id?: number | null;
    province_object?: Province | null;
    kitchens?: Kitchen[];
    is_active?: boolean;
    address: string;
    description: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface Kitchen {
    id: number;
    name?: string;
    type?: string | null;
    branch?: string | null;
    branch_id?: number | null;
    country?: string | null;
    province?: string | null;
    is_active?: boolean;
    branches?: Branch[];
    products?: Product[];
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Country {
    id: number;
    name: string;
    code: string;
    currency_code: string;
    currency_symbol: string;
    is_active?: boolean;
    provinces?: Province[];
    branches?: Branch[];
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface Province {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    country_id?: number;
    [key: string]: unknown;
}

export interface ProductCategory {
    id: number;
    name: string;
    description?: string | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface ProductType {
    id: number;
    name: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface ProductSize {
    id: number;
    name: string;
    code?: string | null;
    pivot?: {
        price?: number | string;
        [key: string]: unknown;
    };
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface ProductImage {
    id: number;
    product_id?: number;
    path: string;
    url?: string;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Product {
    id: number;
    name: string;
    description?: string | null;
    product_category_id?: number;
    kitchen_id?: number | null;
    category?: ProductCategory | null;
    kitchen?: Kitchen | null;
    type?: string;
    base_price?: number | string;
    is_active?: boolean;
    sizes?: ProductSize[];
    images?: ProductImage[];
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface OrderItem {
    id: number;
    order_id?: number;
    product_id: number;
    product_size_id?: number | null;
    kitchen_id?: number | null;
    quantity: number;
    price: number | string;
    product?: Product | null;
    product_size?: ProductSize | null;
    kitchen?: Kitchen | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Order {
    id: number;
    branch_id: number;
    user_id?: number | null;
    user?: User | null;
    branch?: Branch | null;
    items?: OrderItem[];
    items_count?: number;
    order_type: string;
    base_currency?: string;
    exchange_rate?: number | null;
    total_amount: number | string;
    paid_amount: number | string;
    change_amount: number | string;
    status?: string;
    kitchen_names?: string[];
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}
