import React, { useState, useMemo, useReducer, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  formatMultipleVehicleTypes,
  formatMultipleBodyTypes
} from "@/lib/utils/vehicle-types";
import {
  Plus,
  Search,
  Truck,
  Filter,
  PhoneCall,
  MapPin,
  X,
  DollarSign,
  Package,
  Calendar,
  MessageCircle,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FreightWithDestinations,
  FreightWithUser,
  Client
} from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/format";
import { FaWhatsapp } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { CitySearch } from "@/components/ui/city-search";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const isExpired = (expirationDate: string | Date | null | undefined): boolean => {
  if (!expirationDate) return false;
  const today = new Date();
  const expDate = new Date(expirationDate);
  return today > expDate;
};

const getInitials = (name: string): string => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const getColorFromName = (name: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-cyan-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

const VEHICLE_LABELS: Record<string, string> = {
  'pesado_carreta': 'Carreta',
  'pesado_carreta_ls': 'Carreta LS',
  'pesado_vanderleia': 'Vanderléia',
  'pesado_bitrem': 'Bitrem',
  'pesado_rodotrem': 'Rodotrem',
  'medio_truck': 'Truck',
  'medio_bitruck': 'Bitruck',
  'leve_fiorino': 'Fiorino',
  'leve_vlc': 'VLC',
  'leve_toco': 'Toco'
};

const BODY_LABELS: Record<string, string> = {
  'aberta': 'Aberta',
  'graneleira': 'Graneleiro',
  'basculante': 'Grade Baixa',
  'plataforma': 'Prancha',
  'cacamba': 'Caçamba',
  'fechada': 'Fechada',
  'sider': 'Sider',
  'bau': 'Baú',
  'frigorifica': 'Baú Frigorífico',
  'tanque': 'Tanque',
  'porta_conteiner': 'Porta Container'
};

const VEHICLE_CATEGORIES = {
  'Pesados': ['pesado_carreta', 'pesado_carreta_ls', 'pesado_vanderleia', 'pesado_bitrem', 'pesado_rodotrem'],
  'Médios': ['medio_truck', 'medio_bitruck'],
  'Leves': ['leve_fiorino', 'leve_vlc', 'leve_toco']
};

const BODY_CATEGORIES = {
  'Abertas': ['aberta', 'graneleira', 'basculante', 'plataforma', 'cacamba'],
  'Fechadas': ['fechada', 'sider', 'bau', 'frigorifica'],
  'Especiais': ['tanque', 'porta_conteiner']
};

// Tipos para o reducer de filtros
type FilterState = {
  search: string;
  origin: string;
  destination: string;
  dateFrom: string;
  dateTo: string;
  distanceRange: string;
  vehicleTypes: string[];
  bodyTypes: string[];
  isComplement: string;
  priceSort: string;
  status: string;
};

type FilterAction =
  | { type: 'UPDATE_FIELD'; field: keyof FilterState; value: string }
  | { type: 'UPDATE_ARRAY'; field: 'vehicleTypes' | 'bodyTypes'; value: string[] }
  | { type: 'RESET' };

const initialFilterState: FilterState = {
  search: "",
  origin: "",
  destination: "",
  dateFrom: "",
  dateTo: "",
  distanceRange: "todos",
  vehicleTypes: [],
  bodyTypes: [],
  isComplement: "todos",
  priceSort: "todos",
  status: "ativo"
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    case 'UPDATE_ARRAY':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return initialFilterState;
    default:
      return state;
  }
}

interface FilterSidebarProps {
  filters: FilterState;
  dispatch: React.Dispatch<FilterAction>;
}

