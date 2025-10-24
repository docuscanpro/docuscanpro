// src/api/base44Client.js

/**
 * Cliente universal com APIs públicas reais
 * Permite testar login, upload, OCR e dados.
 */

// ================================
// 🔹 LOGIN / USUÁRIO – ReqRes API
// ================================
export async function loginUser(email, password) {
  const response = await fetch("https://reqres.in/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erro no login");

  // Salva token local (simulado)
  localStorage.setItem("token", data.token);
  return data;
}

// ================================
// 🔹 LISTAR DOCUMENTOS – JSONPlaceholder
// ================================
export async function fetchDocuments() {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts");
  if (!response.ok) throw new Error("Erro ao buscar documentos");
  return response.json();
}

// ================================
// 🔹 UPLOAD DE ARQUIVOS – File.io API
// ================================
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("https://file.io", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Erro no upload de arquivo");

  const result = await response.json();
  return {
    url: result.link,
    message: "Arquivo enviado com sucesso!",
  };
}

// ================================
// 🔹 OCR / LEITURA DE TEXTO – OCR.space API
// ================================
export async function readTextFromImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", "por"); // português

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (data.IsErroredOnProcessing) {
    throw new Error(data.ErrorMessage || "Erro ao processar OCR");
  }

  const text = data.ParsedResults?.[0]?.ParsedText || "";
  return { text };
}

// ================================
// 🔹 LOGOUT
// ================================
export function logoutUser() {
  localStorage.removeItem("token");
}
