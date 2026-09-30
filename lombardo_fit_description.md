# Lombardo dataset: suitable source papers

The Lombardo dataset is best suited to papers that characterize **how a drug distributes and is eliminated in humans after intravenous administration**. It compiles data for 1,352 compounds, drawing on published literature and regulatory reports, with additional sources supplying plasma protein-binding measurements. Its central endpoints are systemic clearance, steady-state volume of distribution (Vdss), terminal half-life, mean residence time (MRT), and fraction unbound in plasma. [Lombardo et al., 2018](https://pubmed.ncbi.nlm.nih.gov/30115648/)

Based on the dataset’s references and curation notes, the strongest source papers include:

- **Human intravenous PK studies** that report numerical parameters in tables or text, with clear units and descriptions of how they were calculated.
- **Phase I and dose-escalation studies**, including studies in patients, when the PK results can be associated with a specific dose, cohort, and dosing occasion.
- **Absolute-bioavailability studies with an intravenous arm**, including intravenous tracer studies, when the IV measurements can be distinguished from the oral measurements.
- **Studies with usable concentration–time curves**, even when the desired endpoints are not explicitly tabulated. Lombardo sometimes digitized these curves and calculated parameters independently.
- **Human plasma protein-binding studies** that provide the fraction unbound, or sufficient information to calculate it. These can support the binding endpoint without providing intravenous PK data.

A paper does **not need to report all five endpoints** to be useful. One source might provide clearance and half-life, another might supply protein binding, and a third might contain the concentration–time data needed to derive missing parameters. Each Lombardo row represents a compound, so its values can incorporate evidence from multiple papers, doses, or participant groups rather than reproduce a single study’s results.

For reliable extraction, the most useful papers clearly identify the compound and measured analyte, administration route, dose, infusion duration, sampling schedule, participant count, and study population. Body weight or body-surface-area information helps interpret normalized values. Tables and figures should distinguish individual dose groups, single versus repeated dosing, and parent drug versus metabolites. These details matter because Lombardo’s notes document operations such as averaging across cohorts, converting units, normalizing by body weight, and recalculating parameters from plots. [Dataset and curation notes](data/dataset.json)

For screening purposes, animal-only studies, oral-only studies without an IV comparator, efficacy papers without usable PK measurements, and prediction-only studies are generally poor fits for the core intravenous endpoints. Papers reporting related quantities also require careful interpretation: renal clearance is not interchangeable with total systemic clearance, and a terminal-phase volume of distribution is not automatically Vdss. Likewise, a figure can support a derivation without directly reporting the final Lombardo value; the extraction should preserve that distinction and document any calculation or assumption.
