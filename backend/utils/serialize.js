/**
 * Serialisation des enregistrements Prisma vers le format attendu par l'API.
 *
 * Le frontend lit `_id` (83 occurrences dans 20 fichiers) et manipule les
 * montants comme des nombres. Prisma, lui, expose `id` et renvoie les colonnes
 * Decimal sous forme d'objets Decimal. Sans conversion, un prix serialise en
 * JSON deviendrait une chaine et `toLocaleString()` casserait cote client.
 *
 * Ces fonctions sont le seul endroit ou le contrat de sortie de l'API est
 * defini. Les colonnes Json (options, mesures, snapshot produit, infos client)
 * traversent telles quelles : elles ne contiennent ni Decimal ni identifiant,
 * et les toucher risquerait d'alterer leur contenu.
 */

/**
 * Convertit un Decimal Prisma en nombre. Laisse passer null et undefined.
 */
const toNumber = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'number') return value;
  if (typeof value.toNumber === 'function') return value.toNumber();
  return Number(value);
};

/**
 * Applique un serialiseur a une valeur unique ou a un tableau.
 */
const serializeMany = (serializer, rows) =>
  Array.isArray(rows) ? rows.map(serializer) : serializer(rows);

/**
 * Utilisateur — le mot de passe n'est jamais expose, meme s'il a ete
 * selectionne pour verifier des identifiants.
 */
const serializeUser = (user) => {
  if (!user) return user;
  const { id, password, ...rest } = user;
  return { _id: id, ...rest };
};

const serializeProduct = (product) => {
  if (!product) return product;
  const { id, basePrice, promoPrice, customPriceImpact, ...rest } = product;
  return {
    _id: id,
    ...rest,
    basePrice: toNumber(basePrice),
    promoPrice: toNumber(promoPrice),
    customPriceImpact: toNumber(customPriceImpact),
  };
};

const serializeClient = (client) => {
  if (!client) return client;
  const { id, orders, payments, ...rest } = client;
  const serialized = { _id: id, ...rest };

  if (orders !== undefined) serialized.orders = serializeMany(serializeOrder, orders);
  if (payments !== undefined) serialized.payments = serializeMany(serializePayment, payments);

  return serialized;
};

const serializeOrder = (order) => {
  if (!order) return order;
  const {
    id,
    basePrice,
    optionsPrice,
    customSurcharge,
    totalPrice,
    product,
    user,
    client,
    payments,
    ...rest
  } = order;

  const serialized = {
    _id: id,
    ...rest,
    basePrice: toNumber(basePrice),
    optionsPrice: toNumber(optionsPrice),
    customSurcharge: toNumber(customSurcharge),
    totalPrice: toNumber(totalPrice),
  };

  // Les relations ne sont serialisees que si elles ont ete chargees.
  // `product: null` est significatif (produit supprime) et doit etre conserve.
  if (product !== undefined) serialized.product = serializeProduct(product);
  if (user !== undefined) serialized.user = serializeUser(user);
  if (client !== undefined) serialized.client = serializeClient(client);
  if (payments !== undefined) serialized.payments = serializeMany(serializePayment, payments);

  return serialized;
};

const serializePayment = (payment) => {
  if (!payment) return payment;
  const { id, amount, order, client, ...rest } = payment;
  const serialized = { _id: id, ...rest, amount: toNumber(amount) };

  if (order !== undefined) serialized.order = serializeOrder(order);
  if (client !== undefined) serialized.client = serializeClient(client);

  return serialized;
};

module.exports = {
  toNumber,
  serializeMany,
  serializeUser,
  serializeProduct,
  serializeClient,
  serializeOrder,
  serializePayment,
};
