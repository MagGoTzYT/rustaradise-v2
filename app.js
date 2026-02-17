// Rustaradise — front-end logic

const STORAGE_SERVERS_KEY = "rustaradise_html_servers";
const STORAGE_USER_KEY = "rustaradise_html_user";
const STORAGE_USERS_REGISTRY_KEY = "rustaradise_html_users_registry";
const STORAGE_INTEGRATIONS_KEY = "rustaradise_html_integrations";
const ADMIN_USERNAMES = ["admin", "owner", "rustaradise"];

let liveServerDataCache = { lastFetch: 0, data: {}, ttlMs: 60000 };

function getServers() {
  const integrations = getIntegrations();
  let servers = (integrations.servers && Array.isArray(integrations.servers))
    ? integrations.servers
    : null;
  if (!servers || servers.length === 0) {
    const raw = localStorage.getItem(STORAGE_SERVERS_KEY);
    if (raw) {
      try {
        servers = JSON.parse(raw);
        integrations.servers = servers;
        saveIntegrations(integrations);
      } catch {
        return ensureDefaultServers();
      }
    }
  }
  if (!servers || servers.length === 0) return ensureDefaultServers();
  if (liveServerDataCache.data && Object.keys(liveServerDataCache.data).length > 0) {
    servers = servers.map((s) => {
      const live = liveServerDataCache.data[s.id];
      if (!live) return s;
      return { ...s, ...live };
    });
  }
  return servers;
}

function saveServers(servers) {
  const integrations = getIntegrations();
  integrations.servers = servers;
  saveIntegrations(integrations);
  localStorage.setItem(STORAGE_SERVERS_KEY, JSON.stringify(servers));
}

async function fetchLiveServerData() {
  const integrations = getIntegrations();
  const url = integrations.liveDataUrl && integrations.liveDataUrl.trim();
  if (!url) return;
  if (Date.now() - liveServerDataCache.lastFetch < liveServerDataCache.ttlMs) return;
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const json = await res.json();
    const list = json.servers || json.data || json;
    if (!Array.isArray(list)) return;
    liveServerDataCache.data = {};
    list.forEach((s) => {
      if (s.id) liveServerDataCache.data[s.id] = s;
    });
    liveServerDataCache.lastFetch = Date.now();
  } catch {
    /* ignore */
  }
}

