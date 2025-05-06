import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { driverValidator, vehicleValidator, clientValidator, freightValidator, freightDestinationValidator, SUBSCRIPTION_STATUS, PLAN_TYPES } from "@shared/schema";
import { sendPasswordResetEmail } from "./email-service";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth, hashPassword } from "./auth";
import { 
  isAuthenticated, 
  isAdmin, 
  isAdminOrSelf,
  hasClientAccess,
  hasDriverAccess,
  hasFreightAccess,
  hasVehicleAccess,
  hasActiveSubscription
} from "./middlewares";
import { createCheckoutSession, createPortalSession, handleWebhook } from "./stripe";
import Stripe from "stripe";
import { sendSubscriptionEmail, sendPaymentReminderEmail } from "./email-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticação
  setupAuth(app);
  
  // Rota para solicitar redefinição de senha
  app.post("/api/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email não fornecido" });
      }

      // Gerar token de redefinição de senha
      const resetData = await storage.createPasswordResetToken(email);
      
      if (!resetData) {
        return res.status(404).json({ message: "Email não encontrado" });
      }
      
      // Enviar email com o token de redefinição
      const emailSent = await sendPasswordResetEmail(
        email,
        resetData.token,
        resetData.user.name
      );

      if (!emailSent) {
        return res.status(500).json({ 
          message: "Não foi possível enviar o email de redefinição. Contate o administrador."
        });
      }

      res.status(200).json({ 
        message: "Email de redefinição de senha enviado com sucesso" 
      });
    } catch (error) {
      console.error("Erro ao processar solicitação de recuperação de senha:", error);
      res.status(500).json({ 
        message: "Erro ao processar solicitação. Tente novamente mais tarde"
      });
    }
  });

  // Rota para redefinir senha com token
  app.post("/api/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, token, password } = req.body;

      if (!email || !token || !password) {
        return res.status(400).json({ message: "Dados insuficientes" });
      }

      // Verificar token
      const user = await storage.verifyPasswordResetToken(token, email);
      
      if (!user) {
        return res.status(400).json({ 
          message: "Token inválido ou expirado" 
        });
      }

      // Atualizar senha
      const hashedPassword = await hashPassword(password);
      await storage.updatePassword(user.id, hashedPassword);

      res.status(200).json({ 
        message: "Senha redefinida com sucesso" 
      });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.status(500).json({ 
        message: "Erro ao redefinir senha. Tente novamente mais tarde."
      });
    }
  });
  
  // Ativação de teste gratuito (7 dias)
  app.post("/api/activate-trial", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Calcula a data de expiração do teste (7 dias a partir de hoje)
      const trialExpirationDate = new Date();
      trialExpirationDate.setDate(trialExpirationDate.getDate() + 7);
      
      console.log(`Ativando período de teste para usuário ${userId} com expiração em ${trialExpirationDate.toISOString()}`);
      
      // Atualiza o usuário com status de assinatura ativa e data de expiração
      const updatedUser = await storage.updateUser(userId, {
        subscriptionActive: true,
        subscriptionType: "trial",
        subscriptionExpiresAt: trialExpirationDate,
        paymentRequired: false
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Registra na tabela de assinaturas
      try {
        await storage.createSubscription({
          userId: userId,
          clientId: updatedUser.clientId || undefined,
          status: "trialing",
          planType: "trial",
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialExpirationDate
        });
        
        console.log(`Assinatura de teste registrada com sucesso para usuário ${userId}`);
      } catch (subError) {
        console.error("Erro ao registrar assinatura de teste:", subError);
        // Não falha o processo se o registro da assinatura falhar
      }
      
      res.status(200).json({ 
        message: "Teste gratuito ativado com sucesso", 
        expirationDate: trialExpirationDate,
        user: {
          ...updatedUser,
          password: undefined // Remove a senha antes de retornar para o cliente
        }
      });
    } catch (error) {
      console.error("Error activating trial:", error);
      res.status(500).json({ message: "Erro ao ativar período de teste" });
    }
  });
  
  // Ativação de acesso gratuito para motoristas
  app.post("/api/activate-driver-access", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Verifica se o usuário é do tipo motorista
      const user = await storage.getUserById(userId);
      if (!user || user.profileType !== "driver") {
        return res.status(403).json({ message: "Apenas motoristas podem ativar o acesso gratuito" });
      }
      
      // Ativa o acesso limitado para motoristas (sem data de expiração)
      // Define como "driver_free" para não passar pelo sistema de cobrança
      const updatedUser = await storage.updateUser(userId, {
        subscriptionActive: true,
        subscriptionType: "driver_free",
        paymentRequired: false, // Indica que não precisa de pagamento
        // Sem data de expiração para motoristas (acesso permanente limitado)
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      console.log(`Acesso gratuito de motorista ativado para usuário ${userId}`);
      
      res.status(200).json({ 
        message: "Acesso de motorista ativado com sucesso",
        user: {
          ...updatedUser,
          password: undefined // Remove a senha antes de retornar para o cliente
        }
      });
    } catch (error) {
      console.error("Error activating driver access:", error);
      res.status(500).json({ message: "Erro ao ativar acesso de motorista" });
    }
  });

  // API routes for drivers
  app.get("/api/drivers", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string;
      if (search) {
        const drivers = await storage.searchDrivers(search);
        return res.json(drivers);
      }
      
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  app.get("/api/drivers/:id", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const driver = await storage.getDriver(id);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }

      res.json(driver);
    } catch (error) {
      console.error("Error fetching driver:", error);
      res.status(500).json({ message: "Failed to fetch driver" });
    }
  });

  app.post("/api/drivers", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const driverData = driverValidator.parse(req.body);
      const driver = await storage.createDriver(driverData);
      res.status(201).json(driver);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating driver:", error);
      res.status(500).json({ message: "Failed to create driver" });
    }
  });

  app.put("/api/drivers/:id", hasDriverAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const driverData = driverValidator.parse(req.body);
      const driver = await storage.updateDriver(id, driverData);
      
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }

      res.json(driver);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error updating driver:", error);
      res.status(500).json({ message: "Failed to update driver" });
    }
  });

  app.delete("/api/drivers/:id", hasDriverAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const success = await storage.deleteDriver(id);
      if (!success) {
        return res.status(404).json({ message: "Driver not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting driver:", error);
      res.status(500).json({ message: "Failed to delete driver" });
    }
  });

  // API routes for vehicles
  app.get("/api/vehicles", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const driverId = req.query.driverId ? parseInt(req.query.driverId as string) : undefined;
      const search = req.query.search as string;
      
      if (search) {
        const vehicles = await storage.searchVehicles(search);
        return res.json(vehicles);
      }
      
      if (driverId) {
        const vehicles = await storage.getVehiclesByDriver(driverId);
        return res.json(vehicles);
      }
      
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/:id", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const vehicle = await storage.getVehicle(id);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.json(vehicle);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  app.post("/api/vehicles", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const vehicleData = vehicleValidator.parse(req.body);
      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating vehicle:", error);
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  app.put("/api/vehicles/:id", hasVehicleAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const vehicleData = vehicleValidator.parse(req.body);
      const vehicle = await storage.updateVehicle(id, vehicleData);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.json(vehicle);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error updating vehicle:", error);
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", hasVehicleAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const success = await storage.deleteVehicle(id);
      if (!success) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // API routes for clients
  app.get("/api/clients", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string;
      
      // Se não for admin, só retorna o cliente do próprio usuário
      if (req.user?.profileType !== "admin") {
        // Verificar se o usuário tem um cliente associado
        if (!req.user?.clientId) {
          return res.json([]);
        }
        
        // Retornar apenas o cliente do usuário
        const client = await storage.getClient(req.user.clientId);
        return res.json(client ? [client] : []);
      }
      
      // Administradores podem pesquisar e ver todos os clientes
      if (search) {
        const clients = await storage.searchClients(search);
        return res.json(clients);
      }
      
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Se não for admin, verifica se é o próprio cliente do usuário
      if (req.user?.profileType !== "admin" && req.user?.clientId !== id) {
        return res.status(403).json({ message: "Acesso não autorizado a este cliente" });
      }

      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clientData = clientValidator.parse(req.body);
      const client = await storage.createClient(clientData);
      
      // Se o usuário estiver autenticado, associa o cliente ao usuário
      if (req.isAuthenticated() && req.user) {
        const userId = req.user.id;
        // Atualiza o usuário para ter o clientId
        await storage.updateUser(userId, { clientId: client.id });
        // Atualiza o objeto req.user para refletir a mudança
        req.user.clientId = client.id;
      }
      
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", hasClientAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const clientData = clientValidator.parse(req.body);
      const client = await storage.updateClient(id, clientData);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json(client);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", hasClientAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const success = await storage.deleteClient(id);
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // API routes for freights
  app.get("/api/freights", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string;
      
      if (search) {
        const freights = await storage.searchFreights(search);
        return res.json(freights);
      }
      
      const freights = await storage.getFreights();
      res.json(freights);
    } catch (error) {
      console.error("Error fetching freights:", error);
      res.status(500).json({ message: "Failed to fetch freights" });
    }
  });

  app.get("/api/freights/:id", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const freight = await storage.getFreight(id);
      if (!freight) {
        return res.status(404).json({ message: "Freight not found" });
      }

      // Se não for admin, verifica se o frete pertence ao cliente do usuário
      if (req.user?.profileType !== "admin" && freight.clientId !== req.user?.clientId) {
        return res.status(403).json({ message: "Acesso não autorizado a este frete" });
      }

      res.json(freight);
    } catch (error) {
      console.error("Error fetching freight:", error);
      res.status(500).json({ message: "Failed to fetch freight" });
    }
  });

  app.post("/api/freights", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      // Pré-processamento dos dados para garantir que campos numéricos sejam tratados corretamente
      const processedData = {
        ...req.body,
        cargoWeight: req.body.cargoWeight ? 
          req.body.cargoWeight.toString().replace(',', '.') : 
          "0",
        freightValue: req.body.freightValue ? 
          req.body.freightValue.toString().replace(',', '.') : 
          "0"
      };
      
      // Validação com valores processados
      const freightData = freightValidator.parse(processedData);
      
      // Definir data de expiração para 24 horas após a criação
      const today = new Date();
      const expirationDate = new Date(today);
      expirationDate.setHours(today.getHours() + 24);
      
      // Adicionar a data de expiração ao frete
      const freightWithExpiration = {
        ...freightData,
        expirationDate: expirationDate,
        // Garantir status "aberto" para novos fretes
        status: "aberto"
        // Removendo referência à coluna userId que não existe no banco
        // userId: req.user?.id
      };
      
      const freight = await storage.createFreight(freightWithExpiration);
      res.status(201).json(freight);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating freight:", error);
      res.status(500).json({ message: "Failed to create freight" });
    }
  });

  app.put("/api/freights/:id", hasFreightAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Verificar se o frete existe antes de atualizar
      const existingFreight = await storage.getFreight(id);
      if (!existingFreight) {
        return res.status(404).json({ message: "Freight not found" });
      }

      // Pré-processamento dos dados para garantir que campos numéricos sejam tratados corretamente
      const processedData = {
        ...req.body,
        cargoWeight: req.body.cargoWeight ? 
          req.body.cargoWeight.toString().replace(',', '.') : 
          "0",
        freightValue: req.body.freightValue ? 
          req.body.freightValue.toString().replace(',', '.') : 
          "0"
      };
      
      // Validação com valores processados
      const freightData = freightValidator.parse(processedData);
      
      // Preservar o clientId original, garantindo que o dono do frete não mude
      const updatedFreightData = {
        ...freightData,
        clientId: existingFreight.clientId
      };
      
      // Atualizar o frete mantendo o clientId original
      const freight = await storage.updateFreight(id, updatedFreightData);
      
      if (!freight) {
        return res.status(404).json({ message: "Failed to update freight" });
      }

      res.json(freight);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error updating freight:", error);
      res.status(500).json({ message: "Failed to update freight" });
    }
  });

  app.delete("/api/freights/:id", hasFreightAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const success = await storage.deleteFreight(id);
      if (!success) {
        return res.status(404).json({ message: "Freight not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting freight:", error);
      res.status(500).json({ message: "Failed to delete freight" });
    }
  });

  // API routes for freight destinations
  app.get("/api/freight-destinations", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const freightId = req.query.freightId ? parseInt(req.query.freightId as string) : undefined;
      
      if (!freightId) {
        return res.status(400).json({ message: "Freight ID is required" });
      }
      
      const destinations = await storage.getFreightDestinations(freightId);
      res.json(destinations);
    } catch (error) {
      console.error("Error fetching freight destinations:", error);
      res.status(500).json({ message: "Failed to fetch freight destinations" });
    }
  });

  app.post("/api/freight-destinations", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      console.log("Creating freight destination:", req.body);
      
      const freightId = req.body.freightId ? parseInt(req.body.freightId as string) : undefined;
      
      if (!freightId) {
        return res.status(400).json({ message: "Freight ID is required" });
      }
      
      // Verificar se o frete existe
      const freight = await storage.getFreight(freightId);
      if (!freight) {
        return res.status(404).json({ message: "Freight not found" });
      }
      
      // Verificar se o usuário tem permissão para adicionar destinos ao frete
      if (req.user?.profileType !== "admin" && req.user?.clientId !== freight.clientId) {
        return res.status(403).json({ message: "Acesso não autorizado para adicionar destinos a este frete" });
      }
      
      // Contar destinos existentes para definir a ordem
      const existingDestinations = await storage.getFreightDestinations(freightId);
      const order = existingDestinations.length + 1;
      
      // Preparar dados do destino
      const destinationData = {
        ...req.body,
        order,
        freightId
      };
      
      // Validar e criar destino
      const destinationWithOrder = freightDestinationValidator.parse(destinationData);
      const destination = await storage.createFreightDestination(destinationWithOrder);
      
      // Atualizar flag de múltiplos destinos no frete
      if (!freight.hasMultipleDestinations) {
        await storage.updateFreight(freightId, { hasMultipleDestinations: true });
      }
      
      res.status(201).json(destination);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating freight destination:", error);
      res.status(500).json({ message: "Failed to create freight destination" });
    }
  });

  app.delete("/api/freight-destinations/:id", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Obter o destino para verificar o freightId
      const destination = await storage.getFreightDestination(id);
      if (!destination) {
        return res.status(404).json({ message: "Freight destination not found" });
      }
      
      // Obter o frete para verificar permissões
      const freight = await storage.getFreight(destination.freightId);
      if (!freight) {
        return res.status(404).json({ message: "Freight not found" });
      }
      
      // Verificar se o usuário tem permissão para remover destinos do frete
      if (req.user?.profileType !== "admin" && req.user?.clientId !== freight.clientId) {
        return res.status(403).json({ message: "Acesso não autorizado para remover destinos deste frete" });
      }

      const success = await storage.deleteFreightDestination(id);
      if (!success) {
        return res.status(404).json({ message: "Freight destination not found" });
      }
      
      // Verificar se ainda existem destinos para este frete
      const remainingDestinations = await storage.getFreightDestinations(destination.freightId);
      
      // Se não houver mais destinos, atualizar flag de múltiplos destinos
      if (remainingDestinations.length === 0) {
        await storage.updateFreight(destination.freightId, { hasMultipleDestinations: false });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting freight destination:", error);
      res.status(500).json({ message: "Failed to delete freight destination" });
    }
  });

  // Atualizar tipo de perfil do usuário
  app.post("/api/users/update-profile-type", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { profileType } = req.body;
      
      if (!profileType) {
        return res.status(400).json({ message: "Tipo de perfil é obrigatório" });
      }
      
      // Validar o tipo de perfil
      const validTypes = ["shipper", "driver", "agent", "admin"];
      if (!validTypes.includes(profileType)) {
        return res.status(400).json({ message: "Tipo de perfil inválido" });
      }
      
      // Atualizar o usuário com o novo tipo de perfil
      const updatedUser = await storage.updateUser(req.user.id, { profileType });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Erro ao atualizar tipo de perfil" });
      }
      
      // Remover senha antes de enviar
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Erro ao atualizar tipo de perfil:", error);
      res.status(500).json({ message: "Erro ao atualizar tipo de perfil do usuário" });
    }
  });

  // Associar usuário a cliente
  app.post("/api/users/associate-client", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const { clientId } = req.body;
      if (!clientId) {
        return res.status(400).json({ message: "Client ID is required" });
      }
      
      // Verificar se o cliente existe
      const client = await storage.getClient(parseInt(clientId));
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Atualizar o usuário com o ID do cliente
      const userId = req.user.id;
      const updatedUser = await storage.updateUser(userId, { 
        clientId: parseInt(clientId)
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Failed to update user" });
      }
      
      // Atualizar o objeto req.user para refletir a mudança
      req.user.clientId = parseInt(clientId);
      
      res.status(200).json({
        message: "User associated with client successfully",
        user: {
          ...updatedUser,
          password: undefined
        }
      });
    } catch (error) {
      console.error("Error associating user with client:", error);
      res.status(500).json({ message: "Failed to associate user with client" });
    }
  });

  // --- ADMIN ROUTES ---
  
  // Gerenciamento de assinaturas
  app.get("/api/admin/subscriptions", isAdmin, async (req: Request, res: Response) => {
    try {
      const subscriptions = await storage.getSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.post("/api/admin/subscriptions", isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId, clientId, planType, status, currentPeriodStart, currentPeriodEnd } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      if (!planType) {
        return res.status(400).json({ message: "Plan type is required" });
      }
      
      // Criar ou atualizar assinatura manualmente
      const subscription = await storage.createSubscription({
        userId: parseInt(userId),
        clientId: clientId ? parseInt(clientId) : null,
        planType,
        status: status || "active",
        currentPeriodStart: new Date(currentPeriodStart || Date.now()),
        currentPeriodEnd: new Date(currentPeriodEnd || (() => {
          const date = new Date();
          date.setMonth(date.getMonth() + (planType === "annual" ? 12 : 1));
          return date;
        })()),
      });
      
      // Atualizar o status de assinatura do usuário
      await storage.updateUser(parseInt(userId), {
        subscriptionActive: true,
        subscriptionType: planType,
        subscriptionExpiresAt: new Date(currentPeriodEnd),
      });
      
      res.status(201).json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.get("/api/admin/invoices", isAdmin, async (req: Request, res: Response) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Stripe checkout
  app.post("/api/create-checkout-session", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await createCheckoutSession(req, res);
    } catch (error: any) {
      console.error("Checkout session error:", error.message);
      res.status(500).json({ error: { message: error.message } });
    }
  });

  // Endpoint para obter informações da assinatura do usuário
  app.get("/api/user/subscription-info", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing Stripe API Key");
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });

      const user = req.user;
      if (!user) {
        return res.status(401).send({ error: { message: "Não autenticado" } });
      }

      // Verificar se o usuário tem uma assinatura
      if (!user.stripeSubscriptionId) {
        return res.status(404).send({ error: { message: "Nenhuma assinatura encontrada" } });
      }

      // Buscar dados da assinatura no Stripe
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      // Montar objeto com informações da assinatura
      const subscriptionInfo = {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
        currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        planType: subscription.metadata?.planType || "monthly"
      };

      res.json(subscriptionInfo);
    } catch (error: any) {
      console.error("Erro ao buscar informações da assinatura:", error.message);
      res.status(500).json({ error: { message: error.message } });
    }
  });

  // Endpoint para cancelar assinatura
  app.post("/api/cancel-subscription", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing Stripe API Key");
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });

      const user = req.user;
      if (!user) {
        return res.status(401).send({ error: { message: "Não autenticado" } });
      }

      // Verificar se o usuário tem uma assinatura
      if (!user.stripeSubscriptionId) {
        return res.status(400).send({ error: { message: "Nenhuma assinatura encontrada para cancelar" } });
      }

      // Cancelar a assinatura no Stripe
      await stripe.subscriptions.cancel(user.stripeSubscriptionId, {
        prorate: true
      });

      // Atualizar o status da assinatura no banco de dados
      await storage.updateUser(user.id, {
        subscriptionActive: false,
        subscriptionExpiresAt: new Date().toISOString()
      });

      res.json({ success: true, message: "Assinatura cancelada com sucesso" });
    } catch (error: any) {
      console.error("Erro ao cancelar assinatura:", error.message);
      res.status(500).json({ error: { message: error.message } });
    }
  });

  app.post("/api/create-portal-session", isAuthenticated, async (req: Request, res: Response) => {
    try {
      await createPortalSession(req, res);
    } catch (error: any) {
      console.error("Portal session error:", error.message);
      res.status(500).json({ error: { message: error.message } });
    }
  });

  // WebHook para eventos do Stripe
  app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
    try {
      await handleWebhook(req, res);
    } catch (error: any) {
      console.error("Webhook error:", error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  // Endpoint para criar um PaymentIntent
  app.post("/api/create-payment-intent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing Stripe API Key");
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });

      // Obter o valor do pagamento (em centavos)
      const { amount, invoiceDescription } = req.body;
      
      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }
      
      const amountInCents = Math.round(parseFloat(amount) * 100);
      
      // Dados do cliente
      const customer = req.user?.clientId ? await storage.getClient(req.user.clientId) : null;
      
      // Criar o PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "brl",
        payment_method_types: ["card", "boleto"],
        description: invoiceDescription || `Pagamento de R$ ${(amountInCents / 100).toFixed(2)}`,
        metadata: {
          userId: req.user?.id.toString(),
          clientId: req.user?.clientId?.toString(),
          customerName: customer?.name || req.user?.name,
        },
      });
      
      // Retornar o client_secret para o frontend
      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error.message);
      res.status(500).json({ error: { message: error.message } });
    }
  });

  // Endpoint para criar ou recuperar uma assinatura do Stripe
  app.post("/api/get-or-create-subscription", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing Stripe API Key");
      }
      
      if (!process.env.STRIPE_PRICE_ID) {
        throw new Error("Missing Stripe Price ID");
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });

      const user = req.user;
      if (!user) {
        return res.status(401).send({ error: { message: "Não autenticado" } });
      }

      // Se já tem uma assinatura ativa, retorná-la
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          
          // Se a assinatura está ativa e tem um PaymentIntent, retornar o client_secret
          if (
            subscription.status !== "canceled" && 
            subscription.latest_invoice && 
            typeof subscription.latest_invoice !== "string"
          ) {
            const paymentIntent = subscription.latest_invoice.payment_intent;
            if (paymentIntent && typeof paymentIntent !== "string") {
              return res.send({
                subscriptionId: subscription.id,
                clientSecret: paymentIntent.client_secret,
              });
            }
          }
        } catch (error) {
          console.log("Erro ao buscar assinatura existente:", error);
          // Se houver erro ou a assinatura estiver cancelada, prosseguir para criar uma nova
        }
      }
      
      // Verificar se o usuário tem email
      if (!user.email) {
        return res.status(400).send({ error: { message: "Usuário sem email cadastrado" } });
      }
      
      try {
        // Verificar se já existe um cliente Stripe para este usuário
        let customerId = user.stripeCustomerId;
        
        if (!customerId) {
          // Criar um novo cliente no Stripe
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.name,
            metadata: {
              userId: user.id.toString(),
            },
          });
          
          customerId = customer.id;
          
          // Salvar o ID do cliente Stripe no usuário
          await storage.updateUser(user.id, { 
            stripeCustomerId: customerId 
          });
        }
        
        // Definir o tipo de plano com base no corpo da requisição
        const planType = req.body.planType || "monthly";
        
        // Usar o preço mensal ou anual com base no tipo de plano
        const priceId = process.env.STRIPE_PRICE_ID || "price_invalid";
        
        // Criar a assinatura com período de teste de 7 dias
        // Iniciar o trial imediatamente, mas iniciar a cobrança apenas após 7 dias
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias após agora
        
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [
            {
              price: priceId,
            },
          ],
          trial_end: Math.floor(trialEnd.getTime() / 1000), // Timestamp em segundos
          payment_behavior: "default_incomplete",
          payment_settings: { 
            save_default_payment_method: "on_subscription",
            payment_method_types: ["card", "boleto"]
          },
          expand: ["latest_invoice.payment_intent"],
          metadata: {
            userId: user.id.toString(),
            planType: planType,
            trialEndDate: trialEnd.toISOString(),
          },
        });
        
        // Salvar os IDs da assinatura no usuário
        await storage.updateUser(user.id, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
        });
        
        // Enviar o client_secret para o frontend
        if (
          subscription.latest_invoice && 
          typeof subscription.latest_invoice !== "string" &&
          subscription.latest_invoice.payment_intent &&
          typeof subscription.latest_invoice.payment_intent !== "string"
        ) {
          res.send({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret,
          });
        } else {
          res.status(400).send({ error: { message: "Erro ao criar assinatura" } });
        }
      } catch (error: any) {
        console.error("Erro ao criar assinatura:", error.message);
        return res.status(400).send({ error: { message: error.message } });
      }
    } catch (error: any) {
      console.error("Error with subscription:", error.message);
      res.status(500).json({ error: { message: error.message } });
    }
  });

  app.get("/api/admin/finance/stats", isAdmin, async (req: Request, res: Response) => {
    try {
      // Executar estatísticas para o dashboard financeiro
      const stats = await storage.getFinanceStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching financial stats:", error);
      res.status(500).json({ message: "Failed to fetch financial statistics" });
    }
  });

  app.post("/api/admin/finance/settings", isAdmin, async (req: Request, res: Response) => {
    try {
      // Atualizar configurações financeiras
      const settings = await storage.updateFinanceSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating financial settings:", error);
      res.status(500).json({ message: "Failed to update financial settings" });
    }
  });

  // Gerenciamento de usuários (admin)
  // Endpoint para obter informações de pagamento de usuários (admin)
  app.get("/api/admin/users/payment-info/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing Stripe API Key");
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verificar se o usuário tem um customer ID no Stripe
      if (!user.stripeCustomerId) {
        return res.status(404).json({ message: "Usuário sem informações de pagamento" });
      }

      // Buscar dados do cliente no Stripe
      const customer = await stripe.customers.retrieve(user.stripeCustomerId, {
        expand: ['sources', 'subscriptions', 'payment_methods']
      });

      // Buscar métodos de pagamento do cliente
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card'
      });

      // Formatar e retornar dados de pagamento
      const paymentInfo = {
        customerId: user.stripeCustomerId,
        subscriptionId: user.stripeSubscriptionId || null,
        subscriptionStatus: null,
        trialEnd: null,
        paymentMethods: paymentMethods.data.map(pm => ({
          id: pm.id,
          brand: pm.card?.brand || 'Unknown',
          last4: pm.card?.last4 || '****',
          expMonth: pm.card?.exp_month || 0,
          expYear: pm.card?.exp_year || 0,
          isDefault: pm.id === (customer.invoice_settings?.default_payment_method || null)
        }))
      };

      // Adicionar informações de assinatura, se existir
      if (user.stripeSubscriptionId && customer.subscriptions?.data?.length > 0) {
        const subscription = customer.subscriptions.data.find(s => s.id === user.stripeSubscriptionId);
        if (subscription) {
          paymentInfo.subscriptionStatus = subscription.status;
          paymentInfo.trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
        }
      }

      res.json(paymentInfo);
    } catch (error: any) {
      console.error("Error fetching payment info:", error.message);
      res.status(500).json({ message: "Failed to fetch payment information" });
    }
  });

  app.get("/api/admin/users", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      
      // Remover senhas antes de enviar
      const safeUsers = users.map(user => ({
        ...user,
        password: undefined
      }));
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Ativar/desativar acesso de usuários
  app.put("/api/admin/users/:id/toggle-access", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Inverter o status atual
      const newStatus = !user.isActive;
      
      // Atualizar o usuário
      const updatedUser = await storage.updateUser(id, { 
        isActive: newStatus 
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Failed to update user" });
      }
      
      res.json({
        message: `User access ${newStatus ? 'activated' : 'deactivated'} successfully`,
        user: {
          ...updatedUser,
          password: undefined
        }
      });
    } catch (error) {
      console.error("Error toggling user access:", error);
      res.status(500).json({ message: "Failed to toggle user access" });
    }
  });

  // Enviar lembretes de pagamento
  app.post("/api/admin/users/:id/send-payment-reminder", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Enviar e-mail de lembrete de pagamento
      await sendPaymentReminderEmail(user, req.body.customMessage);
      
      res.json({
        message: "Payment reminder sent successfully"
      });
    } catch (error) {
      console.error("Error sending payment reminder:", error);
      res.status(500).json({ message: "Failed to send payment reminder" });
    }
  });
  
  // Atualizar o tipo de perfil de um usuário
  // Endpoint para redefinir a senha de um usuário (admin apenas)
  app.post("/api/admin/users/:id/reset-password", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "A nova senha deve ter pelo menos 6 caracteres" });
      }
      
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Gerar hash para a nova senha
      const hashedPassword = await hashPassword(newPassword);
      
      // Atualizar a senha do usuário usando a função de storage
      await storage.updateUser(userId, { password: hashedPassword });
        
      res.status(200).json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });
  
  app.put("/api/admin/users/:id/update-profile-type", isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const { profileType } = req.body;
      
      // Verificar se o tipo de perfil é válido
      const validProfileTypes = ["admin", "driver", "shipper", "agent"];
      if (!validProfileTypes.includes(profileType)) {
        return res.status(400).json({ 
          message: "Invalid profile type", 
          validTypes: validProfileTypes 
        });
      }
      
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Atualizar o tipo de perfil do usuário
      const updatedUser = await storage.updateUser(id, { 
        profileType: profileType 
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Failed to update user profile type" });
      }
      
      res.json({
        message: `User profile type updated successfully to ${profileType}`,
        user: {
          ...updatedUser,
          password: undefined
        }
      });
    } catch (error) {
      console.error("Error updating user profile type:", error);
      res.status(500).json({ message: "Failed to update user profile type" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
