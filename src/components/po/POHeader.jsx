import { Link } from "react-router-dom";
import PageHeader from "../layout/PageHeader";

/**
 * Page header + breadcrumb shared by the PO Management views.
 */
export default function POHeader({ title, subtitle, children }) {
  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/dashboard">Dashboard</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">PO &amp; Bill Management</span>
      </nav>
      <PageHeader title={title} subtitle={subtitle}>
        {children}
      </PageHeader>
    </>
  );
}
