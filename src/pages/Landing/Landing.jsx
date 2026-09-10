import './Landing.css'
import Header from './sections/Header'
import Hero from './sections/Hero'
import ValueBand from './sections/ValueBand'
import Footer from './sections/Footer'

export default function Landing() {
  return (
    <div className="lp">
      <Header />
      <main>
        <Hero />
        <ValueBand />
        <section id="how" />
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
