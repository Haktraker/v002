"use client"

interface MetricCircleProps {
  value: number
  label: string
  color?: string
  size?: number
}

export function MetricCircle({ value, label, color = "#8A2CE2", size = 100 }: MetricCircleProps) {
  return (
    <div
      className="rounded-full flex flex-col items-center justify-center"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: `radial-gradient(circle at center, ${color}33 0%, ${color}11 100%)`,
        border: `1px solid ${color}55`,
      }}
    >
      <span className="text-xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

