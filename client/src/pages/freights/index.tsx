import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFreight, setSelectedFreight] = useState<FreightWithDestinations | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ativo");
  const [expandedFreight, setExpandedFreight] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const { user } = useAuth();
  
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

  // Buscar fretes
  const { data: freights, isLoading: isLoadingFreights } = useQuery<FreightWithDestinations[]>({
    queryKey: ["/api/freights"],
  });

  // Buscar clientes
  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Função para filtrar os fretes de acordo com os critérios
  const filterFreights = (data: FreightWithDestinations[]) => {
    if (!data) return [];
    
    return data.filter(freight => {
      // Filtro por status
      if (filterStatus !== "todos") {
        const today = new Date();
        const expirationDate = freight.expirationDate ? new Date(freight.expirationDate) : null;
        
        if (filterStatus === "ativo" && expirationDate && today > expirationDate) {
          return false;
        }
        if (filterStatus === "expirado" && (!expirationDate || today <= expirationDate)) {
          return false;
        }
      }

      // Filtro por query de busca
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchOrigin = freight.origin?.toLowerCase().includes(searchLower);
        const matchDestination = freight.destinations?.some(dest => 
          dest.destination?.toLowerCase().includes(searchLower)
        );
        const matchClient = clients?.find(c => c.id === freight.clientId)?.name?.toLowerCase().includes(searchLower);
        
        if (!matchOrigin && !matchDestination && !matchClient) {
          return false;
        }
      }

      // Filtros avançados
      if (filters.origin && !freight.origin?.toLowerCase().includes(filters.origin.toLowerCase())) {
        return false;
      }

      if (filters.destination && !freight.destinations?.some(dest => 
        dest.destination?.toLowerCase().includes(filters.destination.toLowerCase())
      )) {
        return false;
      }

      if (filters.vehicleType !== "todos" && !freight.vehicleTypes?.includes(filters.vehicleType)) {
        return false;
      }

      if (filters.bodyType !== "todos" && !freight.bodyTypes?.includes(filters.bodyType)) {
        return false;
      }

      if (filters.cargoType !== "todos" && freight.cargoType !== filters.cargoType) {
        return false;
      }

      if (filters.paymentMethod !== "todos" && freight.paymentMethod !== filters.paymentMethod) {
        return false;
      }

      if (filters.minWeight) {
        const minWeight = parseFloat(filters.minWeight);
        if (freight.weight && freight.weight < minWeight) {
          return false;
        }
      }

      if (filters.maxWeight) {
        const maxWeight = parseFloat(filters.maxWeight);
        if (freight.weight && freight.weight > maxWeight) {
          return false;
        }
      }

      return true;
    });
  };

  const filteredFreights = useMemo(() => filterFreights(freights || []), [freights, searchQuery, filterStatus, filters, clients]);

  // Função para obter o nome do cliente
  const getClientName = (clientId: number | null) => {
    if (!clientId || !clients) return "Cliente não informado";
    const client = clients.find(c => c.id === clientId);
    return client?.name || `Cliente ID: ${clientId}`;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Meus Fretes</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Button
            onClick={() => navigate("/freights/new")}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Frete
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar e Filtrar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <Input
              placeholder="Buscar por origem, destino ou cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-48">
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
              className="w-full lg:w-auto"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros Avançados
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <Input
                placeholder="Origem"
                value={filters.origin}
                onChange={(e) => setFilters(prev => ({ ...prev, origin: e.target.value }))}
              />
              <Input
                placeholder="Destino"
                value={filters.destination}
                onChange={(e) => setFilters(prev => ({ ...prev, destination: e.target.value }))}
              />
              <Select value={filters.vehicleType} onValueChange={(value) => setFilters(prev => ({ ...prev, vehicleType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Veículo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Veículos</SelectItem>
                  {VEHICLE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.bodyType} onValueChange={(value) => setFilters(prev => ({ ...prev, bodyType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Carroceria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Carrocerias</SelectItem>
                  {BODY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Fretes */}
      <Card>
        <CardHeader>
          <CardTitle>Fretes Cadastrados</CardTitle>
          <CardDescription>
            {filteredFreights.length} frete(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingFreights ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredFreights.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                Nenhum frete encontrado
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchQuery || showFilters ? "Tente ajustar os filtros" : "Comece criando seu primeiro frete"}
              </p>
              {!searchQuery && !showFilters && (
                <Button onClick={() => navigate("/freights/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Frete
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFreights.map((freight) => (
                <Card key={freight.id} className="border border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                            {freight.origin || "Origem não informada"}
                          </h3>
                          <span className="text-slate-500">→</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {freight.destinations?.[0]?.destination || "Destino não informado"}
                          </span>
                          {freight.destinations && freight.destinations.length > 1 && (
                            <Badge variant="secondary">
                              +{freight.destinations.length - 1} destino(s)
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {getClientName(freight.clientId)}
                          </div>
                          {freight.weight && (
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              {freight.weight}kg
                            </div>
                          )}
                          {freight.freightValue && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatCurrency(freight.freightValue)}
                            </div>
                          )}
                        </div>

                        {freight.vehicleTypes && freight.vehicleTypes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {formatMultipleVehicleTypes(freight.vehicleTypes).split(', ').map((type, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col lg:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/freights/${freight.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/freights/${freight.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-slate-100 dark:border-slate-700">
          <div className="text-xs text-slate-500">
            Total de registros: {freights?.length || 0}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}