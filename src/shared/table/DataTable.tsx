import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded'
import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'

export type DataTableColumn<T> = {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  /** Column width in px. Required for frozen columns; used as a min-width for the rest. */
  width?: number
  align?: 'left' | 'right'
  /** Leading frozen (sticky) column. Frozen columns must be the first columns in the array. */
  frozen?: boolean
  /** When set (with an `onSortChange` handler), the header becomes a sort toggle for this key. */
  sortKey?: string
  headerClassName?: string
  cellClassName?: string
}

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  loading?: boolean
  loadingLabel?: string
  emptyMessage?: string
  minWidthClassName?: string
  /** Enables the leading checkbox column + select-all header. */
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  /** Rows for which selection is disabled (e.g. the signed-in user's own row). */
  isRowSelectable?: (row: T) => boolean
  /** Rendered as a bar above the table while at least one row is selected. */
  bulkActions?: (selectedIds: string[]) => ReactNode
  /** Sorting — the currently active column key + direction, and a click handler per sortable header. */
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  onSortChange?: (sortKey: string) => void
}

const CHECKBOX_COLUMN_WIDTH = 44
const DEFAULT_FROZEN_WIDTH = 160

const checkboxClassName = 'h-4 w-4 cursor-pointer accent-primary-accent disabled:cursor-not-allowed disabled:opacity-40'

