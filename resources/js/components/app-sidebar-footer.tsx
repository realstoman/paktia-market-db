export function AppSidebarFooter() {
    return (
        <footer className="sticky bottom-0 z-10 mx-auto mt-4 w-full rounded-lg border-t border-sidebar-border/50 bg-white px-6 py-3 text-xs text-muted-foreground md:px-4 dark:bg-brand-bg-dark">
            <div className="mx-auto flex w-full items-center justify-between">
                <span>
                    © {new Date().getFullYear()} Baba Restaurant. All rights
                    reserved.
                </span>
                <a
                    href="https://github.com/realstoman"
                    className="font-medium text-foreground hover:underline"
                    target="_blank"
                    rel="noreferrer"
                >
                    Stoman
                </a>
            </div>
        </footer>
    );
}
