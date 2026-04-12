"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

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

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

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

const initialForm = (): FormState => ({
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
});

export function ItemsApp() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<SiItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setListError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/items`, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      const data = (await res.json()) as SiItemRow[];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load items");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openDialog() {
    setForm(initialForm());
    setSubmitError(null);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

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
      const res = await fetch(`${API_BASE}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = res.statusText;
        if (text) {
          try {
            const body = JSON.parse(text) as {
              message?: string | string[];
            };
            if (typeof body.message === "string") {
              msg = body.message;
            } else if (Array.isArray(body.message)) {
              msg = body.message.join(", ");
            } else {
              msg = text;
            }
          } catch {
            msg = text;
          }
        }
        throw new Error(msg);
      }
      closeDialog();
      await load();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Items</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            All rows from <code className="text-xs">SI_Items</code>. Add a bill
            or subscription below.
          </p>
        </div>
        <button
          type="button"
          onClick={openDialog}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white dark:focus-visible:outline-neutral-100"
        >
          New bill or subscription
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        {loading ? (
          <p className="p-6 text-sm text-neutral-600 dark:text-neutral-400">
            Loading…
          </p>
        ) : listError ? (
          <div className="p-6">
            <p className="text-sm text-red-600 dark:text-red-400">{listError}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 text-sm font-medium text-neutral-900 underline dark:text-neutral-100"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-neutral-600 dark:text-neutral-400">
            No items yet. Create a bill or subscription to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Subtype</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Notify</th>
                  <th className="px-4 py-3">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {items.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-white dark:bg-neutral-950/30"
                  >
                    <td className="px-4 py-3 capitalize">{row.type}</td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {row.subType ?? "—"}
                    </td>
                    <td className="px-4 py-3">{row.paymentFrequency}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(row.amount)}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">
                      {[
                        row.notifyCancel && "cancel",
                        row.notifyRenew && "renew",
                        row.notifyPay && "pay",
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td
                      className="max-w-[8rem] truncate px-4 py-3 font-mono text-xs text-neutral-500"
                      title={row.id}
                    >
                      {row.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-xl border border-neutral-200 bg-[var(--background)] p-0 text-[var(--foreground)] shadow-xl backdrop:bg-black/50 dark:border-neutral-800"
        onClose={() => setSubmitError(null)}
      >
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col">
          <div className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <h2 className="text-lg font-semibold">New item</h2>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              Creates a row in SI_Items (bill or subscription).
            </p>
          </div>

          <div className="max-h-[min(70vh,32rem)] space-y-4 overflow-y-auto px-6 py-4">
            <label className="block text-sm font-medium">
              Type
              <select
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
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
            </label>

            <label className="block text-sm font-medium">
              Subtype <span className="font-normal text-neutral-500">(optional)</span>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
                value={form.subType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subType: e.target.value }))
                }
                placeholder="e.g. Utilities"
              />
            </label>

            <label className="block text-sm font-medium">
              Payment frequency
              <select
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
                value={form.paymentFrequency}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    paymentFrequency: e.target.value as FormState["paymentFrequency"],
                  }))
                }
              >
                {PAYMENT_FREQUENCIES.map((freq) => (
                  <option key={freq} value={freq}>
                    {freq}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Amount (USD)
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                required
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm tabular-nums dark:border-neutral-700"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="0.00"
              />
            </label>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Notifications</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.notifyCancel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notifyCancel: e.target.checked }))
                  }
                />
                Notify cancel
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.notifyRenew}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notifyRenew: e.target.checked }))
                  }
                />
                Notify renew
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.notifyPay}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notifyPay: e.target.checked }))
                  }
                />
                Notify pay
              </label>
            </fieldset>

            <div className="space-y-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Optional reminder dates
              </p>
              <label className="block text-sm font-medium">
                Cancel notify
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
                  value={form.notifyCancelDate}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      notifyCancelDate: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="block text-sm font-medium">
                Renew notify
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
                  value={form.notifyRenewDate}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      notifyRenewDate: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="block text-sm font-medium">
                Pay notify
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
                  value={form.notifyPayDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notifyPayDate: e.target.value }))
                  }
                />
              </label>
            </div>

            {submitError ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                {submitError}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            >
              {submitting ? "Saving…" : "Create"}
            </button>
          </div>
        </form>
      </dialog>
    </main>
  );
}
