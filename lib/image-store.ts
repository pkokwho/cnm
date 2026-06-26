"use client";

// Image generation history storage
// localStorage: metadata (prompt, size, timestamp, cached flag)
// IndexedDB: image blobs (for permanent access, since Agnes URLs expire ~60 min)

const DB_NAME = "evidencebox";
const DB_VERSION = 2; // Upgraded from 1 to add "images" store
const STORE_IMAGES = "images";

// ---- Types ----
export interface GeneratedImage {
  id: string;
  prompt: string;
  size: string;
  url: string; // Original URL (may expire after ~60 min)
  timestamp: number;
  cached: boolean; // Whether blob is stored in IndexedDB
}

// ---- IndexedDB ----
let dbPromise: Promise<IDBDatabase> | null = null;

function getImageDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // Create images store if it doesn't exist
      // Existing "files" store is preserved automatically
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function idbGetImage(id: string): Promise<ArrayBuffer | null> {
  const db = await getImageDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, "readonly");
    const req = tx.objectStore(STORE_IMAGES).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSetImage(id: string, buffer: ArrayBuffer): Promise<void> {
  const db = await getImageDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, "readwrite");
    tx.objectStore(STORE_IMAGES).put(buffer, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDeleteImage(id: string): Promise<void> {
  const db = await getImageDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, "readwrite");
    tx.objectStore(STORE_IMAGES).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---- localStorage for metadata ----
const IMAGES_KEY = "evidencebox:generated-images";

function loadImages(): Record<string, GeneratedImage> {
  try {
    return JSON.parse(localStorage.getItem(IMAGES_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveImages(images: Record<string, GeneratedImage>) {
  localStorage.setItem(IMAGES_KEY, JSON.stringify(images));
}

// ---- Public API ----

export function getImages(): GeneratedImage[] {
  return Object.values(loadImages()).sort((a, b) => b.timestamp - a.timestamp);
}

export async function saveImage(
  image: GeneratedImage,
  blob?: ArrayBuffer
): Promise<void> {
  const images = loadImages();

  if (blob) {
    try {
      await idbSetImage(image.id, blob);
      image.cached = true;
    } catch (e) {
      console.error("Failed to cache image blob:", e);
      image.cached = false;
    }
  }

  images[image.id] = image;
  saveImages(images);
}

export async function getImageBlobUrl(id: string): Promise<string | null> {
  const blob = await idbGetImage(id);
  if (!blob) return null;
  return URL.createObjectURL(new Blob([blob], { type: "image/png" }));
}

export async function deleteImage(id: string): Promise<void> {
  const images = loadImages();
  delete images[id];
  saveImages(images);
  await idbDeleteImage(id).catch(() => {});
}

export async function fetchAndCacheImage(
  url: string,
  id: string
): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buffer = await res.arrayBuffer();
    await idbSetImage(id, buffer);

    // Update cached flag in metadata
    const images = loadImages();
    if (images[id]) {
      images[id].cached = true;
      saveImages(images);
    }
    return true;
  } catch (e) {
    console.error("Failed to fetch and cache image:", e);
    return false;
  }
}

// ---- Client-side rate limiting (first line of defense) ----
const LAST_GEN_KEY = "evidencebox:last-image-gen";
const IMAGE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export function canGenerateImage(): { allowed: boolean; retryAfterMs: number } {
  const last = localStorage.getItem(LAST_GEN_KEY);
  if (!last) return { allowed: true, retryAfterMs: 0 };

  const lastTs = parseInt(last, 10);
  if (isNaN(lastTs)) return { allowed: true, retryAfterMs: 0 };

  const elapsed = Date.now() - lastTs;
  if (elapsed >= IMAGE_WINDOW_MS) return { allowed: true, retryAfterMs: 0 };

  return {
    allowed: false,
    retryAfterMs: IMAGE_WINDOW_MS - elapsed,
  };
}

export function recordClientImageGen(): void {
  localStorage.setItem(LAST_GEN_KEY, Date.now().toString());
}

export function generateImageId(): string {
  return crypto.randomUUID();
}
