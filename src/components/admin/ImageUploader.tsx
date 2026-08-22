import React, { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Check, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  helperText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 6,
  label = "Imagens do Produto",
  helperText = "Faça upload de fotos direto do seu computador/celular ou cole URLs.",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlField, setShowUrlField] = useState(false);

  // Compress & convert file to Base64 Data URL (optimized for instant storage and preview)
  const processFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // If SVG or small format
      if (!file.type.startsWith("image/")) {
        reject(new Error("Formato inválido. Selecione um arquivo de imagem (JPG, PNG, WEBP)."));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Resize & compress onto canvas to prevent oversized base64 strings
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1200; // max 1200px

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            resolve(dataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);
    try {
      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) return;

      const filesToProcess = Array.from(fileList).slice(0, remainingSlots);
      const newUrls: string[] = [];

      for (const file of filesToProcess) {
        const base64 = await processFile(file);
        newUrls.push(base64);
      }

      onChange([...images, ...newUrls]);
    } catch (err) {
      console.error("Erro ao processar imagens:", err);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    if (images.length >= maxImages) return;
    onChange([...images, urlInput.trim()]);
    setUrlInput("");
    setShowUrlField(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-stone-900">{label}</label>
          <p className="text-[11px] text-stone-500">{helperText}</p>
        </div>
        <span className="text-[11px] font-semibold text-stone-500">
          {images.length} / {maxImages} fotos
        </span>
      </div>

      {/* DROPZONE / UPLOAD BOX */}
      {images.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-amber-500 bg-amber-50/50 scale-[1.01]"
              : "border-stone-200 hover:border-amber-400 bg-stone-50/80 hover:bg-stone-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {isProcessing ? (
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
              <span className="text-xs font-semibold text-stone-700">Otimizando e carregando foto...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-stone-200 flex items-center justify-center text-amber-600">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-stone-900 hover:underline">Clique para selecionar do seu dispositivo</span>
                <span className="text-stone-500"> ou arraste e solte as imagens aqui</span>
              </div>
              <p className="text-[10px] text-stone-400">PNG, JPG, WEBP de alta qualidade (Até 5MB cada)</p>
            </div>
          )}
        </div>
      )}

      {/* OPTIONAL URL TOGGLE */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setShowUrlField(!showUrlField)}
          className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 underline"
        >
          {showUrlField ? "Fechar inserção por link URL" : "+ Ou adicionar foto via link/URL da Web"}
        </button>
      </div>

      {showUrlField && (
        <div className="flex items-center gap-2 p-2 bg-stone-100/70 rounded-xl border border-stone-200">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://exemplo.com/imagem.jpg"
            className="flex-1 text-xs bg-white border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-900"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3 py-2 bg-stone-950 text-white rounded-lg text-xs font-bold hover:bg-stone-800 shrink-0"
          >
            Adicionar URL
          </button>
        </div>
      )}

      {/* THUMBNAIL PREVIEW LIST */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
          {images.map((img, index) => (
            <div
              key={index}
              className="group relative aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-xs"
            >
              <img
                src={img}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {index === 0 && (
                <span className="absolute bottom-1 left-1 bg-stone-950/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                  Capa
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(index);
                }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 hover:scale-110 transition-all shadow-md"
                title="Remover imagem"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
