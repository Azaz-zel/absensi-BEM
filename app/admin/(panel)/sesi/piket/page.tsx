import { SessionsView, type SessionsSearch } from "@/components/admin/sessions-view";

export const metadata = { title: "Sesi Piket — Absen Piket" };
export const dynamic = "force-dynamic";

export default function SesiPiketPage({
  searchParams,
}: {
  searchParams: SessionsSearch;
}) {
  return <SessionsView kind="piket" searchParams={searchParams} />;
}
