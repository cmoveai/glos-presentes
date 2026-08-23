import {
  ArtApprovalSession,
  ArtApprovalState,
  WhatsAppMessage,
  CustomerFile,
} from "../types";

/**
 * ============================================================================
 * PROMPT-BASE DA IA GLOS PRESENTES (WhatsApp Concierge de Afeto & Aprovação)
 * ============================================================================
 * Tom: Acolhedor, afetuoso, humano, de varejo de presentes.
 * Regras invioláveis:
 * 1. A IA NUNCA gera a arte/mockup sozinha. Quem monta é a Cris no ateliê.
 * 2. A IA recebe o arquivo, avisa a Cris, e quando a Cris sobe o mockup, a IA envia ao cliente.
 * 3. Se o cliente pedir ajustes, a IA captura o texto exato, tranquiliza o cliente e repassa à Cris.
 * 4. Jamais usar jargões corporativos ("prezado", "protocolo", "chamado"). Sempre tratar pelo primeiro nome com carinho.
 */
export const GLOS_AI_SYSTEM_PROMPT = `
Você é a assistente de atendimento afetivo da Glos Presentes no WhatsApp.
Seu papel é acolher o cliente que acabou de comprar um presente personalizado e conduzir a aprovação da arte com muito carinho e leveza.

DIRETRIZES DE COMUNICAÇÃO:
- Linguagem afetuosa, calorosa, brasileira e humana. Use frases naturais, parágrafos curtos e acolhedores.
- Não use listas de tópicos com bullets ou numerações frias. Fale como uma pessoa querida conversando.
- Trate o cliente pelo primeiro nome.

REGRAS DE OPERAÇÃO:
1. Quando o cliente compra, peça a foto e a dedicatória com entusiasmo.
2. Quando ele envia o arquivo, agradeça e explique que a Cris (nossa artista no ateliê) já está preparando a prova visual com todo cuidado.
3. Quando a Cris finalizar o mockup, envie a prévia com carinho e peça para ele olhar cada detalhe (nomes, datas, foto) e dizer se está aprovado ou se gostaria de mudar algo.
4. Se o cliente aprovar ("amei", "está lindo", "pode fazer", "aprovado"), celebre com ele e avise que a peça acabou de entrar em produção!
5. Se o cliente pedir ajuste ("a foto está escura", "mudar a cor", "trocar texto"), acolha o pedido com total tranquilidade, confirme exatamente o que ele quer mudar e avise que a Cris fará o ajuste na arte.
`;

/**
 * Interface para configuração da Z-API (WhatsApp Business API)
 * Nota de Segurança: Credenciais (ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN)
 * devem ser lidas exclusivamente de variáveis de ambiente no servidor (process.env).
 */
export interface ZApiConfig {
  instanceId?: string;
  token?: string;
  clientToken?: string;
  webhookUrl?: string;
  isConfigured: boolean;
}

export const getZApiStatus = (): ZApiConfig => {
  // Em produção no servidor, estas variáveis são injetadas via env
  return {
    instanceId: "glos-live-inst-01",
    token: "configured_in_server_env",
    clientToken: "configured_in_server_env",
    webhookUrl: "/api/whatsapp/webhook",
    isConfigured: true,
  };
};

/**
 * 5.1.1 - Gerador de Mensagem: Pedir Arquivo ao Cliente
 */
export const gerarMensagemPedirArquivo = (
  customerName: string,
  productName: string,
  orderNumber: string
): string => {
  const firstName = customerName.split(" ")[0];
  return `Olá, ${firstName}! Tudo bem? 🌸 Aqui é da Glos Presentes! Muito obrigada por escolher a gente para esse presente especial. Seu pedido ${orderNumber} (${productName}) já está confirmado e agora queremos deixá-lo com a sua cara! Por favor, nos envie por aqui a foto em boa resolução e o texto que você deseja colocar na arte. Assim que você mandar, a Cris no nosso ateliê vai montar a prova visual para você ver como vai ficar!`;
};

/**
 * 5.1.2 - Gerador de Mensagem: Enviar Mockup Montado pela Cris
 */
