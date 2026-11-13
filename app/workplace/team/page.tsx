import { redirect } from "next/navigation";
import { Brand } from "@/components/site-header";
import { TeamAdmin } from "@/components/team-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/workplace/login");
  const { data: profile } = await supabase.from("profiles").select("access_role, account_status").eq("id", user.id).maybeSingle();
  if (profile?.access_role !== "owner" || profile.account_status !== "active") redirect("/workplace");

  const admin = createAdminClient();
  const [{ data: profiles }, { data: authUsers }, { data: departments }] = await Promise.all([
    admin.from("profiles").select("id, full_name, department_id, access_role, account_status").order("created_at", { ascending: true }).limit(100),
    admin.auth.admin.listUsers({ page: 1, perPage: 100 }),
    admin.from("departments").select("id, name").eq("active", true).order("name"),
  ]);
  const emailById = new Map((authUsers?.users ?? []).map((authUser) => [authUser.id, authUser.email ?? ""]));
  const team = (profiles ?? []).map((item) => ({
    id: item.id,
    fullName: item.full_name,
    email: emailById.get(item.id) ?? "",
    departmentId: item.department_id,
    accessRole: item.access_role,
    accountStatus: item.account_status,
  }));

  return <main className="workplace-shell"><header className="workplace-topbar"><Brand /><a className="text-link" href="/workplace">Voltar à visão geral</a></header><div className="workplace-main"><nav className="workspace-nav" aria-label="Navegação do Workplace"><a href="/workplace">Visão geral</a><a href="/workplace/catalog">Catálogo</a><a href="/workplace/announcements">Anúncios</a><a href="/workplace/team">Equipe e cargos</a></nav><TeamAdmin initialDepartments={departments ?? []} initialTeam={team} /></div></main>;
}
