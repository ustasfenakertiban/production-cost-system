
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface OperationChain {
  id: string;
  name: string;
  chainType: string;
}

interface OperationChainDialogProps {
  chain: OperationChain | null;
  processId: string;
  open: boolean;
  onClose: () => void;
}

export function OperationChainDialog({ chain, processId, open, onClose }: OperationChainDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    chainType: "",
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (chain) {
      setFormData({
        name: chain.name,
        chainType: chain.chainType,
      });
    } else {
      setFormData({
        name: "",
        chainType: "",
      });
    }
  }, [chain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        processId,
        name: formData.name,
        chainType: formData.chainType,
      };

      const url = chain ? `/api/operation-chains/${chain.id}` : '/api/operation-chains';
      const method = chain ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: chain ? "Цепочка операций обновлена" : "Цепочка операций добавлена",
        });
        onClose();
      } else {
        throw new Error('Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения цепочки:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить цепочку операций",
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {chain ? 'Редактировать цепочку' : 'Добавить цепочку операций'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Название цепочки *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Введите название цепочки"
              required
            />
          </div>

          <div>
            <Label htmlFor="chainType">Тип цепочки *</Label>
            <Select value={formData.chainType || ""} onValueChange={(value) => handleChange('chainType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип цепочки" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONE_TIME">
                  Разовая (выполняется единожды для товара)
                </SelectItem>
                <SelectItem value="PER_UNIT">
                  На единицу товара (для каждой произведенной единицы)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.chainType}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
