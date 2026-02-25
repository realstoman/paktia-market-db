import InputError from '@/components/input-error';
import Heading from '@/components/shared/heading';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import { Branch, Order, Product } from '@/types';
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
    isLoading = false,
}) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAddItemsOpen, setIsAddItemsOpen] = useState(false);
    const [branchId, setBranchId] = useState('');
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
        if (!branchId || items.length === 0 || isSubmitting) {
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
    });

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

    const tableToolbar = (
        <div className="flex w-full flex-wrap justify-end gap-2 xl:flex-nowrap">
            <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="h-10 w-[170px]">
                    <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                            {branch.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="h-10 w-[170px]">
                    <SelectValue placeholder="User" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                        <SelectItem key={user.id} value={String(user.id)}>
                            {user.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={kitchenFilter} onValueChange={setKitchenFilter}>
                <SelectTrigger className="h-10 w-[170px]">
                    <SelectValue placeholder="Kitchen" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Kitchens</SelectItem>
                    {kitchens.map((kitchen) => (
                        <SelectItem
                            key={kitchen.id}
                            value={String(kitchen.id)}
                        >
                            {kitchen.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-[170px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                            {status
                                .split('_')
                                .map(
                                    (part) =>
                                        part.charAt(0).toUpperCase() +
                                        part.slice(1),
                                )
                                .join(' ')}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
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
                searchKey={['id', 'branch.name', 'user.name', 'status']}
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
                            <Select value={branchId} onValueChange={setBranchId}>
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
                            <Select value={orderType} onValueChange={setOrderType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dine_in">Dine In</SelectItem>
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

                        <div className="space-y-3">
                            {items.map((item, index) => {
                                const product = getProductById(item.productId);
                                const sizes = product?.sizes ?? [];
                                const kitchenName = getItemKitchenName(item);

                                return (
                                    <div
                                        key={`order-item-${index}`}
                                        className="grid gap-3 rounded-md border border-neutral-200/60 p-4 dark:border-neutral-800 sm:grid-cols-6"
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
                                                disabled={items.length === 1}
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
                            disabled={!branchId || items.length === 0 || isSubmitting}
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
                                    <Select
                                        value={selectedOrder.status ?? 'pending'}
                                        onValueChange={(status) =>
                                            handleStatusUpdate(
                                                selectedOrder,
                                                status,
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ORDER_STATUSES.map((status) => (
                                                <SelectItem
                                                    key={status}
                                                    value={status}
                                                >
                                                    {status
                                                        .replace('_', ' ')
                                                        .replace(
                                                            /\b\w/g,
                                                            (c) =>
                                                                c.toUpperCase(),
                                                        )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="max-h-80 space-y-2 overflow-auto rounded-md border p-3">
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
                                                {item.product_size?.name ?? '-'}
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
                                        className="grid gap-3 rounded-md border border-neutral-200/60 p-4 dark:border-neutral-800 sm:grid-cols-6"
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
