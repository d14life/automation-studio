import { useCallback } from 'react'
import type { FormEvent } from 'react'

/* the request form hands its text to WhatsApp: no backend to run, nothing lost in transit */
export function useRequestForm(): (e: FormEvent<HTMLFormElement>) => void {
  return useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const v = (id: string) => {
      const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null
      return (el?.value || '').trim()
    }
    const text = 'Заявка с сайта Solutions101\n\nИмя: ' + v('rq-name') + '\nКомпания: ' + (v('rq-co') || '-') +
      '\nКонтакт: ' + v('rq-ct') + '\n\nЗадача: ' + v('rq-pain')
    window.open('https://wa.me/447756115516?text=' + encodeURIComponent(text), '_blank', 'noopener')
  }, [])
}
