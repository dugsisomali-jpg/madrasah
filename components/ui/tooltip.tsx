'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type TooltipContextValue = { open: boolean; setOpen: (v: boolean) => void; triggerRef: React.RefObject<HTMLElement | null> };
const TooltipContext = React.createContext<TooltipContextValue | null>(null);

const TooltipProvider = ({ children, delayDuration = 0 }: { children?: React.ReactNode; delayDuration?: number }) => (
  <>{children}</>
);

const Tooltip = ({ children }: { children?: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const value = React.useMemo(() => ({ open, setOpen, triggerRef }), [open]);
  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
};

const TooltipTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean; children?: React.ReactNode }
>(({ asChild, children, onMouseEnter, onMouseLeave, ...props }, ref) => {
  const ctx = React.useContext(TooltipContext);
  if (!ctx) return <>{children}</>;
  const setOpen = ctx.setOpen;
  const triggerRef = ctx.triggerRef;
  const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
    setOpen(true);
    onMouseEnter?.(e);
  };
  const handleLeave = (e: React.MouseEvent<HTMLElement>) => {
    setOpen(false);
    onMouseLeave?.(e);
  };
  const mergedRef = (node: HTMLElement | null) => {
    (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
    const child = asChild && React.isValidElement(children) ? (children as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>) : null;
    const cr = (child as any)?.ref;
    if (cr) {
      if (typeof cr === 'function') cr(node);
      else if (typeof cr === 'object') (cr as React.MutableRefObject<HTMLElement | null>).current = node;
    }
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ ref?: React.Ref<HTMLElement>; onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void; onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void }>, {
      ref: mergedRef,
      onMouseEnter: handleEnter,
      onMouseLeave: handleLeave,
    });
  }
  return (
    <span ref={mergedRef} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
      {children}
    </span>
  );
});
TooltipTrigger.displayName = 'TooltipTrigger';

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: 'top' | 'right' | 'bottom' | 'left'; align?: 'start' | 'center' | 'end'; sideOffset?: number; hidden?: boolean }
>(({ className, side = 'top', sideOffset = 4, hidden, children, ...props }, ref) => {
  const ctx = React.useContext(TooltipContext);
  const [mounted, setMounted] = React.useState(false);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });
  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (!ctx?.open || !ctx.triggerRef.current || hidden) return;
    const el = ctx.triggerRef.current;
    const rect = el.getBoundingClientRect();
    const gap = sideOffset ?? 4;
    let top = 0,
      left = 0;
    switch (side) {
      case 'top':
        top = rect.top - gap;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - gap;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + gap;
        break;
      default:
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2;
    }
    setPos({ top, left });
  }, [ctx?.open, side, sideOffset, hidden]);
  if (!ctx || !ctx.open || hidden || !mounted || typeof document === 'undefined') return null;
  const content = (
    <div
      ref={ref}
      role="tooltip"
      className={cn(
        'z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow',
        className
      )}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        transform:
          side === 'right' ? 'translate(0, -50%)' : side === 'left' ? 'translate(-100%, -50%)' : side === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
      }}
      {...props}
    >
      {children}
    </div>
  );
  return createPortal(content, document.body);
});
TooltipContent.displayName = 'TooltipContent';

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
