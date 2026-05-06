import Link from "next/link";
import type { DocumentListItem } from "@/lib/types";
import { formatDate, statusTone, truncate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function DocumentCard({ document }: { document: DocumentListItem }) {
  return (
    <Link href={`/document/${document.id}`}>
      <Card interactive compact>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3>{document.title}</h3>
          <StatusBadge status={document.status} tone={statusTone(document.status)} />
        </div>
        <p className="muted">{truncate(document.summary || document.filename, 180)}</p>
        <div className="row">
          {document.tags.slice(0, 5).map((tag) => (
            <StatusBadge key={tag} status={tag} />
          ))}
        </div>
        <small className="muted">{formatDate(document.updated_at)}</small>
      </Card>
    </Link>
  );
}
