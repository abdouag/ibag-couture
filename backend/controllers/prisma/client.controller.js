const { prisma } = require('../../config/prisma');
const { AppError } = require('../../middleware');
const { serializeClient, serializeOrder, serializeMany } = require('../../utils/serialize');
const { parseSort, parsePagination, paginated } = require('../../utils/query');

const WRITABLE_FIELDS = [
  'fullName',
  'phone',
  'email',
  'clientType',
  'address',
  'notes',
  'measurements',
];

const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'fullName', 'phone', 'clientType'];

const pickWritable = (body) => {
  const data = {};
  for (const field of WRITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  // L'email est optionnel : une chaine vide est enregistree comme absence.
  if (data.email !== undefined) {
    data.email = data.email ? String(data.email).toLowerCase().trim() : null;
  }
  return data;
};

/**
 * @desc    Creer un client
 * @route   POST /api/clients
 */
const createClient = async (req, res, next) => {
  try {
    const client = await prisma.client.create({ data: pickWritable(req.body) });

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      data: serializeClient(client),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Recuperer tous les clients
 * @route   GET /api/clients
 */
const getAllClients = async (req, res, next) => {
  try {
    const { search, clientType, sort = '-createdAt' } = req.query;
    const { pageNum, limitNum, skip } = parsePagination(req.query);

    const where = {};
    if (clientType) where.clientType = clientType;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: parseSort(sort, SORTABLE_FIELDS),
        skip,
        take: limitNum,
      }),
      prisma.client.count({ where }),
    ]);

    paginated(res, {
      message: 'Clients récupérés avec succès',
      data: serializeMany(serializeClient, clients),
      total,
      pageNum,
      limitNum,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Recuperer un client par ID
 * @route   GET /api/clients/:id
 */
const getClientById = async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({ where: { id: req.params.id } });

    if (!client) {
      return next(new AppError('Client non trouvé', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Client récupéré avec succès',
      data: serializeClient(client),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Modifier un client
 * @route   PUT /api/clients/:id
 */
const updateClient = async (req, res, next) => {
  try {
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: pickWritable(req.body),
    });

    res.status(200).json({
      success: true,
      message: 'Client mis à jour avec succès',
      data: serializeClient(client),
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError('Client non trouvé', 404));
    }
    next(error);
  }
};

/**
 * @desc    Supprimer un client
 * @route   DELETE /api/clients/:id
 */
const deleteClient = async (req, res, next) => {
  try {
    // Les commandes et paiements du client ne sont pas supprimes : leur lien
    // est simplement detache (SetNull), pour ne pas effacer l'historique
    // commercial et financier de l'atelier.
    await prisma.client.delete({ where: { id: req.params.id } });

    res.status(200).json({
      success: true,
      message: 'Client supprimé avec succès',
      data: null,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError('Client non trouvé', 404));
    }
    next(error);
  }
};

/**
 * @desc    Recuperer les commandes d'un client
 * @route   GET /api/clients/:id/orders
 */
const getClientOrders = async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({ where: { id: req.params.id } });
    if (!client) {
      return next(new AppError('Client non trouvé', 404));
    }

    const orders = await prisma.order.findMany({
      where: { clientId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true, slug: true, category: true, productionTime: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Commandes du client récupérées',
      count: orders.length,
      data: serializeMany(serializeOrder, orders),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientOrders,
};
