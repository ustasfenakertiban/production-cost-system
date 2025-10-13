
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface EmployeeRole {
  id: string;
  name: string;
  paymentType: 'HOURLY' | 'PIECE_RATE';
  hourlyRate: number;
}

interface EmployeeRoleAssignment {
  id: string;
  roleId: string;
  role: EmployeeRole;
}

interface Employee {
  id: string;
  name: string;
  isActive: boolean;
  comment: string | null;
  roles: EmployeeRoleAssignment[];
}

interface EmployeeDialogProps {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
}

export function EmployeeDialog({ employee, open, onClose }: EmployeeDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    isActive: true,
    comment: "",
    roleIds: [] as string[],
  });
  const [availableRoles, setAvailableRoles] = useState<EmployeeRole[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        isActive: employee.isActive,
        comment: employee.comment || "",
        roleIds: employee.roles.map(r => r.roleId),
      });
    } else {
      setFormData({
        name: "",
        isActive: true,
        comment: "",
        roleIds: [],
      });
    }
  }, [employee]);

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setAvailableRoles(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки ролей:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        isActive: formData.isActive,
        comment: formData.comment || null,
        roleIds: formData.roleIds,
      };

      const url = employee ? `/api/employees/${employee.id}` : '/api/employees';
      const method = employee ? 'PUT' : 'POST';

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
          description: employee ? "Сотрудник обновлен" : "Сотрудник добавлен",
        });
        onClose();
      } else {
        throw new Error('Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения сотрудника:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить сотрудника",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleRole = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Имя сотрудника *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Введите имя сотрудника"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange('isActive', checked)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Активный сотрудник
            </Label>
          </div>

          <div>
            <Label htmlFor="comment">Комментарий</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => handleChange('comment', e.target.value)}
              placeholder="Дополнительная информация о сотруднике"
              rows={3}
            />
          </div>

          <div>
            <Label className="mb-3 block">Роли сотрудника</Label>
            {availableRoles.length === 0 ? (
              <div className="text-sm text-gray-500 p-4 border rounded-lg bg-gray-50">
                Нет доступных ролей. Сначала создайте роли в разделе "Роли сотрудников".
              </div>
            ) : (
              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {availableRoles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleRole(role.id)}
                  >
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={formData.roleIds.includes(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                    />
                    <Label
                      htmlFor={`role-${role.id}`}
                      className="ml-3 flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{role.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {role.paymentType === 'HOURLY' ? 'Почасовая' : 'Сдельная'}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {role.hourlyRate.toLocaleString('ru-RU')} ₽/час
                          </span>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
            {formData.roleIds.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Выбрано ролей: {formData.roleIds.length}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
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
