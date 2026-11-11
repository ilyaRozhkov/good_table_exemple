import { COLUMNS, ROWS } from './data';
import { GoodTable } from './components/GoodTable';

export default function App() {
  return (
    <div className="app">
      <h1>
        Таблица {COLUMNS.length} колонок × {ROWS.length} строк
      </h1>
      <p className="subtitle">
        Resize колонок (тянуть за правый край) · перетаскивание колонок (drag за заголовок) ·
        сортировка (клик по заголовку) · поиск по каждой колонке.
        <br />
        <b style={{ color: '#1a7f37' }}>Оптимизировано:</b> React Compiler,
        react-window (FixedSizeGrid), useMemo, useCallback, React.memo.
      </p>

      <GoodTable />
    </div>
  );
}