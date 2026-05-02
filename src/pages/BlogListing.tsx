import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { listPublishedPosts } from "@/api/blog";
import { Calendar } from "lucide-react";

const BlogListing = () => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: listPublishedPosts,
    staleTime: 5 * 60_000,
  });

  return (
    <>
      <Helmet>
        <title>Blog & Resources — Kachi Batteries</title>
        <meta name="description" content="Battery guides, tips, and industry insights from Kachi Batteries." />
      </Helmet>

      <div className="container-x py-12">
        <h1 className="font-display-tight text-4xl font-bold">Blog & Resources</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Guides, tips and industry insights to help you make the right battery choice.
        </p>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-line animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="mt-12 border border-dashed border-line p-12 text-center text-muted-foreground">
            No articles published yet. Check back soon!
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group bg-white border border-line hover:border-ink transition-colors overflow-hidden"
              >
                {post.cover_url ? (
                  <img
                    src={post.cover_url}
                    alt={post.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted grid place-items-center text-muted-foreground text-sm">
                    No cover
                  </div>
                )}
                <div className="p-5">
                  <h2 className="font-display font-bold text-lg text-ink line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                    <Calendar className="h-3.5 w-3.5" />
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Draft"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default BlogListing;
