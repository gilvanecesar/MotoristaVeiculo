import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FreightsTable() {
  const { toast } = useToast();
  const [selectedFreight, setSelectedFreight] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDestinationsDialogOpen, setIsDestinationsDialogOpen] = useState(false);

  // Buscar fretes
  const { data: freights = [], isLoading: isLoadingFreights } = useQuery({
    queryKey: ["/api/freights"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/freights");
      if (!res.ok) throw new Error("Falha ao carregar fretes");
      return await res.json();
    }
  });

  // Buscar clientes para exibir o nome correto
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clients");
      if (!res.ok) throw new Error("Falha ao carregar clientes");
      return await res.json();
    }
  });

  // Mutação para deletar frete
  const deleteMutation = useMutation({
    mutationFn: async (freightId: number) => {
      const res = await apiRequest("DELETE", `/api/freights/${freightId}`);
      if (!res.ok) throw new Error("Falha ao deletar frete");
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Frete deletado",
        description: "O frete foi removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/freights"] });
      setSelectedFreight(null);
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar frete",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleViewDestinations = (freight: any) => {
    setSelectedFreight(freight);
    setIsDestinationsDialogOpen(true);
  };

  const handleDeleteClick = (freight: any) => {
    setSelectedFreight(freight);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedFreight) {
      deleteMutation.mutate(selectedFreight.id);
    }
  };

  // Formatar status do frete
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pendente: "Pendente",
      em_andamento: "Em andamento",
      concluido: "Concluído",
      cancelado: "Cancelado"
    };
    return statusMap[status] || status;
  };

  // Determinar a cor do badge com base no status
  const getStatusVariant = (status: string) => {
    const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pendente: "outline",
      em_andamento: "secondary",
      concluido: "default",
      cancelado: "destructive"
    };
    return variantMap[status] || "outline";
  };

  // Encontrar o nome do cliente com base no ID
  const getClientName = (clientId: number) => {
    const client = clients.find((c: any) => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };

  if (isLoadingFreights || isLoadingClients) {
    return (
      <div className="flex justify-center p-8">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-lg font-medium">Fretes Cadastrados</h3>
        <Button onClick={() => window.location.href = "/freights/new"}>
          <Icons.plus className="mr-2 h-4 w-4" />
          Novo Frete
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Destinos</TableHead>
              <TableHead>Data de Coleta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {freights.map((freight: any) => (
              <TableRow key={freight.id}>
                <TableCell>{freight.id}</TableCell>
                <TableCell>{freight.clientId ? getClientName(freight.clientId) : 'N/A'}</TableCell>
                <TableCell>{freight.origin}, {freight.originState}</TableCell>
                <TableCell>
                  <Button 
                    variant="link" 
                    onClick={() => handleViewDestinations(freight)}
                  >
                    Ver {freight.destinations?.length || 0} destinos
                  </Button>
                </TableCell>
                <TableCell>
                  {freight.collectionDate ? format(new Date(freight.collectionDate), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(freight.status)}>
                    {getStatusText(freight.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(freight.price || 0)}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `/freights/${freight.id}`}
                    >
                      <Icons.edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteClick(freight)}
                    >
                      <Icons.trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog para visualizar destinos */}
      <Dialog open={isDestinationsDialogOpen} onOpenChange={setIsDestinationsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Destinos do Frete #{selectedFreight?.id}</DialogTitle>
            <DialogDescription>
              Detalhes dos destinos para o frete selecionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedFreight && selectedFreight.destinations && (
            <div className="space-y-4 py-4">
              {selectedFreight.destinations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Data de Entrega</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedFreight.destinations.map((dest: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{dest.city}</TableCell>
                        <TableCell>{dest.state}</TableCell>
                        <TableCell>
                          {dest.deliveryDate ? format(new Date(dest.deliveryDate), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p>Não há destinos cadastrados para este frete.</p>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDestinationsDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o frete #{selectedFreight?.id}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}