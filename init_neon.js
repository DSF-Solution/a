const { neon } = require('@neondatabase/serverless');

const connectionString = "postgresql://neondb_owner:npg_jmMX3IQLig1J@ep-old-hall-as27su83-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(connectionString);

const DEFAULT_GAMES = {
  'elden-ring': {
    myRating: '4.8/5',
    myComment: 'Un chef-d\'œuvre absolu du monde ouvert et du gameplay. Direction artistique magistrale.',
    dejaJoue: true,
    addedAt: 1700000000000
  },
  'cyberpunk-2077': {
    myRating: '4.5/5',
    myComment: 'Night City est l\'une des villes les plus immersives jamais créées dans l\'histoire du jeu vidéo.',
    dejaJoue: true,
    addedAt: 1700000001000
  },
  'the-witcher-3-wild-hunt': {
    myRating: '4.9/5',
    myComment: 'Une écriture narrative et des quêtes secondaires exceptionnelles. Un incontournable du RPG.',
    dejaJoue: true,
    addedAt: 1700000002000
  },
  'red-dead-redemption-2': {
    myRating: '4.8/5',
    myComment: 'Le réalisme et l\'histoire d\'Arthur Morgan sont tout simplement inoubliables.',
    dejaJoue: true,
    addedAt: 1700000003000
  }
};

const DEFAULT_PROFILE = {
  name: 'RikerFr',
  title: '',
  bio: "Passionné par la création d'interfaces utilisateur modernes, fluides et interactives. Je combine l'esthétique du design moderne avec du code Vanilla robuste pour concevoir des expériences web mémorables.",
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
  status: 'En Ligne',
  twitchUsername: 'rikerfr',
  syncTwitch: false,
  pcSetup: {
    gpu: 'NVIDIA RTX 4070 Super',
    cpu: 'AMD Ryzen 7 7800X3D',
    ramSsd: '32 Go DDR5 / 2 To NVMe'
  },
  socials: [
    { id: '1', name: 'GitHub', url: 'https://github.com', icon: 'github' },
    { id: '2', name: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin' },
    { id: '3', name: 'Twitch', url: 'https://twitch.tv', icon: 'twitch' },
    { id: '4', name: 'Contact', url: 'mailto:contact@example.com', icon: 'mail' }
  ]
};

async function init() {
  try {
    console.log("Creation de la table portfolio_store sur Neon...");
    await sql`
      CREATE TABLE IF NOT EXISTS portfolio_store (
        id VARCHAR(50) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("Table creee avec succes.");

    console.log("Insertion des donnees du profil et des jeux par defaut...");
    await sql`
      INSERT INTO portfolio_store (id, data, updated_at)
      VALUES ('profile', ${JSON.stringify(DEFAULT_PROFILE)}, NOW())
      ON CONFLICT (id) DO NOTHING;
    `;

    await sql`
      INSERT INTO portfolio_store (id, data, updated_at)
      VALUES ('games', ${JSON.stringify(DEFAULT_GAMES)}, NOW())
      ON CONFLICT (id) DO NOTHING;
    `;

    const rows = await sql`SELECT id, data FROM portfolio_store;`;
    console.log("Donnees enregistrees dans Neon DB avec succes !", rows.map(r => r.id));
  } catch (err) {
    console.error("Erreur d'initialisation Neon:", err);
  }
}

init();
