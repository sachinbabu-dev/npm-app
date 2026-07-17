import { describe, it, expect } from 'vitest';
import { parseTLE, validateTLEChecksum, TLEError } from '../src/tle/index.js';

const ISS = `ISS (ZARYA)
1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537`;

describe('parseTLE', () => {
  it('parses the ISS 3-line TLE', () => {
    const t = parseTLE(ISS);
    expect(t.name).toBe('ISS (ZARYA)');
    expect(t.satelliteNumber).toBe(25544);
    expect(t.classification).toBe('U');
    expect(t.internationalDesignator).toBe('98067A');
    expect(t.epochYear).toBe(2008);
    expect(t.epochDay).toBeCloseTo(264.51782528, 8);
    expect(t.firstDerivativeMeanMotion).toBeCloseTo(-0.00002182, 10);
    expect(t.secondDerivativeMeanMotion).toBe(0);
    expect(t.bstar).toBeCloseTo(-0.11606e-4, 12);
    expect(t.elementSetNumber).toBe(292);
    expect(t.inclination).toBeCloseTo(51.6416, 6);
    expect(t.rightAscension).toBeCloseTo(247.4627, 6);
    expect(t.eccentricity).toBeCloseTo(0.0006703, 8);
    expect(t.argumentOfPerigee).toBeCloseTo(130.5360, 6);
    expect(t.meanAnomaly).toBeCloseTo(325.0288, 6);
    expect(t.meanMotion).toBeCloseTo(15.72125391, 8);
    expect(t.revolutionNumber).toBe(56353);
  });

  it('accepts a 2-line TLE without a name', () => {
    const twoLine = ISS.split('\n').slice(1).join('\n');
    const t = parseTLE(twoLine);
    expect(t.name).toBeUndefined();
    expect(t.satelliteNumber).toBe(25544);
  });

  it('accepts a structured input object', () => {
    const [, l1, l2] = ISS.split('\n');
    const t = parseTLE({ name: 'ISS', line1: l1!, line2: l2! });
    expect(t.name).toBe('ISS');
  });

  it('rejects a corrupted checksum', () => {
    const bad = ISS.replace('2927', '2920');
    expect(() => parseTLE(bad)).toThrow(TLEError);
  });

  it('skips checksum validation when opted out', () => {
    const bad = ISS.replace('2927', '2920');
    expect(() => parseTLE(bad, { validateChecksums: false })).not.toThrow();
  });

  it('rejects mismatched catalog numbers', () => {
    const bad = ISS.replace('2 25544  51.6416', '2 25545  51.6416');
    expect(() => parseTLE(bad, { validateChecksums: false })).toThrow(/catalog/);
  });
});

describe('validateTLEChecksum', () => {
  it('confirms valid ISS lines', () => {
    const [, l1, l2] = ISS.split('\n');
    expect(validateTLEChecksum(l1!)).toBe(true);
    expect(validateTLEChecksum(l2!)).toBe(true);
  });
});
