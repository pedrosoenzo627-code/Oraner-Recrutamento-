import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/security/request";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const announcementSchema = z.object({
  title: z.string().trim().min(3).max(140),
  excerpt: z.string().trim().min(8).max(300),
  body: z.string().trim().min(10).max(12000),
  publish: z.boolean().default(false),
});

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Solicitação inválida." }, { status: 403 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 24_000) return NextResponse.json({ error: "Solicitação muito grande." }, { status: 413 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  const { data: canManage } = await supabase.rpc("can_manage_public_content");
  if (!canManage) return NextResponse.json({ error: "Seu perfil não pode gerenciar anúncios." }, { status: 403 });
  const parsed = announcementSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revise os campos do anúncio." }, { status: 400 });

  const { title, excerpt, body, publish } = parsed.data;
  const slug = `${slugify(title) || "anuncio"}-${crypto.randomUUID().slice(0, 8)}`;
  const { data, error } = await supabase.from("announcements").insert({
    slug,
    title,
    excerpt,
    body,
    status: publish ? "published" : "draft",
    publish_at: publish ? new Date().toISOString() : null,
    created_by: user.id,
  }).select("id, status").single();

  if (error || !data) return NextResponse.json({ error: "Não foi possível salvar o anúncio." }, { status: 400 });
  await createAdminClient().from("audit_events").insert({ actor_id: user.id, action: publish ? "announcement.published" : "announcement.created", entity_type: "announcement", entity_id: data.id });
  return NextResponse.json({ id: data.id, status: data.status }, { status: 201 });
}
