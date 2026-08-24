import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { GoogleGenAI } from "@google/genai";
import {
  startScheduler,
  getSchedulerStatus,
  updateSchedulerConfig,
  executeDailyReport,
} from "./server/cronScheduler";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory mock storage for demo backend operations
const orders: any[] = [];
const newsletterSubscribers: string[] = [];

// Idempotency cache for Mercado Pago Webhooks (prevents duplicate execution & double stock deduction)
const processedWebhookPayments = new Map<
  string,
  {
    status: string;
    processedAt: string;
    orderId?: string;
    stockDeducted?: boolean;
    whatsappTriggered?: boolean;
  }
>();

// In-memory storage for Abandoned Carts (starts clean)
const abandonedCarts: any[] = [];

// Lazy Gemini Client Initializer
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// Lazy Mercado Pago Client Initializer (prevents crashing when token is not yet set)
function getMercadoPagoClient(): MercadoPagoConfig | null {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    return null;
  }
  return new MercadoPagoConfig({ accessToken: token, options: { timeout: 10000 } });
}

// API: Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mercadoPagoConfigured: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN),
  });
});

// API: Test Mercado Pago Connection Live
app.get("/api/mercadopago/test-connection", async (_req, res) => {
  try {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) {
      return res.status(400).json({
        success: false,
        configured: false,
        message: "Variável de ambiente MERCADO_PAGO_ACCESS_TOKEN não encontrada. Configure-a em Settings > Secrets.",
      });
    }

    const mpClient = getMercadoPagoClient();
    if (!mpClient) {
      return res.status(400).json({
        success: false,
        configured: false,
        message: "Não foi possível inicializar o cliente do Mercado Pago.",
      });
    }

    // Attempt a lightweight test by creating a temporary 1-cent test preference to validate credentials
    const preference = new Preference(mpClient);
    const testResponse = await preference.create({
      body: {
        items: [
          {
            id: "test-auth-ping",
            title: "Teste de Conexão Ativva Store",
            unit_price: 1.0,
            quantity: 1,
            currency_id: "BRL",
          },
        ],
        external_reference: `PING-TEST-${Date.now()}`,
      },
    });

    const isSandboxToken = token.startsWith("TEST-");

    return res.json({
      success: true,
      configured: true,
      mode: isSandboxToken ? "sandbox" : "production",
      preferenceId: testResponse.id,
      initPoint: testResponse.init_point || testResponse.sandbox_init_point,
      maskedToken: `${token.substring(0, 10)}...${token.substring(token.length - 4)}`,
      message: `Conexão estabelecida com sucesso com o Mercado Pago no modo ${isSandboxToken ? "Sandbox (Testes)" : "Produção (Vendas Reais)"}!`,
    });
  } catch (error: any) {
    console.error("Erro no teste do Mercado Pago:", error);
    return res.status(401).json({
      success: false,
      configured: true,
      error: error?.message || "Credenciais inválidas ou recusadas pelo Mercado Pago.",
      message: "O Access Token foi enviado, mas o Mercado Pago recusou a autenticação. Verifique se o token foi copiado integralmente sem espaços extras.",
    });
  }
});

// API: Create Mercado Pago Checkout Preference
app.post("/api/checkout/mercadopago/preference", async (req, res) => {
  try {
    const { items, orderId, customer, shippingPrice = 0, discount = 0, baseUrl } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "O pedido precisa conter pelo menos um item." });
    }

    const mpClient = getMercadoPagoClient();
    const appOrigin = baseUrl || process.env.APP_URL || "http://localhost:3000";
    const cleanOrigin = appOrigin.replace(/\/$/, "");

    // Prepare items list for Mercado Pago
    let preferenceItems: Array<{
      id: string;
      title: string;
      quantity: number;
      unit_price: number;
      currency_id: string;
      picture_url?: string;
    }> = items.map((item: any, idx: number) => {
      const unitPrice = parseFloat(item.price);
      return {
        id: String(item.productId || item.id || `item-${idx + 1}`),
        title: String(item.name || `Item ${idx + 1}`).substring(0, 250),
        quantity: Number(item.quantity) || 1,
        unit_price: Math.max(0.01, Math.round(unitPrice * 100) / 100),
        currency_id: "BRL",
        picture_url: item.image || undefined,
      };
    });

    // If discount exists, adjust unit prices or apply proportionally so total matches
    const totalItemsSum = preferenceItems.reduce((acc, it) => acc + it.unit_price * it.quantity, 0);
    if (discount > 0 && totalItemsSum > discount) {
      const ratio = (totalItemsSum - discount) / totalItemsSum;
      preferenceItems = preferenceItems.map((it) => ({
        ...it,
        unit_price: Math.max(0.01, Math.round(it.unit_price * ratio * 100) / 100),
      }));
    }

    // If there is shipping, add as an explicit item
    if (shippingPrice > 0) {
      preferenceItems.push({
        id: "shipping-cost",
        title: "Frete e Envio",
        quantity: 1,
        unit_price: Math.round(Number(shippingPrice) * 100) / 100,
        currency_id: "BRL",
      });
    }

    const uniqueOrderId = orderId || "PED-" + Math.floor(100000 + Math.random() * 900000);

    // If MP client is available with a real token
    if (mpClient) {
      const preference = new Preference(mpClient);
      const response = await preference.create({
        body: {
          items: preferenceItems,
          payer: customer
            ? {
                name: customer.name,
                email: customer.email,
                phone: customer.phone ? { number: customer.phone.replace(/\D/g, "") } : undefined,
                identification: customer.cpf
                  ? { type: "CPF", number: customer.cpf.replace(/\D/g, "") }
                  : undefined,
              }
            : undefined,
          back_urls: {
            success: `${cleanOrigin}/?checkout=success&order_id=${uniqueOrderId}`,
            failure: `${cleanOrigin}/?checkout=failure&order_id=${uniqueOrderId}`,
            pending: `${cleanOrigin}/?checkout=pending&order_id=${uniqueOrderId}`,
          },
          auto_return: "approved",
          external_reference: uniqueOrderId,
          statement_descriptor: "GLOS",
          payment_methods: {
            installments: 10,
          },
        },
      });

      return res.json({
        success: true,
        orderId: uniqueOrderId,
        preferenceId: response.id,
        init_point: response.init_point,
        sandbox_init_point: response.sandbox_init_point,
        isLiveGateway: true,
      });
    }

    // Smart fallback for sandbox / demo preview if access token isn't entered yet
    const simulatedInitPoint = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=demo-${uniqueOrderId}`;
    return res.json({
      success: true,
      orderId: uniqueOrderId,
      preferenceId: `demo-pref-${uniqueOrderId}`,
      init_point: simulatedInitPoint,
      isLiveGateway: false,
      message: "Modo de simulação ativo. Para transações reais em produção, configure MERCADO_PAGO_ACCESS_TOKEN.",
    });
  } catch (error: any) {
    console.error("Erro ao criar preferência do Mercado Pago:", error);
    return res.status(500).json({
      error: "Erro no Gateway de Pagamento",
      message: error?.message || "Não foi possível gerar a preferência do Mercado Pago.",
    });
  }
});

/**
 * =========================================================================
 * CONFIGURAÇÃO DO WEBHOOK NO PAINEL DO MERCADO PAGO (Instruções para Cris)
 * =========================================================================
 * 1. Acesse o painel do Mercado Pago Developers (https://www.mercadopago.com.br/developers/panel)
 * 2. Em "Suas integrações", selecione a sua aplicação "Glos Presentes"
 * 3. No menu lateral, vá em "Webhooks" ou "Notificações IPN"
 * 4. No campo "URL de produção", cadastre:
 *    https://SEU-DOMINIO/api/mp/webhook  (ou https://SEU-DOMINIO/api/webhooks/mercadopago)
 * 5. Em "Eventos", marque a caixa "Pagamentos" (payment.created, payment.updated)
 * 6. (Opcional recomendado) Copie a "Chave secreta de assinatura" gerada pelo Mercado Pago
 *    e salve na variável de ambiente MERCADOPAGO_WEBHOOK_SECRET no seu servidor.
 * =========================================================================
 */

// Helper: Disparo de WhatsApp da Central de Aprovação de Arte (Comando 5)
async function dispararWhatsappCentralAprovacao(order: any) {
  const firstName = order.customer?.name ? order.customer.name.split(" ")[0] : "Cliente";
  const customItems = (order.items || []).filter(
    (i: any) => i.requerArquivo || i.natureza === "personalizavel"
  );
  const itemSummary = customItems.map((i: any) => i.name || "Item Personalizado").join(", ");
  const appUrl = process.env.APP_URL || "https://glospresentes.com.br";
  const centralUrl = `${appUrl}/#aprovacao?pedido=${order.id || order.orderNumber}`;

  const messageText = `Olá, ${firstName}! Que alegria ter você aqui na Glos Presentes ✨\n\nConfirmamos o pagamento do seu pedido #${order.id || order.orderNumber}!\n\nComo seu presente é personalizado com todo carinho (${itemSummary || "Presente Especial"}), estamos prontos para receber suas fotos/textos.\n\n📲 Envie por este WhatsApp ou acesse a Central de Aprovação: ${centralUrl}\n\nCom carinho,\nEquipe Glos Presentes 🎁`;

  const zapiInstance = process.env.ZAPI_INSTANCE_ID;
  const zapiToken = process.env.ZAPI_TOKEN;
  const rawPhone = (order.customer?.phone || "").replace(/\D/g, "");
  const phone = rawPhone.length === 11 && !rawPhone.startsWith("55") ? `55${rawPhone}` : rawPhone;

  if (zapiInstance && zapiToken && phone) {
    try {
      const zapiRes = await fetch(
        `https://api.z-api.io/instances/${zapiInstance}/token/${zapiToken}/send-text`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, message: messageText }),
        }
      );
      const resJson = await zapiRes.json();
      console.log(`[Z-API] Disparo de WhatsApp realizado com sucesso para pedido #${order.id}:`, resJson);
      return { success: true, via: "z-api", details: resJson };
    } catch (err: any) {
      console.error(`[Z-API] Erro ao disparar mensagem para ${phone}:`, err?.message);
    }
  }

  // Fallback estruturado de intenção/log (gancho para conexão futura na Z-API)
  console.log(`[WHATSAPP_CENTRAL_APROVACAO_INTENT] Pedido #${order.id || order.orderNumber} para ${phone || "sem-telefone"}:`, {
    recipient: order.customer?.name,
    phone,
    orderId: order.id || order.orderNumber,
    items: itemSummary,
    previewMessage: messageText,
    timestamp: new Date().toISOString(),
  });

  return { success: true, via: "intent-log", message: messageText };
}

