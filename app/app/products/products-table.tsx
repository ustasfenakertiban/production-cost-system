
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Package, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductDialog } from "./product-dialog";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description?: string;
  imagePath?: string;
  createdAt: string;
  updatedAt: string;
}

export function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        // Load image URLs for products that have images
        loadImageUrls(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список товаров",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadImageUrls = async (products: Product[]) => {
    const urls: Record<string, string> = {};
    
    for (const product of products) {
      if (product.imagePath) {
        try {
          const response = await fetch(`/api/products/${product.id}/image`);
          if (response.ok) {
            const data = await response.json();
            urls[product.id] = data.url;
          }
        } catch (error) {
          console.error('Ошибка загрузки URL изображения:', error);
        }
      }
    }
    
    setImageUrls(urls);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Товар удален",
        });
        loadProducts();
      } else {
        throw new Error('Ошибка удаления');
      }
    } catch (error) {
      console.error('Ошибка удаления товара:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить товар",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    loadProducts();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-600" />
          <span className="font-medium">Всего товаров: {products.length}</span>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить товар
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
            <div className="aspect-video bg-gray-100 rounded-lg mb-4 relative overflow-hidden">
              {product.imagePath && imageUrls[product.id] ? (
                <Image
                  src={imageUrls[product.id]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {product.description || "Описание отсутствует"}
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge variant={product.imagePath ? "default" : "outline"}>
                  {product.imagePath ? "С фото" : "Без фото"}
                </Badge>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(product)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Товары не найдены</p>
          <Button variant="outline" className="mt-4" onClick={handleAdd}>
            Добавить первый товар
          </Button>
        </div>
      )}

      <ProductDialog
        product={editingProduct}
        open={dialogOpen}
        onClose={handleDialogClose}
      />
    </>
  );
}
