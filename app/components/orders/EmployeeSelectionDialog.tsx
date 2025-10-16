
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  name: string;
  isActive: boolean;
  roles: {
    id: string;
    role: {
      id: string;
      name: string;
    };
  }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selectedEmployeeIds: string[]) => void;
}

export function EmployeeSelectionDialog({ open, onOpenChange, onConfirm }: Props) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadEmployees();
    }
  }, [open]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        // Фильтруем только активных сотрудников
        const activeEmployees = data.filter((emp: Employee) => emp.isActive);
        setEmployees(activeEmployees);
        // По умолчанию выбираем всех активных
        setSelectedIds(activeEmployees.map((emp: Employee) => emp.id));
      }
    } catch (error) {
      console.error("Ошибка загрузки сотрудников:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список сотрудников",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (employeeId: string) => {
    setSelectedIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(employees.map((emp) => emp.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleConfirm = () => {
    if (selectedIds.length === 0) {
      toast({
        title: "Предупреждение",
        description: "Выберите хотя бы одного сотрудника",
        variant: "destructive",
      });
      return;
    }
    onConfirm(selectedIds);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Выбор доступных сотрудников</DialogTitle>
          <DialogDescription>
            Отметьте сотрудников, которые будут работать над этим заказом.
            По умолчанию выбраны все активные сотрудники.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Выбрать всех
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Снять всех
            </Button>
            <div className="ml-auto text-sm text-muted-foreground">
              Выбрано: {selectedIds.length} из {employees.length}
            </div>
          </div>

          <ScrollArea className="h-[400px] rounded-md border p-4">
            {loading ? (
              <div className="text-center py-8">Загрузка...</div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет доступных сотрудников
              </div>
            ) : (
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-start space-x-3 p-3 rounded-md hover:bg-muted/50"
                  >
                    <Checkbox
                      id={employee.id}
                      checked={selectedIds.includes(employee.id)}
                      onCheckedChange={() => handleToggle(employee.id)}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={employee.id}
                        className="cursor-pointer font-medium"
                      >
                        {employee.name}
                      </Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        Роли:{" "}
                        {employee.roles.length > 0
                          ? employee.roles.map((r) => r.role.name).join(", ")
                          : "Не указаны"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleConfirm} disabled={loading || selectedIds.length === 0}>
            Продолжить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
