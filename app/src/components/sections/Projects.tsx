import { BorderBeamPanel } from '@/components/ui/border-beam-panel'
import { TravelingBeams } from '@/components/ui/traveling-beams'
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button'

/* Card radius must match .projects .proj in site.css — BorderBeamPanel writes it inline. */
const R = 22

/* Damir: no speed-up on hover. Equal idle/hover speeds leave the spring target unchanged,
   so the comets keep one constant 42 deg/s (a lap every 8.5s) whatever the pointer does. */
const BEAM = { beams: 2, thickness: 3, radius: R, idleSpeed: 42, hoverSpeed: 42, glow: true } as const

/* Kills the donor's own Tailwind box so site.css keeps owning the card's look. */
const SHELL = 'proj p-0 w-auto border-0 bg-transparent'

export function Projects() {
  return (
    <section className="band" id="projects"><div className="wrap">
      <p className="eyebrow">Проекты</p>
      <h2>Что уже собрано и как это выглядит</h2>
      <div className="projects">

        <BorderBeamPanel {...BEAM} seed={1} className={SHELL}>
          <TravelingBeams radius={R} />
          <div className="shot sh-shot"><div className="sh-w">
            <div className="sh-hd">
              <span className="sh-dots"><i></i><i></i><i></i></span>
              <b>Взаиморасчёты</b>
              <span className="sh-tab sh-on">Долги</span><span className="sh-tab">Оплаты</span>
              <span className="sh-mr">3 юрлица</span>
            </div>
            <div className="sh-b">
              <div className="sh-ch"><span className="sh-t">Контрагент</span><span>Сальдо, ₸</span><span className="sh-age">Срок</span></div>
              <div className="sh-r"><span className="sh-t">КазСтройМет</span><span className="sh-n">4 820 000</span><span className="sh-age"><i className="sh-p">0-30</i></span></div>
              <div className="sh-r"><span className="sh-t">Аском Трейд</span><span className="sh-n">1 145 300</span><span className="sh-age"><i className="sh-p">31-60</i></span></div>
              <div className="sh-r"><span className="sh-t">СМУ-7 Астана</span><span className="sh-n">930 000</span><span className="sh-age"><i className="sh-p sh-p2">60+</i></span></div>
              <div className="sh-r"><span className="sh-t">Гидромаш КЗ</span><span className="sh-n">612 400</span><span className="sh-age"><i className="sh-p sh-p3">90+</i></span></div>
              <div className="sh-tot"><span className="sh-t">Итого к получению</span><span className="sh-n">7 507 700</span><span className="sh-age"></span></div>
            </div>
          </div></div>
          <div className="body">
            <LiquidMetalButton label="Стройка · Казахстан · работает у клиента" />
            <h3>Учёт взаиморасчётов</h3>
            <p>Долги нам и наши долги против 1С: 48 контрагентов, 3 юрлица, мультивалюта, старение долга,
              платёжный календарь. Собрано за один день, развёрнуто внутри сети клиента.</p>
            <a className="go" href="demo/index.html" target="_blank" rel="noopener">Открыть живой продукт</a>
          </div>
        </BorderBeamPanel>

        <BorderBeamPanel {...BEAM} seed={2} className={SHELL}>
          <TravelingBeams radius={R} />
          <div className="shot sh-shot"><div className="sh-w">
            <div className="sh-hd">
              <span className="sh-dots"><i></i><i></i><i></i></span>
              <b>Посылка</b>
              <span className="sh-n">KZ-4417-2290</span>
              <span className="sh-p sh-mr">В пути</span>
            </div>
            <div className="sh-b">
              <div className="sh-rail">
                <span className="sh-st sh-done"><i></i><em>Принят</em><b>11.03</b></span>
                <span className="sh-st sh-done"><i></i><em>Склад</em><b>12.03</b></span>
                <span className="sh-st sh-done"><i></i><em>Отгрузка</em><b>13.03</b></span>
                <span className="sh-st sh-now"><i></i><em>В пути</em><b>13.03</b></span>
                <span className="sh-st"><i></i><em>Выдача</em><b>14.03</b></span>
              </div>
              <div className="sh-ev"><i></i>Обновлено 13.03, 09:14 · Астана - Алматы</div>
              <div className="sh-facts">
                <span><em>Перевозчик</em><b>СДЭК</b></span>
                <span><em>Город</em><b>Алматы</b></span>
                <span><em>Прибытие</em><b className="sh-n">14.03</b></span>
              </div>
            </div>
          </div></div>
          <div className="body">
            <LiquidMetalButton label="Логистика · работает у клиента" />
            <h3>Доска отслеживания посылок</h3>
            <p>Документы создаются из состояния сделки, а посылка видна от заказа до двери на одном экране.
              Клиент перестал звонить менеджеру, чтобы узнать, где груз.</p>
          </div>
        </BorderBeamPanel>

        <BorderBeamPanel {...BEAM} seed={3} className={SHELL}>
          <TravelingBeams radius={R} />
          <div className="shot sh-shot"><div className="sh-w">
            <div className="sh-hd">
              <span className="sh-dots"><i></i><i></i><i></i></span>
              <b>Сделки</b>
              <span className="sh-tab sh-on">Неделя</span>
              <span className="sh-mr">9 в работе</span>
            </div>
            <div className="sh-b sh-kan">
              <div className="sh-col">
                <div className="sh-colh">Заявка<em>4</em></div>
                <div className="sh-dl"><span className="sh-t">Ромашка</span><span className="sh-n">180 000 ₽</span></div>
                <div className="sh-dl"><span className="sh-t">СтройДвор</span><span className="sh-n">96 400 ₽</span></div>
              </div>
              <div className="sh-col">
                <div className="sh-colh">Замер<em>3</em></div>
                <div className="sh-dl"><span className="sh-t">Алтын Групп</span><span className="sh-n">340 000 ₽</span></div>
                <div className="sh-dl"><span className="sh-t">Бекет и К</span><span className="sh-n">78 900 ₽</span></div>
              </div>
              <div className="sh-col">
                <div className="sh-colh">Счёт<em>2</em></div>
                <div className="sh-dl"><span className="sh-t">Гранд Строй</span><span className="sh-n">1 240 000 ₽</span></div>
                <div className="sh-dl"><span className="sh-t">ТД Верста</span><span className="sh-n">415 000 ₽</span></div>
              </div>
            </div>
          </div></div>
          <div className="body">
            <LiquidMetalButton label="Продажи · макет" />
            <h3>CRM под ваш процесс</h3>
            <p>Не коробка, а ваши этапы: заявка, замер, счёт, отгрузка. История клиента остаётся в компании,
              когда менеджер уходит. Сюда же телефония и автообзвон.</p>
          </div>
        </BorderBeamPanel>

        <BorderBeamPanel {...BEAM} seed={4} className={SHELL}>
          <TravelingBeams radius={R} />
          <div className="shot sh-shot"><div className="sh-w">
            <div className="sh-hd">
              <span className="sh-dots"><i></i><i></i><i></i></span>
              <b>Ассистент</b>
              <span className="sh-tab sh-on">Склад</span>
              <span className="sh-mr">онлайн</span>
            </div>
            <div className="sh-b sh-chat">
              <div className="sh-msg sh-me"><span className="sh-bub">Профиль 40х20 есть?</span></div>
              <div className="sh-msg"><span className="sh-av">S</span><span className="sh-bub">Да, 320 м в Казани</span></div>
              <div className="sh-msg sh-me"><span className="sh-bub">Счёт на ООО Ромашка</span></div>
              <div className="sh-msg"><span className="sh-av">S</span><span className="sh-bub sh-typ"><i></i><i></i><i></i></span></div>
            </div>
            <div className="sh-comp"><span className="sh-inp">Написать сообщение</span><span className="sh-send">{'→'}</span></div>
          </div></div>
          <div className="body">
            <LiquidMetalButton label="ИИ · макет" />
            <h3>Бот на ваших документах</h3>
            <p>Отвечает клиенту по вашему прайсу и остаткам, выставляет счёт, заносит контакт в базу.
              Первая линия работает ночью и в выходные.</p>
          </div>
        </BorderBeamPanel>

      </div>
    </div></section>
  )
}
