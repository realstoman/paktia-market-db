<?php

namespace App\Http\Middleware;

use App\Services\Web\CustomerSessionCookieService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateCustomerSession
{
    public function __construct(private readonly CustomerSessionCookieService $customerSessionCookieService) {}

    public function handle(Request $request, Closure $next): Response
    {
        $client = $this->customerSessionCookieService->resolveClientFromRequest($request);

        if (! $client) {
            return response()->json([
                'message' => 'Authenticated customer session is required.',
            ], 401);
        }

        $request->attributes->set('client', $client);

        return $next($request);
    }
}
