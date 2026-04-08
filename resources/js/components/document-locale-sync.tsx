import { useLocalization } from '@/lib/localization';
import { useEffect } from 'react';

export function DocumentLocaleSync() {
    const { locale, direction, isRtl } = useLocalization();

    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = direction;
        document.body.dir = direction;
        document.documentElement.classList.toggle('rtl', isRtl);
        document.body.classList.toggle('rtl', isRtl);
    }, [direction, isRtl, locale]);

    return null;
}
