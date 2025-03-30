// Modificação da rota de faturas para remover dados de demonstração
// Parte 1 - Rota de faturas
app.get("/api/admin/invoices", isAdmin, async (req: Request, res: Response) => {
  try {
    // Buscar todas as faturas do banco de dados
    const dbInvoices = await storage.getInvoices();
    
    if (!dbInvoices || !Array.isArray(dbInvoices) || dbInvoices.length === 0) {
      // Se não houver faturas, retornar um array vazio em vez de criar dados de demonstração
      return res.json([]);
    }
    
    // Formatar as faturas para enviar ao frontend
    const formattedInvoices = await Promise.all(dbInvoices.map(async (invoice) => {
      let clientName = 'Não associado';
      let email = 'Email não disponível';
      
      const user = await storage.getUserById(invoice.userId);
      if (user) {
        clientName = user.name;
        email = user.email;
        
        if (invoice.clientId) {
          const client = await storage.getClient(invoice.clientId);
          if (client) {
            clientName = client.name;
            email = client.email || email;
          }
        }
      }
      
      return {
        id: invoice.id.toString(),
        clientName,
        email,
        amount: Number(invoice.amount),
        status: invoice.status,
        date: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString() : new Date().toISOString()
      };
    }));
    
    return res.json(formattedInvoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ message: "Failed to fetch invoices" });
  }
});

// Parte 2 - Rota de estatísticas financeiras
app.get("/api/admin/finance/stats", isAdmin, async (req: Request, res: Response) => {
  try {
    // Buscar dados do banco de dados
    const subscriptionsDb = await storage.getSubscriptions();
    const invoicesDb = await storage.getInvoices();
    
    if (!subscriptionsDb || subscriptionsDb.length === 0) {
      // Se não houver assinaturas no banco, retornar zeros em vez de dados simulados
      return res.json({
        totalRevenue: 0,
        monthlyRevenue: 0,
        activeSubscriptions: 0,
        churnRate: 0,
        monthlyData: [
          { month: "Jan", revenue: 0 },
          { month: "Fev", revenue: 0 },
          { month: "Mar", revenue: 0 },
          { month: "Abr", revenue: 0 },
          { month: "Mai", revenue: 0 },
          { month: "Jun", revenue: 0 },
          { month: "Jul", revenue: 0 },
          { month: "Ago", revenue: 0 },
          { month: "Set", revenue: 0 },
          { month: "Out", revenue: 0 },
          { month: "Nov", revenue: 0 },
          { month: "Dez", revenue: 0 },
        ],
        subscriptionsByStatus: [
          { status: "Ativas", count: 0 },
          { status: "Teste", count: 0 },
          { status: "Canceladas", count: 0 },
          { status: "Atrasadas", count: 0 }
        ]
      });
    }
    
    // Calcular estatísticas com base em dados reais do banco
    const activeSubscriptions = subscriptionsDb.filter(s => s.status === 'active').length;
    const trialing = subscriptionsDb.filter(s => s.status === 'trialing').length;
    const canceled = subscriptionsDb.filter(s => s.status === 'canceled').length;
    const pastDue = subscriptionsDb.filter(s => s.status === 'past_due').length;
    
    // Calcular receita total baseada nas faturas pagas
    const paidInvoices = invoicesDb.filter(i => i.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    
    // Calcular receita mensal (média dos últimos 3 meses)
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    
    const recentInvoices = paidInvoices.filter(invoice => {
      return invoice.paidAt && new Date(invoice.paidAt) >= threeMonthsAgo;
    });
    
    const monthlyRevenue = recentInvoices.length > 0
      ? recentInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0) / 3
      : 0;
    
    // Taxa de cancelamento (churn)
    const totalSubscriptions = subscriptionsDb.length;
    const churnRate = totalSubscriptions > 0
      ? (canceled / totalSubscriptions) * 100
      : 0;
    
    // Agrupar receita por mês para os últimos 12 meses
    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);
    
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const monthlyData = monthNames.map(month => ({ month, revenue: 0 }));
    
    // Processar as faturas pagas para montar o gráfico de receita mensal
    paidInvoices.forEach(invoice => {
      if (invoice.paidAt) {
        const paidDate = new Date(invoice.paidAt);
        if (paidDate >= lastYear) {
          const monthIndex = paidDate.getMonth();
          monthlyData[monthIndex].revenue += Number(invoice.amount);
        }
      }
    });
    
    // Arredondar valores para 2 casas decimais
    monthlyData.forEach(data => {
      data.revenue = parseFloat(data.revenue.toFixed(2));
    });
    
    const stats = {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
      activeSubscriptions,
      churnRate: parseFloat(churnRate.toFixed(1)),
      monthlyData,
      subscriptionsByStatus: [
        { status: "Ativas", count: activeSubscriptions },
        { status: "Teste", count: trialing },
        { status: "Canceladas", count: canceled },
        { status: "Atrasadas", count: pastDue }
      ]
    };
    
    res.json(stats);
  } catch (error: any) {
    console.error("Error fetching finance stats:", error);
    res.status(500).json({ message: "Failed to fetch finance statistics: " + error.message });
  }
});

// Parte 3 - Rota de assinaturas
app.get("/api/admin/subscriptions", isAdmin, async (req: Request, res: Response) => {
  try {
    // Buscar assinaturas do banco de dados
    const dbSubscriptions = await storage.getSubscriptions();
    
    if (!dbSubscriptions || !Array.isArray(dbSubscriptions) || dbSubscriptions.length === 0) {
      // Se não houver assinaturas, retornar array vazio em vez de dados simulados
      return res.json([]);
    }
    
    // Formatar os dados das assinaturas para a resposta da API
    const formattedSubscriptions = await Promise.all(dbSubscriptions.map(async (subscription) => {
      // Buscar informações de cliente e usuário associados
      let clientName = 'Cliente não associado';
      let email = 'Email não disponível';
      
      if (subscription.clientId) {
        const client = await storage.getClient(subscription.clientId);
        if (client) {
          clientName = client.name;
          email = client.email;
        }
      } else if (subscription.userId) {
        const user = await storage.getUserById(subscription.userId);
        if (user) {
          clientName = user.name;
          email = user.email;
        }
      }
      
      // Buscar faturas desta assinatura para calcular o valor total
      const invoices = await storage.getInvoicesBySubscription(subscription.id);
      const amount = invoices.reduce((total, inv) => total + Number(inv.amount), 0);
      
      return {
        id: subscription.id.toString(),
        clientId: subscription.clientId,
        clientName,
        email,
        plan: subscription.planType || 'monthly',
        status: subscription.status,
        amount: Number(amount || 0),
        startDate: subscription.currentPeriodStart?.toISOString() || new Date().toISOString(),
        endDate: subscription.currentPeriodEnd?.toISOString() || new Date().toISOString(),
        invoiceCount: invoices.length,
      };
    }));
    
    return res.json(formattedSubscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ message: "Failed to fetch subscriptions" });
  }
});