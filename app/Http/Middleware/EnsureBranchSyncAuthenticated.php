<?php

namespace App\Http\Middleware;

use App\Services\BranchSync\BranchSyncCredentialService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBranchSyncAuthenticated
{
    /**
     * Header that branch-local servers MUST use to send their sync token.
     * Authorization: Bearer is intentionally not accepted here so the
     * header has unambiguous semantics and can be allow-listed in proxies.
     */
    public const TOKEN_HEADER = 'X-Branch-Token';

    public function __construct(
        private readonly BranchSyncCredentialService $branchSyncCredentialService,
    ) {}

    public function handle(Request $request, Closure $next, string $ability = '*'): Response
    {
        $token = (string) $request->header(self::TOKEN_HEADER, '');

        if ($token === '') {
            return $this->unauthorizedResponse('Missing branch sync token.');
        }

        $credential = $this->branchSyncCredentialService->validate($token, $ability);

        if (! $credential) {
            return $this->unauthorizedResponse('Unauthorized branch sync client.');
        }

        $request->attributes->set('branchSyncCredential', $credential);
        $request->attributes->set('syncBranch', $credential->branch);

        return $next($request);
    }

    private function unauthorizedResponse(string $message): Response
    {
        return response()->json([
            'message' => $message,
        ], 401, [
            // Tell well-behaved clients which header to use.
            'WWW-Authenticate' => self::TOKEN_HEADER,
        ]);
    }
}
