import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function DemonstracaoMelhorias() {
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);
  const [origin, setOrigin] = useState("");
  const [stateOrigin, setStateOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [stateDestination, setStateDestination] = useState("");
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
          <CardTitle>Melhoria 1: Campos de Origem e Destino Alinhados Verticalmente</CardTitle>
        </CardHeader>
        <CardContent>
          {/* MELHORIA 1: Campos alinhados verticalmente */}
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
            
            <div className="mt-4">
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

          <div className="mt-6 p-4 border rounded-md bg-muted/30">
            <h3 className="font-medium mb-2">Como implementar</h3>
            <p className="text-sm mb-2">Para alinhar os campos verticalmente:</p>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Use <code className="bg-muted px-1 rounded">grid grid-cols-1 gap-6</code> para garantir que cada grupo fique em uma linha</li>
              <li>Coloque cada conjunto de campos (cidade/estado) em uma div separada</li>
              <li>Adicione espaçamento adequado com <code className="bg-muted px-1 rounded">mt-4</code> entre os grupos</li>
            </ol>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Melhoria 2: Checkboxes Funcionais usando HTML Nativo</CardTitle>
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

          <div className="mt-6 p-4 border rounded-md bg-muted/30">
            <h3 className="font-medium mb-2">Como implementar</h3>
            <p className="text-sm mb-2">Para usar checkboxes nativos que funcionam corretamente:</p>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Use o elemento <code className="bg-muted px-1 rounded">&lt;input type="checkbox"&gt;</code> em vez do componente Checkbox</li>
              <li>Controle o estado com <code className="bg-muted px-1 rounded">checked={selectedVehicleTypes.includes(type.id)}</code></li>
              <li>Use um <code className="bg-muted px-1 rounded">onChange</code> para adicionar/remover itens do array de seleção</li>
              <li>Associe o checkbox com o label usando <code className="bg-muted px-1 rounded">htmlFor</code> e <code className="bg-muted px-1 rounded">id</code></li>
            </ol>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex gap-4 mt-6">
        <Button onClick={() => {
          toast({
            title: "Demonstração Concluída",
            description: `Veículos selecionados: ${selectedVehicleTypes.length}`,
          })
        }}>Testar Seleção</Button>
        
        <Button 
          variant="outline"
          onClick={() => {
            setSelectedVehicleTypes([]);
            setOrigin("");
            setStateOrigin("");
            setDestination("");
            setStateDestination("");
            toast({
              title: "Campos Limpos",
              description: "Todos os campos foram resetados",
            });
          }}
        >
          Limpar Campos
        </Button>
      </div>
    </div>
  );
}