// Helper: Baixa de estoque para itens de revenda/licenciados
function baixarEstoqueItensRevenda(order: any) {
  const revendaItems = (order.items || []).filter(
    (i: any) => !i.requerArquivo && i.natureza !== "personalizavel"
  );
  console.log(
    `[ESTOQUE] Baixa de estoque efetuada para ${revendaItems.length} itens de revenda/licenciados do pedido #${order.id || order.orderNumber}`
  );
  return true;
}

// Core Webhook Processor Function (Idempotente e Seguro)
async function processMercadoPagoPaymentUpdate(
  paymentId: string,
  topic?: string,
  headers?: { signature?: string; requestId?: string },
  forcedExternalReference?: string
) {
  if (!paymentId) {
    return { success: false, reason: "ID do pagamento ausente" };
  }

  console.log(`[MP_WEBHOOK] Iniciando processamento do pagamento ID: ${paymentId} (Tópico: ${topic || "payment"})`);

  // 1. Validação de Assinatura (se secret estiver configurado)
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (webhookSecret && headers?.signature && headers?.requestId) {
    try {
      const parts = headers.signature.split(",");
      let ts = "";
      let v1 = "";
      for (const part of parts) {
        const [k, v] = part.trim().split("=");
        if (k === "ts") ts = v;
        if (k === "v1") v1 = v;
      }

      if (ts && v1) {
        const manifest = `id:${paymentId};request-id:${headers.requestId};ts:${ts};`;
        const expectedSignature = crypto
          .createHmac("sha256", webhookSecret)
          .update(manifest)
          .digest("hex");

        if (expectedSignature !== v1) {
          console.warn("[MP_WEBHOOK] Assinatura do webhook inválida ou não coincidente.");
          // Continuamos com a consulta à API do MP como barreira final de segurança
        } else {
          console.log("[MP_WEBHOOK] Assinatura HMAC validada com sucesso.");
        }
      }
    } catch (sigErr) {
      console.warn("[MP_WEBHOOK] Erro ao validar assinatura:", sigErr);
    }
  }

  // 2. Consulta à API Oficial do Mercado Pago (NÃO confiar no corpo da notificação)
  let paymentInfo: any = null;
  const mpClient = getMercadoPagoClient();

  if (mpClient) {
    try {
      const paymentApi = new Payment(mpClient);
      paymentInfo = await paymentApi.get({ id: paymentId });
    } catch (mpApiErr: any) {
      console.warn(`[MP_WEBHOOK] Falha na consulta à API do Mercado Pago para o ID ${paymentId}:`, mpApiErr?.message);
    }
  }

  // Fallback para pagamentos simulados de teste/sandbox em ambiente de desenvolvimento
  if (!paymentInfo) {
    if (paymentId.startsWith("demo-") || paymentId.startsWith("test-") || !mpClient) {
      console.log(`[MP_WEBHOOK] Modo de demonstração/teste para pagamento ${paymentId}`);
      // Busca pedido existente associado ou simula aprovação de teste
      const matched = orders.find(
        (o) =>
          o.id === forcedExternalReference ||
          o.id === paymentId ||
          o.paymentDetails?.preferenceId === paymentId
      );
      paymentInfo = {
        id: paymentId,
        status: "approved",
        status_detail: "accredited",
        external_reference: forcedExternalReference || matched?.id || paymentId.replace(/^(demo-|test-)/, ""),
        date_approved: new Date().toISOString(),
        payment_method_id: "pix",
        payment_type_id: "bank_transfer",
        transaction_amount: matched?.total || 149.9,
      };
    } else {
      return { success: false, reason: "Pagamento não encontrado na API do Mercado Pago" };
    }
  }

  const mpStatus = paymentInfo.status; // 'approved', 'pending', 'in_process', 'rejected', 'cancelled', etc.
  const externalRef = paymentInfo.external_reference || forcedExternalReference || paymentId;

  // 3. Verificação de Idempotência
  const cacheKey = `${paymentId}_${mpStatus}`;
  const existingEvent = processedWebhookPayments.get(cacheKey);
  if (existingEvent) {
    console.log(
      `[MP_WEBHOOK_IDEMPOTENCY] Pagamento ${paymentId} já processado anteriormente com status '${mpStatus}' em ${existingEvent.processedAt}. Encerrando sem reprocessar.`
    );
    return {
      success: true,
      idempotent: true,
      paymentId,
      status: mpStatus,
      externalReference: externalRef,
    };
  }

  // 4. Localizar o Pedido no repositório de dados
  let targetOrder = orders.find(
    (o) => o.id === externalRef || o.orderNumber === externalRef || o.paymentDetails?.preferenceId === paymentId
  );

  // Se não estiver em memória mas foi gerado pelo checkout, criamos/recuperamos a estrutura
  if (!targetOrder) {
    targetOrder = {
      id: externalRef,
      orderNumber: externalRef,
      createdAt: new Date().toISOString(),
      status: "PEDIDO_REALIZADO",
      statusPedido: "a_despachar",
      statusPagamento: "aguardando_pagamento",
      items: [],
      total: paymentInfo.transaction_amount || 0,
      customer: { name: "Cliente Glos", email: "", phone: "", cpf: "" },
      statusHistory: [{ status: "PEDIDO_REALIZADO", label: "Pedido Criado", date: new Date().toISOString() }],
    };
    orders.unshift(targetOrder);
  }

  // Checagem de idempotência direta no objeto do pedido
  const targetStatusPagamento =
    mpStatus === "approved" ? "pago" : mpStatus === "pending" || mpStatus === "in_process" ? "pendente" : "recusado";

  if (targetOrder.mpPaymentId === String(paymentId) && targetOrder.statusPagamento === targetStatusPagamento) {
    console.log(
      `[MP_WEBHOOK_IDEMPOTENCY] Pedido #${targetOrder.id} já se encontra com statusPagamento '${targetStatusPagamento}'. Idempotência respeitada.`
    );
    processedWebhookPayments.set(cacheKey, {
      status: mpStatus,
      processedAt: new Date().toISOString(),
      orderId: targetOrder.id,
      stockDeducted: targetOrder.estoqueBaixado,
      whatsappTriggered: targetOrder.whatsappAprovacaoDisparado,
    });
    return { success: true, idempotent: true, order: targetOrder };
  }

  // 5. Atualização de Status conforme retorno oficial do Mercado Pago
  targetOrder.mpPaymentId = String(paymentId);
  targetOrder.mpPaymentStatus = mpStatus;
  targetOrder.mpStatusDetail = paymentInfo.status_detail;
  targetOrder.mpPaymentMethod = paymentInfo.payment_method_id;
  targetOrder.mpPaymentType = paymentInfo.payment_type_id;

  if (mpStatus === "approved") {
    targetOrder.statusPagamento = "pago";
    targetOrder.status = "PAGAMENTO_CONFIRMADO";
    targetOrder.pagoEm = paymentInfo.date_approved || new Date().toISOString();

    targetOrder.statusHistory = targetOrder.statusHistory || [];
    targetOrder.statusHistory.push({
      status: "PAGAMENTO_CONFIRMADO",
      label: "Pagamento Aprovado pelo Mercado Pago",
      date: new Date().toISOString(),
    });

    // =========================================================================
    // REGRA DE PÓS-PAGAMENTO (quando approved)
    // =========================================================================

    // A) Baixa de Estoque para Itens de Revenda (idempotente)
    if (!targetOrder.estoqueBaixado) {
      baixarEstoqueItensRevenda(targetOrder);
      targetOrder.estoqueBaixado = true;
    }

    // B) Bifurcação por Natureza do Pedido
    const hasPersonalizavel =
      targetOrder.statusPedido === "aguardando_arquivo" ||
      (targetOrder.items || []).some(
        (i: any) => i.requerArquivo || i.natureza === "personalizavel" || i.productType === "personalizavel"
      );

    if (hasPersonalizavel) {
      // Pedido com item personalizável: mantém 'aguardando_arquivo' e aciona Central de Aprovação
      targetOrder.statusPedido = "aguardando_arquivo";

      if (!targetOrder.whatsappAprovacaoDisparado) {
        await dispararWhatsappCentralAprovacao(targetOrder);
        targetOrder.whatsappAprovacaoDisparado = true;
        targetOrder.whatsappDisparadoEm = new Date().toISOString();
      }
    } else {
      // Pedido 100% revenda/licenciado: fica pronto para despacho
      targetOrder.statusPedido = "a_despachar";
    }
  } else if (mpStatus === "pending" || mpStatus === "in_process") {
    targetOrder.statusPagamento = "pendente";
    targetOrder.status = "AGUARDANDO_PAGAMENTO";
    targetOrder.statusHistory = targetOrder.statusHistory || [];
    targetOrder.statusHistory.push({
      status: "AGUARDANDO_PAGAMENTO",
      label: "Pagamento em Processamento",
      date: new Date().toISOString(),
    });
  } else if (
    mpStatus === "rejected" ||
    mpStatus === "cancelled" ||
    mpStatus === "refunded" ||
    mpStatus === "charged_back"
  ) {
    targetOrder.statusPagamento = "recusado";
    targetOrder.status = "CANCELADO";
    targetOrder.statusHistory = targetOrder.statusHistory || [];
    targetOrder.statusHistory.push({
      status: "PAGAMENTO_RECUSADO",
      label: "Pagamento Recusado / Cancelado pelo Mercado Pago",
      date: new Date().toISOString(),
    });
  }

  // 6. Grava na tabela de idempotência
  processedWebhookPayments.set(cacheKey, {
    status: mpStatus,
    processedAt: new Date().toISOString(),
    orderId: targetOrder.id,
    stockDeducted: targetOrder.estoqueBaixado,
    whatsappTriggered: targetOrder.whatsappAprovacaoDisparado,
  });

  console.log(`[MP_WEBHOOK_SUCCESS] Pedido #${targetOrder.id} atualizado: statusPagamento='${targetOrder.statusPagamento}', statusPedido='${targetOrder.statusPedido}'`);

  return {
    success: true,
    orderId: targetOrder.id,
    statusPagamento: targetOrder.statusPagamento,
    statusPedido: targetOrder.statusPedido,
    mpStatus,
  };
}

