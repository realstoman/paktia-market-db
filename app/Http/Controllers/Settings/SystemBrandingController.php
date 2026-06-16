<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\Settings\SystemBrandingService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SystemBrandingController extends Controller
{
    public function __construct(
        private readonly SystemBrandingService $systemBrandingService,
    ) {
    }

    public function edit(Request $request)
    {
        abort_unless($request->user()?->hasRole('super-admin'), 403);

        return Inertia::render('settings/system-branding', [
            'branding' => $this->systemBrandingService->getBranding(),
        ]);
    }

    public function update(Request $request)
    {
        abort_unless($request->user()?->hasRole('super-admin'), 403);

        $validated = $request->validate([
            'market_name' => ['required', 'string', 'max:255'],
            'market_short_name' => ['required', 'string', 'max:80'],
            'primary_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'tertiary_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,svg,webp', 'max:5120'],
            'logo_full' => ['nullable', 'image', 'mimes:jpg,jpeg,png,svg,webp', 'max:5120'],
        ]);

        $this->systemBrandingService->update([
            ...$validated,
            'logo' => $request->file('logo'),
            'logo_full' => $request->file('logo_full'),
        ]);

        return back()->with('success', 'Branding settings updated successfully.');
    }
}
