'use client'

import { ReactNode, useRef } from 'react'
import { useIntersectionObserver } from '../app/hooks/useIntersectionObserver'
import * as Icons from 'lucide-react'

interface ContentSectionProps {
  title: string
  description: string
  children?: ReactNode
  reversed?: boolean
  iconName: keyof typeof Icons
}

export default function ContentSection({ title, description, children, reversed = false, iconName }: ContentSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isIntersecting = useIntersectionObserver(ref)
  const Icon = Icons[iconName]

  return (
    <section 
      ref={ref}
      className={`py-20 ${reversed ? 'bg-emerald-50' : 'bg-white'} transition-opacity duration-1000 ease-in-out ${
        isIntersecting ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className={`container mx-auto px-6 flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-center`}>
        <div className={`md:w-1/2 mb-8 md:mb-0 transition-transform duration-1000 ease-in-out ${
          isIntersecting ? 'translate-y-0' : 'translate-y-10'
        }`}>
          <h2 className="text-4xl font-bold text-emerald-800 mb-4">{title}</h2>
          <p className="text-lg text-emerald-700 mb-6">{description}</p>
          {children}
        </div>
        <div className={`md:w-1/2 flex justify-center transition-transform duration-1000 ease-in-out ${
          isIntersecting ? 'translate-y-0' : 'translate-y-10'
        }`}>
          <div className="w-full max-w-md h-64 bg-emerald-200 rounded-lg flex items-center justify-center">
            <Icon className="w-32 h-32 text-emerald-600" />
          </div>
        </div>
      </div>
    </section>
  )
}


