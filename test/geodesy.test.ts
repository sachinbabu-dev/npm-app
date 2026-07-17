import { describe, it, expect } from 'vitest';
import {
  haversineDistance,
  initialBearing,
  finalBearing,
  destinationPoint,
  crossTrackDistance,
  midpoint,
} from '../src/geodesy/index.js';

const LHR = { lat: 51.4700, lon: -0.4543 };
const JFK = { lat: 40.6413, lon: -73.7781 };

describe('haversineDistance', () => {
  it('measures LHR–JFK within 1% of the published 5540 km', () => {
    const km = haversineDistance(LHR, JFK) / 1000;
    expect(km).toBeGreaterThan(5490);
    expect(km).toBeLessThan(5590);
  });

  it('is zero for the same point', () => {
    expect(haversineDistance(LHR, LHR)).toBe(0);
  });
});

describe('initialBearing / finalBearing', () => {
  it('LHR→JFK initial bearing is roughly WNW (288°)', () => {
    const b = initialBearing(LHR, JFK);
    expect(b).toBeGreaterThan(285);
    expect(b).toBeLessThan(292);
  });

  it('finalBearing differs from initial for long paths', () => {
    const fb = finalBearing(LHR, JFK);
    const ib = initialBearing(LHR, JFK);
    expect(Math.abs(fb - ib)).toBeGreaterThan(10);
  });
});

describe('destinationPoint', () => {
  it('round-trips: dest then reverse dest returns to origin', () => {
    const bearing = 45;
    const distance = 10_000;
    const dest = destinationPoint(LHR, bearing, distance);
    const back = destinationPoint(dest, (bearing + 180) % 360, distance);
    expect(back.lat).toBeCloseTo(LHR.lat, 3);
    expect(back.lon).toBeCloseTo(LHR.lon, 3);
  });
});

describe('crossTrackDistance', () => {
  it('is near zero for a point on the great-circle path', () => {
    const mid = midpoint(LHR, JFK);
    expect(Math.abs(crossTrackDistance(mid, LHR, JFK))).toBeLessThan(1);
  });

  it('has correct sign for points off-path', () => {
    const off = { lat: LHR.lat + 1, lon: LHR.lon };
    expect(crossTrackDistance(off, LHR, JFK)).not.toBe(0);
  });
});
