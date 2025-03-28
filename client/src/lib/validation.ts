import { z } from "zod";
import { driverValidator, vehicleValidator, freightValidator } from "@shared/schema";

// Extended schemas with more specific validations for UI forms

// Driver form validation schema
export const driverFormSchema = driverValidator.extend({
  // Add client-side specific validations
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().min(11, "CPF inválido").max(14),
  phone: z.string().min(10, "Telefone inválido").max(15),
  cnh: z.string().min(10, "CNH inválida"),
  birthdate: z.string().refine((val) => {
    const date = new Date(val);
    const now = new Date();
    const minAge = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
    return date <= minAge;
  }, "O motorista deve ter pelo menos 18 anos"),
});

// Vehicle form validation schema
export const vehicleFormSchema = vehicleValidator.extend({
  // Add client-side specific validations
  plate: z.string().min(7, "Placa inválida").max(8),
  brand: z.string().min(2, "Marca inválida"),
  model: z.string().min(2, "Modelo inválido"),
  year: z.number().min(1900, "Ano inválido").max(new Date().getFullYear() + 1),
});

// Freight form validation schema
export const freightFormSchema = freightValidator.extend({
  // Add client-side specific validations
  origin: z.string().min(2, "Origem inválida"),
  destination: z.string().min(2, "Destino inválido"),
  productType: z.string().min(2, "Tipo de produto inválido"),
  contactName: z.string().min(3, "Nome do contato deve ter pelo menos 3 caracteres"),
  contactPhone: z.string().min(10, "Telefone de contato inválido").max(15, "Telefone de contato muito longo"),
});

// Helper functions
export function validateCPF(cpf: string): boolean {
  // Remove non-digits
  const numbers = cpf.replace(/\D/g, "");
  
  if (numbers.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  
  let remainder = sum % 11;
  let checkDigit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(numbers.charAt(9)) !== checkDigit1) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  
  remainder = sum % 11;
  let checkDigit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(numbers.charAt(10)) === checkDigit2;
}

export function validateLicensePlate(plate: string): boolean {
  // Traditional Brazilian license plate (AAA-0000)
  const traditionalRegex = /^[A-Z]{3}-\d{4}$/;
  
  // Mercosul license plate (AAA0A00)
  const mercosulRegex = /^[A-Z]{3}\d[A-Z]\d{2}$/;
  
  return traditionalRegex.test(plate) || mercosulRegex.test(plate);
}
