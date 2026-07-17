import { hexToBits, bitsToInt, normalizeMessage } from './bits.js';
import {
  type DecodedHeader,
  type DecodedMessage,
  type IdentificationMessage,
  type AirbornePositionMessage,
  type AirborneVelocityMessage,
  type CPRFormat,
} from './types.js';

const CALLSIGN_CHARSET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ##### ###############0123456789######';

export function decodeHeader(msg: string): DecodedHeader {
  const hex = normalizeMessage(msg);
  const bits = hexToBits(hex);
  const df = bitsToInt(bits.slice(0, 5));
  const ca = bitsToInt(bits.slice(5, 8));
  const icao = hex.slice(2, 8);
  const tc = bitsToInt(bits.slice(32, 37));
  return { df, ca, icao, tc };
}

export function decodeIdentification(msg: string): IdentificationMessage {
  const header = decodeHeader(msg);
  const bits = hexToBits(msg);
  const category = bitsToInt(bits.slice(37, 40));
  let callsign = '';
  for (let i = 0; i < 8; i++) {
    const start = 40 + i * 6;
    const idx = bitsToInt(bits.slice(start, start + 6));
    callsign += CALLSIGN_CHARSET[idx] ?? '#';
  }
  return {
    ...header,
    kind: 'identification',
    category,
    callsign: callsign.replace(/[#_]/g, '').trim(),
  };
}

function decodeAltitudeFeet(bits: string): number | null {
  const altBits = bits.slice(40, 52);
  const q = altBits[7];
  if (q === '1') {
    const n = parseInt(altBits.slice(0, 7) + altBits.slice(8), 2);
    return n * 25 - 1000;
  }
  return null;
}

export function decodeAirbornePosition(msg: string): AirbornePositionMessage {
  const header = decodeHeader(msg);
  const bits = hexToBits(msg);
  const surveillanceStatus = bitsToInt(bits.slice(37, 39));
  const altitudeFeet = decodeAltitudeFeet(bits);
  const cprFormat: CPRFormat = bits[53] === '1' ? 'odd' : 'even';
  const latCpr = parseInt(bits.slice(54, 71), 2) / 131072;
  const lonCpr = parseInt(bits.slice(71, 88), 2) / 131072;
  return {
    ...header,
    kind: 'airborne-position',
    altitudeFeet,
    surveillanceStatus,
    cprFormat,
    latCpr,
    lonCpr,
  };
}

export function decodeAirborneVelocity(msg: string): AirborneVelocityMessage {
  const header = decodeHeader(msg);
  const bits = hexToBits(msg);
  const subtype = bitsToInt(bits.slice(37, 40));

  let groundSpeedKnots: number | null = null;
  let trackDegrees: number | null = null;

  if (subtype === 1 || subtype === 2) {
    const ewSign = bits[45] === '1' ? -1 : 1;
    const ewRaw = parseInt(bits.slice(46, 56), 2);
    const nsSign = bits[56] === '1' ? -1 : 1;
    const nsRaw = parseInt(bits.slice(57, 67), 2);

    if (ewRaw !== 0 && nsRaw !== 0) {
      const supersonic = subtype === 2;
      const scale = supersonic ? 4 : 1;
      const vEW = (ewRaw - 1) * scale * ewSign;
      const vNS = (nsRaw - 1) * scale * nsSign;
      groundSpeedKnots = Math.sqrt(vEW * vEW + vNS * vNS);
      let heading = (Math.atan2(vEW, vNS) * 180) / Math.PI;
      if (heading < 0) heading += 360;
      trackDegrees = heading;
    }
  }

  const vrSign = bits[68] === '1' ? -1 : 1;
  const vrRaw = parseInt(bits.slice(69, 78), 2);
  const verticalRateFpm = vrRaw === 0 ? null : (vrRaw - 1) * 64 * vrSign;
  const verticalRateSource: 'baro' | 'gnss' = bits[67] === '1' ? 'gnss' : 'baro';

  return {
    ...header,
    kind: 'airborne-velocity',
    subtype,
    groundSpeedKnots,
    trackDegrees,
    verticalRateFpm,
    verticalRateSource,
  };
}

export function decodeMessage(msg: string): DecodedMessage {
  const header = decodeHeader(msg);
  const { tc } = header;
  if (tc >= 1 && tc <= 4) return decodeIdentification(msg);
  if ((tc >= 9 && tc <= 18) || (tc >= 20 && tc <= 22)) return decodeAirbornePosition(msg);
  if (tc === 19) return decodeAirborneVelocity(msg);
  return { ...header, kind: 'unknown' };
}
