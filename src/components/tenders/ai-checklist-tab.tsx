"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, FileUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatQty } from "@/lib/format";
import { buildAcceptedRows, type AiChecklist, type Selection } from "@/lib/ai-checklist";

type Props = { tenderId: string; userId: string; nextLineNo: number; canAddItems: boolean };

const EMPTY: Selection = { items: [], required_documents: [], submission_checklist: [] };

export function AiChecklistTab({ tenderId, userId, nextLineNo, canAddItems }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<"idle" | "uploading" | "reading" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiChecklist | null>(null);
  const [sel, setSel] = useState<Selection>(EMPTY);
  const [, startTransition] = useTransition();
  const busy = phase !== "idle";
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/ai/tender-checklist")
      .then((r) => (r.ok ? r.json() : { configured: false }))
      .then((j: { configured: boolean }) => setConfigured(j.configured))
      .catch(() => setConfigured(false));
  }, []);

  async function analyse() {
    if (!file) return;
    setError(null);
    setResult(null);
    setSel(EMPTY);
    const supabase = createClient();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `tenders/${tenderId}/${Date.now()}-${safe}`;

    setPhase("uploading");
    const up = await supabase.storage.from("documents").upload(path, file, { contentType: "application/pdf" });
    if (up.error) {
      setPhase("idle");
      setError(`Upload failed: ${up.error.message}`);
      return;
    }
    // Record the tender document; the checklist itself is saved only after review.
    const doc = await supabase.from("documents").insert({
      entity_type: "tender",
      entity_id: tenderId,
      doc_type: "tender_doc",
      storage_path: path,
      file_name: file.name,
      uploaded_by: userId,
    });
    if (doc.error) toast.error(`PDF uploaded but not listed: ${doc.error.message}`);

    setPhase("reading");
    try {
      const res = await fetch("/api/ai/tender-checklist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenderId, storagePath: path }),
      });
      const json = await res.json().catch(() => ({ error: `Unexpected response (${res.status})` }));
      if (!res.ok) setError(json.error ?? `AI request failed (${res.status})`);
      else setResult(json as AiChecklist);
    } catch {
      setError("Could not reach the AI service. Check your connection and try again.");
    } finally {
      setPhase("idle");
    }
  }

  function toggle(section: keyof Selection, i: number) {
    setSel((s) => ({ ...s, [section]: s[section].includes(i) ? s[section].filter((x) => x !== i) : [...s[section], i].sort((a, b) => a - b) }));
  }
  function setAll(section: keyof Selection, on: boolean, n: number) {
    setSel((s) => ({ ...s, [section]: on ? Array.from({ length: n }, (_, i) => i) : [] }));
  }

  async function save() {
    if (!result) return;
    setPhase("saving");
    const supabase = createClient();
    const parts = [...new Set(sel.items.map((i) => result.items[i].part_number.trim()).filter(Boolean))];
    const prod = parts.length ? await supabase.from("products").select("id, part_number").in("part_number", parts) : { data: [], error: null };
    if (prod.error) {
      setPhase("idle");
      toast.error(prod.error.message);
      return;
    }
    const rows = buildAcceptedRows(tenderId, result, sel, {
      startLineNo: nextLineNo,
      productsByPart: new Map(prod.data!.map((p) => [p.part_number, p.id])),
    });
    if (rows.items.length) {
      const r = await supabase.from("tender_items").insert(rows.items);
      if (r.error) {
        setPhase("idle");
        toast.error(r.error.message);
        return;
      }
    }
    if (rows.checklist.length) {
      const r = await supabase.from("tender_checklist_items").insert(rows.checklist);
      if (r.error) {
        setPhase("idle");
        toast.error(`${rows.items.length ? "Lines saved, but checklist failed: " : ""}${r.error.message}`);
        startTransition(() => router.refresh());
        return;
      }
    }
    toast.success(`Saved ${rows.items.length} line(s) and ${rows.checklist.length} checklist item(s)`);
    setResult(null);
    setSel(EMPTY);
    setFile(null);
    setPhase("idle");
    startTransition(() => router.refresh());
  }

  const selectedCount = sel.items.length + sel.required_documents.length + sel.submission_checklist.length;

  return (
    <div className="space-y-4" data-testid="ai-checklist">
      <section className="space-y-2 rounded-xl border bg-card p-3 text-sm">
        <p className="font-medium">Try it with a fictitious tender</p>
        <div className="flex flex-wrap gap-2">
          <a href="/demo/demo-tender-5-lines.pdf" download className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs hover:bg-accent">
            <Download className="size-3.5" /> Demo tender, 5 lines
          </a>
          <a href="/demo/demo-tender-40-lines.pdf" download className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs hover:bg-accent">
            <Download className="size-3.5" /> Demo tender, 40 lines
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          Download one, then upload it below. The AI suggests lines and checklist items; nothing is saved until you tick
          rows and press Save.
        </p>
      </section>

      {configured === false && (
        <p role="status" data-testid="ai-not-configured" className="rounded-lg border border-amber-500/50 bg-amber-50 px-3 py-2 text-sm dark:bg-amber-950/30">
          AI checklist is not configured on this server (ANTHROPIC_API_KEY is not set). Everything else in TenderDesk works
          as usual; add the key in the deployment settings to enable it.
        </p>
      )}

      <section className="space-y-3 rounded-xl border p-3">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Tender PDF</span>
          <input
            type="file"
            accept="application/pdf"
            aria-label="Tender PDF"
            className="block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={busy || configured === false}
          />
        </label>
        <Button onClick={analyse} disabled={!file || busy || configured !== true}>
          {phase === "uploading" ? <FileUp /> : <Sparkles />}
          {phase === "uploading" ? "Uploading…" : phase === "reading" ? "Reading the PDF…" : "Upload and analyse"}
        </Button>
        {error && (
          <p role="alert" data-testid="ai-error" className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
            {error}
          </p>
        )}
      </section>

      {result && (
        <section className="space-y-4" data-testid="ai-review">
          {result.uncertainties.length > 0 && (
            <div className="rounded-xl border border-amber-500/50 bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
              <p className="font-medium">Check these before accepting</p>
              <ul className="mt-1 list-disc pl-5">
                {result.uncertainties.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </div>
          )}

          <Group
            title={`Line items (${result.items.length})`}
            note={canAddItems ? undefined : "Lines can be added only before owner review; these are shown for reference."}
            disabled={!canAddItems}
            count={result.items.length}
            selected={sel.items}
            onAll={(on) => setAll("items", on, result.items.length)}
          >
            {result.items.map((it, i) => (
              <Row key={i} checked={sel.items.includes(i)} disabled={!canAddItems} onChange={() => toggle("items", i)}>
                <span className="font-medium">{it.part_number || <span className="text-amber-700">No part number</span>}</span>{" "}
                {it.description} · {formatQty(it.qty)} {it.uom}
              </Row>
            ))}
          </Group>
          <Group
            title={`Required documents (${result.required_documents.length})`}
            count={result.required_documents.length}
            selected={sel.required_documents}
            onAll={(on) => setAll("required_documents", on, result.required_documents.length)}
          >
            {result.required_documents.map((d, i) => (
              <Row key={i} checked={sel.required_documents.includes(i)} onChange={() => toggle("required_documents", i)}>
                {d}
              </Row>
            ))}
          </Group>
          <Group
            title={`Submission checks (${result.submission_checklist.length})`}
            count={result.submission_checklist.length}
            selected={sel.submission_checklist}
            onAll={(on) => setAll("submission_checklist", on, result.submission_checklist.length)}
          >
            {result.submission_checklist.map((c, i) => (
              <Row key={i} checked={sel.submission_checklist.includes(i)} onChange={() => toggle("submission_checklist", i)}>
                {c}
              </Row>
            ))}
          </Group>

          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={selectedCount === 0 || busy}>
              {phase === "saving" ? "Saving…" : `Save ${selectedCount} selected`}
            </Button>
            <Button variant="outline" onClick={() => setResult(null)} disabled={busy}>
              Discard
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function Group(props: {
  title: string;
  note?: string;
  disabled?: boolean;
  count: number;
  selected: number[];
  onAll: (on: boolean) => void;
  children: React.ReactNode;
}) {
  if (props.count === 0) return null;
  const all = props.selected.length === props.count;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{props.title}</h3>
        {!props.disabled && (
          <button type="button" className="text-xs underline underline-offset-4" onClick={() => props.onAll(!all)}>
            {all ? "Clear all" : "Select all"}
          </button>
        )}
      </div>
      {props.note && <p className="text-xs text-muted-foreground">{props.note}</p>}
      <ul className="divide-y rounded-xl border bg-card">{props.children}</ul>
    </div>
  );
}

function Row({ checked, disabled, onChange, children }: { checked: boolean; disabled?: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <li>
      <label className="flex cursor-pointer items-start gap-3 p-3 text-sm">
        <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-primary" checked={checked} disabled={disabled} onChange={onChange} />
        <span className="min-w-0 flex-1 break-words">{children}</span>
      </label>
    </li>
  );
}
