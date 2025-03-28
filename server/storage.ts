import { 
  drivers, vehicles, 
  type Driver, type InsertDriver,
  type Vehicle, type InsertVehicle, 
  type DriverWithVehicles 
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
}

export class MemStorage implements IStorage {
  private driversData: Map<number, Driver>;
  private vehiclesData: Map<number, Vehicle>;
  private driverCurrentId: number;
  private vehicleCurrentId: number;

  constructor() {
    this.driversData = new Map();
    this.vehiclesData = new Map();
    this.driverCurrentId = 1;
    this.vehicleCurrentId = 1;
    
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
        renavam: "12345678901"
      },
      {
        driverId: 1,
        plate: "DEF5678",
        brand: "Honda",
        model: "Fit",
        year: 2022,
        color: "Preto",
        renavam: "23456789012"
      },
      {
        driverId: 2,
        plate: "GHI9012",
        brand: "Toyota",
        model: "Corolla",
        year: 2023,
        color: "Prata",
        renavam: "34567890123"
      },
      {
        driverId: 3,
        plate: "JKL3456",
        brand: "Mercedes-Benz",
        model: "Sprinter",
        year: 2021,
        color: "Branco",
        renavam: "45678901234"
      },
      {
        driverId: 3,
        plate: "MNO7890",
        brand: "Volvo",
        model: "FH 540",
        year: 2022,
        color: "Vermelho",
        renavam: "56789012345"
      },
      {
        driverId: 4,
        plate: "PQR1357",
        brand: "Fiat",
        model: "Uno",
        year: 2019,
        color: "Azul",
        renavam: "67890123456"
      },
      {
        driverId: 5,
        plate: "STU2468",
        brand: "Scania",
        model: "R 450",
        year: 2020,
        color: "Verde",
        renavam: "78901234567"
      }
    ];
    
    // Adicionar os veículos
    vehicles.forEach(vehicle => {
      this.createVehicle(vehicle);
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
      vehicleType: vehicle.vehicleType || "leve",
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
}

export const storage = new MemStorage();
