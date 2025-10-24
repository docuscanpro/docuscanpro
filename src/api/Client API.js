const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ClientAPI {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Upload de arquivos
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return await response.json();
  }

  // Documentos
  get entities() {
    return {
      Document: {
        list: (sort = '-created_date', limit = 50) => 
          this.request('/documents'),
        
        create: (data) => 
          this.request('/documents', {
            method: 'POST',
            body: JSON.stringify(data),
          }),
        
        update: (id, data) =>
          this.request(`/documents/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          }),
        
        delete: (id) =>
          this.request(`/documents/${id}`, {
            method: 'DELETE',
          }),
        
        filter: (filters) =>
          this.request('/documents').then(docs => 
            docs.filter(doc => {
              return Object.entries(filters).every(([key, value]) => 
                doc[key] === value
              );
            })
          ),
      },

      Signature: {
        list: (sort = '-created_date') =>
          this.request('/signatures'),
        
        create: (data) =>
          this.request('/signatures', {
            method: 'POST',
            body: JSON.stringify(data),
          }),
      },
    };
  }

  // Integrações
  get integrations() {
    return {
      Core: {
        UploadFile: ({ file }) => this.uploadFile(file),
        
        InvokeLLM: async ({ prompt, file_urls = [] }) => {
          // Simulação de LLM - em produção integrar com Gemini AI
          if (prompt.includes('Extraia')) {
            return 'Texto extraído simuladamente do documento. Em produção, isso viria de um serviço de OCR real.';
          }
          
          if (prompt.includes('Traduza')) {
            return 'Texto traduzido simuladamente. Em produção, isso usaria APIs de tradução.';
          }
          
          return 'Resposta simulada do LLM. Configure uma API key real para funcionalidades completas.';
        },
      },
    };
  }

  // Autenticação (simulada)
  get auth() {
    return {
      me: () => 
        Promise.resolve({
          id: 'user-1',
          full_name: 'Usuário Demo',
          email: 'demo@docuscan.com',
          role: 'user',
          preferences: {
            defaultLanguage: 'pt-BR',
            defaultImageFormat: 'png',
            autoSaveDocuments: true,
            enableNotifications: true,
            theme: 'light',
          },
        }),
      
      updateMe: (data) =>
        Promise.resolve({
          ...data,
          id: 'user-1',
          updated_at: new Date().toISOString(),
        }),
    };
  }
}

export const clientAPI = new ClientAPI();
export default clientAPI;
