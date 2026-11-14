import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSameOriginRequest } from "@/lib/security/request";
import { generateGeminiImage, generateGeminiText } from "@/lib/ai/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

const requestSchema = z.object({
  topic: z.string().trim().min(5).max(500),
  generateImage: z.boolean().default(true),
});

const campaignSchema = z.object({
  title: z.string().trim().min(3).max(140),
  excerpt: z.string().trim().min(8).max(300),
  body: z.string().trim().min(20).max(6000),
  image_prompt: z.string().trim().min(20).max(1200),
});

const systemInstruction = [
  "Você é o gestor de conteúdo e diretor de criação da Oraner Technologies.",
  "Crie um rascunho institucional em português brasileiro, claro e profissional.",
  "A Oraner é uma iniciativa de tecnologia em fase inicial. Nunca invente preços, estoque, especificações confirmadas, parceiros, datas de lançamento, vendas ou disponibilidade.",
  "Não apresente ideias, protótipos ou pesquisas como produtos finalizados.",
  "Use somente o contexto de produtos fornecido. Se o assunto não puder ser confirmado, produza conteúdo institucional neutro sem alegar fatos novos.",
  "Responda exclusivamente com JSON válido contendo title, excerpt, body e image_prompt. Não use Markdown nem bloco de código.",
  "O image_prompt deve descrever uma imagem publicitária horizontal 16:9 em estilo tecnológico premium, preto com cobre/âmbar, sem textos, sem marca d'água, sem logotipo falso e sem marcas de terceiros."
].join("\n");

function parseCampaign(raw: string) {
  const cleaned = raw.replace(/^```(?:json)?s*/i, "").replace(/s*```s*$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("INVALID_CAMPAIGN_JSON");
  return campaignSchema.parse(JSON.parse(cleaned.slice(start, end + 1)));
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Solicitação inválida." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 8_000) {
    return NextResponse.json({ error: "Solicitação muito grande." }, { status: 413 });
  }

  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Entre no Workplace para usar o Gestor IA." }, { status: 401 });

  const { data: canManage, error: permissionError } = await session.rpc("can_manage_public_content");
  if (permissionError || !canManage) {
    return NextResponse.json({ error: "Somente o owner e gestores autorizados podem usar o Gestor IA." }, { status: 403 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Informe um assunto com pelo menos cinco caracteres." }, { status: 400 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    return NextResponse.json({ error: "A conexão administrativa do Supabase não está configurada no servidor." }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data: products } = await admin.from("products")
    .select("name, category, summary")
    .eq("status", "published")
    .limit(20);
  const publicContext = (products ?? []).map((item) => item.name + " (" + item.category + "): " + item.summary).join("\n")
    || "Nenhum produto está publicado atualmente.";

  let campaign: z.infer<typeof campaignSchema>;
  try {
    const raw = await generateGeminiText(
      "Assunto solicitado: " + parsed.data.topic + "\n\nContexto público disponível:\n" + publicContext,
      systemInstruction,
      { timeoutMs: 18_000, maxOutputTokens: 1200 },
    );
    campaign = parseCampaign(raw);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "GEMINI_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Configure GEMINI_API_KEY nas variáveis do projeto Oraner Oficial na Vercel." }, { status: 503 });
    }
    if (code === "GEMINI_KEY_REJECTED") {
      return NextResponse.json({ error: "A chave Gemini foi recusada. Confira a Secret GEMINI_API_KEY na Vercel." }, { status: 502 });
    }
    return NextResponse.json({ error: "O Gemini não conseguiu gerar um rascunho válido. Reformule o assunto e tente novamente." }, { status: 502 });
  }

  let imagePath: string | null = null;
  let imageWarning: string | null = null;

  if (parsed.data.generateImage) {
    try {
      const imagePrompt = campaign.image_prompt
        + ". Visual direction for Oraner Technologies: premium technology advertising, black and warm copper/amber palette, cinematic studio lighting, clean editorial composition, horizontal 16:9 landscape, no text, no watermarks, no fictitious or third-party logos.";
      const generated = await generateGeminiImage(imagePrompt);
      const extensions: Record<string, string> = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
      };
      const extension = extensions[generated.mimeType];
      const bytes = Buffer.from(generated.data, "base64");
      if (!extension || bytes.length < 1_000 || bytes.length > 10 * 1024 * 1024) {
        throw new Error("INVALID_IMAGE_OUTPUT");
      }

      const filePath = "ai-campaigns/" + crypto.randomUUID() + "." + extension;
      const upload = await admin.storage.from("oraner-ai-drafts").upload(filePath, bytes, {
        contentType: generated.mimeType,
        cacheControl: "31536000",
        upsert: false,
      });
      if (upload.error) throw new Error("IMAGE_UPLOAD_FAILED");
      imagePath = filePath;
    } catch {
      imageWarning = "O texto foi salvo, mas a imagem não pôde ser gerada ou armazenada. Confira o modelo de imagem, a quota Gemini e a migration do Supabase.";
    }
  }

  const { data: draft, error: saveError } = await admin.from("ai_manager_drafts").insert({
    created_by: user.id,
    topic: parsed.data.topic,
    title: campaign.title,
    excerpt: campaign.excerpt,
    body: campaign.body,
    image_prompt: campaign.image_prompt,
    image_path: imagePath,
    status: "pending_approval",
  }).select("id, topic, title, excerpt, body, image_path, status, created_at").single();

  if (saveError || !draft) {
    if (imagePath) await admin.storage.from("oraner-ai-drafts").remove([imagePath]);
    return NextResponse.json({ error: "Não foi possível salvar o rascunho. Execute a migration do Gestor IA no Supabase." }, { status: 503 });
  }

  const { data: signedImage } = imagePath
    ? await admin.storage.from("oraner-ai-drafts").createSignedUrl(imagePath, 3600)
    : { data: null };
  const draftForClient = {
    id: draft.id,
    topic: draft.topic,
    title: draft.title,
    excerpt: draft.excerpt,
    body: draft.body,
    image_url: signedImage?.signedUrl ?? null,
    status: draft.status,
    created_at: draft.created_at,
  };

  await admin.from("audit_events").insert({
    actor_id: user.id,
    action: "ai_campaign.draft_created",
    entity_type: "ai_manager_draft",
    entity_id: draft.id,
  });

  return NextResponse.json({ draft: draftForClient, imageWarning }, { status: 201 });
}
