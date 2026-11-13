import { LandingPage } from "@/components/landing-page";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function HomePage() {
  const supabase = createAdminClient();
  const [{ data: products }, { data: announcements }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, category, summary, price_cents, currency")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("announcements")
      .select("id, title, slug, excerpt, publish_at")
      .eq("status", "published")
      .order("publish_at", { ascending: false })
      .limit(3),
  ]);

  return <LandingPage products={products ?? []} announcements={announcements ?? []} />;
}
