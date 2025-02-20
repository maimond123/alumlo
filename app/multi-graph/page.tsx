'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Send, X } from 'lucide-react'

const lineData = [
  { name: 'Jan', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Feb', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'Mar', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'Apr', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'May', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'Jun', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'Jul', uv: 3490, pv: 4300, amt: 2100 },
]

const barData = [
  { name: 'A', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'B', uv: 3000, pv: 1398, amt: 2210 },
  { name: 'C', uv: 2000, pv: 9800, amt: 2290 },
  { name: 'D', uv: 2780, pv: 3908, amt: 2000 },
  { name: 'E', uv: 1890, pv: 4800, amt: 2181 },
  { name: 'F', uv: 2390, pv: 3800, amt: 2500 },
  { name: 'G', uv: 3490, pv: 4300, amt: 2100 },
]

export default function MultiGraphPage() {
  const [expandedGraph, setExpandedGraph] = useState<'line' | 'bar' | null>(null)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { role: 'user', content: input }])
      // Here you would typically send the message to your AI backend
      // For now, we'll just echo the message back
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: `You asked about the ${expandedGraph} graph: ${input}` }])
      }, 1000)
      setInput('')
    }
  }

  const Graph = ({ type, data }: { type: 'line' | 'bar'; data: any[] }) => (
    <motion.div
      className="bg-soft-white bg-opacity-10 rounded-2xl shadow-lg p-6 h-[400px] backdrop-blur-md border border-soft-white border-opacity-20 cursor-pointer"
      whileHover={{ scale: 1.02 }}
      onClick={() => setExpandedGraph(type)}
    >
      <ResponsiveContainer width="100%" height="100%">
        {type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#F5F5F5" />
            <YAxis stroke="#F5F5F5" />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }} />
            <Legend />
            <Line type="monotone" dataKey="pv" stroke="#FFD700" />
            <Line type="monotone" dataKey="uv" stroke="#50C878" />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#F5F5F5" />
            <YAxis stroke="#F5F5F5" />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }} />
            <Legend />
            <Bar dataKey="pv" fill="#FFD700" />
            <Bar dataKey="uv" fill="#50C878" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green to-emerald-green p-8">
      <h1 className="text-4xl font-bold mb-6 text-soft-white">Multi-Graph Analysis</h1>
      <div className="grid grid-cols-2 gap-8">
        <Graph type="line" data={lineData} />
        <Graph type="bar" data={barData} />
      </div>

      <AnimatePresence>
        {expandedGraph && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-forest-green bg-opacity-50 backdrop-blur-md flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-soft-white bg-opacity-10 rounded-2xl shadow-lg p-6 max-w-6xl w-full mx-4 backdrop-blur-md border border-soft-white border-opacity-20"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-soft-white">
                  {expandedGraph === 'line' ? 'Line Graph Analysis' : 'Bar Graph Analysis'}
                </h2>
                <button
                  onClick={() => setExpandedGraph(null)}
                  className="text-soft-white hover:text-golden-yellow transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex space-x-4">
                <div className="w-2/3 h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {expandedGraph === 'line' ? (
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="#F5F5F5" />
                        <YAxis stroke="#F5F5F5" />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }} />
                        <Legend />
                        <Line type="monotone" dataKey="pv" stroke="#FFD700" />
                        <Line type="monotone" dataKey="uv" stroke="#50C878" />
                      </LineChart>
                    ) : (
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="#F5F5F5" />
                        <YAxis stroke="#F5F5F5" />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }} />
                        <Legend />
                        <Bar dataKey="pv" fill="#FFD700" />
                        <Bar dataKey="uv" fill="#50C878" />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
                <div className="w-1/3 flex flex-col">
                  <div className="flex-grow bg-soft-white bg-opacity-10 rounded-2xl p-4 mb-4 overflow-y-auto backdrop-blur-md border border-soft-white border-opacity-20">
                    {messages.map((msg, index) => (
                      <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <span className={`inline-block p-2 rounded-lg ${msg.role === 'user' ? 'bg-golden-yellow text-forest-green' : 'bg-emerald-green text-soft-white'}`}>
                          {msg.content}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-grow bg-soft-white bg-opacity-10 text-soft-white rounded-l-lg px-4 py-2 focus:outline-none backdrop-blur-md border border-soft-white border-opacity-20"
                      placeholder="Ask about the graph..."
                    />
                    <button
                      onClick={handleSend}
                      className="bg-golden-yellow text-forest-green rounded-r-lg px-4 py-2 hover:bg-opacity-90 transition-colors"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

