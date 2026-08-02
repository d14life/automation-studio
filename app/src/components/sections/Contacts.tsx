import { InteractiveHoverLink } from '@/components/ui/interactive-hover-button'

/* The contact rows use the interactive-hover-button donor: the row slides away on hover while
   the same row arrives from the right with an arrow, and a dot grows out to fill the whole
   width behind it. They stay real links, so tel:, mailto: and the messenger URLs still work. */
const WAYS = [
  { label: 'Офис', detail: '71-75 Shelton Street, Covent Garden, London WC2H 9JQ · 2 этаж, офис 214' },
  { label: 'Позвонить', detail: '+44 7756 115516', href: 'tel:+447756115516' },
  { label: 'WhatsApp', detail: '+44 7756 115516', href: 'https://wa.me/447756115516' },
  { label: 'Telegram', detail: '+44 7756 115516', href: 'https://t.me/+447756115516' },
  { label: 'Почта', detail: 'tagir.zalyatov@gmail.com', href: 'mailto:tagir.zalyatov@gmail.com' },
]

export function Contacts() {
  return (
    <section className="band" id="contacts"><div className="wrap">
      <p className="eyebrow">Контакты</p>
      <h2>Все способы связи в одном месте</h2>
      <p className="claim">Один номер на звонок, WhatsApp и Telegram. Отвечаем сами, без колл-центра.</p>
      <div className="ways">
        {WAYS.map((w) => (
          <InteractiveHoverLink
            key={w.label}
            className="way"
            label={w.label}
            detail={w.detail}
            {...(w.href ? { href: w.href, rel: 'noopener' } : {})}
          />
        ))}
      </div>
      <p className="formnote">Письменно отвечаем в течение одного рабочего дня. Звонков без вашей просьбы не будет.</p>
    </div></section>
  )
}
