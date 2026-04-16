
import * as React from 'react';

import {cn} from '../../lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-base shadow-none ring-0 ring-offset-0 placeholder:text-muted-foreground focus:border-input focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-input focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
