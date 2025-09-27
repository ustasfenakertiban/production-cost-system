
"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description?: string;
  imagePath?: string;
}

interface ProductDialogProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export function ProductDialog({ product, open, onClose }: ProductDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
      });
      
      // Load current image if exists
      if (product.imagePath) {
        loadCurrentImage(product.id);
      } else {
        setCurrentImageUrl(null);
      }
    } else {
      setFormData({
        name: "",
        description: "",
      });
      setCurrentImageUrl(null);
    }
    
    // Reset file selection
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [product]);

  const loadCurrentImage = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/image`);
      if (response.ok) {
        const data = await response.json();
        setCurrentImageUrl(data.url);
      }
    } catch (error) {
      console.error('Ошибка загрузки текущего изображения:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Ошибка",
          description: "Размер файла не должен превышать 5MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ошибка",
          description: "Выберите файл изображения",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      
      if (selectedFile) {
        formDataToSend.append('image', selectedFile);
      }

      const url = product ? `/api/products/${product.id}` : '/api/products';
      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: product ? "Товар обновлен" : "Товар добавлен",
        });
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сохранения');
      }
    } catch (error: any) {
      console.error('Ошибка сохранения товара:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось сохранить товар",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Редактировать товар' : 'Добавить товар'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Наименование *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Введите название товара"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Описание товара"
              rows={3}
            />
          </div>

          <div>
            <Label>Изображение товара</Label>
            
            {/* Current or preview image */}
            {(previewUrl || currentImageUrl) && (
              <div className="mt-2 relative">
                <div className="aspect-video bg-gray-100 rounded-lg relative overflow-hidden">
                  <Image
                    src={previewUrl || currentImageUrl || ""}
                    alt="Предварительный просмотр"
                    fill
                    className="object-cover"
                  />
                </div>
                {previewUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={removeFile}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Удалить новое изображение
                  </Button>
                )}
              </div>
            )}

            {/* File input */}
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {currentImageUrl && !previewUrl 
                  ? 'Заменить изображение' 
                  : 'Выбрать изображение'
                }
              </Button>
            </div>

            <p className="text-sm text-gray-500 mt-1">
              Максимальный размер: 5MB. Поддерживаемые форматы: JPG, PNG, WEBP
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
