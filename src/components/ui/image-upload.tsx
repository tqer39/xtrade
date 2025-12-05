'use client';

import { Loader2, Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useImageUpload } from '@/hooks/use-image-upload';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const { upload, isUploading, error } = useImageUpload();
  const [preview, setPreview] = useState<string | undefined>(value);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // プレビュー表示
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      try {
        const result = await upload(file);
        onChange(result.url);
      } catch {
        setPreview(value); // エラー時は元に戻す
      }
    },
    [upload, onChange, value]
  );

  const handleRemove = useCallback(() => {
    setPreview(undefined);
    onChange(undefined);
  }, [onChange]);

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative w-24 h-24">
          <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="hidden"
          />
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-1">画像を選択</span>
            </>
          )}
        </label>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
