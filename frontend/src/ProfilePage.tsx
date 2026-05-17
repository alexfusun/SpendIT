import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

type DbUser = {
  id: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  createdAt: string;
};

function IconSignOut({ cls }: { cls?: string }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function ProfilePage() {
  const { user, signOut, getToken } = useAuth();

  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as DbUser;
        setDbUser(data);
        setDisplayName(data.displayName ?? "");
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load profile");
      }
    }
    void fetchProfile();
  }, [getToken]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName: displayName.trim() || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = (await res.json()) as DbUser;
      setDbUser(updated);
      setDisplayName(updated.displayName ?? "");
      setSaveMsg({ ok: true, text: "Profile updated." });
    } catch (e) {
      setSaveMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  const photo = user?.photoURL;
  const initials = (displayName || user?.email || "?")[0].toUpperCase();
  const joinDate = dbUser?.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header className="px-8 pt-8 pb-5 flex-shrink-0">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">My Profile</h1>
        <p className="mt-0.5 text-sm text-gray-500">Manage your account details</p>
      </header>

      <div className="flex-1 px-8 pb-8 overflow-auto">
        <div className="max-w-lg space-y-4">

          {loadError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
              <p className="text-sm text-red-600">{loadError}</p>
            </div>
          )}

          {/* Avatar + identity card */}
          <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm px-6 py-6">
            <div className="flex items-center gap-5">
              {photo ? (
                <img src={photo} alt="" className="w-16 h-16 rounded-full flex-shrink-0 ring-2 ring-gray-100" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 ring-2 ring-gray-100">
                  <span className="text-2xl font-semibold text-blue-600">{initials}</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-base font-semibold text-gray-900 truncate">
                  {displayName || user?.displayName || user?.email}
                </p>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                {joinDate && (
                  <p className="text-xs text-gray-400 mt-0.5">Member since {joinDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Edit form */}
          <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm px-6 py-6">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Edit details</h2>
            <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Display name
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 transition"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Email <span className="font-normal text-gray-400">(from Google, read‑only)</span>
                </label>
                <input
                  type="email"
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                  value={user?.email ?? ""}
                />
              </div>

              {saveMsg && (
                <p className={`text-sm ${saveMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
                  {saveMsg.text}
                </p>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>

          {/* Danger zone */}
          <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm px-6 py-5">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-1">Sign out</h2>
            <p className="text-sm text-gray-500 mb-4">
              You'll be returned to the login screen.
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
            >
              <IconSignOut cls="w-4 h-4" />
              Sign out
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
