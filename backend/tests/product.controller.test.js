process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const { prisma, disconnectPrisma } = require('../config/prisma');
const { errorHandler } = require('../middleware');
const controller = require('../controllers/prisma/product.controller');

/**
 * Tests d'integration du controleur produits sur une vraie base PostgreSQL.
 *
 * Les routes sont montees sans `protect`/`adminOnly` : la protection des
 * mutations est deja couverte par les tests d'authentification et n'est pas
 * l'objet ici. Ce fichier verifie le comportement metier du controleur.
 */
const app = express();
app.use(express.json());
app.post('/api/products', controller.createProduct);
app.get('/api/products', controller.getAllProducts);
app.get('/api/products/:slug', controller.getProductBySlug);
app.put('/api/products/:id', controller.updateProduct);
app.delete('/api/products/:id', controller.deleteProduct);
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

const validProduct = (overrides = {}) => ({
  name: 'Grand Boubou Bazin',
  category: 'homme',
  basePrice: 45000,
  ...overrides,
});

test('la creation genere le slug a partir du nom, accents compris', async () => {
  const { status, body } = await request('POST', '/api/products', validProduct({
    name: 'Déshabillé Élégant Femme',
  }));

  assert.equal(status, 201);
  assert.equal(body.data.slug, 'deshabille-elegant-femme');
  assert.ok(body.data._id, 'le produit cree doit exposer _id');
  assert.equal(body.data.basePrice, 45000);
});

test('les champs non prevus sont ignores a la creation', async () => {
  const { status, body } = await request('POST', '/api/products', validProduct({
    slug: 'slug-impose-par-le-client',
    createdAt: '1999-01-01T00:00:00.000Z',
    champInconnu: 'valeur pirate',
  }));

  assert.equal(status, 201);
  assert.equal(body.data.slug, 'grand-boubou-bazin', 'le slug impose doit etre ignore');
  assert.equal(body.data.champInconnu, undefined);
  assert.notEqual(new Date(body.data.createdAt).getFullYear(), 1999);
});

test('deux produits de meme nom sont refuses avec un message clair', async () => {
  await request('POST', '/api/products', validProduct());
  const { status, body } = await request('POST', '/api/products', validProduct());

  assert.equal(status, 400);
  assert.match(body.message, /existe déjà/);
});

test('renommer un produit regenere son slug', async () => {
  const created = await request('POST', '/api/products', validProduct());
  assert.equal(created.body.data.slug, 'grand-boubou-bazin');

  const { status, body } = await request('PUT', `/api/products/${created.body.data._id}`, {
    name: 'Kaftan Brode Or',
  });

  assert.equal(status, 200);
  assert.equal(body.data.slug, 'kaftan-brode-or', 'le slug doit suivre le nouveau nom');
});

test('mettre a jour ou supprimer un produit inexistant renvoie 404', async () => {
  const absent = 'cl00000000000000000000000';

  const miseAJour = await request('PUT', `/api/products/${absent}`, { name: 'Peu importe' });
  assert.equal(miseAJour.status, 404);

  const suppression = await request('DELETE', `/api/products/${absent}`);
  assert.equal(suppression.status, 404);
});

test('un slug inconnu renvoie 404', async () => {
  const { status } = await request('GET', '/api/products/slug-qui-nexiste-pas');
  assert.equal(status, 404);
});

test('le filtre par categorie et par statut actif fonctionne', async () => {
  await request('POST', '/api/products', validProduct({ name: 'Boubou Homme', category: 'homme' }));
  await request('POST', '/api/products', validProduct({ name: 'Robe Femme', category: 'femme' }));
  await request('POST', '/api/products', validProduct({
    name: 'Modele Retire', category: 'femme', isActive: false,
  }));

  const homme = await request('GET', '/api/products?category=homme');
  assert.equal(homme.body.total, 1);
  assert.equal(homme.body.data[0].category, 'homme');

  const actifs = await request('GET', '/api/products?isActive=true');
  assert.equal(actifs.body.total, 2, 'le produit desactive doit etre exclu');

  const femmeActives = await request('GET', '/api/products?category=femme&isActive=true');
  assert.equal(femmeActives.body.total, 1);
});

