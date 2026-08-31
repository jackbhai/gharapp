import { Bot, CalendarDays, ChevronDown, CircleUserRound, Home, Menu, Package, Sparkles, Utensils } from 'lucide-react';
import type { TabKey } from '../store/appStore';

export const navigation: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'food', label: 'Food', icon: Utensils },
  { key: 'inventory', label: 'Stock', icon: Package },
  { key: 'cosmetics', label: 'Beauty', icon: Sparkles },
  { key: 'planner', label: 'Plan', icon: CalendarDays },
  { key: 'chat', label: 'AI', icon: Bot },
  { key: 'more', label: 'More', icon: Menu },
];

export function TopBar({ title, profileName, isHome, expiryCount, onProfile }: { title: string; profileName: string; isHome?: boolean; expiryCount: number; onProfile: () => void }) {
  return <header className={`topbar ${isHome ? 'topbar-home' : ''}`}>
    <div className="topbar-brand"><div className="brand-mark"><Home size={18} strokeWidth={2.6} /></div><div><h1>{isHome ? 'GharApp' : title}</h1>{isHome && <p>Home, but smarter.</p>}</div></div>
    <button type="button" className="profile-control" onClick={onProfile} aria-label="Switch family profile"><span className="profile-avatar"><CircleUserRound size={15} /></span><span>{profileName}</span><ChevronDown size={13} />{expiryCount > 0 && <i className="notification-dot" aria-label={`${expiryCount} expiry alerts`} />}</button>
  </header>;
}

export function BottomNav({ activeTab, onChange, expiryCount }: { activeTab: TabKey; onChange: (tab: TabKey) => void; expiryCount: number }) {
  return <nav className="bottom-nav" aria-label="Primary navigation">{navigation.map(({ key, label, icon: Icon }) => <button key={key} type="button" className={activeTab === key ? 'active' : ''} onClick={() => onChange(key)} aria-label={label}><Icon size={18} strokeWidth={activeTab === key ? 2.6 : 2} /><span>{label}</span>{key === 'inventory' && expiryCount > 0 && <b className="nav-badge">{expiryCount > 99 ? '99+' : expiryCount}</b>}</button>)}</nav>;
}
