export type Row = Record<string, string | number> & { id: number };

export interface ColumnDef {
  key: string;
  title: string;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ['Иван','Мария','Алексей','Ольга','Дмитрий','Екатерина','Сергей','Анна','Павел','Наталья','Роман','Татьяна','Михаил','Ирина','Андрей','Светлана','Николай','Юлия','Артём','Ксения'];
const LAST = ['Иванов','Петров','Смирнов','Кузнецов','Попов','Васильев','Соколов','Михайлов','Новиков','Фёдоров','Морозов','Волков','Алексеев','Лебедев','Семёнов','Егоров','Павлов','Козлов','Степанов','Николаев'];
const CITIES = ['Москва','Санкт-Петербург','Новосибирск','Екатеринбург','Казань','Нижний Новгород','Челябинск','Самара','Омск','Ростов-на-Дону','Уфа','Красноярск','Воронеж','Пермь','Волгоград'];
const COUNTRIES = ['Россия','Беларусь','Казахстан','Армения','Грузия','Узбекистан'];
const DEPARTMENTS = ['Разработка','Маркетинг','Продажи','Поддержка','Аналитика','HR','Финансы','Логистика'];
const POSITIONS = ['Intern','Junior','Middle','Senior','Lead','Head'];
const STATUSES = ['Активен','В отпуске','На испытательном','Уволен'];

const TRANSLIT: Record<string, string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',
  н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',
  ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
};
const translit = (s: string) =>
  s.split('').map((c) => TRANSLIT[c.toLowerCase()] ?? c).join('');

export const COLUMNS: ColumnDef[] = [
  { key: 'id',          title: 'ID' },
  { key: 'firstName',   title: 'Имя' },
  { key: 'lastName',    title: 'Фамилия' },
  { key: 'email',       title: 'Email' },
  { key: 'age',         title: 'Возраст' },
  { key: 'city',        title: 'Город' },
  { key: 'country',     title: 'Страна' },
  { key: 'department',  title: 'Отдел' },
  { key: 'position',    title: 'Должность' },
  { key: 'salary',      title: 'Зарплата' },
  { key: 'experience',  title: 'Опыт (лет)' },
  { key: 'rating',      title: 'Рейтинг' },
  { key: 'status',      title: 'Статус' },
  ...Array.from({ length: 27 }, (_, i) => ({
    key: `metric${i + 1}`,
    title: `Метрика ${i + 1}`,
  })),
];

export const COLUMN_TITLES: Record<string, string> = Object.fromEntries(
  COLUMNS.map((c) => [c.key, c.title]),
);

const ROW_COUNT = 2000;

function generateRows(count: number): Row[] {
  const rnd = mulberry32(2024);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
  const rows: Row[] = [];

  for (let i = 1; i <= count; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);

    const row: Row = {
      id: i,
      firstName: first,
      lastName: last,
      email: `${translit(first)}.${translit(last)}${i}@company.ru`,
      age: 20 + Math.floor(rnd() * 45),
      city: pick(CITIES),
      country: pick(COUNTRIES),
      department: pick(DEPARTMENTS),
      position: pick(POSITIONS),
      salary: 30000 + Math.floor(rnd() * 250000),
      experience: Math.floor(rnd() * 25),
      rating: Math.round(rnd() * 500) / 100,
      status: pick(STATUSES),
    };

    for (let m = 1; m <= 27; m++) {
      row[`metric${m}`] = Math.floor(rnd() * 10000);
    }

    rows.push(row);
  }
  return rows;
}

export const ROWS: Row[] = generateRows(ROW_COUNT);