/**
 * Utilitários para limpeza e validação de nomes
 */

/**
 * Remove CPF/CNPJ do início do nome
 * Exemplos:
 * "60.915.611 LUCIEN PEREIRA BRITO" → "Lucien Pereira Brito"
 * "12.345.678/0001-90 EMPRESA LTDA" → "Empresa Ltda"
 * "123.456.789-01 JOÃO SILVA" → "João Silva"
 */
export function cleanNameFromDocument(name: string): string {
  if (!name || typeof name !== 'string') {
    return name;
  }

  // Remove espaços extras no início/fim
  let cleanName = name.trim();

  // Padrão para CPF: 000.000.000-00 ou 00000000000
  const cpfPattern = /^(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\s+(.+)$/;
  
  // Padrão para CNPJ: 00.000.000/0000-00 ou 00000000000000
  const cnpjPattern = /^(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\s+(.+)$/;

  // Verificar se começa com CPF
  const cpfMatch = cleanName.match(cpfPattern);
  if (cpfMatch) {
    cleanName = cpfMatch[2]; // Pega só o nome após o CPF
  }

  // Verificar se começa com CNPJ
  const cnpjMatch = cleanName.match(cnpjPattern);
  if (cnpjMatch) {
    cleanName = cnpjMatch[2]; // Pega só o nome após o CNPJ
  }

  // Capitalizar nome corretamente
  cleanName = properCase(cleanName);

  return cleanName;
}

/**
 * Converte string para formato Title Case (primeira letra maiúscula)
 * "LUCIEN PEREIRA BRITO" → "Lucien Pereira Brito"
 */
export function properCase(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  return text
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Preposições e artigos ficam minúsculos (exceto se for a primeira palavra)
      const lowercase = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'por', 'para'];
      
      if (lowercase.includes(word.toLowerCase()) && text.indexOf(word) > 0) {
        return word.toLowerCase();
      }
      
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Valida se o nome parece válido (não contém apenas números)
 */
export function isValidName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const cleanName = name.trim();
  
  // Nome deve ter pelo menos 2 caracteres
  if (cleanName.length < 2) {
    return false;
  }

  // Nome não pode ser apenas números e pontuação
  const onlyNumbersPattern = /^[\d\s\.\-\/]+$/;
  if (onlyNumbersPattern.test(cleanName)) {
    return false;
  }

  return true;
}