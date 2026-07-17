import { type ParsedTLE, type TLEInput, TLEError } from './types.js';

export interface ParseOptions {
  validateChecksums?: boolean;
}

function checksum(line: string): number {
  let sum = 0;
  for (let i = 0; i < 68 && i < line.length; i++) {
    const ch = line[i]!;
    if (ch >= '0' && ch <= '9') sum += ch.charCodeAt(0) - 48;
    else if (ch === '-') sum += 1;
  }
  return sum % 10;
}

function parseImpliedDecimal(field: string): number {
  const s = field.trim();
  if (!s) return 0;
  const sign = s.startsWith('-') ? -1 : 1;
  const body = s.replace(/^[-+]/, '');
  const m = body.match(/^(\d+)([-+]\d+)$/);
  if (!m) return Number.NaN;
  const mantissa = Number(`0.${m[1]}`);
  const exp = Number(m[2]);
  return sign * mantissa * 10 ** exp;
}

function parseEpoch(field: string): { epochYear: number; epochDay: number; epoch: Date } {
  const yearRaw = Number(field.slice(0, 2));
  const epochDay = Number(field.slice(2));
  const epochYear = yearRaw < 57 ? 2000 + yearRaw : 1900 + yearRaw;
  const jan1 = Date.UTC(epochYear, 0, 1);
  const epoch = new Date(jan1 + (epochDay - 1) * 86_400_000);
  return { epochYear, epochDay, epoch };
}

export function parseTLE(input: string | TLEInput, opts: ParseOptions = {}): ParsedTLE {
  let name: string | undefined;
  let line1: string;
  let line2: string;

  if (typeof input === 'string') {
    const lines = input
      .split(/\r?\n/)
      .map((l) => l.trimEnd())
      .filter((l) => l.length > 0);
    if (lines.length === 3) {
      name = lines[0];
      line1 = lines[1]!;
      line2 = lines[2]!;
    } else if (lines.length === 2) {
      line1 = lines[0]!;
      line2 = lines[1]!;
    } else {
      throw new TLEError(`Expected 2 or 3 non-empty lines, got ${lines.length}`);
    }
  } else {
    name = input.name;
    line1 = input.line1;
    line2 = input.line2;
  }

  if (line1[0] !== '1' || line2[0] !== '2') {
    throw new TLEError('TLE lines must start with "1" and "2"');
  }
  if (line1.length < 69 || line2.length < 69) {
    throw new TLEError('TLE lines must be at least 69 characters long');
  }

  const validate = opts.validateChecksums ?? true;
  if (validate) {
    const c1 = checksum(line1);
    const c2 = checksum(line2);
    if (Number(line1[68]) !== c1) {
      throw new TLEError(`Line 1 checksum mismatch: expected ${c1}, got ${line1[68]}`);
    }
    if (Number(line2[68]) !== c2) {
      throw new TLEError(`Line 2 checksum mismatch: expected ${c2}, got ${line2[68]}`);
    }
  }

  const satNo1 = Number(line1.slice(2, 7));
  const satNo2 = Number(line2.slice(2, 7));
  if (satNo1 !== satNo2) {
    throw new TLEError('Satellite catalog numbers on line 1 and 2 do not match');
  }

  const { epochYear, epochDay, epoch } = parseEpoch(line1.slice(18, 32));

  return {
    name: name?.trim() || undefined,
    satelliteNumber: satNo1,
    classification: line1[7]!,
    internationalDesignator: line1.slice(9, 17).trim(),
    epochYear,
    epochDay,
    epoch,
    firstDerivativeMeanMotion: Number(line1.slice(33, 43).trim()),
    secondDerivativeMeanMotion: parseImpliedDecimal(line1.slice(44, 52)),
    bstar: parseImpliedDecimal(line1.slice(53, 61)),
    ephemerisType: Number(line1[62]),
    elementSetNumber: Number(line1.slice(64, 68)),
    inclination: Number(line2.slice(8, 16)),
    rightAscension: Number(line2.slice(17, 25)),
    eccentricity: Number(`0.${line2.slice(26, 33)}`),
    argumentOfPerigee: Number(line2.slice(34, 42)),
    meanAnomaly: Number(line2.slice(43, 51)),
    meanMotion: Number(line2.slice(52, 63)),
    revolutionNumber: Number(line2.slice(63, 68)),
  };
}

export function validateTLEChecksum(line: string): boolean {
  if (line.length < 69) return false;
  return Number(line[68]) === checksum(line);
}
