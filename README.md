# TetriNET Web (versão de teste MVP)

Esta versão já está pronta para **teste manual rápido** com 2 abas do navegador.

## O que foi implementado

- Servidor autoritativo com HTTP + WebSocket em `apps/server/src/index.ts`.
- Cliente web de teste em `apps/web` para validar fluxo multiplayer.
- Núcleo compartilhado de regras em `packages/shared`.
- Todas as bombas: `A, N, S, Q, G, C, R, B`.
- Regras confirmadas:
  - fila FIFO com máximo 8;
  - sem cooldown;
  - fila cheia descarta novas bombas;
  - alvo inativo não recebe efeito e não consome bomba;
  - autoalvo permitido.

## Rodar localmente

```bash
npm install
npm run dev:server
```

Abra:
- `http://localhost:8080`

## Como testar em 2 abas

1. Aba 1: entre com `jogador-1`.
2. Aba 2: entre com `jogador-2`.
3. Na aba do líder, clique em **Iniciar**.
4. Clique em `+2/+3/+4 linhas` para gerar bombas.
5. Selecione alvo e clique em **Usar próxima bomba**.
6. Verifique fila e logs.

## Observações

Este cliente web é propositalmente simples e focado em validação de regras do MVP.
A próxima etapa é acoplar o loop completo de Tetris (spawn/queda/lock/clear) no frontend.