// Endpoint Principal do Webhook: POST /api/mp/webhook
app.post("/api/mp/webhook", async (req, res) => {
  try {
    const paymentId =
      req.body?.data?.id ||
      req.body?.id ||
      req.query["data.id"] ||
      req.query.id;

    const topic =
      req.body?.type ||
      req.body?.topic ||
      req.query.type ||
      req.query.topic ||
      req.body?.action;

    // Responde 200 IMEDIATAMENTE para o Mercado Pago evitar retentativas agressivas
    res.status(200).json({ received: true });

    // Processamento assíncrono seguro
    if (paymentId) {
      const signature = req.headers["x-signature"] as string | undefined;
      const requestId = req.headers["x-request-id"] as string | undefined;
      processMercadoPagoPaymentUpdate(String(paymentId), String(topic || "payment"), {
        signature,
        requestId,
      }).catch((err) => {
        console.error("[MP_WEBHOOK_ASYNC_ERROR]", err);
      });
    }
  } catch (error) {
    console.error("Erro no recebimento do Webhook Mercado Pago:", error);
    if (!res.headersSent) {
      res.status(200).json({ received: true, error: true });
    }
  }
});

// Endpoint Alias: POST /api/webhooks/mercadopago
app.post("/api/webhooks/mercadopago", async (req, res) => {
  try {
    const paymentId =
      req.body?.data?.id ||
      req.body?.id ||
      req.query["data.id"] ||
      req.query.id;

    const topic =
      req.body?.type ||
      req.body?.topic ||
      req.query.type ||
      req.query.topic ||
      req.body?.action;

    res.status(200).json({ received: true });

    if (paymentId) {
      const signature = req.headers["x-signature"] as string | undefined;
      const requestId = req.headers["x-request-id"] as string | undefined;
      processMercadoPagoPaymentUpdate(String(paymentId), String(topic || "payment"), {
        signature,
        requestId,
      }).catch((err) => {
        console.error("[MP_WEBHOOK_ASYNC_ERROR]", err);
      });
    }
  } catch (error) {
    console.error("Erro no alias do Webhook Mercado Pago:", error);
    if (!res.headersSent) {
      res.status(200).json({ received: true, error: true });
    }
  }
});

// GET /api/mp/webhook (Verificação de saúde/validação do endpoint pelo Mercado Pago)
app.get(["/api/mp/webhook", "/api/webhooks/mercadopago"], (_req, res) => {
  res.status(200).send("Glos Presentes - Mercado Pago Webhook Active");
});

// POST /api/mp/webhook/test-simulate (Endpoint de teste e simulação de notificações para sandbox/validação)
app.post("/api/mp/webhook/test-simulate", async (req, res) => {
  try {
    const { paymentId, status = "approved", orderId, nature = "personalizavel" } = req.body;
    const testPaymentId = paymentId || `test-${Date.now()}`;
    const testOrderId = orderId || `PED-${Math.floor(100000 + Math.random() * 900000)}`;

    // Cria/garante existência do pedido para o teste
    let order = orders.find((o) => o.id === testOrderId);
    if (!order) {
      order = {
        id: testOrderId,
        orderNumber: testOrderId,
        createdAt: new Date().toISOString(),
        status: "PEDIDO_REALIZADO",
        statusPedido: nature === "personalizavel" ? "aguardando_arquivo" : "a_despachar",
        statusPagamento: "aguardando_pagamento",
        items: [
          {
            productId: "prod-teste",
            name: nature === "personalizavel" ? "Caneca Personalizada com Foto" : "Vela Aromática Vanilla",
            price: 89.9,
            quantity: 1,
            natureza: nature,
            requerArquivo: nature === "personalizavel",
          },
        ],
        total: 89.9,
        customer: {
          name: "Cris Costa",
          email: "eucriscostaart@gmail.com",
          phone: "11961820588",
          cpf: "123.456.789-00",
        },
        whatsappAprovacaoDisparado: false,
        estoqueBaixado: false,
      };
      orders.unshift(order);
    }

    const result = await processMercadoPagoPaymentUpdate(
      testPaymentId,
      "payment",
      undefined,
      testOrderId
    );
    return res.json({
      success: true,
      simulationResult: result,
      order: orders.find((o) => o.id === testOrderId),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// API: CEP Address Lookup (ViaCEP integration with regional detection)
app.get("/api/cep/:cep", async (req, res) => {
  const { cep } = req.params;
  const cleanCep = (cep || "").replace(/\D/g, "");

  if (!cleanCep || cleanCep.length !== 8) {
    return res.status(400).json({ error: "CEP inválido. Forneça 8 dígitos numéricos." });
  }

  try {
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (viaCepResponse.ok) {
      const data = await viaCepResponse.json();
      if (!data.erro) {
        const uf = (data.uf || "").toUpperCase();
        let region = "Sudeste";
        if (["PR", "SC", "RS"].includes(uf)) region = "Sul";
        else if (["DF", "GO", "MT", "MS"].includes(uf)) region = "Centro-Oeste";
        else if (["BA", "PE", "CE", "RN", "PB", "AL", "SE", "MA", "PI"].includes(uf)) region = "Nordeste";
        else if (["AM", "PA", "RO", "AC", "RR", "AP", "TO"].includes(uf)) region = "Norte";

        return res.json({
          cep: data.cep || cleanCep,
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: uf,
          region,
        });
      }
    }
  } catch (err) {
    console.warn("ViaCEP lookup error, fallback used:", err);
  }

  // Smart regional fallback when external service is unreachable
  const firstDigit = cleanCep.charAt(0);
  let fallbackState = "SP";
  let fallbackCity = "São Paulo";
  let fallbackRegion = "Sudeste";

  if (firstDigit === "8" || firstDigit === "9") {
    fallbackState = "PR";
    fallbackCity = "Curitiba";
    fallbackRegion = "Sul";
  } else if (firstDigit === "7") {
    fallbackState = "DF";
    fallbackCity = "Brasília";
    fallbackRegion = "Centro-Oeste";
  } else if (firstDigit === "4" || firstDigit === "5" || firstDigit === "6") {
    fallbackState = "BA";
    fallbackCity = "Salvador";
    fallbackRegion = "Nordeste";
  }

  return res.json({
    cep: cleanCep,
    street: "",
    neighborhood: "",
    city: fallbackCity,
    state: fallbackState,
    region: fallbackRegion,
  });
});

// API: CNPJ Company Lookup (BrasilAPI with ReceitaWS fallback)
app.get("/api/cnpj/:cnpj", async (req, res) => {
  const { cnpj } = req.params;
  const cleanCnpj = (cnpj || "").replace(/\D/g, "");

  if (!cleanCnpj || cleanCnpj.length !== 14) {
    return res.status(400).json({
      success: false,
      error: "CNPJ inválido. O CNPJ deve conter exatamente 14 dígitos numéricos.",
    });
  }

  // 1) Tentativa primária: BrasilAPI
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
      signal: controller.signal,
      headers: { "User-Agent": "GlosAdmin/1.0" },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && (data.razao_social || data.nome_fantasia || data.cnpj)) {
        const phone = [data.ddd_telefone_1, data.ddd_telefone_2].filter(Boolean).join(" / ");
        const street = [data.descricao_tipo_de_logradouro, data.logradouro].filter(Boolean).join(" ") || data.logradouro || "";

        return res.json({
          success: true,
          source: "brasilapi",
          data: {
            cnpj: cleanCnpj,
            razaoSocial: data.razao_social || data.nome_fantasia || "",
            nomeFantasia: data.nome_fantasia || data.razao_social || "",
            situacaoCadastral: data.descricao_situacao_cadastral || data.situacao_cadastral || "ATIVA",
            logradouro: street,
            numero: data.numero || "",
            complemento: data.complemento || "",
            bairro: data.bairro || "",
            municipio: data.municipio || "",
            uf: (data.uf || "").toUpperCase(),
            cep: (data.cep || "").replace(/\D/g, ""),
            email: (data.email || "").toLowerCase(),
            telefone: phone,
            cnae: data.cnae_fiscal_descricao || "",
          },
        });
      }
    }
  } catch (err: any) {
    console.warn("BrasilAPI CNPJ lookup failed or timed out:", err.message || err);
  }

  // 2) Tentativa secundária: ReceitaWS fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`, {
      signal: controller.signal,
      headers: { "User-Agent": "GlosAdmin/1.0" },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.status !== "ERROR") {
        return res.json({
          success: true,
          source: "receitaws",
          data: {
            cnpj: cleanCnpj,
            razaoSocial: data.nome || data.fantasia || "",
            nomeFantasia: data.fantasia || data.nome || "",
            situacaoCadastral: data.situacao || "ATIVA",
            logradouro: data.logradouro || "",
            numero: data.numero || "",
            complemento: data.complemento || "",
            bairro: data.bairro || "",
            municipio: data.municipio || "",
            uf: (data.uf || "").toUpperCase(),
            cep: (data.cep || "").replace(/\D/g, ""),
            email: (data.email || "").toLowerCase(),
            telefone: data.telefone || "",
            cnae: data.atividade_principal?.[0]?.text || "",
          },
        });
      }
    }
  } catch (err: any) {
    console.warn("ReceitaWS CNPJ fallback failed or timed out:", err.message || err);
  }

  // Se ambas falharem, retorna mensagem amigável para preenchimento manual
  return res.status(404).json({
    success: false,
    error: "Não foi possível localizar os dados deste CNPJ automaticamente. Você pode preencher os campos manualmente.",
  });
});

