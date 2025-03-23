import { LoadingSkeleton } from "@/components/layout/loading-skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 space-y-20 py-16">
      <LoadingSkeleton type="hero" />
      <LoadingSkeleton type="section" />
      <LoadingSkeleton type="feature" count={4} />
    </div>
  )
}

