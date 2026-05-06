"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { SearchResponse } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import styles from "./SearchClient.module.css";

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      setResult(await api.search({ query, top_k: 8, include_answer: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <section className="pageHeader">
        <div>
          <p className="eyebrow">Search</p>
          <h1>Ask across your knowledge base</h1>
          <p className="muted">Semantic retrieval feeds grounded context into your configured LLM prompt.</p>
        </div>
      </section>

      <Card>
        <form className={styles.searchBox} onSubmit={submit}>
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask: What are the main risks in my uploaded docs?" />
          <Button loading={loading}>Search + answer</Button>
        </form>
        {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
      </Card>

      {!result ? (
        <EmptyState title="No search yet" message="Ask a question to see answer, citations, and raw chunks." />
      ) : (
        <section className="grid two">
          <Card>
            <h2>Answer</h2>
            <div className={styles.answer}>{result.answer}</div>
            <h2 style={{ marginTop: 24 }}>Citations</h2>
            <div className="stack">
              {result.citations.map((citation) => (
                <Link href={`/document/${citation.document_id}`} key={`${citation.document_id}-${citation.chunk_id}`}>
                  <Card compact interactive>
                    <strong>{citation.document_title}</strong>
                    <p className="muted">Chunk #{citation.chunk_id}</p>
                    <p>{citation.snippet}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </Card>
          <Card>
            <h2>Raw context preview</h2>
            <div className="stack">
              {result.chunks.map((chunk) => (
                <div className={styles.chunk} key={chunk.chunk_id}>
                  <strong>{chunk.document_title}</strong>
                  <p className="muted">Score {chunk.score.toFixed(3)} · Chunk {chunk.chunk_index}</p>
                  <p>{chunk.snippet}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}

