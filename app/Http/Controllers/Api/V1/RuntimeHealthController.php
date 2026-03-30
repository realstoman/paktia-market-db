<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BranchSyncCredential;
use App\Services\Operations\RuntimeHealthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RuntimeHealthController extends Controller
{
    public function __invoke(
        Request $request,
        RuntimeHealthService $runtimeHealthService,
    ): JsonResponse {
        /** @var BranchSyncCredential|null $credential */
        $credential = $request->attributes->get('branchSyncCredential');

        return response()->json([
            'data' => $runtimeHealthService->snapshot(),
            'meta' => [
                'generatedAt' => now()->toIso8601String(),
                'server' => [
                    'appName' => (string) config('app.name'),
                    'environment' => (string) config('app.env'),
                ],
                'branchSync' => [
                    'branchId' => $credential?->branch_id,
                    'credentialId' => $credential?->id,
                    'credentialName' => $credential?->name,
                    'abilities' => $credential?->abilities ?? [],
                ],
            ],
        ]);
    }
}
