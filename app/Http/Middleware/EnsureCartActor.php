<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCartActor
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->attributes->has('guestSession') && ! $request->attributes->has('firebaseUser')) {
            return response()->json([
                'message' => 'A guest session or authenticated user is required.',
            ], 401);
        }

        return $next($request);
    }
}
