import type { FirebaseApp } from 'firebase/app';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { SUPABASE_STORAGE_BUCKET } from '@/lib/supabase/config';

export interface FirebaseStorage {
  app?: FirebaseApp;
  bucket: string;
}

export interface StorageReference {
  storage: FirebaseStorage;
  fullPath: string;
}

export interface UploadTaskSnapshot {
  ref: StorageReference;
  bytesTransferred: number;
  totalBytes: number;
  state: 'running' | 'success' | 'error';
}

type UploadProgressCallback = (snapshot: UploadTaskSnapshot) => void;
type UploadErrorCallback = (error: Error) => void;
type UploadCompleteCallback = () => void;
type UploadData = Blob | ArrayBuffer | ArrayBufferView;

interface UploadObserver {
  progress?: UploadProgressCallback;
  error?: UploadErrorCallback;
  complete?: UploadCompleteCallback;
}

function toByteLength(file: UploadData) {
  if (file instanceof Blob) {
    return file.size;
  }

  if (file instanceof ArrayBuffer) {
    return file.byteLength;
  }

  return file.byteLength;
}

class SupabaseUploadTask {
  public snapshot: UploadTaskSnapshot;

  private observers: UploadObserver[] = [];
  private failure: Error | null = null;

  constructor(private targetRef: StorageReference, private file: UploadData) {
    this.snapshot = {
      ref: targetRef,
      bytesTransferred: 0,
      totalBytes: toByteLength(file),
      state: 'running',
    };

    this.startUpload();
  }

  private notifyProgress() {
    for (const observer of this.observers) {
      observer.progress?.(this.snapshot);
    }
  }

  private notifyError(error: Error) {
    for (const observer of this.observers) {
      observer.error?.(error);
    }
  }

  private notifyComplete() {
    for (const observer of this.observers) {
      observer.complete?.();
    }
  }

  private async startUpload() {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.storage
        .from(this.targetRef.storage.bucket)
        .upload(this.targetRef.fullPath, this.file, { upsert: true });

      if (error) {
        throw error;
      }

      this.snapshot = {
        ...this.snapshot,
        bytesTransferred: this.snapshot.totalBytes,
        state: 'success',
      };

      this.notifyProgress();
      this.notifyComplete();
    } catch (error) {
      this.snapshot = {
        ...this.snapshot,
        state: 'error',
      };

      this.failure = error instanceof Error ? error : new Error(String(error));
      this.notifyError(this.failure);
    }
  }

  on(
    _event: 'state_changed',
    nextOrObserver?: UploadProgressCallback,
    error?: UploadErrorCallback,
    complete?: UploadCompleteCallback
  ) {
    const observer: UploadObserver = {
      progress: nextOrObserver,
      error,
      complete,
    };

    this.observers.push(observer);

    if (this.snapshot.state === 'success') {
      observer.progress?.(this.snapshot);
      observer.complete?.();
    }

    if (this.snapshot.state === 'error' && this.failure) {
      observer.error?.(this.failure);
    }

    return () => {
      this.observers = this.observers.filter((candidate) => candidate !== observer);
    };
  }
}

export function getStorage(app?: FirebaseApp): FirebaseStorage {
  return {
    app,
    bucket: SUPABASE_STORAGE_BUCKET,
  };
}

export function ref(storage: FirebaseStorage, path: string): StorageReference {
  return {
    storage,
    fullPath: path.replace(/^\/+/, ''),
  };
}

export function uploadBytesResumable(reference: StorageReference, file: UploadData) {
  return new SupabaseUploadTask(reference, file);
}

export async function getDownloadURL(reference: StorageReference) {
  const supabase = getSupabaseBrowserClient();
  const { data } = supabase.storage.from(reference.storage.bucket).getPublicUrl(reference.fullPath);

  return data.publicUrl;
}
