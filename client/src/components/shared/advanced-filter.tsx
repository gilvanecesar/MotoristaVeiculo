import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface FilterOption {
  id: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'date';
  placeholder?: string;
  options?: {value: string; label: string}[];
}

export interface FilterState {
  [key: string]: string;
}

interface AdvancedFilterProps {
  filterOptions: FilterOption[];
  filterState: FilterState;
  onFilterChange: (filters: FilterState) => void;
  showClearButton?: boolean;
}

export function AdvancedFilter({
  filterOptions,
  filterState,
  onFilterChange,
  showClearButton = true,
}: AdvancedFilterProps) {
  const [showFilters, setShowFilters] = useState(false);
  
  // Verifica se algum filtro está ativo
  const hasActiveFilters = Object.values(filterState).some(
    value => value !== "" && value !== "all"
  );
  
  // Conta quantos filtros estão ativos
  const activeFiltersCount = Object.values(filterState).filter(
    value => value !== "" && value !== "all"
  ).length;
  
  // Manipula a mudança de um filtro
  const handleFilterChange = (id: string, value: string) => {
    onFilterChange({
      ...filterState,
      [id]: value
    });
  };
  
  // Limpa todos os filtros
  const clearAllFilters = () => {
    const clearedFilters = { ...filterState };
    Object.keys(clearedFilters).forEach(key => {
      clearedFilters[key] = "";
    });
    onFilterChange(clearedFilters);
  };
  
  // Renderiza o input de acordo com o tipo
  const renderFilterInput = (filter: FilterOption) => {
    switch (filter.type) {
      case 'select':
        return (
          <Select 
            value={filterState[filter.id] || "all"} 
            onValueChange={(value) => handleFilterChange(filter.id, value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={filter.placeholder || "Selecionar"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {filter.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'number':
        return (
          <Input 
            type="number"
            placeholder={filter.placeholder} 
            value={filterState[filter.id] || ""}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
          />
        );
      
      case 'date':
        return (
          <Input 
            type="date"
            value={filterState[filter.id] || ""}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
          />
        );
        
      default:
        return (
          <Input 
            placeholder={filter.placeholder} 
            value={filterState[filter.id] || ""}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
          />
        );
    }
  };
  
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="h-5 px-1.5 font-normal text-xs bg-primary text-white"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0 max-h-[80vh] overflow-auto" align="start">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Filtros</CardTitle>
                  {showClearButton && hasActiveFilters && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearAllFilters}
                      className="h-7 gap-1 text-xs"
                    >
                      <X className="h-3.5 w-3.5" />
                      Limpar
                    </Button>
                  )}
                </div>
                <CardDescription>
                  Refine a lista usando os filtros abaixo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {filterOptions.map((filter) => (
                    <div key={filter.id} className="space-y-1">
                      <label className="text-sm font-medium">
                        {filter.label}
                      </label>
                      {renderFilterInput(filter)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>
        
        {/* Badges para filtros ativos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.map(filter => {
              const value = filterState[filter.id];
              if (!value || value === "all") return null;
              
              // Encontra o label para valores de select
              let displayValue = value;
              if (filter.type === 'select' && filter.options) {
                const option = filter.options.find(opt => opt.value === value);
                if (option) displayValue = option.label;
              }
              
              return (
                <Badge 
                  key={filter.id}
                  variant="secondary"
                  className="gap-1.5 bg-slate-100 hover:bg-slate-200"
                >
                  <span className="font-medium">{filter.label}:</span> {displayValue}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange(filter.id, "")}
                    className="h-4 w-4 p-0 rounded-full hover:bg-slate-300"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remover filtro {filter.label}</span>
                  </Button>
                </Badge>
              );
            })}
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 text-xs"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}