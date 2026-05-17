import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../AuthContext";

const API_BASE =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

const PAYMENT_FREQUENCIES = [
  "daily",
  "weekly",
  "monthly",
  "bimonthly",
  "quarterly",
  "quadrimestral",
  "semiannual",
  "annually",
] as const;

export type SiItemRow = {
  id: string;
  type: string;
  subType: string | null;
  paymentFrequency: string;
  amount: number;
  notifyCancel: boolean;
  notifyRenew: boolean;
  notifyPay: boolean;
  notifyCancelDate: string | null;
  notifyRenewDate: string | null;
  notifyPayDate: string | null;
};

type FormState = {
  type: "bill" | "subscription";
  subType: string;
  paymentFrequency: (typeof PAYMENT_FREQUENCIES)[number];
  amount: string;
  notifyCancel: boolean;
  notifyRenew: boolean;
  notifyPay: boolean;
  notifyCancelDate: string;
  notifyRenewDate: string;
  notifyPayDate: string;
};

type ModalMode = { kind: "create" } | { kind: "edit"; id: string };

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function initialForm(): FormState {
  return {
    type: "bill",
    subType: "",
    paymentFrequency: "monthly",
    amount: "",
    notifyCancel: false,
    notifyRenew: false,
    notifyPay: false,
    notifyCancelDate: "",
    notifyRenewDate: "",
    notifyPayDate: "",
  };
}

function rowToForm(row: SiItemRow): FormState {
  return {
    type: row.type as "bill" | "subscription",
    subType: row.subType ?? "",
    paymentFrequency: row.paymentFrequency as FormState["paymentFrequency"],
    amount: String(row.amount),
    notifyCancel: row.notifyCancel,
    notifyRenew: row.notifyRenew,
    notifyPay: row.notifyPay,
    notifyCancelDate: row.notifyCancelDate
      ? row.notifyCancelDate.slice(0, 16)
      : "",
    notifyRenewDate: row.notifyRenewDate
      ? row.notifyRenewDate.slice(0, 16)
      : "",
    notifyPayDate: row.notifyPayDate ? row.notifyPayDate.slice(0, 16) : "",
  };
}

// ── Icons ────────────────────────────────────────────────────────────────────

function IconHome({ cls }: { cls?: string }) {
  return (
    <svg
      className={cls}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  );
}

function IconPencil({ cls }: { cls?: string }) {
  return (
    <svg
      className={cls}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash({ cls }: { cls?: string }) {
  return (
    <svg
      className={cls}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function IconPlus({ cls }: { cls?: string }) {
  return (
    <svg
      className={cls}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// ── Badges ───────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    bill: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    subscription: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  };
  const cls =
    styles[type] ?? "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}
    >
      {type}
    </span>
  );
}

function FreqBadge({ freq }: { freq: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 capitalize">
      {freq}
    </span>
  );
}

function NotifyPills({
  cancel,
  renew,
  pay,
}: {
  cancel: boolean;
  renew: boolean;
  pay: boolean;
}) {
  if (!cancel && !renew && !pay)
    return <span className="text-gray-300 text-xs select-none">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {cancel && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-red-50 text-red-600">
          cancel
        </span>
      )}
      {renew && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700">
          renew
        </span>
      )}
      {pay && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-purple-50 text-purple-700">
          pay
        </span>
      )}
    </div>
  );
}

// ── Form field helpers ────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 transition";

const labelCls = "block text-xs font-medium text-gray-600 mb-1.5";

function DateTimeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  if (!value) {
    return (
      <button
        type="button"
        onClick={() => {
          const d = new Date();
          d.setHours(12, 0, 0, 0);
          onChange(d.toISOString().slice(0, 16));
        }}
        className="w-full flex items-center px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-400 hover:bg-gray-50 transition-colors"
      >
        Set date &amp; time
      </button>
    );
  }
  return (
    <input
      type="datetime-local"
      step="300"
      className={inputCls}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ItemsApp() {
  const { getToken } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  const [items, setItems] = useState<SiItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(initialForm());
  const [modalMode, setModalMode] = useState<ModalMode>({ kind: "create" });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SiItemRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Data loading ────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setListError(null);
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.text()) || res.statusText);
      const data = (await res.json()) as SiItemRow[];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load items");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Dialog helpers ──────────────────────────────────────────────────────────

  function openCreate() {
    setModalMode({ kind: "create" });
    setForm(initialForm());
    setSubmitError(null);
    dialogRef.current?.showModal();
  }

  function openEdit(row: SiItemRow) {
    setModalMode({ kind: "edit", id: row.id });
    setForm(rowToForm(row));
    setSubmitError(null);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  function openDeleteConfirm(row: SiItemRow) {
    setDeleteTarget(row);
    deleteDialogRef.current?.showModal();
  }

  function closeDeleteDialog() {
    deleteDialogRef.current?.close();
    setDeleteTarget(null);
  }

  // ── Submit (create / update) ────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      setSubmitError("Enter a valid non-negative amount.");
      return;
    }

    const payload = {
      type: form.type,
      subType: form.subType.trim() || null,
      paymentFrequency: form.paymentFrequency,
      amount,
      notifyCancel: form.notifyCancel,
      notifyRenew: form.notifyRenew,
      notifyPay: form.notifyPay,
      notifyCancelDate: form.notifyCancelDate || null,
      notifyRenewDate: form.notifyRenewDate || null,
      notifyPayDate: form.notifyPayDate || null,
    };

    setSubmitting(true);
    try {
      const isEdit = modalMode.kind === "edit";
      const url = isEdit
        ? `${API_BASE}/items/${modalMode.id}`
        : `${API_BASE}/items`;
      const token = await getToken();
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = res.statusText;
        try {
          const body = JSON.parse(text) as { message?: string | string[] };
          msg =
            typeof body.message === "string"
              ? body.message
              : Array.isArray(body.message)
                ? body.message.join(", ")
                : text;
        } catch {
          msg = text || msg;
        }
        throw new Error(msg);
      }
      closeDialog();
      await load();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/items/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.text()) || res.statusText);
      closeDeleteDialog();
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Header */}
        <header className="px-8 pt-8 pb-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Items
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Manage your bills and subscriptions
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all"
          >
            <IconPlus cls="w-4 h-4" />
            New Item
          </button>
        </header>

        {/* Table card */}
        <div className="flex-1 px-8 pb-8 overflow-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/70 overflow-hidden min-h-[200px]">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <span className="text-sm text-gray-400">Loading…</span>
              </div>
            ) : listError ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <p className="text-sm text-red-500">{listError}</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-1">
                <p className="text-sm font-medium text-gray-600">
                  No items yet
                </p>
                <p className="text-xs text-gray-400">
                  Create a bill or subscription to get started
                </p>
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-3 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
                >
                  Create your first item →
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/80">
                        <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Subtype
                        </th>
                        <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Frequency
                        </th>
                        <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">
                          Amount
                        </th>
                        <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Notifications
                        </th>
                        <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {items.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-blue-50/30 transition-colors group"
                        >
                          <td className="px-5 py-3.5">
                            <TypeBadge type={row.type} />
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm text-gray-800 font-medium">
                              {row.subType ?? (
                                <span className="text-gray-300 font-normal">
                                  —
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <FreqBadge freq={row.paymentFrequency} />
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="text-sm font-semibold text-gray-900 tabular-nums">
                              {formatMoney(row.amount)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <NotifyPills
                              cancel={row.notifyCancel}
                              renew={row.notifyRenew}
                              pay={row.notifyPay}
                            />
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEdit(row)}
                                title="Edit"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                              >
                                <IconPencil cls="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteConfirm(row)}
                                title="Delete"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <IconTrash cls="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {items.length} {items.length === 1 ? "item" : "items"} total
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

      {/* ── Create / Edit dialog ─────────────────────────────────────────────── */}
      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl border border-gray-200/60 bg-white p-0 shadow-2xl backdrop:bg-black/40"
        onClose={() => setSubmitError(null)}
      >
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col">
          {/* Dialog header */}
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-[17px] font-semibold text-gray-900">
              {modalMode.kind === "edit" ? "Edit item" : "New item"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {modalMode.kind === "edit"
                ? "Update this bill or subscription."
                : "Add a new bill or subscription."}
            </p>
          </div>

          {/* Dialog body */}
          <div className="max-h-[min(70vh,32rem)] space-y-4 overflow-y-auto px-6 py-5">
            {/* Type */}
            <div>
              <label className={labelCls}>Type</label>
              <select
                className={inputCls}
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as FormState["type"],
                  }))
                }
              >
                <option value="bill">Bill</option>
                <option value="subscription">Subscription</option>
              </select>
            </div>

            {/* Subtype */}
            <div>
              <label className={labelCls}>
                Subtype{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                className={inputCls}
                value={form.subType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subType: e.target.value }))
                }
                placeholder="e.g. Netflix, Utilities"
              />
            </div>

            {/* Frequency */}
            <div>
              <label className={labelCls}>Payment frequency</label>
              <select
                className={inputCls}
                value={form.paymentFrequency}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    paymentFrequency:
                      e.target.value as FormState["paymentFrequency"],
                  }))
                }
              >
                {PAYMENT_FREQUENCIES.map((freq) => (
                  <option key={freq} value={freq}>
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className={labelCls}>Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  required
                  className={`${inputCls} pl-7`}
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Notifications */}
            <div>
              <p className={labelCls}>Notifications</p>
              <div className="space-y-2">
                {(
                  [
                    {
                      notifyKey: "notifyCancel" as const,
                      dateKey: "notifyCancelDate" as const,
                      label: "Cancel reminder",
                      buttonLabel: "Add cancel reminder",
                    },
                    {
                      notifyKey: "notifyRenew" as const,
                      dateKey: "notifyRenewDate" as const,
                      label: "Renewal notification",
                      buttonLabel: "Add renewal notification",
                    },
                    {
                      notifyKey: "notifyPay" as const,
                      dateKey: "notifyPayDate" as const,
                      label: "Payment notification",
                      buttonLabel: "Add payment notification",
                    },
                  ]
                ).map(({ notifyKey, dateKey, label, buttonLabel }) =>
                  form[notifyKey] ? (
                    <div
                      key={notifyKey}
                      className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-3 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">
                          {label}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              [notifyKey]: false,
                              [dateKey]: "",
                            }))
                          }
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      <DateTimeInput
                        value={form[dateKey]}
                        onChange={(v) =>
                          setForm((f) => ({ ...f, [dateKey]: v }))
                        }
                      />
                    </div>
                  ) : (
                    <button
                      key={notifyKey}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, [notifyKey]: true }))
                      }
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/40 transition-all"
                    >
                      <IconPlus cls="w-3.5 h-3.5 flex-shrink-0" />
                      {buttonLabel}
                    </button>
                  ),
                )}
              </div>
            </div>

            {submitError && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2.5">
                {submitError}
              </p>
            )}
          </div>

          {/* Dialog footer */}
          <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={closeDialog}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting
                ? "Saving…"
                : modalMode.kind === "edit"
                  ? "Save changes"
                  : "Create"}
            </button>
          </div>
        </form>
      </dialog>

      {/* ── Delete confirmation dialog ──────────────────────────────────────── */}
      <dialog
        ref={deleteDialogRef}
        className="w-full max-w-sm rounded-2xl border border-gray-200/60 bg-white p-0 shadow-2xl backdrop:bg-black/40"
        onClose={() => setDeleteTarget(null)}
      >
        <div className="p-6">
          <h3 className="text-[17px] font-semibold text-gray-900">
            Delete item?
          </h3>
          <p className="mt-1.5 text-sm text-gray-500">
            {deleteTarget
              ? `This will permanently delete ${
                  deleteTarget.subType
                    ? `"${deleteTarget.subType}"`
                    : `this ${deleteTarget.type}`
                }. This action cannot be undone.`
              : "This action cannot be undone."}
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={closeDeleteDialog}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
