import { Express } from "express";
import { Server } from "http";
import { registerUserSubscriptionRoutes } from "./user-subscription";

export function registerAppRoutes(app: Express, server: Server) {
  // Registrar rotas de assinatura do usuário
  registerUserSubscriptionRoutes(app);
  
  // Adicionar outras rotas aqui conforme necessário
  
  return server;
}