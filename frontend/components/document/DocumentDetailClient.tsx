"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { DocumentDetail } from "@/lib/types";
import { formatDate, statusTone } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/Textarea";

export function DocumentDetailClient({ id }: { id: number }) {
  const router = useRouter();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [prompt, setPrompt] = useState("Create a structured note with summary, key claims, citations to source sections, and follow-up questions.");

  useEffect(() => {
    api
      .document(id)
      .then(setDocument)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function rerun() {
    setWorking(true);
    try {
      const response = await api.rerunIngestion(id);
      const updated = await api.document(response.document.id);
      setDocument(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rerun failed");
    } finally {
      setWorking(false);
    }
  }

  async function createNote() {
    setWorking(true);
    try {
      const note = await api.createDerivedNote([id], prompt);
      router.push(`/document/${note.document_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Note creation failed");
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;
  if (!document) return <EmptyState title="Missing document" message="Document could not be found." />;

  return (
    <div className="page">
      <section className="pageHeader">
        <div>
          <p className="eyebrow">Document</p>
          <h1>{document.title}</h1>
          <div className="row">
            <StatusBadge status={document.status} tone={statusTone(document.status)} />
            <span className="muted">{document.mime_type}</span>
            <span className="muted">Updated {formatDate(document.updated_at)}</span>
          </div>
        </div>
        <div className="row">
          <Button variant="secondary" onClick={rerun} loading={working}>Rerun analysis</Button>
          <Button onClick={() => setNoteOpen(true)}>Create derived note</Button>
          <Link href={`/graph?document=${document.id}`}><Button variant="ghost">Open graph neighbors</Button></Link>
        </div>
      </section>

      <section className="grid two">
        <Card>
          <h2>Summary</h2>
          <p>{document.summary || "No summary yet."}</p>
          <h2>Key points</h2>
          <div className="stack">
            {document.key_points.length ? document.key_points.map((point) => <Card compact key={point}>{point}</Card>) : <p className="muted">No key points yet.</p>}
          </div>
          <h2 style={{ marginTop: 24 }}>Tags</h2>
          <div className="row">
            {document.tags.map((tag) => <StatusBadge key={tag} status={tag} />)}
          </div>
        </Card>
        <Card>
          <h2>Related documents</h2>
          <div className="stack">
            {document.related_documents.length ? (
              document.related_documents.map((related) => (
                <Link href={`/document/${related.id}`} key={related.id}>
                  <Card compact interactive>
                    <strong>{related.title}</strong>
                    <p className="muted">{related.reason} · {related.weight.toFixed(3)}</p>
                  </Card>
                </Link>
              ))
            ) : (
              <EmptyState title="No graph neighbors" message="More indexed documents create similarity edges." />
            )}
          </div>
        </Card>
      </section>

      <section className="grid two">
        <Card>
          <h2>Extracted text preview</h2>
          <pre>{document.extracted_text_preview || "No extracted text available."}</pre>
        </Card>
        <Card>
          <h2>Chunks</h2>
          <div className="stack">
            {document.chunks.map((chunk) => (
              <Card compact key={chunk.id}>
                <strong>Chunk {chunk.chunk_index}</strong>
                <p>{chunk.content}</p>
              </Card>
            ))}
          </div>
        </Card>
      </section>

      <Modal open={noteOpen} title="Create derived note" onClose={() => setNoteOpen(false)}>
        <div className="stack">
          <Textarea label="Note instructions" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          <Button onClick={createNote} loading={working}>Generate note</Button>
        </div>
      </Modal>
    </div>
  );
}
