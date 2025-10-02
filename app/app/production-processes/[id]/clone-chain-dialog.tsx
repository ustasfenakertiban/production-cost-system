
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface CloneChainDialogProps {
  chainId: string;
  chainName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CloneChainDialog({ 
  chainId, 
  chainName, 
  open, 
  onClose, 
  onSuccess 
}: CloneChainDialogProps) {
  const [newName, setNewName] = useState(`${chainName} (копия)`);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите новое имя для цепочки",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/operation-chains/${chainId}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName: newName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка клонирования');
      }

      toast({
        title: "Успешно",
        description: `Цепочка "${newName}" создана`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Ошибка клонирования цепочки:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось клонировать цепочку",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Клонировать цепочку</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="original-name">Оригинальная цепочка</Label>
              <Input
                id="original-name"
                value={chainName}
                disabled
                className="bg-gray-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-name">
                Новое имя <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Введите новое имя"
                autoFocus
                required
              />
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <strong>Будет скопировано:</strong>
              <ul className="mt-2 space-y-1 ml-4 list-disc">
                <li>Все операции цепочки</li>
                <li>Материалы для каждой операции</li>
                <li>Оборудование для каждой операции</li>
                <li>Роли сотрудников для каждой операции</li>
                <li>Все настройки и параметры</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Клонирование...' : 'Клонировать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
