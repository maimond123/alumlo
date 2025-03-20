import Navigation from '../components/navigation'
import Hero from '../components/Hero'
import FeaturesSection from '../components/FeaturesSection'
import ValueProposition from '../components/ValueProposition'
import Footer from '../components/footer'
import NetworkVisualization from '../components/network-visualization'

export default function Home() {
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-emerald-50 to-white"
      style={{
        transform: 'scale(0.8)'
      }}
    >
      <NetworkVisualization />
      <div className="fixed w-full z-20">
        <div className="absolute inset-0 bg-soft-white/70 backdrop-blur-md"></div>
        <Navigation />
      </div>

      <main className="pt-16 relative z-10">
        <Hero />
        <FeaturesSection />
        <ValueProposition />
      </main>

      <Footer />
    </div>
  )
}

