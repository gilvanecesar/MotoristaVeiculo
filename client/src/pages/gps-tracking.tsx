import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MapPin, Truck, Navigation, Clock, Smartphone, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DriverLocationMap from "@/components/maps/driver-location-map";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
}

export default function GPSTrackingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null);
  const [locationPermission, setLocationPermission] = useState<PermissionState | "unsupported">("prompt");

  // Verificar se o usuário tem permissão de motorista
  const isDriver = user?.profileType === 'driver' || user?.driverId;
  const isAdmin = user?.profileType === 'admin';
  const canViewAllDrivers = isAdmin || user?.profileType === 'client';

  // Buscar configuração atual do GPS do motorista
  const { data: driverGPSConfig, refetch: refetchConfig } = useQuery({
    queryKey: [`/api/drivers/${user?.driverId}/location`],
    queryFn: async () => {
      if (!user?.driverId) return null;
      const res = await apiRequest("GET", `/api/drivers/${user.driverId}/location`);
      if (!res.ok) throw new Error("Falha ao carregar configuração GPS");
      return res.json();
    },
    enabled: !!user?.driverId && isDriver,
  });

  // Mutation para habilitar/desabilitar GPS
  const toggleGPSMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user?.driverId) throw new Error("ID do motorista não encontrado");
      const res = await apiRequest("PUT", `/api/drivers/${user.driverId}/location/toggle`, {
        enabled
      });
      if (!res.ok) throw new Error("Falha ao alterar configuração GPS");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuração GPS atualizada",
        description: "As configurações de rastreamento foram atualizadas com sucesso.",
      });
      refetchConfig();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao configurar GPS",
        description: error.message || "Falha ao atualizar configurações",
        variant: "destructive",
      });
    },
  });

  // Mutation para enviar localização
  const sendLocationMutation = useMutation({
    mutationFn: async (locationData: LocationData) => {
      if (!user?.driverId) throw new Error("ID do motorista não encontrado");
      const res = await apiRequest("POST", `/api/drivers/${user.driverId}/location`, locationData);
      if (!res.ok) throw new Error("Falha ao enviar localização");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers/locations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar localização",
        description: error.message || "Falha ao atualizar localização",
        variant: "destructive",
      });
    },
  });

  // Verificar permissões de geolocalização
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationPermission("unsupported");
      return;
    }

    // Verificar permissão atual
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state);
        result.onchange = () => setLocationPermission(result.state);
      });
    }
  }, []);

  // Função para iniciar rastreamento
  const startTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocalização não suportada",
        description: "Seu dispositivo não suporta geolocalização.",
        variant: "destructive",
      });
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // Cache por 1 minuto
    };

    const successCallback = (position: GeolocationPosition) => {
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || undefined,
        heading: position.coords.heading || undefined,
      };

      setLastLocation(locationData);
      sendLocationMutation.mutate(locationData);
    };

    const errorCallback = (error: GeolocationPositionError) => {
      let message = "Erro desconhecido";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "Permissão de localização negada";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Localização indisponível";
          break;
        case error.TIMEOUT:
          message = "Timeout ao obter localização";
          break;
      }
      
      toast({
        title: "Erro de geolocalização",
        description: message,
        variant: "destructive",
      });
    };

    const id = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      options
    );

    setWatchId(id);
    setIsTracking(true);
  };

  // Função para parar rastreamento
  const stopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  // Toggle GPS
  const handleGPSToggle = (enabled: boolean) => {
    toggleGPSMutation.mutate(enabled);
    
    if (enabled && !isTracking) {
      startTracking();
    } else if (!enabled && isTracking) {
      stopTracking();
    }
  };

  // Auto-iniciar rastreamento se estiver habilitado
  useEffect(() => {
    if (driverGPSConfig?.locationEnabled && !isTracking && locationPermission === "granted") {
      startTracking();
    }
  }, [driverGPSConfig?.locationEnabled, locationPermission]);

  if (!isDriver && !canViewAllDrivers) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Você não tem permissão para acessar o rastreamento GPS.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Rastreamento GPS</h1>
        <Badge variant={isTracking ? "default" : "secondary"}>
          {isTracking ? "Rastreando" : "Inativo"}
        </Badge>
      </div>

      <Tabs defaultValue={isDriver ? "my-location" : "map"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {isDriver && (
            <TabsTrigger value="my-location" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Minha Localização
            </TabsTrigger>
          )}
          {canViewAllDrivers && (
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Mapa Geral
            </TabsTrigger>
          )}
        </TabsList>

        {isDriver && (
          <TabsContent value="my-location" className="space-y-4">
            {/* Configurações do motorista */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Configurações de GPS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {locationPermission === "unsupported" && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Seu dispositivo não suporta geolocalização.
                    </AlertDescription>
                  </Alert>
                )}

                {locationPermission === "denied" && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Permissão de localização negada. Habilite nas configurações do navegador.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rastreamento GPS</p>
                    <p className="text-sm text-muted-foreground">
                      Compartilhe sua localização em tempo real
                    </p>
                  </div>
                  <Switch
                    checked={driverGPSConfig?.locationEnabled || false}
                    onCheckedChange={handleGPSToggle}
                    disabled={
                      toggleGPSMutation.isPending || 
                      locationPermission === "denied" || 
                      locationPermission === "unsupported"
                    }
                  />
                </div>

                {lastLocation && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Última localização
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Latitude:</span>
                        <p className="font-mono">{lastLocation.latitude.toFixed(6)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Longitude:</span>
                        <p className="font-mono">{lastLocation.longitude.toFixed(6)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Precisão:</span>
                        <p>{Math.round(lastLocation.accuracy)}m</p>
                      </div>
                      {lastLocation.speed && (
                        <div>
                          <span className="text-muted-foreground">Velocidade:</span>
                          <p>{Math.round(lastLocation.speed * 3.6)} km/h</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={startTracking}
                    disabled={isTracking || locationPermission !== "granted"}
                    className="flex-1"
                  >
                    {isTracking ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rastreando...
                      </>
                    ) : (
                      <>
                        <Navigation className="h-4 w-4 mr-2" />
                        Iniciar Rastreamento
                      </>
                    )}
                  </Button>
                  
                  {isTracking && (
                    <Button
                      variant="outline"
                      onClick={stopTracking}
                    >
                      Parar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mapa individual do motorista */}
            {driverGPSConfig?.locationEnabled && user?.driverId && (
              <DriverLocationMap
                driverId={user.driverId}
                height="300px"
                showControls={false}
              />
            )}
          </TabsContent>
        )}

        {canViewAllDrivers && (
          <TabsContent value="map" className="space-y-4">
            <DriverLocationMap height="600px" />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}