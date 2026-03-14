<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCartActor
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->attributes->has('guestSession') && ! $request->attributes->has('client')) {
            return response()->json([
                'message' => 'A guest session or authenticated client is required.',
            ], 401);
        }

        return $next($request);
    }
}