export const gerarMensagemEnviarMockup = (
  customerName: string,
  productName: string
): string => {
  const firstName = customerName.split(" ")[0];
  return `Oi, ${firstName}! A Cris preparou a prova visual do seu ${productName} com todo carinho! Dá uma olhadinha nessa prévia: confira a foto, os nomes e cada detalhe. Ficou do jeitinho que você imaginou para a gente produzir ou você gostaria de fazer algum ajuste na arte?`;
};

/**
 * 5.1.3 - Gerador de Mensagem: Agradecimento de Arquivo Recebido
 */
export const gerarMensagemArquivoRecebido = (customerName: string): string => {
  const firstName = customerName.split(" ")[0];
  return `Perfeito, ${firstName}! Recebemos seu arquivo com sucesso aqui no ateliê. A Cris já está montando o layout e logo mais te mando a prova visual aqui no WhatsApp para você aprovar antes de produzirmos!`;
};

/**
 * 5.1.4 - Gerador de Mensagem: Comemoração de Arte Aprovada
 */
export const gerarMensagemAprovado = (
  customerName: string,
  productName: string
): string => {
  const firstName = customerName.split(" ")[0];
  return `Que alegria, ${firstName}! Sua arte do ${productName} foi aprovada com sucesso! 💖 Já encaminhamos a matriz para a bancada de produção e estamparia do nosso ateliê. Cuidaremos de cada detalhe com muito carinho para ficar perfeito! Te avisaremos assim que for embalado para envio.`;
};

/**
 * 5.1.5 - Gerador de Mensagem: Confirmação de Ajuste Solicitado
 */
export const gerarMensagemAjusteSolicitado = (
  customerName: string,
  ajusteDescricao: string
): string => {
  const firstName = customerName.split(" ")[0];
  return `Entendido perfeitamente, ${firstName}! Já anotei o seu pedido de ajuste: "${ajusteDescricao}". A Cris vai fazer essa alteração na arte e assim que a nova prévia estiver pronta, te mando aqui novamente para você conferir. Pode ficar tranquilo(a) que vai ficar lindo!`;
};

/**
 * 5.1.6 - Interpretador Inteligente de Respostas do Cliente (Simula IA Gemini / Parser de Afeto)
 */
