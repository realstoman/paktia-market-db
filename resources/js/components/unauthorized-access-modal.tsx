import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useLocalization } from '@/lib/localization';
import { SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';
import { useState } from 'react';

export function UnauthorizedAccessModal() {
    const { unauthorizedAccess } = usePage<SharedData>().props;
    const { t } = useLocalization();
    const [dismissedPath, setDismissedPath] = useState<string | null>(null);
    const attemptedPath = unauthorizedAccess?.path?.trim();
    const open =
        unauthorizedAccess?.show === true && dismissedPath !== attemptedPath;

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    setDismissedPath(attemptedPath ?? '__unauthorized__');
                }
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-amber-600" />
                        {t(
                            'common.unauthorized.title',
                            'Access Restricted',
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {t(
                            'common.unauthorized.description',
                            'You do not have permission to access this action or page.',
                        )}
                        {attemptedPath ? (
                            <>
                                {' '}
                                {t(
                                    'common.unauthorized.pathPrefix',
                                    'Attempted path:',
                                )}{' '}
                                <span className="font-medium text-foreground">
                                    {attemptedPath}
                                </span>
                            </>
                        ) : null}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={() =>
                            setDismissedPath(attemptedPath ?? '__unauthorized__')
                        }
                    >
                        {t('common.close', 'Close')}
                    </Button>
                    <Button
                        onClick={() => {
                            setDismissedPath(attemptedPath ?? '__unauthorized__');
                            router.visit('/dashboard');
                        }}
                    >
                        {t(
                            'common.unauthorized.goDashboard',
                            'Go to Dashboard',
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
