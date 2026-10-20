"use client";
import { Popover } from "@base-ui/react/popover";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  minDate?: string;
};
export function DatePicker({ value, onChange, label, minDate }: Props) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const disabled = minDate
    ? { before: new Date(`${minDate}T00:00:00`) }
    : undefined;
  return (
    <div className="field">
      <label>{label}</label>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger className={cn("date-trigger", !value && "muted")}>
          <CalendarDays size={16} />
          {selected
            ? format(selected, "d MMMM yyyy", { locale: id })
            : "Pilih tanggal"}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8} className="calendar-positioner">
            <Popover.Popup className="calendar-popup">
              <DayPicker
                mode="single"
                locale={id}
                selected={selected}
                disabled={disabled}
                onSelect={(date) => {
                  if (date) {
                    onChange(format(date, "yyyy-MM-dd"));
                    setOpen(false);
                  }
                }}
                showOutsideDays
                captionLayout="dropdown"
                className="rdp"
                classNames={{
                  months: "rdp-months",
                  month: "rdp-month",
                  month_caption: "rdp-caption",
                  caption_label: "rdp-caption-label",
                  nav: "rdp-nav",
                  button_previous: "rdp-nav-button",
                  button_next: "rdp-nav-button",
                  month_grid: "rdp-table",
                  weekdays: "rdp-weekdays",
                  weekday: "rdp-weekday",
                  week: "rdp-week",
                  day: "rdp-day",
                  day_button: "rdp-day-button",
                  selected: "rdp-selected",
                  today: "rdp-today",
                  outside: "rdp-outside",
                  disabled: "rdp-disabled",
                  dropdowns: "rdp-dropdowns",
                  dropdown: "rdp-dropdown",
                }}
                components={{
                  Chevron: ({ orientation }) =>
                    orientation === "left" ? (
                      <ChevronLeft size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    ),
                }}
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
