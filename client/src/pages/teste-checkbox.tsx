import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

// Componente simples para testar checkboxes
export default function TesteCheckbox() {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  
  const options = [
    "Opção 1",
    "Opção 2", 
    "Opção 3",
    "Opção 4",
    "Opção 5"
  ];
  
  const handleCheckboxChange = (option: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(option)) {
        // Se já estiver selecionado, remove
        return prev.filter(item => item !== option);
      } else {
        // Se não estiver selecionado, adiciona
        return [...prev, option];
      }
    });
  };
  
  return (
    <div className="container p-8">
      <h1 className="text-2xl font-bold mb-6">Teste de Checkboxes</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Checkboxes usando input HTML nativo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {options.map(option => (
              <div key={option} className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id={`option-${option}`}
                  checked={selectedOptions.includes(option)}
                  onChange={() => handleCheckboxChange(option)}
                  className="h-4 w-4 rounded-sm border border-primary"
                />
                <Label 
                  htmlFor={`option-${option}`}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 border rounded-md">
            <h3 className="font-medium mb-2">Opções selecionadas:</h3>
            {selectedOptions.length > 0 ? (
              <ul className="list-disc pl-5">
                {selectedOptions.map(option => (
                  <li key={option}>{option}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Nenhuma opção selecionada</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Button 
        onClick={() => setSelectedOptions([])}
        variant="outline"
      >
        Limpar seleções
      </Button>
    </div>
  );
}