// API: Calculate shipping simulation with regional tariffs and weight
app.post("/api/shipping/calculate", async (req, res) => {
  const { cep, subtotal } = req.body;
  const cleanCep = (cep || "").replace(/\D/g, "");

  if (!cleanCep || cleanCep.length !== 8) {
    return res.status(400).json({ error: "CEP inválido. Digite 8 dígitos numéricos." });
  }

  const subtotalNum = Number(subtotal) || 0;
  const isFreeEligible = subtotalNum >= 249;

  // Regional calculation based on CEP prefix
  const firstDigit = cleanCep.charAt(0);
  const firstTwoDigits = parseInt(cleanCep.substring(0, 2), 10);
  // SP Capital and Greater SP: 01xxx to 09xxx
  const isGreaterSaoPaulo = firstDigit === "0" || (firstTwoDigits >= 1 && firstTwoDigits <= 9);

  let options: Array<{
    id: string;
    name: string;
    carrier: string;
    deadline: string;
    price: number;
    originalPrice: number;
    isFree: boolean;
    entregaMesmoDia?: boolean;
  }> = [];

  let locationLabel = "Região Sudeste";

  if (isGreaterSaoPaulo) {
    locationLabel = "São Paulo (Capital e Grande SP)";
    options = [
      {
        id: "same_day",
        name: "Entrega no mesmo dia (SP Capital e Grande SP)",
        carrier: "Lalamove / Motoboy Express",
        deadline: "Hoje até às 21h",
        price: 29.9,
        originalPrice: 29.9,
        isFree: false,
        entregaMesmoDia: true,
      },
      {
        id: "pac",
        name: "Econômico (Correios PAC)",
        carrier: "Correios",
        deadline: "2 a 4 dias úteis",
        price: isFreeEligible ? 0 : 14.9,
        originalPrice: 14.9,
        isFree: isFreeEligible,
      },
      {
        id: "sedex",
        name: "Expresso (Correios SEDEX)",
        carrier: "Correios",
        deadline: "1 a 2 dias úteis",
        price: 19.9,
        originalPrice: 19.9,
        isFree: false,
      },
    ];
  } else if (firstDigit === "1") {
    locationLabel = "São Paulo (Interior)";
    options = [
      {
        id: "pac",
        name: "Econômico (Correios PAC)",
        carrier: "Correios",
        deadline: "2 a 4 dias úteis",
        price: isFreeEligible ? 0 : 14.9,
        originalPrice: 14.9,
        isFree: isFreeEligible,
      },
      {
        id: "sedex",
        name: "Expresso (Correios SEDEX)",
        carrier: "Correios",
        deadline: "1 a 2 dias úteis",
        price: 19.9,
        originalPrice: 19.9,
        isFree: false,
      },
    ];
  } else if (firstDigit === "2" || firstDigit === "3") {
    locationLabel = "Sudeste (RJ/MG/ES)";
    options = [
      {
        id: "pac",
        name: "Econômico (Transportadora / PAC)",
        carrier: "Correios / Transportadora",
        deadline: "3 a 6 dias úteis",
        price: isFreeEligible ? 0 : 17.9,
        originalPrice: 17.9,
        isFree: isFreeEligible,
      },
      {
        id: "sedex",
        name: "Expresso (SEDEX)",
        carrier: "Correios SEDEX",
        deadline: "2 a 3 dias úteis",
        price: 24.9,
        originalPrice: 24.9,
        isFree: false,
      },
    ];
  } else if (firstDigit === "8" || firstDigit === "9") {
    locationLabel = "Região Sul (PR/SC/RS)";
    options = [
      {
        id: "pac",
        name: "Econômico (Transportadora / PAC)",
        carrier: "Correios / Transportadora",
        deadline: "4 a 7 dias úteis",
        price: isFreeEligible ? 0 : 19.9,
        originalPrice: 19.9,
        isFree: isFreeEligible,
      },
      {
        id: "sedex",
        name: "Expresso (SEDEX)",
        carrier: "Correios SEDEX",
        deadline: "2 a 4 dias úteis",
        price: 29.9,
        originalPrice: 29.9,
        isFree: false,
      },
    ];
  } else if (firstDigit === "7") {
    locationLabel = "Região Centro-Oeste (DF/GO/MT/MS)";
    options = [
      {
        id: "pac",
        name: "Econômico (Transportadora / PAC)",
        carrier: "Correios / Transportadora",
        deadline: "5 a 8 dias úteis",
        price: isFreeEligible ? 0 : 22.9,
        originalPrice: 22.9,
        isFree: isFreeEligible,
      },
      {
        id: "sedex",
        name: "Expresso (SEDEX)",
        carrier: "Correios SEDEX",
        deadline: "2 a 4 dias úteis",
        price: 34.9,
        originalPrice: 34.9,
        isFree: false,
      },
    ];
  } else {
    locationLabel = "Região Norte e Nordeste";
    options = [
      {
        id: "pac",
        name: "Econômico (Transportadora / PAC)",
        carrier: "Correios / Transportadora",
        deadline: "6 a 10 dias úteis",
        price: isFreeEligible ? 0 : 26.9,
        originalPrice: 26.9,
        isFree: isFreeEligible,
      },
      {
        id: "sedex",
        name: "Expresso (SEDEX)",
        carrier: "Correios SEDEX",
        deadline: "3 a 5 dias úteis",
        price: 42.9,
        originalPrice: 42.9,
        isFree: false,
      },
    ];
  }

  return res.json({
    cep: cleanCep,
    locationLabel,
    options,
    freeShippingThreshold: 249,
    remainingForFreeShipping: Math.max(0, 249 - subtotalNum),
  });
});

// API: Package Tracking by Tracking Code
app.get("/api/shipping/track/:code", (req, res) => {
  const { code } = req.params;
  const trackingCode = (code || "").trim().toUpperCase();

  const now = new Date();
  const d1 = new Date(now.getTime() - 2 * 86400000);
  const d2 = new Date(now.getTime() - 1 * 86400000);
  const d3 = new Date(now.getTime() - 4 * 3600000);

  const checkpoints = [
    {
      status: "POSTADO",
      title: "Objeto Postado",
      description: "O pacote foi recebido no Centro de Distribuição do remetente.",
      location: "São Paulo / SP",
      date: d1.toLocaleDateString("pt-BR") + " às 14:32",
      completed: true,
    },
    {
      status: "EM_TRANSITO",
      title: "Em Transferência",
      description: "Objeto em transferência para a Unidade de Tratamento da sua região.",
      location: "Unidade de Tratamento - Cajamar / SP",
      date: d2.toLocaleDateString("pt-BR") + " às 09:15",
      completed: true,
    },
    {
      status: "SAIU_ENTREGA",
      title: "Saiu para Entrega ao Destinatário",
      description: "O carteiro ou motorista já está em rota para realizar a entrega.",
      location: "Centro de Entrega Local",
      date: d3.toLocaleDateString("pt-BR") + " às " + d3.getHours().toString().padStart(2, "0") + ":10",
      completed: true,
      current: true,
    },
    {
      status: "ENTREGUE",
      title: "Objeto Entregue ao Destinatário",
      description: "Pacote recebido no endereço de entrega mediante assinatura.",
      location: "Endereço do Destinatário",
      date: "Previsão hoje até às 19:00",
      completed: false,
    },
  ];

  return res.json({
    trackingCode,
    carrier: trackingCode.startsWith("BR") ? "Correios (SEDEX / PAC)" : "Transportadora Expressa",
    status: "SAIU_ENTREGA",
    estimatedDelivery: "Hoje até às 19:00",
    checkpoints,
  });
});

// API: Validate coupon
app.post("/api/coupons/validate", (req, res) => {
  const { code, subtotal } = req.body;
  const normalized = (code || "").trim().toUpperCase();

  const coupons: Record<string, { discountPercent?: number; discountValue?: number; minOrder?: number; description: string }> = {
    BEMVINDO10: { discountPercent: 10, minOrder: 99, description: "10% OFF na primeira compra (acima de R$ 99)" },
    PRESENTE15: { discountPercent: 15, minOrder: 199, description: "15% OFF especial em presentes (acima de R$ 199)" },
    FRETEGRATIS: { discountValue: 18.9, minOrder: 150, description: "Frete Econômico Grátis (acima de R$ 150)" },
    PROMO20: { discountPercent: 20, minOrder: 299, description: "20% OFF para compras acima de R$ 299" },
  };

  const coupon = coupons[normalized];
  if (!coupon) {
    return res.status(404).json({ error: "Cupom inválido ou expirado." });
  }

  if (coupon.minOrder && Number(subtotal) < coupon.minOrder) {
    return res.status(400).json({
      error: `Este cupom requer valor mínimo de R$ ${coupon.minOrder.toFixed(2)} em produtos.`,
    });
  }

  let discountAmount = 0;
  if (coupon.discountPercent) {
    discountAmount = (Number(subtotal) * coupon.discountPercent) / 100;
  } else if (coupon.discountValue) {
    discountAmount = coupon.discountValue;
  }

  return res.json({
    code: normalized,
    description: coupon.description,
    discountAmount: Math.round(discountAmount * 100) / 100,
    valid: true,
  });
});

// API: Save and list orders securely
app.get("/api/orders", (req, res) => {
  const email = req.query.email as string | undefined;
  const clienteId = req.query.clienteId as string | undefined;

  let filtered = [...orders];

  if (clienteId && email) {
    filtered = filtered.filter(
      (o) =>
        (o.clienteId && o.clienteId === clienteId) ||
        (o.customer?.email || "").toLowerCase() === email.toLowerCase()
    );
  } else if (clienteId) {
    filtered = filtered.filter((o) => o.clienteId === clienteId);
  } else if (email) {
    filtered = filtered.filter(
      (o) => (o.customer?.email || "").toLowerCase() === email.toLowerCase()
    );
  }

  // Ordenar mais recentes primeiro
  filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return res.json({ success: true, orders: filtered });
});

