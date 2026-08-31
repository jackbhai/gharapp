import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { X } from 'lucide-react';

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft' | 'glass'; size?: 'sm' | 'md' | 'lg' }) {
  return <button className={`button button-${variant} button-${size} ${className}`} {...props}>{children}</button>;
}

export function Card({ children, className = '', onClick, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`surface-card ${onClick ? 'is-clickable' : ''} ${className}`} onClick={onClick} {...props}>{children}</div>;
}

export function Chip({ children, tone = 'neutral', removable, onRemove, className = '' }: { children: ReactNode; tone?: 'neutral' | 'mint' | 'blue' | 'purple' | 'yellow' | 'red'; removable?: boolean; onRemove?: () => void; className?: string }) {
  return <span className={`chip chip-${tone} ${className}`}>{children}{removable && <button type="button" className="chip-remove" onClick={onRemove} aria-label="Remove filter">×</button>}</span>;
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function Modal({ title, description, children, onClose, wide = false }: { title: string; description?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`modal-sheet ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-handle" /><header className="modal-header"><div><h2>{title}</h2>{description && <p>{description}</p>}</div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></header>{children}</section></div>;
}

export function Field({ label, hint, error, children, className = '' }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return <label className={`form-field ${error ? 'has-error' : ''} ${className}`}><span className="field-label">{label}{hint && <small>{hint}</small>}</span>{children}{error && <span className="field-error">{error}</span>}</label>;
}

export function LoadingScreen() {
  return <div className="loading-screen"><div className="loading-orb">🏠</div><strong>GharApp</strong><span>Loading your home command center…</span></div>;
}

export function ProgressBar({ value, tone = 'mint' }: { value: number; tone?: 'mint' | 'blue' | 'purple' | 'red' }) {
  return <div className={`progress-track progress-${tone}`}><span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}
