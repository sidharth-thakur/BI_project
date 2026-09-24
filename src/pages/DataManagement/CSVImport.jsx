import { useMemo, useRef, useState } from "react";
import {
  Upload,
  Columns3,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import Card, { CardHeader, CardBody } from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";

const STEPS = [
  { label: "Upload CSV", icon: Upload },
  { label: "Map Columns", icon: Columns3 },
  { label: "Validate Data", icon: ShieldCheck },
  { label: "Import", icon: CheckCircle2 },
];

const SOURCE_COLUMNS = ["company", "contact_person", "mobile", "email_id", "segment"];
const TARGET_FIELDS = ["Client Name", "Contact Person", "Phone", "Email", "Category"];
const UNMAPPED = "(Do not import)";

const SAMPLE_ROWS = [
  { row: 2, name: "Apex Pharma", contact: "Rahul Sharma", valid: true },
  { row: 3, name: "Synergy Labs", contact: "Priya Mehta", valid: true },
  { row: 4, name: "", contact: "Amit Singh", valid: false, error: "Client name is required" },
  { row: 5, name: "Global Biotech", contact: "Neha Verma", valid: true },
  { row: 6, name: "Medilife", contact: "Sanjay Rao", valid: true },
  { row: 7, name: "Zenith Labs", contact: "Arjun Patel", valid: true },
  { row: 8, name: "Nova Therapeutics", contact: "Kavita Nair", valid: true },
  { row: 9, name: "PureChem Ind.", contact: "", valid: false, error: "Contact person missing" },
];

export default function CSVImport() {
  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState(() =>
    SOURCE_COLUMNS.reduce((acc, column, index) => {
      acc[column] = TARGET_FIELDS[index] ?? UNMAPPED;
      return acc;
    }, {})
  );
  const [imported, setImported] = useState(false);
  const inputRef = useRef(null);

  const { valid, invalid } = useMemo(
    () => ({
      valid: SAMPLE_ROWS.filter((row) => row.valid).length,
      invalid: SAMPLE_ROWS.filter((row) => !row.valid).length,
    }),
    []
  );

  function handleFile(file) {
    if (!file) return;
    setFileName(file.name);
    setStep(1);
    setImported(false);
  }

  const canAdvance =
    (step === 0 && fileName) ||
    (step === 1 && Object.values(mapping).some((value) => value !== UNMAPPED)) ||
    step === 2;

  return (
    <>
      <PageHeader
        title="CSV Import"
        subtitle="Bring in existing data in four guided steps"
      >
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Back
          </Button>
        )}
      </PageHeader>

      <ol className="stepper" aria-label="Import steps">
        {STEPS.map((item, index) => (
          <li key={item.label} style={{ display: "contents" }}>
            {index > 0 && <span className="step-connector" aria-hidden="true" />}
            <span
              className={`step${index === step ? " active" : ""}${index < step ? " done" : ""}`}
              aria-current={index === step ? "step" : undefined}
            >
              <span className="step-index">{index < step ? "✓" : index + 1}</span>
              {item.label}
            </span>
          </li>
        ))}
      </ol>

      {/* Step 1 — Upload */}
      {step === 0 && (
        <Card>
          <CardHeader title="Upload CSV" subtitle="Choose the file you want to import" />
          <CardBody>
            <label
              className="dropzone"
              htmlFor="csv-file"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleFile(event.dataTransfer.files?.[0]);
              }}
            >
              <span className="dropzone-icon" aria-hidden="true">
                <Upload size={24} />
              </span>
              <span className="empty-title">Drop your CSV here or click to browse</span>
              <span className="empty-desc">
                First row must contain column headers. Max 10,000 rows.
              </span>
              <input
                id="csv-file"
                ref={inputRef}
                type="file"
                accept=".csv"
                hidden
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </label>
          </CardBody>
        </Card>
      )}

      {/* Step 2 — Map columns */}
      {step === 1 && (
        <Card>
          <CardHeader
            title="Map Columns"
            subtitle={`File: ${fileName} · ${SOURCE_COLUMNS.length} columns detected`}
            action={<Badge tone="info">Step 2</Badge>}
          />
          <CardBody>
            <div className="map-grid">
              {SOURCE_COLUMNS.map((column) => (
                <div key={column} className="map-row">
                  <code className="map-source">{column}</code>
                  <select
                    value={mapping[column]}
                    onChange={(event) =>
                      setMapping({ ...mapping, [column]: event.target.value })
                    }
                    aria-label={`Map ${column}`}
                  >
                    <option value={UNMAPPED}>{UNMAPPED}</option>
                    {TARGET_FIELDS.map((field) => (
                      <option key={field}>{field}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 3 — Validate */}
      {step === 2 && (
        <Card className="table-card">
          <CardHeader
            title="Validate Data"
            subtitle={`${SAMPLE_ROWS.length} rows found · ${valid} valid · ${invalid} with errors`}
            action={
              <Badge tone={invalid ? "warning" : "success"}>
                {invalid} errors
              </Badge>
            }
          />
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Client Name</th>
                  <th>Contact Person</th>
                  <th>Validation</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_ROWS.map((row) => (
                  <tr key={row.row}>
                    <td className="mono">{row.row}</td>
                    <td className={row.name ? "cell-primary" : undefined}>
                      {row.name || "—"}
                    </td>
                    <td>{row.contact || "—"}</td>
                    <td>
                      {row.valid ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Valid
                        </span>
                      ) : (
                        <span className="badge badge-danger">
                          <XCircle size={12} /> {row.error}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Step 4 — Import */}
      {step === 3 && (
        <Card>
          <CardHeader
            title="Import"
            subtitle={imported ? "Import finished" : "Ready to import valid records"}
          />
          <CardBody>
            {!imported ? (
              <>
                <div className="stat-strip" style={{ marginBottom: 20 }}>
                  <div className="strip-item">
                    <span className="strip-label">File</span>
                    <span className="strip-value" style={{ fontSize: 15 }}>
                      <span className="cell-with-icon">
                        <FileSpreadsheet size={15} aria-hidden="true" />
                        {fileName}
                      </span>
                    </span>
                  </div>
                  <div className="strip-item">
                    <span className="strip-label">Records to import</span>
                    <span className="strip-value">{valid}</span>
                  </div>
                  <div className="strip-item">
                    <span className="strip-label">Rows skipped</span>
                    <span className="strip-value">{invalid}</span>
                  </div>
                </div>
                <Button onClick={() => setImported(true)}>
                  <CheckCircle2 size={16} /> Import {valid} Records
                </Button>
                <p className="form-note">
                  Runs locally in the browser — connect an API to persist records.
                </p>
              </>
            ) : (
              <div className="empty-state" style={{ padding: "24px 0" }}>
                <span className="empty-icon" aria-hidden="true">
                  <CheckCircle2 size={26} />
                </span>
                <p className="empty-title">{valid} records imported</p>
                <p className="empty-desc">
                  {invalid} rows were skipped because of validation errors. Fix them
                  and re-upload to import the rest.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStep(0);
                    setFileName("");
                    setImported(false);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                >
                  Import another file
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {step < 3 && (
        <div className="wizard-actions">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <Button
            onClick={() => canAdvance && setStep(step + 1)}
            disabled={!canAdvance}
          >
            Continue
          </Button>
          {!fileName && step === 0 && (
            <Button variant="ghost" onClick={() => handleFile({ name: "sample-clients.csv" })}>
              Use sample file
            </Button>
          )}
        </div>
      )}
    </>
  );
}
