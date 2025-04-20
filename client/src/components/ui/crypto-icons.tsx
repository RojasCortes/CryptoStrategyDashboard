import React from "react";
import { SiBitcoin, SiEthereum, SiBinance, SiSolana, SiLitecoin, SiDogecoin, SiXrp, SiCardano } from "react-icons/si";

// Mapeo de símbolos de criptomonedas a sus iconos
export const cryptoIcons: Record<string, React.ReactNode> = {
  "BTC": <SiBitcoin className="text-[#F7931A]" />,
  "ETH": <SiEthereum className="text-[#627EEA]" />,
  "BNB": <SiBinance className="text-[#F0B90B]" />,
  "SOL": <SiSolana className="text-[#00FFA3]" />,
  "LTC": <SiLitecoin className="text-[#345D9D]" />,
  "DOGE": <SiDogecoin className="text-[#C2A633]" />,
  "XRP": <SiXrp className="text-[#23292F]" />,
  "ADA": <SiCardano className="text-[#3CC8C8]" />,
};

// Componente para mostrar el icono de una criptomoneda
export const CryptoIcon: React.FC<{ symbol: string; size?: string }> = ({ 
  symbol, 
  size = "h-5 w-5" 
}) => {
  // Obtener el símbolo sin el par de trading (e.g., "BTCUSDT" -> "BTC")
  const baseSymbol = symbol.replace(/USDT$|USD$|BUSD$/, "");
  
  // Devolver el ícono si existe, o un placeholder si no
  return (
    <div className={`${size} flex items-center justify-center`}>
      {cryptoIcons[baseSymbol] || (
        <div className="bg-muted rounded-full w-full h-full flex items-center justify-center">
          <span className="text-xs font-bold">{baseSymbol.slice(0, 3)}</span>
        </div>
      )}
    </div>
  );
};