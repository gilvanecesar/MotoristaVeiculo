import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export function useDriverRegistration() {
  const { user } = useAuth();

  // Buscar se o usuário atual já tem um cadastro como motorista
  const { data: userDriver, isLoading } = useQuery({
    queryKey: ["/api/drivers/by-user", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const res = await fetch(`/api/drivers/by-user/${user.id}`);
      if (res.status === 404) {
        return null; // Usuário não tem cadastro como motorista
      }
      if (!res.ok) {
        throw new Error('Failed to fetch driver registration');
      }
      return res.json();
    },
    enabled: !!user?.id && user?.profileType?.toLowerCase() === "motorista"
  });

  const isDriverProfile = user?.profileType?.toLowerCase() === "motorista";
  const hasDriverRegistration = !!userDriver;
  const needsDriverRegistration = isDriverProfile && !hasDriverRegistration && !isLoading;

  return {
    userDriver,
    isLoading,
    isDriverProfile,
    hasDriverRegistration,
    needsDriverRegistration
  };
}