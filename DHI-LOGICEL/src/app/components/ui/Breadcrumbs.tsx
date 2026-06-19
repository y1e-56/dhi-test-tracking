import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="text-slate-400 hover:text-indigo-600 transition-colors truncate flex items-center gap-1"
              >
                {i === 0 && <Home className="w-3.5 h-3.5 flex-shrink-0" />}
                <span className="truncate">{item.label}</span>
              </Link>
            ) : (
              <span className={`font-semibold truncate flex items-center gap-1 ${isLast ? 'text-slate-800' : 'text-slate-400'}`}>
                {i === 0 && <Home className="w-3.5 h-3.5 flex-shrink-0" />}
                <span className="truncate">{item.label}</span>
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
