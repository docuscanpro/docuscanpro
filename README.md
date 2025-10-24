# DocuScan Pro

Sistema completo de processamento inteligente de documentos com OCR, tradução, assinatura digital e conversão de formatos.

## 🚀 Funcionalidades

- **Captura de Imagens**: Câmera e upload de arquivos
- **OCR**: Extração de texto de imagens
- **Tradução**: Tradução de textos com suporte a áudio
- **Conversão**: Conversão entre formatos de imagem e documento
- **Assinatura Digital**: Criação e aplicação de assinaturas
- **Gerenciamento**: Histórico e organização de documentos

## 🛠️ Tecnologias

### Frontend
- React 18 + Vite
- Tailwind CSS + shadcn/ui
- Framer Motion
- React Query

### Backend
- Node.js + Express
- Tesseract.js (OCR)
- Canvas (processamento de imagens)
- Multer (upload de arquivos)

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação Completa

```bash
# Clone o repositório
git clone <seu-repositorio>
cd docuscan-pro

# Instale as dependências do frontend
npm install

# Instale as dependências do backend
cd backend
npm install
cd ..

# Inicie ambos os serviços
npm run dev:full
