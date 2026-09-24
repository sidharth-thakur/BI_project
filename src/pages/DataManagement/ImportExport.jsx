import { useState } from "react";
import {
  UploadCloud,
  Download,
  Users,
  Package,
  ReceiptText,
  PhoneCall,
  FileSpreadsheet,
} from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import Card, { CardHeader, CardBody } from "../../components/common/Card";
import Button from "../../components/common/Button";

const MODULES = [
  { key: "clients", label: "Clients", icon: Users, rows: 48 },
  { key: "products", label: "Products", icon: Package, rows: 248 },
  { key: "bills", label: "Bills", icon: ReceiptText, rows: 54 },
  { key: "followups", label: "Follow-ups", icon: PhoneCall, rows: 96 },
];

function ModuleRow({ module, selected, onToggle, onExport }) {
  const Icon = module.icon;
  return (
    <div className="module-row">
      <span className="module-icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <div className="module-meta">
        <span className="module-name">{module.label}</span>
        <span className="module-rows">{module.rows} records</span>
      </div>
      <label className="check-control">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select ${module.label}`}
        />
        Include
      </label>
      <Button size="sm" variant="secondary" onClick={onExport}>
        <Download size={14} /> CSV
      </Button>
    </div>
  );
}

export default function ImportExport() {
  const [selected, setSelected] = useState({
    clients: true,
    products: true,
    bills: true,
    followups: false,
  });
  const [message, setMessage] = useState("");

  function toggle(key) {
    setSelected((current) => ({ ...current, [key]: !current[key] }));
  }

  function handleExport() {
    const chosen = MODULES.filter((module) => selected[module.key]);
    if (!chosen.length) {
      setMessage("Select at least one module to export.");
      return;
    }
    setMessage(
      `Prepared CSV export for ${chosen
        .map((module) => module.label)
        .join(", ")} — demo only, no file is generated until an API exists.`
    );
  }

  function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage(`Selected "${file.name}" — validation runs in the CSV Import step.`);
    event.target.value = "";
  }

  return (
    <>
      <PageHeader
        title="Import / Export"
        subtitle="Move data in and out of V BIOCHEM"
      />

      <div className="io-grid">
        <Card>
          <CardHeader
            title="Import Data"
            subtitle="Upload a file to add or update records"
          />
          <CardBody>
            <label className="dropzone" htmlFor="import-file">
              <span className="dropzone-icon" aria-hidden="true">
                <UploadCloud size={24} />
              </span>
              <span className="empty-title">Drop a file here or click to browse</span>
              <span className="empty-desc">
                CSV files up to 10 MB. For multi-step validation use the CSV Import
                wizard.
              </span>
              <input
                id="import-file"
                type="file"
                accept=".csv,.xlsx"
                hidden
                onChange={handleImport}
              />
            </label>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Export Data"
            subtitle="Download selected modules as CSV"
          />
          <CardBody>
            <div className="module-list">
              {MODULES.map((module) => (
                <ModuleRow
                  key={module.key}
                  module={module}
                  selected={selected[module.key]}
                  onToggle={() => toggle(module.key)}
                  onExport={() =>
                    setMessage(
                      `Prepared "${module.label}" CSV export — demo only, no file is generated until an API exists.`
                    )
                  }
                />
              ))}
            </div>
            <Button onClick={handleExport} style={{ marginTop: 16 }}>
              <Download size={16} /> Export Selected
            </Button>
          </CardBody>
        </Card>
      </div>

      {message && (
        <p className="form-note" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FileSpreadsheet size={15} color="var(--primary)" aria-hidden="true" />
          {message}
        </p>
      )}
    </>
  );
}
