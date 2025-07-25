# 🎓 ProfAI - Assistente Educacional com IA

<div align="center">
  <img src="https://img.shields.io/badge/React-18.0-blue?style=for-the-badge&logo=react"/>
  <img src="https://img.shields.io/badge/FastAPI-0.110.1-green?style=for-the-badge&logo=fastapi"/>
  <img src="https://img.shields.io/badge/MongoDB-5.0+-brightgreen?style=for-the-badge&logo=mongodb"/>
  <img src="https://img.shields.io/badge/OpenAI-GPT--4o--mini-orange?style=for-the-badge&logo=openai"/>
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript"/>
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css"/>
</div>

## 📝 Sobre o Projeto

**ProfAI** é uma plataforma educacional inteligente que utiliza IA para auxiliar estudantes do Ensino Fundamental (1º ao 9º ano) em suas atividades de aprendizagem. O sistema oferece três tipos de assistência: **Ajuda**, **Dicas** e **Respostas Completas**, cada uma com diferentes pontuações de XP e moedas para gamificar a experiência de aprendizado.

### 🎯 Principais Funcionalidades

- 🤖 **Chat Inteligente** com OpenAI GPT-4o-mini
- 🏆 **Sistema de Gamificação** (XP, moedas, níveis, conquistas)
- 📚 **Suporte Multi-Disciplinar** (todas as matérias do EF)
- 🎙️ **Funcionalidades Multimídia** (OCR, STT, TTS)
- 👤 **Perfis Personalizados** por série escolar
- 🌙 **Dark Mode** com persistência
- 📱 **Interface Responsiva** (mobile-first)

## 🚀 Demonstração

### Interface Principal
- **Dashboard:** Estatísticas de progresso, conquistas e ações rápidas
- **Chat:** Interface conversacional com botões de ação específicos
- **Perfil:** Configurações educacionais e estilo de IA personalizado

### Sistema de Pontuação
- **🆘 Quero Ajuda**: +10 XP, +2 moedas
- **💡 Dica**: +5 XP, +1 moeda  
- **✅ Ver Resposta**: +2 XP, +1 moeda

## 🛠️ Tecnologias Utilizadas

### Backend
- **FastAPI** - Framework web moderno e rápido
- **MongoDB** - Banco de dados NoSQL
- **OpenAI API** - Integração com GPT-4o-mini, Whisper, TTS
- **JWT** - Autenticação segura
- **Unstructured** - Processamento de documentos
- **Tesseract OCR** - Reconhecimento de texto em imagens
- **Motor** - Driver assíncrono para MongoDB

### Frontend  
- **React 18** - Biblioteca para interfaces de usuário
- **TypeScript** - Superset tipado do JavaScript
- **Tailwind CSS** - Framework CSS utility-first
- **Zustand** - Gerenciamento de estado
- **React Query** - Cache e sincronização de dados
- **Axios** - Cliente HTTP
- **Lucide React** - Ícones modernos

### Integrações
- **OpenAI Whisper** - Speech-to-Text
- **OpenAI TTS** - Text-to-Speech
- **Tesseract.js** - OCR em imagens
- **Unstructured** - Extração de texto de PDFs

## 📋 Pré-requisitos

- **Node.js** 18+ 
- **Python** 3.11+
- **MongoDB** 5.0+
- **OpenAI API Key**
- **Docker** (opcional)

## ⚙️ Instalação

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/profai.git
cd profai
```

### 2. Configuração do Backend

```bash
cd backend
pip install -r requirements.txt
```

Crie o arquivo `.env` baseado no `.env.example`:
```bash
cp .env.example .env
```

Configure as variáveis de ambiente:
```env
OPENAI_API_KEY=sk-proj-sua-chave-openai-aqui
MONGO_URL=mongodb://localhost:27017
MONGO_DB=profai
JWT_SECRET=seu_secret_jwt_super_seguro
JWT_EXPIRES_IN=900
JWT_REFRESH_EXPIRES_IN=2592000
STORAGE_DRIVER=local
LOCAL_STORAGE_PATH=./storage
MODEL_NAME=gpt-4o-mini
MAX_HISTORY_MESSAGES=30
SUMMARIZE_AFTER_MESSAGES=100
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. Configuração do Frontend

