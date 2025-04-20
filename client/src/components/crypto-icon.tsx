import React from 'react';
import { SiBitcoin, SiEthereum, SiLitecoin, SiCardano, SiPolkadot, 
         SiDogecoin, SiStellar, SiRipple, SiChainlink, SiBinance } from 'react-icons/si';

interface CryptoIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function CryptoIcon({ symbol, size = 24, className = "" }: CryptoIconProps) {
  const iconProps = {
    size,
    className
  };

  // Convert symbol to uppercase and remove any non-alphanumeric characters
  const cleanSymbol = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Return the appropriate icon based on the symbol
  switch (cleanSymbol) {
    case 'BTC':
      return <SiBitcoin {...iconProps} className={`text-orange-500 ${className}`} />;
    case 'ETH':
      return <SiEthereum {...iconProps} className={`text-indigo-400 ${className}`} />;
    case 'BNB':
      return <SiBinance {...iconProps} className={`text-yellow-500 ${className}`} />;
    case 'SOL':
      return <div className={`flex items-center justify-center bg-purple-500 text-white rounded-full font-bold ${className}`} style={{ width: size, height: size, fontSize: size * 0.5 }}>SOL</div>;
    case 'XRP':
      return <SiRipple {...iconProps} className={`text-gray-500 ${className}`} />;
    case 'ADA':
      return <SiCardano {...iconProps} className={`text-blue-500 ${className}`} />;
    case 'DOT':
      return <SiPolkadot {...iconProps} className={`text-pink-500 ${className}`} />;
    case 'DOGE':
      return <SiDogecoin {...iconProps} className={`text-yellow-400 ${className}`} />;
    case 'LTC':
      return <SiLitecoin {...iconProps} className={`text-gray-400 ${className}`} />;
    case 'LINK':
      return <SiChainlink {...iconProps} className={`text-blue-400 ${className}`} />;
    case 'XLM':
      return <SiStellar {...iconProps} className={`text-gray-500 ${className}`} />;
    default:
      // For tokens without specific icons, show a circular container with the first two letters
      return (
        <div 
          className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full font-bold ${className}`} 
          style={{ width: size, height: size, fontSize: size * 0.5 }}
        >
          {cleanSymbol.substring(0, 2)}
        </div>
      );
  }
}