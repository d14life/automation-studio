import { BorderBeamPanel } from '@/components/ui/border-beam-panel'
import { GlowCard } from '@/components/ui/spotlight-card'

const R = 16
const BEAM = { beams: 2, thickness: 3, idleSpeed: 42, hoverSpeed: 42, glow: true } as const

export function About() {
  return (
    <section className="band" id="about"><div className="wrap">
      <p className="eyebrow">О нас</p>
      <h2>Не консультируем. Делаем</h2>
      <div className="about">
        <div>
          <p className="claim">Никаких обследований, презентаций и часов консультаций. Мы отдаём программу,
            которая делает работу вместо человека.</p>
          <ul className="does">
            <li><b>Никакой теории и обучения.</b><span>Отдаём программу, а не знания о том, как её сделать</span></li>
            <li><b>Никаких часов и почасовой оплаты.</b><span>Цена за результат, а не за время в календаре</span></li>
            <li><b>Никакой предоплаты.</b><span>Сначала работающая версия, потом деньги</span></li>
            <li><b>Отрасль неважна.</b><span>Логистика, стройка, торговля, услуги, производство</span></li>
          </ul>
        </div>
        <div className="stats">
          {/* spotlight-card inside the beam ring: the beam rotates, the spotlight follows the cursor */}
          <BorderBeamPanel {...BEAM} radius={R} seed={5} className="p-0 w-auto border-0 bg-transparent">
            <GlowCard customSize className="stat">
              <b>0 ₽</b><span>предоплата. Платите, только если инструмент помог</span>
            </GlowCard></BorderBeamPanel>
          <BorderBeamPanel {...BEAM} radius={R} seed={6} className="p-0 w-auto border-0 bg-transparent">
            <GlowCard customSize className="stat">
              <b>1 день</b><span>ушёл на учёт взаиморасчётов для строительной группы: 48 контрагентов,
              3 юрлица, мультивалюта</span>
            </GlowCard></BorderBeamPanel>
        </div>
      </div>
      {/* ждут данных от Damir: состав команды и образование, число сданных проектов и клиентов */}

    </div></section>
  )
}
