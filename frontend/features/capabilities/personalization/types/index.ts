export interface CustomInstructionsSettings {
  enabled: boolean;
  content: string;
  updated_at: string | null;
}

export interface CustomInstructionsUpsertInput {
  enabled: boolean;
  content: string;
}
