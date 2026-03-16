import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface AttachmentViewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    path: string | null;
    title?: string;
}

const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

function isImage(path: string): boolean {
    const lower = path.toLowerCase();
    return imageExtensions.some((extension) => lower.endsWith(extension));
}

function toPublicUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    return `/storage/${path}`;
}

export function AttachmentViewDialog({
    open,
    onOpenChange,
    path,
    title = 'Attachment Preview',
}: AttachmentViewDialogProps) {
    const source = path ? toPublicUrl(path) : null;
    const image = path ? isImage(path) : false;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Review the uploaded receipt/bill.
                    </DialogDescription>
                </DialogHeader>

                {source ? (
                    <div className="h-[70vh] overflow-hidden rounded-lg border bg-slate-50">
                        {image ? (
                            <div className="flex h-full items-center justify-center p-4">
                                <img
                                    src={source}
                                    alt="Attachment preview"
                                    className="max-h-full max-w-full rounded-md object-contain"
                                />
                            </div>
                        ) : (
                            <iframe
                                src={source}
                                title="Attachment preview"
                                className="h-full w-full"
                            />
                        )}
                    </div>
                ) : (
                    <div className="rounded-lg border bg-slate-50 p-8 text-center text-sm text-muted-foreground">
                        No attachment available.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
