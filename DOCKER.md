# 🐳 Redis Explorer - Docker Setup

Este guia mostra como executar o Redis Explorer usando Docker e Docker Compose.

## 📋 Pré-requisitos

- Docker
- Docker Compose
- Git

## 🚀 Início Rápido

### Desenvolvimento (com hot reload)

```bash
# Usar o script helper
./docker-scripts.sh dev

# Ou usar docker-compose diretamente
docker-compose -f docker-compose.dev.yml up --build
```

### Produção

```bash
# Usar o script helper
./docker-scripts.sh prod

# Ou usar docker-compose diretamente
docker-compose up --build -d
```

## 📊 Comandos Disponíveis

### Script Helper

```bash
./docker-scripts.sh [comando]
```

**Comandos disponíveis:**
- `dev` - Modo desenvolvimento com hot reload
- `prod` - Modo produção
- `stop` - Parar todos os containers
- `logs` - Ver logs da aplicação
- `redis-cli` - Abrir Redis CLI
- `clean` - Limpar containers e volumes
- `status` - Status dos containers

### Docker Compose Direto

```bash
# Desenvolvimento
docker-compose -f docker-compose.dev.yml up --build

# Produção
docker-compose up --build -d

# Parar
docker-compose down

# Ver logs
docker-compose logs -f app

# Acessar Redis CLI
docker-compose exec redis redis-cli
```

## 🌐 Acesso

- **Aplicação**: http://localhost:3000
- **Redis**: localhost:6379

## 🔧 Configuração

### Variáveis de Ambiente

Você pode criar um arquivo `.env` para configurar:

```env
# Redis
REDIS_URL=redis://redis:6379

# Next.js
NODE_ENV=production
```

### Volumes

- `redis_data` - Dados persistentes do Redis
- `./:/app` - Código fonte (desenvolvimento)
- `/app/node_modules` - Dependências do Node.js

## 🛠️ Desenvolvimento

### Hot Reload

O modo desenvolvimento inclui hot reload automático:

```bash
./docker-scripts.sh dev
```

### Debugging

Para debugar a aplicação:

```bash
# Ver logs em tempo real
./docker-scripts.sh logs

# Acessar container
docker-compose exec app sh
```

## 🚀 Deploy em Produção

### Build e Deploy

```bash
# Build da imagem
docker-compose build

# Deploy
docker-compose up -d

# Verificar status
./docker-scripts.sh status
```

### Health Checks

O Redis inclui health check automático:

```bash
# Verificar saúde do Redis
docker-compose exec redis redis-cli ping
```

## 🧹 Limpeza

### Limpar Tudo

```bash
./docker-scripts.sh clean
```

### Limpeza Manual

```bash
# Parar e remover containers
docker-compose down

# Remover volumes
docker-compose down -v

# Limpar sistema Docker
docker system prune -f
```

## 📁 Estrutura de Arquivos

```
├── docker-compose.yml          # Produção
├── docker-compose.dev.yml      # Desenvolvimento
├── Dockerfile                  # Produção
├── Dockerfile.dev             # Desenvolvimento
├── docker-scripts.sh          # Script helper
├── .dockerignore              # Ignore para Docker
└── DOCKER.md                  # Esta documentação
```

## 🔍 Troubleshooting

### Problemas Comuns

1. **Porta já em uso**
   ```bash
   # Verificar portas em uso
   lsof -i :3000
   lsof -i :6379
   ```

2. **Container não inicia**
   ```bash
   # Ver logs
   docker-compose logs app
   ```

3. **Redis não conecta**
   ```bash
   # Verificar Redis
   docker-compose exec redis redis-cli ping
   ```

### Logs

```bash
# Logs da aplicação
docker-compose logs -f app

# Logs do Redis
docker-compose logs -f redis

# Todos os logs
docker-compose logs -f
```

## 📚 Comandos Úteis

```bash
# Rebuild sem cache
docker-compose build --no-cache

# Restart apenas a aplicação
docker-compose restart app

# Executar comando no container
docker-compose exec app npm run build

# Backup do Redis
docker-compose exec redis redis-cli --rdb /data/dump.rdb
```

## 🎯 Próximos Passos

1. Configure seu ambiente de desenvolvimento
2. Acesse http://localhost:3000
3. Conecte ao Redis usando `redis://localhost:6379`
4. Explore seus dados Redis!

---

**Dica**: Use `./docker-scripts.sh` para comandos rápidos e convenientes! 🚀