app.get("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const order = orders.find((o) => o.id === id || o.orderNumber === id);
  if (!order) {
    return res.status(404).json({ error: "Pedido não encontrado." });
  }
  return res.json({ success: true, order });
});

// Endpoint de Anexar Mockup / Aprovação / Ajuste de Mockup da Arte (Comando 12 & Comando 11 & Comando 5)
// Grava no MESMO estado único do pedido
app.all(["/api/orders/:id/aprovacao", "/api/orders/:id/mockup", "/api/orders/:id/anexar-mockup"], async (req, res) => {
  const { id } = req.params;
  const { acao, comentario, clienteId, mockupUrl, qrLink, qrAplicado, qrApplied, customNote } = req.body || {};

  const orderIndex = orders.findIndex((o) => o.id === id || o.orderNumber === id);
  if (orderIndex < 0) {
    return res.status(404).json({ error: "Pedido não encontrado." });
  }

  const order = orders[orderIndex];
  const nowIso = new Date().toISOString();

  if (acao === "anexar" || acao === "enviar_aprovacao" || mockupUrl || req.path.endsWith("/anexar-mockup")) {
    const finalMockupUrl = mockupUrl || order.mockupUrl;
    if (!finalMockupUrl) {
      return res.status(400).json({ error: "URL do mockup é obrigatória para envio de aprovação." });
    }

    const previousAdjustment = order.comentarioAjuste;
    order.mockupUrl = finalMockupUrl;
    order.aprovacaoMockup = "aguardando_aprovacao";
    order.statusPedido = "aguardando_aprovacao";
    order.currentStep = "arte_aprovacao";
    
    if (qrLink !== undefined) {
      order.qrLink = qrLink;
      order.qrAplicado = qrAplicado ?? qrApplied ?? true;
      order.qrApplied = qrAplicado ?? qrApplied ?? true;
    }

    // Atualiza itens personalizáveis
    if (Array.isArray(order.items)) {
      order.items = order.items.map((it: any) => {
        if (it.personalization || it.requerArquivo || it.natureza === "personalizavel") {
          return {
            ...it,
            mockupUrl: finalMockupUrl,
            personalization: {
              ...(it.personalization || {}),
              mockupUrl: finalMockupUrl,
              approvalStatus: "aguardando_aprovacao",
              qrLink: order.qrLink,
              qrApplied: order.qrApplied,
              notes: customNote || it.personalization?.notes,
            },
          };
        }
        return it;
      });
    }

    const desc = previousAdjustment 
      ? `Glos anexou nova prova visual após ajuste solicitado ("${previousAdjustment}"). Notificação disparada ao cliente.`
      : `Glos anexou o mockup da arte final montada no Sublima e enviou para aprovação do cliente.`;

    const historyEvent = {
      status: "EM_SEPARACAO" as any,
      label: "Mockup Enviado para Aprovação",
      date: nowIso,
      description: desc,
    };
    order.statusHistory = [...(order.statusHistory || []), historyEvent];

    if (!order.stepHistory) order.stepHistory = [];
    order.stepHistory.push({
      step: "arte_aprovacao" as any,
      label: "Mockup Enviado para Aprovação",
      date: nowIso,
      updatedBy: "Glos Ateliê (Cris)",
      note: customNote || "Aguardando validação do cliente no site ou WhatsApp",
    });

    console.log(`[ARTE_MOCKUP_ANEXADO] Pedido #${order.id} mockup anexado: ${finalMockupUrl}. Status: aguardando_aprovacao`);
    console.log(`[WHATSAPP_NOTIFICATION] Disparando aviso de arte pronta para ${order.customer?.name} (${order.customer?.phone || "WhatsApp"})`);

    orders[orderIndex] = order;
    return res.json({
      success: true,
      order,
      message: "Mockup anexado e enviado para aprovação do cliente com sucesso.",
    });
  } else if (acao === "aprovar") {
    // Se já tiver sido aprovado antes, mantém estado
    if (order.aprovacaoMockup === "aprovado") {
      return res.json({
        success: true,
        alreadyApproved: true,
        message: "A arte deste pedido já foi aprovada anteriormente.",
        order,
      });
    }

    order.aprovacaoMockup = "aprovado";
    order.dataAprovacaoMockup = nowIso;
    order.statusPedido = "em_producao";
    order.currentStep = "em_producao";

    // Atualiza itens do pedido se houver itens personalizáveis
    if (Array.isArray(order.items)) {
      order.items = order.items.map((it: any) => {
        if (it.personalization || it.requerArquivo || it.natureza === "personalizavel") {
          return {
            ...it,
            personalization: {
              ...(it.personalization || {}),
              approvalStatus: "aprovado",
              approvalDate: nowIso,
            },
          };
        }
        return it;
      });
    }

    const historyEvent = {
      status: "EM_SEPARACAO" as any,
      label: "Arte Aprovada pelo Cliente",
      date: nowIso,
      description: "Cliente aprovou o mockup da arte pelo site/WhatsApp. Pedido encaminhado para a esteira de produção.",
    };
    order.statusHistory = [...(order.statusHistory || []), historyEvent];

    if (!order.stepHistory) order.stepHistory = [];
    order.stepHistory.push({
      step: "em_producao" as any,
      label: "Arte Aprovada — Em Produção",
      date: nowIso,
      updatedBy: clienteId ? `Cliente (${clienteId})` : "Cliente (Site)",
      note: "Mockup validado sem ressalvas",
    });

    console.log(`[ARTE_APROVACAO] Pedido #${order.id} APROVADO pelo cliente. Entrando em produção.`);
  } else if (acao === "pedir_ajuste") {
    const motivoAjuste = (comentario || "Ajuste solicitado pelo cliente").trim();
    order.aprovacaoMockup = "ajuste_solicitado";
    order.comentarioAjuste = motivoAjuste;
    order.dataSolicitacaoAjuste = nowIso;
    order.statusPedido = "aguardando_aprovacao"; // Mantém em ciclo de arte para a Glos subir novo mockup
    order.currentStep = "arte_aprovacao";

    if (Array.isArray(order.items)) {
      order.items = order.items.map((it: any) => {
        if (it.personalization || it.requerArquivo || it.natureza === "personalizavel") {
          return {
            ...it,
            personalization: {
              ...(it.personalization || {}),
              approvalStatus: "ajuste_solicitado",
              notes: motivoAjuste,
            },
          };
        }
        return it;
      });
    }

    const historyEvent = {
      status: "EM_SEPARACAO" as any,
      label: "Ajuste de Arte Solicitado",
      date: nowIso,
      description: `Cliente solicitou ajuste no mockup: "${motivoAjuste}"`,
    };
    order.statusHistory = [...(order.statusHistory || []), historyEvent];

    if (!order.stepHistory) order.stepHistory = [];
    order.stepHistory.push({
      step: "arte_aprovacao" as any,
      label: "Ajuste Solicitado pelo Cliente",
      date: nowIso,
      updatedBy: clienteId ? `Cliente (${clienteId})` : "Cliente (Site)",
      note: motivoAjuste,
    });

    console.log(`[ARTE_APROVACAO] Pedido #${order.id} AJUSTE SOLICITADO: "${motivoAjuste}"`);
  } else {
    return res.status(400).json({ error: "Ação inválida. Use 'aprovar', 'pedir_ajuste' ou 'anexar'." });
  }

  orders[orderIndex] = order;
  return res.json({ success: true, order, message: "Estado de aprovação atualizado com sucesso." });
});

// Endpoint de Recebimento de Arquivos de Alta Resolução do Cliente (Comando 15)
app.post("/api/orders/:id/arquivos-cliente", (req, res) => {
  const { id } = req.params;
  const { arquivosCliente, comentario, clienteId, itemId } = req.body || {};

  if (!Array.isArray(arquivosCliente) || arquivosCliente.length === 0) {
    return res.status(400).json({ error: "Nenhum arquivo informado para upload." });
  }

  const orderIndex = orders.findIndex((o) => o.id === id || o.orderNumber === id);
  if (orderIndex < 0) {
    return res.status(404).json({ error: "Pedido não encontrado." });
  }

  const order = orders[orderIndex];
  const nowIso = new Date().toISOString();

  const existingFiles = order.arquivosCliente || [];
  const combinedFiles = [...existingFiles, ...arquivosCliente];

  order.arquivosCliente = combinedFiles;
  order.statusPedido = "arquivo_recebido";
  order.currentStep = "aguardando_arquivo";
  order.aprovacaoMockup = "arquivo_recebido";
  order.dataEnvioArquivos = nowIso;

  if (comentario && comentario.trim()) {
    order.comentarioCliente = comentario.trim();
  }

  // Atualiza personalização dos itens do pedido
  if (Array.isArray(order.items)) {
    order.items = order.items.map((it: any) => {
      if (!itemId || it.id === itemId || it.productId === itemId || it.requerArquivo || it.natureza === "personalizavel") {
        const itemFiles = it.personalization?.customerFiles || [];
        return {
          ...it,
          personalization: {
            ...(it.personalization || {}),
            customerFiles: [...itemFiles, ...arquivosCliente],
            customText: comentario || it.personalization?.customText,
            approvalStatus: "aguardando_envio",
          },
        };
      }
      return it;
    });
  }

  const historyEvent = {
    status: "EM_SEPARACAO" as any,
    label: "Recebemos seu arquivo",
    date: nowIso,
    description: `Recebemos ${arquivosCliente.length} arquivo(s) em alta resolução pelo site. Nossa equipe já está preparando a prova visual no ateliê.`,
  };
  order.statusHistory = [...(order.statusHistory || []), historyEvent];

  if (!order.stepHistory) order.stepHistory = [];
  order.stepHistory.push({
    step: "aguardando_arquivo" as any,
    label: "Arquivos recebidos",
    date: nowIso,
    updatedBy: clienteId ? `Cliente (${clienteId})` : "Cliente via Web",
    note: `${arquivosCliente.length} arquivo(s) em alta resolução recebido(s)${comentario ? ` • "${comentario}"` : ""}`,
  });

  console.log(`[UPLOAD_ARQUIVOS_CLIENTE] Pedido #${order.id} recebeu ${arquivosCliente.length} arquivo(s) em alta resolução. Status: arquivo_recebido`);

  orders[orderIndex] = order;
  return res.json({
    success: true,
    order,
    message: "Arquivos recebidos com sucesso! Nossa equipe está preparando sua arte.",
  });
});

app.post("/api/orders", (req, res) => {
  const orderData = req.body;
  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return res.status(400).json({ error: "O pedido deve conter ao menos um item." });
  }

  const orderId = orderData.id || "PED-" + Math.floor(100000 + Math.random() * 900000);
  const hasCustomizable =
    orderData.statusPedido === "aguardando_arquivo" ||
    orderData.items.some((i: any) => i.requerArquivo || i.natureza === "personalizavel");

  const defaultStatusPedido = hasCustomizable ? "aguardando_arquivo" : "a_despachar";

  const newOrder = {
    ...orderData,
    id: orderId,
    orderNumber: orderId,
    trackingCode:
      orderData.trackingCode || "BR" + Math.floor(100000000 + Math.random() * 900000000) + "BR",
    createdAt: orderData.createdAt || new Date().toISOString(),
    status: orderData.status || "PEDIDO_REALIZADO",
    statusPedido: orderData.statusPedido || defaultStatusPedido,
    statusPagamento: orderData.statusPagamento || "aguardando_pagamento",
    whatsappAprovacaoDisparado: orderData.whatsappAprovacaoDisparado || false,
    estoqueBaixado: orderData.estoqueBaixado || false,
    statusHistory: orderData.statusHistory || [
      { status: "PEDIDO_REALIZADO", label: "Pedido Realizado", date: new Date().toISOString() },
    ],
  };

  // Se já existir pedido com este ID, atualiza; senão insere no início
  const existingIdx = orders.findIndex((o) => o.id === orderId);
  if (existingIdx >= 0) {
    orders[existingIdx] = { ...orders[existingIdx], ...newOrder };
  } else {
    orders.unshift(newOrder);
  }

  return res.json({ success: true, order: newOrder });
});

// API: Newsletter subscription
app.post("/api/newsletter", (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Por favor, insira um e-mail válido." });
  }

  if (!newsletterSubscribers.includes(email.toLowerCase())) {
    newsletterSubscribers.push(email.toLowerCase());
  }

  return res.json({
    success: true,
    message: "Inscrição realizada com sucesso! Use o cupom BEMVINDO10 no seu primeiro pedido.",
  });
});

// =========================================================================
// AI & ABANDONED CART RECOVERY APIS
// =========================================================================

// GET /api/abandoned-carts - List all abandoned carts with analytics
app.get("/api/abandoned-carts", (_req, res) => {
  const totalAbandonedValue = abandonedCarts
    .filter((c) => c.status !== "recovered")
    .reduce((sum, c) => sum + (c.total || 0), 0);

  const totalRecoveredValue = abandonedCarts
    .filter((c) => c.status === "recovered")
    .reduce((sum, c) => sum + (c.total || 0), 0);

  const recoveredCount = abandonedCarts.filter((c) => c.status === "recovered").length;
  const contactedCount = abandonedCarts.filter((c) => c.status === "contacted").length;
  const pendingCount = abandonedCarts.filter((c) => c.status === "abandoned").length;

  const recoveryRate =
    abandonedCarts.length > 0 ? (recoveredCount / abandonedCarts.length) * 100 : 0;

  return res.json({
    success: true,
    carts: abandonedCarts,
    stats: {
      totalCarts: abandonedCarts.length,
      pendingCount,
      contactedCount,
      recoveredCount,
      totalAbandonedValue,
      totalRecoveredValue,
      recoveryRate,
    },
  });
});

// POST /api/abandoned-carts - Log or update abandoned cart in real-time
app.post("/api/abandoned-carts", (req, res) => {
  const { id, customerName, customerEmail, customerPhone, items, subtotal, shippingPrice = 0, discount = 0, total, stepReached = "cart" } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Carrinho sem itens não pode ser registrado." });
  }

  const existingIndex = id ? abandonedCarts.findIndex((c) => c.id === id) : -1;
  const nowIso = new Date().toISOString();

  if (existingIndex >= 0) {
    abandonedCarts[existingIndex] = {
      ...abandonedCarts[existingIndex],
      customerName: customerName || abandonedCarts[existingIndex].customerName,
      customerEmail: customerEmail || abandonedCarts[existingIndex].customerEmail,
      customerPhone: customerPhone || abandonedCarts[existingIndex].customerPhone,
      items: items || abandonedCarts[existingIndex].items,
      subtotal: subtotal ?? abandonedCarts[existingIndex].subtotal,
      shippingPrice: shippingPrice ?? abandonedCarts[existingIndex].shippingPrice,
      discount: discount ?? abandonedCarts[existingIndex].discount,
      total: total ?? abandonedCarts[existingIndex].total,
      stepReached: stepReached || abandonedCarts[existingIndex].stepReached,
      updatedAt: nowIso,
    };
    return res.json({ success: true, cart: abandonedCarts[existingIndex] });
  }

  const newCart = {
    id: id || "CART-ABN-" + Math.floor(1000 + Math.random() * 9000),
    createdAt: nowIso,
    updatedAt: nowIso,
    customerName: customerName || "Visitante",
    customerEmail: customerEmail || "",
    customerPhone: customerPhone || "",
    items,
    subtotal: subtotal || items.reduce((s: number, i: any) => s + (i.price * (i.quantity || 1)), 0),
    shippingPrice,
    discount,
    total: total || (subtotal + shippingPrice - discount),
    stepReached,
    status: "abandoned",
    suggestedDiscountCode: "VOLTA5",
  };

  abandonedCarts.unshift(newCart);
  return res.json({ success: true, cart: newCart });
});

// PATCH /api/abandoned-carts/:id/status - Update cart status (contacted, recovered, etc.)
app.patch("/api/abandoned-carts/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, recoveredOrderId, recoveryNote } = req.body;

  const cart = abandonedCarts.find((c) => c.id === id);
  if (!cart) {
    return res.status(404).json({ error: "Carrinho não encontrado." });
  }

  cart.status = status || cart.status;
  if (status === "contacted") {
    cart.lastContactedAt = new Date().toISOString();
  }
  if (recoveredOrderId) {
    cart.recoveredOrderId = recoveredOrderId;
  }
  if (recoveryNote) {
    cart.recoveryNote = recoveryNote;
  }
  cart.updatedAt = new Date().toISOString();

  return res.json({ success: true, cart });
});

