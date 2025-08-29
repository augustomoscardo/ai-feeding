import { GoogleGenAI } from "@google/genai"
import { Pool } from "pg"
import dotenv from "dotenv"

dotenv.config({
  quiet: true
})

const pool = new Pool({
  host: "localhost",
  database: "customer_chat",
  user: "postgres",
  password: "postgres",
  port: 5432
})

function getDaysSincePurchase(purchase) {
  const today = new Date();
  const diffInMilis = today - purchase.date;

  return Math.floor(diffInMilis / 1000 / 60 / 60 / 24); //diferença em dias.
}

function getCustomerAge(customer) {
  const today = new Date();
  const diffWithBirthDate = today - customer.birth_date;

  return (new Date(diffWithBirthDate)).getFullYear() - 1970;
}

const customer = (await pool.query("SELECT * FROM customers WHERE id = '467d40e8-70ce-48cc-8148-8661b81ec705'")).rows[0];

const purchases = (await pool.query(
  "SELECT * FROM purchases WHERE customer_id = '467d40e8-70ce-48cc-8148-8661b81ec705'"
)).rows;

let purchasesString = "";

for (let purchase of purchases) {
  purchasesString += `
    - Produto: ${purchase.product}:
    - Preço: ${purchase.price}
    - Status: ${purchase.status}
    - Dias desde a compra: ${getDaysSincePurchase(purchase)} 
    `
}

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const systemInstruction = `
Você é um atendente de uma empresa de e-commerce. Você está conversando com clientes que
podem ter dúvidas sobre suas compras recentes no site. Responda os clientes de forma amigável.

Não informe nada a respeito de você para o cliente, diga apenas que você é um atendente virtual.

Caso o cliente pergunte sobre algo não relacionado à empresa ou aos nossos serviços, indique que
não pode ajudá-lo com isso. Caso o cliente pergunte sobre algo relacionado à empresa, mas que não
é explicitamente sobre suas compras passadas, direcione ele ao atendimento humano pelo número: (11)1234-5678.

Altere o tom das suas respostas de acordo com a idade do cliente. Se o cliente for jovem dialogue de forma mais informar, se for idoso trate-o com o devido respeito.

<CLIENTE>
Nome: ${customer.first_name} ${customer.last_name}
email: ${customer.email}
idade: ${getCustomerAge(customer)}
estado: ${customer.state}

<COMPRAS>
${purchasesString}
`;


const response = await genai.models.generateContent({
  model: 'gemini-2.0-flash',
  config: {
    systemInstruction,
  },
  contents: "Olá, minha compra de Inteligente Aço Mesa não  chegou."
})

console.log(response.candidates[0].content.parts[0].text);
