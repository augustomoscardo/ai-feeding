import { fakerPT_BR as faker } from "@faker-js/faker";

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

// criar usuário
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
  "Confirmada",
  "Pagamento Confirmado",
  "Em separação",
  "Em trânsito",
  "Entregue",
  "Atrasada",
  "Cancelado pelo usuário",
  "Cancelado pelo vendedor"
]

function createPurchases(customer) {
  // Quantas compras o cliente teve
  const nPurchases = faker.helpers.weightedArrayElement(purchaseProbability)

  const purchases = []
  // Definir status e os produtos

  for (let index = 0; index < nPurchases; index++) {
    purchases.push({
      customerId: customer.id,
      price: faker.commerce.price(),
      date: faker.date.recent({ days: 10 }),
      product: faker.commerce.productName(),
      status: faker.helpers.arrayElement(status)
    });
  }

  return purchases
}

console.log(createPurchases(customer));