import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { Search, Plus, Edit, Eye, Trash, CarFront } from "lucide-react";
import { Vehicle } from "@shared/schema";
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
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function VehiclesPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const { toast } = useToast();
  const itemsPerPage = 10;

  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles", searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/vehicles?search=${encodeURIComponent(searchQuery)}`
        : '/api/vehicles';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch vehicles');
      return res.json();
    }
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers"],
  });

  // Pagination
  const totalPages = Math.ceil(vehicles.length / itemsPerPage);
  const paginatedVehicles = vehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    queryClient.invalidateQueries({ queryKey: ["/api/vehicles", searchQuery] });
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    
    try {
      await apiRequest('DELETE', `/api/vehicles/${vehicleToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({
        title: "Veículo removido",
        description: `Veículo ${vehicleToDelete.plate} foi removido com sucesso.`,
      });
      setVehicleToDelete(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o veículo.",
        variant: "destructive",
      });
    }
  };

  const getDriverName = (driverId: number) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : "Motorista não encontrado";
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Veículos</h2>
          <p className="text-sm text-slate-500">Gerencie os veículos da frota</p>
        </div>

        <div className="mt-4 md:mt-0 w-full md:w-auto flex flex-col sm:flex-row gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-grow sm:max-w-xs">
            <Input
              type="text"
              placeholder="Buscar veículo..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </form>
          <Link href="/drivers/new">
            <Button className="flex gap-1 items-center">
              <Plus className="h-4 w-4" />
              <span>Novo Motorista</span>
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Marca / Modelo</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Carregando veículos...
                    </TableCell>
                  </TableRow>
                ) : paginatedVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      <div className="flex flex-col items-center py-4 text-slate-500">
                        <CarFront className="h-12 w-12 mb-2 text-slate-300" />
                        <p className="mb-1">Nenhum veículo encontrado</p>
                        <p className="text-sm">
                          {searchQuery ? "Tente uma busca diferente" : "Adicione o primeiro veículo ao cadastrar um motorista"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {vehicle.plate}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{vehicle.brand}</div>
                        <div className="text-xs text-slate-500">{vehicle.model}</div>
                      </TableCell>
                      <TableCell>{vehicle.year}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full" 
                            style={{ 
                              backgroundColor: vehicle.color.toLowerCase(),
                              border: '1px solid #ccc'
                            }}
                          ></span>
                          {vehicle.color}
                        </div>
                      </TableCell>
                      <TableCell>{getDriverName(vehicle.driverId)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary"
                            title="Editar"
                            onClick={() => navigate(`/drivers/${vehicle.driverId}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500"
                            title="Ver detalhes"
                            onClick={() => navigate(`/drivers/${vehicle.driverId}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500"
                            title="Excluir"
                            onClick={() => setVehicleToDelete(vehicle)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={vehicles.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!vehicleToDelete} onOpenChange={(open) => !open && setVehicleToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o veículo {vehicleToDelete?.plate}?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteVehicle}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
