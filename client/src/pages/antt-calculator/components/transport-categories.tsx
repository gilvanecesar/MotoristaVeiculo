import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

interface TransportCategoriesProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const transportCategories = [
  {
    id: "CARGA_LOTACAO",
    name: "Carga lotação",
    description: "Transporte Rodoviário de Carga Lotação",
    table: "Tabela A",
    badge: "Padrão"
  },
  {
    id: "VEICULO_AUTOMOTOR", 
    name: "Operações em que haja a contratação apenas do veículo automotor de cargas",
    description: "Contratação apenas do veículo",
    table: "Tabela B",
    badge: "Específico"
  },
  {
    id: "ALTO_DESEMPENHO",
    name: "Transporte rodoviário de carga lotação de alto desempenho",
    description: "Carga lotação com alto desempenho",
    table: "Tabela C", 
    badge: "Alto Desempenho"
  },
  {
    id: "VEICULO_ALTO_DESEMPENHO",
    name: "Operações em que haja a contratação apenas do veículo automotor de cargas de alto desempenho",
    description: "Veículo de alto desempenho",
    table: "Tabela D",
    badge: "Premium"
  }
];

export default function TransportCategories({ selectedCategory, onCategoryChange }: TransportCategoriesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Info className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Categoria do transporte:</h3>
      </div>
      
      <div className="space-y-3">
        {transportCategories.map((category) => (
          <Card 
            key={category.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedCategory === category.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => onCategoryChange(category.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-sm">{category.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {category.table}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{category.description}</p>
                  <Badge 
                    variant={category.badge === "Premium" ? "default" : "outline"}
                    className="text-xs"
                  >
                    {category.badge}
                  </Badge>
                </div>
                <div className="ml-2">
                  <input
                    type="radio"
                    name="transportCategory"
                    value={category.id}
                    checked={selectedCategory === category.id}
                    onChange={() => onCategoryChange(category.id)}
                    className="h-4 w-4 text-blue-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}