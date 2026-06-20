import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
    roles: string[];
    permissions: string[];
    is_super_admin?: boolean;
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
    canAny?: string[];
}

export interface SharedData {
    name: string;
    name_translations?: Partial<Record<'fa' | 'ps' | 'en', string>> | null;
    quote: { message: string; author: string };
    auth: Auth;
    branding: {
        name: string;
        shortName: string;
        logoUrl: string;
        logoFullUrl: string;
        logoPath?: string | null;
        logoFullPath?: string | null;
        primaryColor: string;
        secondaryColor: string;
        tertiaryColor: string;
    };
    localization: {
        locale: 'en' | 'fa' | 'ps';
        direction: 'ltr' | 'rtl';
        isRtl: boolean;
        languages: {
            code: 'en' | 'fa' | 'ps';
            label: string;
            nativeLabel: string;
            direction: 'ltr' | 'rtl';
            isDefault: boolean;
        }[];
    };
    notifications?: AppNotification[];
    flash?: {
        loginWelcome?: {
            id: string;
        } | null;
        success?: {
            id: string;
            message: string;
        } | null;
        error?: {
            id: string;
            message: string;
        } | null;
    };
    unauthorizedAccess?: {
        show: boolean;
        path?: string | null;
    } | null;
    tools?: {
        countries: Country[];
        provinces: Province[];
        currencies: Currency[];
        vendors: Vendor[];
        banners: Banner[];
    };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface AppNotification {
    id: string;
    category:
        | 'payments'
        | 'salary'
        | 'employees'
        | 'inventory'
        | 'users'
        | 'system';
    title: string;
    description: string;
    createdAt?: string | null;
    readAt?: string | null;
    meta?: string | null;
    href?: string | null;
    unread?: boolean;
    priority: 'high' | 'medium' | 'low';
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
    property?: string | null;
    property_id?: number | null;
    is_active?: boolean;
    is_internal_user?: boolean;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface EmploymentType {
    id: number;
    name: string;
    description?: string | null;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface EmployeePosition {
    id: number;
    name: string;
    description?: string | null;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Shift {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    description?: string | null;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    full_name?: string;
    phone?: string | null;
    address?: string | null;
    description?: string | null;
    profile_picture?: string | null;
    attachments?: string[] | null;
    property?: string | Property | null;
    property_id?: number | null;
    employment_type?: string | null;
    employment_type_id?: number | null;
    employee_position?: string | null;
    employee_position_id?: number | null;
    shift?: string | null;
    shift_id?: number | null;
    salary?: number | string | null;
    salary_currency?: 'AFN' | 'USD';
    contract_start_date?: string | null;
    contract_end_date?: string | null;
    contract_amount?: number | string | null;
    status?: string;
    is_active?: boolean;
    advances?: EmployeeAdvance[];
    payroll_items?: PayrollRunItem[];
    contract_schedules?: EmployeeContractPaymentSchedule[];
    upcoming_payment?: {
        source?: string;
        title?: string;
        amount?: number | string | null;
        currency?: string | null;
        status?: string | null;
        due_date?: string | null;
    } | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface EmployeeAdvance {
    id: number;
    employee_id: number;
    employee?: Employee | null;
    property_id?: number | null;
    property?: Property | null;
    advance_date: string;
    amount: number | string;
    deducted_amount?: number | string;
    remaining_balance?: number | string;
    repayment_method?: string | null;
    status?: string;
    reason?: string | null;
    created_by?: number | null;
    creator?: User | null;
    approved_by?: number | null;
    approver?: User | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface PayrollRunItem {
    id: number;
    employee_id: number;
    employee_name?: string;
    employee?: Employee | null;
    salary_type: string;
    gross_salary: number;
    bonuses: number;
    deductions: number;
    advances_deducted: number;
    overtime_amount: number;
    net_salary: number;
    payment_method?: string | null;
    payment_status: string;
    payment_date?: string | null;
    advance_breakdown?: {
        advance_id?: number | null;
        amount: number;
        reason?: string | null;
        type?: string | null;
    }[];
    covered_period_dates?: string[];
    covered_month_count?: number;
    payroll_run?: {
        id: number;
        status?: string;
        period_start?: string | null;
        period_end?: string | null;
        paid_at?: string | null;
        property?: Property | null;
    } | null;
    [key: string]: unknown;
}

export interface PayrollRun {
    id: number;
    property_id?: number | null;
    property?: Property | null;
    period_start: string;
    period_end: string;
    status: string;
    notes?: string | null;
    created_by?: number | null;
    creator?: User | null;
    approved_by?: number | null;
    approver?: User | null;
    approved_at?: string | null;
    paid_at?: string | null;
    created_at?: string | null;
    items_count?: number;
    gross_total?: number;
    bonuses_total?: number;
    deductions_total?: number;
    advances_total?: number;
    overtime_total?: number;
    net_total?: number;
    payroll_period_label?: string;
    items?: PayrollRunItem[];
    [key: string]: unknown;
}

export interface EmployeeContractPaymentSchedule {
    id: number;
    employee_contract_id: number;
    contract?: EmployeeContract | null;
    due_date: string;
    title?: string | null;
    percentage?: number | string | null;
    amount: number | string;
    status: string;
    payment_method?: string | null;
    attachment_path?: string | null;
    paid_at?: string | null;
    notes?: string | null;
    [key: string]: unknown;
}

export interface EmployeeContract {
    id: number;
    employee_id: number;
    employee?: Employee | null;
    property_id?: number | null;
    property?: Property | null;
    contract_amount: number | string;
    start_date: string;
    end_date?: string | null;
    payment_plan_type: string;
    installment_count?: number | null;
    status: string;
    notes?: string | null;
    scheduled_total?: number;
    paid_total?: number;
    unpaid_total?: number;
    schedules?: EmployeeContractPaymentSchedule[];
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

export interface FinanceAccount {
    id: number;
    code: string;
    name: string;
    type: string;
    parent_id?: number | null;
    parent?: Pick<FinanceAccount, 'id' | 'code' | 'name'> | null;
    property_id?: number | null;
    property?: Property | null;
    currency_code?: string | null;
    is_postable?: boolean;
    is_system?: boolean;
    dependency_count?: number;
    status?: string;
    description?: string | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface ExpenseCategory {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    expense_account_id?: number | null;
    expense_account?: FinanceAccount | null;
    expenses_count?: number;
    is_active?: boolean;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Expense {
    id: number;
    property_id: number;
    vendor_id?: number | null;
    title: string;
    expense_type?: string | null;
    expense_category_id?: number | null;
    expense_category?: ExpenseCategory | null;
    account_id?: number | null;
    account?: FinanceAccount | null;
    paid_from_account_id?: number | null;
    paid_from_account?: FinanceAccount | null;
    property?: Property | null;
    vendor?: Vendor | null;
    amount: number | string;
    payment_method?: string | null;
    description?: string | null;
    attachments?: string[] | null;
    expense_date?: string;
    approval_status?: string;
    created_by?: number | null;
    creator?: User | null;
    approved_by?: number | null;
    approver?: User | null;
    approved_at?: string | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface CashMovement {
    id: number;
    property_id?: number | null;
    property?: Property | null;
    movement_type: string;
    direction: 'in' | 'out';
    movement_date: string;
    amount: number | string;
    payment_method: string;
    account_id?: number | null;
    account?: FinanceAccount | null;
    counterparty_account_id?: number | null;
    counterparty_account?: FinanceAccount | null;
    reference_type?: string | null;
    reference_id?: number | null;
    created_by?: number | null;
    creator?: User | null;
    approved_by?: number | null;
    approver?: User | null;
    approval_status?: string;
    description?: string | null;
    attachment_path?: string | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface CashMovementType {
    id: number;
    name: string;
    slug: string;
    default_direction?: 'in' | 'out' | null;
    requires_counterparty?: boolean;
    is_active?: boolean;
    sort_order?: number;
    movement_count?: number;
    description?: string | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Property {
    id: number;
    parent_property_id?: number | null;
    parent_property?: Property | null;
    related_locations?: Property[];
    name: string;
    country?: Country | string | null;
    country_id?: number | null;
    country_object?: Country | null;
    province?: Province | string | null;
    province_id?: number | null;
    province_object?: Province | null;
    is_active?: boolean;
    display_order?: number;
    address: string;
    address_translations?: Partial<Record<'fa' | 'ps' | 'en', string>> | null;
    description: string;
    description_translations?: Partial<
        Record<'fa' | 'ps' | 'en', string>
    > | null;
    property_type?:
        | 'market'
        | 'mall'
        | 'block'
        | 'house'
        | 'commercial_unit';
    usage_type?: 'commercial' | 'residential' | 'mixed';
    image_url?: string | null;
    distance_from_city_km?: string | null;
    land_area_sqm?: string | null;
    building_area_sqm?: string | null;
    declared_floors?: number | null;
    declared_units?: number | null;
    rooms_count?: number | null;
    kitchens_count?: number | null;
    halls_count?: number | null;
    bathrooms_count?: number | null;
    parking_spaces?: number | null;
    year_built?: number | null;
    amenities?: string[] | null;
    notes?: string | null;
    host_market_name?: string | null;
    host_market_name_translations?: Partial<
        Record<'fa' | 'ps' | 'en', string>
    > | null;
    external_unit_number?: string | null;
    external_floor?: string | null;
    ownership_type?: 'owned' | 'leased' | 'managed';
    operating_mode?:
        | 'owner_occupied'
        | 'vacant'
        | 'rented'
        | 'maintenance';
    business_activities?: string[] | null;
    title_deed_number?: string | null;
    documents?: PropertyDocument[];
    floors_count?: number;
    units_count?: number;
    floors?: PropertyFloor[];
    leases?: Lease[];
    shareholdings?: PropertyShareholding[];
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface PropertyDocument {
    id: number;
    property_id: number;
    document_type: string;
    title: string;
    document_number?: string | null;
    original_name: string;
    mime_type?: string | null;
    size_bytes?: number | null;
    created_at: string;
}

export interface Shareholder {
    id: number;
    full_name: string;
    father_name?: string | null;
    grandfather_name?: string | null;
    gender?: 'male' | 'female' | 'other' | null;
    date_of_birth?: string | null;
    country_of_birth_id?: number | null;
    country_of_birth?: Country | null;
    citizenship_country_id?: number | null;
    citizenship_country?: Country | null;
    nid_type: 'electronic' | 'paper' | 'passport' | 'other';
    nid_number: string;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    occupation?: string | null;
    address?: string | null;
    photo_url?: string | null;
    notes?: string | null;
    is_active: boolean;
    documents?: ShareholderDocument[];
    shareholdings?: PropertyShareholding[];
    shareholdings_count?: number;
    created_at: string;
    updated_at: string;
}

export interface ShareholderDocument {
    id: number;
    shareholder_id: number;
    document_type: string;
    title: string;
    document_number?: string | null;
    expires_at?: string | null;
    original_name: string;
    mime_type?: string | null;
    size_bytes?: number | null;
}

export interface PropertyShareholding {
    id: number;
    property_id: number;
    shareholder_id: number;
    percentage: string | number;
    capital_contribution?: string | number | null;
    currency_id?: number | null;
    effective_from: string;
    effective_to?: string | null;
    notes?: string | null;
    property?: Property;
    shareholder?: Shareholder;
    currency?: Currency | null;
}

export interface PropertyFloor {
    id: number;
    property_id: number;
    name: string;
    level_number: number;
    area_sqm?: string | null;
    planned_units?: number | null;
    usage_type?: string | null;
    description?: string | null;
    is_active: boolean;
    units?: PropertyUnit[];
    leases?: Lease[];
}

export interface PropertyUnit {
    id: number;
    property_floor_id: number;
    unit_type: 'shop' | 'apartment';
    unit_number: string;
    area_sqm?: string | null;
    width_m?: string | null;
    length_m?: string | null;
    rooms_count?: number | null;
    kitchens_count?: number | null;
    halls_count?: number | null;
    bathrooms_count?: number | null;
    occupancy_status: 'vacant' | 'occupied' | 'reserved' | 'maintenance';
    electricity_meter?: string | null;
    water_meter?: string | null;
    description?: string | null;
    is_active: boolean;
    leases?: Lease[];
}

export interface Tenant {
    id: number;
    card_code: string;
    tenant_type: 'individual' | 'company';
    full_name: string;
    father_name?: string | null;
    business_name?: string | null;
    phone: string;
    whatsapp?: string | null;
    email?: string | null;
    nid_number?: string | null;
    license_number?: string | null;
    address?: string | null;
    photo_url?: string | null;
    notes?: string | null;
    is_active: boolean;
    documents?: TenantDocument[];
    leases?: Lease[];
    leases_count?: number;
    created_at: string;
    updated_at: string;
}

export interface TenantDocument {
    id: number;
    tenant_id: number;
    document_type: string;
    title: string;
    original_name: string;
    mime_type?: string | null;
    size_bytes?: number | null;
}

export interface Lease {
    id: number;
    contract_number: string;
    tenant_id: number;
    property_id: number;
    property_floor_id?: number | null;
    property_unit_id?: number | null;
    leased_space_type: 'shop' | 'apartment' | 'house' | 'block' | 'property';
    start_date: string;
    end_date?: string | null;
    rent_amount?: string | number | null;
    security_deposit?: string | number | null;
    currency_id?: number | null;
    payment_frequency: 'monthly' | 'quarterly' | 'yearly';
    status: 'draft' | 'active' | 'ended' | 'terminated';
    terms?: string | null;
    notes?: string | null;
    property?: Property;
    floor?: PropertyFloor | null;
    unit?: PropertyUnit | null;
    currency?: Currency | null;
    tenant?: Tenant;
    created_at: string;
    updated_at: string;
}

export interface Country {
    id: number;
    name: string;
    name_en?: string;
    name_translations?: Partial<Record<'fa' | 'ps' | 'en', string>> | null;
    code: string;
    currency_code: string;
    currency_symbol: string | null;
    is_active?: boolean;
    provinces?: Province[];
    properties?: Property[];
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface Province {
    id: number;
    name: string;
    name_en?: string;
    name_translations?: Partial<Record<'fa' | 'ps' | 'en', string>> | null;
    created_at: string;
    updated_at: string;
    country_id?: number;
    country?: Country | null;
    [key: string]: unknown;
}

export interface InventoryItemImage {
    id: number;
    inventory_item_id?: number;
    path: string;
    url?: string;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface InventoryTransaction {
    id: number;
    inventory_item_id?: number;
    action: string;
    quantity: number | string;
    note?: string | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface InventoryItem {
    id: number;
    property_id: number;
    vendor_id?: number | null;
    unit_id?: number | null;
    category_id?: number | null;
    inventory_type_id?: number | null;
    property?: Property | null;
    vendor?: Vendor | null;
    unitReference?: Unit | null;
    categoryReference?: InventoryCategory | null;
    typeReference?: InventoryType | null;
    name: string;
    description?: string | null;
    type: string;
    unit?: string | null;
    quantity: number | string;
    unit_price?: number | string;
    paid_amount?: number | string;
    currency_code?: string;
    currency_symbol?: string;
    total_price?: number | string;
    outstanding_amount?: number | string;
    receipt_path?: string | null;
    receipt_url?: string | null;
    is_usable: boolean;
    images?: InventoryItemImage[];
    transactions?: InventoryTransaction[];
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Vendor {
    id: number;
    name: string;
    category?: string | null;
    address?: string | null;
    contact_person?: string | null;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Banner {
    id: number;
    title: string;
    banner_type: 'product' | 'gift' | 'category' | 'type' | 'social';
    image_path: string;
    image_url?: string;
    link?: string | null;
    link_type: 'internal' | 'external';
    sort_order?: number;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Currency {
    id: number;
    name: string;
    code: string;
    symbol: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Unit {
    id: number;
    name: string;
    symbol: string;
    description?: string | null;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface InventoryCategory {
    id: number;
    name: string;
    description?: string | null;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface InventoryType {
    id: number;
    name: string;
    description?: string | null;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}
