export type SlashCommandMode = "raw" | "structured";
export type SlashCommandSuggestionSource = "custom" | "skill";

export interface SlashCommand {
  id: number;
  user_id: string;
  name: string;
  enabled: boolean;
  mode: SlashCommandMode;
  description: string | null;
  argument_hint: string | null;
  allowed_tools: string | null;
  content: string | null;
  raw_markdown: string | null;
  created_at: string;
  updated_at: string;
}

export interface SlashCommandCreateInput {
  name: string;
  enabled?: boolean;
  mode: SlashCommandMode;
  description?: string | null;
  argument_hint?: string | null;
  allowed_tools?: string | null;
  content?: string | null;
  raw_markdown?: string | null;
}

export interface SlashCommandUpdateInput {
  name?: string | null;
  enabled?: boolean | null;
  mode?: SlashCommandMode | null;
  description?: string | null;
  argument_hint?: string | null;
  allowed_tools?: string | null;
  content?: string | null;
  raw_markdown?: string | null;
}

export interface SlashCommandSuggestion {
  name: string;
  description: string | null;
  argument_hint: string | null;
  source: SlashCommandSuggestionSource;
}
