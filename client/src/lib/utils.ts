import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um valor numérico para o formato de moeda brasileira
 * @param value Valor a ser formatado
 * @param currencySymbol Símbolo da moeda (padrão: R$)
 * @returns String formatada como moeda
 */
export function formatCurrency(value: number | string, currencySymbol = "R$"): string {
  if (value === undefined || value === null) return `${currencySymbol} 0,00`;
  
  // Converter para número se for string
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Verificar se é um número válido
  if (isNaN(numericValue)) return `${currencySymbol} 0,00`;
  
  // Formatar com Intl.NumberFormat para o formato brasileiro
  return `${currencySymbol} ${numericValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formata uma data para o formato brasileiro (dd/mm/aaaa)
 * @param date Data a ser formatada
 * @returns String formatada como data
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('pt-BR');
}

/**
 * Trunca um texto para um tamanho máximo
 * @param text Texto a ser truncado
 * @param maxLength Tamanho máximo
 * @returns Texto truncado
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}