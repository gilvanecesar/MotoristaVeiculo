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
    // Administradores podem editar qualquer motorista
    if (user?.profileType?.toLowerCase() === "admin" || user?.profileType?.toLowerCase() === "administrador") {
      return true;
    }
    
    // Motoristas só podem editar seus próprios dados
    if (user?.profileType?.toLowerCase() === "motorista" && user?.driverId === driver.id) {
      return true;
    }
    
    // Transportadores podem editar/adicionar veículos aos motoristas
    if (user?.profileType?.toLowerCase() === "transportador") {
      return true;
    }
    
    // Usuários que são donos do motorista (através de userId no driver)
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
      .toUpperCase()
      .substring(0, 2);
  };

  // Get avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = ["primary", "blue", "green", "yellow", "red", "purple"];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Format vehicle info
  const formatVehicleInfo = (driver: DriverWithVehicles) => {
    const vehicles = driver.vehicles || [];
    if (vehicles.length === 0) {
      return { count: "0 veículos", plates: "Nenhum veículo cadastrado" };
    }
    
    const count = `${vehicles.length} ${vehicles.length === 1 ? 'veículo' : 'veículos'}`;
    const plates = vehicles.map(v => v.plate).join(', ');
    
    return { count, plates };
  };
  
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
  
  // Function to format WhatsApp number for the wa.me link
  const formatWhatsAppLink = (phone: string | null) => {
    if (!phone) return null;
    // Remove all non-numeric characters
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
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Carroceria</TableHead>
                <TableHead>Cadastrado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4">
                    Carregando motoristas...
                  </TableCell>
                </TableRow>
              ) : paginatedDrivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4">
                    <div className="flex flex-col items-center py-4 text-slate-500">
                      <Users className="h-12 w-12 mb-2 text-slate-300" />
                      <p className="mb-1">Nenhum motorista encontrado</p>
                      <p className="text-sm">
                        Cadastre o primeiro motorista clicando em "Novo Motorista"
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDrivers.map((driver) => {
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
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleExpandRow(driver.id)}
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
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={`bg-${color}/10 text-${color}`}>
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
                              className="flex items-center text-primary hover:underline"
                              title="Contatar via WhatsApp"
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              {driver.phone}
                            </a>
                          ) : (
                            <span className="text-slate-500">{driver.phone || 'Não informado'}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-slate-900">{vehicleInfo.count}</div>
                          <div className="text-xs text-slate-500">{vehicleInfo.plates}</div>
                        </TableCell>
                        <TableCell>
                          {driver.vehicles.length > 0 ? (
                            <Badge 
                              variant="secondary" 
                              className="font-medium text-xs"
                            >
                              {getVehicleCategory(driver.vehicles[0])}
                            </Badge>
                          ) : (
                            <div className="text-xs text-slate-500">Sem veículo</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {driver.vehicles.length > 0 ? (
                            <div className="text-sm text-slate-900">
                              {getSpecificVehicleType(driver.vehicles[0])}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500">Sem veículo</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {driver.vehicles.length > 0 ? (
                            <div>
                              <Badge variant="outline" className="font-normal text-xs h-5 px-1.5">
                                {getBodyTypeDisplay(driver.vehicles[0])}
                              </Badge>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500">Sem veículo</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-slate-500">
                            {format(createdDate, 'dd/MM/yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {canEditDriver(driver) && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-primary"
                                title="Editar"
                                onClick={() => onEdit(driver)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500"
                              title="Ver detalhes"
                              onClick={() => onView(driver)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEditDriver(driver) && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-red-500"
                                title="Excluir"
                                onClick={() => onDelete(driver)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Linha de detalhes expandida */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={10}>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <h3 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-200">Informações do Motorista</h3>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Data de Nascimento</p>
                                      <p className="text-sm">{format(driver.birthdate ? new Date(driver.birthdate) : new Date(), 'dd/MM/yyyy')}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Telefone</p>
                                      <p className="text-sm">{driver.phone}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">CNH Validade</p>
                                      <p className="text-sm">{format(driver.cnhExpiration ? new Date(driver.cnhExpiration) : new Date(), 'dd/MM/yyyy')}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">CNH Emissão</p>
                                      <p className="text-sm">{format(driver.cnhIssueDate ? new Date(driver.cnhIssueDate) : new Date(), 'dd/MM/yyyy')}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h3 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-200">Endereço</h3>
                                  <p className="text-sm mb-1">
                                    {driver.street}, {driver.number}
                                    {driver.complement && ` - ${driver.complement}`}
                                  </p>
                                  <p className="text-sm mb-1">
                                    {driver.neighborhood}, {driver.city} - {driver.state}
                                  </p>
                                  <p className="text-sm">{driver.zipcode}</p>
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="text-md font-semibold text-slate-800 dark:text-slate-200">Veículos</h3>
                                  {canEditDriver(driver) && (
                                    <Link href={`/vehicles/new?driverId=${driver.id}`}>
                                      <Button size="sm" className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white">
                                        <Plus className="h-3 w-3" />
                                        <span className="hidden sm:inline">Adicionar Veículo</span>
                                        <span className="sm:hidden">Veículo</span>
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                                
                                {driver.vehicles.length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {driver.vehicles.map((vehicle) => (
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
                                              {/* Leves */}
                                              {vehicle.vehicleType === VEHICLE_TYPES.LEVE_TODOS && "Leve (Todos)"}
                                              {vehicle.vehicleType === VEHICLE_TYPES.LEVE_FIORINO && "Leve (Fiorino)"}
                                              {vehicle.vehicleType === VEHICLE_TYPES.LEVE_TOCO && "Leve (Toco)"}
                                              {vehicle.vehicleType === VEHICLE_TYPES.LEVE_VLC && "Leve (VLC)"}
                                              
                                              {/* Médios */}
                                              {vehicle.vehicleType === VEHICLE_TYPES.MEDIO_TODOS && "Médio (Todos)"}
                                              {vehicle.vehicleType === VEHICLE_TYPES.MEDIO_BITRUCK && "Médio (Bitruck)"}
                                              {vehicle.vehicleType === VEHICLE_TYPES.MEDIO_TRUCK && "Médio (Truck)"}
                                              
                                              {/* Pesados */}
                                              {vehicle.vehicleType === VEHICLE_TYPES.PESADO_TODOS && "Pesado (Todos)"}
                                              {vehicle.vehicleType === VEHICLE_TYPES.PESADO_BITREM && "Pesado (Bitrem)"}
                                              {vehicle.vehicleType === VEHICLE_TYPES.PESADO_CARRETA && "Pesado (Carreta)"}
                                              {vehicle.vehicleType === VEHICLE_TYPES.PESADO_CARRETA_LS && "Pesado (Carreta LS)"}
                                              {vehicle.vehicleType === VEHICLE_TYPES.PESADO_RODOTREM && "Pesado (Rodotrem)"}
                                              {vehicle.vehicleType === VEHICLE_TYPES.PESADO_VANDERLEIA && "Pesado (Vanderléia)"}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-slate-500 dark:text-slate-400">Carroceria</p>
                                            <Badge variant="outline" className="font-normal text-xs h-5 px-1.5">
                                              {vehicle.bodyType === BODY_TYPES.BAU && "Baú"}
                                              {vehicle.bodyType === BODY_TYPES.GRANELEIRA && "Graneleira"}
                                              {vehicle.bodyType === BODY_TYPES.BASCULANTE && "Basculante"}
                                              {vehicle.bodyType === BODY_TYPES.PLATAFORMA && "Plataforma"}
                                              {vehicle.bodyType === BODY_TYPES.TANQUE && "Tanque"}
                                              {vehicle.bodyType === BODY_TYPES.FRIGORIFICA && "Frigorífica"}
                                              {vehicle.bodyType === BODY_TYPES.PORTA_CONTEINER && "Porta Contêiner"}
                                              {vehicle.bodyType === BODY_TYPES.SIDER && "Sider"}
                                              {vehicle.bodyType === BODY_TYPES.CACAMBA && "Caçamba"}
                                              {vehicle.bodyType === BODY_TYPES.ABERTA && "Aberta"}
                                              {vehicle.bodyType === BODY_TYPES.FECHADA && "Fechada"}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 bg-gray-50 dark:bg-slate-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-slate-600">
                                    <Car className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                      Este motorista ainda não possui veículos cadastrados
                                    </p>
                                    {canEditDriver(driver) && (
                                      <Link href={`/vehicles/new?driverId=${driver.id}`}>
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                          <Plus className="h-3 w-3 mr-1" />
                                          Cadastrar Primeiro Veículo
                                        </Button>
                                      </Link>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
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
            totalItems={drivers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </CardContent>
    </Card>
      </div>

      {/* Layout Mobile - Cards */}
      <div className="lg:hidden space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-slate-500">Carregando motoristas...</div>
            </CardContent>
          </Card>
        ) : paginatedDrivers.length === 0 ? (
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
        ) : (
          paginatedDrivers.map((driver) => {
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
                        <AvatarFallback className={`bg-${color}/10 text-${color}`}>
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
                                      {/* Mostrar tipo do veículo */}
                                      {vehicle.vehicleType === VEHICLE_TYPES.LEVE_TODOS && "Leve"}
                                      {vehicle.vehicleType === VEHICLE_TYPES.LEVE_FIORINO && "Fiorino"}
                                      {vehicle.vehicleType === VEHICLE_TYPES.LEVE_TOCO && "Toco"}
                                      {vehicle.vehicleType === VEHICLE_TYPES.LEVE_VLC && "VLC"}
                                      {vehicle.vehicleType === VEHICLE_TYPES.MEDIO_TODOS && "Médio"}
                                      {vehicle.vehicleType === VEHICLE_TYPES.MEDIO_BITRUCK && "Bitruck"}
                                      {vehicle.vehicleType === VEHICLE_TYPES.MEDIO_TRUCK && "Truck"}
                                      {vehicle.vehicleType === VEHICLE_TYPES.PESADO_TODOS && "Pesado"}
                                      {vehicle.vehicleType === VEHICLE_TYPES.PESADO_BITREM && "Bitrem"}
                                      {vehicle.vehicleType === VEHICLE_TYPES.PESADO_CARRETA && "Carreta"}
                                      {vehicle.vehicleType === VEHICLE_TYPES.PESADO_CARRETA_LS && "Carreta LS"}
                                      {vehicle.vehicleType === VEHICLE_TYPES.PESADO_RODOTREM && "Rodotrem"}
                                      {vehicle.vehicleType === VEHICLE_TYPES.PESADO_VANDERLEIA && "Vanderléia"}
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
                                      <div className="font-medium">
                                        {vehicle.bodyType === BODY_TYPES.BAU && "Baú"}
                                        {vehicle.bodyType === BODY_TYPES.GRANELEIRA && "Graneleira"}
                                        {vehicle.bodyType === BODY_TYPES.BASCULANTE && "Basculante"}
                                        {vehicle.bodyType === BODY_TYPES.PLATAFORMA && "Plataforma"}
                                        {vehicle.bodyType === BODY_TYPES.TANQUE && "Tanque"}
                                        {vehicle.bodyType === BODY_TYPES.FRIGORIFICA && "Frigorífica"}
                                        {vehicle.bodyType === BODY_TYPES.PORTA_CONTEINER && "Porta Contêiner"}
                                        {vehicle.bodyType === BODY_TYPES.SIDER && "Sider"}
                                        {vehicle.bodyType === BODY_TYPES.CACAMBA && "Caçamba"}
                                        {vehicle.bodyType === BODY_TYPES.ABERTA && "Aberta"}
                                        {vehicle.bodyType === BODY_TYPES.FECHADA && "Fechada"}
                                      </div>
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
          })
        )}

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
