
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, ArrowLeft, Package, Wrench, Users, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OperationTemplate {
  id: string;
  name: string;
  description?: string;
  comment?: string;
  enabled: boolean;
  estimatedProductivityPerHour?: number;
  minimumBatchSize?: number;
  createdAt: string;
  materials: any[];
  equipment: any[];
  roles: any[];
}

export default function OperationTemplatesPage() {
  const [templates, setTemplates] = useState<OperationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [viewTemplate, setViewTemplate] = useState<OperationTemplate | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/operation-templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить шаблоны операций",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      const response = await fetch(`/api/operation-templates/${templateToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete template");

      toast({
        title: "Успешно",
        description: "Шаблон операции удален",
      });

      fetchTemplates();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить шаблон операции",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="container mx-auto">
          <div className="text-center">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              На главную
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Шаблоны операций</h1>
          <p className="text-gray-600">
            Управление шаблонами для быстрого создания операций
          </p>
        </div>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 mb-4">Шаблоны операций не найдены</p>
              <p className="text-sm text-gray-400">
                Создайте шаблон, сохранив существующую операцию как шаблон
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{template.name}</CardTitle>
                      {template.description && (
                        <CardDescription className="line-clamp-2">
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={template.enabled ? "default" : "secondary"}>
                      {template.enabled ? "Активен" : "Отключен"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-green-600" />
                        <span className="text-gray-600">
                          {template.materials.length} материалов
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-600">
                          {template.equipment.length} оборудования
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-gray-600">
                        {template.roles.length} сотрудников
                      </span>
                    </div>
                    {template.estimatedProductivityPerHour && (
                      <div className="text-sm text-gray-600">
                        Производительность: {template.estimatedProductivityPerHour} шт/час
                      </div>
                    )}
                    {template.comment && (
                      <div className="text-sm text-gray-500 italic line-clamp-2">
                        {template.comment}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setViewTemplate(template)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Просмотр
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setTemplateToDelete(template.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить шаблон?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Шаблон будет удален навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {viewTemplate && (
        <AlertDialog open={!!viewTemplate} onOpenChange={() => setViewTemplate(null)}>
          <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl">{viewTemplate.name}</AlertDialogTitle>
              {viewTemplate.description && (
                <AlertDialogDescription className="text-base">
                  {viewTemplate.description}
                </AlertDialogDescription>
              )}
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              {viewTemplate.comment && (
                <div>
                  <h4 className="font-semibold mb-2">Комментарий:</h4>
                  <p className="text-sm text-gray-600">{viewTemplate.comment}</p>
                </div>
              )}
              
              {viewTemplate.materials.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-600" />
                    Материалы:
                  </h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {viewTemplate.materials.map((m: any) => (
                      <li key={m.id}>
                        {m.material.name} - {m.quantity} {m.material.unit}
                        {!m.enabled && <Badge variant="secondary" className="ml-2">Отключен</Badge>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {viewTemplate.equipment.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-blue-600" />
                    Оборудование:
                  </h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {viewTemplate.equipment.map((e: any) => (
                      <li key={e.id}>
                        {e.equipment.name} - {e.machineTime} часов
                        {!e.enabled && <Badge variant="secondary" className="ml-2">Отключен</Badge>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {viewTemplate.roles.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    Сотрудники:
                  </h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {viewTemplate.roles.map((r: any) => (
                      <li key={r.id}>
                        {r.role.name} - {r.timeSpent} часов
                        {!r.enabled && <Badge variant="secondary" className="ml-2">Отключен</Badge>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setViewTemplate(null)}>
                Закрыть
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
