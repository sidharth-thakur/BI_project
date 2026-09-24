import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import LoadingState from "../common/LoadingState";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <div className="app-frame">
        <Sidebar />
        <div className="main-column">
          <Topbar />
          <main className="main-content">
            <Suspense fallback={<LoadingState label="Loading page..." />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
