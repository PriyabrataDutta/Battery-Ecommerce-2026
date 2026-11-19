import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getPostBySlug, listPublishedPosts } from "@/api/blog";
import { ArrowLeft, ArrowRight, BatteryCharging, Car, Check, Clock, Link2, MessageCircle } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import { formatPostDate, readingMinutes, renderMarkdown, topicOf } from "@/lib/blog";
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
  const html = useMemo(() => renderMarkdown(post?.body ?? null), [post?.body]);
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


      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        {post.cover_url && <img src={post.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" aria-hidden />
        <div className="container-x relative pb-14 pt-10 sm:pb-20 sm:pt-14">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> All articles
          </Link>
          <div className="mt-8"><span className="rounded-full bg-volt px-3 py-1 text-xs font-bold text-ink">{topicOf(post)}</span></div>
          <h1 className="mt-4 max-w-4xl font-display-tight text-4xl font-bold text-balance sm:text-6xl">{post.title}</h1>
          {post.excerpt && <p className="mt-4 max-w-2xl text-lg text-white/75">{post.excerpt}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
            <span>Kachi Batteries</span>
            <span aria-hidden>·</span>
            <span>{formatPostDate(post.published_at, "long")}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {readingMinutes(post.body)} min read</span>
          </div>
        </div>
      </section>

      <div className="container-x grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
        <article className="min-w-0">
          {post.body ? (
            <div
              className="prose prose-base max-w-none text-ink-soft sm:prose-lg prose-headings:font-display prose-headings:tracking-tight prose-headings:text-ink prose-a:text-primary prose-strong:text-ink prose-li:marker:text-primary"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-muted-foreground">No content yet.</p>
          )}

          {/* Share */}
          <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-line pt-6">
            <span className="mr-1 text-sm font-semibold text-ink">Share this guide</span>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${canonicalUrl}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-whatsapp px-4 py-2 text-sm font-semibold text-white"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(canonicalUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-ink"
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-44 lg:self-start">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-hero p-6 text-white">
            <div className="absolute inset-0 bg-dots opacity-60" aria-hidden />
            <div className="relative">
              <div className="font-display text-lg font-bold">Ready to buy?</div>
              <p className="mt-1 text-sm text-white/65">Genuine batteries, free standard delivery.</p>
              <div className="mt-4 space-y-2">
                <Link to="/shop/car-batteries" className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-sm font-semibold hover:bg-white/15">
                  <Car className="h-5 w-5 text-volt" /> Car batteries <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
                <Link to="/shop/inverter-batteries" className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-sm font-semibold hover:bg-white/15">
                  <BatteryCharging className="h-5 w-5 text-volt" /> Inverter batteries <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
          <a href={contactInfo.whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-[2rem] border border-line bg-white p-5 hover:border-ink/30">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-whatsapp text-white"><MessageCircle className="h-5 w-5" /></span>
            <span>
              <span className="block font-display font-bold text-ink">Not sure what fits?</span>
              <span className="block text-sm text-muted-foreground">Ask a battery expert on WhatsApp</span>
            </span>
          </a>
        </aside>
      </div>

      {/* Related */}
      {all.filter((p) => p.slug !== post.slug).length > 0 && (
        <section className="mt-6 border-t border-line bg-white py-14 sm:py-16">
          <div className="container-x">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display-tight text-2xl font-bold text-ink sm:text-3xl">Keep reading</h2>
              <Link to="/blog" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink hover:text-primary">All articles <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {all.filter((p) => p.slug !== post.slug).slice(0, 3).map((p) => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="group flex gap-4 rounded-2xl border border-line bg-background p-3 transition-shadow hover:shadow-card">
                  {p.cover_url ? <img src={p.cover_url} alt="" loading="lazy" className="h-20 w-24 shrink-0 rounded-xl object-cover" /> : <div className="h-20 w-24 shrink-0 rounded-xl bg-gradient-hero" />}
                  <span className="min-w-0 py-1">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary">{topicOf(p)}</span>
                    <span className="mt-1 block font-display font-bold leading-snug text-ink group-hover:text-primary">{p.title}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default BlogPost;
