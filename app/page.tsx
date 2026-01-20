import Navigation from '../components/navigation'
import Hero from '../components/Hero'
import FeaturesSection from '../components/FeaturesSection'
import Footer from '../components/footer'

export default function Home() {
  return (
    <>
      <Navigation /> 
      <div className="pt-20"> {/* Standard padding for navigation */}
        <Hero />
        <FeaturesSection />
        <Footer />
      </div>
    </>
  )
}

