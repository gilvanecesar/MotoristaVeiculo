import { useState, useEffect } from 'react';

export interface City {
  id: number;
  name: string;
  state: string;
  fullName: string;
  region: string;
}

interface CitiesResponse {
  cities: City[];
  total: number;
}

function useCitiesSearch(searchTerm: string, enabled: boolean = true) {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || searchTerm.length < 2) {
      setCities([]);
      return;
    }

    const searchCities = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/cities?search=${encodeURIComponent(searchTerm)}`);
        
        if (!response.ok) {
          throw new Error('Erro ao buscar cidades');
        }

        const data: CitiesResponse = await response.json();
        setCities(data.cities);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setCities([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchCities, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchTerm, enabled]);

  return { cities, isLoading, error };
}

export function useCities() {
  const [searchTerm, setSearchTerm] = useState('');
  const [enabled, setEnabled] = useState(false);

  const { cities, isLoading, error } = useCitiesSearch(searchTerm, enabled);

  const searchCities = (term: string) => {
    setSearchTerm(term);
    setEnabled(term.length >= 2);
  };

  return {
    cities,
    isLoading,
    error,
    searchTerm,
    searchCities
  };
}