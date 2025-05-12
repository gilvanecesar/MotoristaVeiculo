import { db } from "./db";
import { storage } from "./storage";

/**
 * Função para verificar assinaturas de teste expiradas e desativá-las automaticamente
 * Esta função deve ser chamada periodicamente para garantir que os usuários não continuem
 * usando o sistema após o término do período de teste de 7 dias.
 */
export async function checkExpiredTrials() {
  try {
    console.log("[Verificador de Assinaturas] Iniciando verificação de períodos de teste expirados...");
    
    // Busca todos os usuários com assinatura tipo trial e status ativo
    const result = await db.execute(
      `SELECT id, email, name, subscription_type, subscription_active, subscription_expires_at, created_at 
       FROM users 
       WHERE subscription_type = 'trial' AND subscription_active = true`
    );
    
    if (!Array.isArray(result.rows) || result.rows.length === 0) {
      console.log("[Verificador de Assinaturas] Nenhum usuário com período de teste ativo encontrado.");
      return;
    }
    
    console.log(`[Verificador de Assinaturas] Encontrados ${result.rows.length} usuários com período de teste ativo.`);
    
    const currentDate = new Date();
    const trialDays = 7;
    let expiredCount = 0;
    
    // Processa cada usuário
    for (const user of result.rows) {
      try {
        // Se tiver data de expiração definida
        if (user.subscription_expires_at) {
          const expirationDate = new Date(String(user.subscription_expires_at));
          
          if (currentDate > expirationDate) {
            console.log(`[Verificador de Assinaturas] Desativando período de teste expirado para usuário ID ${user.id}, email: ${user.email}`);
            
            await storage.updateUser(user.id, { 
              subscriptionActive: false,
              paymentRequired: true
            });
            
            expiredCount++;
          }
        } 
        // Se não tiver data de expiração, calcula baseado na data de criação
        else if (user.created_at) {
          const createdAt = new Date(String(user.created_at));
          const calculatedExpirationDate = new Date(createdAt);
          calculatedExpirationDate.setDate(createdAt.getDate() + trialDays);
          
          if (currentDate > calculatedExpirationDate) {
            console.log(`[Verificador de Assinaturas] Desativando período de teste expirado para usuário ID ${user.id}, email: ${user.email} (baseado na data de criação)`);
            
            await storage.updateUser(user.id, { 
              subscriptionActive: false,
              paymentRequired: true,
              subscriptionExpiresAt: calculatedExpirationDate
            });
            
            expiredCount++;
          }
        }
      } catch (userError) {
        console.error(`[Verificador de Assinaturas] Erro ao processar usuário ID ${user.id}:`, userError);
      }
    }
    
    console.log(`[Verificador de Assinaturas] Concluído. ${expiredCount} períodos de teste foram desativados.`);
  } catch (error) {
    console.error("[Verificador de Assinaturas] Erro ao verificar períodos de teste expirados:", error);
  }
}

/**
 * Inicia a verificação periódica de assinaturas expiradas
 * @param initialRun Se verdadeiro, executa a verificação imediatamente na inicialização
 * @param intervalHours Intervalo em horas entre as verificações
 */
export function startSubscriptionChecker(initialRun = true, intervalHours = 6) {
  // Executa a verificação inicial se solicitado
  if (initialRun) {
    console.log("[Verificador de Assinaturas] Executando verificação inicial...");
    checkExpiredTrials();
  }
  
  // Configura a verificação periódica
  const intervalMs = intervalHours * 60 * 60 * 1000;
  console.log(`[Verificador de Assinaturas] Configurado para executar a cada ${intervalHours} horas.`);
  
  setInterval(checkExpiredTrials, intervalMs);
}