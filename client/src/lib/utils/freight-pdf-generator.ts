import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FreightWithDestinations, CARGO_TYPES, TARP_OPTIONS, TOLL_OPTIONS, VEHICLE_TYPES, BODY_TYPES } from '@shared/schema';
import { format } from 'date-fns';

// Adicionar a tipagem para o autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
  }
}

// Funções para formato de texto dos tipos
function getVehicleTypeDisplayText(vehicleType: string): string {
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

function getBodyTypeDisplayText(bodyType: string): string {
  if (bodyType === BODY_TYPES.BAU) return "Baú";
  if (bodyType === BODY_TYPES.GRANELEIRA) return "Graneleira";
  if (bodyType === BODY_TYPES.SIDER) return "Sider";
  if (bodyType === BODY_TYPES.BASCULANTE) return "Basculante";
  if (bodyType === BODY_TYPES.CONTAINER) return "Container";
  if (bodyType === BODY_TYPES.GAIOLA) return "Gaiola";
  if (bodyType === BODY_TYPES.GRADE_BAIXA) return "Grade Baixa";
  if (bodyType === BODY_TYPES.PRANCHA) return "Prancha";
  if (bodyType === BODY_TYPES.TANQUE) return "Tanque";
  if (bodyType === BODY_TYPES.CACAMBA) return "Caçamba";
  return "Desconhecido";
}

function getCargoTypeDisplay(type: string): string {
  if (type === CARGO_TYPES.COMPLETA) return "Carga Completa";
  if (type === CARGO_TYPES.COMPLEMENTO) return "Complemento";
  return type;
}

function getTarpDisplay(option: string): string {
  if (option === TARP_OPTIONS.SIM) return "Sim";
  if (option === TARP_OPTIONS.NAO) return "Não";
  return option;
}

function getTollDisplay(option: string): string {
  if (option === TOLL_OPTIONS.INCLUSO) return "Incluso";
  if (option === TOLL_OPTIONS.A_PARTE) return "À Parte";
  return option;
}

function getStatusDisplay(status: string): string {
  switch (status) {
    case 'aberto': return "Aberto";
    case 'em_andamento': return "Em Andamento";
    case 'concluido': return "Concluído";
    case 'cancelado': return "Cancelado";
    default: return status;
  }
}

/**
 * Gera um PDF com dados de fretes
 */
export async function generateFreightsReport(
  freights: FreightWithDestinations[],
  title: string
): Promise<string> {
  // Criar um novo documento PDF
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  // Adicionar título
  doc.setFontSize(16);
  doc.text(title, doc.internal.pageSize.width / 2, 20, { align: 'center' });
  
  // Adicionar data de geração
  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 
    doc.internal.pageSize.width / 2, 30, { align: 'center' });
  
  // Preparar dados para a tabela
  const tableData = freights.map(freight => [
    getStatusDisplay(freight.status),
    `${freight.origin}, ${freight.originState}`,
    freight.hasMultipleDestinations ? 
      `${freight.destination}, ${freight.destinationState} + ${freight.destinations?.length || 0} destinos` : 
      `${freight.destination}, ${freight.destinationState}`,
    getCargoTypeDisplay(freight.cargoType),
    freight.productType,
    `${freight.cargoWeight} kg`,
    getVehicleTypeDisplayText(freight.vehicleType),
    getBodyTypeDisplayText(freight.bodyType),
    `R$ ${parseFloat(freight.freightValue.toString()).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`
  ]);
  
  // Adicionar a tabela ao PDF
  doc.autoTable({
    startY: 40,
    head: [['Status', 'Origem', 'Destino', 'Tipo Carga', 'Produto', 'Peso', 'Tipo Veículo', 'Carroceria', 'Valor']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [0, 0, 102],
      textColor: [255, 255, 255],
      fontSize: 8
    },
    styles: {
      fontSize: 7,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 20 },  // Status
      1: { cellWidth: 30 },  // Origem
      2: { cellWidth: 40 },  // Destino
      3: { cellWidth: 20 },  // Tipo Carga
      4: { cellWidth: 25 },  // Produto
      5: { cellWidth: 15 },  // Peso
      6: { cellWidth: 25 },  // Tipo Veículo
      7: { cellWidth: 20 },  // Carroceria
      8: { cellWidth: 18 },  // Valor
    }
  });
  
  // Adicionar número de página em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150); // Cinza claro
    doc.text(`Página ${i} de ${totalPages}`, 
      doc.internal.pageSize.width / 2, 
      doc.internal.pageSize.height - 10, 
      { align: 'center' });
  }
  
  // Gerar o PDF como URL
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  
  return url;
}