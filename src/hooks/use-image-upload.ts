'use client';

import { useCallback, useState } from 'react';

interface UploadResult {
  url: string;
}

interface UseImageUploadReturn {
  upload: (file: File) => Promise<UploadResult>;
  isUploading: boolean;
  error: string | null;
  reset: () => void;
}

export function useImageUpload(): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'アップロードに失敗しました');
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'アップロードに失敗しました';
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { upload, isUploading, error, reset };
}
