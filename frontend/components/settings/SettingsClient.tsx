"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AppSettings } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";

const defaults: AppSettings = {
  llm_provider: "ollama",
  llm_model: "llama3.1",
  llm_base_url: "http://localhost:11434/v1",
  llm_api_key: "",
  embedding_provider: "local-hash",
  embedding_model: "hash-384",
  system_prompt: "You are a precise research assistant. Answer with grounded citations from provided context."
};

export function SettingsClient() {
  const [settings, setSettings] = useState<AppSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .settings()
      .then(setSettings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      setSettings(await api.saveSettings(settings));
      setMessage("Settings saved. New system prompt applies to every LLM call.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    setError("");
    setMessage("");
    try {
      const response = await api.testConnection();
      setMessage(`${response.ok ? "Connected" : "Failed"}: ${response.message}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed");
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="page">
      <section className="pageHeader">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Configure model behavior</h1>
          <p className="muted">Provider, model, API base URL, embedding config, and persisted system prompt.</p>
        </div>
      </section>

      <form onSubmit={save} className="grid two">
        <Card>
          <h2>LLM provider</h2>
          <div className="stack">
            <Select label="Provider" value={settings.llm_provider} onChange={(event) => update("llm_provider", event.target.value as AppSettings["llm_provider"])}>
              <option value="ollama">Ollama</option>
              <option value="openai">OpenAI</option>
              <option value="openai-compatible">OpenAI-compatible</option>
            </Select>
            <Input label="Model name" value={settings.llm_model} onChange={(event) => update("llm_model", event.target.value)} placeholder="llama3.1, gpt-4o-mini, ..." />
            <Input label="Base URL" value={settings.llm_base_url} onChange={(event) => update("llm_base_url", event.target.value)} placeholder="http://localhost:11434/v1" />
            <Input label="API key" type="password" value={settings.llm_api_key} onChange={(event) => update("llm_api_key", event.target.value)} placeholder="Required for hosted providers" />
          </div>
        </Card>

        <Card>
          <h2>Embedding configuration</h2>
          <div className="stack">
            <Input label="Embedding provider" value={settings.embedding_provider} onChange={(event) => update("embedding_provider", event.target.value)} />
            <Input label="Embedding model" value={settings.embedding_model} onChange={(event) => update("embedding_model", event.target.value)} />
            <p className="muted">Default local hash embeddings keep scaffold runnable. Swap service implementation for sentence-transformers/OpenAI embeddings when needed.</p>
          </div>
        </Card>

        <Card style={{ gridColumn: "1 / -1" }}>
          <h2>System prompt</h2>
          <Textarea value={settings.system_prompt} onChange={(event) => update("system_prompt", event.target.value)} rows={10} />
          <div className="row" style={{ marginTop: 16 }}>
            <Button loading={saving}>Save settings</Button>
            <Button type="button" variant="secondary" onClick={test} loading={testing}>Test connection</Button>
          </div>
          {message ? <p style={{ color: "var(--success)" }}>{message}</p> : null}
          {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
        </Card>
      </form>
    </div>
  );
}

