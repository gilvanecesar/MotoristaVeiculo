import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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

  // Fetch data
  const { data: freights, isLoading } = useQuery({
    queryKey: ['/api/freights'],
    select: (data: FreightWithDestinations[]) => {
      if (filterStatus === "todos") return data;
      return data.filter(freight => freight.status === filterStatus);
    }
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
      await fetch(`/api/freights/${selectedFreight.id}`, {
        method: 'DELETE',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/freights'] });
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting freight:", error);
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

            <Button onClick={() => navigate("/freights/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Frete
            </Button>
          </div>
        </div>
      </div>

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
                  <TableHead>Origem / Destino</TableHead>
                  <TableHead>Tipo de Carga</TableHead>
                  <TableHead>Produto</TableHead>
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
                        <div className="text-sm text-slate-500">
                          {freight.destination}, {freight.destinationState}
                        </div>
                        {freight.hasMultipleDestinations && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Múltiplos destinos
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{getCargoTypeDisplay(freight.cargoType)}</TableCell>
                      <TableCell>{freight.productType}</TableCell>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/freights/${freight.id}`);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDeleteDialog(freight);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {expandedFreight === freight.id && (
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableCell colSpan={6}>
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
                                    <span className="font-medium">Pedágio:</span> {getTollDisplay(freight.toll)}
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
                                    <span className="font-medium">Data de Criação:</span> {new Date(freight.createdAt).toLocaleDateString('pt-BR')}
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
                                          {index + 1}. {dest.city}, {dest.state}
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