import InputError from '@/components/input-error';
import Heading from '@/components/shared/heading';
import { NumericInput } from '@/components/shared/numeric-input';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import { Textarea } from '@/components/ui/textarea';
import { useLocalization } from '@/lib/localization';
import { Branch, BranchTable, Order, Product, SharedData } from '@/types';
import { formatAfn, formatNumber } from '@/utils/format';
import { router, usePage } from '@inertiajs/react';
import {
    ClipboardList,
    Plus,
    Printer,
    Save,
    ShoppingBag,
    Trash2,
    X,
} from 'lucide-react';
import {
    type Dispatch,
    type SetStateAction,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';
import { OrderRowActions } from './row-actions';
import { ReceiptPreviewDialog } from './receipt-preview-dialog';

interface OrderItemDraft {
    productId: string;
    sizeId: string;
    quantity: string;
    price: string;
}

interface OrdersClientProps {
    data: Order[];
    branches: Branch[];
    products: Product[];
    branchTables: BranchTable[];
    isLoading?: boolean;
}

const ORDER_STATUSES = [
    'pending',
    'in_progress',
    'ready',
    'completed',
    'cancelled',
];

const ORDER_TYPE_OPTIONS = ['dine_in', 'takeaway', 'delivery'] as const;

const emptyItem = (): OrderItemDraft => ({
    productId: '',
    sizeId: '',
    quantity: '1',
    price: '',
});

export const OrdersClient: React.FC<OrdersClientProps> = ({
    data,
    branches,
    products,
    branchTables,
    isLoading = false,
}) => {
    const { auth } = usePage<SharedData>().props;
    const { t, locale } = useLocalization();
    const localizedProductName = (product?: Product | null) => {
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
    };
    const dateLocale = useMemo(() => {
        if (locale === 'fa') {
            return 'fa-AF';
        }

        if (locale === 'ps') {
            return 'ps-AF';
        }

        return 'en-US';
    }, [locale]);
    const canChangeBranch = auth.is_super_admin === true;
    const defaultBranchId = useMemo(() => {
        const assignedBranchId = auth.user?.branch_id;
        if (assignedBranchId) {
            const matchingBranch = branches.find(
                (branch) => branch.id === assignedBranchId,
            );
            if (matchingBranch) {
                return String(matchingBranch.id);
            }
        }

        return branches.length === 1 ? String(branches[0].id) : '';
    }, [auth.user?.branch_id, branches]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAddItemsOpen, setIsAddItemsOpen] = useState(false);
    const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
    const [isCompletingPayment, setIsCompletingPayment] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [branchId, setBranchId] = useState(defaultBranchId);
    const [branchTableId, setBranchTableId] = useState('');
    const [orderType, setOrderType] = useState('dine_in');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [items, setItems] = useState<OrderItemDraft[]>([emptyItem()]);
    const [addItems, setAddItems] = useState<OrderItemDraft[]>([emptyItem()]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedReceiptOrder, setSelectedReceiptOrder] =
        useState<Order | null>(null);
    const [mobileActionOrder, setMobileActionOrder] = useState<Order | null>(
        null,
    );
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [addItemErrors, setAddItemErrors] = useState<Record<string, string>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [branchFilter, setBranchFilter] = useState('all');
    const [userFilter, setUserFilter] = useState('all');
    const [orderTypeFilter, setOrderTypeFilter] = useState('all');
    const [kitchenFilter, setKitchenFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const isOrderTaker = auth.roles.includes('order-taker');
    const [isCompactViewport, setIsCompactViewport] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const media = window.matchMedia('(max-width: 1023px)');
        const syncViewport = () => setIsCompactViewport(media.matches);

        syncViewport();
        media.addEventListener('change', syncViewport);

        return () => media.removeEventListener('change', syncViewport);
    }, []);

    const getStatusLabel = (status: string) =>
        t(`orders.status.${status}`, status);
    const getPaymentMethodLabel = (paymentMethodValue: string) =>
        t(`orders.paymentMethod.${paymentMethodValue}`, paymentMethodValue);
    const getOrderTypeLabel = (orderTypeValue: string) =>
        t(`orders.orderType.${orderTypeValue}`, orderTypeValue);
    const getSourceLabel = (sourceValue: string) =>
        t(
            `orders.source.${sourceValue}`,
            sourceValue === 'mobile_app' ? 'Mobile' : 'POS',
        );

    const paymentMethodOptions = [
        { value: 'cash', label: getPaymentMethodLabel('cash') },
        {
            value: 'bank_transfer',
            label: getPaymentMethodLabel('bank_transfer'),
        },
        { value: 'credit_card', label: getPaymentMethodLabel('credit_card') },
        { value: 'other', label: getPaymentMethodLabel('other') },
    ];

    const resetCreateForm = () => {
        setEditingOrder(null);
        setBranchId(defaultBranchId);
        setBranchTableId('');
        setOrderType('dine_in');
        setPaymentMethod('cash');
        setCustomerName('');
        setCustomerPhone('');
        setDeliveryAddress('');
        setItems([emptyItem()]);
        setCreateErrors({});
    };

    const resetAddItemsForm = () => {
        setAddItems([emptyItem()]);
        setAddItemErrors({});
    };

    const getProductById = (productId: string) =>
        products.find((product) => String(product.id) === productId);

    const getItemKitchenName = (item: OrderItemDraft) => {
        const product = getProductById(item.productId);
        return (
            product?.kitchen?.name ??
            t('orders.detailsModal.unassigned', 'Unassigned')
        );
    };

    const handleProductChange = (
        setter: Dispatch<SetStateAction<OrderItemDraft[]>>,
        sourceItems: OrderItemDraft[],
        index: number,
        productId: string,
    ) => {
        const product = getProductById(productId);
        setter(
            sourceItems.map((item, idx) =>
                idx === index
                    ? {
                          ...item,
                          productId,
                          sizeId: '',
                          price:
                              product?.base_price !== undefined
                                  ? String(product.base_price)
                                  : '',
                      }
                    : item,
            ),
        );
    };

    const handleSizeChange = (
        setter: Dispatch<SetStateAction<OrderItemDraft[]>>,
        sourceItems: OrderItemDraft[],
        index: number,
        sizeId: string,
    ) => {
        const product = getProductById(sourceItems[index].productId);
        const size = product?.sizes?.find(
            (sizeOption) => String(sizeOption.id) === sizeId,
        );
        const priceFromSize =
            size?.pivot?.price !== undefined ? String(size.pivot.price) : '';

        setter(
            sourceItems.map((item, idx) =>
                idx === index
                    ? {
                          ...item,
                          sizeId,
                          price: priceFromSize || item.price,
                      }
                    : item,
            ),
        );
    };

    const handleItemChange = (
        setter: Dispatch<SetStateAction<OrderItemDraft[]>>,
        sourceItems: OrderItemDraft[],
        index: number,
        field: keyof OrderItemDraft,
        value: string,
    ) => {
        setter(
            sourceItems.map((item, idx) =>
                idx === index
                    ? {
                          ...item,
                          [field]: value,
                      }
                    : item,
            ),
        );
    };

    const addDraftItem = (
        setter: Dispatch<SetStateAction<OrderItemDraft[]>>,
    ) => {
        setter((prev) => [...prev, emptyItem()]);
    };

    const removeDraftItem = (
        setter: Dispatch<SetStateAction<OrderItemDraft[]>>,
        index: number,
    ) => {
        setter((prev) => prev.filter((_, idx) => idx !== index));
    };

    const buildPayloadItems = (sourceItems: OrderItemDraft[]) =>
        sourceItems
            .filter((item) => item.productId && item.quantity && item.price)
            .map((item) => ({
                product_id: Number(item.productId),
                product_size_id: item.sizeId ? Number(item.sizeId) : null,
                quantity: Number(item.quantity),
                price: Number(item.price),
            }));

    const createTotal = items.reduce((total, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return total + price * quantity;
    }, 0);

    const addItemsTotal = addItems.reduce((total, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return total + price * quantity;
    }, 0);

    const handleCreateSubmit = () => {
        if (
            !branchId ||
            items.length === 0 ||
            (orderType === 'dine_in' && !branchTableId) ||
            (orderType === 'delivery' &&
                (!customerName.trim() ||
                    !customerPhone.trim() ||
                    !deliveryAddress.trim())) ||
            isSubmitting
        ) {
            return;
        }

        const payloadItems = buildPayloadItems(items);
        if (payloadItems.length === 0) {
            return;
        }

        setIsSubmitting(true);

        const payload = {
            branch_id: Number(branchId),
            order_type: orderType,
            branch_table_id:
                orderType === 'dine_in' ? Number(branchTableId) : null,
            payment_method: paymentMethod,
            customer_name:
                orderType === 'delivery' ? customerName.trim() : null,
            customer_phone:
                orderType === 'delivery' ? customerPhone.trim() : null,
            delivery_address:
                orderType === 'delivery' ? deliveryAddress.trim() : null,
            items: payloadItems,
        };

        const url = editingOrder ? `/orders/${editingOrder.id}` : '/orders';
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    editingOrder
                        ? t(
                              'orders.messages.orderUpdated',
                              'Order updated successfully.',
                          )
                        : t(
                              'orders.messages.orderCreated',
                              'Order created successfully.',
                          ),
                );
                setIsCreateOpen(false);
                resetCreateForm();
            },
            onError: (errors: Record<string, string>) => {
                setCreateErrors(errors);
                toast.error(
                    Object.values(errors)[0] ||
                        (editingOrder
                            ? t(
                                  'orders.messages.orderUpdateFailed',
                                  'Failed to update order.',
                              )
                            : t(
                                  'orders.messages.orderCreateFailed',
                                  'Failed to create order.',
                              )),
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        };

        if (editingOrder) {
            router.patch(url, payload, options);

            return;
        }

        router.post(url, payload, options);
    };

    const handleStatusUpdate = (
        order: Order,
        status: string,
        nextPaymentMethod?: string,
    ) => {
        router.patch(
            `/orders/${order.id}/status`,
            {
                status,
                payment_method:
                    status === 'completed'
                        ? (nextPaymentMethod ??
                          order.payments?.[0]?.method ??
                          'cash')
                        : null,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'orders.messages.orderStatusUpdated',
                            'Order status updated.',
                        ),
                    );
                },
                onError: (errors) => {
                    toast.error(
                        Object.values(errors)[0] ||
                            t(
                                'orders.messages.orderStatusUpdateFailed',
                                'Failed to update order status.',
                            ),
                    );
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
                        t(
                            'orders.messages.paymentCompleted',
                            'Payment completed and finance updated.',
                        ),
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
                        Object.values(errors)[0] ||
                            t(
                                'orders.messages.paymentCompletionFailed',
                                'Failed to complete payment.',
                            ),
                    );
                },
                onFinish: () => {
                    setIsCompletingPayment(false);
                },
            },
        );
    };

    const openDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    const openAddItems = (order: Order) => {
        setSelectedOrder(order);
        resetAddItemsForm();
        setIsAddItemsOpen(true);
    };

    const openEdit = (order: Order) => {
        setEditingOrder(order);
        setBranchId(String(order.branch_id));
        setBranchTableId(
            order.branch_table_id ? String(order.branch_table_id) : '',
        );
        setOrderType(order.order_type);
        setPaymentMethod(order.payments?.[0]?.method ?? 'cash');
        setCustomerName(order.customer_name ?? '');
        setCustomerPhone(order.customer_phone ?? '');
        setDeliveryAddress(order.delivery_address ?? '');
        setItems(
            (order.items ?? []).map((item) => ({
                productId: String(item.product_id),
                sizeId: item.product_size_id
                    ? String(item.product_size_id)
                    : '',
                quantity: String(item.quantity),
                price: String(item.price ?? ''),
            })),
        );
        setCreateErrors({});
        setIsCreateOpen(true);
    };

    const openReceiptPreview = (order: Order) => {
        if (!['ready', 'completed'].includes(order.status ?? 'pending')) {
            toast.error(
                t(
                    'orders.messages.readyOrCompletedOnlyPrint',
                    'Only ready or completed orders can open receipt preview.',
                ),
            );
            return;
        }

        setSelectedReceiptOrder(order);
        setPaymentMethod(order.payments?.[0]?.method ?? 'cash');
        setIsReceiptPreviewOpen(true);
    };

    const handleAssignTable = (order: Order, nextBranchTableId: number) => {
        router.patch(
            `/orders/${order.id}/table`,
            { branch_table_id: nextBranchTableId },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'orders.messages.orderTableUpdated',
                            'Order table updated.',
                        ),
                    );
                },
                onError: (errors) => {
                    toast.error(
                        Object.values(errors)[0] ||
                            t(
                                'orders.messages.orderTableUpdateFailed',
                                'Failed to update order table.',
                            ),
                    );
                },
            },
        );
    };

    const handleMobileRowTap = (order: Order) => {
        if (!isCompactViewport) {
            return;
        }

        setMobileActionOrder(order);
    };

    const handleAddItemsSubmit = () => {
        if (!selectedOrder || isSubmitting) {
            return;
        }

        const payloadItems = buildPayloadItems(addItems);
        if (payloadItems.length === 0) {
            return;
        }

        setIsSubmitting(true);
        router.post(
            `/orders/${selectedOrder.id}/items`,
            {
                items: payloadItems,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'orders.messages.itemsAdded',
                            'Items added to order.',
                        ),
                    );
                    setIsAddItemsOpen(false);
                    resetAddItemsForm();
                },
                onError: (errors) => {
                    setAddItemErrors(errors);
                    toast.error(
                        Object.values(errors)[0] ||
                            t(
                                'orders.messages.addItemsFailed',
                                'Failed to add items.',
                            ),
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const tableColumns = buildColumns({
        onEdit: openEdit,
        onView: openDetails,
        onAddItems: openAddItems,
        onUpdateStatus: handleStatusUpdate,
        onPrint: openReceiptPreview,
        onAssignTable: handleAssignTable,
        branchTables,
        t,
        getStatusLabel,
        getSourceLabel,
        dateLocale,
    });
    const filteredTablesByBranch = branchTables.filter(
        (table) =>
            String(table.branch_id) === branchId && table.is_active !== false,
    );

    const users = useMemo(() => {
        const map = new Map<number, { id: number; name: string }>();
        for (const order of data) {
            const user = order.user;
            if (user?.id) {
                map.set(user.id, {
                    id: user.id,
                    name: user.name ?? `User #${user.id}`,
                });
            }
        }

        return Array.from(map.values()).sort((a, b) =>
            a.name.localeCompare(b.name),
        );
    }, [data]);

    const kitchens = useMemo(() => {
        const map = new Map<number, { id: number; name: string }>();
        for (const order of data) {
            for (const item of order.items ?? []) {
                if (item.kitchen_id && item.kitchen?.name) {
                    map.set(item.kitchen_id, {
                        id: item.kitchen_id,
                        name: item.kitchen.name,
                    });
                }
            }
        }

        return Array.from(map.values()).sort((a, b) =>
            a.name.localeCompare(b.name),
        );
    }, [data]);

    const filteredData = useMemo(() => {
        return data.filter((order) => {
            if (
                branchFilter !== 'all' &&
                String(order.branch_id) !== branchFilter
            ) {
                return false;
            }

            if (
                userFilter !== 'all' &&
                String(order.user_id ?? '') !== userFilter
            ) {
                return false;
            }

            if (
                orderTypeFilter !== 'all' &&
                (order.order_type ?? 'takeaway') !== orderTypeFilter
            ) {
                return false;
            }

            if (
                statusFilter !== 'all' &&
                (order.status ?? 'pending') !== statusFilter
            ) {
                return false;
            }

            if (
                sourceFilter !== 'all' &&
                (order.source ?? 'pos') !== sourceFilter
            ) {
                return false;
            }

            if (kitchenFilter !== 'all') {
                const hasKitchen = (order.items ?? []).some(
                    (item) => String(item.kitchen_id ?? '') === kitchenFilter,
                );
                if (!hasKitchen) {
                    return false;
                }
            }

            return true;
        });
    }, [
        branchFilter,
        data,
        kitchenFilter,
        orderTypeFilter,
        sourceFilter,
        statusFilter,
        userFilter,
    ]);

    const branchFilterOptions = useMemo(
        () => [
            {
                value: 'all',
                label: t('orders.filters.allBranches', 'All Branches'),
            },
            ...branches.map((branch) => ({
                value: String(branch.id),
                label: branch.name,
            })),
        ],
        [branches, t],
    );

    const userFilterOptions = useMemo(
        () => [
            { value: 'all', label: t('orders.filters.allUsers', 'All Users') },
            ...users.map((user) => ({
                value: String(user.id),
                label: user.name,
            })),
        ],
        [t, users],
    );

    const kitchenFilterOptions = useMemo(
        () => [
            {
                value: 'all',
                label: t('orders.filters.allKitchens', 'All Kitchens'),
            },
            ...kitchens.map((kitchen) => ({
                value: String(kitchen.id),
                label: kitchen.name,
            })),
        ],
        [kitchens, t],
    );

    const orderTypeFilterOptions = useMemo(
        () => [
            {
                value: 'all',
                label: t('orders.filters.allTypes', 'All Types'),
            },
            ...ORDER_TYPE_OPTIONS.map((orderType) => ({
                value: orderType,
                label: t(`orders.orderType.${orderType}`, orderType),
            })),
        ],
        [t],
    );

    const statusFilterOptions = useMemo(
        () => [
            {
                value: 'all',
                label: t('orders.filters.allStatuses', 'All Statuses'),
            },
            ...ORDER_STATUSES.map((status) => ({
                value: status,
                label: t(`orders.status.${status}`, status),
            })),
        ],
        [t],
    );

    const sourceFilterOptions = useMemo(
        () => [
            {
                value: 'all',
                label: t('orders.filters.allSources', 'All Sources'),
            },
            { value: 'pos', label: t('orders.source.pos', 'POS') },
            {
                value: 'mobile_app',
                label: t('orders.source.mobile_app', 'Mobile'),
            },
        ],
        [t],
    );

    const tableToolbar = (
        <div
            className={`flex w-full flex-wrap gap-2 xl:flex-nowrap ${
                locale === 'fa' || locale === 'ps'
                    ? 'justify-end [&>*]:w-full md:[&>*]:flex-1'
                    : 'justify-end'
            }`}
        >
            <SearchableDropdown
                value={branchFilter}
                options={branchFilterOptions}
                onValueChange={setBranchFilter}
                placeholder={t('orders.filters.branch', 'Branch')}
                searchPlaceholder={t(
                    'orders.filters.searchBranches',
                    'Search branches...',
                )}
                emptyText={t('orders.filters.noBranches', 'No branches found.')}
                className={
                    locale === 'fa' || locale === 'ps'
                        ? 'w-full md:min-w-[170px]'
                        : 'w-[170px]'
                }
            />
            {!isOrderTaker ? (
                <SearchableDropdown
                    value={userFilter}
                    options={userFilterOptions}
                    onValueChange={setUserFilter}
                    placeholder={t('orders.filters.user', 'User')}
                    searchPlaceholder={t(
                        'orders.filters.searchUsers',
                        'Search users...',
                    )}
                    emptyText={t('orders.filters.noUsers', 'No users found.')}
                    className={
                        locale === 'fa' || locale === 'ps'
                            ? 'w-full md:min-w-[170px]'
                            : 'w-[170px]'
                    }
                />
            ) : null}
            <SearchableDropdown
                value={orderTypeFilter}
                options={orderTypeFilterOptions}
                onValueChange={setOrderTypeFilter}
                placeholder={t('orders.filters.type', 'Type')}
                searchPlaceholder={t(
                    'orders.filters.searchTypes',
                    'Search types...',
                )}
                emptyText={t('orders.filters.noTypes', 'No types found.')}
                className={
                    locale === 'fa' || locale === 'ps'
                        ? 'w-full md:min-w-[170px]'
                        : 'w-[170px]'
                }
            />
            <SearchableDropdown
                value={kitchenFilter}
                options={kitchenFilterOptions}
                onValueChange={setKitchenFilter}
                placeholder={t('orders.filters.kitchen', 'Kitchen')}
                searchPlaceholder={t(
                    'orders.filters.searchKitchens',
                    'Search kitchens...',
                )}
                emptyText={t('orders.filters.noKitchens', 'No kitchens found.')}
                className={
                    locale === 'fa' || locale === 'ps'
                        ? 'w-full md:min-w-[170px]'
                        : 'w-[170px]'
                }
            />
            <SearchableDropdown
                value={statusFilter}
                options={statusFilterOptions}
                onValueChange={setStatusFilter}
                placeholder={t('orders.filters.status', 'Status')}
                searchPlaceholder={t(
                    'orders.filters.searchStatuses',
                    'Search statuses...',
                )}
                emptyText={t('orders.filters.noStatuses', 'No statuses found.')}
                className={
                    locale === 'fa' || locale === 'ps'
                        ? 'w-full md:min-w-[170px]'
                        : 'w-[170px]'
                }
            />
            <SearchableDropdown
                value={sourceFilter}
                options={sourceFilterOptions}
                onValueChange={setSourceFilter}
                placeholder={t('orders.filters.source', 'Source')}
                searchPlaceholder={t(
                    'orders.filters.searchSources',
                    'Search sources...',
                )}
                emptyText={t('orders.filters.noSources', 'No sources found.')}
                className={
                    locale === 'fa' || locale === 'ps'
                        ? 'w-full md:min-w-[170px]'
                        : 'w-[170px]'
                }
            />
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`${t('orders.toolbarTitle', 'Orders:')} ${formatNumber(filteredData.length)}`}
                    description={t(
                        'orders.toolbarDescription',
                        'Track and manage orders (DESC order by ID)',
                    )}
                />
                <Button
                    onClick={() => {
                        resetCreateForm();
                        setIsCreateOpen(true);
                    }}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    {t('orders.createOrder', 'Create Order')}
                </Button>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={[
                    'id',
                    'branch.name',
                    'branch_table.table_number',
                    'user.name',
                    'client.name',
                    'customer_name',
                    'customer_phone',
                    'source',
                    'status',
                ]}
                columns={tableColumns}
                data={filteredData}
                isLoading={isLoading}
                searchPlaceholder={t(
                    'orders.searchPlaceholder',
                    'Search orders by branch or status...',
                )}
                toolbar={tableToolbar}
                onRowClick={handleMobileRowTap}
                getRowClassName={() =>
                    isCompactViewport
                        ? 'cursor-pointer lg:cursor-default'
                        : undefined
                }
            />

            <Dialog
                open={mobileActionOrder !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setMobileActionOrder(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg lg:hidden">
                    {mobileActionOrder ? (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <ShoppingBag className="h-5 w-5" />
                                    {t(
                                        'orders.mobileActions.title',
                                        'Order actions',
                                    )}{' '}
                                    #{mobileActionOrder.id}
                                </DialogTitle>
                                <DialogDescription>
                                    {t(
                                        'orders.mobileActions.description',
                                        'Tap an action below to view details, update status, or continue working on this order.',
                                    )}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-3 rounded-2xl border border-neutral-200/70 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="text-muted-foreground">
                                        {t('orders.columns.status', 'Status')}
                                    </span>
                                    <Badge className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-950">
                                        {getStatusLabel(
                                            mobileActionOrder.status ?? 'pending',
                                        )}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="text-muted-foreground">
                                        {t('orders.columns.branch', 'Branch')}
                                    </span>
                                    <span className="font-medium">
                                        {mobileActionOrder.branch?.name ?? '-'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="text-muted-foreground">
                                        {t('orders.columns.total', 'Total')}
                                    </span>
                                    <span className="font-medium">
                                        {formatAfn(
                                            mobileActionOrder.total_amount,
                                        )}
                                    </span>
                                </div>
                            </div>

                            <OrderRowActions
                                order={mobileActionOrder}
                                branchTables={branchTables}
                                onEdit={openEdit}
                                onView={openDetails}
                                onAddItems={openAddItems}
                                onAssignTable={handleAssignTable}
                                onUpdateStatus={handleStatusUpdate}
                                onPrint={openReceiptPreview}
                                mode="panel"
                                onAction={() => setMobileActionOrder(null)}
                            />
                        </>
                    ) : null}
                </DialogContent>
            </Dialog>

            <Dialog
                open={isCreateOpen}
                onOpenChange={(open) => {
                    setIsCreateOpen(open);
                    if (!open) {
                        resetCreateForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-1">
                            <ClipboardList className="mr-2 h-5 w-5" />
                            {editingOrder
                                ? `${t('orders.form.editTitlePrefix', 'Edit Order #')}${editingOrder.id}`
                                : t('orders.form.createTitle', 'Create Order')}
                        </DialogTitle>
                        <DialogDescription>
                            {editingOrder
                                ? t(
                                      'orders.form.editDescription',
                                      'Update order details, remove items, or change values.',
                                  )
                                : t(
                                      'orders.form.createDescription',
                                      'Create a new order. Items are auto-routed to their product kitchen.',
                                  )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>{t('orders.form.branch', 'Branch')}</Label>
                            <Select
                                value={branchId}
                                onValueChange={(value) => {
                                    setBranchId(value);
                                    setBranchTableId('');
                                }}
                                disabled={!canChangeBranch}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t(
                                            'orders.form.branchPlaceholder',
                                            'Select branch',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem
                                            key={branch.id}
                                            value={String(branch.id)}
                                        >
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {!canChangeBranch ? (
                                <p className="text-xs text-muted-foreground">
                                    {t(
                                        'orders.form.branchFixed',
                                        'Your branch is fixed based on your login assignment.',
                                    )}
                                </p>
                            ) : null}
                            <InputError message={createErrors.branch_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t('orders.form.orderType', 'Order Type')}
                            </Label>
                            <Select
                                value={orderType}
                                onValueChange={(value) => {
                                    setOrderType(value);
                                    if (value !== 'dine_in') {
                                        setBranchTableId('');
                                    }
                                    if (value !== 'delivery') {
                                        setCustomerName('');
                                        setCustomerPhone('');
                                        setDeliveryAddress('');
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t(
                                            'orders.form.orderTypePlaceholder',
                                            'Select type',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dine_in">
                                        {getOrderTypeLabel('dine_in')}
                                    </SelectItem>
                                    <SelectItem value="takeaway">
                                        {getOrderTypeLabel('takeaway')}
                                    </SelectItem>
                                    <SelectItem value="delivery">
                                        {getOrderTypeLabel('delivery')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={createErrors.order_type} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'orders.form.paymentMethod',
                                    'Payment Method',
                                )}
                            </Label>
                            <Select
                                value={paymentMethod}
                                onValueChange={setPaymentMethod}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t(
                                            'orders.form.paymentMethodPlaceholder',
                                            'Select payment method',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentMethodOptions.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={createErrors.payment_method} />
                        </div>
                        {orderType === 'dine_in' ? (
                            <div className="grid gap-2 sm:col-span-2">
                                <Label>
                                    {t(
                                        'orders.form.tableNumber',
                                        'Table Number',
                                    )}
                                </Label>
                                <Select
                                    value={branchTableId}
                                    onValueChange={setBranchTableId}
                                    disabled={!branchId}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'orders.form.tableNumberPlaceholder',
                                                'Select table number',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredTablesByBranch.map((table) => (
                                            <SelectItem
                                                key={table.id}
                                                value={String(table.id)}
                                            >
                                                {table.table_number} -{' '}
                                                {table.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={createErrors.branch_table_id}
                                />
                            </div>
                        ) : null}
                        {orderType === 'delivery' ? (
                            <>
                                <div className="grid gap-2">
                                    <Label>
                                        {t(
                                            'orders.form.customerName',
                                            'Customer Name',
                                        )}
                                    </Label>
                                    <Input
                                        value={customerName}
                                        onChange={(event) =>
                                            setCustomerName(event.target.value)
                                        }
                                    />
                                    <InputError
                                        message={createErrors.customer_name}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>
                                        {t(
                                            'orders.form.customerPhone',
                                            'Customer Phone',
                                        )}
                                    </Label>
                                    <Input
                                        value={customerPhone}
                                        onChange={(event) =>
                                            setCustomerPhone(event.target.value)
                                        }
                                    />
                                    <InputError
                                        message={createErrors.customer_phone}
                                    />
                                </div>
                                <div className="grid gap-2 sm:col-span-2">
                                    <Label>
                                        {t(
                                            'orders.form.deliveryAddress',
                                            'Delivery Address',
                                        )}
                                    </Label>
                                    <Textarea
                                        value={deliveryAddress}
                                        onChange={(event) =>
                                            setDeliveryAddress(
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={createErrors.delivery_address}
                                    />
                                </div>
                            </>
                        ) : null}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                                {t('orders.form.orderItems', 'Order Items')}
                            </h4>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addDraftItem(setItems)}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                {t('orders.form.addItem', 'Add Item')}
                            </Button>
                        </div>

                        {items.length > 2 ? (
                            <ScrollArea className="h-[320px] rounded-md border border-neutral-200/60 p-1 dark:border-neutral-800">
                                <div className="space-y-3 p-2">
                                    {items.map((item, index) => {
                                        const product = getProductById(
                                            item.productId,
                                        );
                                        const sizes = product?.sizes ?? [];
                                        const hasSizes = sizes.length > 0;
                                        const kitchenName =
                                            getItemKitchenName(item);

                                        return (
                                            <div
                                                key={`order-item-${index}`}
                                                className="grid gap-3 rounded-md border border-neutral-200/60 p-4 sm:grid-cols-6 dark:border-neutral-800"
                                            >
                                                <div className="grid gap-2 sm:col-span-2">
                                                    <Label>
                                                        {t(
                                                            'orders.form.product',
                                                            'Product',
                                                        )}
                                                    </Label>
                                                    <Select
                                                        value={item.productId}
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            handleProductChange(
                                                                setItems,
                                                                items,
                                                                index,
                                                                value,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue
                                                                placeholder={t(
                                                                    'orders.form.productPlaceholder',
                                                                    'Select product',
                                                                )}
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {products.map(
                                                                (entry) => (
                                                                    <SelectItem
                                                                        key={
                                                                            entry.id
                                                                        }
                                                                        value={String(
                                                                            entry.id,
                                                                        )}
                                                                    >
                                                                        {localizedProductName(
                                                                            entry,
                                                                        )}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {hasSizes ? (
                                                    <div className="grid gap-2">
                                                        <Label>
                                                            {t(
                                                                'orders.form.size',
                                                                'Size',
                                                            )}
                                                        </Label>
                                                        <Select
                                                            value={item.sizeId}
                                                            onValueChange={(
                                                                value,
                                                            ) =>
                                                                handleSizeChange(
                                                                    setItems,
                                                                    items,
                                                                    index,
                                                                    value,
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue
                                                                    placeholder={t(
                                                                        'orders.form.sizePlaceholder',
                                                                        'Select size',
                                                                    )}
                                                                />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {sizes.map(
                                                                    (size) => (
                                                                        <SelectItem
                                                                            key={
                                                                                size.id
                                                                            }
                                                                            value={String(
                                                                                size.id,
                                                                            )}
                                                                        >
                                                                            {
                                                                                size.name
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                ) : null}
                                                <div className="grid gap-2">
                                                    <Label>
                                                        {t(
                                                            'orders.form.qty',
                                                            'Qty',
                                                        )}
                                                    </Label>
                                                    <NumericInput
                                                        min="1"
                                                        value={item.quantity}
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            handleItemChange(
                                                                setItems,
                                                                items,
                                                                index,
                                                                'quantity',
                                                                value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>
                                                        {t(
                                                            'orders.form.price',
                                                            'Price',
                                                        )}
                                                    </Label>
                                                    <NumericInput
                                                        min="0"
                                                        value={item.price}
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            handleItemChange(
                                                                setItems,
                                                                items,
                                                                index,
                                                                'price',
                                                                value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="flex flex-col justify-between gap-2">
                                                    <Badge variant="secondary">
                                                        {kitchenName}
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            removeDraftItem(
                                                                setItems,
                                                                index,
                                                            )
                                                        }
                                                        disabled={
                                                            items.length === 1
                                                        }
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        {t(
                                                            'orders.form.remove',
                                                            'Remove',
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item, index) => {
                                    const product = getProductById(
                                        item.productId,
                                    );
                                    const sizes = product?.sizes ?? [];
                                    const hasSizes = sizes.length > 0;
                                    const kitchenName =
                                        getItemKitchenName(item);

                                    return (
                                        <div
                                            key={`order-item-${index}`}
                                            className="grid gap-3 rounded-md border border-neutral-200/60 p-4 sm:grid-cols-6 dark:border-neutral-800"
                                        >
                                            <div className="grid gap-2 sm:col-span-2">
                                                <Label>
                                                    {t(
                                                        'orders.form.product',
                                                        'Product',
                                                    )}
                                                </Label>
                                                <Select
                                                    value={item.productId}
                                                    onValueChange={(value) =>
                                                        handleProductChange(
                                                            setItems,
                                                            items,
                                                            index,
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue
                                                            placeholder={t(
                                                                'orders.form.productPlaceholder',
                                                                'Select product',
                                                            )}
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {products.map(
                                                            (entry) => (
                                                                <SelectItem
                                                                    key={
                                                                        entry.id
                                                                    }
                                                                    value={String(
                                                                        entry.id,
                                                                    )}
                                                                >
                                                                    {localizedProductName(
                                                                        entry,
                                                                    )}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {hasSizes ? (
                                                <div className="grid gap-2">
                                                    <Label>
                                                        {t(
                                                            'orders.form.size',
                                                            'Size',
                                                        )}
                                                    </Label>
                                                    <Select
                                                        value={item.sizeId}
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            handleSizeChange(
                                                                setItems,
                                                                items,
                                                                index,
                                                                value,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue
                                                                placeholder={t(
                                                                    'orders.form.sizePlaceholder',
                                                                    'Select size',
                                                                )}
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {sizes.map(
                                                                (size) => (
                                                                    <SelectItem
                                                                        key={
                                                                            size.id
                                                                        }
                                                                        value={String(
                                                                            size.id,
                                                                        )}
                                                                    >
                                                                        {
                                                                            size.name
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ) : null}
                                            <div className="grid gap-2">
                                                <Label>
                                                    {t(
                                                        'orders.form.qty',
                                                        'Qty',
                                                    )}
                                                </Label>
                                                <NumericInput
                                                    min="1"
                                                    value={item.quantity}
                                                    onValueChange={(value) =>
                                                        handleItemChange(
                                                            setItems,
                                                            items,
                                                            index,
                                                            'quantity',
                                                            value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>
                                                    {t(
                                                        'orders.form.price',
                                                        'Price',
                                                    )}
                                                </Label>
                                                <NumericInput
                                                    min="0"
                                                    value={item.price}
                                                    onValueChange={(value) =>
                                                        handleItemChange(
                                                            setItems,
                                                            items,
                                                            index,
                                                            'price',
                                                            value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="flex flex-col justify-between gap-2">
                                                <Badge variant="secondary">
                                                    {kitchenName}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        removeDraftItem(
                                                            setItems,
                                                            index,
                                                        )
                                                    }
                                                    disabled={
                                                        items.length === 1
                                                    }
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    {t(
                                                        'orders.form.remove',
                                                        'Remove',
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                                {t('orders.form.totalAmount', 'Total Amount')}
                            </span>
                            <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                {formatAfn(createTotal)}
                            </span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="mr-2 h-5 w-5" />
                            {t('orders.form.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={handleCreateSubmit}
                            disabled={
                                !branchId ||
                                items.length === 0 ||
                                (orderType === 'dine_in' && !branchTableId) ||
                                (orderType === 'delivery' &&
                                    (!customerName.trim() ||
                                        !customerPhone.trim() ||
                                        !deliveryAddress.trim())) ||
                                isSubmitting
                            }
                        >
                            <Save className="mr-2 h-5 w-5" />
                            {editingOrder
                                ? t('orders.updateOrder', 'Update Order')
                                : t('orders.createOrder', 'Create Order')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t('orders.detailsModal.titlePrefix', 'Order #')}
                            {selectedOrder?.id ?? ''}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'orders.detailsModal.description',
                                'View order details and update order status.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedOrder ? (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    className={
                                        (selectedOrder.source ?? 'pos') ===
                                        'mobile_app'
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                                            : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
                                    }
                                >
                                    {getSourceLabel(
                                        selectedOrder.source ?? 'pos',
                                    )}
                                </Badge>
                                {selectedOrder.client?.name ? (
                                    <Badge variant="secondary">
                                        {t(
                                            'orders.detailsModal.clientPrefix',
                                            'Client:',
                                        )}{' '}
                                        {selectedOrder.client.name}
                                    </Badge>
                                ) : null}
                            </div>
                            <div className="grid gap-4 sm:grid-cols-6">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            'orders.detailsModal.branch',
                                            'Branch',
                                        )}
                                    </p>
                                    <p className="font-medium">
                                        {selectedOrder.branch?.name ?? '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            'orders.detailsModal.orderType',
                                            'Order Type',
                                        )}
                                    </p>
                                    <p className="font-medium capitalize">
                                        {getOrderTypeLabel(
                                            selectedOrder.order_type ??
                                                'dine_in',
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            'orders.detailsModal.createdBy',
                                            'Created By',
                                        )}
                                    </p>
                                    <p className="font-medium">
                                        {selectedOrder.user?.name ??
                                            t(
                                                'orders.detailsModal.system',
                                                'System',
                                            )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            'orders.detailsModal.client',
                                            'Client',
                                        )}
                                    </p>
                                    <p className="font-medium">
                                        {selectedOrder.client?.name ??
                                            selectedOrder.customer_name ??
                                            '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            'orders.detailsModal.total',
                                            'Total',
                                        )}
                                    </p>
                                    <p className="font-medium">
                                        {formatAfn(selectedOrder.total_amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            'orders.detailsModal.status',
                                            'Status',
                                        )}
                                    </p>
                                    <p className="font-medium">
                                        {getStatusLabel(
                                            selectedOrder.status ?? 'pending',
                                        )}
                                    </p>
                                </div>
                            </div>

                            {(selectedOrder.client?.email ||
                                selectedOrder.client?.phone ||
                                selectedOrder.customer_note) && (
                                <div className="grid gap-4 rounded-md border border-neutral-200/70 p-4 sm:grid-cols-3 dark:border-neutral-800">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            {t(
                                                'orders.detailsModal.clientEmail',
                                                'Client Email',
                                            )}
                                        </p>
                                        <p className="font-medium">
                                            {selectedOrder.client?.email ?? '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            {t(
                                                'orders.detailsModal.clientPhone',
                                                'Client Phone',
                                            )}
                                        </p>
                                        <p className="font-medium">
                                            {selectedOrder.client?.phone ??
                                                selectedOrder.customer_phone ??
                                                '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            {t(
                                                'orders.detailsModal.customerNote',
                                                'Customer Note',
                                            )}
                                        </p>
                                        <p className="font-medium">
                                            {selectedOrder.customer_note ?? '-'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    disabled={
                                        !['ready', 'completed'].includes(
                                            selectedOrder.status ?? 'pending',
                                        )
                                    }
                                    onClick={() =>
                                        openReceiptPreview(selectedOrder)
                                    }
                                >
                                    <Printer className="h-4 w-4" />
                                    {t(
                                        'orders.detailsModal.printReceipt',
                                        'Print Receipt',
                                    )}
                                </Button>
                            </div>

                            {(selectedOrder.items ?? []).length > 5 ? (
                                <ScrollArea className="h-[360px] rounded-md border p-3">
                                    <div className="space-y-2">
                                        {(selectedOrder.items ?? []).map(
                                            (item) => (
                                                <div
                                                    key={item.id}
                                                    className="grid gap-2 rounded-md border p-3 sm:grid-cols-5"
                                                >
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {t(
                                                                'orders.detailsModal.product',
                                                                'Product',
                                                            )}
                                                        </p>
                                                        <p className="font-medium">
                                                            {item.product_name ??
                                                                item.product_name_snapshot ??
                                                                item.product
                                                                    ?.name ??
                                                                '-'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {t(
                                                                'orders.detailsModal.kitchen',
                                                                'Kitchen',
                                                            )}
                                                        </p>
                                                        <p className="font-medium">
                                                            {item.kitchen
                                                                ?.name ??
                                                                item.product
                                                                    ?.kitchen
                                                                    ?.name ??
                                                                t(
                                                                    'orders.detailsModal.unassigned',
                                                                    'Unassigned',
                                                                )}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {t(
                                                                'orders.detailsModal.size',
                                                                'Size',
                                                            )}
                                                        </p>
                                                        <p className="font-medium">
                                                            {item.product_size_name ??
                                                                item.product_size_name_snapshot ??
                                                                item
                                                                    .product_size
                                                                    ?.name ??
                                                                '-'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {t(
                                                                'orders.detailsModal.qty',
                                                                'Qty',
                                                            )}
                                                        </p>
                                                        <p className="font-medium">
                                                            {item.quantity}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {t(
                                                                'orders.detailsModal.price',
                                                                'Price',
                                                            )}
                                                        </p>
                                                        <p className="font-medium">
                                                            {formatAfn(
                                                                item.price,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <div className="space-y-2 rounded-md border p-3">
                                    {(selectedOrder.items ?? []).map((item) => (
                                        <div
                                            key={item.id}
                                            className="grid gap-2 rounded-md border p-3 sm:grid-cols-5"
                                        >
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    {t(
                                                        'orders.detailsModal.product',
                                                        'Product',
                                                    )}
                                                </p>
                                                <p className="font-medium">
                                                    {item.product_name ??
                                                        item.product_name_snapshot ??
                                                        item.product?.name ??
                                                        '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    {t(
                                                        'orders.detailsModal.kitchen',
                                                        'Kitchen',
                                                    )}
                                                </p>
                                                <p className="font-medium">
                                                    {item.kitchen?.name ??
                                                        item.product?.kitchen
                                                            ?.name ??
                                                        t(
                                                            'orders.detailsModal.unassigned',
                                                            'Unassigned',
                                                        )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    {t(
                                                        'orders.detailsModal.size',
                                                        'Size',
                                                    )}
                                                </p>
                                                <p className="font-medium">
                                                    {item.product_size_name ??
                                                        item.product_size_name_snapshot ??
                                                        item.product_size
                                                            ?.name ??
                                                        '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    {t(
                                                        'orders.detailsModal.qty',
                                                        'Qty',
                                                    )}
                                                </p>
                                                <p className="font-medium">
                                                    {item.quantity}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    {t(
                                                        'orders.detailsModal.price',
                                                        'Price',
                                                    )}
                                                </p>
                                                <p className="font-medium">
                                                    {formatAfn(item.price)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            <Dialog open={isAddItemsOpen} onOpenChange={setIsAddItemsOpen}>
                <DialogContent className="sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t(
                                'orders.form.addItemsTitlePrefix',
                                'Add Items to Order #',
                            )}
                            {selectedOrder?.id ?? ''}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'orders.form.addItemsDescription',
                                'Add additional items to an existing order.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addDraftItem(setAddItems)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                {t('orders.form.addItem', 'Add Item')}
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {addItems.map((item, index) => {
                                const product = getProductById(item.productId);
                                const sizes = product?.sizes ?? [];
                                const hasSizes = sizes.length > 0;
                                const kitchenName = getItemKitchenName(item);

                                return (
                                    <div
                                        key={`order-add-item-${index}`}
                                        className="grid gap-3 rounded-md border border-neutral-200/60 p-4 sm:grid-cols-6 dark:border-neutral-800"
                                    >
                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label>
                                                {t(
                                                    'orders.form.product',
                                                    'Product',
                                                )}
                                            </Label>
                                            <Select
                                                value={item.productId}
                                                onValueChange={(value) =>
                                                    handleProductChange(
                                                        setAddItems,
                                                        addItems,
                                                        index,
                                                        value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={t(
                                                            'orders.form.productPlaceholder',
                                                            'Select product',
                                                        )}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map((entry) => (
                                                        <SelectItem
                                                            key={entry.id}
                                                            value={String(
                                                                entry.id,
                                                            )}
                                                        >
                                                            {localizedProductName(
                                                                entry,
                                                            )}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {hasSizes ? (
                                            <div className="grid gap-2">
                                                <Label>
                                                    {t(
                                                        'orders.form.size',
                                                        'Size',
                                                    )}
                                                </Label>
                                                <Select
                                                    value={item.sizeId}
                                                    onValueChange={(value) =>
                                                        handleSizeChange(
                                                            setAddItems,
                                                            addItems,
                                                            index,
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue
                                                            placeholder={t(
                                                                'orders.form.sizePlaceholder',
                                                                'Select size',
                                                            )}
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {sizes.map((size) => (
                                                            <SelectItem
                                                                key={size.id}
                                                                value={String(
                                                                    size.id,
                                                                )}
                                                            >
                                                                {size.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : null}
                                        <div className="grid gap-2">
                                            <Label>
                                                {t('orders.form.qty', 'Qty')}
                                            </Label>
                                            <NumericInput
                                                min="1"
                                                value={item.quantity}
                                                onValueChange={(value) =>
                                                    handleItemChange(
                                                        setAddItems,
                                                        addItems,
                                                        index,
                                                        'quantity',
                                                        value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>
                                                {t(
                                                    'orders.form.price',
                                                    'Price',
                                                )}
                                            </Label>
                                            <NumericInput
                                                min="0"
                                                value={item.price}
                                                onValueChange={(value) =>
                                                    handleItemChange(
                                                        setAddItems,
                                                        addItems,
                                                        index,
                                                        'price',
                                                        value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="flex flex-col justify-between gap-2">
                                            <Badge variant="secondary">
                                                {kitchenName}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    removeDraftItem(
                                                        setAddItems,
                                                        index,
                                                    )
                                                }
                                                disabled={addItems.length === 1}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                {t(
                                                    'orders.form.remove',
                                                    'Remove',
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                                {t(
                                    'orders.form.additionalTotal',
                                    'Additional Total',
                                )}
                            </span>
                            <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                {formatAfn(addItemsTotal)}
                            </span>
                        </div>
                        <InputError message={addItemErrors.items} />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsAddItemsOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="mr-2 h-5 w-5" />
                            {t('orders.form.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={handleAddItemsSubmit}
                            disabled={isSubmitting}
                        >
                            <Save className="mr-2 h-5 w-5" />
                            {t('orders.form.addItems', 'Add Items')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ReceiptPreviewDialog
                key={`${selectedReceiptOrder?.id ?? 'receipt'}-${selectedReceiptOrder?.discount_amount ?? 0}-${isReceiptPreviewOpen ? 'open' : 'closed'}`}
                order={selectedReceiptOrder}
                open={isReceiptPreviewOpen}
                onOpenChange={setIsReceiptPreviewOpen}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                onCompletePayment={handleCompletePayment}
                isCompletingPayment={isCompletingPayment}
            />
        </div>
    );
};
