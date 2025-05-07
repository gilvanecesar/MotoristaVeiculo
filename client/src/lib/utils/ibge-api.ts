export interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

export interface IBGECity {
  id: number;
  nome: string;
}

// Definir a interface para cidade completa com estrutura de microrregião
export interface CompleteIBGECity {
  id: number;
  nome: string;
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string;
        nome: string;
      }
    }
  }
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
    // Retorna lista padrão dos estados brasileiros
    return [
      { id: 12, sigla: "AC", nome: "Acre" },
      { id: 27, sigla: "AL", nome: "Alagoas" },
      { id: 16, sigla: "AP", nome: "Amapá" },
      { id: 13, sigla: "AM", nome: "Amazonas" },
      { id: 29, sigla: "BA", nome: "Bahia" },
      { id: 23, sigla: "CE", nome: "Ceará" },
      { id: 53, sigla: "DF", nome: "Distrito Federal" },
      { id: 32, sigla: "ES", nome: "Espírito Santo" },
      { id: 52, sigla: "GO", nome: "Goiás" },
      { id: 21, sigla: "MA", nome: "Maranhão" },
      { id: 51, sigla: "MT", nome: "Mato Grosso" },
      { id: 50, sigla: "MS", nome: "Mato Grosso do Sul" },
      { id: 31, sigla: "MG", nome: "Minas Gerais" },
      { id: 15, sigla: "PA", nome: "Pará" },
      { id: 25, sigla: "PB", nome: "Paraíba" },
      { id: 41, sigla: "PR", nome: "Paraná" },
      { id: 26, sigla: "PE", nome: "Pernambuco" },
      { id: 22, sigla: "PI", nome: "Piauí" },
      { id: 33, sigla: "RJ", nome: "Rio de Janeiro" },
      { id: 24, sigla: "RN", nome: "Rio Grande do Norte" },
      { id: 43, sigla: "RS", nome: "Rio Grande do Sul" },
      { id: 11, sigla: "RO", nome: "Rondônia" },
      { id: 14, sigla: "RR", nome: "Roraima" },
      { id: 42, sigla: "SC", nome: "Santa Catarina" },
      { id: 35, sigla: "SP", nome: "São Paulo" },
      { id: 28, sigla: "SE", nome: "Sergipe" },
      { id: 17, sigla: "TO", nome: "Tocantins" }
    ];
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

/**
 * Busca cidades por nome em todo o Brasil
 * @param nome Nome da cidade para buscar
 * @returns Promise com a lista de cidades
 */
export async function searchCitiesByName(nome: string): Promise<CompleteIBGECity[]> {
  try {
    // Verifica se a string tem pelo menos 3 caracteres para evitar buscas muito amplas
    if (!nome || nome.length < 3) {
      return [];
    }

    const encodedNome = encodeURIComponent(nome);
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${encodedNome}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar cidades pelo nome: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar cidades com o nome "${nome}":`, error);
    return [];
  }
}