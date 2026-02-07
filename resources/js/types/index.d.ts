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
    roles?: string[];
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
    country?: string | null;
    country_id?: number | null;
    country_object?: Country | null;
    province?: string | null;
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
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface Province {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}
