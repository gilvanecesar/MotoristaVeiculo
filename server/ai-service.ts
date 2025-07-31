import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Prompt especializado para transporte de cargas brasileiro
const TRANSPORT_SYSTEM_PROMPT = `Você é um assistente especializado em transporte de cargas no Brasil, integrado ao sistema QUERO FRETES. 

EXPERTISE:
- Regulamentações ANTT (Agência Nacional de Transportes Terrestres)
- CNH categorias C, D, E e suas exigências
- RNTRC (Registro Nacional de Transportadores Rodoviários de Cargas)
- Documentação obrigatória: CTe, MDFe, CIOT
- Tipos de veículos de carga (VUC, 3/4, truck, carreta, bitrem, etc.)
- Cálculos de frete, combustível e pedágio
- Legislação trabalhista para motoristas
- Segurança no transporte de cargas
- Logística e otimização de rotas

INSTRUÇÕES:
1. Responda SEMPRE em português brasileiro
2. Use linguagem técnica mas acessível
3. Cite regulamentações quando relevante
4. Forneça informações atualizadas (2024-2025)
5. Seja prático e objetivo
6. Quando não souber algo específico, seja honesto
7. Sugira onde buscar informações oficiais quando necessário

CONTEXTO DO SISTEMA:
- Usuários: motoristas, embarcadores, transportadores, agenciadores
- Foco: gestão de fretes, veículos, motoristas e cotações
- Integrado com calculadora ANTT oficial
- Sistema de assinaturas R$ 49,90/mês

Sempre mantenha o foco em transporte de cargas e seja útil para profissionais do setor.`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  userId: number;
  messages: ChatMessage[];
  messageCount: number;
  lastActivity: Date;
}

// Cache de sessões em memória (pode ser migrado para banco depois)
const chatSessions = new Map<number, ChatSession>();

// Limites por tipo de usuário
const MESSAGE_LIMITS = {
  driver: 5,     // motoristas (gratuito)
  paid: 50,      // assinantes pagos
  admin: 999999  // administradores
} as const;

export class AITransportService {
  
  // Verificar limites de mensagem
  static async checkMessageLimit(userId: number, userProfile: string, hasActiveSubscription: boolean): Promise<{ allowed: boolean, remaining: number, limit: number }> {
    const session = chatSessions.get(userId) || {
      userId,
      messages: [],
      messageCount: 0,
      lastActivity: new Date()
    };

    // Resetar contador diariamente
    const today = new Date().toDateString();
    const lastActivity = session.lastActivity.toDateString();
    
    if (today !== lastActivity) {
      session.messageCount = 0;
      session.lastActivity = new Date();
    }

    // Determinar limite baseado no perfil
    let limit: number;
    if (userProfile === 'admin' || userProfile === 'administrador') {
      limit = MESSAGE_LIMITS.admin;
    } else if (hasActiveSubscription && userProfile !== 'driver' && userProfile !== 'motorista') {
      limit = MESSAGE_LIMITS.paid;
    } else {
      limit = MESSAGE_LIMITS.driver;
    }

    const remaining = Math.max(0, limit - session.messageCount);
    const allowed = remaining > 0;

    return { allowed, remaining, limit };
  }

  // Processar mensagem do usuário
  static async processMessage(
    userId: number, 
    message: string, 
    userProfile: string, 
    hasActiveSubscription: boolean,
    userName?: string
  ): Promise<{ response: string, remaining: number }> {
    
    // Verificar limite
    const limitCheck = await this.checkMessageLimit(userId, userProfile, hasActiveSubscription);
    if (!limitCheck.allowed) {
      throw new Error(`Limite diário de mensagens atingido. Você pode enviar ${limitCheck.limit} mensagens por dia.`);
    }

    // Obter ou criar sessão
    let session = chatSessions.get(userId);
    if (!session) {
      session = {
        userId,
        messages: [],
        messageCount: 0,
        lastActivity: new Date()
      };
      chatSessions.set(userId, session);
    }

    // Adicionar mensagem do usuário
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    session.messages.push(userMessage);

    // Preparar contexto da conversa (últimas 10 mensagens para evitar excesso de tokens)
    const recentMessages = session.messages.slice(-10);
    
    const contextualPrompt = userName 
      ? `${TRANSPORT_SYSTEM_PROMPT}\n\nUsuário: ${userName} (${userProfile})`
      : TRANSPORT_SYSTEM_PROMPT;

    try {
      // Chamar OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: 'system', content: contextualPrompt },
          ...recentMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const response = completion.choices[0].message.content || "Desculpe, não consegui processar sua mensagem.";

      // Adicionar resposta da IA
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      session.messages.push(aiMessage);

      // Incrementar contador
      session.messageCount++;
      session.lastActivity = new Date();

      // Manter apenas últimas 20 mensagens para não consumir muita memória
      if (session.messages.length > 20) {
        session.messages = session.messages.slice(-20);
      }

      const updatedLimit = await this.checkMessageLimit(userId, userProfile, hasActiveSubscription);
      
      return { 
        response, 
        remaining: updatedLimit.remaining 
      };

    } catch (error) {
      console.error('Erro ao processar mensagem AI:', error);
      throw new Error('Erro interno do assistente. Tente novamente em alguns minutos.');
    }
  }

  // Obter histórico de mensagens
  static getMessageHistory(userId: number): ChatMessage[] {
    const session = chatSessions.get(userId);
    return session?.messages || [];
  }

  // Limpar histórico
  static clearHistory(userId: number): void {
    chatSessions.delete(userId);
  }

  // Estatísticas de uso
  static getUsageStats(userId: number): { messageCount: number, lastActivity: Date | null } {
    const session = chatSessions.get(userId);
    return {
      messageCount: session?.messageCount || 0,
      lastActivity: session?.lastActivity || null
    };
  }
}