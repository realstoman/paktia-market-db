<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class HandleLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $supportedLocales = config('localization.supported', []);
        $defaultLocale = config('app.locale', 'fa');
        $cookieName = (string) config('localization.cookie_name', 'locale');
        $requestedLocale = (string) $request->cookie($cookieName, $defaultLocale);
        $locale = array_key_exists($requestedLocale, $supportedLocales)
            ? $requestedLocale
            : $defaultLocale;
        $direction = (string) data_get($supportedLocales, "{$locale}.direction", 'ltr');

        App::setLocale($locale);

        View::share('locale', $locale);
        View::share('textDirection', $direction);

        return $next($request);
    }
}
