// frontend/src/services/assets.js

// Quét ảnh trong src để Vite build ra URL tĩnh
const productImgs = import.meta.glob(
  "../assets/products/*.{webp,png,jpg,jpeg}",
  { eager: true }
);
const clubLogos = import.meta.glob("../assets/logo/*.{webp,png,jpg,jpeg,svg}", {
  eager: true,
});
const opponentImgs = import.meta.glob(
  "../assets/opponents/*.{webp,png,jpg,jpeg,svg}",
  { eager: true }
);

// Fallback TINH vào public (đã tồn tại sẵn trong dự án của bạn)
const PUBLIC_FALLBACK = "/assets/logo/real.png";

// Bỏ phần mở rộng nếu người dùng lưu "mancity.png" thay vì "mancity"
function stripExt(name) {
  return String(name || "")
    .trim()
    .split(/[\\/]/) // tách được cả '/' và '\'
    .pop()
    .replace(/\.(webp|png|jpg|jpeg|svg)$/i, "");
}

// thêm ngay dưới các glob khác:
const newsImgs = import.meta.glob(
  "../assets/news/*.{webp,png,jpg,jpeg}",
  { eager: true }
);
// 🔹 NEW: glob cho ảnh players
const playerImgs = import.meta.glob(
  "../assets/players/*.{webp,png,jpg,jpeg,svg}",
  { eager: true }
);
// >>> THÊM MỚI: trả URL logo Real Madrid từ opponents/real.jpg

// Tìm URL trong bản đồ glob theo base-name (không ext)
function pickFromMap(map, folder, base) {
  if (!base) return null;
  const candidates = [
    `${folder}/${base}.webp`,
    `${folder}/${base}.png`,
    `${folder}/${base}.jpg`,
    `${folder}/${base}.jpeg`,
    `${folder}/${base}.svg`,
  ];
  for (const key of Object.keys(map)) {
    // key kiểu "../assets/logo/opponents/mancity.png"
    const normalized = key.replace("../assets", "/src/assets");
    if (candidates.some((c) => normalized.endsWith(c))) {
      const mod = map[key];
      return mod?.default || mod; // URL do Vite trả về
    }
  }
  return null;
}
export function getPlayerImage(baseNameOrPath) {
  if (!baseNameOrPath) return "/assets/placeholder-player.png";

  const s = String(baseNameOrPath).trim();

  // http / https → giữ nguyên
  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  // /assets/... → giữ nguyên
  if (s.startsWith("/")) return s;

  // Tìm trong src/assets/players
  const base = stripExt(s);
  for (const key of Object.keys(playerImgs)) {
    // key = "../assets/players/guler.jpg"
    if (
      key.endsWith(`/players/${base}.jpg`) ||
      key.endsWith(`/players/${base}.png`) ||
      key.endsWith(`/players/${base}.jpeg`) ||
      key.endsWith(`/players/${base}.webp`) ||
      key.endsWith(`/players/${base}.svg`)
    ) {
      return playerImgs[key].default;
    }
  }

  // fallback: public/assets/players (nếu tự bỏ file vào public)
  return `/assets/players/${s}`;
}



export function getProductImage(baseName) {
  const url = pickFromMap(
    productImgs,
    "/src/assets/products",
    stripExt(baseName)
  );
  return url || PUBLIC_FALLBACK;
}

export function getClubLogo(baseName) {
  const url = pickFromMap(clubLogos, "/src/assets/logo", stripExt(baseName));
  return url || PUBLIC_FALLBACK;
}

export function getOpponentLogo(baseName) {
  const url = pickFromMap(
    opponentImgs,
    "/src/assets/opponents",
    stripExt(baseName)
  );
  return url || PUBLIC_FALLBACK;
}

export function getNewsImage(baseNameOrPath) {
  if (!baseNameOrPath) return "/img/default-news.jpg";

  // Nếu người dùng nhập sẵn đường dẫn public (/assets/...) thì trả về nguyên xi
  if (String(baseNameOrPath).startsWith("/")) return baseNameOrPath;

  // Tìm trong src/assets/news (cho phép lưu 'thua' hoặc 'thua.png')
  const url = pickFromMap(
    newsImgs,
    "/src/assets/news",
    stripExt(baseNameOrPath)
  );
  if (url) return url;

  // fallback: nếu DB lưu 'thua.png' và bạn để file trong public/assets/news
  return `/assets/news/${baseNameOrPath}`;
}
