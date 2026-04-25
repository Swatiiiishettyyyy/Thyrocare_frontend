import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type LineGraphPoint = {
  x: string
  y: number
}

type Props = {
  data: LineGraphPoint[]
  height?: number
  stroke?: string
  showDots?: boolean
  yDomain?: [number, number] | ['auto' | number, 'auto' | number]
}

export function LineGraph({
  data,
  height = 196,
  stroke = '#8B5CF6',
  showDots = true,
  yDomain = ['auto', 'auto'],
}: Props) {
  if (!Number.isFinite(height) || height <= 0) {
    return <div style={{ width: '100%', height: 196, minHeight: 196, minWidth: 0 }} />
  }
  const dense = data.length > 4
  return (
    <div style={{ width: '100%', height, minHeight: height, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 10, bottom: dense ? 22 : 14, left: 6 }}>
          <CartesianGrid stroke="#E7E1FF" strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="x"
            axisLine={false}
            tickLine={false}
            height={dense ? 42 : 28}
            tickMargin={dense ? 12 : 8}
            angle={dense ? -35 : 0}
            textAnchor={dense ? 'end' : 'middle'}
            tick={{ fill: '#828282', fontSize: 12, fontFamily: 'Poppins, sans-serif' }}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            domain={yDomain}
            axisLine={false}
            tickLine={false}
            width={44}
            tickMargin={8}
            tick={{ fill: '#828282', fontSize: 13, fontFamily: 'Poppins, sans-serif' }}
          />
          <Tooltip
            cursor={{ stroke: '#E7E1FF', strokeWidth: 1 }}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #E7E1FF',
              boxShadow: '0px 4px 27.3px rgba(0,0,0,0.08)',
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
            }}
            labelStyle={{ color: '#161616', fontWeight: 600 }}
            formatter={(v: unknown) => (typeof v === 'number' ? v : String(v))}
          />
          <Line
            type="monotone"
            dataKey="y"
            stroke={stroke}
            strokeWidth={2}
            dot={showDots ? { r: 4, strokeWidth: 2, fill: stroke } : false}
            activeDot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

