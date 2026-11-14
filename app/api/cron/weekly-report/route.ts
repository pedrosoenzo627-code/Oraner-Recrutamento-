import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateGeminiText } from "@/lib/ai/gemini";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET não está configurado no ambiente de produção." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    return NextResponse.json({ error: "Banco de dados não configurado." }, { status: 503 });
  }

  const admin = createAdminClient();
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const start = periodStart.toISOString();
  const end = periodEnd.toISOString();

  const [
    productsPublished,
    productsCreated,
    announcementsPublished,
    announcementsCreated,
    pendingDrafts,
    campaignsCreated,
  ] = await Promise.all([
    admin.from("products").select("id", { count: "exact", head: true }).eq("status", "published"),
    admin.from("products").select("id", { count: "exact", head: true }).gte("created_at", start).lt("created_at", end),
    admin.from("announcements").select("id", { count: "exact", head: true }).eq("status", "published"),
    admin.from("announcements").select("id", { count: "exact", head: true }).gte("created_at", start).lt("created_at", end),
    admin.from("ai_manager_drafts").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
    admin.from("ai_manager_drafts").select("id", { count: "exact", head: true }).gte("created_at", start).lt("created_at", end),
  ]);

  const queries = [productsPublished, productsCreated, announcementsPublished, announcementsCreated, pendingDrafts, campaignsCreated];
  if (queries.some((query) => query.error)) {
    return NextResponse.json({ error: "Não foi possível consultar os dados para o relatório. Confira as migrations do Supabase." }, { status: 503 });
  }

  const metrics = {
    productsPublished: productsPublished.count ?? 0,
    productsCreatedLast7Days: productsCreated.count ?? 0,
    announcementsPublished: announcementsPublished.count ?? 0,
    announcementsCreatedLast7Days: announcementsCreated.count ?? 0,
    campaignsAwaitingApproval: pendingDrafts.count ?? 0,
    aiCampaignsCreatedLast7Days: campaignsCreated.count ?? 0,
    periodStart: start,
    periodEnd: end,
  };

  const reportInstruction = [
    "Você é o analista semanal da Oraner Technologies.",
    "Escreva um relatório curto, objetivo e em português brasileiro.",
    "Use exclusivamente os números fornecidos. Não invente visitas, cliques, vendas, receita, conversão, usuários ou resultados que não estejam nos dados.",
    "Separe fatos medidos de recomendações. Inclua um resumo, números do período, itens que precisam de revisão e até três sugestões práticas para o site.",
    "A Oraner está em fase inicial; não prometa lançamentos ou resultados."
  ].join("\n");

  let summary = [
    "Relatório dos últimos sete dias.",
    "Produtos publicados: " + metrics.productsPublished + " (novos: " + metrics.productsCreatedLast7Days + ").",
    "Comunicados publicados: " + metrics.announcementsPublished + " (novos: " + metrics.announcementsCreatedLast7Days + ").",
    "Campanhas de IA aguardando aprovação: " + metrics.campaignsAwaitingApproval + ".",
    "Campanhas de IA criadas no período: " + metrics.aiCampaignsCreatedLast7Days + ".",
    "Sugestão: revisar rascunhos pendentes e manter os comunicados atualizados.",
    "Nota: este site ainda não mede visitas, cliques ou vendas nesta rotina."
  ].join("\n");

  try {
    summary = await generateGeminiText(
      "Dados verificados do período:\n" + JSON.stringify(metrics, null, 2),
      reportInstruction,
      { timeoutMs: 35_000, maxOutputTokens: 1000 },
    );
  } catch {
    // A factual database-backed report is still saved when Gemini is temporarily unavailable.
  }

  const weekKey = periodStart.toISOString().slice(0, 10);
  const { data: report, error: saveError } = await admin.from("ai_weekly_reports")
    .upsert({
      week_key: weekKey,
      period_start: start,
      period_end: end,
      summary,
      metrics,
    }, { onConflict: "week_key" })
    .select("id, week_key, created_at")
    .single();

  if (saveError || !report) {
    return NextResponse.json({ error: "Não foi possível salvar o relatório semanal. Confira a migration do Gestor IA." }, { status: 503 });
  }

  return NextResponse.json({ ok: true, report, metrics });
}
