"use client";
import {
  ArrowUpRight,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import type { LeaveRequest, LeaveStatus, LeaveType, User } from "@/lib/types";
import { dayCount, formatDate } from "@/lib/utils";

type Props = { initialUsers: User[]; initialLeaves: LeaveRequest[] };
type Draft = {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
};
const emptyDraft: Draft = {
  type: "Annual leave",
  startDate: "",
  endDate: "",
  reason: "",
};
const statusLabel: Record<LeaveStatus, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};
const typeLabels: LeaveType[] = [
  "Annual leave",
  "Sick leave",
  "Personal leave",
  "Maternity/paternity leave",
];
function overlaps(a: LeaveRequest, b: LeaveRequest) {
  return (
    a.id !== b.id &&
    a.userId !== b.userId &&
    a.status !== "rejected" &&
    b.status !== "rejected" &&
    a.startDate <= b.endDate &&
    b.startDate <= a.endDate
  );
}
export default function LeaveDashboard({ initialUsers, initialLeaves }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [leaves, setLeaves] = useState(initialLeaves);
  const [actorId, setActorId] = useState("u-employee-a");
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<LeaveRequest | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const actor = users.find((u) => u.id === actorId) ?? users[0]!;
  const isReviewer = actor.role === "admin" || actor.role === "manager";
  const visibleLeaves = useMemo(
    () =>
      leaves.filter(
        (l) =>
          (isReviewer || l.userId === actorId) &&
          (statusFilter === "all" || l.status === statusFilter) &&
          ((users.find((u) => u.id === l.userId)?.name ?? "")
            .toLowerCase()
            .includes(query.toLowerCase()) ||
            l.reason.toLowerCase().includes(query.toLowerCase()) ||
            (l.reviewNote ?? "").toLowerCase().includes(query.toLowerCase()) ||
            l.type.toLowerCase().includes(query.toLowerCase())),
      ),
    [leaves, actorId, isReviewer, statusFilter, query, users],
  );
  const pending = leaves.filter((l) => l.status === "pending").length;
  const approved = leaves.filter((l) => l.status === "approved").length;
  const activeToday = leaves.filter(
    (l) =>
      l.status === "approved" &&
      l.startDate <= new Date().toISOString().slice(0, 10) &&
      l.endDate >= new Date().toISOString().slice(0, 10),
  ).length;
  const conflictList = (start: string, end: string, excludeId?: string) =>
    leaves.filter(
      (l) =>
        l.id !== excludeId &&
        l.userId !== actorId &&
        l.status !== "rejected" &&
        start &&
        end &&
        start <= l.endDate &&
        l.startDate <= end,
    );
  const conflicts = conflictList(draft.startDate, draft.endDate, editing?.id);
  async function refresh() {
    const res = await fetch("/api/leaves", { cache: "no-store" });
    const data = await res.json();
    setLeaves(data.leaves);
    setUsers(data.users);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!draft.startDate || !draft.endDate || draft.endDate < draft.startDate) {
      setError("Pastikan rentang tanggal pengajuan sudah benar.");
      return;
    }
    setBusy(true);
    try {
      const url = editing ? `/api/leaves/${editing.id}` : "/api/leaves";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editing
            ? { ...draft, action: "update", actorId }
            : { ...draft, userId: actorId },
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Pengajuan gagal disimpan.");
      await refresh();
      setModal(false);
      setEditing(null);
      setDraft(emptyDraft);
      setNotice(
        editing
          ? "Pengajuan berhasil diperbarui."
          : "Pengajuan cuti berhasil dikirim.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }
  function openCreate() {
    setEditing(null);
    setDraft(emptyDraft);
    setError("");
    setModal(true);
  }
  function openEdit(item: LeaveRequest) {
    setEditing(item);
    setDraft({
      type: item.type,
      startDate: item.startDate,
      endDate: item.endDate,
      reason: item.reason,
    });
    setError("");
    setModal(true);
  }
  async function mutate(id: string, action: "delete" | "approve" | "reject") {
    const item = leaves.find((l) => l.id === id);
    if (!item) return;
    if (action === "delete" && !window.confirm("Hapus pengajuan cuti ini?"))
      return;
    setError("");
    const res = await fetch(`/api/leaves/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, actorId, reviewNote }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message ?? "Aksi gagal.");
      return;
    }
    await refresh();
    setReviewId(null);
    setReviewNote("");
    setNotice(
      action === "delete"
        ? "Pengajuan dihapus."
        : action === "approve"
          ? "Pengajuan disetujui."
          : "Pengajuan ditolak.",
    );
  }
  const nav: { id: string; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    {
      id: "requests",
      label: isReviewer ? "Semua pengajuan" : "Pengajuan saya",
      icon: FileCheck2,
    },
    ...(isReviewer
      ? [{ id: "report", label: "Laporan cuti", icon: CalendarRange }]
      : []),
  ];
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <CalendarDays size={21} />
          </div>
          <div>
            <strong>leaveflow</strong>
            <span>PEOPLE OPERATIONS</span>
          </div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list">
          {nav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${tab === item.id ? "active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.id === "requests" && pending > 0 && isReviewer ? (
                <i className="nav-count">{pending}</i>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <ShieldCheck size={18} />
            </div>
            <strong>Leave, made simple.</strong>
            <p>Kelola waktu istirahat tim dengan lebih teratur.</p>
          </div>
          <div className="profile-mini">
            <div className="avatar">{actor.avatar}</div>
            <div className="profile-info">
              <strong>{actor.name}</strong>
              <span>
                {actor.role === "admin"
                  ? "Administrator"
                  : actor.role === "manager"
                    ? "Manager / Atasan"
                    : actor.department}
              </span>
            </div>
            <button
              className="icon-button"
              aria-label="Keluar"
              onClick={() => setActorId("u-employee-a")}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            Workspace <span>/</span>{" "}
            <strong>
              {nav.find((n) => n.id === tab)?.label ?? "Overview"}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="demo-pill">
              <span /> DEMO MODE
            </span>
            <label className="user-switch">
              <span>Masuk sebagai</span>
              <select
                value={actorId}
                onChange={(e) => {
                  setActorId(e.target.value);
                  setTab("overview");
                  setStatusFilter("all");
                  setNotice("");
                  setError("");
                }}
                aria-label="Pilih user demo"
              >
                {users.map((u) => (
                  <option value={u.id} key={u.id}>
                    {u.name} · {u.role}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>
            <div className="avatar top-avatar">{actor.avatar}</div>
          </div>
        </header>
        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                TUESDAY, 20 OCTOBER 2026 <span>•</span> PEOPLE & CULTURE
              </div>
              <h1>
                {tab === "overview"
                  ? "Good afternoon"
                  : tab === "requests"
                    ? isReviewer
                      ? "Leave requests"
                      : "My leave requests"
                    : "Leave report"}
                <span>
                  {tab === "overview" ? `, ${actor.name.split(" ")[0]}.` : ""}
                </span>
              </h1>
              <p>
                {tab === "overview"
                  ? "Ringkasan cuti dan aktivitas tim Anda hari ini."
                  : tab === "requests"
                    ? "Pantau status, kelola, dan tinjau pengajuan cuti."
                    : "Gambaran singkat penggunaan cuti karyawan."}
              </p>
            </div>
            {actor.role === "employee" && (
              <button className="button button-primary" onClick={openCreate}>
                <Plus size={17} /> Ajukan cuti
              </button>
            )}
          </div>
          {notice && (
            <div className="notice success">
              <Check size={16} />
              {notice}
              <button
                onClick={() => setNotice("")}
                aria-label="Tutup notifikasi"
              >
                <X size={15} />
              </button>
            </div>
          )}
          {error && !modal && (
            <div className="notice danger">
              <CircleAlert size={16} />
              {error}
              <button
                onClick={() => setError("")}
                aria-label="Tutup notifikasi"
              >
                <X size={15} />
              </button>
            </div>
          )}
          {tab === "overview" && (
            <>
              <div className="stats-grid">
                <Stat
                  icon={<Users size={19} />}
                  label="Total karyawan"
                  value={String(
                    users.filter((u) => u.role === "employee").length,
                  )}
                  foot="Karyawan terdaftar"
                  tone="blue"
                />
                <Stat
                  icon={<Clock3 size={19} />}
                  label="Menunggu persetujuan"
                  value={String(pending)}
                  foot="Perlu ditinjau"
                  tone="orange"
                />
                <Stat
                  icon={<FileCheck2 size={19} />}
                  label="Cuti disetujui"
                  value={String(approved)}
                  foot="Total pengajuan"
                  tone="green"
                />
                <Stat
                  icon={<CalendarDays size={19} />}
                  label="Cuti hari ini"
                  value={String(activeToday)}
                  foot="Karyawan sedang cuti"
                  tone="purple"
                />
              </div>
              <div className="overview-grid">
                <section className="panel request-panel">
                  <div className="panel-header">
                    <div>
                      <h2>
                        {isReviewer ? "Pengajuan terbaru" : "Pengajuan saya"}
                      </h2>
                      <p>
                        {isReviewer
                          ? "Aktivitas pengajuan cuti terbaru"
                          : "Pantau status permohonan cuti Anda"}
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setTab("requests")}
                    >
                      Lihat semua <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <div className="request-list">
                    {(isReviewer
                      ? [...leaves]
                          .sort((a, b) =>
                            b.createdAt.localeCompare(a.createdAt),
                          )
                          .slice(0, 4)
                      : leaves
                          .filter((l) => l.userId === actorId)
                          .sort((a, b) =>
                            b.createdAt.localeCompare(a.createdAt),
                          )
                          .slice(0, 4)
                    ).map((l) => (
                      <RequestRow
                        key={l.id}
                        item={l}
                        user={users.find((u) => u.id === l.userId)!}
                        onReview={() => {
                          setTab("requests");
                          setReviewId(l.id);
                        }}
                        onEdit={() => openEdit(l)}
                        onDelete={() => mutate(l.id, "delete")}
                        canEdit={
                          actor.role === "employee" &&
                          l.userId === actorId &&
                          l.status === "pending"
                        }
                        canReview={isReviewer && l.status === "pending"}
                      />
                    ))}
                    {leaves.filter((l) => isReviewer || l.userId === actorId)
                      .length === 0 && (
                      <EmptyState text="Belum ada pengajuan cuti." />
                    )}
                  </div>
                </section>
                <section className="panel calendar-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Kalender cuti</h2>
                      <p>Jadwal cuti yang telah disetujui</p>
                    </div>
                    <div className="calendar-symbol">
                      <CalendarDays size={18} />
                    </div>
                  </div>
                  <div className="calendar-summary">
                    <div className="calendar-summary-number">
                      {
                        leaves.filter(
                          (l) =>
                            l.status === "approved" &&
                            l.endDate >= new Date().toISOString().slice(0, 10),
                        ).length
                      }
                    </div>
                    <div>
                      <strong>Jadwal mendatang</strong>
                      <span>Pengajuan disetujui</span>
                    </div>
                  </div>
                  <div className="upcoming-list">
                    {leaves
                      .filter(
                        (l) =>
                          l.status === "approved" &&
                          l.endDate >= new Date().toISOString().slice(0, 10),
                      )
                      .sort((a, b) => a.startDate.localeCompare(b.startDate))
                      .slice(0, 3)
                      .map((l) => (
                        <div className="upcoming-item" key={l.id}>
                          <div className="date-chip">
                            <strong>
                              {new Date(`${l.startDate}T00:00:00`).getDate()}
                            </strong>
                            <span>
                              {new Date(
                                `${l.startDate}T00:00:00`,
                              ).toLocaleDateString("id-ID", { month: "short" })}
                            </span>
                          </div>
                          <div className="upcoming-copy">
                            <strong>
                              {users.find((u) => u.id === l.userId)?.name}
                            </strong>
                            <span>
                              {l.type} · {dayCount(l.startDate, l.endDate)} hari
                            </span>
                          </div>
                          <span className="upcoming-dot" />
                        </div>
                      ))}
                    {leaves.filter(
                      (l) =>
                        l.status === "approved" &&
                        l.endDate >= new Date().toISOString().slice(0, 10),
                    ).length === 0 && (
                      <EmptyState text="Belum ada jadwal cuti mendatang." />
                    )}
                  </div>
                  <div className="panel-footer">
                    <span className="legend-dot" /> Cuti disetujui{" "}
                    <span className="legend-note">Data prototype</span>
                  </div>
                </section>
              </div>
              <div className="bottom-banner">
                <div className="banner-icon">
                  <CircleAlert size={19} />
                </div>
                <div>
                  <strong>Jaga koordinasi tim tetap lancar</strong>
                  <p>
                    Periksa notifikasi bentrok sebelum mengajukan cuti, agar
                    operasional tim tetap berjalan.
                  </p>
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    setTab("requests");
                    setStatusFilter("pending");
                  }}
                >
                  Periksa pengajuan <ArrowUpRight size={15} />
                </button>
              </div>
            </>
          )}
          {tab === "requests" && (
            <section className="panel table-panel">
              <div className="table-toolbar">
                <div className="search-box">
                  <Search size={16} />
                  <input
                    placeholder="Cari nama, jenis cuti, alasan..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Semua status</option>
                  <option value="pending">Menunggu</option>
                  <option value="approved">Disetujui</option>
                  <option value="rejected">Ditolak</option>
                </select>
                {actor.role === "employee" && (
                  <button
                    className="button button-primary compact"
                    onClick={openCreate}
                  >
                    <Plus size={16} /> Ajukan
                  </button>
                )}
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {isReviewer && <th>Karyawan</th>}
                      <th>Jenis cuti</th>
                      <th>Tanggal</th>
                      <th>Durasi</th>
                      <th>Status</th>
                      <th>Alasan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleLeaves.map((l) => (
                      <tr key={l.id}>
                        {isReviewer && (
                          <td>
                            <div className="table-user">
                              <span className="avatar small">
                                {users.find((u) => u.id === l.userId)?.avatar}
                              </span>
                              <div>
                                <strong>
                                  {users.find((u) => u.id === l.userId)?.name}
                                </strong>
                                <small>
                                  {
                                    users.find((u) => u.id === l.userId)
                                      ?.department
                                  }
                                </small>
                              </div>
                            </div>
                          </td>
                        )}
                        <td>
                          <span className="type-cell">{l.type}</span>
                        </td>
                        <td>
                          <span className="date-cell">
                            {formatDate(l.startDate)}
                          </span>
                          <small className="date-end">
                            s/d {formatDate(l.endDate)}
                          </small>
                        </td>
                        <td>{dayCount(l.startDate, l.endDate)} hari</td>
                        <td>
                          <Status status={l.status} />
                        </td>
                        <td>
                          <span className="reason-cell" title={l.reason}>
                            {l.reason}
                          </span>
                          {l.status === "rejected" && l.reviewNote?.trim() && (
                            <div className="review-note-display">
                              <strong>Alasan penolakan</strong>
                              <span>{l.reviewNote}</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="actions">
                            {actor.role === "employee" &&
                              l.userId === actorId &&
                              l.status === "pending" && (
                                <>
                                  <button
                                    className="icon-button"
                                    title="Edit pengajuan"
                                    onClick={() => openEdit(l)}
                                  >
                                    <Pencil size={15} />
                                  </button>
                                  <button
                                    className="icon-button danger-icon"
                                    title="Hapus pengajuan"
                                    onClick={() => mutate(l.id, "delete")}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </>
                              )}
                            {isReviewer && l.status === "pending" && (
                              <button
                                className="button button-outline compact"
                                onClick={() => {
                                  setReviewId(reviewId === l.id ? null : l.id);
                                  setReviewNote("");
                                }}
                              >
                                Tinjau
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {visibleLeaves.length === 0 && (
                      <tr>
                        <td colSpan={isReviewer ? 7 : 6}>
                          <EmptyState text="Tidak ada pengajuan yang cocok." />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {reviewId && (
                <div className="review-bar">
                  <div>
                    <strong>Catatan peninjauan (opsional)</strong>
                    <input
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Tambahkan catatan untuk karyawan..."
                    />
                  </div>
                  <div className="review-actions">
                    <button
                      className="button button-danger"
                      onClick={() => mutate(reviewId, "reject")}
                    >
                      <X size={15} /> Tolak
                    </button>
                    <button
                      className="button button-primary"
                      onClick={() => mutate(reviewId, "approve")}
                    >
                      <Check size={15} /> Setujui
                    </button>
                  </div>
                </div>
              )}
              <div className="table-foot">
                Menampilkan <strong>{visibleLeaves.length}</strong> pengajuan{" "}
                <span>•</span> Data tersimpan pada JSON lokal
              </div>
            </section>
          )}
          {tab === "report" && (
            <>
              <div className="stats-grid">
                <Stat
                  icon={<Users size={19} />}
                  label="Total karyawan"
                  value={String(
                    users.filter((u) => u.role === "employee").length,
                  )}
                  foot="Karyawan aktif pada demo"
                  tone="blue"
                />
                <Stat
                  icon={<FileCheck2 size={19} />}
                  label="Total pengajuan"
                  value={String(leaves.length)}
                  foot="Semua status"
                  tone="purple"
                />
                <Stat
                  icon={<Check size={19} />}
                  label="Disetujui"
                  value={String(approved)}
                  foot="Cuti terkonfirmasi"
                  tone="green"
                />
                <Stat
                  icon={<Clock3 size={19} />}
                  label="Menunggu"
                  value={String(pending)}
                  foot="Belum ditinjau"
                  tone="orange"
                />
              </div>
              <section className="panel report-panel">
                <div className="panel-header">
                  <div>
                    <h2>Ringkasan per karyawan</h2>
                    <p>Jumlah pengajuan berdasarkan status</p>
                  </div>
                  <span className="report-label">LIVE REPORT</span>
                </div>
                <div className="report-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Karyawan</th>
                        <th>Departemen</th>
                        <th>Total pengajuan</th>
                        <th>Disetujui</th>
                        <th>Menunggu</th>
                        <th>Ditolak</th>
                        <th>Hari disetujui</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter((u) => u.role === "employee")
                        .map((u) => {
                          const own = leaves.filter((l) => l.userId === u.id);
                          const approvedDays = own
                            .filter((l) => l.status === "approved")
                            .reduce(
                              (sum, l) =>
                                sum + dayCount(l.startDate, l.endDate),
                              0,
                            );
                          return (
                            <tr key={u.id}>
                              <td>
                                <div className="table-user">
                                  <span className="avatar small">
                                    {u.avatar}
                                  </span>
                                  <strong>{u.name}</strong>
                                </div>
                              </td>
                              <td>{u.department}</td>
                              <td>{own.length}</td>
                              <td>
                                <span className="report-number green-text">
                                  {
                                    own.filter((l) => l.status === "approved")
                                      .length
                                  }
                                </span>
                              </td>
                              <td>
                                <span className="report-number orange-text">
                                  {
                                    own.filter((l) => l.status === "pending")
                                      .length
                                  }
                                </span>
                              </td>
                              <td>
                                <span className="report-number red-text">
                                  {
                                    own.filter((l) => l.status === "rejected")
                                      .length
                                  }
                                </span>
                              </td>
                              <td>{approvedDays} hari</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                <div className="report-note">
                  <CircleAlert size={16} />
                  <span>
                    Perhitungan hari berdasarkan seluruh pengajuan berstatus
                    disetujui, termasuk tanggal yang sudah lewat.
                  </span>
                </div>
              </section>
            </>
          )}
          <footer className="page-footer">
            <span>© 2026 Leaveflow Prototype</span>
            <span>
              <span className="footer-dot" /> Data demo · JSON storage
            </span>
          </footer>
        </div>
      </section>
      {modal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-heading">
              <div>
                <span className="modal-kicker">LEAVE REQUEST</span>
                <h2 id="modal-title">
                  {editing ? "Edit pengajuan cuti" : "Ajukan cuti baru"}
                </h2>
                <p>Isi detail tanggal dan alasan cuti Anda.</p>
              </div>
              <button
                className="icon-button"
                onClick={() => setModal(false)}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={save} className="leave-form">
              <div className="field">
                <label htmlFor="leave-type">Jenis cuti</label>
                <select
                  id="leave-type"
                  value={draft.type}
                  onChange={(e) =>
                    setDraft({ ...draft, type: e.target.value as LeaveType })
                  }
                >
                  {typeLabels.map((t) => (
                    <option value={t} key={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="date-fields">
                <DatePicker
                  label="Tanggal mulai"
                  value={draft.startDate}
                  onChange={(v) =>
                    setDraft({
                      ...draft,
                      startDate: v,
                      endDate:
                        draft.endDate && draft.endDate < v ? v : draft.endDate,
                    })
                  }
                />
                <DatePicker
                  label="Tanggal selesai"
                  value={draft.endDate}
                  minDate={draft.startDate || undefined}
                  onChange={(v) => setDraft({ ...draft, endDate: v })}
                />
              </div>
              {draft.startDate &&
                draft.endDate &&
                draft.endDate >= draft.startDate && (
                  <div className="duration-note">
                    <CalendarRange size={16} /> Durasi pengajuan{" "}
                    <strong>
                      {dayCount(draft.startDate, draft.endDate)} hari kalender
                    </strong>
                  </div>
                )}
              <div className="field">
                <label htmlFor="reason">Alasan cuti</label>
                <textarea
                  id="reason"
                  value={draft.reason}
                  onChange={(e) =>
                    setDraft({ ...draft, reason: e.target.value })
                  }
                  placeholder="Jelaskan alasan pengajuan cuti..."
                  minLength={3}
                  maxLength={500}
                  rows={3}
                  required
                />
                <span className="field-hint">Maksimal 500 karakter.</span>
              </div>
              {conflicts.length > 0 && (
                <div className="conflict-alert">
                  <div className="conflict-alert-icon">
                    <CircleAlert size={18} />
                  </div>
                  <div>
                    <strong>Potensi bentrok jadwal cuti</strong>
                    <p>
                      {conflicts.length} pengajuan karyawan lain memiliki
                      rentang tanggal yang beririsan. Periksa jadwal berikut
                      sebelum mengirim.
                    </p>
                    <div className="conflict-list">
                      {conflicts.slice(0, 3).map((c) => (
                        <div className="conflict-item" key={c.id}>
                          <span className="conflict-avatar">
                            {users.find((u) => u.id === c.userId)?.avatar}
                          </span>
                          <span>
                            <strong>
                              {users.find((u) => u.id === c.userId)?.name}
                            </strong>
                            <small>
                              {formatDate(c.startDate)} –{" "}
                              {formatDate(c.endDate)}
                            </small>
                          </span>
                          <Status status={c.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="form-error">
                  <CircleAlert size={15} />
                  {error}
                </div>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setModal(false)}
                >
                  Batal
                </button>
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={busy}
                >
                  {busy
                    ? "Menyimpan..."
                    : editing
                      ? "Simpan perubahan"
                      : "Kirim pengajuan"}
                  <ArrowUpRight size={16} />
                </button>
              </div>
              <p className="modal-footnote">
                Pengajuan akan berstatus <strong>Menunggu</strong> sampai
                ditinjau manager atau admin.
              </p>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
function Stat({
  icon,
  label,
  value,
  foot,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  foot: string;
  tone: string;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">
        <span className={`stat-indicator ${tone}`} />
        {foot}
      </div>
    </div>
  );
}
function Status({ status }: { status: LeaveStatus }) {
  return (
    <span className={`status-badge ${status}`}>
      <span />
      {statusLabel[status]}
    </span>
  );
}
function RequestRow({
  item,
  user,
  onReview,
  onEdit,
  onDelete,
  canEdit,
  canReview,
}: {
  item: LeaveRequest;
  user: User;
  onReview: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canReview: boolean;
}) {
  return (
    <div className="request-row">
      <div className="request-type-icon">
        <CalendarDays size={17} />
      </div>
      <div className="request-main">
        <strong>{user.name}</strong>
        <span>
          {item.type} · {formatDate(item.startDate)}
          {item.endDate !== item.startDate
            ? ` – ${formatDate(item.endDate)}`
            : ""}
        </span>
        {item.status === "rejected" && item.reviewNote?.trim() && (
          <small className="request-review-note">
            Alasan penolakan: {item.reviewNote}
          </small>
        )}
      </div>
      <Status status={item.status} />
      {canEdit && (
        <div className="row-actions">
          <button className="icon-button" aria-label="Edit" onClick={onEdit}>
            <Pencil size={14} />
          </button>
          <button
            className="icon-button danger-icon"
            aria-label="Hapus"
            onClick={onDelete}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
      {canReview && (
        <button className="text-button review-link" onClick={onReview}>
          Tinjau <ArrowUpRight size={14} />
        </button>
      )}
    </div>
  );
}
function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <CalendarDays size={20} />
      </div>
      <span>{text}</span>
    </div>
  );
}
