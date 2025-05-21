import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function SimpleFreightForm() {
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const { toast } = useToast();
  
  // Exemplos de tipos de veículos (simplificados)
  const vehicleTypes = [
    { id: "carreta", label: "Carreta" },
    { id: "truck", label: "Caminhão Truck" },
    { id: "toco", label: "Caminhão Toco" },
    { id: "bitruck", label: "Caminhão Bitruck" },
    { id: "vuc", label: "VUC" }
  ];
  
  const handleVehicleTypeChange = (type: string) => {
    setSelectedVehicleTypes(prev => {
      if (prev.includes(type)) {
        // Se já estiver selecionado, remove
        return prev.filter(item => item !== type);
      } else {
        // Se não estiver selecionado, adiciona
        return [...prev, type];
      }
    });
  };
  
  return (
    <div className="container p-8">
      <h1 className="text-2xl font-bold mb-6">Demonstração de Melhorias</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Origem e Destino (Alinhados Verticalmente)</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Campos de ORIGEM E DESTINO - ALINHADOS VERTICALMENTE */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <Label htmlFor="origin">Cidade de Origem</Label>
              <Input 
                id="origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Digite a cidade de origem"
              />
            </div>
            
            <div>
              <Label htmlFor="destination">Cidade de Destino</Label>
              <Input 
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Digite a cidade de destino"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tipo de Veículo (com checkboxes nativos HTML)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {vehicleTypes.map(type => (
              <div key={type.id} className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id={`vehicle-type-${type.id}`}
                  checked={selectedVehicleTypes.includes(type.id)}
                  onChange={() => handleVehicleTypeChange(type.id)}
                  className="h-4 w-4 rounded-sm border border-primary"
                />
                <Label 
                  htmlFor={`vehicle-type-${type.id}`}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 border rounded-md">
            <h3 className="font-medium mb-2">Veículos selecionados:</h3>
            {selectedVehicleTypes.length > 0 ? (
              <ul className="list-disc pl-5">
                {selectedVehicleTypes.map(typeId => {
                  const vehicle = vehicleTypes.find(v => v.id === typeId);
                  return <li key={typeId}>{vehicle?.label}</li>;
                })}
              </ul>
            ) : (
              <p className="text-gray-500">Nenhum veículo selecionado</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex gap-4 mt-6">
        <Button onClick={() => {
          toast({
            title: "Demonstração de Melhorias",
            description: "Veículos selecionados: " + selectedVehicleTypes.length,
          })
        }}>Testar Seleção</Button>
      </div>
    </div>
  );
}