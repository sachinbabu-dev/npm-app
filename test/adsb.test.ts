import { describe, it, expect } from 'vitest';
import {
  decodeHeader,
  decodeIdentification,
  decodeAirbornePosition,
  decodeAirborneVelocity,
  decodeMessage,
  decodeCPRGlobal,
  decodeCPRLocal,
  nl,
} from '../src/adsb/index.js';

const IDENT_MSG = '8D4840D6202CC371C32CE0576098';
const POS_EVEN = '8D40621D58C382D690C8AC2863A7';
const POS_ODD = '8D40621D58C386435CC412692AD6';
const VEL_MSG = '8D485020994409940838175B284F';

describe('decodeHeader', () => {
  it('extracts DF, CA, ICAO, and TC', () => {
    const h = decodeHeader(IDENT_MSG);
    expect(h.df).toBe(17);
    expect(h.ca).toBe(5);
    expect(h.icao).toBe('4840D6');
    expect(h.tc).toBe(4);
  });
});

describe('decodeIdentification', () => {
  it('decodes the KLM1023 callsign', () => {
    const m = decodeIdentification(IDENT_MSG);
    expect(m.kind).toBe('identification');
    expect(m.callsign).toBe('KLM1023');
    expect(m.category).toBe(0);
  });
});

describe('decodeAirbornePosition', () => {
  it('decodes altitude and CPR raw values from an even-frame message', () => {
    const m = decodeAirbornePosition(POS_EVEN);
    expect(m.kind).toBe('airborne-position');
    expect(m.altitudeFeet).toBe(38000);
    expect(m.cprFormat).toBe('even');
    expect(m.latCpr).toBeGreaterThan(0);
    expect(m.latCpr).toBeLessThan(1);
    expect(m.lonCpr).toBeGreaterThan(0);
    expect(m.lonCpr).toBeLessThan(1);
  });

  it('flags odd-frame messages', () => {
    const m = decodeAirbornePosition(POS_ODD);
    expect(m.cprFormat).toBe('odd');
    expect(m.altitudeFeet).toBe(38000);
  });
});

describe('decodeAirborneVelocity', () => {
  it('decodes ground speed, track, and vertical rate', () => {
    const m = decodeAirborneVelocity(VEL_MSG);
    expect(m.kind).toBe('airborne-velocity');
    expect(m.subtype).toBe(1);
    expect(m.groundSpeedKnots).toBeCloseTo(159.2, 1);
    expect(m.trackDegrees).toBeCloseTo(182.88, 1);
    expect(m.verticalRateFpm).toBe(-832);
    expect(m.verticalRateSource).toBe('baro');
  });
});

describe('decodeMessage', () => {
  it('routes each message kind correctly', () => {
    expect(decodeMessage(IDENT_MSG).kind).toBe('identification');
    expect(decodeMessage(POS_EVEN).kind).toBe('airborne-position');
    expect(decodeMessage(VEL_MSG).kind).toBe('airborne-velocity');
  });
});

describe('CPR', () => {
  it('nl(0) is 59', () => {
    expect(nl(0)).toBe(59);
  });

  it('globally decodes the reference lat/lon (Junzi Sun textbook)', () => {
    const pos = decodeCPRGlobal({
      evenMessage: POS_EVEN,
      oddMessage: POS_ODD,
      evenTimestamp: 2,
      oddTimestamp: 1,
    });
    expect(pos.lat).toBeCloseTo(52.2572, 3);
    expect(pos.lon).toBeCloseTo(3.91937, 3);
  });

  it('locally decodes near a known reference', () => {
    const pos = decodeCPRLocal(POS_EVEN, { lat: 52.258, lon: 3.918 });
    expect(pos.lat).toBeCloseTo(52.2572, 3);
    expect(pos.lon).toBeCloseTo(3.91937, 3);
  });
});
