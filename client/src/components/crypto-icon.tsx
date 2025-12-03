import React, { useState, useEffect } from 'react';

// Cache for CoinGecko icons to avoid repeated API calls
const iconCache = new Map<string, string>();
const failedIcons = new Set<string>();

// Background colors for fallback icons
const CRYPTO_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  BNB: '#F0B90B',
  SOL: '#9945FF',
  XRP: '#23292F',
  ADA: '#3CC8C8',
  DOT: '#E6007A',
  DOGE: '#C2A633',
  LTC: '#345D9D',
  LINK: '#2A5ADA',
  XLM: '#000000',
  USDT: '#26A17B',
  USDC: '#2775CA',
  AVAX: '#E84142',
  MATIC: '#8247E5',
  TRX: '#FF0013',
  UNI: '#FF007A',
  ATOM: '#6F7390',
  XMR: '#FF6600',
  FTM: '#1969FF',
  AAVE: '#B6509E',
  XTZ: '#2C7DF7',
  ALGO: '#000000',
  NEAR: '#000000',
  NEO: '#00E599',
  DASH: '#008CE7',
  ZEC: '#F4B728'
};

interface CryptoIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function CryptoIcon({ symbol, size = 24, className = "" }: CryptoIconProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // Clean symbol: remove trading pair suffixes
  let cleanSymbol = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const suffixes = ['USDT', 'BUSD', 'USDC', 'USD', 'TUSD', 'DAI', 'EUR', 'GBP', 'BTC', 'ETH', 'BNB'];
  for (const suffix of suffixes) {
    if (cleanSymbol.endsWith(suffix) && cleanSymbol.length > suffix.length) {
      cleanSymbol = cleanSymbol.slice(0, -suffix.length);
      break;
    }
  }

  useEffect(() => {
    // Check cache first
    if (iconCache.has(cleanSymbol)) {
      setIconUrl(iconCache.get(cleanSymbol)!);
      return;
    }

    // Skip if previously failed
    if (failedIcons.has(cleanSymbol)) {
      setError(true);
      return;
    }

    // Fetch icon from CoinGecko API
    const fetchIcon = async () => {
      try {
        // CoinGecko API: /api/v3/coins/{id} - id is lowercase
        const coinId = cleanSymbol.toLowerCase();
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`
        );

        if (!response.ok) {
          throw new Error('Icon not found');
        }

        const data = await response.json();
        const imageUrl = data.image?.small || data.image?.thumb;

        if (imageUrl) {
          iconCache.set(cleanSymbol, imageUrl);
          setIconUrl(imageUrl);
        } else {
          throw new Error('No image in response');
        }
      } catch (err) {
        // Mark as failed and use fallback
        failedIcons.add(cleanSymbol);
        setError(true);
      }
    };

    fetchIcon();
  }, [cleanSymbol]);

  // Fallback: colored circle with initials
  if (error || !iconUrl) {
    const bgColor = CRYPTO_COLORS[cleanSymbol] || '#6B7280';
    return (
      <div
        className={`flex items-center justify-center rounded-full font-bold text-white ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.4,
          backgroundColor: bgColor
        }}
      >
        {cleanSymbol.substring(0, 2)}
      </div>
    );
  }

  // Render CoinGecko image
  return (
    <img
      src={iconUrl}
      alt={cleanSymbol}
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
      onError={() => {
        // If image fails to load, mark as failed and show fallback
        failedIcons.add(cleanSymbol);
        setError(true);
      }}
    />
  );
}