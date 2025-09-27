
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Users, Package, BarChart3, PackageOpen, Calendar } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Система управления производством
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            3D этикетки для сувенирной продукции
          </p>
          <p className="text-gray-500">
            Управление справочными данными для расчета себестоимости
          </p>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
          {/* Первый ряд - 3 карточки */}
          <Card className="hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle>Оборудование</CardTitle>
              <CardDescription>
                Управление данными производственного оборудования
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild className="w-full">
                <Link href="/equipment">
                  Управлять оборудованием
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle>Роли сотрудников</CardTitle>
              <CardDescription>
                Справочник должностей и тарифных ставок
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild className="w-full">
                <Link href="/roles">
                  Управлять ролями
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle>Товары</CardTitle>
              <CardDescription>
                Каталог производимых товаров и продуктов
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild className="w-full">
                <Link href="/products">
                  Управлять товарами
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
          {/* Второй ряд - 2 карточки по центру */}
          <Card className="hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PackageOpen className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle>Материалы</CardTitle>
              <CardDescription>
                Справочник производственных материалов и их стоимости
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild className="w-full">
                <Link href="/materials">
                  Управлять материалами
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle>Периодические расходы</CardTitle>
              <CardDescription>
                Регулярные производственные затраты и расходы
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild className="w-full">
                <Link href="/recurring-expenses">
                  Управлять расходами
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Третий ряд - Производственные процессы */}
        <div className="mb-12 max-w-2xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-indigo-600">
                  <path d="M2 20h20"></path>
                  <path d="M7 16v4"></path>
                  <path d="M12 12v8"></path>
                  <path d="M17 8v12"></path>
                  <path d="M7 8a4 4 0 0 1 8 0"></path>
                </svg>
              </div>
              <CardTitle>Производственные процессы</CardTitle>
              <CardDescription>
                Технологические процессы и операции производства товаров
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild className="w-full">
                <Link href="/production-processes">
                  Управлять процессами
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-8">
              <BarChart3 className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Готовы начать?</h3>
              <p className="mb-4">Выберите нужный раздел для работы с данными</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
