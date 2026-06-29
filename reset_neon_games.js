const { neon } = require('@neondatabase/serverless');

const connectionString = "postgresql://neondb_owner:npg_jmMX3IQLig1J@ep-old-hall-as27su83-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(connectionString);

async function resetGames() {
  try {
    await sql`UPDATE portfolio_store SET data = '{}'::jsonb WHERE id = 'games';`;
    console.log("Neon DB games successfully reset to empty!");
  } catch (err) {
    console.error(err);
  }
}

resetGames();
