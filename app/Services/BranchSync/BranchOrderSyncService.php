<?php

namespace App\Services\BranchSync;

use App\Models\Branch;
use App\Models\BranchSyncCursor;
use App\Models\Order;
use App\Services\Order\OrderItemService;
use Carbon\Carbon;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

class BranchOrderSyncService
{
    public function __construct(
        private readonly OrderItemService $orderItemService,
    ) {}

    public function buildInboundPayload(Branch $branch, ?string $updatedSince = null, int $limit = 100): array
    {
        $orders = Order::query()
            ->where('branch_id', $branch->id)
            ->whereIn('source', ['mobile_app', 'website'])
            ->when(
                $updatedSince,
                fn ($query) => $query->where('updated_at', '>', Carbon::parse($updatedSince))
            )
            ->with([
                'branch:id,name',
                'branchTable:id,table_number,title',
                'user:id,name',
                'client:id,first_name,last_name,phone',
                'items.product.category',
                'items.productSize',
                'items.kitchen',
            ])
            ->withCount('items')
            ->orderBy('updated_at')
            ->orderBy('id')
            ->limit(max(1, min($limit, 250)))
            ->get();

        return [
            'data' => \App\Http\Resources\Api\V1\OrderResource::collection($orders)->resolve(),
            'meta' => [
                'branch_id' => $branch->id,
                'count' => $orders->count(),
                'cursor' => $orders->last()?->updated_at?->toIso8601String(),
            ],
        ];
    }

    public function importOutboundOrders(Branch $branch, array $orders): array
    {
        $imported = [];
        $skipped = [];

        foreach ($orders as $payload) {
            $result = $this->upsertOrderFromPayload($branch, $payload);

            if ($result['status'] === 'imported') {
                $imported[] = $result['order']->sync_uuid;
            } else {
                $skipped[] = [
                    'sync_uuid' => $payload['sync_uuid'] ?? null,
                    'reason' => $result['reason'],
                ];
            }
        }

        return [
            'imported' => $imported,
            'skipped' => $skipped,
        ];
    }

    public function exportLocalOrders(Branch $branch, ?string $updatedSince = null, int $limit = 100): array
    {
        $orders = Order::query()
            ->where('branch_id', $branch->id)
            ->whereNotIn('source', ['mobile_app', 'website'])
            ->when(
                $updatedSince,
                fn ($query) => $query->where('updated_at', '>', Carbon::parse($updatedSince))
            )
            ->with([
                'branch:id,name',
                'branchTable:id,table_number,title',
                'user:id,name',
                'client:id,first_name,last_name,phone',
                'items.product.category',
                'items.productSize',
                'items.kitchen',
            ])
            ->withCount('items')
            ->orderBy('updated_at')
            ->orderBy('id')
            ->limit(max(1, min($limit, 250)))
            ->get();

        return [
            'orders' => \App\Http\Resources\Api\V1\OrderResource::collection($orders)->resolve(),
            'cursor' => $orders->last()?->updated_at?->toIso8601String(),
        ];
    }

    public function importInboundOrders(Branch $branch, array $orders): array
    {
        return $this->importOrdersForBranch($branch, $orders);
    }

    public function syncWithRemote(Branch $branch): array
    {
        $remoteBaseUrl = rtrim((string) config('pos.sync.remote_base_url'), '/');
        $token = (string) config('pos.sync.remote_branch_token');

        if ($remoteBaseUrl === '' || $token === '') {
            throw new \RuntimeException('POS sync remote base URL or branch token is not configured.');
        }

        $outboundCursor = $this->cursor($branch, 'orders.outbound');
        $outboundPayload = $this->exportLocalOrders(
            $branch,
            $outboundCursor?->last_synced_at?->toIso8601String(),
            (int) config('pos.sync.chunk_size', 100),
        );

        $client = $this->remoteClient($remoteBaseUrl, $token);

        $pushResponse = $client
            ->post('/api/v1/branch-sync/orders/outbound', [
                'orders' => $outboundPayload['orders'],
            ])
            ->throw()
            ->json();

        if (! empty($outboundPayload['cursor'])) {
            BranchSyncCursor::query()->updateOrCreate(
                ['branch_id' => $branch->id, 'direction' => 'orders.outbound'],
                ['last_synced_at' => Carbon::parse($outboundPayload['cursor'])],
            );
        }

        $inboundCursor = $this->cursor($branch, 'orders.inbound');

        $pullResponse = $client
            ->get('/api/v1/branch-sync/orders/inbound', [
                'updated_since' => $inboundCursor?->last_synced_at?->toIso8601String(),
                'limit' => (int) config('pos.sync.chunk_size', 100),
            ])
            ->throw()
            ->json();

        $importResult = $this->importInboundOrders($branch, $pullResponse['data'] ?? []);

        if (! empty($pullResponse['meta']['cursor'])) {
            BranchSyncCursor::query()->updateOrCreate(
                ['branch_id' => $branch->id, 'direction' => 'orders.inbound'],
                ['last_synced_at' => Carbon::parse((string) $pullResponse['meta']['cursor'])],
            );
        }

        return [
            'pushed' => $pushResponse['meta']['imported_count'] ?? 0,
            'pulled' => count($pullResponse['data'] ?? []),
            'imported_inbound' => count($importResult['imported'] ?? []),
            'skipped_inbound' => count($importResult['skipped'] ?? []),
        ];
    }

