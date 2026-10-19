process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secret-de-test';
process.env.EMAIL_ENABLED = 'false';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const { prisma, disconnectPrisma } = require('../config/prisma');
const { errorHandler } = require('../middleware');
const order = require('../controllers/prisma/order.controller');
const payment = require('../controllers/prisma/payment.controller');
const finance = require('../controllers/prisma/finance.controller');
const exporter = require('../controllers/prisma/export.controller');

const app = express();
app.use(express.json());
app.post('/api/orders', order.createOrder);
app.get('/api/orders/workshop', order.getWorkshopOrders);
app.get('/api/orders', order.getAllOrders);
app.get('/api/orders/:id', order.getOrderById);
app.patch('/api/orders/:id/status', order.updateOrderStatus);
app.patch('/api/orders/:id/workshop', order.updateWorkshopInfo);
app.post('/api/payments', payment.createPayment);
app.delete('/api/payments/:id', payment.deletePayment);
app.get('/api/finances/summary', finance.getSummary);
app.get('/api/finances/by-method', finance.getByMethod);
app.get('/api/finances/outstanding', finance.getOutstanding);
app.get('/api/exports/orders', exporter.exportOrders);
app.get('/api/exports/finances', exporter.exportFinances);
app.get('/api/exports/measurements', exporter.exportMeasurements);
app.use(errorHandler);

let server;
let baseUrl;

