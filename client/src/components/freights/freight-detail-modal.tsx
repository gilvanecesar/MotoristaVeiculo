import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ExternalLink } from "lucide-react";
// Removida importação de useAuth para evitar dependência circular
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface FreightDetailModalProps {
  freightId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export function FreightDetailModal({
  freightId,
  isOpen,
  onClose,
  onEdit,
}: FreightDetailModalProps) {
  const [client, setClient] = useState<any>(null);

  // Função para verificar se usuário tem permissão para editar este frete
  const userCanEditFreight = (freightUserId?: number) => {
    // Simplificada para permitir edição
    return true;
  };

  // Buscar dados do frete
  const {
    data: freight,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/freights", freightId],
    queryFn: async () => {
      if (!freightId) return null;
      const res = await apiRequest("GET", `/api/freights/${freightId}`);
      if (!res.ok) throw new Error("Erro ao carregar dados do frete");
      return await res.json();
    },
    enabled: isOpen && !!freightId,
  });

  // Buscar destinos adicionais
  const { data: destinations = [] } = useQuery({
    queryKey: ["/api/freight-destinations", freightId],
    queryFn: async () => {
      if (!freightId) return [];
      const res = await apiRequest(
        "GET",
        `/api/freight-destinations?freightId=${freightId}`
      );
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: isOpen && !!freightId && !!freight,
  });

  // Buscar dados do cliente associado ao frete
  useEffect(() => {
    const fetchClient = async () => {
      if (freight?.clientId) {
        try {
          const res = await apiRequest("GET", `/api/clients/${freight.clientId}`);
          if (res.ok) {
            const data = await res.json();
            setClient(data);
          }
        } catch (err) {
          console.error("Erro ao carregar cliente:", err);
        }
      }
    };

    if (freight) {
      fetchClient();
    }
  }, [freight]);

  // Exibir placeholders de carregamento
  if (isLoading || !freight) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Frete</DialogTitle>
            <DialogDescription>Carregando informações...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Exibir mensagem de erro
  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erro</DialogTitle>
            <DialogDescription>
              Ocorreu um erro ao carregar os detalhes do frete. Por favor, tente
              novamente.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl">Detalhes do Frete</DialogTitle>
            <DialogDescription>
              Informações completas do frete selecionado
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            {userCanEditFreight(freight.userId) && onEdit && (
              <Button onClick={onEdit} variant="outline" size="sm">
                Editar
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Informações básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="font-semibold">Cliente</div>
                <div>{client?.name || "Não informado"}</div>
              </div>
              <div>
                <div className="font-semibold">ID do Frete</div>
                <div>#{freight.id}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}