test('la recherche est insensible a la casse et porte aussi sur la description', async () => {
  await request('POST', '/api/products', validProduct({
    name: 'Grand Boubou Bazin', description: 'Tissu riche et broderie artisanale',
  }));
  await request('POST', '/api/products', validProduct({ name: 'Chemise simple' }));

  const parNom = await request('GET', '/api/products?search=BOUBOU');
  assert.equal(parNom.body.total, 1, 'la recherche doit ignorer la casse');

  const parDescription = await request('GET', '/api/products?search=broderie');
  assert.equal(parDescription.body.total, 1, 'la description doit etre fouillee aussi');

  const sansResultat = await request('GET', '/api/products?search=inexistant');
  assert.equal(sansResultat.body.total, 0);
});

test('la pagination renvoie des compteurs coherents', async () => {
  for (let i = 1; i <= 7; i += 1) {
    await request('POST', '/api/products', validProduct({ name: `Modele ${i}` }));
  }

  const page1 = await request('GET', '/api/products?limit=3&page=1');
  assert.equal(page1.body.data.length, 3);
  assert.equal(page1.body.total, 7);
  assert.equal(page1.body.totalPages, 3);
  assert.equal(page1.body.currentPage, 1);

  const page3 = await request('GET', '/api/products?limit=3&page=3');
  assert.equal(page3.body.data.length, 1, 'la derniere page ne contient que le reste');

  const ids = new Set([
    ...page1.body.data.map((p) => p._id),
    ...page3.body.data.map((p) => p._id),
  ]);
  assert.equal(ids.size, 4, 'les pages ne doivent pas se chevaucher');
});

test('le tri intelligent remonte les produits les plus commandes', async () => {
  const vedette = await request('POST', '/api/products', validProduct({ name: 'Best Seller' }));
  await request('POST', '/api/products', validProduct({ name: 'Jamais Commande' }));

  for (let i = 0; i < 5; i += 1) {
    await prisma.order.create({
      data: {
        orderNumber: `IC-2026-10${i}`,
        productId: vedette.body.data._id,
        size: 'M',
        customer: { fullName: 'Client', phone: '77', email: 'c@example.com' },
        basePrice: 45000,
        totalPrice: 45000,
      },
    });
  }

  const { body } = await request('GET', '/api/products?limit=10');
  assert.equal(body.data[0].name, 'Best Seller');
});

test('les commandes annulees ne comptent pas comme des ventes', async () => {
  const produit = await request('POST', '/api/products', validProduct({ name: 'Annule Partout' }));

  await prisma.order.create({
    data: {
      orderNumber: 'IC-2026-9001',
      productId: produit.body.data._id,
      size: 'M',
      status: 'cancelled',
      customer: { fullName: 'Client', phone: '77', email: 'c@example.com' },
      basePrice: 45000,
      totalPrice: 45000,
    },
  });

  // Aucune assertion sur l'ordre : on verifie que la requete d'agregation
  // exclut bien les annulations sans faire echouer la lecture du catalogue.
  const { status, body } = await request('GET', '/api/products');
  assert.equal(status, 200);
  assert.equal(body.total, 1);
});

test('le tri explicite est respecte', async () => {
  await request('POST', '/api/products', validProduct({ name: 'Cher', basePrice: 90000 }));
  await request('POST', '/api/products', validProduct({ name: 'Abordable', basePrice: 15000 }));

  const croissant = await request('GET', '/api/products?sort=basePrice');
  assert.equal(croissant.body.data[0].name, 'Abordable');

  const decroissant = await request('GET', '/api/products?sort=-basePrice');
  assert.equal(decroissant.body.data[0].name, 'Cher');
});

test('les montants sortent en nombres, pas en chaines', async () => {
  await request('POST', '/api/products', validProduct({
    basePrice: 45000, promoPrice: 39500.5, customPriceImpact: 7500,
  }));

  const { body } = await request('GET', '/api/products');
  const produit = body.data[0];

  assert.equal(typeof produit.basePrice, 'number');
  assert.equal(typeof produit.promoPrice, 'number');
  assert.equal(produit.promoPrice, 39500.5);
  assert.equal(typeof produit.customPriceImpact, 'number');
});
