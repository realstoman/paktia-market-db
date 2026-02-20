import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { HTMLAttributes } from 'react';
import { toast } from 'sonner';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'ps', label: 'Pashto' },
    { code: 'fa', label: 'Dari' },
];

export default function LanguageDropdown({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const handleSelectLanguage = (language: string) => {
        toast.info(`${language} support is coming soon.`);
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
                        <Globe className="h-5 w-5" />
                        <span className="sr-only">Switch language</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Language</DropdownMenuLabel>
                    {LANGUAGES.map((language) => (
                        <DropdownMenuItem
                            key={language.code}
                            onClick={() =>
                                handleSelectLanguage(language.label)
                            }
                        >
                            {language.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
