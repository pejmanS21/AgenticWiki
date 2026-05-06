"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DataSet } from "vis-data/peer";
import { Network } from "vis-network/peer";
import { api } from "@/lib/api";
import type { GraphNode, GraphResponse } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import styles from "./KnowledgeGraph.module.css";

export function GraphClient() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .graph()
      .then(setGraph)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!graph || !containerRef.current) return;
    const nodes = new DataSet(
      graph.nodes.map((node) => ({
        id: node.document_id,
        label: node.label,
        group: node.group,
        shape: node.group === "derived_note" ? "box" : "dot",
        value: 12
      }))
    );
    const edges = new DataSet(
      graph.edges.map((edge) => ({
        id: edge.id,
        from: edge.source_document_id,
        to: edge.target_document_id,
        label: edge.weight.toFixed(2),
        width: Math.max(1, edge.weight * 6),
        color: "#8ea0c8"
      }))
    );
    const network = new Network(containerRef.current, { nodes, edges }, {
      nodes: { color: { background: "#dfe8ff", border: "#3158d4" }, font: { face: "Inter" } },
      edges: { smooth: true },
      physics: { stabilization: true, barnesHut: { gravitationalConstant: -3200 } },
      interaction: { hover: true }
    });
    network.on("click", (params) => {
      const nodeId = params.nodes[0];
      setSelected(graph.nodes.find((node) => node.document_id === nodeId) ?? null);
    });
    return () => network.destroy();
  }, [graph]);

  if (loading) return <Spinner />;
  if (error) return <p style={{ color: "var(--danger)" }}>{error}</p>;

  return (
    <div className="page">
      <section className="pageHeader">
        <div>
          <p className="eyebrow">Knowledge graph</p>
          <h1>Document relationship map</h1>
          <p className="muted">Similarity edges connect documents that share semantic context.</p>
        </div>
      </section>

      {!graph || graph.nodes.length === 0 ? (
        <EmptyState title="Graph empty" message="Upload and ingest multiple documents to build relationships." />
      ) : (
        <section className="grid two">
          <Card>
            <div className={styles.graphWrap}>
              <div className={styles.graph} ref={containerRef} />
            </div>
          </Card>
          <div className="stack">
            <Card>
              <h2>Node inspector</h2>
              {selected ? (
                <div className="stack">
                  <strong>{selected.label}</strong>
                  <p className="muted">Document #{selected.document_id} · {selected.group}</p>
                  <Link href={`/document/${selected.document_id}`}><Button>Open document</Button></Link>
                </div>
              ) : (
                <p className="muted">Click a node to inspect document metadata.</p>
              )}
            </Card>
            <Card>
              <h2>Edges</h2>
              <div className={`${styles.edgeList} stack`}>
                {graph.edges.map((edge) => (
                  <Card compact key={edge.id}>
                    <strong>{edge.source_document_id} ↔ {edge.target_document_id}</strong>
                    <p className="muted">{edge.label} · {edge.weight.toFixed(3)}</p>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}

