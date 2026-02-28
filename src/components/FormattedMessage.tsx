'use client';

import React, { useMemo } from 'react';

interface FormattedMessageProps {
    content: string;
    className?: string;
}

interface TableData {
    headers: string[];
    rows: string[][];
}

interface ParseResult {
    beforeTable: string;
    table: TableData | null;
    afterTable: string;
}

// STRATEGY 1: Transition words pattern
// "Pertama, ... seharga ... Kedua, ... seharga ..."
function parseTransitionPattern(text: string): ParseResult {
    const transitionWords = [
        'Pertama', 'Kedua', 'Ketiga', 'Keempat', 'Kelima',
        'Keenam', 'Ketujuh', 'Kedelapan', 'Kesembilan', 'Kesepuluh',
        'Yang terakhir', 'Terakhir', 'Selanjutnya'
    ];

    const pattern = new RegExp(
        `(${transitionWords.join('|')}),\\s*`,
        'gi'
    );

    const hasPrice = /(?:Rp\.?|rupiah|ribu|juta|\d+\.?\d*\s*(?:rupiah|ribu))/i.test(text);
    const hasTransitions = pattern.test(text);

    if (!hasPrice || !hasTransitions) {
        return { beforeTable: text, table: null, afterTable: '' };
    }

    pattern.lastIndex = 0;
    const firstMatch = text.search(pattern);
    if (firstMatch === -1) {
        return { beforeTable: text, table: null, afterTable: '' };
    }

    const beforeTable = text.substring(0, firstMatch).trim();
    const listSection = text.substring(firstMatch);

    const splits = listSection.split(pattern).filter(s =>
        s.trim() && !transitionWords.some(tw => tw.toLowerCase() === s.trim().toLowerCase())
    );

    if (splits.length < 2) {
        return { beforeTable: text, table: null, afterTable: '' };
    }

    const items: string[] = [];
    splits.forEach(item => {
        const trimmed = item.trim();
        if (trimmed && /(?:Rp\.?|rupiah|ribu|juta|\d)/i.test(trimmed)) {
            items.push(trimmed);
        }
    });

    if (items.length < 2) {
        return { beforeTable: text, table: null, afterTable: '' };
    }

    const rows: string[][] = [];
    let afterTable = '';

    items.forEach((item, index) => {
        const pricePatterns = [
            /(.+?)\s+seharga\s+(.+?)(?:\.\s*|$)/i,
            /(.+?)\s+dengan harga\s+(.+?)(?:\.\s*|$)/i,
            /(.+?)\s+harga(?:nya)?\s+(.+?)(?:\.\s*|$)/i,
            /(.+?)\s+(?:senilai|sebesar)\s+(.+?)(?:\.\s*|$)/i,
        ];

        let matched = false;
        for (const pricePattern of pricePatterns) {
            const match = item.match(pricePattern);
            if (match) {
                const description = match[1].trim();
                const price = match[2].trim().replace(/\.\s*$/, '');
                const nameSpec = splitNameAndSpecs(description);
                rows.push([nameSpec.name, nameSpec.specs, formatPrice(price)]);
                matched = true;
                break;
            }
        }

        if (!matched && index === items.length - 1) {
            afterTable = item;
        } else if (!matched) {
            rows.push([item, '', '']);
        }
    });

    if (rows.length < 2) {
        return { beforeTable: text, table: null, afterTable: '' };
    }

    // Check for trailing sentence
    const lastSplit = splits[splits.length - 1];
    const sentences = lastSplit.split(/\.\s+/);
    if (sentences.length > 1) {
        const possibleAfter = sentences.slice(1).join('. ').trim();
        if (possibleAfter && !/seharga|harga|rupiah|ribu/i.test(possibleAfter)) {
            afterTable = possibleAfter;
        }
    }

    return {
        beforeTable,
        table: { headers: ['Produk', 'Spesifikasi', 'Harga'], rows },
        afterTable,
    };
}

