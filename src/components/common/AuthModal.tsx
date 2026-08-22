import React, { useState } from "react";
import { X, Mail, Lock, User as UserIcon, Phone, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { BRAND_CONFIG } from "../../config/brand";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const { login, loginWithGoogle, register } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      showToast("Por favor, informe um e-mail válido.", "error");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(email);
      } else if (mode === "register") {
        if (!name.trim()) {
          showToast("Informe seu nome completo.", "error");
          setLoading(false);
          return;
        }
        await register(name, email, phone);
      } else {
        showToast(`Enviamos um link de recuperação para ${email}.`, "success");
        setMode("login");
        setLoading(false);
        return;
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      showToast("Erro ao processar autenticação.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      showToast("Erro ao conectar com o Google.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-stone-950 text-white flex items-center justify-center font-serif text-xl font-bold mx-auto mb-3">
            M
          </div>
          <h3 className="text-xl font-bold text-stone-950">
            {mode === "login"
              ? "Acesse sua Conta"
              : mode === "register"
              ? "Crie seu Cadastro"
              : "Recuperar Senha"}
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            {mode === "login"
              ? "Acompanhe seus pedidos e salve seus presentes favoritos"
              : mode === "register"
              ? "Leva menos de 1 minuto para começar a comprar"
              : "Digite seu e-mail para receber as instruções"}
          </p>
        </div>

        {/* Quick Google Sign In */}
        {mode !== "forgot" && (
          <div className="mb-5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl border border-stone-300 flex items-center justify-center gap-3 transition-colors shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continuar com o Google</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs text-stone-500">
                <span className="bg-white px-2">ou com e-mail</span>
              </div>
            </div>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Nome Completo</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-stone-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-stone-900"
              />
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">WhatsApp / Telefone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-stone-900"
                />
              </div>
            </div>
          )}

          {mode !== "forgot" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-700">Senha</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-[11px] text-stone-500 hover:text-stone-900 underline"
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none focus:border-stone-900"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-4"
          >
            <span>
              {loading
                ? "Processando..."
                : mode === "login"
                ? "Entrar na Conta"
                : mode === "register"
                ? "Concluir Cadastro"
                : "Enviar Instruções"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle between Login, Register, and Forgot */}
        <div className="mt-6 pt-4 border-t border-stone-100 text-center text-xs text-stone-600">
          {mode === "login" ? (
            <p>
              Não tem uma conta?{" "}
              <button
                onClick={() => setMode("register")}
                className="font-bold text-stone-950 underline"
              >
                Cadastre-se grátis
              </button>
            </p>
          ) : (
            <p>
              Já possui cadastro?{" "}
              <button
                onClick={() => setMode("login")}
                className="font-bold text-stone-950 underline"
              >
                Entrar com e-mail
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
