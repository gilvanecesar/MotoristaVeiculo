import { DriverWithVehicles } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash, Phone, Car, MapPin, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

interface DriverMobileViewProps {
  drivers: DriverWithVehicles[];
  isLoading: boolean;
  onEdit: (driver: DriverWithVehicles) => void;
  onView: (driver: DriverWithVehicles) => void;
  onDelete: (driver: DriverWithVehicles) => void;
}

export function DriverMobileView({ drivers, isLoading, onEdit, onView, onDelete }: DriverMobileViewProps) {
  const { user } = useAuth();
  const [expandedCards, setExpandedCards] = useState<number[]>([]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-purple-500", "bg-indigo-500"];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const formatWhatsAppLink = (phone: string | null) => {
    if (!phone) return "";
    const numericPhone = phone.replace(/\D/g, "");
    return `https://wa.me/${numericPhone}`;
  };

  const formatVehicleInfo = (driver: DriverWithVehicles) => {
    const vehicleCount = driver.vehicles?.length || 0;
    return vehicleCount > 0 
      ? `${vehicleCount} ${vehicleCount === 1 ? 'veículo' : 'veículos'}`
      : 'Nenhum veículo';
  };

  const toggleExpanded = (driverId: number) => {
    setExpandedCards(prev => 
      prev.includes(driverId) 
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  const canEdit = (driver: DriverWithVehicles) => {
    console.log("CanEdit check:", {
      user: user,
      userId: user?.id,
      driver: driver.name,
      driverUserId: driver.userId,
      canEdit: user && driver.userId === user.id
    });
    return user && driver.userId === user.id;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum motorista encontrado
          </h3>
          <p className="text-gray-500 mb-4">
            Cadastre o primeiro motorista clicando em "Novo Motorista"
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {drivers.map((driver) => {
        const initials = getInitials(driver.name);
        const color = getAvatarColor(driver.name);
        const vehicleInfo = formatVehicleInfo(driver);
        const createdDate = driver.createdAt ? new Date(driver.createdAt) : new Date();
        const isExpanded = expandedCards.includes(driver.id);
        const whatsappLink = formatWhatsAppLink(driver.whatsapp);

        return (
          <Card key={driver.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className={`${color} text-white font-medium`}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{driver.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Car className="h-3 w-3" />
                      <span>{vehicleInfo}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(driver.id)}
                  className="shrink-0"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Informações básicas sempre visíveis */}
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div className="flex items-center space-x-2">
                  <Phone className="h-3 w-3 text-gray-400" />
                  <span className="truncate">{driver.phone || "Não informado"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="truncate">{driver.city || "Não informado"}</span>
                </div>
              </div>

              {/* Informações expandidas */}
              {isExpanded && (
                <div className="space-y-3 border-t pt-3">
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <span className="ml-2 text-gray-600">{driver.email || "Não informado"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">CPF:</span>
                      <span className="ml-2 text-gray-600">{driver.cpf || "Não informado"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Estado:</span>
                      <span className="ml-2 text-gray-600">{driver.state || "Não informado"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Cadastrado em:</span>
                      <span className="ml-2 text-gray-600">{format(createdDate, 'dd/MM/yyyy')}</span>
                    </div>
                  </div>

                  {/* Veículos */}
                  {driver.vehicles && driver.vehicles.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Veículos:</h4>
                      <div className="space-y-2">
                        {driver.vehicles.map((vehicle) => (
                          <div key={vehicle.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">{vehicle.brand} {vehicle.model}</p>
                                <p className="text-xs text-gray-600">Placa: {vehicle.plate}</p>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {vehicle.vehicleType}
                                </Badge>
                              </div>
                              <span className="text-xs text-gray-500">{vehicle.year}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex justify-between items-center mt-4 pt-3 border-t">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(driver)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                  {whatsappLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(whatsappLink, '_blank')}
                      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    >
                      <Phone className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {canEdit(driver) && (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(driver)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(driver)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}