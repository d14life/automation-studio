import type React from 'react'

/* Donor component. One change: the donor ships its CSS in a Next.js `<style jsx>` block, which
   this project has no compiler for - React would render it as a literal style tag and warn about
   the unknown prop. The rules are therefore lifted verbatim into site.css under the same
   .shiny-cta selector, so the markup and every animation below are the original. */

interface ShinyButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export function ShinyButton({ children, onClick, className = '' }: ShinyButtonProps) {
  return (
    <button className={`shiny-cta ${className}`} onClick={onClick}>
      <span>{children}</span>
    </button>
  )
}

/** The same treatment on something that is not a button - a card, a pill, a panel. */
export function ShinySurface({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`shiny-cta ${className}`}>
      <span>{children}</span>
    </div>
  )
}
