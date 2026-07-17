# radar-utils

Typed TypeScript helpers for radar / satellite tracking applications:

- **`radar-utils/tle`** — NORAD Two-Line Element parser with checksum validation
- **`radar-utils/adsb`** — ADS-B 1090ES (DF17) message decoder + CPR position decoding
- **`radar-utils/geodesy`** — haversine distance, bearings, destination point, cross-track distance

Zero dependencies. Ships ESM + CJS + `.d.ts`. Node ≥ 18.

## Install

```sh
npm install radar-utils
```

## TLE

```ts
import { parseTLE } from 'radar-utils/tle';

const iss = parseTLE(`
ISS (ZARYA)
1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537
`);

iss.satelliteNumber;  // 25544
iss.inclination;      // 51.6416
iss.epoch;            // Date — 2008-09-20T12:25:40Z
iss.meanMotion;       // 15.72125391 revs/day
```

Checksum validation runs by default. Skip with `parseTLE(text, { validateChecksums: false })`.

## ADS-B

Decode a raw 112-bit (28 hex char) DF17 extended squitter message:

```ts
import { decodeMessage } from 'radar-utils/adsb';

const m = decodeMessage('8D4840D6202CC371C32CE0576098');
if (m.kind === 'identification') {
  m.callsign;  // 'KLM1023'
}
```

Or use the specific decoders when you already know the type code:

```ts
import {
  decodeIdentification,
  decodeAirbornePosition,
  decodeAirborneVelocity,
} from 'radar-utils/adsb';
```

### CPR position decoding

Airborne position messages carry a Compact Position Reporting (CPR) fraction, not a full lat/lon. Recover the position from a paired even+odd message:

```ts
import { decodeCPRGlobal } from 'radar-utils/adsb';

const pos = decodeCPRGlobal({
  evenMessage: '8D40621D58C382D690C8AC2863A7',
  oddMessage:  '8D40621D58C386435CC412692AD6',
  evenTimestamp: 2,
  oddTimestamp: 1,
});
// { lat: 52.2572, lon: 3.91937 }
```

Or against a known reference (single message):

```ts
import { decodeCPRLocal } from 'radar-utils/adsb';

const pos = decodeCPRLocal('8D40621D58C382D690C8AC2863A7', {
  lat: 52.258,
  lon: 3.918,
});
```

## Geodesy

All distances in metres, bearings in degrees (0–360, clockwise from north).

```ts
import {
  haversineDistance,
  initialBearing,
  destinationPoint,
  crossTrackDistance,
} from 'radar-utils/geodesy';

const LHR = { lat: 51.4700, lon: -0.4543 };
const JFK = { lat: 40.6413, lon: -73.7781 };

haversineDistance(LHR, JFK);           // ~5540 km
initialBearing(LHR, JFK);              // ~288°
destinationPoint(LHR, 90, 100_000);    // 100 km due east of LHR
crossTrackDistance(pointNearPath, LHR, JFK);
```

## Publish

```sh
npm run typecheck
npm test
npm run build
npm publish
```

`publishConfig.access` is `public`, so the package is visible to everyone.

## Scope

- ADS-B decoding covers DF17 identification (TC 1–4), airborne position (TC 9–18, 20–22), and airborne velocity (TC 19) — the message types you need for a live map. Surface position and Gillham-encoded altitude are not implemented.
- TLE parsing extracts the mean orbital elements. This library does **not** include SGP4 propagation — pair it with a propagator like `satellite.js` if you need positions in the future.

## Licence

MIT
