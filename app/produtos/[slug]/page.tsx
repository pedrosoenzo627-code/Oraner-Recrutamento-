import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const databaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!databaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) return { title: "Produto" };

  const { data } = await createAdminClient()
    .from("products")
    .select("name, summary")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return data
    ? { title: data.name, description: data.summary }
    : { title: "Produto não encontrado" };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const databaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!databaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) notFound();

  const { data: product } = await createAdminClient()
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!product) notFound();

  const imageUrl = typeof product.image_url === "string" && product.image_url.startsWith("https://")
    ? product.image_url
    : null;
  const price = typeof product.price_cents === "number"
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: String(product.currency || "BRL").toUpperCase(),
      }).format(product.price_cents / 100)
    : null;

  return (
    <main>
      <SiteHeader />
      <section className="detail-shell">
        <Link className="detail-back" href="/#loja">← Voltar à loja</Link>
        <article className="detail-card">
          {imageUrl && <img className="detail-image" src={imageUrl} alt={product.name} />}
          <div className="detail-content">
            <span className="status-chip">{product.category}</span>
            <h1>{product.name}</h1>
            <p>{product.summary}</p>
            {price && <div className="detail-price">{price}</div>}
            {typeof product.description === "string" && product.description.trim() && <p>{product.description}</p>}
            <p className="form-help">A exibição no catálogo não confirma estoque, venda ou compatibilidade. Consulte os comunicados oficiais para informações atualizadas.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
