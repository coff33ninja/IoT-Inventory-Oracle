import React from "react";
import { useCurrencyFormat } from "../hooks/useCurrencyFormat";

interface PriceDisplayProps {
  amount: number | undefined | null;
  className?: string;
  fallback?: string;
  showCurrency?: boolean;
  originalCurrency?: string;
  convertFrom?: string;
}

/**
 * Universal price display component that handles currency formatting
 * Uses the user's selected currency preference
 */
const PriceDisplay: React.FC<PriceDisplayProps> = ({
  amount,
  className = "",
  fallback = "Price not available",
  showCurrency = false,
  originalCurrency,
  convertFrom,
}) => {
  const { formatCurrency, convertPrice, getCurrencyCode } = useCurrencyFormat();

  if (amount === undefined || amount === null || isNaN(amount)) {
    return <span className={`text-gray-500 ${className}`}>{fallback}</span>;
  }

  let displayAmount = amount;
  let displayText = "";

  // Convert currency if needed
  if (convertFrom && convertFrom !== getCurrencyCode()) {
    displayAmount = convertPrice(amount, convertFrom);
    displayText = formatCurrency(displayAmount);

    if (showCurrency && originalCurrency) {
      displayText += ` (converted from ${originalCurrency})`;
    }
  } else {
    displayText = formatCurrency(displayAmount);
  }

  return (
    <span
      className={className}
      title={showCurrency ? `Amount: ${displayText}` : undefined}>
      {displayText}
    </span>
  );
};

export default PriceDisplay;
