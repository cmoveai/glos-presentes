# 📑 Dossiê Executivo & Técnico: Painel do Lojista (Ativva Gifts)

> **Versão:** 2.4.0 • **Ambiente:** Full-Stack (React 18 + Node.js Express + Gemini 3.7 Flash + Z-API + Firestore)  
> **Segmento:** E-commerce B2C de Presentes Finos, Criativos e Personalizados  
> **Fuso Horário:** Horário Oficial de Brasília (`America/Sao_Paulo` — UTC-3)

---

## 1. Visão Geral e Princípio Arquitetural

O Painel do Lojista foi construído sob a premissa de que a **Inteligência Artificial não é uma aba isolada, mas sim uma camada viva e transversal** que permeia todas as decisões operacionais do lojista:

1. **Percebe:** Cada módulo analisa dados reais de vendas, tráfego, estoque e conversão para contextualizar o momento da loja.
2. **Recomenda:** Todo diagnóstico vem acompanhado de uma próxima melhor ação (*Next Best Action*) com atalhos de execução em um clique.
3. **Executa:** Automações em segundo plano (como disparos via WhatsApp e rotinas cron autônomas) operam 24/7 sem exigir que o lojista mantenha a aplicação aberta.

---

## 2. Identidade Visual & Design Tokens (Dark Luxury Theme)

| Elemento | Token / Hex | Descrição |
| :--- | :--- | :--- |
| **Fundo Global** | `#0A0A0A` | Preto profundo neutro para foco e contraste ergonômico |
| **Superfícies & Cards** | `#141414` | Contorno sutil em `#242424` e raio de curvatura de `16px` |
| **Hero Card IA** | `#101512 → #0B0F0D` | Gradiente com matiz esmeralda profundo |
| **Ação & Positivo** | `#10B981` / `#34D399` | Esmeralda dinâmico para KPIs positivos e botões de ação |
| **Tipografia Títulos** | *Playfair Display / Serif* | Sofisticação para títulos executivos e nomes de seção |
| **Tipografia Dados/UI**| *Inter / Sans & Mono* | Legibilidade para valores em **R$**, datas e números |

---

## 3. Módulos do Painel do Lojista

### 3.1. Tela Inicial: Briefing Executivo & KPIs
- **Hero de Briefing (Gemini):** Síntese matinal em linguagem natural gerada sob demanda ou sincronizada às 09:00 com as movimentações das últimas 24h.
- **Linha de KPIs Principais:**
  - Faturamento Total / Hoje (R$)
  - Total de Pedidos Concluídos
  - Ticket Médio por Venda
  - Taxa de Conversão de Checkout
- **Ranking de Produtos Mais Vendidos (*Best-Selling Products*):**
  - Alternador interativo **Top 5** e **Top 10**.
  - Posição com insígnias `#1`, `#2`, etc.
  - Imagem em proporção editorial, preço, contador de vendas e curva de tendência verde (*sparkline*).

---

### 3.2. Módulo de Estatísticas & Métricas (`MetricsManager`)
- **Sub-Visões Integradas:**
  - **Visão Geral:** Balanço financeiro, volume de transações e funil de visitantes.
  - **Produtos:** Curva ABC de vendas, rentabilidade por SKU e alerta de ruptura de estoque.
  - **Vendas e Clientes:** Segmentação por novos compradores vs. clientes recorrentes (LTV).
  - **Visitas & Funil:** Taxa de abandono em cada etapa (Carrinho → Checkout → Pagamento).
  - **Relatório de Cupons:** Performance de cupons de desconto e ROI de campanhas.

---

### 3.3. Gestão de Pedidos & Logística (`OrderRow`, `OrderActions`)
- **Tabela Operacional com Estrutura Modular:**
  - **Identificação:** Nome do cliente, CPF, ID do pedido e data no formato `DD mmm, AA`.
  - **Produtos do Pedido:** Miniatura, título, variações (cor/tamanho) e mensagem de cartão de presente.
  - **Forma de Pagamento:** Pix Instantâneo, Cartão de Crédito ou Boleto.
  - **Status & Prazos:** Selos com tempo estimado para despacho (*"Enviar hoje até 17h"*).
  - **Ações Rápidas:**
    - `Imprimir Etiqueta` (Correios / Melhor Envio).
    - `Gerenciar Despacho` com inserção de código de rastreio.
    - `Cancelar Pedido` (habilitado apenas para pedidos elegíveis).

