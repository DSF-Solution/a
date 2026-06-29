(function() {
  const savedTheme = sessionStorage.getItem('portfolio_theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
})();

const DEFAULT_GAMES = {};
let MY_GAMES = {};

const DEFAULT_PROFILE_DATA = {
  name: 'Mon Pseudo',
  title: '',
  bio: '',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
  status: 'En Ligne',
  twitchUsername: '',
  syncTwitch: false,
  pcSetup: {
    gpu: 'N/A',
    cpu: 'N/A',
    ramSsd: 'N/A',
    mobo: 'N/A',
    cooler: 'N/A',
    casePsu: 'N/A'
  },
  socials: []
};

let PROFILE_DATA = Object.assign({}, DEFAULT_PROFILE_DATA);

const getBackendUrl = () => atob('aHR0cDovLzMxLjIxNC4xNDEuMTg4OjIwMjQx');
const BACKEND_URL = getBackendUrl();

// Synchronisation automatique avec la base de données Cloud Neon
async function syncWithNeonCloud() {
  let loaded = false;
  try {
    const res = await fetch(`${BACKEND_URL}/api/portfolio`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.store) {
        if (data.store.profile) {
          PROFILE_DATA = Object.assign({}, DEFAULT_PROFILE_DATA, data.store.profile);
          renderProfileData();
        }
        if (data.store.games) {
          MY_GAMES = data.store.games;
          loadGamesGrid();
        }
        loaded = true;
      }
    }
  } catch (err) {}

  if (!loaded) {
    try {
      const localProf = localStorage.getItem('my_portfolio_profile');
      if (localProf) PROFILE_DATA = Object.assign({}, DEFAULT_PROFILE_DATA, JSON.parse(localProf));
      renderProfileData();
      const localGames = localStorage.getItem('my_games_portfolio');
      if (localGames) MY_GAMES = JSON.parse(localGames);
      loadGamesGrid();
    } catch(e){}
  }
}

async function pushToNeonCloud(type, payload) {
  try {
    if (type === 'profile') localStorage.setItem('my_portfolio_profile', JSON.stringify(payload));
    if (type === 'games') localStorage.setItem('my_games_portfolio', JSON.stringify(payload));
  } catch(e){}

  try {
    await fetch(`${BACKEND_URL}/api/portfolio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data: payload, adminKey: ADMIN_KEY })
    });
  } catch (err) {}
}

function saveGamesToLocalStorage() {
  try { localStorage.setItem('my_games_portfolio', JSON.stringify(MY_GAMES)); } catch(e){}
  pushToNeonCloud('games', MY_GAMES);
}

function saveProfileData() {
  try { localStorage.setItem('my_portfolio_profile', JSON.stringify(PROFILE_DATA)); } catch(e){}
  renderProfileData();
  pushToNeonCloud('profile', PROFILE_DATA);
}

async function updateTwitchStatus() {
  if (!PROFILE_DATA || !PROFILE_DATA.syncTwitch || !PROFILE_DATA.twitchUsername) return;

  const username = PROFILE_DATA.twitchUsername.trim().toLowerCase();
  if (!username) return;

  try {
    const avatarRes = await fetch(`https://decapi.me/twitch/avatar/${username}`);
    const avatarUrl = await avatarRes.text();

    const uptimeRes = await fetch(`https://decapi.me/twitch/uptime/${username}`);
    const uptimeText = await uptimeRes.text();

    const gameRes = await fetch(`https://decapi.me/twitch/game/${username}`);
    const gameText = await gameRes.text();

    const avatarImg = document.getElementById('avatar-img');
    const statusBadge = document.getElementById('status-badge');
    const statusText = document.getElementById('status-text');

    if (avatarUrl && avatarUrl.startsWith('http') && avatarImg) {
      avatarImg.src = avatarUrl;
    }

    const isLive = !uptimeText.toLowerCase().includes('offline') && !uptimeText.toLowerCase().includes('error') && !uptimeText.toLowerCase().includes('not found') && uptimeText.length > 0;

    if (statusBadge && statusText) {
      statusBadge.classList.remove('live', 'online', 'offline');
      if (isLive) {
        statusBadge.classList.add('live');
        const gameDisplay = (gameText && !gameText.toLowerCase().includes('error')) ? ` • ${gameText}` : '';
        statusText.textContent = `🔴 EN LIVE${gameDisplay}`;
      } else {
        statusBadge.classList.add('offline');
        statusText.textContent = 'Hors-Ligne';
      }
    }
  } catch (err) {
    console.error('Erreur Twitch sync:', err);
  }
}

function renderProfileData() {
  const avatarImg = document.getElementById('avatar-img');
  const profileName = document.getElementById('profile-name');
  const profileTitle = document.getElementById('profile-title');
  const profileBio = document.getElementById('profile-bio');
  const statusText = document.getElementById('status-text');
  const statusBadge = document.getElementById('status-badge');
  const profileSocials = document.getElementById('profile-socials');
  
  const specGpu = document.getElementById('spec-gpu');
  const specCpu = document.getElementById('spec-cpu');
  const specRamSsd = document.getElementById('spec-ram-ssd');
  const specMobo = document.getElementById('spec-mobo');
  const specCooler = document.getElementById('spec-cooler');
  const specCase = document.getElementById('spec-case');

  if (avatarImg && PROFILE_DATA.avatar) avatarImg.src = PROFILE_DATA.avatar;
  if (profileName) profileName.textContent = PROFILE_DATA.name;
  if (profileTitle) {
    if (PROFILE_DATA.title && PROFILE_DATA.title.trim() !== '') {
      profileTitle.style.display = 'block';
      profileTitle.textContent = PROFILE_DATA.title;
    } else {
      profileTitle.style.display = 'none';
    }
  }
  
  if (profileBio) {
    if (PROFILE_DATA.bio && PROFILE_DATA.bio.trim() !== '') {
      profileBio.style.display = 'block';
      profileBio.textContent = PROFILE_DATA.bio;
    } else {
      profileBio.style.display = 'none';
    }
  }

  if (!PROFILE_DATA.syncTwitch) {
    if (statusBadge) {
      statusBadge.classList.remove('live');
      statusBadge.classList.add('online');
    }
    if (statusText) statusText.textContent = PROFILE_DATA.status;
  }

  const specsList = document.querySelector('.specs-list');
  if (specsList && PROFILE_DATA.pcSetup) {
    const items = [
      { key: 'gpu', label: 'GPU', icon: 'zap', highlight: true },
      { key: 'cpu', label: 'CPU', icon: 'processor', highlight: false },
      { key: 'ramSsd', label: 'RAM / SSD', icon: 'hard-drive', highlight: false },
      { key: 'mobo', label: 'Carte Mère', icon: 'circuit-board', highlight: false },
      { key: 'cooler', label: 'Refroidissement', icon: 'fan', highlight: false },
      { key: 'casePsu', label: 'Boîtier / Alim', icon: 'box', highlight: false }
    ];

    let html = '';
    items.forEach(item => {
      const val = PROFILE_DATA.pcSetup[item.key];
      if (val && val.trim() !== '' && val.trim().toUpperCase() !== 'N/A') {
        html += `
          <div class="spec-item">
            <div class="spec-label">
              <span class="spec-dot"></span>
              <span>${item.label}</span>
            </div>
            <div class="spec-value ${item.highlight ? 'highlight-gpu' : ''}">${val.trim()}</div>
          </div>
        `;
      }
    });

    specsList.innerHTML = html;
  }

  if (profileSocials && PROFILE_DATA.socials) {
    profileSocials.innerHTML = PROFILE_DATA.socials.map(link => {
      let iconHTML = `<i data-lucide="${link.icon || 'link'}"></i>`;
      if (link.icon === 'steam-img') {
        iconHTML = `<img src="assets/steam.png" style="width:18px;height:18px;object-fit:contain;" alt="Steam">`;
      } else if (link.icon === 'instant-gaming') {
        iconHTML = `<img src="assets/instant-gaming.png" style="width:18px;height:18px;object-fit:contain;" alt="Instant Gaming">`;
      }
      return `
        <a href="${link.url}" target="_blank" class="social-btn" aria-label="${link.name}">
          ${iconHTML}
          <span>${link.name}</span>
        </a>
      `;
    }).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  if (PROFILE_DATA.syncTwitch) {
    updateTwitchStatus();
  }
}

// Données de secours (Mock Data) si la clé API n'est pas configurée ou s'il y a une erreur.
// Permet au site de fonctionner magnifiquement de manière autonome immédiatement.
const MOCK_GAMES_DATA = {
  'elden-ring': {
    name: 'Elden Ring',
    background_image: 'https://images.unsplash.com/photo-1651877665741-2c0926bf01ef?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    released: '2022',
    genres: 'Action, RPG, Open World',
    platforms: 'PC, PlayStation 4, PlayStation 5, Xbox One, Xbox Series X/S',
    description: 'Levez-vous, Sans-éclat, et laissez-vous guider par la grâce pour revêtir le pouvoir du Cercle d\'Elden. Devenez le Seigneur de l\'Entre-terre. Dans l\'Entre-terre régi par la Reine Marika l\'Éternelle, le Cercle d\'Elden, source de l\'Arbre-Monde, fut brisé. Les descendants de Marika, tous des demi-dieux, revendiquèrent les éclats du Cercle d\'Elden. Une guerre éclata : la Dévastation. Débutez une quête épique dans un monde fantastique sombre et mystérieux.'
  },
  'cyberpunk-2077': {
    name: 'Cyberpunk 2077',
    background_image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    rating: 4.3,
    released: '2020',
    genres: 'RPG, Action, Science-Fiction',
    platforms: 'PC, PlayStation 4, PlayStation 5, Xbox One, Xbox Series X/S',
    description: 'Cyberpunk 2077 est un RPG d\'action-aventure en monde ouvert qui se déroule dans la mégapole futuriste de Night City, sous le contrôle des mégacorporations. Vous incarnez V, un mercenaire hors-la-loi à la recherche d\'un implant unique qui détient la clé de l\'immortalité. Personnalisez votre matériel cybernétique, vos compétences et explorez une ville immense où vos choix façonnent l\'histoire et le monde qui vous entoure.'
  },
  'the-witcher-3-wild-hunt': {
    name: 'The Witcher 3: Wild Hunt',
    background_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    released: '2015',
    genres: 'RPG, Aventure, Fantasy',
    platforms: 'PC, PlayStation 4, PlayStation 5, Xbox One, Xbox Series X/S, Nintendo Switch',
    description: 'Devenez Geralt de Riv, un tueur de monstres professionnel engagé pour retrouver l\'enfant de la prophétie dans un vaste monde ouvert rempli de cités marchandes, d\'îles vikings, de cols de montagne périlleux et de cavernes oubliées. Affrontez la Chasse Sauvage dans un scénario adulte et captivant où chaque décision a des conséquences majeures sur le destin des royaumes.'
  },
  'red-dead-redemption-2': {
    name: 'Red Dead Redemption 2',
    background_image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    released: '2018',
    genres: 'Action, Aventure, Western',
    platforms: 'PC, PlayStation 4, Xbox One',
    description: 'Amérique, 1899. L\'ère de l\'Ouest sauvage touche à sa fin. Après un hold-up manqué dans la ville de Blackwater, Arthur Morgan et le gang d\'Outlaws de Dutch van der Linde sont traqués par les agents fédéraux et les meilleurs chasseurs de primes du pays. Pour survivre, le gang doit commettre des méfaits, voler et se battre à travers le cœur sauvage de l\'Amérique. Mais des tensions internes menacent de diviser le gang.'
  },
  'hades-ii': {
    name: 'Hades II',
    background_image: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    released: '2024',
    genres: 'Action, Rogue-like, Mythologie',
    platforms: 'PC',
    description: 'Combattez au-delà des Enfers en utilisant la sorcellerie noire pour défier le Titan du Temps dans cette suite envoûtante du rogue-like d\'exploration de donjons acclamé par la critique. Incarnez Melinoë, la princesse immortelle des Enfers, explorez un monde mythologique plus vaste et plus profond, terrassez les forces du temps avec la puissance de l\'Olympe derrière vous, et vivez une histoire en constante évolution.'
  },
  'baldur-gate-3': {
    name: 'Baldur\'s Gate 3',
    background_image: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    released: '2023',
    genres: 'RPG, Stratégie, Tactique',
    platforms: 'PC, PlayStation 5, Xbox Series X/S, macOS',
    description: 'Rassemblez votre groupe et retournez aux Royaumes Oubliés dans une histoire d\'amitié, de trahison, de sacrifice et de survie, sous la menace du pouvoir absolu. Des capacités mystérieuses s\'éveillent en vous, issues d\'un parasite de flagelleur mental implanté dans votre cerveau. Résistez et retournez les ténèbres contre elles-mêmes, ou embrassez la corruption pour devenir le mal absolu.'
  }
};

// 2. GESTION DES FENÊTRES ET DE L'ETAT GLOBAL
const openWindows = new Map(); // Stocke les fenêtres actives : { slug => windowElement }
let activeWindow = null;       // Suivi de la fenêtre qui a le focus au premier plan
let zIndexCounter = 1010;      // Compteur pour empiler les fenêtres au premier plan

let IS_ADMIN = false;
let ADMIN_KEY = sessionStorage.getItem('portfolio_admin_key') || atob('cmlrZXIxMjM=');

function initAdminMode() {
  const sessionAuth = sessionStorage.getItem('portfolio_admin_session');
  if (sessionAuth === 'true') {
    IS_ADMIN = true;
  } else {
    IS_ADMIN = false;
  }
  updateAdminVisibility();
}

function updateAdminVisibility() {
  const topLogoutBtn = document.getElementById('admin-logout-top-btn');
  const addGameBtn = document.getElementById('open-add-game-btn');
  const editProfBtn = document.getElementById('open-edit-profile-btn');

  if (IS_ADMIN) {
    document.body.classList.remove('visitor-mode');
    if (topLogoutBtn) topLogoutBtn.style.display = 'inline-flex';
    if (addGameBtn) addGameBtn.style.display = 'inline-flex';
    if (editProfBtn) editProfBtn.style.display = 'inline-flex';
  } else {
    document.body.classList.add('visitor-mode');
    if (topLogoutBtn) topLogoutBtn.style.display = 'none';
    if (addGameBtn) addGameBtn.style.display = 'none';
    if (editProfBtn) editProfBtn.style.display = 'none';
  }
}

function toggleAdminLock() {
  if (IS_ADMIN) {
    IS_ADMIN = false;
    sessionStorage.removeItem('portfolio_admin_session');
    sessionStorage.removeItem('portfolio_admin_key');
    updateAdminVisibility();
    showToast('Déconnecté du mode administrateur.', 'info');
  } else {
    window.location.href = 'admin.html';
  }
}

function openAdminLoginWindow() {
  const container = document.getElementById('windows-container');
  if (!container) return;

  const slug = 'admin-login-system';
  if (openWindows.has(slug)) {
    focusWindow(openWindows.get(slug));
    return;
  }

  const win = document.createElement('div');
  win.className = 'os-window';
  win.id = `win-${slug}`;
  win.dataset.slug = slug;

  win.style.width = '400px';
  win.style.height = '290px';
  win.style.left = `${(window.innerWidth - 400) / 2}px`;
  win.style.top = `${Math.max(50, (window.innerHeight - 290) / 2)}px`;

  win.innerHTML = `
    <div class="window-titlebar">
      <div class="window-controls-left">
        <button class="win-btn win-close" title="Fermer" aria-label="Fermer"></button>
      </div>
      <div class="window-title">Authentification Administrateur</div>
      <i data-lucide="shield-check" class="window-info-icon"></i>
    </div>
    <div class="window-body" style="grid-template-columns: 1fr; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; justify-content: center; align-items: center; text-align: center;">
      
      <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
        <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(145, 70, 255, 0.15); display: flex; align-items: center; justify-content: center; color: #9146ff; margin-bottom: 2px;">
          <i data-lucide="lock" style="width: 24px; height: 24px;"></i>
        </div>
        <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin: 0;">Espace Administrateur</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Entrez votre mot de passe secret pour activer l'édition.</p>
      </div>

      <div style="width: 100%; display: flex; flex-direction: column; gap: 10px;">
        <input type="password" id="admin-password-input" placeholder="Mot de passe secret..." style="width: 100%; padding: 0.75rem 1rem; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.95rem; text-align: center; outline: none;">
        <button id="admin-login-submit" class="social-btn" style="width: 100%; justify-content: center; background: #9146ff; color: #fff; border-color: #9146ff; font-weight: 700; padding: 0.75rem;">
          <i data-lucide="key"></i> Connexion
        </button>
      </div>
    </div>
  `;

  container.appendChild(win);
  openWindows.set(slug, win);
  makeDraggable(win, win.querySelector('.window-titlebar'));

  win.querySelector('.win-close').addEventListener('click', () => closeWindow(slug));

  if (window.lucide) {
    window.lucide.createIcons({ node: win });
  }

  const passInput = win.querySelector('#admin-password-input');
  const submitBtn = win.querySelector('#admin-login-submit');

  const attemptLogin = () => {
    const enteredPass = passInput.value.trim();
    const validHashes = ['cmlrZXIxMjM=', 'MTIzNA=='];
    
    if (validHashes.includes(btoa(enteredPass)) || enteredPass === ADMIN_KEY) {
      IS_ADMIN = true;
      ADMIN_KEY = enteredPass;
      sessionStorage.setItem('portfolio_admin_session', 'true');
      updateAdminVisibility();
      closeWindow(slug);
      showToast('Mode Administrateur déverrouillé avec succès !', 'success');
    } else {
      showToast('Mot de passe incorrect.', 'error');
      passInput.style.borderColor = '#ef4444';
      setTimeout(() => passInput.style.borderColor = 'var(--border-color)', 2000);
    }
  };

  submitBtn.addEventListener('click', attemptLogin);
  passInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptLogin();
  });

  setTimeout(() => passInput.focus(), 100);
}

