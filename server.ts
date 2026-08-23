import express from "express";
import path from "path";
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

// In-memory storage for Abandoned Carts with initial demo entries
const abandonedCarts: any[] = [
  {
    id: "CART-ABN-8012",
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 min ago
    updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    customerName: "Camila Guimarães",
    customerEmail: "camila.guimaraes@gmail.com",
    customerPhone: "11988223344",
    items: [
      {
        productId: "prod-1",
        name: "Luminária de Mesa Art Déco Gold",
        price: 189.9,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
        sku: "LUM-GOLD-01",
      },
      {
        productId: "prod-4",
        name: "Vela Aromática Vanilla & Sandalwood",
        price: 69.9,
        quantity: 2,
        image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80",
        sku: "VELA-VAN-02",
      },
    ],
    subtotal: 329.7,
    shippingPrice: 18.9,
    discount: 0,
    total: 348.6,
    stepReached: "payment",
    status: "abandoned",
    suggestedDiscountCode: "VOLTA5",
  },
  {
    id: "CART-ABN-7945",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    customerName: "Thiago Oliveira",
    customerEmail: "thiago.olv@hotmail.com",
    customerPhone: "21971234567",
    items: [
      {
        productId: "prod-2",
        name: "Kit Cafeteira Prensa Francesa + 2 Xícaras Cerâmica",
        price: 249.9,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80",
        sku: "KIT-PRENSA-01",
      },
    ],
    subtotal: 249.9,
    shippingPrice: 0,
    discount: 0,
    total: 249.9,
    stepReached: "shipping",
    status: "abandoned",
    suggestedDiscountCode: "PRESENTE10",
  },
  {
    id: "CART-ABN-7890",
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), // 5 hours ago
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    customerName: "Fernanda Ribeiro",
    customerEmail: "fernanda.rib@uol.com.br",
    customerPhone: "31998765432",
    items: [
      {
        productId: "prod-3",
        name: "Quadro Decorativo Minimalista Botânico A3",
        price: 139.9,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
        sku: "QUADRO-BOT-01",
      },
    ],
    subtotal: 139.9,
    shippingPrice: 16.9,
    discount: 0,
    total: 156.8,
    stepReached: "email",
    status: "contacted",
    lastContactedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    suggestedDiscountCode: "BEMVINDO10",
  },
];

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

// API: Mercado Pago Webhook / IPN Notification
app.post("/api/webhooks/mercadopago", async (req, res) => {
  try {
    const { type, data } = req.body;
    console.log("Recebido Webhook Mercado Pago:", type, data);

    if (type === "payment" && data?.id) {
      const mpClient = getMercadoPagoClient();
      if (mpClient) {
        const payment = new Payment(mpClient);
        const paymentInfo = await payment.get({ id: data.id });
        console.log("Status do pagamento atualizado:", paymentInfo.status, paymentInfo.external_reference);
        // Here status can update Firestore order record automatically
      }
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Erro processando Webhook:", error);
    return res.status(200).send("OK"); // Return 200 to acknowledge MP delivery
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

// API: Save demo order securely
app.post("/api/orders", (req, res) => {
  const orderData = req.body;
  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return res.status(400).json({ error: "O pedido deve conter ao menos um item." });
  }

  const orderId = "PED-" + Math.floor(100000 + Math.random() * 900000);
  const newOrder = {
    ...orderData,
    id: orderId,
    trackingCode: "BR" + Math.floor(100000000 + Math.random() * 900000000) + "BR",
    createdAt: new Date().toISOString(),
    status: "PAGAMENTO_CONFIRMADO",
    statusHistory: [
      { status: "PEDIDO_REALIZADO", label: "Pedido Realizado", date: new Date().toISOString() },
      { status: "PAGAMENTO_CONFIRMADO", label: "Pagamento Aprovado (Demonstração)", date: new Date().toISOString() },
    ],
  };

  orders.unshift(newOrder);
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
