import { brand } from '@/config/brand';
import { useLocalization } from '@/lib/localization';
import { cn } from '@/lib/utils';

export default function AppLogo() {
    const { isRtl, t } = useLocalization();

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md text-sidebar-primary-foreground">
                <img
                    src={`${brand.logo}`}
                    width="120"
                    height="120"
                    alt="Logo"
                />
            </div>
            <div
                className={cn('grid flex-1 text-sm', {
                    'ml-1 text-left': !isRtl,
                    'mr-1 text-right': isRtl,
                })}
            >
                <span className="truncate leading-none font-semibold tracking-wide">
                    {t('brand.restaurantName', 'Baba Restaurant')}
                </span>
            </div>
        </>
    );
}
