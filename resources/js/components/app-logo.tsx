import { brand } from '@/config/brand';

export default function AppLogo() {
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
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="truncate leading-none font-bold tracking-wide">
                    Baba Restaurant
                </span>
            </div>
        </>
    );
}
