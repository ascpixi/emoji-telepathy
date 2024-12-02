"use client";

import Turnstile from "react-turnstile";

export function TurnstileModal({ isOpen, onVerify }: {
  isOpen: boolean;
  onVerify: (token: string) => void
}) {
  if (!isOpen)
    return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl min-w-[348px] min-h-[120px]">
        <Turnstile
          sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onVerify={onVerify}
          theme="light"
          style={{ fontFamily: "Nunito" }}
        />
      </div>
    </div>
  );
}