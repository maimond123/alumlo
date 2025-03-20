'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { InlineWidget } from 'react-calendly'
import Sidebar from '../../components/Sidebar'
import Footer from '../../components/footer'
import { getUserEmail } from '../utils/auth'
import { supabase } from '../data/supabase'

export default function SupportPage() {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showDemoSurvey, setShowDemoSurvey] = useState(false)

  useEffect(() => {
    const checkIfDemoAccount = async () => {
      try {
        // Get user email
        const userEmail = await getUserEmail()
        
        // Check if this is a demo user
        if (userEmail === "maimondavid553@gmail.com") {
          setIsDemoMode(true);
        }
      } catch (error) {
        // Silently handle error
      }
    }

    checkIfDemoAccount()
  }, [])

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-8 pt-20 flex items-center justify-center">
        <div className="container max-w-3xl mx-auto px-4 py-8 border border-black rounded-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full text-center"
          >
            <header className="mb-12">
              <h1 className="text-4xl font-bold mb-3 text-black">How Can We Help?</h1>
              <p className="text-xl text-gray-700">Our support team is here to assist you.</p>
            </header>

            <div className="flex flex-col gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-50 p-6 rounded-lg shadow-sm w-full max-w-2xl"
              >
                <h2 className="text-2xl font-semibold mb-6 text-black">Schedule a Call</h2>
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <InlineWidget url="https://calendly.com/maimondavid553/alumintel-support" styles={{ height: '400px' }} />
                </div>
              </motion.div>

              {isDemoMode ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-emerald-50 p-6 rounded-lg shadow-sm w-full max-w-2xl border border-emerald-200"
                >
                  <h2 className="text-2xl font-semibold mb-6 text-emerald-800">Want AlumIntel for Your School?</h2>
                  <p className="text-lg text-gray-700 mb-6">
                    Ready to transform how you track and leverage your alumni network? Get AlumIntel customized for your institution.
                  </p>
                  <button 
                    onClick={() => setShowDemoSurvey(true)}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors font-medium"
                  >
                    Request Information
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gray-50 p-6 rounded-lg shadow-sm w-full max-w-2xl"
                >
                  <h2 className="text-2xl font-semibold mb-6 text-black">Email Us</h2>
                  <p className="text-lg text-gray-700">
                    For further assistance, please email us at <a href="mailto:david@alumintel.com" className="text-teal-500">david@alumintel.com</a>.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Demo Survey Modal */}
      {isDemoMode && showDemoSurvey && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close the modal when clicking the backdrop (outside the modal)
            if (e.target === e.currentTarget) {
              setShowDemoSurvey(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 w-full text-center">Want AlumIntel for Your School?</h2>
              <button 
                onClick={() => setShowDemoSurvey(false)}
                className="text-gray-500 hover:text-gray-700 absolute right-6 top-6"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form className="space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              
              // Get form data
              const formData = new FormData(e.currentTarget);
              const schoolName = formData.get('school-name') as string;
              const email = formData.get('email') as string;
              const features = Array.from(formData.getAll('features')) as string[];
              const budget = formData.get('budget') as string;
              
              try {
                // Save to Supabase
                const { error } = await supabase
                  .from('demo_survey_responses')
                  .insert([{ 
                    school_name: schoolName,
                    email: email,
                    features: features,
                    budget: budget,
                    created_at: new Date().toISOString()
                  }]);
                  
                if (error) throw error;
                
                // Show confirmation message
                setShowDemoSurvey(false);
                
                // Show confirmation modal
                alert("Thank you for your interest! We'll contact you within 24 hours with more information about how AlumIntel can work for your institution.");
                
              } catch (error) {
                console.error('Error submitting survey:', error);
                alert('There was an error submitting your information. Please try again.');
              }
            }}>
              <div>
                <label htmlFor="school-name" className="block text-sm font-medium text-gray-700 mb-1">
                  What's your school's name?
                </label>
                <input
                  type="text"
                  id="school-name"
                  name="school-name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Westfield High School"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Your work email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="name@work.edu"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which features would be most valuable to your institution?
                </label>
                <div className="space-y-2">
                  {[
                    "Alumni Search and Discovery",
                    "Aggregate Alumni Analytics",
                    "Customizable School Insights Report",
                    "Student Mentorship Connections",
                    "Fundraising Insights",
                    "New Alumni Database",
                    "Networking Opportunities"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`feature-${index}`}
                        name="features"
                        value={feature}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`feature-${index}`} className="ml-2 text-gray-700">
                        {feature}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                >
                  Submit & Continue Exploring
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

