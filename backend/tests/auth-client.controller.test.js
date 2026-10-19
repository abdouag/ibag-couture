process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secret-de-test';
process.env.EMAIL_ENABLED = 'false';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const { prisma, disconnectPrisma } = require('../config/prisma');
const { errorHandler } = require('../middleware');
const auth = require('../controllers/prisma/auth.controller');
const client = require('../controllers/prisma/client.controller');

const app = express();
app.use(express.json());
app.post('/api/auth/register', auth.register);
app.post('/api/auth/login', auth.login);
// `protect` est teste a part : ici on injecte directement l'utilisateur.
app.get('/api/auth/me', async (req, res, next) => {
  const user = await prisma.user.findFirst({ where: { email: req.headers['x-test-user'] } });
  req.user = user || {};
  auth.getMe(req, res, next);
});
app.post('/api/clients', client.createClient);
app.get('/api/clients', client.getAllClients);
app.get('/api/clients/:id/orders', client.getClientOrders);
app.get('/api/clients/:id', client.getClientById);
app.put('/api/clients/:id', client.updateClient);
app.delete('/api/clients/:id', client.deleteClient);
app.use(errorHandler);

let server;
let baseUrl;

const request = async (method, path, body, headers = {}) => {
  const res = await fetch(baseUrl + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};

const cleanup = async () => {
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
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

// ---------------------------------------------------------------- auth

test('l inscription hache le mot de passe et ne le renvoie jamais', async () => {
  const { status, body } = await request('POST', '/api/auth/register', {
    email: 'Awa@Example.com',
    password: 'motdepasse123',
    fullName: 'Awa Diop',
  });

  assert.equal(status, 201);
  assert.ok(body.data.token, 'un token doit etre renvoye');
  assert.equal(body.data.user.password, undefined);

  const stored = await prisma.user.findUnique({ where: { email: 'awa@example.com' } });
  assert.notEqual(stored.password, 'motdepasse123', 'le mot de passe ne doit pas etre en clair');
  assert.match(stored.password, /^\$2[aby]\$/, 'le mot de passe doit etre hache par bcrypt');
  assert.equal(stored.email, 'awa@example.com', 'l email doit etre normalise en minuscules');
});

test('une inscription ne peut pas s attribuer le role admin', async () => {
  await request('POST', '/api/auth/register', {
    email: 'pirate@example.com',
    password: 'motdepasse123',
    role: 'admin',
  });

  const stored = await prisma.user.findUnique({ where: { email: 'pirate@example.com' } });
  assert.equal(stored.role, 'client');
});

test('un email deja utilise est refuse', async () => {
  const payload = { email: 'awa@example.com', password: 'motdepasse123' };
  await request('POST', '/api/auth/register', payload);
  const { status, body } = await request('POST', '/api/auth/register', payload);

  assert.equal(status, 400);
  assert.match(body.message, /déjà utilisé/);
});

test('un mot de passe trop court est refuse', async () => {
  const { status } = await request('POST', '/api/auth/register', {
    email: 'court@example.com',
    password: '12345',
  });
  assert.equal(status, 400);
});

test('la connexion fonctionne et ne distingue pas email inconnu et mauvais mot de passe', async () => {
  await request('POST', '/api/auth/register', {
    email: 'awa@example.com',
    password: 'motdepasse123',
  });

  const ok = await request('POST', '/api/auth/login', {
    email: 'AWA@example.com',
    password: 'motdepasse123',
  });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.data.token);

  const mauvaisMotDePasse = await request('POST', '/api/auth/login', {
    email: 'awa@example.com',
    password: 'mauvais',
  });
  const emailInconnu = await request('POST', '/api/auth/login', {
    email: 'inconnu@example.com',
    password: 'motdepasse123',
  });

  assert.equal(mauvaisMotDePasse.status, 401);
  assert.equal(emailInconnu.status, 401);
  assert.equal(
    mauvaisMotDePasse.body.message,
    emailInconnu.body.message,
    'les deux messages doivent etre identiques pour ne pas reveler les comptes existants'
  );
});

test('un compte desactive ne peut pas se connecter', async () => {
  await request('POST', '/api/auth/register', {
    email: 'awa@example.com',
    password: 'motdepasse123',
  });
  await prisma.user.update({ where: { email: 'awa@example.com' }, data: { isActive: false } });

  const { status, body } = await request('POST', '/api/auth/login', {
    email: 'awa@example.com',
    password: 'motdepasse123',
  });

  assert.equal(status, 401);
  assert.match(body.message, /désactivé/);
});

test('le profil expose _id sans le mot de passe', async () => {
  await request('POST', '/api/auth/register', {
    email: 'awa@example.com',
    password: 'motdepasse123',
  });

  const { status, body } = await request('GET', '/api/auth/me', undefined, {
    'x-test-user': 'awa@example.com',
  });

  assert.equal(status, 200);
  assert.ok(body.data._id);
  assert.equal(body.data.password, undefined);
});

// -------------------------------------------------------------- clients

const makeClient = (overrides = {}) => ({
  fullName: 'Awa Diop',
  phone: '770000000',
  ...overrides,
});

test('un client est cree avec ses mesures', async () => {
  const { status, body } = await request('POST', '/api/clients', makeClient({
    email: 'AWA@Example.com',
    measurements: { shoulders: 42, customMeasurements: [{ label: 'Cuisse', value: 58 }] },
  }));

  assert.equal(status, 201);
  assert.ok(body.data._id);
  assert.equal(body.data.email, 'awa@example.com');
  assert.deepEqual(body.data.measurements.customMeasurements, [{ label: 'Cuisse', value: 58 }]);
  assert.equal(body.data.clientType, 'sur_place', 'valeur par defaut appliquee');
});

test('un email vide est enregistre comme absent', async () => {
  const { body } = await request('POST', '/api/clients', makeClient({ email: '' }));
  assert.equal(body.data.email, null);
});

test('la recherche client porte sur le nom et le telephone', async () => {
  await request('POST', '/api/clients', makeClient({ fullName: 'Awa Diop', phone: '770000001' }));
  await request('POST', '/api/clients', makeClient({ fullName: 'Modou Fall', phone: '781234567' }));

  const parNom = await request('GET', '/api/clients?search=awa');
  assert.equal(parNom.body.total, 1, 'la recherche doit ignorer la casse');

  const parTelephone = await request('GET', '/api/clients?search=7812');
  assert.equal(parTelephone.body.total, 1);
  assert.equal(parTelephone.body.data[0].fullName, 'Modou Fall');
});

test('le filtre par type de client fonctionne', async () => {
  await request('POST', '/api/clients', makeClient({ clientType: 'en_ligne' }));
  await request('POST', '/api/clients', makeClient({ fullName: 'Autre', clientType: 'sur_place' }));

  const { body } = await request('GET', '/api/clients?clientType=en_ligne');
  assert.equal(body.total, 1);
});

test('un client inconnu renvoie 404 en lecture, mise a jour et suppression', async () => {
  const absent = 'cl00000000000000000000000';

  assert.equal((await request('GET', `/api/clients/${absent}`)).status, 404);
  assert.equal((await request('PUT', `/api/clients/${absent}`, { fullName: 'X' })).status, 404);
  assert.equal((await request('DELETE', `/api/clients/${absent}`)).status, 404);
  assert.equal((await request('GET', `/api/clients/${absent}/orders`)).status, 404);
});

test('supprimer un client ne detruit pas ses commandes', async () => {
  const produit = await prisma.product.create({
    data: { name: 'Boubou', slug: 'boubou-test', category: 'homme', basePrice: 40000 },
  });
  const { body } = await request('POST', '/api/clients', makeClient());

  await prisma.order.create({
    data: {
      orderNumber: 'IC-2026-0001',
      productId: produit.id,
      clientId: body.data._id,
      size: 'M',
      customer: { fullName: 'Awa Diop', phone: '77', email: 'awa@example.com' },
      basePrice: 40000,
      totalPrice: 40000,
    },
  });

  const suppression = await request('DELETE', `/api/clients/${body.data._id}`);
  assert.equal(suppression.status, 200);

  const commande = await prisma.order.findFirst();
  assert.notEqual(commande, null, 'la commande doit survivre');
  assert.equal(commande.clientId, null, 'le lien client est simplement detache');
});

test('les commandes d un client sont renvoyees avec leur produit', async () => {
  const produit = await prisma.product.create({
    data: { name: 'Kaftan', slug: 'kaftan-test', category: 'homme', basePrice: 50000 },
  });
  const { body } = await request('POST', '/api/clients', makeClient());

  await prisma.order.create({
    data: {
      orderNumber: 'IC-2026-0002',
      productId: produit.id,
      clientId: body.data._id,
      size: 'L',
      customer: { fullName: 'Awa Diop', phone: '77', email: 'awa@example.com' },
      basePrice: 50000,
      totalPrice: 50000,
    },
  });

  const { status, body: resultat } = await request('GET', `/api/clients/${body.data._id}/orders`);

  assert.equal(status, 200);
  assert.equal(resultat.count, 1);
  assert.equal(resultat.data[0].product.name, 'Kaftan');
  assert.ok(resultat.data[0].product._id, 'le produit imbrique expose _id');
  assert.equal(typeof resultat.data[0].totalPrice, 'number');
});