function ensureDefaultServers() {
  const integrations = getIntegrations();
  if (integrations.servers && integrations.servers.length > 0) {
    return integrations.servers;
  }
  const raw = localStorage.getItem(STORAGE_SERVERS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      integrations.servers = parsed;
      saveIntegrations(integrations);
      return parsed;
    } catch {
      /* fall through to defaults */
    }
  }
  const defaults = [
    // Rust
    {
      id: "rust-eu-1",
      name: "Rustaradise | Vanilla+ EU",
      game: "Rust",
      region: "EU",
      ip: "rust1.rustaradise.gg",
      port: 28015,
      map: "Procedural 4500",
      players: 142,
      maxPlayers: 200,
      queue: 6,
      status: "online",
      lastWipe: "3 days ago",
      uptimePercent: 99.4,
      avgPlayers24h: 118,
      peakPlayers24h: 198,
      avgLatencyMs: 38,
    },
    {
      id: "rust-na-2x",
      name: "Rustaradise | 2x US",
      game: "Rust",
      region: "NA",
      ip: "rust2.rustaradise.gg",
      port: 28016,
      map: "Procedural 3500 · 2x",
      players: 87,
      maxPlayers: 150,
      queue: 0,
      status: "online",
      lastWipe: "1 day ago",
      uptimePercent: 98.7,
      avgPlayers24h: 76,
      peakPlayers24h: 142,
      avgLatencyMs: 54,
    },
    // Counter-Strike 2
    {
      id: "cs2-eu-hub",
      name: "Rustaradise | CS2 Mirage 24/7",
      game: "CS2",
      region: "EU",
      ip: "cs2-eu.rustaradise.gg",
      port: 27015,
      map: "Mirage · 128 tick",
      players: 18,
      maxPlayers: 20,
      queue: 0,
      status: "online",
      lastWipe: "Rotations hourly",
      uptimePercent: 99.9,
      avgPlayers24h: 16,
      peakPlayers24h: 20,
      avgLatencyMs: 24,
    },
    {
      id: "cs2-na-retake",
      name: "Rustaradise | CS2 Retakes NA",
      game: "CS2",
      region: "NA",
      ip: "cs2-na.rustaradise.gg",
      port: 27016,
      map: "Mixed · Retakes",
      players: 9,
      maxPlayers: 10,
      queue: 0,
      status: "maintenance",
      lastWipe: "Today",
      uptimePercent: 96.2,
      avgPlayers24h: 8,
      peakPlayers24h: 10,
      avgLatencyMs: 32,
    },
    // Minecraft
    {
      id: "mc-survival",
      name: "Rustaradise | MC Survival",
      game: "Minecraft",
      region: "EU",
      ip: "mc.rustaradise.gg",
      port: 25565,
      map: "1.21 Survival · Claims",
      players: 34,
      maxPlayers: 80,
      queue: 0,
      status: "online",
      lastWipe: "Season 3 · 2 weeks ago",
      uptimePercent: 99.1,
      avgPlayers24h: 29,
      peakPlayers24h: 63,
      avgLatencyMs: 41,
    },
    {
      id: "other-arena",
      name: "Rustaradise | Arena Sandbox",
      game: "Other",
      region: "EU",
      ip: "arena.rustaradise.gg",
      port: 30000,
      map: "Custom Arena",
      players: 4,
      maxPlayers: 24,
      queue: 0,
      status: "offline",
      lastWipe: "Planned",
      uptimePercent: 80.0,
      avgPlayers24h: 3,
      peakPlayers24h: 14,
      avgLatencyMs: 35,
    },
  ];
  integrations.servers = defaults;
  saveIntegrations(integrations);
  localStorage.setItem(STORAGE_SERVERS_KEY, JSON.stringify(defaults));
  return defaults;
}

function getUsersRegistry() {
  const raw = localStorage.getItem(STORAGE_USERS_REGISTRY_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveUsersRegistry(registry) {
  localStorage.setItem(STORAGE_USERS_REGISTRY_KEY, JSON.stringify(registry));
}

function getUser() {
  const raw = localStorage.getItem(STORAGE_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveUser(user) {
  const { password: _p, ...userWithoutPassword } = user;
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userWithoutPassword));
  if (user.username) {
    const registry = getUsersRegistry();
    const existing = registry[user.username] || {};
    registry[user.username] = {
      ...existing,
      ...user,
      password: user.password !== undefined ? user.password : existing.password,
    };
    saveUsersRegistry(registry);
  }
}

function getDefaultIntegrations() {
  return {
    servers: [],
    liveDataUrl: "",
    rcon: { enabled: false, host: "", port: "", note: "" },
    iw4madmin: { enabled: false, url: "", note: "" },
    other: { enabled: false, label: "", note: "" },
  };
}

function getIntegrations() {
  const raw = localStorage.getItem(STORAGE_INTEGRATIONS_KEY);
  const defaults = getDefaultIntegrations();
  if (!raw) return defaults;
  try {
    const parsed = JSON.parse(raw);
    const merged = { ...defaults, ...parsed };
    if (!Array.isArray(merged.servers)) merged.servers = defaults.servers || [];
    if (typeof merged.liveDataUrl !== "string") merged.liveDataUrl = defaults.liveDataUrl || "";
    return merged;
  } catch {
    return defaults;
  }
}

function saveIntegrations(integrations) {
  localStorage.setItem(STORAGE_INTEGRATIONS_KEY, JSON.stringify(integrations));
}

function logoutUser() {
  localStorage.removeItem(STORAGE_USER_KEY);
  window.location.href = "index.html";
}

function deleteUserAccount(username) {
  const registry = getUsersRegistry();
  delete registry[username];
  saveUsersRegistry(registry);
  localStorage.removeItem(STORAGE_USER_KEY);
  window.location.href = "index.html";
}

function changeUsername(oldUsername, newUsername, currentPassword) {
  const registry = getUsersRegistry();
  const existing = registry[oldUsername];
  if (!existing || existing.password !== currentPassword)
    return { ok: false, error: "Current password is incorrect." };
  const normalized = newUsername.trim().toLowerCase();
  if (registry[normalized]) return { ok: false, error: "That username is already taken." };
  const updated = { ...existing, username: normalized };
  delete registry[oldUsername];
  registry[normalized] = updated;
  saveUsersRegistry(registry);
  const { password: _p, ...userWithoutPassword } = updated;
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userWithoutPassword));
  return { ok: true };
}

