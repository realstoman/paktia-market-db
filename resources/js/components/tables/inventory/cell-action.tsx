import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Branch, InventoryItem } from '@/types';
import { formatPrice } from '@/utils/format';
import { router } from '@inertiajs/react';
import { Eye, MoreHorizontal, Save, PackagePlus, Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CellActionProps {
    data: InventoryItem;
    branches: Branch[];
}

export const CellAction: React.FC<CellActionProps> = ({ data, branches }) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isRestockOpen, setIsRestockOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [restockQty, setRestockQty] = useState('');
    const [restockNote, setRestockNote] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editBranchId, setEditBranchId] = useState(String(data.branch_id));
    const [editName, setEditName] = useState(data.name);
    const [editType, setEditType] = useState(data.type);
    const [editUnit, setEditUnit] = useState(data.unit ?? '');
    const [editQuantity, setEditQuantity] = useState(String(data.quantity ?? ''));
    const [editUnitPrice, setEditUnitPrice] = useState(
        String(data.unit_price ?? ''),
    );
    const [editDescription, setEditDescription] = useState(data.description ?? '');
    const [editUsable, setEditUsable] = useState(!!data.is_usable);
    const [editReceipt, setEditReceipt] = useState<File | null>(null);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);

    const latestTransactions = useMemo(
        () => (data.transactions ?? []).slice(0, 5),
        [data.transactions],
    );

    const editTotalPrice = useMemo(() => {
        const qty = Number(editQuantity);
        const unitPrice = Number(editUnitPrice);
        if (Number.isNaN(qty) || Number.isNaN(unitPrice)) return 0;
        return qty * unitPrice;
    }, [editQuantity, editUnitPrice]);

    const resetEditForm = () => {
        setEditBranchId(String(data.branch_id));
        setEditName(data.name);
        setEditType(data.type);
        setEditUnit(data.unit ?? '');
        setEditQuantity(String(data.quantity ?? ''));
        setEditUnitPrice(String(data.unit_price ?? ''));
        setEditDescription(data.description ?? '');
        setEditUsable(!!data.is_usable);
        setEditReceipt(null);
        setEditErrors({});
    };

    const handleRestock = () => {
        if (!restockQty || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            `/inventory/${data.id}/restock`,
            {
                quantity: Number(restockQty),
                note: restockNote.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Item restocked successfully.');
                    setIsRestockOpen(false);
                    setRestockQty('');
                    setRestockNote('');
                    setErrors({});
                },
                onError: (validationErrors) => {
                    setErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            'Failed to restock item.',
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleUpdate = () => {
        if (
            !editName.trim() ||
            !editBranchId ||
            !editType ||
            !editQuantity ||
            !editUnitPrice ||
            isEditSubmitting
        ) {
            return;
        }

        setIsEditSubmitting(true);
        router.post(
            `/inventory/${data.id}`,
            {
                _method: 'put',
                branch_id: Number(editBranchId),
                name: editName.trim(),
                type: editType.trim(),
                unit: editUnit.trim() || null,
                quantity: Number(editQuantity),
                unit_price: Number(editUnitPrice),
                description: editDescription.trim() || null,
                is_usable: editUsable,
                receipt: editReceipt,
            },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Inventory item updated successfully.');
                    setIsEditOpen(false);
                    resetEditForm();
                },
                onError: (validationErrors) => {
                    setEditErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            'Failed to update inventory item.',
                    );
                },
                onFinish: () => {
                    setIsEditSubmitting(false);
                },
            },
        );
    };

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            resetEditForm();
                            setIsEditOpen(true);
                        }}
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsRestockOpen(true)}>
                        <PackagePlus className="mr-2 h-4 w-4" />
                        Restock
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Edit Inventory Item</DialogTitle>
                        <DialogDescription>
                            Update item details, price, quantity, and receipt.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input
                                value={editName}
                                onChange={(event) => setEditName(event.target.value)}
                            />
                            <InputError message={editErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Branch</Label>
                            <Select
                                value={editBranchId}
                                onValueChange={setEditBranchId}
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
                            <InputError message={editErrors.branch_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Type</Label>
                            <Input
                                value={editType}
                                onChange={(event) => setEditType(event.target.value)}
                            />
                            <InputError message={editErrors.type} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Unit</Label>
                            <Input
                                value={editUnit}
                                onChange={(event) => setEditUnit(event.target.value)}
                            />
                            <InputError message={editErrors.unit} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editQuantity}
                                onChange={(event) =>
                                    setEditQuantity(event.target.value)
                                }
                            />
                            <InputError message={editErrors.quantity} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Single Price</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editUnitPrice}
                                onChange={(event) =>
                                    setEditUnitPrice(event.target.value)
                                }
                            />
                            <InputError message={editErrors.unit_price} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Total Price (Auto)</Label>
                            <Input
                                value={formatPrice(editTotalPrice)}
                                readOnly
                                className="bg-muted"
                            />
                        </div>
                        <div className="flex items-end">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={editUsable}
                                    onCheckedChange={(checked) =>
                                        setEditUsable(!!checked)
                                    }
                                />
                                <span className="text-sm text-muted-foreground">
                                    Usable item
                                </span>
                            </div>
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label>Description</Label>
                            <Textarea
                                value={editDescription}
                                onChange={(event) =>
                                    setEditDescription(event.target.value)
                                }
                            />
                            <InputError message={editErrors.description} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor={`edit-receipt-${data.id}`}>
                                Replace Receipt/Bill (optional)
                            </Label>
                            <Input
                                id={`edit-receipt-${data.id}`}
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(event) =>
                                    setEditReceipt(event.target.files?.[0] ?? null)
                                }
                            />
                            {data.receipt_url || data.receipt_path ? (
                                <a
                                    href={String(data.receipt_url ?? data.receipt_path)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    View current receipt
                                </a>
                            ) : null}
                            {editReceipt ? (
                                <p className="text-xs text-muted-foreground">
                                    New file: {editReceipt.name}
                                </p>
                            ) : null}
                            <InputError message={editErrors.receipt} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditOpen(false)}
                            disabled={isEditSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={
                                !editName.trim() ||
                                !editBranchId ||
                                !editType.trim() ||
                                !editQuantity ||
                                !editUnitPrice ||
                                isEditSubmitting
                            }
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{data.name}</DialogTitle>
                        <DialogDescription>
                            Inventory item details and latest transactions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-muted-foreground">Type</p>
                            <p className="font-medium capitalize">{data.type}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Branch</p>
                            <p className="font-medium">
                                {data.branch?.name ?? 'Unknown'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Stock</p>
                            <p className="font-medium">
                                {Number(data.quantity)} {data.unit ?? 'unit'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Usable</p>
                            <p className="font-medium">
                                {data.is_usable ? 'Yes' : 'No'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Single Price
                            </p>
                            <p className="font-medium">
                                {formatPrice(data.unit_price ?? 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Total Price
                            </p>
                            <p className="font-medium">
                                {formatPrice(
                                    Number(data.quantity || 0) *
                                        Number(data.unit_price || 0),
                                )}
                            </p>
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-xs text-muted-foreground">
                                Receipt/Bill
                            </p>
                            {data.receipt_url || data.receipt_path ? (
                                <a
                                    href={String(data.receipt_url ?? data.receipt_path)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-blue-600 hover:underline"
                                >
                                    View uploaded receipt
                                </a>
                            ) : (
                                <p className="font-medium">-</p>
                            )}
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-xs text-muted-foreground">
                                Description
                            </p>
                            <p className="font-medium">
                                {data.description || '-'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">Latest Transactions</p>
                        <div className="max-h-48 space-y-2 overflow-auto rounded-md border p-3">
                            {latestTransactions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No transactions yet.
                                </p>
                            ) : (
                                latestTransactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between rounded-md border p-2 text-sm"
                                    >
                                        <span className="capitalize">
                                            {transaction.action.replace('_', ' ')}
                                        </span>
                                        <span>
                                            {Number(transaction.quantity)}{' '}
                                            {data.unit ?? 'unit'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isRestockOpen} onOpenChange={setIsRestockOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Restock {data.name}</DialogTitle>
                        <DialogDescription>
                            Increase stock quantity for this inventory item.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor={`restock-qty-${data.id}`}>
                                Quantity to add ({data.unit ?? 'unit'})
                            </Label>
                            <Input
                                id={`restock-qty-${data.id}`}
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={restockQty}
                                onChange={(event) =>
                                    setRestockQty(event.target.value)
                                }
                            />
                            <InputError message={errors.quantity} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`restock-note-${data.id}`}>
                                Note (optional)
                            </Label>
                            <Textarea
                                id={`restock-note-${data.id}`}
                                value={restockNote}
                                onChange={(event) =>
                                    setRestockNote(event.target.value)
                                }
                            />
                            <InputError message={errors.note} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsRestockOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRestock}
                            disabled={!restockQty || isSubmitting}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Save Restock
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
