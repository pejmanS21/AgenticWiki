"use client";

import { DragEvent, useState } from "react";
import Link from "next/link";
import { FileUp, UploadCloud } from "lucide-react";
import { api } from "@/lib/api";
import type { DocumentListItem } from "@/lib/types";
import { statusTone } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import styles from "./UploadDropzone.module.css";

export function UploadClient() {
  const [files, setFiles] = useState<File[]>([]);
  const [active, setActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<DocumentListItem[]>([]);
  const [error, setError] = useState("");

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    setFiles((current) => [...current, ...Array.from(fileList)]);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setActive(false);
    addFiles(event.dataTransfer.files);
  }

  async function upload() {
    setUploading(true);
    setError("");
    setProgress(35);
    try {
      const response = await api.upload(files);
      setProgress(100);
      setResults(response.documents);
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="page">
      <section className="pageHeader">
        <div>
          <p className="eyebrow">Upload</p>
          <h1>Ingest documents into your workspace</h1>
          <p className="muted">PDF, markdown, text, and image files are saved locally then processed in background.</p>
        </div>
      </section>

      <section className="grid two">
        <Card>
          <label
            className={`${styles.dropzone} ${active ? styles.active : ""}`}
            onDragOver={(event) => { event.preventDefault(); setActive(true); }}
            onDragLeave={() => setActive(false)}
            onDrop={onDrop}
          >
            <input
              className={styles.fileInput}
              type="file"
              multiple
              accept=".pdf,.md,.markdown,.txt,image/*"
              onChange={(event) => addFiles(event.target.files)}
            />
            <UploadCloud className={styles.dropzoneIcon} size={28} strokeWidth={1.8} />
            <strong>Drop files here or click to choose</strong>
            <span className="muted">OCR for images, PyMuPDF for PDFs, direct parsing for text notes.</span>
          </label>

          <div className="stack" style={{ marginTop: 18 }}>
            {files.length ? (
              <>
                <div className={styles.fileList}>
                  {files.map((file) => (
                    <Card key={`${file.name}-${file.size}`} compact>
                      <strong>{file.name}</strong>
                      <p className="muted">{Math.round(file.size / 1024)} KB · queued</p>
                    </Card>
                  ))}
                </div>
                <div className={styles.progressOuter}>
                  <div className={styles.progressInner} style={{ width: `${progress}%` }} />
                </div>
                <Button onClick={upload} loading={uploading} disabled={!files.length}><FileUp size={16} />Upload and ingest</Button>
              </>
            ) : (
              <EmptyState title="No files queued" message="Choose documents to start ingestion." />
            )}
            {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
          </div>
        </Card>

        <Card>
          <h2>Ingestion results</h2>
          <div className="stack">
            {results.length === 0 ? (
              <EmptyState title="Waiting for upload" message="Results show status and generated metadata after processing." />
            ) : (
              results.map((document) => (
                <Link href={`/document/${document.id}`} key={document.id}>
                  <Card compact interactive>
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <strong>{document.title}</strong>
                      <StatusBadge status={document.status} tone={statusTone(document.status)} />
                    </div>
                    <p className="muted">{document.summary || "Background ingestion started. Refresh document details soon."}</p>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
