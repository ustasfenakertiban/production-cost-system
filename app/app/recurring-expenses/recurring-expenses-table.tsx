

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RecurringExpenseDialog } from "./recurring-expense-dialog";

interface RecurringExpense {
  id: string;
  name: string;
  period: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  amount: number;
  createdAt: string;
  updatedAt: string;
}

const PERIOD_LABELS = {
  DAY: 'День',
  WEEK: 'Неделя',
  MONTH: 'Месяц', 
  QUARTER: 'Квартал',
  YEAR: 'Год'
};

const PERIOD_COLORS = {
  DAY: 'bg-red-50 text-red-700',
  WEEK: 'bg-orange-50 text-orange-700',
  MONTH: 'bg-blue-50 text-blue-700',
  QUARTER: 'bg-purple-50 text-purple-700',
  YEAR: 'bg-green-50 text-green-700'
};

export function RecurringExpensesTable() {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const response = await fetch('/api/recurring-expenses');
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки периодических расходов:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список периодических расходов",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот расход?')) {
      return;
    }

    try {
      const response = await fetch(`/api/recurring-expenses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Периодический расход удален",
        });
        loadExpenses();
      } else {
        throw new Error('Ошибка удаления');
      }
    } catch (error) {
      console.error('Ошибка удаления периодического расхода:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить периодический расход",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingExpense(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingExpense(null);
    loadExpenses();
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
          <Calendar className="w-5 h-5 text-purple-600" />
          <span className="font-medium">Всего расходов: {expenses.length}</span>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить расход
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-semibold">Название расхода</th>
              <th className="text-center p-3 font-semibold">Период</th>
              <th className="text-right p-3 font-semibold">Сумма</th>
              <th className="text-center p-3 font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium">{expense.name}</div>
                </td>
                <td className="p-3 text-center">
                  <Badge variant="outline" className={PERIOD_COLORS[expense.period]}>
                    {PERIOD_LABELS[expense.period]}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <div className="font-medium text-red-600">
                    {expense.amount.toLocaleString('ru-RU', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} ₽
                  </div>
                  <div className="text-xs text-gray-500">
                    за {PERIOD_LABELS[expense.period].toLowerCase()}
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(expense)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {expenses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Периодические расходы не найдены</p>
          <Button variant="outline" className="mt-4" onClick={handleAdd}>
            Добавить первый расход
          </Button>
        </div>
      )}

      <RecurringExpenseDialog
        expense={editingExpense}
        open={dialogOpen}
        onClose={handleDialogClose}
      />
    </>
  );
}
