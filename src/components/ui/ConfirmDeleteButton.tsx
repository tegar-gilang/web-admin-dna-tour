import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/Button';
import { Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDeleteButtonProps extends ButtonProps {
  onConfirm: () => void;
  itemName?: string;
  iconOnly?: boolean;
}

export function ConfirmDeleteButton({ onConfirm, itemName = 'item ini', iconOnly, className, children, ...props }: ConfirmDeleteButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (isConfirming) {
    return (
      <Button 
        variant="outline"
        size={iconOnly ? 'icon' : 'default'}
        className={cn("bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white transition-colors", className)}
        onClick={() => {
          setIsConfirming(false);
          onConfirm();
        }}
        onBlur={() => setTimeout(() => setIsConfirming(false), 200)}
        {...props}
      >
        <AlertCircle className={cn("w-4 h-4", iconOnly ? "" : "mr-2")} />
        {!iconOnly && "Yakin?"}
      </Button>
    );
  }

  return (
    <Button 
      variant="outline"
      size={iconOnly ? 'icon' : 'default'}
      className={cn("text-red-500 hover:bg-red-50 hover:text-red-600 border-transparent hover:border-red-200", className)}
      onClick={() => setIsConfirming(true)}
      {...props}
    >
      {children || (
        <>
          <Trash2 className={cn("w-4 h-4", iconOnly ? "" : "mr-2")} />
          {!iconOnly && "Hapus"}
        </>
      )}
    </Button>
  );
}
