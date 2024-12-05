"use client";

export function Button({ content, onClick, uppercase, className }: {
  content: string,
  onClick?: () => void,
  uppercase?: boolean,
  className?: string
}) {
  return (
    <button
      className={`
        bg-[#fdefc0] hover:bg-[#fbd4ab] rounded-lg p-2 drop-shadow-sm font-bold transition-colors
        ${uppercase !== false ? "uppercase" : ""}
        ${className ? className : ""}
      `}
      onClick={onClick}
    >
      {content}
    </button>
  );
}