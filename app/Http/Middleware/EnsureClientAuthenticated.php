<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureClientAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->attributes->has('client')) {
            return response()->json([
                'message' => 'Authenticated client context is required.',
            ], 401);
        }

        return $next($request);
    }
}