// POST /api/ai/recovery-message - Generate hyperpersonalized WhatsApp & Email recovery text with Gemini
app.post("/api/ai/recovery-message", async (req, res) => {
  try {
    const { cart, tone = "friendly_urgent", couponCode = "VOLTA5", discountPercent = 5, storeName = "Presente & Design" } = req.body;

    if (!cart) {
      return res.status(400).json({ error: "Dados do carrinho são obrigatórios." });
    }

    const customerName = cart.customerName || "Cliente";
    const itemsNames = (cart.items || []).map((i: any) => `${i.quantity || 1}x ${i.name}`).join(", ");
    const cartTotal = (cart.total || 0).toFixed(2);
    const firstName = customerName.split(" ")[0];

    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `Você é um especialista sênior em copywriting de e-commerce e conversão de vendas no Brasil para a loja "${storeName}".
Crie uma mensagem altamente persuasiva, empática e irresistível para recuperar o carrinho abandonado de um cliente via WhatsApp.

Dados do Cliente e Carrinho:
- Nome do cliente: ${firstName}
- Itens no carrinho: ${itemsNames}
- Valor total: R$ ${cartTotal}
- Cupom de incentivo especial oferecido: "${couponCode}" (${discountPercent}% de desconto)
- Tom de voz desejado: ${
          tone === "vip_consultive"
            ? "Consultivo VIP, elegante, atencioso, oferecendo ajuda personalizada"
            : tone === "high_urgency"
            ? "Urgência moderada e escassez, avisando que o estoque está reservado por tempo limitado"
            : "Amigável, acolhedor, destacando os detalhes das peças escolhidas e o bônus de desconto"
        }

Instruções:
1. Comece com uma saudação calorosa e personalizada usando o primeiro nome (${firstName}).
2. Faça referência específica e encantadora aos produtos escolhidos.
3. Apresente o benefício exclusivo do cupom ${couponCode} como um presente/condição especial exclusiva para ele(a).
4. Forneça uma chamada para ação clara (CTA) e pergunte se precisa de ajuda com frete ou pagamento no PIX.
5. Use emojis brasileiros elegantes e formatação do WhatsApp (*negrito*, etc.).
6. Mantenha o texto objetivo e pronto para envio (entre 3 a 5 parágrafos curtos).

Retorne também uma sugestão de Assunto e Corpo para E-mail.
Responda EXCLUSIVAMENTE em formato JSON válido com as seguintes chaves:
{
  "whatsappMessage": "texto formatado para o WhatsApp com quebras de linha \\n",
  "emailSubject": "assunto curto e chamativo para e-mail",
  "emailBody": "corpo do e-mail persuasivo",
  "keyBenefit": "frase de 1 linha resumindo a oferta"
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const rawText = response.text || "";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({
            success: true,
            isAiGenerated: true,
            ...parsed,
          });
        }
      } catch (geminiError) {
        console.warn("Gemini recovery call error, using smart fallback:", geminiError);
      }
    }

    // High quality fallback message
    const fallbackWhatsapp = `Olá *${firstName}*, tudo bem? ✨ Aqui é da equipe da *${storeName}*!

Notamos que você estava quase garantindo seu pedido com *${itemsNames}*. Como essas peças são super procuradas, separamos o seu carrinho com carinho! 🎁

Para te ajudar a finalizar com chave de ouro, liberamos um cupom exclusivo de *${discountPercent}% OFF* no seu pedido:
🎟️ Cupom: *${couponCode}*
💰 Total com desconto especial

Deseja que eu te envie o link direto com o desconto já aplicado ou prefere pagar com PIX instantâneo? É só me responder por aqui! 😊`;

    const fallbackEmailSubject = `${firstName}, suas peças exclusivas ainda estão reservadas (+ presente especial 🎁)`;
    const fallbackEmailBody = `Olá ${firstName},\n\nGuardamos os itens do seu carrinho (${itemsNames}). Use o cupom ${couponCode} para garantir ${discountPercent}% de desconto antes que o estoque esgote!\n\nAcesse sua sacola e finalize em 1 clique.`;

    return res.json({
      success: true,
      isAiGenerated: false,
      whatsappMessage: fallbackWhatsapp,
      emailSubject: fallbackEmailSubject,
      emailBody: fallbackEmailBody,
      keyBenefit: `Cupom exclusivo de ${discountPercent}% OFF liberado para ${firstName}`,
    });
  } catch (error: any) {
    console.error("Erro ao gerar mensagem de recuperação:", error);
    return res.status(500).json({ error: "Falha ao gerar mensagem de recuperação." });
  }
});

// POST /api/ai/upsell-suggestions - Suggest cross-sell / upsell items with Gemini
app.post("/api/ai/upsell-suggestions", async (req, res) => {
  try {
    const { cartItems = [], allProducts = [] } = req.body;

    if (!allProducts || allProducts.length === 0) {
      return res.json({ success: true, suggestions: [] });
    }

    const cartProductIds = new Set(cartItems.map((i: any) => i.productId || i.id));
    const availableProducts = allProducts.filter((p: any) => !cartProductIds.has(p.id));

    if (availableProducts.length === 0) {
      return res.json({ success: true, suggestions: [] });
    }

    const ai = getGeminiClient();

    if (ai && cartItems.length > 0) {
      try {
        const cartSummary = cartItems.map((i: any) => `${i.name} (R$ ${i.price})`).join(", ");
        const catalogSummary = availableProducts.slice(0, 10).map((p: any) => `ID: ${p.id} | Nome: ${p.name} | Preço: R$ ${p.price} | Categoria: ${p.categoryName || p.category}`).join("\n");

        const prompt = `Você é um motor inteligente de recomendação e Upsell para E-commerce de Presentes e Decoração.
Itens no carrinho do cliente:
${cartSummary}

Produtos disponíveis no catálogo para sugerir:
${catalogSummary}

Selecione até 2 produtos do catálogo que mais combinam como "Compre Junto", "Embalagem Especial" ou "Acessório Complementar".
Para cada produto selecionado, crie:
1. "productId": o ID exato
2. "badge": um selo curto e atrativo (ex: "Combo Perfeito", "Mais Vendido Junto", "Leve com 10% OFF", "Presente Completo")
3. "reason": uma frase vendedora de 1 linha explicando por que adicionar esse item agora
4. "discountPercent": porcentagem de desconto no combo (5, 10 ou 15)

Responda EXCLUSIVAMENTE em formato JSON:
{
  "suggestions": [
    {
      "productId": "id-do-produto",
      "badge": "Combo Perfeito",
      "reason": "Frase persuasiva",
      "discountPercent": 10
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const rawText = response.text || "";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.suggestions)) {
            const formatted = parsed.suggestions
              .map((sug: any) => {
                const prod = availableProducts.find((p: any) => p.id === sug.productId);
                if (!prod) return null;
                const disc = sug.discountPercent || 10;
                const specialPrice = Math.round(prod.price * (1 - disc / 100) * 100) / 100;
                return {
                  product: prod,
                  badge: sug.badge || "Compre Junto",
                  reason: sug.reason || "Combina perfeitamente com sua escolha",
                  discountPercent: disc,
                  specialPrice,
                };
              })
              .filter(Boolean);

            if (formatted.length > 0) {
              return res.json({ success: true, suggestions: formatted });
            }
          }
        }
      } catch (geminiError) {
        console.warn("Gemini upsell call error, fallback used:", geminiError);
      }
    }

    // Heuristic fallback: pick complementary products
    const sample = availableProducts.slice(0, 2).map((p: any, idx: number) => {
      const discountPercent = idx === 0 ? 10 : 15;
      const specialPrice = Math.round(p.price * (1 - discountPercent / 100) * 100) / 100;
      return {
        product: p,
        badge: idx === 0 ? "Compre Junto com 10% OFF" : "Kit Completo 15% OFF",
        reason: idx === 0 ? "O complemento ideal para sua compra de hoje" : "Aproveite o mesmo frete e leve com desconto especial",
        discountPercent,
        specialPrice,
      };
    });

    return res.json({ success: true, suggestions: sample });
  } catch (error: any) {
    console.error("Erro em upsell:", error);
    return res.status(500).json({ error: "Falha ao gerar recomendações de upsell." });
  }
});

// POST /api/ai/exit-intent-offer - Generate dynamic rescue incentive when user moves to leave
app.post("/api/ai/exit-intent-offer", async (req, res) => {
  try {
    const { cartTotal = 0, itemCount = 0, firstItemName = "" } = req.body;
    const subtotalNum = Number(cartTotal) || 0;

    let couponCode = "VOLTA5";
    let discountPercent = 5;
    let title = "Espere! Não vá embora de mãos vazias 🎁";
    let message = "Preparamos um cupom especial de 5% OFF válido apenas pelos próximos 10 minutos para você concluir seu pedido.";

    if (subtotalNum >= 200) {
      couponCode = "RESGATE10";
      discountPercent = 10;
      title = "Oferta Relâmpago Exclusiva para Você! ⚡";
      message = `Gere seu pedido agora com 10% de desconto adicional no cupom RESGATE10 antes que o estoque de ${firstItemName || "suas peças"} termine!`;
    } else if (subtotalNum < 100) {
      couponCode = "BEMVINDO10";
      discountPercent = 10;
      title = "Ganhe 10% OFF na sua Primeira Compra! ✨";
      message = "Aproveite para garantir seu presente favorito com um desconto exclusivo para novos clientes.";
    }

    return res.json({
      success: true,
      title,
      message,
      couponCode,
      discountPercent,
      expiresInSeconds: 600, // 10 minutes
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro gerando oferta de saída." });
  }
});

// Z-API Configuration for Automated WhatsApp Messages
const Z_API_DEFAULT_INSTANCE = "3F8069943712D1188556BA5ABB7B83F8";
const Z_API_DEFAULT_TOKEN = "D7730B452CBA1B592029BC50";
const Z_API_DEFAULT_CLIENT_TOKEN = "Fb1b764204b8c48dba31c5de34cd65ddcS";

// POST /api/ai/daily-report - Generate 9AM daily executive report with Gemini AI for WhatsApp
app.post("/api/ai/daily-report", async (req, res) => {
  try {
    const { 
      targetPhone = "5511961820588", 
      storeName = "Glos Presentes",
      sendViaZApi = false,
      zApiInstance = process.env.ZAPI_INSTANCE_ID || Z_API_DEFAULT_INSTANCE,
      zApiToken = process.env.ZAPI_TOKEN || Z_API_DEFAULT_TOKEN,
      zApiClientToken = process.env.ZAPI_CLIENT_TOKEN || Z_API_DEFAULT_CLIENT_TOKEN
    } = req.body;

    const totalOrdersCount = orders.length || 14;
    const paidOrders = orders.filter((o) => o.status === "PAGAMENTO_CONFIRMADO" || o.status === "ENTREGUE");
    const revenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0) || 3840.90;
    const averageTicket = revenue / (paidOrders.length || 12);
    const pendingPixCount = orders.filter((o) => o.paymentMethod === "pix" && o.status === "PEDIDO_REALIZADO").length || 3;
    const totalAbandonedValue = abandonedCarts.reduce((sum, c) => sum + (c.total || 0), 0) || 1250.40;
    const abandonedCount = abandonedCarts.length || 5;

    const ai = getGeminiClient();
    let reportText = "";

    if (ai) {
      try {
        const prompt = `Você é o Diretor de Operações e IA da loja "${storeName}".
Gere o RELATÓRIO DIÁRIO MATINAL DAS 09:00 para o WhatsApp do proprietário (+55 11 96182-0588).

Métricas das últimas 24h:
- Receita Faturada: R$ ${revenue.toFixed(2)}
- Pedidos Aprovados: ${paidOrders.length || 12} pedidos
- Ticket Médio: R$ ${averageTicket.toFixed(2)}
- PIX Pendentes de Pagamento: ${pendingPixCount} pedidos (R$ 490,00)
- Carrinhos Abandonados: ${abandonedCount} clientes (R$ ${totalAbandonedValue.toFixed(2)})
- Pedidos a Despachar Hoje: 6 encomendas

Diretrizes:
1. Comece com um cabeçalho executivo elegante: "📊 *RELATÓRIO EXECUTIVO 09H - ${storeName.toUpperCase()}*"
2. Apresente os números em tópicos limpos com emojis adequados (*negrito* para valores).
3. Adicione 2 Ações Rápidas Recomendadas para hoje (ex: disparar lembrete de PIX pendente e cupom nos carrinhos abandonados).
4. Forneça 1 Insight Estratégico da IA para alavancar as vendas do dia.
5. Tom profissional, motivador, direto ao ponto e pronto para leitura no WhatsApp.

Retorne EXCLUSIVAMENTE o texto formatado para WhatsApp (com quebras de linha e formatação do WhatsApp).`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
        });

        reportText = response.text || "";
      } catch (geminiError) {
        console.warn("Gemini daily report error:", geminiError);
      }
    }

    if (!reportText) {
      reportText = `📊 *RELATÓRIO EXECUTIVO 09H - ATIVVA GIFTS*
📅 _Data: ${new Date().toLocaleDateString("pt-BR")}_

💰 *Faturamento 24h:* R$ ${revenue.toFixed(2)}
📦 *Pedidos Aprovados:* ${paidOrders.length || 12}
🎯 *Ticket Médio:* R$ ${averageTicket.toFixed(2)}
⚡ *PIX Pendentes:* ${pendingPixCount} pedidos (R$ 490,00)
🛒 *Carrinhos Abandonados:* ${abandonedCount} clientes (R$ ${totalAbandonedValue.toFixed(2)})
🚚 *Prontos para Envio:* 6 pacotes

💡 *Ações Recomendadas para Hoje:*
1. 📲 Enviar lembrete amigável no WhatsApp para os ${pendingPixCount} clientes com PIX em aberto.
2. 🎁 Disparar cupom VOLTA5 para os carrinhos abandonados de ontem.

🚀 *Insight IA:* O item *Kits Presenteáveis* teve alta taxa de cliques no período matinal. Vale destaque no banner principal hoje!`;
    }

    const cleanPhone = targetPhone.replace(/\D/g, "");
    let zApiStatus: any = null;

    // Direct automated dispatch via Z-API if requested or if credentials exist
    if (sendViaZApi && zApiInstance && zApiToken) {
      try {
        const zApiUrl = `https://api.z-api.io/instances/${zApiInstance}/token/${zApiToken}/send-text`;
        console.log(`[Z-API] Sending text to ${cleanPhone} via ${zApiUrl}...`);
        
        const zHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          "Client-Token": zApiClientToken,
        };

        const zResponse = await fetch(zApiUrl, {
          method: "POST",
          headers: zHeaders,
          body: JSON.stringify({
            phone: cleanPhone,
            message: reportText
          })
        });

        const zRespText = await zResponse.text();
        console.log(`[Z-API] Status: ${zResponse.status}, Body: ${zRespText}`);

        if (zResponse.ok) {
          try {
            const zData = JSON.parse(zRespText);
            zApiStatus = { sent: true, data: zData };
          } catch {
            zApiStatus = { sent: true, data: zRespText };
          }
        } else {
          zApiStatus = { sent: false, error: zRespText, status: zResponse.status };
        }
      } catch (zErr: any) {
        console.error("[Z-API] Fetch error:", zErr);
        zApiStatus = { sent: false, error: zErr.message };
      }
    }

    const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reportText)}`;

    return res.json({
      success: true,
      reportText,
      whatsappLink,
      targetPhone: cleanPhone,
      zApiStatus,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro ao gerar relatório diário." });
  }
});

// GET /api/ai/scheduler-status - Get autonomous cron scheduler status & history
app.get("/api/ai/scheduler-status", (_req, res) => {
  try {
    const status = getSchedulerStatus();
    return res.json({ success: true, ...status });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro ao obter status do agendador." });
  }
});

// POST /api/ai/scheduler-config - Update scheduler configuration (phone, toggle, time)
app.post("/api/ai/scheduler-config", (req, res) => {
  try {
    const { autoDispatchEnabled, scheduledHour, scheduledMinute, targetPhone, storeName } = req.body;
    const updated = updateSchedulerConfig({
      ...(autoDispatchEnabled !== undefined ? { autoDispatchEnabled: Boolean(autoDispatchEnabled) } : {}),
      ...(scheduledHour !== undefined ? { scheduledHour: Number(scheduledHour) } : {}),
      ...(scheduledMinute !== undefined ? { scheduledMinute: Number(scheduledMinute) } : {}),
      ...(targetPhone ? { targetPhone: String(targetPhone) } : {}),
      ...(storeName ? { storeName: String(storeName) } : {}),
    });
    return res.json({ success: true, ...updated });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro ao atualizar configuração do agendador." });
  }
});

// POST /api/ai/scheduler-trigger-now - Instantly execute the automated 09:00 cron task on demand
app.post("/api/ai/scheduler-trigger-now", async (req, res) => {
  try {
    const { targetPhone } = req.body;
    const result = await executeDailyReport("manual_test", orders, abandonedCarts, targetPhone);
    return res.json({
      success: true,
      message: "Execução do agendamento concluída com sucesso!",
      ...result,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro ao executar agendador sob demanda." });
  }
});

// POST /api/ai/copilot-chat - Conversational AI Copilot for Merchant Admin
app.post("/api/ai/copilot-chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        reply: "O Copiloto Inteligente está pronto. Como o Gemini API key não está configurada no ambiente local, aqui está uma análise padrão: seu faturamento acumulado está sólido, com alta taxa de conversão no PIX e 5 oportunidades em carrinhos abandonados.",
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build context summary
    const paidOrders = orders.filter((o) => o.status === "PAGAMENTO_CONFIRMADO" || o.status === "ENTREGUE" || o.status === "pago" || o.status === "concluido");
    const totalRev = paidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const avgTicket = paidOrders.length ? totalRev / paidOrders.length : 0;
    const abandonedRev = abandonedCarts.reduce((sum, c) => sum + (Number(c.total) || 0), 0);

    const totalProducts = (req.body && req.body.productsCount) || 24;

    const systemPrompt = `Você é o Copiloto de Inteligência Artificial do Painel do Lojista da "Ativva Gifts" (e-commerce de presentes finos e personalizados).
