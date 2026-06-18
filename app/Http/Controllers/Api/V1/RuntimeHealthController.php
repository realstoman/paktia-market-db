<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PropertySyncCredential;
use App\Services\Operations\RuntimeHealthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RuntimeHealthController extends Controller
{
    public function __invoke(
        Request $request,
        RuntimeHealthService $runtimeHealthService,
    ): JsonResponse {
        /** @var PropertySyncCredential|null $credential */
        $credential = $request->attributes->get('propertySyncCredential');

        return response()->json([
            'data' => $runtimeHealthService->snapshot(),
            'meta' => [
                'generatedAt' => now()->toIso8601String(),
                'server' => [
                    'appName' => (string) config('app.name'),
                    'environment' => (string) config('app.env'),
                ],
                'propertySync' => [
                    'propertyId' => $credential?->property_id,
                    'credentialId' => $credential?->id,
                    'credentialName' => $credential?->name,
                    'abilities' => $credential?->abilities ?? [],
                ],
            ],
        ]);
    }
}
