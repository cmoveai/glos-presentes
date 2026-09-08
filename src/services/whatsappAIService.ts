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
 * Interface para configuração da integração WhatsApp (Glos Presentes)
 * Nota de Segurança: Credenciais
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
  return {
    instanceId: "glos-live-inst-01",
    token: "configured_in_server_env",
    clientToken: "configured_in_server_env",
    webhookUrl: "/api/whatsapp/webhook",
    isConfigured: true,
  };
};

/**
 * 5.1.1 - Gerador de Mensagem: Pedir Arquivo ao Cliente (Upload em Alta Resolução no Site)
 */
export const gerarMensagemPedirArquivo = (
  customerName: string,
  productName: string,
  orderNumber: string
): string => {
  const firstName = customerName.split(" ")[0];
  return `Olá, ${firstName}! Tudo bem? 🌸 Aqui é da Nivah Presentes Criativos! Muito obrigada por escolher a gente para esse presente especial. Seu pedido ${orderNumber} (${productName}) já está confirmado e agora queremos deixá-lo com a sua cara!\n\nPara garantir a máxima nitidez e acabamento na confecção do seu presente, por favor faça o upload das suas fotos em alta resolução direto na sua Área do Cliente:\n👉 https://glos.com.br/minha-conta\n\nAssim que você enviar por lá, a Cris no nosso ateliê já vai preparar a prova visual com todo carinho para você aprovar aqui! Se tiver qualquer dúvida, é só me chamar por aqui.`;
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
 * Interpretador de Linguagem Natural Local (Regras Heurísticas Afetivas)
 */
export const interpretarRespostaCliente = (
  textoCliente: string,
  estadoAtual: ArtApprovalState
): {
  intent: "envio_arquivo" | "aprovacao" | "solicitacao_ajuste" | "duvida_prazo" | "outro";
  adjustmentNotes?: string;
  nextState: ArtApprovalState;
  replyText: string;
} => {
  const texto = textoCliente.trim();
  const lower = texto.toLowerCase();

  // Caso 1: Envio de arquivo / texto de personalização
  if (
    lower.includes("http") ||
    lower.includes(".jpg") ||
    lower.includes(".png") ||
    lower.includes(".mp3") ||
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
 * SESSÕES DE APROVAÇÃO DE ARTE (Nasce vazia para estado honesto de lançamento)
 * ============================================================================
 */
const INITIAL_APPROVAL_SESSIONS: ArtApprovalSession[] = [];

const STORAGE_KEY = "glos_art_approval_sessions_v1";

export const getApprovalSessionsFromStorage = (): ArtApprovalSession[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.error("Erro ao carregar sessões de aprovação de arte:", error);
  }
  return INITIAL_APPROVAL_SESSIONS;
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
