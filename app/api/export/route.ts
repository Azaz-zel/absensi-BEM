import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasServiceRole } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(request: Request) {
  if (!hasServiceRole) {
    return NextResponse.json({ message: "Supabase belum dikonfigurasi." }, { status: 503 });
  }

  const ctx = await getAdminContext();
  if (ctx.mode !== "admin") {
    return NextResponse.json({ message: "Tidak punya akses." }, { status: 401 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  const shift = url.searchParams.get("shift") ?? "all";
  const kind = url.searchParams.get("kind") ?? "all";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json({ message: "Rentang tanggal tidak valid." }, { status: 400 });
  }

  const db = createSupabaseAdminClient();

  let query = db
    .from("sessions")
    .select(
      "id, kind, date, shift, proker_name, location, status, session_people(people(full_name, nim), ministries(name)), submissions(submitter_name, created_at)",
    )
    .is("deleted_at", null)
    .gte("date", from)
    .lte("date", to)
    .order("date");

  if (kind === "piket" || kind === "proker") query = query.eq("kind", kind);
  if (kind !== "proker" && (shift === "pagi" || shift === "sore")) {
    query = query.eq("shift", shift);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  type Row = {
    id: string;
    kind: "piket" | "proker";
    date: string;
    shift: string | null;
    proker_name: string | null;
    location: string | null;
    status: string;
    session_people: Array<{
      people: { full_name: string; nim: string | null } | null;
      ministries: { name: string } | null;
    }>;
    submissions: Array<{
      submitter_name: string;
      created_at: string;
    }>;
  };

  const lines: string[] = [
    [
      "Tanggal",
      "Jenis",
      "Proker",
      "Shift",
      "Lokasi",
      "Status sesi",
      "Nama",
      "NIM",
      "Kementerian",
      "Pengabsen",
    ].join(","),
  ];

  for (const session of (data ?? []) as unknown as Row[]) {
    const submitter = session.submissions[0];
    for (const attendance of session.session_people) {
      lines.push(
        [
          session.date,
          session.kind === "proker" ? "Proker" : "Piket",
          session.proker_name ?? "",
          session.shift ?? "",
          session.location ?? "",
          session.status,
          attendance.people?.full_name ?? "",
          attendance.people?.nim ?? "",
          attendance.ministries?.name ?? "",
          submitter?.submitter_name ?? "",
        ]
          .map(csvCell)
          .join(","),
      );
    }
  }

  // BOM so Excel reads UTF-8 correctly.
  const body = `\uFEFF${lines.join("\r\n")}`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="absen_${from}_${to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
