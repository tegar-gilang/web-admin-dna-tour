import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-extrabold ring-offset-white transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-900/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
          {
            "bg-[#740A03] text-white hover:bg-[#580802] shadow-2xs hover:shadow-xs": variant === "default",
            "bg-red-600 text-white hover:bg-red-700 shadow-2xs": variant === "destructive",
            "border border-gray-200/90 bg-white hover:bg-gray-50 text-gray-800 shadow-2xs": variant === "outline",
            "bg-gray-100 text-gray-900 hover:bg-gray-200/80": variant === "secondary",
            "hover:bg-gray-100/70 text-gray-800": variant === "ghost",
            "text-[#740A03] underline-offset-4 hover:underline": variant === "link",
            "h-10 px-4 py-2": size === "default",
            "h-8 px-3": size === "sm",
            "h-12 px-8 text-sm": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