```bash
cd frontend
yarn install
```

Configure o arquivo `.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 4. Inicialização dos Serviços

#### Usando Docker (Recomendado)
```bash
docker-compose up -d
```

#### Manual
```bash
# Terminal 1 - MongoDB
mongod --dbpath ./data/db

# Terminal 2 - Backend
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 3 - Frontend  
cd frontend
yarn start
```

## 📚 Uso do Sistema

### 1. Registro e Login
- Acesse `http://localhost:3000`
- Crie uma conta informando série escolar (1º ao 9º EF)
- Escolha o estilo de IA preferido
- Faça login para acessar o dashboard

### 2. Dashboard
- Visualize seu progresso (XP, moedas, nível)
- Acompanhe suas conquistas
- Acesse ações rápidas (nova conversa, editar perfil)

### 3. Chat Educacional
- Crie nova conversa selecionando a matéria
- Digite sua dúvida ou pergunta
- Escolha o tipo de ajuda:
  - **Quero Ajuda**: Orientações e dicas
  - **Dica**: Pistas específicas
  - **Ver Resposta**: Solução completa

### 4. Recursos Multimídia
- **📄 Upload de PDF**: Extração automática de texto
- **🖼️ Upload de Imagem**: OCR para reconhecer texto
- **🎙️ Gravação de Áudio**: Speech-to-Text
- **🔊 Ouvir Resposta**: Text-to-Speech

## 🔌 API Endpoints

### Autenticação
```http
POST /api/auth/register     # Registro de usuário
POST /api/auth/login        # Login
GET  /api/auth/me          # Dados do usuário atual
PUT  /api/auth/profile     # Atualizar perfil
```

### Chat e Conversas
```http
POST /api/conversations           # Criar conversa
GET  /api/conversations          # Listar conversas
GET  /api/conversations/{id}/messages  # Mensagens da conversa
POST /api/chat                   # Enviar mensagem
```

### Funcionalidades
```http
GET  /api/dashboard             # Dados do dashboard
GET  /api/grades               # Séries escolares disponíveis
GET  /api/subjects             # Matérias disponíveis
GET  /api/ai-styles            # Estilos de IA disponíveis
```

### Multimídia
```http
POST /api/files/upload         # Upload de arquivos (PDF/imagem)
POST /api/audio/stt           # Speech-to-Text
POST /api/audio/tts           # Text-to-Speech
```

### Monitoramento
```http
GET  /api/health              # Status da API
```

## 📁 Estrutura do Projeto

```
profai/
├── backend/                  # API FastAPI
│   ├── server.py            # Aplicação principal
│   ├── requirements.txt     # Dependências Python
│   └── .env.example        # Exemplo de configuração
├── frontend/               # Interface React
│   ├── src/
│   │   ├── App.js         # Componente principal
│   │   ├── App.css        # Estilos customizados
│   │   └── index.js       # Ponto de entrada
│   ├── package.json       # Dependências Node.js
│   └── .env.example       # Exemplo de configuração
├── storage/               # Arquivos uploadados
├── docker-compose.yml     # Configuração Docker
├── .gitignore
└── README.md
```

## 🎨 Personalização

### Estilos de IA Disponíveis
- **Paciente**: Explicações detalhadas e passo a passo
- **Direto**: Respostas objetivas e concisas  
- **Poético**: Linguagem criativa e inspiradora
- **Motivacional**: Encorajador e positivo

### Séries Suportadas
- 1º ao 9º ano do Ensino Fundamental
- Conteúdo adaptado para cada faixa etária

### Matérias Disponíveis
- Matemática, Português, Ciências
- História, Geografia, Inglês
- Física, Química, Biologia
- Redação, Artes, Educação Física
- Filosofia, Sociologia, Tema Livre

## 🧪 Testes

### Backend
```bash
cd backend
pytest tests/ -v
```

### Frontend
```bash
cd frontend
yarn test
```

