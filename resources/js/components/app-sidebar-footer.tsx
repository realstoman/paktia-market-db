import { useLocalization } from '@/lib/localization';

export function AppSidebarFooter() {
    const { t } = useLocalization();

    return (
        <footer className="dark:bg-brand-bg-dark sticky bottom-0 z-10 mx-auto mt-4 w-full rounded-lg border border-neutral-100/90 bg-white px-6 py-3 text-xs text-muted-foreground md:px-4 dark:border-neutral-800/90">
            <div className="mx-auto flex w-full items-center justify-between">
                <span>
                    © {new Date().getFullYear()}{' '}
                    <a
                        href="https://paktiawalgroup.com"
                        className="font-medium text-foreground hover:underline"
                        target="_blank"
                        rel="noreferrer"
                    >
                        {t('brand.marketName', 'Paktiawal Group')}.
                    </a>{' '}
                    {t('footer.allRightsReserved', 'All rights reserved.')}
                </span>
                <div>
                    {t('footer.productOf', 'Product of')}
                    <a
                        href="https://github.com/realstoman"
                        className="pl-1 font-medium text-foreground hover:underline"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Stoman
                    </a>
                </div>
            </div>
        </footer>
    );
}
