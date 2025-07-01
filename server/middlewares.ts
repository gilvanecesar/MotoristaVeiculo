import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Middleware para verificar se o usuário está autenticado
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Não autenticado" });
}

// Middleware para verificar se o usuário está ativo
export function isActive(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  
  if (req.user?.isActive === false) {
    return res.status(403).json({ 
      message: "Sua conta está desativada. Entre em contato com o administrador para mais informações."
    });
  }
  
  return next();
}

// Middleware para verificar se a assinatura do usuário está ativa e não expirada
export function hasActiveSubscription(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  // Verificar se o usuário tem dados de assinatura
  const user = req.user;
  
  // Se for administrador, sempre tem acesso
  if (user.profileType === "administrador" || user.profileType === "admin") {
    return next();
  }
  
  // Se for motorista, permitir acesso (motoristas têm acesso livre ao sistema)
  if (user.profileType === "motorista" || user.profileType === "driver") {
    return next();
  }
  
  // Verificar se a assinatura está marcada como ativa
  if (user.subscriptionActive !== true) {
    // Verificamos todos os perfis que precisam de assinatura após 7 dias (agente, embarcador, transportador)
    const needsSubscriptionProfiles = ["agente", "agent", "embarcador", "shipper", "transportador", "carrier"];
    
    if (needsSubscriptionProfiles.includes(user.profileType?.toLowerCase())) {
      // Verificar se passou dos 7 dias de cadastro
      const createdAt = new Date(user.createdAt);
      const currentDate = new Date();
      const trialDays = 7; // Período de teste de 7 dias
      
      // Calcula a data de expiração baseada na data de criação + 7 dias
      const calculatedExpirationDate = new Date(createdAt);
      calculatedExpirationDate.setDate(calculatedExpirationDate.getDate() + trialDays);
      
      console.log(`[hasActiveSubscription] Verificando acesso 7 dias: User ID ${user.id}, Profile: ${user.profileType}, Criado em: ${createdAt.toISOString()}, Calculada expiração: ${calculatedExpirationDate.toISOString()}`);
      
      // Se a data atual for maior que a data calculada de expiração
      if (currentDate > calculatedExpirationDate) {
        console.log(`[hasActiveSubscription] Usuário ID ${user.id} com perfil ${user.profileType} passou dos 7 dias sem assinatura ativa`);
        
        // Atualiza o usuário para marcar que precisa de pagamento
        storage.updateUser(user.id, { 
          paymentRequired: true
        })
          .then(() => {
            console.log(`[hasActiveSubscription] Usuário ID ${user.id} marcado como paymentRequired no banco de dados`);
          })
          .catch(err => console.error("Erro ao marcar usuário como paymentRequired:", err));
        
        return res.status(402).json({ 
          code: "subscription_required",
          message: "Período de acesso gratuito encerrado. Por favor, adquira um plano para continuar."
        });
      }
    }
    
    return res.status(402).json({ 
      code: "subscription_required",
      message: "Assinatura necessária. Por favor, adquira um plano para continuar."
    });
  }
  
  // Verificar se a assinatura expirou (exceto para driver_free)
  if (user.subscriptionType !== "driver_free" && user.subscriptionExpiresAt) {
    const subscriptionExpiresAt = new Date(user.subscriptionExpiresAt);
    const currentDate = new Date();
    
    console.log(`[hasActiveSubscription] Verificando: User ID ${user.id}, Tipo: ${user.subscriptionType}, Expira em: ${subscriptionExpiresAt.toISOString()}, Data atual: ${currentDate.toISOString()}`);
    
    if (subscriptionExpiresAt < currentDate) {
      console.log(`[hasActiveSubscription] Assinatura expirou para usuário ID ${user.id}`);
      
      // Automaticamente desativa a assinatura quando expirada
      storage.updateUser(user.id, { 
        subscriptionActive: false,
        paymentRequired: true
      })
        .then(() => {
          console.log(`[hasActiveSubscription] Usuário ID ${user.id} marcado como expirado no banco de dados`);
        })
        .catch(err => console.error("Erro ao desativar assinatura expirada:", err));
      
      return res.status(402).json({ 
        code: "subscription_expired",
        message: "Sua assinatura expirou. Por favor, renove seu plano para continuar."
      });
    }
  }
  
  // Verificação adicional para usuários com período de teste
  // Mesmo que não tenha data de expiração definida, verificamos pela data de criação
  if (user.subscriptionType === "trial" && !user.subscriptionExpiresAt) {
    const createdAt = new Date(user.createdAt);
    const currentDate = new Date();
    const trialDays = 7; // Período de teste de 7 dias
    
    // Calcula a data de expiração baseada na data de criação + 7 dias
    const calculatedExpirationDate = new Date(createdAt);
    calculatedExpirationDate.setDate(calculatedExpirationDate.getDate() + trialDays);
    
    console.log(`[hasActiveSubscription] Verificando trial pela data de criação: User ID ${user.id}, Criado em: ${createdAt.toISOString()}, Calculada expiração: ${calculatedExpirationDate.toISOString()}`);
    
    // Se a data atual for maior que a data calculada de expiração
    if (currentDate > calculatedExpirationDate) {
      console.log(`[hasActiveSubscription] Período de teste expirou para usuário ID ${user.id} baseado na data de criação`);
      
      // Atualiza o usuário para marcar a assinatura como inativa
      storage.updateUser(user.id, { 
        subscriptionActive: false,
        paymentRequired: true,
        // Define a data de expiração para facilitar verificações futuras
        subscriptionExpiresAt: calculatedExpirationDate
      })
        .then(() => {
          console.log(`[hasActiveSubscription] Usuário trial ID ${user.id} marcado como expirado no banco de dados`);
        })
        .catch(err => console.error("Erro ao desativar período de teste expirado:", err));
      
      return res.status(402).json({ 
        code: "trial_expired",
        message: "Seu período de teste gratuito expirou. Por favor, adquira um plano para continuar."
      });
    }
  }
  
  return next();
}

