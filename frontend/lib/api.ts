import type {
  AppSettings,
  DerivedNoteResponse,
  DocumentActionResponse,
  DocumentDetail,
  DocumentListItem,
  GraphResponse,
  SearchRequest,
  SearchResponse,
  TestConnectionResponse,
  UploadResponse
} from "@/lib/types";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  documents(limit = 20): Promise<DocumentListItem[]> {
    return request(`/documents?limit=${limit}`);
  },
  document(id: number): Promise<DocumentDetail> {
    return request(`/documents/${id}`);
  },
  upload(files: File[]): Promise<UploadResponse> {
    const formData = new FormData();
    for (const file of files) formData.append("files", file);
    return request("/upload", { method: "POST", body: formData });
  },
  rerunIngestion(id: number): Promise<DocumentActionResponse> {
    return request(`/ingest/${id}`, { method: "POST" });
  },
  search(payload: SearchRequest): Promise<SearchResponse> {
    return request("/search", { method: "POST", body: JSON.stringify(payload) });
  },
  graph(): Promise<GraphResponse> {
    return request("/graph");
  },
  settings(): Promise<AppSettings> {
    return request("/settings");
  },
  saveSettings(payload: AppSettings): Promise<AppSettings> {
    return request("/settings", { method: "PUT", body: JSON.stringify(payload) });
  },
  testConnection(): Promise<TestConnectionResponse> {
    return request("/settings/test", { method: "POST" });
  },
  createDerivedNote(documentIds: number[], prompt: string): Promise<DerivedNoteResponse> {
    return request("/chat/derived-note", {
      method: "POST",
      body: JSON.stringify({ document_ids: documentIds, prompt })
    });
  }
};
