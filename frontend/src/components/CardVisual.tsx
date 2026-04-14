interface CardVisualProps {
  faceValue: number;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardHolder?: string;
  showDetails?: boolean;
}

const GRADIENTS: Record<number, string> = {
  20: "card-gradient-blue",
  50: "card-gradient-purple",
  100: "card-gradient-green",
  200: "card-gradient-gold",
};

export default function CardVisual({
  faceValue,
  cardNumber,
  cardExpiry,
  cardCvv,
  cardHolder,
  showDetails = false,
}: CardVisualProps) {
  const gradient = GRADIENTS[faceValue] ?? "card-gradient-blue";
  const maskedNumber = cardNumber
    ? cardNumber.replace(/(.{4})/g, "$1 ").trim()
    : "\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022";

  return (
    <div
      className={`${gradient} shimmer rounded-xl p-5 sm:p-6 aspect-[1.6/1] flex flex-col justify-between relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.03] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/[0.03] translate-y-1/2 -translate-x-1/2" />

      <div className="flex justify-between items-start relative z-10">
        <div className="eyebrow text-white/50">Digital Prepaid</div>
        <svg width="48" height="16" viewBox="0 0 48 16" fill="none">
          <text
            x="0"
            y="13"
            fill="rgba(255,255,255,0.8)"
            fontSize="14"
            fontWeight="bold"
            fontFamily="Manrope, sans-serif"
            letterSpacing="3"
          >
            VISA
          </text>
        </svg>
      </div>

      <div className="relative z-10">
        <div className="font-mono text-base sm:text-lg tracking-[0.2em] text-white/80 mb-4">
          {maskedNumber}
        </div>
        <div className="flex justify-between items-end">
          <div>
            {showDetails && cardHolder ? (
              <>
                <div className="eyebrow text-white/30 mb-0.5">Card Holder</div>
                <div className="text-sm font-medium text-white/80">{cardHolder}</div>
              </>
            ) : (
              <div className="text-sm font-semibold text-white/70">${faceValue} USD</div>
            )}
          </div>
          <div className="text-right">
            {showDetails && cardExpiry ? (
              <>
                <div className="eyebrow text-white/30 mb-0.5">Expires</div>
                <div className="text-sm font-mono text-white/80">{cardExpiry}</div>
              </>
            ) : (
              <div className="text-2xl font-bold text-white/10">${faceValue}</div>
            )}
          </div>
        </div>
        {showDetails && cardCvv && (
          <div className="mt-3 text-right">
            <span className="eyebrow text-white/30 mr-2">CVV</span>
            <span className="text-sm font-mono text-white/80">{cardCvv}</span>
          </div>
        )}
      </div>
    </div>
  );
}
