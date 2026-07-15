# Burrow

*[Read in English](README.md)*

Dashboard homelab self-hosted — Angular + Express + MongoDB, com login pelo Google e edição na própria interface.

Um painel para os serviços que você hospeda em casa. Diferente de um dashboard estático,
as seções e os serviços são cadastráveis pela própria interface: você adiciona, edita,
reordena e escolhe ícones sem mexer em HTML nem redeployar nada.

A interface está disponível em inglês, português e espanhol — segue o idioma do navegador
e pode ser trocada a qualquer momento em Configurações → Idioma.

## Stack

- **Frontend** — Angular (standalone components), servido por Nginx.
- **Backend** — Express + Mongoose, com verificação de token do Google.
- **Banco** — MongoDB.
- **Deploy** — Docker Compose, feito para viver atrás de um reverse proxy (ex.: Nginx Proxy Manager).

## Experimentando

Se você só quer ver como o dashboard fica, comece pelo [ambiente de demonstração](example/):
ele sobe a stack inteira já populada com serviços fictícios, e você só ajusta o seu e-mail.

```bash
cd example
cp .env.example .env   # ponha o seu e-mail e o seu Google Client ID
docker compose up -d --build
```

## Rodando de verdade

Pré-requisitos: Docker e Docker Compose.

```bash
cp .env.example .env
# preencha GOOGLE_CLIENT_ID e ALLOWED_EMAILS
docker compose up -d --build
```

O dashboard sobe em `http://localhost:8090`, vazio — você cadastra as seções e os serviços
pela própria interface.

## Configuração

Todas as variáveis vivem no `.env`, que nunca é commitado — veja o `.env.example`:

| Variável | Para que serve |
| --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID (Web) do Google Cloud Console. As *Authorized JavaScript origins* precisam incluir a origem de onde o app é servido. |
| `ALLOWED_EMAILS` | Allowlist de e-mails autorizados a logar, separados por vírgula. |
| `MONGO_URI` | Connection string do Mongo. O default aponta para o container do compose. |

O acesso é fechado por allowlist: o backend valida o token do Google e recusa qualquer
e-mail que não esteja em `ALLOWED_EMAILS`.

## Configurando o Google OAuth (GCP)

O `GOOGLE_CLIENT_ID` é criado no [Google Cloud Console](https://console.cloud.google.com/).
Faça isso uma vez e reutilize o mesmo Client ID em todos os ambientes:

1. **Crie/selecione um projeto** — barra do topo → seletor de projeto → *Novo Projeto* (ou use um existente).
2. **Configure a tela de consentimento OAuth** — *APIs e Serviços → Tela de permissão OAuth*. Escolha
   **Externo**, preencha o nome do app e o e-mail de suporte e, em *Usuários de teste*, adicione todos
   os e-mails com que você vai logar (os mesmos que você vai colocar em `ALLOWED_EMAILS`).
3. **Crie a credencial** — *APIs e Serviços → Credenciais → Criar credenciais → ID do cliente OAuth*.
   Tipo de aplicativo: **Aplicativo da Web**.
4. **Adicione as Authorized JavaScript origins** (Origens JavaScript autorizadas) — é de onde o app é
   servido. Adicione todas as origens de onde você vai logar, por exemplo:

   | Ambiente | Origem |
   | --- | --- |
   | Produção | `https://dashboard.seu-dominio.com` |
   | Local (rodando de verdade) | `http://localhost:8090` |
   | Local (demo/testes) | `http://localhost:4200` |

   Ajuste as entradas para o seu cenário — a origem (esquema + host + porta) precisa bater
   exatamente, e você pode adicionar mais depois sem recriar a credencial.
5. **Copie o Client ID gerado** (algo como `xxxxxxxx.apps.googleusercontent.com`) para o
   `GOOGLE_CLIENT_ID` no seu `.env`.

Se o login falhar com um erro de origem/`redirect_uri`, quase sempre significa que a origem de
onde você está servindo não está listada nas *Authorized JavaScript origins*.

## Licença

Apache 2.0 — veja [LICENSE](LICENSE) e [NOTICE](NOTICE).
