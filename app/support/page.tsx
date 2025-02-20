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
          <Link href="/data-insights" className="inline-flex items-center text-emerald-800 hover:text-emerald-600 mb-8">
            <ArrowLeft className="mr-2" size={20} />
            Back to Dashboard
          </Link>

          <header className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4 text-emerald-800">How Can We Help?</h1>
            <p className="text-2xl text-emerald-600">Our support team is here to assist you with any questions or concerns.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white p-8 rounded-lg shadow-lg"
            >
              <h2 className="text-3xl font-semibold mb-8 text-emerald-800">Send a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-emerald-700 mb-1">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-emerald-700 mb-1">Message</label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 h-40"
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-teal-500 text-white py-2 rounded-md hover:bg-teal-600 transition-colors flex items-center justify-center"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-8 rounded-lg shadow-lg"
            >
              <h2 className="text-3xl font-semibold mb-8 text-emerald-800">Schedule a Call</h2>
              <div className="rounded-lg overflow-hidden shadow-lg border border-emerald-100">
                <InlineWidget url="https://calendly.com/your-calendly-link" styles={{ height: '600px' }} />
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
      className="bg-emerald-50 rounded-xl p-8 flex flex-col items-center text-center hover:bg-emerald-100 transition-all cursor-pointer shadow-md"
    >
      <div className="bg-emerald-100 rounded-full p-5 mb-6">
        <Icon className="w-10 h-10 text-emerald-600" />
      </div>
      <h3 className="text-2xl font-semibold mb-3 text-emerald-800">{title}</h3>
      <p className="text-lg text-emerald-600">{description}</p>
    </motion.div>
  )
}

