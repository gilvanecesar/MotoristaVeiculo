import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ANTT_CARGO_TYPES } from "@shared/schema";

interface CargoTypesProps {
  value: string;
  onValueChange: (value: string) => void;
}

const cargoTypeLabels = {
  GRANEL_SOLIDO: "Granel sólido",
  GRANEL_LIQUIDO: "Granel líquido", 
  FRIGORIFICADA: "Frigorificada ou Aquecida",
  CONTEINERIZADA: "Conteinerizada",
  CARGA_GERAL: "Carga Geral",
  NEOGRANEL: "Neogranel",
  PERIGOSA_GRANEL_SOLIDO: "Perigosa (granel sólido)",
  PERIGOSA_GRANEL_LIQUIDO: "Perigosa (granel líquido)",
  PERIGOSA_FRIGORIFICADA: "Perigosa (frigorificada ou aquecida)",
  PERIGOSA_CONTEINERIZADA: "Perigosa (conteinerizada)",
  PERIGOSA_CARGA_GERAL: "Perigosa (carga geral)",
  GRANEL_PRESSURIZADA: "Carga Granel Pressurizada"
};

export default function CargoTypes({ value, onValueChange }: CargoTypesProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Tipo de carga:</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione o tipo de carga" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(cargoTypeLabels).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}