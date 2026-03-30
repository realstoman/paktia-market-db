<?php

namespace App\Http\Middleware;

use App\Models\IdempotencyRequest;
use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Throwable;

class EnsureIdempotentRequests
{
    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        if (! $request->isMethodCacheable() && $request->expectsJson()) {
            $key = trim((string) $request->header('Idempotency-Key', ''));

            if ($key === '') {
                return $next($request);
            }

            $scope = $this->resolveScope($request);
            $route = $request->route()?->getName() ?? $request->path();
            $fingerprint = hash(
                'sha256',
                implode('|', [
                    $request->method(),
                    $request->path(),
                    (string) $request->getContent(),
                ]),
            );

            $record = IdempotencyRequest::query()
                ->where('idempotency_key', $key)
                ->where('scope', $scope)
                ->where('method', $request->method())
                ->where('route', $route)
                ->first();

            if ($record) {
                if ($record->fingerprint !== $fingerprint) {
                    return $this->conflictResponse(
                        'This idempotency key has already been used with a different request payload.',
                    );
                }

                if ($record->completed_at && $record->response_body !== null) {
                    return $this->replayResponse($record);
                }

                return $this->conflictResponse(
                    'A matching request is already being processed. Please retry shortly.',
                );
            }

            try {
                $record = IdempotencyRequest::query()->create([
                    'idempotency_key' => $key,
                    'scope' => $scope,
                    'method' => $request->method(),
                    'route' => $route,
                    'fingerprint' => $fingerprint,
                    'expires_at' => now()->addDay(),
                ]);
            } catch (QueryException) {
                $existing = IdempotencyRequest::query()
                    ->where('idempotency_key', $key)
                    ->where('scope', $scope)
                    ->where('method', $request->method())
                    ->where('route', $route)
                    ->first();

                if ($existing && $existing->completed_at && $existing->response_body !== null) {
                    return $this->replayResponse($existing);
                }

                return $this->conflictResponse(
                    'A matching request is already being processed. Please retry shortly.',
                );
            }

            try {
                $response = $next($request);
            } catch (Throwable $throwable) {
                $record->delete();
                throw $throwable;
            }

            $record->forceFill([
                'response_status' => $response->getStatusCode(),
                'response_headers' => [
                    'Content-Type' => $response->headers->get('Content-Type', 'application/json'),
                ],
                'response_body' => $response->getContent(),
                'completed_at' => now(),
            ])->save();

            return $response;
        }

        return $next($request);
    }

    private function resolveScope(Request $request): string
    {
        $userId = $request->user()?->getKey();
        if ($userId) {
            return "user:{$userId}";
        }

        $clientId = $request->attributes->get('client')?->id;
        if ($clientId) {
            return "client:{$clientId}";
        }

        $guestSessionId = $request->attributes->get('guestSession')?->id;
        if ($guestSessionId) {
            return "guest-session:{$guestSessionId}";
        }

        return 'ip:'.$request->ip();
    }

    private function replayResponse(IdempotencyRequest $record): Response|JsonResponse
    {
        return response(
            $record->response_body,
            $record->response_status ?? 200,
            $record->response_headers ?? ['Content-Type' => 'application/json'],
        );
    }

    private function conflictResponse(string $message): JsonResponse
    {
        return response()->json([
            'message' => $message,
        ], 409);
    }
}