export const interpretarRespostaCliente = (
  texto: string,
  estadoAtual: ArtApprovalState
): {
  intent: "aprovacao" | "solicitacao_ajuste" | "envio_arquivo" | "duvida_prazo" | "outro";
  adjustmentNotes?: string;
  nextState: ArtApprovalState;
  replyText: string;
} => {
  const lower = texto.toLowerCase().trim();

  // Caso 1: Envio de arquivo enquanto aguardava arquivo
  if (
    estadoAtual === "aguardando_arquivo" ||
    lower.includes("foto") ||
    lower.includes("segue a imagem") ||
    lower.includes("mandei o arquivo") ||
    lower.includes("link da música") ||
    lower.includes("spotify.com") ||
    lower.includes("frase:")
  ) {
    return {
      intent: "envio_arquivo",
      nextState: "arquivo_recebido",
      replyText: `Recebido com muito carinho! A Cris no nosso ateliê já recebeu o material e vai montar a prova visual para você ver logo mais.`,
    };
  }

  // Caso 2: Aprovação da arte
  const termosAprovacao = [
    "aprovado",
    "aprovada",
    "aprovei",
    "ficou perfeito",
    "perfeita",
    "amei",
    "maravilhoso",
    "lindo",
    "linda",
    "adorei",
    "pode fazer",
    "pode produzir",
    "pode rodar",
    "ficou ótimo",
    "ficou otimo",
    "show",
    "maravilha",
    "sim, ta bom",
    "sim, tá bom",
    "está perfeito",
    "ta perfeito",
    "tá perfeito",
  ];

  const ehAprovacao = termosAprovacao.some((termo) => lower.includes(termo));

  if (ehAprovacao && !lower.includes("mas") && !lower.includes("porém") && !lower.includes("ajuste") && !lower.includes("mudar")) {
    return {
      intent: "aprovacao",
      nextState: "aprovado",
      replyText: `Que maravilhoso! Sua arte foi aprovada e seu pedido já avançou para a esteira de confecção no ateliê!`,
    };
  }

  // Caso 3: Solicitação de ajuste na arte
  const termosAjuste = [
    "mudar",
    "trocar",
    "ajuste",
    "ajustar",
    "alterar",
    "alteração",
    "escura",
    "escuro",
    "clara",
    "cortou",
    "centralizar",
    "alinhamento",
    "letra",
    "fonte",
    "cor",
    "aumentar",
    "diminuir",
    "remover",
    "adicionar",
    "outra foto",
    "nova foto",
    "troca",
  ];

  const ehAjuste = termosAjuste.some((termo) => lower.includes(termo)) || lower.includes("mas ") || lower.includes("porém");

  if (ehAjuste) {
    // Extrai o conteúdo do ajuste como nota para a Cris
    let ajusteTexto = texto;
    if (lower.startsWith("gostaria de ") || lower.startsWith("tem como ")) {
      ajusteTexto = texto;
    }

    return {
      intent: "solicitacao_ajuste",
      adjustmentNotes: ajusteTexto,
      nextState: "ajuste_solicitado",
      replyText: `Com certeza! Anotamos o seu pedido de alteração: "${ajusteTexto}". A Cris no ateliê fará esse ajuste e logo te enviaremos a nova prova visual!`,
    };
  }

  // Caso 4: Dúvida sobre prazo ou entrega
  if (lower.includes("prazo") || lower.includes("quando chega") || lower.includes("dia") || lower.includes("demora")) {
    return {
      intent: "duvida_prazo",
      nextState: estadoAtual,
      replyText: `Após a aprovação da arte, nossa produção leva em média de 1 a 2 dias úteis para confeccionar com todo capricho e postar na transportadora!`,
    };
  }

  // Padrão genérico acolhedor
  return {
    intent: "outro",
    nextState: estadoAtual,
    replyText: `Recebemos sua mensagem! Nossa equipe já está atenta e qualquer dúvida estamos aqui para te ajudar com o maior carinho.`,
  };
};

/**
 * ============================================================================
 * SEED MOCK INICIAL DE SESSÕES DE APROVAÇÃO DE ARTE
 * Cobre todos os 5 estados da máquina para demonstração imediata:
 * 1. aguardando_arquivo
 * 2. arquivo_recebido (esperando a Cris montar mockup)
 * 3. aguardando_aprovacao (mockup enviado, aguardando cliente)
 * 4. ajuste_solicitado (com texto capturado pela IA)
 * 5. aprovado (produção liberada)
 * ============================================================================
 */
