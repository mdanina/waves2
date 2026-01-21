// Утилиты для работы со slug'ами блога

/**
 * Преобразует произвольный заголовок в slug для URL.
 * Пример: "Ещё раз о важности отдыха" -> "eshche-raz-o-vazhnosti-otdykha".
 *
 * Мы сначала транслитерируем кириллицу в латиницу, затем оставляем
 * только [a-z0-9-].
 */
export function generateSlug(title: string): string {
  const map: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ы: 'y',
    э: 'e',
    ю: 'yu',
    я: 'ya',
    ъ: '',
    ь: '',
  };

  const lower = title.trim().toLowerCase();
  let transliterated = '';

  for (const ch of lower) {
    if (map[ch]) {
      transliterated += map[ch];
    } else {
      transliterated += ch;
    }
  }

  return transliterated
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function formatBlogDate(dateIso: string | null | undefined): string {
  if (!dateIso) return '';
  const date = new Date(dateIso);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatReadingTime(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '';
  return `${minutes} мин чтения`;
}