// Middleware para verificar se o usuário é administrador
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  // Verifica se o profileType é "administrador" ou "admin"
  const profile = req.user?.profileType?.toLowerCase() || "";
  if (req.isAuthenticated() && 
      (profile === "administrador" || profile === "admin")) {
    console.log("[isAdmin] Usuário verificado como administrador:", {
      userId: req.user?.id,
      profileType: req.user?.profileType
    });
    return next();
  }
  console.log("[isAdmin] Acesso negado:", {
    userId: req.user?.id,
    profileType: req.user?.profileType
  });
  res.status(403).json({ message: "Acesso não autorizado" });
}

// Middleware para verificar se é o próprio usuário ou administrador
export function isAdminOrSelf(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const userId = parseInt(req.params.id, 10);
  
  if (req.user?.profileType?.toLowerCase() === "administrador" || req.user?.profileType?.toLowerCase() === "admin" || req.user?.id === userId) {
    return next();
  }
  
  res.status(403).json({ message: "Acesso não autorizado" });
}

// Middleware para verificar se motorista pode criar fretes (bloquear criação)
export function canCreateFreight(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const userProfileType = req.user?.profileType?.toLowerCase() || "";
  
  // Motoristas não podem criar fretes
  if (userProfileType === "motorista" || userProfileType === "driver") {
    return res.status(403).json({ 
      message: "Motoristas não têm permissão para criar fretes. Apenas visualização é permitida." 
    });
  }
  
  return next();
}

export function canCreateDriver(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  // Administradores podem criar motoristas
  if (req.user?.profileType?.toLowerCase() === "admin" || req.user?.profileType?.toLowerCase() === "administrador") {
    console.log(`[canCreateDriver] Administrador ${req.user.id} autorizado a criar motoristas`);
    return next();
  }

  // Motoristas podem criar outros motoristas (acesso gratuito)
  if (req.user?.profileType?.toLowerCase() === "motorista" || req.user?.profileType?.toLowerCase() === "driver") {
    console.log(`[canCreateDriver] Motorista ${req.user.id} autorizado a criar outros motoristas`);
    return next();
  }

  // Para outros perfis, seguir a lógica normal de assinatura
  return hasActiveSubscription(req, res, next);
}

