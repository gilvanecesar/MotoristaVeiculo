import { 
  drivers, vehicles, clients, freights, freightDestinations,
  type Driver, type InsertDriver,
  type Vehicle, type InsertVehicle, 
  type Client, type InsertClient,
  type Freight, type InsertFreight,
  type FreightDestination, type InsertFreightDestination,
  type DriverWithVehicles,
  type FreightWithDestinations
} from "@shared/schema";

export interface IStorage {
  // Driver operations
  getDrivers(): Promise<DriverWithVehicles[]>;
  getDriver(id: number): Promise<DriverWithVehicles | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver | undefined>;
  deleteDriver(id: number): Promise<boolean>;
  searchDrivers(query: string): Promise<DriverWithVehicles[]>;
  
  // Vehicle operations
  getVehicles(): Promise<Vehicle[]>;
  getVehiclesByDriver(driverId: number): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  searchVehicles(query: string): Promise<Vehicle[]>;
  
  // Client operations
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  searchClients(query: string): Promise<Client[]>;
  
  // Freight operations
  getFreights(): Promise<FreightWithDestinations[]>;
  getFreight(id: number): Promise<FreightWithDestinations | undefined>;
  createFreight(freight: InsertFreight): Promise<Freight>;
  updateFreight(id: number, freight: Partial<InsertFreight>): Promise<Freight | undefined>;
  deleteFreight(id: number): Promise<boolean>;
  searchFreights(query: string): Promise<FreightWithDestinations[]>;
  
