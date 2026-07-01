import { cn } from '@/lib/utils';

const size = 21;
const dataCodewordCount = 19;
const errorCorrectionCodewordCount = 7;
const alphanumericCharacters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

interface Props {
    value: string;
    className?: string;
}

const appendBits = (bits: number[], value: number, length: number) => {
    for (let index = length - 1; index >= 0; index -= 1) {
        bits.push((value >>> index) & 1);
    }
};

const encodeAlphanumeric = (value: string) => {
    const normalized = value
        .toUpperCase()
        .replace(new RegExp(`[^${alphanumericCharacters.replace('-', '\\-')}]`, 'g'), '');
    const bits: number[] = [];

    appendBits(bits, 0b0010, 4);
    appendBits(bits, normalized.length, 9);

    for (let index = 0; index < normalized.length; index += 2) {
        const first = alphanumericCharacters.indexOf(normalized[index]);
        const second =
            index + 1 < normalized.length
                ? alphanumericCharacters.indexOf(normalized[index + 1])
                : -1;

        if (second >= 0) {
            appendBits(bits, first * 45 + second, 11);
        } else {
            appendBits(bits, first, 6);
        }
    }

    const capacity = dataCodewordCount * 8;
    appendBits(bits, 0, Math.min(4, capacity - bits.length));

    while (bits.length % 8 !== 0) {
        bits.push(0);
    }

    const bytes: number[] = [];
    for (let index = 0; index < bits.length; index += 8) {
        bytes.push(
            bits
                .slice(index, index + 8)
                .reduce((byte, bit) => (byte << 1) | bit, 0),
        );
    }

    let padByte = 0xec;
    while (bytes.length < dataCodewordCount) {
        bytes.push(padByte);
        padByte = padByte === 0xec ? 0x11 : 0xec;
    }

    return bytes;
};

const createGaloisTables = () => {
    const exp = new Array<number>(512).fill(0);
    const log = new Array<number>(256).fill(0);
    let value = 1;

    for (let index = 0; index < 255; index += 1) {
        exp[index] = value;
        log[value] = index;
        value <<= 1;

        if (value & 0x100) {
            value ^= 0x11d;
        }
    }

    for (let index = 255; index < 512; index += 1) {
        exp[index] = exp[index - 255];
    }

    return { exp, log };
};

const { exp: gfExp, log: gfLog } = createGaloisTables();

const gfMultiply = (left: number, right: number) => {
    if (left === 0 || right === 0) {
        return 0;
    }

    return gfExp[gfLog[left] + gfLog[right]];
};

const multiplyPolynomials = (left: number[], right: number[]) => {
    const result = new Array<number>(left.length + right.length - 1).fill(0);

    left.forEach((leftCoefficient, leftIndex) => {
        right.forEach((rightCoefficient, rightIndex) => {
            result[leftIndex + rightIndex] ^= gfMultiply(
                leftCoefficient,
                rightCoefficient,
            );
        });
    });

    return result;
};

const reedSolomonRemainder = (data: number[]) => {
    let generator = [1];

    for (let index = 0; index < errorCorrectionCodewordCount; index += 1) {
        generator = multiplyPolynomials(generator, [1, gfExp[index]]);
    }

    const result = [...data, ...new Array<number>(errorCorrectionCodewordCount).fill(0)];

    data.forEach((_, index) => {
        const coefficient = result[index];

        if (coefficient === 0) {
            return;
        }

        generator.forEach((generatorCoefficient, generatorIndex) => {
            result[index + generatorIndex] ^= gfMultiply(
                generatorCoefficient,
                coefficient,
            );
        });
    });

    return result.slice(data.length);
};

const createEmptyMatrix = () => ({
    modules: Array.from({ length: size }, () =>
        new Array<boolean>(size).fill(false),
    ),
    reserved: Array.from({ length: size }, () =>
        new Array<boolean>(size).fill(false),
    ),
});

const setFunctionModule = (
    modules: boolean[][],
    reserved: boolean[][],
    x: number,
    y: number,
    dark: boolean,
) => {
    if (x < 0 || y < 0 || x >= size || y >= size) {
        return;
    }

    modules[y][x] = dark;
    reserved[y][x] = true;
};

const drawFinder = (
    modules: boolean[][],
    reserved: boolean[][],
    left: number,
    top: number,
) => {
    for (let y = -1; y <= 7; y += 1) {
        for (let x = -1; x <= 7; x += 1) {
            const absoluteX = left + x;
            const absoluteY = top + y;
            const isSeparator = x === -1 || x === 7 || y === -1 || y === 7;
            const isOuter = x === 0 || x === 6 || y === 0 || y === 6;
            const isInner = x >= 2 && x <= 4 && y >= 2 && y <= 4;

            setFunctionModule(
                modules,
                reserved,
                absoluteX,
                absoluteY,
                !isSeparator && (isOuter || isInner),
            );
        }
    }
};