const INITIAL_APPROVAL_SESSIONS: ArtApprovalSession[] = [
  // 1. Arquivo Recebido — CRIS PRECISA AGIR (Montar Mockup)
  {
    id: "session-001",
    orderId: "ord-001",
    orderNumber: "#00142",
    itemId: "item-001-caneca",
    productName: "Caneca Foto & Frase Afeto (325ml)",
    productImage: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80",
    customerName: "Camila Rocha",
    customerPhone: "(11) 98765-4321",
    state: "arquivo_recebido",
    requiresCrisAction: true,
    rejectionCount: 0,
    createdAt: "22 ago, 09:15",
    updatedAt: "22 ago, 10:40",
    customerTextDeclaration: "Para o melhor pai do mundo, com todo amor de Camila e Lucas.",
    customerUploadedFiles: [
      {
        id: "file-camila-01",
        name: "foto_familia_camila_alta_resolucao.jpg",
        url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&q=80",
        type: "imagem",
        size: "4.2 MB",
        uploadedAt: "22 ago, 10:38",
      },
    ],
    stateHistory: [
      {
        id: "hist-001",
        state: "aguardando_arquivo",
        timestamp: "22 ago, 09:15",
        actor: "ia",
        description: "IA Glos enviou mensagem inicial acolhedora solicitando a foto e a dedicatória no WhatsApp.",
      },
      {
        id: "hist-002",
        state: "arquivo_recebido",
        timestamp: "22 ago, 10:40",
        actor: "cliente",
        description: "Cliente Camila enviou a foto em alta resolução e o texto da caneca pelo WhatsApp.",
      },
    ],
    conversationThread: [
      {
        id: "msg-001",
        sender: "ia",
        senderName: "IA Glos Presentes",
        timestamp: "22 ago, 09:15",
        text: "Olá, Camila! Tudo bem? 🌸 Aqui é da Glos Presentes! Muito obrigada por escolher a gente para esse presente especial. Seu pedido #00142 (Caneca Foto & Frase Afeto) já está confirmado e agora queremos deixá-lo com a sua cara! Por favor, nos envie por aqui a foto em boa resolução e o texto que você deseja colocar na arte. Assim que você mandar, a Cris no nosso ateliê vai montar a prova visual para você ver como vai ficar!",
        status: "read",
      },
      {
        id: "msg-002",
        sender: "cliente",
        senderName: "Camila Rocha",
        timestamp: "22 ago, 10:38",
        text: "Oi! Bom dia! Segue a foto nossa em família e a frase que quero colocar: 'Para o melhor pai do mundo, com todo amor de Camila e Lucas.'",
        mediaUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&q=80",
        mediaType: "image",
        status: "read",
        intentDetected: "envio_arquivo",
      },
      {
        id: "msg-003",
        sender: "ia",
        senderName: "IA Glos Presentes",
        timestamp: "22 ago, 10:40",
        text: "Perfeito, Camila! Recebemos sua foto com sucesso aqui no ateliê. A Cris já está preparando a prova visual com todo carinho e logo te envio aqui para você aprovar antes de produzirmos!",
        status: "read",
      },
    ],
  },

  // 2. Ajuste Solicitado — CRIS PRECISA AGIR (Subir Novo Mockup com Ajuste)
  {
    id: "session-002",
    orderId: "ord-002",
    orderNumber: "#00141",
    itemId: "item-002-quadro",
    productName: "Quadro Spotify Interativo com Moldura A4",
    productImage: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80",
    customerName: "Lucas Mendes",
    customerPhone: "(21) 99876-5432",
    state: "ajuste_solicitado",
    requiresCrisAction: true,
    rejectionReason: "Trocar a foto por uma mais nítida e colocar o título da música em fonte branca ao invés de cinza.",
    rejectionCount: 1,
    createdAt: "21 ago, 16:20",
    updatedAt: "22 ago, 11:15",
    customerSongOrUrl: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
    customerUploadedFiles: [
      {
        id: "file-lucas-01",
        name: "foto_viagem_casal_nova.jpg",
        url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=80",
        type: "imagem",
        size: "3.8 MB",
        uploadedAt: "22 ago, 11:12",
      },
    ],
    mockupUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80",
    mockupGeneratedAt: "22 ago, 08:30",
    mockupUploadedBy: "Cris (Ateliê)",
    stateHistory: [
      {
        id: "hist-003",
        state: "aguardando_arquivo",
        timestamp: "21 ago, 16:20",
        actor: "ia",
        description: "IA Glos solicitou foto e link da música no WhatsApp.",
      },
      {
        id: "hist-004",
        state: "arquivo_recebido",
        timestamp: "21 ago, 18:05",
        actor: "cliente",
        description: "Lucas enviou foto do casal e link do Spotify.",
      },
      {
        id: "hist-005",
        state: "aguardando_aprovacao",
        timestamp: "22 ago, 08:35",
        actor: "ia",
        description: "Cris montou a 1ª versão do mockup e IA Glos disparou para aprovação do cliente.",
      },
      {
        id: "hist-006",
        state: "ajuste_solicitado",
        timestamp: "22 ago, 11:15",
        actor: "ia",
        description: "IA Glos interpretou mensagem do cliente, capturou pedido de ajuste e notificou a Cris.",
      },
    ],
    conversationThread: [
      {
        id: "msg-004",
        sender: "ia",
        senderName: "IA Glos Presentes",
        timestamp: "22 ago, 08:35",
        text: "Oi, Lucas! A Cris preparou a prova visual do seu Quadro Spotify com todo carinho! Dá uma olhadinha nessa prévia: confira a foto, os nomes e o código da música. Ficou do jeitinho que você imaginou para a gente produzir ou você gostaria de fazer algum ajuste na arte?",
        mediaUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80",
        mediaType: "image",
        status: "read",
      },
      {
        id: "msg-005",
        sender: "cliente",
        senderName: "Lucas Mendes",
        timestamp: "22 ago, 11:12",
        text: "Oi! A arte ficou linda, mas achei que a foto original que mandei ficou um pouco sem nitidez na impressão. Acabei de achar uma foto com qualidade melhor e mandei em anexo. Também tem como colocar o título da música em branco bem nítido?",
        mediaUrl: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=80",
        mediaType: "image",
        status: "read",
        intentDetected: "solicitacao_ajuste",
        adjustmentNotes: "Trocar a foto por uma mais nítida e colocar o título da música em fonte branca ao invés de cinza.",
      },
      {
        id: "msg-006",
        sender: "ia",
        senderName: "IA Glos Presentes",
        timestamp: "22 ago, 11:15",
        text: "Entendido perfeitamente, Lucas! Já anotei o seu pedido de ajuste para trocar pela nova foto mais nítida e destacar o título em branco. A Cris vai fazer essa alteração na arte e assim que a nova prévia estiver pronta, te mando aqui novamente para você conferir. Fique tranquilo que vai ficar incrível!",
        status: "read",
      },
    ],
  },

  // 3. Aguardando Aprovação do Cliente
  {
    id: "session-003",
    orderId: "ord-003",
    orderNumber: "#00140",
    itemId: "item-003-chaveiro",
    productName: "Chaveiro Spotify com Gravação a Laser & Foto",
    productImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
    customerName: "Mariana Souza",
    customerPhone: "(31) 98888-7777",
    state: "aguardando_aprovacao",
    requiresCrisAction: false,
    rejectionCount: 0,
    createdAt: "22 ago, 11:00",
    updatedAt: "22 ago, 13:20",
    customerUploadedFiles: [
      {
        id: "file-mariana-01",
        name: "foto_namorados_praia.jpg",
        url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&q=80",
        type: "imagem",
        size: "2.9 MB",
        uploadedAt: "22 ago, 11:45",
      },
    ],
    mockupUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80",
    mockupGeneratedAt: "22 ago, 13:20",
    mockupUploadedBy: "Cris (Ateliê)",
    stateHistory: [
      {
        id: "hist-007",
        state: "aguardando_arquivo",
        timestamp: "22 ago, 11:00",
        actor: "ia",
        description: "IA Glos solicitou foto e dedicatória.",
      },
      {
        id: "hist-008",
        state: "arquivo_recebido",
        timestamp: "22 ago, 11:45",
        actor: "cliente",
        description: "Mariana enviou a foto da praia.",
      },
      {
        id: "hist-009",
        state: "aguardando_aprovacao",
        timestamp: "22 ago, 13:20",
        actor: "ia",
        description: "Cris subiu a prova visual do chaveiro e a IA Glos enviou para aprovação no WhatsApp.",
      },
    ],
    conversationThread: [
      {
        id: "msg-007",
        sender: "ia",
        senderName: "IA Glos Presentes",
        timestamp: "22 ago, 11:00",
        text: "Olá, Mariana! Tudo bem? 🌸 Muito obrigada por escolher a Glos Presentes! Seu pedido #00140 (Chaveiro Spotify) já está confirmado. Envie por aqui a foto do casal para prepararmos a arte!",
        status: "read",
      },
      {
        id: "msg-008",
        sender: "cliente",
        senderName: "Mariana Souza",
        timestamp: "22 ago, 11:45",
        text: "Oi! Mandei a foto em anexo. A música é 'Apenas Mais Uma de Amor' do Lulu Santos!",
        mediaUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&q=80",
        mediaType: "image",
        status: "read",
        intentDetected: "envio_arquivo",
      },
      {
        id: "msg-009",
        sender: "ia",
        senderName: "IA Glos Presentes",
        timestamp: "22 ago, 13:20",
        text: "Oi, Mariana! A Cris preparou a prova visual do seu Chaveiro Spotify com todo carinho! Dá uma olhadinha nessa prévia: confira a foto, os nomes e o código da música. Ficou do jeitinho que você imaginou para a gente produzir ou você gostaria de fazer algum ajuste na arte?",
        mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80",
        mediaType: "image",
        status: "delivered",
      },
    ],
  },

  // 4. Aguardando Envio de Arquivo
  {
    id: "session-004",
    orderId: "ord-004",
    orderNumber: "#00139",
    itemId: "item-004-caneca-qr",
    productName: "Caneca Interativa com QR Code de Vídeo Afetivo",
    productImage: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&q=80",
    customerName: "Rafael Albuquerque",
    customerPhone: "(41) 97777-6666",
    state: "aguardando_arquivo",
    requiresCrisAction: false,
    rejectionCount: 0,
    createdAt: "22 ago, 14:10",
    updatedAt: "22 ago, 14:10",
    customerUploadedFiles: [],
    stateHistory: [
      {
        id: "hist-010",
        state: "aguardando_arquivo",
        timestamp: "22 ago, 14:10",
        actor: "ia",
        description: "IA Glos enviou mensagem de boas-vindas e solicitou o link/vídeo da dedicatória.",
      },
    ],
    conversationThread: [
      {
        id: "msg-010",
        sender: "ia",
        senderName: "IA Glos Presentes",
        timestamp: "22 ago, 14:10",
        text: "Olá, Rafael! Tudo bem? 🌸 Aqui é da Glos Presentes! Muito obrigada por escolher a gente para esse presente tão especial. Seu pedido #00139 (Caneca Interativa QR Code) já está confirmado e agora precisamos do link do vídeo ou dedicatória que você quer conectar ao QR Code! Por favor, envie por aqui o link do YouTube, Drive ou o próprio arquivo de vídeo. Assim que você mandar, a Cris no ateliê vai gerar a matriz interativa!",
        status: "delivered",
      },
    ],
  },

  // 5. Aprovado (Avançado para Produção)
  {
    id: "session-005",
    orderId: "ord-005",
    orderNumber: "#00138",
    itemId: "item-005-azulejo",
    productName: "Azulejo Personalizado com Suporte Decorativo",
    productImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&q=80",
    customerName: "Beatriz Nogueira",
    customerPhone: "(19) 99123-4567",
    state: "aprovado",
    requiresCrisAction: false,
    rejectionCount: 0,
    createdAt: "21 ago, 10:00",
    updatedAt: "22 ago, 09:30",
    customerUploadedFiles: [
      {
        id: "file-beatriz-01",
        name: "foto_bodas_pais_1985.jpg",
        url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80",
        type: "imagem",
        size: "5.1 MB",
        uploadedAt: "21 ago, 11:20",
      },
    ],
    mockupUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&q=80",
    mockupGeneratedAt: "21 ago, 15:40",
    mockupUploadedBy: "Cris (Ateliê)",
    stateHistory: [
      {
        id: "hist-011",
        state: "aguardando_arquivo",
        timestamp: "21 ago, 10:00",
        actor: "ia",
        description: "IA Glos solicitou foto antiga das bodas.",
      },
      {
        id: "hist-012",
        state: "arquivo_recebido",
        timestamp: "21 ago, 11:20",
        actor: "cliente",
        description: "Beatriz enviou a fotografia escaneada.",
      },
      {
        id: "hist-013",
        state: "aguardando_aprovacao",
        timestamp: "21 ago, 15:40",
        actor: "ia",
        description: "Cris montou a arte do azulejo e a IA Glos enviou no WhatsApp.",
      },
      {
        id: "hist-014",
        state: "aprovado",
        timestamp: "22 ago, 09:30",
        actor: "cliente",
        description: "Beatriz aprovou com entusiasmo a prova visual. Pedido avançou para estamparia e produção!",
      },
    ],
    conversationThread: [
      {
        id: "msg-011",
        sender: "ia",
        senderName: "IA Glos Presentes",
        timestamp: "21 ago, 15:40",
        text: "Oi, Beatriz! A Cris preparou a prova visual do seu Azulejo Personalizado com todo carinho! Dá uma olhadinha nessa prévia: restauramos o contraste da foto antiga para a cerâmica. Ficou do jeitinho que você imaginou para a gente produzir?",
        mediaUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&q=80",
        mediaType: "image",
        status: "read",
      },
      {
        id: "msg-012",
        sender: "cliente",
        senderName: "Beatriz Nogueira",
        timestamp: "22 ago, 09:28",
        text: "Nossa, que trabalho lindo! Emocionada aqui! Ficou perfeito demais, pode produzir sim!",
        status: "read",
        intentDetected: "aprovacao",
      },
      {
        id: "msg-013",
        sender: "ia",
        senderName: "IA Glos Presentes",
        timestamp: "22 ago, 09:30",
        text: "Que alegria, Beatriz! Sua arte do Azulejo Personalizado foi aprovada com sucesso! 💖 Já encaminhamos a matriz para a bancada de produção do nosso ateliê. Cuidaremos de cada detalhe com muito carinho para ficar perfeito!",
        status: "read",
      },
    ],
  },
];