  // FreightDestination operations
  getFreightDestinations(freightId: number): Promise<FreightDestination[]>;
  createFreightDestination(destination: InsertFreightDestination): Promise<FreightDestination>;
  deleteFreightDestination(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private driversData: Map<number, Driver>;
  private vehiclesData: Map<number, Vehicle>;
  private clientsData: Map<number, Client>;
  private freightsData: Map<number, Freight>;
  private freightDestinationsData: Map<number, FreightDestination>;
  private driverCurrentId: number;
  private vehicleCurrentId: number;
  private clientCurrentId: number;
  private freightCurrentId: number;
  private freightDestinationCurrentId: number;

  constructor() {
    this.driversData = new Map();
    this.vehiclesData = new Map();
    this.clientsData = new Map();
    this.freightsData = new Map();
    this.freightDestinationsData = new Map();
    this.driverCurrentId = 1;
    this.vehicleCurrentId = 1;
    this.clientCurrentId = 1;
    this.freightCurrentId = 1;
    this.freightDestinationCurrentId = 1;
    
    // Criar uma população fictícia de motoristas e veículos
    this.createDummyData();
  }
  
  // Método para criar dados fictícios
  private createDummyData() {
    // Drivers
    const drivers: InsertDriver[] = [
      {
        name: "João Silva",
        email: "joao.silva@email.com",
        cpf: "123.456.789-00",
        phone: "(11) 98765-4321",
        whatsapp: "11987654321",
        birthdate: "1985-05-15",
        cnh: "12345678901",
        cnhCategory: "AB",
        cnhExpiration: "2027-05-15",
        cnhIssueDate: "2022-05-15",
        street: "Av. Paulista",
        number: "1000",
        complement: "Apto 123",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        zipcode: "01310-100"
      },
      {
        name: "Maria Oliveira",
        email: "maria.oliveira@email.com",
        cpf: "987.654.321-00",
        phone: "(11) 91234-5678",
        whatsapp: "11912345678",
        birthdate: "1990-10-20",
        cnh: "98765432109",
        cnhCategory: "B",
        cnhExpiration: "2026-10-20",
        cnhIssueDate: "2021-10-20",
        street: "Rua Augusta",
        number: "500",
        complement: null,
        neighborhood: "Consolação",
        city: "São Paulo",
        state: "SP",
        zipcode: "01305-000"
      },
      {
        name: "Pedro Santos",
        email: "pedro.santos@email.com",
        cpf: "456.789.123-00",
        phone: "(11) 95555-9999",
        whatsapp: "11955559999",
        birthdate: "1982-03-08",
        cnh: "45678912345",
        cnhCategory: "D",
        cnhExpiration: "2025-03-08",
        cnhIssueDate: "2020-03-08",
        street: "Rua Teodoro Sampaio",
        number: "1500",
        complement: "Bloco B, Apto 45",
        neighborhood: "Pinheiros",
        city: "São Paulo",
        state: "SP",
        zipcode: "05406-100"
      },
      {
        name: "Ana Ferreira",
        email: "ana.ferreira@email.com",
        cpf: "111.222.333-44",
        phone: "(11) 97777-8888",
        whatsapp: "11977778888",
        birthdate: "1995-12-25",
        cnh: "11122233344",
        cnhCategory: "B",
        cnhExpiration: "2028-12-25",
        cnhIssueDate: "2023-12-25",
        street: "Avenida Rebouças",
        number: "3000",
        complement: null,
        neighborhood: "Jardim Paulista",
        city: "São Paulo",
        state: "SP",
        zipcode: "05402-600"
      },
      {
        name: "Carlos Souza",
        email: "carlos.souza@email.com",
        cpf: "555.666.777-88",
        phone: "(11) 96666-3333",
        whatsapp: "11966663333",
        birthdate: "1988-07-30",
        cnh: "55566677788",
        cnhCategory: "AE",
        cnhExpiration: "2026-07-30",
        cnhIssueDate: "2021-07-30",
        street: "Rua Oscar Freire",
        number: "1200",
        complement: "Casa 2",
        neighborhood: "Jardins",
        city: "São Paulo",
        state: "SP",
        zipcode: "01426-001"
      }
    ];
    
    // Adicionar os motoristas
    drivers.forEach(driver => {
      this.createDriver(driver);
    });
    
    // Vehicles para os drivers criados
    const vehicles: InsertVehicle[] = [
      {
        driverId: 1,
        plate: "ABC1234",
        brand: "Volkswagen",
        model: "Gol",
        year: 2020,
        color: "Branco",
        renavam: "12345678901",
        vehicleType: "leve_fiorino",
        bodyType: "fechada"
      },
      {
        driverId: 1,
        plate: "DEF5678",
        brand: "Honda",
        model: "Fit",
        year: 2022,
        color: "Preto",
        renavam: "23456789012",
        vehicleType: "leve_vlc",
        bodyType: "fechada"
      },
      {
        driverId: 2,
        plate: "GHI9012",
        brand: "Toyota",
        model: "Corolla",
        year: 2023,
        color: "Prata",
        renavam: "34567890123",
        vehicleType: "leve_toco",
        bodyType: "aberta"
      },
      {
        driverId: 3,
        plate: "JKL3456",
        brand: "Mercedes-Benz",
        model: "Sprinter",
        year: 2021,
        color: "Branco",
        renavam: "45678901234",
        vehicleType: "medio_truck",
        bodyType: "bau"
      },
      {
        driverId: 3,
        plate: "MNO7890",
        brand: "Volvo",
        model: "FH 540",
        year: 2022,
        color: "Vermelho",
        renavam: "56789012345",
        vehicleType: "pesado_carreta",
        bodyType: "graneleira"
      },
      {
        driverId: 4,
        plate: "PQR1357",
        brand: "Fiat",
        model: "Uno",
        year: 2019,
        color: "Azul",
        renavam: "67890123456",
        vehicleType: "leve_todos",
        bodyType: "fechada"
      },
      {
        driverId: 5,
        plate: "STU2468",
        brand: "Scania",
        model: "R 450",
        year: 2020,
        color: "Verde",
        renavam: "78901234567",
        vehicleType: "pesado_vanderleia",
        bodyType: "tanque"
      }
    ];
    
    // Adicionar os veículos
    vehicles.forEach(vehicle => {
      this.createVehicle(vehicle);
    });
    
    // Clients
    const clients: InsertClient[] = [
      {
        name: "Transportadora Rápida Ltda",
        email: "contato@transportadorarapida.com.br",
        phone: "(11) 3333-4444",
        whatsapp: "11933334444",
        documentType: "cnpj",
        document: "12.345.678/0001-90",
        street: "Av. das Nações Unidas",
        number: "12000",
        complement: "Sala 1500",
        neighborhood: "Brooklin",
        city: "São Paulo",
        state: "SP",
        zipcode: "04578-000",
        notes: "Cliente desde 2020, ótimo pagador"
      },
      {
        name: "Distribuidora Nacional S/A",
        email: "comercial@disnacional.com.br",
        phone: "(11) 2222-7777",
        whatsapp: "11922227777",
        documentType: "cnpj",
        document: "98.765.432/0001-10",
        street: "Rodovia Anhanguera",
        number: "5000",
        complement: "Galpão 15",
        neighborhood: "Vila Jaguara",
        city: "São Paulo",
        state: "SP",
        zipcode: "05112-000",
        notes: null
      },
      {
        name: "Agro Mercantil Ltda",
        email: "contato@agromercantil.com.br",
        phone: "(16) 3555-8877",
        whatsapp: "16935558877",
        documentType: "cnpj",
        document: "45.678.901/0001-23",
        street: "Rodovia Washington Luís",
        number: "230",
        complement: "Km 230",
        neighborhood: "Zona Rural",
        city: "São Carlos",
        state: "SP",
        zipcode: "13560-970",
        notes: "Trabalha com produtos agrícolas"
      }
    ];
    
    // Adicionar os clientes
    clients.forEach(client => {
      this.createClient(client);
    });
    
    // Freights
    const freights: InsertFreight[] = [
      {
        clientId: 1,
        origin: "São Paulo",
        originState: "SP",
        destination: "Rio de Janeiro",
        destinationState: "RJ",
        cargoType: "completa",
        needsTarp: "sim",
        productType: "Eletrônicos",
        cargoWeight: "12500",
        vehicleType: "pesado_carreta",
        bodyType: "bau",
        freightValue: "5800",
        tollOption: "a_parte",
        paymentMethod: "30_dias",
        observations: "Carga de alto valor, requer cuidados especiais no transporte",
        hasMultipleDestinations: true,
        status: "aberto",
        contactName: "Roberto Carlos",
        contactPhone: "(11) 98765-4321"
      },
      {
        clientId: 2,
        origin: "Campinas",
        originState: "SP",
        destination: "Belo Horizonte",
        destinationState: "MG",
        cargoType: "completa",
        needsTarp: "nao",
        productType: "Produtos químicos",
        cargoWeight: "28000",
        vehicleType: "pesado_vanderleia",
        bodyType: "tanque",
        freightValue: "7200",
        tollOption: "incluso",
        paymentMethod: "a_vista",
        observations: "Produto perigoso, motorista com treinamento para transportes de produtos químicos",
        hasMultipleDestinations: false,
        status: "aberto",
        contactName: "Ana Paula Silva",
        contactPhone: "(11) 97777-8888"
      },
      {
        clientId: 3,
        origin: "Ribeirão Preto",
        originState: "SP",
        destination: "Brasília",
        destinationState: "DF",
        cargoType: "complemento",
        needsTarp: "sim",
        productType: "Alimentos",
        cargoWeight: "4800",
        vehicleType: "medio_truck",
        bodyType: "bau",
        freightValue: "2900",
        tollOption: "a_parte",
        paymentMethod: "15_dias",
        observations: "Alimentos perecíveis, necessário controle de temperatura",
        hasMultipleDestinations: false,
        status: "aberto",
        contactName: "Carlos Eduardo Lima",
        contactPhone: "(16) 98765-1234"
      }
    ];
    
    // Adicionar os fretes
    freights.forEach(freight => {
      this.createFreight(freight);
    });
    
    // Freight Destinations
    const destinations: InsertFreightDestination[] = [
      {
        freightId: 1,
        destination: "Rio de Janeiro",
        destinationState: "RJ",
        order: 1
      },
      {
        freightId: 2,
        destination: "Belo Horizonte",
        destinationState: "MG",
        order: 1
      },
      {
        freightId: 3,
        destination: "Brasília",
        destinationState: "DF",
        order: 1
      },
      {
        freightId: 1,
        destination: "Vitória",
        destinationState: "ES",
        order: 2
      }
    ];
    
    // Adicionar os destinos
    destinations.forEach(destination => {
      this.createFreightDestination(destination);
    });
  }

  // Helper methods
  private getDriverWithVehicles(driver: Driver): DriverWithVehicles {
    const driverVehicles = Array.from(this.vehiclesData.values())
      .filter(v => v.driverId === driver.id);
    
    return {
      ...driver,
      vehicles: driverVehicles
    };
  }

  // Driver methods
  async getDrivers(): Promise<DriverWithVehicles[]> {
    return Array.from(this.driversData.values())
      .map(driver => this.getDriverWithVehicles(driver))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getDriver(id: number): Promise<DriverWithVehicles | undefined> {
    const driver = this.driversData.get(id);
    if (!driver) return undefined;
    
    return this.getDriverWithVehicles(driver);
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const id = this.driverCurrentId++;
    const now = new Date();
    
    const newDriver: Driver = {
      ...driver,
      id,
      createdAt: now
    };
    
    this.driversData.set(id, newDriver);
    return newDriver;
  }

  async updateDriver(id: number, driverUpdate: Partial<InsertDriver>): Promise<Driver | undefined> {
    const driver = this.driversData.get(id);
    if (!driver) return undefined;
    
    const updatedDriver: Driver = {
      ...driver,
      ...driverUpdate
    };
    
    this.driversData.set(id, updatedDriver);
    return updatedDriver;
  }

  async deleteDriver(id: number): Promise<boolean> {
    const exists = this.driversData.has(id);
    if (!exists) return false;
    
    // Delete all vehicles for this driver first
    const vehicles = Array.from(this.vehiclesData.values())
      .filter(v => v.driverId === id);
    
    for (const vehicle of vehicles) {
      this.vehiclesData.delete(vehicle.id);
    }
    
    return this.driversData.delete(id);
  }

  async searchDrivers(query: string): Promise<DriverWithVehicles[]> {
    if (!query) return this.getDrivers();
    
    const normalizedQuery = query.toLowerCase();
    
    return Array.from(this.driversData.values())
      .filter(driver => 
        driver.name.toLowerCase().includes(normalizedQuery) ||
        driver.email.toLowerCase().includes(normalizedQuery) ||
        driver.cpf.includes(normalizedQuery) ||
        driver.cnh.includes(normalizedQuery)
      )
      .map(driver => this.getDriverWithVehicles(driver));
  }

  // Vehicle methods
  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehiclesData.values());
  }

