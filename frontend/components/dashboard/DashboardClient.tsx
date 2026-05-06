"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { DocumentListItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { DocumentCard } from "@/components/document/DocumentCard";

export function DashboardClient() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .documents(8)
      .then(setDocuments)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    return {
      ready: documents.filter((doc) => doc.status === "ready").length,
      processing: documents.filter((doc) => doc.status === "processing").length,
      failed: documents.filter((doc) => doc.status === "failed").length
    };
  }, [documents]);

  return (
    <div className="page">
      <section className="pageHeader">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Your local AI knowledge space</h1>
          <p className="muted">Upload, index, search, and synthesize documents without losing control of your data.</p>
        </div>
        <div className="row">
          <Link href="/upload"><Button>Upload documents</Button></Link>
          <Link href="/search"><Button variant="secondary">Ask knowledge base</Button></Link>
        </div>
      </section>

      <section className="grid three">
        <Card><h2>{summary.ready}</h2><p className="muted">Ready documents</p></Card>
        <Card><h2>{summary.processing}</h2><p className="muted">Processing now</p></Card>
        <Card><h2>{summary.failed}</h2><p className="muted">Needs attention</p></Card>
      </section>

      <section className="grid two">
        <Card>
          <div className="pageHeader">
            <h2>Recent documents</h2>
            {loading ? <Spinner /> : null}
          </div>
          {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
          {!loading && documents.length === 0 ? (
            <EmptyState title="No documents yet" message="Upload PDFs, notes, text files, or images to build your space." />
          ) : (
            <div className="stack">
              {documents.map((document) => <DocumentCard key={document.id} document={document} />)}
            </div>
          )}
        </Card>
        <div className="stack">
          <Card>
            <h2>Quick actions</h2>
            <div className="stack">
              <Link href="/upload"><Button variant="secondary">Add source files</Button></Link>
              <Link href="/search"><Button variant="secondary">Run semantic search</Button></Link>
              <Link href="/graph"><Button variant="secondary">Explore graph</Button></Link>
              <Link href="/settings"><Button variant="secondary">Tune system prompt</Button></Link>
            </div>
          </Card>
          <Card>
            <h2>Recent AI outputs</h2>
            <p className="muted">Summaries, tags, and derived notes appear on document cards after ingestion completes.</p>
          </Card>
        </div>
      </section>
    </div>
  );
}

