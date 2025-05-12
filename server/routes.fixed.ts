import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { 
  isAuthenticated, 
  isActive, 
  hasActiveSubscription, 
  isAdmin, 
  isAdminOrSelf, 
  hasClientAccess, 
  hasDriverAccess, 
  hasFreightAccess, 
  hasVehicleAccess 
} from "./middlewares";
import { 
  Driver, 
  InsertDriver, 
  FreightDestination, 
  FreightWithClient,
  Vehicle
} from "@shared/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { sendSubscriptionEmail, sendPaymentReminderEmail } from "./email-service";
import { stripe } from "./stripe";
import { format } from "date-fns";
import { registerUserSubscriptionRoutes } from "./routes/user-subscription";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticação
  setupAuth(app);
  
  // Registrar rotas de gerenciamento de assinatura
  registerUserSubscriptionRoutes(app);
  
  // Rota para solicitar redefinição de senha
  app.post("/api/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }
      
      const result = await storage.createPasswordResetToken(email);
      
      if (!result) {
        // Não informar ao usuário se o email existe ou não por segurança
        return res.status(200).json({ message: "Se o email estiver registrado, você receberá instruções para redefinir sua senha." });
      }
      
      // Em um ambiente real, enviar email com o token
      // Aqui apenas retornamos o token para teste
      res.status(200).json({ 
        message: "Se o email estiver registrado, você receberá instruções para redefinir sua senha.",
        token: result.token, // Remover isso em produção
      });
    } catch (error) {
      console.error("Erro ao solicitar redefinição de senha:", error);
      res.status(500).json({ message: "Erro ao processar a solicitação" });
    }
  });
  
  // Rota para redefinir senha usando token
  app.post("/api/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, token, newPassword } = req.body;
      
      if (!email || !token || !newPassword) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }
      
      // Verificar token
      const user = await storage.verifyPasswordResetToken(token, email);
      
      if (!user) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }
      
      // Atualizar senha
      const hashedPassword = await hashPassword(newPassword);
      await storage.updatePassword(user.id, hashedPassword);
      
      res.status(200).json({ message: "Senha atualizada com sucesso" });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.status(500).json({ message: "Erro ao processar a solicitação" });
    }
  });
  
  // Ativar período de teste
  app.post("/api/activate-trial", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Verificar se o usuário já utilizou o período de teste
      if (user.subscriptionType === 'trial' || user.subscriptionExpiresAt) {
        return res.status(400).json({ message: "Você já utilizou seu período de teste" });
      }
      
      // Calcular data de expiração (7 dias a partir de agora)
      const now = new Date();
      const expirationDate = new Date(now);
      expirationDate.setDate(now.getDate() + 7);
      
      // Atualizar usuário com informações de trial
      await storage.updateUser(userId, {
        subscriptionActive: true,
        subscriptionType: 'trial',
        subscriptionExpiresAt: expirationDate,
      });
      
      res.status(200).json({ 
        message: "Período de teste ativado com sucesso",
        expiresAt: expirationDate,
      });
    } catch (error) {
      console.error("Erro ao ativar período de teste:", error);
      res.status(500).json({ message: "Erro ao ativar período de teste" });
    }
  });
  
  // Ativar acesso de motorista
  app.post("/api/activate-driver-access", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Se o usuário já tem acesso como motorista
      if (user.profileType === 'driver') {
        return res.status(400).json({ message: "Você já tem acesso como motorista" });
      }
      
      // Atualizar usuário com perfil de motorista
      await storage.updateUser(userId, {
        profileType: 'driver',
        // Não precisa de assinatura ativa para ser motorista, apenas acesso restrito
      });
      
      res.status(200).json({ 
        message: "Acesso como motorista ativado com sucesso"
      });
    } catch (error) {
      console.error("Erro ao ativar acesso de motorista:", error);
      res.status(500).json({ message: "Erro ao ativar acesso de motorista" });
    }
  });

  // ==================== DRIVERS ====================
  // Obter todos motoristas
  app.get("/api/drivers", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  // Obter motorista por ID
  app.get("/api/drivers/:id", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
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

  // Criar novo motorista
  app.post("/api/drivers", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const driverData: InsertDriver = {
        ...req.body
      };
      
      const driver = await storage.createDriver(driverData);
      res.status(201).json(driver);
    } catch (error) {
      console.error("Error creating driver:", error);
      res.status(500).json({ message: "Failed to create driver" });
    }
  });

  // Atualizar motorista existente
  app.put("/api/drivers/:id", hasDriverAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const driverData = req.body;
      
      const updatedDriver = await storage.updateDriver(id, driverData);
      
      if (!updatedDriver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      res.json(updatedDriver);
    } catch (error) {
      console.error("Error updating driver:", error);
      res.status(500).json({ message: "Failed to update driver" });
    }
  });

  // Excluir motorista
  app.delete("/api/drivers/:id", hasDriverAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o motorista existe antes de excluir
      const driver = await storage.getDriver(id);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      // Excluir motorista
      const success = await storage.deleteDriver(id);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to delete driver" });
      }
      
      res.status(200).json({ message: "Driver deleted successfully" });
    } catch (error) {
      console.error("Error deleting driver:", error);
      res.status(500).json({ message: "Failed to delete driver" });
    }
  });

  // ==================== VEHICLES ====================
  // Obter todos veículos
  app.get("/api/vehicles", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      let vehicles: Vehicle[];
      
      // Se um ID de motorista for especificado, filtrar por esse motorista
      if (req.query.driverId) {
        const driverId = parseInt(req.query.driverId as string);
        vehicles = await storage.getVehiclesByDriver(driverId);
      } else {
        vehicles = await storage.getVehicles();
      }
      
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  // Obter veículo por ID
  app.get("/api/vehicles/:id", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
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

  // Criar novo veículo
  app.post("/api/vehicles", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const vehicleData = req.body;
      
      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  // Atualizar veículo existente
  app.put("/api/vehicles/:id", hasVehicleAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const vehicleData = req.body;
      
      const updatedVehicle = await storage.updateVehicle(id, vehicleData);
      
      if (!updatedVehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      res.json(updatedVehicle);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  // Excluir veículo
  app.delete("/api/vehicles/:id", hasVehicleAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o veículo existe antes de excluir
      const vehicle = await storage.getVehicle(id);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      // Excluir veículo
      const success = await storage.deleteVehicle(id);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to delete vehicle" });
      }
      
      res.status(200).json({ message: "Vehicle deleted successfully" });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // ==================== CLIENTS ====================
  // Obter todos clientes
  app.get("/api/clients", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Obter cliente por ID
  app.get("/api/clients/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  // Criar novo cliente
  app.post("/api/clients", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clientData = req.body;
      
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  // Atualizar cliente existente
  app.put("/api/clients/:id", hasClientAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = req.body;
      
      const updatedClient = await storage.updateClient(id, clientData);
      
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(updatedClient);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  // Excluir cliente
  app.delete("/api/clients/:id", hasClientAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o cliente existe antes de excluir
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Excluir cliente
      const success = await storage.deleteClient(id);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to delete client" });
      }
      
      res.status(200).json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // ==================== FREIGHTS ====================
  // Obter todos fretes, com opção de filtro por cliente
  app.get("/api/freights", isAuthenticated, async (req: Request, res: Response) => {
    try {      
      let freights: FreightWithClient[];
      
      // Se um ID de cliente for especificado, filtrar por esse cliente
      if (req.query.clientId) {
        const clientId = parseInt(req.query.clientId as string);
        // Filtrar fretes por cliente usando o método getFreights e filtrando depois
        const allFreights = await storage.getFreights();
        freights = allFreights.filter(f => f.clientId === clientId);
      } else {
        // Se o usuário for administrador, obter todos os fretes
        // Se for cliente ou motorista, obter apenas os fretes associados
        if (req.user?.profileType === 'admin') {
          freights = await storage.getFreights();
        } else if (req.user?.clientId) {
          // Para usuários com perfil de cliente, obter fretes do cliente
          // Filtrar fretes por cliente usando o método getFreights e filtrando depois
          const allFreights = await storage.getFreights();
          freights = allFreights.filter(f => f.clientId === req.user?.clientId);
        } else {
          // Outros perfis (motoristas) veem todos os fretes ativos
          // Com acesso limitado apenas para visualização
          freights = await storage.getFreights();
        }
      }
      
      if (req.query.active === 'true') {
        // Filtrar apenas fretes ativos
        const now = new Date();
        freights = freights.filter(freight => 
          new Date(freight.expirationDate) > now && freight.status === 'active'
        );
      }
      
      res.json(freights);
    } catch (error) {
      console.error("Error fetching freights:", error);
      res.status(500).json({ message: "Failed to fetch freights" });
    }
  });

  // Obter frete por ID
  app.get("/api/freights/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const freight = await storage.getFreight(id);
      
      if (!freight) {
        return res.status(404).json({ message: "Freight not found" });
      }
      
      // Obter destinos múltiplos se existirem
      let destinations: FreightDestination[] = [];
      if (freight.hasMultipleDestinations) {
        destinations = await storage.getFreightDestinations(id);
      }
      
      res.json({
        ...freight,
        destinations
      });
    } catch (error) {
      console.error("Error fetching freight:", error);
      res.status(500).json({ message: "Failed to fetch freight" });
    }
  });

  // Criar novo frete
  app.post("/api/freights", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const freightData = req.body;
      
      // Associar o user ID atual
      freightData.userId = req.user?.id || null;
      
      // Garantir que o status é 'active' inicialmente
      freightData.status = 'active';
      
      // Se não for enviada uma data de expiração, definir para 24h no futuro
      if (!freightData.expirationDate) {
        const expirationDate = new Date();
        expirationDate.setHours(expirationDate.getHours() + 24);
        freightData.expirationDate = expirationDate;
      }
      
      // Extrair destinos múltiplos se houver
      const destinations = freightData.destinations || [];
      delete freightData.destinations;
      
      // Criar o frete principal
      const freight = await storage.createFreight(freightData);
      
      // Se houver destinos múltiplos, salvá-los
      if (destinations.length > 0) {
        for (const dest of destinations) {
          await storage.createFreightDestination({
            freightId: freight.id,
            destination: dest.destination,
            destinationState: dest.destinationState,
            arrivalDate: dest.arrivalDate || null,
            destinationContact: dest.destinationContact || null,
            destinationPhone: dest.destinationPhone || null,
            destinationAddress: dest.destinationAddress || null,
            destinationNotes: dest.destinationNotes || null,
          });
        }
        
        // Atualizar o frete para indicar que tem múltiplos destinos
        await storage.updateFreight(freight.id, { hasMultipleDestinations: true });
      }
      
      res.status(201).json(freight);
    } catch (error) {
      console.error("Error creating freight:", error);
      res.status(500).json({ message: "Failed to create freight" });
    }
  });

  // Atualizar frete existente
  app.put("/api/freights/:id", hasFreightAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const freightData = req.body;
      
      // Separar os destinos dos dados do frete principal
      const destinations = freightData.destinations || [];
      delete freightData.destinations;
      
      // Atualizar dados do frete
      const updatedFreight = await storage.updateFreight(id, freightData);
      
      if (!updatedFreight) {
        return res.status(404).json({ message: "Freight not found" });
      }
      
      // Se há destinos múltiplos, atualizar ou criar
      if (destinations && destinations.length > 0) {
        // Primeiro obter os destinos existentes
        const existingDestinations = await storage.getFreightDestinations(id);
        const existingIds = existingDestinations.map(d => d.id);
        
        // Atualizar/criar destinos
        for (const dest of destinations) {
          if (dest.id && existingIds.includes(dest.id)) {
            // Atualizar destino existente
            await storage.updateFreightDestination(dest.id, {
              destination: dest.destination,
              destinationState: dest.destinationState,
              arrivalDate: dest.arrivalDate || null,
              destinationContact: dest.destinationContact || null,
              destinationPhone: dest.destinationPhone || null,
              destinationAddress: dest.destinationAddress || null,
              destinationNotes: dest.destinationNotes || null,
            });
          } else {
            // Criar novo destino
            await storage.createFreightDestination({
              freightId: id,
              destination: dest.destination,
              destinationState: dest.destinationState,
              arrivalDate: dest.arrivalDate || null,
              destinationContact: dest.destinationContact || null,
              destinationPhone: dest.destinationPhone || null,
              destinationAddress: dest.destinationAddress || null,
              destinationNotes: dest.destinationNotes || null,
            });
          }
        }
        
        // Atualizar o frete para indicar que tem múltiplos destinos
        await storage.updateFreight(id, { hasMultipleDestinations: true });
      }
      
      // Obter o frete atualizado com seus destinos
      const freightWithDestinations = await storage.getFreight(id);
      if (!freightWithDestinations) {
        return res.status(404).json({ message: "Freight not found after update" });
      }
      
      let destinationsResult: FreightDestination[] = [];
      if (freightWithDestinations.hasMultipleDestinations) {
        destinationsResult = await storage.getFreightDestinations(id);
      }
      
      res.json({
        ...freightWithDestinations,
        destinations: destinationsResult
      });
    } catch (error) {
      console.error("Error updating freight:", error);
      res.status(500).json({ message: "Failed to update freight" });
    }
  });

  // Excluir frete
  app.delete("/api/freights/:id", hasFreightAccess, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o frete existe antes de excluir
      const freight = await storage.getFreight(id);
      if (!freight) {
        return res.status(404).json({ message: "Freight not found" });
      }
      
      // Se tiver múltiplos destinos, excluí-los primeiro
      if (freight.hasMultipleDestinations) {
        await storage.deleteFreightDestinations(id);
      }
      
      // Excluir frete
      const success = await storage.deleteFreight(id);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to delete freight" });
      }
      
      res.status(200).json({ message: "Freight deleted successfully" });
    } catch (error) {
      console.error("Error deleting freight:", error);
      res.status(500).json({ message: "Failed to delete freight" });
    }
  });

  // ==================== FREIGHT DESTINATIONS ====================
  // Obter destinos de frete por ID de frete
  app.get("/api/freight-destinations", isAuthenticated, async (req: Request, res: Response) => {
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

  // Criar novo destino para um frete
  app.post("/api/freight-destinations", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const destinationData = req.body;
      
      if (!destinationData.freightId) {
        return res.status(400).json({ message: "Freight ID is required" });
      }
      
      // Verificar se o frete existe
      const freight = await storage.getFreight(destinationData.freightId);
      if (!freight) {
        return res.status(404).json({ message: "Freight not found" });
      }
      
      // Criar o destino
      const destination = await storage.createFreightDestination(destinationData);
      
      // Atualizar o frete para indicar que tem múltiplos destinos
      await storage.updateFreight(destinationData.freightId, { hasMultipleDestinations: true });
      
      res.status(201).json(destination);
    } catch (error) {
      console.error("Error creating freight destination:", error);
      res.status(500).json({ message: "Failed to create freight destination" });
    }
  });

  // Excluir destino de frete
  app.delete("/api/freight-destinations/:id", hasActiveSubscription, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar se o destino existe antes de excluir
      const destination = await storage.getFreightDestination(id);
      if (!destination) {
        return res.status(404).json({ message: "Freight destination not found" });
      }
      
      // Excluir destino
      const success = await storage.deleteFreightDestination(id);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to delete freight destination" });
      }
      
      // Verificar se ainda existem destinos para este frete
      const remainingDestinations = await storage.getFreightDestinations(destination.freightId);
      
      // Se não houver mais destinos, atualizar o frete
      if (remainingDestinations.length === 0) {
        await storage.updateFreight(destination.freightId, { hasMultipleDestinations: false });
      }
      
      res.status(200).json({ message: "Freight destination deleted successfully" });
    } catch (error) {
      console.error("Error deleting freight destination:", error);
      res.status(500).json({ message: "Failed to delete freight destination" });
    }
  });

  // ==================== USER PROFILE ====================
  // Atualizar tipo de perfil do usuário
  app.post("/api/users/update-profile-type", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const { profileType } = req.body;
      
      if (!profileType || !['admin', 'client', 'driver', 'agent', 'shipper'].includes(profileType)) {
        return res.status(400).json({ message: "Tipo de perfil inválido" });
      }
      
      const updatedUser = await storage.updateUser(userId, { profileType });
      
      res.json({
        message: "Tipo de perfil atualizado com sucesso",
        user: updatedUser
      });
    } catch (error) {
      console.error("Erro ao atualizar tipo de perfil:", error);
      res.status(500).json({ message: "Erro ao atualizar tipo de perfil" });
    }
  });

  // Associar usuário a um cliente
  app.post("/api/users/associate-client", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const { clientId } = req.body;
      
      if (!clientId) {
        return res.status(400).json({ message: "ID do cliente é obrigatório" });
      }
      
      // Verificar se o cliente existe
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      
      const updatedUser = await storage.updateUser(userId, { clientId });
      
      res.json({
        message: "Usuário associado ao cliente com sucesso",
        user: updatedUser
      });
    } catch (error) {
      console.error("Erro ao associar usuário a cliente:", error);
      res.status(500).json({ message: "Erro ao associar usuário a cliente" });
    }
  });

  // ==================== ADMIN ROUTES ====================
  // Obter todas as assinaturas (admin)
  app.get("/api/admin/subscriptions", isAdmin, async (req: Request, res: Response) => {
    try {
      const subscriptions = await storage.getSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Erro ao obter assinaturas:", error);
      res.status(500).json({ message: "Erro ao obter assinaturas" });
    }
  });

  // Criar ou atualizar assinatura manualmente (admin)
  app.post("/api/admin/subscriptions", isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId, clientId, type, active, expiresAt, notes } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "ID do usuário é obrigatório" });
      }
      
      // Verificar se o usuário existe
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Atualizar usuário com os dados da assinatura
      const updatedUser = await storage.updateUser(userId, {
        subscriptionActive: active || true,
        subscriptionType: type || 'monthly',
        subscriptionExpiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });
      
      // Criar registro na tabela de assinaturas para histórico
      const subscription = await storage.createSubscription({
        userId,
        clientId: clientId || user.clientId,
        status: active ? 'active' : 'inactive',
        planType: type || 'monthly',
        currentPeriodStart: new Date(),
        currentPeriodEnd: expiresAt ? new Date(expiresAt) : undefined,
        metadata: { notes, manuallyCreated: true },
      });
      
      res.status(201).json({
        message: "Assinatura criada/atualizada com sucesso",
        user: updatedUser,
        subscription
      });
    } catch (error) {
      console.error("Erro ao criar/atualizar assinatura:", error);
      res.status(500).json({ message: "Erro ao criar/atualizar assinatura" });
    }
  });

  // Obter todas as faturas (admin)
  app.get("/api/admin/invoices", isAdmin, async (req: Request, res: Response) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Erro ao obter faturas:", error);
      res.status(500).json({ message: "Erro ao obter faturas" });
    }
  });

  // ==================== STRIPE PAYMENT ROUTES ====================
  
  // Endpoint para criar uma sessão de checkout
  app.post("/api/create-checkout-session", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing Stripe API Key");
      }
      
      if (!process.env.STRIPE_PRICE_ID) {
        throw new Error("Missing Stripe Price ID");
      }
      
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });
      
      const { planType = 'monthly' } = req.body;
      
      // Preço baseado no tipo de plano
      const priceId = process.env.STRIPE_PRICE_ID || null;
      
      if (!priceId) {
        return res.status(400).json({ error: "Invalid plan type" });
      }
      
      // Criar sessão de checkout
      const session = await stripeClient.checkout.sessions.create({
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/payment-cancel`,
        subscription_data: {
          metadata: {
            userId: req.user?.id.toString(),
            planType,
          },
        },
        client_reference_id: req.user?.id.toString(),
      });
      
      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Erro ao criar sessão de checkout:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para obter informações da assinatura do usuário
  app.get("/api/user/subscription-info", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing Stripe API Key");
      }
      
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).send("Usuário não autenticado");
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).send("Usuário não encontrado");
      }
      
      // Determinar se é um período de teste
      const isTrial = user.subscriptionType === "trial";
      const trialUsed = user.subscriptionType === "trial" || user.subscriptionExpiresAt != null;
      
      // Detalhes de pagamento do Stripe (se disponível)
      let stripePaymentMethod = null;
      if (user.stripeCustomerId) {
        try {
          const customer = await stripeClient.customers.retrieve(user.stripeCustomerId, {
            expand: ["invoice_settings.default_payment_method"],
          });
          
          if (customer && !("deleted" in customer) && customer.invoice_settings?.default_payment_method) {
            const paymentMethod = customer.invoice_settings.default_payment_method;
            if (typeof paymentMethod !== "string") {
              stripePaymentMethod = {
                brand: paymentMethod.card?.brand,
                last4: paymentMethod.card?.last4,
                expMonth: paymentMethod.card?.exp_month,
                expYear: paymentMethod.card?.exp_year,
              };
            }
          }
        } catch (err) {
          console.error("Erro ao obter detalhes do cliente no Stripe:", err);
          // Não retornar erro para o cliente, apenas continuar sem as informações de pagamento
        }
      }
      
      // Formatar informações para o cliente
      return res.json({
        active: user.subscriptionActive || false,
        isTrial,
        trialUsed,
        planType: user.subscriptionType || null,
        expiresAt: user.subscriptionExpiresAt || null,
        paymentMethod: stripePaymentMethod,
        stripeCustomerId: user.stripeCustomerId || null,
        stripeSubscriptionId: user.stripeSubscriptionId || null
      });
    } catch (error: any) {
      console.error("Erro ao obter informações da assinatura:", error.message);
      return res.status(500).send({ error: error.message });
    }
  });

  // Endpoint para cancelar uma assinatura
  app.post("/api/cancel-subscription", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing Stripe API Key");
      }
      
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).send("Usuário não autenticado");
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).send("Usuário não encontrado");
      }
      
      if (!user.stripeSubscriptionId) {
        return res.status(400).send("Usuário não possui assinatura ativa");
      }
      
      // Cancelar assinatura no Stripe, mas manter até o final do período já pago
      await stripeClient.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      
      // Atualizar registro local para refletir o cancelamento agendado
      await storage.createSubscriptionEvent({
        userId,
        eventType: 'cancellation_scheduled', 
        eventDate: new Date().toISOString(),
        planType: user.subscriptionType || 'unknown',
        details: 'Assinatura cancelada pelo usuário. Acesso permanece até o fim do período atual.'
      });
      
      res.json({ 
        success: true, 
        message: "Assinatura cancelada com sucesso. Seu acesso permanecerá ativo até o final do período atual." 
      });
    } catch (error: any) {
      console.error("Erro ao cancelar assinatura:", error.message);
      res.status(500).send({ error: error.message });
    }
  });

  // Endpoint para criar uma sessão do portal de clientes do Stripe
  app.post("/api/create-portal-session", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing Stripe API Key");
      }
      
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).send("Usuário não autenticado");
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).send("Usuário não encontrado");
      }
      
      if (!user.stripeCustomerId) {
        return res.status(400).send("Usuário não possui informações de pagamento");
      }
      
      // Criar sessão do portal de clientes
      const session = await stripeClient.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.headers.origin}/subscribe`,
      });
      
      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Erro ao criar sessão do portal:", error.message);
      res.status(500).send({ error: error.message });
    }
  });

  // Webhook do Stripe para receber eventos
  app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Missing Stripe configuration");
      return res.status(500).send("Missing Stripe configuration");
    }
    
    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });
    
    const signature = req.headers["stripe-signature"];
    
    if (!signature) {
      return res.status(400).send("Missing Stripe signature");
    }
    
    let event;
    
    try {
      event = stripeClient.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Gerenciar eventos diferentes do Stripe
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Obter informações do usuário a partir dos metadados
        const userId = session.subscription_data?.metadata?.userId || 
                      session.client_reference_id;
                      
        if (!userId) {
          console.error("No user ID found in Stripe session");
          return res.status(400).send("No user ID found in Stripe session");
        }
        
        const planType = session.subscription_data?.metadata?.planType || 'monthly';
        const user = await storage.getUserById(parseInt(userId));
        
        if (!user) {
          console.error(`User not found: ${userId}`);
          return res.status(404).send(`User not found: ${userId}`);
        }
        
        // Calcular data de expiração com base no tipo de plano
        const now = new Date();
        let expiresAt: Date;
        
        if (planType === 'annual') {
          expiresAt = new Date(now);
          expiresAt.setFullYear(now.getFullYear() + 1);
        } else {
          expiresAt = new Date(now);
          expiresAt.setMonth(now.getMonth() + 1);
        }
        
        // Atualizar usuário
        await storage.updateUser(parseInt(userId), {
          subscriptionActive: true,
          subscriptionType: planType,
          subscriptionExpiresAt: expiresAt,
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
          stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
        });
        
        // Registrar evento de assinatura
        await storage.createSubscriptionEvent({
          userId: parseInt(userId),
          eventType: 'subscription_created',
          eventDate: new Date().toISOString(),
          planType,
          details: `Assinatura ${planType} criada com sucesso. Expira em ${format(expiresAt, 'dd/MM/yyyy')}`
        });
        
        // Enviar email de confirmação
        try {
          await sendSubscriptionEmail(
            user.email,
            user.name,
            planType,
            now,
            expiresAt,
            planType === 'annual' ? 960 : 99.9
          );
        } catch (emailError) {
          console.error("Error sending subscription email:", emailError);
        }
        
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Processar atualização de assinatura
        const stripeCustomerId = subscription.customer as string;
        const user = await storage.getUserByStripeCustomerId(stripeCustomerId);
        
        if (!user) {
          console.error(`User not found for Stripe customer: ${stripeCustomerId}`);
          return res.status(404).send(`User not found for Stripe customer: ${stripeCustomerId}`);
        }
        
        if (subscription.status === "active") {
          // Assinatura ativa
          await storage.updateUser(user.id, {
            subscriptionActive: true,
            stripeSubscriptionId: subscription.id,
          });
          
          // Registrar evento
          await storage.createSubscriptionEvent({
            userId: user.id,
            eventType: 'subscription_updated',
            eventDate: new Date().toISOString(),
            planType: user.subscriptionType || 'unknown',
            details: 'Assinatura atualizada e ativa'
          });
        } else if (subscription.status === "canceled") {
          // Assinatura cancelada
          await storage.updateUser(user.id, {
            subscriptionActive: false,
          });
          
          // Registrar evento
          await storage.createSubscriptionEvent({
            userId: user.id,
            eventType: 'subscription_canceled',
            eventDate: new Date().toISOString(),
            planType: user.subscriptionType || 'unknown',
            details: 'Assinatura cancelada'
          });
        }
        
        break;
      }
      
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = invoice.customer as string;
        
        const user = await storage.getUserByStripeCustomerId(stripeCustomerId);
        
        if (!user) {
          console.error(`User not found for Stripe customer: ${stripeCustomerId}`);
          return res.status(404).send(`User not found for Stripe customer: ${stripeCustomerId}`);
        }
        
        // Atualizar data de expiração com base no tipo de plano
        const planType = user.subscriptionType || 'monthly';
        const now = new Date();
        let expiresAt: Date;
        
        if (planType === 'annual') {
          expiresAt = new Date(now);
          expiresAt.setFullYear(now.getFullYear() + 1);
        } else {
          expiresAt = new Date(now);
          expiresAt.setMonth(now.getMonth() + 1);
        }
        
        await storage.updateUser(user.id, {
          subscriptionActive: true,
          subscriptionExpiresAt: expiresAt,
        });
        
        // Registrar evento
        await storage.createSubscriptionEvent({
          userId: user.id,
          eventType: 'payment_succeeded',
          eventDate: new Date().toISOString(),
          planType,
          details: `Pagamento recebido com sucesso. Assinatura estendida até ${format(expiresAt, 'dd/MM/yyyy')}`
        });
        
        // Armazenar recibo/fatura
        await storage.createInvoice({
          userId: user.id,
          clientId: user.clientId,
          status: 'paid',
          amount: (invoice.amount_paid / 100).toString(),
          paymentMethod: 'stripe',
          stripeInvoiceId: invoice.id,
          stripePaymentIntentId: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : null,
          receiptUrl: invoice.hosted_invoice_url || null,
          metadata: { 
            invoiceNumber: invoice.number,
            billingReason: invoice.billing_reason,
            planType
          },
        });
        
        break;
      }
      
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = invoice.customer as string;
        
        const user = await storage.getUserByStripeCustomerId(stripeCustomerId);
        
        if (!user) {
          console.error(`User not found for Stripe customer: ${stripeCustomerId}`);
          return res.status(404).send(`User not found for Stripe customer: ${stripeCustomerId}`);
        }
        
        // Registrar evento
        await storage.createSubscriptionEvent({
          userId: user.id,
          eventType: 'payment_failed',
          eventDate: new Date().toISOString(),
          planType: user.subscriptionType || 'unknown',
          details: 'Falha no pagamento da assinatura'
        });
        
        // Armazenar registro de falha
        await storage.createInvoice({
          userId: user.id,
          clientId: user.clientId,
          status: 'failed',
          amount: (invoice.amount_due / 100).toString(),
          paymentMethod: 'stripe',
          stripeInvoiceId: invoice.id,
          stripePaymentIntentId: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : null,
          metadata: { 
            invoiceNumber: invoice.number,
            billingReason: invoice.billing_reason,
            planType: user.subscriptionType,
            failureReason: invoice.last_payment_error?.message || 'Falha no pagamento'
          },
        });
        
        break;
      }
    }
    
    res.send({ received: true });
  });

  // Endpoint para criar PaymentIntent
  app.post("/api/create-payment-intent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing Stripe API Key");
      }
      
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });
      
      const { amount, planType = 'monthly' } = req.body;
      
      if (!amount) {
        return res.status(400).json({ error: "Amount is required" });
      }
      
      // Converter para centavos (Stripe usa a menor unidade monetária)
      const amountInCents = Math.round(parseFloat(amount) * 100);
      
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: amountInCents,
        currency: "brl",
        payment_method_types: ["card"],
        metadata: {
          userId: req.user?.id.toString(),
          planType,
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Erro ao criar PaymentIntent:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para obter ou criar assinatura
  app.post("/api/get-or-create-subscription", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing Stripe API Key");
      }
      
      if (!process.env.STRIPE_PRICE_ID) {
        throw new Error("Missing Stripe Price ID");
      }
      
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });
      
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: { message: "Não autenticado" } });
      }
      
      // Se já tem uma assinatura ativa, retorná-la
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripeClient.subscriptions.retrieve(user.stripeSubscriptionId);
          
          // Se a assinatura está ativa e tem um PaymentIntent, retornar o client_secret
          if (
            subscription.status !== "canceled" && 
            subscription.latest_invoice && 
            typeof subscription.latest_invoice !== "string"
          ) {
            const paymentIntent = subscription.latest_invoice.payment_intent;
            if (paymentIntent && typeof paymentIntent !== "string") {
              return res.json({
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
        return res.status(400).json({ error: { message: "Usuário sem email cadastrado" } });
      }
      
      try {
        // Verificar se já existe um cliente Stripe para este usuário
        let customerId = user.stripeCustomerId;
        
        if (!customerId) {
          // Criar um novo cliente no Stripe
          const customer = await stripeClient.customers.create({
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
        
        const subscription = await stripeClient.subscriptions.create({
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
            payment_method_types: ["card"]
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
        
        // Fornecer uma resposta de sucesso independentemente de ter client_secret ou não
        // A tela do cliente vai lidar com isso, atualizando a UI
        res.json({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice && 
                        typeof subscription.latest_invoice !== "string" &&
                        subscription.latest_invoice.payment_intent &&
                        typeof subscription.latest_invoice.payment_intent !== "string"
                          ? subscription.latest_invoice.payment_intent.client_secret
                          : null,
          success: true
        });
      } catch (error: any) {
        console.error("Erro ao criar assinatura:", error.message);
        return res.status(400).json({ error: { message: error.message } });
      }
    } catch (error: any) {
      console.error("Error with subscription:", error.message);
      res.status(500).json({ error: { message: error.message } });
    }
  });

  // ==================== ADMIN FINANCE ROUTES ====================
  // Obter estatísticas financeiras (admin)
  app.get("/api/admin/finance/stats", isAdmin, async (req: Request, res: Response) => {
    try {
      // Obter todas as assinaturas
      const subscriptions = await storage.getSubscriptions();
      
      // Obter todas as faturas
      const invoices = await storage.getInvoices();
      
      // Estatísticas básicas
      const totalSubscriptions = subscriptions.length;
      const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
      const annualSubscriptions = subscriptions.filter(s => s.planType === 'annual').length;
      const monthlySubscriptions = subscriptions.filter(s => s.planType === 'monthly').length;
      
      // Calcular faturamento
      let totalRevenue = 0;
      let paidInvoices = 0;
      let failedInvoices = 0;
      
      for (const invoice of invoices) {
        if (invoice.status === 'paid') {
          totalRevenue += parseFloat(invoice.amount);
          paidInvoices++;
        } else if (invoice.status === 'failed') {
          failedInvoices++;
        }
      }
      
      // Calcular média mensal
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlyRevenue = invoices
        .filter(invoice => 
          invoice.status === 'paid' && 
          invoice.createdAt && 
          new Date(invoice.createdAt) >= firstDayOfMonth
        )
        .reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);
      
      // Formatar estatísticas para retorno
      res.json({
        totalSubscriptions,
        activeSubscriptions,
        annualSubscriptions,
        monthlySubscriptions,
        totalRevenue,
        paidInvoices,
        failedInvoices,
        monthlyRevenue,
        currency: 'BRL',
      });
    } catch (error) {
      console.error("Erro ao obter estatísticas financeiras:", error);
      res.status(500).json({ message: "Erro ao obter estatísticas financeiras" });
    }
  });

  // Atualizar configurações financeiras (admin)
  app.post("/api/admin/finance/settings", isAdmin, async (req: Request, res: Response) => {
    try {
      const settings = req.body;
      
      // Atualizar configurações financeiras
      const updatedSettings = await storage.updateFinanceSettings(settings);
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Erro ao atualizar configurações financeiras:", error);
      res.status(500).json({ message: "Erro ao atualizar configurações financeiras" });
    }
  });

  // Obter informações de pagamento de um usuário específico (admin)
  app.get("/api/admin/users/payment-info/:id", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Obter usuário
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Obter assinaturas do usuário
      const subscriptions = await storage.getSubscriptionsByUserId(userId);
      
      // Obter faturas do usuário
      const invoices = await storage.getInvoicesByUserId(userId);
      
      // Formatar resposta
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          subscriptionActive: user.subscriptionActive,
          subscriptionType: user.subscriptionType,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
        },
        subscriptions,
        invoices,
      });
    } catch (error) {
      console.error("Erro ao obter informações de pagamento:", error);
      res.status(500).json({ message: "Erro ao obter informações de pagamento" });
    }
  });

  // ==================== ADMIN USER MANAGEMENT ROUTES ====================
  // Obter todos os usuários (admin)
  app.get("/api/admin/users", isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Erro ao obter usuários:", error);
      res.status(500).json({ message: "Erro ao obter usuários" });
    }
  });

  // Ativar/desativar acesso de usuário (admin)
  app.put("/api/admin/users/:id/toggle-access", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      if (isActive === undefined) {
        return res.status(400).json({ message: "O campo 'isActive' é obrigatório" });
      }
      
      const user = await storage.toggleUserAccess(userId, isActive);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json({
        message: isActive ? "Acesso do usuário ativado" : "Acesso do usuário desativado",
        user
      });
    } catch (error) {
      console.error("Erro ao ativar/desativar acesso:", error);
      res.status(500).json({ message: "Erro ao ativar/desativar acesso" });
    }
  });

  // Enviar lembrete de pagamento para usuário (admin)
  app.post("/api/admin/users/:id/send-payment-reminder", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { customMessage } = req.body;
      
      // Obter usuário
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Enviar email de lembrete
      await sendPaymentReminderEmail(user, customMessage);
      
      res.json({ message: "Lembrete de pagamento enviado com sucesso" });
    } catch (error) {
      console.error("Erro ao enviar lembrete de pagamento:", error);
      res.status(500).json({ message: "Erro ao enviar lembrete de pagamento" });
    }
  });

  // Redefinir senha de usuário (admin)
  app.post("/api/admin/users/:id/reset-password", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Nova senha deve ter pelo menos 6 caracteres" });
      }
      
      // Obter usuário
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Atualizar senha
      const hashedPassword = await hashPassword(newPassword);
      await storage.updatePassword(userId, hashedPassword);
      
      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });

  // Atualizar tipo de perfil de usuário (admin)
  app.put("/api/admin/users/:id/update-profile-type", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { profileType } = req.body;
      
      if (!profileType || !['admin', 'client', 'driver', 'agent', 'shipper'].includes(profileType)) {
        return res.status(400).json({ message: "Tipo de perfil inválido" });
      }
      
      // Obter usuário
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Atualizar tipo de perfil
      const updatedUser = await storage.updateUser(userId, { profileType });
      
      res.json({
        message: "Tipo de perfil atualizado com sucesso",
        user: updatedUser
      });
    } catch (error) {
      console.error("Erro ao atualizar tipo de perfil:", error);
      res.status(500).json({ message: "Erro ao atualizar tipo de perfil" });
    }
  });

  // ==================== PUBLIC ROUTES ====================
  // Estatísticas públicas para a página inicial
  app.get("/api/public/stats", async (req: Request, res: Response) => {
    try {
      // Obter dados necessários
      const allDrivers = await storage.getDrivers();
      const allClients = await storage.getClients();
      const allUsers = await storage.getUsers();
      
      // Obter fretes e filtrar os ativos
      const allFreights = await storage.getFreights();
      const now = new Date();
      const activeFreights = allFreights.filter(freight => 
        new Date(freight.expirationDate) > now && freight.status === 'active'
      );
      
      // Contagem de cidades atendidas
      const citiesSet = new Set<string>();
      
      allFreights.forEach(freight => {
        citiesSet.add(freight.destination);
        
        // Considerar também destinos múltiplos se houver
        freight.destinations?.forEach(dest => {
          citiesSet.add(dest.destination);
        });
      });
      
      // Obter fretes recentes (10 mais recentes por data de criação)
      const recentFreights = [...allFreights]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
      
      // Montar objetos com dados para o frontend  
      const stats = {
        totalFreights: allFreights.length,
        activeFreights: activeFreights.length,
        totalDrivers: allDrivers.length,
        totalCities: citiesSet.size,
        // Anos no mercado (3 conforme indicado no mock)
        yearsActive: 3,
        totalUsers: allUsers.length,
        totalClients: allClients.length,
        recentFreights: recentFreights.map(freight => ({
          id: freight.id,
          origin: freight.origin,
          originState: freight.originState,
          destination: freight.destination,
          destinationState: freight.destinationState,
          value: freight.freightValue,
          createdAt: freight.createdAt
        }))
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching public stats:", error);
      res.status(500).json({ message: "Failed to fetch public statistics" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}