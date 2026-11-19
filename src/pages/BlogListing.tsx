import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { listPublishedPosts, type BlogPost } from "@/api/blog";
import { BLOG_TOPICS, formatPostDate, readingMinutes, topicOf } from "@/lib/blog";
import { BlogNav } from "@/components/blog/BlogNav";

const meta = (p: BlogPost) => `${formatPostDate(p.published_at)} · ${readingMinutes(p.body)} min read`;

function Photo({ post, className }: { post: BlogPost; className: string }) {
  return post.cover_url ? (
    <img src={post.cover_url} alt="" loading="lazy" className={`${className} object-cover transition-transform duration-700 group-hover:scale-[1.03]`} />
  ) : (
    <div className={`${className} bg-muted`} />
  );
}

/** Text-first row (Ahrefs/Shopify style), used for search & topic results. */
function Row({ post }: { post: BlogPost }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group grid gap-2 border-b border-line py-7 sm:grid-cols-[180px_1fr_auto] sm:gap-8">
      <div className="text-sm text-muted-foreground">{meta(post)}</div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{topicOf(post)}</div>
        <h2 className="mt-1.5 font-display text-2xl font-semibold leading-snug tracking-tight text-ink group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">{post.title}</h2>
        {post.excerpt && <p className="mt-2 max-w-2xl text-muted-foreground">{post.excerpt}</p>}
      </div>
      {post.cover_url && <img src={post.cover_url} alt="" loading="lazy" className="hidden h-24 w-36 rounded-xl object-cover sm:block" />}
    </Link>
  );
}

