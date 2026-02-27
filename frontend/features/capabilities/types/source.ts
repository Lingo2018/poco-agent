export type SourceKind = "github" | "zip" | "system" | "manual" | "unknown";

export interface SourceInfo {
  kind: SourceKind;
  repo?: string | null;
  url?: string | null;
  ref?: string | null;
  filename?: string | null;
}
