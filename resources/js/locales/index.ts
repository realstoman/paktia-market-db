import en from './en';
import fa from './fa';
import ps from './ps';

export const translations = {
    fa,
    ps,
    en,
} as const;

export type LocaleCode = keyof typeof translations;

export default translations;
