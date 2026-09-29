import { Link } from "react-router-dom";
import PageHeader from "../layout/PageHeader";

/** Breadcrumb + page header for the Call Center CRM. */
export default function CRMHeader({ title, subtitle, children }) {
  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/dashboard">Dashboard</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Call Center</span>
      </nav>
      <PageHeader title={title} subtitle={subtitle}>
        {children}
      </PageHeader>
    </>
  );
}
