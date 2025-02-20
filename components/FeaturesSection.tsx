'use client'

import { useRef } from 'react'
import { BarChart2, TrendingUp, MessageSquare, Globe } from 'lucide-react'
import { useIntersectionObserver } from '../app/hooks/useIntersectionObserver'

const features = [
  {
    icon: BarChart2,
    title: 'Powerful Data Visualizations',
    description: 'Showcase your school\'s superiority with compelling graphics.'
  },
  {
    icon: TrendingUp,
    title: 'Strategic Insights',
    description: 'Guide school policy based on real-world alumni outcomes.'
  },
  {
    icon: MessageSquare,
    title: 'AI-Powered Chatbot',
    description: 'Get instant, data-driven recommendations and insights.'
  },
  {
    icon: Globe,
    title: 'Reliable Data Sources',
    description: 'Ensure accuracy with data from trustworthy public sources.'
  }
]

export default function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isIntersecting = useIntersectionObserver(ref)

  return (
    <section 
      ref={ref}
      className={`py-20 bg-emerald-50 transition-opacity duration-1000 ease-in-out ${
        isIntersecting ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-emerald-800 mb-12">
          Our Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`bg-white p-6 rounded-lg shadow-md transition-transform duration-1000 ease-in-out ${
                isIntersecting ? 'translate-y-0' : 'translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <feature.icon className="w-12 h-12 text-teal-500 mb-4" />
              <h3 className="text-xl font-semibold text-emerald-800 mb-2">{feature.title}</h3>
              <p className="text-emerald-700">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

