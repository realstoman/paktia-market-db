import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { InventoryItemImage } from '@/types';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface ImageViewerDialogProps {
    images: InventoryItemImage[];
    triggerLabel?: string;
}

const resolveImageUrl = (image?: InventoryItemImage): string => {
    if (!image) return '';
    const candidate = image.url || image.path || '';
    if (!candidate) return '';
    if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
        return candidate;
    }
    if (candidate.startsWith('/storage/')) {
        return candidate;
    }
    if (candidate.startsWith('storage/')) {
        return `/${candidate}`;
    }
    if (candidate.startsWith('public/')) {
        return `/storage/${candidate.replace(/^public\//, '')}`;
    }
    if (candidate.startsWith('/')) {
        return candidate;
    }
    return `/storage/${candidate}`;
};

export function ImageViewerDialog({
    images,
    triggerLabel = 'View',
}: ImageViewerDialogProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const hasImages = images.length > 0;

    const onPrev = () => {
        setActiveIndex((current) =>
            current === 0 ? images.length - 1 : current - 1,
        );
    };

    const onNext = () => {
        setActiveIndex((current) =>
            current === images.length - 1 ? 0 : current + 1,
        );
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasImages}
                    className="h-8 gap-1 px-2"
                >
                    <ImageIcon className="h-4 w-4" />
                    {triggerLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Inventory Item Images</DialogTitle>
                    <DialogDescription>
                        Browse uploaded item images.
                    </DialogDescription>
                </DialogHeader>
                {hasImages ? (
                    <div className="space-y-3">
                        <div className="relative mx-auto flex h-[360px] w-[360px] items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                            <img
                                src={resolveImageUrl(images[activeIndex])}
                                alt={`Inventory image ${activeIndex + 1}`}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onPrev}
                                disabled={images.length <= 1}
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Prev
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                {activeIndex + 1} / {images.length}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onNext}
                                disabled={images.length <= 1}
                            >
                                Next
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No images available.
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}
