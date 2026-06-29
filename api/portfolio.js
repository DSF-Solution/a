const { neon } = require('@neondatabase/serverless');

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_jmMX3IQLig1J@ep-old-hall-as27su83-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(connectionString);

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT id, data FROM portfolio_store;`;
      const store = {};
      rows.forEach(r => {
        store[r.id] = r.data;
      });
      return res.status(200).json({ success: true, store });
    } 
    
    if (req.method === 'POST') {
      const { type, data, adminKey } = req.body || {};
      
      // Verification du mot de passe admin (default: 'riker123' ou variable d'environnement)
      const expectedSecret = process.env.ADMIN_SECRET || 'riker123';
      if (adminKey !== expectedSecret) {
        return res.status(403).json({ success: false, error: 'Accès refuse. Mot de passe admin requis.' });
      }

      if (!type || !data || (type !== 'profile' && type !== 'games')) {
        return res.status(400).json({ success: false, error: 'Type invalide (doit etre profile ou games)' });
      }

      await sql`
        INSERT INTO portfolio_store (id, data, updated_at)
        VALUES (${type}, ${JSON.stringify(data)}, NOW())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
      `;

      return res.status(200).json({ success: true, message: `${type} sauvegarde dans Neon avec succes` });
    }

    return res.status(405).json({ success: false, error: 'Methode non autorisee' });
  } catch (err) {
    console.error("Neon API Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
