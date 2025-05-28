'use client'

import { useEffect, useRef } from 'react'

interface NetworkVisualizationProps {
  fullScreen?: boolean;
}

export default function NetworkVisualization({ fullScreen = false }: NetworkVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size based on container
    const resizeCanvas = () => {
      const { width, height } = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      
      ctx.scale(dpr, dpr)
    }

    // Initial resize
    resizeCanvas()

    // Handle window resize
    window.addEventListener('resize', resizeCanvas)

    // Node class
    class Node {
      x: number
      y: number
      vx: number
      vy: number
      radius: number

      constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = (Math.random() - 0.5) * 0.5
        this.radius = Math.random() * 2 + 2;
      }

      update(width: number, height: number) {
        this.x += this.vx
        this.y += this.vy

        if (this.x < 0 || this.x > width) this.vx *= -1
        if (this.y < 0 || this.y > height) this.vy *= -1
      }
    }

    // Create nodes
    const nodes: Node[] = Array.from({ length: 120 }, () => 
      new Node(
        Math.random() * container.offsetWidth,
        Math.random() * container.offsetHeight
      )
    )

    // Animation
    const animate = () => {
      const { width, height } = container.getBoundingClientRect()
      ctx.clearRect(0, 0, width, height)
      
      // Update and draw nodes
      nodes.forEach(node => {
        node.update(width, height)
      })

      // Draw connections
      ctx.strokeStyle = 'rgba(0, 0, 0, 1)'
      ctx.lineWidth = 3
      
      nodes.forEach((nodeA, i) => {
        nodes.slice(i + 1).forEach(nodeB => {
          const dx = nodeA.x - nodeB.x
          const dy = nodeA.y - nodeB.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 110) {
            ctx.beginPath()
            ctx.moveTo(nodeA.x, nodeA.y)
            ctx.lineTo(nodeB.x, nodeB.y)
            ctx.stroke()
          }
        })
      })

      // Draw nodes
      nodes.forEach(node => {
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 4)
        ctx.fillStyle = 'rgba(255, 215, 0, 1)'
        ctx.fill()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <div ref={containerRef} className="fixed inset-y-0 right-0 w-2/3 h-full">
      <canvas 
        ref={canvasRef}
        className="absolute top-0 right-0 w-full h-full opacity-40"
      />
    </div>
  )
}
