module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const steamKey = process.env.STEAM_API_KEY || req.query.apiKey;
  const steamId = req.query.steamId;

  if (!steamId) {
    return res.status(400).json({ success: false, error: 'steamId est requis (ex: 76561198...)' });
  }

  if (!steamKey) {
    return res.status(400).json({ success: false, error: 'STEAM_API_KEY non configure dans le .env ou Vercel' });
  }

  try {
    // Si un pseudo personnalise est fourni au lieu du SteamID64, essayer de le resoudre
    let targetSteamId = steamId;
    if (!/^\d{17}$/.test(steamId)) {
      const resolveRes = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${steamKey}&vanityurl=${encodeURIComponent(steamId)}`);
      const resolveData = await resolveRes.json();
      if (resolveData?.response?.success === 1 && resolveData.response.steamid) {
        targetSteamId = resolveData.response.steamid;
      }
    }

    // Recuperer la liste des jeux possedes et les temps de jeu
    const gamesRes = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${steamKey}&steamid=${targetSteamId}&include_appinfo=true&include_played_free_games=true`);
    const gamesData = await gamesRes.json();

    if (!gamesData?.response?.games) {
      return res.status(404).json({ success: false, error: 'Aucun jeu trouve ou profil Steam prive.' });
    }

    const ownedGames = gamesData.response.games.map(game => {
      const hours = Math.round(game.playtime_forever / 60);
      const slug = game.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return {
        slug: slug,
        appid: game.appid,
        name: game.name,
        background_image: `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
        playtimeHours: hours,
        myRating: '4.5/5',
        dejaJoue: true,
        myComment: hours > 0 ? `Joue ${hours} heures sur Steam.` : 'Possede sur Steam.',
        genres: 'Steam',
        platforms: 'PC (Steam)',
        released: 'N/A'
      };
    });

    // Trier par temps de jeu decroissant
    ownedGames.sort((a, b) => b.playtimeHours - a.playtimeHours);

    return res.status(200).json({
      success: true,
      count: ownedGames.length,
      games: ownedGames
    });
  } catch (err) {
    console.error("Steam API Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
