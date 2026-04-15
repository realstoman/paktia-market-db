'use client';

import { ReceiptPreviewDialog } from '@/components/tables/orders/receipt-preview-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { useAuthorization } from '@/lib/permissions';
import {
    BranchTable,
    BreadcrumbItem,
    Order,
    Product,
} from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    Armchair,
    Bike,
    CheckCircle2,
    Clock3,
    CookingPot,
    CreditCard,
    LayoutGrid,
    Minus,
    PackageCheck,
    Plus,
    ReceiptText,
    Search,
    ShoppingBag,
    Sparkles,
    Store,
    Truck,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type OperationMode = 'cashier' | 'server' | 'order-taker' | 'general';
type Channel = 'dine_in' | 'takeaway' | 'delivery';
type PaymentMethod = 'cash' | 'credit_card' | 'bank_transfer' | 'other';

interface CategoryOption {
    id: number;
    name: string;
}

interface TableCard extends Omit<BranchTable, 'branch'> {
    status: string;
    branch?: {
        id: number;
        name: string;
    } | null;
    active_order?: Order | null;
    elapsed_label?: string | null;
}

interface OperationsPageProps {
    mode: OperationMode;
    branchId: number | null;
    products: Product[];
    categories: CategoryOption[];
    tables: TableCard[];
    openOrders: Order[];
    summary: {
        dineInOpen: number;
        takeawayOpen: number;
        deliveryOpen: number;
        readyToPay: number;
    };
}

interface CartLine {
    productId: number;
    productSizeId: number | null;
    name: string;
    imageUrl?: string | null;
    price: number;
    quantity: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Card' },
    { value: 'bank_transfer', label: 'Bank' },
    { value: 'other', label: 'Other' },
];

const WORKSPACE_CARD_CLASS =
    'min-h-[760px] xl:h-[calc(100svh-7.5rem)] xl:min-h-[860px]';
const ORDER_TAKER_TOP_CARD_CLASS =
    'min-h-[560px] md:h-[calc(100svh-10rem)] md:min-h-[640px]';
const ORDER_TAKER_MENU_CARD_CLASS =
    'min-h-[560px] md:h-[calc(100svh-10rem)] md:min-h-[640px]';

const CHANNEL_META: Record<
    Channel,
    { label: string; icon: typeof Store; description: string }
> = {
    dine_in: {
        label: 'Dine In',
        icon: Store,
        description: 'Live tables and dine-in tickets.',
    },
    takeaway: {
        label: 'Takeaway',
        icon: ShoppingBag,
        description: 'Counter and pickup orders.',
    },
    delivery: {
        label: 'Delivery',
        icon: Truck,
        description: 'Delivery queue and customer drop-offs.',
    },
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
    }).format(value);
}

function naturalSortKey(value: string | number | null | undefined) {
    const normalized = String(value ?? '').trim();
    const numeric = Number.parseInt(normalized.replace(/\D+/g, ''), 10);

    return (
        `${Number.isNaN(numeric) ? 99999999 : numeric}`.padStart(8, '0') +
        `-${normalized}`
    );
}

