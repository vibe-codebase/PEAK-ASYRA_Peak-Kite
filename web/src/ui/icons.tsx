type P = { size?: number };
const s = (size = 22) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

export const Pause = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9 6.5v11M15 6.5v11" /></svg>;
export const Back = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M14.5 5.5 8 12l6.5 6.5" /></svg>;
export const Next = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9.5 5.5 16 12l-6.5 6.5" /></svg>;
export const Restart = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4 4.5v3.5h3.5" /></svg>;
export const Gear = ({ size }: P) => (
  <svg {...s(size)} aria-hidden><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" /></svg>
);
export const Skies = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M6.5 17.5h11a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6-1A4 4 0 0 0 6.5 17.5z" /></svg>;
/** A delta kite; filled for the stars and for kites in hand. */
export const Kite = ({ size = 22, on = true, color = '#e04a3a' }: P & { on?: boolean; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M12 3 3 16.5l9-3 9 3z" fill={on ? color : 'none'} stroke={on ? 'rgba(40,24,20,.75)' : 'rgba(255,255,255,.55)'} strokeWidth="1.3" strokeLinejoin="round" />
    {on && <path d="M12 3v10.5M7 12.5l5-1 5 1" stroke="rgba(255,255,255,.6)" strokeWidth=".9" fill="none" />}
    <path d="M12 13.5c-1 2-.2 3.4-1.2 5.2M12 13.5c1 2 .2 3.6 1.4 5.3" stroke={on ? '#f2c230' : 'rgba(255,255,255,.4)'} strokeWidth="1.2" fill="none" strokeLinecap="round" />
  </svg>
);
/** A glass wind bell. */
export const Bell = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M6.5 11c0-4 2.2-6 5.5-6s5.5 2 5.5 6z" fill="rgba(190,230,240,.85)" stroke="rgba(60,90,110,.9)" strokeWidth="1.2" />
    <path d="M12 3v2M12 11v3" stroke="rgba(60,50,40,.8)" strokeWidth="1" />
    <rect x="10.4" y="14" width="3.2" height="7" rx=".6" fill="#f6efe0" stroke="rgba(60,50,40,.5)" strokeWidth=".7" />
    <circle cx="14" cy="8.5" r="1.1" fill="#d8473a" />
  </svg>
);
export const Clock = ({ size }: P) => <svg {...s(size)} aria-hidden><circle cx="12" cy="13" r="7.5" /><path d="M12 9.5V13l2.5 1.5M9.5 3.5h5" /></svg>;
