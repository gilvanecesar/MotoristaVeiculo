// Função para formatar valor como moeda brasileira
export const formatCurrency = (value: string | number): string => {
  if (!value) return '';
  
  // Remove tudo que não é dígito
  const numbers = value.toString().replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Converte para número considerando os últimos 2 dígitos como centavos
  const amount = parseInt(numbers) / 100;
  
  // Formata como moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

// Função para converter valor formatado para número
export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return 0;
  
  // Converte para número considerando os últimos 2 dígitos como centavos
  return parseInt(numbers) / 100;
};

// Função para formatar enquanto digita
export const formatCurrencyInput = (value: string): string => {
  if (!value) return '';
  
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Converte para número considerando os últimos 2 dígitos como centavos
  const amount = parseInt(numbers) / 100;
  
  // Formata como moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};