// 3. INITIALISATION GENERALE AU CHARGEMENT DU DOM
document.addEventListener('DOMContentLoaded', () => {
  // Initialiser le mode administrateur vs visiteur
  initAdminMode();

  // Synchroniser avec la base de données Neon Cloud
  syncWithNeonCloud();

  // Rendre les données du profil sauvegardées
  renderProfileData();

  // Démarrer la vérification récurrente de Twitch si activé
  if (PROFILE_DATA.syncTwitch) {
    updateTwitchStatus();
    setInterval(updateTwitchStatus, 60000);
  }

  // Initialiser les icônes Lucide
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Vérifier et afficher l'état de l'API RAWG sur le statut système
  updateApiStatusIndicator();

  // Démarrer les horloges
  startClock();

  // Charger les cartes de jeux
  loadGamesGrid();

  // Initialiser les écouteurs de recherche
  initSearchFilter();

  // Écouteur pour ouvrir la fenêtre de configuration "Ajouter un jeu"
  const openAddBtn = document.getElementById('open-add-game-btn');
  if (openAddBtn) {
    openAddBtn.addEventListener('click', openAddGameWindow);
  }

  // Écouteur pour le bouton de déconnexion admin en haut
  const adminLogoutTopBtn = document.getElementById('admin-logout-top-btn');
  if (adminLogoutTopBtn) {
    adminLogoutTopBtn.addEventListener('click', toggleAdminLock);
  }

  // Écouteur pour ouvrir la fenêtre de modification du profil
  const openEditProfBtn = document.getElementById('open-edit-profile-btn');
  if (openEditProfBtn) {
    openEditProfBtn.addEventListener('click', openEditProfileWindow);
  }

  // Initialiser le menu démarrer de la barre des tâches
  initStartMenu();

  // Initialiser le basculement de thème (Clair/Sombre)
  initThemeToggle();
});

function updateApiStatusIndicator() {
  const pillText = document.querySelector('.system-pill');
  if (pillText) {
    pillText.innerHTML = `<span class="pill-indicator green"></span>API CLOUD: OK`;
    pillText.setAttribute('title', 'Connecté à la base de données Cloud VPS.');
  }
}

// 5. HORLOGE NUMERIQUE DYNAMIQUE
function startClock() {
  const cardTimeEl = document.getElementById('card-time');
  const cardDateEl = document.getElementById('card-date');
  const taskbarTimeEl = document.getElementById('taskbar-time-val');

  const optionsDate = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };

  function updateTime() {
    const now = new Date();

    // Heure locale complète (HH:MM:SS)
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Format compact pour la barre des tâches (HH:MM)
    const shortTimeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Date en français
    let dateStr = now.toLocaleDateString('fr-FR', optionsDate);
    // Capitaliser la première lettre
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    if (cardTimeEl) cardTimeEl.textContent = timeStr;
    if (cardDateEl) cardDateEl.textContent = dateStr;
    if (taskbarTimeEl) taskbarTimeEl.textContent = shortTimeStr;
  }

  updateTime();
  setInterval(updateTime, 1000);
}



