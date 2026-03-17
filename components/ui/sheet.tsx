'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type SheetContextValue = { open: boolean; onOpenChange: (open: boolean) => void };
const SheetContext = React.createContext<SheetContextValue | null>(null);

const Sheet = ({
  open,
  onOpenChange,
  children,
}: { open?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode }) => {
  const [internalOpen, setInternal] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = React.useCallback(
    (v: boolean) => {
      if (!isControlled) setInternal(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange]
  );
  return (
    <SheetContext.Provider value={{ open: !!isOpen, onOpenChange: setOpen }}>
      {children}
    </SheetContext.Provider>
  );
};

const SheetTrigger = ({
  children,
  asChild,
  ...props
}: React.HTMLAttributes<HTMLElement> & { asChild?: boolean; children?: React.ReactNode }) => {
  const ctx = React.useContext(SheetContext);
  if (!ctx) return <>{children}</>;
  const onClick = () => ctx.onOpenChange(true);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick });
  }
  return (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  );
};

const SheetClose = ({
  children,
  asChild,
  ...props
}: React.HTMLAttributes<HTMLElement> & { asChild?: boolean; children?: React.ReactNode }) => {
  const ctx = React.useContext(SheetContext);
  if (!ctx) return <>{children}</>;
  const onClick = () => ctx.onOpenChange(false);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick });
  }
  return (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  );
};

const SheetOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('fixed inset-0 z-50 bg-black/80', className)}
      aria-hidden
      {...props}
    />
  )
);
SheetOverlay.displayName = 'SheetOverlay';

const sideClasses: Record<string, string> = {
  right:
    'inset-y-0 right-0 h-full w-3/4 border-l data-[closed]:slide-out-to-right data-[open]:slide-in-from-right sm:max-w-sm',
  left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[closed]:slide-out-to-left data-[open]:slide-in-from-left sm:max-w-sm',
  top: 'inset-x-0 top-0 border-b data-[closed]:slide-out-to-top data-[open]:slide-in-from-top',
  bottom: 'inset-x-0 bottom-0 border-t data-[closed]:slide-out-to-bottom data-[open]:slide-in-from-bottom',
};

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: keyof typeof sideClasses }
>(({ side = 'right', className, children, ...props }, ref) => {
  const ctx = React.useContext(SheetContext);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!ctx) return null;
  const isOpen = ctx.open;
  if (!mounted || typeof document === 'undefined') return null;
  const content = (
    <>
      {isOpen && (
        <SheetOverlay
          onClick={() => ctx.onOpenChange(false)}
          className="opacity-100 transition-opacity"
        />
      )}
      <div
        ref={ref}
        data-state={isOpen ? 'open' : 'closed'}
        className={cn(
          'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out duration-300',
          sideClasses[side] ?? sideClasses.right,
          isOpen ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-full opacity-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
  return createPortal(content, document.body);
});
SheetContent.displayName = 'SheetContent';

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn('text-lg font-semibold text-foreground', className)} {...props} />
  )
);
SheetTitle.displayName = 'SheetTitle';
const SheetDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
SheetDescription.displayName = 'SheetDescription';

export { Sheet, SheetTrigger, SheetClose, SheetOverlay, SheetContent, SheetHeader, SheetTitle, SheetDescription };
