<?php

namespace App\Http\Controllers;

use App\Services\ToolReferenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ToolReferenceController extends Controller
{
    public function __invoke(Request $request, ToolReferenceService $toolReferenceService): JsonResponse
    {
        abort_unless($request->user()?->hasRole('super-admin'), 403);

        return response()->json([
            'data' => $toolReferenceService->all(),
        ]);
    }
}
