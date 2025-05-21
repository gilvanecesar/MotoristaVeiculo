import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Este é um formulário simplificado para demonstrar a funcionalidade dos checkboxes
export default function SimpleFreightForm() {
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);

  // Dados de exemplo
  const vehicleTypes = [
    "Carreta 2 eixos",
    "Carreta 3 eixos",
    "Bitrem",
    "Rodotrem",
    "Truck"
  ];

  const bodyTypes = [
    "Baú",
    "Sider",
    "Graneleiro",
    "Tanque",
    "Refrigerado"
  ];

  // Função para lidar com mudanças nos checkboxes de tipos de veículos
  const handleVehicleTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      // Adicionar à lista se o checkbox estiver marcado
      setSelectedVehicleTypes([...selectedVehicleTypes, type]);
    } else {
      // Remover da lista se o checkbox estiver desmarcado
      setSelectedVehicleTypes(selectedVehicleTypes.filter(t => t !== type));
    }
  };

  // Função para lidar com mudanças nos checkboxes de tipos de carrocerias
  const handleBodyTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      // Adicionar à lista se o checkbox estiver marcado
      setSelectedBodyTypes([...selectedBodyTypes, type]);
    } else {
      // Remover da lista se o checkbox estiver desmarcado
      setSelectedBodyTypes(selectedBodyTypes.filter(t => t !== type));
    }
  };

  // Submeter o formulário (apenas para demonstração)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mostrar dados selecionados no console para verificar
    console.log("Tipos de veículos selecionados:", selectedVehicleTypes);
    console.log("Tipos de carrocerias selecionados:", selectedBodyTypes);
    
    alert(`Veículos selecionados: ${selectedVehicleTypes.join(", ")}\nCarrocerias selecionadas: ${selectedBodyTypes.join(", ")}`);
  };

  return (
    <div className="container px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Teste de Checkboxes</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Veículos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {vehicleTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`vehicle-type-${type}`}
                    checked={selectedVehicleTypes.includes(type)}
                    onChange={(e) => handleVehicleTypeChange(type, e.target.checked)}
                    className="h-4 w-4 rounded-sm border border-primary"
                  />
                  <label
                    htmlFor={`vehicle-type-${type}`}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipos de Carrocerias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {bodyTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`body-type-${type}`}
                    checked={selectedBodyTypes.includes(type)}
                    onChange={(e) => handleBodyTypeChange(type, e.target.checked)}
                    className="h-4 w-4 rounded-sm border border-primary"
                  />
                  <label
                    htmlFor={`body-type-${type}`}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">
            Testar Seleção
          </Button>
        </div>
      </form>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Selecionados:</h2>
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium">Tipos de Veículos:</h3>
          <ul className="list-disc pl-5 mb-4">
            {selectedVehicleTypes.length === 0 ? (
              <li className="text-muted-foreground">Nenhum selecionado</li>
            ) : (
              selectedVehicleTypes.map(type => (
                <li key={type}>{type}</li>
              ))
            )}
          </ul>
          
          <h3 className="font-medium">Tipos de Carrocerias:</h3>
          <ul className="list-disc pl-5">
            {selectedBodyTypes.length === 0 ? (
              <li className="text-muted-foreground">Nenhuma selecionada</li>
            ) : (
              selectedBodyTypes.map(type => (
                <li key={type}>{type}</li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}