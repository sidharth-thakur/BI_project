/* Decorative mini trend used inside pastel KPI cards.
   Pure SVG — intentionally not a chart library component. */

export default function MiniTrend({ points = [], tone = "dark" }) {
  const width = 84;
  const height = 40;
  const gap = 4;
  const barWidth = (width - gap * (points.length - 1)) / points.length;
  const max = Math.max(...points, 1);

  const color =
    tone === "dark" ? "rgba(8, 63, 64, 0.75)" : "rgba(255, 255, 255, 0.9)";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="mini-trend"
    >
      {points.map((point, index) => {
        const barHeight = Math.max(6, (point / max) * height);
        const x = index * (barWidth + gap);
        const y = height - barHeight;
        const isPeak = point === max;
        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={barWidth / 2}
            fill={color}
            opacity={isPeak ? 1 : 0.45 + (point / max) * 0.45}
          />
        );
      })}
    </svg>
  );
}