// STRATEGY 2: Colon-separated pattern
// "ServiceName: Price description. AnotherService: Price description."
function parseColonPattern(text: string): ParseResult {
    const hasPrice = /(?:Rp\.?|rupiah|ribu|juta|\d+\.?\d*\s*(?:rupiah|ribu))/i.test(text);
    if (!hasPrice) {
        return { beforeTable: text, table: null, afterTable: '' };
    }

    // Match "ServiceName: Price/detail" pattern
    // Looks for capitalized words/phrases followed by colon then price info
    const colonItemPattern = /([A-Z][A-Za-z\s/()]+?):\s*((?:Mulai dari|Rp\.?|Harga|Biaya|\d).+?)(?=\.\s+[A-Z]|\.\s*$|$)/g;

    const items: { name: string; detail: string }[] = [];
    let match;
    let lastIndex = 0;
    let beforeTable = '';

    // Find the first match to determine "before" text
    const firstColonMatch = text.match(/([A-Z][A-Za-z\s/()]+?):\s*(?:Mulai dari|Rp\.?|Harga|Biaya|\d)/);
    if (firstColonMatch && firstColonMatch.index !== undefined) {
        beforeTable = text.substring(0, firstColonMatch.index).trim();
    }

    while ((match = colonItemPattern.exec(text)) !== null) {
        const name = match[1].trim();
        const detail = match[2].trim().replace(/\.\s*$/, '');

        // Validate: name should be reasonable (not a full sentence)
        if (name.length > 3 && name.length < 80 && detail.length > 5) {
            items.push({ name, detail });
        }
        lastIndex = colonItemPattern.lastIndex;
    }

    if (items.length < 2) {
        return { beforeTable: text, table: null, afterTable: '' };
    }

    // Extract afterTable text
    let afterTable = '';
    const remainingText = text.substring(lastIndex).trim();
    if (remainingText && !/:\s*(?:Mulai dari|Rp)/i.test(remainingText)) {
        afterTable = remainingText.replace(/^\.\s*/, '');
    }

    const rows = items.map(item => {
        // Try to extract price from detail
        const priceMatch = item.detail.match(
            /(.*?)\s*((?:Mulai dari\s+)?(?:\d[\d.,]*\s*(?:ribu|juta|ratus)?(?:\s+\w+)*\s*(?:rupiah)?|Rp\.?\s*[\d.,]+)(?:\s*(?:per|untuk)\s+\w+(?:\s+\w+)*)?)/i
        );

        if (priceMatch) {
            const price = extractPriceFromDetail(item.detail);
            const extra = extractExtraInfo(item.detail);
            return [item.name, extra, price];
        }

        return [item.name, item.detail, ''];
    });

    return {
        beforeTable,
        table: { headers: ['Layanan', 'Keterangan', 'Harga'], rows },
        afterTable,
    };
}

