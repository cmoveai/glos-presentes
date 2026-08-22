import { OccasionInfo } from "../types";

export const OCCASIONS: OccasionInfo[] = [
  {
    id: "aniversario",
    name: "Aniversário",
    subtitle: "Presentes memoráveis para celebrar mais um ano de vida",
    tag: "aniversario",
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "casamento",
    name: "Casamento",
    subtitle: "Itens nobres e duradouros para celebrar o amor",
    tag: "casamento",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "casa-nova",
    name: "Casa Nova / Open House",
    subtitle: "Utilitários de bom gosto para dar boas-vindas ao novo lar",
    tag: "casa-nova",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "dia-das-maes",
    name: "Dia das Mães",
    subtitle: "Carinho, aconchego e bem-estar em forma de presente",
    tag: "dia-das-maes",
    image: "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "dia-dos-pais",
    name: "Dia dos Pais",
    subtitle: "Tecnologia, café especial, bar e utilitários modernos",
    tag: "dia-dos-pais",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "dia-dos-namorados",
    name: "Dia dos Namorados",
    subtitle: "Momentos a dois, aromas envolventes e kits românticos",
    tag: "dia-dos-namorados",
    image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "natal",
    name: "Natal & Fim de Ano",
    subtitle: "A magia de presentear e encantar toda a família",
    tag: "natal",
    image: "https://images.unsplash.com/photo-1543258103-a62bdc069871?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "amigo-secreto",
    name: "Amigo Secreto",
    subtitle: "Opções certeiras para acertar em cheio no presente",
    tag: "amigo-secreto",
    image: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "agradecimento",
    name: "Agradecimento",
    subtitle: "Demonstre gratidão com gestos e peças sofisticadas",
    tag: "agradecimento",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600&auto=format&fit=crop",
  },
];

export const GIFT_SHORTCUTS = [
  { id: "para-ela", label: "Para Ela", filterType: "recipient", filterValue: "para-ela", iconName: "Sparkles" },
  { id: "para-ele", label: "Para Ele", filterType: "recipient", filterValue: "para-ele", iconName: "User" },
  { id: "para-casa", label: "Para Casa", filterType: "recipient", filterValue: "para-casa", iconName: "Home" },
  { id: "para-cozinhar", label: "Para Quem Ama Cozinhar", filterType: "recipient", filterValue: "para-cozinhar", iconName: "UtensilsCrossed" },
  { id: "para-tecnologia", label: "Para Quem Ama Tecnologia", filterType: "recipient", filterValue: "para-tecnologia", iconName: "Cpu" },
  { id: "ate-50", label: "Até R$ 50", filterType: "price", maxPrice: 50, iconName: "Tag" },
  { id: "ate-100", label: "Até R$ 100", filterType: "price", maxPrice: 100, iconName: "Coins" },
  { id: "premium", label: "Presentes Premium", filterType: "price", minPrice: 150, iconName: "Crown" },
];