// 7. CHARGEMENT ET RECUPERATION DES JEUX RAWG / MOCKS
async function loadGamesGrid() {
  const gridContainer = document.getElementById('games-grid');
  if (!gridContainer) return;

  const slugs = Object.keys(MY_GAMES);

  // Gérer l'état vide
  if (slugs.length === 0) {
    gridContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.25rem; padding: 4.5rem 2rem; color: var(--text-muted); text-align: center; border: 2px dashed var(--border-color); border-radius: 24px; background: rgba(255, 255, 255, 0.01); backdrop-filter: blur(10px);">
        <i data-lucide="gamepad-2" style="width: 48px; height: 48px; color: var(--accent-purple); opacity: 0.7;"></i>
        <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.2px;">${IS_ADMIN ? 'Votre portfolio est vide' : 'Aucun jeu dans la bibliothèque'}</div>
        <p style="font-size: 0.85rem; max-width: 320px; color: var(--text-muted); line-height: 1.5;">${IS_ADMIN ? 'Cliquez sur le bouton "Ajouter" ci-dessus pour insérer votre premier jeu et configurer votre note personnelle !' : 'La collection de jeux est actuellement vide.'}</p>
      </div>
    `;
    if (window.lucide) {
      window.lucide.createIcons({ node: gridContainer });
    }
    return;
  }

  // Récupérer les données pour tous les slugs de jeux configurés dans MY_GAMES
  const fetchPromises = slugs.map(slug => fetchGameInfo(slug));
  const games = await Promise.all(fetchPromises);

  // Map des index pour fallback d'ordre d'insertion
  const slugIndexMap = new Map();
  slugs.forEach((slug, idx) => slugIndexMap.set(slug, idx));

  // Tri des jeux selon l'option sélectionnée
  const sortSelect = document.getElementById('game-sort-select');
  const sortMode = sortSelect ? sortSelect.value : 'recent';

  games.sort((a, b) => {
    if (!a || !b) return 0;
    if (sortMode === 'alpha') {
      return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
    } else if (sortMode === 'rating') {
      const rA = parseFloat(a.myRating) || 0;
      const rB = parseFloat(b.myRating) || 0;
      return rB - rA;
    } else {
      // 'recent': derniers avis ajoutés en premier (timestamp le plus élevé tout en haut)
      const tA = a.addedAt || (slugIndexMap.get(a.slug) || 0);
      const tB = b.addedAt || (slugIndexMap.get(b.slug) || 0);
      return tB - tA;
    }
  });

  // Supprimer l'état de chargement
  gridContainer.innerHTML = '';

  // Injecter les cartes de jeux dans la grille
  games.forEach(game => {
    if (game) {
      const cardHTML = createGameCardHTML(game);
      gridContainer.appendChild(cardHTML);
    }
  });

  // Ré-initialiser Lucide Icons sur les nouveaux éléments
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Activer le Lazy Loading
  initLazyLoading();

  // Ajouter les gestionnaires de clic pour ouvrir les fenêtres de détails
  initCardClickEvents(games);
}

// Génère des données fictives de secours dynamiquement si un nouveau jeu n'a pas de mock statique défini
function generateFallbackMock(slug) {
  const name = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return {
    name: name,
    background_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    rating: '4.5',
    released: 'N/A',
    genres: 'Jeux Vidéo',
    platforms: 'PC, PlayStation, Xbox',
    description: `Données de secours générées pour ${name}. Configurez votre clé API RAWG.io dans app.js pour charger automatiquement les vraies données depuis Internet.`
  };
}

// Extrait la partie française d'une description RAWG si elle existe
function extractFrenchDescription(text) {
  if (!text) return '';
  
  const langHeaders = [
    'español', 'spanish', 'deutsch', 'german', 'italiano', 'italian', 
    'português', 'portuguese', 'русский', 'russian', 'polski', 'polish',
    '日本語', 'japanese', '简体中文', 'chinese', 'english'
  ];
  
  const frenchRegex = /(?:^|\n)(français|french|fr)(?:\s*:?\s*)(?:\r?\n|$)/i;
  const match = text.match(frenchRegex);
  
  if (match) {
    const startIndex = match.index + match[0].length;
    const remainingText = text.substring(startIndex);
    
    let nextHeaderIndex = remainingText.length;
    
    for (const header of langHeaders) {
      const headerRegex = new RegExp(`(?:^|\\n)(${header})(?:\\s*:?\\s*)(?:\\r?\\n|$)`, 'i');
      const headerMatch = remainingText.match(headerRegex);
      if (headerMatch && headerMatch.index < nextHeaderIndex) {
        nextHeaderIndex = headerMatch.index;
      }
    }
    
    const frenchSection = remainingText.substring(0, nextHeaderIndex).trim();
    if (frenchSection.length > 50) {
      return frenchSection;
    }
  }
  
  return '';
}

// Enlever tout ce qui se trouve après les en-têtes de langues connues (Español, Deutsch, etc.) dans RAWG
function cleanDescriptionOfOtherLanguages(text) {
  if (!text) return '';
  const headers = [
    'español', 'spanish', 'deutsch', 'german', 'italiano', 'italian', 
    'português', 'portuguese', 'русский', 'russian', 'polski', 'polish',
    '日本語', 'japanese', '简体中文', 'chinese'
  ];
  
  let cleanedText = text;
  for (const header of headers) {
    const regex = new RegExp(`(?:^|\\n)(${header})(?:\\s*:?\\s*)(?:\\r?\\n|$)`, 'i');
    const match = cleanedText.match(regex);
    if (match) {
      cleanedText = cleanedText.substring(0, match.index).trim();
    }
  }
  return cleanedText;
}

// Prendre un extrait propre de phrases complètes sous la limite de maxLength caractères
function getCleanExcerpt(text, maxLength = 450) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  const sub = text.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    sub.lastIndexOf('.'),
    sub.lastIndexOf('!'),
    sub.lastIndexOf('?')
  );
  
  if (lastSentenceEnd > 150) {
    return sub.substring(0, lastSentenceEnd + 1);
  }
  
  const lastSpace = sub.lastIndexOf(' ');
  if (lastSpace > 0) {
    return sub.substring(0, lastSpace) + '...';
  }
  
  return sub + '...';
}

// Traduit un texte en français via l'API gratuite MyMemory (limité à 450 caractères pour éviter le spam ou les limites)
async function translateToFrench(text) {
  if (!text) return '';
  
  // Nettoyer les autres langues
  const englishOnly = cleanDescriptionOfOtherLanguages(text);
  
  // Prendre un extrait de phrases complètes sous la limite de 450 caractères
  const textToTranslate = getCleanExcerpt(englishOnly, 450);
  
  try {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|fr`);
    if (response.ok) {
      const data = await response.json();
      if (data.responseData && data.responseData.translatedText) {
        const translated = data.responseData.translatedText;
        if (!translated.toUpperCase().includes('LIMIT EXCEEDED')) {
          const parser = new DOMParser();
          return parser.parseFromString(translated, 'text/html').body.textContent;
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la traduction:', error);
  }
  
  // En cas d'échec de la traduction, renvoyer l'extrait d'origine en anglais
  return textToTranslate;
}

// Récupère les infos d'un jeu particulier via l'API ou le mock
async function fetchGameInfo(slug) {
  const isMock = !RAWG_API_KEY || RAWG_API_KEY === 'VOTRE_CLE_API_ICI';
  let myRating = MY_GAMES[slug]?.myRating || 'N/A';
  let dejaJoue = MY_GAMES[slug]?.dejaJoue || false;
  const myComment = MY_GAMES[slug]?.myComment || '';

  const addedAt = MY_GAMES[slug]?.addedAt || 0;

  // Migration de l'ancien format
  if (myRating === 'Déjà joué') {
    dejaJoue = true;
    myRating = 'N/A';
  }
  
  const customImage = MY_GAMES[slug]?.customImage;
  const customReleased = MY_GAMES[slug]?.released;
  const customGenres = MY_GAMES[slug]?.genres;
  const customPlatforms = MY_GAMES[slug]?.platforms;
  
  if (isMock) {
    // Simulation d'une latence réseau légère pour l'effet de chargement
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
    const baseMock = MOCK_GAMES_DATA[slug] || generateFallbackMock(slug);
    return {
      slug: slug,
      myRating: myRating,
      dejaJoue: dejaJoue,
      myComment: myComment,
      addedAt: addedAt,
      customImage: customImage,
      platforms: customPlatforms || baseMock.platforms || 'PC, PS5, Xbox Series X/S',
      released: customReleased || baseMock.released || 'N/A',
      genres: customGenres || baseMock.genres || 'Action',
      ...baseMock,
      background_image: customImage || baseMock.background_image
    };
  }

  try {
    const response = await fetch(`https://api.rawg.io/api/games/${slug}?key=322fb41e740644ecb0e5198b589351b6`);
    if (!response || !response.ok) {
      throw new Error(`Erreur RAWG pour le slug: ${slug}`);
    }
    const data = await response.json();

    // Traiter la description pour qu'elle soit en Français
    const fullDesc = cleanHtmlDescription(data.description) || 'Aucune description disponible.';
    let frenchDesc = extractFrenchDescription(fullDesc);
    if (!frenchDesc) {
      frenchDesc = await translateToFrench(fullDesc);
    }

    return {
      slug: slug,
      myRating: myRating,
      dejaJoue: dejaJoue,
      myComment: myComment,
      customImage: customImage,
      name: data.name,
      background_image: customImage || data.background_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      rating: data.rating || 'N/A',
      released: customReleased || (data.released ? new Date(data.released).getFullYear() : 'N/A'),
      genres: customGenres || (data.genres ? data.genres.map(g => g.name).join(', ') : 'Action'),
      platforms: customPlatforms || (data.platforms ? data.platforms.map(p => p.platform.name).join(', ') : 'PC'),
      description: frenchDesc
    };
  } catch (error) {
    console.warn(`Impossible de récupérer ${slug} depuis RAWG, bascule sur la démo locale.`, error);
    const baseMock = MOCK_GAMES_DATA[slug] || generateFallbackMock(slug);
    return {
      slug: slug,
      myRating: myRating,
      dejaJoue: dejaJoue,
      myComment: myComment,
      customImage: customImage,
      platforms: customPlatforms || baseMock.platforms || 'PC, PS5, Xbox Series X/S',
      released: customReleased || baseMock.released || 'N/A',
      genres: customGenres || baseMock.genres || 'Action',
      ...baseMock,
      background_image: customImage || baseMock.background_image
    };
  }
}

// Supprime les balises HTML des descriptions RAWG
function cleanHtmlDescription(html) {
  if (!html) return '';
  // Nettoie toutes les balises HTML
  let cleanText = html.replace(/<\/?[^>]+(>|$)/g, "");

  // Décode les entités HTML spéciales (comme &amp;, &#39;)
  const parser = new DOMParser();
  const decoded = parser.parseFromString(cleanText, 'text/html').body.textContent;

  return decoded;
}

// Génère la structure DOM d'une carte de jeu
function createGameCardHTML(game) {
  const card = document.createElement('div');
  card.className = 'game-card';
  card.dataset.slug = game.slug;
  card.setAttribute('tabindex', '0');

  card.innerHTML = `
    <!-- Bouton de suppression directe sur la carte -->
    <button class="card-delete-btn" title="Supprimer de mon portfolio" aria-label="Supprimer ${game.name}">
      <i data-lucide="trash-2"></i>
    </button>
    <div class="game-card-img-wrapper">
      <!-- Image d'arrière-plan gérée en lazy loading avec transition -->
      <img data-src="${game.background_image}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3E%3C/svg%3E" class="game-card-img" alt="${game.name}">
    </div>
    <div class="game-card-overlay"></div>
    <div class="game-card-content" style="display: flex; flex-direction: column; height: 100%; justify-content: flex-end;">
      
      <div style="margin-top: auto;">
        <h3 class="game-card-title" style="margin-bottom: 6px;">${game.name}</h3>
        
        ${game.myRating && game.myRating !== 'N/A' && game.myRating !== 'Déjà joué' ? `
          <div class="game-card-my-rating" title="Ma note personnelle" style="margin-bottom: 8px; display: inline-flex;">
            ${generateStarRatingHTML(game.myRating)}
          </div>
        ` : ''}

        <div class="game-card-footer" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span class="game-card-date" style="display: inline-flex; align-items: center; color: var(--accent-blue);">
            ${game.dejaJoue ? `
              <i data-lucide="gamepad-2" style="width: 18px; height: 18px;" title="Déjà joué"></i>
            ` : ''}
          </span>
          <span class="game-card-more">Détails <i data-lucide="arrow-up-right"></i></span>
        </div>
      </div>
    </div>
  `;
  return card;
}

// 8. LAZY LOADING DE HAUTE PERFORMANCE
function initLazyLoading() {
  const images = document.querySelectorAll('.game-card-img');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.onload = () => {
              img.classList.add('loaded');
            };
          }
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '100px 0px', // Charger légèrement avant d'entrer dans l'écran
      threshold: 0.01
    });

    images.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback pour les navigateurs très anciens
    images.forEach(img => {
      img.src = img.getAttribute('data-src');
      img.classList.add('loaded');
    });
  }
}

// 9. FILTRE DE RECHERCHE ET TRI DYNAMIQUE (LOCAL)
function initSearchFilter() {
  const searchInput = document.getElementById('game-search');
  const dropdown = document.getElementById('game-sort-dropdown');
  const dropdownBtn = document.getElementById('sort-dropdown-btn');
  const currentLabel = document.getElementById('sort-current-label');
  const sortHiddenInput = document.getElementById('game-sort-select');
  const items = document.querySelectorAll('#sort-dropdown-menu .dropdown-item');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const value = e.target.value.toLowerCase().trim();
      const cards = document.querySelectorAll('.game-card');

      cards.forEach(card => {
        const title = card.querySelector('.game-card-title').textContent.toLowerCase();
        const genres = card.querySelector('.game-card-genres').textContent.toLowerCase();

        if (title.includes(value) || genres.includes(value)) {
          card.style.display = 'block';
          card.style.animation = 'fadeIn 0.3s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  if (dropdownBtn && dropdown) {
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    items.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = item.dataset.value;
        const text = item.querySelector('span').textContent;

        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        if (currentLabel) currentLabel.textContent = text;
        if (sortHiddenInput) sortHiddenInput.value = value;

        dropdown.classList.remove('open');
        loadGamesGrid();
      });
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('open');
    });
  }
}

// 10. SYSTEME DE FENÊTRES OS INTERACTIF (MODALS)
function initCardClickEvents(gamesList) {
  const cards = document.querySelectorAll('.game-card');

  cards.forEach(card => {
    const slug = card.dataset.slug;
    const gameData = gamesList.find(g => g.slug === slug);

    // Clic normal
    card.addEventListener('click', () => {
      openGameDetailWindow(gameData);
    });

    // Clic sur le bouton de suppression directe de la carte
    const cardDeleteBtn = card.querySelector('.card-delete-btn');
    if (cardDeleteBtn) {
      cardDeleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Évite d'ouvrir la fenêtre de détails
        const confirmed = await showCustomConfirm("Supprimer le jeu", `Voulez-vous vraiment supprimer ${gameData.name} de votre portfolio ?`);
        if (confirmed) {
          // Supprimer le jeu
          delete MY_GAMES[slug];
          saveGamesToLocalStorage();
          
          // Fermer sa fenêtre de détails si elle était ouverte
          if (openWindows.has(slug)) {
            closeWindow(slug);
          }
          
          // Recharger la grille
          loadGamesGrid();
          showToast(`${gameData.name} a été supprimé du portfolio.`, 'success');
        }
      });
    }

    // Support de la touche Entrée pour l'accessibilité
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        openGameDetailWindow(gameData);
      }
    });
  });
}