// STRATEGY 3: Sentence-based list with price
// "Product A mulai dari X rupiah per unit. Product B mulai dari Y rupiah per unit."
function parseSentencePattern(text: string): ParseResult {
    // Split by sentences that contain price info
    const sentences = text.split(/\.\s+/);
    const priceItems: { name: string; detail: string; price: string }[] = [];
    let beforeParts: string[] = [];
    let afterParts: string[] = [];
    let foundPrice = false;
    let doneWithPrices = false;

    sentences.forEach(sentence => {
        const trimmed = sentence.trim().replace(/\.$/, '');
        if (!trimmed) return;

        const hasPriceInfo = /(?:Mulai dari|seharga|harganya|Rp\.?\s*\d|rupiah\s*per|\d+\s*ribu\s*rupiah)/i.test(trimmed);

        if (hasPriceInfo && !doneWithPrices) {
            foundPrice = true;
            // Extract service name and price
            const patterns = [
                /^(.+?)\s*(?:mulai dari|Mulai dari)\s+(.+?)$/i,
                /^(.+?)\s*(?:seharga|harganya)\s+(.+?)$/i,
                /^(.+?)\s*:\s*(.+?)$/i,
            ];

            let matched = false;
            for (const pat of patterns) {
                const m = trimmed.match(pat);
                if (m) {
                    const price = extractPriceFromDetail(m[2]);
                    const extra = extractExtraInfo(m[2]);
                    priceItems.push({ name: m[1].trim(), detail: extra, price });
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                priceItems.push({ name: trimmed, detail: '', price: '' });
            }
        } else if (!foundPrice) {
            beforeParts.push(trimmed);
        } else {
            doneWithPrices = true;
            afterParts.push(trimmed);
        }
    });

    if (priceItems.length < 3) {
        return { beforeTable: text, table: null, afterTable: '' };
    }

    const rows = priceItems.map(item => [item.name, item.detail, item.price]);

    return {
        beforeTable: beforeParts.join('. ').trim(),
        table: { headers: ['Layanan', 'Keterangan', 'Harga'], rows },
        afterTable: afterParts.join('. ').trim(),
    };
}

// Helper Functions
function extractPriceFromDetail(detail: string): string {
    // Try to find numeric price patterns
    const patterns = [
        // "Mulai dari X ribu/juta rupiah per unit"
        /(Mulai dari\s+)?(\d[\d.,]*\s*(?:ribu|juta|ratus)(?:\s+\w+)*\s*(?:rupiah)?(?:\s+(?:per|untuk)\s+[\w\s]+)?)/i,
        // "Mulai dari seratus enam puluh delapan ribu rupiah per seribu"
        /(Mulai dari\s+)?((?:se|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|(?:\w+\s+belas)|(?:\w+\s+puluh)(?:\s+\w+)?)\s+(?:ribu|juta|ratus)(?:\s+\w+)*\s*(?:rupiah)?(?:\s+(?:per|untuk)\s+[\w\s]+)?)/i,
        // "Rp1.400.000" or "Rp 280.000"
        /(Rp\.?\s*[\d.,]+(?:\s+(?:per|untuk)\s+[\w\s]+)?)/i,
    ];

    for (const pat of patterns) {
        const match = detail.match(pat);
        if (match) {
            let price = (match[1] || '') + match[2];
            price = price.trim();
            return formatPrice(price);
        }
    }

    return formatPrice(detail);
}

function extractExtraInfo(detail: string): string {
    // Extract non-price info like "per seribu", "untuk profil luar", etc.
    const extraMatch = detail.match(/(?:per\s+[\w\s]+|untuk\s+[\w\s]+|durasi\s+[\w\s]+)$/i);
    if (extraMatch) {
        return extraMatch[0].trim();
    }
    return '';
}

function splitNameAndSpecs(description: string): { name: string; specs: string } {
    const splitPatterns = [
        /^(kalender\s+\w+(?:\s+\w+)?)\s+((?:ukuran|dengan|isi|bahan).+)/i,
        /^([\w\s]+?)\s+(ukuran\s+.+)/i,
        /^([\w\s]+?)\s+(dengan\s+.+)/i,
        /^([\w\s]+?)\s+(\d+\s*[xX×]\s*\d+.+)/i,
    ];

    for (const pattern of splitPatterns) {
        const match = description.match(pattern);
        if (match) {
            return { name: match[1].trim(), specs: match[2].trim() };
        }
    }

    const words = description.split(' ');
    if (words.length > 4) {
        return {
            name: words.slice(0, 3).join(' '),
            specs: words.slice(3).join(' ')
        };
    }

    return { name: description, specs: '' };
}

function formatPrice(price: string): string {
    let cleaned = price.trim();
    cleaned = cleaned.replace(/\.$/, '');

    // Handle "Mulai dari" prefix — keep it
    const mulaiPrefix = /^mulai dari\s*/i.test(cleaned);
    if (mulaiPrefix) {
        cleaned = cleaned.replace(/^mulai dari\s*/i, '');
    }
    const prefix = mulaiPrefix ? 'Mulai ' : '';

    // Word-to-number conversion for Indonesian
    const wordToNum: Record<string, number> = {
        'seribu': 1000, 'dua ribu': 2000, 'tiga ribu': 3000, 'empat ribu': 4000,
        'lima ribu': 5000, 'enam ribu': 6000, 'tujuh ribu': 7000, 'delapan ribu': 8000,
        'sembilan ribu': 9000, 'sepuluh ribu': 10000, 'sebelas ribu': 11000,
        'dua belas ribu': 12000, 'tiga belas ribu': 13000, 'empat belas ribu': 14000,
        'lima belas ribu': 15000, 'enam belas ribu': 16000, 'tujuh belas ribu': 17000,
        'delapan belas ribu': 18000, 'sembilan belas ribu': 19000, 'dua puluh ribu': 20000,
        'tiga puluh ribu': 30000, 'empat puluh ribu': 40000, 'lima puluh ribu': 50000,
        'enam puluh ribu': 60000, 'tujuh puluh ribu': 70000, 'delapan puluh ribu': 80000,
        'sembilan puluh ribu': 90000, 'seratus ribu': 100000,
    };

    // Extract "per X" suffix
    const perMatch = cleaned.match(/\s+(per\s+[\w\s]+?)(?:\s+(?:untuk|profil|Indonesia|luar)[\w\s]*)?$/i);
    const perSuffix = perMatch ? ` ${perMatch[1].trim()}` : '';
    if (perMatch) {
        cleaned = cleaned.substring(0, perMatch.index || 0).trim();
    }

    // Remove "rupiah" suffix
    cleaned = cleaned.replace(/\s*rupiah\s*$/i, '').trim();

    // Handle "X juta Y ribu" / "X juta"
    const jutaPattern = /(\w+(?:\s+\w+)*)\s+juta(?:\s+(\w+(?:\s+\w+)*)\s+ribu)?/i;
    const jutaMatch = cleaned.match(jutaPattern);
    if (jutaMatch) {
        const jutaNum = parseWordNumberMulti(jutaMatch[1]);
        const ribuNum = jutaMatch[2] ? parseWordNumberMulti(jutaMatch[2]) : 0;
        if (jutaNum > 0) {
            const total = jutaNum * 1000000 + ribuNum * 1000;
            return `${prefix}Rp${total.toLocaleString('id-ID')}${perSuffix}`;
        }
    }

    // Handle compound: "X ratus Y puluh Z ribu" pattern
    const compoundRibuPattern = /(\w+(?:\s+\w+)*)\s+ribu/i;
    const compoundRibuMatch = cleaned.match(compoundRibuPattern);
    if (compoundRibuMatch) {
        const num = parseWordNumberMulti(compoundRibuMatch[1]);
        if (num > 0) {
            // Check for "ratus" remainder
            const remainder = cleaned.substring(compoundRibuMatch.index! + compoundRibuMatch[0].length).trim();
            const ratusMatch = remainder.match(/(\w+(?:\s+\w+)*)\s+ratus/i);
            let total = num * 1000;
            if (ratusMatch) {
                total += parseWordNumberMulti(ratusMatch[1]) * 100;
            }
            return `${prefix}Rp${total.toLocaleString('id-ID')}${perSuffix}`;
        }
    }

    // Check simple word-to-number lookup
    for (const [word, num] of Object.entries(wordToNum)) {
        if (cleaned.toLowerCase().includes(word)) {
            return `${prefix}Rp${num.toLocaleString('id-ID')}${perSuffix}`;
        }
    }

    // Already has "Rp" or number
    if (/Rp|^\d/.test(cleaned)) {
        const numCleaned = cleaned.replace(/rupiah/i, '').trim();
        return `${prefix}${numCleaned}${perSuffix}`;
    }

    return `${prefix}${cleaned}${perSuffix}`;
}

function parseWordNumberMulti(words: string): number {
    const nums: Record<string, number> = {
        'se': 1, 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5,
        'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'sepuluh': 10,
        'sebelas': 11,
    };

    const w = words.toLowerCase().trim();

    // Direct lookup
    if (nums[w] !== undefined) return nums[w];

    // "X belas" (12-19)
    const belasMatch = w.match(/^(\w+)\s+belas$/);
    if (belasMatch && nums[belasMatch[1]] !== undefined) {
        return nums[belasMatch[1]] + 10;
    }

    // "X puluh Y" (20-99)
    const puluhMatch = w.match(/^(\w+)\s+puluh(?:\s+(\w+))?$/);
    if (puluhMatch) {
        const tens = (nums[puluhMatch[1]] || 0) * 10;
        const ones = puluhMatch[2] ? (nums[puluhMatch[2]] || 0) : 0;
        return tens + ones;
    }

    // "X ratus Y puluh Z" or "X ratus Y" (100-999)
    const ratusMatch = w.match(/^(\w+)\s+ratus(?:\s+(.+))?$/);
    if (ratusMatch) {
        const hundreds = (nums[ratusMatch[1]] || (ratusMatch[1] === 'se' ? 1 : 0)) * 100;
        const rest = ratusMatch[2] ? parseWordNumberMulti(ratusMatch[2]) : 0;
        return hundreds + rest;
    }

    // "seratus" special case
    if (w === 'seratus') return 100;

    // Try as number
    const num = parseInt(w.replace(/[.,]/g, ''));
    if (!isNaN(num)) return num;

    return 0;
}

// Main parser: tries all strategies
function parseContent(text: string): ParseResult {
    // Strategy 1: Transition words ("Pertama, ... seharga ...")
    const result1 = parseTransitionPattern(text);
    if (result1.table && result1.table.rows.length >= 2) {
        return result1;
    }

    // Strategy 2: Colon-separated ("ServiceName: Price detail.")
    const result2 = parseColonPattern(text);
    if (result2.table && result2.table.rows.length >= 2) {
        return result2;
    }

    // Strategy 3: Sentence-based with price keywords
    const result3 = parseSentencePattern(text);
    if (result3.table && result3.table.rows.length >= 3) {
        return result3;
    }

    // No pattern matched
    return { beforeTable: text, table: null, afterTable: '' };
}

// React Component
const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, className = '' }) => {
    const parsed = useMemo(() => parseContent(content), [content]);

    if (!parsed.table) {
        return <p className={`text-xs sm:text-sm leading-relaxed ${className}`}>{content}</p>;
    }

    return (
        <div className={`text-xs sm:text-sm leading-relaxed space-y-3 ${className}`}>
            {parsed.beforeTable && (
                <p>{parsed.beforeTable}</p>
            )}

            <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/15 bg-white/5">
                            {parsed.table.headers.map((header, i) => (
                                <th
                                    key={i}
                                    className={`px-3 py-2 text-[11px] sm:text-xs font-semibold text-white/80 uppercase tracking-wider ${i === parsed.table!.headers.length - 1 ? 'text-right' : ''
                                        }`}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {parsed.table.rows.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={`border-b border-white/5 transition-colors hover:bg-white/5 ${rowIndex % 2 === 0 ? 'bg-white/[0.02]' : ''
                                    }`}
                            >
                                {row.map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className={`px-3 py-2.5 ${cellIndex === 0
                                            ? 'font-semibold text-white/95'
                                            : cellIndex === row.length - 1
                                                ? 'text-right font-bold text-emerald-400/90 whitespace-nowrap'
                                                : 'text-white/70'
                                            }`}
                                    >
                                        {cell || '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {parsed.afterTable && (
                <p className="text-white/70 text-[11px] sm:text-xs italic">{parsed.afterTable}</p>
            )}
        </div>
    );
};

export default FormattedMessage;
