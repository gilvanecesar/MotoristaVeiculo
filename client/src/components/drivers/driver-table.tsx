import { DriverWithVehicles, Vehicle, VEHICLE_TYPES, BODY_TYPES } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash, Users, ChevronDown, ChevronRight, Phone, Car } from "lucide-react";
import { format } from "date-fns";
import React, { useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useAuth } from "@/hooks/use-auth";

interface DriverTableProps {
  drivers: DriverWithVehicles[];
  isLoading: boolean;
  onEdit: (driver: DriverWithVehicles) => void;
  onView: (driver: DriverWithVehicles) => void;
  onDelete: (driver: DriverWithVehicles) => void;
}

export function DriverTable({ drivers, isLoading, onEdit, onView, onDelete }: DriverTableProps) {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { user } = useAuth();

  const toggleRowExpansion = (driverId: number) => {
    setExpandedRows(prev => 
      prev.includes(driverId) 
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  const formatWhatsAppLink = (whatsapp: string) => {
    if (!whatsapp) return "#";
    
    const cleanNumber = whatsapp.replace(/\D/g, '');
    
    if (cleanNumber.length === 11 && cleanNumber.startsWith('55')) {
      return `https://wa.me/${cleanNumber}`;
    }
    
    if (cleanNumber.length === 11) {
      return `https://wa.me/55${cleanNumber}`;
    }
    
    if (cleanNumber.length === 10) {
      return `https://wa.me/55${cleanNumber}`;
    }
    
    return `https://wa.me/${cleanNumber}`;
  };

  const formatVehicleInfo = (driver: DriverWithVehicles) => {
    if (!driver.vehicles || driver.vehicles.length === 0) {
      return "Nenhum veículo";
    }

    if (driver.vehicles.length === 1) {
      const vehicle = driver.vehicles[0];
      return `${vehicle.brand} ${vehicle.model} - ${vehicle.plate}`;
    }

    return `${driver.vehicles.length} veículos`;
  };

  const getVehicleCategory = (vehicle: Vehicle): string => {
    const type = vehicle.vehicleType;
    
    if (type?.startsWith('leve')) return 'Leve';
    if (type?.startsWith('medio')) return 'Médio';
    if (type?.startsWith('pesado')) return 'Pesado';
    if (type === VEHICLE_TYPES.MOTO) return 'Moto';
    if (type === VEHICLE_TYPES.VARIOS) return 'Vários';
    
    return 'Não especificado';
  };

  const getSpecificVehicleType = (vehicle: Vehicle): string => {
    const type = vehicle.vehicleType;
    
    // Leves
    if (type === VEHICLE_TYPES.LEVE_TODOS) return "Todos";
    if (type === VEHICLE_TYPES.LEVE_FIORINO) return "Fiorino";
    if (type === VEHICLE_TYPES.LEVE_TOCO) return "Toco";
    if (type === VEHICLE_TYPES.LEVE_TURBO) return "Turbo";
    if (type === VEHICLE_TYPES.LEVE_CHAPEIRO) return "Chapeiro";
    if (type === VEHICLE_TYPES.LEVE_VAN) return "Van";
    if (type === VEHICLE_TYPES.LEVE_UTILITARIO) return "Utilitário";
    
    // Médios
    if (type === VEHICLE_TYPES.MEDIO_TOCO) return "Toco";
    if (type === VEHICLE_TYPES.MEDIO_CHAPEIRO) return "Chapeiro";
    if (type === VEHICLE_TYPES.MEDIO_TURBO) return "Turbo";
    
    // Pesados
    if (type === VEHICLE_TYPES.PESADO_TOCO) return "Toco";
    if (type === VEHICLE_TYPES.PESADO_TRUCADO) return "Trucado";
    if (type === VEHICLE_TYPES.PESADO_CARRETA_LS) return "Carreta LS";
    if (type === VEHICLE_TYPES.PESADO_CARRETA_2E) return "Carreta 2E";
    if (type === VEHICLE_TYPES.PESADO_CARRETA_3E) return "Carreta 3E";
    if (type === VEHICLE_TYPES.PESADO_BITREM) return "Bitrem";
    if (type === VEHICLE_TYPES.PESADO_RODOTREM) return "Rodotrem";
    
    // Outros
    if (type === VEHICLE_TYPES.MOTO) return "Motocicleta";
    if (type === VEHICLE_TYPES.VARIOS) return "Vários";
    
    return "Não especificado";
  };

  const getBodyTypeDisplay = (vehicle: Vehicle) => {
    const bodyType = vehicle.bodyType;
    
    switch (bodyType) {
      case BODY_TYPES.BAU: return "Baú";
      case BODY_TYPES.GRANELEIRA: return "Graneleira";
      case BODY_TYPES.BASCULANTE: return "Basculante";
      case BODY_TYPES.PLATAFORMA: return "Plataforma";
      case BODY_TYPES.TANQUE: return "Tanque";
      case BODY_TYPES.FRIGORIFICA: return "Frigorífica";
      case BODY_TYPES.CEGONHEIRA: return "Cegonheira";
      case BODY_TYPES.SIDER: return "Sider";
      case BODY_TYPES.CACAMBA: return "Caçamba";
      case BODY_TYPES.FECHADA: return "Fechada";
      default: return "Não especificado";
    }
  };

  const canEditDriver = (driver: DriverWithVehicles) => {
    if (!user) return false;
    return user.id === driver.userId;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-slate-600">Carregando motoristas...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (drivers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum motorista encontrado</h3>
            <p className="text-slate-600">Cadastre seu primeiro motorista para começar.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.ceil(drivers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageDrivers = drivers.slice(startIndex, endIndex);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800">
                <TableHead className="w-12 text-center"></TableHead>
                <TableHead className="font-semibold">Motorista</TableHead>
                <TableHead className="font-semibold">Contato</TableHead>
                <TableHead className="font-semibold">CNH</TableHead>
                <TableHead className="font-semibold">Veículos</TableHead>
                <TableHead className="font-semibold">Cidade</TableHead>
                <TableHead className="font-semibold">Data de Cadastro</TableHead>
                <TableHead className="w-32 text-center font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPageDrivers.map((driver) => {
                const createdDate = driver.createdAt ? new Date(driver.createdAt) : new Date();
                const isExpanded = expandedRows.includes(driver.id);
                const whatsappLink = formatWhatsAppLink(driver.whatsapp);
                
                return (
                  <React.Fragment key={driver.id}>
                    <TableRow className="hover:bg-slate-50">
                      <TableCell className="p-2 align-middle text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleRowExpansion(driver.id)}
                          className="h-8 w-8"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      
                      <TableCell className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {driver.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {driver.name}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {driver.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="p-4 align-middle">
                        <div className="space-y-1">
                          {driver.whatsapp && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-green-600" />
                              <a 
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-green-600 hover:text-green-700 hover:underline"
                              >
                                {driver.whatsapp}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="p-4 align-middle">
                        <div className="space-y-1">
                          {driver.cnhNumber && (
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {driver.cnhCategory || 'N/A'}
                            </div>
                          )}
                          {driver.cnhExpiration && (
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              Exp: {format(new Date(driver.cnhExpiration), "dd/MM/yyyy")}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="p-4 align-middle">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {formatVehicleInfo(driver)}
                          </div>
                          {driver.vehicles && driver.vehicles.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {driver.vehicles.slice(0, 2).map((vehicle) => (
                                <Badge 
                                  key={vehicle.id}
                                  variant="secondary" 
                                  className="text-xs"
                                >
                                  {getVehicleCategory(vehicle)}
                                </Badge>
                              ))}
                              {driver.vehicles.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{driver.vehicles.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="p-4 align-middle">
                        <div className="text-sm text-slate-900 dark:text-slate-100">
                          {driver.city || "Não informado"}
                        </div>
                        {driver.state && (
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {driver.state}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell className="p-4 align-middle">
                        <div className="text-sm text-slate-900 dark:text-slate-100">
                          {format(createdDate, "dd/MM/yyyy")}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {format(createdDate, "HH:mm")}
                        </div>
                      </TableCell>
                      
                      <TableCell className="p-4 align-middle">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onView(driver)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Visualizar motorista"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {canEditDriver(driver) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(driver)}
                              className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                              title="Editar motorista"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {canEditDriver(driver) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(driver)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Excluir motorista"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {isExpanded && (
                      <TableRow className="bg-slate-50/50">
                        <TableCell colSpan={8} className="p-0">
                          <div className="p-6 space-y-4 border-t border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              <div>
                                <h3 className="text-md font-semibold mb-3 text-slate-800 dark:text-slate-200">Informações Pessoais</h3>
                                <div className="space-y-2 text-sm">
                                  <p><span className="font-medium text-slate-600 dark:text-slate-400">Email:</span> {driver.email}</p>
                                  <p><span className="font-medium text-slate-600 dark:text-slate-400">WhatsApp:</span> {driver.whatsapp}</p>
                                  <p><span className="font-medium text-slate-600 dark:text-slate-400">Data de Nascimento:</span> {driver.birthDate ? format(new Date(driver.birthDate), "dd/MM/yyyy") : "Não informado"}</p>
                                  <p><span className="font-medium text-slate-600 dark:text-slate-400">RG:</span> {driver.rg || "Não informado"}</p>
                                  <p><span className="font-medium text-slate-600 dark:text-slate-400">CPF:</span> {driver.cpf || "Não informado"}</p>
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="text-md font-semibold mb-3 text-slate-800 dark:text-slate-200">CNH</h3>
                                <div className="space-y-2 text-sm">
                                  <p><span className="font-medium text-slate-600 dark:text-slate-400">Número:</span> {driver.cnhNumber || "Não informado"}</p>
                                  <p><span className="font-medium text-slate-600 dark:text-slate-400">Categoria:</span> {driver.cnhCategory || "Não informada"}</p>
                                  <p><span className="font-medium text-slate-600 dark:text-slate-400">Validade:</span> {driver.cnhExpiration ? format(new Date(driver.cnhExpiration), "dd/MM/yyyy") : "Não informada"}</p>
                                  <p><span className="font-medium text-slate-600 dark:text-slate-400">Data de Emissão:</span> {driver.cnhIssueDate ? format(new Date(driver.cnhIssueDate), "dd/MM/yyyy") : "Não informada"}</p>
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="text-md font-semibold mb-3 text-slate-800 dark:text-slate-200">Endereço</h3>
                                <div className="space-y-2 text-sm">
                                  <p><span className="font-medium text-slate-600 dark:text-slate-400">Rua:</span> {driver.street || "Não informado"}</p>
                                  <p><span className="font-medium text-slate-600 dark:text-slate-400">Número:</span> {driver.number || "Não informado"}</p>
                                  <p><span className="font-medium text-slate-600 dark:text-slate-400">Complemento:</span> {driver.complement || "Não informado"}</p>
                                  <p><span className="font-medium text-slate-600 dark:text-slate-400">Bairro:</span> {driver.neighborhood || "Não informado"}</p>
                                  <p><span className="font-medium text-slate-600 dark:text-slate-400">Cidade:</span> {driver.city || "Não informado"}</p>
                                  <p><span className="font-medium text-slate-600 dark:text-slate-400">Estado:</span> {driver.state || "Não informado"}</p>
                                  <p><span className="font-medium text-slate-600 dark:text-slate-400">CEP:</span> {driver.zipcode || "Não informado"}</p>
                                </div>
                              </div>
                            </div>
                            
                            {driver.vehicles.length > 0 && (
                              <div>
                                <h3 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-200">Veículos</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {driver.vehicles.map((vehicle: any) => (
                                    <div key={vehicle.id} className="p-3 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Car className="h-4 w-4 text-primary" />
                                        <h4 className="text-sm font-medium">{vehicle.brand} {vehicle.model}</h4>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <p className="text-slate-500 dark:text-slate-400">Placa</p>
                                          <p className="font-medium">{vehicle.plate}</p>
                                        </div>
                                        <div>
                                          <p className="text-slate-500 dark:text-slate-400">Ano</p>
                                          <p className="font-medium">{vehicle.year}</p>
                                        </div>
                                        <div>
                                          <p className="text-slate-500 dark:text-slate-400">Cor</p>
                                          <p className="font-medium">{vehicle.color}</p>
                                        </div>
                                        {vehicle.renavam && (
                                          <div>
                                            <p className="text-slate-500 dark:text-slate-400">Renavam</p>
                                            <p className="font-medium">{vehicle.renavam}</p>
                                          </div>
                                        )}
                                        <div>
                                          <p className="text-slate-500 dark:text-slate-400">Tipo</p>
                                          <p className="font-medium">
                                            {getVehicleCategory(vehicle)} - {getSpecificVehicleType(vehicle)}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-slate-500 dark:text-slate-400">Carroceria</p>
                                          <p className="font-medium">{getBodyTypeDisplay(vehicle)}</p>
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
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={drivers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </CardContent>
    </Card>
  );
}