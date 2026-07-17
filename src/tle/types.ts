export interface TLEInput {
  name?: string;
  line1: string;
  line2: string;
}

export interface ParsedTLE {
  name: string | undefined;
  satelliteNumber: number;
  classification: string;
  internationalDesignator: string;
  epochYear: number;
  epochDay: number;
  epoch: Date;
  firstDerivativeMeanMotion: number;
  secondDerivativeMeanMotion: number;
  bstar: number;
  ephemerisType: number;
  elementSetNumber: number;
  inclination: number;
  rightAscension: number;
  eccentricity: number;
  argumentOfPerigee: number;
  meanAnomaly: number;
  meanMotion: number;
  revolutionNumber: number;
}

export class TLEError extends Error {
  override name = 'TLEError';
}
