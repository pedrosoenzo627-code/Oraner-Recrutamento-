import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSameOriginRequest } from "@/lib/security/request";

type RouteContext = { params: Promise<{ id: string }> };
const schema = z.object({ action: z.enum(["publish", "reject"]) });

function makeSlug(title: string, id: string) {
  const base = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42);
  return (base || "comunicado") + "-" + id.replace(/-/g, "").slice(0, 8);
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Solicitação inválida." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 2_000) {
    return NextResponse.json({ error: "Solicitação muito grande." }, { status: 413 });
  }

  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });

  const { data: canManage, error: permissionError } = await session.rpc("can_manage_public_content");
  if (permissionError || !canManage) {
    return NextResponse.json({ error: "Seu perfil não pode aprovar comunicados." }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  const { id } = await context.params;

  const admin = createAdminClient();
  const { data: draft, error: lookupError } = await admin.from("ai_manager_drafts")
    .select("id, title, excerpt, body, image_url, status")
    .eq("id", id)
    .maybeSingle();

  if (lookupError || !draft) return NextResponse.json({ error: "Rascunho não encontrado." }, { status: 404 });
  if (draft.status !== "pending_approval") {
    return NextResponse.json({ error: "Este rascunho já foi revisado." }, { status: 409 });
  }

  if (parsed.data.action === "reject") {
    const { error } = await admin.from("ai_manager_drafts")
      .update({ status: "rejected", approved_by: user.id, approved_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending_approval");
    if (error) return NextResponse.json({ error: "Não foi possível arquivar o rascunho." }, { status: 500 });
    await admin.from("audit_events").insert({ actor_id: user.id, action: "ai_campaign.rejected", entity_type: "ai_manager_draft", entity_id: id });
    return NextResponse.json({ id, status: "rejected" });
  }

  const slug = makeSlug(draft.title, draft.id);
  const { data: announcement, error: insertError } = await admin.from("announcements").insert({
    title: draft.title,
    slug,
    excerpt: draft.excerpt,
    body: draft.body,
    image_url: draft.image_url,
    status: "published",
    publish_at: new Date().toISOString(),
    created_by: user.id,
  }).select("id").single();

  if (insertError || !announcement) {
    return NextResponse.json({ error: "Não foi possível publicar. Confira se a migration de imagens e o catálogo de comunicados estão atualizados." }, { status: 500 });
  }

  const { error: updateError } = await admin.from("ai_manager_drafts")
    .update({
      status: "published",
      announcement_id: announcement.id,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending_approval");

  if (updateError) {
    await admin.from("announcements").delete().eq("id", announcement.id);
    return NextResponse.json({ error: "A publicação foi revertida porque o estado do rascunho mudou. Atualize a página." }, { status: 409 });
  }

  await admin.from("audit_events").insert({ actor_id: user.id, action: "ai_campaign.published", entity_type: "announcement", entity_id: announcement.id });
  return NextResponse.json({ id, announcementId: announcement.id, status: "published" });
}
