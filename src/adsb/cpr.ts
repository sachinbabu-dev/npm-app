import { hexToBits } from './bits.js';
import { ADSBError } from './types.js';
import type { LatLon } from '../geodesy/types.js';

const NZ = 15;

function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

export function nl(lat: number): number {
  const absLat = Math.abs(lat);
  if (absLat >= 87) return 1;
  if (absLat === 0) return 59;
  const numerator = 1 - Math.cos(Math.PI / (2 * NZ));
  const denominator = Math.cos((Math.PI / 180) * absLat) ** 2;
  const inside = 1 - numerator / denominator;
  return Math.floor((2 * Math.PI) / Math.acos(inside));
}

interface CPRRaw {
  latCpr: number;
  lonCpr: number;
}

function extractCPR(hex: string): CPRRaw {
  const bits = hexToBits(hex);
  return {
    latCpr: parseInt(bits.slice(54, 71), 2) / 131072,
    lonCpr: parseInt(bits.slice(71, 88), 2) / 131072,
  };
}

export interface GlobalCPRInput {
  evenMessage: string;
  oddMessage: string;
  evenTimestamp: number;
  oddTimestamp: number;
}

export function decodeCPRGlobal(input: GlobalCPRInput): LatLon {
  const even = extractCPR(input.evenMessage);
  const odd = extractCPR(input.oddMessage);

  const dLatEven = 360 / (4 * NZ);
  const dLatOdd = 360 / (4 * NZ - 1);

  const j = Math.floor(59 * even.latCpr - 60 * odd.latCpr + 0.5);

  let latEven = dLatEven * (mod(j, 60) + even.latCpr);
  let latOdd = dLatOdd * (mod(j, 59) + odd.latCpr);
  if (latEven >= 270) latEven -= 360;
  if (latOdd >= 270) latOdd -= 360;

  if (nl(latEven) !== nl(latOdd)) {
    throw new ADSBError('CPR global decode: NL(evenLat) !== NL(oddLat), messages straddle a zone boundary');
  }

  const useEven = input.evenTimestamp >= input.oddTimestamp;
  const lat = useEven ? latEven : latOdd;

  const nlLat = nl(lat);
  const ni = Math.max(nlLat - (useEven ? 0 : 1), 1);
  const dLon = 360 / ni;
  const m = Math.floor(even.lonCpr * (nlLat - 1) - odd.lonCpr * nlLat + 0.5);
  const lonCpr = useEven ? even.lonCpr : odd.lonCpr;
  let lon = dLon * (mod(m, ni) + lonCpr);
  if (lon >= 180) lon -= 360;

  return { lat, lon };
}

export function decodeCPRLocal(message: string, reference: LatLon): LatLon {
  const bits = hexToBits(message);
  const isOdd = bits[53] === '1';
  const { latCpr, lonCpr } = extractCPR(message);

  const i = isOdd ? 1 : 0;
  const dLat = 360 / (4 * NZ - i);
  const j =
    Math.floor(reference.lat / dLat) +
    Math.floor(mod(reference.lat, dLat) / dLat - latCpr + 0.5);
  const lat = dLat * (j + latCpr);

  const nlv = nl(lat) - i;
  const dLon = nlv > 0 ? 360 / nlv : 360;
  const m =
    Math.floor(reference.lon / dLon) +
    Math.floor(mod(reference.lon, dLon) / dLon - lonCpr + 0.5);
  const lon = dLon * (m + lonCpr);

  return { lat, lon };
}
