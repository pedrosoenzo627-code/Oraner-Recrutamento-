import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/security/request";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  category: z.string().trim().min(2).max(60),
  summary: z.string().trim().min(8).max(240),
  description: z.string().trim().max(4000).default(""),
  priceCents: z.number().int().positive().max(100_000_000),
  imageUrl: z.string().trim().url().refine((value) => value.startsWith("https://"), "Use uma URL HTTPS.").or(z.literal("")).optional().default(""),
});

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Solicitação inválida." }, { status: 403 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_000) return NextResponse.json({ error: "Solicitação muito grande." }, { status: 413 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });

  const { data: canManage } = await supabase.rpc("can_manage_public_content");
  if (!canManage) return NextResponse.json({ error: "Seu perfil não pode gerenciar o catálogo." }, { status: 403 });

  const parsed = productSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revise os campos do produto." }, { status: 400 });
  const input = parsed.data;
  const slug = `${slugify(input.name) || "produto"}-${input.id.slice(0, 8)}`;

  const { data: existing, error: lookupError } = await supabase
    .from("products")
    .select("id, name, summary, price_cents, stripe_product_id, stripe_price_id")
    .eq("id", input.id)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Não foi possível validar o produto." }, { status: 500 });
  if (existing && (existing.name !== input.name || existing.summary !== input.summary || existing.price_cents !== input.priceCents)) {
    return NextResponse.json({ error: "Este identificador já está associado a outro produto." }, { status: 409 });
  }
  if (existing?.stripe_product_id && existing.stripe_price_id) {
    return NextResponse.json({ id: existing.id, status: "development", message: "Produto já sincronizado como rascunho." }, { status: 200 });
  }

  const productRow = {
    id: input.id,
    slug,
    name: input.name,
    category: input.category,
    summary: input.summary,
    description: input.description,
    price_cents: input.priceCents,
    currency: "brl",
    status: "development",
    created_by: user.id,
  };

  if (!existing) {
    const rowToInsert = input.imageUrl ? { ...productRow, image_url: input.imageUrl } : productRow;
    const { error: insertError } = await supabase.from("products").insert(rowToInsert);
    if (insertError) {
      const message = input.imageUrl
        ? "A coluna de imagens ainda não existe no Supabase. Execute a migration supabase/migrations/202611130001_oraner_ai_manager.sql e tente novamente."
        : "Não foi possível salvar o rascunho no catálogo.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const stripeProduct = await stripe.products.create(
      { name: input.name, description: input.summary, metadata: { oraner_product_id: input.id } },
      { idempotencyKey: `oraner-product-${input.id}` },
    );
    const { error: productIdError } = await supabase
      .from("products")
      .update({ stripe_product_id: stripeProduct.id })
      .eq("id", input.id);
    if (productIdError) throw new Error("Não foi possível vincular o produto ao catálogo.");

    const stripePrice = await stripe.prices.create(
      { product: stripeProduct.id, currency: "brl", unit_amount: input.priceCents },
      { idempotencyKey: `oraner-price-${input.id}-v1` },
    );
    const { error: priceIdError } = await supabase
      .from("products")
      .update({ stripe_price_id: stripePrice.id })
      .eq("id", input.id);
    if (priceIdError) throw new Error("Não foi possível vincular o preço ao catálogo.");

    await createAdminClient().from("audit_events").insert({ actor_id: user.id, action: "product.created", entity_type: "product", entity_id: input.id });
    return NextResponse.json({ id: input.id, status: "development", message: "Rascunho salvo no Supabase e sincronizado com o Stripe." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "O rascunho foi preservado. Não foi possível concluir a sincronização com o Stripe; tente novamente." }, { status: 502 });
  }
}