// Middleware para verificar se o usuário tem permissão para acessar um cliente
export function hasClientAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const clientId = parseInt(req.params.id, 10);
  
  // Permite acesso se o usuário for administrador ou se o cliente estiver associado ao usuário
  if (req.user?.profileType?.toLowerCase() === "administrador" || req.user?.profileType?.toLowerCase() === "admin" || req.user?.clientId === clientId) {
    return next();
  }
  
  // Log para depuração
  console.log(`Acesso negado ao cliente ${clientId}. User ID: ${req.user?.id}, User clientId: ${req.user?.clientId}, User profileType: ${req.user?.profileType}`);
  
  res.status(403).json({ message: "Acesso não autorizado" });
}

// Middleware para verificar se o usuário tem permissão para acessar um motorista
export function hasDriverAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const driverId = parseInt(req.params.id, 10);
  
  // Log para diagnóstico
  console.log(`Verificando acesso ao motorista: ID motorista=${driverId}, User ID=${req.user?.id}, Profile=${req.user?.profileType}, DriverID=${req.user?.driverId}, Subscription=${req.user?.subscriptionActive}`);
  
  // Administrador tem acesso total
  if (req.user?.profileType?.toLowerCase() === "administrador" || req.user?.profileType?.toLowerCase() === "admin") {
    console.log(`Acesso concedido ao administrador (${req.user?.id}) para o motorista ${driverId}`);
    return next();
  }
  
  // Embarcador e Agente têm acesso com assinatura
  if ((req.user?.profileType?.toLowerCase() === "embarcador" || req.user?.profileType?.toLowerCase() === "agente") && 
      req.user?.subscriptionActive) {
    console.log(`Acesso concedido ao ${req.user?.profileType} (${req.user?.id}) com assinatura ativa para o motorista ${driverId}`);
    return next();
  }
  
  // Motorista só tem acesso a seus próprios dados
  if (req.user?.profileType?.toLowerCase() === "motorista" && req.user?.driverId === driverId) {
    console.log(`Acesso concedido ao motorista (${req.user?.id}) para seu próprio cadastro ${driverId}`);
    return next();
  }
  
  console.log(`Acesso negado ao motorista ${driverId}. User ID: ${req.user?.id}, User driverId: ${req.user?.driverId}, User profileType: ${req.user?.profileType}`);
  res.status(403).json({ message: "Acesso não autorizado" });
}

