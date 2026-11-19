import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { renderMarkdown } from "@/lib/blog";

export function MarkdownEditor({
  value,
  onChange,
  rows = 14,
  placeholder = "Write in Markdown...",
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const [tab, setTab] = useState("write");
  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="write">Write</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="write">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="font-mono text-sm"
        />
      </TabsContent>
      <TabsContent value="preview">
        <div
          className="prose prose-sm max-w-none border border-line rounded-md p-4 bg-muted/30 min-h-[300px]"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value || "*Nothing to preview*") }}
        />
      </TabsContent>
    </Tabs>
  );
}
