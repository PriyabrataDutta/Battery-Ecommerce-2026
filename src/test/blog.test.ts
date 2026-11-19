import { describe, it, expect } from "vitest";
import { renderMarkdown, normalizeBody, readingMinutes, topicOf } from "@/lib/blog";

describe("blog helpers", () => {
  it("renders markdown stored with literal \\n sequences", () => {
    const html = renderMarkdown("## Title\\n\\nSome **bold** text\\n\\n1. One\\n2. Two");
    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<ol>");
    expect(normalizeBody("a\\nb")).toBe("a\nb");
  });

  it("strips scripts and event handlers (audit S-05)", () => {
    const html = renderMarkdown('Hi <script>alert(1)</script><img src="x" onerror="alert(2)"> <a href="javascript:alert(3)">x</a>');
    expect(html).not.toMatch(/<script|onerror|javascript:/i);
  });

  it("reading time and topic", () => {
    expect(readingMinutes("word ".repeat(450))).toBe(2);
    expect(readingMinutes(null)).toBe(1);
    expect(topicOf({ title: "Tubular vs SMF inverter batteries", excerpt: null })).toBe("Inverter & home");
    expect(topicOf({ title: "Jump start your car", excerpt: null })).toBe("Car batteries");
  });
});
