import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        // NUEVO: Azul Cyan Brillante - Garantizando contraste blanco sobre cyan
        default: "bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500 shadow-altamedica hover:shadow-altamedica-lg",
        
        // Destructivo - Rojo sólido para acciones peligrosas
        destructive: "bg-alert-500 text-white hover:bg-alert-600 focus-visible:ring-alert-500",
        
        // Outline - Solo borde con texto oscuro para mejor contraste
        outline: "border-2 border-primary-500 bg-white text-primary-700 hover:bg-primary-50 hover:text-primary-800 focus-visible:ring-primary-500",
        
        // Secundario - Fondo suave con texto oscuro para mejor contraste
        secondary: "bg-primary-50 text-primary-800 hover:bg-primary-100 hover:text-primary-900 focus-visible:ring-primary-500",
        
        // Ghost - Mínimo, sin bordes
        ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
        
        // Link - Estilo de enlace con cyan oscuro para mejor contraste
        link: "text-primary-700 underline-offset-4 hover:underline hover:text-primary-800",
        
        // Medical - Verde sólido para acciones médicas
        medical: "bg-success-500 text-white hover:bg-success-600 focus-visible:ring-success-500",
        
        // Emergency - Rojo con pulso para emergencias
        emergency: "bg-alert-600 text-white hover:bg-alert-700 focus-visible:ring-alert-500 animate-pulse",
        
        // Argentina - Azul argentino sólido
        argentina: "bg-argentina-500 text-white hover:bg-argentina-600 focus-visible:ring-argentina-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-lg px-6 text-base",
        xl: "h-14 rounded-lg px-8 text-lg",
        icon: "h-10 w-10",
        xs: "h-7 rounded-md px-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
