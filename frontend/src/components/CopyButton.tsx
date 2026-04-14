import { useState } from "react";
import { useTelegram } from "../hooks/useTelegram";

interface CopyButtonProps {
  text: string;
  label: string;
}

export default function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { haptic } = useTelegram();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      haptic?.notificationOccurred("success");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      haptic?.notificationOccurred("error");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-3 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.14)] px-4 py-3 rounded-lg transition-all duration-300 w-full text-left"
    >
      <div className="flex-1 min-w-0">
        <div className="eyebrow mb-0.5">{label}</div>
        <div className="font-mono text-sm text-[#f0f0f5] truncate">{text}</div>
      </div>
      <div className="text-xs font-mono font-medium text-accent shrink-0">
        {copied ? "OK" : "COPY"}
      </div>
    </button>
  );
}
