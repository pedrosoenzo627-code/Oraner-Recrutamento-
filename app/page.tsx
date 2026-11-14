import { LandingPage } from "@/components/landing-page";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function HomePage() {
  const databaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!databaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return <LandingPage products={[]} announcements={[]} />;
  }

  const supabase = createAdminClient();
  const [productQuery, announcementQuery] = await Promise.all([
    supabase.from("products")
      .select("id, name, slug, category, summary, price_cents, currency, image_url")
      .eq("status", "published").order("created_at", { ascending: false }).limit(6),
    supabase.from("announcements")
      .select("id, title, slug, excerpt, publish_at, image_url")
      .eq("status", "published").order("publish_at", { ascending: false }).limit(3),
  ]);

  let products = productQuery.data ?? [];
  if (productQuery.error) {
    const fallback = await supabase.from("products")
      .select("id, name, slug, category, summary, price_cents, currency")
      .eq("status", "published").order("created_at", { ascending: false }).limit(6);
    products = fallback.data ?? [];
  }

  let announcements = announcementQuery.data ?? [];
  if (announcementQuery.error) {
    const fallback = await supabase.from("announcements")
      .select("id, title, slug, excerpt, publish_at")
      .eq("status", "published").order("publish_at", { ascending: false }).limit(3);
    announcements = fallback.data ?? [];
  }

  return <LandingPage products={products} announcements={announcements} />;
}
