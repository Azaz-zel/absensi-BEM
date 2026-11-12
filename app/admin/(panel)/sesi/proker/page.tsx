import { SessionsView, type SessionsSearch } from "@/components/admin/sessions-view";

export const metadata = { title: "Sesi Proker — Absen Piket" };
export const dynamic = "force-dynamic";

export default function SesiProkerPage({
  searchParams,
}: {
  searchParams: SessionsSearch;
}) {
  return <SessionsView kind="proker" searchParams={searchParams} />;
}
