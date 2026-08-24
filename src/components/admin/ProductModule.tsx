import React, { useState, useEffect } from "react";
import { ProductList } from "./ProductList";
import { ProductForm } from "./ProductForm";
import { CategoryManager } from "./CategoryManager";
import { BrandManager } from "./BrandManager";
import { SegmentedPricingManager } from "./SegmentedPricingManager";
import { ProductReviewsManager } from "./ProductReviewsManager";
import { ProductImportManager } from "./ProductImportManager";
import { ProductTrashManager } from "./ProductTrashManager";
import { PricingCalculator } from "./PricingCalculator";
import { PageHeader } from "./PageHeader";
import { Card } from "./Card";
import {
  Product,
  CategoryInfo,
  ProductBrand,
  SegmentedPriceRule,
  ProductReview,
  Supplier,
} from "../../types";
import { fetchSuppliers, DEFAULT_SUPPLIER_FABRICACAO_PROPRIA, fetchCategories } from "../../lib/firebase";
import {
  getProductsFromStorage,
  saveProductsToStorage,
  getBrandsFromStorage,
  saveBrandsToStorage,
  getSegmentedRulesFromStorage,
  saveSegmentedRulesToStorage,
  getReviewsFromStorage,
  saveReviewsToStorage,
} from "../../services/productService";
import { CATEGORIES } from "../../data/categories";

interface ProductModuleProps {
  subSectionId?: string;
  onNavigateSubSection: (subId: string, subLabel: string) => void;
  onShowToast?: (message: string, type?: "success" | "error") => void;
}

/**
 * Módulo Completo de Produtos (ProductModule) — glos.
 * Orquestra Listagem, Formulário de Criação/Edição, Categorias, Marcas, Grades,
 * Preços Segmentados, Avaliações (UGC), Importação e Lixeira.
 */
