<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Applies a baseline of HTTP security response headers.
 *
 * Defaults are conservative; individual headers can be tuned via
 * config/security.php and the SECURITY_* env vars.
 */
class SetSecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // BinaryFileResponse and StreamedResponse may not have a Headers bag in older
        // PHP-FPM setups; bail out gracefully if so.
        if (! method_exists($response, 'headers') && ! property_exists($response, 'headers')) {
            return $response;
        }

        $headers = $this->headers($request, $response);

        foreach ($headers as $name => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            // Don't clobber a deliberately set value from upstream (e.g. an
            // export endpoint may set its own Content-Disposition / CSP).
            if (! $response->headers->has($name)) {
                $response->headers->set($name, $value);
            }
        }

        return $response;
    }

    /**
     * @return array<string, string|null>
     */
    private function headers(Request $request, Response $response): array
    {
        $config = (array) config('security.headers', []);

        $headers = [
            'X-Content-Type-Options' => $config['x_content_type_options'] ?? 'nosniff',
            'X-Frame-Options' => $config['x_frame_options'] ?? 'SAMEORIGIN',
            'Referrer-Policy' => $config['referrer_policy'] ?? 'strict-origin-when-cross-origin',
            'Permissions-Policy' => $config['permissions_policy']
                ?? 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
            'Cross-Origin-Opener-Policy' => $config['cross_origin_opener_policy'] ?? 'same-origin',
            'Cross-Origin-Resource-Policy' => $config['cross_origin_resource_policy'] ?? 'same-site',
        ];

        // HSTS is only meaningful on HTTPS and is potentially harmful in dev.
        if ($request->isSecure() && (bool) ($config['hsts_enabled'] ?? true)) {
            $maxAge = (int) ($config['hsts_max_age'] ?? 31_536_000);
            $hsts = "max-age={$maxAge}";

            if ($config['hsts_include_subdomains'] ?? true) {
                $hsts .= '; includeSubDomains';
            }

            if ($config['hsts_preload'] ?? false) {
                $hsts .= '; preload';
            }

            $headers['Strict-Transport-Security'] = $hsts;
        }

        $csp = $config['content_security_policy'] ?? null;
        if (is_string($csp) && $csp !== '') {
            $headers['Content-Security-Policy'] = $csp;
        }

        return $headers;
    }
}
