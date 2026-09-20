import { loadAuthUser } from "@/lib/screening/storage";

export type CarePhoto = {
  id: string;
  visitIndex?: number;
  createdAt: string;
  dataUrl: string;
  fileName: string;
};

export const PHOTOS_KEY = "follicad_care_photos";
export const MAX_PHOTOS = 8;
export const MAX_SOURCE_BYTES = 6 * 1024 * 1024;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function photosKeyForEmail(email: string) {
  return `${PHOTOS_KEY}:${normalizeEmail(email)}`;
}

function currentPhotosKey() {
  const auth = loadAuthUser();
  if (!auth?.email) return null;
  return photosKeyForEmail(auth.email);
}

function clearLegacyPhotos() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PHOTOS_KEY);
}

export function loadPhotos(): CarePhoto[] {
  if (typeof window === "undefined") return [];
  clearLegacyPhotos();
  const key = currentPhotosKey();
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CarePhoto[]) : [];
  } catch {
    return [];
  }
}

export function savePhotos(photos: CarePhoto[]) {
  if (typeof window === "undefined") return;
  const key = currentPhotosKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(photos));
}

export function addPhoto(photo: CarePhoto) {
  const current = loadPhotos();
  if (current.length >= MAX_PHOTOS) {
    throw new Error(`Můžete uložit nejvýše ${MAX_PHOTOS} fotografií.`);
  }
  const next = [...current, photo];
  savePhotos(next);
  return next;
}

export function replacePhoto(id: string, patch: Partial<CarePhoto>) {
  const next = loadPhotos().map((p) => (p.id === id ? { ...p, ...patch } : p));
  savePhotos(next);
  return next;
}

export function deletePhoto(id: string) {
  const next = loadPhotos().filter((p) => p.id !== id);
  savePhotos(next);
  return next;
}

export function clearPhotos() {
  if (typeof window === "undefined") return;
  clearLegacyPhotos();
  const key = currentPhotosKey();
  if (key) localStorage.removeItem(key);
}

export function clearPhotosForEmail(email: string) {
  if (typeof window === "undefined") return;
  clearLegacyPhotos();
  localStorage.removeItem(photosKeyForEmail(email));
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Soubor se nepodařilo načíst."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Obrázek se nepodařilo zpracovat."));
    img.src = src;
  });
}

/** Compress to JPEG data URL for local demo storage. */
export async function preparePhotoFile(file: File): Promise<{
  dataUrl: string;
  fileName: string;
}> {
  const type = file.type.toLowerCase();
  if (!type.startsWith("image/")) {
    throw new Error("Nahrajte obrázek (JPG, PNG, WEBP).");
  }
  if (type.includes("heic") || type.includes("heif")) {
    throw new Error(
      "Formát HEIC zatím nepodporujeme. Nahrajte JPG nebo PNG."
    );
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Soubor je příliš velký (max. 6 MB).");
  }

  const original = await readFileAsDataUrl(file);
  const img = await loadImage(original);
  const maxSide = 1200;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Nelze zpracovat obrázek.");
  ctx.drawImage(img, 0, 0, width, height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
  return { dataUrl, fileName: file.name || "fotografie.jpg" };
}
