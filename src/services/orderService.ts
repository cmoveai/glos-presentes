import {
  Order,
  OrderType,
  OrderStep,
  CartLink,
  AbandonedCart,
  ItemPersonalization,
  CustomerFile,
} from "../types";

const ORDERS_STORAGE_KEY = "glos_admin_orders_v1";
const CART_LINKS_STORAGE_KEY = "glos_admin_cart_links_v1";
const ABANDONED_CARTS_STORAGE_KEY = "glos_admin_abandoned_carts_v1";

/**
 * Mock inicial e coerente de pedidos para Glos Presentes
 */
export const INITIAL_ORDERS: Order[] = [
  {
    id: "GLOS-9482",
    orderNumber: "#9482",
    createdAt: "22 Mai, 26 • 14:15",
    orderType: "personalizado",
    currentStep: "arte_aprovacao",
    status: "PAGAMENTO_CONFIRMADO",
    statusHistory: [
      { status: "PEDIDO_REALIZADO", label: "Pedido criado", date: "22 Mai, 26 • 14:10" },
      { status: "PAGAMENTO_CONFIRMADO", label: "PIX aprovado instantâneo", date: "22 Mai, 26 • 14:15" },
    ],
    stepHistory: [
      { step: "pago", label: "Pagamento Confirmado", date: "22 Mai, 26 • 14:15" },
      { step: "aguardando_arquivo", label: "Arquivo enviado pelo cliente", date: "22 Mai, 26 • 14:35", updatedBy: "Cliente via Web" },
      { step: "arte_aprovacao", label: "Arte enviada para aprovação", date: "22 Mai, 26 • 15:00", updatedBy: "Design Glos" },
    ],
    items: [
      {
        id: "item-1",
        productId: "prod-caneca-foto",
        name: "Caneca Foto & Frase Afeto",
        sku: "GLOS-CAN-FOT-001",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80",
        price: 64.9,
        costPrice: 18.0,
        quantity: 1,
        variantName: "Cerâmica Branca • 325ml",
        productType: "personalizavel",
        personalization: {
          customerFiles: [
            {
              id: "file-1",
              name: "foto_viagem_casal_paris.jpg",
              url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=500&q=80",
              type: "imagem",
              size: "2.4 MB",
              uploadedAt: "22 Mai, 26 • 14:35",
            },
          ],
          customText: "Para o melhor companheiro de aventuras do mundo!",
          mockupUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
          qrLink: "https://glos.com.br/play/v/glos-9482-afeto",
          qrApplied: true,
          interactivePlayType: "musica_spotify",
          approvalStatus: "aguardando_aprovacao",
          notes: "Cliente pediu para focar o rosto na impressão sem cortar as flores.",
        },
      },
    ],
    subtotal: 64.9,
    shippingPrice: 14.5,
    discount: 0,
    total: 79.4,
    costTotal: 18.0,
    profitTotal: 46.9,
    paymentMethod: "pix",
    paymentStatus: "pago",
    paymentDetails: {
      pixCode: "00020126580014br.gov.bcb.pix0136glos...",
      isLiveGateway: true,
    },
    shippingOption: {
      id: "jadlog-package",
      name: "Jadlog Package Express",
      deadline: "3 dias úteis",
      price: 14.5,
      originalPrice: 18.9,
    },
    shippingAddress: {
      id: "addr-1",
      recipientName: "Camila Guimarães Rocha",
      zipCode: "04571-010",
      street: "Avenida Engenheiro Luís Carlos Berrini",
      number: "1200",
      complement: "Apto 84B",
      neighborhood: "Brooklin",
      city: "São Paulo",
      state: "SP",
      phone: "(11) 98765-4321",
    },
    customer: {
      name: "Camila Guimarães Rocha",
      email: "camila.guimaraes@gmail.com",
      phone: "(11) 98765-4321",
      cpf: "348.912.448-02",
      personType: "PF",
      totalOrdersCount: 3,
    },
    giftWrap: true,
    giftCardMessage: "Com todo amor do mundo para celebrar o nosso 3º aniversário!",
    actionRequired: {
      needed: true,
      reason: "Arte aguardando aprovação do cliente via WhatsApp há 12h",
      urgency: "media",
    },
    internalNotes: [
      {
        id: "note-1",
        text: "Mockup gerado e enviado para o WhatsApp da cliente.",
        date: "22 Mai, 26 • 15:05",
        author: "Mariana (Atendimento)",
      },
    ],
  },
  {
    id: "GLOS-9481",
    orderNumber: "#9481",
    createdAt: "22 Mai, 26 • 11:20",
    orderType: "personalizado",
    currentStep: "em_producao",
    status: "PAGAMENTO_CONFIRMADO",
    statusHistory: [
      { status: "PEDIDO_REALIZADO", label: "Pedido criado", date: "22 Mai, 26 • 11:15" },
      { status: "PAGAMENTO_CONFIRMADO", label: "Cartão de crédito aprovado", date: "22 Mai, 26 • 11:20" },
    ],
    stepHistory: [
      { step: "pago", label: "Pagamento Confirmado", date: "22 Mai, 26 • 11:20" },
      { step: "aguardando_arquivo", label: "Arquivos recebidos", date: "22 Mai, 26 • 11:30" },
      { step: "arte_aprovacao", label: "Arte Aprovada pelo cliente", date: "22 Mai, 26 • 12:15" },
      { step: "em_producao", label: "Entrou na prensa de sublimação", date: "22 Mai, 26 • 13:00", updatedBy: "Oficina Glos" },
    ],
    items: [
      {
        id: "item-2",
        productId: "prod-quadro-spotify",
        name: "Quadro Acrílico Spotify Interativo",
        sku: "GLOS-QDR-SPT-002",
        image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80",
        price: 119.9,
        costPrice: 32.0,
        quantity: 1,
        variantName: "Acrílico Cristal 20x25cm • Base Madeira Nobre",
        productType: "personalizavel",
        personalization: {
          customerFiles: [
            {
              id: "file-2",
              name: "foto_aniversario_namoro.jpg",
              url: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=500&q=80",
              type: "imagem",
              size: "3.1 MB",
            },
          ],
          customText: "Alceu Valença - Anunciação (Nossa música)",
          mockupUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80",
          qrLink: "https://open.spotify.com/track/123456789",
          qrApplied: true,
          interactivePlayType: "musica_spotify",
          approvalStatus: "aprovado",
          approvalDate: "22 Mai, 26 • 12:15",
        },
      },
    ],
    subtotal: 119.9,
    shippingPrice: 19.9,
    discount: 10.0,
    couponCode: "BEMVINDO10",
    total: 129.8,
    costTotal: 32.0,
    profitTotal: 77.9,
    paymentMethod: "credit_card",
    paymentStatus: "pago",
    paymentDetails: {
      cardBrand: "Mastercard",
      cardLast4: "4092",
      installments: 2,
    },
    shippingOption: {
      id: "sedex-correios",
      name: "Sedex Correios",
      deadline: "2 dias úteis",
      price: 19.9,
      originalPrice: 24.5,
    },
    shippingAddress: {
      id: "addr-2",
      recipientName: "Lucas Mendonça de Souza",
      zipCode: "22041-001",
      street: "Rua Barata Ribeiro",
      number: "450",
      complement: "Apto 302",
      neighborhood: "Copacabana",
      city: "Rio de Janeiro",
      state: "RJ",
      phone: "(21) 99887-1122",
    },
    customer: {
      name: "Lucas Mendonça de Souza",
      email: "lucas.mendonca@uol.com.br",
      phone: "(21) 99887-1122",
      cpf: "219.405.887-19",
      personType: "PF",
      totalOrdersCount: 1,
    },
    giftWrap: true,
    giftCardMessage: "Para a pessoa que ilumina todos os meus dias!",
    internalNotes: [
      {
        id: "note-2",
        text: "Arte aprovada sem ressalvas pelo cliente. Já em corte a laser do acrílico.",
        date: "22 Mai, 26 • 13:02",
        author: "Felipe (Oficina)",
      },
    ],
  },
  {
    id: "GLOS-9480",
    orderNumber: "#9480",
    createdAt: "22 Mai, 26 • 09:40",
    orderType: "revenda",
    currentStep: "separar",
    status: "PAGAMENTO_CONFIRMADO",
    statusHistory: [
      { status: "PEDIDO_REALIZADO", label: "Pedido criado", date: "22 Mai, 26 • 09:35" },
      { status: "PAGAMENTO_CONFIRMADO", label: "PIX aprovado", date: "22 Mai, 26 • 09:40" },
    ],
    stepHistory: [
      { step: "pago", label: "Pagamento Confirmado", date: "22 Mai, 26 • 09:40" },
      { step: "separar", label: "Aguardando separação em estoque", date: "22 Mai, 26 • 10:00", updatedBy: "Sistema" },
    ],
    items: [
      {
        id: "item-3",
        productId: "prod-vela-lavanda",
        name: "Vela Aromática Artesanal Lavanda & Baunilha",
        sku: "GLOS-VEL-LAV-003",
        image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400&q=80",
        price: 49.9,
        costPrice: 14.5,
        quantity: 2,
        variantName: "Pote Vidro Âmbar • 180g",
        productType: "simples",
      },
      {
        id: "item-4",
        productId: "prod-caneca-snoopy",
        name: "Caneca Colecionável Snoopy & Woodstock",
        sku: "LIC-PEA-SNP-004",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80",
        price: 89.9,
        costPrice: 38.0,
        quantity: 1,
        variantName: "Linha Licenciada Peanuts",
        productType: "licenciado",
      },
    ],
    subtotal: 189.7,
    shippingPrice: 0,
    discount: 0,
    total: 189.7,
    costTotal: 67.0,
    profitTotal: 122.7,
    paymentMethod: "pix",
    paymentStatus: "pago",
    paymentDetails: {
      pixCode: "00020126580014br.gov.bcb.pix...",
      isLiveGateway: true,
    },
    shippingOption: {
      id: "frete-gratis",
      name: "Frete Grátis Glos Express",
      deadline: "4 dias úteis",
      price: 0,
      originalPrice: 22.0,
      isFree: true,
    },
    shippingAddress: {
      id: "addr-3",
      recipientName: "Renata Faria Bicalho",
      zipCode: "30130-100",
      street: "Rua dos Aimorés",
      number: "880",
      complement: "Sala 501",
      neighborhood: "Funcionários",
      city: "Belo Horizonte",
      state: "MG",
      phone: "(31) 98455-7799",
    },
    customer: {
      name: "Renata Faria Bicalho",
      email: "renata.bicalho@adv.com.br",
      phone: "(31) 98455-7799",
      cpf: "109.822.443-55",
      personType: "PF",
      totalOrdersCount: 5,
    },
    giftWrap: true,
    giftCardMessage: "Para a melhor amiga que a vida me deu. Aproveite seu momento relax!",
    internalNotes: [],
  },
  {
    id: "GLOS-9479",
    orderNumber: "#9479",
    createdAt: "21 Mai, 26 • 18:50",
    orderType: "personalizado",
    currentStep: "aguardando_arquivo",
    status: "PAGAMENTO_CONFIRMADO",
    statusHistory: [
      { status: "PEDIDO_REALIZADO", label: "Pedido criado", date: "21 Mai, 26 • 18:45" },
      { status: "PAGAMENTO_CONFIRMADO", label: "PIX aprovado", date: "21 Mai, 26 • 18:50" },
    ],
    stepHistory: [
      { step: "pago", label: "Pagamento Confirmado", date: "21 Mai, 26 • 18:50" },
      { step: "aguardando_arquivo", label: "Aguardando envio do vídeo interativo", date: "21 Mai, 26 • 18:50" },
    ],
    items: [
      {
        id: "item-5",
        productId: "prod-caneca-interativa-qr",
        name: "Caneca Interativa com QR Code Afetivo (Sublima Play)",
        sku: "GLOS-CAN-QR-005",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80",
        price: 79.9,
        costPrice: 21.0,
        quantity: 1,
        variantName: "Cerâmica Preta Fosca • 325ml",
        productType: "personalizavel",
        personalization: {
          customerFiles: [],
          customText: "Escaneie e descubra a nossa surpresa!",
          qrLink: "",
          qrApplied: false,
          interactivePlayType: "video_afetivo",
          approvalStatus: "aguardando_envio",
          notes: "Cliente escolheu envio de vídeo via WhatsApp.",
        },
      },
    ],
    subtotal: 79.9,
    shippingPrice: 16.0,
    discount: 0,
    total: 95.9,
    costTotal: 21.0,
    profitTotal: 58.9,
    paymentMethod: "pix",
    paymentStatus: "pago",
    paymentDetails: {
      pixCode: "000201...",
    },
    shippingOption: {
      id: "loggi-express",
      name: "Loggi Express",
      deadline: "2 dias úteis",
      price: 16.0,
      originalPrice: 19.0,
    },
    shippingAddress: {
      id: "addr-4",
      recipientName: "Bruno Henrique Silveira",
      zipCode: "80020-310",
      street: "Rua XV de Novembro",
      number: "600",
      neighborhood: "Centro",
      city: "Curitiba",
      state: "PR",
      phone: "(41) 99122-3344",
    },
    customer: {
      name: "Bruno Henrique Silveira",
      email: "bruno.silveira@pr.gov.br",
      phone: "(41) 99122-3344",
      cpf: "450.912.839-01",
      personType: "PF",
      totalOrdersCount: 2,
    },
    actionRequired: {
      needed: true,
      reason: "Cliente ainda não enviou o link do vídeo para o QR code (parado há 20h)",
      urgency: "alta",
    },
  },
  {
    id: "GLOS-9478",
    orderNumber: "#9478",
    createdAt: "21 Mai, 26 • 16:10",
    orderType: "personalizado",
    currentStep: "arte_aprovacao",
    status: "PAGAMENTO_CONFIRMADO",
    statusHistory: [
      { status: "PEDIDO_REALIZADO", label: "Pedido criado", date: "21 Mai, 26 • 16:00" },
      { status: "PAGAMENTO_CONFIRMADO", label: "Cartão aprovado", date: "21 Mai, 26 • 16:10" },
    ],
    stepHistory: [
      { step: "pago", label: "Pagamento Confirmado", date: "21 Mai, 26 • 16:10" },
      { step: "aguardando_arquivo", label: "Arquivos recebidos", date: "21 Mai, 26 • 16:20" },
      { step: "arte_aprovacao", label: "Arte Reprovada pelo cliente", date: "21 Mai, 26 • 17:40" },
    ],
    items: [
      {
        id: "item-6",
        productId: "prod-camiseta-afeto",
        name: "Camiseta Algodão Egípcio Bordado Personalizado",
        sku: "GLOS-CAM-EGI-006",
        image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80",
        price: 139.9,
        costPrice: 42.0,
        quantity: 1,
        variantName: "Tamanho M • Cor Off-White",
        productType: "personalizavel",
        personalization: {
          customerFiles: [
            {
              id: "file-6",
              name: "assinatura_caligrafia_vovo.png",
              url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&q=80",
              type: "imagem",
              size: "1.2 MB",
            },
          ],
          customText: "Vovó Helena • Desde 1954",
          mockupUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80",
          approvalStatus: "reprovado",
          rejectionReason: "A cor da linha do bordado no mockup ficou muito clara, gostaria de marrom escuro ou vinho.",
        },
      },
    ],
    subtotal: 139.9,
    shippingPrice: 15.0,
    discount: 0,
    total: 154.9,
    costTotal: 42.0,
    profitTotal: 97.9,
    paymentMethod: "credit_card",
    paymentStatus: "pago",
    paymentDetails: {
      cardBrand: "Visa",
      cardLast4: "8831",
      installments: 3,
    },
    shippingOption: {
      id: "total-express",
      name: "Total Express",
      deadline: "3 dias úteis",
      price: 15.0,
      originalPrice: 18.0,
    },
    shippingAddress: {
      id: "addr-5",
      recipientName: "Juliana Peixoto de Castro",
      zipCode: "90040-000",
      street: "Avenida Independência",
      number: "1020",
      neighborhood: "Independência",
      city: "Porto Alegre",
      state: "RS",
      phone: "(51) 98112-9900",
    },
    customer: {
      name: "Juliana Peixoto de Castro",
      email: "juliana.peixoto@terra.com.br",
      phone: "(51) 98112-9900",
      cpf: "512.981.332-90",
      personType: "PF",
      totalOrdersCount: 4,
    },
    actionRequired: {
      needed: true,
      reason: "Arte reprovada pelo cliente — reprocessar mockup com linha marrom escuro",
      urgency: "alta",
    },
  },
  {
    id: "GLOS-9477",
    orderNumber: "#9477",
    createdAt: "20 Mai, 26 • 10:15",
    orderType: "revenda",
    currentStep: "despachar",
    status: "ENVIADO",
    statusHistory: [
      { status: "PEDIDO_REALIZADO", label: "Pedido criado", date: "20 Mai, 26 • 10:10" },
      { status: "PAGAMENTO_CONFIRMADO", label: "PIX aprovado", date: "20 Mai, 26 • 10:15" },
      { status: "EM_SEPARACAO", label: "Separado e embalado para presente", date: "20 Mai, 26 • 14:00" },
      { status: "ENVIADO", label: "Postado na agência Jadlog", date: "21 Mai, 26 • 09:30" },
    ],
    stepHistory: [
      { step: "pago", label: "Pagamento Confirmado", date: "20 Mai, 26 • 10:15" },
      { step: "separar", label: "Separado no ateliê", date: "20 Mai, 26 • 14:00" },
      { step: "despachar", label: "Despachado com rastreio", date: "21 Mai, 26 • 09:30", updatedBy: "Expedição Glos" },
    ],
    items: [
      {
        id: "item-7",
        productId: "prod-kit-cha-gourmet",
        name: "Kit Chá Afetivo com Xícara Cerâmica e Infusor",
        sku: "GLOS-KIT-CHA-007",
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80",
        price: 159.9,
        costPrice: 52.0,
        quantity: 1,
        variantName: "Caixa Presente Kraft com Laço Gorgurão",
        productType: "simples",
      },
    ],
    subtotal: 159.9,
    shippingPrice: 18.5,
    discount: 0,
    total: 178.4,
    costTotal: 52.0,
    profitTotal: 107.9,
    paymentMethod: "pix",
    paymentStatus: "pago",
    paymentDetails: {
      pixCode: "000201...",
    },
    trackingCode: "JAD88392019BR",
    nfeStatus: "emitida",
    nfeNumber: "000.014.281",
    nfeKey: "35260548192019000194550010000142811092837192",
    shippingOption: {
      id: "jadlog-express",
      name: "Jadlog Package",
      deadline: "3 dias úteis",
      price: 18.5,
      originalPrice: 18.5,
    },
    shippingAddress: {
      id: "addr-6",
      recipientName: "Marcos Vinicius Antunes",
      zipCode: "13010-000",
      street: "Rua Barão de Jaguara",
      number: "1400",
      neighborhood: "Centro",
      city: "Campinas",
      state: "SP",
      phone: "(19) 99776-5544",
    },
    customer: {
      name: "Marcos Vinicius Antunes",
      email: "marcos.antunes@gmail.com",
      phone: "(19) 99776-5544",
      cpf: "283.910.441-20",
      personType: "PF",
      totalOrdersCount: 2,
    },
    giftWrap: true,
    giftCardMessage: "Um abraço quentinho para os seus dias de descanso.",
  },
  {
    id: "GLOS-9476",
    orderNumber: "#9476",
    createdAt: "19 Mai, 26 • 15:20",
    orderType: "personalizado",
    currentStep: "entregue",
    status: "ENTREGUE",
    statusHistory: [
      { status: "PEDIDO_REALIZADO", label: "Pedido criado", date: "19 Mai, 26 • 15:10" },
      { status: "PAGAMENTO_CONFIRMADO", label: "PIX aprovado", date: "19 Mai, 26 • 15:20" },
      { status: "EM_SEPARACAO", label: "Produção e embalagem", date: "20 Mai, 26 • 11:00" },
      { status: "ENVIADO", label: "Despachado", date: "20 Mai, 26 • 17:00" },
      { status: "ENTREGUE", label: "Entregue ao destinatário", date: "22 Mai, 26 • 11:45" },
    ],
    stepHistory: [
      { step: "pago", label: "Pagamento Confirmado", date: "19 Mai, 26 • 15:20" },
      { step: "aguardando_arquivo", label: "Foto recebida", date: "19 Mai, 26 • 15:30" },
      { step: "arte_aprovacao", label: "Arte Aprovada", date: "19 Mai, 26 • 16:00" },
      { step: "em_producao", label: "Produzido", date: "20 Mai, 26 • 10:00" },
      { step: "pronto", label: "Pronto para envio", date: "20 Mai, 26 • 14:00" },
      { step: "despachar", label: "Despachado", date: "20 Mai, 26 • 17:00" },
      { step: "entregue", label: "Entregue", date: "22 Mai, 26 • 11:45", updatedBy: "Transportadora" },
    ],
    items: [
      {
        id: "item-8",
        productId: "prod-caneca-foto",
        name: "Caneca Foto & Frase Afeto",
        sku: "GLOS-CAN-FOT-001",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80",
        price: 64.9,
        costPrice: 18.0,
        quantity: 1,
        variantName: "Cerâmica Branca • 325ml",
        productType: "personalizavel",
        personalization: {
          customerFiles: [
            {
              id: "file-8",
              name: "foto_mae_filha.jpg",
              url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&q=80",
              type: "imagem",
            },
          ],
          customText: "Mãe, meu porto seguro de todos os dias.",
          mockupUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
          approvalStatus: "aprovado",
          approvalDate: "19 Mai, 26 • 16:00",
        },
      },
    ],
    subtotal: 64.9,
    shippingPrice: 12.0,
    discount: 0,
    total: 76.9,
    costTotal: 18.0,
    profitTotal: 46.9,
    paymentMethod: "pix",
    paymentStatus: "pago",
    paymentDetails: {
      pixCode: "000201...",
    },
    trackingCode: "BR991823102SP",
    nfeStatus: "emitida",
    shippingOption: {
      id: "sedex",
      name: "Sedex",
      deadline: "1 dia útil",
      price: 12.0,
      originalPrice: 15.0,
    },
    shippingAddress: {
      id: "addr-7",
      recipientName: "Débora Cristina Santos",
      zipCode: "01310-200",
      street: "Avenida Paulista",
      number: "2000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      phone: "(11) 97711-2233",
    },
    customer: {
      name: "Débora Cristina Santos",
      email: "debora.santos@gmail.com",
      phone: "(11) 97711-2233",
      cpf: "192.839.102-44",
      personType: "PF",
      totalOrdersCount: 6,
    },
  },
];

