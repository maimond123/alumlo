import Navigation from '../components/navigation'
import Hero from '../components/Hero'
import FeaturesSection from '../components/FeaturesSection'
import Footer from '../components/footer'

export default function Home() {
  // Approximate height of the navigation bar in its scaled state (if it were scaled)
  // Or, more simply, the unscaled height if the main content padding is inside the scaled area.
  // Let's assume the nav bar is roughly 68px high. If scaled by 0.82, this is 68 / 0.82 = ~83px
  // This padding will be applied *inside* the .scaled-content-area
  const navHeightForPadding = 'pt-[83px]'; // Adjust this value based on actual nav height

  return (
    <>
      <Navigation /> 
      <div className="scaled-content-wrapper">
        <div className={`scaled-content-area ${navHeightForPadding}`}>
          <Hero />
          <FeaturesSection />
          <Footer />
        </div>
      </div>
    </>
  )
}

