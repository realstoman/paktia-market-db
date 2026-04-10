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
                        className="h-9 w-9 rounded-full border border-neutral-200/70 bg-neutral-100 transition-all duration-300 hover:bg-neutral-200/70 dark:border-neutral-700/90 dark:bg-neutral-950"
                    >
                        {getCurrentIcon()}
                        <span className="sr-only">
                            {t('appearance.toggleTheme', 'Toggle theme')}
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align={isRtl ? 'start' : 'end'}
                    className={isRtl ? 'text-right' : ''}
                >
                    <DropdownMenuItem
                        onClick={() => updateAppearance('light')}
                        className={
                            isRtl
                                ? 'w-full flex-row-reverse justify-start text-right'
                                : ''
                        }
                    >
                        <span
                            className={`flex items-center gap-2 ${
                                isRtl ? 'flex-row-reverse' : ''
                            }`}
                        >
                            <Sun className="h-5 w-5" />
                            {t('appearance.light', 'Light')}
                        </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => updateAppearance('dark')}
                        className={
                            isRtl
                                ? 'w-full flex-row-reverse justify-start text-right'
                                : ''
                        }
                    >
                        <span
                            className={`flex items-center gap-2 ${
                                isRtl ? 'flex-row-reverse' : ''
                            }`}
                        >
                            <Moon className="h-5 w-5" />
                            {t('appearance.dark', 'Dark')}
                        </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => updateAppearance('system')}
                        className={
                            isRtl
                                ? 'w-full flex-row-reverse justify-start text-right'
                                : ''
                        }
                    >
                        <span
                            className={`flex items-center gap-2 ${
                                isRtl ? 'flex-row-reverse' : ''
                            }`}
                        >
                            <Monitor className="h-5 w-5" />
                            {t('appearance.system', 'System')}
                        </span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
