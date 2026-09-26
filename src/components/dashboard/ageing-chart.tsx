"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR, formatINRCompact } from "@/lib/format";

export type AgeingBucket = { bucket: string; amount: number };

// Single series (receivables by age), so no legend: the card title names it.
// Values are labelled at each bar tip; the sr-only table carries the same numbers.
export function AgeingChart({ data }: { data: AgeingBucket[] }) {
  return (
    <div>
      <div className="h-44 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
            {/* Headroom so the value label at the longest bar tip never wraps. */}
            <XAxis type="number" hide domain={[0, (max: number) => max * 1.35]} />
            <YAxis
              type="category"
              dataKey="bucket"
              width={64}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              formatter={(v) => [formatINR(Number(v)), "Receivable"]}
              labelFormatter={(l) => `${l} days`}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                fontSize: 12,
              }}
              itemStyle={{ color: "var(--popover-foreground)" }}
            />
            <Bar dataKey="amount" fill="var(--chart-series-1)" barSize={20} radius={[0, 4, 4, 0]}>
              {/* Drawn as a single SVG text so Recharts never wraps it. */}
              <LabelList
                dataKey="amount"
                content={({ x, y, width, height, value }) => (
                  <text
                    x={Number(x) + Number(width) + 6}
                    y={Number(y) + Number(height) / 2}
                    dominantBaseline="middle"
                    fontSize={12}
                    fill="var(--foreground)"
                  >
                    {formatINRCompact(Number(value))}
                  </text>
                )}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Receivables by age since invoice date</caption>
        <thead>
          <tr>
            <th>Age (days)</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.bucket}>
              <td>{d.bucket}</td>
              <td>{formatINR(d.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
