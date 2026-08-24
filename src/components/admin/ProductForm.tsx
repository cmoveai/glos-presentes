import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Save,
  ArrowLeft,
  Upload,
  X,
  Plus,
  RefreshCw,
  HelpCircle,
  AlertCircle,
  Eye,
  CheckCircle2,
  Video,
  Package,
  Layers,
  FileText,
  Search,
} from "lucide-react";
import {
  Product,
  ProductType,
  CategoryInfo,
  ProductBrand,
  CustomizationOptions,
  LicensingInfo,
  Supplier,
} from "../../types";
import { Card } from "./Card";
import { PricingCalculator } from "./PricingCalculator";
import { generateProductDraft } from "../../services/productService";
import { fetchSuppliers, DEFAULT_SUPPLIER_FABRICACAO_PROPRIA } from "../../lib/firebase";

interface ProductFormProps {
  product?: Product | null;
  categories: CategoryInfo[];
  brands: ProductBrand[];
  suppliers?: Supplier[];
  onSave: (productData: Partial<Product>) => void;
  onCancel: () => void;
}

/**
 * 3.2 Criar / Editar Produto (ProductForm) — glos.
 * Formulário completo full-bleed com distinção clara entre Personalizável, Licenciado e Simples,
 * geração afetiva via IA e simulador de Markup Gross-up.
 */
