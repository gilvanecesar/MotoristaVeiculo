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
