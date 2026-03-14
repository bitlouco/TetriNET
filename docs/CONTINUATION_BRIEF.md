# CONTINUATION BRIEF — TetriNET Web (para Codex local)

## 1) Contexto e objetivo

Projeto: recriação web inspirada no TetriNET clássico (multiplayer até 6 jogadores), com regras modernas mínimas e foco inicial em MVP jogável.

Status atual:
- Base técnica inicial já criada (workspace, pacote compartilhado, servidor WebSocket/HTTP e cliente web de teste).
- Regras de bombas e fila já definidas e implementadas no núcleo compartilhado.
- Documentação principal existe em:
  - `docs/mvp-escopo-inicial.md`
  - `README.md`
  - `README.txt`

Objetivo da continuidade:
- Evoluir do protótipo atual para um MVP realmente jogável (loop de Tetris + sincronização multiplayer confiável + UX mínima de partida).

---

## 2) Fonte de verdade (não quebrar)

### Regras de bombas e fila (fechadas)
1. Bombas suportadas: `A, N, S, Q, G, C, R, B`.
2. Geração por linhas limpas:
   - 1 linha: 0 bombas
   - 2 linhas: 1 bomba
   - 3 linhas: 2 bombas
   - 4 linhas: 3 bombas
3. Fila de bombas:
   - FIFO
   - sem cooldown
   - máximo 8
   - fila cheia descarta novas bombas
4. Alvo:
   - qualquer jogador, inclusive autoalvo
   - alvo inativo/eliminado/desconectado: não aplica efeito e não consome bomba
5. `Q (Quake)`:
   - efeito imediato de embaralhamento horizontal das linhas

### Regras gerais MVP
- Sala casual: 2 a 6 jogadores
- Líder inicia partida manualmente
- Servidor autoritativo
- Região inicial: Brasil
- Frontend desktop-first

---

## 3) Estado atual de implementação (resumo técnico)

- `packages/shared`: tipos e mecânicas base (bombas/fila/uso) + testes unitários.
- `apps/server`: servidor HTTP + WebSocket com mensagens (`join`, `start`, `lineClear`, `useBomb`) e broadcast de `roomState`.
- `apps/web`: cliente simples para validar fluxo em 2 abas.

Lacunas principais:
- Loop completo de Tetris no cliente (spawn, queda, lock, clear, game over).
- Sincronização de estado de partida mais estruturada (tick/eventos).
- UX in-game melhor (board real, previews e HUD de combate).
- Persistência real de estatísticas (PostgreSQL) ainda não integrada.

---

## 4) Milestones curtos (1 PR por milestone)

## Milestone 1 — Loop local de Tetris (cliente)
**Objetivo:** tornar o cliente jogável mesmo antes do multiplayer completo.

Entregas:
- Implementar motor de peça no cliente:
  - spawn
  - movimento lateral
  - rotação
  - soft drop / hard drop
  - lock delay básico
  - line clear
  - game over
- Regras base aprovadas:
  - 7-bag
  - SRS
  - ghost ON
  - hold OFF (por enquanto)
- Renderização do board em canvas com HUD mínima.

Critério de pronto:
- Usuário consegue jogar uma partida solo local no browser sem travar.

---

## Milestone 2 — Integração cliente ↔ servidor autoritativo (partida)
**Objetivo:** transformar a partida em sessão multiplayer autoritativa.

Entregas:
- Cliente envia input de jogo ao servidor (ao invés de enviar apenas `lineClear`).
- Servidor processa estado autoritativo por tick (ou eventos determinísticos).
- Broadcast incremental de estado para clientes.
- Estruturar estados de partida:
  - lobby
  - countdown
  - running
  - finished

Critério de pronto:
- 2 jogadores conseguem jogar simultaneamente e ver estado consistente.

---

## Milestone 3 — Sistema de combate e HUD multiplayer
**Objetivo:** fechar UX mínima de combate TetriNET.

Entregas:
- HUD da fila de bombas por jogador.
- Seleção de alvo por teclado (incluindo autoalvo).
- Feedback visual de bomba usada (consumida/não consumida e motivo).
- Painel lateral com mini-boards dos outros jogadores.

Critério de pronto:
- Combate de bombas funcional e legível em 2 abas.

---

## Milestone 4 — Confiabilidade de sessão e reconexão
**Objetivo:** reduzir fricção em testes reais.

Entregas:
- Reconexão por `playerId` + janela de tolerância.
- Rejoin em sala/partida ativa sem corromper estado.
- Tratamento robusto de desconexão e inatividade.

Critério de pronto:
- Jogador consegue reconectar sem quebrar partida.

---

## Milestone 5 — Persistência de estatísticas (PostgreSQL)
**Objetivo:** começar camada de dados do MVP.

Entregas:
- Schema mínimo:
  - `players`
  - `matches`
  - `player_match_stats`
- Persistência ao final da partida:
  - linhas limpas
  - bombas usadas
  - tempo vivo
  - posição final

Critério de pronto:
- Partidas finalizadas gravam stats consultáveis.

---

## 5) Guardrails para o Codex local

1. Não alterar regras já fechadas de bombas/fila sem solicitar validação explícita.
2. Manter PRs pequenos e testáveis (evitar “mega PR”).
3. Sempre incluir:
   - resumo técnico
   - comandos executados
   - limitações do ambiente
4. Priorizar mudanças incrementais com testes.
5. Se houver dúvida de produto, registrar em `docs/decisions-open.md` em vez de assumir regra.

---

## 6) Prompt recomendado para colar no Codex local

```txt
Você está continuando o projeto TetriNET Web neste repositório.

Leia primeiro (fonte de verdade):
1) docs/mvp-escopo-inicial.md
2) docs/CONTINUATION_BRIEF.md
3) README.md
4) README.txt

Contexto crítico que NÃO pode ser quebrado:
- Bombas suportadas: A,N,S,Q,G,C,R,B
- Regras de geração: 1 linha=0, 2=1, 3=2, 4=3 bombas
- Fila de bombas: FIFO, sem cooldown, máximo 8, fila cheia descarta novas
- Alvo: qualquer jogador inclusive autoalvo
- Alvo inativo/eliminado/desconectado: não aplica efeito e não consome bomba
- Q (Quake): efeito imediato de embaralhamento horizontal das linhas
- Servidor deve permanecer autoritativo

Tarefa desta sessão:
Implementar o Milestone 1 do CONTINUATION_BRIEF:
- loop completo local de Tetris no cliente (spawn, movimento, rotação, soft/hard drop, lock, line clear, game over)
- 7-bag + SRS + ghost ON + hold OFF
- render em canvas e HUD mínima

Requisitos de execução:
- Faça mudanças incrementais e pequenas
- Adicione/ajuste testes quando possível
- Rode os comandos de validação disponíveis
- No final, entregue:
  1) resumo das mudanças
  2) comandos executados e status
  3) próximos passos propostos (Milestone 2)

Se encontrar ambiguidades de produto, não invente regra: registre em docs/decisions-open.md e siga com a implementação bloqueante mínima.
```

---

## 7) Sugestão de fluxo operacional no seu Windows

1. Abrir a pasta do projeto no Codex local.
2. Colar o prompt da seção 6.
3. Pedir implementação de 1 milestone por vez.
4. Validar no navegador ao fim de cada milestone.
5. Só então avançar para o próximo.

