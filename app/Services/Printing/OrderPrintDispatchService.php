<?php

namespace App\Services\Printing;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PrintJob;
use App\Models\PrinterAssignment;
use App\Models\User;
use Illuminate\Support\Collection;

class OrderPrintDispatchService
{
    public function __construct(
        private readonly PrintJobService $printJobService,
    ) {}

    public function dispatchForCreatedOrder(Order $order, ?User $actor = null): void
    {
        $order = $this->loadOrderContext($order);

        $this->dispatchKitchenTickets(
            $order,
            $actor,
            titlePrefix: 'Kitchen Ticket',
            contextLabel: 'New order',
        );

        $this->dispatchOperatorCopies(
            $order,
            $actor,
            titlePrefix: 'Order Receipt',
            contextLabel: 'New order',
        );
    }

    public function dispatchForUpdatedOrder(Order $order, ?User $actor = null): void
    {
        $order = $this->loadOrderContext($order);

        $this->dispatchKitchenTickets(
            $order,
            $actor,
            titlePrefix: 'Kitchen Ticket Update',
            contextLabel: 'Added items',
        );

        $this->dispatchOperatorCopies(
            $order,
            $actor,
            titlePrefix: 'Updated Order Receipt',
            contextLabel: 'Updated order',
        );
    }

    private function dispatchKitchenTickets(
        Order $order,
        ?User $actor,
        string $titlePrefix,
        string $contextLabel,
    ): void {
        $pendingKitchenItems = $order->items
            ->filter(fn (OrderItem $item) => $item->kitchen_id !== null)
            ->filter(fn (OrderItem $item) => $item->kitchen_receipt_printed_at === null)
            ->groupBy('kitchen_id');

        foreach ($pendingKitchenItems as $kitchenId => $items) {
            $assignments = $this->resolveAssignments(
                branchId: (int) $order->branch_id,
                assignmentType: 'kitchen',
                kitchenId: (int) $kitchenId,
            );

            if ($assignments->isEmpty()) {
                continue;
            }

            $content = $this->buildKitchenTicket($order, $items, $contextLabel);
            $printed = false;

            foreach ($assignments as $assignment) {
                $job = PrintJob::query()->create([
                    'printer_id' => $assignment->printer_id,
                    'printer_assignment_id' => $assignment->id,
                    'branch_id' => $order->branch_id,
                    'requested_by' => $actor?->id ?? $order->user_id,
                    'job_type' => 'kitchen_ticket',
                    'status' => 'pending',
                    'title' => $titlePrefix.' #'.$order->id,
                    'payload' => [
                        'order_id' => $order->id,
                        'kitchen_id' => (int) $kitchenId,
                        'item_ids' => $items->pluck('id')->all(),
                        'context' => $contextLabel,
                    ],
                ]);

                $processed = $this->printJobService->process(
                    $job,
                    $assignment->printer,
                    $content,
                );

                if ($processed->status === 'printed') {
                    $printed = true;
                }
            }

            if ($printed) {
                OrderItem::query()
                    ->whereIn('id', $items->pluck('id'))
                    ->update([
                        'kitchen_receipt_printed_at' => now(),
                    ]);
            }
        }
    }

    private function dispatchOperatorCopies(
        Order $order,
        ?User $actor,
        string $titlePrefix,
        string $contextLabel,
    ): void {
        $assignments = collect();

        if ($actor?->hasRole('order-taker')) {
            $assignments = $assignments->merge($this->resolveAssignments(
                branchId: (int) $order->branch_id,
                assignmentType: 'order_taker',
            ));
        }

        if ($actor?->hasRole('cashier')) {
            $assignments = $assignments->merge($this->resolveAssignments(
                branchId: (int) $order->branch_id,
                assignmentType: 'cashier',
            ));
        }

        $assignments = $assignments->merge($this->resolveAssignments(
            branchId: (int) $order->branch_id,
            assignmentType: 'order_type',
            orderType: (string) ($order->order_type?->value ?? $order->order_type),
        ));

        $assignments = $assignments->merge($this->resolveAssignments(
            branchId: (int) $order->branch_id,
            assignmentType: 'generic',
        ));

        if ($assignments->isEmpty()) {
            return;
        }

        $assignments = $assignments
            ->unique(fn (PrinterAssignment $assignment) => $assignment->id)
            ->values();

        $content = $this->buildOperatorReceipt($order, $contextLabel);

        foreach ($assignments as $assignment) {
            $job = PrintJob::query()->create([
                'printer_id' => $assignment->printer_id,
                'printer_assignment_id' => $assignment->id,
                'branch_id' => $order->branch_id,
                'requested_by' => $actor?->id ?? $order->user_id,
                'job_type' => 'order_operator_copy',
                'status' => 'pending',
                'title' => $titlePrefix.' #'.$order->id,
                'payload' => [
                    'order_id' => $order->id,
                    'order_type' => (string) ($order->order_type?->value ?? $order->order_type),
                    'context' => $contextLabel,
                ],
            ]);

            $this->printJobService->process(
                $job,
                $assignment->printer,
                $content,
            );
        }
    }

