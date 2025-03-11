'use client'

import { motion } from 'framer-motion'
import Sidebar from '../../components/Sidebar'
import Footer from '../../components/footer'

export default function SupportPage() {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-8 pt-20">
        <div className="container mx-auto px-4 py-8 border border-black rounded-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <header className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-3 text-black">How Can We Help?</h1>
              <p className="text-xl text-gray-700">Our support team is here to assist you.</p>
            </header>

            <div className="flex flex-col gap-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-50 p-6 rounded-lg shadow-sm"
              >
                <h2 className="text-2xl font-semibold mb-6 text-black">Schedule a Call</h2>
                <button
                  onClick={() => window.open('https://calendly.com/your-calendly-link', '_blank')}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Open Calendly
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-50 p-6 rounded-lg shadow-sm"
              >
                <h2 className="text-2xl font-semibold mb-6 text-black">Email Us</h2>
                <p className="text-lg text-gray-700">
                  For further assistance, please email us at <a href="mailto:david@alumintel.com" className="text-emerald-600">david@alumintel.com</a>.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

