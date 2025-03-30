import { VEHICLE_TYPES, BODY_TYPES } from "@shared/schema";

// Tipos de categorias de veículos
export const VEHICLE_CATEGORIES = {
  LEVE: "leve",
  MEDIO: "medio",
  PESADO: "pesado"
} as const;

// Mapeamento de tipos específicos por categoria
export const VEHICLE_TYPES_BY_CATEGORY = {
  [VEHICLE_CATEGORIES.LEVE]: [
    VEHICLE_TYPES.LEVE_TODOS,
    VEHICLE_TYPES.LEVE_FIORINO,
    VEHICLE_TYPES.LEVE_TOCO,
    VEHICLE_TYPES.LEVE_VLC
  ],
  [VEHICLE_CATEGORIES.MEDIO]: [
    VEHICLE_TYPES.MEDIO_TODOS,
    VEHICLE_TYPES.MEDIO_BITRUCK,
    VEHICLE_TYPES.MEDIO_TRUCK
  ],
  [VEHICLE_CATEGORIES.PESADO]: [
    VEHICLE_TYPES.PESADO_TODOS,
    VEHICLE_TYPES.PESADO_BITREM,
    VEHICLE_TYPES.PESADO_CARRETA,
    VEHICLE_TYPES.PESADO_CARRETA_LS,
    VEHICLE_TYPES.PESADO_RODOTREM,
    VEHICLE_TYPES.PESADO_VANDERLEIA
  ]
};

// Função para obter a categoria do tipo de veículo
export function getVehicleCategory(type: string): string {
  if (type.startsWith('leve_')) return VEHICLE_CATEGORIES.LEVE;
  if (type.startsWith('medio_')) return VEHICLE_CATEGORIES.MEDIO;
  if (type.startsWith('pesado_')) return VEHICLE_CATEGORIES.PESADO;
  return '';
}

// Display names for vehicle categories
export function getVehicleCategoryDisplay(category: string): string {
  switch (category) {
    case VEHICLE_CATEGORIES.LEVE:
      return "Leve";
    case VEHICLE_CATEGORIES.MEDIO:
      return "Médio";
    case VEHICLE_CATEGORIES.PESADO:
      return "Pesado";
    default:
      return category;
  }
}

// Display names for vehicle types
export function getVehicleTypeDisplay(type: string): string {
  switch (type) {
    // Leves
    case VEHICLE_TYPES.LEVE_TODOS:
      return "Leve (Todos)";
    case VEHICLE_TYPES.LEVE_FIORINO:
      return "Leve - Fiorino";
    case VEHICLE_TYPES.LEVE_TOCO:
      return "Leve - Toco";
    case VEHICLE_TYPES.LEVE_VLC:
      return "Leve - VLC";
      
    // Médios
    case VEHICLE_TYPES.MEDIO_TODOS:
      return "Médio (Todos)";
    case VEHICLE_TYPES.MEDIO_BITRUCK:
      return "Médio - Bitruck";
    case VEHICLE_TYPES.MEDIO_TRUCK:
      return "Médio - Truck";
      
    // Pesados
    case VEHICLE_TYPES.PESADO_TODOS:
      return "Pesado (Todos)";
    case VEHICLE_TYPES.PESADO_BITREM:
      return "Pesado - Bitrem";
    case VEHICLE_TYPES.PESADO_CARRETA:
      return "Pesado - Carreta";
    case VEHICLE_TYPES.PESADO_CARRETA_LS:
      return "Pesado - Carreta LS";
    case VEHICLE_TYPES.PESADO_RODOTREM:
      return "Pesado - Rodotrem";
    case VEHICLE_TYPES.PESADO_VANDERLEIA:
      return "Pesado - Vanderleia";
    default:
      return type;
  }
}

// Display names for body types
export function getBodyTypeDisplay(type: string): string {
  switch (type) {
    case BODY_TYPES.BAU:
      return "Baú";
    case BODY_TYPES.GRANELEIRA:
      return "Graneleira";
    case BODY_TYPES.BASCULANTE:
      return "Basculante";
    case BODY_TYPES.PLATAFORMA:
      return "Plataforma";
    case BODY_TYPES.TANQUE:
      return "Tanque";
    case BODY_TYPES.FRIGORIFICA:
      return "Frigorífica";
    case BODY_TYPES.PORTA_CONTEINER:
      return "Porta-contêiner";
    case BODY_TYPES.SIDER:
      return "Sider";
    case BODY_TYPES.CACAMBA:
      return "Caçamba";
    case BODY_TYPES.ABERTA:
      return "Aberta";
    case BODY_TYPES.FECHADA:
      return "Fechada";
    default:
      return type;
  }
}