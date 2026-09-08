import { CategoryInfo } from "../types";
import { MAIN_CATEGORIES } from "../config/categories";

/**
 * Categorias mapeadas diretamente da Fonte Única de Verdade (src/config/categories.ts).
 * As categorias nascem vazias de produto (itemCount = 0).
 */
export const CATEGORIES: CategoryInfo[] = MAIN_CATEGORIES.map((cat, index) => ({
  id: cat.id as any,
  nome: cat.name,
  name: cat.name,
  slug: cat.slug,
  ativo: true,
  ordem: index + 1,
  description: cat.description || "",
  itemCount: 0,
}));

export * from "../config/categories";
