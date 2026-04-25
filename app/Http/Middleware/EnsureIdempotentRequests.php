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

                if ($record->completed_at) {
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

                if ($existing && $existing->completed_at) {
                    return $this->replayResponse($existing);
                }

                return $this->conflictResponse(
                    'A matching request is already being processed. Please retry shortly.',
                );
            }

            try {
                $response = $next($request);
            } catch (Throwable $throwable) {
                // Preserve idempotency on failures: persist a synthetic 500
                // response so a retried key sees the same error rather than
                // re-executing the side effects of the original handler.
                $this->persistResponse(
                    $record,
                    500,
                    'application/json',
                    json_encode([
                        'message' => 'The original request failed. Use a new Idempotency-Key to retry.',
                    ], JSON_THROW_ON_ERROR),
                );

                throw $throwable;
            }

            $this->persistResponse(
                $record,
                $response->getStatusCode(),
                (string) $response->headers->get('Content-Type', 'application/json'),
                (string) $response->getContent(),
            );

            return $response;
        }

        return $next($request);
    }

    private function persistResponse(
        IdempotencyRequest $record,
        int $status,
        string $contentType,
        string $body,
    ): void {
        $record->forceFill([
            'response_status' => $status,
            'response_headers' => ['Content-Type' => $contentType],
            'response_body' => $body,
            'completed_at' => now(),
        ])->save();
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
        $headers = $record->response_headers ?? ['Content-Type' => 'application/json'];
        // Mark the response so well-behaved clients can detect a replay.
        $headers['Idempotency-Replayed'] = 'true';

        return response(
            $record->response_body ?? '',
            $record->response_status ?? 200,
            $headers,
        );
    }

    private function conflictResponse(string $message): JsonResponse
    {
        return response()->json([
            'message' => $message,
        ], 409);
    }
}
