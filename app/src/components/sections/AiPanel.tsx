import type { AiPanel as AiPanelState } from '@/hooks/useAiPanel'
import { GradientButton } from '@/components/ui/gradient-button'

/* #aibox is handed to WinMgr, which moves it out of the React root — so every
   listener inside comes from a ref, not a React prop. See useAiPanel. */
export function AiPanel({ messages, formRef, closeRef, logRef, inputRef }: AiPanelState) {
  return (
    <div className="aiwrap" id="aiwrap" role="dialog" aria-label="Обсудить задачу">
      <div className="aibox" id="aibox">
        <div className="aitop"><b>Обсудить задачу</b><small>отвечает ассистент Solutions101</small>
          <button className="aiclose" id="aiclose" type="button" aria-label="закрыть" ref={closeRef}>{'×'}</button></div>
        <div className="ailog" id="ailog" ref={logRef}>
          <div className="msg ai">Расскажите, какая рутина съедает время. Спрошу пару уточнений и скажу, что можно автоматизировать и за сколько это делается.</div>
          {messages.map((m) => (
            <div className={`msg ${m.cls}`} key={m.id}>{m.text}</div>
          ))}
        </div>
        <form className="aiform" id="aiform" ref={formRef}>
          <input id="aiq" placeholder="Например: теряем заявки в вотсапе" autoComplete="off" ref={inputRef} />
          <GradientButton type="submit" style={{ padding: '12px 18px' }}>→</GradientButton>
        </form>
      </div>
    </div>
  )
}
