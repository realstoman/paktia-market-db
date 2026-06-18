import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppearance } from '@/hooks/use-appearance';
import { useLocalization } from '@/lib/localization';
import { Monitor, Moon, Sun } from 'lucide-react';
import { HTMLAttributes } from 'react';

export default function AppearanceToggleDropdown({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();
    const { t, isRtl } = useLocalization();

    const getCurrentIcon = () => {
        switch (appearance) {
            case 'dark':
                return <Moon className="h-5 w-5" />;
            case 'light':
                return <Sun className="h-5 w-5" />;
            default:
                return <Monitor className="h-5 w-5" />;
        }
    };

    return (
        <div className={className} {...props}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative size-10 rounded-full border border-[#dfe7e9] bg-white text-[#123f4a] shadow-sm shadow-slate-950/3 transition-all duration-300 hover:border-brand-primary/30 hover:bg-brand-primary/5 hover:text-brand-primary dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                    >
                        {getCurrentIcon()}
                        <span className="sr-only">
                            {t('appearance.toggleTheme', 'Toggle theme')}
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className={isRtl ? 'text-right' : ''}
                >
                    <DropdownMenuItem
                        onClick={() => updateAppearance('light')}
                        className={isRtl ? 'w-full text-right' : ''}
                    >
                        {isRtl ? (
                            <span className="ml-auto inline-flex items-center gap-3 text-right">
                                <Sun className="h-5 w-5" />
                                <span>{t('appearance.light', 'Light')}</span>
                            </span>
                        ) : (
                            <>
                                <Sun className="h-5 w-5" />
                                <span>{t('appearance.light', 'Light')}</span>
                            </>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => updateAppearance('dark')}
                        className={isRtl ? 'w-full text-right' : ''}
                    >
                        {isRtl ? (
                            <span className="ml-auto inline-flex items-center gap-3 text-right">
                                <Moon className="h-5 w-5" />
                                <span>{t('appearance.dark', 'Dark')}</span>
                            </span>
                        ) : (
                            <>
                                <Moon className="h-5 w-5" />
                                <span>{t('appearance.dark', 'Dark')}</span>
                            </>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => updateAppearance('system')}
                        className={isRtl ? 'w-full text-right' : ''}
                    >
                        {isRtl ? (
                            <span className="ml-auto inline-flex items-center gap-3 text-right">
                                <Monitor className="h-5 w-5" />
                                <span>{t('appearance.system', 'System')}</span>
                            </span>
                        ) : (
                            <>
                                <Monitor className="h-5 w-5" />
                                <span>{t('appearance.system', 'System')}</span>
                            </>
                        )}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
