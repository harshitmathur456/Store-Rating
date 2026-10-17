import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-white border-t border-zinc-200 text-xs text-zinc-600">
      <div className="flex items-center gap-3">
        <span>
          Showing <span className="font-semibold text-zinc-900">{startItem}</span> to{' '}
          <span className="font-semibold text-zinc-900">{endItem}</span> of{' '}
          <span className="font-semibold text-zinc-900">{total}</span> results
        </span>
        <div className="flex items-center gap-1.5 ml-2 border-l border-zinc-200 pl-3">
          <label htmlFor="pageSizeSelect" className="text-zinc-500">Rows per page:</label>
          <select
            id="pageSizeSelect"
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="h-7 px-2 rounded border border-zinc-200 bg-white text-xs font-medium text-zinc-800 focus:outline-none focus:border-accent"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-zinc-500 mr-2">
          Page <span className="font-semibold text-zinc-800">{page}</span> of{' '}
          <span className="font-semibold text-zinc-800">{totalPages}</span>
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center justify-center h-7 px-2.5 rounded border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center justify-center h-7 px-2.5 rounded border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>
    </div>
  );
}
