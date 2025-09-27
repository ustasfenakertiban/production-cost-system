
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RoleDialog } from "./role-dialog";

interface EmployeeRole {
  id: string;
  name: string;
  paymentType: 'HOURLY' | 'PIECE_RATE';
  hourlyRate: number;
  createdAt: string;
  updatedAt: string;
}

export function RolesTable() {
  const [roles, setRoles] = useState<EmployeeRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<EmployeeRole | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки ролей:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список ролей",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту роль?')) {
      return;
    }

    try {
      const response = await fetch(`/api/roles/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Роль удалена",
        });
        loadRoles();
      } else {
        throw new Error('Ошибка удаления');
      }
    } catch (error) {
      console.error('Ошибка удаления роли:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить роль",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (role: EmployeeRole) => {
    setEditingRole(role);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingRole(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingRole(null);
    loadRoles();
  };

  const getPaymentTypeLabel = (type: string) => {
    return type === 'HOURLY' ? 'Почасовая' : 'Сдельная';
  };

  const getPaymentTypeBadge = (type: string) => {
    return type === 'HOURLY' ? 'secondary' : 'outline';
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
          <Users className="w-5 h-5 text-green-600" />
          <span className="font-medium">Всего ролей: {roles.length}</span>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить роль
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-semibold">Наименование роли</th>
              <th className="text-center p-3 font-semibold">Тип оплаты</th>
              <th className="text-right p-3 font-semibold">Базовая ставка</th>
              <th className="text-center p-3 font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium">{role.name}</div>
                </td>
                <td className="p-3 text-center">
                  <Badge variant={getPaymentTypeBadge(role.paymentType) as any}>
                    {getPaymentTypeLabel(role.paymentType)}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <div className="font-medium">
                    {role.hourlyRate.toLocaleString('ru-RU')} ₽/час
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(role)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(role.id)}
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

      {roles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Роли не найдены</p>
          <Button variant="outline" className="mt-4" onClick={handleAdd}>
            Добавить первую роль
          </Button>
        </div>
      )}

      <RoleDialog
        role={editingRole}
        open={dialogOpen}
        onClose={handleDialogClose}
      />
    </>
  );
}
