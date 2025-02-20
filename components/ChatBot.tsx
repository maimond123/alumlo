'use client'

import { Send } from 'lucide-react'
import { useRef, useEffect, useState, FormEvent, ChangeEvent } from 'react'
import { ChartData } from '../app/data/chartData'

interface ChatBotProps {
  chartId: string
  chartData: ChartData
}

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const ChatBot: React.FC<ChatBotProps> = ({ chartId, chartData }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          chartId
        })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                assistantMessage += data.content
                setMessages(prev => {
                  const newMessages = [...prev]
                  // Update or add the assistant's message
                  const lastMessage = newMessages[newMessages.length - 1]
                  if (lastMessage?.role === 'assistant') {
                    lastMessage.content = assistantMessage
                  } else {
                    newMessages.push({ role: 'assistant', content: assistantMessage })
                  }
                  return newMessages
                })
              } catch (e) {
                console.error('Error parsing chunk:', e)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-semibold mb-4 text-white">Chat about this chart</h3>
      <div className="flex-1 overflow-auto mb-4 bg-black/20 rounded-lg p-4">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div className={`inline-block p-2 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-green-500 text-white' 
                : 'bg-white/90 text-gray-900'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form 
        onSubmit={handleSubmit} 
        className="flex"
      >
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about the chart..."
          className="flex-1 px-4 py-2 bg-white/10 border border-white rounded-l-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-emerald-500 text-forest-green px-4 py-2 rounded-r-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5 text-white" />
        </button>
      </form>
    </div>
  )
}

export default ChatBot

