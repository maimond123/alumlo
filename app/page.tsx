import Navigation from '../components/navigation'
import Hero from '../components/Hero'
import ContentSection from '../components/ContentSection'
import FeaturesSection from '../components/FeaturesSection'
import Stats from '../components/stats'
import Footer from '../components/footer'
import NetworkVisualization from '../components/network-visualization'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white scale-85 origin-top">
      <NetworkVisualization />
      <div className="fixed w-full z-20">
        <div className="absolute inset-0 bg-soft-white/70 backdrop-blur-md"></div>
        <Navigation />
      </div>

      <main className="pt-16 relative z-10">
        <Hero />

        <ContentSection
          title="Elevate Your School's Marketing"
          description="Showcase your school's superiority with compelling data visualizations."
          iconName="BarChart"
        >
          <ul className="list-disc list-inside text-emerald-700">
            <li>Highlight industry strengths</li>
            <li>Demonstrate superior outcomes</li>
            <li>Showcase alumni success</li>
          </ul>
        </ContentSection>

        <FeaturesSection />

        <ContentSection
          title="Data-Driven Decision Making"
          description="Guide policies and resource allocation with invaluable insights."
          reversed
          iconName="TrendingUp"
        >
          <ul className="list-disc list-inside text-emerald-700">
            <li>Identify high-performing programs</li>
            <li>Allocate funding strategically</li>
            <li>Improve based on real outcomes</li>
          </ul>
        </ContentSection>

        <section className="py-20 bg-emerald-50">
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center text-emerald-800 mb-12">The AlumIntel Advantage</h2>
            <Stats />
          </div>
        </section>

        <ContentSection
          title="AI-Powered Insights"
          description="Uncover trends and get recommendations with our advanced AI chatbot."
          iconName="Brain"
        >
          <ul className="list-disc list-inside text-emerald-700">
            <li>Instant answers to complex questions</li>
            <li>AI-generated reports and recommendations</li>
            <li>Discover hidden trends in alumni data</li>
          </ul>
        </ContentSection>

        <ContentSection
          title="Ethical Data Collection"
          description="Ensure accuracy and privacy with reliable, public information sources."
          reversed
          iconName="Shield"
        >
          <ul className="list-disc list-inside text-emerald-700">
            <li>Data from reputable public sources</li>
            <li>Compliant with data protection regulations</li>
            <li>Transparent collection and analysis</li>
          </ul>
        </ContentSection>

        <ContentSection
          title="Transform Your School's Future"
          description="Leverage data-driven insights to showcase strengths and make informed decisions."
          iconName="Rocket"
        >
          <a href="/signup" className="inline-block bg-teal-500 text-white px-6 py-2 rounded-full text-lg font-semibold hover:bg-teal-600 transition-colors">
            Start Your Data Journey
          </a>
        </ContentSection>
      </main>

      <Footer />
    </div>
  )
}