// Middleware para verificar se o usuário tem permissão para acessar um frete
export async function hasFreightAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  // Administrador sempre tem acesso
  if (req.user?.profileType?.toLowerCase() === "administrador" || req.user?.profileType?.toLowerCase() === "admin") {
    console.log(`[hasFreightAccess] Usuário administrador (${req.user.id}) com acesso autorizado`);
    return next();
  }

  const freightId = parseInt(req.params.id, 10);
  const freight = await storage.getFreight(freightId);
  
  // Se o frete não existir, retorna 404
  if (!freight) {
    console.log(`[hasFreightAccess] Frete ${freightId} não encontrado`);
    return res.status(404).json({ message: "Frete não encontrado" });
  }
  
  // Fretes sem cliente associado ou clientId=0 podem ser editados por qualquer usuário autenticado
  if (freight.clientId === null || freight.clientId === 0) {
    console.log(`[hasFreightAccess] Frete ${freightId} sem cliente associado ou clientId=0, acesso permitido para usuário ${req.user.id}`);
    return next();
  }
  
  // Verifica se o usuário tem um cliente associado
  if (req.user?.clientId === null || req.user?.clientId === undefined) {
    // Verifica se o usuário é o criador do frete, mesmo sem cliente associado
    // buscar o usuário que criou o frete
    if (freight.userId && freight.userId === req.user.id) {
      console.log(`[hasFreightAccess] Usuário ${req.user.id} é o criador do frete ${freightId}, acesso permitido`);
      return next();
    }
    
    console.log(`[hasFreightAccess] Usuário ${req.user.id} não tem cliente associado, negando acesso`);
    return res.status(403).json({ message: "Você não tem um cliente associado ao seu perfil" });
  }
  
  // Verifica se o frete pertence ao cliente do usuário
  if (req.user?.clientId === freight.clientId) {
    console.log(`[hasFreightAccess] Frete ${freightId} pertence ao cliente ${freight.clientId} do usuário ${req.user.id}, acesso permitido`);
    return next();
  }
  
  // Verificar se o usuário é o criador do frete, mesmo que tenha cliente diferente
  if (freight.userId && freight.userId === req.user.id) {
    console.log(`[hasFreightAccess] Usuário ${req.user.id} é o criador do frete ${freightId}, acesso permitido`);
    return next();
  }
  
  console.log(`[hasFreightAccess] Acesso negado para usuário ${req.user.id} ao frete ${freightId} do cliente ${freight.clientId}`);
  res.status(403).json({ message: "Acesso não autorizado" });
}

// Middleware para verificar se o usuário tem permissão para acessar um veículo
export async function hasVehicleAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  // Administrador sempre tem acesso
  if (req.user?.profileType?.toLowerCase() === "administrador") {
    return next();
  }

  const vehicleId = parseInt(req.params.id, 10);
  const vehicle = await storage.getVehicle(vehicleId);
  
  // Se o veículo não existir, retorna 404
  if (!vehicle) {
    return res.status(404).json({ message: "Veículo não encontrado" });
  }
  
  // Se o usuário for motorista, verifica se o veículo pertence a ele
  if (req.user?.profileType?.toLowerCase() === "motorista" && req.user?.driverId === vehicle.driverId) {
    return next();
  }
  
  res.status(403).json({ message: "Acesso não autorizado" });
}

// Middleware para controlar edição/exclusão de motoristas - apenas proprietário ou admin
export async function canEditDriver(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const driverId = parseInt(req.params.id, 10);
  
  // Log detalhado para diagnóstico
  console.log(`[canEditDriver] Verificando permissões para editar motorista ${driverId}`);
  console.log(`[canEditDriver] Usuário: ${req.user?.id}, Perfil: ${req.user?.profileType}, DriverId: ${req.user?.driverId}, ClientId: ${req.user?.clientId}, Subscription: ${req.user?.subscriptionActive}`);
  
  const driver = await storage.getDriver(driverId);
  
  if (!driver) {
    console.log(`[canEditDriver] Motorista ${driverId} não encontrado`);
    return res.status(404).json({ message: "Motorista não encontrado" });
  }
  
  console.log(`[canEditDriver] Dados do motorista: userId=${driver.userId}, clientId=${driver.clientId}`);
  
  // Administrador tem acesso total
  if (req.user?.profileType?.toLowerCase() === "administrador" || req.user?.profileType?.toLowerCase() === "admin") {
    console.log(`[canEditDriver] Administrador ${req.user.id} autorizado a editar motorista ${driverId}`);
    return next();
  }
  
  // Verificar se é o próprio motorista editando seus dados
  if (req.user?.profileType?.toLowerCase() === "motorista" && req.user?.driverId === driverId) {
    console.log(`[canEditDriver] Motorista ${req.user.id} autorizado a editar próprio cadastro ${driverId}`);
    return next();
  }
  
  // Verificar se o usuário é dono do motorista (através de userId no driver)
  if (driver.userId === req.user?.id) {
    console.log(`[canEditDriver] Usuário ${req.user.id} autorizado a editar motorista ${driverId} que cadastrou`);
    return next();
  }
  
  // Embarcador/Agente com assinatura pode editar motoristas do seu cliente
  if ((req.user?.profileType?.toLowerCase() === "embarcador" || req.user?.profileType?.toLowerCase() === "agente") && 
      req.user?.subscriptionActive && 
      req.user?.clientId && 
      driver.clientId === req.user?.clientId) {
    console.log(`[canEditDriver] ${req.user?.profileType} ${req.user.id} com assinatura autorizado a editar motorista ${driverId} do cliente ${driver.clientId}`);
    return next();
  }
  
  // Embarcador/Agente com assinatura pode editar qualquer motorista se não tem clientId específico
  if ((req.user?.profileType?.toLowerCase() === "embarcador" || req.user?.profileType?.toLowerCase() === "agente") && 
      req.user?.subscriptionActive) {
    console.log(`[canEditDriver] ${req.user?.profileType} ${req.user.id} com assinatura autorizado a editar motorista ${driverId} (acesso geral)`);
    return next();
  }
  
  console.log(`[canEditDriver] Acesso negado para usuário ${req.user.id} editar motorista ${driverId}. Driver userId: ${driver.userId}, Driver clientId: ${driver.clientId}`);
  res.status(403).json({ message: "Você só pode editar/excluir seus próprios cadastros" });
}

