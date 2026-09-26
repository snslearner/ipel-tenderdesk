import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { AI_SYSTEM_PROMPT, AiChecklistSchema } from "@/lib/ai-checklist";

// A 40-line tender can take a while to read.
export const maxDuration = 60;

const MODEL = "claude-sonnet-5"; // CLAUDE.md fixes the model; ID confirmed against Anthropic's model list.
const MAX_PDF_BYTES = 20 * 1024 * 1024;

const BodySchema = z.object({
  tenderId: z.uuid(),
  storagePath: z.string().min(1),
});

// Same shape without value constraints, for the API's structured-output schema.
// The strict AiChecklistSchema is applied to the parsed result afterwards.
const WireSchema = z.object({
  items: z.array(z.object({ part_number: z.string(), description: z.string(), qty: z.number(), uom: z.string() })),
  required_documents: z.array(z.string()),
  submission_checklist: z.array(z.string()),
  uncertainties: z.array(z.string()),
});

const fail = (status: number, error: string) => Response.json({ error }, { status });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, "Sign in to use the AI checklist.");

  const body = BodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return fail(400, "Send a tender id and the uploaded PDF's storage path.");
  const { tenderId, storagePath } = body.data;
  if (!storagePath.startsWith(`tenders/${tenderId}/`) || !storagePath.toLowerCase().endsWith(".pdf")) {
    return fail(400, "That file does not belong to this tender.");
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return fail(503, "AI checklist is not configured: ANTHROPIC_API_KEY is not set on the server. The rest of the app works as usual.");
  }

  // Downloaded with the caller's session, so Storage policies apply.
  const file = await supabase.storage.from("documents").download(storagePath);
  if (file.error || !file.data) return fail(404, `Could not read the uploaded PDF: ${file.error?.message ?? "not found"}`);
  if (file.data.size > MAX_PDF_BYTES) return fail(413, "The PDF is larger than 20 MB.");
  const pdfBase64 = Buffer.from(await file.data.arrayBuffer()).toString("base64");

  const client = new Anthropic();
  let parsed: unknown;
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      system: AI_SYSTEM_PROMPT,
      output_config: { format: zodOutputFormat(WireSchema) },
      messages: [
        {
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
            { type: "text", text: "Extract the tender checklist from this document." },
          ],
        },
      ],
    });
    if (response.stop_reason === "refusal") return fail(502, "The AI declined to read this document.");
    if (response.stop_reason === "max_tokens") return fail(502, "The document is too long to read in one pass.");
    parsed = response.parsed_output;
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return fail(503, "The Anthropic API key was rejected.");
    if (error instanceof Anthropic.RateLimitError) return fail(429, "The AI service is busy. Try again in a minute.");
    if (error instanceof Anthropic.APIError) return fail(502, `AI request failed (${error.status}): ${error.message}`);
    if (error instanceof Error) return fail(502, `AI request failed: ${error.message}`);
    return fail(502, "AI request failed.");
  }

  // Validate before anything reaches the review screen; on failure nothing is saved.
  const result = AiChecklistSchema.safeParse(parsed);
  if (!result.success) {
    return fail(502, `The AI response did not match the expected format: ${result.error.issues[0]?.message ?? "invalid"}`);
  }
  return Response.json(result.data);
}

// Lets the AI tab say up front when the feature is not configured (the key itself never leaves the server).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, "Sign in to use the AI checklist.");
  return Response.json({ configured: !!process.env.ANTHROPIC_API_KEY });
}
