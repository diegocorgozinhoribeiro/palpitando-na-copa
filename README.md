# ⚽ Palpites da Copa do Mundo

Web app de palpites diários da Copa do Mundo 2026. Um jogo por vez, **5 cards de palpite por partida** (sorteados de um pool de 20 perguntas, iguais para todos), **ligas privadas** por código/link, **ranking** geral e por liga, e um **painel admin** para preencher os resultados.

- **Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Drizzle ORM · Neon (Postgres) · deploy na Vercel
- **Login:** e-mail + senha (sessão assinada via cookie httpOnly, sem dependências externas)
- **Pontuação:** por dificuldade → Fácil 10 / Média 20 / Difícil 30 (editável no admin)
- **Mercado:** fecha automaticamente 60s antes do apito (validado no servidor)
- **Ligas:** até 3 por usuário; entrada por código ou link de convite

---

## 🚀 Como rodar (passo a passo)

### 1. Pré-requisitos
- Node.js 18.18+ (recomendado 20+)
- Uma conta no [Neon](https://neon.tech) (Postgres) — você já tem a string de conexão.

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Copie o exemplo e preencha:
```bash
cp .env.example .env
```
Edite o `.env`:
```
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
AUTH_SECRET="<gere um valor aleatório grande>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```
Para gerar o `AUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> 🔐 **Segurança:** a senha do Neon que você compartilhou no chat deve ser **rotacionada** no painel do Neon. Nunca versione o arquivo `.env`.

### 4. Criar as tabelas no banco
```bash
npm run db:push
```
Isso cria todas as tabelas no Neon a partir do schema Drizzle (`src/db/schema.ts`).
> Alternativa sem Drizzle: rode o arquivo `db/schema.sql` direto no SQL Editor do Neon.

### 5. Popular dados (perguntas + 104 jogos + sorteio)
```bash
npm run seed
```
Isso insere o pool de 20 perguntas, importa os 104 jogos da Copa 2026 (de `src/data/matches.json`, gerado a partir de `src/data/copa_2026.csv`) e **sorteia 6 perguntas por jogo** — a de "Quem vence" (obrigatória) + 5 sorteadas, iguais para todos. Apenas os 72 jogos da fase de grupos (com times reais) ficam visíveis; os 32 do mata-mata só aparecem quando os times forem definidos.

> ✅ O seed é **idempotente**: pode rodar quantas vezes quiser sem duplicar nada. Jogos usam a coluna `ordem` como chave única e perguntas usam `codigo`.
>
> **Já duplicou jogos?** (versões antigas duplicavam ao rodar o seed 2×). Limpe assim, uma única vez:
> ```bash
> npm run db:dedupe   # remove os jogos duplicados, mantendo 1 de cada
> npm run db:push     # cria a restrição UNIQUE em matches.ordem
> ```
> A partir daí o seed nunca mais duplica.

### 6. Rodar localmente
```bash
npm run dev
```
Abra http://localhost:3000

### 7. Virar admin
Cadastre-se normalmente pelo app e depois promova seu usuário:
```bash
npx tsx src/scripts/makeAdmin.ts seu-email@exemplo.com
```
O link **Admin** aparece no menu. Lá você preenche o gabarito de cada jogo e clica em **Finalizar e corrigir**.

---

## ☁️ Deploy na Vercel
1. Suba este projeto para um repositório no GitHub.
2. Em vercel.com → **New Project** → importe o repositório.
3. Em **Environment Variables**, defina `DATABASE_URL`, `AUTH_SECRET` e `NEXT_PUBLIC_APP_URL` (use a URL final do projeto, ex.: `https://seu-app.vercel.app`).
4. Deploy. Rode `npm run db:push` e `npm run seed` apontando para o mesmo `DATABASE_URL` (pode ser da sua máquina).

---

## 🗂️ Estrutura
```
src/
  app/
    (auth)/actions.ts        # cadastro, login, logout (server actions)
    login, register          # telas de autenticação
    jogos/                    # lista + tela de palpites de cada jogo
    ligas/                    # criar/entrar, ranking da liga, convite por link
    ranking/                  # ranking geral
    perfil/                   # estatísticas do usuário
    admin/                    # painel: resultados, finalizar, pontos das perguntas
  components/                 # NavBar, cards de palpite, formulários, tabela de ranking
  db/                         # schema Drizzle + conexão Neon
  lib/                        # auth, sessão, senha (scrypt), scoring, queries, utils
  data/                       # questions.ts (pool 20) + matches.json (104 jogos) + copa_2026.csv
  scripts/                    # seed, draw (sorteio), makeAdmin
```

## 📋 Sobre os jogos
`src/data/matches.json` é gerado de `src/data/copa_2026.csv` (rode `node scripts/generateMatches.mjs`). Os 72 jogos da fase de grupos têm times reais e ficam **visíveis**; os 32 jogos de mata-mata vêm com placeholders (2A, 1E, "Vencedor jogo 74"…) marcados como `definido: false` e **ficam ocultos** para o usuário até serem definidos. Conforme a tabela for avançando, edite o CSV/JSON e rode `npm run seed` de novo (é idempotente — faz upsert por `ordem`, sem apagar resultados já preenchidos pelo admin).

## ⚙️ Regras implementadas
- 6 perguntas por jogo: a "Quem vence" é obrigatória (entra sempre) + 5 sorteadas 1× e iguais para todos.
- Jogos na tela de Jogos são **separados por data**, mostrando os primeiros dias e um botão **"Ver mais"** para revelar o restante.
- Mercado fecha 60s antes do apito — checado no servidor a cada palpite.
- Pontos por dificuldade, configuráveis em `/admin/perguntas`.
- Limite de 3 ligas por usuário; sair libera vaga.
- Correção automática de todos os palpites ao finalizar um jogo.
- Ranking geral e ranking por liga (desempate por nº de acertos).
