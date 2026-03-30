<?php

use App\Http\Middleware\AuthenticateFirebaseUser;
use App\Http\Middleware\EnsureAppAuthenticated;
use App\Http\Middleware\EnsureCartActor;
use App\Http\Middleware\EnsureClientAuthenticated;
use App\Http\Middleware\EnsureIdempotentRequests;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\ResolveFirebaseUser;
use App\Http\Middleware\ResolveGuestSession;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->alias([
            'app.auth' => EnsureAppAuthenticated::class,
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
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->redirectGuestsTo('/login');
        $middleware->redirectUsersTo('/dashboard');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
