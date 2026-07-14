# Ambiente de demonstração

Sobe o Burrow inteiro já populado com serviços fictícios — Proxmox, Jellyfin, Grafana,
qBittorrent e companhia — para você ver como o dashboard fica **antes** de cadastrar os
seus. Nada aqui aponta para um serviço real: os domínios são `example.com` e os IPs são
da faixa `10.0.0.0/8`.

## Subindo

```bash
cp .env.example .env
# edite o .env: ponha o seu e-mail e o seu Google Client ID
docker compose up -d --build
```

Pronto: http://localhost:8090

Você só precisa ajustar duas coisas no `.env` — o e-mail que vai poder logar e o Client ID
do Google. O resto (banco, dados de exemplo, portas) já vem configurado.

## Como os dados entram

O `seed/01-demo-data.js` é montado em `/docker-entrypoint-initdb.d` do container do Mongo.
Esse diretório tem uma propriedade importante: o Mongo só executa o que está nele na
**primeira** subida, quando o volume de dados ainda está vazio. Se o banco já tem qualquer
coisa dentro, o arquivo é ignorado.

Na prática, isso quer dizer que o seed não tem como apagar ou sobrescrever nada. E também
que, se você quiser recomeçar do zero depois de mexer nos dados, precisa destruir o volume:

```bash
docker compose down -v && docker compose up -d
```

## Isolamento

Esta stack usa `name: burrow-demo` e um volume próprio (`demo-data`), num banco separado
(`burrow_demo`). Ela não encosta no compose da raiz nem nos seus dados de verdade — dá para
rodar os dois, só não ao mesmo tempo, porque ambos publicam a porta 8090.