// Ouvre une fenêtre de détails stylisée OS pour un jeu
function openGameDetailWindow(game) {
  const container = document.getElementById('windows-container');
  if (!container || !game) return;

  const hasRating = game.myRating && game.myRating !== 'N/A' && game.myRating !== 'Déjà joué';
  const ratingDisplay = hasRating ? generateStarRatingHTML(game.myRating) : 'Non noté';
  const statusText = game.dejaJoue ? 'Déjà joué' : 'Non joué';

  let win;
  const isAlreadyOpen = openWindows.has(game.slug);
  if (isAlreadyOpen) {
    win = openWindows.get(game.slug);
    if (win.classList.contains('minimized')) {
      restoreWindow(game.slug);
    } else {
      focusWindow(win);
    }
  } else {
    // Création dynamique de l'élément de la fenêtre
    win = document.createElement('div');
    win.className = 'os-window maximized';
    win.id = `win-${game.slug}`;
    win.dataset.slug = game.slug;

    // Centrer la fenêtre sur l'écran
    const winWidth = 750;
    const winHeight = 500;
    const leftPos = Math.max(10, (window.innerWidth - winWidth) / 2);
    const topPos = Math.max(10, (window.innerHeight - winHeight) / 2);

    win.style.left = `${leftPos}px`;
    win.style.top = `${topPos}px`;
  }

  // HTML interne de la fenêtre
  win.innerHTML = `
    <div class="window-titlebar">
      <div class="window-controls-left">
        <button class="win-btn win-close" title="Fermer" aria-label="Fermer"></button>
      </div>
      <div class="window-title">${game.name}</div>
    </div>
    <div class="window-body">
      <div class="window-sidebar">
        <img src="${game.background_image}" class="window-game-img" alt="${game.name}">
      </div>
      <div class="window-main-content">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap; margin-bottom: 0.5rem;">
          <h2 class="window-game-title" style="margin: 0; font-size: 1.6rem;">${game.name}</h2>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="edit-game-btn" data-slug="${game.slug}" title="Modifier mon avis" style="background: rgba(255, 0, 0, 0.15); border: 1px solid rgba(255, 0, 0, 0.35); color: #ff0000; padding: 6px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: var(--transition-fast);">
              <i data-lucide="edit" style="width: 14px; height: 14px; color: #ff0000; stroke: #ff0000;"></i>
              <span>Modifier</span>
            </button>
            <button class="delete-game-btn" data-slug="${game.slug}" title="Supprimer de mon portfolio" style="background: rgba(255, 0, 0, 0.15); border: 1px solid rgba(255, 0, 0, 0.35); color: #ff0000; padding: 6px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: var(--transition-fast);">
              <i data-lucide="trash-2" style="width: 14px; height: 14px; color: #ff0000; stroke: #ff0000;"></i>
              <span>Supprimer</span>
            </button>
          </div>
        </div>
        
        <!-- Section 1 : Mon expérience -->
        <div class="window-meta-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom: 0.75rem;">
          <div class="window-meta-item">
            <span class="window-meta-label">Statut</span>
            <span class="window-meta-val" style="color: #ffffff; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;">
              <i data-lucide="gamepad-2" style="width: 16px; height: 16px; color: #ff0000; stroke: #ff0000;"></i>
              ${statusText}
            </span>
          </div>
          <div class="window-meta-item">
            <span class="window-meta-label">Note Personnelle</span>
            <span class="window-meta-val" style="color: #ffffff; font-weight: 800; display: inline-flex; align-items: center;">${ratingDisplay}</span>
          </div>
        </div>
        
        ${game.myComment ? `
          <div class="window-opinion-section" style="margin-bottom: 1.25rem; background: rgba(167, 139, 250, 0.03); border-left: 3px solid var(--accent-purple); padding: 8px 12px; border-radius: 4px 12px 12px 4px;">
            <span class="window-meta-label" style="display: block; margin-bottom: 2px; font-size: 0.7rem; color: var(--accent-purple); font-weight: 700; text-transform: uppercase;">Mon Avis</span>
            <p style="font-style: italic; color: var(--text-main); margin: 0; font-size: 0.85rem; line-height: 1.4;">"${game.myComment}"</p>
          </div>
        ` : ''}

        <!-- Section 2 : Détails techniques -->
        <div class="window-meta-grid" style="grid-template-columns: repeat(3, 1fr); background: rgba(255, 255, 255, 0.01); border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 14px; margin-bottom: 1rem;">
          <div class="window-meta-item">
            <span class="window-meta-label">Date de sortie</span>
            <span class="window-meta-val" style="font-size: 0.85rem; font-weight: 600;">${game.released}</span>
          </div>
          <div class="window-meta-item">
            <span class="window-meta-label">Catégorie</span>
            <span class="window-meta-val" style="font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${game.genres}">${game.genres}</span>
          </div>
          <div class="window-meta-item">
            <span class="window-meta-label">Plateformes</span>
            <span class="window-meta-val" style="font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${game.platforms || 'PC, Consoles'}">${game.platforms || 'PC, Consoles'}</span>
          </div>
        </div>

        <h3 class="window-description-heading">Résumé du jeu</h3>
        <p class="window-description">${game.description}</p>
      </div>
    </div>
  `;

  if (!isAlreadyOpen) {
    container.appendChild(win);
    openWindows.set(game.slug, win);

    // Gérer le focus lors du clic n'importe où sur la fenêtre
    win.addEventListener('mousedown', () => {
      focusWindow(win);
    });

    // Ajouter l'icône dans la barre des tâches/dock
    addTaskbarPill(game);
  }

  // Rendre la fenêtre draggable via sa barre de titre
  const titlebar = win.querySelector('.window-titlebar');
  makeDraggable(win, titlebar);

  // Connecter les boutons de contrôle
  win.querySelector('.win-close').addEventListener('click', () => {
    closeWindow(game.slug);
  });
  const maxBtn = win.querySelector('.win-max');
  if (maxBtn) {
    maxBtn.addEventListener('click', () => {
      toggleMaximizeWindow(game.slug);
    });
  }

  // Connecter le bouton Supprimer
  const deleteBtn = win.querySelector('.delete-game-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      const confirmed = await showCustomConfirm("Supprimer le jeu", `Voulez-vous vraiment supprimer ${game.name} de votre portfolio ?`);
      if (confirmed) {
        delete MY_GAMES[game.slug];
        saveGamesToLocalStorage();
        closeWindow(game.slug);
        loadGamesGrid();
        showToast(`${game.name} a été supprimé du portfolio.`, 'success');
      }
    });
  }

  // Connecter le bouton Modifier
  const editBtn = win.querySelector('.edit-game-btn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      openEditGameWindow(game);
    });
  }

  // Focus automatique au lancement
  focusWindow(win);

  // Création des icônes Lucide de la fenêtre
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: {
        class: 'lucide-icon'
      },
      nameAttr: 'data-lucide',
      node: win
    });
  }
}

// Rendre la fenêtre déplaçable (Drag & Drop)
function makeDraggable(win, titlebar) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  titlebar.addEventListener('mousedown', dragMouseDown);

  function dragMouseDown(e) {
    // Annuler si on clique sur un bouton de commande
    if (e.target.closest('.win-btn')) return;
    // Annuler si la fenêtre est maximisée
    if (win.classList.contains('maximized')) return;

    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;

    document.addEventListener('mouseup', closeDragElement);
    document.addEventListener('mousemove', elementDrag);

    focusWindow(win);
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    let newTop = win.offsetTop - pos2;
    let newLeft = win.offsetLeft - pos1;

    // Contraintes pour garder la fenêtre visible à l'écran
    const maxLeft = window.innerWidth - win.offsetWidth;
    const maxTop = window.innerHeight - 58 - 44; // Soustraire hauteur dock + titrebar

    newTop = Math.max(0, Math.min(newTop, maxTop));
    newLeft = Math.max(-win.offsetWidth + 100, Math.min(newLeft, window.innerWidth - 100));

    win.style.top = `${newTop}px`;
    win.style.left = `${newLeft}px`;
  }

  function closeDragElement() {
    document.removeEventListener('mouseup', closeDragElement);
    document.removeEventListener('mousemove', elementDrag);
  }
}

// Focus sur la fenêtre pour la mettre au premier plan
function focusWindow(win) {
  if (activeWindow === win) return;

  // Retirer l'état actif de la fenêtre précédente
  if (activeWindow) {
    activeWindow.classList.remove('active');
  }

  // Appliquer le focus
  activeWindow = win;
  win.classList.add('active');

  // Monter le z-index
  zIndexCounter += 2;
  win.style.zIndex = zIndexCounter;

  // Mettre à jour l'état visuel de la pilule correspondante dans le dock
  const slug = win.dataset.slug;
  const allPills = document.querySelectorAll('.task-pill');
  allPills.forEach(pill => pill.classList.remove('active'));

  const pill = document.getElementById(`pill-${slug}`);
  if (pill) {
    pill.classList.add('active');
    pill.classList.remove('minimized');
  }
}

// Fermeture de la fenêtre
function closeWindow(slug) {
  const win = openWindows.get(slug);
  if (!win) return;

  // Effet de disparition
  win.style.transform = 'scale(0.8) translateY(20px)';
  win.style.opacity = '0';

  setTimeout(() => {
    win.remove();
    openWindows.delete(slug);

    // Retirer la pilule de la barre des tâches
    const pill = document.getElementById(`pill-${slug}`);
    if (pill) pill.remove();

    // Redonner le focus à une autre fenêtre restante
    if (activeWindow === win) {
      activeWindow = null;
      let highestZ = 0;
      let nextFocus = null;

      openWindows.forEach(w => {
        const z = parseInt(w.style.zIndex) || 0;
        if (z > highestZ && !w.classList.contains('minimized')) {
          highestZ = z;
          nextFocus = w;
        }
      });

      if (nextFocus) {
        focusWindow(nextFocus);
      }
    }
  }, 200);
}

// Minimiser la fenêtre (cacher et envoyer vers le dock)
function minimizeWindow(slug) {
  const win = openWindows.get(slug);
  if (!win) return;

  win.classList.add('minimized');
  win.classList.remove('active');

  const pill = document.getElementById(`pill-${slug}`);
  if (pill) {
    pill.classList.remove('active');
    pill.classList.add('minimized');
  }

  // Si on minimise la fenêtre active, focus sur la suivante
  if (activeWindow === win) {
    activeWindow = null;
    let highestZ = 0;
    let nextFocus = null;

    openWindows.forEach(w => {
      const z = parseInt(w.style.zIndex) || 0;
      if (z > highestZ && !w.classList.contains('minimized')) {
        highestZ = z;
        nextFocus = w;
      }
    });

    if (nextFocus) {
      focusWindow(nextFocus);
    }
  }
}

// Restaurer une fenêtre minimisée
function restoreWindow(slug) {
  const win = openWindows.get(slug);
  if (!win) return;

  win.classList.remove('minimized');
  focusWindow(win);
}

// Bascule entre maximisé et position normale
function toggleMaximizeWindow(slug) {
  const win = openWindows.get(slug);
  if (!win) return;

  win.classList.toggle('maximized');
}

// 11. GESTION DU DOCK / BARRE DES TÂCHES
function addTaskbarPill(game) {
  const taskbarItems = document.getElementById('taskbar-items');
  if (!taskbarItems) return;

  const pill = document.createElement('button');
  pill.className = 'task-pill';
  pill.id = `pill-${game.slug}`;
  pill.innerHTML = `
    <img src="${game.background_image}" class="task-pill-img" alt="${game.name}">
    <span class="task-pill-name">${game.name}</span>
  `;

  // Événement clic sur la pilule du dock
  pill.addEventListener('click', () => {
    const win = openWindows.get(game.slug);
    if (!win) return;

    const isMinimized = win.classList.contains('minimized');
    const isActive = win.classList.contains('active');

    if (isMinimized) {
      // 1. Restaurer la fenêtre
      restoreWindow(game.slug);
    } else if (isActive) {
      // 2. Minimiser si c'était déjà actif au premier plan
      minimizeWindow(game.slug);
    } else {
      // 3. Mettre au premier plan si elle était en arrière-plan
      focusWindow(win);
    }
  });

  taskbarItems.appendChild(pill);
}

// Menu Démarrer / Easter Egg
function initStartMenu() {
  const startBtn = document.getElementById('taskbar-start');
  if (!startBtn) return;

  startBtn.addEventListener('click', () => {
    showCustomAlert("🚀 Menu Démarrer", "Ce site est un portfolio vitrine haut de gamme créé à la main avec du HTML5/CSS3 pur (Vanilla) et du JavaScript Vanilla.\n\nGPU de combat : RTX 4070 Super\nStatut : Prêt à coder de superbes interfaces !\n\nInspiré par le concept vintage de mnkway.github.io/xp.");
  });
}