const STORAGE_KEY = "glos_art_approval_sessions_v1";

export const getApprovalSessionsFromStorage = (): ArtApprovalSession[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPROVAL_SESSIONS));
      return INITIAL_APPROVAL_SESSIONS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao carregar sessões de aprovação de arte:", error);
    return INITIAL_APPROVAL_SESSIONS;
  }
};

export const saveApprovalSessionsToStorage = (
  sessions: ArtApprovalSession[]
): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Erro ao salvar sessões de aprovação de arte:", error);
  }
};

/**
 * Upload de mockup feito pela Cris e disparo automático de mensagem pelo WhatsApp com a IA
 */
export const uploadMockupAndTriggerAI = (
  sessionId: string,
  mockupUrl: string,
  qrLink?: string,
  qrApplied?: boolean
): ArtApprovalSession | null => {
  const sessions = getApprovalSessionsFromStorage();
  const sessionIndex = sessions.findIndex((s) => s.id === sessionId || s.orderId === sessionId || s.orderNumber === sessionId);
  if (sessionIndex === -1) return null;

  const current = sessions[sessionIndex];
  const nowStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const aiMessageText = gerarMensagemEnviarMockup(current.customerName, current.productName);

  const newAiMessage: WhatsAppMessage = {
    id: `msg-${Date.now()}`,
    sender: "ia",
    senderName: "IA Glos Presentes",
    timestamp: nowStr,
    text: aiMessageText,
    mediaUrl: mockupUrl,
    mediaType: "image",
    status: "delivered",
  };

  const hadAdjustment = Boolean(current.rejectionReason || current.comentarioAjuste);

  const updated: ArtApprovalSession = {
    ...current,
    state: "aguardando_aprovacao",
    requiresCrisAction: false,
    mockupUrl,
    qrLink: qrLink !== undefined ? qrLink : current.qrLink,
    qrApplied: qrApplied !== undefined ? qrApplied : current.qrApplied,
    mockupGeneratedAt: nowStr,
    mockupUploadedBy: "Cris (Ateliê Glos)",
    updatedAt: nowStr,
    conversationThread: [...current.conversationThread, newAiMessage],
    stateHistory: [
      ...current.stateHistory,
      {
        id: `hist-${Date.now()}`,
        state: "aguardando_aprovacao",
        timestamp: nowStr,
        actor: "cris",
        description: hadAdjustment
          ? `Cris anexou nova prova visual no ateliê após ajuste solicitado. IA Glos enviou automaticamente no WhatsApp e liberou aprovação no site.`
          : `Cris anexou a prova visual no ateliê e a IA Glos enviou automaticamente no WhatsApp para o cliente aprovar.`,
      },
    ],
  };

  sessions[sessionIndex] = updated;
  saveApprovalSessionsToStorage(sessions);
  return updated;
};

