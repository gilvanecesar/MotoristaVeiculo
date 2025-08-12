const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Configurações e dados
const marketData = {
  totalTransportCompanies: 285000, // Empresas cadastradas na ANTT
  activeTransportCompanies: 180000, // Estimativa de empresas ativas após revalidação
  marketSizeLogistics: 111.11, // Bilhões USD em 2024
  marketSizeFreight: 42.87, // Bilhões USD transporte rodoviário
  marketGrowthRate: 4.8, // % CAGR
  subscriptionPrice: 97, // R$ mensal por empresa
  penetrationRates: [0.5, 1, 3, 5, 10], // % de penetração de mercado
  operationalCosts: {
    infrastructure: 50000, // R$ mensais
    development: 80000, // R$ mensais
    marketing: 30000, // R$ mensais
    support: 25000, // R$ mensais
    legal: 15000 // R$ mensais
  }
};

function createInvestorPresentation() {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const fileName = 'QUERO_FRETES_Apresentacao_Investidores.pdf';
  
  doc.pipe(fs.createWriteStream(fileName));

  // Cores da marca
  const primaryColor = '#2B9A9A';
  const secondaryColor = '#00222d';
  const accentColor = '#ff6b35';

  // Função para adicionar cabeçalho
  function addHeader(title) {
    doc.rect(0, 0, doc.page.width, 80).fill(secondaryColor);
    doc.fillColor('white')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text(title, 50, 25);
    doc.fillColor('black');
  }

  // Função para nova página
  function newPage(title) {
    doc.addPage();
    addHeader(title);
    doc.moveDown(3);
  }

  // PÁGINA 1: CAPA
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(secondaryColor);
  
  doc.fillColor('white')
     .fontSize(36)
     .font('Helvetica-Bold')
     .text('QUERO FRETES', 50, 150, { align: 'center' });
  
  doc.fontSize(18)
     .font('Helvetica')
     .text('Sistema de Gestão de Fretes', 50, 200, { align: 'center' });
  
  doc.fontSize(14)
     .text('Apresentação para Investidores', 50, 240, { align: 'center' });
  
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('Conectando o Futuro da Logística', 50, 300, { align: 'center' });
  
  doc.fontSize(12)
     .fillColor('white')
     .font('Helvetica')
     .text(`Dezembro 2024`, 50, 700, { align: 'center' });

  // PÁGINA 2: VISÃO GERAL DO NEGÓCIO
  newPage('VISÃO GERAL DO NEGÓCIO');
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('O QUE É O QUERO FRETES', 50, 120);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• Plataforma SaaS para gestão completa de fretes e logística', 50, 150)
     .text('• Conecta transportadores, embarcadores e agenciadores', 50, 170)
     .text('• Sistema integrado com PIX, calculadora ANTT e IA', 50, 190)
     .text('• Solução completa: cotações, rastreamento, gestão financeira', 50, 210);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('DIFERENCIAIS COMPETITIVOS', 50, 250);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• Única plataforma com calculadora ANTT oficial integrada', 50, 280)
     .text('• Assistente IA especializado em transporte (Buzino)', 50, 300)
     .text('• Integração nativa com OpenPix para pagamentos PIX', 50, 320)
     .text('• Interface mobile-first otimizada para motoristas', 50, 340)
     .text('• Sistema de multi-perfis: transportadores, embarcadores, agentes', 50, 360);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('MODELO DE NEGÓCIO', 50, 400);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• Assinatura mensal recorrente: R$ 97/empresa', 50, 430)
     .text('• Período de teste gratuito de 7 dias', 50, 450)
     .text('• Receita previsível e escalável (SaaS)', 50, 470)
     .text('• Margem bruta superior a 85%', 50, 490);

  // PÁGINA 3: TAMANHO DO MERCADO
  newPage('TAMANHO DO MERCADO');
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('MERCADO TOTAL ENDEREÇÁVEL (TAM)', 50, 120);
  
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('285.000 empresas', 50, 150)
     .fillColor('black')
     .fontSize(12)
     .font('Helvetica')
     .text('Transportadoras cadastradas na ANTT (2024)', 50, 170);

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('R$ 111,11 bilhões', 300, 150)
     .fillColor('black')
     .fontSize(12)
     .font('Helvetica')
     .text('Mercado de logística brasileiro', 300, 170);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('MERCADO ENDEREÇÁVEL VIÁVEL (SAM)', 50, 220);
  
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('180.000 empresas', 50, 250)
     .fillColor('black')
     .fontSize(12)
     .font('Helvetica')
     .text('Transportadoras ativas (estimativa pós-revalidação)', 50, 270);

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('R$ 42,87 bilhões', 300, 250)
     .fillColor('black')
     .fontSize(12)
     .font('Helvetica')
     .text('Transporte rodoviário de cargas', 300, 270);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('CRESCIMENTO DO SETOR', 50, 320);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• Crescimento anual de 4,8% (CAGR)', 50, 350)
     .text('• Gastos com transporte: R$ 940 bilhões em 2024 (+7%)', 50, 370)
     .text('• 66.700 novos empregos em 10 meses (+94,7%)', 50, 390)
     .text('• E-commerce crescendo 13% ao ano, impulsionando demanda', 50, 410);

  // PÁGINA 4: PROJEÇÕES DE RECEITA
  newPage('PROJEÇÕES DE RECEITA');
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('CENÁRIOS DE PENETRAÇÃO DE MERCADO', 50, 120);

  // Tabela de projeções
  const tableY = 160;
  const colWidths = [100, 80, 100, 100];
  const headers = ['Penetração', 'Clientes', 'Receita Mensal', 'Receita Anual'];
  
  // Cabeçalho da tabela
  doc.fontSize(10)
     .font('Helvetica-Bold');
  
  let x = 50;
  headers.forEach((header, i) => {
    doc.text(header, x, tableY, { width: colWidths[i], align: 'center' });
    x += colWidths[i];
  });

  // Dados da tabela
  doc.fontSize(10)
     .font('Helvetica');
  
  const scenarios = [
    { penetration: '0,5%', clients: 900, monthly: 87300, annual: 1047600 },
    { penetration: '1%', clients: 1800, monthly: 174600, annual: 2095200 },
    { penetration: '3%', clients: 5400, monthly: 523800, annual: 6285600 },
    { penetration: '5%', clients: 9000, monthly: 873000, annual: 10476000 },
    { penetration: '10%', clients: 18000, monthly: 1746000, annual: 20952000 }
  ];

  scenarios.forEach((scenario, i) => {
    const rowY = tableY + 30 + (i * 20);
    doc.text(scenario.penetration, 50, rowY, { width: 100, align: 'center' })
       .text(scenario.clients.toLocaleString('pt-BR'), 150, rowY, { width: 80, align: 'center' })
       .text(`R$ ${scenario.monthly.toLocaleString('pt-BR')}`, 230, rowY, { width: 100, align: 'center' })
       .text(`R$ ${scenario.annual.toLocaleString('pt-BR')}`, 330, rowY, { width: 100, align: 'center' });
  });

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(accentColor)
     .text('META REALISTA: 3% em 24 meses', 50, 320)
     .fillColor('black')
     .fontSize(12)
     .font('Helvetica')
     .text('• 5.400 clientes pagantes', 50, 350)
     .text('• R$ 523.800 de receita mensal recorrente', 50, 370)
     .text('• R$ 6.285.600 de receita anual', 50, 390);

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('POTENCIAL DE LONGO PRAZO: 10%', 50, 430)
     .fillColor('black')
     .fontSize(12)
     .font('Helvetica')
     .text('• R$ 20,9 milhões de receita anual recorrente', 50, 460)
     .text('• Valuation estimado: R$ 100-200 milhões (5-10x ARR)', 50, 480);

  // PÁGINA 5: CUSTOS OPERACIONAIS
  newPage('ESTRUTURA DE CUSTOS');
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('CUSTOS OPERACIONAIS MENSAIS', 50, 120);

  const costs = [
    { item: 'Infraestrutura Cloud (AWS)', cost: 50000 },
    { item: 'Equipe de Desenvolvimento', cost: 80000 },
    { item: 'Marketing Digital', cost: 30000 },
    { item: 'Suporte ao Cliente', cost: 25000 },
    { item: 'Legal & Compliance', cost: 15000 }
  ];

  let costY = 160;
  costs.forEach(cost => {
    doc.fontSize(12)
       .font('Helvetica')
       .text(`• ${cost.item}`, 50, costY)
       .text(`R$ ${cost.cost.toLocaleString('pt-BR')}`, 350, costY);
    costY += 20;
  });

  const totalCosts = costs.reduce((sum, cost) => sum + cost.cost, 0);
  
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text(`TOTAL MENSAL: R$ ${totalCosts.toLocaleString('pt-BR')}`, 50, costY + 20)
     .text(`TOTAL ANUAL: R$ ${(totalCosts * 12).toLocaleString('pt-BR')}`, 50, costY + 45);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('PONTO DE EQUILÍBRIO', 50, costY + 90);

  const breakeven = Math.ceil(totalCosts / marketData.subscriptionPrice);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text(`• ${breakeven} clientes pagantes para atingir o break-even`, 50, costY + 120)
     .text(`• Representa 0,12% do mercado total`, 50, costY + 140)
     .text(`• Meta alcançável em 6-12 meses com marketing eficiente`, 50, costY + 160);

  // PÁGINA 6: ESCALABILIDADE DE CUSTOS
  newPage('ESCALABILIDADE E MARGENS');
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('CUSTOS POR NÚMERO DE CLIENTES', 50, 120);

  const scaleScenarios = [
    { clients: 1000, infraCost: 15000, supportCost: 20000 },
    { clients: 5000, infraCost: 35000, supportCost: 40000 },
    { clients: 10000, infraCost: 60000, supportCost: 60000 },
    { clients: 20000, infraCost: 100000, supportCost: 80000 }
  ];

  // Cabeçalho da tabela de escalabilidade
  const scaleHeaders = ['Clientes', 'Receita', 'Infra.', 'Suporte', 'Margem'];
  const scaleColWidths = [80, 100, 80, 80, 100];
  
  doc.fontSize(10)
     .font('Helvetica-Bold');
  
  let scaleX = 50;
  scaleHeaders.forEach((header, i) => {
    doc.text(header, scaleX, 160, { width: scaleColWidths[i], align: 'center' });
    scaleX += scaleColWidths[i];
  });

  doc.fontSize(10)
     .font('Helvetica');

  scaleScenarios.forEach((scenario, i) => {
    const revenue = scenario.clients * marketData.subscriptionPrice;
    const totalScaleCosts = scenario.infraCost + scenario.supportCost + 110000; // Outros custos fixos
    const margin = ((revenue - totalScaleCosts) / revenue * 100).toFixed(1);
    
    const rowY = 180 + (i * 20);
    doc.text(scenario.clients.toLocaleString('pt-BR'), 50, rowY, { width: 80, align: 'center' })
       .text(`R$ ${revenue.toLocaleString('pt-BR')}`, 130, rowY, { width: 100, align: 'center' })
       .text(`R$ ${scenario.infraCost.toLocaleString('pt-BR')}`, 230, rowY, { width: 80, align: 'center' })
       .text(`R$ ${scenario.supportCost.toLocaleString('pt-BR')}`, 310, rowY, { width: 80, align: 'center' })
       .text(`${margin}%`, 390, rowY, { width: 100, align: 'center' });
  });

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('VANTAGENS DA ESCALABILIDADE SaaS', 50, 300);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• Margem bruta aumenta com escala (economia de rede)', 50, 330)
     .text('• Custos de infraestrutura crescem sub-linearmente', 50, 350)
     .text('• Receita recorrente garante previsibilidade', 50, 370)
     .text('• Baixo custo de aquisição de cliente via marketing digital', 50, 390);

  // PÁGINA 7: INVESTIMENTO NECESSÁRIO
  newPage('INVESTIMENTO E USO DE RECURSOS');
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('NECESSIDADE DE INVESTIMENTO', 50, 120);

  const investmentNeeds = [
    { category: 'Marketing e Aquisição de Clientes', amount: 500000, description: '12 meses de marketing agressivo' },
    { category: 'Expansão da Equipe Técnica', amount: 400000, description: '4 desenvolvedores + 1 DevOps' },
    { category: 'Infraestrutura e Tecnologia', amount: 200000, description: 'Servidores, licenças, segurança' },
    { category: 'Capital de Giro', amount: 300000, description: '6 meses de operação segura' },
    { category: 'Legal e Compliance', amount: 100000, description: 'Adequações regulatórias' }
  ];

  let investY = 160;
  investmentNeeds.forEach(need => {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text(`• ${need.category}`, 50, investY)
       .font('Helvetica')
       .text(`R$ ${need.amount.toLocaleString('pt-BR')}`, 350, investY)
       .fontSize(10)
       .text(need.description, 70, investY + 15);
    investY += 35;
  });

  const totalInvestment = investmentNeeds.reduce((sum, need) => sum + need.amount, 0);
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(accentColor)
     .text(`TOTAL: R$ ${totalInvestment.toLocaleString('pt-BR')}`, 50, investY + 20)
     .fillColor('black');

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('RETORNO ESPERADO', 50, investY + 60);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• Break-even em 12-18 meses', 50, investY + 90)
     .text('• ROI de 300-500% em 3 anos', 50, investY + 110)
     .text('• Potencial de IPO ou aquisição estratégica', 50, investY + 130);

  // PÁGINA 8: ROADMAP E PRÓXIMOS PASSOS
  newPage('ROADMAP E PRÓXIMOS PASSOS');
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('FASES DE CRESCIMENTO', 50, 120);

  const phases = [
    {
      phase: 'Fase 1 (0-6 meses)',
      goals: ['1.000 clientes', 'R$ 97.000 MRR', 'Break-even operacional'],
      color: primaryColor
    },
    {
      phase: 'Fase 2 (6-18 meses)',
      goals: ['5.000 clientes', 'R$ 485.000 MRR', 'Expansão para agenciadores'],
      color: accentColor
    },
    {
      phase: 'Fase 3 (18-36 meses)',
      goals: ['18.000 clientes', 'R$ 1.746.000 MRR', 'Série A / Expansão regional'],
      color: secondaryColor
    }
  ];

  let phaseY = 160;
  phases.forEach(phase => {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(phase.color)
       .text(phase.phase, 50, phaseY)
       .fillColor('black')
       .fontSize(12)
       .font('Helvetica');
    
    phase.goals.forEach((goal, i) => {
      doc.text(`• ${goal}`, 70, phaseY + 25 + (i * 15));
    });
    
    phaseY += 100;
  });

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('PRÓXIMOS PASSOS IMEDIATOS', 50, phaseY + 20);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• Captação de R$ 1,5M para acelerar crescimento', 50, phaseY + 50)
     .text('• Contratação de 3 desenvolvedores sênior', 50, phaseY + 70)
     .text('• Campanha de marketing digital para transportadoras', 50, phaseY + 90)
     .text('• Parcerias estratégicas com sindicatos de transporte', 50, phaseY + 110)
     .text('• Integração com novos meios de pagamento', 50, phaseY + 130);

  // PÁGINA FINAL: CONTATO
  newPage('CONTATO E PRÓXIMOS PASSOS');
  
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('Vamos Revolucionar a', 50, 150, { align: 'center' })
     .text('Logística Brasileira Juntos!', 50, 180, { align: 'center' });

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('black')
     .text('OPORTUNIDADE DE INVESTIMENTO', 50, 250);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• Mercado de R$ 111 bilhões com crescimento de 4,8% ao ano', 50, 280)
     .text('• Solução única no mercado com IA e integração ANTT', 50, 300)
     .text('• Modelo SaaS escalável com receita recorrente', 50, 320)
     .text('• Equipe experiente e produto já validado no mercado', 50, 340);

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('ENTRE EM CONTATO:', 50, 380);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('Email: contato@querofretes.com.br', 50, 410)
     .text('Website: www.querofretes.com.br', 50, 430)
     .text('Telefone: (11) 99999-9999', 50, 450);

  doc.rect(50, 500, 495, 100)
     .fillAndStroke(primaryColor, primaryColor);
  
  doc.fillColor('white')
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('PRONTO PARA TRANSFORMAR O', 50, 530, { align: 'center' })
     .text('FUTURO DA LOGÍSTICA?', 50, 550, { align: 'center' });

  // Finalizar documento
  doc.end();
  
  console.log(`✅ Apresentação criada: ${fileName}`);
  return fileName;
}

// Executar a criação da apresentação
if (require.main === module) {
  createInvestorPresentation();
}

module.exports = { createInvestorPresentation };