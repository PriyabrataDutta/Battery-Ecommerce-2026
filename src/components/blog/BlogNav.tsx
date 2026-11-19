import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { BLOG_TOPICS } from "@/lib/blog";

/** Phone/tablet sub-header: wordmark, topic links (?topic=) and search (?q=). Desktop uses BlogSidebar. */
export function BlogNav() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const topic = params.get("topic");
  const link = (active: boolean) =>
    `shrink-0 border-b-2 py-4 text-sm font-medium transition-colors ${active ? "border-ink text-ink" : "border-transparent text-ink/60 hover:text-ink"}`;

  return (
    <div className="border-b border-line bg-white lg:hidden">
      <div className="container-x flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-center gap-6 overflow-x-auto scrollbar-none sm:gap-8">
          <Link to="/blog" className="shrink-0 py-4 font-display text-base font-extrabold tracking-tight text-ink">
            The Battery Journal
          </Link>
          <Link to="/blog" className={link(!topic && !params.get("q"))}>Latest</Link>
          {BLOG_TOPICS.map((t) => (
            <Link key={t} to={`/blog?topic=${encodeURIComponent(t)}`} className={link(topic === t)}>{t}</Link>
          ))}
        </div>
        <form
          role="search"
          className="relative mb-3 sm:mb-0"
          onSubmit={(e) => {
            e.preventDefault();
            const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
            navigate(q ? `/blog?q=${encodeURIComponent(q)}` : "/blog");
          }}
        >
          <label htmlFor="blog-search" className="sr-only">Search the journal</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
          <input
            id="blog-search"
            name="q"
            key={params.get("q") ?? ""}
            defaultValue={params.get("q") ?? ""}
            placeholder="Search"
            className="h-10 w-full rounded-full border border-line bg-background pl-9 pr-4 text-sm text-ink outline-none focus-visible:border-ink sm:w-56"
          />
        </form>
      </div>
    </div>
  );
}
