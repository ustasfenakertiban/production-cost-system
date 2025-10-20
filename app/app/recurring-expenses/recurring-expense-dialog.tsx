

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface RecurringExpense {
  id: string;
  name: string;
  period: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  amount: number;
  vatRate: number;
  active: boolean;
  notes?: string;
}

interface RecurringExpenseDialogProps {
  expense: RecurringExpense | null;
  open: boolean;
  onClose: () => void;
}

const PERIOD_OPTIONS = [
  { value: 'DAY', label: 'День' },
  { value: 'WEEK', label: 'Неделя' },
  { value: 'MONTH', label: 'Месяц' },
  { value: 'QUARTER', label: 'Квартал' },
];

export function RecurringExpenseDialog({ expense, open, onClose }: RecurringExpenseDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    period: "",
    amount: "",
    vatRate: "",
    active: true,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (expense) {
      setFormData({
        name: expense.name,
        period: expense.period,
        amount: expense.amount.toString(),
        vatRate: expense.vatRate.toString(),
        active: expense.active,
        notes: expense.notes || "",
      });
    } else {
      setFormData({
        name: "",
        period: "",
        amount: "",
        vatRate: "0",
        active: true,
        notes: "",
      });
    }
  }, [expense, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        period: formData.period as 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR',
        amount: parseFloat(formData.amount),
        vatRate: parseFloat(formData.vatRate),
        active: formData.active,
        notes: formData.notes || null,
      };

      const url = expense ? `/api/recurring-expenses/${expense.id}` : '/api/recurring-expenses';
      const method = expense ? 'PUT' : 'POST';

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
          description: expense ? "Периодический расход обновлен" : "Периодический расход добавлен",
        });
        onClose();
      } else {
        throw new Error('Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения периодического расхода:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить периодический расход",
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
            {expense ? 'Редактировать периодический расход' : 'Добавить периодический расход'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Название расхода *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Введите название расхода"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="period">Период *</Label>
              <Select value={formData.period || ""} onValueChange={(value) => handleChange('period', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите период" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Сумма (₽) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="vatRate">НДС (%)</Label>
            <Input
              id="vatRate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.vatRate}
              onChange={(e) => handleChange('vatRate', e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="flex items-center gap-3 py-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => handleChange('active', checked)}
            />
            <Label htmlFor="active" className="cursor-pointer">
              Активен (учитывается в симуляции)
            </Label>
          </div>

          <div>
            <Label htmlFor="notes">Примечания</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Дополнительная информация о расходе"
              rows={3}
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
