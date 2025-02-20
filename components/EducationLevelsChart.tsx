'use client'

import { useState, useEffect } from 'react'
import { PieChart } from './chart'
import { getChartById } from '../app/data/chartData'

interface EducationLevelsChartProps {
  isZoomed?: boolean;
}

const EducationLevelsChart: React.FC<EducationLevelsChartProps> = ({ isZoomed = false }) => {
  const [chartData, setChartData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const chart = await getChartById('alumni-education-levels');
        const data = chart?.data || [];
        setChartData(data.length > 0 ? data : [{ name: 'No Data', value: 1 }]);
      } catch (err) {
        setError('Failed to load education levels data')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return <div className="h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  }

  if (error) {
    return <div className="h-full flex items-center justify-center text-red-500">{error}</div>
  }

  if (chartData.length === 0) {
    return <div className="h-full flex items-center justify-center text-gray-500">No data available</div>;
  }

  return (
    <div className="h-full">
      <div className="h-full">
        <PieChart data={chartData} isZoomed={isZoomed} />
      </div>
    </div>
  )
}

export default EducationLevelsChart

