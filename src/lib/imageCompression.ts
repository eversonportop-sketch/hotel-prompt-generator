// ─────────────────────────────────────────────────────────────────────────────
// Compressão de imagem no navegador, antes do upload para o Supabase Storage.
//
// Motivo: fotos tiradas direto do celular costumam vir com 3-8MB (às vezes mais),
// em resolução muito maior do que o necessário para exibição no site. Como cada
// visita a uma página com essa imagem gera egress (banda) no Supabase, subir os
// arquivos sem tratamento nenhum é o principal fator que estoura o limite de
// egress do plano. Esta função redimensiona e recomprime a imagem no próprio
// navegador do usuário, antes de enviar, sem precisar de nenhuma biblioteca extra.
//
// Formato de saída: WebP (menor que JPEG na mesma qualidade visual, suportado
// por todos os navegadores relevantes hoje). Se o navegador não conseguir
// gerar WebP por algum motivo, cai automaticamente para JPEG.
// ─────────────────────────────────────────────────────────────────────────────

interface CompressOptions {
  /** Maior dimensão (largura ou altura) permitida, em pixels. Não amplia imagens menores. */
  maxDimension?: number;
  /** Qualidade de 0 a 1. */
  quality?: number;
  /** Abaixo desse tamanho (bytes), não vale a pena recomprimir. */
  skipBelowBytes?: number;
}

const DEFAULTS: Required<CompressOptions> = {
  maxDimension: 1920,
  quality: 0.82,
  skipBelowBytes: 400 * 1024, // 400 KB
};

/**
 * Recebe um File de imagem e devolve uma versão redimensionada/recomprimida em WebP
 * (ou JPEG, se o navegador não suportar geração de WebP).
 * Vídeos, GIFs (para não perder animação) e SVGs passam direto, sem alteração.
 * Se a compressão falhar por qualquer motivo, devolve o arquivo original (nunca bloqueia o upload).
 */
export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const { maxDimension, quality, skipBelowBytes } = { ...DEFAULTS, ...options };

  const isRasterPhoto = /^image\/(jpeg|jpg|png|webp)$/i.test(file.type);
  if (!isRasterPhoto) return file; // vídeo, gif, svg, etc → não mexe
  if (file.size <= skipBelowBytes) return file; // já é pequena, não vale recomprimir

  try {
    const bitmap = await loadImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height, maxDimension);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    // Tenta WebP primeiro (mais leve). Alguns navegadores, se não suportarem o formato
    // pedido, devolvem silenciosamente um PNG em vez de gerar erro — por isso conferimos
    // blob.type e, se não for webp de verdade, caímos para JPEG.
    let blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    let outExt = "webp";
    let outType = "image/webp";
    if (!blob || blob.type !== "image/webp") {
      blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      outExt = "jpg";
      outType = "image/jpeg";
    }
    if (!blob) return file;

    // Se por algum motivo a versão "comprimida" ficou maior que a original, mantém a original.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + "." + outExt;
    return new File([blob], newName, { type: outType, lastModified: Date.now() });
  } catch {
    return file; // qualquer erro na compressão: segue com o arquivo original, não trava o upload
  }
}

function loadImageBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file);
  }
  // fallback para navegadores sem createImageBitmap
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function fitWithin(width: number, height: number, maxDimension: number) {
  if (width <= maxDimension && height <= maxDimension) return { width, height };
  const scale = width > height ? maxDimension / width : maxDimension / height;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
