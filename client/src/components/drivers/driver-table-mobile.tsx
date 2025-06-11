import { DriverWithVehicles, Vehicle, VEHICLE_TYPES, BODY_TYPES } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash, Users, ChevronDown, ChevronRight, Phone, Car, Plus } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Link } from "wouter";
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
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  // Verificar se o usuário pode editar/excluir um motorista específico
  const canEditDriver = (driver: DriverWithVehicles) => {
    if (user?.profileType?.toLowerCase() === "admin" || user?.profileType?.toLowerCase() === "administrador") {
      return true;
    }
    if (user?.profileType?.toLowerCase() === "motorista" && user?.driverId === driver.id) {
      return true;
    }
    if (driver.userId === user?.id) {
      return true;
    }
    return false;
  };

  // Pagination logic
  const totalPages = Math.ceil(drivers.length / itemsPerPage);
  const paginatedDrivers = drivers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Avatar color generator
  const getAvatarColor = (name: string) => {
    const colors = ['blue', 'green', 'yellow', 'red', 'purple', 'pink', 'indigo'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Vehicle info formatter
  const formatVehicleInfo = (driver: DriverWithVehicles) => {
    if (driver.vehicles.length === 0) {
      return { count: 0, primaryVehicle: null, vehicleTypes: [] };
    }

    const primaryVehicle = driver.vehicles[0];
    const vehicleTypes = Array.from(new Set(driver.vehicles.map((v: any) => v.vehicleType)));

    return {
      count: driver.vehicles.length,
      primaryVehicle,
      vehicleTypes
    };
  };

  // WhatsApp link formatter
  const formatWhatsAppLink = (whatsapp: string) => {
    if (!whatsapp) return null;
    const phone = whatsapp.replace(/\D/g, '');
    const numericPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${numericPhone}`;
  };

  // Toggle expanded row
  const toggleExpandRow = (driverId: number) => {
    setExpandedRows(prev => {
      if (prev.includes(driverId)) {
        return prev.filter(id => id !== driverId);
      } else {
        return [...prev, driverId];
      }
    });
  };

  const getVehicleTypeDisplay = (vehicleType: string) => {
    const typeMap: { [key: string]: string } = {
      [VEHICLE_TYPES.LEVE_TODOS]: "Leve",
      [VEHICLE_TYPES.LEVE_FIORINO]: "Fiorino",
      [VEHICLE_TYPES.LEVE_TOCO]: "Toco",
      [VEHICLE_TYPES.LEVE_VLC]: "VLC",
      [VEHICLE_TYPES.MEDIO_TODOS]: "Médio",
      [VEHICLE_TYPES.MEDIO_BITRUCK]: "Bitruck",
      [VEHICLE_TYPES.MEDIO_TRUCK]: "Truck",
      [VEHICLE_TYPES.PESADO_TODOS]: "Pesado",
      [VEHICLE_TYPES.PESADO_BITREM]: "Bitrem",
      [VEHICLE_TYPES.PESADO_CARRETA]: "Carreta",
      [VEHICLE_TYPES.PESADO_CARRETA_LS]: "Carreta LS",
      [VEHICLE_TYPES.PESADO_RODOTREM]: "Rodotrem",
      [VEHICLE_TYPES.PESADO_VANDERLEIA]: "Vanderléia"
    };
    return typeMap[vehicleType] || vehicleType;
  };

  const getBodyTypeDisplay = (bodyType: string) => {
    const typeMap: { [key: string]: string } = {
      [BODY_TYPES.BAU]: "Baú",
      [BODY_TYPES.GRANELEIRA]: "Graneleira",
      [BODY_TYPES.BASCULANTE]: "Basculante",
      [BODY_TYPES.PLATAFORMA]: "Plataforma",
      [BODY_TYPES.TANQUE]: "Tanque",
      [BODY_TYPES.FRIGORIFICA]: "Frigorífica",
      [BODY_TYPES.PORTA_CONTEINER]: "Porta Contêiner",
      [BODY_TYPES.SIDER]: "Sider",
      [BODY_TYPES.CACAMBA]: "Caçamba",
      [BODY_TYPES.ABERTA]: "Aberta",
      [BODY_TYPES.FECHADA]: "Fechada"
    };
    return typeMap[bodyType] || bodyType;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-slate-500">Carregando motoristas...</div>
        </CardContent>
      </Card>
    );
  }

  if (drivers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center py-4 text-slate-500">
            <Users className="h-12 w-12 mb-2 text-slate-300" />
            <p className="mb-1">Nenhum motorista encontrado</p>
            <p className="text-sm text-center">
              Cadastre o primeiro motorista clicando em "Novo Motorista"
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Layout Desktop - Tabela */}
      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNH</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Veículos</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDrivers.map((driver) => {
                    const initials = getInitials(driver.name);
                    const color = getAvatarColor(driver.name);
                    const vehicleInfo = formatVehicleInfo(driver);
                    const createdDate = driver.createdAt ? new Date(driver.createdAt) : new Date();
                    const isExpanded = expandedRows.includes(driver.id);
                    const whatsappLink = formatWhatsAppLink(driver.whatsapp);
                    
                    return (
                      <>
                        <TableRow key={driver.id} className="hover:bg-slate-50">
                          <TableCell className="p-2 align-middle text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => toggleExpandRow(driver.id)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className={`bg-${color}-100 text-${color}-700`}>
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-slate-900">{driver.name}</div>
                                <div className="text-xs text-slate-500">{driver.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-slate-900">{driver.cnh}</div>
                            <div className="text-xs text-slate-500">Categoria {driver.cnhCategory}</div>
                          </TableCell>
                          <TableCell>
                            {whatsappLink ? (
                              <a 
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-green-600 hover:text-green-700"
                              >
                                {driver.whatsapp || driver.phone}
                              </a>
                            ) : (
                              <div className="text-sm text-slate-400">Não informado</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Car className="h-4 w-4 text-slate-400" />
                              <Badge variant="secondary">
                                {driver.vehicles.length} veículo{driver.vehicles.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-slate-900">
                              {format(createdDate, "dd/MM/yyyy")}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onView(driver)}
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canEditDriver(driver) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEdit(driver)}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canEditDriver(driver) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDelete(driver)}
                                  title="Excluir"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {/* Linha expandida com veículos */}
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-slate-50">
                              <div className="p-4">
                                <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                                  <Car className="h-4 w-4" />
                                  Veículos ({driver.vehicles.length})
                                </h4>
                                {driver.vehicles.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {driver.vehicles.map((vehicle) => (
                                      <div
                                        key={vehicle.id}
                                        className="bg-white rounded-lg border border-slate-200 p-3"
                                      >
                                        <div className="flex justify-between items-start mb-2">
                                          <div className="font-medium text-slate-800">
                                            {vehicle.plate}
                                          </div>
                                          <Badge variant="outline" className="text-xs">
                                            {getVehicleTypeDisplay(vehicle.vehicleType)}
                                          </Badge>
                                        </div>
                                        <div className="space-y-1 text-sm text-slate-600">
                                          <div>{vehicle.brand} {vehicle.model}</div>
                                          <div>Ano: {vehicle.year}</div>
                                          <div>Cor: {vehicle.color}</div>
                                          <div>Carroceria: {getBodyTypeDisplay(vehicle.bodyType)}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-slate-500">
                                    <p className="mb-2">Nenhum veículo cadastrado</p>
                                    {canEditDriver(driver) && (
                                      <Link href={`/vehicles/new?driverId=${driver.id}`}>
                                        <Button variant="outline" size="sm">
                                          <Plus className="h-4 w-4 mr-1" />
                                          Cadastrar Primeiro Veículo
                                        </Button>
                                      </Link>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="p-4">
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={drivers.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Layout Mobile - Cards */}
      <div className="lg:hidden space-y-4">
        {paginatedDrivers.map((driver) => {
          const initials = getInitials(driver.name);
          const color = getAvatarColor(driver.name);
          const vehicleInfo = formatVehicleInfo(driver);
          const createdDate = driver.createdAt ? new Date(driver.createdAt) : new Date();
          const isExpanded = expandedRows.includes(driver.id);
          const whatsappLink = formatWhatsAppLink(driver.whatsapp);
          
          return (
            <Card key={driver.id} className="overflow-hidden">
              <CardContent className="p-4">
                {/* Header do Card */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className={`bg-${color}-100 text-${color}-700`}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-900 truncate">{driver.name}</div>
                      <div className="text-xs text-slate-500 truncate">{driver.email}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpandRow(driver.id)}
                    className="flex-shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Informações principais */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">CNH</div>
                    <div className="text-sm font-medium">{driver.cnh}</div>
                    <div className="text-xs text-slate-500">Cat. {driver.cnhCategory}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">WhatsApp</div>
                    {whatsappLink ? (
                      <a 
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-green-600 hover:text-green-700"
                      >
                        {driver.whatsapp || driver.phone}
                      </a>
                    ) : (
                      <div className="text-sm text-slate-400">Não informado</div>
                    )}
                  </div>
                </div>

                {/* Veículos resumo */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Car className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {driver.vehicles.length} veículo{driver.vehicles.length !== 1 ? 's' : ''}
                    </span>
                    {vehicleInfo.primaryVehicle && (
                      <Badge variant="outline" className="text-xs">
                        {vehicleInfo.primaryVehicle.plate}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {format(createdDate, "dd/MM/yyyy")}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(driver)}
                    title="Visualizar"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canEditDriver(driver) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(driver)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {canEditDriver(driver) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(driver)}
                      title="Excluir"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Seção expandida */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="space-y-4">
                      {/* Informações detalhadas */}
                      <div>
                        <h4 className="font-medium text-slate-800 mb-2">Informações do Motorista</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-slate-500">CPF:</span>
                            <div className="font-medium">{driver.cpf}</div>
                          </div>
                          <div>
                            <span className="text-slate-500">Telefone:</span>
                            <div className="font-medium">{driver.phone}</div>
                          </div>
                          <div>
                            <span className="text-slate-500">Nascimento:</span>
                            <div className="font-medium">
                              {driver.birthdate ? format(new Date(driver.birthdate), "dd/MM/yyyy") : "Não informado"}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-500">Vencimento CNH:</span>
                            <div className="font-medium">
                              {driver.cnhExpiration ? format(new Date(driver.cnhExpiration), "dd/MM/yyyy") : "Não informado"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Veículos detalhados */}
                      <div>
                        <h4 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          Veículos ({driver.vehicles.length})
                        </h4>
                        {driver.vehicles.length > 0 ? (
                          <div className="space-y-3">
                            {driver.vehicles.map((vehicle) => (
                              <div key={vehicle.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="font-medium text-slate-800">{vehicle.plate}</div>
                                  <Badge variant="outline" className="text-xs">
                                    {getVehicleTypeDisplay(vehicle.vehicleType)}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                                  <div>
                                    <span className="text-slate-500">Marca/Modelo:</span>
                                    <div className="font-medium">{vehicle.brand} {vehicle.model}</div>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Ano:</span>
                                    <div className="font-medium">{vehicle.year}</div>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Cor:</span>
                                    <div className="font-medium">{vehicle.color}</div>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Carroceria:</span>
                                    <div className="font-medium">{getBodyTypeDisplay(vehicle.bodyType)}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-sm mb-2">Nenhum veículo cadastrado</p>
                            {canEditDriver(driver) && (
                              <Link href={`/vehicles/new?driverId=${driver.id}`}>
                                <Button variant="outline" size="sm" className="text-xs">
                                  <Plus className="h-3 w-3 mr-1" />
                                  Cadastrar Primeiro Veículo
                                </Button>
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {totalPages > 1 && (
          <div className="flex justify-center pt-4">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={drivers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </>
  );
}