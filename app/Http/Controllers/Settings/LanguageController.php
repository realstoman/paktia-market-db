<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Inertia\Inertia;
use Inertia\Response;

class LanguageController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('settings/language');
    }

    public function update(Request $request): RedirectResponse
    {
        $supportedLocales = array_keys(config('localization.supported', []));

        $validated = $request->validate([
            'locale' => ['required', 'string', 'in:'.implode(',', $supportedLocales)],
        ]);

        $cookieName = (string) config('localization.cookie_name', 'locale');
        $locale = (string) $validated['locale'];

        return back()->withCookie(
            Cookie::make($cookieName, $locale, 60 * 24 * 365),
        );
    }
}
