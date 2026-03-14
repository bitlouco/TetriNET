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