### Testes E2E
```bash
# Certifique-se que os serviços estão rodando
yarn test:e2e
```

## 📦 Deploy

### Deploy com Docker
```bash
# Build das imagens
docker-compose build

# Deploy em produção
docker-compose -f docker-compose.prod.yml up -d
```

### Deploy Manual

#### Backend (FastAPI)
```bash
pip install -r requirements.txt
gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

#### Frontend (React)
```bash
yarn build
# Servir pasta build/ com nginx ou servidor web
```

### Variáveis de Ambiente de Produção
```env
# Backend
MONGO_URL=mongodb://seu-mongodb-host:27017
ALLOWED_ORIGINS=https://seu-dominio.com
STORAGE_DRIVER=s3  # Para arquivos em produção
S3_BUCKET=seu-bucket-s3

# Frontend  
REACT_APP_BACKEND_URL=https://api.seu-dominio.com
```

## 🔒 Segurança

- **JWT Tokens** com expiração configurável
- **CORS** configurado para domínios específicos
- **Rate Limiting** para prevenir abuso
- **Validação** de dados de entrada
- **Hash seguro** de senhas com bcrypt
- **Sanitização** de uploads de arquivos

## 🔧 Configurações Avançadas

### Personalização do Modelo OpenAI
```env
MODEL_NAME=gpt-4o-mini  # Ou gpt-4, gpt-3.5-turbo
```

### Configuração de Memória
```env
MAX_HISTORY_MESSAGES=30        # Mensagens na janela de contexto
SUMMARIZE_AFTER_MESSAGES=100   # Quando criar resumo automático
```

### Storage de Arquivos
```env
# Local
STORAGE_DRIVER=local
LOCAL_STORAGE_PATH=./storage

# AWS S3
STORAGE_DRIVER=s3
S3_BUCKET=profai-files
S3_REGION=us-east-1
S3_ACCESS_KEY=sua-access-key
S3_SECRET_KEY=sua-secret-key
```

## 🐛 Solução de Problemas

### Problemas Comuns

#### 1. Erro de Conexão MongoDB
```bash
# Verifique se o MongoDB está rodando
mongod --version
# ou com Docker
docker run -d -p 27017:27017 mongo:latest
```

#### 2. API Key OpenAI Inválida
- Verifique se a chave está correta no `.env`
- Confirme que tem créditos na conta OpenAI
- Teste a chave: `curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models`

#### 3. Problemas de CORS
```env
# Backend .env
ALLOWED_ORIGINS=http://localhost:3000,https://seu-dominio.com
```

#### 4. Upload de Arquivos Falha
```bash
# Verifique permissões da pasta storage
mkdir -p ./storage
chmod 755 ./storage
```

### Logs e Debug
```bash
# Backend logs
tail -f /var/log/supervisor/backend.*.log

# Frontend logs  
yarn start  # Modo desenvolvimento mostra logs no console
```

## 🤝 Contribuição

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add: Minha nova feature'`)
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. Abra um **Pull Request**

### Guidelines de Contribuição
- Siga o padrão de código existente
- Adicione testes para novas funcionalidades
- Atualize a documentação quando necessário
- Use commits semânticos (feat:, fix:, docs:, etc.)

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Seu Nome** - *Desenvolvimento Principal* - [@seu-github](https://github.com/seu-usuario)

## 🙏 Agradecimentos

- [OpenAI](https://openai.com/) pela API de IA
- [FastAPI](https://fastapi.tiangolo.com/) pelo framework web
- [React](https://reactjs.org/) pela biblioteca de interface
- [MongoDB](https://www.mongodb.com/) pelo banco de dados
- [Tailwind CSS](https://tailwindcss.com/) pelo framework CSS

## 📞 Suporte

- **Email**: suporte@profai.com
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/profai/issues)
- **Documentação**: [Wiki do Projeto](https://github.com/seu-usuario/profai/wiki)

---

<div align="center">
  <p>Feito com ❤️ para educação</p>
  <p>ProfAI © 2025 - Todos os direitos reservados</p>
</div>