function changePassword(username, currentPassword, newPassword) {
  const registry = getUsersRegistry();
  const existing = registry[username];
  if (!existing || existing.password !== currentPassword)
    return { ok: false, error: "Current password is incorrect." };
  existing.password = newPassword;
  registry[username] = existing;
  saveUsersRegistry(registry);
  return { ok: true };
}

function shortInitials(username) {
  if (!username) return "";
  return username.slice(0, 2).toUpperCase();
}

function formatRole(role) {
  return role === "admin" ? "admin" : "player";
}

function updateNav() {
  const user = getUser();
  const navUser = document.querySelector("[data-nav-user]");
  const navLogin = document.querySelector("[data-nav-login]");
  const navAdmin = document.querySelector("[data-nav-admin]");
  const navLogout = document.querySelector("[data-nav-logout]");
  if (!navUser || !navLogin || !navLogout) return;

  if (!user) {
    navUser.style.display = "none";
    navAdmin && (navAdmin.style.display = "none");
    navLogout.style.display = "none";
    navLogin.style.display = "inline-flex";
  } else {
    const initialsEl = navUser.querySelector("[data-nav-initials]");
    const nameEl = navUser.querySelector("[data-nav-name]");
    const roleEl = navUser.querySelector("[data-nav-role]");
    if (initialsEl) initialsEl.textContent = shortInitials(user.username);
    if (nameEl) nameEl.textContent = user.username;
    if (roleEl) roleEl.textContent = formatRole(user.role);

    navUser.style.display = "inline-flex";
    navLogout.style.display = "inline-flex";
    navLogin.style.display = "none";
    if (navAdmin) {
      navAdmin.style.display = user.role === "admin" ? "inline-flex" : "none";
    }
  }
}

// BLOG PAGE
function initBlogPage() {
  updateNav();
}

