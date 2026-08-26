import { AttractionItem } from '../types/attraction';

/**
 * Robust RFC 4180 CSV parser supporting quotes, commas, newlines
 */
export function parseCSV(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let row = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (row.trim()) {
        lines.push(row);
      }
      row = '';
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
    } else {
      row += char;
    }
  }

  if (row.trim()) {
    lines.push(row);
  }

  if (lines.length < 2) return [];

  // Parse header
  const headers = splitCSVRow(lines[0]).map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));

  const results: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCSVRow(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = cells[index]?.trim() || '';
    });
    results.push(obj);
  }

  return results;
}

function splitCSVRow(rowStr: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];
    const nextChar = rowStr[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells;
}

/**
 * Map generic CSV headers to our Attraction fields
 */
export function normalizeCSVRows(rows: Record<string, string>[]): Partial<AttractionItem>[] {
  return rows.map((row) => {
    // Find attraction name
    const attraction_name =
      row['attraction_name'] ||
      row['attraction'] ||
      row['name'] ||
      row['title'] ||
      row['place'] ||
      row['point_of_interest'] ||
      '';

    // Find city
    const city =
      row['city'] ||
      row['town'] ||
      row['municipality'] ||
      row['location_city'] ||
      '';

    // Find country
    const country =
      row['country'] ||
      row['nation'] ||
      row['state_country'] ||
      '';

    // Find attraction url
    const attraction_url =
      row['attraction_url'] ||
      row['url'] ||
      row['website'] ||
      row['link'] ||
      '';

    // Find notes
    const notes =
      row['notes'] ||
      row['comment'] ||
      row['comments'] ||
      row['instructions'] ||
      '';

    return {
      attraction_name: attraction_name.trim(),
      city: city.trim(),
      country: country.trim(),
      attraction_url: attraction_url.trim(),
      notes: notes.trim(),
    };
  }).filter(item => item.attraction_name && item.attraction_name.length > 0);
}

/**
 * Parse pasted text from spreadsheet (Tab-separated) or comma/pipe separated
 */
export function parsePastedText(rawText: string): Partial<AttractionItem>[] {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items: Partial<AttractionItem>[] = [];

  for (const line of lines) {
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t').map(p => p.trim());
    } else if (line.includes('|')) {
      parts = line.split('|').map(p => p.trim());
    } else if (line.includes(',')) {
      parts = splitCSVRow(line).map(p => p.trim());
    } else {
      parts = [line];
    }

    if (parts.length > 0 && parts[0]) {
      // Check if this line is header like "Attraction Name, City, Country"
      if (
        parts[0].toLowerCase().includes('attraction') &&
        (parts[1]?.toLowerCase().includes('city') || parts[2]?.toLowerCase().includes('country'))
      ) {
        continue;
      }

      items.push({
        attraction_name: parts[0],
        city: parts[1] || '',
        country: parts[2] || '',
        attraction_url: parts[3] || '',
        notes: parts[4] || '',
      });
    }
  }

  return items;
}

/**
 * Export attractions to CSV strictly with required columns
 */
export function exportToCSV(items: AttractionItem[], filename = 'attraction_content.csv') {
  const headers = [
    'attraction_name',
    'city',
    'country',
    'heading',
    'content',
    'plan_your_visit',
    'nearby_attractions',
    'full_content',
    'word_count',
    'status',
    'quality_status',
    'source_urls',
    'notes',
  ];

  const rows = items.map((item) => {
    const sourceUrls = (item.research?.sources || []).map(s => s.url).filter(Boolean).join('; ');
    return [
      escapeCSVCell(item.attraction_name),
      escapeCSVCell(item.city || ''),
      escapeCSVCell(item.country || ''),
      escapeCSVCell(item.heading || ''),
      escapeCSVCell(item.content || ''),
      escapeCSVCell(item.plan_your_visit || ''),
      escapeCSVCell(item.nearby_attractions || ''),
      escapeCSVCell(item.full_content || ''),
      item.word_count || 0,
      escapeCSVCell(item.status),
      escapeCSVCell(item.quality_status || 'pending'),
      escapeCSVCell(sourceUrls),
      escapeCSVCell(item.notes || ''),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export attractions to formatted JSON
 */
export function exportToJSON(items: AttractionItem[], filename = 'attractions.json') {
  const jsonContent = JSON.stringify(items, null, 2);
  downloadBlob(jsonContent, filename, 'application/json;charset=utf-8;');
}

function escapeCSVCell(val: string | number): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
