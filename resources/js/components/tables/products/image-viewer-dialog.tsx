import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useLocalization } from '@/lib/localization';
import { ProductImage } from '@/types';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface ImageViewerDialogProps {
    images: ProductImage[];
    triggerLabel?: string;
}

const resolveImageUrl = (image?: ProductImage): string => {
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
    const { t } = useLocalization();
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
                    <DialogTitle>
                        {t('products.viewer.title', 'Product Images')}
                    </DialogTitle>
                    <DialogDescription>
                        {t(
                            'products.viewer.description',
                            'Browse uploaded product images.',
                        )}
                    </DialogDescription>
                </DialogHeader>
                {hasImages ? (
                    <div className="space-y-3">
                        <div className="relative mx-auto flex h-[400px] w-[400px] items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                            <img
                                src={resolveImageUrl(images[activeIndex])}
                                alt={`${t('products.viewer.imageAlt', 'Product image')} ${activeIndex + 1}`}
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
                                {t('products.viewer.prev', 'Prev')}
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
                                {t('products.viewer.next', 'Next')}
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        {t(
                            'products.fields.noImagesAvailable',
                            'No images available.',
                        )}
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}
