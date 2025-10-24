#!/bin/bash

# DocuScan Pro - Script de Deploy Automatizado
# Este script prepara o projeto para deploy em produção

set -e  # Para o script em caso de erro

echo "🚀 Iniciando deploy do DocuScan Pro..."
echo "==========================================="

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js 18+"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale o npm"
    exit 1
fi

echo "✅ npm encontrado: $(npm --version)"

# Configurações
FRONTEND_DIR="."
BACKEND_DIR="backend"
DIST_DIR="dist"
UPLOADS_DIR="backend/uploads"

# Função para criar diretórios se não existirem
create_directories() {
    echo "📁 Criando diretórios necessários..."
    
    # Criar diretório de uploads se não existir
    if [ ! -d "$UPLOADS_DIR" ]; then
        mkdir -p "$UPLOADS_DIR"
        echo "✅ Diretório de uploads criado: $UPLOADS_DIR"
    fi
    
    # Criar arquivo .gitkeep nos uploads
    touch "$UPLOADS_DIR/.gitkeep"
}

# Função para verificar variáveis de ambiente
check_environment() {
    echo "🔍 Verificando variáveis de ambiente..."
    
    # Verificar se o arquivo .env existe no backend
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        echo "⚠️  Arquivo $BACKEND_DIR/.env não encontrado"
        echo "📝 Criando arquivo de configuração padrão..."
        
        cat > "$BACKEND_DIR/.env" << EOF
# Backend Environment Variables
PORT=3001
NODE_ENV=production
GEMINI_API_KEY=your_gemini_api_key_here
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_ORIGINS=http://localhost:3000,https://seusite.com
EOF
        echo "✅ Arquivo $BACKEND_DIR/.env criado com configurações padrão"
        echo "📋 Lembre-se de configurar suas API keys antes do deploy em produção"
    fi
    
    # Verificar se o arquivo .env existe no frontend
    if [ ! -f ".env" ]; then
        echo "⚠️  Arquivo .env não encontrado no frontend"
        echo "📝 Criando arquivo de configuração padrão..."
        
        cat > ".env" << EOF
# Frontend Environment Variables
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=DocuScan Pro
VITE_APP_VERSION=1.0.0
EOF
        echo "✅ Arquivo .env criado com configurações padrão"
    fi
}

# Função para instalar dependências do frontend
install_frontend_deps() {
    echo "📦 Instalando dependências do frontend..."
    cd "$FRONTEND_DIR"
    
    # Verificar se node_modules existe
    if [ ! -d "node_modules" ]; then
        echo "📥 Instalando todas as dependências..."
        npm install
    else
        echo "🔄 Atualizando dependências..."
        npm update
    fi
    
    echo "✅ Dependências do frontend instaladas/atualizadas"
}

# Função para instalar dependências do backend
install_backend_deps() {
    echo "📦 Instalando dependências do backend..."
    cd "$BACKEND_DIR"
    
    # Verificar se node_modules existe
    if [ ! -d "node_modules" ]; then
        echo "📥 Instalando todas as dependências..."
        npm install
    else
        echo "🔄 Atualizando dependências..."
        npm update
    fi
    
    echo "✅ Dependências do backend instaladas/atualizadas"
    cd ..
}

# Função para build do frontend
build_frontend() {
    echo "🏗️  Realizando build do frontend..."
    cd "$FRONTEND_DIR"
    
    # Verificar se o Vite está disponível
    if ! npx vite --version &> /dev/null; then
        echo "❌ Vite não encontrado. Instalando..."
        npm install --save-dev vite
    fi
    
    # Executar build
    echo "🔨 Executando build de produção..."
    npm run build
    
    # Verificar se o build foi bem-sucedido
    if [ -d "$DIST_DIR" ]; then
        echo "✅ Build do frontend concluído com sucesso!"
        echo "📁 Arquivos gerados em: $DIST_DIR"
    else
        echo "❌ Erro: Diretório $DIST_DIR não foi criado"
        exit 1
    fi
    
    cd ..
}

