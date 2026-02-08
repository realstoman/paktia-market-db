export function AppSidebarFooter() {
    return (
        <footer className="sticky bottom-0 z-10 mx-auto mt-4 w-full rounded-lg border border-neutral-100/90 bg-neutral-50 px-6 py-3 text-xs text-muted-foreground md:px-4 dark:border-neutral-800/90 dark:bg-brand-bg-dark">
            <div className="mx-auto flex w-full items-center justify-between">
                <span>
                    © {new Date().getFullYear()} Baba Restaurant. All rights
                    reserved.
                </span>
                <div>
                    Product of
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
