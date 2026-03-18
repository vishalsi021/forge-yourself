import { NavLink } from 'react-router-dom';

const items = [
  { to: '/app/today', label: 'Today' },
  { to: '/app/progress', label: 'Progress' },
  { to: '/app/mind', label: 'Mind' },
  { to: '/app/identity', label: 'Identity' },
  { to: '/app/profile', label: 'Profile' },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-forge-border bg-forge-bg/95 backdrop-blur-xl">
      <div className="app-shell grid grid-cols-5 gap-2 px-2 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `px-1 py-2 text-center font-condensed text-[0.62rem] font-bold uppercase tracking-[0.18em] ${isActive ? 'border border-forge-gold bg-forge-gold/10 text-forge-gold' : 'text-forge-muted2'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
