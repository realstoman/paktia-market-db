import { cn } from '@/lib/utils';

const patterns: Record<string, string> = {
    '0': '000110100',
    '1': '100100001',
    '2': '001100001',
    '3': '101100000',
    '4': '000110001',
    '5': '100110000',
    '6': '001110000',
    '7': '000100101',
    '8': '100100100',
    '9': '001100100',
    A: '100001001',
    B: '001001001',
    C: '101001000',
    D: '000011001',
    E: '100011000',
    F: '001011000',
    G: '000001101',
    H: '100001100',
    I: '001001100',
    J: '000011100',
    K: '100000011',
    L: '001000011',
    M: '101000010',
    N: '000010011',
    O: '100010010',
    P: '001010010',
    Q: '000000111',
    R: '100000110',
    S: '001000110',
    T: '000010110',
    U: '110000001',
    V: '011000001',
    W: '111000000',
    X: '010010001',
    Y: '110010000',
    Z: '011010000',
    '-': '010000101',
    '.': '110000100',
    ' ': '011000100',
    $: '010101000',
    '/': '010100010',
    '+': '010001010',
    '%': '000101010',
    '*': '010010100',
};

interface Props {
    value: string;
    className?: string;
}

export function Code39Barcode({ value, className }: Props) {
    const encoded = `*${value.toUpperCase().replace(/[^0-9A-Z. $/+%-]/g, '')}*`;
    const widths = [...encoded].flatMap((character, characterIndex) => [
        ...(patterns[character] ?? patterns['*'])
            .split('')
            .map((bit) => (bit === '1' ? 3 : 1)),
        ...(characterIndex < encoded.length - 1 ? [1] : []),
    ]);
    const totalWidth = widths.reduce((sum, width) => sum + width, 0);
    let cursor = 0;

    return (
        <svg
            role="img"
            aria-label={`Barcode ${value}`}
            viewBox={`0 0 ${totalWidth} 54`}
            preserveAspectRatio="none"
            className={cn('block h-12 w-full bg-white', className)}
        >
            <rect width={totalWidth} height="54" fill="white" />
            {widths.map((width, index) => {
                const x = cursor;
                cursor += width;
                return index % 2 === 0 ? (
                    <rect
                        key={`${index}-${x}`}
                        x={x}
                        width={width}
                        height="54"
                        fill="black"
                    />
                ) : null;
            })}
        </svg>
    );
}
