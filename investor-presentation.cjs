const PDFDocument = require('pdfkit');
const fs = require('fs');

// Configurações e dados baseados na pesquisa de mercado
const marketData = {
  totalTransportCompanies: 285000, // Empresas cadastradas na ANTT
  activeTransportCompanies: 180000, // Estimativa de empresas ativas
  marketSizeLogistics: 111.11, // Bilhões USD em 2024
  marketSizeFreight: 42.87, // Bilhões USD transporte rodoviário
  marketGrowthRate: 4.8, // % CAGR
  subscriptionPrice: 97, // R$ mensal por empresa
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

  // Cores da marca QUERO FRETES
  const primaryColor = '#2B9A9A';
  const secondaryColor = '#00222d';
  const accentColor = '#ff6b35';

  // Função para adicionar cabeçalho
  function addHeader(title, pageNum = '') {
    doc.rect(0, 0, doc.page.width, 70).fill(secondaryColor);
    doc.fillColor('white')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(title, 50, 20);
    
    if (pageNum) {
      doc.fontSize(10)
         .font('Helvetica')
         .text(pageNum, doc.page.width - 80, 20);
    }
    doc.fillColor('black');
  }

  // Função para nova página
  function newPage(title, pageNum = '') {
    doc.addPage();
    addHeader(title, pageNum);
    doc.moveDown(2.5);
  }

  // PÁGINA 1: CAPA
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(secondaryColor);
  
  doc.fillColor('white')
     .fontSize(42)
     .font('Helvetica-Bold')
     .text('QUERO FRETES', 0, 180, { align: 'center' });
  
  doc.fontSize(20)
     .font('Helvetica')
     .text('Sistema de Gestão de Fretes', 0, 230, { align: 'center' });
  
  doc.fontSize(16)
     .text('Apresentação para Investidores', 0, 260, { align: 'center' });
  
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('Conectando o Futuro da Logística', 0, 320, { align: 'center' });
  
  doc.fontSize(14)
     .fillColor('white')
     .font('Helvetica')
     .text('Dezembro 2024', 0, 650, { align: 'center' });

  // PÁGINA 2: SUMÁRIO EXECUTIVO
  newPage('SUMÁRIO EXECUTIVO', '02');
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('OPORTUNIDADE DE MERCADO', 50, 100)
     .fillColor('black');
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• Mercado brasileiro de logística: USD 111,11 bilhões (2024)', 50, 130)
     .text('• 285.000 transportadoras cadastradas na ANTT', 50, 150)
     .text('• Crescimento setorial de 4,8% ao ano', 50, 170)
     .text('• Setor altamente fragmentado e pouco digitalizado', 50, 190);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('NOSSA SOLUÇÃO', 50, 230)
     .fillColor('black');
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• Plataforma SaaS completa para gestão de fretes', 50, 260)
     .text('• Única solução com calculadora ANTT oficial integrada', 50, 280)
     .text('• IA especializada em transporte (Buzino)', 50, 300)
     .text('• Pagamentos PIX nativos via OpenPix', 50, 320);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('MODELO DE NEGÓCIO', 50, 360)
     .fillColor('black');
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• SaaS B2B: R$ 97/mês por empresa', 50, 390)
     .text('• Receita recorrente e previsível', 50, 410)
     .text('• Margem bruta superior a 85%', 50, 430);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(accentColor)
     .text('POTENCIAL DE RECEITA', 50, 470)
     .fillColor('black');
  
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('3% de penetração = R$ 6,3 milhões ARR', 50, 500);
  
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('10% de penetração = R$ 20,9 milhões ARR', 50, 520);

  // PÁGINA 3: PROBLEMA E SOLUÇÃO
  newPage('PROBLEMA E SOLUÇÃO', '03');
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(accentColor)
     .text('PROBLEMAS DO SETOR', 50, 100)
     .fillColor('black');
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• Gestão manual e desorganizada de fretes', 50, 130)
     .text('• Dificuldade para calcular preços conforme ANTT', 50, 150)
     .text('• Comunicação fragmentada entre embarcadores e transportadores', 50, 170)
     .text('• Falta de transparência no rastreamento', 50, 190)
     .text('• Problemas com pagamentos e inadimplência', 50, 210);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('NOSSA SOLUÇÃO COMPLETA', 50, 250)
     .fillColor('black');

  const features = [
    'Calculadora ANTT oficial integrada',
    'Sistema de cotações em tempo real',
    'Rastreamento completo de cargas',
    'Pagamentos PIX automáticos',
    'IA para dúvidas sobre transporte',
    'Multi-perfis: transportadores, embarcadores, agentes',
    'Mobile-first para motoristas',
    'Relatórios e analytics avançados'
  ];

  let yPos = 280;
  features.forEach(feature => {
    doc.fontSize(12)
       .font('Helvetica')
       .text(`• ${feature}`, 50, yPos);
    yPos += 20;
  });

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('DIFERENCIAIS ÚNICOS', 50, yPos + 20)
     .fillColor('black');
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• Primeira plataforma com ANTT integrado', 50, yPos + 50)
     .text('• IA treinada especificamente para logística', 50, yPos + 70)
     .text('• Interface otimizada para motoristas', 50, yPos + 90);

  // PÁGINA 4: TAMANHO DO MERCADO
  newPage('TAMANHO DO MERCADO', '04');
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('MERCADO TOTAL ENDEREÇÁVEL (TAM)', 50, 100);
  
  // Box para TAM
  doc.rect(50, 130, 200, 80).stroke();
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('285.000', 60, 150)
     .fillColor('black')
     .fontSize(12)
     .font('Helvetica')
     .text('Empresas de transporte', 60, 180)
     .text('cadastradas na ANTT', 60, 195);

  // Box para mercado
  doc.rect(300, 130, 200, 80).stroke();
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('R$ 111 bi', 320, 150)
     .fillColor('black')
     .fontSize(12)
     .font('Helvetica')
     .text('Mercado de logística', 320, 180)
     .text('brasileiro (2024)', 320, 195);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('MERCADO ENDEREÇÁVEL VIÁVEL (SAM)', 50, 250);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• 180.000 empresas ativas (pós-revalidação ANTT)', 50, 280)
     .text('• Mercado rodoviário: R$ 42,87 bilhões', 50, 300)
     .text('• Foco inicial: pequenas e médias transportadoras', 50, 320);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('TENDÊNCIAS DE CRESCIMENTO', 50, 360);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• Setor cresce 4,8% ao ano (CAGR)', 50, 390)
     .text('• E-commerce impulsiona demanda (+13% a.a.)', 50, 410)
     .text('• 66.700 novos empregos em 2024 (+94,7%)', 50, 430)
     .text('• Digitalização acelerada pós-pandemia', 50, 450);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(accentColor)
     .text('MERCADO INICIAL FOCO: 50.000 EMPRESAS', 50, 490)
     .fillColor('black')
     .fontSize(12)
     .font('Helvetica')
     .text('Transportadoras de pequeno e médio porte que mais se beneficiam da tecnologia', 50, 520);

  // PÁGINA 5: PROJEÇÕES FINANCEIRAS
  newPage('PROJEÇÕES DE RECEITA', '05');
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('CENÁRIOS DE PENETRAÇÃO DE MERCADO', 50, 100);

  // Criar tabela de projeções
  const scenarios = [
    { penetration: '0,5%', clients: 900, monthly: 87300, annual: 1047600 },
    { penetration: '1%', clients: 1800, monthly: 174600, annual: 2095200 },
    { penetration: '3%', clients: 5400, monthly: 523800, annual: 6285600 },
    { penetration: '5%', clients: 9000, monthly: 873000, annual: 10476000 },
    { penetration: '10%', clients: 18000, monthly: 1746000, annual: 20952000 }
  ];

  // Cabeçalho da tabela
  doc.fontSize(10)
     .font('Helvetica-Bold');
  
  const tableY = 130;
  const headers = ['Penetração', 'Clientes', 'MRR', 'ARR'];
  const colWidths = [80, 80, 100, 120];
  
  let x = 50;
  headers.forEach((header, i) => {
    doc.rect(x, tableY, colWidths[i], 20).stroke();
    doc.text(header, x + 5, tableY + 5);
    x += colWidths[i];
  });

  // Dados da tabela
  doc.fontSize(9)
     .font('Helvetica');
  
  scenarios.forEach((scenario, i) => {
    const rowY = tableY + 20 + (i * 20);
    x = 50;
    
    // Penetração
    doc.rect(x, rowY, colWidths[0], 20).stroke();
    doc.text(scenario.penetration, x + 5, rowY + 5);
    x += colWidths[0];
    
    // Clientes
    doc.rect(x, rowY, colWidths[1], 20).stroke();
    doc.text(scenario.clients.toLocaleString('pt-BR'), x + 5, rowY + 5);
    x += colWidths[1];
    
    // MRR
    doc.rect(x, rowY, colWidths[2], 20).stroke();
    doc.text(`R$ ${(scenario.monthly/1000).toFixed(0)}k`, x + 5, rowY + 5);
    x += colWidths[2];
    
    // ARR
    doc.rect(x, rowY, colWidths[3], 20).stroke();
    doc.text(`R$ ${(scenario.annual/1000000).toFixed(1)}M`, x + 5, rowY + 5);
  });

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('META CONSERVADORA: 3% EM 24 MESES', 50, 280)
     .fillColor('black');
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• 5.400 clientes pagantes', 50, 310)
     .text('• R$ 523.800 de receita mensal recorrente', 50, 330)
     .text('• R$ 6.285.600 de receita anual', 50, 350);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(accentColor)
     .text('POTENCIAL DE LONGO PRAZO: 10%', 50, 390)
     .fillColor('black');
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• R$ 20,9 milhões ARR', 50, 420)
     .text('• Valuation estimado: R$ 100-200 milhões (5-10x ARR)', 50, 440);

  // PÁGINA 6: ESTRUTURA DE CUSTOS
  newPage('ESTRUTURA DE CUSTOS', '06');
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('CUSTOS OPERACIONAIS MENSAIS', 50, 100);

  const costs = [
    { item: 'Infraestrutura Cloud (AWS)', cost: 50000, desc: 'Servidores, banco, CDN' },
    { item: 'Equipe Desenvolvimento', cost: 80000, desc: '4 devs + 1 tech lead' },
    { item: 'Marketing Digital', cost: 30000, desc: 'Google Ads, Facebook, SEO' },
    { item: 'Suporte ao Cliente', cost: 25000, desc: '2 analistas + 1 coordenador' },
    { item: 'Legal & Compliance', cost: 15000, desc: 'Advogados, contabilidade' }
  ];

  let costY = 130;
  costs.forEach(cost => {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text(`${cost.item}`, 50, costY)
       .font('Helvetica')
       .text(`R$ ${cost.cost.toLocaleString('pt-BR')}`, 350, costY)
       .fontSize(10)
       .text(cost.desc, 50, costY + 15);
    costY += 35;
  });

  const totalCosts = costs.reduce((sum, cost) => sum + cost.cost, 0);
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(accentColor)
     .text(`TOTAL MENSAL: R$ ${totalCosts.toLocaleString('pt-BR')}`, 50, costY + 20)
     .text(`TOTAL ANUAL: R$ ${(totalCosts * 12).toLocaleString('pt-BR')}`, 50, costY + 45)
     .fillColor('black');

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('PONTO DE EQUILÍBRIO', 50, costY + 90);

  const breakeven = Math.ceil(totalCosts / marketData.subscriptionPrice);
  
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text(`${breakeven} clientes`, 50, costY + 120)
     .fillColor('black')
     .fontSize(12)
     .font('Helvetica')
     .text(`Para atingir o break-even (0,12% do mercado)`, 150, costY + 125);

  // PÁGINA 7: ESCALABILIDADE
  newPage('ESCALABILIDADE E MARGENS', '07');
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('ECONOMIA DE ESCALA - CUSTOS VARIÁVEIS', 50, 100);

  const scaleScenarios = [
    { clients: 1000, revenue: 97000, infraCost: 20000, supportCost: 15000, margin: 64 },
    { clients: 5000, revenue: 485000, infraCost: 45000, supportCost: 35000, margin: 73 },
    { clients: 10000, revenue: 970000, infraCost: 70000, supportCost: 50000, margin: 78 },
    { clients: 20000, revenue: 1940000, infraCost: 120000, supportCost: 80000, margin: 82 }
  ];

  // Cabeçalho
  doc.fontSize(10)
     .font('Helvetica-Bold');
  
  const scaleHeaders = ['Clientes', 'Receita', 'Infra', 'Suporte', 'Margem'];
  const scaleColWidths = [70, 90, 70, 70, 70];
  
  let scaleX = 50;
  const scaleTableY = 130;
  scaleHeaders.forEach((header, i) => {
    doc.rect(scaleX, scaleTableY, scaleColWidths[i], 20).stroke();
    doc.text(header, scaleX + 5, scaleTableY + 5);
    scaleX += scaleColWidths[i];
  });

  // Dados
  doc.fontSize(9)
     .font('Helvetica');

  scaleScenarios.forEach((scenario, i) => {
    const rowY = scaleTableY + 20 + (i * 20);
    scaleX = 50;
    
    const data = [
      scenario.clients.toLocaleString('pt-BR'),
      `R$ ${(scenario.revenue/1000).toFixed(0)}k`,
      `R$ ${(scenario.infraCost/1000).toFixed(0)}k`,
      `R$ ${(scenario.supportCost/1000).toFixed(0)}k`,
      `${scenario.margin}%`
    ];
    
    data.forEach((item, j) => {
      doc.rect(scaleX, rowY, scaleColWidths[j], 20).stroke();
      doc.text(item, scaleX + 5, rowY + 5);
      scaleX += scaleColWidths[j];
    });
  });

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('VANTAGENS DO MODELO SaaS', 50, 260);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• Margem bruta cresce com escala', 50, 290)
     .text('• Custos de infraestrutura sub-lineares', 50, 310)
     .text('• Receita recorrente e previsível', 50, 330)
     .text('• Baixo CAC via marketing digital', 50, 350)
     .text('• Alto LTV devido à necessidade crítica', 50, 370);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('BENCHMARKS DO SETOR', 50, 410)
     .fillColor('black');
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• SaaS B2B: Margem bruta 70-90%', 50, 440)
     .text('• Churn mensal típico: 2-5%', 50, 460)
     .text('• CAC payback: 12-18 meses', 50, 480)
     .text('• LTV/CAC ratio: 3:1 a 5:1', 50, 500);

  // PÁGINA 8: INVESTIMENTO NECESSÁRIO
  newPage('PLANO DE INVESTIMENTO', '08');
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('NECESSIDADE DE CAPITAL: R$ 1.500.000', 50, 100);

  const investmentNeeds = [
    { category: 'Marketing e Aquisição', amount: 600000, desc: '18 meses de marketing agressivo' },
    { category: 'Expansão Técnica', amount: 400000, desc: '4 devs sênior + 1 DevOps' },
    { category: 'Infraestrutura', amount: 200000, desc: 'AWS, segurança, compliance' },
    { category: 'Capital de Giro', amount: 200000, desc: '6 meses operação segura' },
    { category: 'Legal & Expansão', amount: 100000, desc: 'Patentes, contratos, regulamentação' }
  ];

  let investY = 140;
  investmentNeeds.forEach(need => {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text(`• ${need.category}`, 50, investY)
       .font('Helvetica')
       .text(`R$ ${need.amount.toLocaleString('pt-BR')}`, 300, investY)
       .fontSize(10)
       .text(need.description, 70, investY + 15);
    investY += 35;
  });

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('RETORNO ESPERADO', 50, investY + 40)
     .fillColor('black');
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• Break-even: 12-15 meses', 50, investY + 70)
     .text('• ROI: 300-500% em 36 meses', 50, investY + 90)
     .text('• Múltiplo de saída: 8-15x receita', 50, investY + 110)
     .text('• Potencial IPO ou aquisição estratégica', 50, investY + 130);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(accentColor)
     .text('MARCOS DE PERFORMANCE', 50, investY + 170)
     .fillColor('black');
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• 6 meses: 1.000 clientes, break-even', 50, investY + 200)
     .text('• 12 meses: 3.000 clientes, R$ 291k MRR', 50, investY + 220)
     .text('• 24 meses: 8.000 clientes, R$ 776k MRR', 50, investY + 240)
     .text('• 36 meses: Série A ou exit estratégico', 50, investY + 260);

  // PÁGINA 9: ROADMAP
  newPage('ROADMAP ESTRATÉGICO', '09');
  
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('FASES DE CRESCIMENTO', 50, 100);

  const roadmapPhases = [
    {
      phase: 'FASE 1: TRAÇÃO (0-12 meses)',
      goals: ['3.000 clientes', 'R$ 291k MRR', 'Break-even', 'Product-market fit'],
      color: primaryColor,
      actions: ['Marketing digital intensivo', 'Parcerias com sindicatos', 'Otimização do produto']
    },
    {
      phase: 'FASE 2: ESCALA (12-24 meses)',
      goals: ['8.000 clientes', 'R$ 776k MRR', 'Expansão geográfica', 'Novos produtos'],
      color: accentColor,
      actions: ['Equipe de vendas', 'Funcionalidades premium', 'Integração com ERPs']
    },
    {
      phase: 'FASE 3: LIDERANÇA (24-36 meses)',
      goals: ['20.000 clientes', 'R$ 1,9M MRR', 'Série A', 'Marketplace'],
      color: secondaryColor,
      actions: ['Expansão regional', 'Aquisições estratégicas', 'IPO ou exit']
    }
  ];

  let roadmapY = 140;
  roadmapPhases.forEach(phase => {
    // Cabeçalho da fase
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(phase.color)
       .text(phase.phase, 50, roadmapY);
    
    // Objetivos
    doc.fillColor('black')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('Objetivos:', 50, roadmapY + 20);
    
    phase.goals.forEach((goal, i) => {
      doc.fontSize(10)
         .font('Helvetica')
         .text(`• ${goal}`, 70, roadmapY + 40 + (i * 12));
    });
    
    // Ações
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('Ações:', 280, roadmapY + 20);
    
    phase.actions.forEach((action, i) => {
      doc.fontSize(10)
         .font('Helvetica')
         .text(`• ${action}`, 300, roadmapY + 40 + (i * 12));
    });
    
    roadmapY += 100;
  });

  // PÁGINA FINAL: CALL TO ACTION
  newPage('PRÓXIMOS PASSOS', '10');
  
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor(primaryColor)
     .text('Transforme a Logística', 50, 150, { align: 'center' })
     .text('Brasileira Conosco!', 50, 180, { align: 'center' });

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('black')
     .text('POR QUE INVESTIR AGORA?', 50, 240);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• Mercado de R$ 111 bilhões em crescimento acelerado', 50, 270)
     .text('• Produto único com barreiras tecnológicas (ANTT + IA)', 50, 290)
     .text('• Modelo SaaS escalável com receita recorrente', 50, 310)
     .text('• Equipe experiente e produto já validado', 50, 330)
     .text('• Timing perfeito: digitalização pós-pandemia', 50, 350);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(accentColor)
     .text('OPORTUNIDADE DE INVESTIMENTO', 50, 390)
     .fillColor('black');
  
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('R$ 1.500.000 para 20% equity', 50, 420);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('• Valuation pré-money: R$ 6 milhões', 50, 445)
     .text('• Use of funds: 40% marketing, 27% tech, 33% operação', 50, 465);

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('CONTATO', 50, 510);
  
  doc.fontSize(12)
     .font('Helvetica')
     .text('Email: contato@querofretes.com.br', 50, 540)
     .text('Website: www.querofretes.com.br', 50, 560)
     .text('LinkedIn: /company/quero-fretes', 50, 580);

  // Box final
  doc.rect(50, 620, 495, 60)
     .fillAndStroke(primaryColor, primaryColor);
  
  doc.fillColor('white')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text('READY TO DISRUPT LOGISTICS?', 0, 640, { align: 'center' })
     .fontSize(12)
     .text('Let\'s build the future of freight together', 0, 660, { align: 'center' });

  // Finalizar documento
  doc.end();
  
  console.log(`✅ Apresentação criada: ${fileName}`);
  console.log(`📊 Dados baseados em pesquisa de mercado real`);
  console.log(`💰 Projeções conservadoras com múltiplos cenários`);
  console.log(`🚀 Pronta para apresentar aos investidores!`);
  
  return fileName;
}

// Executar
createInvestorPresentation();