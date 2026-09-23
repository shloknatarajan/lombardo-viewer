"""Convert the corrected source workbook using only the Python standard library."""
import csv
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/lombardo-2018.xlsx'
URL = 'https://raw.githubusercontent.com/USEPA/CompTox-ExpoCast-httk/main/datatables/Lombardo2018-Supplemental_82966_revised_corrected.xlsx'
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
KEYS = ['name', 'cas', 'smiles', 'vdss', 'cl', 'fu', 'mrt', 'halfLife', 'reference', 'comments', 'notes', 'year', 'mw', 'hba', 'hbd', 'tpsa', 'rotBonds', 'ionState', 'logP', 'logD']
NUMERIC = {'vdss', 'cl', 'fu', 'mrt', 'halfLife', 'year', 'mw', 'hba', 'hbd', 'tpsa', 'rotBonds', 'logP', 'logD'}


def read_workbook():
    with zipfile.ZipFile(SOURCE) as z:
        strings = [''.join(t.text or '' for t in s.iterfind('.//m:t', NS))
                   for s in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS)]
        rows = []
        for row in ET.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//m:row', NS):
            values = [None] * 20
            for cell in row:
                letters = ''.join(c for c in cell.attrib['r'] if c.isalpha())
                index = 0
                for letter in letters:
                    index = index * 26 + ord(letter) - 64
                if index > 20:
                    continue
                value = cell.findtext('m:v', None, NS)
                if cell.attrib.get('t') == 's' and value is not None:
                    value = strings[int(value)]
                values[index - 1] = value
            if int(row.attrib['r']) == 9:
                headers = values
            elif int(row.attrib['r']) > 9 and values[0]:
                record = dict(zip(KEYS, values))
                record['sourceRow'] = int(row.attrib['r'])
                for key in NUMERIC:
                    value = record[key]
                    if value is not None and str(value).strip().lower() not in ('', 'n/a', 'na'):
                        try:
                            record[key] = float(value)
                        except ValueError:
                            raise ValueError(f'Unexpected numeric cell {key}: {value!r}')
                    else:
                        record[key] = None
                rows.append(record)
    return headers, rows


def main():
    headers, rows = read_workbook()
    assert len(rows) == 1352, f'Expected 1352 compounds, got {len(rows)}'
    meta = {'source': URL, 'sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
            'pmid': '30115648', 'doi': '10.1124/dmd.118.082966',
            'columns': dict(zip(KEYS, headers)), 'rowCount': len(rows)}
    payload = json.dumps({'meta': meta, 'rows': rows}, ensure_ascii=False, allow_nan=False, separators=(',', ':'))
    (ROOT / 'data/dataset.json').write_text(payload + '\n')
    (ROOT / 'data/dataset.js').write_text('window.LOMBARDO = ' + payload + ';\n')
    (ROOT / 'data/provenance.json').write_text(json.dumps(meta, indent=2) + '\n')
    with (ROOT / 'data/lombardo-2018.csv').open('w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows([record[k] for k in KEYS] for record in rows)
    print(f'Prepared {len(rows)} compounds; SHA-256 {meta["sha256"]}')


if __name__ == '__main__':
    main()
