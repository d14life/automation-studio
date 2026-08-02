export function Contacts() {
  return (
    <section className="band" id="contacts"><div className="wrap">
      <p className="eyebrow">Контакты</p>
      <h2>Все способы связи в одном месте</h2>
      <p className="claim">Один номер на звонок, WhatsApp и Telegram. Отвечаем сами, без колл-центра.</p>
      <div className="ways">
        <div className="way">Офис <small>71-75 Shelton Street, Covent Garden, London WC2H 9JQ · 2 этаж, офис 214</small></div>
        <a className="way" href="tel:+447756115516">Позвонить <small>+44 7756 115516</small></a>
        <a className="way" href="https://wa.me/447756115516" rel="noopener">WhatsApp <small>+44 7756 115516</small></a>
        <a className="way" href="https://t.me/+447756115516" rel="noopener">Telegram <small>+44 7756 115516</small></a>
        <a className="way" href="mailto:tagir.zalyatov@gmail.com">Почта <small>tagir.zalyatov@gmail.com</small></a>
      </div>
      <p className="formnote">Письменно отвечаем в течение одного рабочего дня. Звонков без вашей просьбы не будет.</p>
    </div></section>
  )
}
