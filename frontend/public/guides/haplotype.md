# ASV Distribution Map
This tool visualizes how ASVs are distributed across sampling locations (**ASV Distribution Map**) and how they are related with each other (**Haplotype Network**). 

**Inputs Required:**
*   **MSA File:** Multiple sequence alignment file that contains all the sequences to be analyzed (e.g., `msa.fa`) .
*   **ASV Counts Table:** A CSV file where the first column is Location ID, the second is total ASV counts, and subsequent columns represent different ASVs (e.g., `proj_spe.tbl.csv`).
*   **Geographic Coordinates:** An Excel file with **required** column titles: `Location_ID`, `Latitude`, `Longitude` (e.g., `geo_info.xlsx`) .
*   **Map Image:** (to be uploaded or selected in **ASV Distribution Map**) An image file of the map corresponding to the sampling location coordinates.

**Outputs:**
Users can export image files, including legends, as PNG files when applicable.

**Functionalities:**
*   **ASVs Distribution Map:** Three ways to visualize the ASVs distribution across sampling sites, "By Location", "By Sequence", "By Similarity".
  *   **By Location:** rows are the sampling locations, columns are the amplicon variants
  *   **By Sequence:** rows are the amplicon variants, columns are the sampling locations
  *   **By Similarity:** users can filter out amplicon variants that fall within a specific similar range to the target sequence
*   **Haplotype Networks:** View relationships between haplotypes.

**Settings:**
*   To ensure that the geographic coordinates display correctly, users must upload or select a map image and enter its width and height.
