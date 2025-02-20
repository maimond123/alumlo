'use client'

import { useRef } from 'react'
import { useIntersectionObserver } from '../app/hooks/useIntersectionObserver'

const stats = [
  { value: '15+', label: 'Partner Schools' },
  { value: '5000+', label: 'Alumni Tracked' },
  { value: '95%', label: 'Engagement Rate' },
  { value: '4.9', label: 'Client Rating' },
]

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null)
  const isIntersecting = useIntersectionObserver(ref)

  return (
    <div 
      ref={ref}
      className={`grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 transition-opacity duration-1000 ease-in-out ${
        isIntersecting ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`text-center transition-transform duration-1000 ease-in-out ${
            isIntersecting ? 'translate-y-0' : 'translate-y-10'
          }`}
          style={{ transitionDelay: `${index * 100}ms` }}
        >
          <div className="text-4xl font-bold text-yellow-500 mb-2">
            {stat.value}
          </div>
          <div className="text-emerald-700 text-sm">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}

