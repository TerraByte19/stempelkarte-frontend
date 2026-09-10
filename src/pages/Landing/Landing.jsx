import './Landing.css'
import Header from './sections/Header'
import Hero from './sections/Hero'
import ValueBand from './sections/ValueBand'
import HowItWorks from './sections/HowItWorks'
import Footer from './sections/Footer'

export default function Landing() {
  return (
    <div className="lp">
      <Header />
      <main>
        <Hero />
        <ValueBand />
        <HowItWorks />
        <section id="features" />
        <section id="pricing" />
        <section id="trust" />
        <section id="wallet" />
        <section id="contact" />
      </main>
      <Footer />
    </div>
  )
}