/**
 * Simulação de resposta recebida do cliente no WhatsApp
 */
export const simulateIncomingCustomerMessage = (
  sessionId: string,
  messageText: string,
  mediaUrl?: string
): ArtApprovalSession | null => {
  const sessions = getApprovalSessionsFromStorage();
  const sessionIndex = sessions.findIndex((s) => s.id === sessionId);
  if (sessionIndex === -1) return null;

  const current = sessions[sessionIndex];
  const nowStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  // IA interpreta a mensagem do cliente
  const interpretation = interpretarRespostaCliente(messageText, current.state);

  const customerMsg: WhatsAppMessage = {
    id: `msg-cust-${Date.now()}`,
    sender: "cliente",
    senderName: current.customerName,
    timestamp: nowStr,
    text: messageText,
    mediaUrl,
    mediaType: mediaUrl ? "image" : undefined,
    status: "read",
    intentDetected: interpretation.intent,
    adjustmentNotes: interpretation.adjustmentNotes,
  };

  const aiReplyMsg: WhatsAppMessage = {
    id: `msg-ai-${Date.now() + 1}`,
    sender: "ia",
    senderName: "IA Glos Presentes",
    timestamp: nowStr,
    text: interpretation.replyText,
    status: "read",
  };

  const newFiles: CustomerFile[] = [...current.customerUploadedFiles];
  if (mediaUrl) {
    newFiles.push({
      id: `file-${Date.now()}`,
      name: `anexo_whatsapp_${current.customerName.toLowerCase().replace(/\s/g, "_")}.jpg`,
      url: mediaUrl,
      type: "imagem",
      size: "3.5 MB",
      uploadedAt: nowStr,
    });
  }

  const requiresCris =
    interpretation.nextState === "arquivo_recebido" ||
    interpretation.nextState === "ajuste_solicitado";

  const updated: ArtApprovalSession = {
    ...current,
    state: interpretation.nextState,
    requiresCrisAction: requiresCris,
    rejectionReason:
      interpretation.nextState === "ajuste_solicitado"
        ? interpretation.adjustmentNotes || messageText
        : current.rejectionReason,
    rejectionCount:
      interpretation.nextState === "ajuste_solicitado"
        ? current.rejectionCount + 1
        : current.rejectionCount,
    customerUploadedFiles: newFiles,
    updatedAt: nowStr,
    conversationThread: [...current.conversationThread, customerMsg, aiReplyMsg],
    stateHistory: [
      ...current.stateHistory,
      {
        id: `hist-${Date.now()}`,
        state: interpretation.nextState,
        timestamp: nowStr,
        actor: "cliente",
        description: `Cliente enviou mensagem. IA Glos interpretou intenção '${interpretation.intent}' e transitou estado para '${interpretation.nextState}'.`,
      },
    ],
  };

  sessions[sessionIndex] = updated;
  saveApprovalSessionsToStorage(sessions);
  return updated;
};

/**
 * Envio de mensagem manual da Cris para o cliente (intervenção humana)
 */
export const sendCrisManualMessage = (
  sessionId: string,
  text: string
): ArtApprovalSession | null => {
  const sessions = getApprovalSessionsFromStorage();
  const sessionIndex = sessions.findIndex((s) => s.id === sessionId);
  if (sessionIndex === -1) return null;

  const current = sessions[sessionIndex];
  const nowStr = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const crisMsg: WhatsAppMessage = {
    id: `msg-cris-${Date.now()}`,
    sender: "lojista",
    senderName: "Cris (Ateliê Glos)",
    timestamp: nowStr,
    text,
    status: "delivered",
  };

  const updated: ArtApprovalSession = {
    ...current,
    updatedAt: nowStr,
    conversationThread: [...current.conversationThread, crisMsg],
  };

  sessions[sessionIndex] = updated;
  saveApprovalSessionsToStorage(sessions);
  return updated;
};
