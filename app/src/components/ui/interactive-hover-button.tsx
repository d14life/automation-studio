import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* Donor component, unchanged. Below it, a link-shaped twin: these sit on contact rows, which
   have to be real anchors so tel:, mailto: and the messenger links still work. Same markup,
   same classes, same three layers - only the element is an <a>. */

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
}

const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text = "Button", className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group relative w-32 cursor-pointer overflow-hidden rounded-full border bg-background p-2 text-center font-semibold",
        className,
      )}
      {...props}
    >
      <span className="inline-block translate-x-1 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
        {text}
      </span>
      <div className="absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-primary-foreground opacity-0 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100">
        <span>{text}</span>
        <ArrowRight />
      </div>
      <div className="absolute left-[20%] top-[40%] h-2 w-2 scale-[1] rounded-lg bg-primary transition-all duration-300 group-hover:left-[0%] group-hover:top-[0%] group-hover:h-full group-hover:w-full group-hover:scale-[1.8] group-hover:bg-primary"></div>
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

interface InteractiveHoverLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  label: string;
  detail: string;
}

const InteractiveHoverLink = React.forwardRef<
  HTMLAnchorElement,
  InteractiveHoverLinkProps
>(({ label, detail, className, ...props }, ref) => {
  return (
    <a
      ref={ref}
      className={cn("ihl group relative block cursor-pointer overflow-hidden", className)}
      {...props}
    >
      {/* the resting row: name on the left, detail on the right */}
      <span className="ihl-rest transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
        {label}
        <small>{detail}</small>
      </span>
      {/* the arriving row, sliding in from the right with the arrow */}
      <div className="ihl-hover absolute top-0 z-10 flex h-full w-full translate-x-12 items-center gap-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        <span>{label}</span>
        <small>{detail}</small>
        <ArrowRight className="ihl-arrow" />
      </div>
      {/* the dot that grows into the whole row */}
      <div className="ihl-dot absolute left-[3%] top-[40%] h-2 w-2 rounded-lg transition-all duration-300 group-hover:left-0 group-hover:top-0 group-hover:h-full group-hover:w-full"></div>
    </a>
  );
});

InteractiveHoverLink.displayName = "InteractiveHoverLink";

export { InteractiveHoverButton, InteractiveHoverLink };
