TetriNET Web — CONTEXTO PARA CONTINUAÇÃO (cole no Codex local)

STATUS ATUAL (resumo)
- Monorepo mínimo funcionando com:
  - apps/server: Node + WebSocket + HTTP
  - apps/web: cliente de teste em JS puro para validar regras de sala/bombas
  - packages/shared: regras de bombas/fila/efeitos + testes
- O que já valida:
  - Fila de bombas FIFO
  - Sem cooldown
  - Limite da fila em 8 (cheia descarta novas)
  - Alvo inativo não consome bomba
  - Autoalvo permitido
  - Q (Quake) com embaralhamento horizontal imediato
- Regras de geração aplicadas:
  - 1 linha = 0 bombas
  - 2 linhas = 1 bomba
  - 3 linhas = 2 bombas
  - 4 linhas = 3 bombas

REGRAS FECHADAS (NÃO MUDAR SEM AVISAR)
1) Bombas suportadas no MVP: A,N,S,Q,G,C,R,B
2) Fila de bombas:
   - FIFO
   - sem cooldown
   - limite 8
   - fila cheia descarta novas bombas
3) Alvo pode ser qualquer jogador, incluindo o próprio jogador
4) Se alvo inativo/eliminado/desconectado:
   - efeito não aplica
   - bomba não é consumida
5) Quake (Q):
   - efeito imediato de deslocamento horizontal das linhas

PRÓXIMO PASSO PRIORITÁRIO
- Implementar loop completo de Tetris no cliente:
  - spawn, movimento, rotação, soft/hard drop, lock, line clear, game over
  - 7-bag + SRS + ghost ON + hold OFF (por enquanto)
- Depois integrar isso com o servidor autoritativo por tick/eventos.

NOTAS DE IMPLEMENTAÇÃO
- Manter servidor autoritativo como objetivo final.
- Preferir mudanças pequenas por PR.
- Adicionar testes sempre que possível.
- Em dúvida de regra de produto: registrar decisão em docs/decisions-open.md

PROMPT SUGERIDO (copiar e colar no Codex)
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