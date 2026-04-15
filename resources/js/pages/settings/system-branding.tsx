import HeadingSmall from '@/components/shared/heading-small';
import InputError from '@/components/input-error';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocalization } from '@/lib/localization';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface SystemBrandingPageProps {
    branding: SharedData['branding'];
}

function previewFor(file: File | null) {
    if (!file) {
        return null;
    }

    return URL.createObjectURL(file);
}

export default function SystemBranding({
    branding,
}: SystemBrandingPageProps) {
    const { t } = useLocalization();
    const { auth } = usePage<SharedData>().props;
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFullPreview, setLogoFullPreview] = useState<string | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('settings.systemBrandingTitle', 'System branding'),
            href: '/settings/system-branding',
        },
    ];

    const form = useForm({
        restaurant_name: branding.name,
        restaurant_short_name: branding.shortName,
        primary_color: branding.primaryColor,
        secondary_color: branding.secondaryColor,
        tertiary_color: branding.tertiaryColor,
        logo: null as File | null,
        logo_full: null as File | null,
    });

    const canManageBranding = auth.is_super_admin === true;
    const currentLogo = logoPreview ?? branding.logoUrl;
    const currentLogoFull = logoFullPreview ?? branding.logoFullUrl;
    const colorPreviewStyle = useMemo(
        () => ({
            background: `linear-gradient(135deg, ${form.data.primary_color} 0%, ${form.data.secondary_color} 55%, ${form.data.tertiary_color} 100%)`,
        }),
        [
            form.data.primary_color,
            form.data.secondary_color,
            form.data.tertiary_color,
        ],
    );
    const hasChanges =
        form.data.restaurant_name !== branding.name ||
        form.data.restaurant_short_name !== branding.shortName ||
        form.data.primary_color !== branding.primaryColor ||
        form.data.secondary_color !== branding.secondaryColor ||
        form.data.tertiary_color !== branding.tertiaryColor ||
        form.data.logo !== null ||
        form.data.logo_full !== null;

    const submit = () => {
        form.transform((data) => ({
            ...data,
            _method: 'put',
        })).post('/settings/system-branding', {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setIsConfirmOpen(false);
                toast.success(
                    t(
                        'settings.systemBrandingUpdated',
                        'Branding settings updated successfully.',
                    ),
                );
                window.location.reload();
            },
            onError: () => {
                toast.error(
                    t(
                        'settings.systemBrandingUpdateFailed',
                        'Unable to update branding settings.',
                    ),
                );
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.systemBrandingTitle', 'System branding')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title={t(
                            'settings.systemBrandingTitle',
                            'System branding',
                        )}
                        description={t(
                            'settings.systemBrandingDescription',
                            'Manage the shared logo and theme colors used across the system.',
                        )}
                    />

                    {!canManageBranding ? (
                        <div className="rounded-lg border border-border/70 p-4 text-sm text-muted-foreground">
                            {t(
                                'settings.systemBrandingRestricted',
                                'Only super-admin can update system branding settings.',
                            )}
                        </div>
                    ) : (
                        <>
                            <div
                                className="rounded-2xl border border-border/70 p-5"
                                style={colorPreviewStyle}
                            >
                                <div className="rounded-xl bg-white/92 p-5 shadow-sm backdrop-blur">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={currentLogo}
                                            alt={form.data.restaurant_name}
                                            className="h-16 w-16 rounded-xl object-contain"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                                {t(
                                                    'settings.previewLabel',
                                                    'Live preview',
                                                )}
                                            </p>
                                            <p className="truncate text-xl font-semibold text-foreground">
                                                {form.data.restaurant_name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {form.data.restaurant_short_name}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="restaurant_name">
                                        {t(
                                            'settings.restaurantNameLabel',
                                            'Restaurant name',
                                        )}
                                    </Label>
                                    <Input
                                        id="restaurant_name"
                                        value={form.data.restaurant_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'restaurant_name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={form.errors.restaurant_name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="restaurant_short_name">
                                        {t(
                                            'settings.restaurantShortNameLabel',
                                            'Short name',
                                        )}
                                    </Label>
                                    <Input
                                        id="restaurant_short_name"
                                        value={form.data.restaurant_short_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'restaurant_short_name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={form.errors.restaurant_short_name}
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-3">
                                    {[
                                        [
                                            'primary_color',
                                            t(
                                                'settings.primaryColorLabel',
                                                'Primary color',
                                            ),
                                        ],
                                        [
                                            'secondary_color',
                                            t(
                                                'settings.secondaryColorLabel',
                                                'Secondary color',
                                            ),
                                        ],
                                        [
                                            'tertiary_color',
                                            t(
                                                'settings.tertiaryColorLabel',
                                                'Tertiary color',
                                            ),
                                        ],
                                    ].map(([field, label]) => (
                                        <div key={field} className="grid gap-2">
                                            <Label htmlFor={field}>{label}</Label>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    id={field}
                                                    type="color"
                                                    className="h-11 w-16 p-1"
                                                    value={
                                                        form.data[
                                                            field as keyof typeof form.data
                                                        ] as string
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            field as
                                                                | 'primary_color'
                                                                | 'secondary_color'
                                                                | 'tertiary_color',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                <Input
                                                    value={
                                                        form.data[
                                                            field as keyof typeof form.data
                                                        ] as string
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            field as
                                                                | 'primary_color'
                                                                | 'secondary_color'
                                                                | 'tertiary_color',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <InputError
                                                message={
                                                    form.errors[
                                                        field as
                                                            | 'primary_color'
                                                            | 'secondary_color'
                                                            | 'tertiary_color'
                                                    ]
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-3">
                                        <Label htmlFor="logo">
                                            {t('settings.logoLabel', 'Sidebar logo')}
                                        </Label>
                                        <img
                                            src={currentLogo}
                                            alt={t('settings.logoLabel', 'Sidebar logo')}
                                            className="h-24 w-24 rounded-xl border border-border/70 bg-muted/30 object-contain p-2"
                                        />
                                        <Input
                                            id="logo"
                                            type="file"
                                            accept="image/*"
                                            onChange={(event) => {
                                                const file =
                                                    event.target.files?.[0] ??
                                                    null;
                                                form.setData('logo', file);
                                                setLogoPreview(previewFor(file));
                                            }}
                                        />
                                        <InputError message={form.errors.logo} />
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="logo_full">
                                            {t(
                                                'settings.logoFullLabel',
                                                'Full auth logo',
                                            )}
                                        </Label>
                                        <img
                                            src={currentLogoFull}
                                            alt={t(
                                                'settings.logoFullLabel',
                                                'Full auth logo',
                                            )}
                                            className="h-24 w-full rounded-xl border border-border/70 bg-muted/30 object-contain p-2"
                                        />
                                        <Input
                                            id="logo_full"
                                            type="file"
                                            accept="image/*"
                                            onChange={(event) => {
                                                const file =
                                                    event.target.files?.[0] ??
                                                    null;
                                                form.setData('logo_full', file);
                                                setLogoFullPreview(
                                                    previewFor(file),
                                                );
                                            }}
                                        />
                                        <InputError message={form.errors.logo_full} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    onClick={() => setIsConfirmOpen(true)}
                                    disabled={form.processing || !hasChanges}
                                >
                                    {t('common.save', 'Save')}
                                </Button>
                                <p className="text-sm text-muted-foreground">
                                    {t(
                                        'settings.systemBrandingHelp',
                                        'Save and reload to apply the updated branding across the system.',
                                    )}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </SettingsLayout>

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t(
                                'settings.confirmBrandingUpdateTitle',
                                'Apply branding changes?',
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                'settings.confirmBrandingUpdateDescription',
                                'This will update the shared restaurant name, logo, and colors across the system after reload.',
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={form.processing}>
                            {t('common.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <Button
                            type="button"
                            onClick={(event) => {
                                event.preventDefault();
                                submit();
                            }}
                            disabled={form.processing}
                        >
                            {form.processing
                                ? t('settings.savingBranding', 'Saving...')
                                : t('common.save', 'Save')}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