// HOME PAGE
async function initHomePage() {
  ensureDefaultServers();
  updateNav();
  await fetchLiveServerData();

  const servers = getServers() || [];
  const featured = servers.slice(0, 3);

  const countSpan = document.getElementById("home-server-count");
  if (countSpan) countSpan.textContent = String(servers.length);

  const avgLatencyEl = document.getElementById("home-avg-latency");
  const peakEl = document.getElementById("home-peak");
  if (featured.length > 0) {
    const avgLatency =
      featured.reduce((acc, s) => acc + (s.avgLatencyMs || 0), 0) /
      featured.length;
    const peak = featured.reduce((acc, s) => acc + (s.peakPlayers24h || 0), 0);
    if (avgLatencyEl)
      avgLatencyEl.textContent = "~" + Math.round(avgLatency) + "ms";
    if (peakEl) peakEl.textContent = String(peak);
  }

  const tbody = document.getElementById("home-servers-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  featured.forEach((s) => {
    const max = s.maxPlayers || 1;
    const fillPct = Math.min(100, ((s.players || 0) / max) * 100);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="server-name">${s.name}</div>
        <div class="server-sub">${s.map} · ${s.game}</div>
        <div class="server-address">${s.ip}:${s.port}</div>
      </td>
      <td>
        <div>${s.players || 0}/${s.maxPlayers || 0}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${fillPct}%"></div></div>
      </td>
      <td>${s.region}</td>
      <td><span style="color:#6ee7b7;font-weight:500">${s.avgLatencyMs}</span> ms</td>
      <td>${renderStatusPillHTML(s.status)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// SERVERS PAGE
async function initServersPage() {
  ensureDefaultServers();
  updateNav();
  await fetchLiveServerData();
  const servers = getServers() || [];
  initServersPageRender(servers);
}

function renderStatusPillHTML(status) {
  let cls = "status-online";
  if (status === "offline") cls = "status-offline";
  else if (status === "maintenance") cls = "status-maintenance";
  const label = status === "maintenance" ? "Maint" : status;
  return `<span class="status-pill ${cls}" title="${status}"><span class="status-dot"></span>${label}</span>`;
}

function initServersPageRender(servers) {
  const searchInput = document.getElementById("servers-search");
  const regionButtons = document.querySelectorAll("[data-region]");
  const gameButtons = document.querySelectorAll("[data-game]");
  const tbody = document.getElementById("servers-body");

  function currentFilters() {
    const q = (searchInput && searchInput.value) || "";
    let region = "all";
    let game = "all";

    regionButtons.forEach((btn) => {
      if (btn.classList.contains("active")) {
        region = btn.getAttribute("data-region") || "all";
      }
    });
    gameButtons.forEach((btn) => {
      if (btn.classList.contains("active")) {
        game = btn.getAttribute("data-game") || "all";
      }
    });
    return { q, region, game };
  }

  function applyFilters() {
    if (!tbody) return;
    const { q, region, game } = currentFilters();
    const query = q.toLowerCase();
    const filtered = servers.filter((s) => {
      const matchesQuery =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.map.toLowerCase().includes(query);
      const matchesRegion = region === "all" ? true : s.region === region;
      const matchesGame = game === "all" ? true : s.game === game;
      return matchesQuery && matchesRegion && matchesGame;
    });

    tbody.innerHTML = "";
    if (filtered.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 7;
      td.className = "text-center muted";
      td.textContent = "No servers match your filters yet.";
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      filtered.forEach((s) => {
        const max = s.maxPlayers || 1;
        const fillPct = Math.min(100, ((s.players || 0) / max) * 100);
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>
            <div class="server-name">${s.name}</div>
            <div class="server-sub">Last wipe ${s.lastWipe}</div>
            <div class="server-address">${s.ip}:${s.port}</div>
          </td>
          <td>
            <div class="server-sub">${s.map}</div>
            <div class="muted">${s.game}</div>
          </td>
          <td>
            <div>${s.players || 0}/${s.maxPlayers || 0}</div>
            <div class="bar-track"><div class="bar-fill" style="width:${fillPct}%"></div></div>
          </td>
          <td>${s.region}</td>
          <td><span style="color:#6ee7b7;font-weight:500">${s.avgLatencyMs}</span> ms</td>
          <td>${renderStatusPillHTML(s.status)}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    updateAnalytics(servers);
  }

  function updateAnalytics(allServers) {
    const online = allServers.filter((s) => s.status === "online");
    const totalPlayers = online.reduce((acc, s) => acc + s.players, 0);
    const totalMax = online.reduce((acc, s) => acc + s.maxPlayers, 0);
    const fillPct = totalMax ? Math.round((totalPlayers / totalMax) * 100) : 0;
    const avgUptime =
      allServers.reduce((acc, s) => acc + s.uptimePercent, 0) /
      Math.max(allServers.length, 1);

    const populationBar = document.getElementById("analytics-population-bar");
    const populationLabel = document.getElementById("analytics-population-label");
    const uptimeLabel = document.getElementById("analytics-uptime-label");
    const peakLabel = document.getElementById("analytics-peak");
    const avgLoadLabel = document.getElementById("analytics-avg-load");
    const miniBars = document.getElementById("analytics-uptime-bars");
    const miniLabels = document.getElementById("analytics-uptime-bars-labels");
    const byGameEl = document.getElementById("analytics-by-game");

    if (populationBar) populationBar.style.width = fillPct + "%";
    if (populationLabel)
      populationLabel.textContent = `${totalPlayers}/${totalMax || "—"}`;
    if (uptimeLabel) uptimeLabel.textContent = avgUptime.toFixed(1) + "%";

    if (peakLabel) {
      const totalPeak = allServers.reduce(
        (acc, s) => acc + (s.peakPlayers24h || 0),
        0
      );
      peakLabel.textContent = String(totalPeak);
    }

    if (avgLoadLabel) {
      const avgLoad =
        allServers.reduce((acc, s) => acc + (s.avgPlayers24h || 0), 0) /
        Math.max(allServers.length, 1);
      avgLoadLabel.textContent = String(Math.round(avgLoad));
    }

    if (miniBars && miniLabels) {
      miniBars.innerHTML = "";
      miniLabels.innerHTML = "";
      allServers.forEach((s) => {
        const bar = document.createElement("div");
        bar.className = "mini-bar";
        bar.style.height = s.uptimePercent + "%";
        bar.title = `${s.name} · ${s.uptimePercent.toFixed(1)}%`;
        miniBars.appendChild(bar);

        const label = document.createElement("span");
        label.textContent = `${s.region}-${s.id.split("-")[0]}`;
        miniLabels.appendChild(label);
      });
    }

    if (byGameEl) {
      const games = ["Rust", "CS2", "Minecraft", "Other"];
      const parts = games.map((g) => {
        const subset = allServers.filter((s) => s.game === g);
        if (subset.length === 0) return `${g}: —`;
        const avg =
          subset.reduce((acc, s) => acc + (s.avgPlayers24h || 0), 0) /
          subset.length;
        return `${g}: ${Math.round(avg)}`;
      });
      byGameEl.textContent = parts.join(" · ") + " avg players / server (24h)";
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }
  regionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      regionButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilters();
    });
  });
  gameButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      gameButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilters();
    });
  });

  // Initial render
  applyFilters();

  // Refresh from integrations every 60s
  setInterval(async () => {
    liveServerDataCache.lastFetch = 0;
    await fetchLiveServerData();
    const fresh = getServers() || [];
    servers.length = 0;
    servers.push(...fresh);
    applyFilters();
  }, 60000);

  const serversCountEl = document.getElementById("servers-count");
  const livePlayersValueEl = document.getElementById("servers-live-players-value");
  if (serversCountEl) serversCountEl.textContent = String(servers.length);
  if (livePlayersValueEl) {
    const online = servers.filter((s) => s.status === "online");
    const totalPlayers = online.reduce((acc, s) => acc + s.players, 0);
    livePlayersValueEl.textContent = String(totalPlayers);
  }
}

