"use client";

export function Button({ content, onClick, uppercase, className }: {
  content: string,
  onClick?: () => void,
  uppercase?: boolean,
  className?: string
}) {
  return <button
    className={`bg-[#fdefc0] rounded-lg p-2 drop-shadow-sm ${uppercase !== false ? "uppercase" : ""} font-bold hover:bg-[#fbd4ab] transition-colors ${className ? className : ""}`}
    onClick={onClick}
  >
    {content}
  </button>
}