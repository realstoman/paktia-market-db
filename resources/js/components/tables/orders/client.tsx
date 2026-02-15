import InputError from '@/components/input-error';
import Heading from '@/components/shared/heading';
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
import { Order, Branch, Product } from '@/types';
import { formatNumber, formatPrice } from '@/utils/format';
import { router } from '@inertiajs/react';
import { ClipboardList, Plus, Save, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
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

export const OrdersClient: React.FC<OrdersClientProps> = ({
    data,
    branches,
    products,
    isLoading = false,
}) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [branchId, setBranchId] = useState('');
    const [orderType, setOrderType] = useState('dine_in');
    const [items, setItems] = useState<OrderItemDraft[]>([
        {
            productId: '',
            sizeId: '',
            quantity: '1',
            price: '',
        },
    ]);
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setBranchId('');
        setOrderType('dine_in');
        setItems([
            {
                productId: '',
                sizeId: '',
                quantity: '1',
                price: '',
            },
        ]);
        setCreateErrors({});
    };

    const getProductById = (productId: string) =>
        products.find((product) => String(product.id) === productId);

    const handleProductChange = (index: number, productId: string) => {
        const product = getProductById(productId);
        setItems((prev) =>
            prev.map((item, idx) =>
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

    const handleSizeChange = (index: number, sizeId: string) => {
        const product = getProductById(items[index].productId);
        const size = product?.sizes?.find(
            (sizeOption) => String(sizeOption.id) === sizeId,
        );

        const priceFromSize =
            size?.pivot?.price !== undefined ? String(size.pivot.price) : '';

        setItems((prev) =>
            prev.map((item, idx) =>
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
        index: number,
        field: keyof OrderItemDraft,
        value: string,
    ) => {
        setItems((prev) =>
            prev.map((item, idx) =>
                idx === index
                    ? {
                          ...item,
                          [field]: value,
                      }
                    : item,
            ),
        );
    };

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            { productId: '', sizeId: '', quantity: '1', price: '' },
        ]);
    };

    const removeItem = (index: number) => {
        setItems((prev) => prev.filter((_, idx) => idx !== index));
    };

    const totalAmount = items.reduce((total, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return total + price * quantity;
    }, 0);

    const handleCreateSubmit = () => {
        if (!branchId || items.length === 0 || isSubmitting) {
            return;
        }

        const payloadItems = items
            .filter((item) => item.productId && item.quantity && item.price)
            .map((item) => ({
                product_id: Number(item.productId),
                product_size_id: item.sizeId ? Number(item.sizeId) : null,
                quantity: Number(item.quantity),
                price: Number(item.price),
            }));

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
                    resetForm();
                },
                onError: (errors) => {
                    setCreateErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const tableColumns = useMemo(() => buildColumns(), []);

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`Orders: ${formatNumber(data.length)}`}
                    description="Track and manage orders"
                />
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Order
                </Button>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={['id', 'branch.name', 'status']}
                columns={tableColumns}
                data={data}
                isLoading={isLoading}
                searchPlaceholder="Search orders by branch or status..."
            />

            <Dialog
                open={isCreateOpen}
                onOpenChange={(open) => {
                    setIsCreateOpen(open);
                    if (!open) {
                        resetForm();
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
                            Add items and finalize order details.
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
                            <Select
                                value={orderType}
                                onValueChange={setOrderType}
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
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                                Order Items
                            </h4>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addItem}
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

                                return (
                                    <div
                                        key={`order-item-${index}`}
                                        className="grid gap-3 rounded-md border border-neutral-200/60 p-4 dark:border-neutral-800 sm:grid-cols-5"
                                    >
                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label>Product</Label>
                                            <Select
                                                value={item.productId}
                                                onValueChange={(value) =>
                                                    handleProductChange(
                                                        index,
                                                        value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select product" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map((product) => (
                                                        <SelectItem
                                                            key={product.id}
                                                            value={String(
                                                                product.id,
                                                            )}
                                                        >
                                                            {product.name}
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
                                                step="0.01"
                                                value={item.price}
                                                onChange={(event) =>
                                                    handleItemChange(
                                                        index,
                                                        'price',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="flex items-end justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    removeItem(index)
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
                                {formatPrice(totalAmount)}
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
                                isSubmitting
                            }
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Create Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
