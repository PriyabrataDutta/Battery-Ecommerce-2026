import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { getPostBySlug } from "@/api/blog";
import { ArrowLeft, Calendar } from "lucide-react";

const BlogPost = () => {
  const { slug } = useParams();
  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => getPostBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60_000,
  });

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

  const canonicalUrl = `https://power-drive-finder.lovable.app/blog/${post.slug}`;
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


      <article className="container-x py-12 max-w-3xl">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        <h1 className="font-display-tight text-3xl sm:text-4xl font-bold">{post.title}</h1>

        {post.published_at && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-3">
            <Calendar className="h-4 w-4" />
            {new Date(post.published_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        )}

        {post.cover_url && (
          <img
            src={post.cover_url}
            alt={post.title}
            className="w-full h-auto mt-6 border border-line"
          />
        )}

        <div className="prose prose-sm max-w-none mt-8 text-ink-soft">
          {post.body ? (
            <div dangerouslySetInnerHTML={{ __html: post.body.replace(/\n/g, "<br/>") }} />
          ) : (
            <p className="text-muted-foreground">No content yet.</p>
          )}
        </div>
      </article>
    </>
  );
};

export default BlogPost;
