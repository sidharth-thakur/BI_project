import { Component } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import Button from "./Button";

/**
 * Catches render + lazy-import failures inside the router (e.g. a module
 * import that fails while the dev server restarts) and shows a friendly
 * recovery screen instead of a blank page.
 */
export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    /* Keep the detail visible in the console for debugging. */
    console.error("Page failed to render:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const message =
      typeof error?.message === "string" ? error.message : "Unknown error.";

    return (
      <div className="empty-state" role="alert">
        <span className="empty-icon" aria-hidden="true">
          <TriangleAlert size={26} />
        </span>
        <p className="empty-title">This page failed to load</p>
        <p className="empty-desc">
          {message.includes("Failed to fetch dynamically imported module")
            ? "The connection to the dev server was interrupted. Retry, or reload the page."
            : message}
        </p>
        <div className="page-header-actions">
          <Button variant="secondary" onClick={this.handleRetry}>
            <RefreshCw size={16} /> Try Again
          </Button>
          <Button onClick={this.handleReload}>Reload Page</Button>
        </div>
      </div>
    );
  }
}
