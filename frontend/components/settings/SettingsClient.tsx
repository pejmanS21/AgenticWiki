"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Plus, PlugZap, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { applyThemeMode } from "@/components/layout/ThemeController";
import type { AppSettings, LLMProfile, ThemeMode } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";

const defaultProfile: LLMProfile = {
  id: "default",
  name: "Default",
  llm_provider: "ollama",
  llm_model: "llama3.1",
  llm_base_url: "http://localhost:11434/v1",
  llm_api_key: ""
};

const defaults: AppSettings = {
  llm_provider: "ollama",
  llm_model: "llama3.1",
  llm_base_url: "http://localhost:11434/v1",
  llm_api_key: "",
  llm_profiles: [defaultProfile],
  selected_llm_profile_id: defaultProfile.id,
  ui_theme: "device",
  embedding_provider: "local-hash",
  embedding_model: "hash-384",
  system_prompt: "You are a precise research assistant. Answer with grounded citations from provided context."
};

function createProfileId() {
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function selectActiveProfile(settings: AppSettings): LLMProfile {
  return settings.llm_profiles.find((profile) => profile.id === settings.selected_llm_profile_id) ?? settings.llm_profiles[0] ?? defaultProfile;
}

function normalizeSettings(settings: AppSettings): AppSettings {
  const llm_profiles = settings.llm_profiles.length ? settings.llm_profiles : [defaultProfile];
  const selected = llm_profiles.find((profile) => profile.id === settings.selected_llm_profile_id) ?? llm_profiles[0];
  return {
    ...settings,
    llm_profiles,
    selected_llm_profile_id: selected.id,
    llm_provider: selected.llm_provider,
    llm_model: selected.llm_model,
    llm_base_url: selected.llm_base_url,
    llm_api_key: selected.llm_api_key
  };
}

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
      .then((response) => {
        const normalized = normalizeSettings(response);
        setSettings(normalized);
        localStorage.setItem("agentic-wiki-theme-mode", normalized.ui_theme);
        applyThemeMode(normalized.ui_theme);
        window.dispatchEvent(new Event("theme-mode-changed"));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function updateTheme(mode: ThemeMode) {
    update("ui_theme", mode);
    localStorage.setItem("agentic-wiki-theme-mode", mode);
    applyThemeMode(mode);
    window.dispatchEvent(new Event("theme-mode-changed"));
  }

  function switchProfile(profileId: string) {
    setSettings((current) => {
      const selected = current.llm_profiles.find((profile) => profile.id === profileId) ?? current.llm_profiles[0];
      return {
        ...current,
        selected_llm_profile_id: selected.id,
        llm_provider: selected.llm_provider,
        llm_model: selected.llm_model,
        llm_base_url: selected.llm_base_url,
        llm_api_key: selected.llm_api_key
      };
    });
  }

  function updateProfile<K extends keyof LLMProfile>(key: K, value: LLMProfile[K]) {
    setSettings((current) => {
      const llm_profiles = current.llm_profiles.map((profile) =>
        profile.id === current.selected_llm_profile_id ? { ...profile, [key]: value } : profile
      );
      const selected = llm_profiles.find((profile) => profile.id === current.selected_llm_profile_id) ?? llm_profiles[0];
      return {
        ...current,
        llm_profiles,
        llm_provider: selected.llm_provider,
        llm_model: selected.llm_model,
        llm_base_url: selected.llm_base_url,
        llm_api_key: selected.llm_api_key
      };
    });
  }

  function addProfile() {
    setSettings((current) => {
      const base = selectActiveProfile(current);
      const profile: LLMProfile = {
        ...base,
        id: createProfileId(),
        name: `Profile ${current.llm_profiles.length + 1}`
      };
      return {
        ...current,
        llm_profiles: [...current.llm_profiles, profile],
        selected_llm_profile_id: profile.id,
        llm_provider: profile.llm_provider,
        llm_model: profile.llm_model,
        llm_base_url: profile.llm_base_url,
        llm_api_key: profile.llm_api_key
      };
    });
  }

  function removeSelectedProfile() {
    setSettings((current) => {
      if (current.llm_profiles.length <= 1) return current;
      const llm_profiles = current.llm_profiles.filter((profile) => profile.id !== current.selected_llm_profile_id);
      const selected = llm_profiles[0] ?? defaultProfile;
      return {
        ...current,
        llm_profiles,
        selected_llm_profile_id: selected.id,
        llm_provider: selected.llm_provider,
        llm_model: selected.llm_model,
        llm_base_url: selected.llm_base_url,
        llm_api_key: selected.llm_api_key
      };
    });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const selected = selectActiveProfile(settings);
      const payload: AppSettings = {
        ...settings,
        llm_provider: selected.llm_provider,
        llm_model: selected.llm_model,
        llm_base_url: selected.llm_base_url,
        llm_api_key: selected.llm_api_key
      };
      const next = normalizeSettings(await api.saveSettings(payload));
      setSettings(next);
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
  const selectedProfile = selectActiveProfile(settings);

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
          <h2>LLM profiles</h2>
          <div className="stack">
            <Select label="Saved profile" value={settings.selected_llm_profile_id} onChange={(event) => switchProfile(event.target.value)}>
              {settings.llm_profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.name}</option>
              ))}
            </Select>
            <div className="row">
              <Button type="button" variant="secondary" onClick={addProfile}><Plus size={16} />Add profile</Button>
              <Button type="button" variant="ghost" onClick={removeSelectedProfile} disabled={settings.llm_profiles.length <= 1}><Trash2 size={16} />Remove selected</Button>
            </div>
            <Input label="Profile name" value={selectedProfile.name} onChange={(event) => updateProfile("name", event.target.value)} />
            <Select label="Provider" value={selectedProfile.llm_provider} onChange={(event) => updateProfile("llm_provider", event.target.value as LLMProfile["llm_provider"])}>
              <option value="ollama">Ollama</option>
              <option value="openai">OpenAI</option>
              <option value="openai-compatible">OpenAI-compatible</option>
            </Select>
            <Input label="Model name" value={selectedProfile.llm_model} onChange={(event) => updateProfile("llm_model", event.target.value)} placeholder="llama3.1, gpt-4o-mini, ..." />
            <Input label="Base URL" value={selectedProfile.llm_base_url} onChange={(event) => updateProfile("llm_base_url", event.target.value)} placeholder="http://localhost:11434/v1" />
            <Input label="API key" type="password" value={selectedProfile.llm_api_key} onChange={(event) => updateProfile("llm_api_key", event.target.value)} placeholder="Required for hosted providers" />
          </div>
        </Card>

        <Card>
          <h2>App preferences</h2>
          <div className="stack">
            <Select label="Theme mode" value={settings.ui_theme} onChange={(event) => updateTheme(event.target.value as ThemeMode)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="device">Device</option>
            </Select>
            <Input label="Embedding provider" value={settings.embedding_provider} onChange={(event) => update("embedding_provider", event.target.value)} />
            <Input label="Embedding model" value={settings.embedding_model} onChange={(event) => update("embedding_model", event.target.value)} />
            <p className="muted">Default local hash embeddings keep scaffold runnable. Swap service implementation for sentence-transformers/OpenAI embeddings when needed.</p>
          </div>
        </Card>

        <Card style={{ gridColumn: "1 / -1" }}>
          <h2>System prompt</h2>
          <Textarea value={settings.system_prompt} onChange={(event) => update("system_prompt", event.target.value)} rows={10} />
          <div className="row" style={{ marginTop: 16 }}>
            <Button loading={saving}><Check size={16} />Save settings</Button>
            <Button type="button" variant="secondary" onClick={test} loading={testing}><PlugZap size={16} />Test connection</Button>
          </div>
          {message ? <p style={{ color: "var(--success)" }}>{message}</p> : null}
          {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
        </Card>
      </form>
    </div>
  );
}
