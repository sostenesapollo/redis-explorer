# Correções para Conexões Redis Externas

## Problemas Identificados e Soluções

### 1. **Configuração de Timeout**
**Problema:** Conexões externas não tinham timeout configurado, causando travamentos.

**Solução:** Implementado timeout de 10 segundos para conexões e comandos.

### 2. **Estratégia de Reconexão**
**Problema:** Falhas de conexão não eram tratadas adequadamente.

**Solução:** Implementada estratégia de reconexão com retry exponencial.

### 3. **Validação de URL**
**Problema:** URLs inválidas não eram validadas antes da conexão.

**Solução:** Adicionada validação de URL Redis (redis:// ou rediss://).

### 4. **Tratamento de Erros**
**Problema:** Erros não eram logados adequadamente para debug.

**Solução:** Implementado logging detalhado e informações de debug.

### 5. **Gerenciamento de Conexões**
**Problema:** Conexões não eram fechadas adequadamente.

**Solução:** Implementado gerenciamento seguro de conexões com finally blocks.

## Melhorias Implementadas

### Arquivo: `src/app/utils/redis-client.ts`
- Função `createRedisClient()` com configurações otimizadas
- Validação de URL Redis
- Configuração de timeouts e retry
- Handlers de eventos para debug
- Função `safeDisconnect()` para fechamento seguro

### Arquivo: `src/app/api/redis/logs/route.ts`
- Endpoint para obter informações de debug do Redis
- Informações do servidor (versão, uptime, memória)
- Configurações do Redis

### Melhorias na Interface
- Painel de debug que aparece quando há erros
- Informações detalhadas do servidor Redis
- Botão para mostrar/ocultar informações de debug

## Como Usar

### 1. **Para Redis Local**
```
redis://localhost:6379
```

### 2. **Para Redis Externo**
```
redis://usuario:senha@host:porta
rediss://usuario:senha@host:porta  # Para conexões SSL
```

### 3. **Debug de Problemas**
1. Quando houver erro de conexão, clique em "Mostrar Debug"
2. Verifique as informações do servidor
3. Confirme se a URL está correta
4. Verifique se o Redis está acessível

## Configurações Recomendadas

### Para Redis Externo
- **Timeout:** 10 segundos (padrão)
- **Retry:** 3 tentativas
- **SSL:** Use `rediss://` para conexões seguras

### Para Redis Local
- **Timeout:** 5 segundos (mais rápido)
- **Retry:** 1 tentativa

## Troubleshooting

### Erro: "Connection refused"
- Verifique se o Redis está rodando
- Confirme a porta (padrão: 6379)
- Verifique firewall

### Erro: "Authentication failed"
- Verifique usuário e senha
- Confirme se a autenticação está habilitada

### Erro: "Timeout"
- Verifique conectividade de rede
- Aumente o timeout se necessário
- Verifique se o Redis não está sobrecarregado

### Erro: "SSL/TLS"
- Use `rediss://` para conexões SSL
- Verifique certificados se necessário

## Logs e Debug

Os logs são automaticamente capturados e podem ser visualizados:
1. No console do servidor (terminal)
2. Na interface web (botão "Mostrar Debug")
3. Informações incluem versão, configurações e status do Redis
