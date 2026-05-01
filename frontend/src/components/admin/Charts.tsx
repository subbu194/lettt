import {
  CartesianGrid,
  Bar,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from 'recharts';

interface DataPoint {
  label: string;
  value: number;
}

interface ChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  className?: string;
}

export function BarChart({ data, height = 250, color = '#dc2626', className = '' }: ChartProps) {
  if (!data?.length) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500 ${className}`} style={{ height }}>
        No chart data available
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 12, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: '12px', borderColor: '#e5e7eb' }}
            cursor={{ fill: '#f3f4f6' }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} fill={color} maxBarSize={42} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LineChart({ data, height = 250, color = '#4f46e5', className = '' }: ChartProps) {
  if (!data?.length) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500 ${className}`} style={{ height }}>
        No chart data available
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 12, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: '12px', borderColor: '#e5e7eb' }}
            cursor={{ fill: '#f3f4f6' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            dot={{ r: 4, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
