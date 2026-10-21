/**
 * Copie le contenu d'une base MongoDB vers une autre
 *
 * Remplace mongodump/mongorestore quand les outils en ligne de commande MongoDB
 * ne sont pas installables (Shell Render, machine sans droits admin). Le script
 * n'utilise que le driver mongodb deja present dans les dependances.
 *
 * Cas d'usage : recuperer les donnees d'un cluster temporaire (restauration
 * d'une ancienne sauvegarde) vers le cluster de production.
 *
 * Usage :
 *   node scripts/copyDatabase.js --from="<uri_source>" --to="<uri_cible>"
 *   node scripts/copyDatabase.js --from="..." --to="..." --apply
 *   node scripts/copyDatabase.js --from="..." --to="..." --apply --drop
 *
 * Les URI doivent inclure le nom de la base, par exemple :
 *   mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/ibag_couture
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const BATCH_SIZE = 500;

/**
 * Masque le mot de passe d'une URI avant affichage
 */
function maskUri(uri) {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}

/**
 * Lit les options passees en ligne de commande
 */
function parseArgs(argv) {
  const args = {
    apply: argv.includes('--apply'),
    drop: argv.includes('--drop'),
    from: '',
    to: '',
  };

  for (const arg of argv) {
    if (arg.startsWith('--from=')) args.from = arg.slice('--from='.length);
    if (arg.startsWith('--to=')) args.to = arg.slice('--to='.length);
  }

  if (!args.from || !args.to) {
    throw new Error(
      'Les deux URI sont requises.\n' +
      'Exemple : node scripts/copyDatabase.js --from="mongodb+srv://.../ibag_couture" --to="mongodb+srv://.../ibag_couture"'
    );
  }
  if (args.from === args.to) {
    throw new Error('La source et la cible sont identiques. Copie annulee.');
  }

  return args;
}

/**
 * Verifie que l'URI contient bien un nom de base de donnees.
 * Sans nom explicite, le driver se rabat sur une base par defaut : la copie
 * partirait ou atterrirait au mauvais endroit sans erreur visible.
 */
function assertDatabaseInUri(uri, label) {
  const withoutParams = uri.split('?')[0];
  const afterHost = withoutParams.replace(/^mongodb(\+srv)?:\/\/[^/]+/, '');
  const dbName = afterHost.replace(/^\//, '');

  if (!dbName) {
    throw new Error(
      `L'URI ${label} ne precise pas de base de donnees.\n` +
      'Ajoutez le nom de la base avant le "?", par exemple : .../ibag_couture?retryWrites=true'
    );
  }

  return dbName;
}

/**
 * Copie une collection par lots
 */
async function copyCollection(sourceDb, targetDb, name) {
  const sourceCollection = sourceDb.collection(name);
  const targetCollection = targetDb.collection(name);

  let copied = 0;
  let batch = [];

  const cursor = sourceCollection.find({});

  const flush = async () => {
    if (batch.length === 0) return;
    await targetCollection.insertMany(batch, { ordered: false });
    copied += batch.length;
    batch = [];
  };

  while (await cursor.hasNext()) {
    batch.push(await cursor.next());
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();

  // Recreer les index de la source (hors _id_, cree automatiquement)
  const indexes = (await sourceCollection.listIndexes().toArray())
    .filter((index) => index.name !== '_id_')
    .map(({ v, ns, ...spec }) => spec);

  if (indexes.length > 0) {
    await targetCollection.createIndexes(indexes);
  }

  return { copied, indexes: indexes.length };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  assertDatabaseInUri(args.from, 'source (--from)');
  assertDatabaseInUri(args.to, 'cible (--to)');

  const sourceClient = new MongoClient(args.from);
  const targetClient = new MongoClient(args.to);

  try {
    await sourceClient.connect();
    await targetClient.connect();

    const sourceDb = sourceClient.db();
    const targetDb = targetClient.db();

    console.log(`Source : ${maskUri(args.from)}`);
    console.log(`Cible  : ${maskUri(args.to)}\n`);

    const collections = (await sourceDb.listCollections().toArray())
      .map((collection) => collection.name)
      .filter((name) => !name.startsWith('system.'))
      .sort();

    if (collections.length === 0) {
      console.log('Aucune collection dans la base source. Rien a copier.');
      return;
    }

    // Etat des lieux avant toute ecriture
    const plan = [];
    for (const name of collections) {
      const sourceCount = await sourceDb.collection(name).countDocuments();
      const targetCount = await targetDb.collection(name).countDocuments();
      plan.push({ name, sourceCount, targetCount });
    }

    console.log('Collection'.padEnd(24) + 'Source'.padStart(10) + 'Cible'.padStart(10));
    for (const item of plan) {
      console.log(
        item.name.padEnd(24) +
        String(item.sourceCount).padStart(10) +
        String(item.targetCount).padStart(10)
      );
    }

    const occupied = plan.filter((item) => item.targetCount > 0);
    if (occupied.length > 0 && !args.drop) {
      console.log(
        `\nAttention : ${occupied.length} collection(s) contiennent deja des donnees cote cible.` +
        '\nElles seront ignorees pour eviter les doublons.' +
        '\nUtilisez --drop pour les vider avant la copie.'
      );
    }

    if (!args.apply) {
      console.log('\n[SIMULATION] Aucune ecriture effectuee.');
      console.log('Relancez avec --apply pour lancer la copie.');
      return;
    }

    console.log('');
    let totalCopied = 0;

    for (const item of plan) {
      if (item.targetCount > 0 && !args.drop) {
        console.log(`  ${item.name.padEnd(24)} ignoree (cible non vide)`);
        continue;
      }

      if (item.targetCount > 0 && args.drop) {
        await targetDb.collection(item.name).drop();
      }

      if (item.sourceCount === 0) {
        console.log(`  ${item.name.padEnd(24)} vide, rien a copier`);
        continue;
      }

      const { copied, indexes } = await copyCollection(sourceDb, targetDb, item.name);
      totalCopied += copied;
      console.log(`  ${item.name.padEnd(24)} ${copied} document(s), ${indexes} index recree(s)`);
    }

    console.log(`\n${totalCopied} document(s) copie(s) au total.`);
    console.log('Verifiez les donnees dans l\'admin avant de supprimer le cluster source.');
  } finally {
    await sourceClient.close().catch(() => {});
    await targetClient.close().catch(() => {});
  }
}

run().catch((error) => {
  console.error(`\nErreur : ${error.message}`);
  process.exit(1);
});