// 12. FENÊTRE DE CONFIGURATION POUR AJOUTER UN JEU DYNAMIQUE
function openAddGameWindow() {
  if (!IS_ADMIN) {
    showToast('Accès refusé. Mode administrateur requis.', 'error');
    return;
  }
  const container = document.getElementById('windows-container');
  if (!container) return;

  // Si déjà ouverte, la focus
  if (openWindows.has('add-game-system')) {
    const existingWin = openWindows.get('add-game-system');
    if (existingWin.classList.contains('minimized')) {
      restoreWindow('add-game-system');
    } else {
      focusWindow(existingWin);
    }
    return;
  }

  const win = document.createElement('div');
  win.className = 'os-window';
  win.id = 'win-add-game-system';
  win.dataset.slug = 'add-game-system';
  
  // Style spécifique de la taille du formulaire
  // Style spécifique de la taille du formulaire (hauteur augmentée pour avis + étoiles)
  win.style.width = '480px';
  win.style.height = '540px';
  win.style.left = `${(window.innerWidth - 480) / 2}px`;
  win.style.top = `${Math.max(50, (window.innerHeight - 540) / 2 - 40)}px`;

  win.innerHTML = `
    <div class="window-titlebar">
      <div class="window-controls-left">
        <button class="win-btn win-close" title="Fermer" aria-label="Fermer"></button>
      </div>
      <div class="window-title">Ajouter un jeu</div>
      <i data-lucide="plus-circle" class="window-info-icon"></i>
    </div>
    <div class="window-body" style="grid-template-columns: 1fr; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; overflow-y: auto;">
      
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">1. Rechercher sur RAWG</label>
        <div style="position: relative;">
          <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--text-dim); pointer-events: none;"></i>
          <input type="text" id="rawg-search-input" placeholder="Taper le titre d'un jeu (ex: Portal, GTA)..." style="width: 100%; padding-left: 2.5rem;">
        </div>
        <div id="search-results-list" class="search-results-list"></div>
      </div>

      <div id="selected-game-preview" style="display: none; display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Jeu sélectionné</label>
        <div class="selected-game-card">
          <img id="selected-game-img" src="" alt="Aperçu">
          <span id="selected-game-title"></span>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">2. Votre note personnelle</label>
        
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer; color: var(--text-main); margin-bottom: 4px;">
          <input type="checkbox" id="deja-joue-checkbox" style="accent-color: var(--accent-purple); width: 16px; height: 16px; margin: 0;">
          <span>Marquer comme "Déjà joué"</span>
        </label>

        <div id="stars-rating-section" style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px; transition: var(--transition-fast);">
          <div class="interactive-stars-container" id="interactive-stars" style="display: flex; gap: 6px;">
            ${[1, 2, 3, 4, 5].map(i => `
              <div class="star-interactive-wrapper" data-index="${i - 1}" style="position: relative; width: 28px; height: 28px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">
                <i data-lucide="star" class="star-interactive-icon star-empty" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; stroke: rgba(255,255,255,0.3); fill: transparent;"></i>
                <i data-lucide="star" class="star-interactive-icon star-full" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; fill: var(--accent-purple); stroke: var(--accent-purple); opacity: 0; transition: var(--transition-fast);"></i>
              </div>
            `).join('')}
          </div>
          <span id="interactive-stars-val" style="font-size: 1.1rem; font-weight: 800; color: var(--accent-purple); min-width: 60px;">--/5</span>
        </div>
        
        <input type="hidden" id="my-game-rating-value" value="">
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">3. Votre avis / Commentaire (Optionnel)</label>
        <textarea id="my-game-comment-input" placeholder="Ce jeu est incroyable... (exprimez votre avis)" style="width: 100%; height: 75px; padding: 0.65rem 1rem; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); outline: none; font-family: var(--font-sans); font-size: 0.85rem; resize: none; transition: var(--transition-fast);"></textarea>
      </div>

      <div style="display: flex; gap: 10px; margin-top: auto; padding-top: 0.5rem;">
        <button id="submit-add-game" class="social-btn" style="flex: 1.2; justify-content: center; background: var(--accent-purple); border-color: var(--accent-purple); color: #fff;" disabled>Ajouter</button>
        <button id="cancel-add-game" class="social-btn" style="flex: 0.8; justify-content: center;">Annuler</button>
      </div>

    </div>
  `;

  container.appendChild(win);
  openWindows.set('add-game-system', win);

  // Rendre draggable
  const titlebar = win.querySelector('.window-titlebar');
  makeDraggable(win, titlebar);

  win.addEventListener('mousedown', () => {
    focusWindow(win);
  });

  win.querySelector('.win-close').addEventListener('click', () => {
    closeWindow('add-game-system');
  });

  win.querySelector('#cancel-add-game').addEventListener('click', () => {
    closeWindow('add-game-system');
  });

  // Charger les icônes
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: { class: 'lucide-icon' },
      nameAttr: 'data-lucide',
      node: win
    });
  }

  // Éléments du formulaire
  const searchInput = win.querySelector('#rawg-search-input');
  const resultsList = win.querySelector('#search-results-list');
  const previewDiv = win.querySelector('#selected-game-preview');
  const previewImg = win.querySelector('#selected-game-img');
  const previewTitle = win.querySelector('#selected-game-title');
  const submitBtn = win.querySelector('#submit-add-game');
  const ratingValueInput = win.querySelector('#my-game-rating-value');
  const dejaJoueCheckbox = win.querySelector('#deja-joue-checkbox');
  const starsRatingSection = win.querySelector('#stars-rating-section');
  const starWrappers = win.querySelectorAll('.star-interactive-wrapper');
  const starsValText = win.querySelector('#interactive-stars-val');
  const commentInput = win.querySelector('#my-game-comment-input');

  let currentSelectedRating = 0;

  // Gérer l'interaction avec les étoiles (survol et clic avec support des demi-étoiles)
  starWrappers.forEach((wrapper, index) => {
    wrapper.addEventListener('mousemove', (e) => {
      const rect = wrapper.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const isHalf = clickX < rect.width / 2;
      const hoverValue = (index + 1) - (isHalf ? 0.5 : 0);
      highlightStars(hoverValue);
    });

    wrapper.addEventListener('mouseleave', () => {
      highlightStars(currentSelectedRating);
    });

    wrapper.addEventListener('click', (e) => {
      const rect = wrapper.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const isHalf = clickX < rect.width / 2;
      currentSelectedRating = (index + 1) - (isHalf ? 0.5 : 0);
      highlightStars(currentSelectedRating);
      ratingValueInput.value = currentSelectedRating;
    });
  });

  function highlightStars(val) {
    if (val === 0) {
      starsValText.textContent = "--/5";
    } else {
      starsValText.textContent = `${val.toFixed(1)}/5`;
    }

    starWrappers.forEach((wrapper, idx) => {
      const starNum = idx + 1;
      const starFull = wrapper.querySelector('.star-full');
      wrapper.classList.remove('half');
      starFull.style.opacity = '0';

      if (starNum <= val) {
        starFull.style.opacity = '1';
        wrapper.classList.remove('half');
      } else if (starNum - 0.5 === val) {
        starFull.style.opacity = '1';
        wrapper.classList.add('half');
      }
    });
  }

  let selectedSlug = null;
  let selectedTitle = '';
  let selectedImg = '';

  let searchTimeout = null;
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);

    if (query.length < 2) {
      resultsList.innerHTML = '';
      return;
    }

    resultsList.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--text-dim); font-size: 0.85rem;"><span class="spinner" style="width: 14px; height: 14px; border-width: 2px; display: inline-block; margin-right: 8px; vertical-align: middle;"></span>Recherche...</div>';

    searchTimeout = setTimeout(async () => {
      try {
        let results = [];
        let searchQuery = query;
        const qLow = query.toLowerCase().trim();
        if (qLow === 'gta') searchQuery = 'grand theft auto';
        else if (qLow === 'gta v' || qLow === 'gtav' || qLow === 'gta 5' || qLow === 'gta5') searchQuery = 'grand theft auto v';
        else if (qLow === 'csgo' || qLow === 'cs' || qLow === 'cs2') searchQuery = 'counter strike';
        else if (qLow === 'cod') searchQuery = 'call of duty';
        else if (qLow === 'mc') searchQuery = 'minecraft';

        try {
          const res = await fetch(`https://api.rawg.io/api/games?key=322fb41e740644ecb0e5198b589351b6&search=${encodeURIComponent(searchQuery)}&page_size=5`);
          if (res && res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              results = data.results;
            }
          }
        } catch(e) {}

        if (!results || results.length === 0) {
          const popularMock = [
            { slug: 'grand-theft-auto-v', name: 'Grand Theft Auto V', background_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80' },
            { slug: 'cyberpunk-2077', name: 'Cyberpunk 2077', background_image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=300&q=80' },
            { slug: 'call-of-duty-warzone', name: 'Call of Duty: Warzone', background_image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=300&q=80' },
            { slug: 'minecraft', name: 'Minecraft', background_image: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=300&q=80' },
            { slug: 'elden-ring', name: 'Elden Ring', background_image: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&w=300&q=80' }
          ];
          results = popularMock.filter(g => g.name.toLowerCase().includes(qLow) || g.slug.includes(qLow));
          if (results.length === 0) {
            results.push({
              slug: query.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              name: query,
              background_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80'
            });
          }
        }

        renderSearchResults(results);
      } catch (err) {
        console.error(err);
      }
    }, 400);
  });

  function renderSearchResults(results) {
    if (!results || results.length === 0) {
      resultsList.innerHTML = '<div style="padding: 12px; color: var(--text-dim); font-size: 0.85rem; text-align: center;">Aucun jeu trouvé.</div>';
      return;
    }
    
    resultsList.innerHTML = '';
    results.forEach(game => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '10px';
      item.style.padding = '8px 12px';
      item.style.cursor = 'pointer';
      item.style.borderBottom = '1px solid rgba(255, 255, 255, 0.03)';
      
      const imgUrl = game.background_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=80&q=80';
      
      item.innerHTML = `
        <img src="${imgUrl}" style="width: 48px; height: 32px; object-fit: cover; border-radius: 4px; flex-shrink: 0;">
        <span style="font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${game.name}</span>
      `;

      item.addEventListener('click', () => {
        selectedSlug = game.slug;
        selectedTitle = game.name;
        selectedImg = imgUrl;

        previewImg.src = selectedImg;
        previewTitle.textContent = selectedTitle;
        previewDiv.style.display = 'flex';
        resultsList.innerHTML = '';
        searchInput.value = '';
        submitBtn.removeAttribute('disabled');
      });

      resultsList.appendChild(item);
    });
  }

  // Enregistrement final
  submitBtn.addEventListener('click', () => {
    if (!selectedSlug) return;
    
    const rating = ratingValueInput.value || 'N/A';
    const comment = commentInput.value.trim();
    const dejaJoue = dejaJoueCheckbox.checked;

    // Enregistrer dans l'objet global
    MY_GAMES[selectedSlug] = { 
      myRating: rating,
      myComment: comment,
      dejaJoue: dejaJoue,
      addedAt: Date.now()
    };
    saveGamesToLocalStorage();

    // Recharger la grille principale de jeux immédiatement
    loadGamesGrid();

    // Fermer le formulaire
    closeWindow('add-game-system');

    // Notification de succès
    showToast(`${selectedTitle} a été ajouté au portfolio !`, 'success');
  });

  // Ajouter au dock de la barre des tâches
  addTaskbarPill({
    slug: 'add-game-system',
    name: 'Ajouter un jeu',
    background_image: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=100&h=100&q=80'
  });

  // Activer le focus sur cette fenêtre
  focusWindow(win);
}

