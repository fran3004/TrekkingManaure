import { escapeXml } from './referencias';

export type StyleDef = {
  font?: { bold?: boolean; italic?: boolean; underline?: boolean; size?: number; color?: string };
  fill?: string;
  numFmt?: string;
  align?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'center' | 'bottom';
    wrap?: boolean;
    indent?: number;
  };
  border?: 'fina' | 'inferior' | 'entrada' | 'superior' | 'tarjeta';
};

export type DxfDef = { color?: string; fill?: string; bold?: boolean };

export type StyleSheet = {
  xml: string;
  style: Record<string, number>;
  dxf: Record<string, number>;
};

const builtInFormats: Record<string, number> = { General: 0, '0': 1, '0%': 9, '0.0%': 10 };

const borders = {
  ninguno: '<border><left/><right/><top/><bottom/><diagonal/></border>',
  fina: sides(['left', 'right', 'top', 'bottom'], 'thin', 'D9D2BC'),
  inferior: sides(['bottom'], 'medium', 'F2C14E'),
  entrada: sides(['left', 'right', 'top', 'bottom'], 'medium', 'F2C14E'),
  superior: sides(['top'], 'thin', '0B2E26'),
  tarjeta: sides(['left', 'right'], 'thick', 'FFFFFF'),
};

function sides(active: string[], style: string, color: string) {
  const side = (name: string) =>
    active.includes(name)
      ? '<' + name + ' style="' + style + '"><color rgb="FF' + color + '"/></' + name + '>'
      : '<' + name + '/>';
  return (
    '<border>' + ['left', 'right', 'top', 'bottom'].map(side).join('') + '<diagonal/></border>'
  );
}

function fontXml(font: StyleDef['font'] = {}) {
  return (
    '<font>' +
    (font.bold ? '<b/>' : '') +
    (font.italic ? '<i/>' : '') +
    (font.underline ? '<u/>' : '') +
    '<sz val="' +
    (font.size ?? 11) +
    '"/><color rgb="FF' +
    (font.color ?? '1F2A24') +
    '"/><name val="Calibri"/><family val="2"/></font>'
  );
}

function fillXml(color?: string) {
  return color
    ? '<fill><patternFill patternType="solid"><fgColor rgb="FF' +
        color +
        '"/><bgColor indexed="64"/></patternFill></fill>'
    : '<fill><patternFill patternType="none"/></fill>';
}

function alignmentXml(align: StyleDef['align']) {
  if (!align) return '';
  const attributes = [
    align.horizontal && 'horizontal="' + align.horizontal + '"',
    align.vertical && 'vertical="' + align.vertical + '"',
    align.wrap && 'wrapText="1"',
    align.indent && 'indent="' + align.indent + '"',
  ].filter(Boolean);
  return '<alignment ' + attributes.join(' ') + '/>';
}

function dxfXml(def: DxfDef) {
  const font =
    def.color || def.bold
      ? '<font>' +
        (def.bold ? '<b/>' : '') +
        (def.color ? '<color rgb="FF' + def.color + '"/>' : '') +
        '</font>'
      : '';
  const fill = def.fill
    ? '<fill><patternFill patternType="solid"><bgColor rgb="FF' +
      def.fill +
      '"/></patternFill></fill>'
    : '';
  return '<dxf>' + font + fill + '</dxf>';
}

// Deduplica fuentes, rellenos y formatos para construir styles.xml.
export function buildStyleSheet(
  styles: Record<string, StyleDef>,
  dxfs: Record<string, DxfDef>,
): StyleSheet {
  const fonts = [fontXml()];
  const fills = [fillXml(), '<fill><patternFill patternType="gray125"/></fill>'];
  const borderList = Object.values(borders);
  const borderKeys = Object.keys(borders);
  const customFormats: string[] = [];
  const xfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
  const style: Record<string, number> = { normal: 0 };

  const indexOf = (list: string[], item: string) => {
    const found = list.indexOf(item);
    if (found >= 0) return found;
    list.push(item);
    return list.length - 1;
  };

  for (const [name, def] of Object.entries(styles)) {
    const fontId = indexOf(fonts, fontXml(def.font));
    const fillId = def.fill ? indexOf(fills, fillXml(def.fill)) : 0;
    const borderId = def.border ? borderKeys.indexOf(def.border) : 0;
    const format = def.numFmt ?? 'General';
    const numFmtId =
      format in builtInFormats ? builtInFormats[format] : 164 + indexOf(customFormats, format);
    const alignment = alignmentXml(def.align);

    xfs.push(
      '<xf numFmtId="' +
        numFmtId +
        '" fontId="' +
        fontId +
        '" fillId="' +
        fillId +
        '" borderId="' +
        borderId +
        '" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"' +
        (alignment ? ' applyAlignment="1">' + alignment + '</xf>' : '/>'),
    );
    style[name] = xfs.length - 1;
  }

  const dxf: Record<string, number> = {};
  const dxfList = Object.entries(dxfs).map(([name, def], index) => {
    dxf[name] = index;
    return dxfXml(def);
  });

  const xml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="' +
    customFormats.length +
    '">' +
    customFormats
      .map(
        (code, index) =>
          '<numFmt numFmtId="' + (164 + index) + '" formatCode="' + escapeXml(code) + '"/>',
      )
      .join('') +
    '</numFmts>' +
    '<fonts count="' +
    fonts.length +
    '">' +
    fonts.join('') +
    '</fonts>' +
    '<fills count="' +
    fills.length +
    '">' +
    fills.join('') +
    '</fills>' +
    '<borders count="' +
    borderList.length +
    '">' +
    borderList.join('') +
    '</borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="' +
    xfs.length +
    '">' +
    xfs.join('') +
    '</cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '<dxfs count="' +
    dxfList.length +
    '">' +
    dxfList.join('') +
    '</dxfs>' +
    '<tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>' +
    '</styleSheet>';

  return { xml, style, dxf };
}
