import { MercadoPagoConfig } from "mercadopago";

// Verificar se a chave de acesso está configurada
if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  throw new Error("MERCADOPAGO_ACCESS_TOKEN não está configurado no ambiente");
}

// Inicializar cliente do Mercado Pago
export const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

console.log("Cliente do Mercado Pago inicializado com sucesso");