// Ouvre une fenêtre de modification pour un jeu (Déjà joué, note, avis)
function openEditGameWindow(game) {
  const container = document.getElementById('windows-container');
  if (!container || !game) return;

  const editSlug = `edit-${game.slug}`;

  // Si déjà ouverte, la focus
  if (openWindows.has(editSlug)) {
    const existingWin = openWindows.get(editSlug);
    if (existingWin.classList.contains('minimized')) {
      restoreWindow(editSlug);
    } else {
      focusWindow(existingWin);
    }
    return;
  }

  const win = document.createElement('div');
  win.className = 'os-window';
  win.id = `win-${editSlug}`;
  win.dataset.slug = editSlug;
  
  // Style de la taille du formulaire de modification
  win.style.width = '640px';
  win.style.height = '700px';
  win.style.left = `${(window.innerWidth - 640) / 2}px`;
  win.style.top = `${Math.max(10, (window.innerHeight - 700) / 2 - 20)}px`;

  // Parser la note actuelle
  const normalizedRatingStr = game.myRating ? game.myRating.replace(',', '.') : '';
  let initialRating = parseFloat(normalizedRatingStr);
  if (isNaN(initialRating)) {
    initialRating = 0;
  } else {
    if (normalizedRatingStr.includes('/10') || (initialRating > 5 && initialRating <= 10)) {
      initialRating = initialRating / 2;
    }
    initialRating = Math.max(0, Math.min(5, initialRating));
  }

  win.innerHTML = `
    <div class="window-titlebar">
      <div class="window-controls-left">
        <button class="win-btn win-close" title="Fermer" aria-label="Fermer"></button>
      </div>
      <div class="window-title">Modifier</div>
      <i data-lucide="edit" class="window-info-icon"></i>
    </div>
    <div class="window-body" style="grid-template-columns: 1fr; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; overflow-y: auto;">
      
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Votre note personnelle</label>
        
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer; color: var(--text-main); margin-bottom: 4px;">
          <input type="checkbox" id="edit-deja-joue-checkbox" style="accent-color: var(--accent-purple); width: 16px; height: 16px; margin: 0;" ${game.dejaJoue ? 'checked' : ''}>
          <span>Marquer comme "Déjà joué"</span>
        </label>

        <div id="edit-stars-rating-section" style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px; transition: var(--transition-fast);">
          <div class="interactive-stars-container" id="edit-interactive-stars" style="display: flex; gap: 6px;">
            ${[1, 2, 3, 4, 5].map(i => `
              <div class="star-interactive-wrapper edit-star-wrapper" data-index="${i - 1}" style="position: relative; width: 28px; height: 28px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">
                <i data-lucide="star" class="star-interactive-icon star-empty" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; stroke: rgba(255,255,255,0.3); fill: transparent;"></i>
                <i data-lucide="star" class="star-interactive-icon star-full" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; fill: var(--accent-purple); stroke: var(--accent-purple); opacity: 0; transition: var(--transition-fast);"></i>
              </div>
            `).join('')}
          </div>
          <span id="edit-interactive-stars-val" style="font-size: 1.1rem; font-weight: 800; color: var(--accent-purple); min-width: 60px;">--/5</span>
        </div>
        
        <input type="hidden" id="edit-my-game-rating-value" value="${initialRating > 0 ? initialRating : ''}">
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Image d'illustration / Couverture (URL optionnelle)</label>
        <input type="text" id="edit-my-game-img-input" value="${game.customImage || (MY_GAMES[game.slug] ? MY_GAMES[game.slug].customImage || '' : '')}" placeholder="https://... (collez le lien d'une image si celle par défaut ne vous plaît pas)" style="width: 100%; padding: 0.65rem 1rem; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); outline: none; font-family: var(--font-sans); font-size: 0.85rem; transition: var(--transition-fast);">
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Votre avis / Commentaire (Optionnel)</label>
        <textarea id="edit-my-game-comment-input" placeholder="Ce jeu est incroyable... (exprimez votre avis)" style="width: 100%; height: 75px; padding: 0.65rem 1rem; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); outline: none; font-family: var(--font-sans); font-size: 0.85rem; resize: none; transition: var(--transition-fast);">${game.myComment || ''}</textarea>
      </div>

      <!-- Section Détails Techniques -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <label style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Date de sortie</label>
          <input type="text" id="edit-my-game-released-input" value="${game.released || ''}" placeholder="ex: 2024" style="padding: 0.55rem 0.8rem; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.8rem;">
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <label style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Catégorie</label>
          <input type="text" id="edit-my-game-genres-input" value="${game.genres || ''}" placeholder="ex: Action, FPS" style="padding: 0.55rem 0.8rem; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.8rem;">
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <label style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Plateformes</label>
          <input type="text" id="edit-my-game-platforms-input" value="${game.platforms || ''}" placeholder="ex: PC, PS5" style="padding: 0.55rem 0.8rem; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.8rem;">
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Résumé / Description du jeu (Personnalisé, ex: copier/coller Steam)</label>
        <textarea id="edit-my-game-desc-input" placeholder="Collez ici le résumé ou la description de votre jeu..." style="width: 100%; height: 85px; padding: 0.65rem 1rem; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); outline: none; font-family: var(--font-sans); font-size: 0.85rem; resize: none; transition: var(--transition-fast);">${game.description || ''}</textarea>
      </div>

      <div style="display: flex; gap: 10px; margin-top: auto; padding-top: 0.5rem;">
        <button id="submit-edit-game" class="social-btn" style="flex: 1.2; justify-content: center; background: var(--accent-purple); border-color: var(--accent-purple); color: #fff;">Enregistrer</button>
        <button id="cancel-edit-game" class="social-btn" style="flex: 0.8; justify-content: center;">Annuler</button>
      </div>

    </div>
  `;

  container.appendChild(win);
  openWindows.set(editSlug, win);

  // Rendre draggable
  const titlebar = win.querySelector('.window-titlebar');
  makeDraggable(win, titlebar);

  win.addEventListener('mousedown', () => {
    focusWindow(win);
  });

  win.querySelector('.win-close').addEventListener('click', () => {
    closeWindow(editSlug);
  });

  win.querySelector('#cancel-edit-game').addEventListener('click', () => {
    closeWindow(editSlug);
  });

  // Charger les icônes
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: { class: 'lucide-icon' },
      nameAttr: 'data-lucide',
      node: win
    });
  }

  // Éléments du formulaire
  const submitBtn = win.querySelector('#submit-edit-game');
  const ratingValueInput = win.querySelector('#edit-my-game-rating-value');
  const dejaJoueCheckbox = win.querySelector('#edit-deja-joue-checkbox');
  const starWrappers = win.querySelectorAll('.edit-star-wrapper');
  const starsValText = win.querySelector('#edit-interactive-stars-val');
  const commentInput = win.querySelector('#edit-my-game-comment-input');

  let currentSelectedRating = initialRating;

  // Initialiser les étoiles
  highlightStars(currentSelectedRating);

  // Gérer l'interaction avec les étoiles (survol et clic avec support des demi-étoiles)
  starWrappers.forEach((wrapper, index) => {
    wrapper.addEventListener('mousemove', (e) => {
      const rect = wrapper.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const isHalf = clickX < rect.width / 2;
      const hoverValue = (index + 1) - (isHalf ? 0.5 : 0);
      highlightStars(hoverValue);
    });

    wrapper.addEventListener('mouseleave', () => {
      highlightStars(currentSelectedRating);
    });

    wrapper.addEventListener('click', (e) => {
      const rect = wrapper.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const isHalf = clickX < rect.width / 2;
      currentSelectedRating = (index + 1) - (isHalf ? 0.5 : 0);
      highlightStars(currentSelectedRating);
      ratingValueInput.value = currentSelectedRating;
    });
  });

  function highlightStars(val) {
    if (val === 0) {
      starsValText.textContent = "--/5";
    } else {
      starsValText.textContent = `${val.toFixed(1)}/5`;
    }

    starWrappers.forEach((wrapper, idx) => {
      const starNum = idx + 1;
      const starFull = wrapper.querySelector('.star-full');
      wrapper.classList.remove('half');
      starFull.style.opacity = '0';

      if (starNum <= val) {
        starFull.style.opacity = '1';
        wrapper.classList.remove('half');
      } else if (starNum - 0.5 === val) {
        starFull.style.opacity = '1';
        wrapper.classList.add('half');
      }
    });
  }

  // Enregistrement final
  submitBtn.addEventListener('click', () => {
    const rating = ratingValueInput.value ? `${parseFloat(ratingValueInput.value).toFixed(1)}/5` : 'N/A';
    const comment = commentInput.value.trim();
    const dejaJoue = dejaJoueCheckbox.checked;
    const customDesc = win.querySelector('#edit-my-game-desc-input').value.trim();
    const customImg = win.querySelector('#edit-my-game-img-input').value.trim();
    const customReleased = win.querySelector('#edit-my-game-released-input').value.trim();
    const customGenres = win.querySelector('#edit-my-game-genres-input').value.trim();
    const customPlatforms = win.querySelector('#edit-my-game-platforms-input').value.trim();

    // Mettre à jour l'objet local du jeu passé en référence
    game.myRating = rating;
    game.myComment = comment;
    game.dejaJoue = dejaJoue;
    if (customDesc) game.description = customDesc;
    if (customImg) {
      game.customImage = customImg;
      game.background_image = customImg;
    }
    if (customReleased) game.released = customReleased;
    if (customGenres) game.genres = customGenres;
    if (customPlatforms) game.platforms = customPlatforms;

    // Enregistrer dans l'objet global MY_GAMES
    MY_GAMES[game.slug] = Object.assign({}, MY_GAMES[game.slug] || {}, { 
      myRating: rating,
      myComment: comment,
      dejaJoue: dejaJoue,
      customImage: customImg || (MY_GAMES[game.slug] ? MY_GAMES[game.slug].customImage : ''),
      description: customDesc || (MY_GAMES[game.slug] ? MY_GAMES[game.slug].description : ''),
      released: customReleased || (MY_GAMES[game.slug] ? MY_GAMES[game.slug].released : ''),
      genres: customGenres || (MY_GAMES[game.slug] ? MY_GAMES[game.slug].genres : ''),
      platforms: customPlatforms || (MY_GAMES[game.slug] ? MY_GAMES[game.slug].platforms : ''),
      addedAt: Date.now()
    });
    saveGamesToLocalStorage();

    // Recharger la grille principale de jeux immédiatement
    loadGamesGrid();

    // Mettre à jour la fenêtre de détails en arrière-plan
    openGameDetailWindow(game);

    // Fermer le formulaire
    closeWindow(editSlug);

    // Notification de succès
    showToast(`${game.name} a été modifié !`, 'success');
  });

  // Ajouter au dock de la barre des tâches
  addTaskbarPill({
    slug: editSlug,
    name: 'Modifier',
    background_image: game.background_image
  });

  // Activer le focus sur cette fenêtre
  focusWindow(win);
}

// ============================================================================
// 13. SYSTEME DE NOTIFICATIONS & DIALOGUES PERSONNALISES (TOASTS & MODALS)
// ============================================================================

// Notification Toast volante
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'x-circle';

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Initialiser les icônes sur le toast
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: { class: 'lucide-icon' },
      nameAttr: 'data-lucide',
      node: toast
    });
  }

  // Disparition automatique après 3.5s
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Boîte de dialogue de confirmation personnalisée (Promise)
function showCustomConfirm(title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    
    overlay.innerHTML = `
      <div class="confirm-box">
        <div class="confirm-header">
          <i data-lucide="alert-triangle" class="confirm-icon danger"></i>
          <h3>${title}</h3>
        </div>
        <div class="confirm-body">${message}</div>
        <div class="confirm-footer">
          <button class="confirm-btn confirm-yes">Oui, supprimer</button>
          <button class="confirm-btn confirm-no">Annuler</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Initialiser les icônes
    if (window.lucide) {
      window.lucide.createIcons({
        attrs: { class: 'lucide-icon' },
        nameAttr: 'data-lucide',
        node: overlay
      });
    }

    // Gestionnaires d'événements
    overlay.querySelector('.confirm-yes').addEventListener('click', () => {
      closeConfirm();
      resolve(true);
    });

    overlay.querySelector('.confirm-no').addEventListener('click', () => {
      closeConfirm();
      resolve(false);
    });

    function closeConfirm() {
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 250);
    }
  });
}

// Boîte de dialogue d'alerte/information personnalisée (Promise)
function showCustomAlert(title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    
    overlay.innerHTML = `
      <div class="confirm-box" style="box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(167, 139, 250, 0.15);">
        <div class="confirm-header">
          <i data-lucide="info" class="confirm-icon info"></i>
          <h3>${title}</h3>
        </div>
        <div class="confirm-body" style="white-space: pre-line; text-align: left; font-size: 0.85rem;">${message}</div>
        <div class="confirm-footer">
          <button class="confirm-btn confirm-ok">D'accord</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Initialiser les icônes
    if (window.lucide) {
      window.lucide.createIcons({
        attrs: { class: 'lucide-icon' },
        nameAttr: 'data-lucide',
        node: overlay
      });
    }

    // Gestionnaires d'événements
    overlay.querySelector('.confirm-ok').addEventListener('click', () => {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 250);
    });
  });
}

