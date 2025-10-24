// Mapeia os nomes das páginas para as URLs reais
const PAGE_MAP = {
  Dashboard: "/",
  Capture: "/capture",
  OCR: "/ocr",
  Translate: "/translate",
  Convert: "/convert",
  Sign: "/sign",
  MyDocuments: "/mydocuments",
  Settings: "/settings",
  Share: "/share"
};

/**
 * Cria uma URL de página a partir de um nome de página.
 * @param {string} pageName O nome da página (ex: "Capture")
 * @returns {string} A URL da rota (ex: "/capture")
 */
export const createPageUrl = (pageName) => {
  return PAGE_MAP[pageName] || "/";
};
