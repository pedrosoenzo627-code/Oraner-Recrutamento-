import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const databaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!databaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) return { title: "Comunicado" };

  const { data } = await createAdminClient()
    .from("announcements")
    .select("title, excerpt")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return data
    ? { title: data.title, description: data.excerpt }
    : { title: "Comunicado não encontrado" };
}

export default async function AnnouncementDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const databaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!databaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) notFound();

  const { data: announcement } = await createAdminClient()
    .from("announcements")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!announcement) notFound();

  const imageUrl = typeof announcement.image_url === "string" && announcement.image_url.startsWith("https://")
    ? announcement.image_url
    : null;
  const dateLabel = announcement.publish_at
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(announcement.publish_at))
    : null;

  return (
    <main>
      <SiteHeader />
      <section className="detail-shell">
        <Link className="detail-back" href="/#novidades">← Voltar às novidades</Link>
        <article className="detail-card">
          {imageUrl && <img className="detail-image" src={imageUrl} alt="" />}
          <div className="detail-content">
            <span className="status-chip">Comunicado oficial</span>
            {dateLabel && <p className="announcement-date">{dateLabel}</p>}
            <h1>{announcement.title}</h1>
            <p><strong>{announcement.excerpt}</strong></p>
            <p>{announcement.body}</p>
          </div>
        </article>
      </section>
    </main>
  );
}
