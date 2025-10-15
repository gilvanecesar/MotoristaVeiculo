/**
 * Utilitário para tratamento centralizado de erros
 * Converte códigos de erro técnicos em mensagens amigáveis para o usuário
 */

import { queryClient } from '@/lib/queryClient';

// Mapeamento de códigos de erro para mensagens amigáveis
const ERROR_MESSAGES: Record<string, string> = {
  // Erros de autenticação
  'INVALID_CREDENTIALS': 'Email ou senha incorretos. Por favor, verifique seus dados.',
  'USER_NOT_FOUND': 'Usuário não encontrado. Verifique o email digitado.',
  'INVALID_PASSWORD': 'Senha incorreta. Tente novamente.',
  'ACCOUNT_DISABLED': 'Sua conta foi desativada. Entre em contato com o suporte.',
  'ACCOUNT_NOT_VERIFIED': 'Sua conta ainda não foi verificada. Verifique seu email.',
  
  // Erros de cadastro
  'EMAIL_ALREADY_EXISTS': 'Este email já está cadastrado. Tente fazer login ou use outro email.',
  'CNPJ_ALREADY_EXISTS': 'Este CNPJ já está cadastrado no sistema.',
  'CPF_ALREADY_EXISTS': 'Este CPF já está cadastrado no sistema.',
  'INVALID_EMAIL': 'Digite um email válido.',
  'WEAK_PASSWORD': 'A senha deve ter pelo menos 6 caracteres.',
  'INVALID_CNPJ': 'CNPJ inválido. Verifique os números digitados.',
  'INVALID_CPF': 'CPF inválido. Verifique os números digitados.',
  'REQUIRED_FIELD': 'Este campo é obrigatório.',
  'PHONE_INVALID': 'Número de telefone inválido.',
  
  // Erros de assinatura
  'SUBSCRIPTION_REQUIRED': 'Assinatura necessária para acessar esta funcionalidade.',
  'SUBSCRIPTION_EXPIRED': 'Sua assinatura expirou. Renove para continuar usando o sistema.',
  'PAYMENT_FAILED': 'Falha no pagamento. Tente novamente ou use outro método.',
  'PAYMENT_PENDING': 'Pagamento pendente. Aguarde a confirmação.',
  
  // Erros de permissão
  'ACCESS_DENIED': 'Você não tem permissão para realizar esta ação.',
  'ADMIN_REQUIRED': 'Apenas administradores podem acessar esta funcionalidade.',
  'INVALID_PROFILE': 'Tipo de perfil inválido.',
  
  // Erros de validação
  'VALIDATION_ERROR': 'Dados inválidos. Verifique os campos preenchidos.',
  'MISSING_REQUIRED_FIELDS': 'Preencha todos os campos obrigatórios.',
  'INVALID_DATE': 'Data inválida.',
  'INVALID_FILE': 'Arquivo inválido ou formato não suportado.',
  
  // Erros de conexão/servidor
  'NETWORK_ERROR': 'Erro de conexão. Verifique sua internet e tente novamente.',
  'SERVER_ERROR': 'Erro interno do servidor. Tente novamente em alguns minutos.',
  'TIMEOUT': 'Tempo limite excedido. Tente novamente.',
  'SERVICE_UNAVAILABLE': 'Serviço temporariamente indisponível.',
  
  // Erros específicos do sistema
  'FREIGHT_NOT_FOUND': 'Frete não encontrado.',
  'VEHICLE_NOT_FOUND': 'Veículo não encontrado.',
  'DRIVER_NOT_FOUND': 'Motorista não encontrado.',
  'CLIENT_NOT_FOUND': 'Cliente não encontrado.',
  
  // Mensagem padrão
  'UNKNOWN_ERROR': 'Ocorreu um erro inesperado. Tente novamente.'
};

// Códigos de status HTTP comuns
const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'Dados inválidos enviados.',
  401: 'Você precisa fazer login para continuar.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Recurso não encontrado.',
  409: 'Conflito de dados. Este registro já existe.',
  422: 'Dados inválidos. Verifique os campos preenchidos.',
  429: 'Muitas tentativas. Aguarde um momento antes de tentar novamente.',
  500: 'Erro interno do servidor. Tente novamente em alguns minutos.',
  502: 'Serviço temporariamente indisponível.',
  503: 'Serviço em manutenção. Tente novamente mais tarde.',
};

/**
 * Extrai e formata mensagens de erro de diferentes fontes
 */
export function parseErrorMessage(error: any): string {
  // Se já é uma string simples
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }

  // Se é um objeto Error
  if (error instanceof Error) {
    return parseErrorMessage(error.message);
  }

  // Se tem propriedade message
  if (error?.message) {
    return parseErrorMessage(error.message);
  }

  // Se é uma resposta HTTP
  if (error?.status && HTTP_STATUS_MESSAGES[error.status]) {
    return HTTP_STATUS_MESSAGES[error.status];
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Trata erros específicos de validação de formulário
 */
export function parseValidationError(error: any): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (error?.details) {
    // Formato Zod
    error.details.forEach((detail: any) => {
      const field = detail.path?.[0];
      if (field) {
        fieldErrors[field] = parseErrorMessage(detail.message);
      }
    });
  }

  return fieldErrors;
}

/**
 * Trata erros de API e converte Response em mensagem
 */
export async function handleApiError(response: Response): Promise<never> {
  let errorMessage = HTTP_STATUS_MESSAGES[response.status] || ERROR_MESSAGES.UNKNOWN_ERROR;
  
  try {
    const errorData = await response.json();
    
    // Verifica diferentes formatos de erro
    if (errorData.message) {
      errorMessage = parseErrorMessage(errorData.message);
    } else if (errorData.error) {
      errorMessage = parseErrorMessage(errorData.error);
    } else if (errorData.details) {
      errorMessage = parseErrorMessage(errorData.details);
    }
  } catch {
    // Se não conseguir fazer parse do JSON, usa a mensagem do status HTTP
  }

  // Se for erro 401 (não autenticado), limpa a sessão do usuário
  if (response.status === 401) {
    queryClient.setQueryData(['/api/user'], null);
  }

  throw new Error(errorMessage);
}

/**
 * Determina se um erro é relacionado a autenticação
 */
export function isAuthError(error: any): boolean {
  const message = parseErrorMessage(error).toLowerCase();
  return message.includes('login') || 
         message.includes('senha') || 
         message.includes('email') ||
         message.includes('credenciais') ||
         message.includes('autenticação');
}

/**
 * Determina se um erro requer renovação de assinatura
 */
export function isSubscriptionError(error: any): boolean {
  const message = parseErrorMessage(error).toLowerCase();
  return message.includes('assinatura') || 
         message.includes('pagamento') ||
         message.includes('expirou') ||
         message.includes('renovar');
}