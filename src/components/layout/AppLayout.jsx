import { Suspense, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import LoadingState from "../common/LoadingState";
import RouteErrorBoundary from "../common/RouteErrorBoundary";

export default function AppLayout() {
  const contentRef = useRef(null);
  const { pathname } = useLocation();

  /* The content area is the scrollport now — reset it on navigation. */
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="app-shell">
      <div className="app-frame">
        <Sidebar />
        <div className="main-column">
          <Topbar />
          <main className="main-content" ref={contentRef}>
            <RouteErrorBoundary>
              <Suspense fallback={<LoadingState label="Loading page..." />}>
                <Outlet />
              </Suspense>
            </RouteErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}
