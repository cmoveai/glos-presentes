import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { db, storage, sanitizeForFirestore } from "../lib/firebase";
import { MarketingPeca, MarketingPecaTipo } from "../types";

const LOCAL_STORAGE_KEY = "glos_marketing_pecas";

/**
 * Lê do cache local para fallback rápido / offline
 */
function getCachedPecas(): MarketingPeca[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Falha ao ler cache local de marketing_pecas:", e);
  }
  return [];
}

/**
 * Atualiza o cache local
 */
function setCachedPecas(pecas: MarketingPeca[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(pecas));
  } catch (e) {
    console.warn("Falha ao salvar cache local de marketing_pecas:", e);
  }
}

/**
 * Faz upload de imagem de peça de marketing no Firebase Storage (com fallback de alta fidelidade)
 */
export async function uploadMarketingPecaImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `marketing/pecas/${timestamp}_${safeName}`;

  try {
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || "image/jpeg",
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    return await new Promise<string>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = snapshot.totalBytes > 0
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            : 0;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.warn("Erro no upload do Firebase Storage:", error);
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            resolve(url);
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  } catch (err) {
    console.warn("Firebase Storage indisponível, usando fallback DataURL:", err);
    if (onProgress) onProgress(50);
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (onProgress) onProgress(100);
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Busca todas as peças de marketing cadastradas no Firestore (com filtro opcional por tipo)
 * Nasce vazia se não houver dados.
 */
export async function fetchMarketingPecas(tipo?: MarketingPecaTipo): Promise<MarketingPeca[]> {
  try {
    const colRef = collection(db, "marketing_pecas");
    const q = tipo
      ? query(colRef, where("tipo", "==", tipo), orderBy("ordem", "asc"))
      : query(colRef, orderBy("ordem", "asc"));

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as MarketingPeca));
      // Se buscou todas, atualiza o cache geral
      if (!tipo) {
        setCachedPecas(list);
      }
      return list;
    }
  } catch (error) {
    console.warn("Erro ao buscar marketing_pecas do Firestore, consultando cache:", error);
  }

  // Fallback cache local
  const cached = getCachedPecas();
  if (tipo) {
    return cached.filter((p) => p.tipo === tipo).sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  }
  return cached.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

/**
 * Verifica se a peça está ativa e dentro do período de validade no momento atual
 */
export function isPecaAtivaNoMomento(peca: MarketingPeca): boolean {
  if (!peca.ativo) return false;

  const now = new Date().getTime();

  if (peca.dataInicio) {
    const inicio = new Date(peca.dataInicio).getTime();
    if (!isNaN(inicio) && now < inicio) {
      return false; // Ainda não começou (agendado)
    }
  }

  if (peca.dataFim) {
    const fim = new Date(peca.dataFim).getTime();
    if (!isNaN(fim) && now > fim) {
      return false; // Já expirou
    }
  }

  return true;
}

/**
 * Retorna o status detalhado da peça para exibição no painel
 */
export function getPecaStatusInfo(peca: MarketingPeca): {
  status: "ativo" | "inativo" | "agendado" | "expirado";
  label: string;
  badgeClass: string;
} {
  if (!peca.ativo) {
    return {
      status: "inativo",
      label: "Inativo",
      badgeClass: "text-[#9B998F] border-[#D6D3CC] bg-[#EEEDE8]",
    };
  }

  const now = new Date().getTime();

  if (peca.dataInicio) {
    const inicio = new Date(peca.dataInicio).getTime();
    if (!isNaN(inicio) && now < inicio) {
      return {
        status: "agendado",
        label: "Agendado",
        badgeClass: "text-[#004AAD] border-[#004AAD]/30 bg-[#004AAD]/5",
      };
    }
  }

  if (peca.dataFim) {
    const fim = new Date(peca.dataFim).getTime();
    if (!isNaN(fim) && now > fim) {
      return {
        status: "expirado",
        label: "Expirado",
        badgeClass: "text-[#9B2C2C] border-[#9B2C2C]/30 bg-[#9B2C2C]/5",
      };
    }
  }

  return {
    status: "ativo",
    label: "Ativo",
    badgeClass: "text-[#0F7A4F] border-[#0F7A4F]/30 bg-[#0F7A4F]/5",
  };
}

/**
 * Função para consumo pela Loja Virtual:
 * Retorna somente as peças ativas e com validade vigente para o tipo solicitado,
 * ordenadas crescentemente por `ordem`.
 */
