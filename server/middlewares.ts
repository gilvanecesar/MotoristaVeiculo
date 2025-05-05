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
  
  // Se for admin, sempre tem acesso
  if (user.profileType === "admin") {
    return next();
  }
  
  // Se for motorista com acesso gratuito, permitir acesso
  if (user.profileType === "driver" && user.subscriptionType === "driver_free") {
    return next();
  }
  
  // Verificar se a assinatura está ativa
  if (user.subscriptionActive !== true) {
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
  
  return next();
}

// Middleware para verificar se o usuário é admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  // Verifica se o profileType é "admin" ou "ADMIN" (case insensitive)
  if (req.isAuthenticated() && 
      (req.user?.profileType?.toLowerCase() === "admin")) {
    return next();
  }
  res.status(403).json({ message: "Acesso não autorizado" });
}

// Middleware para verificar se é o próprio usuário ou admin
export function isAdminOrSelf(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const userId = parseInt(req.params.id, 10);
  
  if (req.user?.profileType?.toLowerCase() === "admin" || req.user?.id === userId) {
    return next();
  }
  
  res.status(403).json({ message: "Acesso não autorizado" });
}

// Middleware para verificar se o usuário tem permissão para acessar um cliente
export function hasClientAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const clientId = parseInt(req.params.id, 10);
  
  if (req.user?.profileType?.toLowerCase() === "admin" || req.user?.clientId === clientId) {
    return next();
  }
  
  res.status(403).json({ message: "Acesso não autorizado" });
}

// Middleware para verificar se o usuário tem permissão para acessar um motorista
export function hasDriverAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const driverId = parseInt(req.params.id, 10);
  
  if (req.user?.profileType?.toLowerCase() === "admin" || req.user?.driverId === driverId) {
    return next();
  }
  
  res.status(403).json({ message: "Acesso não autorizado" });
}

// Middleware para verificar se o usuário tem permissão para acessar um frete
export async function hasFreightAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  // Admin sempre tem acesso
  if (req.user?.profileType?.toLowerCase() === "admin") {
    console.log(`[hasFreightAccess] Usuário admin (${req.user.id}) com acesso autorizado`);
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

  // Admin sempre tem acesso
  if (req.user?.profileType?.toLowerCase() === "admin") {
    return next();
  }

  const vehicleId = parseInt(req.params.id, 10);
  const vehicle = await storage.getVehicle(vehicleId);
  
  // Se o veículo não existir, retorna 404
  if (!vehicle) {
    return res.status(404).json({ message: "Veículo não encontrado" });
  }
  
  // Se o usuário for motorista, verifica se o veículo pertence a ele
  if (req.user?.profileType?.toLowerCase() === "driver" && req.user?.driverId === vehicle.driverId) {
    return next();
  }
  
  res.status(403).json({ message: "Acesso não autorizado" });
}