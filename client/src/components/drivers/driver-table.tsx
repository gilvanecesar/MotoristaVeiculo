import { DriverWithVehicles } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash, Users } from "lucide-react";
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

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>CNH</TableHead>
                <TableHead>Veículos</TableHead>
                <TableHead>Cadastrado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Carregando motoristas...
                  </TableCell>
                </TableRow>
              ) : paginatedDrivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
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
                  const createdDate = new Date(driver.createdAt);
                  
                  return (
                    <TableRow key={driver.id} className="hover:bg-slate-50">
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
