import { Card, CardHeader, CardBody } from "../../components/common/Card";
import Dropdown from "../../components/common/Dropdown";
import PastelStatCard from "../../components/dashboard/PastelStatCard";
import SalesBreakdown from "../../components/dashboard/SalesBreakdown";
import SalesOverviewChart from "../../components/dashboard/SalesOverviewChart";
import RecentBills from "../../components/dashboard/RecentBills";
import { businessKpis, overviewPeriods } from "../../data/dashboardData";
import { useApp } from "../../context/AppContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import "../../styles/dashboard.css";

export default function Dashboard() {
  const { user } = useApp();
  const [period, setPeriod] = useLocalStorage(
    "vbiochem.overviewPeriod",
    overviewPeriods[0]
  );

  return (
    <>
      <header className="welcome-row">
        <h1 className="welcome-title">Welcome {user.name}!</h1>
        <p className="welcome-sub">
          Here is your V BIOCHEM business overview for today.
        </p>
      </header>

      <Card className="overview-card">
        <CardHeader
          title="V BIOCHEM Business Overview"
          action={
            <Dropdown
              label={period}
              value={period}
              options={overviewPeriods}
              onSelect={setPeriod}
              ariaLabel="Select overview period"
            />
          }
        />
        <CardBody>
          <div className="kpi-grid">
            {businessKpis.map((stat) => (
              <PastelStatCard key={stat.key} stat={stat} />
            ))}
          </div>
        </CardBody>
      </Card>

      <section className="charts-grid" aria-label="Sales analytics">
        <SalesBreakdown />
        <SalesOverviewChart />
      </section>

      <RecentBills />
    </>
  );
}
