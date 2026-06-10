import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'accent' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-surface-700 hover:bg-surface-600 text-slate-100 border border-white/5',
  accent: 'accent-gradient text-white shadow-glow hover:brightness-110',
  ghost: 'bg-transparent hover:bg-white/5 text-slate-300',
  outline: 'bg-transparent border border-white/15 hover:border-white/30 text-slate-200',
  danger: 'bg-red-500/90 hover:bg-red-500 text-white'
}
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base'
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }): JSX.Element {
  return (
    <button
      className={cn(
        'no-drag inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Card({
  className,
  children
}: {
  className?: string
  children: ReactNode
}): JSX.Element {
  return <div className={cn('card p-5', className)}>{children}</div>
}

export function Field({
  label,
  hint,
  children,
  className
}: {
  label?: string
  hint?: string
  children: ReactNode
  className?: string
}): JSX.Element {
  return (
    <div className={className}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>): JSX.Element {
  return <input {...props} className={cn('input no-drag', props.className)} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>): JSX.Element {
  return <textarea {...props} className={cn('input no-drag min-h-[90px] resize-y', props.className)} />
}

export function Select({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>): JSX.Element {
  return (
    <select {...props} className={cn('input no-drag cursor-pointer', props.className)}>
      {children}
    </select>
  )
}

export function Toggle({
  checked,
  onChange,
  label
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="no-drag flex items-center gap-3"
    >
      <span
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'accent-bg' : 'bg-surface-600'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
            checked ? 'left-[22px]' : 'left-0.5'
          )}
        />
      </span>
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </button>
  )
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}): JSX.Element {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="no-drag h-2 w-full cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-glow"
      style={{
        background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, #2a3242 ${pct}%, #2a3242 100%)`
      }}
    />
  )
}

export function Badge({
  children,
  className
}: {
  children: ReactNode
  className?: string
}): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-300',
        className
      )}
    >
      {children}
    </span>
  )
}

export function Spinner({ className }: { className?: string }): JSX.Element {
  return (
    <span
      className={cn(
        'inline-block h-4 w-4 animate-spin-slow rounded-full border-2 border-white/20 border-t-white',
        className
      )}
    />
  )
}
