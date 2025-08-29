import { fakerPT_BR as faker } from "@faker-js/faker";
import { Pool } from "pg";

// criar usuário
function createCustomer() {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  const email = faker.internet.email({ firstName, lastName, allowSpecialCharacters: true }).toLowerCase()

  const birhDate = faker.date.birthdate()

  const state = faker.location.state()
  const city = faker.location.city()

  return {
    id: faker.string.uuid(),
    firstName,
    lastName,
    email,
    birhDate,
    state,
    city
  }
}

const customer = createCustomer()

const purchaseProbability = [
  { value: 0, weight: 10 },
  { value: 1, weight: 50 },
  { value: 2, weight: 20 },
  { value: 3, weight: 10 },
  { value: 4, weight: 7 },
  { value: 5, weight: 3 },
]

const status = [
  "confirmada",
  "pagamento confirmado",
  "em separação",
  "em trânsito",
  "entregue",
  "atrasada",
  "cancelado pelo usuário",
  "cancelado pelo vendedor"
]

// cria compras
function createPurchases(customer) {
  // Quantas compras o cliente teve
  const nPurchases = faker.helpers.weightedArrayElement(purchaseProbability)

  const purchases = []
  // Definir status e os produtos

  for (let index = 0; index < nPurchases; index++) {
    purchases.push({
      id: faker.string.uuid(),
      customerId: customer.id,
      price: faker.commerce.price(),
      date: faker.date.recent({ days: 10 }),
      product: faker.commerce.productName(),
      status: faker.helpers.arrayElement(status)
    });
  }

  return purchases
}

let customers = []
let purchases = []

for (let i = 0; i < 100; i++) {
  customers.push(createCustomer());
}

for (const customer of customers) {
  purchases = purchases.concat(createPurchases(customer));
}

const pool = new Pool({
  host: "localhost",
  database: "customer_chat",
  user: "postgres",
  password: "postgres",
  port: 5432
})

await pool.query(`DROP TABLE IF EXISTS purchases;`);
await pool.query(`DROP TABLE IF EXISTS customers;`);
await pool.query(`DROP TYPE IF EXISTS purchase_status;`);

await pool.query(`
  CREATE TABLE customers (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  birth_date DATE NOT NULL,
  state VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL
);
`);

await pool.query(`
  CREATE TYPE purchase_status AS ENUM (
  'confirmada',
  'pagamento confirmado',
  'em separação',
  'em trânsito',
  'entregue',
  'atrasada',
  'cancelado pelo usuário',
  'cancelado pelo vendedor'
);
`);


await pool.query(`
  CREATE TABLE purchases (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    product VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    status purchase_status NOT NULL,
    CONSTRAINT fk_customer
      FOREIGN KEY (customer_id)
      REFERENCES customers(id)
      ON DELETE CASCADE
);
`);


for (const customer of customers) {
  await pool.query(
      `INSERT INTO CUSTOMERS (id, first_name, last_name, birth_date, state, email) 
        VALUES ($1, $2, $3, $4, $5, $6)`,
      [
          customer.id,
          customer.firstName,
          customer.lastName,
          customer.birhDate,
          customer.state,
          customer.email
      ]
  );
}

for (const purchase of purchases) {
  await pool.query(
      `INSERT INTO purchases (id, customer_id, product, price, date, status)
        VALUES ($1, $2, $3, $4, $5, $6)`,
      [
          purchase.id,
          purchase.customerId,
          purchase.product,
          purchase.price,
          purchase.date,
          purchase.status
      ]
  );
}

const customersDB = await pool.query(`SELECT * FROM customers;`)
const purchasesDB = await pool.query(`SELECT * FROM purchases;`)

console.log(purchasesDB.rows);