/**
 * Mock inicial de Links de Carrinho pré-montados para envio via WhatsApp
 */
export const INITIAL_CART_LINKS: CartLink[] = [
  {
    id: "link-1",
    title: "Carrinho Especial • Dia dos Namorados",
    code: "VALENTINE-SPECIAL",
    targetCustomerName: "Leonardo Costa",
    targetPhone: "(11) 98822-1199",
    items: [
      {
        productId: "prod-caneca-foto",
        productName: "Caneca Foto & Frase Afeto",
        price: 64.9,
        quantity: 2,
        variant: "Par de Canecas Personalizadas",
      },
      {
        productId: "prod-vela-lavanda",
        productName: "Vela Aromática Artesanal Lavanda",
        price: 49.9,
        quantity: 1,
      },
    ],
    discountPercent: 10,
    couponCode: "AMOR10",
    subtotal: 179.7,
    total: 161.73,
    url: "https://glos.com.br/c/VALENTINE-SPECIAL",
    createdAt: "22 Mai, 26",
    clicksCount: 4,
    converted: false,
    status: "ativo",
  },
  {
    id: "link-2",
    title: "Combo Amiga Secreta • Caneca + Chá",
    code: "AMIGA-SECRETA-AFETO",
    targetCustomerName: "Tatiane Rezende",
    targetPhone: "(31) 99182-4433",
    items: [
      {
        productId: "prod-kit-cha-gourmet",
        productName: "Kit Chá Afetivo com Xícara Cerâmica",
        price: 159.9,
        quantity: 1,
      },
    ],
    subtotal: 159.9,
    total: 159.9,
    url: "https://glos.com.br/c/AMIGA-SECRETA-AFETO",
    createdAt: "20 Mai, 26",
    clicksCount: 8,
    converted: true,
    status: "convertido",
  },
];

