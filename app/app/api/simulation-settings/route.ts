
/**
 * API для управления настройками симуляции
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

/**
 * GET - Получить текущие настройки
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Получить первую запись или создать с дефолтными значениями
    let settings = await prisma.simulationSettings.findFirst();

    if (!settings) {
      settings = await prisma.simulationSettings.create({
        data: {
          payIdleTime: true,
          enablePartialWork: true,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching simulation settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

/**
 * POST - Обновить настройки
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Получить существующую запись или создать новую
    let settings = await prisma.simulationSettings.findFirst();

    if (settings) {
      // Обновить существующую
      settings = await prisma.simulationSettings.update({
        where: { id: settings.id },
        data: {
          payIdleTime: data.payIdleTime,
          enablePartialWork: data.enablePartialWork,
        },
      });
    } else {
      // Создать новую
      settings = await prisma.simulationSettings.create({
        data: {
          payIdleTime: data.payIdleTime,
          enablePartialWork: data.enablePartialWork,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating simulation settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
