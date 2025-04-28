import { useState } from 'react'

export function Dialog({ open, onOpenChange, children }) {
  return open ? (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white p-6 rounded shadow-md">
        {children}
        <button className="mt-4 text-sm text-blue-600" onClick={() => onOpenChange(false)}>Close</button>
      </div>
    </div>
  ) : null
}

export function DialogTrigger({ children, asChild = false }) {
  const trigger = children
  return trigger
}

export function DialogContent({ children }) {
  return <>{children}</>
}