// LOGIN PAGE
function initLoginPage() {
  updateNav();
  const form = document.getElementById("login-form");
  const errorEl = document.getElementById("login-error");

  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (errorEl) errorEl.textContent = "";
    const username = form.username.value.trim();
    const password = form.password.value.trim();
    if (!username || !password) {
      if (errorEl)
        errorEl.textContent = "Enter a username and password to continue.";
      return;
    }
    const normalized = username.toLowerCase();
    const registry = getUsersRegistry();
    const registered = registry[normalized];
    if (!registered) {
      if (errorEl)
        errorEl.textContent = "No account found with that username. Sign up first.";
      return;
    }
    if (registered.password !== password) {
      if (errorEl)
        errorEl.textContent = "Incorrect password. Please try again.";
      return;
    }
    const { password: _p, ...user } = registered;
    saveUser({ ...registered });
    window.location.href = "profile.html";
  });
}

// SIGNUP PAGE
function initSignupPage() {
  updateNav();
  const form = document.getElementById("signup-form");
  const errorEl = document.getElementById("signup-error");

  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (errorEl) errorEl.textContent = "";
    const username = form.username.value.trim();
    const password = form.password.value.trim();
    const confirm = form.confirm.value.trim();

    if (!username || !password || !confirm) {
      if (errorEl)
        errorEl.textContent = "Fill in username, password, and confirmation.";
      return;
    }
    if (password !== confirm) {
      if (errorEl)
        errorEl.textContent = "Passwords don’t match. Please try again.";
      return;
    }

    const normalized = username.toLowerCase();
    const registry = getUsersRegistry();
    if (registry[normalized]) {
      if (errorEl)
        errorEl.textContent = "That username is already taken. Please choose another.";
      return;
    }
    const isAdmin = ADMIN_USERNAMES.includes(normalized);
    const user = {
      username: normalized,
      password,
      role: isAdmin ? "admin" : "user",
      avatarUrl:
        "https://api.dicebear.com/9.x/bottts/svg?seed=" +
        encodeURIComponent(normalized),
      bannerUrl:
        "https://images.pexels.com/photos/2832072/pexels-photo-2832072.jpeg",
      bio: "Welcome to Rustaradise.",
    };
    saveUser(user);
    window.location.href = "profile.html";
  });
}

