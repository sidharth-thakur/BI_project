import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";

export default function NotFound() {
  return (
    <>
      <PageHeader title="Page not found" />
      <div className="card">
        <EmptyState
          icon={Compass}
          title="We couldn't find that page"
          description="The page you're looking for may have been moved or doesn't exist."
          action={
            <Link to="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          }
        />
      </div>
    </>
  );
}
