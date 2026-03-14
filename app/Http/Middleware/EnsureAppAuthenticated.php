<?php

namespace App\Http\Middleware;

use App\Services\Mobile\AppAuthService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAppAuthenticated
{
    public function __construct(private readonly AppAuthService $appAuthService) {}

    public function handle(Request $request, Closure $next): Response
    {
        $appKey = $request->header('X-App-Key');
        $platform = $request->header('X-App-Platform');

        if (! $this->appAuthService->validate($appKey, $platform)) {
            return response()->json([
                'message' => 'Unauthorized app client.',
            ], 401);
        }

        return $next($request);
    }
}
