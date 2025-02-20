'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Users, MapPin, Briefcase, GraduationCap, Award } from 'lucide-react'

const insights = [
  {
    icon: Users,
    metric: "40%",
    text: "of your alumni work in STEM fields",
    color: "text-golden-yellow"
  },
  {
    icon: MapPin,
    metric: "New York",
    text: "is the top employment region",
    color: "text-golden-yellow"
  },
  {
    icon: Briefcase,
    metric: "85%",
    text: "employment rate within 6 months",
    color: "text-golden-yellow"
  },
  {
    icon: GraduationCap,
    metric: "73%",
    text: "pursue higher education",
    color: "text-golden-yellow"
  },
  {
    icon: Award,
    metric: "92%",
    text: "report career satisfaction",
    color: "text-golden-yellow"
  },
  {
    icon: TrendingUp,
    metric: "3.2x",
    text: "increase in alumni engagement",
    color: "text-golden-yellow"
  }
]

export default function AnimatedInsights() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length)
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  const currentInsight = insights[currentIndex]

  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="bg-emerald-green rounded-lg p-6 shadow-lg"
          >
            <div className="flex items-center justify-center mb-3">
              {currentInsight.icon && (
                <currentInsight.icon 
                  className={`w-8 h-8 ${currentInsight.color}`} 
                />
              )}
            </div>
            <motion.h3 
              className={`text-3xl font-bold text-center mb-2 ${currentInsight.color}`}
            >
              {currentInsight.metric}
            </motion.h3>
            <p className="text-forest-green text-center text-sm">
              {currentInsight.text}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

