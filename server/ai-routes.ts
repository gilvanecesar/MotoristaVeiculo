import { Express, Request, Response } from "express";
import { AITransportService } from "./ai-service";
import { isAuthenticated, isAdmin } from "./middlewares";

export function setupAIRoutes(app: Express) {
  // ==================== ASSISTENTE IA ====================
  
  // Verificar limites de mensagem
  app.get("/api/ai-assistant/limits", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const userProfile = req.user!.profileType;
      const hasActiveSubscription = req.user!.subscriptionActive || false;

      const limits = await AITransportService.checkMessageLimit(userId, userProfile, hasActiveSubscription);
      res.json(limits);
    } catch (error) {
      console.error("Erro ao verificar limites de mensagem:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Obter histórico de mensagens
  app.get("/api/ai-assistant/history", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const history = AITransportService.getMessageHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Enviar mensagem para IA
  app.post("/api/ai-assistant/message", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const userProfile = req.user!.profileType;
      const hasActiveSubscription = req.user!.subscriptionActive || false;
      const userName = req.user!.name;
      const { message } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ message: "Mensagem é obrigatória" });
      }

      if (message.length > 500) {
        return res.status(400).json({ message: "Mensagem muito longa (máximo 500 caracteres)" });
      }

      const result = await AITransportService.processMessage(
        userId, 
        message.trim(), 
        userProfile, 
        hasActiveSubscription,
        userName
      );

      res.json(result);
    } catch (error: any) {
      console.error("Erro ao processar mensagem:", error);
      
      // Erro de limite atingido
      if (error.message.includes('Limite diário')) {
        return res.status(429).json({ message: error.message });
      }
      
      res.status(500).json({ message: error.message || "Erro interno do servidor" });
    }
  });

  // Limpar histórico de mensagens
  app.delete("/api/ai-assistant/history", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      AITransportService.clearHistory(userId);
      res.json({ success: true, message: "Histórico limpo com sucesso" });
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Estatísticas de uso (para administradores)
  app.get("/api/ai-assistant/stats/:userId", isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const stats = AITransportService.getUsageStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
}