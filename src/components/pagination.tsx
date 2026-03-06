import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
};

function getPageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];

  if (currentPage > 3) {
    pages.push('...');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push('...');
  }

  pages.push(totalPages);

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}: PaginationProps) {
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const pages = getPageNumbers(currentPage, totalPages);

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <div className="flex items-center justify-between gap-[var(--space-4)]">
      {/* Showing X-Y of Z */}
      <span className="text-micro text-[--text-ghost] tabular-nums whitespace-nowrap">
        SHOWING {startItem}&ndash;{endItem} OF {totalItems}
      </span>

      {/* Page size selector */}
      <div className="flex items-center gap-[var(--space-2)]">
        <span className="text-micro text-[--text-ghost] whitespace-nowrap">ROWS</span>
        <Select
          value={String(pageSize)}
          onValueChange={(val) => onPageSizeChange(Number(val))}
        >
          <SelectTrigger className="h-auto w-auto min-w-0 border-0 bg-[--bg-surface-2] px-[var(--space-2)] py-[var(--space-1)] text-[10px] tracking-[0.18em] uppercase text-[--text-secondary] shadow-[inset_0_0_0_1px_var(--border-default)] ring-0 focus:ring-0 focus:shadow-[inset_0_0_0_1px_var(--border-focus)] [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-0 border-0 bg-[--bg-root] shadow-[inset_0_0_0_1px_var(--border-default)]">
            {pageSizeOptions.map((opt) => (
              <SelectItem
                key={opt}
                value={String(opt)}
                className="text-[10px] tracking-[0.18em] uppercase text-[--text-secondary] focus:bg-[--bg-surface-2] focus:text-[--text-primary]"
              >
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Page numbers */}
      <div className="flex items-center gap-px">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          className={`flex items-center justify-center px-[var(--space-3)] py-[var(--space-2)] text-[10px] uppercase tracking-[0.18em] transition-colors surface-flat rounded-md ${
            isFirstPage
              ? 'opacity-30 cursor-not-allowed'
              : 'text-[--text-tertiary] hover:text-[--text-secondary] hover:bg-[--bg-secondary]'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="h-3 w-3" />
        </button>

        {/* Page buttons */}
        {pages.map((page, idx) =>
          page === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex items-center justify-center px-[var(--space-3)] py-[var(--space-2)] text-[10px] uppercase tracking-[0.18em] text-[--text-ghost] surface-flat rounded-md select-none"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={page === currentPage}
              className={`px-[var(--space-3)] py-[var(--space-2)] text-[10px] uppercase tracking-[0.18em] tabular-nums transition-colors rounded-md ${
                page === currentPage
                  ? 'bg-[--accent-rose] text-[--accent-charcoal]'
                  : 'surface-flat text-[--text-tertiary] hover:text-[--text-secondary] hover:bg-[--bg-secondary]'
              }`}
            >
              {page}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage}
          className={`flex items-center justify-center px-[var(--space-3)] py-[var(--space-2)] text-[10px] uppercase tracking-[0.18em] transition-colors surface-flat rounded-md ${
            isLastPage
              ? 'opacity-30 cursor-not-allowed'
              : 'text-[--text-tertiary] hover:text-[--text-secondary] hover:bg-[--bg-secondary]'
          }`}
          aria-label="Next page"
        >
          <ChevronRightIcon className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
