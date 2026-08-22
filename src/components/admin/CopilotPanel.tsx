import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  RefreshCw, 
  CornerDownLeft,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import { Order, Product } from "../../types";

export interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  products: Product[];
  onNavigateToTab?: (tab: string) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({
  isOpen,
  onClose,
  orders,
  products,
  onNavigateToTab,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "ai",
      text: `Olá! Sou o seu **Copiloto de Inteligência Artificial** da Ativva Gifts.\n\nPosso analisar suas vendas, sugerir ações para carrinhos abandonados, avaliar estoque e responder a qualquer pergunta sobre a operação da sua loja. O que você gostaria de analisar agora?`,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "Por que minhas vendas oscilaram esta semana?",
    "Quais produtos têm maior margem e deveriam receber mais tráfego?",
    "Como recuperar os carrinhos abandonados de hoje?",
    "Qual a previsão de faturamento para o fim do mês?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/copilot-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-4),
        }),
      });

      const data = await res.json();
      const aiReply = data.reply || "Analisei seus dados. Recomendo focar no envio de lembretes para os clientes com PIX pendente e reforçar o estoque dos kits presenteáveis.";

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiReply,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: "Desculpe, ocorreu uma instabilidade momentânea na conexão com o Gemini. Por favor, tente novamente.",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="copilot-panel-root"
      className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] max-h-[580px] h-[80vh] bg-[#101512] border border-emerald-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200"
    >
      {/* HEADER DO COPILOTO */}
      <div className="p-4 bg-[#141d18] border-b border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-stone-100">Copiloto Ativva</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Gemini 3.7
              </span>
            </div>
            <p className="text-[11px] text-stone-400">Análise consultiva em tempo real</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ÁREA DE MENSAGENS */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#0e1310]/70 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                msg.sender === "user"
                  ? "bg-emerald-600 text-stone-950 font-medium rounded-tr-xs"
                  : "bg-[#161f1a] text-stone-200 border border-emerald-500/20 rounded-tl-xs shadow-xs"
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] text-stone-500 mt-1 font-mono px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-[#161f1a] border border-emerald-500/20 text-stone-300 rounded-2xl w-fit">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span className="text-xs">Consultando métricas e gerando insight...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* SUGESTÕES RÁPIDAS */}
      {messages.length <= 2 && (
        <div className="p-3 bg-[#141d18]/60 border-t border-emerald-500/10 space-y-1.5">
          <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider block px-1">
            Sugestões para perguntar:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestedPrompts.slice(0, 2).map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-stone-900/80 hover:bg-emerald-950 text-stone-300 hover:text-emerald-300 border border-stone-800 hover:border-emerald-700/50 transition-all truncate max-w-full"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* INPUT DO CHAT */}
      <div className="p-3 bg-[#141d18] border-t border-emerald-500/20 flex items-center gap-2">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Pergunte ao Copiloto sobre suas vendas, estoque..."
          className="flex-1 px-3.5 py-2.5 bg-[#0e1310] border border-emerald-500/20 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
        />
        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputPrompt.trim() || loading}
          className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl font-bold transition-all disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
