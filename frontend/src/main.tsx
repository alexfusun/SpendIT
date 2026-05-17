import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AuthProvider, useAuth } from "./AuthContext";
import { LoginPage } from "./LoginPage";
import { ProfilePage } from "./ProfilePage";
import { Sidebar, Page } from "./Sidebar";
import { ItemsApp } from "./app/app/items-app";

function AppShell() {
  const [page, setPage] = useState<Page>("home");

  return (
    <div className="flex h-screen bg-[#F5F5F7] overflow-hidden">
      <Sidebar currentPage={page} onNavigate={setPage} />
      {page === "home" ? <ItemsApp /> : <ProfilePage />}
    </div>
  );
}

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F5F7]">
        <span className="text-sm text-gray-400">Loading…</span>
      </div>
    );
  }

  return user ? <AppShell /> : <LoginPage />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>,
);
