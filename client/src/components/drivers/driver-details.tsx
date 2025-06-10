import { DriverWithVehicles, Vehicle, VEHICLE_TYPES, BODY_TYPES } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Car, 
  CreditCard, 
  FileText,
  Truck,
  Building,
  Hash
} from "lucide-react";

interface DriverDetailsProps {
  driver: DriverWithVehicles | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DriverDetails({ driver, open, onOpenChange }: DriverDetailsProps) {
  if (!driver) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = ["blue", "green", "yellow", "red", "purple", "pink", "indigo"];
    const index = name.length % colors.length;
    return colors[index];
  };

  const formatWhatsAppLink = (phone: string | null) => {
    if (!phone) return "";
    const numericPhone = phone.replace(/\D/g, "");
    return `https://wa.me/${numericPhone}`;
  };

  const getVehicleCategory = (vehicle: Vehicle): string => {
    const typeKey = vehicle.vehicleType as keyof typeof VEHICLE_TYPES;
    return VEHICLE_TYPES[typeKey] || vehicle.vehicleType;
  };

  const getSpecificVehicleType = (vehicle: Vehicle): string => {
    return getVehicleCategory(vehicle);
  };

  const getBodyTypeDisplay = (vehicle: Vehicle) => {
    if (vehicle.bodyType) {
      const bodyTypeKey = vehicle.bodyType as keyof typeof BODY_TYPES;
      return BODY_TYPES[bodyTypeKey] || vehicle.bodyType;
    }
    return "Não especificado";
  };

  const initials = getInitials(driver.name);
  const color = getAvatarColor(driver.name);
  const createdDate = driver.createdAt ? new Date(driver.createdAt) : new Date();
  const whatsappLink = formatWhatsAppLink(driver.whatsapp);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className={`bg-${color}/10 text-${color} text-lg`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{driver.name}</h2>
              <p className="text-sm text-muted-foreground">Detalhes do Motorista</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6">
          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{driver.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">WhatsApp</p>
                  {driver.whatsapp ? (
                    <a 
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:underline"
                    >
                      {driver.whatsapp}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">Não informado</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Data de Cadastro</p>
                  <p className="text-sm text-muted-foreground">
                    {format(createdDate, 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Logradouro</p>
                <p className="text-sm text-muted-foreground">
                  {driver.street || "Não informado"}
                  {driver.number && `, ${driver.number}`}
                  {driver.complement && ` - ${driver.complement}`}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Bairro</p>
                <p className="text-sm text-muted-foreground">
                  {driver.neighborhood || "Não informado"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Cidade/Estado</p>
                <p className="text-sm text-muted-foreground">
                  {driver.city || "Não informado"}
                  {driver.state && ` - ${driver.state}`}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">CEP</p>
                <p className="text-sm text-muted-foreground">
                  {driver.zipcode || "Não informado"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documentos */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">CPF</p>
                  <p className="text-sm text-muted-foreground">
                    {driver.cpf || "Não informado"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">CNH</p>
                  <p className="text-sm text-muted-foreground">
                    {driver.cnh || "Não informado"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Categoria CNH</p>
                  <p className="text-sm text-muted-foreground">
                    Não informado
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Veículos */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Veículos ({driver.vehicles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {driver.vehicles.length > 0 ? (
              <div className="space-y-4">
                {driver.vehicles.map((vehicle, index) => (
                  <div key={vehicle.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Car className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">
                            {vehicle.brand} {vehicle.model} ({vehicle.year})
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {getSpecificVehicleType(vehicle)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getBodyTypeDisplay(vehicle)}
                      </Badge>
                    </div>

                    <Separator className="my-3" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Placa</p>
                        <p className="text-muted-foreground">{vehicle.plate}</p>
                      </div>
                      <div>
                        <p className="font-medium">Cor</p>
                        <p className="text-muted-foreground">{vehicle.color}</p>
                      </div>
                      <div>
                        <p className="font-medium">RENAVAM</p>
                        <p className="text-muted-foreground">{vehicle.renavam || "Não informado"}</p>
                      </div>
                      <div>
                        <p className="font-medium">Chassi</p>
                        <p className="text-muted-foreground">{vehicle.chassi || "Não informado"}</p>
                      </div>
                    </div>

                    {vehicle.observations && (
                      <>
                        <Separator className="my-3" />
                        <div>
                          <p className="font-medium text-sm">Observações</p>
                          <p className="text-sm text-muted-foreground mt-1">{vehicle.observations}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum veículo cadastrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}