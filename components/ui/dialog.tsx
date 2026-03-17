'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type DialogContextValue = { open: boolean; onOpenChange: (open: boolean) => void };
const DialogContext = React.createContext<DialogContextValue | null>(null);

const Dialog = ({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode }) => {
  const [internal, setInternal] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internal;
  const setOpen = React.useCallback((v: boolean) => { if (!isControlled) setInternal(v); onOpenChange?.(v); }, [isControlled, onOpenChange]);
  return <DialogContext.Provider value={{ open: !!isOpen, onOpenChange: setOpen }}>{children}</DialogContext.Provider>;
};

const DialogTrigger = ({ children, asChild, ...props }: React.HTMLAttributes<HTMLElement> & { asChild?: boolean; children?: React.ReactNode }) => {
  const ctx = React.useContext(DialogContext);
  if (!ctx) return <>{children}</>;
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick: () => ctx.onOpenChange(true) });
  }
  return <button type="button" onClick={() => ctx.onOpenChange(true)} {...props}>{children}</button>;
};

const DialogClose = ({ children, asChild, ...props }: React.HTMLAttributes<HTMLElement> & { asChild?: boolean; children?: React.ReactNode }) => {
  const ctx = React.useContext(DialogContext);
  if (!ctx) return <>{children}</>;
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick: () => ctx.onOpenChange(false) });
  }
  return <button type="button" onClick={() => ctx.onOpenChange(false)} {...props}>{children}</button>;
};

const DialogPortal = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
const DialogOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('fixed inset-0 z-50 bg-black/80', className)} aria-hidden {...props} />
));
DialogOverlay.displayName = 'DialogOverlay';

const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => {
  const ctx = React.useContext(DialogContext);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!ctx?.open || !mounted || typeof document === 'undefined') return null;
  const node = (
    <>
      <DialogOverlay onClick={() => ctx.onOpenChange(false)} />
      <div
        ref={ref}
        role="dialog"
        className={cn('fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg', className)}
        {...props}
      >
        {children}
        <button type="button" onClick={() => ctx.onOpenChange(false)} className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
    </>
  );
  return createPortal(node, document.body);
});
DialogContent.displayName = 'DialogContent';

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />;
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2', className)} {...props} />;
const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => <h2 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />);
DialogTitle.displayName = 'DialogTitle';
const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />);
DialogDescription.displayName = 'DialogDescription';

export { Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
