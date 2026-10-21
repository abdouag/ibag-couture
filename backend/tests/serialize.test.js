const test = require('node:test');
const assert = require('node:assert/strict');

const { prisma, disconnectPrisma } = require('../config/prisma');
const {
  serializeUser,
  serializeProduct,
  serializeOrder,
  serializePayment,
  serializeClient,
} = require('../utils/serialize');

/**
 * Ces tests tournent contre une vraie base PostgreSQL.
 * Ils verifient deux choses :
 *   1. que la serialisation rend exactement la forme attendue par le frontend
 *   2. que les regles de suppression du schema se comportent comme prevu
 */

const cleanup = async () => {
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
};

test.before(cleanup);
test.beforeEach(cleanup);
test.after(async () => {
  await cleanup();
  await disconnectPrisma();
});

const makeProduct = (overrides = {}) =>
  prisma.product.create({
    data: {
      name: 'Boubou brode',
      slug: `boubou-brode-${Math.random().toString(36).slice(2, 8)}`,
      category: 'homme',
      basePrice: 45000,
      promoPrice: 39500.5,
      customPriceImpact: 7500,
      images: ['https://res.cloudinary.com/x/a.jpg'],
      availableSizes: ['M', 'L'],
      options: [{ name: 'Broderie doree', price: 5000 }],
      ...overrides,
    },
  });

const makeOrder = (productId, overrides = {}) =>
  prisma.order.create({
    data: {
      orderNumber: `IC-2026-${Math.random().toString().slice(2, 6)}`,
      productId,
      size: 'sur-mesure',
      customer: { fullName: 'Awa Diop', phone: '770000000', email: 'awa@example.com' },
      measurements: { shoulders: 42, chest: 98, waist: 84, hips: 100 },
      selectedOptions: [{ name: 'Broderie doree', price: 5000 }],
      basePrice: 39500.5,
      optionsPrice: 5000,
      totalPrice: 44500.5,
      ...overrides,
    },
  });

test('un produit serialise expose _id et des montants numeriques', async () => {
  const created = await makeProduct();
  const result = serializeProduct(await prisma.product.findUnique({ where: { id: created.id } }));

  assert.equal(result._id, created.id);
  assert.equal(result.id, undefined, 'le champ id de Prisma ne doit pas fuiter');

  assert.equal(typeof result.basePrice, 'number');
  assert.equal(result.basePrice, 45000);
  assert.equal(result.promoPrice, 39500.5, 'les decimales doivent etre preservees');
  assert.equal(result.customPriceImpact, 7500);
});

test('les colonnes Json et les tableaux traversent intacts', async () => {
  const created = await makeProduct();
  const result = serializeProduct(await prisma.product.findUnique({ where: { id: created.id } }));

  assert.deepEqual(result.options, [{ name: 'Broderie doree', price: 5000 }]);
  assert.deepEqual(result.images, ['https://res.cloudinary.com/x/a.jpg']);
  assert.deepEqual(result.availableSizes, ['M', 'L']);
});

test('un promoPrice absent reste null et ne devient pas 0', async () => {
  const created = await makeProduct({ promoPrice: null });
  const result = serializeProduct(await prisma.product.findUnique({ where: { id: created.id } }));

  assert.equal(result.promoPrice, null);
});

test('le mot de passe n est jamais serialise', async () => {
  const user = await prisma.user.create({
    data: { email: 'admin@ibagcouture.com', password: 'hash-bcrypt', role: 'admin' },
  });
  const result = serializeUser(await prisma.user.findUnique({ where: { id: user.id } }));

  assert.equal(result.password, undefined);
  assert.equal(result._id, user.id);
  assert.equal(result.role, 'admin');
});

test('une commande serialise ses relations chargees', async () => {
  const product = await makeProduct();
  const order = await makeOrder(product.id);
  await prisma.payment.create({
    data: { orderId: order.id, amount: 20000, paymentMethod: 'wave' },
  });

  const result = serializeOrder(
    await prisma.order.findUnique({
      where: { id: order.id },
      include: { product: true, payments: true },
    })
  );

  assert.equal(result._id, order.id);
  assert.equal(result.totalPrice, 44500.5);
  assert.equal(result.product._id, product.id, 'le produit imbrique doit aussi exposer _id');
  assert.equal(typeof result.product.basePrice, 'number');
  assert.equal(result.payments[0].amount, 20000);
  assert.equal(typeof result.payments[0].amount, 'number');
});

test('une relation non chargee est absente, une relation nulle est conservee', async () => {
  const product = await makeProduct();
  const order = await makeOrder(product.id);

  const sansRelation = serializeOrder(await prisma.order.findUnique({ where: { id: order.id } }));
  assert.equal('product' in sansRelation, false, 'une relation non chargee ne doit pas apparaitre');

  const avecRelation = serializeOrder(
    await prisma.order.findUnique({ where: { id: order.id }, include: { user: true } })
  );
  assert.equal(avecRelation.user, null, 'une commande invite garde user: null');
});

