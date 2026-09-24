import { Link } from "react-router-dom";
import { Cloud, ArrowLeftRight, FileUp, ArrowRight } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/common/Card";

const SECTIONS = [
  {
    to: "/data-management/cloud-sync",
    icon: Cloud,
    title: "Cloud Sync",
    description:
      "Back up local records to the cloud, check sync status and review history.",
  },
  {
    to: "/data-management/import-export",
    icon: ArrowLeftRight,
    title: "Import / Export",
    description:
      "Upload files to add data, or export clients, products and bills as CSV.",
  },
  {
    to: "/data-management/csv-import",
    icon: FileUp,
    title: "CSV Import",
    description:
      "A guided four-step wizard: upload, map columns, validate and import.",
  },
];

export default function DataManagement() {
  return (
    <>
      <PageHeader
        title="Data Management"
        subtitle="Sync, import and export your business records"
      />

      <div className="dm-grid">
        {SECTIONS.map(({ to, icon: Icon, title, description }) => (
          <Link key={to} to={to}>
            <Card hoverable className="dm-card">
              <span className="dm-icon" aria-hidden="true">
                <Icon size={22} />
              </span>
              <span className="dm-title">{title}</span>
              <span className="dm-desc">{description}</span>
              <span className="card-link">
                Open <ArrowRight size={14} aria-hidden="true" />
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
