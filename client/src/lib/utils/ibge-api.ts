export interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

export interface IBGECity {
  id: number;
  nome: string;
}

/**
 * Busca a lista de estados da API do IBGE
 * @returns Promise com a lista de estados
 */
export async function fetchStates(): Promise<IBGEState[]> {
  try {
    const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar estados: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar estados do IBGE:', error);
    return [];
  }
}

/**
 * Busca as cidades de um estado específico
 * @param uf Sigla do estado
 * @returns Promise com a lista de cidades
 */
export async function fetchCitiesByState(uf: string): Promise<IBGECity[]> {
  try {
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar cidades: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar cidades do estado ${uf}:`, error);
    return [];
  }
}