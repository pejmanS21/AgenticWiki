export type ThemeMode = "light" | "dark" | "device";

export type LLMProvider = "ollama" | "openai" | "openai-compatible";

export type LLMProfile = {
  id: string;
  name: string;
  llm_provider: LLMProvider;
  llm_model: string;
  llm_base_url: string;
  llm_api_key: string;
};

export type AppSettings = {
  llm_provider: LLMProvider;
  llm_model: string;
  llm_base_url: string;
  llm_api_key: string;
  llm_profiles: LLMProfile[];
  selected_llm_profile_id: string;
  ui_theme: ThemeMode;
  embedding_provider: string;
  embedding_model: string;
  system_prompt: string;
};

export type DocumentListItem = {
  id: number;
  title: string;
  filename: string;
  mime_type: string;
  kind: string;
  status: "uploaded" | "processing" | "ready" | "failed" | string;
  summary: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type ChunkPreview = {
  id: number;
  chunk_index: number;
  content: string;
};

export type RelatedDocument = {
  id: number;
  title: string;
  weight: number;
  reason: string;
};

export type DocumentDetail = DocumentListItem & {
  key_points: string[];
  extracted_text_preview: string;
  chunks: ChunkPreview[];
  related_documents: RelatedDocument[];
};

export type DocumentActionResponse = {
  document: DocumentListItem;
  message: string;
};

export type UploadResponse = {
  documents: DocumentListItem[];
};

export type GraphNode = {
  id: number;
  document_id: number;
  label: string;
  group: string;
  metadata: Record<string, unknown>;
};

export type GraphEdge = {
  id: number;
  source_document_id: number;
  target_document_id: number;
  weight: number;
  label: string;
  metadata: Record<string, unknown>;
};

export type GraphResponse = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type SearchRequest = {
  query: string;
  top_k?: number;
  include_answer?: boolean;
};

export type SearchChunk = {
  chunk_id: number;
  document_id: number;
  document_title: string;
  snippet: string;
  score: number;
  chunk_index: number;
};

export type Citation = {
  document_id: number;
  document_title: string;
  chunk_id: number;
  snippet: string;
};

export type SearchResponse = {
  answer: string;
  citations: Citation[];
  chunks: SearchChunk[];
  related_documents: number[];
};

export type DerivedNoteResponse = {
  document_id: number;
  title: string;
  content: string;
  tags: string[];
};

export type TestConnectionResponse = {
  ok: boolean;
  message: string;
};
