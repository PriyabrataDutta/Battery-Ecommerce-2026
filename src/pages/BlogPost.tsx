import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getPostBySlug, listPublishedPosts } from "@/api/blog";
import { ArrowRight, ArrowUpRight, Check, Link2, MessageCircle } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import { formatPostDate, readingMinutes, renderMarkdown, topicOf, withHeadingIds } from "@/lib/blog";
import { BlogNav } from "@/components/blog/BlogNav";
import { contactInfo } from "@/components/layout/Header/lib/nav";

const BlogPost = () => {
  const { slug } = useParams();
  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => getPostBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60_000,
  });
  const { data: all = [] } = useQuery({ queryKey: ["blog-posts"], queryFn: listPublishedPosts, staleTime: 5 * 60_000 });
  const { html, toc } = useMemo(() => {
    const r = withHeadingIds(renderMarkdown(post?.body ?? null));
    // Posts often open with a heading that repeats the title; the page already shows it.
    const first = r.toc[0];
    if (first && post && first.text.trim().toLowerCase() === post.title.trim().toLowerCase()) {
      return { html: r.html.replace(new RegExp(`<h2 id="${first.id}">[\\s\\S]*?</h2>`), ""), toc: r.toc.slice(1) };
    }
    return r;
  }, [post]);
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="container-x py-12 max-w-3xl animate-pulse space-y-4">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="h-10 bg-muted rounded w-2/3" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="font-display-tight text-3xl font-bold">Post not found</h1>
        <Link to="/blog" className="text-primary text-sm mt-4 inline-block">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(post.cover_url ? { image: [post.cover_url] } : {}),
    datePublished: post.published_at ?? post.created_at,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    publisher: { "@type": "Organization", name: "Kachi Batteries" },
  };

  return (
    <>
      <Helmet>
        <title>{post.title} — Kachi Batteries Blog</title>
        {post.excerpt && <meta name="description" content={post.excerpt} />}
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:url" content={canonicalUrl} />
        {post.excerpt && <meta property="og:description" content={post.excerpt} />}
        {post.cover_url && <meta property="og:image" content={post.cover_url} />}
        <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
      </Helmet>


      <div className="bg-white">
        <BlogNav />

        {/* Header */}
        <header className="container-x pt-10 sm:pt-14">
          <div className="mx-auto max-w-3xl">
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
              <Link to="/blog" className="hover:text-ink">The Battery Journal</Link>
              <span className="mx-2">/</span>
              <Link to={`/blog?topic=${encodeURIComponent(topicOf(post))}`} className="font-medium text-primary hover:underline">{topicOf(post)}</Link>
            </nav>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink text-balance sm:text-5xl lg:text-6xl">{post.title}</h1>
            {post.excerpt && <p className="mt-5 text-xl leading-relaxed text-muted-foreground">{post.excerpt}</p>}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-ink font-display text-sm font-bold text-white">K</span>
                <div className="text-sm">
                  <div className="font-semibold text-ink">Kachi Batteries team</div>
                  <div className="text-muted-foreground">{formatPostDate(post.published_at, "long")} · {readingMinutes(post.body)} min read</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${canonicalUrl}`)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp"
                  className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink hover:border-ink"><MessageCircle className="h-4 w-4" /></a>
                <button type="button" aria-label={copied ? "Link copied" : "Copy link"}
                  onClick={() => navigator.clipboard?.writeText(canonicalUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
                  className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink hover:border-ink">
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          {post.cover_url && (
            <img src={post.cover_url} alt="" className="mx-auto mt-10 aspect-[16/9] w-full max-w-5xl rounded-3xl object-cover" />
          )}
        </header>

        {/* Body + contents */}
        <div className="container-x py-12 sm:py-16">
          <div className={toc.length >= 2 ? "mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_220px]" : "mx-auto max-w-3xl"}>
            <article className={`w-full min-w-0 ${toc.length >= 2 ? "mx-auto max-w-3xl lg:mx-0" : ""}`}>
              {post.body ? (
                <div
                  className="prose prose-lg max-w-none text-ink-soft prose-headings:scroll-mt-40 prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-ink prose-p:leading-relaxed prose-a:text-primary prose-strong:text-ink prose-li:marker:text-ink/40"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <p className="text-muted-foreground">No content yet.</p>
              )}

              {/* Inline help, not a sidebar ad */}
              <div className="mt-12 rounded-2xl bg-background p-6 sm:p-8">
                <p className="font-display text-xl font-semibold tracking-tight text-ink">Need the right battery?</p>
                <p className="mt-1 text-muted-foreground">Find one that fits your car or your home backup, delivered free.</p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
                  <Link to="/shop/car-batteries" className="inline-flex items-center gap-1 text-ink hover:text-primary">Shop car batteries <ArrowUpRight className="h-4 w-4" /></Link>
                  <Link to="/shop/inverter-batteries" className="inline-flex items-center gap-1 text-ink hover:text-primary">Shop inverter batteries <ArrowUpRight className="h-4 w-4" /></Link>
                  <a href={contactInfo.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-ink hover:text-primary">Ask an expert <ArrowUpRight className="h-4 w-4" /></a>
                </div>
              </div>
            </article>

            {toc.length >= 2 && (
              <aside className="hidden lg:block">
                <nav aria-label="On this page" className="sticky top-44">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">On this page</div>
                  <ul className="mt-4 space-y-2.5 border-l border-line">
                    {toc.map((t) => (
                      <li key={t.id}><a href={`#${t.id}`} className="-ml-px block border-l border-transparent pl-4 text-sm text-ink/70 hover:border-ink hover:text-ink">{t.text}</a></li>
                    ))}
                  </ul>
                </nav>
              </aside>
            )}
          </div>
        </div>

        {/* More guides */}
        {all.filter((p) => p.slug !== post.slug).slice(0, 3).length > 0 && (
          <section className="border-t border-line bg-background py-12 sm:py-16">
            <div className="container-x">
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">More guides</h2>
                <Link to="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-ink underline-offset-4 hover:underline">All guides <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {all.filter((p) => p.slug !== post.slug).slice(0, 3).map((p) => (
                  <Link key={p.id} to={`/blog/${p.slug}`} className="group">
                    <div className="overflow-hidden rounded-2xl">
                      {p.cover_url ? <img src={p.cover_url} alt="" loading="lazy" className="aspect-[3/2] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" /> : <div className="aspect-[3/2] bg-muted" />}
                    </div>
                    <div className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{topicOf(p)}</div>
                    <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug tracking-tight text-ink group-hover:underline group-hover:underline-offset-4">{p.title}</h3>
                    <div className="mt-2 text-sm text-muted-foreground">{formatPostDate(p.published_at)} · {readingMinutes(p.body)} min read</div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default BlogPost;
