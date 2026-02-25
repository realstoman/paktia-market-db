import InputError from '@/components/input-error';
import Heading from '@/components/shared/heading';
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
import { Branch, BranchTable, Order, Product } from '@/types';
import { formatAfn, formatNumber } from '@/utils/format';
import { router } from '@inertiajs/react';
import { ClipboardList, Plus, Save, Trash2, X } from 'lucide-react';
import { type Dispatch, type SetStateAction, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';

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
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAddItemsOpen, setIsAddItemsOpen] = useState(false);
    const [branchId, setBranchId] = useState('');
    const [branchTableId, setBranchTableId] = useState('');
    const [orderType, setOrderType] = useState('dine_in');
    const [items, setItems] = useState<OrderItemDraft[]>([emptyItem()]);
    const [addItems, setAddItems] = useState<OrderItemDraft[]>([emptyItem()]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [addItemErrors, setAddItemErrors] = useState<Record<string, string>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [branchFilter, setBranchFilter] = useState('all');
    const [userFilter, setUserFilter] = useState('all');
    const [kitchenFilter, setKitchenFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const resetCreateForm = () => {
        setBranchId('');
        setBranchTableId('');
        setOrderType('dine_in');
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
        return product?.kitchen?.name ?? 'Unassigned';
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
            isSubmitting
        ) {
            return;
        }

        const payloadItems = buildPayloadItems(items);
        if (payloadItems.length === 0) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            '/orders',
            {
                branch_id: Number(branchId),
                order_type: orderType,
                branch_table_id:
                    orderType === 'dine_in' ? Number(branchTableId) : null,
                items: payloadItems,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Order created successfully.');
                    setIsCreateOpen(false);
                    resetCreateForm();
                },
                onError: (errors) => {
                    setCreateErrors(errors);
                    toast.error(
                        Object.values(errors)[0] || 'Failed to create order.',
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleStatusUpdate = (order: Order, status: string) => {
        router.patch(
            `/orders/${order.id}/status`,
            { status },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Order status updated.');
                },
                onError: (errors) => {
                    toast.error(
                        Object.values(errors)[0] ||
                            'Failed to update order status.',
                    );
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
                onSuccess: () => {
                    toast.success('Items added to order.');
                    setIsAddItemsOpen(false);
                    resetAddItemsForm();
                },
                onError: (errors) => {
                    setAddItemErrors(errors);
                    toast.error(
                        Object.values(errors)[0] || 'Failed to add items.',
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const tableColumns = buildColumns({
        onView: openDetails,
        onAddItems: openAddItems,
        onUpdateStatus: handleStatusUpdate,
        onAssignTable: (order, nextBranchTableId) => {
            router.patch(
                `/orders/${order.id}/table`,
                { branch_table_id: nextBranchTableId },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Order table updated.');
                    },
                    onError: (errors) => {
                        toast.error(
                            Object.values(errors)[0] ||
                                'Failed to update order table.',
                        );
                    },
                },
            );
        },
        branchTables,
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
                statusFilter !== 'all' &&
                (order.status ?? 'pending') !== statusFilter
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
    }, [branchFilter, data, kitchenFilter, statusFilter, userFilter]);

    const branchFilterOptions = useMemo(
        () => [
            { value: 'all', label: 'All Branches' },
            ...branches.map((branch) => ({
                value: String(branch.id),
                label: branch.name,
            })),
        ],
        [branches],
    );

    const userFilterOptions = useMemo(
        () => [
            { value: 'all', label: 'All Users' },
            ...users.map((user) => ({
                value: String(user.id),
                label: user.name,
            })),
        ],
        [users],
    );

    const kitchenFilterOptions = useMemo(
        () => [
            { value: 'all', label: 'All Kitchens' },
            ...kitchens.map((kitchen) => ({
                value: String(kitchen.id),
                label: kitchen.name,
            })),
        ],
        [kitchens],
    );

    const statusFilterOptions = useMemo(
        () => [
            { value: 'all', label: 'All Statuses' },
            ...ORDER_STATUSES.map((status) => ({
                value: status,
                label: status
                    .split('_')
                    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(' '),
            })),
        ],
        [],
    );

    const tableToolbar = (
        <div className="flex w-full flex-wrap justify-end gap-2 xl:flex-nowrap">
            <SearchableDropdown
                value={branchFilter}
                options={branchFilterOptions}
                onValueChange={setBranchFilter}
                placeholder="Branch"
                searchPlaceholder="Search branches..."
                emptyText="No branches found."
                className="w-[170px]"
            />
            <SearchableDropdown
                value={userFilter}
                options={userFilterOptions}
                onValueChange={setUserFilter}
                placeholder="User"
                searchPlaceholder="Search users..."
                emptyText="No users found."
                className="w-[170px]"
            />
            <SearchableDropdown
                value={kitchenFilter}
                options={kitchenFilterOptions}
                onValueChange={setKitchenFilter}
                placeholder="Kitchen"
                searchPlaceholder="Search kitchens..."
                emptyText="No kitchens found."
                className="w-[170px]"
            />
            <SearchableDropdown
                value={statusFilter}
                options={statusFilterOptions}
                onValueChange={setStatusFilter}
                placeholder="Status"
                searchPlaceholder="Search statuses..."
                emptyText="No statuses found."
                className="w-[170px]"
            />
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`Orders: ${formatNumber(filteredData.length)}`}
                    description="Track and manage orders (DESC order by ID)"
                />
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Order
                </Button>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={[
                    'id',
                    'branch.name',
                    'branch_table.table_number',
                    'user.name',
                    'status',
                ]}
                columns={tableColumns}
                data={filteredData}
                isLoading={isLoading}
                searchPlaceholder="Search orders by branch or status..."
                toolbar={tableToolbar}
            />

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
                            Create Order
                        </DialogTitle>
                        <DialogDescription>
                            Create a new order. Items are auto-routed to their
                            product kitchen.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Branch</Label>
                            <Select
                                value={branchId}
                                onValueChange={(value) => {
                                    setBranchId(value);
                                    setBranchTableId('');
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select branch" />
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
                            <InputError message={createErrors.branch_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Order Type</Label>
                            <Select
                                value={orderType}
                                onValueChange={(value) => {
                                    setOrderType(value);
                                    if (value !== 'dine_in') {
                                        setBranchTableId('');
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dine_in">
                                        Dine In
                                    </SelectItem>
                                    <SelectItem value="takeaway">
                                        Takeaway
                                    </SelectItem>
                                    <SelectItem value="delivery">
                                        Delivery
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={createErrors.order_type} />
                        </div>
                        {orderType === 'dine_in' ? (
                            <div className="grid gap-2 sm:col-span-2">
                                <Label>Table Number</Label>
                                <Select
                                    value={branchTableId}
                                    onValueChange={setBranchTableId}
                                    disabled={!branchId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select table number" />
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
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                                Order Items
                            </h4>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addDraftItem(setItems)}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Item
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
                                        const kitchenName =
                                            getItemKitchenName(item);

                                        return (
                                            <div
                                                key={`order-item-${index}`}
                                                className="grid gap-3 rounded-md border border-neutral-200/60 p-4 sm:grid-cols-6 dark:border-neutral-800"
                                            >
                                                <div className="grid gap-2 sm:col-span-2">
                                                    <Label>Product</Label>
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
                                                            <SelectValue placeholder="Select product" />
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
                                                                        {
                                                                            entry.name
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Size</Label>
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
                                                            <SelectValue placeholder="Optional" />
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
                                                <div className="grid gap-2">
                                                    <Label>Qty</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(event) =>
                                                            handleItemChange(
                                                                setItems,
                                                                items,
                                                                index,
                                                                'quantity',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Price</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={item.price}
                                                        onChange={(event) =>
                                                            handleItemChange(
                                                                setItems,
                                                                items,
                                                                index,
                                                                'price',
                                                                event.target
                                                                    .value,
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
                                                        Remove
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
                                    const kitchenName =
                                        getItemKitchenName(item);

                                    return (
                                        <div
                                            key={`order-item-${index}`}
                                            className="grid gap-3 rounded-md border border-neutral-200/60 p-4 sm:grid-cols-6 dark:border-neutral-800"
                                        >
                                            <div className="grid gap-2 sm:col-span-2">
                                                <Label>Product</Label>
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
                                                        <SelectValue placeholder="Select product" />
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
                                                                    {entry.name}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Size</Label>
                                                <Select
                                                    value={item.sizeId}
                                                    onValueChange={(value) =>
                                                        handleSizeChange(
                                                            setItems,
                                                            items,
                                                            index,
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Optional" />
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
                                            <div className="grid gap-2">
                                                <Label>Qty</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(event) =>
                                                        handleItemChange(
                                                            setItems,
                                                            items,
                                                            index,
                                                            'quantity',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Price</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={item.price}
                                                    onChange={(event) =>
                                                        handleItemChange(
                                                            setItems,
                                                            items,
                                                            index,
                                                            'price',
                                                            event.target.value,
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
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Total Amount</span>
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
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateSubmit}
                            disabled={
                                !branchId ||
                                items.length === 0 ||
                                (orderType === 'dine_in' && !branchTableId) ||
                                isSubmitting
                            }
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Create Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>
                            Order #{selectedOrder?.id ?? ''}
                        </DialogTitle>
                        <DialogDescription>
                            View order details and update order status.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedOrder ? (
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-5">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Branch
                                    </p>
                                    <p className="font-medium">
                                        {selectedOrder.branch?.name ?? '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Order Type
                                    </p>
                                    <p className="font-medium capitalize">
                                        {selectedOrder.order_type?.replace(
                                            '_',
                                            ' ',
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Created By
                                    </p>
                                    <p className="font-medium">
                                        {selectedOrder.user?.name ?? 'System'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Total
                                    </p>
                                    <p className="font-medium">
                                        {formatAfn(selectedOrder.total_amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Status
                                    </p>
                                    <p className="font-medium">
                                        {(selectedOrder.status ?? 'pending')
                                            .replace('_', ' ')
                                            .replace(/\b\w/g, (c) =>
                                                c.toUpperCase(),
                                            )}
                                    </p>
                                </div>
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
                                                            Product
                                                        </p>
                                                        <p className="font-medium">
                                                            {item.product
                                                                ?.name ?? '-'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Kitchen
                                                        </p>
                                                        <p className="font-medium">
                                                            {item.kitchen
                                                                ?.name ??
                                                                item.product
                                                                    ?.kitchen
                                                                    ?.name ??
                                                                'Unassigned'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Size
                                                        </p>
                                                        <p className="font-medium">
                                                            {item.product_size
                                                                ?.name ?? '-'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Qty
                                                        </p>
                                                        <p className="font-medium">
                                                            {item.quantity}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Price
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
                                                    Product
                                                </p>
                                                <p className="font-medium">
                                                    {item.product?.name ?? '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Kitchen
                                                </p>
                                                <p className="font-medium">
                                                    {item.kitchen?.name ??
                                                        item.product?.kitchen
                                                            ?.name ??
                                                        'Unassigned'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Size
                                                </p>
                                                <p className="font-medium">
                                                    {item.product_size?.name ??
                                                        '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Qty
                                                </p>
                                                <p className="font-medium">
                                                    {item.quantity}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Price
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
                            Add Items to Order #{selectedOrder?.id ?? ''}
                        </DialogTitle>
                        <DialogDescription>
                            Add additional items to an existing order.
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
                                Add Item
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {addItems.map((item, index) => {
                                const product = getProductById(item.productId);
                                const sizes = product?.sizes ?? [];
                                const kitchenName = getItemKitchenName(item);

                                return (
                                    <div
                                        key={`order-add-item-${index}`}
                                        className="grid gap-3 rounded-md border border-neutral-200/60 p-4 sm:grid-cols-6 dark:border-neutral-800"
                                    >
                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label>Product</Label>
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
                                                    <SelectValue placeholder="Select product" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map((entry) => (
                                                        <SelectItem
                                                            key={entry.id}
                                                            value={String(
                                                                entry.id,
                                                            )}
                                                        >
                                                            {entry.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Size</Label>
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
                                                    <SelectValue placeholder="Optional" />
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
                                        <div className="grid gap-2">
                                            <Label>Qty</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(event) =>
                                                    handleItemChange(
                                                        setAddItems,
                                                        addItems,
                                                        index,
                                                        'quantity',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Price</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={item.price}
                                                onChange={(event) =>
                                                    handleItemChange(
                                                        setAddItems,
                                                        addItems,
                                                        index,
                                                        'price',
                                                        event.target.value,
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
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Additional Total</span>
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
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddItemsSubmit}
                            disabled={isSubmitting}
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Add Items
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
