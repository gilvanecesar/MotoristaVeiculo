import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Truck, Phone, Navigation } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DriverLocation {
  id: number;
  name: string;
  phone: string;
  currentLatitude: string;
  currentLongitude: string;
  lastLocationUpdate: string;
  locationEnabled: boolean;
}

interface DriverLocationMapProps {
  driverId?: number; // Para mostrar apenas um motorista específico
  height?: string;
  showControls?: boolean;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""; // Será necessário configurar

export default function DriverLocationMap({ 
  driverId, 
  height = "400px", 
  showControls = true 
}: DriverLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Buscar localizações dos motoristas
  const { data: drivers, isLoading, refetch } = useQuery({
    queryKey: driverId ? [`/api/drivers/${driverId}/location`] : ["/api/drivers/locations"],
    queryFn: async () => {
      const endpoint = driverId 
        ? `/api/drivers/${driverId}/location`
        : "/api/drivers/locations";
      const res = await apiRequest("GET", endpoint);
      if (!res.ok) throw new Error("Falha ao carregar localizações");
      const data = await res.json();
      return driverId ? [data] : data;
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Inicializar o mapa
  useEffect(() => {
    if (!mapRef.current || isMapLoaded) return;

    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: "weekly",
          libraries: ["places"]
        });

        await loader.load();

        const mapOptions: google.maps.MapOptions = {
          center: { lat: -15.7942, lng: -47.8822 }, // Brasília como centro padrão
          zoom: 6,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          streetViewControl: true,
          mapTypeControl: showControls,
          fullscreenControl: showControls,
          zoomControl: showControls,
        };

        const mapInstance = new google.maps.Map(mapRef.current!, mapOptions);
        setMap(mapInstance);
        setIsMapLoaded(true);
      } catch (error) {
        console.error("Erro ao carregar Google Maps:", error);
      }
    };

    if (GOOGLE_MAPS_API_KEY) {
      initMap();
    }
  }, [showControls, isMapLoaded]);

  // Atualizar marcadores quando os dados mudarem
  useEffect(() => {
    if (!map || !drivers?.length) return;

    // Limpar marcadores existentes
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    const newMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();

    drivers.forEach((driver: DriverLocation) => {
      if (!driver.currentLatitude || !driver.currentLongitude) return;

      const position = {
        lat: parseFloat(driver.currentLatitude),
        lng: parseFloat(driver.currentLongitude)
      };

      // Criar marcador personalizado
      const marker = new google.maps.Marker({
        position,
        map,
        title: driver.name,
        icon: {
          url: "data:image/svg+xml," + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#10b981" stroke="#fff" stroke-width="3"/>
              <text x="20" y="26" text-anchor="middle" fill="white" font-size="20" font-family="Arial">🚛</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20)
        }
      });

      // Criar janela de informações
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937;">${driver.name}</h3>
            <p style="margin: 4px 0; color: #6b7280;">
              <strong>Telefone:</strong> ${driver.phone}
            </p>
            <p style="margin: 4px 0; color: #6b7280;">
              <strong>Última atualização:</strong><br>
              ${new Date(driver.lastLocationUpdate).toLocaleString('pt-BR')}
            </p>
            <div style="margin-top: 8px;">
              <a href="tel:${driver.phone}" style="
                display: inline-block;
                padding: 6px 12px;
                background: #10b981;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                font-size: 14px;
              ">Ligar</a>
            </div>
          </div>
        `
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
        setSelectedDriver(driver);
      });

      newMarkers.push(marker);
      bounds.extend(position);
    });

    setMarkers(newMarkers);

    // Ajustar zoom para mostrar todos os marcadores
    if (newMarkers.length > 0) {
      if (newMarkers.length === 1) {
        map.setCenter(newMarkers[0].getPosition()!);
        map.setZoom(15);
      } else {
        map.fitBounds(bounds);
      }
    }
  }, [map, drivers]);

  // Função para centralizar em um motorista específico
  const centerOnDriver = (driver: DriverLocation) => {
    if (!map || !driver.currentLatitude || !driver.currentLongitude) return;

    const position = {
      lat: parseFloat(driver.currentLatitude),
      lng: parseFloat(driver.currentLongitude)
    };

    map.setCenter(position);
    map.setZoom(15);
    setSelectedDriver(driver);
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Google Maps API Key não configurada.<br/>
              Configure VITE_GOOGLE_MAPS_API_KEY para usar o mapa.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Rastreamento GPS de Motoristas
          </CardTitle>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center" style={{ height }}>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div ref={mapRef} style={{ height, width: "100%" }} />
          )}
        </CardContent>
      </Card>

      {/* Lista de motoristas */}
      {drivers && drivers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Motoristas Ativos ({drivers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {drivers.map((driver: DriverLocation) => (
                <div
                  key={driver.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedDriver?.id === driver.id 
                      ? 'bg-primary/10 border-primary' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => centerOnDriver(driver)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <div>
                      <p className="font-medium">{driver.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Atualizado: {new Date(driver.lastLocationUpdate).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <MapPin className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`tel:${driver.phone}`, '_self');
                      }}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {drivers && drivers.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <Truck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Nenhum motorista com rastreamento GPS ativo encontrado.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}