'use client'

import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js/auto'
import { motion } from 'framer-motion'

export default function AnimatedCharts() {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const barChartRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!chartRef.current || !barChartRef.current) return

    // Pie Chart
    const pieCtx = chartRef.current.getContext('2d') as CanvasRenderingContext2D;
    if (!pieCtx) return;

    const pieChart = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: ['Alumni Engaged', 'Potential Growth'],
        datasets: [{
          data: [75, 25],
          backgroundColor: [
            'rgba(64, 224, 208, 0.8)',
            'rgba(20, 20, 0.1)'
          ],
          borderColor: [
            'rgba(64, 224, 208, 1)',
            'rgba(20, 20, 0.2)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        animation: {
          duration: 2000,
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    })

    // Bar Chart
    const barCtx = barChartRef.current.getContext('2d') as CanvasRenderingContext2D;
    if (!barCtx) return;

    const barChart = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['2020', '2021', '2022', '2023'],
        datasets: [{
          label: 'Alumni Engagement',
          data: [30, 45, 60, 85],
          backgroundColor: 'rgba(64, 224, 208, 0.8)',
          borderColor: 'rgba(64, 224, 208, 1)',
          borderWidth: 1
        }]
      },
      options: {
        animation: {
          duration: 2000,
          easing: 'easeInOutQuart'
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 0.7)'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 0.7)'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    })

    return () => {
      pieChart.destroy()
      barChart.destroy()
    }
  }, [])

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="space-y-8"
    >
      <div className="bg-gray-900 p-6 rounded-lg">
        <canvas ref={chartRef} />
      </div>
      <div className="bg-gray-900 p-6 rounded-lg">
        <canvas ref={barChartRef} />
      </div>
    </motion.div>
  )
}

