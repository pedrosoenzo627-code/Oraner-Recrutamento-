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

  type PublicProduct = {
    id: string;
    name: string;
    slug: string;
    category: string;
    summary: string;
    price_cents: number | null;
    currency: string;
    image_url?: string | null;
  };
  type PublicAnnouncement = {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    publish_at: string | null;
    image_url?: string | null;
  };

  let products: PublicProduct[] = (productQuery.data ?? []) as PublicProduct[];
  if (productQuery.error) {
    const fallback = await supabase.from("products")
      .select("id, name, slug, category, summary, price_cents, currency")
      .eq("status", "published").order("created_at", { ascending: false }).limit(6);
    products = (fallback.data ?? []).map((product) => ({ ...product, image_url: null }));
  }

  let announcements: PublicAnnouncement[] = (announcementQuery.data ?? []) as PublicAnnouncement[];
  if (announcementQuery.error) {
    const fallback = await supabase.from("announcements")
      .select("id, title, slug, excerpt, publish_at")
      .eq("status", "published").order("publish_at", { ascending: false }).limit(3);
    announcements = (fallback.data ?? []).map((announcement) => ({ ...announcement, image_url: null }));
  }

  return <LandingPage products={products} announcements={announcements} />;
}
