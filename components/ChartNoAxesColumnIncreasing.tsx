'use client'

import { Bar, BarChart, ResponsiveContainer } from 'recharts'

interface ChartNoAxesColumnIncreasingProps {
  data: { name: string; value: number }[]
}

export default function ChartNoAxesColumnIncreasing({ data }: ChartNoAxesColumnIncreasingProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <Bar dataKey="value" fill="#16a34a" />
      </BarChart>
    </ResponsiveContainer>
  )
}

