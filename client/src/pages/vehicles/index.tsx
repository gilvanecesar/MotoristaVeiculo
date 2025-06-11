import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { 
  Search, Plus, Edit, Eye, Trash, CarFront, ChevronDown, ChevronRight, 
  User, Phone, Mail, MapPin, CreditCard, Calendar, Filter
} from "lucide-react";
import { format } from "date-fns";
import { Vehicle, VEHICLE_TYPES, BODY_TYPES } from "@shared/schema";
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
import { useAuth } from "@/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdvancedFilter, FilterOption, FilterState } from "@/components/shared/advanced-filter";

export default function VehiclesPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [filterState, setFilterState] = useState<FilterState>({
    category: "all",
    specificType: "all",
    bodyType: "all"
  });
  const { toast } = useToast();
  const itemsPerPage = 10;

  // Verificar se o usuário pode editar/excluir um veículo específico
  const canEditVehicle = (vehicle: Vehicle) => {
    // Administradores podem editar qualquer veículo
    if (user?.profileType?.toLowerCase() === "admin" || user?.profileType?.toLowerCase() === "administrador") {
      return true;
    }
    
    // Motoristas só podem editar seus próprios veículos
    if (user?.profileType?.toLowerCase() === "motorista" && user?.driverId === vehicle.driverId) {
      return true;
    }
    
    return false;
  };

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

  const { data: drivers = [] } = useQuery<any[]>({
    queryKey: ["/api/drivers"],
  });

  // Obter categoria do veículo (leve, médio, pesado)
  const getVehicleCategory = (vehicle: Vehicle): string => {
    if (!vehicle) return "Desconhecido";
    
    // Leves
    if (vehicle.vehicleType.startsWith("leve_")) return "Leve";
    
    // Médios
    if (vehicle.vehicleType.startsWith("medio_")) return "Médio";
    
    // Pesados
    if (vehicle.vehicleType.startsWith("pesado_")) return "Pesado";
    
    return "Desconhecido";
  };

  // Obter o tipo específico do veículo
  const getSpecificVehicleType = (vehicle: Vehicle): string => {
    if (!vehicle) return "Não definido";
    
    // Leves
    if (vehicle.vehicleType === VEHICLE_TYPES.LEVE_TODOS) return "Todos";
    if (vehicle.vehicleType === VEHICLE_TYPES.LEVE_FIORINO) return "Fiorino";
    if (vehicle.vehicleType === VEHICLE_TYPES.LEVE_TOCO) return "Toco";
    if (vehicle.vehicleType === VEHICLE_TYPES.LEVE_VLC) return "VLC";
    
    // Médios
    if (vehicle.vehicleType === VEHICLE_TYPES.MEDIO_TODOS) return "Todos";
    if (vehicle.vehicleType === VEHICLE_TYPES.MEDIO_BITRUCK) return "Bitruck";
    if (vehicle.vehicleType === VEHICLE_TYPES.MEDIO_TRUCK) return "Truck";
    
    // Pesados
    if (vehicle.vehicleType === VEHICLE_TYPES.PESADO_TODOS) return "Todos";
    if (vehicle.vehicleType === VEHICLE_TYPES.PESADO_BITREM) return "Bitrem";
    if (vehicle.vehicleType === VEHICLE_TYPES.PESADO_CARRETA) return "Carreta";
    if (vehicle.vehicleType === VEHICLE_TYPES.PESADO_CARRETA_LS) return "Carreta LS";
    if (vehicle.vehicleType === VEHICLE_TYPES.PESADO_RODOTREM) return "Rodotrem";
    if (vehicle.vehicleType === VEHICLE_TYPES.PESADO_VANDERLEIA) return "Vanderléia";
    
    return "Desconhecido";
  };
  
  // Formatar o tipo de veículo para exibição (mantido para compatibilidade)
  const getVehicleTypeDisplay = (vehicle: Vehicle) => {
    if (!vehicle) return "Não definido";
    return `${getVehicleCategory(vehicle)} (${getSpecificVehicleType(vehicle)})`;
  };
  
  // Formatar o tipo de carroceria para exibição
  const getBodyTypeDisplay = (vehicle: Vehicle) => {
    if (!vehicle) return "Não definido";
    
    if (vehicle.bodyType === BODY_TYPES.BAU) return "Baú";
    if (vehicle.bodyType === BODY_TYPES.GRANELEIRA) return "Graneleira";
    if (vehicle.bodyType === BODY_TYPES.BASCULANTE) return "Basculante";
    if (vehicle.bodyType === BODY_TYPES.PLATAFORMA) return "Plataforma";
    if (vehicle.bodyType === BODY_TYPES.TANQUE) return "Tanque";
    if (vehicle.bodyType === BODY_TYPES.FRIGORIFICA) return "Frigorífica";
    if (vehicle.bodyType === BODY_TYPES.PORTA_CONTEINER) return "Porta Contêiner";
    if (vehicle.bodyType === BODY_TYPES.SIDER) return "Sider";
    if (vehicle.bodyType === BODY_TYPES.CACAMBA) return "Caçamba";
    if (vehicle.bodyType === BODY_TYPES.ABERTA) return "Aberta";
    if (vehicle.bodyType === BODY_TYPES.FECHADA) return "Fechada";
    
    return "Desconhecido";
  };

  // Toggle expanded row
  const toggleExpandRow = (vehicleId: number) => {
    setExpandedRows(prev => {
      if (prev.includes(vehicleId)) {
        return prev.filter(id => id !== vehicleId);
      } else {
        return [...prev, vehicleId];
      }
    });
  };
  
  // Filtrar veículos
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // Filtrar por categoria
      if (filterState.category && filterState.category !== "all" && !vehicle.vehicleType.startsWith(filterState.category.toLowerCase() + "_")) {
        return false;
      }
      
      // Filtrar por tipo específico
      if (filterState.specificType && filterState.specificType !== "all") {
        const specificType = getSpecificVehicleType(vehicle).toLowerCase();
        if (specificType !== "todos" && specificType !== filterState.specificType.toLowerCase()) {
          return false;
        }
      }
      
      // Filtrar por tipo de carroceria
      if (filterState.bodyType && filterState.bodyType !== "all" && vehicle.bodyType !== filterState.bodyType) {
        return false;
      }
      
      return true;
    });
  }, [vehicles, filterState]);
  
  // Pagination
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const paginatedVehicles = filteredVehicles.slice(
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
    if (!Array.isArray(drivers)) return "Motorista não encontrado";
    const driver = drivers.find((d: any) => d.id === driverId);
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
          <Link href="/vehicles/new">
            <Button className="flex gap-1 items-center">
              <Plus className="h-4 w-4" />
              <span>Novo Veículo</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros Avançados */}
      <AdvancedFilter
        filterOptions={[
          {
            id: "category",
            label: "Categoria",
            type: "select",
            placeholder: "Selecione a categoria",
            options: [
              { value: "leve", label: "Leve" },
              { value: "medio", label: "Médio" },
              { value: "pesado", label: "Pesado" }
            ]
          },
          {
            id: "specificType",
            label: "Tipo específico",
            type: "select",
            placeholder: "Selecione o tipo",
            options: [
              { value: "fiorino", label: "Fiorino" },
              { value: "toco", label: "Toco" },
              { value: "vlc", label: "VLC" },
              { value: "truck", label: "Truck" },
              { value: "bitruck", label: "Bitruck" },
              { value: "carreta", label: "Carreta" },
              { value: "carreta ls", label: "Carreta LS" },
              { value: "bitrem", label: "Bitrem" },
              { value: "rodotrem", label: "Rodotrem" },
              { value: "vanderléia", label: "Vanderléia" }
            ]
          },
          {
            id: "bodyType",
            label: "Carroceria",
            type: "select",
            placeholder: "Selecione a carroceria",
            options: [
              { value: BODY_TYPES.BAU, label: "Baú" },
              { value: BODY_TYPES.GRANELEIRA, label: "Graneleira" },
              { value: BODY_TYPES.BASCULANTE, label: "Basculante" },
              { value: BODY_TYPES.PLATAFORMA, label: "Plataforma" },
              { value: BODY_TYPES.TANQUE, label: "Tanque" },
              { value: BODY_TYPES.FRIGORIFICA, label: "Frigorífica" },
              { value: BODY_TYPES.PORTA_CONTEINER, label: "Porta Contêiner" },
              { value: BODY_TYPES.SIDER, label: "Sider" },
              { value: BODY_TYPES.CACAMBA, label: "Caçamba" },
              { value: BODY_TYPES.ABERTA, label: "Aberta" },
              { value: BODY_TYPES.FECHADA, label: "Fechada" }
            ]
          }
        ]}
        filterState={filterState}
        onFilterChange={setFilterState}
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Marca / Modelo</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Carroceria</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">
                      Carregando veículos...
                    </TableCell>
                  </TableRow>
                ) : paginatedVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">
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
                  paginatedVehicles.map((vehicle) => {
                    const isExpanded = expandedRows.includes(vehicle.id);
                    // Find driver info
                    const driver = Array.isArray(drivers) ? drivers.find((d: any) => d.id === vehicle.driverId) : null;
                    const createdDate = vehicle.createdAt ? new Date(vehicle.createdAt) : new Date();
                    
                    return (
                      <React.Fragment key={vehicle.id}>
                        <TableRow className="hover:bg-slate-50">
                          <TableCell className="p-2 align-middle text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleExpandRow(vehicle.id)}
                              title={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-slate-500" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-slate-500" />
                              )}
                            </Button>
                          </TableCell>
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
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className="font-medium text-xs"
                            >
                              {getVehicleCategory(vehicle)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-slate-900">
                              {getSpecificVehicleType(vehicle)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal text-xs h-5 px-1.5">
                              {getBodyTypeDisplay(vehicle)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {canEditVehicle(vehicle) && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-primary"
                                  title="Editar"
                                  onClick={() => navigate(`/drivers/${vehicle.driverId}`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-500"
                                title="Ver detalhes"
                                onClick={() => navigate(`/drivers/${vehicle.driverId}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canEditVehicle(vehicle) && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-red-500"
                                  title="Excluir"
                                  onClick={() => setVehicleToDelete(vehicle)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={9}>
                              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <h3 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-200">Informações do Veículo</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Marca / Modelo</p>
                                        <p className="text-sm font-medium">{vehicle.brand} {vehicle.model}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Placa</p>
                                        <p className="text-sm font-medium">{vehicle.plate}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Ano</p>
                                        <p className="text-sm">{vehicle.year}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Cor</p>
                                        <p className="text-sm">{vehicle.color}</p>
                                      </div>
                                      {vehicle.renavam && (
                                        <div>
                                          <p className="text-xs text-slate-500 dark:text-slate-400">Renavam</p>
                                          <p className="text-sm">{vehicle.renavam}</p>
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Cadastrado em</p>
                                        <p className="text-sm">{format(createdDate, 'dd/MM/yyyy')}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Categoria</p>
                                        <p className="text-sm">
                                          <Badge variant="secondary" className="font-medium text-xs">
                                            {getVehicleCategory(vehicle)}
                                          </Badge>
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Tipo Específico</p>
                                        <p className="text-sm">{getSpecificVehicleType(vehicle)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Tipo de Carroceria</p>
                                        <p className="text-sm">{getBodyTypeDisplay(vehicle)}</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {driver && (
                                    <div>
                                      <h3 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-200">
                                        <div className="flex items-center gap-2">
                                          <User className="h-4 w-4 text-primary" />
                                          Motorista
                                        </div>
                                      </h3>
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <User className="h-4 w-4 text-slate-500" />
                                          <div>
                                            <p className="text-sm font-medium">{driver.name}</p>
                                            <p className="text-xs text-slate-500">{driver.cpf}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4 text-slate-500" />
                                          <div>
                                            <p className="text-sm">{driver.phone}</p>
                                            {driver.whatsapp && (
                                              <a 
                                                href={`https://wa.me/${driver.whatsapp.replace(/\D/g, '')}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-xs text-primary hover:underline"
                                              >
                                                Contatar via WhatsApp
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Mail className="h-4 w-4 text-slate-500" />
                                          <p className="text-sm">{driver.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <CreditCard className="h-4 w-4 text-slate-500" />
                                          <div>
                                            <p className="text-sm">CNH: {driver.cnh}</p>
                                            <p className="text-xs text-slate-500">
                                              Categoria {driver.cnhCategory} • Validade: {format(new Date(driver.cnhExpiration), 'dd/MM/yyyy')}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                                          <div>
                                            <p className="text-sm">{driver.street}, {driver.number}{driver.complement ? ` - ${driver.complement}` : ''}</p>
                                            <p className="text-xs text-slate-500">{driver.neighborhood}, {driver.city} - {driver.state}, {driver.zipcode}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
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