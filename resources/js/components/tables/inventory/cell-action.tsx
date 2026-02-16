import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { InventoryItem } from '@/types';
import { router } from '@inertiajs/react';
import { Eye, MoreHorizontal, Save, PackagePlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CellActionProps {
    data: InventoryItem;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isRestockOpen, setIsRestockOpen] = useState(false);
    const [restockQty, setRestockQty] = useState('');
    const [restockNote, setRestockNote] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const latestTransactions = useMemo(
        () => (data.transactions ?? []).slice(0, 5),
        [data.transactions],
    );

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
                    <DropdownMenuItem onClick={() => setIsRestockOpen(true)}>
                        <PackagePlus className="mr-2 h-4 w-4" />
                        Restock
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

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
