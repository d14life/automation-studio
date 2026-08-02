import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, RefObject } from 'react'

/* Solution finder: the button opens a chat with the model instead of a dead form.
   ponytail: the browser talks to the provider directly, no backend to run or pay for. */

/* The key ships inside the client bundle either way - env var or literal, a visitor can read it. */
const KEY = (import.meta.env.VITE_AI_KEY as string | undefined) ?? 'sk-nano-42e0c9b8-97e5-4185-ad5d-d9b29c2c1e14'
const MODEL = 'gemini-2.5-flash'
const ENDPOINT = 'https://nano-gpt.com/api/v1/chat/completions'

const SYS = 'Ты ассистент студии Solutions101. Студия делает заказную автоматизацию бизнес-процессов: ' +
  'учёт и сверка, счета и документы, CRM и заявки, сбор данных с сайтов и прайсов, отчёты руководителю, ' +
  'боты и ИИ на документах клиента, склад и логистика. Первая рабочая версия за дни, предоплаты нет, ' +
  'клиент платит только если инструмент помог. Отвечай по-русски, коротко, конкретно, без воды и без ' +
  'обещаний сроков точнее чем "за несколько дней". Задавай по одному уточняющему вопросу за раз. ' +
  'Когда задача понятна, назови что именно можно автоматизировать, что это снимет с человека, и предложи ' +
  'написать в WhatsApp +44 7756 115516. Никогда не называй цены.'

const FAIL = 'Связь с ассистентом сорвалась. Напишите напрямую в WhatsApp +44 7756 115516, ответим руками.'

type ChatRole = 'system' | 'user' | 'assistant'
interface ChatTurn { role: ChatRole; content: string }
interface ChatReply { choices?: { message?: { content?: string } }[] }

export interface AiMessage {
  id: number
  text: string
  /* the class the static page put on the bubble: .msg.me / .msg.ai / .msg.sys */
  cls: 'me' | 'ai' | 'sys'
}

/* the ids the static page used: every one of these buttons opens the same window */
export const AI_OPEN_IDS = ['aiopen', 'aiopen2', 'aiopen3'] as const
export const AI_CLOSE_ID = 'aiclose'
/* the element WinMgr borrows as the window body, put back where it was on close */
export const AI_BOX_ID = 'aibox'

export interface AiPanel {
  messages: AiMessage[]
  /* everything inside #aibox gets refs, not React props: WinMgr moves the box into its own
     layer outside the React root, and React's delegated onSubmit/onClick stop firing there.
     The listeners below are native, so they survive the move. */
  formRef: RefObject<HTMLFormElement | null>
  closeRef: RefObject<HTMLButtonElement | null>
  logRef: RefObject<HTMLDivElement | null>
  inputRef: RefObject<HTMLInputElement | null>
  /* the open buttons stay in the page, so a plain onClick is fine for them */
  open: () => void
  close: () => void
}

/** Chat panel state plus the provider call. `ready` gates only WinMgr (win.js must be loaded). */
export function useAiPanel(ready: boolean): AiPanel {
  const [messages, setMessages] = useState<AiMessage[]>([])
  const history = useRef<ChatTurn[]>([{ role: 'system', content: SYS }])
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const seq = useRef(0)
  const inflight = useRef<AbortController | null>(null)

  /* the log follows the newest bubble, same as log.scrollTop=log.scrollHeight did */
  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [messages])

  useEffect(() => () => { inflight.current?.abort() }, [])

  const add = useCallback((text: string, cls: AiMessage['cls']) => {
    const id = ++seq.current
    setMessages((m) => [...m, { id, text, cls }])
    return id
  }, [])

  /* the panel is a real window now: draggable, resizable, dockable, never modal */
  const open = useCallback(() => {
    if (!ready) return
    window.WinMgr.open({ key: 'ai', title: 'Обсудить задачу', body: document.getElementById(AI_BOX_ID) })
    setTimeout(() => { inputRef.current?.focus() }, 40)
  }, [ready])

  const close = useCallback(() => {
    if (!ready) return
    window.WinMgr.close('ai')
  }, [ready])

  const submit = useCallback((e: Event) => {
    e.preventDefault()
    const q = inputRef.current
    const text = (q?.value ?? '').trim()
    if (!text) return
    if (q) q.value = ''
    add(text, 'me')
    history.current.push({ role: 'user', content: text })
    const waitId = add('думаю...', 'sys')
    const drop = () => { setMessages((m) => m.filter((x) => x.id !== waitId)) }

    const ac = new AbortController()
    inflight.current = ac
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KEY },
      body: JSON.stringify({ model: MODEL, messages: history.current, max_tokens: 600 }),
      signal: ac.signal,
    })
      .then((r) => r.json() as Promise<ChatReply>)
      .then((d) => {
        drop()
        const a = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content
        if (!a) throw new Error('empty')
        history.current.push({ role: 'assistant', content: a })
        add(a, 'ai')
      })
      .catch(() => {
        if (ac.signal.aborted) return /* the panel went away, nothing to tell anyone */
        drop()
        add(FAIL, 'sys')
      })
  }, [add])

  /* native wiring for the two controls that travel into the window layer with #aibox */
  useEffect(() => {
    const form = formRef.current, btn = closeRef.current
    form?.addEventListener('submit', submit)
    btn?.addEventListener('click', close)
    return () => {
      form?.removeEventListener('submit', submit)
      btn?.removeEventListener('click', close)
    }
  }, [submit, close])

  return { messages, formRef, closeRef, logRef, inputRef, open, close }
}
