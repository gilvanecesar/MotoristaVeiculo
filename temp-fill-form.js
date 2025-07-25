// Script para preencher automaticamente o formulário de cliente
(function() {
  console.log('Iniciando preenchimento automático do formulário...');
  
  // Função para preencher um campo
  function fillField(name, value) {
    const field = document.querySelector(`input[name="${name}"], textarea[name="${name}"]`);
    if (field) {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`Campo ${name} preenchido com: ${value}`);
    } else {
      console.log(`Campo ${name} não encontrado`);
    }
  }
  
  // Aguardar um pouco para garantir que a página carregou
  setTimeout(() => {
    // Dados do cliente para preenchimento
    fillField('name', 'Empresa Teste Gil Transportes Ltda');
    fillField('cnpj', '12.345.678/0001-90');
    fillField('email', 'contato@giltransportes.com.br');
    fillField('phone', '(11) 99999-8888');
    fillField('whatsapp', '(11) 99999-8888');
    fillField('street', 'Rua das Transportadoras');
    fillField('number', '500');
    fillField('complement', 'Galpão A');
    fillField('neighborhood', 'Distrito Industrial');
    fillField('city', 'São Paulo');
    fillField('state', 'SP');
    fillField('zipcode', '08050-000');
    fillField('contactName', 'Gil Santos');
    fillField('contactPhone', '(11) 99999-7777');
    fillField('notes', 'Cliente teste para validação do sistema de bloqueio de agenciadores');
    
    console.log('Formulário preenchido com sucesso! Agora você pode clicar em Salvar.');
  }, 1000);
})();