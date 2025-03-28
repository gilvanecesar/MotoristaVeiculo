import { VEHICLE_TYPES, BODY_TYPES, VehicleType, BodyType } from '@shared/schema';

/**
 * Retorna o texto formatado do tipo de veículo para exibição
 */
export function getVehicleTypeDisplayText(vehicleType: VehicleType): string {
  // Leves
  if (vehicleType === VEHICLE_TYPES.LEVE_TODOS) return "Leve (Todos)";
  if (vehicleType === VEHICLE_TYPES.LEVE_FIORINO) return "Leve (Fiorino)";
  if (vehicleType === VEHICLE_TYPES.LEVE_TOCO) return "Leve (Toco)";
  if (vehicleType === VEHICLE_TYPES.LEVE_VLC) return "Leve (VLC)";
  
  // Médios
  if (vehicleType === VEHICLE_TYPES.MEDIO_TODOS) return "Médio (Todos)";
  if (vehicleType === VEHICLE_TYPES.MEDIO_BITRUCK) return "Médio (Bitruck)";
  if (vehicleType === VEHICLE_TYPES.MEDIO_TRUCK) return "Médio (Truck)";
  
  // Pesados
  if (vehicleType === VEHICLE_TYPES.PESADO_TODOS) return "Pesado (Todos)";
  if (vehicleType === VEHICLE_TYPES.PESADO_BITREM) return "Pesado (Bitrem)";
  if (vehicleType === VEHICLE_TYPES.PESADO_CARRETA) return "Pesado (Carreta)";
  if (vehicleType === VEHICLE_TYPES.PESADO_CARRETA_LS) return "Pesado (Carreta LS)";
  if (vehicleType === VEHICLE_TYPES.PESADO_RODOTREM) return "Pesado (Rodotrem)";
  if (vehicleType === VEHICLE_TYPES.PESADO_VANDERLEIA) return "Pesado (Vanderléia)";
  
  return "Desconhecido";
}

/**
 * Retorna o texto formatado do tipo de carroceria para exibição
 */
export function getBodyTypeDisplayText(bodyType: BodyType): string {
  if (bodyType === BODY_TYPES.BAU) return "Baú";
  if (bodyType === BODY_TYPES.GRANELEIRA) return "Graneleira";
  if (bodyType === BODY_TYPES.BASCULANTE) return "Basculante";
  if (bodyType === BODY_TYPES.PLATAFORMA) return "Plataforma";
  if (bodyType === BODY_TYPES.TANQUE) return "Tanque";
  if (bodyType === BODY_TYPES.FRIGORIFICA) return "Frigorífica";
  if (bodyType === BODY_TYPES.PORTA_CONTEINER) return "Porta Contêiner";
  if (bodyType === BODY_TYPES.SIDER) return "Sider";
  if (bodyType === BODY_TYPES.CACAMBA) return "Caçamba";
  if (bodyType === BODY_TYPES.ABERTA) return "Aberta";
  if (bodyType === BODY_TYPES.FECHADA) return "Fechada";
  
  return "Desconhecido";
}