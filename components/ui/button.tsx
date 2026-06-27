import * as React from "react"

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
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
          ${variant === "default" ? "bg-blue-600 text-white hover:bg-blue-600/90" : ""}
          ${variant === "secondary" ? "bg-gray-100 text-gray-900 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-800/80" : ""}
          ${variant === "ghost" ? "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50" : ""}
          ${size === "default" ? "h-10 px-4 py-2" : ""}
          ${size === "sm" ? "h-9 rounded-md px-3" : ""}
          ${size === "lg" ? "h-11 rounded-md px-8" : ""}
          ${size === "icon" ? "h-10 w-10" : ""}
          ${className || ""}`}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
