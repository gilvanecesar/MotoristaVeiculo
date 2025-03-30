/**
 * Format a number as currency (BRL)
 * Safely handles conversions and NaN values
 */
export function formatCurrency(value: number | string | null | undefined): string {
  // Converte o valor para um número válido
  let numValue: number;
  
  if (value === null || value === undefined) {
    numValue = 0;
  } else if (typeof value === 'string') {
    // Remove caracteres não numéricos (exceto ponto e vírgula)
    const cleanedValue = value.replace(/[^\d,.]/g, '');
    // Substitui vírgula por ponto para conversão correta
    const normalizedValue = cleanedValue.replace(',', '.');
    numValue = parseFloat(normalizedValue);
  } else {
    numValue = value;
  }
  
  // Se ainda for NaN após conversão, retorna 'R$ 0,00'
  if (isNaN(numValue)) {
    numValue = 0;
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
}

/**
 * Format a date string as DD/MM/YYYY
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

/**
 * Format a phone number as (XX) XXXXX-XXXX
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid number
  if (cleaned.length < 10) return phone;
  
  // Format as (XX) XXXXX-XXXX or (XX) XXXX-XXXX depending on length
  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  } else {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  }
}