# Lombardo human PK viewer

A lightweight, static viewer for the 1,352-compound human intravenous PK dataset from [Lombardo, Berellini & Obach (2018)](https://pubmed.ncbi.nlm.nih.gov/30115648/), styled with the GXL technical-blog theme.

## Open

Open `viewer/index.html` directly in a browser, or run from the repository root:

```sh
uv run viewer
```

Visit http://localhost:8765/viewer/. Change the port with `uv run viewer --port 9000`. The first run installs the local command automatically. The viewer has no runtime dependencies or API calls. The optional Google Fonts request falls back to local system fonts offline.

Viewer code and styles live in `viewer/`. Source and generated datasets remain in the separate top-level `data/` folder, with the data preparation script in `scripts/`.

## Features

- Search names, CAS numbers, original SMILES, references, comments, and notes.
- Filter by source ionization state, numeric endpoint range, or complete PK coverage.
- Sort all table columns and paginate 25 records at a time; missing values always sort last.
- Open any compound for all 20 source fields, original references, and workbook row number.
- Scatter plots of filtered records with selectable endpoints/descriptors, linear/log axes, and point selection.
- Export all filtered records (not just the current page), or download the full CSV, JSON, and original workbook.
- Responsive layout, keyboard-accessible controls, native modal focus handling, and a table alternative to the plot.

## Data provenance

The publisher download returned HTTP 403. The workbook was downloaded on 2026-09-23 from the [U.S. EPA CompTox-ExpoCast-httk mirror](https://github.com/USEPA/CompTox-ExpoCast-httk/blob/main/datatables/Lombardo2018-Supplemental_82966_revised_corrected.xlsx), file `Lombardo2018-Supplemental_82966_revised_corrected.xlsx`.

SHA-256: `4c462bf75759b657e0c90542434a83610fe65d8c00ca164decab3955da75a7fb`.

The converter reads the first worksheet, headers at row 9 and records beginning at row 10. It retains all 1,352 rows and 20 columns. Blank and `n/a` numeric cells become JSON null; values are not imputed, converted between units, or deduplicated. Original cells remain available in the workbook. Values display to six significant figures; exports retain the parsed source precision. Log plots exclude zero/negative values and report exclusions.

Non-missing PK counts: VDss 1,315; CL 1,350; fraction unbound 920; MRT 1,309; terminal half-life 1,335.

This is a compound-level compilation, not a dataset of patient observations or concentration–time curves. References and comments carry study and derivation context. Consult the original authors' data terms before redistribution; this project does not grant a new license to the source data.

To reproduce the browser data and CSV using the Python standard library:

```sh
uv run scripts/prepare_data.py
```

`viewer/theme.css` is copied verbatim from the GXL blog design skill; `viewer/viewer.css` adds viewer controls using its tokens. `data/provenance.json` records the source and checksum.
