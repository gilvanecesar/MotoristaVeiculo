import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { DriverWithVehicles, VEHICLE_TYPES, BODY_TYPES } from '@shared/schema';
import { format } from 'date-fns';

// Adicionar a tipagem para o autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
  }
}

export type ReportType = 'driver' | 'full';

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

/**
 * Gera um PDF com dados de motoristas e veículos
 */
export async function generateDriversReport(
  drivers: DriverWithVehicles[],
  title: string,
  type: ReportType = 'full'
): Promise<string> {
  // Criar um novo documento PDF
  const doc = new jsPDF({
    orientation: 'portrait',
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
  
  let yPosition = 40;
  
  // Para cada motorista
  drivers.forEach((driver, index) => {
    // Se não for o primeiro motorista, adicione uma nova página
    if (index > 0) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Cabeçalho do motorista
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 102); // Azul escuro
    doc.text(`Motorista: ${driver.name}`, 14, yPosition);
    yPosition += 8;
    
    // Informações pessoais
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Preto
    doc.text(`CPF: ${driver.cpf}`, 14, yPosition);
    yPosition += 6;
    
    doc.text(`Telefone: ${driver.phone}${driver.whatsapp ? ` / WhatsApp: ${driver.whatsapp}` : ''}`, 14, yPosition);
    yPosition += 6;
    
    doc.text(`E-mail: ${driver.email}`, 14, yPosition);
    yPosition += 10;
    
    // Documentos
    doc.setTextColor(0, 0, 102); // Azul escuro
    doc.text('Documentos', 14, yPosition);
    yPosition += 6;
    
    doc.setTextColor(0, 0, 0); // Preto
    doc.text(`CNH: ${driver.cnh} - Categoria ${driver.cnhCategory}`, 14, yPosition);
    yPosition += 6;
    
    doc.text(`Validade CNH: ${format(new Date(driver.cnhExpiration), 'dd/MM/yyyy')}`, 14, yPosition);
    yPosition += 10;
    
    // Endereço
    doc.setTextColor(0, 0, 102); // Azul escuro
    doc.text('Endereço', 14, yPosition);
    yPosition += 6;
    
    doc.setTextColor(0, 0, 0); // Preto
    doc.text(`${driver.street}, ${driver.number}${driver.complement ? ` - ${driver.complement}` : ''}`, 14, yPosition);
    yPosition += 6;
    
    doc.text(`${driver.neighborhood}, ${driver.city} - ${driver.state}`, 14, yPosition);
    yPosition += 6;
    
    doc.text(`CEP: ${driver.zipcode}`, 14, yPosition);
    yPosition += 10;
    
    // Se tipo for 'full', listar veículos
    if (type === 'full' && driver.vehicles && driver.vehicles.length > 0) {
      doc.setTextColor(0, 0, 102); // Azul escuro
      doc.setFontSize(12);
      doc.text('Veículos vinculados', 14, yPosition);
      yPosition += 8;
      
      // Tabela de veículos
      const vehiclesData = driver.vehicles.map(vehicle => [
        vehicle.plate,
        `${vehicle.brand} ${vehicle.model}`,
        vehicle.year.toString(),
        getVehicleTypeDisplayText(vehicle.vehicleType),
        getBodyTypeDisplayText(vehicle.bodyType)
      ]);
      
      // Adicionar tabela
      doc.autoTable({
        startY: yPosition,
        head: [['Placa', 'Marca/Modelo', 'Ano', 'Tipo', 'Carroceria']],
        body: vehiclesData,
        theme: 'striped',
        headStyles: { 
          fillColor: [0, 0, 102],
          textColor: [255, 255, 255]
        },
        styles: {
          fontSize: 9
        }
      });
      
      // Atualizar a posição Y após a tabela
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    } else if (driver.vehicles && driver.vehicles.length === 0) {
      doc.setTextColor(102, 102, 102); // Cinza
      doc.text('Nenhum veículo vinculado a este motorista.', 14, yPosition);
      yPosition += 10;
    }
    
    // Adicionar número da página
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150); // Cinza claro
    doc.text(`Página ${doc.getNumberOfPages()}`, 
      doc.internal.pageSize.width / 2, 
      doc.internal.pageSize.height - 10, 
      { align: 'center' });
  });
  
  // Gerar o PDF como URL 
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  
  return url;
}