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
import { useEffect, useState } from 'react';

export function UnauthorizedAccessModal() {
    const { unauthorizedAccess } = usePage<SharedData>().props;
    const { t } = useLocalization();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOpen(unauthorizedAccess?.show === true);
    }, [unauthorizedAccess?.show, unauthorizedAccess?.path]);

    const attemptedPath = unauthorizedAccess?.path?.trim();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        {t('common.close', 'Close')}
                    </Button>
                    <Button
                        onClick={() => {
                            setOpen(false);
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
