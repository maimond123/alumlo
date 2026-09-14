"use client"

import { useState } from 'react'
import { Bar, Line, Pie, BarChart as RechartsBarChart, LineChart as RechartsLineChart, PieChart as RechartsPieChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Sector } from 'recharts'

interface ChartProps {
  data: Array<{ 
    name: string; 
    value: number;
    color?: string;
    fill?: string;
  }>
  isZoomed?: boolean
}

const COLORS = ['#0088FE', '#2E7D32', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']


const COLORS1 = ['#FFBB2880', '#FF7F0080', '#008B8B80', '#80008080', '#0000FF80', '#228B2280']

export function ChartContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full ${className}`}>
      {children}
    </div>
  )
}

export function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow">
        <p className="font-bold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function BarChart({ data, isZoomed = false }: ChartProps) {
  return (
    <ChartContainer className={`${isZoomed ? 'h-[700px]' : 'h-[500px]'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart 
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: isZoomed ? 10 : 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--foreground))" 
            fontSize={12} 
            tickLine={false} 
            axisLine={true}
            angle={-45}
            textAnchor="end"
            height={isZoomed ? 100 : 80}
          />
          <YAxis 
            stroke="hsl(var(--foreground))" 
            fontSize={11} 
            tickLine={false} 
            axisLine={true}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Bar 
            dataKey="value" 
            fill="#00C49F80" 
            radius={[4, 4, 0, 0]} 
            isAnimationActive={isZoomed} 
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export function LineChart({ data, isZoomed = false }: ChartProps) {
  return (
    <ChartContainer className={`${isZoomed ? 'h-[500px]' : 'h-[400px]'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data}>
          {isZoomed && (
            <>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
              <Tooltip content={<ChartTooltipContent />} />
            </>
          )}
          <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 4 }} isAnimationActive={isZoomed} />
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

export function PieChart({ data, isZoomed = false }: ChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <ChartContainer className={`${isZoomed ? 'h-[600px]' : 'h-[400px]'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={isZoomed ? 170 : 60}
            outerRadius={isZoomed ? 220 : 110}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={onPieEnter}
            isAnimationActive={true}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || entry.fill || COLORS1[index % COLORS1.length]} 
              />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltipContent />} />
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
