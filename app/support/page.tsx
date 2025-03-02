'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { InlineWidget } from 'react-calendly'
import { Send, ArrowLeft, MessageSquare, Calendar, Phone } from 'lucide-react'
import Link from 'next/link'
import Footer from '../../components/footer'

export default function SupportPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Support message sent:', { subject, message })
    setSubject('')
    setMessage('')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <Link href="/data-insights" className="inline-flex items-center text-black hover:text-emerald-600 mb-8">
            <ArrowLeft className="mr-2" size={20} />
            Back to Dashboard
          </Link>

          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-3 text-black">How Can We Help?</h1>
            <p className="text-xl text-gray-700">Our support team is here to assist you.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <SupportCard
              icon={MessageSquare}
              title="Send a Message"
              description="Write to us about any issue or question you have."
            />
            <SupportCard
              icon={Calendar}
              title="Schedule a Call"
              description="Book a time for a one-on-one call with our support team."
            />
            <SupportCard
              icon={Phone}
              title="Live Chat"
              description="Chat with our support team in real-time for immediate assistance."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-50 p-6 rounded-lg shadow-sm"
            >
              <h2 className="text-2xl font-semibold mb-6 text-black">Send a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 h-32"
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition-colors flex items-center justify-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-50 p-6 rounded-lg shadow-sm"
            >
              <h2 className="text-2xl font-semibold mb-6 text-black">Schedule a Call</h2>
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <InlineWidget url="https://calendly.com/your-calendly-link" styles={{ height: '400px' }} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}

function SupportCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-50 rounded-lg p-6 flex flex-col items-center text-center hover:bg-gray-100 transition-all cursor-pointer shadow-sm"
    >
      <div className="bg-emerald-100 rounded-full p-4 mb-4">
        <Icon className="w-8 h-8 text-emerald-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-black">{title}</h3>
      <p className="text-gray-700">{description}</p>
    </motion.div>
  )
}

