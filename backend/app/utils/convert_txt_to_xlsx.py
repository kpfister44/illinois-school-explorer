# ABOUTME: Converts historical Illinois Report Card TXT files to XLSX format
# ABOUTME: Maps semicolon-delimited TXT fields to modern XLSX structure for 2010-2017 data

import pandas as pd
import sys
from pathlib import Path


HISTORICAL_DATA_DIR = Path(__file__).resolve().parents[3] / 'data' / 'historical-report-cards'
_RC10_RCDTS_LOOKUP: dict[tuple[str, str, str], str] | None = None


# Field mappings are defined per file family (0-indexed positions)
DEFAULT_FIELD_MAPPING = {
    # Basic information (RC10-RC14 layout)
    0: 'RCDTS',
    3: 'School Name',
    4: 'District',
    5: 'City',
    6: 'County',
    11: 'School Type',
    12: 'Grades Served',

    # Demographics (percentages)
    13: '% White',
    14: '% Black',
    15: '% Hispanic',
    16: '% Asian',
    17: '% Native Hawaiian or Other Pacific Islander',
    18: '% Native American',
    19: '% Two or More Races',

    # Enrollment
    20: '# Student Enrollment',

    # Socioeconomic
    53: '% Low-Income',

    # ACT Scores (School level only)
    253: 'ACT Composite',
    257: 'ACT ELA',
    261: 'ACT Math',
    265: 'ACT Reading',
    269: 'ACT Science',
}

RC10_GENERAL_FIELD_MAPPING = {
    0: 'RCDTS',
    2: 'School Name',
    3: 'District',
    4: 'City',
    5: 'County',
    8: 'School Type',
    11: 'Grades Served',

    12: '% White',
    13: '% Black',
    14: '% Hispanic',
    15: '% Asian',
    16: '% Native Hawaiian or Other Pacific Islander',
    17: '% Native American',

    18: '# Student Enrollment',
    40: '% EL',
    48: '% Low-Income',

    176: 'ACT Composite',
    180: 'ACT ELA',
    184: 'ACT Math',
    188: 'ACT Reading',
    192: 'ACT Science',
}


RC12_GENERAL_FIELD_MAPPING = {
    key: value for key, value in DEFAULT_FIELD_MAPPING.items()
    if key not in {253, 257, 261, 265, 269}
}
RC12_GENERAL_FIELD_MAPPING.update({
    45: '% EL',
    245: 'ACT Composite',
    249: 'ACT ELA',
    253: 'ACT Math',
    257: 'ACT Reading',
    261: 'ACT Science',
})

RC13_GENERAL_FIELD_MAPPING = DEFAULT_FIELD_MAPPING | {
    45: '% EL',
}

RC14_GENERAL_FIELD_MAPPING = DEFAULT_FIELD_MAPPING | {
    45: '% EL',
}

RC11_GENERAL_FIELD_MAPPING = {
    0: 'RCDTS',
    2: 'School Name',
    3: 'District',
    4: 'City',
    5: 'County',
    10: 'School Type',
    11: 'Grades Served',

    12: '% White',
    13: '% Black',
    14: '% Hispanic',
    15: '% Asian',
    16: '% Native Hawaiian or Other Pacific Islander',
    17: '% Native American',
    18: '% Two or More Races',

    19: '# Student Enrollment',
    44: '% EL',
    52: '% Low-Income',

    188: 'ACT Composite',
    192: 'ACT ELA',
    196: 'ACT Math',
    200: 'ACT Reading',
    204: 'ACT Science',
}

RC15_GENERAL_FIELD_MAPPING = {
    # Basic information for rc15.txt layout
    0: 'RCDTS',
    3: 'School Name',
    4: 'District',
    5: 'City',
    6: 'County',
    11: 'School Type',
    12: 'Grades Served',

    # Demographics
    13: '% White',
    14: '% Black',
    15: '% Hispanic',
    16: '% Asian',
    17: '% Native Hawaiian or Other Pacific Islander',
    18: '% Native American',
    19: '% Two or More Races',

    20: '# Student Enrollment',
    53: '% Low-Income',

    253: 'ACT Composite',
    257: 'ACT ELA',
    261: 'ACT Math',
    265: 'ACT Reading',
    269: 'ACT Science',
}