/**
 * Mock inicial de Carrinhos Abandonados
 */
export const INITIAL_ABANDONED_CARTS: AbandonedCart[] = [
  {
    id: "ab-1",
    customerName: "Fernanda Albuquerque",
    customerPhone: "(11) 97654-3210",
    customerEmail: "fernanda.albuquerque@gmail.com",
    items: [
      {
        productId: "prod-caneca-foto",
        name: "Caneca Foto & Frase Afeto (325ml)",
        quantity: 1,
        price: 64.9,
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80",
        variantName: "Cerâmica Branca",
      },
      {
        productId: "prod-vela-lavanda",
        name: "Vela Aromática Lavanda & Baunilha",
        quantity: 1,
        price: 49.9,
        image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400&q=80",
      },
    ],
    subtotal: 114.8,
    shippingPrice: 14.5,
    total: 129.3,
    abandonedAt: "22 Mai, 26 • 12:40",
    timeAgo: "há 2 horas",
    recoveryStatus: "nao_contatado",
    recoveryAttemptsCount: 0,
  },
  {
    id: "ab-2",
    customerName: "Rodrigo Vasconcelos",
    customerPhone: "(21) 98833-2211",
    customerEmail: "rodrigo.vasconcelos@yahoo.com.br",
    items: [
      {
        productId: "prod-quadro-spotify",
        name: "Quadro Acrílico Spotify Interativo",
        quantity: 1,
        price: 119.9,
        image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80",
      },
    ],
    subtotal: 119.9,
    shippingPrice: 18.0,
    total: 137.9,
    abandonedAt: "21 Mai, 26 • 21:15",
    timeAgo: "há 17 horas",
    recoveryStatus: "mensagem_enviada",
    recoveryDiscountCode: "VOLTA5",
    lastContactDate: "22 Mai, 26 • 09:00",
    recoveryAttemptsCount: 1,
  },
  {
    id: "ab-3",
    customerName: "Priscila Neves",
    customerPhone: "(41) 99765-8899",
    customerEmail: "priscila.neves@hotmail.com",
    items: [
      {
        productId: "prod-kit-cha-gourmet",
        name: "Kit Chá Afetivo com Xícara Cerâmica",
        quantity: 1,
        price: 159.9,
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80",
      },
    ],
    subtotal: 159.9,
    shippingPrice: 0,
    total: 159.9,
    abandonedAt: "20 Mai, 26 • 19:30",
    timeAgo: "há 1 dia",
    recoveryStatus: "recuperado",
    recoveryDiscountCode: "PRESENTE10",
    lastContactDate: "21 Mai, 26 • 10:00",
    recoveryAttemptsCount: 1,
  },
];

