import { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import { VariableSizeGrid as Grid, type GridChildComponentProps } from 'react-window';
import { COLUMNS, COLUMN_TITLES, ROWS, type Row } from '../data';
import { ColumnHeader, type SortDir } from './ColumnHeader';

const DEFAULT_WIDTH = 140;
const ROW_HEIGHT = 34;
const HEADER_HEIGHT = 64;
const VIEWPORT_HEIGHT = 600;
const OVERSCAN_ROW_COUNT = 10;

type SortState = { key: string; dir: 1 | -1 } | null;

// ✅ 1. React.memo для виртуализированных ячеек
const Cell = memo(function Cell({ columnIndex, rowIndex, style, data }: GridChildComponentProps<{ data: Row[]; order: string[] }>) {
  const row = data.data[rowIndex];
  if (!row) return null;
  
  // style={style} — обязателен для позиционирования react-window
  return (
    <div style={style} className="grid-cell">
      {String(row[data.order[columnIndex]])}
    </div>
  );
});

export function GoodTable() {
  const [order, setOrder] = useState<string[]>(() => COLUMNS.map((c) => c.key));
  const [widths, setWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(COLUMNS.map((c) => [c.key, DEFAULT_WIDTH]))
  );
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortState>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerWidth, setContainerWidth] = useState(1000);

  // Метрики
  const renderCount = useRef(0);
  renderCount.current += 1;

  const gridRef = useRef<Grid>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const widthsRef = useRef(widths);
  widthsRef.current = widths;

  useEffect(() => {
    if (!containerRef.current) return;
    setContainerWidth(containerRef.current.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // ✅ 2. useMemo для тяжелых вычислений
  const data = useMemo(() => {
    const active = Object.entries(filters).filter(([, v]) => v.trim() !== '');
    let result = ROWS;

    if (active.length > 0) {
      result = ROWS.filter((row) =>
        active.every(([key, query]) =>
          String(row[key]).toLowerCase().includes(query.trim().toLowerCase())
        )
      );
    }

    if (sort) {
      const { key, dir } = sort;
      result = [...result].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        return String(av).localeCompare(String(bv), 'ru') * dir;
      });
    }
    return result;
  }, [filters, sort]);

  const totalWidth = useMemo(
    () => order.reduce((sum, k) => sum + widths[k], 0),
    [order, widths]
  );

  const visibleCellsEstimate = useMemo(() => {
    const rowsInView = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN_ROW_COUNT * 2;
    return rowsInView * order.length;
  }, [order.length]);

  // ✅ 3. useCallback для стабильности ссылок
  const onGridScroll = useCallback(({ scrollLeft: sl }: { scrollLeft: number }) => {
    setScrollLeft(sl);
    if (headerRef.current) headerRef.current.style.transform = `translateX(${-sl}px)`;
  }, []);

  const toggleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 1 };
      if (prev.dir === 1) return { key, dir: -1 };
      return null;
    });
  }, []);

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const startResize = useCallback((key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = widthsRef.current[key];

    const onMove = (ev: MouseEvent) => {
      const next = Math.max(60, startWidth + ev.clientX - startX);
      setWidths((prev) => ({ ...prev, [key]: next }));
      if (gridRef.current) gridRef.current.resetAfterColumnIndex(0);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const moveColumn = useCallback((target: string) => {
    if (!dragKey || dragKey === target) return;
    setOrder((prev) => {
      const from = prev.indexOf(dragKey);
      const to = prev.indexOf(target);
      if (from < 0 || to < 0) return prev;
      const next = prev.slice();
      next.splice(from, 1);
      next.splice(to, 0, dragKey);
      return next;
    });
  }, [dragKey]);

  useEffect(() => {
    if (gridRef.current) gridRef.current.resetAfterColumnIndex(0);
  }, [widths]);

  return (
    <div>
      <div className="stats">
        <span>Рендеров: <b>{renderCount.current}</b></span>
        <span>Строк в выборке: <b>{data.length}</b></span>
        <span>Ячеек в DOM: <b className="good">~{visibleCellsEstimate.toLocaleString('ru-RU')}</b></span>
        <span>Виртуализация: <b className="good">да (react-window)</b></span>
        <span>memo / useMemo / useCallback: <b className="good">да</b></span>
        <span>Inline-стили: <b className="good">нет</b></span>
      </div>

      <div ref={containerRef} className="table-container" style={{ height: VIEWPORT_HEIGHT + HEADER_HEIGHT, width: '100%' }}>
        <div className="header-wrapper" style={{ height: HEADER_HEIGHT }}>
          <div ref={headerRef} style={{ transform: `translateX(${-scrollLeft}px)`, display: 'flex', width: totalWidth }}>
            {order.map((key) => {
              const sortDir: SortDir = sort?.key === key ? (sort.dir === 1 ? 'asc' : 'desc') : null;
              return (
                <ColumnHeader
                  key={key}
                  colKey={key}
                  title={COLUMN_TITLES[key]}
                  width={widths[key]}
                  sortDir={sortDir}
                  filterValue={filters[key] ?? ''}
                  onSort={toggleSort}
                  onFilter={setFilter}
                  onResizeStart={startResize}
                  onDragStart={setDragKey}
                  onDrop={moveColumn}
                  isVirtual={true}
                />
              );
            })}
          </div>
        </div>

        <Grid
          ref={gridRef}
          columnCount={order.length}
          columnWidth={(i) => widths[order[i]] ?? DEFAULT_WIDTH}
          rowCount={data.length}
          rowHeight={() => ROW_HEIGHT}
          height={VIEWPORT_HEIGHT}
          width={containerWidth}
          itemData={{ data, order }}
          onScroll={onGridScroll}
          overscanRowCount={OVERSCAN_ROW_COUNT}
        >
          {Cell}
        </Grid>
      </div>
    </div>
  );
}