
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface EmployeeRole {
  id: string;
  name: string;
  paymentType: 'HOURLY' | 'PIECE_RATE';
  hourlyRate: number;
}

interface RoleDialogProps {
  role: EmployeeRole | null;
  open: boolean;
  onClose: () => void;
}

export function RoleDialog({ role, open, onClose }: RoleDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    paymentType: "",
    hourlyRate: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        paymentType: role.paymentType,
        hourlyRate: role.hourlyRate.toString(),
      });
    } else {
      setFormData({
        name: "",
        paymentType: "",
        hourlyRate: "",
      });
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        paymentType: formData.paymentType,
        hourlyRate: parseFloat(formData.hourlyRate),
      };

      const url = role ? `/api/roles/${role.id}` : '/api/roles';
      const method = role ? 'PUT' : 'POST';

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
          description: role ? "Роль обновлена" : "Роль добавлена",
        });
        onClose();
      } else {
        throw new Error('Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения роли:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить роль",
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
            {role ? 'Редактировать роль' : 'Добавить роль'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Наименование роли *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Введите название роли"
              required
            />
          </div>

          <div>
            <Label htmlFor="paymentType">Тип оплаты *</Label>
            <Select
              value={formData.paymentType || "hourly"}
              onValueChange={(value) => handleChange('paymentType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип оплаты" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOURLY">Почасовая</SelectItem>
                <SelectItem value="PIECE_RATE">Сдельная</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="hourlyRate">
              Базовая стоимость часа (₽) *
            </Label>
            <Input
              id="hourlyRate"
              type="number"
              step="0.01"
              value={formData.hourlyRate}
              onChange={(e) => handleChange('hourlyRate', e.target.value)}
              placeholder="0.00"
              required
            />
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
