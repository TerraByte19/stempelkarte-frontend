import './Landing.css'
import Header from './sections/Header'
import Footer from './sections/Footer'

export default function Landing() {
  return (
    <div className="lp">
      <Header />
      <main>
        <section id="hero" />
        <section id="value" />
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
