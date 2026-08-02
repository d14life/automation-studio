import type { FormEvent } from 'react'
import { BorderBeamPanel } from '@/components/ui/border-beam-panel'
import { GradientButton } from '@/components/ui/gradient-button'

export function RequestForm({
  onAiOpen,
  onSubmit,
}: {
  onAiOpen: () => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <section className="band" id="request"><div className="wrap">
      <p className="eyebrow">Заявка</p>
      <h2>Расскажите, что съедает время</h2>
      <div className="req">
        {/* .form keeps owning padding/background; the panel only supplies the beam ring. */}
        <BorderBeamPanel beams={2} thickness={3} radius={20} idleSpeed={42} hoverSpeed={42} glow seed={16}
          className="form p-0 w-auto border-0 bg-transparent">
          <form id="reqform" onSubmit={onSubmit}>
            <label htmlFor="rq-name">Как вас зовут</label>
            <input id="rq-name" required />
            <label htmlFor="rq-co">Компания</label>
            <input id="rq-co" />
            <label htmlFor="rq-ct">Телефон или WhatsApp</label>
            <input id="rq-ct" required />
            <label htmlFor="rq-pain">Какая рутина съедает время</label>
            <textarea id="rq-pain" required></textarea>
            <GradientButton type="submit">Отправить заявку</GradientButton>
            <p className="formnote">Ответим в течение рабочего дня. Звонков без вашей просьбы не будет.</p>
          </form>
        </BorderBeamPanel>
        <div>
          <p className="claim">Не любите формы - напишите сразу, где вам удобно.</p>
          <div className="ways">
            <a className="way" href="https://wa.me/447756115516" rel="noopener">WhatsApp <small>+44 7756 115516</small></a>
            <a className="way" href="https://t.me/+447756115516" rel="noopener">Telegram <small>+44 7756 115516</small></a>
            <a className="way" href="tel:+447756115516">Позвонить <small>+44 7756 115516</small></a>
            <a className="way" href="mailto:tagir.zalyatov@gmail.com">Почта <small>tagir.zalyatov@gmail.com</small></a>
            <button className="way" type="button" id="aiopen2" style={{ width: '100%', textAlign: 'left', background: 'none', font: '900 15px Nunito,sans-serif', cursor: 'pointer' }} onClick={onAiOpen}>Спросить ассистента <small>сразу в браузере</small></button>
          </div>
        </div>
      </div>
    </div></section>
  )
}
