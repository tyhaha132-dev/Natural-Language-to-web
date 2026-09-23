export interface DatabaseResult {
  available: boolean;
  host: string;
  port: number;
  database: string;
  user: string;
  durationMs: number;
}
