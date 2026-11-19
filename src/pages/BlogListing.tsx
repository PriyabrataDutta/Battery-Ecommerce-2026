import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { listPublishedPosts, type BlogPost } from "@/api/blog";
import { formatPostDate, readingMinutes, topicOf } from "@/lib/blog";
import { BlogNav } from "@/components/blog/BlogNav";
import { BlogSidebar } from "@/components/blog/BlogSidebar";

const meta = (p: BlogPost) => `${formatPostDate(p.published_at)} · ${readingMinutes(p.body)} min read`;

function Photo({ post, className }: { post: BlogPost; className: string }) {
  return post.cover_url ? (
    <img src={post.cover_url} alt="" loading="lazy" className={`${className} object-cover transition-transform duration-700 group-hover:scale-[1.03]`} />
  ) : (
    <div className={`${className} bg-muted`} />
  );
}

/** Article row: photo left, text right. */
function Row({ post }: { post: BlogPost }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group grid gap-4 border-b border-line py-6 sm:grid-cols-[220px_1fr] sm:gap-6">
      <div className="overflow-hidden rounded-2xl"><Photo post={post} className="aspect-[16/10] w-full" /></div>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{topicOf(post)}</div>
        <h2 className="mt-1.5 font-display text-xl font-semibold leading-snug tracking-tight text-ink group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4 sm:text-2xl">{post.title}</h2>
        {post.excerpt && <p className="mt-2 line-clamp-2 text-muted-foreground">{post.excerpt}</p>}
        <div className="mt-3 text-sm text-muted-foreground">{meta(post)}</div>
      </div>
    </Link>
  );
}

const BlogListing = () => {
  const { data: posts = [], isLoading } = useQuery({ queryKey: ["blog-posts"], queryFn: listPublishedPosts, staleTime: 5 * 60_000 });
  const [params] = useSearchParams();
  const topic = params.get("topic");
  const rawQ = params.get("q")?.trim() ?? "";
  const q = rawQ.toLowerCase();

  const results = useMemo(
    () => posts.filter((p) => (!topic || topicOf(p) === topic) && (!q || `${p.title} ${p.excerpt ?? ""} ${p.body ?? ""}`.toLowerCase().includes(q))),
    [posts, topic, q],
  );
  const filtering = !!(topic || q);
  const [lead, ...rest] = posts;

  return (
    <div className="bg-white">
      <Helmet>
        <title>The Battery Journal — Guides & Tips | Kachi Batteries</title>
        <meta name="description" content="Plain-English guides on choosing, caring for and replacing car and inverter batteries, from Kachi Batteries." />
      </Helmet>
      <BlogNav />

      {/* Page header */}
      <header className="border-b border-line bg-background">
        <div className="container-x py-10 sm:py-14">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">The Battery Journal</div>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {rawQ ? `Results for “${rawQ}”` : topic ?? "Guides & tips for every battery"}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {filtering
              ? `${results.length} guide${results.length === 1 ? "" : "s"} found.`
              : "Plain-English advice on choosing, caring for and replacing car and inverter batteries."}
          </p>
        </div>
      </header>

      <div className="container-x grid gap-10 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        <main className="min-w-0">
          {isLoading ? (
            <div className="space-y-4"><div className="aspect-[16/9] rounded-3xl bg-muted" /><div className="h-8 w-2/3 rounded bg-muted" /></div>
          ) : filtering ? (
            results.length ? (
              <div className="border-t border-line">{results.map((p) => <Row key={p.id} post={p} />)}</div>
            ) : (
              <p className="py-10 text-muted-foreground">No guides found. <Link to="/blog" className="font-semibold text-ink underline underline-offset-4">See all guides</Link></p>
            )
          ) : !lead ? (
            <p className="py-10 text-muted-foreground">No guides published yet.</p>
          ) : (
            <>
              {/* Lead story */}
              <Link to={`/blog/${lead.slug}`} className="group block">
                <div className="overflow-hidden rounded-3xl"><Photo post={lead} className="aspect-[16/9] w-full" /></div>
                <div className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Latest · {topicOf(lead)}</div>
                <h2 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight text-ink group-hover:underline group-hover:decoration-2 group-hover:underline-offset-8 sm:text-4xl">{lead.title}</h2>
                {lead.excerpt && <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{lead.excerpt}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <span className="text-muted-foreground">By Kachi Batteries · {meta(lead)}</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-ink group-hover:text-primary">Read the guide <ArrowRight className="h-4 w-4" /></span>
                </div>
              </Link>

              {rest.length > 0 && (
                <section className="mt-12">
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">More guides</h2>
                  <div className="mt-2">{rest.map((p) => <Row key={p.id} post={p} />)}</div>
                </section>
              )}
            </>
          )}
        </main>

        <BlogSidebar posts={posts} />
      </div>
    </div>
  );
};

export default BlogListing;
