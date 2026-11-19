import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, BatteryCharging, Car, MessageCircle, PhoneCall, Search } from "lucide-react";
import type { BlogPost } from "@/api/blog";
import { BLOG_TOPICS, formatPostDate, readingMinutes, topicOf } from "@/lib/blog";
import { contactInfo as c } from "@/components/layout/Header/lib/nav";

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * Blog sidebar shared by the journal page and article template.
 * Pass `toc` on articles to show "On this page"; `currentSlug` hides that post from Recent.
 */
export function BlogSidebar({ posts, currentSlug, toc = [] }: { posts: BlogPost[]; currentSlug?: string; toc?: { id: string; text: string }[] }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const topic = params.get("topic");
  const recent = posts.filter((p) => p.slug !== currentSlug).slice(0, 4);

  return (
    <aside className="space-y-4 lg:sticky lg:top-40 lg:self-start">
      {/* Search (desktop; phones use the topic bar search) */}
      <form
        role="search"
        className="relative hidden lg:block"
        onSubmit={(e) => {
          e.preventDefault();
          const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
          navigate(q ? `/blog?q=${encodeURIComponent(q)}` : "/blog");
        }}
      >
        <label htmlFor="sidebar-search" className="sr-only">Search the journal</label>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
        <input id="sidebar-search" name="q" key={params.get("q") ?? ""} defaultValue={params.get("q") ?? ""} placeholder="Search guides"
          className="h-12 w-full rounded-full border border-line bg-white pl-11 pr-4 text-sm text-ink outline-none focus-visible:border-ink" />
      </form>

      {toc.length >= 2 && (
        <Box title="On this page">
          <ul className="space-y-1 border-l border-line">
            {toc.map((t) => (
              <li key={t.id}><a href={`#${t.id}`} className="-ml-px block border-l-2 border-transparent py-1 pl-3 text-sm text-ink/70 hover:border-primary hover:text-ink">{t.text}</a></li>
            ))}
          </ul>
        </Box>
      )}

      <div className="hidden lg:block">
        <Box title="Topics">
          <ul className="-mx-2">
            {[{ t: "All guides", to: "/blog", n: posts.length, active: !topic && !params.get("q") && !currentSlug },
              ...BLOG_TOPICS.map((t) => ({ t, to: `/blog?topic=${encodeURIComponent(t)}`, n: posts.filter((p) => topicOf(p) === t).length, active: topic === t }))
                .filter((x) => x.n > 0 || x.active)].map(({ t, to, n, active }) => (
              <li key={t}>
                <Link to={to} className={`flex items-center justify-between rounded-xl px-2 py-2 text-sm transition-colors ${active ? "bg-ink font-semibold text-white" : "text-ink hover:bg-muted"}`}>
                  {t} <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/15" : "bg-muted text-muted-foreground"}`}>{n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Box>
      </div>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-hero p-5 text-white">
        <div className="absolute inset-0 bg-dots opacity-60" aria-hidden />
        <div className="relative">
          <h2 className="font-display text-lg font-bold">Find the right battery</h2>
          <p className="mt-1 text-sm text-white/65">Genuine brands, free standard delivery.</p>
          <div className="mt-4 space-y-2">
            <Link to="/shop/car-batteries" className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-sm font-semibold hover:bg-white/15">
              <Car className="h-5 w-5 text-volt" /> For your car <ArrowRight className="ml-auto h-4 w-4" />
            </Link>
            <Link to="/shop/inverter-batteries" className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-sm font-semibold hover:bg-white/15">
              <BatteryCharging className="h-5 w-5 text-volt" /> For home backup <ArrowRight className="ml-auto h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {recent.length > 0 && (
        <Box title={currentSlug ? "More guides" : "Recent guides"}>
          <ul className="space-y-3">
            {recent.map((p) => (
              <li key={p.id}>
                <Link to={`/blog/${p.slug}`} className="group flex gap-3">
                  {p.cover_url ? <img src={p.cover_url} alt="" loading="lazy" className="h-16 w-20 shrink-0 rounded-xl object-cover" /> : <div className="h-16 w-20 shrink-0 rounded-xl bg-muted" />}
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-primary">{p.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{formatPostDate(p.published_at)} · {readingMinutes(p.body)} min</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Box>
      )}

      <section className="rounded-3xl bg-volt p-5 text-ink">
        <h2 className="font-display text-lg font-bold">Ask a battery expert</h2>
        <p className="mt-1 text-sm text-ink/70">Not sure which battery fits? We reply fast.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a href={c.phoneTel} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ink py-2.5 text-sm font-semibold text-white"><PhoneCall className="h-4 w-4" /> Call</a>
          <a href={c.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-sm font-semibold text-ink"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
        </div>
      </section>
    </aside>
  );
}