    /**
     * @return Collection<int, PrinterAssignment>
     */
    private function resolveAssignments(
        int $branchId,
        string $assignmentType,
        ?int $kitchenId = null,
        ?string $orderType = null,
    ): Collection {
        return PrinterAssignment::query()
            ->with(['printer', 'kitchen'])
            ->where('assignment_type', $assignmentType)
            ->where('is_active', true)
            ->when($kitchenId !== null, fn ($query) => $query->where('kitchen_id', $kitchenId))
            ->when($orderType !== null, fn ($query) => $query->where('order_type', $orderType))
            ->whereHas('printer', function ($query) use ($branchId) {
                $query->where('is_active', true)
                    ->where(function ($branchQuery) use ($branchId) {
                        $branchQuery
                            ->whereNull('branch_id')
                            ->orWhere('branch_id', $branchId);
                    });
            })
            ->orderBy('priority')
            ->get();
    }

    private function buildKitchenTicket(
        Order $order,
        Collection $items,
        string $contextLabel,
    ): string {
        $firstItem = $items->first();
        $kitchenName = $firstItem?->kitchen?->name ?? 'Kitchen';
        $orderType = $this->humanizeOrderType((string) ($order->order_type?->value ?? $order->order_type));
        $headerLines = [
            config('app.name', 'Paktia Market'),
            $kitchenName,
            $contextLabel,
            'Order #'.$order->id,
            'Type: '.$orderType,
        ];

        if ($order->branchTable?->table_number) {
            $headerLines[] = 'Table: '.$order->branchTable->table_number;
        }

        if ($order->customer_name) {
            $headerLines[] = 'Customer: '.$order->customer_name;
        }

        $headerLines[] = 'Printed: '.now()->format('Y-m-d H:i');
        $headerLines[] = str_repeat('-', 32);

        $itemLines = $items
            ->map(function (OrderItem $item) {
                $name = trim(implode(' ', array_filter([
                    $item->product_name_snapshot,
                    $item->product_size_name_snapshot ? '('.$item->product_size_name_snapshot.')' : null,
                ])));

                $lines = [
                    $item->quantity.' x '.$name,
                ];

                if ($item->note) {
                    $lines[] = '  Note: '.$item->note;
                }

                return implode("\n", $lines);
            })
            ->all();

        return implode("\n", [
            ...$headerLines,
            implode("\n", $itemLines),
            str_repeat('-', 32),
            'Ready -> pass to service',
        ]);
    }

    private function buildOperatorReceipt(Order $order, string $contextLabel): string
    {
        $lines = [
            config('app.name', 'Paktia Market'),
            $contextLabel,
            'Order #'.$order->id,
            'Type: '.$this->humanizeOrderType((string) ($order->order_type?->value ?? $order->order_type)),
        ];

        if ($order->branchTable?->table_number) {
            $lines[] = 'Table: '.$order->branchTable->table_number;
        }

        if ($order->customer_name) {
            $lines[] = 'Customer: '.$order->customer_name;
        }

        if ($order->customer_phone) {
            $lines[] = 'Phone: '.$order->customer_phone;
        }

        if ($order->delivery_address) {
            $lines[] = 'Address: '.$order->delivery_address;
        }

        $lines[] = 'Printed: '.now()->format('Y-m-d H:i');
        $lines[] = str_repeat('-', 32);

        foreach ($order->items as $item) {
            $name = trim(implode(' ', array_filter([
                $item->product_name_snapshot,
                $item->product_size_name_snapshot ? '('.$item->product_size_name_snapshot.')' : null,
            ])));

            $lines[] = $item->quantity.' x '.$name;

            if ($item->note) {
                $lines[] = '  Note: '.$item->note;
            }
        }

        $lines[] = str_repeat('-', 32);
        $lines[] = 'Total: '.number_format((float) ($order->total_amount ?? 0), 2);

        return implode("\n", $lines);
    }

    private function loadOrderContext(Order $order): Order
    {
        return $order->fresh([
            'branch:id,name',
            'branchTable:id,table_number,title',
            'items.kitchen:id,name',
        ]);
    }

    private function humanizeOrderType(string $orderType): string
    {
        return match ($orderType) {
            'dine_in' => 'Dine In',
            'takeaway' => 'Takeaway',
            'delivery' => 'Delivery',
            default => ucfirst(str_replace('_', ' ', $orderType)),
        };
    }
}