// Middleware para controlar edição/exclusão de veículos - apenas proprietário ou admin
export async function canEditVehicle(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const vehicleId = parseInt(req.params.id, 10);
  
  // Log detalhado para diagnóstico
  console.log(`[canEditVehicle] Verificando permissões para editar veículo ${vehicleId}`);
  console.log(`[canEditVehicle] Usuário: ${req.user?.id}, Perfil: ${req.user?.profileType}, DriverId: ${req.user?.driverId}, ClientId: ${req.user?.clientId}, Subscription: ${req.user?.subscriptionActive}`);
  
  const vehicle = await storage.getVehicle(vehicleId);
  
  if (!vehicle) {
    console.log(`[canEditVehicle] Veículo ${vehicleId} não encontrado`);
    return res.status(404).json({ message: "Veículo não encontrado" });
  }

  console.log(`[canEditVehicle] Dados do veículo: userId=${vehicle.userId}, driverId=${vehicle.driverId}`);

  // Administrador tem acesso total
  if (req.user?.profileType?.toLowerCase() === "administrador" || req.user?.profileType?.toLowerCase() === "admin") {
    console.log(`[canEditVehicle] Administrador ${req.user.id} autorizado a editar veículo ${vehicleId}`);
    return next();
  }
  
  // Verificar se é o motorista proprietário do veículo
  if (req.user?.profileType?.toLowerCase() === "motorista" && req.user?.driverId === vehicle.driverId) {
    console.log(`[canEditVehicle] Motorista ${req.user.id} autorizado a editar próprio veículo ${vehicleId}`);
    return next();
  }
  
  // Verificar se o usuário é dono do veículo (através de userId no vehicle)
  if (vehicle.userId === req.user?.id) {
    console.log(`[canEditVehicle] Usuário ${req.user.id} autorizado a editar veículo ${vehicleId} que cadastrou`);
    return next();
  }
  
  // Embarcador/Agente com assinatura pode editar veículos
  if ((req.user?.profileType?.toLowerCase() === "embarcador" || req.user?.profileType?.toLowerCase() === "agente" || req.user?.profileType?.toLowerCase() === "shipper") && 
      req.user?.subscriptionActive) {
    console.log(`[canEditVehicle] ${req.user?.profileType} ${req.user.id} com assinatura autorizado a editar veículo ${vehicleId}`);
    return next();
  }
  
  console.log(`[canEditVehicle] Acesso negado para usuário ${req.user.id} editar veículo ${vehicleId}. Vehicle userId: ${vehicle.userId}, Vehicle driverId: ${vehicle.driverId}`);
  res.status(403).json({ message: "Você só pode editar/excluir veículos que cadastrou" });
}