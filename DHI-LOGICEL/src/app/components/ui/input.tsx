import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-slate-400 selection:bg-indigo-500 selection:text-white dark:bg-slate-800/50 border-slate-200 flex h-11 w-full min-w-0 rounded-xl border-2 px-4 py-2.5 text-base bg-white transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/10",
        "aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500 hover:border-slate-300",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
