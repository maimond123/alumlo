import Navigation from '../components/navigation'
import Hero from '../components/Hero'
import FeaturesSection from '../components/FeaturesSection'
import Footer from '../components/footer'


export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="fixed w-full z-20">
        <div className="absolute inset-0 bg-soft-white/70"></div>
        <Navigation />
      </div>

      <main className="pt-16 relative z-10">
        <Hero />
        <FeaturesSection />
      </main>

      <Footer />
    </div>
    
  )
}

