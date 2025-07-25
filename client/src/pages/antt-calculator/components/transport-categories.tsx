import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TransportCategoriesProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const transportCategories = [
  {
    id: "CARGA_LOTACAO",
    name: "Carga lotação"
  },
  {
    id: "VEICULO_AUTOMOTOR", 
    name: "Operações em que haja a contratação apenas do veículo automotor de cargas"
  },
  {
    id: "ALTO_DESEMPENHO",
    name: "Transporte rodoviário de carga lotação de alto desempenho"
  },
  {
    id: "VEICULO_ALTO_DESEMPENHO",
    name: "Operações em que haja a contratação apenas do veículo automotor de cargas de alto desempenho"
  }
];

export default function TransportCategories({ selectedCategory, onCategoryChange }: TransportCategoriesProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Categoria do transporte:</label>
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione a categoria" />
        </SelectTrigger>
        <SelectContent>
          {transportCategories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}