  async getVehiclesByDriver(driverId: number): Promise<Vehicle[]> {
    return Array.from(this.vehiclesData.values())
      .filter(vehicle => vehicle.driverId === driverId);
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehiclesData.get(id);
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.vehicleCurrentId++;
    const now = new Date();
    
    const newVehicle: Vehicle = {
      ...vehicle,
      id,
      vehicleType: vehicle.vehicleType || "leve_todos",
      bodyType: vehicle.bodyType || "fechada",
      createdAt: now
    };
    
    this.vehiclesData.set(id, newVehicle);
    return newVehicle;
  }

  async updateVehicle(id: number, vehicleUpdate: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const vehicle = this.vehiclesData.get(id);
    if (!vehicle) return undefined;
    
    const updatedVehicle: Vehicle = {
      ...vehicle,
      ...vehicleUpdate
    };
    
    this.vehiclesData.set(id, updatedVehicle);
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    return this.vehiclesData.delete(id);
  }

  async searchVehicles(query: string): Promise<Vehicle[]> {
    if (!query) return this.getVehicles();
    
    const normalizedQuery = query.toLowerCase();
    
    return Array.from(this.vehiclesData.values())
      .filter(vehicle => 
        vehicle.plate.toLowerCase().includes(normalizedQuery) ||
        vehicle.brand.toLowerCase().includes(normalizedQuery) ||
        vehicle.model.toLowerCase().includes(normalizedQuery) ||
        vehicle.color.toLowerCase().includes(normalizedQuery) ||
        (vehicle.renavam && vehicle.renavam.includes(normalizedQuery))
      );
  }
  
