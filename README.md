# 🚀 Redis Explorer

Um aplicativo web moderno e intuitivo para gerenciar servidores Redis com interface bonita e funcionalidades completas.

## ✨ Funcionalidades

- **🔗 Conexão Simples**: Interface intuitiva para conectar ao Redis
- **💾 Persistência Local**: URL salva automaticamente no localStorage
- **🔍 Busca e Filtros**: Encontre chaves rapidamente com busca em tempo real
- **✏️ Edição de Valores**: Edite valores diretamente na interface
- **📄 Visualização JSON**: Formatação automática de estruturas complexas
- **➕ Criação de Chaves**: Crie novos pares chave-valor facilmente
- **🗑️ Exclusão**: Delete chaves com confirmação
- **🎨 Interface Moderna**: Design responsivo com tema escuro/claro

## 🛠️ Tecnologias

- **Next.js 16** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização moderna
- **Redis Client** - Comunicação com Redis
- **API Routes** - Backend seguro

## 🚀 Como Usar

### 🐳 Com Docker (Recomendado)

```bash
# Clone o repositório
git clone <repository-url>
cd redis-explorer

# Execute com Docker
./docker-scripts.sh dev
```

Acesse [http://localhost:3000](http://localhost:3000) - Redis estará disponível em `redis://localhost:6379`

### 📦 Instalação Manual

#### 1. Instalação

```bash
npm install
```

#### 2. Executar o Servidor

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

### 3. Conectar ao Redis

1. Digite a URL do seu servidor Redis
2. Exemplos de URL:
   - `redis://localhost:6379` (local sem autenticação)
   - `redis://user:password@host:port` (com autenticação)
   - `redis://redis-server:6379` (servidor remoto)

### 4. Gerenciar Chaves

- **Visualizar**: Clique em qualquer chave para ver detalhes
- **Buscar**: Use a barra de busca para filtrar chaves
- **Editar**: Clique em "Editar" para modificar valores
- **Criar**: Use o botão "Nova Chave" para adicionar chaves
- **Deletar**: Clique no ícone de lixeira para remover chaves

## 📋 Tipos de Dados Suportados

- **String**: Valores de texto simples
- **List**: Arrays ordenados
- **Set**: Conjuntos únicos
- **Hash**: Objetos chave-valor
- **ZSet**: Conjuntos ordenados

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` se necessário:

```env
REDIS_URL=redis://localhost:6379
```

### Docker (Opcional)

Para testar com Redis local:

```bash
docker run -d -p 6379:6379 redis:alpine
```

## 🎨 Interface

- **Design Responsivo**: Funciona perfeitamente em desktop e mobile
- **Tema Escuro**: Suporte automático ao tema do sistema
- **Animações Suaves**: Transições elegantes
- **Feedback Visual**: Loading states e mensagens de erro

## 🔒 Segurança

- **API Routes**: Comunicação segura com Redis
- **Validação**: Validação de entrada em todas as operações
- **Tratamento de Erros**: Mensagens de erro claras e úteis

## 📱 Responsividade

O aplicativo é totalmente responsivo e funciona perfeitamente em:
- 💻 Desktop
- 📱 Mobile
- 📟 Tablet

## 🚀 Deploy

### Vercel

```bash
npm run build
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique se o Redis está rodando
2. Confirme se a URL está correta
3. Verifique os logs do console
4. Abra uma issue no GitHub

---

**Desenvolvido com ❤️ usando Next.js e Redis**