const drawFunctionPatterns = (modules: boolean[][], reserved: boolean[][]) => {
    drawFinder(modules, reserved, 0, 0);
    drawFinder(modules, reserved, size - 7, 0);
    drawFinder(modules, reserved, 0, size - 7);

    for (let index = 8; index < size - 8; index += 1) {
        const dark = index % 2 === 0;
        setFunctionModule(modules, reserved, index, 6, dark);
        setFunctionModule(modules, reserved, 6, index, dark);
    }

    for (let index = 0; index <= 5; index += 1) {
        setFunctionModule(modules, reserved, 8, index, false);
        setFunctionModule(modules, reserved, index, 8, false);
    }

    setFunctionModule(modules, reserved, 8, 7, false);
    setFunctionModule(modules, reserved, 8, 8, false);
    setFunctionModule(modules, reserved, 7, 8, false);

    for (let index = 0; index < 8; index += 1) {
        setFunctionModule(modules, reserved, size - 1 - index, 8, false);
    }

    for (let index = 0; index < 7; index += 1) {
        setFunctionModule(modules, reserved, 8, size - 1 - index, false);
    }

    setFunctionModule(modules, reserved, 8, size - 8, true);
};

const calculateFormatBits = () => {
    const errorCorrectionLevelLow = 0b01;
    const maskPattern = 0;
    const data = (errorCorrectionLevelLow << 3) | maskPattern;
    let remainder = data << 10;

    for (let index = 14; index >= 10; index -= 1) {
        if (((remainder >>> index) & 1) !== 0) {
            remainder ^= 0x537 << (index - 10);
        }
    }

    return ((data << 10) | remainder) ^ 0x5412;
};

const formatBit = (formatBits: number, index: number) =>
    ((formatBits >>> index) & 1) !== 0;

const drawFormatBits = (modules: boolean[][], reserved: boolean[][]) => {
    const formatBits = calculateFormatBits();

    for (let index = 0; index <= 5; index += 1) {
        setFunctionModule(modules, reserved, 8, index, formatBit(formatBits, index));
    }

    setFunctionModule(modules, reserved, 8, 7, formatBit(formatBits, 6));
    setFunctionModule(modules, reserved, 8, 8, formatBit(formatBits, 7));
    setFunctionModule(modules, reserved, 7, 8, formatBit(formatBits, 8));

    for (let index = 9; index < 15; index += 1) {
        setFunctionModule(
            modules,
            reserved,
            14 - index,
            8,
            formatBit(formatBits, index),
        );
    }

    for (let index = 0; index < 8; index += 1) {
        setFunctionModule(
            modules,
            reserved,
            size - 1 - index,
            8,
            formatBit(formatBits, index),
        );
    }

    for (let index = 8; index < 15; index += 1) {
        setFunctionModule(
            modules,
            reserved,
            8,
            size - 15 + index,
            formatBit(formatBits, index),
        );
    }

    setFunctionModule(modules, reserved, 8, size - 8, true);
};

const drawCodewords = (
    modules: boolean[][],
    reserved: boolean[][],
    codewords: number[],
) => {
    const bits = codewords.flatMap((codeword) =>
        Array.from({ length: 8 }, (_, index) => (codeword >>> (7 - index)) & 1),
    );
    let bitIndex = 0;
    let upward = true;

    for (let right = size - 1; right >= 1; right -= 2) {
        if (right === 6) {
            right -= 1;
        }

        for (let vertical = 0; vertical < size; vertical += 1) {
            const y = upward ? size - 1 - vertical : vertical;

            for (let offset = 0; offset < 2; offset += 1) {
                const x = right - offset;

                if (reserved[y][x]) {
                    continue;
                }

                const bit = bits[bitIndex] === 1;
                const mask = (x + y) % 2 === 0;
                modules[y][x] = bit !== mask;
                bitIndex += 1;
            }
        }

        upward = !upward;
    }
};

const createQrModules = (value: string) => {
    const { modules, reserved } = createEmptyMatrix();
    const data = encodeAlphanumeric(value);
    const codewords = [...data, ...reedSolomonRemainder(data)];

    drawFunctionPatterns(modules, reserved);
    drawCodewords(modules, reserved, codewords);
    drawFormatBits(modules, reserved);

    return modules;
};

export function QrCode({ value, className }: Props) {
    const modules = createQrModules(value);

    return (
        <svg
            role="img"
            aria-label={`QR code ${value}`}
            viewBox={`0 0 ${size + 8} ${size + 8}`}
            className={cn('block bg-white', className)}
            shapeRendering="crispEdges"
        >
            <rect width={size + 8} height={size + 8} fill="white" />
            {modules.flatMap((row, y) =>
                row.map((dark, x) =>
                    dark ? (
                        <rect
                            key={`${x}-${y}`}
                            x={x + 4}
                            y={y + 4}
                            width="1"
                            height="1"
                            fill="black"
                        />
                    ) : null,
                ),
            )}
        </svg>
    );
}
