import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  getVehicleCategory,
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
  X,
  ArrowRight,
  Package,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  VEHICLE_TYPES,
  BODY_TYPES
} from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/format";
import { FaWhatsapp } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { CitySearch } from "@/components/ui/city-search";

const isExpired = (expirationDate: string | Date | null | undefined): boolean => {
  if (!expirationDate) return false;
  const today = new Date();
  const expDate = new Date(expirationDate);
  return today > expDate;
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

interface FilterSidebarProps {
  filters: {
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
  setFilters: React.Dispatch<React.SetStateAction<{
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
  }>>;
  resetFilters: () => void;
}

const FilterSidebar = React.memo(({ filters, setFilters, resetFilters }: FilterSidebarProps) => (
  <div className="space-y-4">
    {/* Origem e Destino */}
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">Origem e Destino</h3>
      <div className="space-y-1.5">
        <CitySearch
          value={filters.origin}
          onSelect={(city) => setFilters({...filters, origin: city})}
          placeholder="Cidade de origem"
        />
        <CitySearch
          value={filters.destination}
          onSelect={(city) => setFilters({...filters, destination: city})}
          placeholder="Cidade de destino"
        />
      </div>
    </div>

    {/* Status */}
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">Status</h3>
      <RadioGroup value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
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
                      if (checked) {
                        setFilters({...filters, vehicleTypes: [...filters.vehicleTypes, key]});
                      } else {
                        setFilters({...filters, vehicleTypes: filters.vehicleTypes.filter(t => t !== key)});
                      }
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
                      if (checked) {
                        setFilters({...filters, bodyTypes: [...filters.bodyTypes, key]});
                      } else {
                        setFilters({...filters, bodyTypes: filters.bodyTypes.filter(t => t !== key)});
                      }
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
      <RadioGroup value={filters.isComplement} onValueChange={(value) => setFilters({...filters, isComplement: value})}>
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
      <RadioGroup value={filters.priceSort} onValueChange={(value) => setFilters({...filters, priceSort: value})}>
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
    <Button variant="outline" className="w-full h-9" onClick={resetFilters} data-testid="button-clear-filters">
      Limpar Filtros
    </Button>
  </div>
));

FilterSidebar.displayName = 'FilterSidebar';

export default function FreightsPageNew() {
  const [, navigate] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFreight, setSelectedFreight] = useState<FreightWithDestinations | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    search: "",
    origin: "",
    destination: "",
    dateFrom: "",
    dateTo: "",
    distanceRange: "todos",
    vehicleTypes: [] as string[],
    bodyTypes: [] as string[],
    isComplement: "todos",
    priceSort: "todos",
    status: "ativo"
  });

  const { data: freights = [], isLoading } = useQuery<FreightWithDestinations[]>({
    queryKey: ["/api/freights"],
    refetchOnWindowFocus: false,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    refetchOnWindowFocus: false,
  });

  const isClientAuthorized = (clientId: number | null, freightUserId?: number | null) => {
    if (user?.profileType === 'motorista' || user?.profileType === 'driver') {
      return false;
    }
    if (user?.profileType === 'admin' || user?.profileType === 'administrador') {
      return true;
    }
    if (freightUserId && user?.id === freightUserId) {
      return true;
    }
    if (!freightUserId && user?.clientId === clientId) {
      return true;
    }
    return false;
  };

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

  const resetFilters = () => {
    setFilters({
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
    });
  };

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

  const shareViaWhatsApp = (freight: FreightWithDestinations) => {
    const clientFound = clients.find((client: Client) => client.id === freight.clientId);
    const clientName = clientFound ? clientFound.name : "Cliente não encontrado";
    const freightUrl = `${window.location.origin}/freights/${freight.id}`;
    
    let destinosText = `🏁 *Destino:* ${freight.destination}, ${freight.destinationState}`;
    if (freight.destination1) {
      destinosText += `\n🏁 *Destino 2:* ${freight.destination1}, ${freight.destinationState1}`;
    }
    if (freight.destination2) {
      destinosText += `\n🏁 *Destino 3:* ${freight.destination2}, ${freight.destinationState2}`;
    }
    
    const message = encodeURIComponent(`
🚛 *FRETE DISPONÍVEL* 🚛

🏢 *${clientName}*
📍 *Origem:* ${freight.origin}, ${freight.originState}
${destinosText}
🚚 *Categoria:* ${getVehicleCategory(freight.vehicleType)}
🚚 *Veículo:* ${formatMultipleVehicleTypes(freight)}
🚐 *Carroceria:* ${formatMultipleBodyTypes(freight)}
📦 *Tipo de Carga:* ${freight.cargoType === 'completa' ? 'Completa' : 'Complemento'}
⚖️ *Peso:* ${freight.cargoWeight} Kg
💰 *Pagamento:* ${freight.paymentMethod}
💵 *Valor:* ${formatCurrency(freight.freightValue)}

👤 *Contato:* ${freight.contactName}
📞 *Telefone:* ${freight.contactPhone}
${freight.observations ? `\n📝 *Observações:* ${freight.observations}\n` : ''}
🌐 *Sistema QUERO FRETES:* https://querofretes.com.br
🔗 *Link do frete:* ${freightUrl}
`);
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const FreightCard = ({ freight }: { freight: FreightWithDestinations }) => {
    const clientFound = clients.find((client: Client) => client.id === freight.clientId);
    const expired = freight.expirationDate ? isExpired(freight.expirationDate) : false;
    const canEdit = isClientAuthorized(freight.clientId, freight.userId);

    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-slate-900 overflow-hidden">
        {/* Desktop Layout - Horizontal */}
        <div className="hidden md:flex items-center gap-3 p-3">
          {/* Logo/Icon */}
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center flex-shrink-0">
            <Truck className="w-6 h-6 text-primary" />
          </div>

          {/* Route Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <span className="truncate">{freight.origin}, {freight.originState}</span>
              <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="truncate">{freight.destination}, {freight.destinationState}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="truncate">{freight.cargoType === 'completa' ? 'Carga' : 'Compl.'}</span>
              <span>•</span>
              <span className="truncate">{freight.distance ? `${freight.distance}km` : 'N/I'}</span>
              <span>•</span>
              <span className="truncate">{formatMultipleVehicleTypes(freight)}</span>
              <span>•</span>
              <span className="truncate">{formatMultipleBodyTypes(freight)}</span>
            </div>
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0 mr-2">
            <p className="text-lg font-bold text-primary whitespace-nowrap">{formatCurrency(freight.freightValue)}</p>
            <p className="text-xs text-slate-500">Por {freight.paymentMethod}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-0.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate(`/freights/${freight.id}`)}
              title="Visualizar"
              data-testid={`button-view-${freight.id}`}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            
            {canEdit && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => navigate(`/freights/${freight.id}/edit`)}
                  title="Editar"
                  data-testid={`button-edit-${freight.id}`}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setSelectedFreight(freight);
                    setDeleteDialogOpen(true);
                  }}
                  title="Excluir"
                  data-testid={`button-delete-${freight.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => shareViaWhatsApp(freight)}
              title="Compartilhar via WhatsApp"
              data-testid={`button-share-${freight.id}`}
            >
              <FaWhatsapp className="h-3.5 w-3.5 text-green-500" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (freight.contactPhone) {
                  window.open(`https://wa.me/55${freight.contactPhone.replace(/\D/g, '')}`, '_blank');
                }
              }}
              title="Contatar via WhatsApp"
              disabled={!freight.contactPhone}
              data-testid={`button-contact-${freight.id}`}
            >
              <PhoneCall className="h-3.5 w-3.5 text-green-500" />
            </Button>
          </div>
        </div>

        {/* Mobile Layout - Vertical (mantém o design original) */}
        <div className="block md:hidden p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{clientFound?.name || "Cliente não encontrado"}</h3>
                <Badge variant={expired ? "destructive" : "default"} className="mt-1">
                  {expired ? "Expirado" : "Ativo"}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary">{formatCurrency(freight.freightValue)}</p>
              <p className="text-xs text-slate-500">Pagamento: {freight.paymentMethod}</p>
            </div>
          </div>

          {/* Rota */}
          <div className="flex items-center gap-2 mb-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
            <div className="flex-1">
              <p className="text-xs text-slate-500">Origem</p>
              <p className="font-medium text-sm">{freight.origin}, {freight.originState}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <div className="flex-1 text-right">
              <p className="text-xs text-slate-500">Destino</p>
              <p className="font-medium text-sm">{freight.destination}, {freight.destinationState}</p>
            </div>
          </div>

          {/* Detalhes */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Veículo</p>
              <p className="font-medium">{formatMultipleVehicleTypes(freight)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Carroceria</p>
              <p className="font-medium">{formatMultipleBodyTypes(freight)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500">Peso</p>
              <p className="font-medium">{freight.cargoWeight} Kg</p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/freights/${freight.id}`)}
                title="Visualizar"
                data-testid={`button-view-${freight.id}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
              
              {canEdit && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/freights/${freight.id}/edit`)}
                    title="Editar"
                    data-testid={`button-edit-${freight.id}`}
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
                    data-testid={`button-delete-${freight.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => shareViaWhatsApp(freight)}
                title="Compartilhar via WhatsApp"
                data-testid={`button-share-${freight.id}`}
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
                data-testid={`button-contact-${freight.id}`}
              >
                <PhoneCall className="h-4 w-4 text-green-500" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar Desktop */}
      <div className="hidden lg:block w-80 border-r border-slate-200 dark:border-slate-700 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Filtros</h2>
          <Filter className="w-5 h-5 text-slate-500" />
        </div>
        <FilterSidebar filters={filters} setFilters={setFilters} resetFilters={resetFilters} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Truck className="h-6 w-6" /> Fretes
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {filteredFreights.length} {filteredFreights.length === 1 ? 'frete encontrado' : 'fretes encontrados'}
              </p>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="lg:hidden"
                onClick={() => setShowMobileFilters(true)}
                data-testid="button-show-filters"
              >
                <Filter className="h-4 w-4 mr-2" /> Filtros
              </Button>
              {user?.profileType !== 'driver' && user?.profileType !== 'motorista' && (
                <Button onClick={() => navigate("/freights/new")} className="flex-1 sm:flex-none" data-testid="button-new-freight">
                  <Plus className="h-4 w-4 mr-2" /> Novo Frete
                </Button>
              )}
            </div>
          </div>

          {/* Busca */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Buscar por origem, destino, tipo de carga..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                data-testid="input-search"
              />
            </div>
          </div>

          {/* Freights Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : filteredFreights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredFreights.map((freight) => (
                <FreightCard key={freight.id} freight={freight} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">Nenhum frete encontrado.</p>
              {user?.profileType !== 'driver' && user?.profileType !== 'motorista' && (
                <Button onClick={() => navigate("/freights/new")} data-testid="button-new-freight-empty">
                  <Plus className="h-4 w-4 mr-2" /> Novo Frete
                </Button>
              )}
            </div>
          )}
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
            <FilterSidebar filters={filters} setFilters={setFilters} resetFilters={resetFilters} />
          </div>
        </div>
      )}

      {/* Delete Dialog */}
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
    </div>
  );
}
