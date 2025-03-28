import { DriverWithVehicles, Vehicle, VEHICLE_TYPES, BODY_TYPES } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash, Users, ChevronDown, ChevronRight, Phone, Car } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Pagination } from "@/components/ui/pagination";

interface DriverTableProps {
  drivers: DriverWithVehicles[];
  isLoading: boolean;
  onEdit: (driver: DriverWithVehicles) => void;
  onView: (driver: DriverWithVehicles) => void;
  onDelete: (driver: DriverWithVehicles) => void;
}

export function DriverTable({ drivers, isLoading, onEdit, onView, onDelete }: DriverTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

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
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>CNH</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Veículos</TableHead>
                <TableHead>Cadastrado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    Carregando motoristas...
                  </TableCell>
                </TableRow>
              ) : paginatedDrivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
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
                          <div className="text-sm text-slate-900">{driver.cpf}</div>
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
                          <div className="text-sm text-slate-500">
                            {format(createdDate, 'dd/MM/yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-primary"
                              title="Editar"
                              onClick={() => onEdit(driver)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-500"
                              title="Ver detalhes"
                              onClick={() => onView(driver)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500"
                              title="Excluir"
                              onClick={() => onDelete(driver)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Linha de detalhes expandida */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={8}>
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
                              
                              {driver.vehicles.length > 0 && (
                                <div>
                                  <h3 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-200">Veículos</h3>
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
                                </div>
                              )}
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
  );
}