function getStatusTone(status: string) {
    switch (status) {
        case 'ready':
            return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'completed':
            return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'in_progress':
            return 'bg-sky-100 text-sky-800 border-sky-200';
        case 'pending':
            return 'bg-rose-100 text-rose-800 border-rose-200';
        case 'empty':
            return 'bg-white text-neutral-600 border-neutral-200';
        default:
            return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
}

function resolveModeChannels(mode: OperationMode): Channel[] {
    if (mode === 'server') {
        return ['dine_in'];
    }

    if (mode === 'order-taker') {
        return ['dine_in', 'takeaway', 'delivery'];
    }

    return ['dine_in', 'takeaway', 'delivery'];
}

export default function OperationsPage({
    mode,
    branchId,
    products,
    categories,
    tables,
    openOrders,
    summary,
}: OperationsPageProps) {
    const { locale } = useLocalization();
    const { can } = useAuthorization();
    const isOrderTakerMode = mode === 'order-taker';
    const channels = useMemo(() => resolveModeChannels(mode), [mode]);
    const [selectedChannel, setSelectedChannel] = useState<Channel>(
        channels[0],
    );
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [cartLines, setCartLines] = useState<CartLine[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
    const [selectedReceiptOrder, setSelectedReceiptOrder] =
        useState<Order | null>(null);
    const [isCompletingPayment, setIsCompletingPayment] = useState(false);
    const workspaceRef = useRef<HTMLDivElement | null>(null);

    const localizedProductName = useCallback(
        (product?: Product | null) => {
            if (!product) {
                return '';
            }

            if (locale === 'ps') {
                return (
                    product.pashto_name?.trim() ||
                    product.dari_name?.trim() ||
                    product.name
                );
            }

            if (locale === 'fa') {
                return (
                    product.dari_name?.trim() ||
                    product.pashto_name?.trim() ||
                    product.name
                );
            }

            return product.name;
        },
        [locale],
    );

    const localizedProductDescription = useCallback(
        (product?: Product | null) => {
            if (!product) {
                return '';
            }

            if (locale === 'ps') {
                return (
                    product.pashto_description?.trim() ||
                    product.dari_description?.trim() ||
                    product.description?.trim() ||
                    product.category?.pashto_name?.trim() ||
                    product.category?.dari_name?.trim() ||
                    product.category?.name ||
                    ''
                );
            }

            if (locale === 'fa') {
                return (
                    product.dari_description?.trim() ||
                    product.pashto_description?.trim() ||
                    product.description?.trim() ||
                    product.category?.dari_name?.trim() ||
                    product.category?.pashto_name?.trim() ||
                    product.category?.name ||
                    ''
                );
            }

            return product.description?.trim() || product.category?.name || '';
        },
        [locale],
    );

    const selectedOrder = useMemo(
        () => openOrders.find((order) => order.id === selectedOrderId) ?? null,
        [openOrders, selectedOrderId],
    );

    const filteredOrders = useMemo(
        () =>
            openOrders.filter((order) => order.order_type === selectedChannel),
        [openOrders, selectedChannel],
    );

    const orderedTables = useMemo(
        () =>
            [...tables].sort((a, b) =>
                naturalSortKey(a.table_number).localeCompare(
                    naturalSortKey(b.table_number),
                ),
            ),
        [tables],
    );

    const filteredProducts = useMemo(() => {
        const lowered = search.trim().toLowerCase();

        return products.filter((product) => {
            const matchesCategory =
                selectedCategory === 'all'
                    ? true
                    : String(product.category?.id ?? '') === selectedCategory;
            const haystack = [
                localizedProductName(product),
                localizedProductDescription(product),
                product.name,
                product.pashto_name,
                product.dari_name,
                product.category?.name,
                product.category?.pashto_name,
                product.category?.dari_name,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            const matchesSearch = lowered ? haystack.includes(lowered) : true;

            return matchesCategory && matchesSearch;
        });
    }, [
        localizedProductDescription,
        localizedProductName,
        products,
        search,
        selectedCategory,
    ]);

    const selectedTable = useMemo(
        () => tables.find((table) => table.id === selectedTableId) ?? null,
        [tables, selectedTableId],
    );

    useEffect(() => {
        setSelectedChannel(channels[0]);
    }, [channels]);

    useEffect(() => {
        if (selectedChannel !== 'dine_in') {
            setSelectedTableId(null);
        }
    }, [selectedChannel]);

    useEffect(() => {
        if (!selectedOrder) {
            return;
        }

        setCartLines(
            (selectedOrder.items ?? []).map((item) => ({
                productId: item.product_id,
                productSizeId: item.product_size_id ?? null,
                name:
                    localizedProductName(item.product) ??
                    item.product_name_snapshot ??
                    item.product_name ??
                    'Item',
                imageUrl: item.product?.images?.[0]?.url ?? null,
                price: Number(item.price ?? 0),
                quantity: Number(item.quantity ?? 0),
            })),
        );
        setCustomerName(selectedOrder.customer_name ?? '');
        setCustomerPhone(selectedOrder.customer_phone ?? '');
        setDeliveryAddress(selectedOrder.delivery_address ?? '');
    }, [localizedProductName, selectedOrder]);

    useEffect(() => {
        workspaceRef.current?.scrollIntoView({
            block: 'start',
            behavior: 'auto',
        });
    }, []);

    const resetComposer = (channel: Channel) => {
        setSelectedChannel(channel);
        setSelectedOrderId(null);
        setSelectedTableId(null);
        setCartLines([]);
        setCustomerName('');
        setCustomerPhone('');
        setDeliveryAddress('');
    };

    const handleTableSelect = (table: TableCard) => {
        setSelectedChannel('dine_in');
        setSelectedTableId(table.id);

        if (table.active_order) {
            setSelectedOrderId(table.active_order.id);
            return;
        }

        setSelectedOrderId(null);
        setCartLines([]);
        setCustomerName('');
        setCustomerPhone('');
        setDeliveryAddress('');
    };

    const handleOrderSelect = (order: Order) => {
        setSelectedOrderId(order.id);
        if (order.order_type === 'dine_in') {
            setSelectedTableId(order.branch_table_id ?? null);
        }
        setSelectedChannel(order.order_type as Channel);
    };

    const adjustQuantity = (product: Product, delta: number) => {
        const basePrice = Number(product.base_price ?? 0);

        setCartLines((current) => {
            const existing = current.find(
                (line) =>
                    line.productId === product.id &&
                    line.productSizeId === null,
            );

            if (!existing && delta < 0) {
                return current;
            }

            if (!existing) {
                return [
                    ...current,
                    {
                        productId: product.id,
                        productSizeId: null,
                        name: localizedProductName(product),
                        imageUrl: product.images?.[0]?.url ?? null,
                        price: basePrice,
                        quantity: 1,
                    },
                ];
            }

            return current
                .map((line) =>
                    line.productId === product.id && line.productSizeId === null
                        ? {
                              ...line,
                              quantity: Math.max(0, line.quantity + delta),
                          }
                        : line,
                )
                .filter((line) => line.quantity > 0);
        });
    };

    const totalQuantity = cartLines.reduce(
        (sum, line) => sum + line.quantity,
        0,
    );
    const subTotal = cartLines.reduce(
        (sum, line) => sum + line.quantity * line.price,
        0,
    );
    const tax = 0;
    const total = subTotal + tax;
    const canTakePayment = can('payments.create') && mode === 'cashier';
    const canManageStatus = can('orders.update');

    const submitOrder = () => {
        if (!branchId) {
            toast.error('Assign a branch to this user before taking orders.');
            return;
        }

        if (selectedChannel === 'dine_in' && !selectedTableId) {
            toast.error('Select a table first.');
            return;
        }

        if (
            selectedChannel === 'delivery' &&
            !deliveryAddress.trim()
        ) {
            toast.error(
                'Delivery orders need an address before the ticket can be saved.',
            );
            return;
        }

        if (selectedChannel === 'takeaway' || selectedChannel === 'delivery') {
            if (customerName.trim().length > 255) {
                toast.error('Customer name is too long.');
                return;
            }

            if (customerPhone.trim().length > 50) {
                toast.error('Customer phone is too long.');
                return;
            }
        }

        if (cartLines.length === 0) {
            toast.error('Add at least one product to the order.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            branch_id: branchId,
            branch_table_id:
                selectedChannel === 'dine_in' ? selectedTableId : null,
            order_type: selectedChannel,
            payment_method: null,
            customer_name:
                selectedChannel === 'delivery' || selectedChannel === 'takeaway'
                    ? customerName || null
                    : null,
            customer_phone:
                selectedChannel === 'delivery' || selectedChannel === 'takeaway'
                    ? customerPhone || null
                    : null,
            delivery_address:
                selectedChannel === 'delivery' ? deliveryAddress || null : null,
            items: cartLines.map((line) => ({
                product_id: line.productId,
                product_size_id: line.productSizeId,
                quantity: line.quantity,
                price: line.price,
            })),
        };

        const options = {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success(
                    selectedOrder ? 'Order updated.' : 'Order created.',
                );
            },
            onError: () => {
                toast.error('Unable to save the order.');
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        };

        if (selectedOrder) {
            router.put(`/orders/${selectedOrder.id}`, payload, options);
            return;
        }

        router.post('/orders', payload, options);
    };

    const updateStatus = (status: 'in_progress' | 'ready') => {
        if (!selectedOrder) {
            toast.error('Save the order first.');
            return;
        }

        setIsSubmitting(true);

        router.patch(
            `/orders/${selectedOrder.id}/status`,
            {
                status,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success('Order status updated.');
                },
                onError: () => {
                    toast.error('Unable to update order status.');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const openPaymentFlow = (order: Order) => {
        setSelectedReceiptOrder(order);
        setPaymentMethod(
            (order.payments?.[0]?.method as PaymentMethod | undefined) ??
                paymentMethod,
        );
        setIsReceiptPreviewOpen(true);
    };

    const handleCollectPayment = () => {
        if (!selectedOrder) {
            toast.error('Save the order first.');
            return;
        }

        const currentStatus = selectedOrder.status ?? 'pending';

        if (currentStatus === 'ready' || currentStatus === 'completed') {
            openPaymentFlow(selectedOrder);
            return;
        }

        setIsSubmitting(true);

        router.patch(
            `/orders/${selectedOrder.id}/status`,
            { status: 'ready' },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success('Order marked ready for payment.');
                    openPaymentFlow({
                        ...selectedOrder,
                        status: 'ready',
                    });
                },
                onError: () => {
                    toast.error('Unable to prepare the order for payment.');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleCompletePayment = (
        order: Order,
        payload: { discountAmount: number; paymentMethod: string },
    ) => {
        const subtotal = Number(
            order.sub_total_amount ?? order.total_amount ?? 0,
        );
        const finalTotal = Math.max(0, subtotal - payload.discountAmount);

        setIsCompletingPayment(true);

        router.patch(
            `/orders/${order.id}/status`,
            {
                status: 'completed',
                payment_method: payload.paymentMethod,
                discount_amount: payload.discountAmount,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success(
                        'Payment collected, finance updated, and order completed.',
                    );
                    setSelectedReceiptOrder({
                        ...order,
                        status: 'completed',
                        discount_amount: payload.discountAmount,
                        total_amount: finalTotal,
                        paid_amount: finalTotal,
                        payments: [
                            {
                                ...(order.payments?.[0] ?? {}),
                                method: payload.paymentMethod,
                                amount: finalTotal,
                                status: 'paid',
                            },
                        ],
                    });
                },
                onError: (errors) => {
                    toast.error(
                        Object.values(errors)[0] ??
                            'Unable to complete the payment.',
                    );
                },
                onFinish: () => {
                    setIsCompletingPayment(false);
                },
            },
        );
    };

    const pageTitle =
        mode === 'cashier'
            ? 'Cashier POS'
            : mode === 'server'
              ? 'Floor Service'
              : 'Order Intake';
    const workspaceGridClass = isOrderTakerMode
        ? 'grid gap-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]'
        : 'grid gap-4 xl:grid-cols-[1.2fr_1.6fr_1fr]';
    const tablesCardClass = isOrderTakerMode
        ? ORDER_TAKER_TOP_CARD_CLASS
        : WORKSPACE_CARD_CLASS;
    const menuCardClass = isOrderTakerMode
        ? `${ORDER_TAKER_MENU_CARD_CLASS} md:order-3 md:col-span-2`
        : WORKSPACE_CARD_CLASS;
    const invoiceCardClass = isOrderTakerMode
        ? `${ORDER_TAKER_TOP_CARD_CLASS} md:order-2`
        : WORKSPACE_CARD_CLASS;

    return (
        <AppLayout breadcrumbs={breadcrumbs} defaultSidebarOpen={false}>
            <Head title={pageTitle} />
            <div className="space-y-4 py-2">
                {isOrderTakerMode ? null : (
                    <section className="overflow-hidden rounded-[2rem] border border-[#eadfd2] bg-[linear-gradient(135deg,#fffdf8_0%,#f5f0e5_52%,#efe8db_100%)] p-5 shadow-none">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#d8c6b3] bg-white/80 px-3 py-1 text-sm text-[#6e4e2d]">
                                    <ReceiptText className="h-4 w-4" />
                                    {pageTitle}
                                </div>
                                <div>
                                    <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#2f1d0f]">
                                        Operations dashboard for live orders
                                    </h1>
                                    <p className="max-w-3xl text-sm leading-6 text-[#6a5848]">
                                        Tables, takeaway, delivery, and payment handling stay in one workspace. The visible channels and actions adapt automatically to the signed-in role.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <Card className="border-white/70 bg-white/80 shadow-none">
                                    <CardContent className="p-4">
                                        <p className="text-xs tracking-[0.2em] text-[#8b7560] uppercase">
                                            Dine In
                                        </p>
                                        <p className="mt-2 text-3xl font-semibold text-[#2f1d0f]">
                                            {summary.dineInOpen}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="border-white/70 bg-white/80 shadow-none">
                                    <CardContent className="p-4">
                                        <p className="text-xs tracking-[0.2em] text-[#8b7560] uppercase">
                                            Takeaway
                                        </p>
                                        <p className="mt-2 text-3xl font-semibold text-[#2f1d0f]">
                                            {summary.takeawayOpen}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="border-white/70 bg-white/80 shadow-none">
                                    <CardContent className="p-4">
                                        <p className="text-xs tracking-[0.2em] text-[#8b7560] uppercase">
                                            Delivery
                                        </p>
                                        <p className="mt-2 text-3xl font-semibold text-[#2f1d0f]">
                                            {summary.deliveryOpen}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="border-white/70 bg-white/80 shadow-none">
                                    <CardContent className="p-4">
                                        <p className="text-xs tracking-[0.2em] text-[#8b7560] uppercase">
                                            Ready To Pay
                                        </p>
                                        <p className="mt-2 text-3xl font-semibold text-[#2f1d0f]">
                                            {summary.readyToPay}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </section>
                )}

                <div
                    ref={workspaceRef}
                    className={workspaceGridClass}
                >
                    <Card
                        className={`${tablesCardClass} flex flex-col border-neutral-200/70 shadow-none ${isOrderTakerMode ? 'md:order-1' : ''}`}
                    >
                        <CardHeader className="pb-4">
                            <div className="flex flex-wrap gap-2">
                                {channels.map((channel) => {
                                    const meta = CHANNEL_META[channel];
                                    const Icon = meta.icon;

                                    return (
                                        <Button
                                            key={channel}
                                            variant={
                                                selectedChannel === channel
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            className="gap-2 rounded-full"
                                            onClick={() =>
                                                resetComposer(channel)
                                            }
                                        >
                                            <Icon className="h-4 w-4" />
                                            {meta.label}
                                        </Button>
                                    );
                                })}
                            </div>
                            <div>
                                <CardTitle className="text-xl">
                                    {CHANNEL_META[selectedChannel].label}
                                </CardTitle>
                                <CardDescription>
                                    {isOrderTakerMode &&
                                    selectedChannel === 'dine_in'
                                        ? 'Tap a table to open the ticket, then add items from the menu.'
                                        : CHANNEL_META[selectedChannel]
                                              .description}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="min-h-0 flex-1 p-0">
                            {selectedChannel === 'dine_in' ? (
                                <ScrollArea className="h-full px-4 pb-0">
                                    <div
                                        className="grid grid-cols-2 gap-3"
                                    >
                                        {orderedTables.map((table) => (
                                            <button
                                                key={table.id}
                                                type="button"
                                                onClick={() =>
                                                    handleTableSelect(table)
                                                }
                                                className={`rounded-[1.4rem] border text-left transition ${isOrderTakerMode ? 'min-h-[180px] p-5' : 'p-4'} ${selectedTableId === table.id ? 'border-[#b5542a] bg-[#fff7ef]' : 'border-neutral-200 bg-[#fcfbf8] hover:border-[#d4b8a3]'} ${table.active_order ? 'shadow-[0_12px_30px_rgba(181,84,42,0.10)]' : ''}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className={`inline-flex items-center justify-center rounded-full bg-white font-semibold text-[#2f1d0f] shadow-sm ${isOrderTakerMode ? 'h-14 w-14 text-xl' : 'h-12 w-12 text-lg'}`}>
                                                        T-{table.table_number}
                                                    </div>
                                                    <Badge
                                                        className={`border ${getStatusTone(table.status)}`}
                                                    >
                                                        {table.status.replace(
                                                            '_',
                                                            ' ',
                                                        )}
                                                    </Badge>
                                                </div>
                                                {table.active_order ? (
                                                    <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#fff1e7] px-2.5 py-1 text-[11px] font-medium text-[#b5542a]">
                                                        <Sparkles className="h-3.5 w-3.5" />
                                                        Serving
                                                    </div>
                                                ) : null}
                                                <div className="mt-4 space-y-1.5">
                                                    <p className={`${isOrderTakerMode ? 'text-base' : 'text-sm'} font-medium text-[#2f1d0f]`}>
                                                        {table.active_order
                                                            ? `Order #${table.active_order.id}`
                                                            : 'Open a new table ticket'}
                                                    </p>
                                                    <p className={`${isOrderTakerMode ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
                                                        {table.elapsed_label
                                                            ? `${table.elapsed_label} active`
                                                            : 'No active order yet'}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <ScrollArea className="h-full px-4 pb-4">
                                    <div className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-2 rounded-2xl border-dashed"
                                            onClick={() =>
                                                resetComposer(selectedChannel)
                                            }
                                        >
                                            <Plus className="h-4 w-4" />
                                            New{' '}
                                            {
                                                CHANNEL_META[selectedChannel]
                                                    .label
                                            }{' '}
                                            order
                                        </Button>

                                        {filteredOrders.map((order) => (
                                            <button
                                                key={order.id}
                                                type="button"
                                                onClick={() =>
                                                    handleOrderSelect(order)
                                                }
                                                className={`w-full rounded-[1.2rem] border p-4 text-left transition ${selectedOrderId === order.id ? 'border-[#b5542a] bg-[#fff7ef]' : 'border-neutral-200 bg-white hover:border-[#d4b8a3]'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-semibold text-[#2f1d0f]">
                                                            Order #{order.id}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {order.customer_name ||
                                                                'Walk-in customer'}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        className={`border ${getStatusTone(String(order.status ?? 'pending'))}`}
                                                    >
                                                        {String(
                                                            order.status ??
                                                                'pending',
                                                        ).replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>
                                                        {order.items?.length ??
                                                            0}{' '}
                                                        items
                                                    </span>
                                                    <span>
                                                        {formatCurrency(
                                                            Number(
                                                                order.total_amount ??
                                                                    0,
                                                            ),
                                                        )}{' '}
                                                        ؋
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>

                    <Card
                        className={`${menuCardClass} flex flex-col border-neutral-200/70 shadow-none`}
                    >
                        <CardHeader className="space-y-4">
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search products, categories, or menu items"
                                    className="h-12 rounded-2xl pl-9"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant={
                                        selectedCategory === 'all'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    className="rounded-full"
                                    onClick={() => setSelectedCategory('all')}
                                >
                                    All Menu
                                </Button>
                                {categories.map((category) => (
                                    <Button
                                        key={category.id}
                                        variant={
                                            selectedCategory ===
                                            String(category.id)
                                                ? 'default'
                                                : 'outline'
                                        }
                                        className="rounded-full"
                                        onClick={() =>
                                            setSelectedCategory(
                                                String(category.id),
                                            )
                                        }
                                    >
                                        {category.name}
                                    </Button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent className="min-h-0 flex-1 p-0">
                            <ScrollArea className="h-full px-4 pb-0">
                                <div
                                    className={`grid gap-3 ${isOrderTakerMode ? 'grid-cols-2' : 'md:grid-cols-2'}`}
                                >
                                    {filteredProducts.map((product) => {
                                        const line = cartLines.find(
                                            (entry) =>
                                                entry.productId === product.id,
                                        );

                                        return (
                                            <div
                                                key={product.id}
                                                className="h-[170px] overflow-hidden rounded-[1.4rem] border border-neutral-200 bg-white"
                                            >
                                                <div className="grid h-full grid-cols-[minmax(108px,1.1fr)_minmax(0,1.6fr)]">
                                                    <div className="h-full overflow-hidden bg-[#f3eee7]">
                                                        {product.images?.[0]
                                                            ?.url ? (
                                                            <img
                                                                src={
                                                                    product
                                                                        .images[0]
                                                                        .url
                                                                }
                                                                alt={localizedProductName(
                                                                    product,
                                                                )}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-[#8b7560]">
                                                                <CookingPot className="h-6 w-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex min-w-0 flex-col justify-between p-4">
                                                        <div className="min-w-0">
                                                            <p className="line-clamp-2 text-base leading-6 font-semibold text-[#2f1d0f]">
                                                                {localizedProductName(
                                                                    product,
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="mt-4 space-y-3">
                                                            <p className="text-2xl leading-none font-semibold text-[#2f1d0f]">
                                                                {formatCurrency(
                                                                    Number(
                                                                        product.base_price ??
                                                                            0,
                                                                    ),
                                                                )}
                                                                <span className="ml-1 text-sm font-medium text-[#8b7560]">
                                                                    ؋
                                                                </span>
                                                            </p>
                                                            <div className="flex items-center justify-between gap-3">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-6 w-6 shrink-0 rounded-full"
                                                                    onClick={() =>
                                                                        adjustQuantity(
                                                                            product,
                                                                            -1,
                                                                        )
                                                                    }
                                                                >
                                                                    <Minus className="h-4 w-4" />
                                                                </Button>
                                                                <span className="min-w-6 text-center text-sm font-medium">
                                                                    {line?.quantity ??
                                                                        0}
                                                                </span>
                                                                <Button
                                                                    size="icon"
                                                                    className="h-6 w-6 shrink-0 rounded-full"
                                                                    onClick={() =>
                                                                        adjustQuantity(
                                                                            product,
                                                                            1,
                                                                        )
                                                                    }
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {filteredProducts.length === 0 ? (
                                        <div className="col-span-full flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-[1.4rem] border border-dashed border-neutral-300 bg-[#fcfbf8] p-6 text-center text-muted-foreground">
                                            <CookingPot className="h-6 w-6" />
                                            <p className="text-sm">
                                                No products matched this branch,
                                                category, or search yet.
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <Card
                        className={`${invoiceCardClass} flex flex-col overflow-hidden border-neutral-200/70 shadow-none`}
                    >
                        <CardHeader className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl">
                                        {isOrderTakerMode
                                            ? 'Open Ticket'
                                            : 'Invoice'}
                                    </CardTitle>
                                    <CardDescription>
                                        {selectedOrder
                                            ? `Editing order #${selectedOrder.id}`
                                            : isOrderTakerMode
                                              ? 'Select a table and build the ticket.'
                                              : 'Build a new order ticket'}
                                    </CardDescription>
                                </div>
                                {selectedChannel === 'dine_in' &&
                                selectedTable ? (
                                    <Badge
                                        variant="outline"
                                        className="gap-1 rounded-full"
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                        Table {selectedTable.table_number}
                                    </Badge>
                                ) : null}
                            </div>

                            {selectedChannel !== 'dine_in' ? (
                                <div className="grid gap-3">
                                    <div className="grid gap-2">
                                        <Label htmlFor="customer-name">
                                            Customer
                                        </Label>
                                        <Input
                                            id="customer-name"
                                            value={customerName}
                                            onChange={(event) =>
                                                setCustomerName(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Customer name (optional)"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="customer-phone">
                                            Phone
                                        </Label>
                                        <Input
                                            id="customer-phone"
                                            value={customerPhone}
                                            onChange={(event) =>
                                                setCustomerPhone(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Phone number (optional)"
                                        />
                                    </div>
                                    {selectedChannel === 'delivery' ? (
                                        <div className="grid gap-2">
                                            <Label htmlFor="delivery-address">
                                                Address
                                            </Label>
                                            <Input
                                                id="delivery-address"
                                                value={deliveryAddress}
                                                onChange={(event) =>
                                                    setDeliveryAddress(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Delivery address"
                                                required
                                            />
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </CardHeader>
                        <CardContent
                            className={`flex min-h-0 flex-1 flex-col gap-4 ${isOrderTakerMode ? 'overflow-y-auto pr-1' : ''}`}
                        >
                            <div className="min-h-[160px] shrink-0 rounded-2xl border border-neutral-200 px-3 py-3">
                                <div className="space-y-3">
                                    {cartLines.map((line) => (
                                        <div
                                            key={`${line.productId}-${line.productSizeId ?? 'base'}`}
                                            className="flex items-center gap-3 rounded-2xl bg-[#f8f5ef] p-3"
                                        >
                                            <div className="h-14 w-14 overflow-hidden rounded-xl bg-white">
                                                {line.imageUrl ? (
                                                    <img
                                                        src={line.imageUrl}
                                                        alt={line.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-[#8b7560]">
                                                        <CookingPot className="h-5 w-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-[#2f1d0f]">
                                                    {line.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {line.quantity} x{' '}
                                                    {formatCurrency(line.price)}{' '}
                                                    ؋
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-[#2f1d0f]">
                                                    {formatCurrency(
                                                        line.quantity *
                                                            line.price,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {cartLines.length === 0 ? (
                                        <div
                                            className={`flex flex-col items-center justify-center gap-2 text-center text-muted-foreground ${isOrderTakerMode ? 'min-h-[140px]' : 'min-h-[220px]'}`}
                                        >
                                            <Armchair className="h-6 w-6" />
                                            <p className="text-sm">
                                                {isOrderTakerMode
                                                    ? 'Choose a table, then tap menu items to start the order.'
                                                    : 'Select a table or queue item, then add products from the menu.'}
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="rounded-[1.4rem] border border-neutral-200 bg-[#fcfbf8] p-4">
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            Items
                                        </span>
                                        <span>{totalQuantity}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            Subtotal
                                        </span>
                                        <span>
                                            {formatCurrency(subTotal)} ؋
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            Tax
                                        </span>
                                        <span>{formatCurrency(tax)} ؋</span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-dashed pt-3 text-base font-semibold text-[#2f1d0f]">
                                        <span>Total</span>
                                        <span>{formatCurrency(total)} ؋</span>
                                    </div>
                                </div>
                            </div>

                            {canTakePayment ? (
                                <div className="space-y-2">
                                    <Label>Payment Method</Label>
                                    <Select
                                        value={paymentMethod}
                                        onValueChange={(value: PaymentMethod) =>
                                            setPaymentMethod(value)
                                        }
                                    >
                                        <SelectTrigger className="rounded-2xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_METHODS.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : null}

                            <div
                                className={`shrink-0 grid gap-2 ${isOrderTakerMode ? 'min-h-[120px]' : 'min-h-[146px]'}`}
                            >
                                <Button
                                    className={`rounded-2xl text-base ${isOrderTakerMode ? 'h-14' : 'h-12'}`}
                                    disabled={isSubmitting}
                                    onClick={submitOrder}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    {selectedOrder
                                        ? isOrderTakerMode
                                            ? 'Update ticket'
                                            : 'Update order'
                                        : isOrderTakerMode
                                          ? 'Save ticket'
                                          : 'Save order'}
                                </Button>

                                {selectedOrder && canManageStatus ? (
                                    <div
                                        className={`grid gap-2 ${isOrderTakerMode ? 'grid-cols-1' : 'sm:grid-cols-2'}`}
                                    >
                                        <Button
                                            variant="outline"
                                            className="rounded-2xl"
                                            disabled={isSubmitting}
                                            onClick={() =>
                                                updateStatus('in_progress')
                                            }
                                        >
                                            <Clock3 className="mr-2 h-4 w-4" />
                                            Preparing
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="rounded-2xl"
                                            disabled={isSubmitting}
                                            onClick={() =>
                                                updateStatus('ready')
                                            }
                                        >
                                            <PackageCheck className="mr-2 h-4 w-4" />
                                            {isOrderTakerMode
                                                ? 'Mark ready'
                                                : 'Ready'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div
                                        className={`grid gap-2 ${isOrderTakerMode ? 'grid-cols-1' : 'sm:grid-cols-2'}`}
                                    >
                                        <Button
                                            variant="outline"
                                            className="rounded-2xl"
                                            disabled
                                        >
                                            <Clock3 className="mr-2 h-4 w-4" />
                                            Preparing
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="rounded-2xl"
                                            disabled
                                        >
                                            <PackageCheck className="mr-2 h-4 w-4" />
                                            {isOrderTakerMode
                                                ? 'Mark ready'
                                                : 'Ready'}
                                        </Button>
                                    </div>
                                )}

                                {canTakePayment ? (
                                    <Button
                                        className="h-12 rounded-2xl bg-[#b5542a] text-base hover:bg-[#9f4722]"
                                        disabled={
                                            !selectedOrder || isSubmitting
                                        }
                                        onClick={handleCollectPayment}
                                    >
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Collect payment
                                    </Button>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {isOrderTakerMode ? null : (
                    <div className="grid gap-3 md:grid-cols-3">
                        <Card className="border-neutral-200/70 shadow-none">
                            <CardContent className="flex items-center gap-3 p-4">
                                <Store className="h-8 w-8 text-[#b5542a]" />
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Tables with live tickets
                                    </p>
                                    <p className="text-2xl font-semibold text-[#2f1d0f]">
                                        {
                                            tables.filter(
                                                (table) => table.active_order,
                                            ).length
                                        }
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-neutral-200/70 shadow-none">
                            <CardContent className="flex items-center gap-3 p-4">
                                <Bike className="h-8 w-8 text-[#b5542a]" />
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Active delivery queue
                                    </p>
                                    <p className="text-2xl font-semibold text-[#2f1d0f]">
                                        {
                                            openOrders.filter(
                                                (order) =>
                                                    order.order_type ===
                                                    'delivery',
                                            ).length
                                        }
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-neutral-200/70 shadow-none">
                            <CardContent className="flex items-center gap-3 p-4">
                                <CheckCircle2 className="h-8 w-8 text-[#b5542a]" />
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Orders ready for checkout
                                    </p>
                                    <p className="text-2xl font-semibold text-[#2f1d0f]">
                                        {summary.readyToPay}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <ReceiptPreviewDialog
                    key={`${selectedReceiptOrder?.id ?? 'receipt'}-${selectedReceiptOrder?.discount_amount ?? 0}-${isReceiptPreviewOpen ? 'open' : 'closed'}`}
                    order={selectedReceiptOrder}
                    open={isReceiptPreviewOpen}
                    onOpenChange={setIsReceiptPreviewOpen}
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={(value) =>
                        setPaymentMethod(value as PaymentMethod)
                    }
                    onCompletePayment={handleCompletePayment}
                    isCompletingPayment={isCompletingPayment}
                />
            </div>
        </AppLayout>
    );
}