// PROFILE PAGE
function initProfilePage() {
  updateNav();
  const user = getUser();
  const loggedOutSection = document.getElementById("profile-logged-out");
  const contentSection = document.getElementById("profile-content");

  if (!user) {
    if (loggedOutSection) loggedOutSection.style.display = "block";
    if (contentSection) contentSection.style.display = "none";
    return;
  }

  if (loggedOutSection) loggedOutSection.style.display = "none";
  if (contentSection) contentSection.style.display = "block";

  const nameEl = document.getElementById("profile-name");
  const roleEl = document.getElementById("profile-role");
  const avatarInitials = document.getElementById("profile-avatar-initials");
  const avatarImg = document.getElementById("profile-avatar-img");
  const bannerImg = document.getElementById("profile-banner-img");
  const bioPreview = document.getElementById("profile-bio");

  if (nameEl) nameEl.textContent = user.username;
  if (roleEl)
    roleEl.textContent =
      user.role === "admin" ? "Rustaradise Staff" : "Rustaradise Player";

  function updateVisuals(newUser) {
    if (avatarImg && newUser.avatarUrl) {
      avatarImg.src = newUser.avatarUrl;
      avatarImg.style.display = "block";
      if (avatarInitials) avatarInitials.style.display = "none";
    } else {
      if (avatarImg) avatarImg.style.display = "none";
      if (avatarInitials) {
        avatarInitials.textContent = shortInitials(newUser.username);
        avatarInitials.style.display = "flex";
      }
    }
    if (bannerImg && newUser.bannerUrl) {
      bannerImg.src = newUser.bannerUrl;
      bannerImg.style.display = "block";
    } else if (bannerImg) {
      bannerImg.style.display = "none";
    }
    if (bioPreview)
      bioPreview.textContent = newUser.bio || "Welcome to Rustaradise.";
  }

  let currentUser = { ...user };
  updateVisuals(currentUser);

  const form = document.getElementById("profile-form");
  const savedMsg = document.getElementById("profile-saved");
  const avatarFileInput = document.getElementById("avatar-file");
  const bannerFileInput = document.getElementById("banner-file");

  let pendingAvatarDataUrl = null;
  let pendingBannerDataUrl = null;

  function readFileAsDataUrl(file, cb) {
    const reader = new FileReader();
    reader.onload = () => cb(reader.result);
    reader.readAsDataURL(file);
  }

  function getPreviewUser() {
    return {
      ...currentUser,
      avatarUrl: pendingAvatarDataUrl !== null ? pendingAvatarDataUrl : currentUser.avatarUrl || null,
      bannerUrl: pendingBannerDataUrl !== null ? pendingBannerDataUrl : currentUser.bannerUrl || null,
    };
  }
  const avatarFilenameEl = document.getElementById("avatar-filename");
  const bannerFilenameEl = document.getElementById("banner-filename");
  if (avatarFileInput) {
    avatarFileInput.addEventListener("change", function () {
      const file = this.files && this.files[0];
      if (avatarFilenameEl) avatarFilenameEl.textContent = file ? file.name : "No file chosen";
      if (!file) {
        pendingAvatarDataUrl = null;
        updateVisuals(getPreviewUser());
        return;
      }
      readFileAsDataUrl(file, (dataUrl) => {
        pendingAvatarDataUrl = dataUrl;
        updateVisuals(getPreviewUser());
      });
    });
  }
  if (bannerFileInput) {
    bannerFileInput.addEventListener("change", function () {
      const file = this.files && this.files[0];
      if (bannerFilenameEl) bannerFilenameEl.textContent = file ? file.name : "No file chosen";
      if (!file) {
        pendingBannerDataUrl = null;
        updateVisuals(getPreviewUser());
        return;
      }
      readFileAsDataUrl(file, (dataUrl) => {
        pendingBannerDataUrl = dataUrl;
        updateVisuals(getPreviewUser());
      });
    });
  }

  if (form) {
    form.bio.value = currentUser.bio || "";

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const updated = {
        ...currentUser,
        ...getPreviewUser(),
        bio: form.bio.value.trim() || "",
      };
      saveUser(updated);
      currentUser = updated;
      pendingAvatarDataUrl = null;
      pendingBannerDataUrl = null;
      if (avatarFileInput) {
        avatarFileInput.value = "";
        if (avatarFilenameEl) avatarFilenameEl.textContent = "No file chosen";
      }
      if (bannerFileInput) {
        bannerFileInput.value = "";
        if (bannerFilenameEl) bannerFilenameEl.textContent = "No file chosen";
      }
      updateVisuals(updated);
      if (savedMsg) {
        savedMsg.style.display = "block";
        setTimeout(() => (savedMsg.style.display = "none"), 2000);
      }
    });
  }
}