export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  categories,
  brands,
  suppliers = [],
  onSave,
  onCancel,
}) => {
  // 1) Principais
  const [name, setName] = useState(product?.name || "");
  const [shortDescription, setShortDescription] = useState(product?.shortDescription || "");
  const [description, setDescription] = useState(product?.description || "");
  const [isNew, setIsNew] = useState(product?.new ?? true);
  const [hasVariants, setHasVariants] = useState(Boolean(product?.variants && product.variants.length > 0));
  const [isVisible, setIsVisible] = useState(product?.active ?? true);
  const [isForSale, setIsForSale] = useState(true);
  const [isFeatured, setIsFeatured] = useState(product?.featured ?? false);
  const [isAiDraftLoading, setIsAiDraftLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  // 2) Natureza do Produto
  const [productType, setProductType] = useState<ProductType>(
    product?.productType || "personalizavel"
  );
  // Se Personalizável
  const [allowPhoto, setAllowPhoto] = useState(product?.customizationOptions?.allowPhoto ?? true);
  const [allowName, setAllowName] = useState(product?.customizationOptions?.allowName ?? true);
  const [allowMessage, setAllowMessage] = useState(product?.customizationOptions?.allowMessage ?? true);
  const [allowColor, setAllowColor] = useState(product?.customizationOptions?.allowColor ?? false);
  const [customInstructions, setCustomInstructions] = useState(
    product?.customizationOptions?.instructions || ""
  );
  const [requirePhotoUpload, setRequirePhotoUpload] = useState(
    product?.customizationOptions?.requirePhotoUpload ?? true
  );

  // Se Licenciado
  const [licensor, setLicensor] = useState(product?.licensingInfo?.licensor || "");
  const [contractNumber, setContractNumber] = useState(product?.licensingInfo?.contractNumber || "");
  const [validUntil, setValidUntil] = useState(product?.licensingInfo?.validUntil || "");

  // 3) Imagens & Vídeo
  const [images, setImages] = useState<string[]>(
    product?.images || [
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80",
    ]
  );
  const [newImageUrl, setNewImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState(product?.videoUrl || "");

  // 4) Preços
  const [costPrice, setCostPrice] = useState<number>(product?.costPrice || 45.0);
  const [price, setPrice] = useState<number>(product?.price || 149.9);
  const [promotionalPrice, setPromotionalPrice] = useState<number | undefined>(
    product?.promotionalPrice
  );
  const [priceOnDemand, setPriceOnDemand] = useState(product?.priceOnDemand || false);

  // 5) Embalagem (Frete)
  const [weightKg, setWeightKg] = useState<number>(product?.packaging?.weightKg || 0.85);
  const [heightCm, setHeightCm] = useState<number>(product?.packaging?.heightCm || 15);
  const [widthCm, setWidthCm] = useState<number>(product?.packaging?.widthCm || 20);
  const [depthCm, setDepthCm] = useState<number>(product?.packaging?.depthCm || 25);

  // 6) Códigos & Estoque
  const [sku, setSku] = useState(product?.sku || `GLOS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`);
  const [gtin, setGtin] = useState(product?.fiscalInfo?.gtin || "");
  const [mpn, setMpn] = useState(product?.fiscalInfo?.mpn || "");
  const [ncm, setNcm] = useState(product?.fiscalInfo?.ncm || "69111010");
  const [manageStock, setManageStock] = useState(product?.manageStock ?? true);
  const [stock, setStock] = useState<number>(product?.stock ?? 20);
  const [availability, setAvailability] = useState<"pronta_entrega" | "sob_encomenda">(
    product?.availability || "pronta_entrega"
  );
  const [outOfStockAction, setOutOfStockAction] = useState<"indisponivel" | "continuar_vendendo">(
    product?.outOfStockAction || "indisponivel"
  );

  // 7) Informações Fiscais
  const [productionType, setProductionType] = useState<"revenda" | "fabricacao_propria">(
    product?.fiscalInfo?.productionType || "fabricacao_propria"
  );
  const [origin, setOrigin] = useState(product?.fiscalInfo?.origin || "0 - Nacional");

  // 8) Organização & Fornecedor
  const [categoryId, setCategoryId] = useState(product?.category || "kits-presenteaveis");
  const [brandId, setBrandId] = useState(product?.brandId || "brand-glos");
  const [collectionName, setCollectionName] = useState(product?.collectionName || "Linha Afeto & Memórias");
  const [suppliersList, setSuppliersList] = useState<Supplier[]>(
    suppliers && suppliers.length > 0 ? suppliers : [DEFAULT_SUPPLIER_FABRICACAO_PROPRIA]
  );
  const [fornecedorId, setFornecedorId] = useState<string>(
    product?.fornecedorId || DEFAULT_SUPPLIER_FABRICACAO_PROPRIA.id
  );

  // Carrega fornecedores se a prop não foi passada ou vier vazia
  useEffect(() => {
    if (suppliers && suppliers.length > 0) {
      setSuppliersList(suppliers);
    } else {
      fetchSuppliers()
        .then((list) => {
          if (list && list.length > 0) {
            setSuppliersList(list);
          }
        })
        .catch((e) => console.warn("Erro ao buscar fornecedores para o produto:", e));
    }
  }, [suppliers]);

  // 9) SEO
  const [tagTitle, setTagTitle] = useState(
    product?.seo?.tagTitle || (name ? `${name} | Glos Presentes` : "")
  );
  const [metaDescription, setMetaDescription] = useState(
    product?.seo?.metaDescription || shortDescription || ""
  );
  const [slug, setSlug] = useState(
    product?.slug ||
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
  );

  // Sincroniza slug se o nome mudar e for novo produto
  useEffect(() => {
    if (!product && name) {
      const generatedSlug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generatedSlug);
      if (!tagTitle) setTagTitle(`${name} | Glos Presentes`);
    }
  }, [name, product]);

  const handleGenerateWithAi = async () => {
    setIsAiDraftLoading(true);
    try {
      const draft = await generateProductDraft(aiPrompt || name || "Kit Presente");
      if (draft.name) setName(draft.name);
      if (draft.shortDescription) setShortDescription(draft.shortDescription);
      if (draft.description) setDescription(draft.description);
      if (draft.price) setPrice(draft.price);
      if (draft.costPrice) setCostPrice(draft.costPrice);
      if (draft.seo?.tagTitle) setTagTitle(draft.seo.tagTitle);
      if (draft.seo?.metaDescription) setMetaDescription(draft.seo.metaDescription);
      if (draft.customizationOptions?.instructions) {
        setCustomInstructions(draft.customizationOptions.instructions);
      }
    } finally {
      setIsAiDraftLoading(false);
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim() && !images.includes(newImageUrl.trim())) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedCategoryObj = categories.find((c) => c.id === categoryId);
    const selectedBrandObj = brands.find((b) => b.id === brandId);
    const selectedSupplierObj = suppliersList.find((s) => s.id === fornecedorId);
    const finalFornecedorId = fornecedorId || DEFAULT_SUPPLIER_FABRICACAO_PROPRIA.id;
    const finalFornecedorNome =
      selectedSupplierObj?.nomeFantasia ||
      selectedSupplierObj?.razaoSocial ||
      DEFAULT_SUPPLIER_FABRICACAO_PROPRIA.nomeFantasia;

    const payload: Partial<Product> = {
      id: product?.id || `prod-${Date.now()}`,
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      shortDescription,
      description,
      category: categoryId as any,
      categoryName: selectedCategoryObj?.nome || selectedCategoryObj?.name || "Presentes",
      brandId,
      brandName: selectedBrandObj?.name || "glos. atelier",
      fornecedorId: finalFornecedorId,
      fornecedorNome: finalFornecedorNome,
      productType,
      customizationOptions:
        productType === "personalizavel"
          ? {
              allowPhoto,
              allowName,
              allowMessage,
              allowColor,
              instructions: customInstructions,
              requirePhotoUpload,
            }
          : undefined,
      licensingInfo:
        productType === "licenciado"
          ? {
              licensor,
              contractNumber,
              validUntil,
            }
          : undefined,
      price,
      promotionalPrice: promotionalPrice || undefined,
      costPrice,
      priceOnDemand,
      images,
      videoUrl: videoUrl || undefined,
      sku,
      stock,
      manageStock,
      availability,
      outOfStockAction,
      packaging: {
        weightKg,
        heightCm,
        widthCm,
        depthCm,
      },
      fiscalInfo: {
        productionType,
        origin,
        ncm,
        gtin,
        mpn,
      },
      collectionName,
      seo: {
        tagTitle,
        metaDescription,
        slug,
      },
      featured: isFeatured,
      new: isNew,
      active: isVisible,
      deleted: false,
    };

    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full pb-20">
      {/* Barra de Topo do Formulário */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D6D3CC]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-[6px] text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] transition-colors"
            title="Voltar à lista"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#004AAD] block">
              {product ? "Editar cadastro" : "Novo produto"}
            </span>
            <h2 className="text-lg font-medium text-[#272727]">
              {name || "Novo Produto"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-[#6B6A64] hover:text-[#272727] text-xs font-medium hover:bg-[#EEEDE8] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Produto</span>
          </button>
        </div>
      </div>

      {/* SEÇÃO 1: PRINCIPAIS + IA GENERATOR */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D6D3CC]">
          <div>
            <h3 className="text-sm font-medium text-[#272727]">
              1. Informações Principais
            </h3>
            <p className="text-[11px] text-[#6B6A64]">
              Nome comercial, visibilidade e descrição afetiva do produto
            </p>
          </div>

          {/* Gerador com IA */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ex: Caneca com foto e frase de afeto..."
              className="px-2.5 py-1.5 text-xs bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-[#272727] placeholder-[#9B998F] focus:outline-none focus:border-[#004AAD] min-w-[200px]"
            />
            <button
              type="button"
              onClick={handleGenerateWithAi}
              disabled={isAiDraftLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[rgba(0,74,173,0.08)] border border-[#004AAD]/30 text-[#004AAD] text-xs font-medium hover:bg-[#004AAD] hover:text-white transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiDraftLoading ? "Gerando..." : "Cadastrar com IA"}</span>
            </button>
          </div>
        </div>

        {/* Nome do Produto */}
        <div>
          <label className="block text-xs font-medium text-[#272727] mb-1">
            Nome do Produto *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Kit Mimo Afetivo (Caneca + Vela + Foto Polaroid)"
            className="w-full px-3 py-2 text-xs bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-[#272727] focus:outline-none focus:border-[#004AAD]"
          />
        </div>

        {/* Resumo curto */}
        <div>
          <label className="block text-xs font-medium text-[#272727] mb-1">
            Resumo Curto (exibido na vitrine e cards)
          </label>
          <input
            type="text"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Ex: Composição delicada com caneca personalizada e vela botânica..."
            className="w-full px-3 py-2 text-xs bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-[#272727] focus:outline-none focus:border-[#004AAD]"
          />
        </div>

        {/* Descrição Completa */}
        <div>
          <label className="block text-xs font-medium text-[#272727] mb-1">
            Descrição Completa e Afetiva
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Conte a história do produto, detalhes dos materiais e a experiência de presentear..."
            className="w-full px-3 py-2 text-xs bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-[#272727] leading-relaxed focus:outline-none focus:border-[#004AAD]"
          />
        </div>

        {/* Toggles de Status */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#D6D3CC]">
          <label className="flex items-center gap-2 text-xs text-[#272727] cursor-pointer">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              className="rounded text-[#004AAD] focus:ring-0"
            />
            <span>Produto Ativo / Visível</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-[#272727] cursor-pointer">
            <input
              type="checkbox"
              checked={isForSale}
              onChange={(e) => setIsForSale(e.target.checked)}
              className="rounded text-[#004AAD] focus:ring-0"
            />
            <span>Disponível para Venda</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-[#272727] cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded text-[#004AAD] focus:ring-0"
            />
            <span>Em Destaque na Home</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-[#272727] cursor-pointer">
            <input
              type="checkbox"
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
              className="rounded text-[#004AAD] focus:ring-0"
            />
            <span>Selo de Novidade</span>
          </label>
        </div>
      </Card>

      {/* SEÇÃO 2: TIPO DE PRODUTO (PERSONALIZÁVEL × LICENCIADO × SIMPLES) */}
      <Card padding="md" className="space-y-4">
        <div className="pb-3 border-b border-[#D6D3CC]">
          <h3 className="text-sm font-medium text-[#272727]">
            2. Natureza do Produto (Glos Presentes)
          </h3>
          <p className="text-[11px] text-[#6B6A64]">
            Defina se o produto recebe personalização com foto/mensagem, se é arte licenciada ou simples
          </p>
        </div>

        {/* Seletor Segmented de Natureza */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setProductType("personalizavel")}
            className={`p-3 rounded-[6px] border text-left transition-all ${
              productType === "personalizavel"
                ? "bg-[rgba(0,74,173,0.08)] border-[#004AAD] text-[#004AAD]"
                : "bg-[#EEEDE8] border-[#D6D3CC] text-[#6B6A64] hover:text-[#272727]"
            }`}
          >
            <div className="font-medium text-xs">Personalizável</div>
            <div className="text-[11px] opacity-80 mt-0.5">
              Cliente envia foto, nome e/ou dedicatória
            </div>
          </button>

          <button
            type="button"
            onClick={() => setProductType("licenciado")}
            className={`p-3 rounded-[6px] border text-left transition-all ${
              productType === "licenciado"
                ? "bg-[rgba(0,74,173,0.08)] border-[#004AAD] text-[#004AAD]"
                : "bg-[#EEEDE8] border-[#D6D3CC] text-[#6B6A64] hover:text-[#272727]"
            }`}
          >
            <div className="font-medium text-xs">Licenciado</div>
            <div className="text-[11px] opacity-80 mt-0.5">
              Arte sob contrato (Peanuts, Disney, etc.)
            </div>
          </button>

          <button
            type="button"
            onClick={() => setProductType("simples")}
            className={`p-3 rounded-[6px] border text-left transition-all ${
              productType === "simples"
                ? "bg-[rgba(0,74,173,0.08)] border-[#004AAD] text-[#004AAD]"
                : "bg-[#EEEDE8] border-[#D6D3CC] text-[#6B6A64] hover:text-[#272727]"
            }`}
          >
            <div className="font-medium text-xs">Simples</div>
            <div className="text-[11px] opacity-80 mt-0.5">
              Produto de prateleira sem customização
            </div>
          </button>
        </div>

        {/* Painel condicional: PERSONALIZÁVEL */}
        {productType === "personalizavel" && (
          <div className="p-4 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] space-y-3">
            <span className="text-[11px] uppercase tracking-wider text-[#004AAD] font-medium block">
              Configurações de Personalização do Cliente
            </span>

            <div>
              <label className="block text-xs text-[#272727] mb-1.5">
                Quais tipos de personalização são aceitos?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={allowPhoto}
                    onChange={(e) => setAllowPhoto(e.target.checked)}
                    className="rounded text-[#004AAD]"
                  />
                  <span>Foto do Cliente</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={allowName}
                    onChange={(e) => setAllowName(e.target.checked)}
                    className="rounded text-[#004AAD]"
                  />
                  <span>Nome / Iniciais</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={allowMessage}
                    onChange={(e) => setAllowMessage(e.target.checked)}
                    className="rounded text-[#004AAD]"
                  />
                  <span>Mensagem / Frase</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={allowColor}
                    onChange={(e) => setAllowColor(e.target.checked)}
                    className="rounded text-[#004AAD]"
                  />
                  <span>Cor / Acabamento</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#272727] mb-1">
                Instruções de Personalização ao Cliente
              </label>
              <textarea
                rows={2}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Ex: Envie 1 foto de alta resolução e até 50 caracteres para a frase da caneca..."
                className="w-full px-3 py-2 text-xs bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] text-[#272727] focus:outline-none focus:border-[#004AAD]"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-[#272727] pt-1">
              <input
                type="checkbox"
                checked={requirePhotoUpload}
                onChange={(e) => setRequirePhotoUpload(e.target.checked)}
                className="rounded text-[#004AAD]"
              />
              <span>Exige upload de imagem obrigatório no checkout</span>
            </label>
          </div>
        )}

        {/* Painel condicional: LICENCIADO */}
        {productType === "licenciado" && (
          <div className="p-4 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] space-y-3">
            <span className="text-[11px] uppercase tracking-wider text-[#272727] font-medium block">
              Controle Interno de Licenciamento de Marca
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Licenciante / Detentor da Marca
                </label>
                <input
                  type="text"
                  value={licensor}
                  onChange={(e) => setLicensor(e.target.value)}
                  placeholder="Ex: Peanuts Worldwide LLC"
                  className="w-full px-2.5 py-1.5 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Nº do Contrato de Licença
                </label>
                <input
                  type="text"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  placeholder="Ex: LIC-PEA-BR-2026/04"
                  className="w-full px-2.5 py-1.5 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Validade da Licença
                </label>
                <input
                  type="text"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  placeholder="Ex: 31 dez, 27"
                  className="w-full px-2.5 py-1.5 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* SEÇÃO 3: IMAGENS E VÍDEO */}
      <Card padding="md" className="space-y-4">
        <div className="pb-3 border-b border-[#D6D3CC]">
          <h3 className="text-sm font-medium text-[#272727]">
            3. Imagens e Vídeo
          </h3>
          <p className="text-[11px] text-[#6B6A64]">
            Adicione até 50 fotos editoriais em JPG/PNG e link de demonstração em vídeo
          </p>
        </div>

        {/* Galeria de Fotos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {images.map((imgUrl, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-[6px] overflow-hidden bg-[#EEEDE8] border border-[#D6D3CC] group"
            >
              <img
                src={imgUrl}
                alt={`Imagem ${idx + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-1 right-1 p-1 rounded-[4px] bg-black/60 text-white hover:bg-black transition-colors"
                title="Remover foto"
              >
                <X className="w-3 h-3" />
              </button>
              {idx === 0 && (
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-[3px] bg-[#E4E2DD] text-[9px] font-medium text-[#272727] border border-[#D6D3CC]">
                  Principal
                </div>
              )}
            </div>
          ))}

          {/* Campo para adicionar nova URL */}
          <div className="col-span-2 sm:col-span-2 flex flex-col justify-between p-3 rounded-[6px] bg-[#EEEDE8] border border-dashed border-[#D6D3CC]">
            <span className="text-[11px] text-[#6B6A64]">Adicionar imagem via URL</span>
            <div className="flex gap-1.5 mt-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-2.5 py-1.5 text-xs bg-[#F4F3EF] border border-[#D6D3CC] rounded-[4px] text-[#272727] focus:outline-none focus:border-[#004AAD]"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-3 py-1.5 rounded-[4px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884]"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Link de Vídeo YouTube */}
        <div className="pt-2 border-t border-[#D6D3CC]">
          <label className="block text-xs font-medium text-[#272727] mb-1">
            Link do Vídeo Demonstrativo (YouTube)
          </label>
          <div className="relative">
            <Video className="w-4 h-4 text-[#9B998F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-[#272727] focus:outline-none focus:border-[#004AAD]"
            />
          </div>
        </div>
      </Card>

      {/* SEÇÃO 4: PREÇOS & SIMULADOR GROSS-UP */}
      <Card padding="md" className="space-y-4">
        <div className="pb-3 border-b border-[#D6D3CC]">
          <h3 className="text-sm font-medium text-[#272727]">
            4. Preços & Precificação Assistida (Markup Gross-up)
          </h3>
          <p className="text-[11px] text-[#6B6A64]">
            Preço de venda final, custo do produto e cálculo inteligente de margem
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Custo Unitário (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] font-medium tabular-nums focus:outline-none focus:border-[#004AAD]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Preço de Venda (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="0"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] font-medium tabular-nums focus:outline-none focus:border-[#004AAD]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Preço Promocional (R$ - opcional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={promotionalPrice || ""}
              onChange={(e) =>
                setPromotionalPrice(e.target.value ? parseFloat(e.target.value) : undefined)
              }
              className="w-full px-3 py-2 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] font-medium tabular-nums focus:outline-none focus:border-[#004AAD]"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-[#272727]">
          <input
            type="checkbox"
            checked={priceOnDemand}
            onChange={(e) => setPriceOnDemand(e.target.checked)}
            className="rounded text-[#004AAD]"
          />
          <span>Preço sob consulta (oculta valor numérico no catálogo)</span>
        </label>

        {/* Embutir Calculadora de Markup Gross-up */}
        <div className="pt-2">
          <PricingCalculator
            initialCost={costPrice}
            initialPrice={price}
            onApplyPrice={(suggested, newCost) => {
              setPrice(suggested);
              setCostPrice(newCost);
            }}
          />
        </div>
      </Card>

      {/* SEÇÃO 5: EMBALAGEM (FRETE) */}
      <Card padding="md" className="space-y-4">
        <div className="pb-3 border-b border-[#D6D3CC]">
          <h3 className="text-sm font-medium text-[#272727]">
            5. Embalagem & Cálculo de Frete
          </h3>
          <p className="text-[11px] text-[#6B6A64]">
            Dimensões do pacote rígido com laço para cotação precisa nos Correios e transportadoras
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Peso (kg)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={weightKg}
              onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] font-medium tabular-nums focus:outline-none focus:border-[#004AAD]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Altura (cm)
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={heightCm}
              onChange={(e) => setHeightCm(parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] font-medium tabular-nums focus:outline-none focus:border-[#004AAD]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Largura (cm)
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={widthCm}
              onChange={(e) => setWidthCm(parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] font-medium tabular-nums focus:outline-none focus:border-[#004AAD]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Profundidade (cm)
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={depthCm}
              onChange={(e) => setDepthCm(parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] font-medium tabular-nums focus:outline-none focus:border-[#004AAD]"
            />
          </div>
        </div>
      </Card>

      {/* SEÇÃO 6: CÓDIGOS & ESTOQUE */}
      <Card padding="md" className="space-y-4">
        <div className="pb-3 border-b border-[#D6D3CC]">
          <h3 className="text-sm font-medium text-[#272727]">
            6. Códigos, SKU & Controle de Estoque
          </h3>
          <p className="text-[11px] text-[#6B6A64]">
            Identificação única, códigos de barras e regras de esgotamento
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-[#6B6A64]">SKU *</label>
              <button
                type="button"
                onClick={() =>
                  setSku(`GLOS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`)
                }
                className="text-[10px] text-[#004AAD] hover:underline"
              >
                Gerar automático
              </button>
            </div>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] font-mono text-[#272727] focus:outline-none focus:border-[#004AAD]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              GTIN / EAN (Código de barras)
            </label>
            <input
              type="text"
              value={gtin}
              onChange={(e) => setGtin(e.target.value)}
              placeholder="7891234567890"
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] font-mono text-[#272727] focus:outline-none focus:border-[#004AAD]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              NCM (Sem pontos)
            </label>
            <input
              type="text"
              value={ncm}
              onChange={(e) => setNcm(e.target.value.replace(/\D/g, ""))}
              placeholder="69111010"
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] font-mono text-[#272727] focus:outline-none focus:border-[#004AAD]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#D6D3CC] text-xs">
          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Quantidade em Estoque
            </label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(parseInt(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] font-medium tabular-nums focus:outline-none focus:border-[#004AAD]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Disponibilidade
            </label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
            >
              <option value="pronta_entrega">Pronta Entrega</option>
              <option value="sob_encomenda">Sob Encomenda (Produção artesanal)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Quando acabar o estoque
            </label>
            <select
              value={outOfStockAction}
              onChange={(e) => setOutOfStockAction(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
            >
              <option value="indisponivel">Tornar indisponível</option>
              <option value="continuar_vendendo">Continuar vendendo</option>
            </select>
          </div>
        </div>
      </Card>

      {/* SEÇÃO 7: INFORMAÇÕES FISCAIS */}
      <Card padding="md" className="space-y-4">
        <div className="pb-3 border-b border-[#D6D3CC]">
          <h3 className="text-sm font-medium text-[#272727]">
            7. Informações Fiscais
          </h3>
          <p className="text-[11px] text-[#6B6A64]">
            Dados para emissão de Nota Fiscal Eletrônica (NF-e)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Tipo de Produção
            </label>
            <select
              value={productionType}
              onChange={(e) => setProductionType(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
            >
              <option value="fabricacao_propria">Fabricação Própria (Atelier / Personalização)</option>
              <option value="revenda">Revenda de Terceiros</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Origem da Mercadoria
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
            >
              <option value="0 - Nacional">0 - Nacional</option>
              <option value="1 - Estrangeira (Importação direta)">1 - Estrangeira (Importação direta)</option>
              <option value="2 - Estrangeira (Adquirida no mercado interno)">2 - Estrangeira (Adquirida no mercado interno)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* SEÇÃO 8: ORGANIZE NA LOJA */}
      <Card padding="md" className="space-y-4">
        <div className="pb-3 border-b border-[#D6D3CC]">
          <h3 className="text-sm font-medium text-[#272727]">
            8. Organize na Loja (Categoria, Marca, Fornecedor, Coleção)
          </h3>
          <p className="text-[11px] text-[#6B6A64]">
            Estruture onde o produto aparece no catálogo da Glos e qual parceiro fornece o item
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Categoria Principal *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome || c.name || c.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Marca / Linha *
            </label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Fornecedor / Origem *
            </label>
            <select
              value={fornecedorId}
              onChange={(e) => setFornecedorId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
            >
              {suppliersList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nomeFantasia || s.razaoSocial} {s.isDefaultFabricacaoPropria ? "(Padrão Glos)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Coleção Temática
            </label>
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="Ex: Linha Afeto & Memórias"
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
            />
          </div>
        </div>
      </Card>

      {/* SEÇÃO 9: SEO COM PREVIEW GOOGLE */}
      <Card padding="md" className="space-y-4">
        <div className="pb-3 border-b border-[#D6D3CC]">
          <h3 className="text-sm font-medium text-[#272727]">
            9. Otimização para Buscadores (SEO)
          </h3>
          <p className="text-[11px] text-[#6B6A64]">
            Como seu produto de presente aparecerá nas pesquisas do Google
          </p>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Tag Title
            </label>
            <input
              type="text"
              value={tagTitle}
              onChange={(e) => setTagTitle(e.target.value)}
              placeholder="Kit Mimo Afetivo Personalizado | Glos Presentes"
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              Meta Description
            </label>
            <textarea
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Presenteie com afeto: kit com caneca personalizada, foto e dedicatória..."
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#6B6A64] mb-1">
              URL Amigável (Slug)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] font-mono text-[#272727] focus:outline-none focus:border-[#004AAD]"
            />
          </div>

          {/* Google Search Snippet Preview */}
          <div className="p-3.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#9B998F] block">
              Prévia de exibição no Google
            </span>
            <div className="text-[11px] text-[#0F7A4F] truncate font-mono">
              https://glos.com.br/produto/{slug || "seu-produto"}
            </div>
            <div className="text-sm font-medium text-[#004AAD] hover:underline cursor-pointer line-clamp-1">
              {tagTitle || `${name || "Nome do Produto"} | Glos Presentes`}
            </div>
            <p className="text-xs text-[#6B6A64] line-clamp-2">
              {metaDescription ||
                shortDescription ||
                "Compre presentes criativos e personalizados com carinho e afeto na Glos Presentes."}
            </p>
          </div>
        </div>
      </Card>

      {/* Barra de Ações Fixa Inferior */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#E4E2DD]/95 backdrop-blur-xs border-t border-[#D6D3CC] p-4 flex items-center justify-between">
        <div className="text-xs text-[#6B6A64]">
          Status: <strong className="text-[#272727]">{isVisible ? "Ativo" : "Inativo"}</strong> · Natureza:{" "}
          <strong className="text-[#004AAD] capitalize">{productType}</strong>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-xs font-medium text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Produto</span>
          </button>
        </div>
      </div>
    </form>
  );
};
