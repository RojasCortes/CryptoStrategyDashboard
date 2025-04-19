import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useTestBinanceConnection } from "@/hooks/use-binance";

export function ApiStatusAlert() {
  const [isVisible, setIsVisible] = useState(true);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const { user } = useAuth();
  const testConnection = useTestBinanceConnection();

  useEffect(() => {
    if (user?.apiKey && user?.apiSecret) {
      testConnection.mutate(
        { apiKey: user.apiKey, apiSecret: user.apiSecret },
        {
          onSuccess: (success) => {
            setIsConnected(success);
          },
        }
      );
    } else {
      setIsConnected(false);
    }
  }, [user]);

  if (!isVisible || isConnected === null) {
    return null;
  }

  return (
    <Alert
      variant={isConnected ? "success" : "destructive"}
      className="mb-4 flex items-center justify-between"
    >
      <div className="flex items-center">
        {isConnected ? (
          <CheckCircle2 className="h-5 w-5 mr-2" />
        ) : (
          <AlertCircle className="h-5 w-5 mr-2" />
        )}
        <div>
          <AlertTitle>
            {isConnected ? "Connected" : "Not Connected"}
          </AlertTitle>
          <AlertDescription>
            {isConnected
              ? "Binance API connected successfully"
              : user?.apiKey
                ? "Failed to connect to Binance API. Please check your API keys."
                : "Binance API keys not configured. Please add your API keys in settings."}
          </AlertDescription>
        </div>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="text-sm opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}
