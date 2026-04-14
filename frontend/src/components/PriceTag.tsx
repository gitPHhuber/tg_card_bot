interface PriceTagProps {
  priceRub: number;
  size?: "sm" | "md" | "lg";
}

export default function PriceTag({ priceRub, size = "md" }: PriceTagProps) {
  const formatted = Math.round(priceRub).toLocaleString("ru-RU");

  const sizes = {
    sm: "text-sm font-medium font-mono",
    md: "text-xl font-semibold",
    lg: "text-3xl font-bold",
  };

  return (
    <span className={`${sizes[size]} text-accent`}>
      {formatted}&nbsp;₽
    </span>
  );
}
