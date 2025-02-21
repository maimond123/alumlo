'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { InlineWidget } from 'react-calendly'
import NetworkVisualization from '../../components/network-visualization'
import Footer from '../../components/footer'
import Navigation from '../../components/navigation-signup'
import Link from 'next/link'
import { supabase } from "../data/supabase"
import { Loader2 } from "lucide-react"
import { normalizeSchoolName } from '../../components/schoolNameUtils'

export default function Signup() {
  const [showCalendly, setShowCalendly] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    schoolEmail: '',
    schoolName: '',
    schoolWebsite: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const newErrors: { [key: string]: string } = {}

    // Check required fields
    if (!formData.firstName) newErrors.firstName = "First Name is required"
    if (!formData.lastName) newErrors.lastName = "Last Name is required"
    if (!formData.schoolEmail) newErrors.schoolEmail = "School Email is required"
    if (!formData.schoolName) newErrors.schoolName = "School Name is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    try {
      // Generate normalized table name
      const normalizedTableName = normalizeSchoolName(formData.schoolName)

      const { data, error } = await supabase.from("customer_information").insert([
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          school_email: formData.schoolEmail,
          school_name: formData.schoolName,
          school_website: formData.schoolWebsite,
          table_name: normalizedTableName  // Store the normalized name
        },
      ]);

      if (error) {
        console.error("Supabase error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log("Successfully inserted data:", data);
      setShowCalendly(true);
    } catch (error) {
      console.error("Error inserting data:", error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
      }
      setErrors({ submit: "An error occurred. Please try again." });
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen w-full">
      <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 to-white overflow-hidden scale-80 origin-top transform">
        <Navigation />
        <main className="relative min-h-screen w-full">
          <div className="container mx-auto px-6 pt-32">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start">
  
              <div className="md:w-1/2 mb-12 md:mb-0">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-5xl md:text-7xl font-bold text-emerald-800 mb-4"
                >
                  Join the Alumni<br />
                  Revolution<span className="text-teal-500">.</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-xl text-black mb-8"
                >
                  Transform your alumni analytics today.
                </motion.p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                      <input
                        type="text"
                        name="firstName"
                        required
                        className="w-full bg-white bg-opacity-50 border-2 border-black rounded-lg px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:border-golden-yellow transition-colors"
                        placeholder="First Name *"
                        value={formData.firstName}
                        onChange={handleChange}
                      />
                      {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                      <input
                        type="text"
                        name="lastName"
                        required
                        className="w-full bg-white bg-opacity-50 border-2 border-black rounded-lg px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:border-golden-yellow transition-colors"
                        placeholder="Last Name *"
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                      {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                    </motion.div>
                  </div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <input
                      type="email"
                      name="schoolEmail"
                      required
                      className="w-full bg-white bg-opacity-50 border-2 border-black rounded-lg px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:border-golden-yellow transition-colors"
                      placeholder="School Email (e.g., john.doe@school.edu) *"
                      value={formData.schoolEmail}
                      onChange={handleChange}
                    />
                    {errors.schoolEmail && <p className="text-red-500 text-sm mt-1">{errors.schoolEmail}</p>}
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    <input
                      type="text"
                      name="schoolName"
                      required
                      className="w-full bg-white bg-opacity-50 border-2 border-black rounded-lg px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:border-golden-yellow transition-colors"
                      placeholder="School Name *"
                      value={formData.schoolName}
                      onChange={handleChange}
                    />
                    {errors.schoolName && <p className="text-red-500 text-sm mt-1">{errors.schoolName}</p>}
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                    <input
                      type="url"
                      name="schoolWebsite"
                      className="w-full bg-white bg-opacity-50 border-2 border-black rounded-lg px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:border-golden-yellow transition-colors"
                      placeholder="School Website"
                      value={formData.schoolWebsite}
                      onChange={handleChange}
                    />
                  </motion.div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-transparent text-black border-2 border-black px-8 py-4 rounded-full text-xl font-semibold hover:bg-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      "Schedule Demo"
                    )}
                  </button>
                </form>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-8 text-center">
                  <p className="text-black text-lg">
                    If your school already uses AlumIntel, <a href="/signin" className="underline text-teal-500">sign-in here</a>.
                  </p>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="mt-4">
                  <Link href="/data-insights">
                    <button className="w-full bg-teal-500 text-white px-8 py-4 rounded-full text-xl font-semibold hover:bg-teal-600 transition-colors">
                      Go to Data Insights (temporary)
                    </button>
                  </Link>
                </motion.div>
              </div>

              
            </div>
          </div>

          {/* Network Visualization taking full height */}
          <div className="absolute top-0 right-0 w-1/2 h-screen">
            <NetworkVisualization />
          </div>

          {showCalendly && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <div className="bg-white rounded-lg p-8 w-full max-w-2xl">
                <button 
                  onClick={() => setShowCalendly(false)}
                  className="mb-4 text-black hover:text-gray-700"
                >
                  Close
                </button>
                <InlineWidget url="https://calendly.com/maimondavid553/alumintel-demo" />
              </div>
            </motion.div>
          )}
        </main>
        <Footer />
      </div>
    </div>
  )
}
