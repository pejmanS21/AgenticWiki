"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CircleCheckBig, FilePlus2, MessageSquareText, Network, RefreshCw, SlidersHorizontal } from "lucide-react";
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
          <Link href="/upload"><Button><FilePlus2 size={16} />Upload documents</Button></Link>
          <Link href="/search"><Button variant="secondary"><MessageSquareText size={16} />Ask knowledge base</Button></Link>
        </div>
      </section>

      <section className="grid three">
        <Card><div className="metric"><CircleCheckBig className="metricIcon" size={18} /><span className="metricValue">{summary.ready}</span><p className="muted">Ready documents</p></div></Card>
        <Card><div className="metric"><RefreshCw className="metricIcon" size={18} /><span className="metricValue">{summary.processing}</span><p className="muted">Processing now</p></div></Card>
        <Card><div className="metric"><AlertTriangle className="metricIcon" size={18} /><span className="metricValue">{summary.failed}</span><p className="muted">Needs attention</p></div></Card>
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
              <Link href="/upload"><Button variant="secondary"><FilePlus2 size={16} />Add source files</Button></Link>
              <Link href="/search"><Button variant="secondary"><MessageSquareText size={16} />Run semantic search</Button></Link>
              <Link href="/graph"><Button variant="secondary"><Network size={16} />Explore graph</Button></Link>
              <Link href="/settings"><Button variant="secondary"><SlidersHorizontal size={16} />Tune system prompt</Button></Link>
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
