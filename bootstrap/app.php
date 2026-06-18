<?php

use App\Http\Middleware\EnsureIdempotentRequests;
use App\Http\Middleware\EnsurePropertySyncAuthenticated;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\HandleLocale;
use App\Http\Middleware\SetSecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: [
            'appearance',
            'sidebar_state',
            'locale',
        ]);

        $middleware->alias([
            'property.sync' => EnsurePropertySyncAuthenticated::class,
            'idempotency' => EnsureIdempotentRequests::class,
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);

        $middleware->web(append: [
            HandleLocale::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            SetSecurityHeaders::class,
        ]);

        $middleware->api(append: [
            SetSecurityHeaders::class,
        ]);

        $middleware->redirectGuestsTo('/login');
        $middleware->redirectUsersTo('/dashboard');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            $status = $response->getStatusCode();

            if ($request->is('api/*') || $request->expectsJson()) {
                return $response;
            }

            if (
                $status === 403 &&
                $request->user() &&
                ! app()->environment('testing')
            ) {
                $dashboardUrl = route('dashboard');
                $currentUrl = $request->fullUrl();
                $previousUrl = url()->previous();
                $previousHost = $previousUrl ? parse_url($previousUrl, PHP_URL_HOST) : null;
                $currentHost = $request->getHost();

                $targetUrl = $dashboardUrl;

                if (
                    filled($previousUrl) &&
                    $previousHost === $currentHost &&
                    $previousUrl !== $currentUrl
                ) {
                    $targetUrl = $previousUrl;
                }

                if ($targetUrl !== $currentUrl) {
                    return redirect()
                        ->to($targetUrl)
                        ->with('unauthorized_access', [
                            'show' => true,
                            'path' => '/'.$request->path(),
                        ]);
                }
            }

            // Page expired (CSRF token mismatch). Bounce back with a flash
            // notification rather than dumping the raw 419 page.
            if ($status === 419) {
                return redirect()
                    ->back(fallback: route('dashboard'))
                    ->with('notification', [
                        'id' => 'http-419-'.bin2hex(random_bytes(4)),
                        'category' => 'system',
                        'title' => 'Page expired',
                        'description' => 'Your session expired before this action could complete. Please try again.',
                        'priority' => 'medium',
                    ]);
            }

            // Rate limit hit. Friendly flash + back redirect so the user
            // doesn't see the raw 429 page.
            if ($status === 429) {
                return redirect()
                    ->back(fallback: route('dashboard'))
                    ->with('notification', [
                        'id' => 'http-429-'.bin2hex(random_bytes(4)),
                        'category' => 'system',
                        'title' => 'Too many requests',
                        'description' => 'You\'re going a bit fast. Wait a moment and try again.',
                        'priority' => 'high',
                    ]);
            }

            if (! in_array($status, [403, 404, 500, 503], true)) {
                return $response;
            }

            if (app()->environment(['local', 'testing']) && ! in_array($status, [403, 404], true)) {
                return $response;
            }

            return Inertia::render('errors/http-status', [
                'status' => $status,
            ])->toResponse($request)->setStatusCode($status);
        });
    })->create();