# Função para preparar backend para produção
prepare_backend() {
    echo "🔧 Preparando backend para produção..."
    cd "$BACKEND_DIR"
    
    # Instalar apenas dependências de produção
    echo "📥 Instalando dependências de produção..."
    npm install --production
    
    # Criar script de start para produção
    cat > "start.sh" << 'EOF'
#!/bin/bash
# Script de start para produção - DocuScan Pro Backend

echo "🚀 Iniciando DocuScan Pro Backend em produção..."
echo "📍 Porta: ${PORT:-3001}"
echo "🌐 Ambiente: ${NODE_ENV:-production}"

# Verificar se as variáveis de ambiente necessárias estão definidas
if [ -z "$GEMINI_API_KEY" ] || [ "$GEMINI_API_KEY" = "your_gemini_api_key_here" ]; then
    echo "⚠️  AVISO: GEMINI_API_KEY não configurada. Algumas funcionalidades podem não funcionar."
fi

# Iniciar o servidor
node server.js
EOF
    
    chmod +x start.sh
    
    echo "✅ Backend preparado para produção"
    cd ..
}

# Função para criar arquivos de configuração do servidor
create_server_configs() {
    echo "📄 Criando arquivos de configuração do servidor..."
    
    # PM2 ecosystem file
    cat > "ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'docuscan-pro-backend',
    script: './backend/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

    # Nginx configuration
    cat > "nginx.conf" << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend (Vite build)
    location / {
        root /var/www/docuscan-pro/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Uploads
    location /uploads {
        root /var/www/docuscan-pro/backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
EOF

    # Dockerfile
    cat > "Dockerfile" << 'EOF'
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
COPY backend/package*.json ./backend/

RUN npm install
RUN cd backend && npm install

# Bundle app source
COPY . .
COPY backend/ ./backend/

# Build frontend
RUN npm run build

# Create uploads directory
RUN mkdir -p backend/uploads

EXPOSE 3001

# Start the application
CMD [ "node", "backend/server.js" ]
EOF

    # Docker Compose
    cat > "docker-compose.yml" << 'EOF'
version: '3.8'

services:
  docuscan-pro:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    volumes:
      - ./backend/uploads:/app/backend/uploads
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./dist:/var/www/docuscan-pro/dist
      - ./backend/uploads:/var/www/docuscan-pro/backend/uploads
    depends_on:
      - docuscan-pro
    restart: unless-stopped
EOF

    echo "✅ Arquivos de configuração criados:"
    echo "   - ecosystem.config.js (PM2)"
    echo "   - nginx.conf (Nginx)"
    echo "   - Dockerfile"
    echo "   - docker-compose.yml"
}

# Função para criar script de deploy específico para plataformas
create_platform_scripts() {
    echo "🔧 Criando scripts específicos para plataformas..."
    
    # Script para Vercel
    cat > "vercel.json" << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
EOF

    # Script para Heroku
    cat > "Procfile" << 'EOF'
web: cd backend && npm start
EOF

    # Script para Railway
    cat > "railway.json" << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && npm start"
  }
}
EOF

    echo "✅ Scripts de plataforma criados:"
    echo "   - vercel.json (Vercel)"
    echo "   - Procfile (Heroku)"
    echo "   - railway.json (Railway)"
}

# Função para criar documentação de deploy
create_deploy_docs() {
    echo "📚 Criando documentação de deploy..."
    
    cat > "DEPLOY.md" << 'EOF'
# Guia de Deploy - DocuScan Pro

## 🚀 Deploy Rápido

### Opção 1: Deploy com Docker (Recomendado)
```bash
# 1. Configure as variáveis de ambiente
export GEMINI_API_KEY=sua_chave_aqui

# 2. Execute o deploy
docker-compose up -d
