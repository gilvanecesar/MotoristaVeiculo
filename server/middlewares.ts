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
    return next();
  }

  const freightId = parseInt(req.params.id, 10);
  const freight = await storage.getFreight(freightId);
  
  // Se o frete não existir, retorna 404
  if (!freight) {
    return res.status(404).json({ message: "Frete não encontrado" });
  }
  
  // Fretes sem cliente associado podem ser editados por qualquer usuário autenticado
  if (freight.clientId === null) {
    return next();
  }
  
  // Verifica se o frete pertence ao cliente do usuário
  if (req.user?.clientId === freight.clientId) {
    return next();
  }
  
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