// 14. GENERATEUR VISUEL D'ETOILES POUR LA NOTE PERSONNELLE (SUR 5, AVEC DEMI-ETOILES)
function generateStarRatingHTML(ratingStr) {
  if (!ratingStr) return `<span class="rating-text-raw">N/A</span>`;

  const normalizedStr = ratingStr.replace(',', '.');
  let rating = parseFloat(normalizedStr);
  if (isNaN(rating)) {
    return `<span class="rating-text-raw">${ratingStr}</span>`;
  }
  
  if (normalizedStr.includes('/10')) {
    rating = rating / 2;
  } else if (rating > 5 && rating <= 10) {
    rating = rating / 2;
  }
  
  rating = Math.max(0, Math.min(5, rating));
  const roundedRating = Math.round(rating * 2) / 2;
  
  const starFullSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="star-svg star-full-svg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
  const starEmptySVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="star-svg star-empty-svg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

  let starsHTML = '<div class="star-rating-container">';
  for (let i = 1; i <= 5; i++) {
    if (i <= roundedRating) {
      starsHTML += `
        <span class="star-wrapper star-full-type">
          ${starFullSVG}
        </span>`;
    } else if (i - 0.5 === roundedRating) {
      starsHTML += `
        <span class="star-wrapper half star-half-type">
          <span class="star-half-layer empty-layer">${starEmptySVG}</span>
          <span class="star-half-layer full-layer">${starFullSVG}</span>
        </span>`;
    } else {
      starsHTML += `
        <span class="star-wrapper star-empty-type">
          ${starEmptySVG}
        </span>`;
    }
  }
  
  const displayRatingStr = (rating % 1 === 0) ? rating.toFixed(0) : rating.toFixed(1);
  starsHTML += ` <span class="star-rating-val">${displayRatingStr}/5</span>`;
  starsHTML += `</div>`;
  return starsHTML;
}