export async function getPecasAtivas(tipo: MarketingPecaTipo): Promise<MarketingPeca[]> {
  const allPecas = await fetchMarketingPecas(tipo);
  return allPecas
    .filter((p) => isPecaAtivaNoMomento(p))
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

/**
 * Salva ou atualiza uma peça no Firestore
 */
export async function saveMarketingPeca(peca: MarketingPeca): Promise<boolean> {
  const nowIso = new Date().toISOString();
  const id = peca.id || `peca_${peca.tipo}_${Date.now()}`;

  const cleanData: MarketingPeca = sanitizeForFirestore<MarketingPeca>({
    ...peca,
    id,
    ordem: Number(peca.ordem) || 1,
    ativo: peca.ativo !== false,
    titulo: peca.titulo ? peca.titulo.trim() : undefined,
    linkDestino: peca.linkDestino ? peca.linkDestino.trim() : undefined,
    dataInicio: peca.dataInicio || undefined,
    dataFim: peca.dataFim || undefined,
    largura: peca.tipo === "popup" && peca.largura ? Number(peca.largura) : undefined,
    altura: peca.tipo === "popup" && peca.altura ? Number(peca.altura) : undefined,
    updatedAt: nowIso,
    createdAt: peca.createdAt || nowIso,
  });

  // Atualiza cache local
  try {
    const cached = getCachedPecas();
    const idx = cached.findIndex((p) => p.id === cleanData.id);
    let updated: MarketingPeca[];
    if (idx >= 0) {
      updated = [...cached];
      updated[idx] = cleanData;
    } else {
      updated = [...cached, cleanData];
    }
    setCachedPecas(updated);
  } catch (e) {
    console.warn("Erro ao atualizar cache local ao salvar peça:", e);
  }

  try {
    const docRef = doc(db, "marketing_pecas", cleanData.id);
    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (error) {
    console.error("Falha ao salvar peça de marketing no Firestore:", error);
    return true; // Cache local atualizado
  }
}

/**
 * Remove uma peça de marketing do Firestore e cache local
 */
export async function deleteMarketingPeca(id: string): Promise<boolean> {
  // Atualiza cache local
  try {
    const cached = getCachedPecas();
    const filtered = cached.filter((p) => p.id !== id);
    setCachedPecas(filtered);
  } catch (e) {
    console.warn("Erro ao atualizar cache local ao excluir peça:", e);
  }

  try {
    const docRef = doc(db, "marketing_pecas", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Falha ao excluir peça de marketing no Firestore:", error);
    return true;
  }
}

/**
 * Alterna rapidamente o estado ativo/inativo de uma peça
 */
export async function toggleMarketingPecaAtivo(id: string, ativo: boolean): Promise<boolean> {
  const nowIso = new Date().toISOString();

  // Atualiza cache local
  try {
    const cached = getCachedPecas();
    const idx = cached.findIndex((p) => p.id === id);
    if (idx >= 0) {
      cached[idx].ativo = ativo;
      cached[idx].updatedAt = nowIso;
      setCachedPecas(cached);
    }
  } catch (e) {
    console.warn("Erro ao atualizar cache local no toggle ativo:", e);
  }

  try {
    const docRef = doc(db, "marketing_pecas", id);
    await updateDoc(docRef, { ativo, updatedAt: nowIso });
    return true;
  } catch (error) {
    console.error("Falha ao atualizar status ativo da peça no Firestore:", error);
    return true;
  }
}

/**
 * Reordena uma lista de peças do mesmo tipo em lote no Firestore
 */
export async function reorderMarketingPecas(tipo: MarketingPecaTipo, idsInOrder: string[]): Promise<boolean> {
  const nowIso = new Date().toISOString();

  // Atualiza cache local
  try {
    const cached = getCachedPecas();
    idsInOrder.forEach((id, index) => {
      const idx = cached.findIndex((p) => p.id === id);
      if (idx >= 0) {
        cached[idx].ordem = index + 1;
        cached[idx].updatedAt = nowIso;
      }
    });
    setCachedPecas(cached);
  } catch (e) {
    console.warn("Erro ao atualizar cache local na reordenação:", e);
  }

  try {
    const batch = writeBatch(db);
    idsInOrder.forEach((id, index) => {
      const docRef = doc(db, "marketing_pecas", id);
      batch.update(docRef, { ordem: index + 1, updatedAt: nowIso });
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Falha ao reordenar peças no Firestore:", error);
    return true;
  }
}
