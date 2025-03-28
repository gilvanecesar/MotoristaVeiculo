// @ts-ignore - Importamos o PDFKit e blob-stream ignorando erros de tipo
import PDFDocument from 'pdfkit';
import blobStream from 'blob-stream';
import { Driver, Vehicle, DriverWithVehicles, VEHICLE_TYPES, BODY_TYPES } from '@shared/schema';
import { format } from 'date-fns';

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

export type ReportType = 'driver' | 'full';

/**
 * Gera um PDF com dados de motoristas e veículos
 * @param drivers Lista de motoristas com veículos
 * @param title Título do relatório
 * @param type Tipo do relatório (driver = apenas motoristas, full = motoristas e veículos)
 * @returns Blob URL do PDF gerado
 */
export async function generateDriversReport(
  drivers: DriverWithVehicles[],
  title: string,
  type: ReportType = 'full'
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Criar um novo documento PDF
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
      });

      // Stream para converter o PDF em Blob
      const stream = doc.pipe(blobStream());

      // Fontes e estilos
      doc.font('Helvetica');
      
      // Cabeçalho
      doc.fontSize(16).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, { align: 'center' });
      doc.moveDown(2);

      // Definir tamanho da fonte padrão
      doc.fontSize(10);

      // Para cada motorista, adicionar suas informações
      drivers.forEach((driver, driverIndex) => {
        if (driverIndex > 0) {
          doc.addPage();
        }

        // Cabeçalho do motorista
        doc.fontSize(14).fillColor('#000066').text(`Motorista: ${driver.name}`, { underline: true });
        doc.moveDown(0.5);
        
        // Informações pessoais
        doc.fontSize(10).fillColor('#000000');
        doc.text(`CPF: ${driver.cpf}`);
        doc.text(`Telefone: ${driver.phone}${driver.whatsapp ? ` / WhatsApp: ${driver.whatsapp}` : ''}`);
        doc.text(`E-mail: ${driver.email}`);
        doc.moveDown(0.5);
        
        // Documentos
        doc.fillColor('#000066').text('Documentos', { underline: true });
        doc.fillColor('#000000');
        doc.text(`CNH: ${driver.cnh} - Categoria ${driver.cnhCategory}`);
        doc.text(`Validade CNH: ${format(new Date(driver.cnhExpiration), 'dd/MM/yyyy')}`);
        doc.moveDown(0.5);
        
        // Endereço
        doc.fillColor('#000066').text('Endereço', { underline: true });
        doc.fillColor('#000000');
        doc.text(`${driver.street}, ${driver.number}${driver.complement ? ` - ${driver.complement}` : ''}`);
        doc.text(`${driver.neighborhood}, ${driver.city} - ${driver.state}`);
        doc.text(`CEP: ${driver.zipcode}`);
        doc.moveDown(1);

        // Se tipo for 'full', listar veículos
        if (type === 'full' && driver.vehicles && driver.vehicles.length > 0) {
          doc.fillColor('#000066').fontSize(12).text('Veículos vinculados', { underline: true });
          doc.moveDown(0.5);
          
          // Tabela de veículos
          const vehicleTableTop = doc.y;
          const colWidth = (doc.page.width - 100) / 5;

          // Cabeçalhos da tabela
          doc.font('Helvetica-Bold').fillColor('#444444');
          doc.text('Placa', 50, vehicleTableTop, { width: colWidth, align: 'left' });
          doc.text('Marca/Modelo', 50 + colWidth, vehicleTableTop, { width: colWidth, align: 'left' });
          doc.text('Ano', 50 + 2 * colWidth, vehicleTableTop, { width: colWidth * 0.7, align: 'left' });
          doc.text('Tipo', 50 + 2.7 * colWidth, vehicleTableTop, { width: colWidth, align: 'left' });
          doc.text('Carroceria', 50 + 3.7 * colWidth, vehicleTableTop, { width: colWidth, align: 'left' });
         
          // Linhas da tabela
          doc.font('Helvetica').fillColor('#000000');
          let y = vehicleTableTop + 20;
          
          driver.vehicles.forEach((vehicle, index) => {
            // Verificar se precisamos de uma nova página
            if (y > doc.page.height - 100) {
              doc.addPage();
              y = 50; // Reiniciar a posição Y
              
              // Repetir cabeçalho
              doc.font('Helvetica-Bold').fillColor('#444444');
              doc.text('Placa', 50, y, { width: colWidth, align: 'left' });
              doc.text('Marca/Modelo', 50 + colWidth, y, { width: colWidth, align: 'left' });
              doc.text('Ano', 50 + 2 * colWidth, y, { width: colWidth * 0.7, align: 'left' });
              doc.text('Tipo', 50 + 2.7 * colWidth, y, { width: colWidth, align: 'left' });
              doc.text('Carroceria', 50 + 3.7 * colWidth, y, { width: colWidth, align: 'left' });
              y += 20;
              doc.font('Helvetica').fillColor('#000000');
            }
            
            // Dados do veículo
            doc.text(vehicle.plate, 50, y, { width: colWidth, align: 'left' });
            doc.text(`${vehicle.brand} ${vehicle.model}`, 50 + colWidth, y, { width: colWidth, align: 'left' });
            doc.text(vehicle.year.toString(), 50 + 2 * colWidth, y, { width: colWidth * 0.7, align: 'left' });
            doc.text(getVehicleTypeDisplayText(vehicle.vehicleType), 50 + 2.7 * colWidth, y, { width: colWidth, align: 'left' });
            doc.text(getBodyTypeDisplayText(vehicle.bodyType), 50 + 3.7 * colWidth, y, { width: colWidth, align: 'left' });
            
            // Linha separadora
            y += 15;
            if (index < driver.vehicles.length - 1) {
              doc.moveTo(50, y).lineTo(doc.page.width - 50, y).stroke('#cccccc');
              y += 10;
            }
          });
        } else if (driver.vehicles && driver.vehicles.length === 0) {
          // Sem veículos
          doc.fillColor('#666666').text('Nenhum veículo vinculado a este motorista.');
        }
      });

      // Número de página
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#999999').text(
          `Página ${i + 1} de ${totalPages}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
      }

      // Finalizar o PDF
      doc.end();

      // Quando o stream terminar, resolver com a URL do Blob
      stream.on('finish', () => {
        const url = stream.toBlobURL('application/pdf');
        resolve(url);
      });

      // Se ocorrer algum erro, rejeitar com o erro
      stream.on('error', (err: any) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}