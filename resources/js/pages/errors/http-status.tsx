import { Button } from '@/components/ui/button';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    LockKeyhole,
    RefreshCcw,
    ShieldAlert,
} from 'lucide-react';

type ErrorStatus = 403 | 404 | 500 | 503;

interface ErrorPageProps {
    status: ErrorStatus;
}

const contentMap: Record<
    ErrorStatus,
    {
        title: string;
        description: string;
        badge: string;
        icon: typeof LockKeyhole;
    }
> = {
    403: {
        title: 'Access Restricted',
        description:
            'You do not have permission to open this page. If you think this is unexpected, contact the super-admin.',
        badge: 'Unauthorized Access',
        icon: ShieldAlert,
    },
    404: {
        title: 'Page Not Found',
        description:
            'The page you requested is not available or may have been moved.',
        badge: 'Unavailable',
        icon: AlertTriangle,
    },
    500: {
        title: 'Something Went Wrong',
        description:
            'The system hit an unexpected issue while loading this screen. Please try again in a moment.',
        badge: 'Server Error',
        icon: AlertTriangle,
    },
    503: {
        title: 'Temporarily Unavailable',
        description:
            'The system is currently unavailable. Please try again shortly.',
        badge: 'Maintenance',
        icon: RefreshCcw,
    },
};

export default function HttpStatusPage({ status }: ErrorPageProps) {
    const { auth } = usePage().props as {
        auth?: { user?: { id?: number } | null };
    };

    const content = contentMap[status] ?? contentMap[403];
    const Icon = content.icon;
    const backHref = auth?.user ? '/dashboard' : '/login';

    return (
        <>
            <Head title={content.title} />
            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-100 px-4 py-10 dark:bg-neutral-950">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0B5AA514,transparent_45%),radial-gradient(circle_at_bottom_right,#F2A20C18,transparent_35%)] dark:bg-[radial-gradient(circle_at_top,#ffffff10,transparent_30%),radial-gradient(circle_at_bottom_right,#ffffff08,transparent_25%)]" />

                <div className="relative w-full max-w-2xl rounded-[28px] border border-neutral-200/70 bg-white/90 p-6 shadow-[0_30px_80px_rgba(16,47,51,0.12)] backdrop-blur sm:p-8 dark:border-neutral-800 dark:bg-neutral-900/95 dark:shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
                    <div className="rounded-[24px] border border-neutral-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f6faf9_55%,#eef4f3_100%)] p-6 dark:border-neutral-800 dark:bg-neutral-950">
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold tracking-[0.2em] text-neutral-600 uppercase dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                                    {content.badge}
                                </span>
                                <div className="mt-4 flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-lg shadow-brand-primary/20">
                                        <Icon className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                            Error {status}
                                        </p>
                                        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">
                                            {content.title}
                                        </h1>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white/75 p-5 dark:border-neutral-800 dark:bg-neutral-900/60">
                            <p className="text-base leading-7 text-neutral-600 dark:text-neutral-300">
                                {content.description}
                            </p>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button asChild className="gap-2">
                                <Link href={backHref}>
                                    <ArrowLeft className="h-4 w-4" />
                                    {auth?.user
                                        ? 'Back to dashboard'
                                        : 'Back to login'}
                                </Link>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-2"
                                onClick={() => window.history.back()}
                            >
                                <RefreshCcw className="h-4 w-4" />
                                Go back
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
