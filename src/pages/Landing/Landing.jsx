import './Landing.css'
import Header from './sections/Header'
import Hero from './sections/Hero'
import ValueBand from './sections/ValueBand'
import HowItWorks from './sections/HowItWorks'
import Features from './sections/Features'
import Trust from './sections/Trust'
import WalletFinale from './sections/WalletFinale'
import Contact from './sections/Contact'
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
        <Trust />
        <WalletFinale />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
