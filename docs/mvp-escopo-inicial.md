# TetriNET Web — Escopo Inicial de MVP (alinhamento revisado)

Este documento consolida as decisões aprovadas e atualiza os pontos pedidos no feedback:

1. **Todas as bombas listadas serão implementadas no MVP**.
2. **Mapeamento de teclas de alvo incluirá o próprio jogador** (algumas bombas podem ser autoalvo).
3. **Sem cooldown de uso de bomba**; ao usar, a bomba sai da fila e a próxima avança. **Fila máxima = 8**.

---

## 1) Alinhamento fechado sobre bombas S / Q / G

Alinhado com a sua memória do TetriNET clássico:

- **S (Switch)**: troca o campo do usuário com o campo do alvo.
- **Q (Quake)**: efeito imediato no campo do alvo, embaralhando as linhas horizontalmente (mais à esquerda ou à direita).
- **G (Gravity)**: aplica gravidade no campo do alvo, fazendo blocos descerem para preencher espaços vazios.

Esses efeitos permanecem como grupo tático separado (não são apenas "dano direto").

---

## 2) Melhorias modernas (sem perder identidade)

## MVP
- UI moderna com renderização fluida.
- Reconexão básica em partida.
- Espectador simples (somente leitura).
- Estatísticas básicas persistentes.

## Pós-MVP
- Ranked/matchmaking.
- Replays.
- Internacionalização adicional.

---

## 3) Regras de gameplay (base proposta)

- Rotação: **SRS**.
- Ghost piece: **ON**.
- Hold: **OFF** no MVP (pode virar feature futura).
- Geração de peças: **7-bag**.
- Velocidade: **fixa por sala**.
- Aceleração: **por tempo**.
- Modo inicial: **casual**.

Observação de balanceamento:
- Combos podem existir em modo leve.
- B2B e T-spin podem ficar para fase de refinamento (pós-primeiro ciclo de testes).

---

## 4) Bombas do MVP (implementação completa)

Conforme pedido, **todas as bombas abaixo entram no MVP**:

### Ataque/pressão
- **A (Add Line)**: adiciona linha de lixo no alvo.
- **N (Nuke parcial)**: remove faixa horizontal aleatória no alvo para desorganizar o campo.

### Táticas de campo
- **S (Switch)**: troca campos entre usuário e alvo.
- **Q (Quake)**: efeito imediato que embaralha horizontalmente as linhas do alvo (deslocando cada linha para esquerda/direita).
- **G (Gravity)**: aplica queda gravitacional dos blocos no campo do alvo.

### Utilitárias
- **C (Clear Line)**: limpa 1 linha no campo alvo (incluindo autoalvo).
- **R (Random Clear)**: limpa blocos aleatórios no campo alvo (incluindo autoalvo).

### Caos localizado
- **B (Block Bomb)**: explode uma região pequena do campo alvo.

---

## 5) Regra de geração de bombas (aprovada)

- Linha simples: 0 bombas.
- Linha dupla: 1 bomba.
- Linha tripla: 2 bombas.
- Quadra (4 linhas): 3 bombas.

As bombas entram em uma fila FIFO (primeira a entrar, primeira a sair).

---

## 6) Uso de bombas, alvo e fila

## Uso
- O jogador aciona uma tecla de alvo.
- O jogo tenta aplicar a bomba do topo da fila no alvo selecionado.
- Se o alvo estiver inativo/eliminado/desconectado, **nada acontece e a bomba não é consumida**.
- Se a aplicação for válida, a bomba usada sai da fila; a próxima avança automaticamente.

## Cooldown
- **Não haverá cooldown** entre usos, conforme solicitado.

## Fila
- **Tamanho máximo: 8 bombas**.
- Se a fila estiver cheia, novas bombas geradas são descartadas.

## Mapeamento de alvo (com autoalvo)
- O mapeamento de alvo deve incluir:
  - Jogador 1..6 (conforme posição na partida).
  - **Tecla para o próprio jogador** (autoalvo explícito).

Exemplo de UX recomendada:
- Teclas numéricas `1..6` apontam para slots de jogador.
- Se o slot corresponder ao jogador local, a bomba é aplicada em si mesmo.
- HUD mostra claramente quem é cada slot (nome + índice).

---

## 7) Lobbies e partida

- Salas com **2 a 6 jogadores**.
- Primeiro usuário vira líder por padrão.
- Liderança pode ser transferida.
- Líder inicia partida manualmente a qualquer momento.
- Chat apenas no lobby/espera.
- Espectador simples habilitado (sem controles avançados no MVP).

---

## 8) Arquitetura recomendada para implementação

- Frontend: React + TypeScript + Canvas2D.
- Backend: Node.js + TypeScript + WebSocket.
- Autoridade de jogo: servidor (estado oficial).
- Persistência: PostgreSQL (estatísticas e dados básicos de sessão).
- Região inicial: Brasil.

---

## 9) MVP fechado (checkpoint)

Este MVP inclui:
- Multiplayer casual 2–6 com início manual por líder.
- Regras de Tetris base + 7-bag + aceleração por tempo.
- **Todas as bombas listadas (A, N, S, Q, G, C, R, B).**
- Uso por fila sem cooldown, com limite de 8.
- Seleção de alvo incluindo autoalvo.
- Reconexão básica, chat de lobby, espectador simples, estatísticas persistentes.

---

## 10) Regras finais confirmadas

1. Fila cheia (8): **descartar novas bombas**.
2. Todas as bombas podem mirar **qualquer jogador**, inclusive **autoalvo**.
3. Alvo inativo/eliminado: **não aplica efeito e não consome bomba**.
4. `Q (Quake)`: efeito imediato de embaralhamento horizontal das linhas.
