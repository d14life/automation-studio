/* The two actions live in one glass track with a sliding thumb, the shape of the donor's
   theme switcher. The thumb follows the pointer between the halves; the label you are not on
   turns ice blue. No JS: :has() moves the thumb. */
export function Hero({ onAiOpen }: { onAiOpen: () => void }) {
  return (
    <section id="stage">
      <div className="stagesticky">
        <div className="stageui">
          <h1 className="sr-only">Solutions101: автоматизация бизнес-процессов. Быстро не значит плохо</h1>
          <div className="morph" id="liq1"></div>
          <div className="morph" id="liq2"></div>
          <div className="numblock">
            <div className="hero101" aria-hidden="true">101</div>
            <div className="actswrap"><div className="acts">
              <div className="switchbar">
                <span className="sw-thumb" aria-hidden="true"></span>
                <button className="sw-item" type="button" id="aiopen" onClick={onAiOpen}>Обсудить задачу</button>
                <a className="sw-item" href="#projects">Живой продукт</a>
              </div>
            </div></div>
          </div>
      </div>
      </div>
    </section>
  )
}
