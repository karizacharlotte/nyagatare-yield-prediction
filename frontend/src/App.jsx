import './index.css'
import { LangProvider } from './context/LangContext'
import { ThemeProvider } from './context/ThemeContext'
import Header from './components/Header'
import Hero from './components/Hero'
import PredictionForm from './components/PredictionForm'
import About from './components/About'
import Footer from './components/Footer'

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Hero />
            <PredictionForm />
            <About />
          </main>
          <Footer />
        </div>
      </LangProvider>
    </ThemeProvider>
  )
}