---

### 3.4. Portfólio de 5 Automações com Gatilhos Inteligentes (`AutomationToggle`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CENTRAL DE AUTOMAÇÕES ATIVVA                          │
├──────────────────────────┬────────────────────────────┬─────────────────────┤
│ Automação                │ Gatilho                    │ Canal / Ação        │
├──────────────────────────┼────────────────────────────┼─────────────────────┤
│ 1. Resumo Matinal        │ Diariamente às 09:00 (BRT) │ Z-API (WhatsApp)    │
│ 2. Recuperação Carrinho  │ 30 min após abandono       │ WhatsApp + Cupom    │
│ 3. Alerta Estoque Baixo  │ Estoque < 5 unidades       │ Alerta Lojista      │
│ 4. Follow-up Pós-Venda   │ 72h após Entrega           │ Pesquisa Satisfação │
│ 5. Reativação Inativos   │ Inativo há > 60 dias       │ Campanha Retorno    │
└──────────────────────────┴────────────────────────────┴─────────────────────┘
```

---

### 3.5. Agendador Cron em Background (`server/cronScheduler.ts`)
- **Rotina Autônoma:** Opera no backend Node.js em intervalos de 20s para garantir pontualidade exata às 09:00 AM (BRT).
- **Idempotência:** Garante um único disparo por dia via chave de controle (`lastExecutionDateKey`).
- **Trilha de Auditoria (Logs):** Registra cada disparo com timestamp, tempo de resposta em milissegundos e status retornado pela Z-API.
- **Disparo Manual:** Botão `⚡ Testar Cron Agora` para simulação imediata.

---

### 3.6. Copiloto IA Persistente (`CopilotFab` & `CopilotPanel`)
- **Botão Flutuante (FAB):** Acessível em qualquer tela do painel administrativo.
- **Painel Lateral Deslizante:** Chat consultivo conectado ao Google Gemini 3.7 Flash.
- **Contexto em Tempo Real:** O Copiloto responde perguntas considerando os números atuais de vendas, estoque e carrinhos da loja.
- **Sugestões Rápidas:**
  - *"Por que minhas vendas oscilaram esta semana?"*
  - *"Quais produtos têm maior margem e deveriam receber mais tráfego?"*
  - *"Como recuperar os carrinhos abandonados de hoje?"*

---

### 3.7. Faixas de Contexto Inteligente (`InsightBanner`)
Banners de leitura rápida no topo de cada visão operacional sugerindo a próxima ação (*Next Best Action*):
- **Na aba de Vendas:** Identifica pedidos com Pix pendente e sugere lembrete.
- **Na aba de Estoque:** Aponta itens que atingiram o limite mínimo de reposição.
- **Na aba de Carrinhos:** Apresenta o valor total retido passível de recuperação.

---

## 4. Estrutura de Endpoints de IA & Automação

```http
GET  /api/ai/briefing-executive     -> Gera o resumo matinal para o Hero do painel
POST /api/ai/copilot-chat           -> Processa perguntas conversacionais com o Gemini
GET  /api/ai/scheduler-status       -> Retorna status, fuso e logs do agendador Cron
POST /api/ai/scheduler-config       -> Atualiza número de destino e switches das automações
POST /api/ai/scheduler-trigger-now  -> Dispara a rotina das 09:00 sob demanda
POST /api/ai/daily-report           -> Compila métricas e envia via Z-API
```

---

## 5. Configuração Centralizada da Marca (`src/config/brand.ts`)

Todos os parâmetros visuais e textuais da loja são centralizados:
- **Nome da Marca:** Ativva Gifts
- **Slogan / Rótulo:** Painel do Lojista
- **WhatsApp Destinatário Padrão:** `+55 (11) 94759-6045`
- **Instância Z-API:** `3F8069943712D1188556BA5ABB7B83F8`

---

*Dossiê compilado com sucesso e pronto para referência de operação e evolução da plataforma.*
