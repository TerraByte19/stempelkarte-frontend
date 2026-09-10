import './Landing.css'
import Header from './sections/Header'
import Hero from './sections/Hero'
import ValueBand from './sections/ValueBand'
import HowItWorks from './sections/HowItWorks'
import Features from './sections/Features'
import Pricing from './sections/Pricing'
import Trust from './sections/Trust'
import Footer from './sections/Footer'

export default function Landing() {
  return (
    <div className="lp">
      <Header />
      <main>
        <Hero />
        <ValueBand />
        <HowItWorks />
        <Features />
        <Pricing />
        <Trust />
        <section id="wallet" />
        <section id="contact" />
      </main>
      <Footer />
    </div>
  )
}
