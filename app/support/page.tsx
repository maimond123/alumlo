'use client'

import { useState } from "react";
import { motion } from 'framer-motion'
import { InlineWidget } from 'react-calendly'
import Sidebar from '../../components/Sidebar'
import Footer from '../../components/footer'
import Navigation from "../../components/navigation";

export default function Support() {
  const [showCalendly, setShowCalendly] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-1/4 bg-gray-100 p-4">
          {/* Sidebar content */}
        </aside>

        {/* Main Content */}
        <section className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-4">How Can We Help?</h1>
          <p className="mb-6">Our support team is here to assist you.</p>

          {/* Schedule a Call Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">Schedule a Call</h2>
            <button
              onClick={() => setShowCalendly(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Open Calendly
            </button>
          </div>

          {/* Email Us Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-2">Email Us</h2>
            <p>For further assistance, please email us at support@example.com.</p>
          </div>
        </section>
      </main>

      {/* Calendly Modal */}
      {showCalendly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl">
            <button onClick={() => setShowCalendly(false)} className="mb-4 text-black hover:text-gray-700">
              Close
            </button>
            <InlineWidget url="https://calendly.com/your-calendly-link" />
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

