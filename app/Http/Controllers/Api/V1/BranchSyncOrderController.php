<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\BranchSync\BranchOrderSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchSyncOrderController extends Controller
{
    public function inbound(Request $request, BranchOrderSyncService $service): JsonResponse
    {
        $validated = $request->validate([
            'updated_since' => ['nullable', 'date'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:250'],
        ]);

        $branch = $request->attributes->get('syncBranch');

        return response()->json(
            $service->buildInboundPayload(
                $branch,
                $validated['updated_since'] ?? null,
                (int) ($validated['limit'] ?? 100),
            )
        );
    }

    public function outbound(Request $request, BranchOrderSyncService $service): JsonResponse
    {
        $validated = $request->validate([
            'orders' => ['required', 'array'],
            'orders.*.sync_uuid' => ['required', 'uuid'],
            'orders.*.branch_id' => ['nullable', 'integer'],
            'orders.*.client_id' => ['nullable', 'integer'],
            'orders.*.branch_table_id' => ['nullable', 'integer'],
            'orders.*.order_type' => ['required', 'string'],
            'orders.*.source' => ['nullable', 'string'],
            'orders.*.status' => ['required', 'string'],
            'orders.*.customer_name' => ['nullable', 'string'],
            'orders.*.customer_phone' => ['nullable', 'string'],
            'orders.*.delivery_address' => ['nullable', 'string'],
            'orders.*.customer_note' => ['nullable', 'string'],
            'orders.*.base_currency' => ['nullable', 'string'],
            'orders.*.exchange_rate' => ['nullable', 'numeric'],
            'orders.*.sub_total_amount' => ['nullable', 'numeric'],
            'orders.*.discount_amount' => ['nullable', 'numeric'],
            'orders.*.tax_amount' => ['nullable', 'numeric'],
            'orders.*.service_charge_amount' => ['nullable', 'numeric'],
            'orders.*.total_amount' => ['nullable', 'numeric'],
            'orders.*.paid_amount' => ['nullable', 'numeric'],
            'orders.*.change_amount' => ['nullable', 'numeric'],
            'orders.*.refund_amount' => ['nullable', 'numeric'],
            'orders.*.completed_at' => ['nullable', 'date'],
            'orders.*.cancelled_at' => ['nullable', 'date'],
            'orders.*.created_at' => ['nullable', 'date'],
            'orders.*.updated_at' => ['nullable', 'date'],
            'orders.*.items' => ['nullable', 'array'],
            'orders.*.items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'orders.*.items.*.product_size_id' => ['nullable', 'integer', 'exists:product_sizes,id'],
            'orders.*.items.*.quantity' => ['required', 'integer', 'min:1'],
            'orders.*.items.*.price' => ['required', 'numeric', 'min:0'],
            'orders.*.items.*.note' => ['nullable', 'string'],
        ]);

        $branch = $request->attributes->get('syncBranch');
        $result = $service->importOutboundOrders($branch, $validated['orders']);

        return response()->json([
            'data' => $result,
            'meta' => [
                'branch_id' => $branch->id,
                'imported_count' => count($result['imported']),
                'skipped_count' => count($result['skipped']),
            ],
        ]);
    }
}
