# Analysis data row references

In every CSV in this directory, `lombardo_row` is the 1-based compound index in [`lombardo_data/lombardo-2018.csv`](../lombardo_data/lombardo-2018.csv), excluding the header. The first compound, α-hANP, is row 1. Ascorbic acid is row 98.

These are data-record positions, not spreadsheet row numbers or text-editor line numbers: the CSV has a header, and quoted fields can contain newlines. For a zero-based data-frame index, subtract 1 from `lombardo_row`. For the row displayed when opening the CSV in a spreadsheet, add 1.

The original Excel workbook begins its compound records at worksheet row 10. Its worksheet row numbers, also retained as `sourceRow` in the JSON dataset and shown in the viewer, are therefore `lombardo_row + 9`. The analysis CSVs use the header-excluding compound index by request, rather than the original workbook's worksheet numbering.

All analysis CSV row references were checked against the compound names and aligned to the source CSV on 2026-09-30.
