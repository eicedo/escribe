import React from "react";

export function Card({ className = "", children, ...props }) {
  return (
    <div className={`rounded-xl bg-white/70 shadow p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }) {
  return (
    <div className={`mb-2 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }) {
  return (
    <h2 className={`text-lg font-semibold mb-1 ${className}`} {...props}>
      {children}
    </h2>
  );
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div className={`text-base ${className}`} {...props}>
      {children}
    </div>
  );
} 