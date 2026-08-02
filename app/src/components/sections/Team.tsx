import { BorderBeamPanel } from '@/components/ui/border-beam-panel'

const R = 16
const BEAM = { beams: 2, thickness: 3, idleSpeed: 42, hoverSpeed: 42, glow: true } as const

export function Team() {
  return (
    <section className="band" id="team"><div className="wrap">
      <p className="eyebrow">Команда</p>
      <h2>Один инженер. ИИ вместо отдела.</h2>
      <div className="about">
        <div>
          <p className="claim">Здесь нет этажа сотрудников. Один инженер отвечает за код и за результат,
            а рутину - тесты, документацию, черновики - берёт на себя собственный ИИ-конвейер.</p>
          <ul className="does">
            <li><b>Один инженер отвечает за результат.</b><span>Без очереди из менеджеров между вами и тем,
              кто пишет код</span></li>
            <li><b>ИИ-конвейер закрывает рутину.</b><span>Скорость идёт от инструментов, а не от размера
              команды</span></li>
            <li><b>Решения принимаются сразу.</b><span>Без согласований и совещаний ради совещаний</span></li>
          </ul>
        </div>
        <div className="stats">
          <BorderBeamPanel {...BEAM} radius={R} seed={14} className="stat tm-slot p-0 w-auto border-0 bg-transparent" hidden>
            {/* ЗАПОЛНИТЬ: сколько человек в команде */}
            <b className="tm-fill">состав команды - уточняется</b><span>Дамир добавит точное число и роли</span>
          </BorderBeamPanel>
          <BorderBeamPanel {...BEAM} radius={R} seed={15} className="stat tm-slot p-0 w-auto border-0 bg-transparent" hidden>
            {/* ЗАПОЛНИТЬ: образование и квалификация */}
            <b className="tm-fill">образование - уточняется</b><span>Дамир добавит квалификацию и опыт</span>
          </BorderBeamPanel>
        </div>
      </div>
    </div></section>
  )
}
