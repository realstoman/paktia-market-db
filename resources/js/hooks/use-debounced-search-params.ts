import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

type Primitive = string | number | boolean | null | undefined;

export interface UseDebouncedSearchParamsOptions {
    /**
     * The page path to navigate to when params change. Defaults to the
     * current pathname so the same Inertia page handler picks up the
     * updated query.
     */
    path?: string;
    /**
     * Debounce window in milliseconds. Default 300ms matches a typical
     * date picker / search input.
     */
    delayMs?: number;
    /**
     * Inertia visit options forwarded to router.get when the debounce
     * settles. We merge in sensible defaults (preserveScroll +
     * preserveState).
     */
    visitOptions?: Parameters<typeof router.get>[2];
    /**
     * If true, the initial value is ignored \u2014 the first navigation
     * only happens after the user changes something. Defaults to true.
     */
    skipFirst?: boolean;
}

/**
 * Reduces server round-trips on filter-driven pages by debouncing
 * Inertia visits when filter state changes. Returns the current params
 * plus a setParams updater you can wire to controlled inputs.
 */
export function useDebouncedSearchParams<T extends Record<string, Primitive>>(
    initial: T,
    options?: UseDebouncedSearchParamsOptions,
): {
    params: T;
    setParams: (next: Partial<T>) => void;
    flush: () => void;
} {
    const [params, setLocal] = useState<T>(initial);
    const timerRef = useRef<number | null>(null);
    const skipNextRef = useRef<boolean>(options?.skipFirst ?? true);
    const latestRef = useRef<T>(params);

    useEffect(() => {
        latestRef.current = params;
    }, [params]);

    useEffect(
        () => () => {
            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current);
            }
        },
        [],
    );

    const navigate = useCallback(() => {
        const path =
            options?.path ??
            (typeof window !== 'undefined'
                ? window.location.pathname
                : '/');

        const data = Object.fromEntries(
            Object.entries(latestRef.current).filter(
                ([, value]) =>
                    value !== undefined &&
                    value !== null &&
                    value !== '',
            ),
        ) as Record<string, Primitive>;

        router.get(path, data, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
            ...(options?.visitOptions ?? {}),
        });
    }, [options?.path, options?.visitOptions]);

    const setParams = useCallback(
        (next: Partial<T>) => {
            setLocal((current) => ({ ...current, ...next }));

            if (skipNextRef.current) {
                skipNextRef.current = false;
                return;
            }

            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current);
            }
            timerRef.current = window.setTimeout(
                navigate,
                options?.delayMs ?? 300,
            );
        },
        [navigate, options?.delayMs],
    );

    const flush = useCallback(() => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        navigate();
    }, [navigate]);

    return { params, setParams, flush };
}
