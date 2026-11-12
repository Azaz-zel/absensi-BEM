import { Badge } from "@/components/ui";
import type { SessionStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: SessionStatus }) {
  return status === "verified" ? (
    <Badge tone="success">Terverifikasi</Badge>
  ) : (
    <Badge tone="warn">Menunggu</Badge>
  );
}
