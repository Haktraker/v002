"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Maximize2 } from "lucide-react"

export function DashboardPreviewModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 bg-cyber-dark/50 hover:bg-cyber-dark/70 backdrop-blur-sm"
        >
          <Maximize2 className="h-4 w-4 mr-1" />
          <span className="sr-only md:not-sr-only md:inline">Expand</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl w-[90vw] border-0">
        <DialogHeader>
          <DialogTitle>Advanced Dashboard View</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[80vh]">
          <Image
            src="/images/dashboard-preview.png"
            alt="Haktrak Networks Dashboard Preview"
            width={1200}
            height={675}
            className="w-full h-auto"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

