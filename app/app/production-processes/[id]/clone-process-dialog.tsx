

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface CloneProcessDialogProps {
  processId: string;
  processName: string;
  open: boolean;
  onClose: () => void;
}

export function CloneProcessDialog({ processId, processName, open, onClose }: CloneProcessDialogProps) {
  const [newName, setNewName] = useState(`${processName} (копия)`);
  const [cloning, setCloning] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleClone = async () => {
    if (!newName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название нового процесса",
        variant: "destructive",
      });
      return;
    }

    setCloning(true);
    try {
      const response = await fetch(`/api/production-processes/${processId}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName }),
      });

      if (response.ok) {
        const newProcess = await response.json();
        toast({
          title: "Успешно",
          description: "Процесс успешно клонирован со всеми цепочками и операциями",
        });
        onClose();
        // Переходим на страницу нового процесса
        router.push(`/production-processes/${newProcess.id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка клонирования');
      }
    } catch (error) {
      console.error('Ошибка клонирования процесса:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось клонировать процесс",
        variant: "destructive",
      });
    } finally {
      setCloning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Клонировать производственный процесс</DialogTitle>
          <DialogDescription>
            Будет создана копия процесса "{processName}" со всеми цепочками операций, операциями, материалами, оборудованием и ролями.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newName">Название нового процесса</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Название нового процесса"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={cloning}>
            Отмена
          </Button>
          <Button onClick={handleClone} disabled={cloning || !newName.trim()}>
            {cloning ? 'Клонирование...' : 'Клонировать'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
