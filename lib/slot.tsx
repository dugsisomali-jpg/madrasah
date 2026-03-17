'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Merges props (ref, className, etc.) onto the single child. Use with asChild to render a Link or other element with the same styles.
 */
function Slot(
  { asChild, className, children, ...props }: React.HTMLAttributes<HTMLElement> & { asChild?: boolean; children?: React.ReactNode },
  ref: React.Ref<HTMLElement>
) {
  if (!asChild || !React.isValidElement(children)) {
    return (
      <span ref={ref as React.Ref<HTMLSpanElement>} className={cn(className)} {...props}>
        {children}
      </span>
    );
  }
  const child = children as React.ReactElement<{ ref?: React.Ref<unknown>; className?: string }>;
  return React.cloneElement(child, {
    ...props,
    ...child.props,
    ref: (node: HTMLElement | null) => {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
      const cr = (child as any).ref;
      if (typeof cr === 'function') cr(node);
      else if (cr && typeof cr === 'object') (cr as React.MutableRefObject<HTMLElement | null>).current = node;
    },
    className: cn(child.props?.className, className),
  });
}
export const SlotRef = React.forwardRef(Slot);
SlotRef.displayName = 'Slot';
export { SlotRef as Slot };