// SETTINGS PAGE
function initSettingsPage() {
  updateNav();
  const user = getUser();
  const loggedOutSection = document.getElementById("settings-logged-out");
  const contentSection = document.getElementById("settings-content");

  if (!user) {
    if (loggedOutSection) loggedOutSection.style.display = "block";
    if (contentSection) contentSection.style.display = "none";
    return;
  }

  if (loggedOutSection) loggedOutSection.style.display = "none";
  if (contentSection) contentSection.style.display = "block";

  const currentUsernameEl = document.getElementById("settings-current-username");
  if (currentUsernameEl) currentUsernameEl.value = user.username;

  const usernameForm = document.getElementById("settings-username-form");
  const usernameError = document.getElementById("settings-username-error");
  const usernameSuccess = document.getElementById("settings-username-success");
  if (usernameForm) {
    usernameForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (usernameError) usernameError.textContent = "";
      if (usernameSuccess) usernameSuccess.textContent = "";
      const newUsername = usernameForm.newUsername.value.trim();
      const currentPassword = usernameForm.currentPassword.value;
      if (!newUsername || !currentPassword) {
        if (usernameError) usernameError.textContent = "Fill in new username and current password.";
        return;
      }
      const result = changeUsername(user.username, newUsername, currentPassword);
      if (!result.ok) {
        if (usernameError) usernameError.textContent = result.error;
        return;
      }
      if (usernameSuccess) usernameSuccess.textContent = "Username updated. Reloading…";
      usernameForm.reset();
      usernameForm.newUsername.value = "";
      usernameForm.currentPassword.value = "";
      if (currentUsernameEl) currentUsernameEl.value = newUsername;
      setTimeout(() => window.location.reload(), 800);
    });
  }

  const passwordForm = document.getElementById("settings-password-form");
  const passwordError = document.getElementById("settings-password-error");
  const passwordSuccess = document.getElementById("settings-password-success");
  if (passwordForm) {
    passwordForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (passwordError) passwordError.textContent = "";
      if (passwordSuccess) passwordSuccess.textContent = "";
      const currentPassword = passwordForm.currentPassword.value;
      const newPassword = passwordForm.newPassword.value;
      const confirmPassword = passwordForm.confirmPassword.value;
      if (!currentPassword || !newPassword || !confirmPassword) {
        if (passwordError) passwordError.textContent = "Fill in all password fields.";
        return;
      }
      if (newPassword !== confirmPassword) {
        if (passwordError) passwordError.textContent = "New passwords don't match.";
        return;
      }
      const result = changePassword(user.username, currentPassword, newPassword);
      if (!result.ok) {
        if (passwordError) passwordError.textContent = result.error;
        return;
      }
      if (passwordSuccess) passwordSuccess.textContent = "Password updated.";
      passwordForm.reset();
    });
  }

  const deleteForm = document.getElementById("settings-delete-form");
  const deleteError = document.getElementById("settings-delete-error");
  if (deleteForm) {
    deleteForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (deleteError) deleteError.textContent = "";
      const pwd = deleteForm.deletePassword.value;
      const registry = getUsersRegistry();
      const existing = registry[user.username];
      if (!existing || existing.password !== pwd) {
        if (deleteError) deleteError.textContent = "Incorrect password.";
        return;
      }
      if (!confirm("Are you sure? This will permanently delete your account.")) return;
      deleteUserAccount(user.username);
    });
  }
}

