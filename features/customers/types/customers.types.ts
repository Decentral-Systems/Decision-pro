export interface Customer360Data {
  customer?: Record<string, unknown>;
  profile?: Record<string, unknown>;
  credit?: Record<string, unknown>;
  risk?: Record<string, unknown>;
  [key: string]: unknown;
}
