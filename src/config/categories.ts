/**
 * FONTE ÚNICA DE VERDADE — Estrutura Oficial de Categorias e Coleções
 * Glos Presentes (glos.)
 *
 * ARQUITETURA OBRIGATÓRIA:
 * A) CATEGORIAS PRINCIPAIS (por tipo de produto) = Pastas REAIS.
 *    Cada produto mora em UMA categoria principal + UMA subcategoria.
 *    Alimentam o menu de navegação da loja.
 *
 * B) COLEÇÕES DINÂMICAS (transversais) = NÃO são pastas.
 *    O produto entra nelas por TAG, nunca por duplicação. Um mesmo produto
 *    pode estar em várias ao mesmo tempo (ex.: categoria "Canecas e Copos"
 *    + tags "Licenciados" e "Datas").
 */

export interface SubcategoryConfig {
  id: string;
  name: string;
}

export interface MainCategoryConfig {
  id: string;
  name: string;
  slug: string;
  subcategories: SubcategoryConfig[];
  description?: string;
  itemCount: number; // Nascem vazias de produto (0)
}

export interface DynamicCollectionConfig {
  id: string;
  name: string;
  slug: string;
  type: "recency" | "tags";
  tags: string[];
}

/**
 * Utilitário padrão para geração de slugs consistentes
 */
export function slugifyCategory(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * A) CATEGORIAS PRINCIPAIS (por tipo de produto)
 * Exatamente os nomes e acentos oficiais da marca glos.
 */
export const MAIN_CATEGORIES: MainCategoryConfig[] = [
  {
    id: "presentes-e-kits",
    name: "Presentes e Kits",
    slug: "presentes-e-kits",
    itemCount: 0,
    description: "Kits prontos, cestas e caixas especiais de presente com afeto e personalização.",
    subcategories: [
      { id: "kits-prontos", name: "Kits Prontos" },
      { id: "monte-seu-kit", name: "Monte seu Kit" },
      { id: "cestas", name: "Cestas" },
      { id: "caixas-presente", name: "Caixas Presente" },
    ],
  },
  {
    id: "canecas-e-copos",
    name: "Canecas e Copos",
    slug: "canecas-e-copos",
    itemCount: 0,
    description: "Porcelana, alumínio, taças e copos especiais para café, drinks e celebrações.",
    subcategories: [
      { id: "porcelana", name: "Porcelana" },
      { id: "aluminio", name: "Alumínio" },
      { id: "acrilico-plastico", name: "Acrílico/Plástico" },
      { id: "canecas-magicas", name: "Canecas Mágicas" },
      { id: "copos-e-long-drinks", name: "Copos e Long Drinks" },
      { id: "tacas", name: "Taças" },
      { id: "xicaras", name: "Xícaras" },
    ],
  },
  {
    id: "garrafas-e-squeezes",
    name: "Garrafas e Squeezes",
    slug: "garrafas-e-squeezes",
    itemCount: 0,
    description: "Garrafas térmicas com isolamento a vácuo, squeezes e copos térmicos.",
    subcategories: [
      { id: "garrafas-termicas", name: "Garrafas Térmicas" },
      { id: "squeezes", name: "Squeezes" },
      { id: "garrafas-de-vidro", name: "Garrafas de Vidro" },
      { id: "copos-termicos", name: "Copos Térmicos" },
      { id: "kits-hidratacao", name: "Kits Hidratação" },
    ],
  },
  {
    id: "papelaria",
    name: "Papelaria",
    slug: "papelaria",
    itemCount: 0,
    description: "Cadernos de capa dura, planners, blocos, adesivos e cartões afetivos.",
    subcategories: [
      { id: "cadernos", name: "Cadernos" },
      { id: "agendas-e-planners", name: "Agendas e Planners" },
      { id: "blocos-e-post-its", name: "Blocos e Post-its" },
      { id: "canetas", name: "Canetas" },
      { id: "adesivos", name: "Adesivos" },
      { id: "cartoes-e-convites", name: "Cartões e Convites" },
    ],
  },
  {
    id: "camiseta",
    name: "Camiseta",
    slug: "camiseta",
    itemCount: 0,
    description: "Camisetas em algodão nobre com estampas autorais, família e personalizadas.",
    subcategories: [
      { id: "feminina", name: "Feminina" },
      { id: "masculina", name: "Masculina" },
      { id: "infantil-e-baby", name: "Infantil e Baby" },
      { id: "casais-e-familia", name: "Casais e Família" },
      { id: "personalizada", name: "Personalizada" },
      { id: "estampadas", name: "Estampadas" },
    ],
  },
  {
    id: "material-grafico",
    name: "Material Gráfico",
    slug: "material-grafico",
    itemCount: 0,
    description: "Cartões de visita, panfletos, banners, rótulos e convites personalizados.",
    subcategories: [
      { id: "cartao-de-visita", name: "Cartão de Visita" },
      { id: "flyers-e-panfletos", name: "Flyers e Panfletos" },
      { id: "banners-e-faixas", name: "Banners e Faixas" },
      { id: "adesivos-e-rotulos", name: "Adesivos e Rótulos" },
      { id: "convites", name: "Convites" },
      { id: "papelaria-de-marca", name: "Papelaria de Marca" },
    ],
  },
  {
    id: "mochilas-e-bolsas",
    name: "Mochilas e Bolsas",
    slug: "mochilas-e-bolsas",
    itemCount: 0,
    description: "Mochilas utilitárias, ecobags duráveis, necessaires e estojos organizadores.",
    subcategories: [
      { id: "mochilas", name: "Mochilas" },
      { id: "bolsas", name: "Bolsas" },
      { id: "ecobags-e-sacolas", name: "Ecobags e Sacolas" },
      { id: "necessaires", name: "Necessaires" },
      { id: "estojos", name: "Estojos" },
      { id: "lancheiras", name: "Lancheiras" },
    ],
  },
  {
    id: "fragrancias",
    name: "Fragrâncias",
    slug: "fragrancias",
    itemCount: 0,
    description: "Velas aromáticas em cera vegetal, difusores e home sprays de bem-estar.",
    subcategories: [
      { id: "perfumes", name: "Perfumes" },
      { id: "difusores", name: "Difusores" },
      { id: "velas-aromaticas", name: "Velas Aromáticas" },
      { id: "home-spray", name: "Home Spray" },
      { id: "kits-aromas", name: "Kits Aromas" },
    ],
  },
];

