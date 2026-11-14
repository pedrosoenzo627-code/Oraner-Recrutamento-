import { redirect } from "next/navigation";
import { Brand } from "@/components/site-header";
import { AiManager } from "@/components/ai-manager";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isGeminiConfigured } from "@/lib/ai/gemini";

export const metadata = {
  title: "Gestor IA",
  robots: { index: false, follow: false },
};

export default async function AiManagerPage() {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) redirect("/workplace/login");

  const { data: canManage, error: permissionError } = await session.rpc("can_manage_public_content");
  if (permissionError || !canManage) redirect("/workplace");

  const admin = createAdminClient();
  const [{ data: drafts }, { data: reports }] = await Promise.all([
    admin.from("ai_manager_drafts")
      .select("id, topic, title, excerpt, body, image_url, status, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    admin.from("ai_weekly_reports")
      .select("id, period_start, period_end, summary, metrics, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return (
    <main className="workplace-shell">
      <header className="workplace-topbar">
        <Brand />
        <a className="text-link" href="/workplace">Voltar ao Workplace</a>
      </header>
      <div className="workplace-main">
        <nav className="workspace-nav" aria-label="Navegação do Workplace">
          <a href="/workplace">Visão geral</a>
          <a href="/workplace/catalog">Catálogo</a>
          <a href="/workplace/announcements">Anúncios</a>
          <a href="/workplace/gestor-ia">Gestor IA</a>
        </nav>
        <AiManager
          initialDrafts={drafts ?? []}
          reports={reports ?? []}
          geminiConfigured={isGeminiConfigured()}
        />
      </div>
    </main>
  );
}
