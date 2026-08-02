import React from 'react';
import { IoHomeOutline, IoVideocamOutline, IoCameraOutline, IoShareSocialOutline, IoHeartOutline } from 'react-icons/io5';

/* Donor component. Two additions, both opt-in and both defaulting to the donor's own behaviour:
   the item list and the wrapper classes are props, and an item may carry an href so the pill can
   be a real link. Every class, duration, delay and transform below is the original. */

export interface GradientMenuItem {
  title: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  href?: string;
  onClick?: () => void;
}

const defaultItems: GradientMenuItem[] = [
  { title: 'Home', icon: <IoHomeOutline />, gradientFrom: '#a955ff', gradientTo: '#ea51ff' },
  { title: 'Video', icon: <IoVideocamOutline />, gradientFrom: '#56CCF2', gradientTo: '#2F80ED' },
  { title: 'Photo', icon: <IoCameraOutline />, gradientFrom: '#FF9966', gradientTo: '#FF5E62' },
  { title: 'Share', icon: <IoShareSocialOutline />, gradientFrom: '#80FF72', gradientTo: '#7EE8FA' },
  { title: 'Tym', icon: <IoHeartOutline />, gradientFrom: '#ffa9c6', gradientTo: '#f434e2' }
];

export default function GradientMenu({
  items = defaultItems,
  className = 'flex justify-center items-center min-h-screen bg-dark',
  listClassName = 'flex gap-6',
}: {
  items?: GradientMenuItem[];
  className?: string;
  listClassName?: string;
}) {
  return (
    <div className={className}>
      <ul className={listClassName}>
        {items.map(({ title, icon, gradientFrom, gradientTo, href, onClick }, idx) => (
          <li
            key={idx}
            style={{ '--gradient-from': gradientFrom, '--gradient-to': gradientTo } as React.CSSProperties}
            className="relative w-[60px] h-[60px] bg-white shadow-lg rounded-full flex items-center justify-center transition-all duration-500 hover:w-[180px] hover:shadow-none group cursor-pointer"
          >
            {/* Gradient background on hover */}
            <span className="absolute inset-0 rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] opacity-0 transition-all duration-500 group-hover:opacity-100"></span>
            {/* Blur glow */}
            <span className="absolute top-[10px] inset-x-0 h-full rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] blur-[15px] opacity-0 -z-10 transition-all duration-500 group-hover:opacity-50"></span>

            {/* Icon */}
            <span className="relative z-10 transition-all duration-500 group-hover:scale-0 delay-0">
              <span className="text-2xl text-gray-500">{icon}</span>
            </span>

            {/* Title */}
            <span className="absolute text-white uppercase tracking-wide text-sm transition-all duration-500 scale-0 group-hover:scale-100 delay-150">
              {title}
            </span>

            {/* added: the whole pill becomes the link / button when the item asks for one */}
            {href ? (
              <a href={href} aria-label={title} className="absolute inset-0 z-20 rounded-full" />
            ) : onClick ? (
              <button type="button" aria-label={title} onClick={onClick} className="absolute inset-0 z-20 rounded-full bg-transparent border-0 cursor-pointer" />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
