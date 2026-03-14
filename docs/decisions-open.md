# Decisoes em Aberto

## 2026-03-14 - Curva de aceleracao local (Milestone 1)

Contexto:
- A fonte de verdade define aceleracao por tempo, mas nao fixa uma curva numerica para o loop local temporario.

Implementacao minima adotada:
- Gravidade inicial em 1000 ms por queda.
- A cada 30 segundos, reduz 80 ms.
- Piso minimo em 120 ms.

Motivo:
- Permite partida solo fluida no cliente sem bloquear o milestone.
- Mantem espaco para alinhar a curva oficial no Milestone 2 (servidor autoritativo).

## 2026-03-14 - Bomba S (Switch) no loop local temporario

Contexto:
- Com o cliente ainda nao autoritativo para board completo, o servidor nao possui estado suficiente para trocar campos reais em tempo real no Milestone 1.

Implementacao minima adotada:
- Evento de bomba aplicado no cliente para A, N, Q, G, C, R e B quando o jogador e alvo.
- Para S (Switch), o efeito local fica desativado temporariamente ate a sincronizacao autoritativa do Milestone 2.

Motivo:
- Evita comportamento incorreto de troca parcial de campo entre clientes nao sincronizados.
