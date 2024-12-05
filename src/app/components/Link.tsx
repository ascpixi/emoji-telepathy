"use client";

export function Link({ content, href, newTab }: {
  content: string,
  href: string,
  newTab?: boolean
}) {
  return (
    <a href={href} target={newTab ? "_blank" : undefined}
      className="text-[#d37e70] underline"
    >
      {content}
    </a>
  );
}