const FilterSidebar = React.memo(({ filters, dispatch }: FilterSidebarProps) => (
  <div className="space-y-4">
    {/* Origem e Destino */}
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">Origem e Destino</h3>
      <div className="space-y-1.5">
        <CitySearch
          value={filters.origin}
          onSelect={(city) => dispatch({ type: 'UPDATE_FIELD', field: 'origin', value: city })}
          placeholder="Cidade de origem"
        />
        <CitySearch
          value={filters.destination}
          onSelect={(city) => dispatch({ type: 'UPDATE_FIELD', field: 'destination', value: city })}
          placeholder="Cidade de destino"
        />
      </div>
    </div>

    {/* Status */}
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">Status</h3>
      <RadioGroup value={filters.status} onValueChange={(value) => dispatch({ type: 'UPDATE_FIELD', field: 'status', value })}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="ativo" id="status-ativo" />
          <Label htmlFor="status-ativo" className="text-sm">Ativos</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="expirado" id="status-expirado" />
          <Label htmlFor="status-expirado" className="text-sm">Expirados</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="todos" id="status-todos" />
          <Label htmlFor="status-todos" className="text-sm">Todos</Label>
        </div>
      </RadioGroup>
    </div>

    {/* Tipo de Veículo - Categorizado */}
    <div>
      <h3 className="font-semibold text-sm mb-3">Veículo</h3>
      <div className="space-y-3">
        {Object.entries(VEHICLE_CATEGORIES).map(([category, types]) => (
          <div key={category}>
            <h4 className="text-sm font-medium mb-2">{category}</h4>
            <div className="space-y-2 pl-1">
              {types.map((key) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`vehicle-${key}`}
                    checked={filters.vehicleTypes.includes(key)}
                    onCheckedChange={(checked) => {
                      const newTypes = checked 
                        ? [...filters.vehicleTypes, key]
                        : filters.vehicleTypes.filter(t => t !== key);
                      dispatch({ type: 'UPDATE_ARRAY', field: 'vehicleTypes', value: newTypes });
                    }}
                  />
                  <Label htmlFor={`vehicle-${key}`} className="text-sm font-normal cursor-pointer">
                    {VEHICLE_LABELS[key]}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Tipo de Carroceria - Categorizado */}
    <div>
      <h3 className="font-semibold text-sm mb-3">Carroceria</h3>
      <div className="space-y-3">
        {Object.entries(BODY_CATEGORIES).map(([category, types]) => (
          <div key={category}>
            <h4 className="text-sm font-medium mb-2">{category}</h4>
            <div className="space-y-2 pl-1">
              {types.map((key) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`body-${key}`}
                    checked={filters.bodyTypes.includes(key)}
                    onCheckedChange={(checked) => {
                      const newTypes = checked 
                        ? [...filters.bodyTypes, key]
                        : filters.bodyTypes.filter(t => t !== key);
                      dispatch({ type: 'UPDATE_ARRAY', field: 'bodyTypes', value: newTypes });
                    }}
                  />
                  <Label htmlFor={`body-${key}`} className="text-sm font-normal cursor-pointer">
                    {BODY_LABELS[key]}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Complemento */}
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">Complemento</h3>
      <RadioGroup value={filters.isComplement} onValueChange={(value) => dispatch({ type: 'UPDATE_FIELD', field: 'isComplement', value })}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="sim" id="complement-sim" />
          <Label htmlFor="complement-sim" className="text-sm">Sim</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="nao" id="complement-nao" />
          <Label htmlFor="complement-nao" className="text-sm">Não</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="todos" id="complement-todos" />
          <Label htmlFor="complement-todos" className="text-sm">Ambos</Label>
        </div>
      </RadioGroup>
    </div>

    {/* Ordenação por Preço */}
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">Preço</h3>
      <RadioGroup value={filters.priceSort} onValueChange={(value) => dispatch({ type: 'UPDATE_FIELD', field: 'priceSort', value })}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="menor" id="price-menor" />
          <Label htmlFor="price-menor" className="text-sm">Menor</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="maior" id="price-maior" />
          <Label htmlFor="price-maior" className="text-sm">Maior</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="todos" id="price-todos" />
          <Label htmlFor="price-todos" className="text-sm">Padrão</Label>
        </div>
      </RadioGroup>
    </div>

    {/* Botão Limpar Filtros */}
    <Button variant="outline" className="w-full h-9" onClick={() => dispatch({ type: 'RESET' })} data-testid="button-clear-filters">
      Limpar Filtros
    </Button>
  </div>
));

FilterSidebar.displayName = 'FilterSidebar';

export default function FreightsPageNew() {
  const [, navigate] = useLocation();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [filters, dispatch] = useReducer(filterReducer, initialFilterState);

  const { data: freights = [], isLoading } = useQuery<FreightWithUser[]>({
    queryKey: ["/api/freights"],
    refetchOnWindowFocus: false,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    refetchOnWindowFocus: false,
  });

  const filteredFreights = useMemo(() => {
    if (!freights || !Array.isArray(freights)) {
      return [];
    }

    let filtered = freights.filter(freight => {
      // Filtro de status (ativo/expirado)
      if (filters.status !== "todos") {
        const expired = freight.expirationDate ? isExpired(freight.expirationDate) : false;
        if (filters.status === "ativo" && expired) return false;
        if (filters.status === "expirado" && !expired) return false;
      }

      // Busca geral
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          freight.origin?.toLowerCase().includes(searchLower) ||
          freight.destination?.toLowerCase().includes(searchLower) ||
          freight.cargoType?.toLowerCase().includes(searchLower) ||
          freight.contactName?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtro de origem (extrai apenas a cidade do formato "Cidade - Estado")
      if (filters.origin) {
        const originCity = filters.origin.split(' - ')[0].toLowerCase();
        if (!freight.origin?.toLowerCase().includes(originCity)) {
          return false;
        }
      }

      // Filtro de destino (extrai apenas a cidade do formato "Cidade - Estado")
      if (filters.destination) {
        const destinationCity = filters.destination.split(' - ')[0].toLowerCase();
        if (!freight.destination?.toLowerCase().includes(destinationCity)) {
          return false;
        }
      }

      // Filtro de tipos de veículo
      if (filters.vehicleTypes.length > 0) {
        const freightVehicleTypes = freight.vehicleTypesSelected?.split(',') || [freight.vehicleType];
        const hasMatchingVehicle = filters.vehicleTypes.some(type => 
          freightVehicleTypes.includes(type)
        );
        if (!hasMatchingVehicle) return false;
      }

      // Filtro de tipos de carroceria
      if (filters.bodyTypes.length > 0) {
        const freightBodyTypes = freight.bodyTypesSelected?.split(',') || [freight.bodyType];
        const hasMatchingBody = filters.bodyTypes.some(type => 
          freightBodyTypes.includes(type)
        );
        if (!hasMatchingBody) return false;
      }

      // Filtro de complemento
      if (filters.isComplement !== "todos") {
        const isComplement = freight.cargoType === "complemento";
        if (filters.isComplement === "sim" && !isComplement) return false;
        if (filters.isComplement === "nao" && isComplement) return false;
      }

      return true;
    });

    // Ordenação por preço
    if (filters.priceSort === "menor") {
      filtered.sort((a, b) => parseFloat(a.freightValue) - parseFloat(b.freightValue));
    } else if (filters.priceSort === "maior") {
      filtered.sort((a, b) => parseFloat(b.freightValue) - parseFloat(a.freightValue));
    } else {
      // Ordenação padrão por data (mais novo primeiro)
      filtered.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }

    return filtered;
  }, [freights, filters]);


  const trackInterest = async (freightId: number) => {
    try {
      await fetch(`/api/freights/${freightId}/track-interest`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Erro ao rastrear interesse:', err);
    }
  };

  const shareViaWhatsApp = (freight: FreightWithDestinations) => {
    const clientFound = clients.find((client: Client) => client.id === freight.clientId);
    const clientName = clientFound ? clientFound.name : "Cliente não encontrado";
    const freightUrl = `${window.location.origin}/freights/${freight.id}`;
    
    let destinosText = `🏁 Destino: ${freight.destination}, ${freight.destinationState}`;
    if (freight.destination1) {
      destinosText += `\n🏁 Destino 2: ${freight.destination1}, ${freight.destinationState1}`;
    }
    if (freight.destination2) {
      destinosText += `\n🏁 Destino 3: ${freight.destination2}, ${freight.destinationState2}`;
    }
    
    // Textos promocionais Goodyear/Cooper Tires
    const promoTexts = [
      `Conheça as tecnologias dos pneus Work Series: Smart Traction, com mais tração e menor movimentação dos blocos, no pneu Work Series RHD, e Wear Square, que indica o momento ideal para a troca, no pneu Work Series RHA.
Cooper tires, o pneu de quem faz o Brasil rodar.`,
      `A melhor opção para a sua estrada é o Cooper Work Series! Conheça as tecnologias Smart Traction e Wear Square e veja como podemos ser o parceiro certo para o seu dia a dia.`
    ];
    
    const randomIndex = Math.floor(Math.random() * promoTexts.length);
    const promoText = promoTexts[randomIndex];
    
    const message = encodeURIComponent(`🚛 FRETE DISPONÍVEL 🚛

🔗 Link do frete: ${freightUrl}

🏢 ${clientName}
📍 Origem: ${freight.origin}, ${freight.originState}
${destinosText}

🚚 Veículo: ${formatMultipleVehicleTypes(freight)}
🚐 Carroceria: ${formatMultipleBodyTypes(freight)}

⚖️ Peso: ${freight.cargoWeight} Kg

💵 Valor: ${formatCurrency(freight.freightValue)}

👤 Contato: ${freight.contactName}
📞 Telefone: ${freight.contactPhone}
${freight.observations ? `📝 Observações: ${freight.observations}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━

🛞🛞 PNEUS GOODYEAR

🏁 ${promoText}

━━━━━━━━━━━━━━━━━━━━━━
🌐 Sistema QUERO FRETES: https://querofretes.com.br`);
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // Estatísticas
  const stats = useMemo(() => {
    const total = freights.length;
    const active = freights.filter(f => !isExpired(f.expirationDate)).length;
    const expired = freights.filter(f => isExpired(f.expirationDate)).length;
    const thisMonth = freights.filter(f => {
      if (!f.createdAt) return false;
      const created = new Date(f.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    
    return { total, active, expired, thisMonth };
  }, [freights]);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar Desktop */}
      <div className="hidden lg:block w-80 border-r border-slate-200 dark:border-slate-700 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Filtros</h2>
          <Filter className="w-5 h-5 text-slate-500" />
        </div>
        <FilterSidebar filters={filters} dispatch={dispatch} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Fretes</h1>
              <p className="text-sm md:text-base text-gray-600">Visualize e gerencie todos os fretes disponíveis</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="lg:hidden flex-1 md:flex-initial"
                onClick={() => setShowMobileFilters(true)}
                data-testid="button-show-filters"
              >
                <Filter className="h-4 w-4 mr-2" /> Filtros
              </Button>
              {user?.profileType !== 'driver' && user?.profileType !== 'motorista' && (
                <Button onClick={() => navigate("/freights/new")} className="flex-1 md:flex-initial" data-testid="button-new-freight">
                  <Plus className="h-4 w-4 mr-2" /> Novo Frete
                </Button>
              )}
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Total</CardTitle>
              </CardHeader>
              <CardContent className="pb-3 md:pb-4">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Truck className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                  <span className="text-xl md:text-2xl font-bold">{stats.total}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Ativos</CardTitle>
              </CardHeader>
              <CardContent className="pb-3 md:pb-4">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Package className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                  <span className="text-xl md:text-2xl font-bold">{stats.active}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Expirados</CardTitle>
              </CardHeader>
              <CardContent className="pb-3 md:pb-4">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                  <span className="text-xl md:text-2xl font-bold">{stats.expired}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 md:pb-3">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Este Mês</CardTitle>
              </CardHeader>
              <CardContent className="pb-3 md:pb-4">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                  <span className="text-xl md:text-2xl font-bold">{stats.thisMonth}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Busca */}
          <Card>
            <CardHeader>
              <CardTitle>Buscar Fretes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por origem, destino, tipo de carga..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => dispatch({ type: 'UPDATE_FIELD', field: 'search', value: e.target.value })}
                  data-testid="input-search"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de fretes em tabela */}
          <Card>
            <CardHeader>
              <CardTitle>Fretes ({filteredFreights.length})</CardTitle>
              <CardDescription>
                Todos os fretes disponíveis no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Carregando fretes...</p>
                </div>
              ) : filteredFreights.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum frete encontrado</p>
                  {user?.profileType !== 'driver' && user?.profileType !== 'motorista' && (
                    <Button onClick={() => navigate("/freights/new")} className="mt-4" data-testid="button-new-freight-empty">
                      <Plus className="h-4 w-4 mr-2" /> Novo Frete
                    </Button>
                  )}
                </div>
              ) : isMobile ? (
                <div className="space-y-4">
                  {filteredFreights.map((freight: FreightWithUser) => {
                    const clientFound = clients.find((client: Client) => client.id === freight.clientId);
                    const expired = freight.expirationDate ? isExpired(freight.expirationDate) : false;
                    
                    return (
                      <Card key={freight.id} data-testid={`card-freight-${freight.id}`} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {clientFound?.logoUrl ? (
                                  <img 
                                    src={clientFound.logoUrl} 
                                    alt={clientFound.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : freight.user?.avatarUrl ? (
                                  <img 
                                    src={freight.user.avatarUrl} 
                                    alt={freight.user.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : freight.user?.name ? (
                                  <div className={cn(
                                    "w-full h-full flex items-center justify-center text-white font-semibold",
                                    getColorFromName(freight.user.name)
                                  )}>
                                    {getInitials(freight.user.name)}
                                  </div>
                                ) : (
                                  <Truck className="w-6 h-6 text-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{clientFound?.name || freight.user?.name || "Cliente não encontrado"}</p>
                                {freight.createdAt && (
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(freight.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge variant={expired ? "destructive" : "default"} className="flex-shrink-0">
                              {expired ? "Expirado" : "Ativo"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500">Origem</p>
                                <p className="text-sm font-medium">{freight.origin}, {freight.originState}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500">Destino</p>
                                <p className="text-sm font-medium">{freight.destination}, {freight.destinationState}</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Veículo</p>
                              <p className="text-sm font-medium">{formatMultipleVehicleTypes(freight)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Carroceria</p>
                              <p className="text-sm font-medium">{formatMultipleBodyTypes(freight)}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Tipo de Carga</p>
                              <p className="text-sm font-medium">{freight.cargoType === 'completa' ? 'Carga Completa' : 'Complemento'}</p>
                              <p className="text-xs text-gray-600">{freight.cargoWeight} Kg</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Valor do Frete</p>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="font-semibold text-green-600">{formatCurrency(freight.freightValue)}</span>
                              </div>
                              <p className="text-xs text-gray-600">{freight.paymentMethod}</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t">
                            <p className="text-xs text-gray-500 mb-1">Contato</p>
                            <p className="text-sm font-medium">{freight.contactName}</p>
                            <p className="text-sm text-gray-600">{freight.contactPhone}</p>
                          </div>

                          <div className="flex gap-2 pt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => navigate(`/freights/${freight.id}`)}
                              data-testid={`button-view-${freight.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" /> Ver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => shareViaWhatsApp(freight)}
                              data-testid={`button-share-${freight.id}`}
                            >
                              <FaWhatsapp className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                if (freight.contactPhone) {
                                  trackInterest(freight.id);
                                  window.open(`https://wa.me/55${freight.contactPhone.replace(/\D/g, '')}`, '_blank');
                                }
                              }}
                              disabled={!freight.contactPhone}
                              data-testid={`button-contact-${freight.id}`}
                            >
                              <PhoneCall className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Origem → Destino</TableHead>
                        <TableHead>Veículo / Carroceria</TableHead>
                        <TableHead>Carga</TableHead>
                        <TableHead>Valor do Frete</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFreights.map((freight: FreightWithUser) => {
                        const clientFound = clients.find((client: Client) => client.id === freight.clientId);
                        const expired = freight.expirationDate ? isExpired(freight.expirationDate) : false;
                        
                        return (
                          <TableRow key={freight.id} data-testid={`row-freight-${freight.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {clientFound?.logoUrl ? (
                                    <img 
                                      src={clientFound.logoUrl} 
                                      alt={clientFound.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : freight.user?.avatarUrl ? (
                                    <img 
                                      src={freight.user.avatarUrl} 
                                      alt={freight.user.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : freight.user?.name ? (
                                    <div className={cn(
                                      "w-full h-full flex items-center justify-center text-white font-semibold text-xs",
                                      getColorFromName(freight.user.name)
                                    )}>
                                      {getInitials(freight.user.name)}
                                    </div>
                                  ) : (
                                    <Truck className="w-5 h-5 text-primary" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{clientFound?.name || freight.user?.name || "Cliente não encontrado"}</p>
                                  {freight.createdAt && (
                                    <p className="text-xs text-gray-500">
                                      {format(new Date(freight.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">{freight.origin}, {freight.originState}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">{freight.destination}, {freight.destinationState}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{formatMultipleVehicleTypes(freight)}</p>
                                <p className="text-sm text-gray-600">{formatMultipleBodyTypes(freight)}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{freight.cargoType === 'completa' ? 'Carga Completa' : 'Complemento'}</p>
                                <p className="text-sm text-gray-600">{freight.cargoWeight} Kg</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  <span className="font-medium">{formatCurrency(freight.freightValue)}</span>
                                </div>
                                <p className="text-xs text-gray-600">{freight.paymentMethod}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={expired ? "destructive" : "default"}>
                                {expired ? "Expirado" : "Ativo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{freight.contactName}</p>
                                <p className="text-sm text-gray-600">{freight.contactPhone}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/freights/${freight.id}`)}
                                  data-testid={`button-view-${freight.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => shareViaWhatsApp(freight)}
                                  data-testid={`button-share-${freight.id}`}
                                >
                                  <FaWhatsapp className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (freight.contactPhone) {
                                      trackInterest(freight.id);
                                      window.open(`https://wa.me/55${freight.contactPhone.replace(/\D/g, '')}`, '_blank');
                                    }
                                  }}
                                  disabled={!freight.contactPhone}
                                  data-testid={`button-contact-${freight.id}`}
                                >
                                  <PhoneCall className="h-4 w-4 text-green-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Filters Sheet */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setShowMobileFilters(false)}>
          <div
            className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-slate-900 p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Filtros</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowMobileFilters(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <FilterSidebar filters={filters} dispatch={dispatch} />
          </div>
        </div>
      )}
    </div>
  );
}
