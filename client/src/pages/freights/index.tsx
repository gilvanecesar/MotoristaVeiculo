import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useAuth as useUserAuth } from "@/hooks/use-auth";
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Trash2, 
  Truck, 
  Filter, 
  PhoneCall, 
  MapPin, 
  Package, 
  DollarSign,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FreightWithDestinations, 
  Client,
  CARGO_TYPES, 
  TARP_OPTIONS, 
  TOLL_OPTIONS, 
  VEHICLE_TYPES,
  BODY_TYPES
} from "@shared/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/format";
import { FaWhatsapp } from "react-icons/fa";

export default function FreightsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFreight, setSelectedFreight] = useState<FreightWithDestinations | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [expandedFreight, setExpandedFreight] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { currentClient, isClientAuthorized } = useAuth();
  const { user } = useUserAuth();
  const [filters, setFilters] = useState({
    origin: "",
    destination: "",
    vehicleType: "todos",
    bodyType: "todos",
    cargoType: "todos",
    paymentMethod: "todos",
    minWeight: "",
    maxWeight: ""
  });

  // Função para filtrar os fretes de acordo com os critérios
  const filterFreights = (data: FreightWithDestinations[]) => {
    if (!data) return [];
    
    return data.filter(freight => {
      // Filtro por status
      if (filterStatus !== "todos" && freight.status !== filterStatus) {
        return false;
      }
      
      // Filtros adicionais
      if (filters.origin && !freight.origin.toLowerCase().includes(filters.origin.toLowerCase()) && 
          !freight.originState.toLowerCase().includes(filters.origin.toLowerCase())) {
        return false;
      }
      
      if (filters.destination && !freight.destination.toLowerCase().includes(filters.destination.toLowerCase()) && 
          !freight.destinationState.toLowerCase().includes(filters.destination.toLowerCase())) {
        return false;
      }
      
      if (filters.vehicleType && filters.vehicleType !== 'todos' && freight.vehicleType !== filters.vehicleType) {
        return false;
      }
      
      if (filters.bodyType && filters.bodyType !== 'todos' && freight.bodyType !== filters.bodyType) {
        return false;
      }
      
      if (filters.cargoType && filters.cargoType !== 'todos' && freight.cargoType !== filters.cargoType) {
        return false;
      }
      
      if (filters.paymentMethod && filters.paymentMethod !== 'todos' && freight.paymentMethod !== filters.paymentMethod) {
        return false;
      }
      
      // Filtro por peso
      const weight = parseFloat(freight.cargoWeight);
      if (filters.minWeight && weight < parseFloat(filters.minWeight)) {
        return false;
      }
      
      if (filters.maxWeight && weight > parseFloat(filters.maxWeight)) {
        return false;
      }
      
      return true;
    });
  };

  // Fetch data
  const { data: freights, isLoading } = useQuery({
    queryKey: ['/api/freights'],
    select: filterFreights
  });
  
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  const handleDelete = async () => {
    if (!selectedFreight) return;
    
    try {
      const response = await fetch(`/api/freights/${selectedFreight.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error deleting freight:", errorData);
        alert(`Erro ao excluir frete: ${errorData.message || 'Falha na operação'}`);
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/freights'] });
      setDeleteDialogOpen(false);
      alert('Frete excluído com sucesso!');
    } catch (error) {
      console.error("Error deleting freight:", error);
      alert('Erro ao excluir frete. Verifique o console para mais detalhes.');
    }
  };

  const getCargoTypeDisplay = (type: string) => {
    switch (type) {
      case CARGO_TYPES.COMPLETA:
        return "Carga Completa";
      case CARGO_TYPES.COMPLEMENTO:
        return "Complemento";
      default:
        return type;
    }
  };

  const getTarpDisplay = (option: string) => {
    switch (option) {
      case TARP_OPTIONS.SIM:
        return "Sim";
      case TARP_OPTIONS.NAO:
        return "Não";
      default:
        return option;
    }
  };

  const getTollDisplay = (option: string) => {
    switch (option) {
      case TOLL_OPTIONS.INCLUSO:
        return "Incluso";
      case TOLL_OPTIONS.A_PARTE:
        return "À Parte";
      default:
        return option;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aberto":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Aberto</Badge>;
      case "em_andamento":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">Em Andamento</Badge>;
      case "concluido":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Concluído</Badge>;
      case "cancelado":
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getVehicleTypeDisplay = (type: string) => {
    const vehicleTypesMap = {
      leve_fiorino: "Fiorino",
      leve_toco: "Toco (Leve)",
      leve_vlc: "VLC",
      leve_todos: "Veículo Leve (Qualquer)",
      medio_truck: "Truck",
      medio_bitruck: "Bitruck",
      medio_todos: "Veículo Médio (Qualquer)",
      pesado_carreta: "Carreta",
      pesado_carreta_ls: "Carreta LS",
      pesado_bitrem: "Bitrem",
      pesado_rodotrem: "Rodotrem",
      pesado_vanderleia: "Vanderleia",
      pesado_todos: "Veículo Pesado (Qualquer)"
    };
    
    return vehicleTypesMap[type] || type;
  };
  
  const getBodyTypeDisplay = (type: string) => {
    const bodyTypesMap = {
      bau: "Baú",
      bau_frigorifico: "Baú Frigorífico",
      sider: "Sider",
      graneleiro: "Graneleiro",
      tanque: "Tanque",
      cacamba: "Caçamba",
      basculante: "Basculante",
      plataforma: "Plataforma",
      prancha: "Prancha",
      porta_container: "Porta Container",
      madeireiro: "Madeireiro",
      cegonha: "Cegonha",
      gaiola: "Gaiola"
    };
    
    return bodyTypesMap[type] || type;
  };
  
  // Função para obter informações do cliente
  const getClientInfo = (clientId: number) => {
    if (!clients) return null;
    return clients.find(client => client.id === clientId);
  };

  const toggleDeleteDialog = (freight: FreightWithDestinations | null) => {
    setSelectedFreight(freight);
    setDeleteDialogOpen(!!freight);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Fretes</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Buscar fretes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-auto min-w-[200px]"
            />
            <Button type="submit" variant="secondary" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <div className="flex gap-2 mt-2 md:mt-0">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
            </Button>

            <Button onClick={() => navigate("/freights/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Frete
            </Button>
          </div>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle>Filtros Avançados</CardTitle>
            <CardDescription>
              Use os filtros abaixo para refinar os resultados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Origem</label>
                <Input 
                  placeholder="Filtrar por origem" 
                  value={filters.origin}
                  onChange={(e) => setFilters({...filters, origin: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Destino</label>
                <Input 
                  placeholder="Filtrar por destino" 
                  value={filters.destination}
                  onChange={(e) => setFilters({...filters, destination: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Veículo</label>
                <Select 
                  value={filters.vehicleType} 
                  onValueChange={(value) => setFilters({...filters, vehicleType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {Object.entries(VEHICLE_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {getVehicleTypeDisplay(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Carroceria</label>
                <Select 
                  value={filters.bodyType} 
                  onValueChange={(value) => setFilters({...filters, bodyType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {Object.entries(BODY_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {getBodyTypeDisplay(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Carga</label>
                <Select 
                  value={filters.cargoType} 
                  onValueChange={(value) => setFilters({...filters, cargoType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {Object.entries(CARGO_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {getCargoTypeDisplay(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Forma de Pagamento</label>
                <Select 
                  value={filters.paymentMethod} 
                  onValueChange={(value) => setFilters({...filters, paymentMethod: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="a_vista">À Vista</SelectItem>
                    <SelectItem value="30_dias">30 Dias</SelectItem>
                    <SelectItem value="45_dias">45 Dias</SelectItem>
                    <SelectItem value="60_dias">60 Dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Peso Mínimo (kg)</label>
                <Input 
                  type="number" 
                  placeholder="Peso mínimo" 
                  value={filters.minWeight}
                  onChange={(e) => setFilters({...filters, minWeight: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Peso Máximo (kg)</label>
                <Input 
                  type="number" 
                  placeholder="Peso máximo" 
                  value={filters.maxWeight}
                  onChange={(e) => setFilters({...filters, maxWeight: e.target.value})}
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setFilters({
                  origin: "",
                  destination: "",
                  vehicleType: "todos",
                  bodyType: "todos",
                  cargoType: "todos",
                  paymentMethod: "todos",
                  minWeight: "",
                  maxWeight: ""
                })}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Lista de Fretes</CardTitle>
          <CardDescription>
            Gerenciamento de fretes com detalhes de origem, destino e carga
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, idx) => (
                <div key={idx} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : freights && freights.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Destinos Adicionais</TableHead>
                  <TableHead>Tipo de Carga</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {freights.map((freight) => (
                  <>
                    <TableRow key={freight.id} className="cursor-pointer" onClick={() => setExpandedFreight(expandedFreight === freight.id ? null : freight.id)}>
                      <TableCell>{getStatusBadge(freight.status)}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {freight.origin}, {freight.originState}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {freight.destination}, {freight.destinationState}
                        </div>
                      </TableCell>
                      <TableCell>
                        {freight.hasMultipleDestinations && freight.destinations && freight.destinations.length > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            {freight.destinations.length} destinos adicionais
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-sm">Não</span>
                        )}
                      </TableCell>
                      <TableCell>{getCargoTypeDisplay(freight.cargoType)}</TableCell>
                      <TableCell>{freight.productType}</TableCell>
                      <TableCell>{freight.cargoWeight} kg</TableCell>
                      <TableCell>{freight.paymentMethod || "À vista"}</TableCell>
                      <TableCell>{formatCurrency(Number(freight.freightValue))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/freights/${freight.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(user?.profileType === "admin" || user?.clientId === freight.clientId) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/freights/edit/${freight.id}`);
                              }}
                              title="Editar frete"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {(user?.profileType === "admin" || user?.clientId === freight.clientId) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDeleteDialog(freight);
                              }}
                              title="Excluir frete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {expandedFreight === freight.id && (
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableCell colSpan={10}>
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Informações do Veículo */}
                              <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="text-md font-semibold flex items-center mb-2">
                                  <Truck className="h-4 w-4 mr-2 text-primary" />
                                  Informações do Veículo
                                </h3>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium">Tipo:</span> {getVehicleTypeDisplay(freight.vehicleType)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Carroceria:</span> {getBodyTypeDisplay(freight.bodyType)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Peso da Carga:</span> {freight.cargoWeight} kg
                                  </div>
                                  <div>
                                    <span className="font-medium">Lona:</span> {getTarpDisplay(freight.needsTarp)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Pedágio:</span> {getTollDisplay(freight.toll || "a_parte")}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Detalhes do Frete */}
                              <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="text-md font-semibold flex items-center mb-2">
                                  <Package className="h-4 w-4 mr-2 text-primary" />
                                  Detalhes da Carga
                                </h3>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium">Tipo de Carga:</span> {getCargoTypeDisplay(freight.cargoType)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Produto:</span> {freight.productType}
                                  </div>
                                  <div>
                                    <span className="font-medium">Valor do Frete:</span> {formatCurrency(Number(freight.freightValue))}
                                  </div>
                                  <div>
                                    <span className="font-medium">Data de Criação:</span> {freight.createdAt ? new Date(freight.createdAt).toLocaleDateString('pt-BR') : "N/A"}
                                  </div>
                                  {freight.clientId && (
                                    <div>
                                      <span className="font-medium">Cliente:</span> {getClientInfo(freight.clientId)?.name || 'Não especificado'}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Informações de Contato */}
                              <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="text-md font-semibold flex items-center mb-2">
                                  <PhoneCall className="h-4 w-4 mr-2 text-primary" />
                                  Informações de Contato
                                </h3>
                                <div className="space-y-3 text-sm">
                                  <div className="flex items-center">
                                    <span className="font-medium mr-2">Contato:</span> {freight.contactName || 'Não especificado'}
                                  </div>
                                  
                                  {freight.contactPhone && (
                                    <div className="flex items-center">
                                      <span className="font-medium mr-2">Telefone:</span> {freight.contactPhone}
                                      <a 
                                        href={`tel:${freight.contactPhone}`}
                                        className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <PhoneCall className="h-4 w-4" />
                                      </a>
                                    </div>
                                  )}
                                  
                                  {freight.contactPhone && (
                                    <div className="mt-2">
                                      <a 
                                        href={`https://wa.me/55${freight.contactPhone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-white bg-green-500 hover:bg-green-600 transition-colors px-3 py-1.5 rounded-md text-sm"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <FaWhatsapp className="h-4 w-4" />
                                        Contato via WhatsApp
                                      </a>
                                    </div>
                                  )}
                                  
                                  {freight.observations && (
                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                      <span className="font-medium block mb-1">Observações:</span>
                                      <p className="text-slate-600 dark:text-slate-300 text-sm">
                                        {freight.observations}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Múltiplos Destinos */}
                            {freight.hasMultipleDestinations && freight.destinations && freight.destinations.length > 0 && (
                              <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700 mt-4">
                                <h3 className="text-md font-semibold flex items-center mb-3">
                                  <MapPin className="h-4 w-4 mr-2 text-primary" />
                                  Múltiplos Destinos
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {freight.destinations.map((dest, index) => (
                                    <div key={dest.id || index} className="p-3 border border-slate-200 dark:border-slate-700 rounded-md">
                                      <div className="text-sm">
                                        <div className="font-medium text-slate-800 dark:text-slate-200">
                                          {index + 1}. {dest.destination}, {dest.destinationState}
                                        </div>
                                        <div className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                                          Sequência de entrega: {index + 1}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <div className="flex justify-center mb-3">
                <Truck className="h-10 w-10 text-slate-300" />
              </div>
              <p>Nenhum frete encontrado.</p>
              <p className="text-sm">
                Comece criando um novo frete através do botão acima.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-slate-100 dark:border-slate-700">
          <div className="text-xs text-slate-500">
            Total de registros: {freights?.length || 0}
          </div>
        </CardFooter>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Frete</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este frete? Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div>
            {selectedFreight && (
              <>
                <div className="mb-4">
                  <span className="font-medium">Origem:</span> {selectedFreight.origin}, {selectedFreight.originState}
                </div>
                <div className="mb-4">
                  <span className="font-medium">Destino:</span> {selectedFreight.destination}, {selectedFreight.destinationState}
                </div>
                <div className="mb-4">
                  <span className="font-medium">Produto:</span> {selectedFreight.productType}
                </div>
                <div>
                  <span className="font-medium">Valor:</span> {formatCurrency(Number(selectedFreight.freightValue))}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}