import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/security/request";
import Stripe from "stripe";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const statusSchema = z.object({ status: z.enum(["development", "published", "archived"]) });

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Solicitação inválida." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 2_000) return NextResponse.json({ error: "Solicitação muito grande." }, { status: 413 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  const { data: canManage } = await supabase.rpc("can_manage_public_content");
  if (!canManage) return NextResponse.json({ error: "Seu perfil não pode publicar produtos." }, { status: 403 });

  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Estado de publicação inválido." }, { status: 400 });
  const { id } = await context.params;
  const { data: product, error: lookupError } = await supabase
    .from("products")
    .select("id, stripe_product_id")
    .eq("id", id)
    .maybeSingle();
  if (lookupError || !product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  const { error } = await supabase.from("products").update({ status: parsed.data.status }).eq("id", id);
  if (error) return NextResponse.json({ error: "Não foi possível atualizar o produto." }, { status: 400 });

  if (product.stripe_product_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      await stripe.products.update(product.stripe_product_id, { active: parsed.data.status !== "archived" });
    } catch {
      return NextResponse.json({ error: "O catálogo foi atualizado, mas a sincronização do estado com o Stripe falhou." }, { status: 502 });
    }
  }

  await supabase.from("audit_events").insert({ actor_id: user.id, action: `product.${parsed.data.status}`, entity_type: "product", entity_id: id });
  return NextResponse.json({ id, status: parsed.data.status });
}