RC16_GENERAL_FIELD_MAPPING = {
    0: 'RCDTS',
    3: 'School Name',
    4: 'District',
    5: 'City',
    6: 'County',
    11: 'School Type',
    12: 'Grades Served',

    13: '% White',
    14: '% Black',
    15: '% Hispanic',
    16: '% Asian',
    17: '% Native Hawaiian or Other Pacific Islander',
    18: '% Native American',
    19: '% Two or More Races',

    20: '# Student Enrollment',
    45: '% EL',  # L.E.P. School % field 46
    53: '% Low-Income',

    365: 'ACT Composite',
    369: 'ACT ELA',
    373: 'ACT Math',
    377: 'ACT Reading',
    381: 'ACT Science',
}


RC17_GENERAL_FIELD_MAPPING = {
    0: 'RCDTS',
    3: 'School Name',
    4: 'District',
    5: 'City',
    6: 'County',
    11: 'School Type',
    12: 'Grades Served',

    13: '% White',
    14: '% Black',
    15: '% Hispanic',
    16: '% Asian',
    17: '% Native Hawaiian or Other Pacific Islander',
    18: '% Native American',
    19: '% Two or More Races',

    20: '# Student Enrollment',
    45: '% EL',
    53: '% Low-Income',

    409: 'ACT Composite',
    413: 'ACT ELA',
    417: 'ACT Math',
    421: 'ACT Reading',
    425: 'ACT Science',
}


def _select_field_mapping(txt_file_path: str) -> dict[int, str]:
    """Return the appropriate field mapping for a given TXT file."""
    name = Path(txt_file_path).name.lower()
    if 'rc17' in name and 'assessment' not in name:
        return RC17_GENERAL_FIELD_MAPPING
    if 'rc16' in name and 'assessment' not in name:
        return RC16_GENERAL_FIELD_MAPPING
    if 'rc15' in name and 'assessment' not in name:
        return RC15_GENERAL_FIELD_MAPPING
    if 'rc14' in name and 'assessment' not in name:
        return RC14_GENERAL_FIELD_MAPPING
    if 'rc13' in name and 'assessment' not in name:
        return RC13_GENERAL_FIELD_MAPPING
    if 'rc12' in name and 'assessment' not in name:
        return RC12_GENERAL_FIELD_MAPPING
    if 'rc11' in name and 'assessment' not in name:
        return RC11_GENERAL_FIELD_MAPPING
    if 'rc10' in name and 'assessment' not in name:
        return RC10_GENERAL_FIELD_MAPPING
    return DEFAULT_FIELD_MAPPING


def _normalize_text(value: str | None) -> str:
    if not value:
        return ''
    return ' '.join(value.strip().lower().split())


def _load_rc10_rcdts_lookup() -> dict[tuple[str, str, str], str]:
    global _RC10_RCDTS_LOOKUP
    if _RC10_RCDTS_LOOKUP is not None:
        return _RC10_RCDTS_LOOKUP

    lookup: dict[tuple[str, str, str], str] = {}
    rc11_path = HISTORICAL_DATA_DIR / 'rc11u.txt'
    if rc11_path.exists():
        with rc11_path.open('r', encoding='latin-1') as handle:
            for line in handle:
                fields = line.strip().split(';')
                if not fields or not fields[0].strip():
                    continue
                school_name = _normalize_text(fields[2] if len(fields) > 2 else '')
                district_name = _normalize_text(fields[3] if len(fields) > 3 else '')
                city = _normalize_text(fields[4] if len(fields) > 4 else '')
                if not school_name or not district_name:
                    continue
                rcdts = fields[0].strip()
                key_with_city = (school_name, district_name, city)
                key_without_city = (school_name, district_name, '')
                lookup.setdefault(key_with_city, rcdts)
                lookup.setdefault(key_without_city, rcdts)

    _RC10_RCDTS_LOOKUP = lookup
    return lookup


def _normalize_rc10_rcdts(row: dict[str, str]) -> str:
    rcdts = row.get('RCDTS')
    if not rcdts:
        return rcdts

    lookup = _load_rc10_rcdts_lookup()
    school_name = _normalize_text(row.get('School Name'))
    district_name = _normalize_text(row.get('District'))
    city = _normalize_text(row.get('City'))
    if not school_name or not district_name:
        return rcdts

    return lookup.get((school_name, district_name, city)) or lookup.get((school_name, district_name, '')) or rcdts


