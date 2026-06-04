import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import type { SiItemRow } from "./app/app/items-app";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function currentMonthLabel() {
  return new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function isCurrentMonth(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

type BillCard = SiItemRow & { paid: boolean };

function BillCardView({
  bill,
  onToggle,
  onDragStart,
}: {
  bill: BillCard;
  onToggle: (id: string, paid: boolean) => void;
  onDragStart: (id: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(bill.id)}
      className="bg-white rounded-xl border border-gray-200/70 shadow-sm px-4 py-3.5 cursor-grab active:cursor-grabbing select-none hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {bill.subType ?? "Bill"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(bill.billingDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <span className="text-sm font-semibold text-gray-900 tabular-nums flex-shrink-0">
          {formatMoney(bill.amount)}
        </span>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => onToggle(bill.id, !bill.paid)}
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
            bill.paid
              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          {bill.paid ? "Mark Pending" : "Mark Paid"}
        </button>
      </div>
    </div>
  );
}

function Column({
  title,
  accent,
  bills,
  onToggle,
  onDragStart,
  onDrop,
}: {
  title: string;
  accent: string;
  bills: BillCard[];
  onToggle: (id: string, paid: boolean) => void;
  onDragStart: (id: string) => void;
  onDrop: (paid: boolean) => void;
}) {
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={() => { setOver(false); onDrop(title === "Paid"); }}
      className={`flex-1 flex flex-col min-w-0 rounded-2xl border transition-colors ${
        over ? "border-blue-300 bg-blue-50/40" : "border-gray-200/70 bg-gray-50/60"
      }`}
    >
      {/* Column header */}
      <div className="px-4 py-3 border-b border-gray-200/60 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${accent}`} />
        <span className="text-[13px] font-semibold text-gray-700">{title}</span>
        <span className="ml-auto text-xs text-gray-400 tabular-nums">
          {bills.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
        {bills.length === 0 ? (
          <p className="text-xs text-gray-400 text-center pt-6 select-none">
            {over ? "Drop here" : "No bills"}
          </p>
        ) : (
          bills.map((b) => (
            <BillCardView
              key={b.id}
              bill={b}
              onToggle={onToggle}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>

      {/* Column total */}
      {bills.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-200/60">
          <span className="text-xs text-gray-500 font-medium">
            Total:{" "}
            <span className="text-gray-800 tabular-nums">
              {formatMoney(bills.reduce((s, b) => s + b.amount, 0))}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

export function BoardPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<SiItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
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
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { void load(); }, [load]);

  async function togglePaid(id: string, paid: boolean) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, paid } : it)),
    );
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/items/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paid }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch {
      void load();
    }
  }

  function handleDrop(targetPaid: boolean) {
    if (dragId.current) {
      void togglePaid(dragId.current, targetPaid);
      dragId.current = null;
    }
  }

  const bills = items.filter(
    (it) => it.type === "bill" && it.paid !== null && isCurrentMonth(it.billingDate),
  ) as BillCard[];

  const pending = bills.filter((b) => !b.paid);
  const paid = bills.filter((b) => b.paid);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header className="px-8 pt-8 pb-5 flex-shrink-0">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Board</h1>
        <p className="mt-0.5 text-sm text-gray-500">{currentMonthLabel()}</p>
      </header>

      <div className="flex-1 px-8 pb-8 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <span className="text-sm text-gray-400">Loading…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-sm text-red-500">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="text-sm font-medium text-blue-500 hover:text-blue-600"
            >
              Retry
            </button>
          </div>
        ) : bills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-1">
            <p className="text-sm font-medium text-gray-600">No bills this month</p>
            <p className="text-xs text-gray-400">
              Add a bill with a billing date in {currentMonthLabel()} to see it here
            </p>
          </div>
        ) : (
          <div className="h-full flex gap-4">
            <Column
              title="Pending"
              accent="bg-amber-400"
              bills={pending}
              onToggle={(id, p) => void togglePaid(id, p)}
              onDragStart={(id) => { dragId.current = id; }}
              onDrop={handleDrop}
            />
            <Column
              title="Paid"
              accent="bg-emerald-500"
              bills={paid}
              onToggle={(id, p) => void togglePaid(id, p)}
              onDragStart={(id) => { dragId.current = id; }}
              onDrop={handleDrop}
            />
          </div>
        )}
      </div>
    </div>
  );
}