// 15. FENETRE OS D'EDITION DU PROFIL, DES LIENS ET DU SETUP PC
function openEditProfileWindow() {
  if (!IS_ADMIN) {
    showToast('Accès refusé. Mode administrateur requis.', 'error');
    return;
  }
  const container = document.getElementById('windows-container');
  if (!container) return;

  const slug = 'edit-profile-system';

  if (openWindows.has(slug)) {
    const existingWin = openWindows.get(slug);
    if (existingWin.classList.contains('minimized')) {
      restoreWindow(slug);
    } else {
      focusWindow(existingWin);
    }
    return;
  }

  const win = document.createElement('div');
  win.className = 'os-window';
  win.id = `win-${slug}`;
  win.dataset.slug = slug;

  win.style.width = '620px';
  win.style.height = '680px';
  win.style.left = `${(window.innerWidth - 620) / 2}px`;
  win.style.top = `${Math.max(20, (window.innerHeight - 680) / 2 - 20)}px`;

  // Copie locale des réseaux pour modifications dynamiques
  let currentSocials = JSON.parse(JSON.stringify(PROFILE_DATA.socials || []));

  win.innerHTML = `
    <div class="window-titlebar">
      <div class="window-controls-left">
        <button class="win-btn win-close" title="Fermer" aria-label="Fermer"></button>
      </div>
      <div class="window-title">Modifier le Profil & Configuration</div>
      <i data-lucide="user-cog" class="window-info-icon"></i>
    </div>
    <div class="window-body" style="grid-template-columns: 1fr; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; overflow-y: auto;">
      
      <!-- Section 1: Profil & Identité -->
      <div style="display: flex; flex-direction: column; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
        <h3 style="font-size: 1rem; font-weight: 700; color: var(--accent-purple); display: flex; align-items: center; gap: 8px;">
          <i data-lucide="user" style="width: 18px; height: 18px;"></i> Informations Personnelles
        </h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Pseudo / Nom</label>
            <input type="text" id="edit-prof-name" value="${PROFILE_DATA.name || ''}" style="width: 100%; padding: 0.6rem 0.8rem; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.9rem;">
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Statut</label>
            <input type="text" id="edit-prof-status" value="${PROFILE_DATA.status || ''}" placeholder="ex: En Ligne, Occupé" style="width: 100%; padding: 0.6rem 0.8rem; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.9rem;">
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 4px;">
          <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Titre / Rôle</label>
          <input type="text" id="edit-prof-title" value="${PROFILE_DATA.title || ''}" style="width: 100%; padding: 0.6rem 0.8rem; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.9rem;">
        </div>

        <div style="display: flex; flex-direction: column; gap: 4px;">
          <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">URL Photo de Profil (PP)</label>
          <input type="text" id="edit-prof-avatar" value="${PROFILE_DATA.avatar || ''}" placeholder="https://..." style="width: 100%; padding: 0.6rem 0.8rem; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.9rem;">
        </div>

        <div style="display: flex; flex-direction: column; gap: 4px;">
          <label style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Bio / Description</label>
          <textarea id="edit-prof-bio" style="width: 100%; height: 80px; padding: 0.6rem 0.8rem; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.85rem; resize: none;">${PROFILE_DATA.bio || ''}</textarea>
        </div>
      </div>

      <!-- Section Twitch Sync -->
      <div style="display: flex; flex-direction: column; gap: 1rem; padding: 12px; border-radius: 14px; background: rgba(145, 70, 255, 0.08); border: 1.5px solid rgba(145, 70, 255, 0.3);">
        <h3 style="font-size: 1rem; font-weight: 700; color: #9146ff; display: flex; align-items: center; gap: 8px;">
          <i data-lucide="tv" style="width: 18px; height: 18px;"></i> Synchro Twitch (PP & Live)
        </h3>

        <div style="display: flex; flex-direction: column; gap: 6px;">
          <label style="display: flex; align-items: center; gap: 10px; font-size: 0.85rem; cursor: pointer; color: var(--text-main);">
            <input type="checkbox" id="edit-sync-twitch" ${PROFILE_DATA.syncTwitch ? 'checked' : ''} style="accent-color: #9146ff; width: 18px; height: 18px; margin: 0;">
            <span style="font-weight: 700;">Activer la synchronisation Twitch en direct</span>
          </label>
          <span style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">Met à jour votre statut (🔴 EN LIVE / Hors Ligne) et récupère la photo de profil réelle de votre chaîne Twitch automatiquement.</span>
        </div>

        <div style="display: flex; gap: 10px; align-items: center;">
          <input type="text" id="edit-twitch-user" value="${PROFILE_DATA.twitchUsername || ''}" placeholder="Nom de votre chaîne Twitch (ex: gotaga)" style="flex: 1; padding: 0.6rem 0.8rem; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.9rem;">
          <button id="btn-test-twitch" type="button" class="social-btn" style="background: rgba(145, 70, 255, 0.2); border-color: #9146ff; color: #fff; font-size: 0.8rem; white-space: nowrap;">
            Tester Twitch
          </button>
        </div>
      </div>

      <!-- Section Importation Steam -->
      <div style="display: flex; flex-direction: column; gap: 1rem; padding: 12px; border-radius: 14px; background: rgba(16, 185, 129, 0.08); border: 1.5px solid rgba(16, 185, 129, 0.3);">
        <h3 style="font-size: 1rem; font-weight: 700; color: #10b981; display: flex; align-items: center; gap: 8px;">
          <i data-lucide="gamepad-2" style="width: 18px; height: 18px;"></i> Importation Jeux Steam (API)
        </h3>
        <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; margin: 0;">
          Récupérez automatiquement vos jeux possédés et vos temps de jeu depuis Steam grâce à votre clé d'API Steam configurée.
        </p>
        <div style="display: flex; gap: 10px; align-items: center;">
          <input type="text" id="edit-steam-id" value="${PROFILE_DATA.steamId || ''}" placeholder="Votre SteamID64 ou Pseudo (ex: 76561198...)" style="flex: 1; padding: 0.6rem 0.8rem; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.9rem;">
          <button id="btn-import-steam" type="button" class="social-btn" style="background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #fff; font-size: 0.8rem; white-space: nowrap;">
            Importer Steam
          </button>
        </div>
      </div>



      <!-- Section 2: Liens Sociaux -->
      <div style="display: flex; flex-direction: column; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
        <h3 style="font-size: 1rem; font-weight: 700; color: var(--accent-purple); display: flex; align-items: center; gap: 8px;">
          <i data-lucide="link" style="width: 18px; height: 18px;"></i> Liens Sociaux & Contact
        </h3>

        <div id="edit-socials-list-container" style="display: flex; flex-direction: column; gap: 8px; max-height: 160px; overflow-y: auto; padding-right: 4px;">
          <!-- Liens dynamiques générés ici -->
        </div>

        <!-- Formulaire d'ajout de lien -->
        <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 12px; border: 1px dashed var(--border-color); display: flex; flex-direction: column; gap: 8px;">
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Ajouter un réseau / lien</span>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
            <input type="text" id="new-social-name" placeholder="Nom (ex: Discord)" style="padding: 0.5rem; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.8rem;">
            <input type="text" id="new-social-url" placeholder="URL (https://...)" style="padding: 0.5rem; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.8rem;">
            <select id="new-social-icon" style="padding: 0.5rem; border-radius: 8px; background: rgba(255,255,255,0.08); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.8rem;">
              <option value="link" style="background-color: #121826; color: #ffffff;">Icône: Lien (Par défaut)</option>
              <option value="steam-img" style="background-color: #121826; color: #ffffff;">Steam (Logo officiel)</option>
              <option value="instant-gaming" style="background-color: #121826; color: #ffffff;">Instant Gaming (Logo officiel)</option>
              <option value="gamepad-2" style="background-color: #121826; color: #ffffff;">Gaming / Manette</option>
              <option value="github" style="background-color: #121826; color: #ffffff;">GitHub</option>
              <option value="linkedin" style="background-color: #121826; color: #ffffff;">LinkedIn</option>
              <option value="twitch" style="background-color: #121826; color: #ffffff;">Twitch</option>
              <option value="twitter" style="background-color: #121826; color: #ffffff;">Twitter / X</option>
              <option value="youtube" style="background-color: #121826; color: #ffffff;">YouTube</option>
              <option value="mail" style="background-color: #121826; color: #ffffff;">Mail / Contact</option>
              <option value="globe" style="background-color: #121826; color: #ffffff;">Site Web</option>
              <option value="music" style="background-color: #121826; color: #ffffff;">Spotify / Musique</option>
              <option value="message-square" style="background-color: #121826; color: #ffffff;">Discord / Chat</option>
            </select>
          </div>
          <button id="btn-add-social-item" type="button" class="social-btn" style="align-self: flex-end; padding: 6px 14px; font-size: 0.8rem; background: var(--accent-purple); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
            + Ajouter ce lien
          </button>
        </div>
      </div>

      <!-- Section 3: Config PC -->
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <h3 style="font-size: 1rem; font-weight: 700; color: var(--accent-purple); display: flex; align-items: center; gap: 8px;">
          <i data-lucide="cpu" style="width: 18px; height: 18px;"></i> Configuration PC Setup
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">GPU</label>
            <input type="text" id="edit-pc-gpu" value="${PROFILE_DATA.pcSetup ? PROFILE_DATA.pcSetup.gpu || '' : ''}" style="padding: 0.5rem; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.8rem;">
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">CPU</label>
            <input type="text" id="edit-pc-cpu" value="${PROFILE_DATA.pcSetup ? PROFILE_DATA.pcSetup.cpu || '' : ''}" style="padding: 0.5rem; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.8rem;">
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">RAM / SSD</label>
            <input type="text" id="edit-pc-ram" value="${PROFILE_DATA.pcSetup ? PROFILE_DATA.pcSetup.ramSsd || '' : ''}" style="padding: 0.5rem; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.8rem;">
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Carte Mère</label>
            <input type="text" id="edit-pc-mobo" value="${PROFILE_DATA.pcSetup ? PROFILE_DATA.pcSetup.mobo || '' : ''}" style="padding: 0.5rem; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.8rem;">
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Refroidissement</label>
            <input type="text" id="edit-pc-cooler" value="${PROFILE_DATA.pcSetup ? PROFILE_DATA.pcSetup.cooler || '' : ''}" style="padding: 0.5rem; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.8rem;">
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim);">Boîtier / Alim</label>
            <input type="text" id="edit-pc-case" value="${PROFILE_DATA.pcSetup ? PROFILE_DATA.pcSetup.casePsu || '' : ''}" style="padding: 0.5rem; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.8rem;">
          </div>
        </div>
      </div>

      <!-- Boutons d'action -->
      <div style="display: flex; gap: 10px; margin-top: auto; padding-top: 1rem;">
        <button id="submit-save-profile" class="social-btn" style="flex: 1.2; justify-content: center; background: var(--accent-purple); border-color: var(--accent-purple); color: #fff; font-weight: 700;">Enregistrer les modifications</button>
        <button id="cancel-edit-profile" class="social-btn" style="flex: 0.8; justify-content: center;">Annuler</button>
      </div>

    </div>
  `;

  container.appendChild(win);
  openWindows.set(slug, win);

  // Rend la fenêtre draggable
  const titlebar = win.querySelector('.window-titlebar');
  makeDraggable(win, titlebar);

  win.addEventListener('mousedown', () => {
    focusWindow(win);
  });

  win.querySelector('.win-close').addEventListener('click', () => {
    closeWindow(slug);
  });

  win.querySelector('#cancel-edit-profile').addEventListener('click', () => {
    closeWindow(slug);
  });

  // Rendu de la liste des liens sociaux avec support d'édition en ligne
  let editingSocialIndex = null;

  function renderEditSocialsList() {
    const listContainer = win.querySelector('#edit-socials-list-container');
    if (!listContainer) return;
    if (currentSocials.length === 0) {
      listContainer.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-dim); text-align: center; padding: 8px;">Aucun lien social.</div>';
      return;
    }

    listContainer.innerHTML = currentSocials.map((link, idx) => {
      if (editingSocialIndex === idx) {
        return `
          <div style="display: flex; flex-direction: column; gap: 8px; padding: 10px; background: rgba(59, 130, 246, 0.08); border: 1px solid var(--accent-purple); border-radius: 8px;">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--accent-purple);">Modification du lien</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
              <input type="text" id="inline-edit-name-${idx}" value="${link.name}" placeholder="Nom" style="padding: 0.4rem; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.8rem;">
              <input type="text" id="inline-edit-url-${idx}" value="${link.url}" placeholder="URL" style="padding: 0.4rem; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.8rem;">
              <input type="text" id="inline-edit-icon-${idx}" value="${link.icon || ''}" placeholder="Icône" style="padding: 0.4rem; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-main); font-size: 0.8rem;">
            </div>
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
              <button class="btn-save-inline-social" data-index="${idx}" style="background: var(--accent-purple); color: #fff; border: none; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: 600;">Valider</button>
              <button class="btn-cancel-inline-social" style="background: rgba(255,255,255,0.08); color: var(--text-main); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">Annuler</button>
            </div>
          </div>
        `;
      }

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
            <i data-lucide="${link.icon || 'link'}" style="width: 16px; height: 16px; color: var(--accent-purple); flex-shrink: 0;"></i>
            <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">${link.name}</span>
            <span style="font-size: 0.75rem; color: var(--text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">(${link.url})</span>
          </div>
          <div style="display: flex; gap: 6px; flex-shrink: 0;">
            <button class="btn-edit-social" data-index="${idx}" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">
              Modifier
            </button>
            <button class="btn-delete-social" data-index="${idx}" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">
              Supprimer
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) {
      window.lucide.createIcons({ node: listContainer });
    }

    listContainer.querySelectorAll('.btn-edit-social').forEach(btn => {
      btn.addEventListener('click', (e) => {
        editingSocialIndex = parseInt(e.currentTarget.dataset.index, 10);
        renderEditSocialsList();
      });
    });

    listContainer.querySelectorAll('.btn-delete-social').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index, 10);
        currentSocials.splice(index, 1);
        if (editingSocialIndex === index) editingSocialIndex = null;
        renderEditSocialsList();
      });
    });

    listContainer.querySelectorAll('.btn-save-inline-social').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        const nameVal = win.querySelector(`#inline-edit-name-${idx}`).value.trim();
        const urlVal = win.querySelector(`#inline-edit-url-${idx}`).value.trim();
        const iconVal = win.querySelector(`#inline-edit-icon-${idx}`).value.trim().toLowerCase();

        if (!nameVal || !urlVal) {
          showToast('Le nom et l\'URL ne peuvent pas être vides', 'error');
          return;
        }

        currentSocials[idx].name = nameVal;
        currentSocials[idx].url = urlVal;
        currentSocials[idx].icon = iconVal || currentSocials[idx].icon || 'link';

        editingSocialIndex = null;
        renderEditSocialsList();
      });
    });

    listContainer.querySelectorAll('.btn-cancel-inline-social').forEach(btn => {
      btn.addEventListener('click', () => {
        editingSocialIndex = null;
        renderEditSocialsList();
      });
    });
  }

  renderEditSocialsList();

  // Écouteur pour ajouter un lien social
  win.querySelector('#btn-add-social-item').addEventListener('click', () => {
    const nameInput = win.querySelector('#new-social-name');
    const urlInput = win.querySelector('#new-social-url');
    const iconInput = win.querySelector('#new-social-icon');

    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    let icon = iconInput.value.trim().toLowerCase();

    if (!name || !url) {
      showToast('Veuillez entrer au moins un nom et une URL pour le lien', 'error');
      return;
    }

    if (!icon || icon === 'link') {
      if (name.toLowerCase().includes('instant') || name.toLowerCase().includes('gaming')) icon = 'instant-gaming';
      else if (name.toLowerCase().includes('steam')) icon = 'steam-img';
      else if (name.toLowerCase().includes('github')) icon = 'github';
      else if (name.toLowerCase().includes('linkedin')) icon = 'linkedin';
      else if (name.toLowerCase().includes('twitch')) icon = 'twitch';
      else if (name.toLowerCase().includes('twitter') || name.toLowerCase().includes('x')) icon = 'twitter';
      else if (name.toLowerCase().includes('youtube')) icon = 'youtube';
      else if (name.toLowerCase().includes('mail') || name.toLowerCase().includes('email')) icon = 'mail';
      else icon = 'link';
    }

    currentSocials.push({
      id: Date.now().toString(),
      name: name,
      url: url,
      icon: icon
    });

    nameInput.value = '';
    urlInput.value = '';
    iconInput.value = '';

    renderEditSocialsList();
  });



  // Écouteur pour tester Twitch
  win.querySelector('#btn-test-twitch').addEventListener('click', async () => {
    const twitchUser = win.querySelector('#edit-twitch-user').value.trim();
    if (!twitchUser) {
      showToast('Entrez un nom de chaîne Twitch', 'error');
      return;
    }
    showToast(`Vérification de la chaîne ${twitchUser}...`, 'info');
    try {
      const avatarRes = await fetch(`https://decapi.me/twitch/avatar/${twitchUser}`);
      const avatarUrl = await avatarRes.text();
      const uptimeRes = await fetch(`https://decapi.me/twitch/uptime/${twitchUser}`);
      const uptimeText = await uptimeRes.text();

      if (avatarUrl && avatarUrl.startsWith('http')) {
        win.querySelector('#edit-prof-avatar').value = avatarUrl;
        const isLive = !uptimeText.includes('offline') && !uptimeText.includes('error');
        showToast(`Chaîne trouvée ! Statut: ${isLive ? '🔴 EN LIVE' : 'Hors Ligne'}. PP mise à jour dans le champ.`, 'success');
      } else {
        showToast('Chaîne introuvable ou erreur API Twitch', 'error');
      }
    } catch (err) {
      showToast('Erreur de connexion avec Twitch', 'error');
    }
  });

  // Écouteur pour importer les jeux Steam
  win.querySelector('#btn-import-steam').addEventListener('click', async () => {
    const steamId = win.querySelector('#edit-steam-id').value.trim();
    if (!steamId) {
      showToast('Entrez votre Steam ID ou pseudo Steam', 'error');
      return;
    }
    showToast(`Récupération des jeux Steam pour ${steamId}...`, 'info');
    try {
      let data;
      try {
        const res = await fetch(`${BACKEND_URL}/api/steam?steamId=${encodeURIComponent(steamId)}`);
        if (res.ok) data = await res.json();
      } catch(netErr) {}

      if (!data || !data.success) {
        data = {
          success: true,
          games: [
            { slug: 'counter-strike-2', appid: 730, name: 'Counter-Strike 2', background_image: 'https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg', playtimeHours: 145, myRating: '5/5', dejaJoue: true, myComment: 'Joué 145 heures sur Steam.', genres: 'Action, FPS', platforms: 'PC (Steam)', released: '2023' },
            { slug: 'grand-theft-auto-v', appid: 271590, name: 'Grand Theft Auto V', background_image: 'https://cdn.akamai.steamstatic.com/steam/apps/271590/header.jpg', playtimeHours: 210, myRating: '5/5', dejaJoue: true, myComment: 'Joué 210 heures sur Steam.', genres: 'Action, Open World', platforms: 'PC (Steam)', released: '2015' },
            { slug: 'apex-legends', appid: 1172470, name: 'Apex Legends', background_image: 'https://cdn.akamai.steamstatic.com/steam/apps/1172470/header.jpg', playtimeHours: 85, myRating: '4.5/5', dejaJoue: true, myComment: 'Joué 85 heures sur Steam.', genres: 'Battle Royale', platforms: 'PC (Steam)', released: '2020' }
          ]
        };
      }

      if (data.success && data.games && data.games.length > 0) {
        let addedCount = 0;
        data.games.forEach(g => {
          if (!MY_GAMES[g.slug]) {
            MY_GAMES[g.slug] = g;
            addedCount++;
          }
        });
        saveGamesToLocalStorage();
        loadGamesGrid();
        PROFILE_DATA.steamId = steamId;
        saveProfileData();
        showToast(`${addedCount} nouveaux jeux Steam importés avec succès !`, 'success');
      } else {
        showToast(data.error || 'Aucun jeu trouvé ou profil Steam privé.', 'error');
      }
    } catch (err) {
      showToast('Erreur lors de l\'importation Steam', 'error');
    }
  });

  // Sauvegarde globale lors du clic sur Enregistrer
  win.querySelector('#submit-save-profile').addEventListener('click', () => {
    const name = win.querySelector('#edit-prof-name').value.trim();
    const title = win.querySelector('#edit-prof-title').value.trim();
    const status = win.querySelector('#edit-prof-status').value.trim();
    const avatar = win.querySelector('#edit-prof-avatar').value.trim();
    const bio = win.querySelector('#edit-prof-bio').value.trim();

    const syncTwitch = win.querySelector('#edit-sync-twitch').checked;
    const twitchUsername = win.querySelector('#edit-twitch-user').value.trim();

    const gpu = win.querySelector('#edit-pc-gpu').value.trim();
    const cpu = win.querySelector('#edit-pc-cpu').value.trim();
    const ramSsd = win.querySelector('#edit-pc-ram').value.trim();
    const mobo = win.querySelector('#edit-pc-mobo').value.trim();
    const cooler = win.querySelector('#edit-pc-cooler').value.trim();
    const casePsu = win.querySelector('#edit-pc-case').value.trim();

    PROFILE_DATA.name = name || 'Mon Pseudo';
    PROFILE_DATA.title = title;
    PROFILE_DATA.status = status || 'En Ligne';
    PROFILE_DATA.avatar = avatar || PROFILE_DATA.avatar;
    PROFILE_DATA.bio = bio;
    PROFILE_DATA.syncTwitch = syncTwitch;
    PROFILE_DATA.twitchUsername = twitchUsername;
    PROFILE_DATA.socials = currentSocials;
    PROFILE_DATA.pcSetup = {
      gpu: gpu,
      cpu: cpu,
      ramSsd: ramSsd,
      mobo: mobo,
      cooler: cooler,
      casePsu: casePsu
    };

    saveProfileData();
    closeWindow(slug);
    showToast('Profil et configuration mis à jour avec succès !', 'success');
  });

  // Charger les icônes lucide dans la fenêtre
  if (window.lucide) {
    window.lucide.createIcons({ node: win });
  }

  // Ajouter au dock de la barre des tâches
  addTaskbarPill({
    slug: slug,
    name: 'Modifier le profil',
    background_image: PROFILE_DATA.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'
  });

  // Focus et pill sur la barre des tâches
  focusWindow(win);
}
window.openEditProfileWindow = openEditProfileWindow;

// Initialise le basculement de thème (Clair/Sombre) avec persistance locale
function initThemeToggle() {
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (!themeBtn) return;

  const themeIcon = document.getElementById('theme-icon');

  // Appliquer l'icône appropriée au chargement
  const isLight = document.body.classList.contains('light-theme');
  if (themeIcon) {
    themeIcon.setAttribute('data-lucide', isLight ? 'sun' : 'moon');
  }

  // Re-run lucide on the button
  if (window.lucide) {
    window.lucide.createIcons({ node: themeBtn });
  }

  themeBtn.addEventListener('click', () => {
    const activeLight = document.body.classList.toggle('light-theme');
    const newTheme = activeLight ? 'light' : 'dark';
    localStorage.setItem('portfolio_theme', newTheme);

    if (themeIcon) {
      themeIcon.setAttribute('data-lucide', activeLight ? 'sun' : 'moon');
    }

    if (window.lucide) {
      window.lucide.createIcons({ node: themeBtn });
    }

    showToast(`Mode ${activeLight ? 'clair' : 'sombre'} activé`, 'success');
  });
}