export const ProductModule: React.FC<ProductModuleProps> = ({
  subSectionId = "listar",
  onNavigateSubSection,
  onShowToast,
}) => {
  const [products, setProducts] = useState<Product[]>(() => getProductsFromStorage());
  const [brands, setBrands] = useState<ProductBrand[]>(() => getBrandsFromStorage());
  const [categories, setCategories] = useState<CategoryInfo[]>(CATEGORIES);
  const [segmentedRules, setSegmentedRules] = useState<SegmentedPriceRule[]>(() =>
    getSegmentedRulesFromStorage()
  );
  const [reviews, setReviews] = useState<ProductReview[]>(() => getReviewsFromStorage());
  const [suppliers, setSuppliers] = useState<Supplier[]>([DEFAULT_SUPPLIER_FABRICACAO_PROPRIA]);

  // Carrega fornecedores e categorias do Firestore
  useEffect(() => {
    fetchSuppliers()
      .then((list) => {
        if (list && list.length > 0) setSuppliers(list);
      })
      .catch((err) => console.warn("Erro ao buscar fornecedores:", err));

    fetchCategories()
      .then((cats) => {
        if (cats && cats.length > 0) setCategories(cats);
      })
      .catch((err) => console.warn("Erro ao buscar categorias:", err));
  }, []);

  // Estado de edição de produto
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Sincroniza quando subSectionId muda para "criar"
  useEffect(() => {
    if (subSectionId === "criar") {
      setEditingProduct(null);
      setIsCreatingNew(true);
    } else if (subSectionId === "listar") {
      setIsCreatingNew(false);
      setEditingProduct(null);
    }
  }, [subSectionId]);

  // Handlers para Produtos
  const handleSaveProduct = (productData: Partial<Product>) => {
    let updatedList: Product[];
    const exists = products.find((p) => p.id === productData.id);

    if (exists) {
      updatedList = products.map((p) =>
        p.id === productData.id ? ({ ...p, ...productData } as Product) : p
      );
    } else {
      updatedList = [productData as Product, ...products];
    }

    setProducts(updatedList);
    saveProductsToStorage(updatedList);
    setIsCreatingNew(false);
    setEditingProduct(null);
    onNavigateSubSection("listar", "Listar produtos");
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsCreatingNew(true);
  };

  const handleDuplicateProduct = (prod: Product) => {
    const duplicated: Product = {
      ...prod,
      id: `prod-${Date.now()}`,
      name: `${prod.name} (Cópia)`,
      sku: `${prod.sku}-COP`,
      slug: `${prod.slug}-copia-${Math.random().toString(36).substring(2, 5)}`,
    };
    const updated = [duplicated, ...products];
    setProducts(updated);
    saveProductsToStorage(updated);
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.map((p) =>
      p.id === productId
        ? { ...p, deleted: true, deletedAt: new Date().toLocaleDateString("pt-BR") }
        : p
    );
    setProducts(updated);
    saveProductsToStorage(updated);
  };

  const handleRestoreProduct = (productId: string) => {
    const updated = products.map((p) =>
      p.id === productId ? { ...p, deleted: false, deletedAt: undefined } : p
    );
    setProducts(updated);
    saveProductsToStorage(updated);
  };

  const handlePermanentDeleteProduct = (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveProductsToStorage(updated);
  };

  const handleEmptyTrash = () => {
    const updated = products.filter((p) => !p.deleted);
    setProducts(updated);
    saveProductsToStorage(updated);
  };

  // Handlers para Marcas
  const handleSaveBrand = (brand: ProductBrand) => {
    const exists = brands.find((b) => b.id === brand.id);
    const updated = exists
      ? brands.map((b) => (b.id === brand.id ? brand : b))
      : [...brands, brand];
    setBrands(updated);
    saveBrandsToStorage(updated);
  };

  const handleDeleteBrand = (brandId: string) => {
    const updated = brands.filter((b) => b.id !== brandId);
    setBrands(updated);
    saveBrandsToStorage(updated);
  };

  // Handlers para Preços Segmentados
  const handleSaveSegmentedRule = (rule: SegmentedPriceRule) => {
    const exists = segmentedRules.find((r) => r.id === rule.id);
    const updated = exists
      ? segmentedRules.map((r) => (r.id === rule.id ? rule : r))
      : [...segmentedRules, rule];
    setSegmentedRules(updated);
    saveSegmentedRulesToStorage(updated);
  };

  const handleDeleteSegmentedRule = (ruleId: string) => {
    const updated = segmentedRules.filter((r) => r.id !== ruleId);
    setSegmentedRules(updated);
    saveSegmentedRulesToStorage(updated);
  };

  // Handlers para Avaliações
  const handleUpdateReviewStatus = (
    reviewId: string,
    status: "aprovado" | "pendente" | "recusado"
  ) => {
    const updated = reviews.map((r) =>
      r.id === reviewId ? { ...r, status } : r
    );
    setReviews(updated);
    saveReviewsToStorage(updated);
  };

  const handleDeleteReview = (reviewId: string) => {
    const updated = reviews.filter((r) => r.id !== reviewId);
    setReviews(updated);
    saveReviewsToStorage(updated);
  };

  // Breadcrumbs e Título
  const getSubSectionTitle = () => {
    switch (subSectionId) {
      case "criar":
        return isCreatingNew && editingProduct ? "Editar Produto" : "Criar Produto";
      case "categorias":
        return "Categorias";
      case "marcas":
        return "Marcas";
      case "precos-segmentados":
        return "Preços Segmentados";
      case "avaliacoes":
        return "Avaliações";
      case "importar":
        return "Importar Produtos";
      case "precificacao-markup":
        return "Precificação & Markup Gross-up";
      case "lixeira":
        return "Lixeira de Produtos";
      default:
        return "Listar Produtos";
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header do Módulo */}
      {!isCreatingNew && (
        <PageHeader
          title={getSubSectionTitle()}
          subtitle="Gestão & Operação — Catálogo B2C de presentes personalizados, kits e itens licenciados"
          breadcrumbs={[
            { label: "Painel do Lojista" },
            { label: "Gestão & Operação" },
            { label: "Produtos" },
            { label: getSubSectionTitle() },
          ]}
        />
      )}

      {/* Renderização condicional por sub-item */}
      {isCreatingNew ? (
        <ProductForm
          product={editingProduct}
          categories={categories}
          brands={brands}
          suppliers={suppliers}
          onSave={handleSaveProduct}
          onCancel={() => {
            setIsCreatingNew(false);
            setEditingProduct(null);
            onNavigateSubSection("listar", "Listar produtos");
          }}
        />
      ) : subSectionId === "categorias" ? (
        <CategoryManager
          categories={categories}
          onCategoriesUpdated={(cats) => setCategories(cats)}
        />
      ) : subSectionId === "marcas" ? (
        <BrandManager
          brands={brands}
          onSaveBrand={handleSaveBrand}
          onDeleteBrand={handleDeleteBrand}
        />
      ) : subSectionId === "precos-segmentados" ? (
        <SegmentedPricingManager
          products={products.filter((p) => !p.deleted)}
          rules={segmentedRules}
          onSaveRule={handleSaveSegmentedRule}
          onDeleteRule={handleDeleteSegmentedRule}
        />
      ) : subSectionId === "avaliacoes" ? (
        <ProductReviewsManager
          reviews={reviews}
          onUpdateStatus={handleUpdateReviewStatus}
          onDeleteReview={handleDeleteReview}
        />
      ) : subSectionId === "importar" ? (
        <ProductImportManager
          onImportComplete={(count) => {
            onNavigateSubSection("listar", "Listar produtos");
          }}
          onCancel={() => onNavigateSubSection("listar", "Listar produtos")}
        />
      ) : subSectionId === "precificacao-markup" ? (
        <div className="space-y-6">
          <PricingCalculator
            initialCost={45}
            initialPrice={149.9}
          />
        </div>
      ) : subSectionId === "lixeira" ? (
        <ProductTrashManager
          deletedProducts={products.filter((p) => p.deleted)}
          onRestoreProduct={handleRestoreProduct}
          onPermanentDeleteProduct={handlePermanentDeleteProduct}
          onEmptyTrash={handleEmptyTrash}
          onBackToList={() => onNavigateSubSection("listar", "Listar produtos")}
        />
      ) : (
        /* Padrão: subSectionId === "listar" */
        <ProductList
          products={products}
          onCreateProduct={() => {
            setEditingProduct(null);
            setIsCreatingNew(true);
          }}
          onEditProduct={handleEditProduct}
          onDuplicateProduct={handleDuplicateProduct}
          onDeleteProduct={handleDeleteProduct}
          onNavigateImport={() => onNavigateSubSection("importar", "Importar")}
          onNavigateTrash={() => onNavigateSubSection("lixeira", "Lixeira")}
        />
      )}
    </div>
  );
};
