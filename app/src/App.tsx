import { Starfield } from '@/components/fx/Starfield'
import { TubeLayer } from '@/components/fx/TubeLayer'
import { TopBar } from '@/components/sections/TopBar'
import { Hero } from '@/components/sections/Hero'
import { About } from '@/components/sections/About'
import { Services } from '@/components/sections/Services'
import { Projects } from '@/components/sections/Projects'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { SelfCheck } from '@/components/sections/SelfCheck'
import { Team } from '@/components/sections/Team'
import { RequestForm } from '@/components/sections/RequestForm'
import { Contacts } from '@/components/sections/Contacts'
import { SiteFooter } from '@/components/sections/SiteFooter'
import { AiPanel } from '@/components/sections/AiPanel'
import { useVendorScripts } from '@/hooks/useVendorScripts'
import { useHeroVisible } from '@/hooks/useHeroVisible'
import { useLiquidSlogan } from '@/hooks/useLiquidSlogan'
import { useHeroParallax } from '@/hooks/useHeroParallax'
import { useSpotlight } from '@/hooks/useSpotlight'
import { useCardFan } from '@/hooks/useCardFan'
import { useCardTilt } from '@/hooks/useCardTilt'
import { useReveal } from '@/hooks/useReveal'
import { useBurgerMenu } from '@/hooks/useBurgerMenu'
import { useRequestForm } from '@/hooks/useRequestForm'
import { useAiPanel } from '@/hooks/useAiPanel'

export default function App() {
  const ready = useVendorScripts()
  const heroVisible = useHeroVisible()
  const burger = useBurgerMenu()
  const ai = useAiPanel(ready)
  const onRequestSubmit = useRequestForm()

  useLiquidSlogan(ready, heroVisible)
  useHeroParallax()
  useSpotlight()
  useCardFan()
  useCardTilt()
  useReveal()

  return (
    <>
      <Starfield ready={ready} />
      <TubeLayer ready={ready} heroVisible={heroVisible} />

      <TopBar onAiOpen={ai.open} onBurger={burger.toggle} navOpen={burger.open} onNavClick={burger.onNavClick} />
      <Hero onAiOpen={ai.open} />
      <About />
      <Services />
      <Projects />
      <HowItWorks />
      <SelfCheck />
      <Team />
      <RequestForm onAiOpen={ai.open} onSubmit={onRequestSubmit} />
      <Contacts />
      <SiteFooter />

      <AiPanel {...ai} />
    </>
  )
}