/**
 * B) COLEÇÕES DINÂMICAS (transversais por tag)
 * O produto entra nelas por TAG, nunca por duplicação.
 */
export const DYNAMIC_COLLECTIONS: DynamicCollectionConfig[] = [
  {
    id: "lancamentos",
    name: "Lançamentos",
    slug: "lancamentos",
    type: "recency",
    tags: [], // Sem subtags; puxa por recência (ou tag "Lançamentos")
  },
  {
    id: "datas",
    name: "Datas",
    slug: "datas",
    type: "tags",
    tags: [
      "Dia das Mães",
      "Dia dos Pais",
      "Namorados",
      "Natal",
      "Páscoa",
      "Dia das Crianças",
      "Formatura",
      "Ano Novo",
    ],
  },
  {
    id: "por-ocasiao",
    name: "Por Ocasião",
    slug: "por-ocasiao",
    type: "tags",
    tags: [
      "Amor",
      "Aniversário",
      "Bodas",
      "Pets",
      "Casamento",
      "Nascimento",
    ],
  },
  {
    id: "por-profissao",
    name: "Por Profissão",
    slug: "por-profissao",
    type: "tags",
    tags: [
      "Medicina",
      "Direito",
      "Enfermagem",
      "Engenharia",
      "Professor",
      "Outras",
    ],
  },
  {
    id: "licenciados",
    name: "Licenciados",
    slug: "licenciados",
    type: "tags",
    tags: [
      "Turma da Mônica",
      "Smilinguido",
      "Times",
    ],
  },
];

/**
 * Tags disponíveis agrupadas por coleção dinâmica para uso no formulário de produto
 */
export const DYNAMIC_TAG_GROUPS = [
  {
    collectionId: "datas",
    collectionName: "Datas",
    tags: [
      "Dia das Mães",
      "Dia dos Pais",
      "Namorados",
      "Natal",
      "Páscoa",
      "Dia das Crianças",
      "Formatura",
      "Ano Novo",
    ],
  },
  {
    collectionId: "por-ocasiao",
    collectionName: "Por Ocasião",
    tags: [
      "Amor",
      "Aniversário",
      "Bodas",
      "Pets",
      "Casamento",
      "Nascimento",
    ],
  },
  {
    collectionId: "por-profissao",
    collectionName: "Por Profissão",
    tags: [
      "Medicina",
      "Direito",
      "Enfermagem",
      "Engenharia",
      "Professor",
      "Outras",
    ],
  },
  {
    collectionId: "licenciados",
    collectionName: "Licenciados",
    tags: [
      "Turma da Mônica",
      "Smilinguido",
      "Times",
    ],
  },
];

/**
 * Lista plana de todas as tags conhecidas para busca rápida
 */
export const ALL_DYNAMIC_TAGS: string[] = [
  "Lançamentos",
  ...DYNAMIC_TAG_GROUPS.flatMap((g) => g.tags),
];

/**
 * Recupera as subcategorias de uma categoria principal (por id ou nome)
 */
export function getSubcategoriesByCategory(categoryNameOrId: string): SubcategoryConfig[] {
  if (!categoryNameOrId) return [];
  const normalized = categoryNameOrId.trim().toLowerCase();
  const found = MAIN_CATEGORIES.find(
    (c) =>
      c.id.toLowerCase() === normalized ||
      c.name.toLowerCase() === normalized ||
      c.slug.toLowerCase() === normalized
  );
  return found ? found.subcategories : [];
}

/**
 * Encontra uma categoria principal por id, slug ou nome
 */
export function findMainCategory(categoryNameOrId: string): MainCategoryConfig | undefined {
  if (!categoryNameOrId) return undefined;
  const normalized = categoryNameOrId.trim().toLowerCase();
  return MAIN_CATEGORIES.find(
    (c) =>
      c.id.toLowerCase() === normalized ||
      c.name.toLowerCase() === normalized ||
      c.slug.toLowerCase() === normalized
  );
}
