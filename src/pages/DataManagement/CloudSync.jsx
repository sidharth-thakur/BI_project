import { useEffect, useRef, useState } from "react";
import { Cloud, RefreshCw, CheckCircle2, History } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import Card, { CardHeader, CardBody } from "../../components/common/Card";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import StatusBadge from "../../components/common/StatusBadge";

const INITIAL_HISTORY = [
  { id: "S-3", time: "12 Sep 2025, 09:15 AM", records: 1240, status: "Synced" },
  { id: "S-2", time: "11 Sep 2025, 09:12 AM", records: 1188, status: "Synced" },
  { id: "S-1", time: "10 Sep 2025, 09:20 AM", records: 964, status: "Sync Failed" },
];

export default function CloudSync() {
  const [progress, setProgress] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [lastSynced, setLastSynced] = useState("12 Sep 2025, 09:15 AM");
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  function startSync() {
    if (syncing) return;
    setSyncing(true);
    setProgress(0);

    timerRef.current = setInterval(() => {
      setProgress((current) => {
        const next = current + 10;
        if (next >= 100) {
          clearInterval(timerRef.current);
          setSyncing(false);
          const now = new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          setLastSynced(now);
          setHistory((list) => [
            { id: `S-${Date.now()}`, time: now, records: 1302, status: "Synced" },
            ...list,
          ]);
          return 100;
        }
        return next;
      });
    }, 180);
  }

  return (
    <>
      <PageHeader
        title="Cloud Sync"
        subtitle="Keep local records backed up to the cloud"
      >
        <Button onClick={startSync} disabled={syncing}>
          <RefreshCw size={16} className={syncing ? "spin-once" : ""} />
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
      </PageHeader>

      <div className="stat-strip" style={{ marginBottom: 24 }}>
        <div className="strip-item">
          <span className="strip-label">Last synchronized</span>
          <span className="strip-value" style={{ fontSize: 16 }}>
            {lastSynced}
          </span>
        </div>
        <div className="strip-item">
          <span className="strip-label">Sync status</span>
          <span style={{ marginTop: 2 }}>
            <StatusBadge status={syncing ? "Syncing" : "Synced"} />
          </span>
        </div>
        <div className="strip-item">
          <span className="strip-label">Records synchronized</span>
          <span className="strip-value">1,302</span>
        </div>
        <div className="strip-item">
          <span className="strip-label">Next sync</span>
          <span className="strip-value" style={{ fontSize: 16 }}>
            13 Sep 2025, 09:15 AM
          </span>
        </div>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <CardHeader
          title="Sync progress"
          subtitle={syncing ? `Uploading changes — ${progress}%` : "Everything is up to date"}
          action={<Badge tone={progress === 100 ? "success" : "info"}>{progress}%</Badge>}
        />
        <CardBody>
          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Sync progress"
          >
            <span className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          {progress === 100 && (
            <p className="form-note" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={14} color="var(--success)" /> Sync completed —
              local changes uploaded to cloud storage.
            </p>
          )}
        </CardBody>
      </Card>

      <Card className="table-card">
        <CardHeader
          title="Sync history"
          action={<History size={17} color="var(--text-muted)" aria-hidden="true" />}
        />
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sync ID</th>
                <th>Time</th>
                <th>Records</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id}>
                  <td className="cell-primary">
                    <span className="cell-with-icon">
                      <Cloud size={15} aria-hidden="true" />
                      {entry.id}
                    </span>
                  </td>
                  <td>{entry.time}</td>
                  <td className="mono">{entry.records.toLocaleString("en-IN")}</td>
                  <td>
                    <StatusBadge status={entry.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="form-note">
        Demo sync — progress and history are simulated locally until a real cloud
        endpoint is connected.
      </p>
    </>
  );
}
