import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  let finalVariant = variant;
  if (typeof props.children === "string") {
    const text = props.children.toLowerCase();
    if (["berhasil", "aman", "checklist", "aktif", "pemasukan", "lengkap", "lunas"].some(w => text.includes(w))) {
      finalVariant = "success";
    } else if (["pengeluaran", "berkurang", "belum bayar"].some(w => text.includes(w))) {
      finalVariant = "destructive";
    } else if (["kurang", "dp", "uang muka"].some(w => text.includes(w))) {
      finalVariant = "warning";
    }
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-2 select-none",
        {
          "border-transparent bg-gray-100 text-gray-900": finalVariant === "default",
          "border-transparent bg-gray-50 text-gray-600": finalVariant === "secondary",
          "border-red-200/80 bg-red-50 text-red-700": finalVariant === "destructive",
          "border-green-200/80 bg-green-50 text-green-800": finalVariant === "success",
          "border-amber-200/80 bg-amber-50 text-amber-800": finalVariant === "warning",
          "border-gray-200/90 bg-white text-gray-800": finalVariant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
