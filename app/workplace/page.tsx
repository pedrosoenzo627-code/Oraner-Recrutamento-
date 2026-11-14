import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function WorkplacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/workplace/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, access_role, account_status, department_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.account_status !== "active") {
    return (
      <main className="workplace-shell">
        <header className="workplace-topbar"><Brand /><form action={signOut} className="workplace-signout-form"><button className="text-link sign-out-button" type="submit">Sair da sessão</button></form></header>
        <section className="workplace-main">
          <div className="workspace-panel">
            <span className="eyebrow">Acesso pendente</span>
            <h1>Esta conta ainda não está ativa.</h1>
            <p className="section-intro">O conteúdo interno só fica disponível depois de um convite autorizado pelo owner. Nenhum dado de equipe foi carregado.</p>
          </div>
        </section>
      </main>
    );
  }

  const [projects, products, announcements, department] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("announcements").select("id", { count: "exact", head: true }),
    profile.department_id
      ? supabase.from("departments").select("name").eq("id", profile.department_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const canManageContent = profile.access_role === "owner" || profile.access_role === "manager";

  return (
    <main className="workplace-shell">
      <header className="workplace-topbar">
        <Brand />
        <form action={signOut} className="workplace-signout-form"><button className="text-link sign-out-button" type="submit">Encerrar sessão</button></form>
      </header>
      <div className="workplace-main">
        <div className="workspace-welcome">
          <div>
            <span className="eyebrow">Área privada · {profile.access_role === "owner" ? "Owner" : profile.access_role === "manager" ? "Gestor" : "Equipe"}</span>
            <h1>Olá{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.</h1>
            <p>{department.data?.name ?? "Departamento ainda não atribuído"} · Seu perfil recebe somente as permissões autorizadas.</p>
          </div>
          <Link className="button-primary" href="/">Ver site público</Link>
        </div>
        <nav className="workspace-nav" aria-label="Navegação do Workplace">
          <Link href="/workplace">Visão geral</Link>
          {canManageContent && <Link href="/workplace/catalog">Catálogo de produtos</Link>}
          {canManageContent && <Link href="/workplace/announcements">Anúncios</Link>}
          {canManageContent && <Link href="/workplace/gestor-ia">Gestor IA</Link>}
          {profile.access_role === "owner" && <Link href="/workplace/team">Equipe e cargos</Link>}
        </nav>
        <section className="workspace-grid" aria-label="Resumo do conteúdo interno">
          <div className="metric-card"><span>Projetos registrados</span><strong>{projects.count ?? 0}</strong></div>
          <div className="metric-card"><span>Produtos no catálogo interno</span><strong>{products.count ?? 0}</strong></div>
          <div className="metric-card"><span>Anúncios e rascunhos</span><strong>{announcements.count ?? 0}</strong></div>
        </section>
        <section className="workspace-panel">
          <span className="eyebrow">Ambiente de desenvolvimento</span>
          <h2>O que é publicado depende de aprovação.</h2>
          <p className="section-intro">Produtos começam como rascunhos e são sincronizados com o Stripe. Somente gestores autorizados podem publicar catálogo e anúncios; a visibilidade pública também depende das políticas do banco.</p>
          {!canManageContent && <p className="notice">Seu perfil tem acesso de equipe. O catálogo e as ações de publicação ficam restritos aos gestores e ao owner.</p>}
          {profile.access_role === "owner" && <p className="notice">A Oraner continua em fase inicial. Antes de contratar, pagar salários ou receber pagamentos de clientes, configure os processos legais, fiscais, de suporte e os webhooks do Stripe.</p>}
        </section>
      </div>
    </main>
  );
}
