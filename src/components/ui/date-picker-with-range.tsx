"use client";

import * as React from "react";
import { format, startOfMonth, subDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { id } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";


interface DatePickerWithRangeProps {
  className?: string;
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const presets = [
    {
      label: "Hari Ini",
      getValue: () => ({ from: new Date(), to: new Date() }),
    },
    {
      label: "Kemarin",
      getValue: () => ({
        from: subDays(new Date(), 1),
        to: subDays(new Date(), 1),
      }),
    },
    {
      label: "7 Hari Terakhir",
      getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }),
    },
    {
      label: "30 Hari Terakhir",
      getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }),
    },
    {
      label: "Bulan Ini",
      getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }),
    },
  ];

  const handlePresetChange = (value: string) => {
    const preset = presets.find((p) => p.label === value);
    if (preset) {
      setDate(preset.getValue());
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd MMM y", { locale: id })} -{" "}
                  {format(date.to, "dd MMM y", { locale: id })}
                </>
              ) : (
                format(date.from, "dd MMM y", { locale: id })
              )
            ) : (
              <span>Pilih tanggal</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row">
            <div className="p-3 border-b sm:border-b-0 sm:border-r space-y-2">
              <div className="font-medium text-sm mb-2 px-1">Pilihan Cepat</div>
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="justify-start font-normal"
                    onClick={() => handlePresetChange(preset.label)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              locale={id}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
