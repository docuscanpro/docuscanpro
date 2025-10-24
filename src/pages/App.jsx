import React, { useState, useEffect } from "react";
import { loginUser, fetchDocuments } from "@/api/base44Client";

export default function App() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);
      const user = await loginUser("eve.holt@reqres.in", "cityslicka");
      alert("Login realizado! Token: " + user.token);
      const data = await fetchDocuments();
      setDocs(data.slice(0, 5)); // Mostra só os 5 primeiros
    } catch (error) {
      alert("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">DocuscanPRO</h1>
      <button
        onClick={handleLogin}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        {loading ? "Carregando..." : "Fazer login e carregar documentos"}
      </button>

      <ul className="mt-4 list-disc list-inside">
        {docs.map((doc) => (
          <li key={doc.id}>{doc.title}</li>
        ))}
      </ul>
    </div>
  );
}
