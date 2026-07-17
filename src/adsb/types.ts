export type CPRFormat = 'even' | 'odd';

export interface DecodedHeader {
  df: number;
  ca: number;
  icao: string;
  tc: number;
}

export interface IdentificationMessage extends DecodedHeader {
  kind: 'identification';
  category: number;
  callsign: string;
}

export interface AirbornePositionMessage extends DecodedHeader {
  kind: 'airborne-position';
  altitudeFeet: number | null;
  surveillanceStatus: number;
  cprFormat: CPRFormat;
  latCpr: number;
  lonCpr: number;
}

export interface AirborneVelocityMessage extends DecodedHeader {
  kind: 'airborne-velocity';
  subtype: number;
  groundSpeedKnots: number | null;
  trackDegrees: number | null;
  verticalRateFpm: number | null;
  verticalRateSource: 'baro' | 'gnss';
}

export interface UnknownMessage extends DecodedHeader {
  kind: 'unknown';
}

export type DecodedMessage =
  | IdentificationMessage
  | AirbornePositionMessage
  | AirborneVelocityMessage
  | UnknownMessage;

export class ADSBError extends Error {
  override name = 'ADSBError';
}
