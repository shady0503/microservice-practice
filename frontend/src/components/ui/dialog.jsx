import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = ({ open, onOpenChange, children, className }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog Content */}
      <div className={cn(
        "relative z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl",
        className
      )}>
        {children}
      </div>
    </div>
  )
}

const DialogContent = ({ children, onClose, className }) => {
  return (
    <div className={cn("relative p-6", className)}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
      {children}
    </div>
  )
}

const DialogHeader = ({ children, className }) => {
  return (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}>
      {children}
    </div>
  )
}

const DialogTitle = ({ children, className }) => {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h2>
  )
}

const DialogDescription = ({ children, className }) => {
  return (
    <p className={cn("text-sm text-slate-500", className)}>
      {children}
    </p>
  )
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription }

