import { marked } from "marked";
import DOMPurify from "dompurify";

/** Some posts were saved with literal "\n" sequences instead of line breaks. */
export const normalizeBody = (body: string | null) => (body ?? "").replace(/\\n/g, "\n").replace(/\r\n/g, "\n");

/** Markdown → sanitised HTML. Safe for dangerouslySetInnerHTML (audit S-05). */
export function renderMarkdown(body: string | null): string {
  const html = marked.parse(normalizeBody(body), { async: false, gfm: true });
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

/** Rough reading time at 200 words/min, at least 1. */
export function readingMinutes(body: string | null): number {
  const words = normalizeBody(body).replace(/[#>*_`[\]()-]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export type BlogTopic = "Car batteries" | "Inverter & home" | "Guides";
export const BLOG_TOPICS: BlogTopic[] = ["Car batteries", "Inverter & home", "Guides"];

/** Topic from title/excerpt keywords (there is no category column yet). */
export function topicOf(post: { title: string; excerpt: string | null }): BlogTopic {
  const t = `${post.title} ${post.excerpt ?? ""}`.toLowerCase();
  if (/inverter|tubular|smf|ups|lithium|backup|home/.test(t)) return "Inverter & home";
  if (/car|jump|vehicle|engine|bike/.test(t)) return "Car batteries";
  return "Guides";
}

export const formatPostDate = (iso: string | null, month: "short" | "long" = "short") =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month, year: "numeric" }) : "";

export const slugifyHeading = (text: string) =>
  text.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Adds ids to <h2> headings of sanitised HTML and returns a table of contents. */
export function withHeadingIds(html: string): { html: string; toc: { id: string; text: string }[] } {
  const toc: { id: string; text: string }[] = [];
  const out = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    let id = slugifyHeading(text) || "section";
    while (toc.some((t) => t.id === id)) id += "-2";
    toc.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}
