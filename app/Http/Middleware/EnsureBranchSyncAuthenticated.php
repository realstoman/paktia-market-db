<?php

namespace App\Http\Middleware;

use App\Services\BranchSync\BranchSyncCredentialService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBranchSyncAuthenticated
{
    public function __construct(
        private readonly BranchSyncCredentialService $branchSyncCredentialService,
    ) {}

    public function handle(Request $request, Closure $next, string $ability = '*'): Response
    {
        $token = $request->header('X-Branch-Token')
            ?: $request->bearerToken();

        $credential = $this->branchSyncCredentialService->validate($token, $ability);

        if (! $credential) {
            return response()->json([
                'message' => 'Unauthorized branch sync client.',
            ], 401);
        }

        $request->attributes->set('branchSyncCredential', $credential);
        $request->attributes->set('syncBranch', $credential->branch);

        return $next($request);
    }
}
