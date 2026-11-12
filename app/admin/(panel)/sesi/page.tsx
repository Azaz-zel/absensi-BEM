import { redirect } from "next/navigation";

// Old /admin/sesi links: piket and proker now have their own lists.
export default async function SesiPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind } = await searchParams;
  redirect(kind === "proker" ? "/admin/sesi/proker" : "/admin/sesi/piket");
}
