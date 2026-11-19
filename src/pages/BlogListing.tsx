import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BatteryCharging, Car, Clock, MessageCircle, Search } from "lucide-react";
import { listPublishedPosts, type BlogPost } from "@/api/blog";
import { formatPostDate, readingMinutes, topicOf, type BlogTopic } from "@/lib/blog";
import { contactInfo } from "@/components/layout/Header/lib/nav";

const TOPICS: ("All" | BlogTopic)[] = ["All", "Car batteries", "Inverter & home", "Guides"];

function Meta({ post, light }: { post: BlogPost; light?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-2 text-xs ${light ? "text-white/70" : "text-muted-foreground"}`}>
      <span>{formatPostDate(post.published_at)}</span>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {readingMinutes(post.body)} min read</span>
    </div>
  );
}

function Cover({ post, className }: { post: BlogPost; className: string }) {
  return post.cover_url ? (
    <img src={post.cover_url} alt="" loading="lazy" className={`${className} object-cover transition-transform duration-700 group-hover:scale-105`} />
  ) : (
    <div className={`${className} bg-gradient-hero`} />
  );
}

const BlogListing = () => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: listPublishedPosts,
    staleTime: 5 * 60_000,
  });
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return posts.filter(
      (p) =>
        (topic === "All" || topicOf(p) === topic) &&
        (!term || `${p.title} ${p.excerpt ?? ""}`.toLowerCase().includes(term)),
    );
  }, [posts, topic, q]);

  const showFeatured = topic === "All" && !q && filtered.length > 0;
  const [featured, ...rest] = showFeatured ? filtered : [undefined, ...filtered];

  return (
    <>
      <Helmet>
        <title>Battery Guides & Tips — Kachi Batteries Blog</title>
        <meta name="description" content="Battery guides, tips and how-tos for car and inverter batteries from Kachi Batteries." />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 bg-dots" aria-hidden />
        <div className="container-x relative pb-24 pt-12 sm:pb-28 sm:pt-16">
          <span className="eyebrow">Kachi blog</span>
          <h1 className="mt-3 max-w-2xl font-display-tight text-4xl font-bold sm:text-6xl">Battery guides that save you money</h1>
          <p className="mt-4 max-w-xl text-white/70 sm:text-lg">Plain-English advice on choosing, caring for and replacing car and inverter batteries.</p>
          <label className="relative mt-8 flex max-w-md items-center">
            <span className="sr-only">Search articles</span>
            <Search className="pointer-events-none absolute left-4 h-4 w-4 text-ink/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search articles"
              className="h-12 w-full rounded-full border-0 bg-white pl-11 pr-4 text-sm text-ink shadow-elevated outline-none focus-visible:ring-2 focus-visible:ring-volt"
            />
          </label>
        </div>
      </section>

      <div className="container-x -mt-12 sm:-mt-14">
        {/* Topic chips */}
        <div className="relative z-10 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-white p-1.5 shadow-card scrollbar-none" role="tablist" aria-label="Topics">
          {TOPICS.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={topic === t} onClick={() => setTopic(t)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${topic === t ? "bg-ink text-white" : "text-ink/65 hover:text-ink"}`}>
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="surface h-80 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="surface mt-8 px-6 py-16 text-center">
            <p className="font-display text-lg font-bold text-ink">No articles found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try another topic or search term.</p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured && (
              <Link to={`/blog/${featured.slug}`} className="group mt-8 grid overflow-hidden rounded-[2rem] border border-line bg-white shadow-card transition-shadow hover:shadow-elevated lg:grid-cols-[1.15fr_1fr]">
                <div className="relative overflow-hidden">
                  <Cover post={featured} className="h-60 w-full sm:h-80 lg:h-full lg:min-h-[380px]" />
                  <span className="absolute left-4 top-4 rounded-full bg-volt px-3 py-1 text-xs font-bold text-ink">Latest</span>
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-10">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{topicOf(featured)}</span>
                  <h2 className="mt-3 font-display-tight text-3xl font-bold text-ink transition-colors group-hover:text-primary sm:text-4xl">{featured.title}</h2>
                  {featured.excerpt && <p className="mt-3 text-muted-foreground sm:text-lg">{featured.excerpt}</p>}
                  <div className="mt-5"><Meta post={featured} /></div>
                  <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition-colors group-hover:bg-primary">
                    Read article <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            )}

            {/* Grid */}
            {rest.length > 0 && (
              <div className="mt-6 grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => post && (
                  <Link key={post.id} to={`/blog/${post.slug}`} className="group surface flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-elevated">
                    <div className="relative overflow-hidden">
                      <Cover post={post} className="h-52 w-full" />
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink backdrop-blur">{topicOf(post)}</span>
                    </div>
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <h2 className="font-display text-lg font-bold leading-snug text-ink transition-colors group-hover:text-primary sm:text-xl">{post.title}</h2>
                      {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>}
                      <div className="mt-auto pt-5"><Meta post={post} /></div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Help band */}
      <section className="container-x mb-8 mt-16 sm:mt-24">
        <div className="grid gap-4 lg:grid-cols-3">
          <Link to="/shop/car-batteries" className="group relative overflow-hidden rounded-[2rem] bg-gradient-hero p-6 text-white sm:p-8">
            <div className="absolute inset-0 bg-dots opacity-60" aria-hidden />
            <Car className="relative h-7 w-7 text-volt" />
            <div className="relative mt-4 font-display text-xl font-bold">Find a battery for your car</div>
            <span className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 group-hover:text-white">Shop car batteries <ArrowRight className="h-4 w-4" /></span>
          </Link>
          <Link to="/shop/inverter-batteries" className="group rounded-[2rem] border border-line bg-white p-6 sm:p-8">
            <BatteryCharging className="h-7 w-7 text-primary" />
            <div className="mt-4 font-display text-xl font-bold text-ink">Size your inverter battery</div>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/70 group-hover:text-primary">Use the backup calculator <ArrowRight className="h-4 w-4" /></span>
          </Link>
          <a href={contactInfo.whatsappUrl} target="_blank" rel="noopener noreferrer" className="group rounded-[2rem] bg-volt p-6 text-ink sm:p-8">
            <MessageCircle className="h-7 w-7" />
            <div className="mt-4 font-display text-xl font-bold">Ask a battery expert</div>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/75 group-hover:text-ink">Chat on WhatsApp <ArrowRight className="h-4 w-4" /></span>
          </a>
        </div>
      </section>
    </>
  );
};

export default BlogListing;