const BlogListing = () => {
  const { data: posts = [], isLoading } = useQuery({ queryKey: ["blog-posts"], queryFn: listPublishedPosts, staleTime: 5 * 60_000 });
  const [params] = useSearchParams();
  const topic = params.get("topic");
  const q = params.get("q")?.trim().toLowerCase() ?? "";

  const results = useMemo(
    () => posts.filter((p) => (!topic || topicOf(p) === topic) && (!q || `${p.title} ${p.excerpt ?? ""} ${p.body ?? ""}`.toLowerCase().includes(q))),
    [posts, topic, q],
  );
  const [lead, ...rest] = posts;
  const sections = posts.length > 6 ? BLOG_TOPICS.map((t) => ({ t, items: posts.filter((p) => topicOf(p) === t) })).filter((s) => s.items.length >= 2) : [];

  return (
    <div className="bg-white">
      <Helmet>
        <title>The Battery Journal — Guides & Tips | Kachi Batteries</title>
        <meta name="description" content="Plain-English guides on choosing, caring for and replacing car and inverter batteries, from Kachi Batteries." />
      </Helmet>
      <BlogNav />

      {isLoading ? (
        <div className="container-x grid gap-10 py-14 lg:grid-cols-2">
          <div className="space-y-4"><div className="h-4 w-32 rounded bg-muted" /><div className="h-24 rounded bg-muted" /><div className="h-4 w-2/3 rounded bg-muted" /></div>
          <div className="aspect-[4/3] rounded-3xl bg-muted" />
        </div>
      ) : topic || q ? (
        /* Topic / search results */
        <div className="container-x py-12 sm:py-16">
          <p className="text-sm text-muted-foreground">{q ? "Search results" : "Topic"}</p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{q ? `“${params.get("q")}”` : topic}</h1>
          <div className="mt-8 border-t border-line">
            {results.length ? results.map((p) => <Row key={p.id} post={p} />) : (
              <p className="py-12 text-muted-foreground">No guides found. <Link to="/blog" className="font-semibold text-ink underline underline-offset-4">See all guides</Link></p>
            )}
          </div>
        </div>
      ) : !lead ? (
        <div className="container-x py-24 text-center text-muted-foreground">No guides published yet.</div>
      ) : (
        <>
          {/* Lead story */}
          <section className="container-x grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <div className="order-2 lg:order-1">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{topicOf(lead)}</div>
              <Link to={`/blog/${lead.slug}`} className="group mt-4 block">
                <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink group-hover:underline group-hover:decoration-2 group-hover:underline-offset-8 sm:text-5xl lg:text-6xl">
                  {lead.title}
                </h1>
              </Link>
              {lead.excerpt && <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{lead.excerpt}</p>}
              <div className="mt-6 text-sm text-muted-foreground">By Kachi Batteries · {meta(lead)}</div>
              <Link to={`/blog/${lead.slug}`} className="mt-8 inline-flex items-center gap-2 border-b-2 border-ink pb-1 text-sm font-semibold text-ink hover:border-primary hover:text-primary">
                Read the guide <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <Link to={`/blog/${lead.slug}`} className="group order-1 block overflow-hidden rounded-3xl lg:order-2" tabIndex={-1} aria-hidden>
              <Photo post={lead} className="aspect-[4/3] w-full" />
            </Link>
          </section>

          {/* Latest */}
          {rest.length > 0 && (
            <section className="border-y border-line bg-background py-12 sm:py-14">
              <div className="container-x">
                <div className="flex items-end justify-between gap-4">
                  <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Latest</h2>
                  <span className="text-sm text-muted-foreground">{posts.length} guides</span>
                </div>
                <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                  {rest.slice(0, 8).map((p) => (
                    <Link key={p.id} to={`/blog/${p.slug}`} className="group">
                      <div className="overflow-hidden rounded-2xl"><Photo post={p} className="aspect-[3/2] w-full" /></div>
                      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{topicOf(p)}</div>
                      <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug tracking-tight text-ink group-hover:underline group-hover:underline-offset-4">{p.title}</h3>
                      <div className="mt-2 text-sm text-muted-foreground">{meta(p)}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Topic sections (once there are enough guides) */}
          {sections.map(({ t, items }) => {
            const [first, ...others] = items;
            return (
              <section key={t} className="container-x border-b border-line py-12 sm:py-14">
                <div className="flex items-end justify-between gap-4">
                  <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{t}</h2>
                  <Link to={`/blog?topic=${encodeURIComponent(t)}`} className="inline-flex items-center gap-1 text-sm font-semibold text-ink underline-offset-4 hover:underline">See all <ArrowRight className="h-4 w-4" /></Link>
                </div>
                <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
                  <Link to={`/blog/${first.slug}`} className="group grid gap-6 sm:grid-cols-2">
                    <div className="overflow-hidden rounded-2xl"><Photo post={first} className="aspect-[4/3] w-full" /></div>
                    <div>
                      <h3 className="font-display text-2xl font-semibold leading-snug tracking-tight text-ink group-hover:underline group-hover:underline-offset-4">{first.title}</h3>
                      {first.excerpt && <p className="mt-3 text-muted-foreground">{first.excerpt}</p>}
                      <div className="mt-3 text-sm text-muted-foreground">{meta(first)}</div>
                    </div>
                  </Link>
                  <ul className="divide-y divide-line border-t border-line lg:border-l lg:border-t-0 lg:pl-10">
                    {others.slice(0, 4).map((p) => (
                      <li key={p.id}>
                        <Link to={`/blog/${p.slug}`} className="group block py-4">
                          <h3 className="font-display text-lg font-semibold leading-snug text-ink group-hover:underline group-hover:underline-offset-4">{p.title}</h3>
                          <div className="mt-1 text-sm text-muted-foreground">{meta(p)}</div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </>
      )}

      {/* Quiet shop link */}
      <section className="container-x py-12 sm:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-2xl font-semibold tracking-tight text-ink">Ready to replace your battery?</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            <Link to="/shop/car-batteries" className="inline-flex items-center gap-1 text-ink hover:text-primary">Car batteries <ArrowUpRight className="h-4 w-4" /></Link>
            <Link to="/shop/inverter-batteries" className="inline-flex items-center gap-1 text-ink hover:text-primary">Inverter batteries <ArrowUpRight className="h-4 w-4" /></Link>
            <Link to="/contact" className="inline-flex items-center gap-1 text-ink hover:text-primary">Talk to an expert <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogListing;
