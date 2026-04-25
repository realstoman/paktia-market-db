<?php

use App\Http\Middleware\AuthenticateFirebaseUser;
use App\Http\Middleware\EnsureAppAuthenticated;
use App\Http\Middleware\EnsureBranchSyncAuthenticated;
use App\Http\Middleware\EnsureCartActor;
use App\Http\Middleware\EnsureClientAuthenticated;
use App\Http\Middleware\EnsureIdempotentRequests;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\HandleLocale;
use App\Http\Middleware\ResolveFirebaseUser;
use App\Http\Middleware\ResolveGuestSession;
use App\Http\Middleware\SetSecurityHeaders;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
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
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state', 'locale']);

        $middleware->alias([
            'app.auth' => EnsureAppAuthenticated::class,
            'branch.sync' => EnsureBranchSyncAuthenticated::class,
            'resolve.guest' => ResolveGuestSession::class,
            'resolve.firebase' => ResolveFirebaseUser::class,
            'firebase.auth' => AuthenticateFirebaseUser::class,
            'cart.actor' => EnsureCartActor::class,
            'client.auth' => EnsureClientAuthenticated::class,
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
        $exceptions->respond(function (Response $response, \Throwable $exception, Request $request) {
            $status = $response->getStatusCode();

            if ($request->is('api/*') || $request->expectsJson()) {
                return $response;
            }

            if ($status === 403 && $request->user()) {
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