const request = async (method, path, body) => {
  const res = await fetch(baseUrl + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};

const cleanup = async () => {
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.client.deleteMany();
};

test.before(async () => {
  await cleanup();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});
test.beforeEach(cleanup);
test.after(async () => {
  await cleanup();
  await disconnectPrisma();
  server.close();
});

const makeProduct = (overrides = {}) =>
  prisma.product.create({
    data: {
      name: 'Grand Boubou',
      slug: `grand-boubou-${Math.random().toString(36).slice(2, 8)}`,
      category: 'homme',
      basePrice: 40000,
      customPriceImpact: 10000,
      isCustomAvailable: true,
      options: [
        { name: 'Broderie doree', price: 5000 },
        { name: 'Doublure', price: 3000 },
      ],
      ...overrides,
    },
  });

const customer = { fullName: 'Awa Diop', phone: '770000000', email: 'Awa@Example.com' };
const measurements = { shoulders: 42, chest: 98, waist: 84, hips: 100 };

// ------------------------------------------------------- facturation

test('le supplement sur-mesure est facture', async () => {
  const produit = await makeProduct();

  const { status, body } = await request('POST', '/api/orders', {
    product: produit.id,
    size: 'sur-mesure',
    measurements,
    customer,
  });

  assert.equal(status, 201);
  assert.equal(body.data.basePrice, 40000);
  assert.equal(body.data.customSurcharge, 10000, 'le supplement sur-mesure doit etre facture');
  assert.equal(body.data.totalPrice, 50000, '40000 + 10000 de supplement');
});

test('le supplement ne s applique pas a une taille standard', async () => {
  const produit = await makeProduct();

  const { body } = await request('POST', '/api/orders', {
    product: produit.id,
    size: 'M',
    customer,
  });

  assert.equal(body.data.customSurcharge, 0);
  assert.equal(body.data.totalPrice, 40000);
});

test('le prix des options vient du produit, pas de la requete', async () => {
  const produit = await makeProduct();

  const { body } = await request('POST', '/api/orders', {
    product: produit.id,
    size: 'M',
    customer,
    // Le client annonce l'option a 0 pour ne pas la payer.
    selectedOptions: [{ name: 'Broderie doree', price: 0 }],
  });

  assert.equal(body.data.optionsPrice, 5000, 'le prix reel du produit doit primer');
  assert.equal(body.data.totalPrice, 45000);
  assert.deepEqual(body.data.selectedOptions, [{ name: 'Broderie doree', price: 5000 }]);
});

test('une option inconnue est ignoree et non facturee', async () => {
  const produit = await makeProduct();

  const { body } = await request('POST', '/api/orders', {
    product: produit.id,
    size: 'M',
    customer,
    selectedOptions: [
      { name: 'Doublure', price: 3000 },
      { name: 'Option inventee', price: 99999 },
    ],
  });

  assert.equal(body.data.optionsPrice, 3000);
  assert.equal(body.data.selectedOptions.length, 1);
});

test('le total envoye par le client est ignore', async () => {
  const produit = await makeProduct();

  const { body } = await request('POST', '/api/orders', {
    product: produit.id,
    size: 'M',
    customer,
    basePrice: 1,
    totalPrice: 1,
  });

  assert.equal(body.data.totalPrice, 40000, 'le prix est toujours recalcule en base');
});

test('le prix promotionnel remplace le prix de base', async () => {
  const produit = await makeProduct({ promoPrice: 32000 });

  const { body } = await request('POST', '/api/orders', {
    product: produit.id,
    size: 'sur-mesure',
    measurements,
    customer,
  });

  assert.equal(body.data.basePrice, 32000);
  assert.equal(body.data.totalPrice, 42000, 'promo 32000 + supplement 10000');
});

test('une promotion superieure au prix de base est ignoree', async () => {
  const produit = await makeProduct({ promoPrice: 99000 });

  const { body } = await request('POST', '/api/orders', {
    product: produit.id, size: 'M', customer,
  });

  assert.equal(body.data.basePrice, 40000);
});

// ------------------------------------------------------- validations

test('une commande sur un produit inactif est refusee', async () => {
  const produit = await makeProduct({ isActive: false });

  const { status, body } = await request('POST', '/api/orders', {
    product: produit.id, size: 'M', customer,
  });

  assert.equal(status, 400);
  assert.match(body.message, /plus disponible/);
});

test('une commande sur-mesure sans mesures est refusee', async () => {
  const produit = await makeProduct();

  const { status, body } = await request('POST', '/api/orders', {
    product: produit.id,
    size: 'sur-mesure',
    measurements: { shoulders: 42 },
    customer,
  });

  assert.equal(status, 400);
  assert.match(body.message, /mesures sont requises/);
  assert.equal(await prisma.order.count(), 0, 'aucune commande ne doit etre enregistree');
});

test('un produit inexistant et des infos client manquantes sont refuses', async () => {
  const produit = await makeProduct();

  const produitInconnu = await request('POST', '/api/orders', {
    product: 'cl00000000000000000000000', size: 'M', customer,
  });
  assert.equal(produitInconnu.status, 404);

  const sansClient = await request('POST', '/api/orders', {
    product: produit.id, size: 'M', customer: { fullName: 'Awa' },
  });
  assert.equal(sansClient.status, 400);
});

// ------------------------------------------------ numero de commande

test('les numeros de commande sont uniques et sequentiels', async () => {
  const produit = await makeProduct();
  const an = new Date().getFullYear();

  const numeros = [];
  for (let i = 0; i < 3; i += 1) {
    const { body } = await request('POST', '/api/orders', {
      product: produit.id, size: 'M', customer,
    });
    numeros.push(body.data.orderNumber);
  }

  assert.deepEqual(numeros, [`IC-${an}-0001`, `IC-${an}-0002`, `IC-${an}-0003`]);
});

test('des commandes simultanees n entrent pas en collision', async () => {
  const produit = await makeProduct();

  const resultats = await Promise.all(
    Array.from({ length: 5 }, () =>
      request('POST', '/api/orders', { product: produit.id, size: 'M', customer })
    )
  );

  assert.ok(resultats.every((r) => r.status === 201), 'toutes les commandes doivent aboutir');

  const numeros = new Set(resultats.map((r) => r.body.data.orderNumber));
  assert.equal(numeros.size, 5, 'les 5 numeros doivent etre distincts');
});

// ------------------------------------------------------------ lecture

test('l email du client est normalise et sert de filtre', async () => {
  const produit = await makeProduct();
  await request('POST', '/api/orders', { product: produit.id, size: 'M', customer });

  const { body } = await request('GET', '/api/orders?email=AWA@EXAMPLE.COM');
  assert.equal(body.total, 1, 'la recherche par email doit ignorer la casse');
});

test('une commande dont le produit est supprime reste lisible', async () => {
  const produit = await makeProduct();
  await request('POST', '/api/orders', { product: produit.id, size: 'M', customer });
  await prisma.product.delete({ where: { id: produit.id } });

  const { body } = await request('GET', '/api/orders');

  assert.equal(body.total, 1);
  assert.equal(body.data[0].productDeleted, true);
  assert.equal(body.data[0].product.name, 'Grand Boubou', 'le snapshot prend le relais');
});

test('le filtre par statut fonctionne', async () => {
  const produit = await makeProduct();
  const { body: creee } = await request('POST', '/api/orders', {
    product: produit.id, size: 'M', customer,
  });
  await request('PATCH', `/api/orders/${creee.data._id}/status`, { status: 'in_production' });

  assert.equal((await request('GET', '/api/orders?status=in_production')).body.total, 1);
  assert.equal((await request('GET', '/api/orders?status=pending')).body.total, 0);
});

test('un statut invalide est refuse', async () => {
  const produit = await makeProduct();
  const { body } = await request('POST', '/api/orders', {
    product: produit.id, size: 'M', customer,
  });

  const inconnu = await request('PATCH', `/api/orders/${body.data._id}/status`, {
    status: 'livraison_express',
  });
  assert.equal(inconnu.status, 400);

  const anglaisLegacy = await request('PATCH', `/api/orders/${body.data._id}/status`, {
    paymentStatus: 'paid',
  });
  assert.equal(anglaisLegacy.status, 400, 'les anciennes valeurs anglaises sont refusees');
});

test('la vue atelier exclut les commandes livrees et annulees', async () => {
  const produit = await makeProduct();

  for (const statut of ['pending', 'delivered', 'cancelled']) {
    const { body } = await request('POST', '/api/orders', {
      product: produit.id, size: 'M', customer,
    });
    if (statut !== 'pending') {
      await request('PATCH', `/api/orders/${body.data._id}/status`, { status: statut });
    }
  }

  const { body } = await request('GET', '/api/orders/workshop');
  assert.equal(body.count, 1);
});

test('les informations atelier sont enregistrees', async () => {
  const produit = await makeProduct();
  const { body: creee } = await request('POST', '/api/orders', {
    product: produit.id, size: 'M', customer,
  });

  const { status, body } = await request('PATCH', `/api/orders/${creee.data._id}/workshop`, {
    assignedTailor: 'Modou Fall',
    workshopStatus: 'en_cours',
    expectedDeliveryDate: '2026-11-15',
  });

  assert.equal(status, 200);
  assert.equal(body.data.assignedTailor, 'Modou Fall');
  assert.equal(body.data.workshopStatus, 'en_cours');

  const invalide = await request('PATCH', `/api/orders/${creee.data._id}/workshop`, {
    workshopStatus: 'inconnu',
  });
  assert.equal(invalide.status, 400);
});

// ----------------------------------------------------------- paiements

const commandeDe = async (total = 50000) => {
  const produit = await makeProduct({ basePrice: total, customPriceImpact: 0 });
  const { body } = await request('POST', '/api/orders', {
    product: produit.id, size: 'M', customer,
  });
  return body.data;
};

test('un acompte fait passer la commande en statut acompte', async () => {
  const commande = await commandeDe(50000);

  const { status } = await request('POST', '/api/payments', {
    order: commande._id, amount: 20000, paymentMethod: 'wave',
  });
  assert.equal(status, 201);

  const apres = await request('GET', `/api/orders/${commande._id}`);
  assert.equal(apres.body.data.paymentStatus, 'acompte');
});

test('le solde complet fait passer la commande en paye', async () => {
  const commande = await commandeDe(50000);

  await request('POST', '/api/payments', {
    order: commande._id, amount: 20000, paymentMethod: 'wave',
  });
  await request('POST', '/api/payments', {
    order: commande._id, amount: 30000, paymentMethod: 'especes',
  });

  const apres = await request('GET', `/api/orders/${commande._id}`);
  assert.equal(apres.body.data.paymentStatus, 'paye');
});

test('supprimer un paiement remet le statut a jour', async () => {
  const commande = await commandeDe(50000);

  const { body } = await request('POST', '/api/payments', {
    order: commande._id, amount: 50000, paymentMethod: 'wave',
  });
  assert.equal((await request('GET', `/api/orders/${commande._id}`)).body.data.paymentStatus, 'paye');

  await request('DELETE', `/api/payments/${body.data._id}`);

  const apres = await request('GET', `/api/orders/${commande._id}`);
  assert.equal(apres.body.data.paymentStatus, 'non_paye');
});

test('un paiement sur une commande inexistante est refuse', async () => {
  const { status } = await request('POST', '/api/payments', {
    order: 'cl00000000000000000000000', amount: 1000, paymentMethod: 'wave',
  });
  assert.equal(status, 404);
});

// ------------------------------------------------------------ finances

test('le resume financier agrege commandes et encaissements', async () => {
  const commandeA = await commandeDe(50000);
  const commandeB = await commandeDe(30000);

  await request('POST', '/api/payments', {
    order: commandeA._id, amount: 20000, paymentMethod: 'wave',
  });
  await request('POST', '/api/payments', {
    order: commandeB._id, amount: 30000, paymentMethod: 'especes',
  });

  const { body } = await request('GET', '/api/finances/summary');

  assert.equal(body.data.totalRevenue, 80000);
  assert.equal(body.data.totalCollected, 50000);
  assert.equal(body.data.totalRemaining, 30000);
  assert.equal(body.data.ordersCount, 2);
  assert.equal(body.data.paidOrdersCount, 1);
  assert.equal(body.data.partialOrdersCount, 1);
});

test('les commandes annulees sortent du chiffre d affaires', async () => {
  const commande = await commandeDe(50000);
  await request('PATCH', `/api/orders/${commande._id}/status`, { status: 'cancelled' });

  const { body } = await request('GET', '/api/finances/summary');
  assert.equal(body.data.totalRevenue, 0);
  assert.equal(body.data.ordersCount, 0);
});

test('la repartition par methode de paiement est triee par montant', async () => {
  const commande = await commandeDe(100000);

  await request('POST', '/api/payments', {
    order: commande._id, amount: 10000, paymentMethod: 'especes',
  });
  await request('POST', '/api/payments', {
    order: commande._id, amount: 40000, paymentMethod: 'wave',
  });

  const { body } = await request('GET', '/api/finances/by-method');

  assert.equal(body.data[0].method, 'wave', 'le plus gros montant en premier');
  assert.equal(body.data[0].total, 40000);
  assert.equal(body.data[0].label, 'Wave');
  assert.equal(body.data[1].total, 10000);
});

test('les impayes indiquent le montant deja regle et le restant', async () => {
  const commande = await commandeDe(50000);
  await request('POST', '/api/payments', {
    order: commande._id, amount: 20000, paymentMethod: 'wave',
  });

  const { body } = await request('GET', '/api/finances/outstanding');

  assert.equal(body.count, 1);
  assert.equal(body.data[0].amountPaid, 20000);
  assert.equal(body.data[0].remainingAmount, 30000);
});

test('une commande soldee disparait des impayes', async () => {
  const commande = await commandeDe(50000);
  await request('POST', '/api/payments', {
    order: commande._id, amount: 50000, paymentMethod: 'wave',
  });

  const { body } = await request('GET', '/api/finances/outstanding');
  assert.equal(body.count, 0);
});

// ------------------------------------------------------------- exports

const fetchFile = async (path) => {
  const res = await fetch(baseUrl + path);
  return { status: res.status, type: res.headers.get('content-type'), buffer: await res.arrayBuffer() };
};

test('les exports Excel sont generes et non vides', async () => {
  const commande = await commandeDe(50000);
  await request('POST', '/api/payments', {
    order: commande._id, amount: 20000, paymentMethod: 'wave',
  });
  await prisma.client.create({
    data: { fullName: 'Awa Diop', phone: '77', measurements: { shoulders: 42 } },
  });

  for (const chemin of ['/api/exports/orders', '/api/exports/finances', '/api/exports/measurements']) {
    const fichier = await fetchFile(chemin);
    assert.equal(fichier.status, 200, `${chemin} doit repondre 200`);
    assert.match(fichier.type, /spreadsheetml/, `${chemin} doit renvoyer un fichier Excel`);
    assert.ok(fichier.buffer.byteLength > 1000, `${chemin} ne doit pas etre vide`);
  }
});

test('l export mesures n inclut que les clients qui en ont', async () => {
  await prisma.client.create({ data: { fullName: 'Sans mesures', phone: '77' } });
  await prisma.client.create({
    data: { fullName: 'Avec mesures', phone: '78', measurements: { shoulders: 42 } },
  });

  const fichier = await fetchFile('/api/exports/measurements');
  assert.equal(fichier.status, 200, 'le filtre sur colonne Json doit fonctionner');
});
