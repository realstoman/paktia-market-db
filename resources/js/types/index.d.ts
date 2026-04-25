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
    unauthorizedAccess?: {
        show: boolean;
        path?: string | null;
    } | null;
    tools?: {
        countries: Country[];
        provinces: Province[];
        currencies: Currency[];
        vendors: Vendor[];
        discountCards: DiscountCard[];
        banners: Banner[];
        kitchens: Kitchen[];
        products: Product[];
        kitchenTypes: KitchenType[];
        cuisines: Cuisine[];
        kitchenCategories: KitchenCategory[];
    };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface AppNotification {
    id: string;
    category:
        | 'orders'
        | 'payments'
        | 'salary'
        | 'employees'
        | 'inventory'
        | 'products'
        | 'users'
        | 'system';
    title: string;
    description: string;
    createdAt?: string | null;
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
    branch?: string | null;
    branch_id?: number | null;
    kitchen?: string | Kitchen | null;
    kitchen_id?: number | null;
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
    branch?: string | Branch | null;
    branch_id?: number | null;
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
    branch_id?: number | null;
    branch?: Branch | null;
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
    covered_period_dates?: string[];
    covered_month_count?: number;
    payroll_run?: {
        id: number;
        status?: string;
        period_start?: string | null;
        period_end?: string | null;
        paid_at?: string | null;
        branch?: Branch | null;
    } | null;
    [key: string]: unknown;
}

export interface PayrollRun {
    id: number;
    branch_id?: number | null;
    branch?: Branch | null;
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
    branch_id?: number | null;
    branch?: Branch | null;
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
    branch_id?: number | null;
    branch?: Branch | null;
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
    branch_id: number;
    vendor_id?: number | null;
    title: string;
    expense_type?: string | null;
    expense_category_id?: number | null;
    expense_category?: ExpenseCategory | null;
    account_id?: number | null;
    account?: FinanceAccount | null;
    paid_from_account_id?: number | null;
    paid_from_account?: FinanceAccount | null;
    branch?: Branch | null;
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
    branch_id?: number | null;
    branch?: Branch | null;
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
    tables?: BranchTable[];
    is_active?: boolean;
    address: string;
    description: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface BranchTable {
    id: number;
    branch_id: number;
    branch?: Branch | null;
    table_number: string;
    title: string;
    description?: string | null;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Kitchen {
    id: number;
    name?: string;
    type?: string | null;
    kitchen_type?: string | null;
    kitchen_type_id?: number | null;
    cuisines?: Cuisine[];
    cuisines_label?: string | null;
    kitchen_categories?: KitchenCategory[];
    kitchen_categories_label?: string | null;
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

export interface KitchenType {
    id: number;
    name: string;
    description?: string | null;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Cuisine {
    id: number;
    name: string;
    description?: string | null;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface KitchenCategory {
    id: number;
    name: string;
    description?: string | null;
    is_active?: boolean;
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
    country?: Country | null;
    [key: string]: unknown;
}

export interface ProductCategory {
    id: number;
    name: string;
    pashto_name?: string | null;
    dari_name?: string | null;
    description?: string | null;
    pashto_description?: string | null;
    dari_description?: string | null;
    image_path?: string | null;
    image_url?: string | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface ProductType {
    id: number;
    name: string;
    pashto_name?: string | null;
    dari_name?: string | null;
    description?: string | null;
    pashto_description?: string | null;
    dari_description?: string | null;
    image_path?: string | null;
    image_url?: string | null;
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
    pashto_name?: string | null;
    dari_name?: string | null;
    description?: string | null;
    pashto_description?: string | null;
    dari_description?: string | null;
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
    branch_id: number;
    vendor_id?: number | null;
    unit_id?: number | null;
    category_id?: number | null;
    inventory_type_id?: number | null;
    branch?: Branch | null;
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

export interface OrderItem {
    id: number;
    order_id?: number;
    product_id: number;
    product_name?: string | null;
    product_name_snapshot?: string | null;
    product_size_id?: number | null;
    product_size_name?: string | null;
    product_size_name_snapshot?: string | null;
    kitchen_id?: number | null;
    prep_status?: 'pending' | 'in_progress' | 'ready' | 'delivered';
    quantity: number;
    price: number | string;
    line_total?: number | string;
    note?: string | null;
    started_at?: string | null;
    ready_at?: string | null;
    delivered_at?: string | null;
    prepared_by?: number | string | null;
    kitchen_receipt_printed_at?: string | null;
    product?: Product | null;
    product_size?: ProductSize | null;
    kitchen?: Kitchen | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Payment {
    id?: number;
    order_id?: number;
    currency?: string;
    amount?: number | string;
    exchange_rate?: number | string | null;
    method?: string;
    payment_date?: string | null;
    status?: string;
    reference_number?: string | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Customer {
    id: number;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface DiscountCard {
    id: number;
    name: string;
    code: string;
    discount_type: 'percentage' | 'fixed' | string;
    discount_value: number | string;
    max_discount_amount?: number | string | null;
    description?: string | null;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface Order {
    id: number;
    branch_id: number;
    branch_table_id?: number | null;
    user_id?: number | null;
    client_id?: number | null;
    customer_id?: number | null;
    covered_by_type?: 'customer' | 'employee' | 'house' | string | null;
    covered_by_employee_id?: number | null;
    covered_by_note?: string | null;
    discount_card_id?: number | null;
    user?: User | null;
    client?: {
        id: number;
        name?: string | null;
        email?: string | null;
        phone?: string | null;
        [key: string]: unknown;
    } | null;
    customer?: Customer | null;
    coveredByEmployee?: Employee | null;
    covered_by_employee?: Employee | null;
    discountCard?: DiscountCard | null;
    branch?: Branch | null;
    branch_table?: BranchTable | null;
    items?: OrderItem[];
    payments?: Payment[];
    items_count?: number;
    order_type: string;
    source?: string | null;
    customer_name?: string | null;
    customer_phone?: string | null;
    delivery_address?: string | null;
    customer_note?: string | null;
    base_currency?: string;
    exchange_rate?: number | null;
    sub_total_amount?: number | string;
    discount_amount?: number | string;
    discount_type?: string | null;
    discount_value?: number | string | null;
    discount_label?: string | null;
    total_amount: number | string;
    paid_amount: number | string;
    change_amount: number | string;
    status?: string;
    completed_at?: string | null;
    cancelled_at?: string | null;
    kitchen_names?: string[];
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}
