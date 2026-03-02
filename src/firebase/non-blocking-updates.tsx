'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

type JsonObject = Record<string, any>;

function splitPath(path: string) {
  return path.split('/').filter(Boolean);
}

function isTopLevelCollection(path: string, collectionName: string) {
  return path === collectionName;
}

function getTopLevelDocumentId(path: string, collectionName: string) {
  const parts = splitPath(path);
  if (parts.length !== 2 || parts[0] !== collectionName) return null;
  return parts[1];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function toFiniteNumber(value: unknown, fallback: number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeLegacyProductPayload(raw: JsonObject) {
  const name = String(raw?.name ?? '').trim() || 'Untitled Product';
  const slug = String(raw?.slug ?? '').trim() || slugify(name);
  const description = String(raw?.description ?? '').trim() || 'No description provided.';
  const category = String(raw?.category ?? '').trim() || 'Uncategorized';
  const styleRaw = typeof raw?.style === 'string' ? raw.style.trim() : '';
  const style = styleRaw || null;

  const imageFromLegacyFields = ['imageUrl1', 'imageUrl2', 'imageUrl3', 'imageUrl4']
    .map((fieldName) => raw?.[fieldName])
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((url) => ({
      url: url.trim(),
      alt: name,
      hint: 'product image',
    }));

  const images = Array.isArray(raw?.images)
    ? raw.images
        .filter((image: any) => image && typeof image.url === 'string' && image.url.trim().length > 0)
        .map((image: any) => ({
          url: image.url.trim(),
          alt: typeof image.alt === 'string' && image.alt.trim().length > 0 ? image.alt.trim() : name,
          hint: typeof image.hint === 'string' && image.hint.trim().length > 0 ? image.hint.trim() : 'product image',
          colorName:
            typeof image.colorName === 'string' && image.colorName.trim().length > 0
              ? image.colorName.trim()
              : undefined,
        }))
    : imageFromLegacyFields;

  const availableColors = Array.isArray(raw?.availableColors)
    ? raw.availableColors
        .filter(
          (color: any) =>
            color &&
            typeof color.name === 'string' &&
            color.name.trim().length > 0 &&
            typeof color.hex === 'string' &&
            color.hex.trim().length > 0
        )
        .map((color: any) => ({
          name: color.name.trim(),
          hex: color.hex.trim(),
        }))
    : [];

  const sizes = Array.isArray(raw?.sizes)
    ? raw.sizes.filter((size: any) => typeof size === 'string' && size.trim().length > 0).map((size: string) => size.trim())
    : [];

  return {
    name,
    slug,
    description,
    category,
    style,
    price: Math.max(0, toFiniteNumber(raw?.price, 0)),
    originalPrice: toOptionalNumber(raw?.originalPrice),
    images,
    availableColors,
    sizes,
    isFeatured: !!raw?.isFeatured,
  };
}

async function requestJson(url: string, method: 'POST' | 'PATCH' | 'DELETE', payload: JsonObject) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (responseBody && typeof responseBody.message === 'string' && responseBody.message) || `${method} ${url} failed`;
    throw new Error(message);
  }

  return responseBody;
}

function reportCompatibilityWriteError(operation: 'create' | 'update' | 'delete' | 'write', path: string, error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown write error';
  console.warn(`Database compatibility ${operation} failed at '${path}': ${message}`);
}

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write', // or 'create'/'update' based on options
        requestResourceData: data,
      })
    )
  })
  // Execution continues immediately
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  if (isTopLevelCollection(colRef.path, 'products')) {
    const payload = normalizeLegacyProductPayload(data || {});
    return requestJson('/api/admin/products', 'POST', payload).catch((error) => {
      reportCompatibilityWriteError('create', colRef.path, error);
    });
  }

  if (isTopLevelCollection(colRef.path, 'categories') || isTopLevelCollection(colRef.path, 'styles')) {
    const type = isTopLevelCollection(colRef.path, 'categories') ? 'category' : 'style';
    const name = String(data?.name ?? '').trim();
    return requestJson('/api/admin/catalog', 'POST', { type, name }).catch((error) => {
      reportCompatibilityWriteError('create', colRef.path, error);
    });
  }

  const promise = addDoc(colRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  const productId = getTopLevelDocumentId(docRef.path, 'products');
  if (productId) {
    const payload = normalizeLegacyProductPayload(data || {});
    return requestJson('/api/admin/products', 'PATCH', { id: productId, ...payload }).catch((error) => {
      reportCompatibilityWriteError('update', docRef.path, error);
    });
  }

  const orderId = getTopLevelDocumentId(docRef.path, 'orders');
  if (orderId && typeof data?.status === 'string') {
    return requestJson('/api/admin/orders', 'PATCH', { id: orderId, status: data.status }).catch((error) => {
      reportCompatibilityWriteError('update', docRef.path, error);
    });
  }

  updateDoc(docRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      )
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  const productId = getTopLevelDocumentId(docRef.path, 'products');
  if (productId) {
    return requestJson('/api/admin/products', 'DELETE', { id: productId }).catch((error) => {
      reportCompatibilityWriteError('delete', docRef.path, error);
    });
  }

  deleteDoc(docRef)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}
