import { DocumentDetailClient } from "@/components/document/DocumentDetailClient";

export default function DocumentPage({ params }: { params: { id: string } }) {
  return <DocumentDetailClient id={Number(params.id)} />;
}

