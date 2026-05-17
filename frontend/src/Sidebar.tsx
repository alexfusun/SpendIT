import { useAuth } from "./AuthContext";

export type Page = "home" | "profile";

function IconHome({ cls }: { cls?: string }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  );
}

function IconUser({ cls }: { cls?: string }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

const NAV: { page: Page; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    page: "home",
    label: "Home",
    icon: (active) => <IconHome cls={`w-4 h-4 ${active ? "text-blue-500" : "text-gray-400"}`} />,
  },
  {
    page: "profile",
    label: "My Profile",
    icon: (active) => <IconUser cls={`w-4 h-4 ${active ? "text-blue-500" : "text-gray-400"}`} />,
  },
];

export function Sidebar({
  currentPage,
  onNavigate,
}: {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}) {
  const { user } = useAuth();

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold leading-none">$</span>
          </div>
          <span className="text-[15px] font-semibold text-gray-900 tracking-tight">
            SpendIT
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          Menu
        </p>
        {NAV.map(({ page, label, icon }) => {
          const active = currentPage === page;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onNavigate(page)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {icon(active)}
              {label}
            </button>
          );
        })}
      </nav>

      {/* User avatar at bottom */}
      {user && (
        <div className="px-4 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => onNavigate("profile")}
            className="w-full flex items-center gap-2.5 min-w-0 rounded-xl px-2 py-1.5 hover:bg-gray-100 transition-colors"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-gray-600">
                  {(user.displayName ?? user.email ?? "?")[0].toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-[12px] text-gray-600 truncate">
              {user.displayName ?? user.email}
            </span>
          </button>
        </div>
      )}
    </aside>
  );
}