// Helper para calcular se um pedido é Revenda (Fluxo A) ou Personalizado (Fluxo B)
export function deriveOrderType(items: Order["items"]): OrderType {
  const hasCustomizable = items.some(
    (item) =>
      item.productType === "personalizavel" ||
      Boolean(item.personalization) ||
      item.name.toLowerCase().includes("personalizad") ||
      item.name.toLowerCase().includes("foto") ||
      item.name.toLowerCase().includes("spotify") ||
      item.name.toLowerCase().includes("interativ")
  );
  return hasCustomizable ? "personalizado" : "revenda";
}

// Storage helpers
export function getOrdersFromStorage(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Erro ao ler pedidos do localStorage:", e);
  }
  return INITIAL_ORDERS;
}

export function saveOrdersToStorage(orders: Order[]): void {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn("Erro ao salvar pedidos no localStorage:", e);
  }
}

export function getCartLinksFromStorage(): CartLink[] {
  try {
    const raw = localStorage.getItem(CART_LINKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_CART_LINKS;
}

export function saveCartLinksToStorage(links: CartLink[]): void {
  try {
    localStorage.setItem(CART_LINKS_STORAGE_KEY, JSON.stringify(links));
  } catch (e) {}
}

export function getAbandonedCartsFromStorage(): AbandonedCart[] {
  try {
    const raw = localStorage.getItem(ABANDONED_CARTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_ABANDONED_CARTS;
}

export function saveAbandonedCartsToStorage(carts: AbandonedCart[]): void {
  try {
    localStorage.setItem(ABANDONED_CARTS_STORAGE_KEY, JSON.stringify(carts));
  } catch (e) {}
}

// Etapas do Fluxo A (Revenda)
export const REVENDA_STEPS: Array<{ id: OrderStep; label: string; description: string }> = [
  { id: "pago", label: "Pago", description: "Pagamento aprovado no gateway" },
  { id: "separar", label: "Separar", description: "Separação e embalagem para presente" },
  { id: "despachar", label: "Despachar", description: "Postagem e envio com código de rastreio" },
  { id: "entregue", label: "Entregue", description: "Entregue ao cliente com sucesso" },
];

// Etapas do Fluxo B (Personalizado)
export const PERSONALIZADO_STEPS: Array<{ id: OrderStep; label: string; description: string }> = [
  { id: "pago", label: "Pago", description: "Pagamento confirmado" },
  { id: "aguardando_arquivo", label: "Aguardando arquivo", description: "Aguardando fotos, áudio ou texto do cliente" },
  { id: "arte_aprovacao", label: "Arte em aprovação", description: "Mockup gerado e enviado para validação" },
  { id: "em_producao", label: "Em produção", description: "Sublimação, corte a laser ou impressão" },
  { id: "pronto", label: "Pronto", description: "Peça finalizada e embalada com afeto" },
  { id: "despachar", label: "Despachar", description: "Postagem e rastreamento" },
  { id: "entregue", label: "Entregue", description: "Presente entregue ao destinatário" },
];

/**
 * Gera Insight de IA para a listagem de pedidos
 */
export function getOrdersInsight(orders: Order[]): {
  headline: string;
  detail: string;
  actionText?: string;
  urgentCount: number;
} {
  const pendingActionOrders = orders.filter(
    (o) => o.actionRequired?.needed && o.currentStep !== "entregue" && o.currentStep !== "cancelado"
  );
  const pendingArtApproval = orders.filter(
    (o) => o.currentStep === "arte_aprovacao" || o.currentStep === "aguardando_arquivo"
  );

  if (pendingActionOrders.length > 0) {
    return {
      headline: `${pendingActionOrders.length} pedidos personalizados requerem sua atenção no ateliê`,
      detail: `Existem pedidos parados na etapa de validação de arte ou aguardando reprocessamento de mockup. Priorize o contato pelo WhatsApp para manter o prazo de entrega em dia.`,
      actionText: "Ver pedidos que precisam de ação",
      urgentCount: pendingActionOrders.length,
    };
  }

  return {
    headline: "Fluxo de produção e expedição operando sem gargalos",
    detail: "Todos os pedidos pagos estão com artes aprovadas ou em rota de entrega normal. Nenhuma pendência crítica identificada.",
    urgentCount: 0,
  };
}
