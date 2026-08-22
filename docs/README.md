# Documentação do Projeto Ativva Gifts 🎁

Plataforma completa de e-commerce e gestão administrativa inspirada no ecossistema Nuvemshop, voltada para presentes corporativos, kits afetivos e mimos personalizados.

---

## 📁 Estrutura da Pasta `/docs`

- `arquitetura.md`: Arquitetura do sistema, componentes, serviços de backend e integração com Firestore.
- `guia-deploy.md`: Instruções de deploy e configuração de variáveis de ambiente em produção.
- `modulos-admin.md`: Manual operacional de todas as abas e ferramentas do Painel Administrativo.

---

## 🚀 Principais Módulos da Plataforma

1. **Catálogo & Vitrine Nuvemshop**:
   - Layout responsivo, carrossel de banners personalizáveis, filtros por categoria e ocasiões.
   - Detalhe de produtos com seletor de fotos, opções de personalização e cálculo de frete.

2. **Checkout Transparente & Pagamentos**:
   - Integração com Mercado Pago (PIX Dinâmico com QR Code + Cartão de Crédito).
   - Validador de cupons com regras de pedido mínimo e trava de margem de lucro.

3. **Precificação Inteligente & Markup Gross-Up**:
   - Simulador de margem de contribuição, impostos (Simples Nacional), comissões de gateway e lucro líquido real por SKU.

4. **Fiscal & Emissão de NF-e (SEFAZ mod. 55)**:
   - Emissão em lote e individual de Notas Fiscais eletrônicas, visualização de DANFE e geração de XML.

5. **CRM, Prova Social (UGC) & Programa Indique & Ganhe (MGM)**:
   - Moderação de unboxing e fotos de clientes para a vitrine.
   - Painel de afiliados e defensores da marca com links parametrizados e comissões automáticas.
   - Captura de Zero-Party Data (datas comemorativas e aniversários para réguas de pós-venda).
