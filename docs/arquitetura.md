# Arquitetura do Sistema - Ativva Gifts

## 🛠️ Stack Tecnológica

- **Frontend**: React 18+ com TypeScript e Vite.
- **Estilização**: Tailwind CSS com paleta institucional e tipografia inspirada na Nuvemshop.
- **Animações**: `motion/react` para microinterações fluidas e transições de tela.
- **Ícones**: `lucide-react`.
- **Backend / API**: Node.js com Express para rotas seguras de pagamentos (Mercado Pago), relatórios e emissão fiscal simulada.
- **Banco de Dados**: Firebase Firestore (coleções de produtos, pedidos, clientes, cupons, afiliados, eventos de ocasião e UGC).

---

## 🗄️ Estrutura de Coleções no Firestore

| Coleção | Descrição |
| :--- | :--- |
| `products` | Catálogo de produtos, kits, preços, CMV, estoque e personalizações |
| `orders` | Pedidos realizados, status de pagamento, tracking de envio e chave de NF-e |
| `customers` | Cadastro de clientes, LTV, histórico e dados de contato |
| `coupons` | Regras de vouchers, descontos (% ou R$), validade e margem mínima |
| `ugc_reviews` | Fotos de unboxing, avaliações e depoimentos submetidos para moderação |
| `referral_affiliates` | Afiliados cadastrados no programa Indique & Ganhe e comissões |
| `occasion_reminders` | Lembretes de aniversários e celebrações registradas pelos clientes |
| `store_settings` | Parâmetros gerais da loja, SEO, pixels e dados fiscais do emissor |
