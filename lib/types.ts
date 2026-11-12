export type Shift = "pagi" | "sore";

export type SessionKind = "piket" | "proker";

export type SessionStatus = "self_reported" | "verified";

export type PersonSource = "seed" | "admin" | "pending";

export type OfficerRole = "menteri" | "wakil_menteri";

export type Ministry = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type Person = {
  id: string;
  full_name: string;
  nim: string | null;
  ministry_id: string | null;
  source: PersonSource;
  is_active: boolean;
};

export type AttendeeInput = {
  personId: string | null;
  name: string;
  ministryId: string | null;
};

export type SessionRow = {
  id: string;
  kind: SessionKind;
  date: string;
  shift: Shift | null;
  proker_name: string | null;
  location: string | null;
  notes: string | null;
  status: SessionStatus;
  created_at: string;
  people_count: number;
  photo_path: string | null;
  ministries: string[];
};

export type SubmissionRow = {
  id: string;
  submitter_name: string;
  photo_path: string | null;
  created_at: string;
  status: SessionStatus;
};

export type PersonRank = {
  person_id: string;
  name: string;
  ministry: string | null;
  count: number;
};

export type MinistryRank = {
  ministry_id: string;
  name: string;
  count: number;
};

export type DayCount = {
  date: string;
  count: number;
};

export type DashboardData = {
  totalSessions: number;
  totalAttendance: number;
  totalPeople: number;
  verifiedSessions: number;
  topPeople: PersonRank[];
  topMinistries: MinistryRank[];
  daily: DayCount[];
  recent: SessionRow[];
  demo: boolean;
};

/** Menteri / wakil menteri yang boleh mengisi absen proker. */
export type ProkerOfficer = {
  userId: string;
  name: string;
  email: string | null;
  ministryId: string;
  ministryName: string | null;
  role: OfficerRole;
};
