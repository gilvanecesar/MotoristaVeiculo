#!/usr/bin/env node

/**
 * Script para corrigir nomes com CPF/CNPJ já cadastrados no banco
 * Uso: node fix-existing-names.js
 */

import pkg from 'pg';
const { Pool } = pkg;

// Função para limpar nome (mesma lógica do nameUtils.ts)
function cleanNameFromDocument(name) {
  if (!name || typeof name !== 'string') {
    return name;
  }

  // Remove espaços extras no início/fim
  let cleanName = name.trim();

  // Padrão para CPF: 000.000.000-00 ou 00000000000 ou apenas números
  const cpfPattern = /^(\d{2,3}[\.\-\/\s]*\d{3}[\.\-\/\s]*\d{3}[\.\-\/\s]*\d{2})\s+(.+)$/;
  
  // Padrão para CNPJ: 00.000.000/0000-00 ou 00000000000000 ou apenas números
  const cnpjPattern = /^(\d{2}[\.\-\/\s]*\d{3}[\.\-\/\s]*\d{3}[\.\-\/\s]*\d{4}[\.\-\/\s]*\d{2})\s+(.+)$/;
  
  // Padrão mais simples para números no início
  const numberPattern = /^(\d{8,})\s+(.+)$/;

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

  // Verificar padrão de números simples (como backup)
  const numberMatch = cleanName.match(numberPattern);
  if (numberMatch) {
    cleanName = numberMatch[2]; // Pega só o nome após os números
  }

  // Capitalizar nome corretamente
  cleanName = properCase(cleanName);

  return cleanName;
}

// Converte para Title Case
function properCase(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  return text
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Preposições e artigos ficam minúsculos (exceto se for a primeira palavra)
      const lowercase = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'por', 'para'];
      
      if (lowercase.includes(word.toLowerCase()) && index > 0) {
        return word.toLowerCase();
      }
      
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

async function fixExistingNames() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 Buscando usuários com nomes que contêm CPF/CNPJ...');

    // Buscar usuários cujo nome parece conter documento
    const query = `
      SELECT id, name, email 
      FROM users 
      WHERE name ~ '^[0-9]{2,3}[\.\-\/\s]*[0-9]'
      ORDER BY id;
    `;

    const result = await pool.query(query);
    const usersToFix = result.rows;

    if (usersToFix.length === 0) {
      console.log('✅ Nenhum usuário encontrado com nome contendo CPF/CNPJ');
      return;
    }

    console.log(`📋 Encontrados ${usersToFix.length} usuários para corrigir:`);
    console.log('');

    let fixedCount = 0;

    for (const user of usersToFix) {
      const originalName = user.name;
      const cleanedName = cleanNameFromDocument(originalName);

      if (originalName !== cleanedName) {
        console.log(`🔧 ID ${user.id}: "${originalName}" → "${cleanedName}"`);
        
        // Atualizar no banco
        await pool.query(
          'UPDATE users SET name = $1 WHERE id = $2',
          [cleanedName, user.id]
        );
        
        fixedCount++;
      } else {
        console.log(`⏭️  ID ${user.id}: "${originalName}" (não precisa corrigir)`);
      }
    }

    console.log('');
    console.log(`✅ Concluído! ${fixedCount} nomes corrigidos.`);

  } catch (error) {
    console.error('❌ Erro ao executar correção:', error);
  } finally {
    await pool.end();
  }
}

// Verificar se DATABASE_URL está configurada
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

// Executar correção
fixExistingNames();