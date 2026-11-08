import './Landing.css'
import Header from './sections/Header'
import Hero from './sections/Hero'
import ValueBand from './sections/ValueBand'
import Proof from './sections/Proof'
import HowItWorks from './sections/HowItWorks'
import Features from './sections/Features'
import Stimmen from './sections/Stimmen'
import Vorfuehrung from './sections/Vorfuehrung'
import Pricing from './sections/Pricing'
import Trust from './sections/Trust'
import WalletFinale from './sections/WalletFinale'
import Contact from './sections/Contact'
import Einrichten from './sections/Einrichten'
import Footer from './sections/Footer'

export default function Landing() {
  return (
    <div className="lp">
      <Header />
      <main>
        <Hero />
        <ValueBand />
        <Proof />
        <HowItWorks />
        <Features />
        <Stimmen />
        <Pricing />
        <Vorfuehrung />
        <Trust />
        <WalletFinale />
        <Einrichten />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
