import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
// import { useClientAuth } from "@/lib/auth-context";
import { useAuth } from "@/hooks/use-auth";
import { 
  getVehicleCategory, 
  getVehicleTypeNameOnly, 
  getVehicleTypeDisplay,
  formatMultipleVehicleTypes,
  formatMultipleBodyTypes
} from "@/lib/utils/vehicle-types";
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
  FreightDestination,
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

// Função para verificar se um frete está expirado
const isExpired = (expirationDate: string | Date | null | undefined): boolean => {
  if (!expirationDate) return false;
  
  const today = new Date();
  const expDate = new Date(expirationDate);
  
  return today > expDate;
};

export default function FreightsPage() {
  // Log para debugar
  console.log("Página de fretes carregando...");
  
  // Adicionar um log para quando terminar de carregar
  useEffect(() => {
    console.log("Página de fretes carregada com sucesso!");
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFreight, setSelectedFreight] = useState<FreightWithDestinations | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ativo");
  const [expandedFreight, setExpandedFreight] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const { user } = useAuth();
  // Substituindo o useClientAuth com uma implementação simplificada para motoristas
  // Definir o tipo explícito para currentClient para evitar o erro de tipagem
  const currentClient: Client | null = null; // Motoristas não têm cliente associado
  const isClientAuthorized = (clientId: number | null) => {
    // Motoristas não podem editar/excluir fretes
    if (user?.profileType === 'motorista' || user?.profileType === 'driver') {
      return false;
    }
    // Administradores têm acesso total
    if (user?.profileType === 'admin' || user?.profileType === 'administrador') {
      return true;
    }
    // Para outros perfis, verifica se o frete pertence ao cliente do usuário
    return user?.clientId === clientId;
  };
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
      if (filterStatus !== "todos") {
        const today = new Date();
        const expirationDate = freight.expirationDate ? new Date(freight.expirationDate) : null;
        
        if (expirationDate) {
          if (filterStatus === "ativo" && expirationDate < today) {
            return false;
          }
          
          if (filterStatus === "expirado" && expirationDate >= today) {
            return false;
          }
        }
      }
      
      // Filtro de busca por texto
      if (searchQuery && !Object.values(freight).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(searchQuery.toLowerCase())
      )) {
        return false;
      }
      
      // Filtros avançados
      if (filters.origin && !freight.origin.toLowerCase().includes(filters.origin.toLowerCase())) {
        return false;
      }
      
      if (filters.destination && !freight.destination.toLowerCase().includes(filters.destination.toLowerCase())) {
        return false;
      }
      
      if (filters.vehicleType !== "todos" && freight.vehicleType !== filters.vehicleType) {
        return false;
      }
      
      if (filters.bodyType !== "todos" && freight.bodyType !== filters.bodyType) {
        return false;
      }
      
      if (filters.cargoType !== "todos" && freight.cargoType !== filters.cargoType) {
        return false;
      }
      
      if (filters.paymentMethod !== "todos" && freight.paymentMethod !== filters.paymentMethod) {
        return false;
      }
      
      if (filters.minWeight && parseFloat(freight.cargoWeight) < parseFloat(filters.minWeight)) {
        return false;
      }
      
      if (filters.maxWeight && parseFloat(freight.cargoWeight) > parseFloat(filters.maxWeight)) {
        return false;
      }
      
      return true;
    });
  };

  // Buscar fretes
  const { data: freights = [], isLoading } = useQuery<FreightWithDestinations[]>({
    queryKey: ["/api/freights"],
    refetchOnWindowFocus: false,
  });

  // Buscar clientes para mapear os nomes dos clientes aos fretes
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    refetchOnWindowFocus: false,
  });

  // Botões de ação para cada frete
  const renderActionButtons = (freight: FreightWithDestinations) => {
    const canEditDelete = isClientAuthorized(freight.clientId);

    return (
      <div className="flex space-x-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/freights/${freight.id}`)}
          title="Visualizar"
        >
          <Eye className="h-4 w-4" />
        </Button>
        
        {canEditDelete && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/freights/${freight.id}/edit`)}
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedFreight(freight);
                setDeleteDialogOpen(true);
              }}
              title="Excluir"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => shareViaWhatsApp(e, freight)}
          title="Compartilhar via WhatsApp"
        >
          <FaWhatsapp className="h-4 w-4 text-green-500" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (freight.contactPhone) {
              window.open(`https://wa.me/55${freight.contactPhone.replace(/\D/g, '')}`, '_blank');
            }
          }}
          title="Contatar via WhatsApp"
          disabled={!freight.contactPhone}
        >
          <PhoneCall className="h-4 w-4 text-green-500" />
        </Button>
      </div>
    );
  };

  // Mapeia o tipo de veículo para um nome amigável
  const getVehicleTypeName = (type: string) => {
    const [category, model] = type.split('_');
    
    if (model === 'todos') {
      switch (category) {
        case 'leve': return 'Leve (Todos)';
        case 'medio': return 'Médio (Todos)';
        case 'pesado': return 'Pesado (Todos)';
        default: return type;
      }
    }
    
    return Object.entries(VEHICLE_TYPES).find(([key]) => key === type)?.[1] || type;
  };

  // Função para compartilhar via WhatsApp
  const formatWhatsAppMessage = (freight: FreightWithDestinations) => {
    const clientFound = clients.find((client: Client) => client.id === freight.clientId);
    const clientName = clientFound ? clientFound.name : "Cliente não encontrado";
    
    // URL fixa do sistema QUERO FRETES
    const baseUrl = "https://querofretes.com.br";
    // URL específica do frete (mantendo a estrutura de URL atual)
    const freightUrl = `${window.location.origin}/freights/${freight.id}`;
    
    return encodeURIComponent(`
🚛 *FRETE DISPONÍVEL* 🚛

🏢 *${clientName}*
📍 *Origem:* ${freight.origin}, ${freight.originState}
🏁 *Destino:* ${freight.destination}, ${freight.destinationState}
🚚 *Categoria:* ${getVehicleCategory(freight.vehicleType)}
🚚 *Veículo:* ${formatMultipleVehicleTypes(freight)}
🚐 *Carroceria:* ${formatMultipleBodyTypes(freight)}
📦 *Tipo de Carga:* ${freight.cargoType === 'completa' ? 'Completa' : 'Complemento'}
⚖️ *Peso:* ${freight.cargoWeight} Kg
💰 *Pagamento:* ${freight.paymentMethod}
💵 *Valor:* ${formatCurrency(freight.freightValue)}

ℹ️ *Contato:* ${freight.contactName}
📱 *Telefone:* ${freight.contactPhone}

🔗 *Sistema QUERO FRETES:* ${baseUrl}
🔗 *Link do frete:* ${freightUrl}
`);
  };

  const shareViaWhatsApp = (e: React.MouseEvent, freight: FreightWithDestinations) => {
    e.stopPropagation();
    const message = formatWhatsAppMessage(freight);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // Função para renderizar o badge de status
  const renderStatusBadge = (freight: FreightWithDestinations) => {
    // Verificamos se a data de expiração existe antes de chamar isExpired
    const expirationDate = freight.expirationDate;
    const expired = expirationDate ? isExpired(expirationDate) : false;
    
    return (
      <Badge variant={expired ? "destructive" : "default"}>
        {expired ? "Expirado" : "Ativo"}
      </Badge>
    );
  };

  // Função para deletar um frete
  const handleDeleteFreight = async () => {
    if (!selectedFreight) return;
    
    try {
      await fetch(`/api/freights/${selectedFreight.id}`, {
        method: 'DELETE',
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/freights"] });
      setDeleteDialogOpen(false);
      setSelectedFreight(null);
    } catch (error) {
      console.error("Erro ao excluir frete:", error);
    }
  };

  // Função para alternar a exibição dos detalhes de um frete no mobile
  const toggleFreightExpansion = (id: number) => {
    setExpandedFreight(expandedFreight === id ? null : id);
  };

  // Função para resetar os filtros
  const resetFilters = () => {
    setFilters({
      origin: "",
      destination: "",
      vehicleType: "todos",
      bodyType: "todos",
      cargoType: "todos",
      paymentMethod: "todos",
      minWeight: "",
      maxWeight: ""
    });
    setShowFilters(false);
  };

  // Filtrar os fretes
  const filteredFreights = useMemo(() => {
    if (!freights || !Array.isArray(freights)) {
      return [];
    }
    
    let filtered = filterFreights(freights);
    
    // Se for admin, mostrar todos
    if (user?.profileType === 'admin') {
      return filtered;
    }
    
    // Se for motorista, mostrar todos os fretes (apenas visualização)
    if (user?.profileType === 'driver') {
      console.log("Usuário é motorista, mostrando todos os fretes disponíveis");
      return filtered;
    }
    
    // Para motoristas não filtramos por cliente (não tem cliente associado)
    // Removemos esta seção para evitar erros de tipagem
    // Outros perfis usariam o useClientAuth normalmente
    
    return filtered;
  }, [freights, searchQuery, filterStatus, filters, user?.profileType]);

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Truck className="h-5 w-5" /> Fretes
              </CardTitle>
              <CardDescription>
                Gerenciamento de fretes disponíveis no sistema
              </CardDescription>
            </div>
            {user?.profileType !== 'driver' && (
              <Button onClick={() => navigate("/freights/new")}>
                <Plus className="h-4 w-4 mr-2" /> Novo Frete
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : freights && freights.length > 0 ? (
            <>
              <div className="mb-4 mt-4 space-y-4">
                {/* Barra de pesquisa e filtros */}
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input 
                      placeholder="Buscar fretes..." 
                      className="pl-8 w-full" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativo">Ativos</SelectItem>
                        <SelectItem value="expirado">Expirados</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setShowFilters(!showFilters)}
                      title="Filtros avançados"
                    >
                      <Filter className="h-4 w-4 mr-2" /> 
                      <span className="hidden sm:inline">Filtros</span>
                    </Button>
                  </div>
                </div>
                
                {/* Filtros avançados */}
                {showFilters && (
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md border border-slate-200 dark:border-slate-700 space-y-4">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Filtros avançados</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Origem</label>
                        <Input 
                          placeholder="Origem" 
                          value={filters.origin} 
                          onChange={(e) => setFilters({...filters, origin: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Destino</label>
                        <Input 
                          placeholder="Destino" 
                          value={filters.destination} 
                          onChange={(e) => setFilters({...filters, destination: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo de Veículo</label>
                        <Select value={filters.vehicleType} onValueChange={(value) => setFilters({...filters, vehicleType: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de Veículo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            {Object.entries(VEHICLE_TYPES).map(([key, value]) => (
                              <SelectItem key={key} value={key}>{value}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo de Carroceria</label>
                        <Select value={filters.bodyType} onValueChange={(value) => setFilters({...filters, bodyType: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de Carroceria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            {Object.entries(BODY_TYPES).map(([key, value]) => (
                              <SelectItem key={key} value={key}>{value}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo de Carga</label>
                        <Select value={filters.cargoType} onValueChange={(value) => setFilters({...filters, cargoType: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo de Carga" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            {Object.entries(CARGO_TYPES).map(([key, value]) => (
                              <SelectItem key={key} value={key}>{value}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Forma de Pagamento</label>
                        <Select value={filters.paymentMethod} onValueChange={(value) => setFilters({...filters, paymentMethod: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Forma de Pagamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="a_vista">À vista</SelectItem>
                            <SelectItem value="30_dias">30 dias</SelectItem>
                            <SelectItem value="45_dias">45 dias</SelectItem>
                            <SelectItem value="60_dias">60 dias</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Peso Mínimo (kg)</label>
                        <Input 
                          type="number"
                          placeholder="Peso Mínimo" 
                          value={filters.minWeight} 
                          onChange={(e) => setFilters({...filters, minWeight: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Peso Máximo (kg)</label>
                        <Input 
                          type="number"
                          placeholder="Peso Máximo" 
                          value={filters.maxWeight} 
                          onChange={(e) => setFilters({...filters, maxWeight: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={resetFilters}>Limpar</Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Tabela de fretes para desktop */}
              <div className="responsive-table-container">
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Destino</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Carroceria</TableHead>
                        <TableHead>Carga</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFreights.map((freight) => {
                        const clientFound = clients.find((client: Client) => client.id === freight.clientId);
                        
                        return (
                          <TableRow 
                            key={freight.id} 
                            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            onClick={() => {
                              setSelectedFreight(freight);
                              setDetailsDialogOpen(true);
                            }}
                          >
                            <TableCell>{renderStatusBadge(freight)}</TableCell>
                            <TableCell>{clientFound?.name || "Cliente não encontrado"}</TableCell>
                            <TableCell>{freight.origin}, {freight.originState}</TableCell>
                            <TableCell>{freight.destination}, {freight.destinationState}</TableCell>
                            <TableCell>{getVehicleCategory(freight.vehicleType)}</TableCell>
                            <TableCell>{formatMultipleVehicleTypes(freight)}</TableCell>
                            <TableCell>{formatMultipleBodyTypes(freight)}</TableCell>
                            <TableCell>{freight.cargoType === 'completa' ? 'Completa' : 'Complemento'}</TableCell>
                            <TableCell>{formatCurrency(freight.freightValue)}</TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              {renderActionButtons(freight)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Cards de frete para mobile */}
                <div className="md:hidden space-y-4">
                  {filteredFreights.map((freight) => {
                    const clientFound = clients.find((client: Client) => client.id === freight.clientId);
                    const isExpanded = expandedFreight === freight.id;
                    
                    return (
                      <div 
                        key={freight.id} 
                        className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden"
                        onClick={() => {
                          // Ao clicar e manter aberto, abre e fecha o accordion apenas 
                          toggleFreightExpansion(freight.id);
                        }}
                      >
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-slate-500" />
                            <span className="font-medium text-sm">{clientFound?.name || "Cliente não encontrado"}</span>
                          </div>
                          {renderStatusBadge(freight)}
                        </div>
                        
                        <div className="p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-slate-500">Origem:</p>
                              <p className="text-sm">{freight.origin}, {freight.originState}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-slate-500">Destino:</p>
                              <p className="text-sm">{freight.destination}, {freight.destinationState}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Package className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-slate-500">Carga:</p>
                              <p className="text-sm">{freight.cargoType === 'completa' ? 'Completa' : 'Complemento'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <DollarSign className="h-4 w-4 text-slate-500 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-slate-500">Valor:</p>
                              <p className="text-sm font-medium">{formatCurrency(freight.freightValue)}</p>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                              <div className="flex items-start gap-2">
                                <Truck className="h-4 w-4 text-slate-500 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs text-slate-500">Categoria:</p>
                                  <p className="text-sm">{getVehicleCategory(freight.vehicleType)}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-2 mt-2">
                                <Truck className="h-4 w-4 text-slate-500 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs text-slate-500">Veículo:</p>
                                  <p className="text-sm">{formatMultipleVehicleTypes(freight)}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-2 mt-2">
                                <Truck className="h-4 w-4 text-slate-500 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs text-slate-500">Carroceria:</p>
                                  <p className="text-sm">{formatMultipleBodyTypes(freight)}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-2 mt-2">
                                <Package className="h-4 w-4 text-slate-500 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs text-slate-500">Peso:</p>
                                  <p className="text-sm">{freight.cargoWeight} Kg</p>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-2 mt-2">
                                <MessageSquare className="h-4 w-4 text-slate-500 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs text-slate-500">Contato:</p>
                                  <p className="text-sm">{freight.contactName}</p>
                                  <p className="text-sm">{freight.contactPhone}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-2 border-t border-slate-100 dark:border-slate-700 flex justify-between">
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/freights/${freight.id}`);
                              }}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {isClientAuthorized(freight.clientId) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/freights/${freight.id}/edit`);
                                  }}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFreight(freight);
                                    setDeleteDialogOpen(true);
                                  }}
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                          
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFreight(freight);
                                setDetailsDialogOpen(true);
                              }}
                              title="Ver detalhes completos"
                            >
                              <ExternalLink className="h-4 w-4 text-blue-500" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => shareViaWhatsApp(e, freight)}
                              title="Compartilhar via WhatsApp"
                            >
                              <FaWhatsapp className="h-4 w-4 text-green-500" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (freight.contactPhone) {
                                  window.open(`https://wa.me/55${freight.contactPhone.replace(/\D/g, '')}`, '_blank');
                                }
                              }}
                              title="Contatar via WhatsApp"
                              disabled={!freight.contactPhone}
                            >
                              <PhoneCall className="h-4 w-4 text-green-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-500 mb-4">Nenhum frete encontrado.</p>
              {user?.profileType !== 'driver' && (
                <Button onClick={() => navigate("/freights/new")}>
                  <Plus className="h-4 w-4 mr-2" /> Novo Frete
                </Button>
              )}
              {user?.profileType === 'driver' && (
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Como motorista, você pode visualizar todos os fretes disponíveis no sistema. 
                  Aguarde o cadastro de novos fretes pelos embarcadores e transportadoras.
                </p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-slate-100 dark:border-slate-700">
          <div className="text-xs text-slate-500">
            Total de registros: {filteredFreights.length}
          </div>
        </CardFooter>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este frete? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteFreight}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" /> Detalhes do Frete
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre o frete selecionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedFreight && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {clients.find((client: Client) => client.id === selectedFreight.clientId)?.name || "Cliente não encontrado"}
                  </h3>
                  {renderStatusBadge(selectedFreight)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-500">Origem</h4>
                    <p>{selectedFreight.origin}, {selectedFreight.originState}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-500">Destino</h4>
                    <p>{selectedFreight.destination}, {selectedFreight.destinationState}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-500">Categoria</h4>
                    <p>{getVehicleCategory(selectedFreight.vehicleType)}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-500">Tipo de Veículo</h4>
                    <p>{formatMultipleVehicleTypes(selectedFreight)}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-500">Tipo de Carroceria</h4>
                    <p>{formatMultipleBodyTypes(selectedFreight)}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-500">Tipo de Carga</h4>
                    <p>{selectedFreight.cargoType === 'completa' ? 'Completa' : 'Complemento'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-500">Peso da Carga</h4>
                    <p>{selectedFreight.cargoWeight} Kg</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-500">Forma de Pagamento</h4>
                    <p>
                      {(() => {
                        switch (selectedFreight.paymentMethod) {
                          case 'a_vista': return 'À vista';
                          case '30_dias': return '30 dias';
                          case '45_dias': return '45 dias';
                          case '60_dias': return '60 dias';
                          default: return selectedFreight.paymentMethod;
                        }
                      })()}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-500">Valor</h4>
                    <p className="text-lg font-semibold">{formatCurrency(selectedFreight.freightValue)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-2">Informações do Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-500">Nome do Contato</h4>
                    <p>{selectedFreight.contactName}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-500">Telefone</h4>
                    <p className="flex items-center gap-2">
                      {selectedFreight.contactPhone}
                      {selectedFreight.contactPhone && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => window.open(`https://wa.me/55${selectedFreight.contactPhone?.replace(/\D/g, '')}`, '_blank')}
                        >
                          <FaWhatsapp className="h-3 w-3 text-green-500 mr-1" /> Contatar
                        </Button>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              {selectedFreight.observations && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h3 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-2">Observações</h3>
                  <p className="text-sm">{selectedFreight.observations}</p>
                </div>
              )}
              
              {selectedFreight.destinations && selectedFreight.destinations.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h3 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-2">Destinos Intermediários</h3>
                  <div className="space-y-3">
                    {selectedFreight.destinations.map((destination) => (
                      <div key={destination.id} className="border-b border-slate-200 dark:border-slate-700 pb-2 last:border-0">
                        <p className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                          <span>{destination.destination}, {destination.destinationState}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setDetailsDialogOpen(false)}
            >
              Fechar
            </Button>
            
            {selectedFreight && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/freights/${selectedFreight.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" /> Ver Página
                </Button>
                
                {isClientAuthorized(selectedFreight.clientId) && (
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/freights/${selectedFreight.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" /> Editar
                  </Button>
                )}
                
                <Button
                  variant="default"
                  onClick={(e) => {
                    if (selectedFreight) {
                      shareViaWhatsApp(e, selectedFreight);
                    }
                  }}
                >
                  <FaWhatsapp className="h-4 w-4 mr-2 text-white" /> Compartilhar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}