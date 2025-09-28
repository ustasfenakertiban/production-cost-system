
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface OperationChain {
  id: string;
  name: string;
  chainType: string;
  comments?: string;
  orderIndex: number;
  estimatedQuantity?: number;
  enabled: boolean;
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
    comments: "",
    orderIndex: "1",
    estimatedQuantity: "1",
    enabled: true,
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (chain) {
      setFormData({
        name: chain.name,
        chainType: chain.chainType,
        comments: chain.comments || "",
        orderIndex: chain.orderIndex?.toString() || "1",
        estimatedQuantity: chain.estimatedQuantity?.toString() || "1",
        enabled: chain.enabled ?? true,
      });
    } else {
      setFormData({
        name: "",
        chainType: "",
        comments: "",
        orderIndex: "1",
        estimatedQuantity: "1",
        enabled: true,
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
        comments: formData.comments || null,
        orderIndex: parseInt(formData.orderIndex) || 1,
        estimatedQuantity: formData.chainType === 'ONE_TIME' ? (parseInt(formData.estimatedQuantity) || 1) : null,
        enabled: formData.enabled,
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

  const handleChange = (field: string, value: string | boolean) => {
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

          {/* Поле для расчетного количества деталей (только для разовых цепочек) */}
          {formData.chainType === 'ONE_TIME' && (
            <div>
              <Label htmlFor="estimatedQuantity">Расчетное количество деталей *</Label>
              <Input
                id="estimatedQuantity"
                type="number"
                min="1"
                value={formData.estimatedQuantity}
                onChange={(e) => handleChange('estimatedQuantity', e.target.value)}
                placeholder="1"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Количество деталей для расчета стоимости на единицу изделия
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="orderIndex">Порядок выполнения *</Label>
            <Input
              id="orderIndex"
              type="number"
              min="1"
              value={formData.orderIndex}
              onChange={(e) => handleChange('orderIndex', e.target.value)}
              placeholder="1"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Цепочки с одинаковым порядком выполняются параллельно
            </p>
          </div>

          <div>
            <Label htmlFor="comments">Комментарии</Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => handleChange('comments', e.target.value)}
              placeholder="Дополнительные комментарии"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => handleChange('enabled', checked)}
            />
            <Label htmlFor="enabled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Включить в расчеты
            </Label>
            <p className="text-sm text-gray-500">
              (отключенные цепочки не учитываются при расчете стоимости)
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.chainType || !formData.orderIndex}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
