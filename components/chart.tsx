"use client"

import { useState } from 'react'
import { Bar, Line, Pie, BarChart as RechartsBarChart, LineChart as RechartsLineChart, PieChart as RechartsPieChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Sector, Legend } from 'recharts'

interface ChartProps {
  data: Array<{ 
    name: string; 
    value: number;
    color?: string;
    fill?: string;
  }>
  isZoomed?: boolean
}

interface IndustryChartProps extends ChartProps {
  showLegend?: boolean;
}

const COLORS = ['#0088FE', '#2E7D32', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

// const PIE_COLORS = ['#00C49F', '#FFBB28', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'] 

const INDUSTRY_COLORS: Record<string, string> = {
  'Technology & Software': '#FFBB28',           // Golden Yellow
  'Healthcare & Pharmaceuticals': '#FFD66A',    // Lightened Golden Yellow
  'Financial Services': '#F39C12',              // Golden Amber
  'Insurance': '#E67E22',                       // Amber
  'Manufacturing': '#C27C00',                   // Dark Yellow
  'Retail & Consumer Goods': '#F1C40F',         // Bright Yellow
  'Fashion': '#00C49F',                         // Teal
  'Media & Entertainment': '#1ABC9C',           // Bright Teal
  'Management Consulting': '#16A085',           // Soft Teal
  'Legal Services': '#48C9B0',                  // Pastel Teal
  'Accounting & Tax': '#00B894',                // Deep Teal
  'Marketing & Advertising': '#1D8586',         // Muted Teal
  'Human Resources': '#2E7D32',                 // Forest Green
  'Research & Development': '#27AE60',          // Bright Green
  'Energy & Utilities': '#1E824C',              // Dark Green
  'Education': '#58D68D',                       // Pastel Green
  'Real Estate': '#229954',                     // Muted Green
  'Transportation & Logistics': '#2ECC71',      // Soft Green
  'Telecommunications': '#000000',              // Black
  'Agriculture': '#333333',                     // Dark Grey
  'Food & Beverage': '#4D4D4D',                 // Light Grey
  'Construction': '#808080',                    // Mid Grey
  'Hospitality & Tourism': '#FF5733',           // Warm Orange
  'Government & Public Sector': '#9B59B6',      // Purple
  'Defense & Aerospace': '#D35400',             // Burnt Orange
  'Environmental Services': '#BDC3C7',          // Light Silver
  'Non-Profit & NGO': '#F39C12',                // Golden Yellow (reusing)
  'Sports & Recreation': '#16A085'              // Bright Teal (reusing)
}

// Define the interface for the industry data
interface IndustryCount {
  [industry: string]: {
    count: number;
  };
}

// Define the interface for the stacked bar chart data
interface StackedBarChartData {
  years_after: number;
  industries: IndustryCount;
}

interface IndustryStackedBarChartProps {
  data: StackedBarChartData[];
  isZoomed?: boolean;
}

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
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
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
    if (isZoomed) {
      setActiveIndex(index);
    }
  };

  return (
    <ChartContainer className={`${isZoomed ? 'h-[600px]' : 'h-[400px]'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            activeIndex={isZoomed ? activeIndex : undefined}
            activeShape={isZoomed ? renderActiveShape : undefined}
            data={data}
            cx={isZoomed ? '50%' : '50%'}
            cy={isZoomed ? '50%' : '50%'}
            innerRadius={isZoomed ? 170 : 45}
            outerRadius={isZoomed ? 220 : 90}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={onPieEnter}
            isAnimationActive={isZoomed}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || entry.fill || COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          {isZoomed && <Tooltip content={<ChartTooltipContent />} />}
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export function SalaryBarChart({ data, isZoomed = false }: ChartProps) {
  return (
    <ChartContainer className={`${isZoomed ? 'h-[700px]' : 'h-[500px]'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart 
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: isZoomed ? 100 : 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--foreground))" 
            fontSize={isZoomed ? 12 : 9} 
            tickLine={false} 
            axisLine={true}
            angle={-45}
            textAnchor="end"
            height={isZoomed ? 100 : 80}
            tickFormatter={(value) => {
              if (value.includes('-')) {
                const [min, max] = value.split('-');
                const minClean = min.replace(/[^\d$]/g, '').replace('$', '');
                const maxClean = max.replace(/[^\d$]/g, '').replace('$', '');
                
                const minVal = parseInt(minClean);
                const maxVal = parseInt(maxClean);
                
                const minK = !isNaN(minVal) ? Math.round(minVal / 1000) : 0;
                const maxK = !isNaN(maxVal) ? Math.round(maxVal / 1000) : 0;
                
                return `$${minK}k-${maxK}k`;
              }
              return value;
            }}
          />
          <YAxis 
            type="number"
            stroke="hsl(var(--foreground))" 
            fontSize={isZoomed ? 12 : 9} 
            tickLine={false} 
            axisLine={true}
            allowDecimals={false}
            tickFormatter={(value) => Math.round(value).toString()}
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

export function GeographyBarChart({ data, isZoomed = false }: ChartProps) {
  return (
    <ChartContainer className={`${isZoomed ? 'h-[700px]' : 'h-[500px]'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart 
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: isZoomed ? 100 : 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--foreground))" 
            fontSize={isZoomed ? 12 : 10} 
            tickLine={false} 
            axisLine={true}
            angle={-45}
            textAnchor="end"
            height={isZoomed ? 100 : 80}
            tickFormatter={(value) => {
              // Add location abbreviations here
              const abbreviations: Record<string, string> = {
                "New York Metropolitan Area": "NY Metro",
                "San Francisco Bay Area": "SF Bay Area",
                "Los Angeles Metropolitan Area": "LA Metro",
                "Washington, District Of Columbia": "Washington DC",
                "Greater Boston Area": "Boston",
                "Greater Chicago Area": "Chicago",
                // Add more abbreviations as needed
              };
              
              return abbreviations[value] || value;
            }}
          />
          <YAxis 
            type="number"
            stroke="hsl(var(--foreground))" 
            fontSize={isZoomed ? 12 : 10} 
            tickLine={false} 
            axisLine={true}
            allowDecimals={false}
            tickFormatter={(value) => Math.round(value).toString()}
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

interface IndustryPieChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  isZoomed?: boolean;
  showLegend?: boolean;
}

export const IndustryPieChart: React.FC<IndustryPieChartProps> = ({ data, isZoomed = false, showLegend = false }) => {
  const chartSize = isZoomed ? 400 : 200;
  
  return (
    <ResponsiveContainer width="100%" height={chartSize}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={chartSize / 3}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`}
              fill={INDUSTRY_COLORS[entry.name] || COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        {showLegend && (
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value: string, entry: any) => 
              `${value} ${entry.payload.value.toFixed(1)}%`
            }
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

export function AverageSalaryByIndustryBarChart({ data, isZoomed = false }: ChartProps) {
  return (
    <ChartContainer className={`${isZoomed ? 'h-[700px]' : 'h-[500px]'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart 
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: isZoomed ? 100 : 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--foreground))" 
            fontSize={isZoomed ? 12 : 9} 
            tickLine={false} 
            axisLine={true}
            angle={-45}
            textAnchor="end"
            height={isZoomed ? 100 : 80}
          />
          <YAxis 
            type="number"
            stroke="hsl(var(--foreground))" 
            fontSize={isZoomed ? 12 : 9} 
            tickLine={false} 
            axisLine={true}
            allowDecimals={false}
            tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
          />
          <Tooltip 
            content={<ChartTooltipContent />}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Average Salary']}
          />
          <Bar 
            dataKey="value" 
            fill="#FFBB2880" // Golden yellow with 0.5 opacity
            radius={[4, 4, 0, 0]} 
            isAnimationActive={isZoomed} 
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export function IndustryStackedBarChart({ data, isZoomed = false }: IndustryStackedBarChartProps) {
  // Transform the data for the stacked bar chart
  const transformedData = data.map(yearData => {
    const result: any = { years_after: yearData.years_after };
    
    // Add each industry as a separate key in the result object
    Object.entries(yearData.industries).forEach(([industry, { count }]) => {
      result[industry] = count;
    });
    
    return result;
  });
  
  // Get all unique industries across all years
  const allIndustries = new Set<string>();
  data.forEach(yearData => {
    Object.keys(yearData.industries).forEach(industry => {
      allIndustries.add(industry);
    });
  });
  
  // Convert to array for mapping
  const industries = Array.from(allIndustries);
  
  return (
    <ChartContainer className={`${isZoomed ? 'h-[700px]' : 'h-[500px]'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={transformedData}
          margin={{ top: 20, right: 30, left: 20, bottom: isZoomed ? 100 : 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="years_after" 
            stroke="hsl(var(--foreground))" 
            fontSize={isZoomed ? 12 : 9} 
            tickLine={false} 
            axisLine={true}
            label={{ value: 'Years After Graduation', position: 'insideBottom', offset: -10 }}
          />
          <YAxis 
            stroke="hsl(var(--foreground))" 
            fontSize={isZoomed ? 12 : 9} 
            tickLine={false} 
            axisLine={true}
            label={{ value: 'Number of Alumni', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [value, name]}
            labelFormatter={(label) => `${label} Year${label !== 1 ? 's' : ''} After Graduation`}
          />
          <Legend />
          
          {/* Create a Bar for each industry */}
          {industries.map((industry, index) => (
            <Bar 
              key={industry}
              dataKey={industry}
              stackId="a"
              fill={INDUSTRY_COLORS[industry] || COLORS[index % COLORS.length]}
              name={industry}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}



