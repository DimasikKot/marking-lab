
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface ModelDbResponse {
  id: number;
  name: string;
  is_draft: boolean;
  saved_in_memory: boolean;
  parameters: Record<string, JsonValue>;
  metrics: Record<string, JsonValue>;
  graphs: Record<string, string>;
  files_ids: number[];
  created_at: string;
  updated_at: string;
}
