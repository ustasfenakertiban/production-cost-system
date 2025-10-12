
"use client";

import { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, Clock, Calendar, Activity, AlertCircle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
  type: "info" | "warning" | "success" | "error" | "operation" | "resource";
  message: string;
  raw: string;
}

interface OperationGroup {
  operationName: string;
  entries: LogEntry[];
}

interface HourNode {
  hour: number;
  absoluteHour: number;
  operations: OperationGroup[];
  generalEntries: LogEntry[];
  waitingOperations?: OperationGroup; // Отдельный блок для ожидающих операций
}

interface DayNode {
  day: number;
  hours: HourNode[];
}

interface TreeLogViewerProps {
  log: string;
}

export default function TreeLogViewer({ log }: TreeLogViewerProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [expandedHours, setExpandedHours] = useState<Set<string>>(new Set(["1-1"]));
  const [expandedOperations, setExpandedOperations] = useState<Set<string>>(new Set());
  const [expandedWaiting, setExpandedWaiting] = useState<Set<string>>(new Set()); // По умолчанию НЕ раскрыты

  const parsedLog = useMemo(() => {
    const lines = log.split("\n");
    const days: DayNode[] = [];
    let currentDay: DayNode | null = null;
    let currentHour: HourNode | null = null;
    let currentOperation: OperationGroup | null = null;
    let isInWaitingBlock = false; // Флаг, что мы внутри блока "Ожидающие операции"

    const classifyEntry = (line: string): LogEntry["type"] => {
      if (line.includes("⚠️") || line.includes("⏸️") || line.includes("Ожидание") || line.includes("невозможно") || line.includes("недостаточно")) {
        return "warning";
      }
      if (line.includes("✓") || line.includes("завершена") || line.includes("Выполнено")) {
        return "success";
      }
      if (line.includes("❌") || line.includes("Ошибка")) {
        return "error";
      }
      if (line.includes("🏃") || line.includes("▶️") || line.includes("выполняется") || line.includes("Запуск")) {
        return "operation";
      }
      if (line.includes("👷") || line.includes("⚙️") || line.includes("работник") || line.includes("оборудование")) {
        return "resource";
      }
      return "info";
    };

    const createEntry = (line: string): LogEntry => ({
      type: classifyEntry(line),
      message: line.trim(),
      raw: line,
    });

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Пропускаем пустые строки и заголовки
      if (!line.trim() || line.includes("═══") || line.includes("║") || line.includes("ИТОГОВАЯ СВОДКА")) {
        continue;
      }

      // Определяем день
      const dayMatch = line.match(/📅\s*День\s+(\d+)/i);
      if (dayMatch) {
        const dayNum = parseInt(dayMatch[1]);
        currentDay = { day: dayNum, hours: [] };
        days.push(currentDay);
        currentHour = null;
        currentOperation = null;
        isInWaitingBlock = false;
        continue;
      }

      // Определяем час
      const hourMatch = line.match(/⏰\s*Час\s+(\d+)\s*\(абсолютный час:\s*(\d+)\)/i);
      if (hourMatch && currentDay) {
        const hourNum = parseInt(hourMatch[1]);
        const absHour = parseInt(hourMatch[2]);
        currentHour = { hour: hourNum, absoluteHour: absHour, operations: [], generalEntries: [] };
        currentDay.hours.push(currentHour);
        currentOperation = null;
        isInWaitingBlock = false;
        continue;
      }

      // Определяем блок "Ожидающие операции"
      if (line.match(/⏸️\s*Ожидающие операции/i)) {
        if (currentHour) {
          isInWaitingBlock = true;
          currentHour.waitingOperations = { operationName: "Ожидающие операции", entries: [] };
          currentOperation = null;
        }
        continue;
      }

      // Если мы встретили новый "⏰ Час" или "📊 Выполняется операций", завершаем блок ожидающих
      if (isInWaitingBlock && (line.match(/📊\s*Выполняется операций/i) || line.match(/👥\s*Работники/i))) {
        isInWaitingBlock = false;
      }

      // Определяем операцию
      const operationMatch = line.match(/^[\s]*(?:🏃|▶️|⚠️|✓|❌)\s*(?:Операция|Operation)?\s*['"](.+?)['"]|^[\s]*(?:🏃|▶️|⚠️|✓|❌)\s*(.+?)(?:\s+\(|:|$)/i);
      if (operationMatch && currentHour && !line.includes("Ожидающие операции") && !line.includes("Общая информация") && !isInWaitingBlock) {
        const opName = operationMatch[1] || operationMatch[2];
        if (opName && opName.length > 2) {
          // Проверяем, существует ли уже такая операция в текущем часе
          currentOperation = currentHour.operations.find(op => op.operationName === opName) || null;
          if (!currentOperation) {
            currentOperation = { operationName: opName, entries: [] };
            currentHour.operations.push(currentOperation);
          }
        }
      }

      // Добавляем запись
      if (line.trim()) {
        const entry = createEntry(line);
        
        if (isInWaitingBlock && currentHour?.waitingOperations) {
          // Добавляем в блок ожидающих операций
          currentHour.waitingOperations.entries.push(entry);
        } else if (currentOperation && !line.match(/⏰\s*Час/)) {
          currentOperation.entries.push(entry);
        } else if (currentHour) {
          currentHour.generalEntries.push(entry);
        }
      }
    }

    return days;
  }, [log]);

  const toggleDay = (day: number) => {
    const newSet = new Set(expandedDays);
    if (newSet.has(day)) {
      newSet.delete(day);
      // Также сворачиваем все часы этого дня
      const hourKeys = parsedLog.find(d => d.day === day)?.hours.map(h => `${day}-${h.hour}`) || [];
      hourKeys.forEach(key => {
        const hourSet = new Set(expandedHours);
        hourSet.delete(key);
        setExpandedHours(hourSet);
      });
    } else {
      newSet.add(day);
    }
    setExpandedDays(newSet);
  };

  const toggleHour = (day: number, hour: number) => {
    const key = `${day}-${hour}`;
    const newSet = new Set(expandedHours);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedHours(newSet);
  };

  const toggleOperation = (day: number, hour: number, operation: string) => {
    const key = `${day}-${hour}-${operation}`;
    const newSet = new Set(expandedOperations);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedOperations(newSet);
  };

  const toggleWaiting = (day: number, hour: number) => {
    const key = `${day}-${hour}-waiting`;
    const newSet = new Set(expandedWaiting);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedWaiting(newSet);
  };

  const getIconForType = (type: LogEntry["type"]) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      case "success":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "error":
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case "operation":
        return <Activity className="w-3 h-3 text-blue-500" />;
      case "resource":
        return <Info className="w-3 h-3 text-purple-500" />;
      default:
        return <Info className="w-3 h-3 text-gray-500" />;
    }
  };

  const expandAll = () => {
    setExpandedDays(new Set(parsedLog.map(d => d.day)));
    const allHours = parsedLog.flatMap(d => d.hours.map(h => `${d.day}-${h.hour}`));
    setExpandedHours(new Set(allHours));
    const allOps = parsedLog.flatMap(d => 
      d.hours.flatMap(h => 
        h.operations.map(op => `${d.day}-${h.hour}-${op.operationName}`)
      )
    );
    setExpandedOperations(new Set(allOps));
  };

  const collapseAll = () => {
    setExpandedDays(new Set());
    setExpandedHours(new Set());
    setExpandedOperations(new Set());
  };

  if (parsedLog.length === 0) {
    return <div className="text-muted-foreground text-sm p-4">Нет данных для отображения</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-4">
        <button
          onClick={expandAll}
          className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Развернуть все
        </button>
        <button
          onClick={collapseAll}
          className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
        >
          Свернуть все
        </button>
      </div>

      <div className="space-y-1 font-mono text-sm">
        {parsedLog.map((day) => (
          <div key={day.day} className="border rounded-lg overflow-hidden">
            {/* День */}
            <button
              onClick={() => toggleDay(day.day)}
              className="w-full flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
            >
              {expandedDays.has(day.day) ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              )}
              <Calendar className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold">День {day.day}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {day.hours.length} час(ов)
              </span>
            </button>

            {/* Часы */}
            {expandedDays.has(day.day) && (
              <div className="ml-4 border-l-2 border-blue-200 dark:border-blue-800">
                {day.hours.map((hour) => {
                  const hourKey = `${day.day}-${hour.hour}`;
                  const isHourExpanded = expandedHours.has(hourKey);

                  return (
                    <div key={hourKey} className="border-b last:border-b-0">
                      <button
                        onClick={() => toggleHour(day.day, hour.hour)}
                        className="w-full flex items-center gap-2 p-2 pl-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        {isHourExpanded ? (
                          <ChevronDown className="w-3 h-3 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        )}
                        <Clock className="w-3 h-3 flex-shrink-0 text-slate-600 dark:text-slate-400" />
                        <span className="text-sm">
                          Час {hour.hour} <span className="text-xs text-muted-foreground">(абс. час: {hour.absoluteHour})</span>
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {hour.operations.length} операций
                        </span>
                      </button>

                      {/* Содержимое часа */}
                      {isHourExpanded && (
                        <div className="ml-4 border-l-2 border-slate-200 dark:border-slate-800">
                          {/* Общая информация */}
                          {hour.generalEntries.length > 0 && (
                            <div className="p-2 pl-3 space-y-1 bg-white dark:bg-slate-950">
                              {hour.generalEntries.map((entry, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs">
                                  {getIconForType(entry.type)}
                                  <span className={cn(
                                    "flex-1",
                                    entry.type === "warning" && "text-yellow-600 dark:text-yellow-400",
                                    entry.type === "success" && "text-green-600 dark:text-green-400",
                                    entry.type === "error" && "text-red-600 dark:text-red-400"
                                  )}>
                                    {entry.message}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Операции */}
                          {hour.operations.map((operation) => {
                            const opKey = `${day.day}-${hour.hour}-${operation.operationName}`;
                            const isOpExpanded = expandedOperations.has(opKey);

                            return (
                              <div key={opKey} className="border-b last:border-b-0">
                                <button
                                  onClick={() => toggleOperation(day.day, hour.hour, operation.operationName)}
                                  className="w-full flex items-center gap-2 p-2 pl-3 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                                >
                                  {isOpExpanded ? (
                                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                                  )}
                                  <Activity className="w-3 h-3 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                                  <span className="text-xs font-medium">{operation.operationName}</span>
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {operation.entries.length} записей
                                  </span>
                                </button>

                                {isOpExpanded && (
                                  <div className="ml-4 p-2 pl-3 space-y-1 bg-white dark:bg-slate-950">
                                    {operation.entries.map((entry, idx) => (
                                      <div key={idx} className="flex items-start gap-2 text-xs">
                                        {getIconForType(entry.type)}
                                        <span className={cn(
                                          "flex-1",
                                          entry.type === "warning" && "text-yellow-600 dark:text-yellow-400",
                                          entry.type === "success" && "text-green-600 dark:text-green-400",
                                          entry.type === "error" && "text-red-600 dark:text-red-400"
                                        )}>
                                          {entry.message}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Блок ожидающих операций */}
                          {hour.waitingOperations && hour.waitingOperations.entries.length > 0 && (
                            <div className="border-b last:border-b-0">
                              <button
                                onClick={() => toggleWaiting(day.day, hour.hour)}
                                className="w-full flex items-center gap-2 p-2 pl-3 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                              >
                                {expandedWaiting.has(`${day.day}-${hour.hour}-waiting`) ? (
                                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                                )}
                                <AlertCircle className="w-3 h-3 flex-shrink-0 text-orange-600 dark:text-orange-400" />
                                <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                                  {hour.waitingOperations.operationName}
                                </span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {hour.waitingOperations.entries.length} записей
                                </span>
                              </button>

                              {expandedWaiting.has(`${day.day}-${hour.hour}-waiting`) && (
                                <div className="ml-4 p-2 pl-3 space-y-1 bg-white dark:bg-slate-950">
                                  {hour.waitingOperations.entries.map((entry, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-xs">
                                      {getIconForType(entry.type)}
                                      <span className={cn(
                                        "flex-1",
                                        entry.type === "warning" && "text-yellow-600 dark:text-yellow-400",
                                        entry.type === "success" && "text-green-600 dark:text-green-400",
                                        entry.type === "error" && "text-red-600 dark:text-red-400"
                                      )}>
                                        {entry.message}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
