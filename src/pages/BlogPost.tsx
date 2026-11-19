import { Link, useParams } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getPostBySlug, listPublishedPosts } from "@/api/blog";
import { ArrowRight, Check, Link2, MessageCircle } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import { faqJsonLd } from "@/lib/faq";
import { extractFaq, formatPostDate, readingMinutes, renderMarkdown, topicOf, withHeadingIds } from "@/lib/blog";
import { BlogNav } from "@/components/blog/BlogNav";
import { BlogSidebar } from "@/components/blog/BlogSidebar";

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
    dateModified: post.updated_at ?? post.published_at ?? post.created_at,
    articleSection: topicOf(post),
    inLanguage: "en-IN",
    wordCount: (post.body ?? "").split(/\s+/).filter(Boolean).length,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    author: { "@type": "Organization", name: "Kachi Batteries", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Kachi Batteries", logo: { "@type": "ImageObject", url: `${SITE_URL}/og-default.jpg` } },
  };

  return (
    <>
      <Seo
        title={post.title}
        description={post.excerpt ?? `${post.title}: a battery guide from Kachi Batteries.`}
        path={`/blog/${post.slug}`}
        image={post.cover_url}
        type="article"
        breadcrumbs={[{ name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }]}
        jsonLd={extractFaq(post.body).length ? [articleJsonLd, faqJsonLd(extractFaq(post.body))] : articleJsonLd}
      />


      <div className="bg-white">
        <BlogNav />

        <div className="container-x grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
          <article className="min-w-0">
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
              <Link to="/blog" className="hover:text-ink">The Battery Journal</Link>
              <span className="mx-2">/</span>
              <Link to={`/blog?topic=${encodeURIComponent(topicOf(post))}`} className="font-medium text-primary hover:underline">{topicOf(post)}</Link>
            </nav>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink text-balance sm:text-5xl">{post.title}</h1>
            {post.excerpt && <p className="mt-4 text-xl leading-relaxed text-muted-foreground">{post.excerpt}</p>}

            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
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

            {post.cover_url && <img src={post.cover_url} alt="" className="mt-8 aspect-[16/9] w-full rounded-3xl object-cover" />}

            {post.body ? (
              <div
                className="prose prose-lg mt-10 max-w-none text-ink-soft prose-headings:scroll-mt-40 prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-ink prose-p:leading-relaxed prose-a:text-primary prose-strong:text-ink prose-li:marker:text-ink/40"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <p className="mt-10 text-muted-foreground">No content yet.</p>
            )}

            <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
              <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-primary">
                <ArrowRight className="h-4 w-4 rotate-180" /> All guides
              </Link>
              <a href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${canonicalUrl}`)}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-whatsapp px-4 py-2 text-sm font-semibold text-white">
                <MessageCircle className="h-4 w-4" /> Share this guide
              </a>
            </div>
          </article>

          <BlogSidebar posts={all} currentSlug={post.slug} toc={toc} />
        </div>
      </div>
    </>
  );
};

export default BlogPost;
