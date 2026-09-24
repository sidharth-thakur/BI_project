import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader, CardBody } from "../common/Card";
import {
  salesBreakdown,
  salesBreakdownTotal,
} from "../../data/dashboardData";

function CenterLabel() {
  return (
    <div className="donut-center" aria-hidden="true">
      <span className="donut-caption">Total</span>
      <span className="donut-total">₹{salesBreakdownTotal.toFixed(1)}L</span>
    </div>
  );
}

function BreakdownTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{entry.name}</p>
      <strong>₹{entry.value.toFixed(1)}L</strong>
    </div>
  );
}

export default function SalesBreakdown() {
  return (
    <Card className="chart-card">
      <CardHeader title="Sales Breakdown" subtitle="Quotations, orders and bills" />

      <CardBody>
        <div className="donut-wrap">
          <div
            className="donut-chart donut-chart-lg"
            role="img"
            aria-label={`Sales breakdown totalling ₹${salesBreakdownTotal.toFixed(1)} lakh`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="64%"
                  outerRadius="92%"
                  paddingAngle={4}
                  cornerRadius={12}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  isAnimationActive
                >
                  {salesBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<BreakdownTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <CenterLabel />
          </div>

          <ul className="breakdown-legend">
            {salesBreakdown.map((entry) => (
              <li key={entry.name}>
                <span
                  className="legend-dot"
                  style={{ background: entry.color }}
                  aria-hidden="true"
                />
                <span className="legend-name">{entry.name}</span>
                <span className="legend-value">
                  ₹{entry.value.toFixed(1)}L
                </span>
                <span className="legend-percent">
                  {Math.round((entry.value / salesBreakdownTotal) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
}
