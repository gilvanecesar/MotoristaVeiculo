import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormControl } from "@/components/ui/form";

interface CitySelectProps {
  state: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  errorMessage?: string;
  disabled?: boolean;
}

const CitySelect: React.FC<CitySelectProps> = ({
  state,
  value,
  onChange,
  placeholder = "Selecione a cidade",
  errorMessage,
  disabled = false
}) => {
  const [cities, setCities] = useState<{ id: string; nome: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Função para carregar cidades do estado selecionado
    const loadCities = async () => {
      if (!state) {
        setCities([]);
        return;
      }

      setIsLoading(true);
      try {
        // API do IBGE para lista de municípios por UF
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`);
        
        if (response.ok) {
          const data = await response.json();
          setCities(data);
        } else {
          console.error("Erro ao carregar cidades:", response.statusText);
          setCities([]);
        }
      } catch (error) {
        console.error("Erro ao carregar cidades:", error);
        setCities([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCities();
  }, [state]);

  // Se não tiver um estado selecionado ou estiver carregando, mostrar placeholder
  if (!state || isLoading) {
    return (
      <Select
        disabled={true}
        value=""
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder={!state ? "Selecione um estado primeiro" : "Carregando cidades..."} />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="">Carregando...</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled || cities.length === 0}
    >
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {cities.length > 0 ? (
          cities.map((city) => (
            <SelectItem key={city.id} value={city.nome}>
              {city.nome}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="">Nenhuma cidade encontrada</SelectItem>
        )}
      </SelectContent>
      {errorMessage && (
        <div className="text-red-500 text-sm mt-1">{errorMessage}</div>
      )}
    </Select>
  );
};

export default CitySelect;