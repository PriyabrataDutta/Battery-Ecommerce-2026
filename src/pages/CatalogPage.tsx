import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { listCatalogFiles } from "@/api/catalogs";
import { FileText, Download, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CatalogPage = () => {
  const { data: files = [], isLoading } = useQuery({
    queryKey: ["catalog-files"],
    queryFn: listCatalogFiles,
    staleTime: 5 * 60_000,
  });

  return (
    <>
      <Helmet>
        <title>Catalogs & Price Lists — Kachi Batteries</title>
        <meta name="description" content="Download battery catalogs, price lists and product datasheets from Kachi Batteries." />
      </Helmet>

      <div className="container-x py-12">
        <h1 className="font-display-tight text-4xl font-bold">Catalogs & Price Lists</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Download product brochures, datasheets and current price lists from our partner brands.
        </p>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-line p-6 animate-pulse space-y-3">
                <div className="h-10 w-10 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="mt-12 border border-dashed border-line p-12 text-center text-muted-foreground">
            <FolderOpen className="h-10 w-10 mx-auto mb-3 text-muted" />
            No catalogs uploaded yet. Contact us for current price lists.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {files.map((file) => (
              <div key={file.id} className="bg-white border border-line p-6 flex flex-col">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded bg-primary/10 text-primary grid place-items-center flex-shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold text-sm text-ink truncate">{file.title}</h3>
                    {file.category && (
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {file.category}
                      </span>
                    )}
                  </div>
                </div>
                {file.description && (
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{file.description}</p>
                )}
                <div className="mt-auto pt-4 flex items-center justify-between">
                  {file.size_bytes ? (
                    <span className="text-xs text-muted-foreground">{formatBytes(file.size_bytes)}</span>
                  ) : <span />}
                  <Button asChild size="sm" variant="outline">
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default CatalogPage;
