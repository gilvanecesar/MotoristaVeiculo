import { Request, Response } from "express";
import { db } from "./db";
import { drivers, driverLocationHistory } from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { isAuthenticated, hasDriverAccess } from "./middlewares";

/**
 * Atualiza a localização atual de um motorista
 */
export async function updateDriverLocation(req: Request, res: Response) {
  try {
    const { driverId } = req.params;
    const { latitude, longitude, accuracy, speed, heading, freightId } = req.body;

    // Validar dados obrigatórios
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: "Latitude e longitude são obrigatórios" 
      });
    }

    // Verificar se o motorista existe
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.id, parseInt(driverId)));

    if (!driver) {
      return res.status(404).json({ error: "Motorista não encontrado" });
    }

    // Atualizar localização atual do motorista
    await db
      .update(drivers)
      .set({
        currentLatitude: latitude.toString(),
        currentLongitude: longitude.toString(),
        lastLocationUpdate: new Date(),
      })
      .where(eq(drivers.id, parseInt(driverId)));

    // Adicionar ao histórico de localização
    await db.insert(driverLocationHistory).values({
      driverId: parseInt(driverId),
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      accuracy: accuracy ? accuracy.toString() : null,
      speed: speed ? speed.toString() : null,
      heading: heading ? heading.toString() : null,
      freightId: freightId ? parseInt(freightId) : null,
    });

    res.json({ 
      success: true, 
      message: "Localização atualizada com sucesso",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erro ao atualizar localização do motorista:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

/**
 * Obtém a localização atual de um motorista
 */
export async function getDriverLocation(req: Request, res: Response) {
  try {
    const { driverId } = req.params;

    const [driver] = await db
      .select({
        id: drivers.id,
        name: drivers.name,
        currentLatitude: drivers.currentLatitude,
        currentLongitude: drivers.currentLongitude,
        lastLocationUpdate: drivers.lastLocationUpdate,
        locationEnabled: drivers.locationEnabled,
      })
      .from(drivers)
      .where(eq(drivers.id, parseInt(driverId)));

    if (!driver) {
      return res.status(404).json({ error: "Motorista não encontrado" });
    }

    res.json(driver);
  } catch (error) {
    console.error("Erro ao buscar localização do motorista:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

/**
 * Obtém o histórico de localização de um motorista
 */
export async function getDriverLocationHistory(req: Request, res: Response) {
  try {
    const { driverId } = req.params;
    const { hours = 24, freightId } = req.query;

    // Calcular data de início baseada nas horas
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - parseInt(hours as string));

    let whereCondition = and(
      eq(driverLocationHistory.driverId, parseInt(driverId)),
      gte(driverLocationHistory.timestamp, startDate)
    );

    // Filtrar por frete específico se fornecido
    if (freightId) {
      whereCondition = and(
        whereCondition,
        eq(driverLocationHistory.freightId, parseInt(freightId as string))
      );
    }

    const history = await db
      .select()
      .from(driverLocationHistory)
      .where(whereCondition)
      .orderBy(desc(driverLocationHistory.timestamp))
      .limit(1000); // Limitar a 1000 pontos para performance

    res.json(history);
  } catch (error) {
    console.error("Erro ao buscar histórico de localização:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

/**
 * Habilita/desabilita rastreamento GPS para um motorista
 */
export async function toggleDriverLocationTracking(req: Request, res: Response) {
  try {
    const { driverId } = req.params;
    const { enabled } = req.body;

    await db
      .update(drivers)
      .set({
        locationEnabled: enabled,
      })
      .where(eq(drivers.id, parseInt(driverId)));

    res.json({ 
      success: true, 
      message: `Rastreamento GPS ${enabled ? 'habilitado' : 'desabilitado'} com sucesso`
    });
  } catch (error) {
    console.error("Erro ao alterar configuração de rastreamento:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

/**
 * Obtém todos os motoristas com suas localizações atuais
 */
export async function getAllDriversWithLocations(req: Request, res: Response) {
  try {
    const driversWithLocations = await db
      .select({
        id: drivers.id,
        name: drivers.name,
        phone: drivers.phone,
        currentLatitude: drivers.currentLatitude,
        currentLongitude: drivers.currentLongitude,
        lastLocationUpdate: drivers.lastLocationUpdate,
        locationEnabled: drivers.locationEnabled,
      })
      .from(drivers)
      .where(eq(drivers.locationEnabled, true));

    // Filtrar apenas motoristas com localização válida
    const activeDrivers = driversWithLocations.filter(driver => 
      driver.currentLatitude && driver.currentLongitude
    );

    res.json(activeDrivers);
  } catch (error) {
    console.error("Erro ao buscar motoristas com localização:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}