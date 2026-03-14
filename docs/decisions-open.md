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
- O servidor ja processa Switch de forma autoritativa no estado da sala.

Implementacao adotada:
- O evento `bombUsed` agora carrega `targetBoard` autoritativo.
- Quando o cliente e alvo, aplica esse board recebido mantendo a peca atualmente em queda.

Motivo:
- Garante comportamento correto de troca de campo sem perder a continuidade da peca ativa.

## 2026-03-14 - Limitacao de abas inativas no Milestone 1

Contexto:
- O loop do jogo ainda e cliente-local por aba.
- Navegadores podem reduzir fortemente timers ou suspender abas em segundo plano por politicas de economia de recursos.

Impacto observado:
- Em sessoes longas, um jogador em aba muito tempo inativa pode parar de atualizar temporariamente seu campo para os demais.
- Ao reativar a aba, a sincronizacao retoma.

Direcao:
- Tratar de forma definitiva no Milestone 2 com simulacao autoritativa no servidor.
