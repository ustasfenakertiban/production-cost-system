
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmployeeDialog } from "./employee-dialog";

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
  createdAt: string;
  updatedAt: string;
}

export function EmployeesTable() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список сотрудников",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
      return;
    }

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Сотрудник удален",
        });
        loadEmployees();
      } else {
        throw new Error('Ошибка удаления');
      }
    } catch (error) {
      console.error('Ошибка удаления сотрудника:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить сотрудника",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingEmployee(null);
    loadEmployees();
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
          <Users className="w-5 h-5 text-blue-600" />
          <span className="font-medium">Всего сотрудников: {employees.length}</span>
          <span className="text-gray-500">
            (активных: {employees.filter(e => e.isActive).length})
          </span>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить сотрудника
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-semibold">Имя сотрудника</th>
              <th className="text-left p-3 font-semibold">Роли</th>
              <th className="text-center p-3 font-semibold">Статус</th>
              <th className="text-left p-3 font-semibold">Комментарий</th>
              <th className="text-center p-3 font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium">{employee.name}</div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {employee.roles.length > 0 ? (
                      employee.roles.map((assignment) => (
                        <Badge key={assignment.id} variant="secondary" className="text-xs">
                          {assignment.role.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">Роли не назначены</span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-center">
                  <Badge variant={employee.isActive ? "default" : "outline"}>
                    {employee.isActive ? "Активен" : "Неактивен"}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="text-sm text-gray-600 max-w-xs truncate">
                    {employee.comment || "—"}
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(employee)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(employee.id)}
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

      {employees.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Сотрудники не найдены</p>
          <Button variant="outline" className="mt-4" onClick={handleAdd}>
            Добавить первого сотрудника
          </Button>
        </div>
      )}

      <EmployeeDialog
        employee={editingEmployee}
        open={dialogOpen}
        onClose={handleDialogClose}
      />
    </>
  );
}
