import React from 'react';
import { 
  SiBitcoin, SiEthereum, SiLitecoin, SiCardano, SiPolkadot, 
  SiDogecoin, SiStellar, SiRipple, SiChainlink, SiBinance,
  SiTether, SiMonero, SiDash, SiZcash
} from 'react-icons/si';

// Colores para las criptomonedas
const CRYPTO_COLORS: Record<string, string> = {
  BTC: 'text-orange-500',
  ETH: 'text-indigo-400',
  BNB: 'text-yellow-500',
  SOL: 'text-purple-500',
  XRP: 'text-blue-400',
  ADA: 'text-blue-500',
  DOT: 'text-pink-500',
  DOGE: 'text-yellow-400',
  LTC: 'text-gray-400',
  LINK: 'text-blue-400',
  XLM: 'text-gray-600',
  USDT: 'text-green-500',
  USDC: 'text-blue-500',
  AVAX: 'text-red-500',
  MATIC: 'text-purple-600',
  TRX: 'text-red-400',
  UNI: 'text-pink-400',
  ATOM: 'text-purple-400',
  XMR: 'text-orange-600',
  FTM: 'text-blue-300',
  AAVE: 'text-purple-300',
  XTZ: 'text-blue-300',
  ALGO: 'text-gray-500',
  NEAR: 'text-black',
  NEO: 'text-green-600',
  DASH: 'text-blue-500',
  ZEC: 'text-yellow-300'
};

// Definir los tipos para las props
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

  // Convertir el símbolo a mayúsculas y eliminar caracteres no alfanuméricos
  // También eliminar sufijos comunes de pares de trading (USDT, BUSD, USD, BTC, ETH, etc.)
  let cleanSymbol = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Remove common trading pair suffixes to get the base currency
  const suffixes = ['USDT', 'BUSD', 'USDC', 'USD', 'TUSD', 'DAI', 'EUR', 'GBP', 'BTC', 'ETH', 'BNB'];
  for (const suffix of suffixes) {
    if (cleanSymbol.endsWith(suffix) && cleanSymbol.length > suffix.length) {
      cleanSymbol = cleanSymbol.slice(0, -suffix.length);
      break;
    }
  }
  
  const colorClass = CRYPTO_COLORS[cleanSymbol] || 'text-gray-500';
  
  // Devolver el icono apropiado basado en el símbolo
  switch (cleanSymbol) {
    case 'BTC':
      return <SiBitcoin {...iconProps} className={`${colorClass} ${className}`} />;
    case 'ETH':
      return <SiEthereum {...iconProps} className={`${colorClass} ${className}`} />;
    case 'BNB':
      return <SiBinance {...iconProps} className={`${colorClass} ${className}`} />;
    case 'SOL':
      return <div className={`flex items-center justify-center bg-purple-500 text-white rounded-full font-bold ${className}`} style={{ width: size, height: size, fontSize: size * 0.5 }}>SOL</div>;
    case 'XRP':
      return <SiRipple {...iconProps} className={`${colorClass} ${className}`} />;
    case 'ADA':
      return <SiCardano {...iconProps} className={`${colorClass} ${className}`} />;
    case 'DOT':
      return <SiPolkadot {...iconProps} className={`${colorClass} ${className}`} />;
    case 'DOGE':
      return <SiDogecoin {...iconProps} className={`${colorClass} ${className}`} />;
    case 'LTC':
      return <SiLitecoin {...iconProps} className={`${colorClass} ${className}`} />;
    case 'LINK':
      return <SiChainlink {...iconProps} className={`${colorClass} ${className}`} />;
    case 'XLM':
      return <SiStellar {...iconProps} className={`${colorClass} ${className}`} />;
    case 'USDT':
      return <SiTether {...iconProps} className={`${colorClass} ${className}`} />;
    case 'XMR':
      return <SiMonero {...iconProps} className={`${colorClass} ${className}`} />;
    case 'DASH':
      return <SiDash {...iconProps} className={`${colorClass} ${className}`} />;
    case 'ZEC':
      return <SiZcash {...iconProps} className={`${colorClass} ${className}`} />;
    case 'NEO':
      return (
        <div 
          className={`flex items-center justify-center ${className} rounded-full font-bold text-white`}
          style={{ 
            width: size, 
            height: size, 
            fontSize: size * 0.5,
            backgroundColor: '#00E599' 
          }}
        >
          NE
        </div>
      );
    
    // Para los tokens que no tienen iconos específicos:
    case 'USDC':
      return (
        <div 
          className={`flex items-center justify-center ${className} rounded-full font-bold text-white`}
          style={{ 
            width: size, 
            height: size, 
            fontSize: size * 0.5,
            backgroundColor: '#2775CA' 
          }}
        >
          DC
        </div>
      );
    case 'AVAX':
      return (
        <div 
          className={`flex items-center justify-center ${className} rounded-full font-bold text-white`}
          style={{ 
            width: size, 
            height: size, 
            fontSize: size * 0.5,
            backgroundColor: '#E84142' 
          }}
        >
          AX
        </div>
      );
    case 'MATIC':
    case 'POLYGON':
      return (
        <div 
          className={`flex items-center justify-center ${className} rounded-full font-bold text-white`}
          style={{ 
            width: size, 
            height: size, 
            fontSize: size * 0.5,
            backgroundColor: '#8247E5' 
          }}
        >
          MT
        </div>
      );
    default:
      // Para tokens sin iconos específicos, mostrar un contenedor circular con las primeras dos letras
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