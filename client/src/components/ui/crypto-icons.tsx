import React from "react";
import { SiBitcoin, SiEthereum, SiBinance, SiSolana, SiLitecoin, SiDogecoin, SiXrp, SiCardano } from "react-icons/si";

// Componente para mostrar el icono de una criptomoneda
export const CryptoIcon: React.FC<{ symbol: string; size?: number; className?: string }> = ({ 
  symbol, 
  size = 20,
  className = ""
}) => {
  const baseSymbol = symbol.replace(/USDT$|USD$|BUSD$/, "");
  
  const iconProps = { size, className };
  
  const icons: Record<string, React.ReactNode> = {
    "BTC": <SiBitcoin {...iconProps} className={`text-[#F7931A] ${className}`} />,
    "ETH": <SiEthereum {...iconProps} className={`text-[#627EEA] ${className}`} />,
    "BNB": <SiBinance {...iconProps} className={`text-[#F0B90B] ${className}`} />,
    "SOL": <SiSolana {...iconProps} className={`text-[#00FFA3] ${className}`} />,
    "LTC": <SiLitecoin {...iconProps} className={`text-[#345D9D] ${className}`} />,
    "DOGE": <SiDogecoin {...iconProps} className={`text-[#C2A633] ${className}`} />,
    "XRP": <SiXrp {...iconProps} className={`text-[#23292F] ${className}`} />,
    "ADA": <SiCardano {...iconProps} className={`text-[#3CC8C8] ${className}`} />,
  };
  
  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      {icons[baseSymbol] || (
        <div 
          className="bg-muted rounded-full w-full h-full flex items-center justify-center"
          style={{ fontSize: size * 0.4 }}
        >
          <span className="font-bold text-muted-foreground">{baseSymbol.slice(0, 3)}</span>
        </div>
      )}
    </div>
  );
};

export const cryptoIcons = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  BNB: "#F0B90B",
  SOL: "#00FFA3",
  LTC: "#345D9D",
  DOGE: "#C2A633",
  XRP: "#23292F",
  ADA: "#3CC8C8",
};