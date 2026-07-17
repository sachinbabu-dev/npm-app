import { ADSBError } from './types.js';

export function hexToBits(hex: string): string {
  const h = hex.trim().toUpperCase();
  if (!/^[0-9A-F]+$/.test(h)) {
    throw new ADSBError(`Invalid hex string: ${hex}`);
  }
  let out = '';
  for (const c of h) {
    out += parseInt(c, 16).toString(2).padStart(4, '0');
  }
  return out;
}

export function bitsToInt(b: string): number {
  return parseInt(b, 2);
}

export function normalizeMessage(hex: string): string {
  const h = hex.trim().toUpperCase();
  if (h.length !== 28) {
    throw new ADSBError(`Expected 112-bit (28 hex char) message, got ${h.length} chars`);
  }
  return h;
}