// ADMIN PAGE
async function initAdminPage() {
  ensureDefaultServers();
  updateNav();
  await fetchLiveServerData();

  const user = getUser();
  const denied = document.getElementById("admin-denied");
  const content = document.getElementById("admin-content");

  if (!user || user.role !== "admin") {
    if (denied) denied.style.display = "block";
    if (content) content.style.display = "none";
    return;
  }

  if (denied) denied.style.display = "none";
  if (content) content.style.display = "block";

  const servers = getServers() || [];
  const tbody = document.getElementById("admin-body");
  const infoNote = document.getElementById("admin-note");

  async function refreshAndRender() {
    liveServerDataCache.lastFetch = 0;
    await fetchLiveServerData();
    const updated = getServers() || [];
    servers.length = 0;
    servers.push(...updated);
    renderTable();
    if (infoNote) {
      infoNote.textContent = "Refreshed from integrations.";
      setTimeout(() => {
        infoNote.textContent = "Data from Live data URL. Configure in Integrations below.";
      }, 2000);
    }
  }

  function renderTable() {
    if (!tbody) return;
    tbody.innerHTML = "";
    servers.forEach((s) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="server-name">${s.name}</div>
          <div class="server-sub">${s.map} · ${s.region} · ${s.game}</div>
          <div class="server-address">${s.ip}:${s.port}</div>
        </td>
        <td>${s.players || 0} / ${s.maxPlayers || 0}</td>
        <td>${s.queue || 0}</td>
        <td>${s.avgLatencyMs ?? "—"} ms</td>
        <td>${renderStatusPillHTML(s.status || "online")}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  const refreshBtn = document.getElementById("admin-refresh-servers");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => refreshAndRender());
  }

  renderTable();

  // Integrations panel
  const integrationsForm = document.getElementById("integrations-form");
  const integrationsStatus = document.getElementById("integrations-status");
  if (integrationsForm) {
    let integrations = getIntegrations();
    // Prefill
    if (integrationsForm.liveDataUrl)
      integrationsForm.liveDataUrl.value = integrations.liveDataUrl || "";
    integrationsForm.rconEnabled.checked = !!integrations.rcon.enabled;
    integrationsForm.rconHost.value = integrations.rcon.host || "";
    integrationsForm.rconPort.value = integrations.rcon.port || "";
    integrationsForm.rconNote.value = integrations.rcon.note || "";

    integrationsForm.iw4Enabled.checked = !!integrations.iw4madmin.enabled;
    integrationsForm.iw4Url.value = integrations.iw4madmin.url || "";
    integrationsForm.iw4Note.value = integrations.iw4madmin.note || "";

    integrationsForm.otherEnabled.checked = !!integrations.other.enabled;
    integrationsForm.otherLabel.value = integrations.other.label || "";
    integrationsForm.otherNote.value = integrations.other.note || "";

    integrationsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      integrations = {
        ...integrations,
        liveDataUrl: (integrationsForm.liveDataUrl && integrationsForm.liveDataUrl.value.trim()) || "",
        rcon: {
          enabled: integrationsForm.rconEnabled.checked,
          host: integrationsForm.rconHost.value.trim(),
          port: integrationsForm.rconPort.value.trim(),
          note: integrationsForm.rconNote.value.trim(),
        },
        iw4madmin: {
          enabled: integrationsForm.iw4Enabled.checked,
          url: integrationsForm.iw4Url.value.trim(),
          note: integrationsForm.iw4Note.value.trim(),
        },
        other: {
          enabled: integrationsForm.otherEnabled.checked,
          label: integrationsForm.otherLabel.value.trim(),
          note: integrationsForm.otherNote.value.trim(),
        },
      };
      saveIntegrations(integrations);
      if (integrationsStatus) {
        integrationsStatus.textContent = "Integrations saved.";
        setTimeout(() => {
          integrationsStatus.textContent =
            "Configure RCON, IW4MAdmin and other tools. Settings are saved when you click Save.";
        }, 2500);
      }
    });
  }
}

// NAV helpers
document.addEventListener("click", function (e) {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.matches("[data-nav-logout]")) {
    e.preventDefault();
    logoutUser();
  }
  if (target.matches("[data-nav-profile]")) {
    e.preventDefault();
    window.location.href = "profile.html";
  }
});

