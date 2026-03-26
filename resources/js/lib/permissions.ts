import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

type PermissionCheck = string | string[] | undefined;

export function hasPermission(
    permissions: string[],
    check?: PermissionCheck,
): boolean {
    if (!check) {
        return true;
    }

    if (Array.isArray(check)) {
        return check.some((permission) => permissions.includes(permission));
    }

    return permissions.includes(check);
}

export function useAuthorization() {
    const page = usePage<SharedData>();
    const auth = page.props.auth;
    const permissions = auth?.permissions ?? [];
    const roles = auth?.roles ?? [];
    const isSuperAdmin =
        auth?.is_super_admin === true || roles.includes('super-admin');

    return {
        permissions,
        roles,
        isSuperAdmin,
        can: (permission?: string) =>
            isSuperAdmin || hasPermission(permissions, permission),
        canAny: (required: string[]) =>
            isSuperAdmin || hasPermission(permissions, required),
        hasRole: (role: string) => roles.includes(role),
    };
}
