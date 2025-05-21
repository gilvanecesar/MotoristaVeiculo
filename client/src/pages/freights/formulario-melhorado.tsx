import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const vehicleTypes = [
  { id: "carreta", label: "Carreta" },
  { id: "truck", label: "Caminhão Truck" },
  { id: "toco", label: "Caminhão Toco" },
  { id: "bitruck", label: "Caminhão Bitruck" },
  { id: "vuc", label: "VUC" }
];

export default function FormularioMelhorado() {
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);
  const [origin, setOrigin] = useState("");
  const [stateOrigin, setStateOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [stateDestination, setStateDestination] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  const handleVehicleTypeChange = (type: string) => {
    setSelectedVehicleTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(item => item !== type);
      } else {
        return [...prev, type];
      }
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Formulário enviado",
      description: `Origem: ${origin}, Destino: ${destination}, Veículos: ${selectedVehicleTypes.join(", ")}`,
    });
  };
  
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Formulário de Frete Melhorado</h1>
        <Button variant="outline" onClick={() => navigate("/freights")}>
          Voltar para Fretes
        </Button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Dados do cliente e contato
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName">Nome do Contato</Label>
                <Input 
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Nome do responsável pelo frete"
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Telefone do Contato</Label>
                <Input 
                  id="contactPhone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Origem e Destino</CardTitle>
            <CardDescription>
              Locais de coleta e entrega da carga
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* MELHORIA 1: Campos alinhados verticalmente (um abaixo do outro) */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label htmlFor="origin">Cidade de Origem</Label>
                <Input 
                  id="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Digite a cidade de origem"
                  className="w-full"
                />
                <div className="mt-2">
                  <Label htmlFor="state-origin">Estado</Label>
                  <Input 
                    id="state-origin"
                    value={stateOrigin}
                    onChange={(e) => setStateOrigin(e.target.value)}
                    placeholder="Digite o estado de origem"
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="mt-2">
                <Label htmlFor="destination">Cidade de Destino</Label>
                <Input 
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Digite a cidade de destino"
                  className="w-full"
                />
                <div className="mt-2">
                  <Label htmlFor="state-destination">Estado</Label>
                  <Input 
                    id="state-destination"
                    value={stateDestination}
                    onChange={(e) => setStateDestination(e.target.value)}
                    placeholder="Digite o estado de destino"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tipo de Veículo</CardTitle>
            <CardDescription>
              Selecione os tipos de veículo adequados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* MELHORIA 2: Checkboxes nativos HTML que preservam seleção */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
            
            <div className="mt-4 p-4 border rounded-md bg-muted/20">
              <h3 className="font-medium mb-2">Veículos selecionados:</h3>
              {selectedVehicleTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedVehicleTypes.map(typeId => {
                    const vehicle = vehicleTypes.find(v => v.id === typeId);
                    return (
                      <span 
                        key={typeId} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                      >
                        {vehicle?.label}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum veículo selecionado</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate("/freights")}>
            Cancelar
          </Button>
          <Button type="submit">
            Salvar Frete
          </Button>
        </div>
      </form>
    </div>
  );
}