test('les donnees de la commande (client, mesures, options) traversent intactes', async () => {
  const product = await makeProduct();
  const order = await makeOrder(product.id);
  const result = serializeOrder(await prisma.order.findUnique({ where: { id: order.id } }));

  assert.deepEqual(result.customer, {
    fullName: 'Awa Diop',
    phone: '770000000',
    email: 'awa@example.com',
  });
  assert.deepEqual(result.measurements, { shoulders: 42, chest: 98, waist: 84, hips: 100 });
  assert.deepEqual(result.selectedOptions, [{ name: 'Broderie doree', price: 5000 }]);
  assert.equal(result.size, 'sur-mesure', 'la taille sur-mesure doit rester telle quelle');
});

test('supprimer un produit ne detruit pas la commande, qui garde son snapshot', async () => {
  const product = await makeProduct();
  const order = await makeOrder(product.id, {
    productSnapshot: { name: 'Boubou brode', slug: 'boubou-brode', basePrice: 45000 },
  });

  await prisma.product.delete({ where: { id: product.id } });

  const survivante = await prisma.order.findUnique({
    where: { id: order.id },
    include: { product: true },
  });

  assert.notEqual(survivante, null, 'la commande doit survivre a la suppression du produit');
  assert.equal(survivante.productId, null);
  assert.equal(serializeOrder(survivante).product, null);
  assert.equal(survivante.productSnapshot.name, 'Boubou brode', 'le snapshot prend le relais');
});

test('supprimer une commande supprime ses paiements', async () => {
  const product = await makeProduct();
  const order = await makeOrder(product.id);
  await prisma.payment.create({
    data: { orderId: order.id, amount: 20000, paymentMethod: 'orange_money' },
  });

  await prisma.order.delete({ where: { id: order.id } });

  assert.equal(await prisma.payment.count(), 0, 'les paiements ne survivent pas a leur commande');
});

test('supprimer une fiche client preserve ses commandes et paiements', async () => {
  const product = await makeProduct();
  const client = await prisma.client.create({
    data: { fullName: 'Awa Diop', phone: '770000000' },
  });
  const order = await makeOrder(product.id, { clientId: client.id });
  await prisma.payment.create({
    data: { orderId: order.id, clientId: client.id, amount: 10000, paymentMethod: 'especes' },
  });

  await prisma.client.delete({ where: { id: client.id } });

  const commande = await prisma.order.findUnique({ where: { id: order.id } });
  const paiement = await prisma.payment.findFirst();

  assert.notEqual(commande, null, 'l historique de commande ne doit pas disparaitre');
  assert.equal(commande.clientId, null);
  assert.notEqual(paiement, null, 'l historique financier ne doit pas disparaitre');
  assert.equal(paiement.clientId, null);
});

test('un client serialise expose _id et ses mesures intactes', async () => {
  const client = await prisma.client.create({
    data: {
      fullName: 'Awa Diop',
      phone: '770000000',
      clientType: 'sur_place',
      measurements: {
        shoulders: 42,
        customMeasurements: [{ label: 'Tour de cuisse', value: 58 }],
      },
    },
  });

  const result = serializeClient(await prisma.client.findUnique({ where: { id: client.id } }));

  assert.equal(result._id, client.id);
  assert.equal(result.clientType, 'sur_place');
  assert.deepEqual(result.measurements.customMeasurements, [
    { label: 'Tour de cuisse', value: 58 },
  ]);
});

test('un paiement serialise expose un montant numerique', async () => {
  const product = await makeProduct();
  const order = await makeOrder(product.id);
  const payment = await prisma.payment.create({
    data: { orderId: order.id, amount: 12500.75, paymentMethod: 'wave', notes: 'Acompte' },
  });

  const result = serializePayment(
    await prisma.payment.findUnique({ where: { id: payment.id }, include: { order: true } })
  );

  assert.equal(result._id, payment.id);
  assert.equal(result.amount, 12500.75);
  assert.equal(typeof result.amount, 'number');
  assert.equal(result.order._id, order.id);
  assert.equal(typeof result.order.totalPrice, 'number');
});

test('l unicite du numero de commande est garantie par la base', async () => {
  const product = await makeProduct();
  const order = await makeOrder(product.id, { orderNumber: 'IC-2026-0001' });

  await assert.rejects(
    () => makeOrder(product.id, { orderNumber: order.orderNumber }),
    (err) => err.code === 'P2002',
    'un numero de commande duplique doit etre refuse'
  );
});