// Sticky offsets/widths must be computed (Tailwind can't express dynamic arbitrary values),
// so frozen cells use a small inline style — the one documented exception (UI guidelines §1/§8).
function frozenCellStyle(left: number, width: number): CSSProperties {
  return { left, width, minWidth: width, maxWidth: width }
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  loadingLabel = 'Loading records...',
  emptyMessage = 'No records found.',
  minWidthClassName = 'min-w-[1080px]',
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  isRowSelectable,
  bulkActions,
  sortKey,
  sortDirection = 'asc',
  onSortChange,
}: DataTableProps<T>) {
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const selectableIds = useMemo(
    () => rows.filter((row) => !isRowSelectable || isRowSelectable(row)).map(rowKey),
    [rows, isRowSelectable, rowKey],
  )
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedSet.has(id))
  const someSelected = selectableIds.some((id) => selectedSet.has(id))

  const selectAllRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected
    }
  }, [someSelected, allSelected])

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange?.(selectedIds.filter((id) => !selectableIds.includes(id)))
    } else {
      onSelectionChange?.(Array.from(new Set([...selectedIds, ...selectableIds])))
    }
  }

  const toggleRow = (id: string) => {
    if (selectedSet.has(id)) {
      onSelectionChange?.(selectedIds.filter((existing) => existing !== id))
    } else {
      onSelectionChange?.([...selectedIds, id])
    }
  }

  // Cumulative left offset per frozen column (after the optional checkbox column).
  const frozenLeft = useMemo(() => {
    const offsets = new Map<string, number>()
    let acc = selectable ? CHECKBOX_COLUMN_WIDTH : 0
    for (const column of columns) {
      if (column.frozen) {
        offsets.set(column.key, acc)
        acc += column.width ?? DEFAULT_FROZEN_WIDTH
      }
    }
    return offsets
  }, [columns, selectable])

  const lastFrozenKey = useMemo(
    () => [...columns].reverse().find((column) => column.frozen)?.key,
    [columns],
  )

  const totalColumnCount = columns.length + (selectable ? 1 : 0)

  const headerCellClass = (column: DataTableColumn<T>) => {
    const base = ['px-5 py-3', column.align === 'right' ? 'text-right' : 'text-left']
    if (column.frozen) {
      base.push('sticky z-20 bg-surface-tint')
      if (column.key === lastFrozenKey) base.push('border-r border-divider')
    }
    if (column.headerClassName) base.push(column.headerClassName)
    return base.join(' ')
  }

  const bodyCellClass = (column: DataTableColumn<T>) => {
    const base = ['px-5 py-4', column.align === 'right' ? 'text-right' : '']
    if (column.frozen) {
      base.push('sticky z-10 bg-surface group-hover:bg-row-hover')
      if (column.key === lastFrozenKey) base.push('border-r border-divider')
    }
    if (column.cellClassName) base.push(column.cellClassName)
    return base.join(' ')
  }

  const cellStyle = (column: DataTableColumn<T>): CSSProperties => {
    if (column.frozen) {
      return frozenCellStyle(frozenLeft.get(column.key) ?? 0, column.width ?? DEFAULT_FROZEN_WIDTH)
    }
    return column.width ? { minWidth: column.width } : {}
  }

  const renderHeaderContent = (column: DataTableColumn<T>) => {
    if (!column.sortKey || !onSortChange) {
      return column.header
    }

    const active = sortKey === column.sortKey
    const SortIcon = active
      ? sortDirection === 'desc'
        ? ArrowDownwardRoundedIcon
        : ArrowUpwardRoundedIcon
      : UnfoldMoreRoundedIcon

    return (
      <button
        type="button"
        onClick={() => onSortChange(column.sortKey as string)}
        aria-label={`Sort by ${typeof column.header === 'string' ? column.header : column.key}`}
        className={[
          'inline-flex cursor-pointer items-center gap-1 uppercase tracking-[0.12em] transition-colors rounded-md',
          column.align === 'right' ? 'flex-row-reverse' : '',
          active ? 'text-ink' : 'hover:text-ink',
        ].join(' ')}
      >
        <span>{column.header}</span>
        <SortIcon fontSize="small" className={active ? 'text-primary-accent' : 'text-meter-muted'} />
      </button>
    )
  }

  const selectedCount = selectableIds.filter((id) => selectedSet.has(id)).length

  return (
    <div>
      {selectable && bulkActions && selectedCount > 0 ? (
        <div className="flex flex-col gap-3 border-b border-divider bg-surface-tint px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-ink">{selectedCount} selected</p>
          <div className="flex flex-wrap items-center gap-2">{bulkActions(selectedIds)}</div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className={['table-auto border-collapse', minWidthClassName].join(' ')}>
          <thead>
            <tr className="border-b border-divider bg-surface-tint text-left text-xs font-semibold uppercase tracking-[0.12em] text-label">
              {selectable ? (
                <th className="sticky left-0 z-20 bg-surface-tint px-5 py-3" style={frozenCellStyle(0, CHECKBOX_COLUMN_WIDTH)}>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    aria-label="Select all rows"
                    className={checkboxClassName}
                    checked={allSelected}
                    disabled={selectableIds.length === 0}
                    onChange={toggleAll}
                  />
                </th>
              ) : null}
              {columns.map((column) => (
                <th key={column.key} className={headerCellClass(column)} style={cellStyle(column)}>
                  {renderHeaderContent(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }, (_, rowIndex) => (
                <tr key={rowIndex} className="group border-b border-row-divider last:border-b-0">
                  {selectable ? (
                    <td className="sticky left-0 z-10 bg-surface px-5 py-4" style={frozenCellStyle(0, CHECKBOX_COLUMN_WIDTH)}>
                      <span className="block h-4 w-4 animate-pulse bg-skeleton" />
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td key={column.key} className={bodyCellClass(column)} style={cellStyle(column)}>
                      <span className="block h-4 w-full max-w-[150px] animate-pulse bg-skeleton" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={totalColumnCount} className="px-5 py-12 text-center text-sm text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = rowKey(row)
                const rowSelectable = !isRowSelectable || isRowSelectable(row)
                return (
                  <tr
                    key={id}
                    className="group border-b border-row-divider text-sm text-cell last:border-b-0 hover:bg-row-hover"
                  >
                    {selectable ? (
                      <td className="sticky left-0 z-10 bg-surface px-5 py-4 group-hover:bg-row-hover" style={frozenCellStyle(0, CHECKBOX_COLUMN_WIDTH)}>
                        <input
                          type="checkbox"
                          aria-label="Select row"
                          className={checkboxClassName}
                          checked={selectedSet.has(id)}
                          disabled={!rowSelectable}
                          onChange={() => toggleRow(id)}
                        />
                      </td>
                    ) : null}
                    {columns.map((column) => (
                      <td key={column.key} className={bodyCellClass(column)} style={cellStyle(column)}>
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {loading ? (
        <div className="sr-only" aria-live="polite" aria-busy="true">
          {loadingLabel}
        </div>
      ) : null}
    </div>
  )
}