    private function importOrdersForBranch(Branch $branch, array $orders): array
    {
        $imported = [];
        $skipped = [];

        foreach ($orders as $payload) {
            $result = $this->upsertOrderFromPayload($branch, $payload);

            if ($result['status'] === 'imported') {
                $imported[] = $result['order']->sync_uuid;
            } else {
                $skipped[] = [
                    'sync_uuid' => $payload['sync_uuid'] ?? null,
                    'reason' => $result['reason'],
                ];
            }
        }

        return [
            'imported' => $imported,
            'skipped' => $skipped,
        ];
    }

    private function upsertOrderFromPayload(Branch $branch, array $payload): array
    {
        $syncUuid = trim((string) ($payload['sync_uuid'] ?? ''));

        if ($syncUuid === '') {
            return [
                'status' => 'skipped',
                'reason' => 'Missing sync_uuid.',
            ];
        }

        $existing = Order::query()
            ->with('items')
            ->where('sync_uuid', $syncUuid)
            ->first();

        $incomingUpdatedAt = isset($payload['updated_at'])
            ? Carbon::parse((string) $payload['updated_at'])
            : null;

        if ($existing && $incomingUpdatedAt && $existing->updated_at && $existing->updated_at->gt($incomingUpdatedAt)) {
            return [
                'status' => 'skipped',
                'reason' => 'Incoming payload is older than the local order state.',
            ];
        }

        $source = (string) ($payload['source'] ?? 'pos');
        $syncOrigin = $source === 'pos' ? 'local' : 'remote';

        $attributes = [
            'sync_uuid' => $syncUuid,
            'branch_id' => $branch->id,
            'branch_table_id' => $payload['branch_table_id'] ?? null,
            'user_id' => $existing?->user_id,
            'client_id' => $payload['client_id'] ?? null,
            'order_type' => $payload['order_type'] ?? 'takeaway',
            'source' => $source,
            'sync_origin' => $syncOrigin,
            'customer_name' => $payload['customer_name'] ?? null,
            'customer_phone' => $payload['customer_phone'] ?? null,
            'delivery_address' => $payload['delivery_address'] ?? null,
            'customer_note' => $payload['customer_note'] ?? null,
            'base_currency' => $payload['base_currency'] ?? 'AFN',
            'exchange_rate' => $payload['exchange_rate'] ?? null,
            'sub_total_amount' => $payload['sub_total_amount'] ?? 0,
            'discount_amount' => $payload['discount_amount'] ?? 0,
            'tax_amount' => $payload['tax_amount'] ?? 0,
            'service_charge_amount' => $payload['service_charge_amount'] ?? 0,
            'total_amount' => $payload['total_amount'] ?? 0,
            'paid_amount' => $payload['paid_amount'] ?? 0,
            'change_amount' => $payload['change_amount'] ?? 0,
            'refund_amount' => $payload['refund_amount'] ?? 0,
            'status' => $payload['status'] ?? 'pending',
            'completed_at' => $payload['completed_at'] ?? null,
            'cancelled_at' => $payload['cancelled_at'] ?? null,
        ];

        $order = $existing ?? new Order();
        $order->fill($attributes);
        $order->save();

        $items = collect($payload['items'] ?? [])
            ->map(fn (array $item) => [
                'product_id' => $item['product_id'],
                'product_size_id' => $item['product_size_id'] ?? null,
                'quantity' => $item['quantity'],
                'price' => $item['price'],
                'note' => $item['note'] ?? null,
            ])
            ->filter(fn (array $item) => ! empty($item['product_id']))
            ->values()
            ->all();

        if (! empty($items)) {
            if ($existing) {
                $this->orderItemService->replaceForOrder($order, $items);
            } else {
                $this->orderItemService->createManyForOrder($order, $items);
            }
        }

        if (isset($payload['created_at']) || isset($payload['updated_at'])) {
            $order->forceFill([
                'created_at' => isset($payload['created_at']) ? Carbon::parse((string) $payload['created_at']) : $order->created_at,
                'updated_at' => $incomingUpdatedAt ?? $order->updated_at,
            ])->saveQuietly();
        }

        return [
            'status' => 'imported',
            'order' => $order->fresh(['items.product.category', 'items.productSize', 'items.kitchen']),
        ];
    }

    private function cursor(Branch $branch, string $direction): ?BranchSyncCursor
    {
        return BranchSyncCursor::query()
            ->where('branch_id', $branch->id)
            ->where('direction', $direction)
            ->first();
    }

    private function remoteClient(string $remoteBaseUrl, string $token): PendingRequest
    {
        return Http::baseUrl($remoteBaseUrl)
            ->acceptJson()
            ->contentType('application/json')
            ->timeout((int) config('pos.sync.http_timeout_seconds', 10))
            ->withHeaders([
                \App\Http\Middleware\EnsureBranchSyncAuthenticated::TOKEN_HEADER => $token,
            ]);
    }
}
