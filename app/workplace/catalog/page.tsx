import { redirect } from "next/navigation";
import { Brand } from "@/components/site-header";
import { ProductAdmin } from "@/components/product-admin";
import { createClient } from "@/lib/supabase/server";

export default async function CatalogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/workplace/login");
  const { data: profile } = await supabase.from("profiles").select("access_role, account_status").eq("id", user.id).maybeSingle();
  if (!profile || profile.account_status !== "active") redirect("/workplace");
  const { data: canManage } = await supabase.rpc("can_manage_public_content");
  if (!canManage) redirect("/workplace");

  const withImages = await supabase
    .from("products")
    .select("id, name, category, summary, status, price_cents, currency, stripe_product_id, image_url")
    .order("created_at", { ascending: false });

  const data = withImages.error
    ? (await supabase
        .from("products")
        .select("id, name, category, summary, status, price_cents, currency, stripe_product_id")
        .order("created_at", { ascending: false })).data
    : withImages.data;

  return (
    <main className="workplace-shell">
      <header className="workplace-topbar"><Brand /><a className="text-link" href="/workplace">Voltar à visão geral</a></header>
      <div className="workplace-main">
        <nav className="workspace-nav" aria-label="Navegação do Workplace"><a href="/workplace">Visão geral</a><a href="/workplace/catalog">Catálogo</a><a href="/workplace/announcements">Anúncios</a></nav>
        <ProductAdmin products={data ?? []} />
      </div>
    </main>
  );
}
