import React from "react";

export function Progress({ value = 0, className = "", ...props }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-3 overflow-hidden ${className}`} {...props}>
      <div
        className="bg-blue-400 h-full transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
} 