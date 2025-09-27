
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ProductionProcessesTable } from "./production-processes-table";

export default function ProductionProcessesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              На главную
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Производственные процессы</h1>
            <p className="text-gray-600 mt-1">Управление процессами изготовления продукции</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Список производственных процессов</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductionProcessesTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
