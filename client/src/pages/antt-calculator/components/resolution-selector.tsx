import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ResolutionSelectorProps {
  selectedResolution: string;
  onResolutionChange: (resolution: string) => void;
}

const resolutions = [
  {
    id: "6067_2025",
    name: "17/07/2025, Resolução Nº 6.067",
    badge: "atual",
    date: "2025-07-17"
  },
  {
    id: "suroc_23_2025",
    name: "27/05/2025, Portaria SUROC Nº 23",
    badge: null,
    date: "2025-05-27"
  },
  {
    id: "portaria_3_2025",
    name: "07/02/2025, Portaria Nº 3",
    badge: null,
    date: "2025-02-07"
  },
  {
    id: "6046_2024",
    name: "11/07/2024, Resolução Nº 6.046",
    badge: null,
    date: "2024-07-11"
  },
  {
    id: "6034_2024",
    name: "18/01/2024, Resolução Nº 6.034",
    badge: null,
    date: "2024-01-18"
  }
];

export default function ResolutionSelector({ selectedResolution, onResolutionChange }: ResolutionSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Resolução/Portaria:</label>
      <Select value={selectedResolution} onValueChange={onResolutionChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione a resolução" />
        </SelectTrigger>
        <SelectContent>
          {resolutions.map((resolution) => (
            <SelectItem key={resolution.id} value={resolution.id}>
              <div className="flex items-center gap-2">
                <span>{resolution.name}</span>
                {resolution.badge && (
                  <Badge variant="default" className="text-xs">
                    {resolution.badge}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}