def convert_txt_to_xlsx(txt_file_path: str, output_xlsx_path: str) -> None:
    """
    Convert a semicolon-delimited TXT file to XLSX format.

    Args:
        txt_file_path: Path to input TXT file
        output_xlsx_path: Path to output XLSX file
    """
    print(f"Reading {txt_file_path}...")

    field_mapping = _select_field_mapping(txt_file_path)
    is_rc10_file = field_mapping is RC10_GENERAL_FIELD_MAPPING

    # Read the TXT file
    data = []
    with open(txt_file_path, 'r', encoding='latin-1') as f:
        for line_num, line in enumerate(f, 1):
            fields = line.strip().split(';')

            # Extract mapped fields
            row = {}
            for field_idx, column_name in field_mapping.items():
                if field_idx < len(fields):
                    value = fields[field_idx].strip()
                    # Convert empty strings to None
                    row[column_name] = value if value else None
                else:
                    row[column_name] = None

            if is_rc10_file:
                row['RCDTS'] = _normalize_rc10_rcdts(row)

            data.append(row)

            if line_num % 500 == 0:
                print(f"  Processed {line_num} schools...")

    # Create DataFrame
    df = pd.DataFrame(data)

    # Clean numeric columns - convert to proper types
    numeric_columns = [
        '% White', '% Black', '% Hispanic', '% Asian', '% Native American',
        '% Two or More Races', '% EL', '# Student Enrollment', '% Low-Income',
        'ACT Composite', 'ACT ELA', 'ACT Math', 'ACT Reading', 'ACT Science'
    ]

    for col in numeric_columns:
        if col in df.columns:
            series = df[col]
            if col == '# Student Enrollment':
                series = series.apply(
                    lambda value: value.replace(',', '') if isinstance(value, str) else value
                )
            # Replace empty/invalid values with NaN
            df[col] = pd.to_numeric(series, errors='coerce')

    print(f"  Converted {len(df)} schools")
    print(f"  Columns: {list(df.columns)}")

    # Write to XLSX with a 'General' sheet (matching modern format)
    print(f"Writing to {output_xlsx_path}...")
    with pd.ExcelWriter(output_xlsx_path, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='General', index=False)

    print(f"✓ Conversion complete: {output_xlsx_path}")
    print(f"  Schools: {len(df)}")
    print(f"  Non-null ACT scores: {df['ACT Composite'].notna().sum()}")
    print(f"  Non-null enrollment: {df['# Student Enrollment'].notna().sum()}")


def main():
    """Convert all historical TXT files to XLSX."""
    if len(sys.argv) > 1:
        # Convert single file
        txt_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else txt_file.replace('.txt', '.xlsx')
        convert_txt_to_xlsx(txt_file, output_file)
    else:
        # Convert all files in historical-report-cards directory
        historical_dir = Path('../data/historical-report-cards')
        txt_files = {
            'rc10.txt': '2010-Report-Card-Public-Data-Set.xlsx',
            'rc11u.txt': '2011-Report-Card-Public-Data-Set.xlsx',
            'rc12.txt': '2012-Report-Card-Public-Data-Set.xlsx',
            'rc13.txt': '2013-Report-Card-Public-Data-Set.xlsx',
            'rc14.txt': '2014-Report-Card-Public-Data-Set.xlsx',
            'rc15-assessment.txt': '2015-Report-Card-Public-Data-Set.xlsx',
            'rc16_assessment.txt': '2016-Report-Card-Public-Data-Set.xlsx',
            'rc17_assessment.txt': '2017-Report-Card-Public-Data-Set.xlsx',
        }

        for txt_file, xlsx_file in txt_files.items():
            txt_path = historical_dir / txt_file
            if txt_path.exists():
                output_path = historical_dir / xlsx_file
                print(f"\n{'='*60}")
                convert_txt_to_xlsx(str(txt_path), str(output_path))
            else:
                print(f"⚠ Skipping {txt_file} (file not found)")


if __name__ == '__main__':
    main()
