import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Search, Plus, Edit, Eye, Trash, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DriverTable } from "@/components/drivers/driver-table-mobile";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { DriverWithVehicles } from "@shared/schema";

export default function DriversPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [driverToDelete, setDriverToDelete] = useState<DriverWithVehicles | null>(null);
  const { toast } = useToast();

  // Verificar se o usuário pode criar novos motoristas
  const canCreateDriver = () => {
    // Administradores podem criar motoristas
    if (user?.profileType?.toLowerCase() === "admin" || user?.profileType?.toLowerCase() === "administrador") {
      return true;
    }
    
    // Motoristas podem criar outros motoristas
    if (user?.profileType?.toLowerCase() === "motorista" || user?.profileType?.toLowerCase() === "driver") {
      return true;
    }
    
    // Transportadores podem criar motoristas
    if (user?.profileType?.toLowerCase() === "transportador") {
      return true;
    }
    
    // Embarcadores (shipper) e agentes podem criar motoristas
    if (user?.profileType?.toLowerCase() === "shipper" || 
        user?.profileType?.toLowerCase() === "embarcador" || 
        user?.profileType?.toLowerCase() === "agente" ||
        user?.profileType?.toLowerCase() === "agent") {
      return true;
    }
    
    return false;
  };

  const { data: driversData = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/drivers", searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/drivers?search=${encodeURIComponent(searchQuery)}`
        : '/api/drivers';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch drivers');
      return res.json();
    }
  });

  // Transformar dados para o formato que o componente espera
  const drivers: DriverWithVehicles[] = driversData.map(motorista => {
    if (motorista.hasCompleteProfile && motorista.driverData) {
      // Motorista com cadastro completo
      return {
        ...motorista.driverData,
        vehicles: motorista.vehicles || [],
        hasCompleteProfile: true
      };
    } else {
      // Motorista sem cadastro completo - criar estrutura básica
      return {
        id: motorista.userId,
        userId: motorista.userId,
        name: motorista.name,
        email: motorista.email,
        phone: motorista.phone || '',
        whatsapp: motorista.whatsapp || '',
        cpf: '',
        birthdate: new Date(),
        cnh: '',
        cnhCategory: '',
        cnhExpiration: new Date(),
        cnhIssueDate: new Date(),
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipcode: '',
        createdAt: motorista.createdAt,
        currentLatitude: null,
        currentLongitude: null,
        lastLocationUpdate: null,
        locationEnabled: false,
        vehicles: [],
        hasCompleteProfile: false
      } as DriverWithVehicles & { hasCompleteProfile: boolean };
    }
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    queryClient.invalidateQueries({ queryKey: ["/api/drivers", searchQuery] });
  };

  const handleEdit = (driver: DriverWithVehicles) => {
    navigate(`/drivers/${driver.id}`);
  };

  const handleView = (driver: DriverWithVehicles) => {
    navigate(`/drivers/${driver.id}`);
  };

  const handleDelete = (driver: DriverWithVehicles) => {
    setDriverToDelete(driver);
  };

  const confirmDelete = async () => {
    if (!driverToDelete) return;
    
    try {
      await apiRequest('DELETE', `/api/drivers/${driverToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({
        title: "Motorista removido",
        description: `Motorista ${driverToDelete.name} foi removido com sucesso.`,
      });
      setDriverToDelete(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o motorista.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Motoristas</h2>
          <p className="text-sm text-slate-500">Gerencie o cadastro de motoristas e seus veículos</p>
        </div>

        <div className="mt-4 md:mt-0 w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-grow sm:max-w-xs">
            <Input
              type="text"
              placeholder="Buscar motorista ou veículo..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </form>
          {canCreateDriver() && (
            <Link href="/drivers/new">
              <Button className="flex gap-1 items-center">
                <Plus className="h-4 w-4" />
                <span>Novo Motorista</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      <DriverTable
        drivers={drivers}
        isLoading={isLoading}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
      />

      <Dialog open={!!driverToDelete} onOpenChange={(open) => !open && setDriverToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o motorista {driverToDelete?.name}?
              {driverToDelete?.vehicles?.length ? 
                ` Isso também excluirá ${driverToDelete.vehicles.length} ${driverToDelete.vehicles.length === 1 ? 'veículo' : 'veículos'} associados.` : 
                ''
              }
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