  // Client methods
  async getClients(): Promise<Client[]> {
    return Array.from(this.clientsData.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async getClient(id: number): Promise<Client | undefined> {
    return this.clientsData.get(id);
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    const id = this.clientCurrentId++;
    const now = new Date();
    
    const newClient: Client = {
      ...client,
      id,
      createdAt: now
    };
    
    this.clientsData.set(id, newClient);
    return newClient;
  }
  
  async updateClient(id: number, clientUpdate: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clientsData.get(id);
    if (!client) return undefined;
    
    const updatedClient: Client = {
      ...client,
      ...clientUpdate
    };
    
    this.clientsData.set(id, updatedClient);
    return updatedClient;
  }
  
  async deleteClient(id: number): Promise<boolean> {
    return this.clientsData.delete(id);
  }
  
  async searchClients(query: string): Promise<Client[]> {
    if (!query) return this.getClients();
    
    const normalizedQuery = query.toLowerCase();
    
    return Array.from(this.clientsData.values())
      .filter(client => 
        client.name.toLowerCase().includes(normalizedQuery) ||
        client.email.toLowerCase().includes(normalizedQuery) ||
        (client.document && client.document.includes(normalizedQuery)) ||
        client.phone.includes(normalizedQuery)
      );
  }
  
  // Helper method for freight with destinations
  private getFreightWithDestinations(freight: Freight): FreightWithDestinations {
    const destinations = Array.from(this.freightDestinationsData.values())
      .filter(d => d.freightId === freight.id);
    
    return {
      ...freight,
      destinations
    };
  }
  
  // Freight methods
  async getFreights(): Promise<FreightWithDestinations[]> {
    return Array.from(this.freightsData.values())
      .map(freight => this.getFreightWithDestinations(freight))
      .sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.getTime() - a.createdAt.getTime(); // mais recentes primeiro
        }
        return 0;
      });
  }
  
  async getFreight(id: number): Promise<FreightWithDestinations | undefined> {
    const freight = this.freightsData.get(id);
    if (!freight) return undefined;
    
    return this.getFreightWithDestinations(freight);
  }
  
  async createFreight(freight: InsertFreight): Promise<Freight> {
    const id = this.freightCurrentId++;
    const now = new Date();
    
    const newFreight: Freight = {
      ...freight,
      id,
      createdAt: now
    };
    
    this.freightsData.set(id, newFreight);
    return newFreight;
  }
  
  async updateFreight(id: number, freightUpdate: Partial<InsertFreight>): Promise<Freight | undefined> {
    const freight = this.freightsData.get(id);
    if (!freight) return undefined;
    
    const updatedFreight: Freight = {
      ...freight,
      ...freightUpdate
    };
    
    this.freightsData.set(id, updatedFreight);
    return updatedFreight;
  }
  
  async deleteFreight(id: number): Promise<boolean> {
    const exists = this.freightsData.has(id);
    if (!exists) return false;
    
    // Excluir todos os destinos associados a este frete
    const destinations = Array.from(this.freightDestinationsData.values())
      .filter(d => d.freightId === id);
    
    for (const destination of destinations) {
      this.freightDestinationsData.delete(destination.id);
    }
    
    return this.freightsData.delete(id);
  }
  
  async searchFreights(query: string): Promise<FreightWithDestinations[]> {
    if (!query) return this.getFreights();
    
    const normalizedQuery = query.toLowerCase();
    
    return Array.from(this.freightsData.values())
      .filter(freight => 
        freight.origin.toLowerCase().includes(normalizedQuery) ||
        freight.productType.toLowerCase().includes(normalizedQuery) ||
        freight.vehicleType.toLowerCase().includes(normalizedQuery) ||
        freight.bodyType.toLowerCase().includes(normalizedQuery)
      )
      .map(freight => this.getFreightWithDestinations(freight));
  }
  
  // FreightDestination methods
  async getFreightDestinations(freightId: number): Promise<FreightDestination[]> {
    return Array.from(this.freightDestinationsData.values())
      .filter(destination => destination.freightId === freightId);
  }
  
  async createFreightDestination(destination: InsertFreightDestination): Promise<FreightDestination> {
    const id = this.freightDestinationCurrentId++;
    const now = new Date();
    
    const newDestination: FreightDestination = {
      ...destination,
      id,
      createdAt: now
    };
    
    this.freightDestinationsData.set(id, newDestination);
    return newDestination;
  }
  
  async deleteFreightDestination(id: number): Promise<boolean> {
    return this.freightDestinationsData.delete(id);
  }
}

export const storage = new MemStorage();
