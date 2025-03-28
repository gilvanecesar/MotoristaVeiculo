// CPF mask: 000.000.000-00
export function formatCPF(value: string): string {
  // Remove non-digits
  const cpf = value.replace(/\D/g, '');
  
  // Format with punctuation
  return cpf
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
}

// Phone mask: (00) 00000-0000
export function formatPhone(value: string): string {
  // Remove non-digits
  const phone = value.replace(/\D/g, '');
  
  // Format with punctuation
  if (phone.length <= 10) {
    return phone
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 14);
  } else {
    return phone
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  }
}

// CEP mask: 00000-000
export function formatCEP(value: string): string {
  // Remove non-digits
  const cep = value.replace(/\D/g, '');
  
  // Format with punctuation
  return cep
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
}

// License plate mask: AAA-0000 or AAA0A00
export function formatLicensePlate(value: string): string {
  // Remove spaces and special chars
  const plate = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Handle Mercosul plate format (AAA0A00)
  if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(plate)) {
    return plate;
  }
  
  // Handle traditional plate format (AAA-0000)
  return plate
    .replace(/([A-Z]{3})(\d)/, '$1-$2')
    .slice(0, 8);
}