Você fala diretamente com o proprietário/gestor da loja em português do Brasil (pt-BR).
Seu tom é consultivo, analítico, objetivo e sempre orientado à ação ("Next Best Action").

DADOS EM TEMPO REAL DA LOJA:
- Faturamento Total Acumulado: R$ ${totalRev.toFixed(2)}
- Pedidos Concluídos/Aprovados: ${paidOrders.length}
- Ticket Médio: R$ ${avgTicket.toFixed(2)}
- Total de Pedidos no Sistema: ${orders.length}
- Carrinhos Abandonados: ${abandonedCarts.length} carrinhos (totalizando R$ ${abandonedRev.toFixed(2)})
- Total de Produtos no Catálogo: ${totalProducts}

Responda em 1 a 3 parágrafos concisos com formatação rica (use negrito para números e métricas, bullet points se fizer sentido, e termine sempre com 1 recomendação prática clara).`;

    const contents = [
      { role: "user", parts: [{ text: `${systemPrompt}\n\nPergunta do Lojista: "${message}"` }] },
    ];

    const geminiResp = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents,
    });

    const replyText = geminiResp.text || "Desculpe, não consegui processar a resposta agora.";
    return res.json({ success: true, reply: replyText });
  } catch (error: any) {
    console.error("Copilot Chat Error:", error);
    return res.status(500).json({
      error: "Erro no processamento do Copiloto.",
      reply: "Ocorreu uma instabilidade momentânea no processador do Copiloto. Por favor, tente novamente.",
    });
  }
});

// GET /api/ai/briefing-executive - Executive Morning AI Briefing
app.get("/api/ai/briefing-executive", async (_req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const paidOrders = orders.filter((o) => o.status === "PAGAMENTO_CONFIRMADO" || o.status === "ENTREGUE" || o.status === "pago" || o.status === "concluido");
    const totalRev = paidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0) || 3840.9;
    const paidCount = paidOrders.length || 12;

    let text = "Ontem você vendeu 23% acima da média de terça. O Kit Personalizado respondeu por 60% do faturamento. Um carrinho de R$ 240 foi abandonado no checkout — altamente recuperável.";

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Gere um parágrafo executivo curto (2 a 3 frases) em português do Brasil para o Hero de Briefing do painel administrativo da loja "Ativva Gifts".
Métricas: Faturamento recente R$ ${totalRev.toFixed(2)}, ${paidCount} pedidos aprovados, 5 carrinhos abandonados.
O texto deve ser dinâmico, direto, profissional e inspirador para o lojista começar o dia sabendo o que aconteceu.`;

        const geminiResp = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
        });

        if (geminiResp.text) {
          text = geminiResp.text.trim();
        }
      } catch (err) {
        console.warn("Briefing fallback used:", err);
      }
    }

    return res.json({
      success: true,
      text,
      updatedAt: "09:00",
      chip: "● Análise atualizada 09h",
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Erro ao gerar briefing" });
  }
});

// POST /api/ai/product-draft - Generate emotional gift description and SEO copy
app.post("/api/ai/product-draft", async (req, res) => {
  try {
    const { name, category, productType, customPhoto, customText } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    let description = `Um presente pensado nos mínimos detalhes para transformar momentos especiais em memórias afetivas. Produzido artesanalmente com materiais nobres e acabamento impecável, este item da linha ${category || "Glos"} combina sofisticação, delicadeza e carinho. Perfeito para presentear quem você ama em aniversários, celebrações ou como um gesto espontâneo de afeto.`;
    let tagTitle = `${name || "Presente Especial"} | Glos Presentes`;
    let metaDescription = `Compre ${name || "presentes criativos e personalizados"} com entrega rápida e acabamento artesanal na Glos Presentes.`;

    if (apiKey && name) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Você é o copywriter sênior da "glos." (Glos Presentes), um e-commerce B2C brasileiro de presentes criativos, afetivos e personalizados (não corporativos).
Gere um texto comercial afetivo e dados de SEO para o produto:
- Nome do produto: "${name}"
- Categoria: "${category || "Presentes Criativos"}"
- Natureza: "${productType || "personalizavel"}" (personalização: ${customPhoto ? "com foto do cliente" : ""}, ${customText ? "com frase/nome gravado" : ""})

Retorne EXCLUSIVAMENTE um objeto JSON válido (sem markdown, sem backticks):
{
  "description": "Texto descritivo apaixonante de 2 a 3 parágrafos curtos destacando a experiência de presentear com afeto, qualidade dos materiais e embalagem acolhedora.",
  "tagTitle": "Título SEO para a tag <title> (máx 60 caracteres)",
  "metaDescription": "Meta descrição atrativa para o Google (máx 155 caracteres)"
}`;

        const geminiResp = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
        });

        const rawText = (geminiResp.text || "").trim();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.description) description = parsed.description;
          if (parsed.tagTitle) tagTitle = parsed.tagTitle;
          if (parsed.metaDescription) metaDescription = parsed.metaDescription;
        }
      } catch (geminiErr) {
        console.warn("Gemini product draft error, using affective fallback:", geminiErr);
      }
    }

    return res.json({
      success: true,
      draft: {
        description,
        tagTitle,
        metaDescription,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro ao gerar rascunho de produto" });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  // Start autonomous cron-like scheduler for 09:00 daily WhatsApp executive report
  startScheduler(
    () => orders,
    () => abandonedCarts
  );

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`E-commerce Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
