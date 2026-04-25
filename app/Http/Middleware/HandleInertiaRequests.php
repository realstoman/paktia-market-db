<?php

namespace App\Http\Middleware;

use App\Http\Resources\AuthUserResource;
use App\Services\Notifications\NotificationService;
use App\Services\Settings\SystemBrandingService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');
        $supportedLocales = config('localization.supported', []);
        $currentLocale = app()->getLocale();
        $branding = app(SystemBrandingService::class)->getBranding();

        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => $branding['name'],
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user ? AuthUserResource::make($user)->resolve($request) : null,
                'roles' => $user?->roles->pluck('name')->toArray() ?? [],
                'permissions' => $user?->getAllPermissions()->pluck('name')->toArray() ?? [],
                'is_super_admin' => $user?->hasRole('super-admin') ?? false,
            ],
            'notifications' => fn () => $this->buildNotifications($request),
            'unauthorizedAccess' => fn () => $this->resolveUnauthorizedAccess($request),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'branding' => $branding,
            'localization' => [
                'locale' => $currentLocale,
                'direction' => data_get($supportedLocales, "{$currentLocale}.direction", 'ltr'),
                'isRtl' => data_get($supportedLocales, "{$currentLocale}.direction", 'ltr') === 'rtl',
                'languages' => collect($supportedLocales)
                    ->map(fn (array $language, string $code) => [
                        'code' => $code,
                        'label' => $language['label'] ?? strtoupper($code),
                        'nativeLabel' => $language['native_label'] ?? ($language['label'] ?? strtoupper($code)),
                        'direction' => $language['direction'] ?? 'ltr',
                        'isDefault' => (bool) ($language['is_default'] ?? false),
                    ])
                    ->values()
                    ->all(),
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildNotifications(Request $request): array
    {
        $user = $request->user();

        if (! $user) {
            return [];
        }

        $flash = $this->flashNotifications($request)->all();
        $aggregated = app(NotificationService::class)->forUser($user);

        return collect($flash)
            ->merge($aggregated)
            ->sortByDesc('createdAt')
            ->take(NotificationService::MAX_ITEMS)
            ->values()
            ->all();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function flashNotifications(Request $request): Collection
    {
        $flash = $request->session()->get('notification');

        if (! is_array($flash) || empty($flash['id'])) {
            return collect();
        }

        return collect([[
            'id' => (string) $flash['id'],
            'category' => $flash['category'] ?? 'system',
            'title' => $flash['title'] ?? __('notifications.flash.title'),
            'description' => $flash['description'] ?? '',
            'createdAt' => now()->toIso8601String(),
            'meta' => $flash['meta'] ?? null,
            'href' => $flash['href'] ?? null,
            'priority' => $flash['priority'] ?? 'medium',
            'unread' => true,
        ]]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resolveUnauthorizedAccess(Request $request): ?array
    {
        $flash = $request->session()->get('unauthorized_access');

        if (! is_array($flash) || ($flash['show'] ?? false) !== true) {
            return null;
        }

        return [
            'show' => true,
            'path' => $flash['path'] ?? null,
        ];
    }
}
