import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { CryptocurrencyList } from "@/components/cryptocurrency-list";

export default function CryptocurrenciesPage() {
  const { user } = useFirebaseAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Por favor inicia sesión para acceder a las criptomonedas.</p>
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="Criptomonedas" 
      subtitle="Lista de criptomonedas disponibles en el mercado"
    >
      <CryptocurrencyList />
    </DashboardLayout>
  );
}
