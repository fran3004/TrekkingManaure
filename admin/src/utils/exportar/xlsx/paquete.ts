import { buildStyleSheet, type DxfDef, type StyleDef } from './estilos';
import { chartXml, drawingXml } from './graficos';
import { sheetXml, tableXml, type Sheet } from './hoja';
import { escapeXml } from './referencias';
import { createZip, type ZipEntry } from './zip';

export type DefinedName = { name: string; ref: string };

export type Workbook = {
  title: string;
  sheets: Sheet[];
  styles: Record<string, StyleDef>;
  dxfs: Record<string, DxfDef>;
  names: DefinedName[];
};

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const MIME = 'application/vnd.openxmlformats-officedocument';

function relationships(items: { id: string; type: string; target: string }[]) {
  return (
    XML +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    items
      .map(
        (item) =>
          '<Relationship Id="' +
          item.id +
          '" Type="' +
          REL +
          '/' +
          item.type +
          '" Target="' +
          item.target +
          '"/>',
      )
      .join('') +
    '</Relationships>'
  );
}

export function buildXlsx(workbook: Workbook) {
  const styles = buildStyleSheet(workbook.styles, workbook.dxfs);
  const entries: ZipEntry[] = [];
  const overrides: string[] = [];
  let tableId = 0;
  let chartId = 0;

  workbook.sheets.forEach((sheet, index) => {
    const number = index + 1;
    const sheetRelations: { id: string; type: string; target: string }[] = [];
    let drawing: string | null = null;

    if (sheet.charts.length) {
      drawing = 'rId1';
      sheetRelations.push({
        id: drawing,
        type: 'drawing',
        target: '../drawings/drawing' + number + '.xml',
      });
      const chartRelations = sheet.charts.map((chart, chartIndex) => {
        chartId += 1;
        entries.push({ path: 'xl/charts/chart' + chartId + '.xml', content: chartXml(chart) });
        overrides.push('/xl/charts/chart' + chartId + '.xml|drawingml.chart+xml');
        return {
          id: 'rId' + (chartIndex + 1),
          type: 'chart',
          target: '../charts/chart' + chartId + '.xml',
        };
      });
      entries.push({
        path: 'xl/drawings/drawing' + number + '.xml',
        content: drawingXml(
          sheet.charts,
          chartRelations.map((relation) => relation.id),
        ),
      });
      entries.push({
        path: 'xl/drawings/_rels/drawing' + number + '.xml.rels',
        content: relationships(chartRelations),
      });
      overrides.push('/xl/drawings/drawing' + number + '.xml|drawing+xml');
    }

    const tables = sheet.tables.map((table) => {
      tableId += 1;
      const id = 'rId' + (sheetRelations.length + 1);
      sheetRelations.push({ id, type: 'table', target: '../tables/table' + tableId + '.xml' });
      entries.push({
        path: 'xl/tables/table' + tableId + '.xml',
        content: tableXml(table, tableId),
      });
      overrides.push('/xl/tables/table' + tableId + '.xml|spreadsheetml.table+xml');
      return id;
    });

    entries.push({
      path: 'xl/worksheets/sheet' + number + '.xml',
      content: sheetXml(sheet, styles.style, styles.dxf, index === 0, { drawing, tables }),
    });
    overrides.push('/xl/worksheets/sheet' + number + '.xml|spreadsheetml.worksheet+xml');
    if (sheetRelations.length) {
      entries.push({
        path: 'xl/worksheets/_rels/sheet' + number + '.xml.rels',
        content: relationships(sheetRelations),
      });
    }
  });

  entries.push({
    path: 'xl/workbook.xml',
    content:
      XML +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="' +
      REL +
      '"><bookViews><workbookView activeTab="0"/></bookViews><sheets>' +
      workbook.sheets
        .map(
          (sheet, index) =>
            '<sheet name="' +
            escapeXml(sheet.name) +
            '"' +
            (sheet.oculta ? ' state="hidden"' : '') +
            ' sheetId="' +
            (index + 1) +
            '" r:id="rId' +
            (index + 1) +
            '"/>',
        )
        .join('') +
      '</sheets><definedNames>' +
      workbook.names
        .map(
          (item) =>
            '<definedName name="' + item.name + '">' + escapeXml(item.ref) + '</definedName>',
        )
        .join('') +
      '</definedNames><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>',
  });
  entries.push({
    path: 'xl/_rels/workbook.xml.rels',
    content: relationships([
      ...workbook.sheets.map((_, index) => ({
        id: 'rId' + (index + 1),
        type: 'worksheet',
        target: 'worksheets/sheet' + (index + 1) + '.xml',
      })),
      { id: 'rId' + (workbook.sheets.length + 1), type: 'styles', target: 'styles.xml' },
    ]),
  });
  entries.push({ path: 'xl/styles.xml', content: styles.xml });
  entries.push({
    path: 'docProps/core.xml',
    content:
      XML +
      '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>' +
      escapeXml(workbook.title) +
      '</dc:title><dc:creator>Perijá Admin</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' +
      new Date().toISOString().slice(0, 19) +
      'Z</dcterms:created></cp:coreProperties>',
  });
  entries.push({
    path: '_rels/.rels',
    content: relationships([
      { id: 'rId1', type: 'officeDocument', target: 'xl/workbook.xml' },
    ]).replace(
      '</Relationships>',
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>',
    ),
  });
  entries.push({
    path: '[Content_Types].xml',
    content:
      XML +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="' +
      MIME +
      '.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="' +
      MIME +
      '.spreadsheetml.styles+xml"/>' +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
      overrides
        .map((item) => {
          const [part, type] = item.split('|');
          return '<Override PartName="' + part + '" ContentType="' + MIME + '.' + type + '"/>';
        })
        .join('') +
      '</Types>',
  });

  // [Content_Types].xml debe ir primero dentro del paquete.
  entries.unshift(entries.pop()!);
  return createZip(entries, MIME + '.spreadsheetml.sheet');
}
