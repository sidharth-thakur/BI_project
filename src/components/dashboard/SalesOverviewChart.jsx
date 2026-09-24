import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardBody } from "../common/Card";
import Dropdown from "../common/Dropdown";
import { useState } from "react";
import {
  salesOverview,
  salesBarColors,
} from "../../data/dashboardData";

const RANGES = ["Jan – Jun", "Jul – Dec", "This Year"];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip chart-tooltip-lg">
      <p className="chart-tooltip-label">{label}, 2026</p>
      <strong>₹{payload[0].value.toFixed(1)}L</strong>
    </div>
  );
}

export default function SalesOverviewChart() {
  const [range, setRange] = useState(RANGES[0]);

  return (
    <Card className="chart-card">
      <CardHeader
        title="Sales Overview"
        subtitle="Monthly sales value"
        action={
          <Dropdown
            label={range}
            value={range}
            options={RANGES}
            onSelect={setRange}
            ariaLabel="Select date range"
          />
        }
      />

      <CardBody>
        <div
          className="bars-chart"
          role="img"
          aria-label="Monthly sales bar chart from January to June"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={salesOverview}
              margin={{ top: 10, right: 8, left: -14, bottom: 0 }}
              barCategoryGap="28%"
            >
              <CartesianGrid vertical={false} stroke="#eef4f4" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#93a9aa", fontSize: 12, fontFamily: "Inter" }}
                dy={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#93a9aa", fontSize: 12, fontFamily: "Inter" }}
                tickFormatter={(value) => `${value}L`}
                width={52}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "rgba(8, 63, 64, 0.04)" }}
              />
              <Bar
                dataKey="value"
                name="Sales"
                radius={[14, 14, 14, 14]}
                maxBarSize={34}
                background={{ fill: "#eef4f4", radius: [18, 18, 18, 18] }}
                isAnimationActive
              >
                {salesOverview.map((entry, index) => (
                  <Cell
                    key={entry.month}
                    fill={salesBarColors[index % salesBarColors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}
