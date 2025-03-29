import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { driverValidator, vehicleValidator, clientValidator, freightValidator, freightDestinationValidator } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { 
  isAuthenticated, 
  isAdmin, 
  isAdminOrSelf,
  hasClientAccess,
  hasDriverAccess,
  hasFreightAccess,
  hasVehicleAccess
} from "./middlewares";
import { createCheckoutSession, createPortalSession, handleWebhook } from "./stripe";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticação
  setupAuth(app);
  // API routes for drivers
  app.get("/api/drivers", async (req: Request, res: Response) => {
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

  app.get("/api/drivers/:id", async (req: Request, res: Response) => {
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

  app.post("/api/drivers", async (req: Request, res: Response) => {
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
  app.get("/api/vehicles", async (req: Request, res: Response) => {
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

  app.get("/api/vehicles/:id", async (req: Request, res: Response) => {
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

  app.post("/api/vehicles", async (req: Request, res: Response) => {
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

  app.post("/api/clients", async (req: Request, res: Response) => {
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
  app.get("/api/freights", async (req: Request, res: Response) => {
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

  app.get("/api/freights/:id", isAuthenticated, async (req: Request, res: Response) => {
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

  app.post("/api/freights", async (req: Request, res: Response) => {
    try {
      const freightData = freightValidator.parse(req.body);
      const freight = await storage.createFreight(freightData);
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
      
      // Obter o frete existente para preservar o clientId
      const existingFreight = await storage.getFreight(id);
      if (!existingFreight) {
        return res.status(404).json({ message: "Freight not found" });
      }
      
      // Validar os dados do frete
      const freightData = freightValidator.parse(req.body);
      
      // Preservar o clientId original, garantindo que o dono do frete não mude
      const updatedFreightData = {
        ...freightData,
        clientId: existingFreight.clientId
      };
      
      // Atualizar o frete mantendo o clientId original
      const freight = await storage.updateFreight(id, updatedFreightData);
      
      if (!freight) {
        return res.status(404).json({ message: "Freight not found" });
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
  app.get("/api/freight-destinations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const freightId = req.query.freightId ? parseInt(req.query.freightId as string) : undefined;
      
      if (!freightId) {
        return res.status(400).json({ message: "Freight ID is required" });
      }
      
      // Verificar se o usuário tem acesso ao frete
      if (req.user?.profileType !== "admin") {
        const freight = await storage.getFreight(freightId);
        if (!freight) {
          return res.status(404).json({ message: "Freight not found" });
        }
        
        // Verificar se o frete pertence ao cliente do usuário
        if (freight.clientId !== req.user?.clientId) {
          return res.status(403).json({ message: "Acesso não autorizado a este destino de frete" });
        }
      }
      
      const destinations = await storage.getFreightDestinations(freightId);
      res.json(destinations);
    } catch (error) {
      console.error("Error fetching freight destinations:", error);
      res.status(500).json({ message: "Failed to fetch freight destinations" });
    }
  });

  app.post("/api/freight-destinations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const destinationData = freightDestinationValidator.parse(req.body);
      
      // Verificar se o usuário tem acesso ao frete associado ao destino
      if (req.user?.profileType !== "admin") {
        const freight = await storage.getFreight(destinationData.freightId);
        if (!freight) {
          return res.status(404).json({ message: "Freight not found" });
        }
        
        // Verificar se o frete pertence ao cliente do usuário
        if (freight.clientId !== req.user?.clientId) {
          return res.status(403).json({ message: "Acesso não autorizado para adicionar destinos a este frete" });
        }
      }
      
      const destination = await storage.createFreightDestination(destinationData);
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

  app.delete("/api/freight-destinations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Buscar o destino do frete para verificar a permissão
      const destinations = await storage.getFreightDestinations(-1); // Obter todos os destinos
      const destination = destinations.find(d => d.id === id);
      
      if (!destination) {
        return res.status(404).json({ message: "Freight destination not found" });
      }
      
      // Verificar se o usuário tem acesso ao frete associado ao destino
      if (req.user?.profileType !== "admin") {
        const freight = await storage.getFreight(destination.freightId);
        if (!freight) {
          return res.status(404).json({ message: "Freight not found" });
        }
        
        // Verificar se o frete pertence ao cliente do usuário
        if (freight.clientId !== req.user?.clientId) {
          return res.status(403).json({ message: "Acesso não autorizado para excluir este destino de frete" });
        }
      }

      const success = await storage.deleteFreightDestination(id);
      if (!success) {
        return res.status(404).json({ message: "Freight destination not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting freight destination:", error);
      res.status(500).json({ message: "Failed to delete freight destination" });
    }
  });

  // Rota para associar um cliente existente ao usuário logado
  app.post("/api/users/associate-client", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { clientId } = req.body;
      
      if (!clientId) {
        return res.status(400).json({ message: "Client ID is required" });
      }
      
      const id = parseInt(clientId);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID format" });
      }
      
      // Verificar se o cliente existe
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Atualizar o usuário com o clientId
      const userId = req.user.id;
      const user = await storage.updateUser(userId, { clientId: id });
      
      if (!user) {
        return res.status(404).json({ message: "Failed to update user" });
      }
      
      // Atualiza o objeto req.user para refletir a mudança
      req.user.clientId = id;
      
      res.status(200).json({ message: "Client associated successfully", user });
    } catch (error) {
      console.error("Error associating client to user:", error);
      res.status(500).json({ message: "Failed to associate client to user" });
    }
  });

  // Rotas de pagamento com Stripe
  app.post("/api/create-checkout-session", isAuthenticated, createCheckoutSession);
  app.post("/api/create-portal-session", isAuthenticated, createPortalSession);
  app.post("/api/stripe-webhook", express.raw({ type: 'application/json' }), handleWebhook);

  const httpServer = createServer(app);
  return httpServer;
}
