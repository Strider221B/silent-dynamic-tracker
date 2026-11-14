import {
  BASE_CSV_HEADERS,
  CSV_FILE_EXTENSION,
  CSV_FILENAME_PREFIX,
  CSV_MIME_TYPE,
} from "@/constants/exportConstants";
import type { ISummaryIndex, ISummaryIndexEntry } from "@/types/summaryIndex";

/**
 * Service transforming summary index records into RFC-4180 compliant CSV exports.
 */
export class CsvExportService {
  private static readonly _MIME_TYPE = CSV_MIME_TYPE;
  private static readonly _FILE_PREFIX = CSV_FILENAME_PREFIX;
  private static readonly _EXTENSION = CSV_FILE_EXTENSION;
  private static readonly _LINE_SEPARATOR = "\r\n";
  private static readonly _VALUE_DELIMITER = ",";
  private static readonly _ARRAY_DELIMITER = ", ";
  private static readonly _YES_LABEL = "Yes";
  private static readonly _NO_LABEL = "No";

  /**
   * Initializes CsvExportService.
   */
  constructor() {
    // Stateless service
  }

  /**
   * Generates a flat RFC-4180 CSV string from the in-memory summary index.
   */
  public generateCsv(index: ISummaryIndex): string {
    if (!index || index.length === 0) {
      return "";
    }

    const mcqKeys = this._extractMcqKeys(index);
    const headerRow = this._buildHeaderRow(mcqKeys);

    const dataRows = index.map((entry) => this._buildDataRow(entry, mcqKeys));
    return [headerRow, ...dataRows].join(CsvExportService._LINE_SEPARATOR);
  }

  /**
   * Generates CSV content from summary index and triggers a browser file download.
   */
  public downloadCsv(index: ISummaryIndex): void {
    const csvContent = this.generateCsv(index);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `${CsvExportService._FILE_PREFIX}${dateStamp}${CsvExportService._EXTENSION}`;
    this._triggerDownload(csvContent, fileName);
  }

  private _extractMcqKeys(index: ISummaryIndex): string[] {
    const keySet = new Set<string>();
    for (const entry of index) {
      if (entry.mcq_responses) {
        Object.keys(entry.mcq_responses).forEach((key) => keySet.add(key));
      }
    }
    return Array.from(keySet);
  }

  private _buildHeaderRow(mcqKeys: string[]): string {
    const formattedMcqHeaders = mcqKeys.map((key) =>
      this._formatHeaderLabel(key),
    );
    const allHeaders = [...BASE_CSV_HEADERS, ...formattedMcqHeaders];
    return allHeaders
      .map((header) => this._escapeCsvValue(header))
      .join(CsvExportService._VALUE_DELIMITER);
  }

  private _buildDataRow(
    entry: ISummaryIndexEntry,
    mcqKeys: string[],
  ): string {
    const customEntriesExistStr = entry.custom_entries_exist
      ? CsvExportService._YES_LABEL
      : CsvExportService._NO_LABEL;

    const baseValues: Array<string | number | boolean | null | undefined> = [
      entry.date,
      entry.location,
      entry.weather_summary,
      entry.aqi_summary,
      customEntriesExistStr,
    ];

    const mcqValues = mcqKeys.map((key) => {
      const response = entry.mcq_responses ? entry.mcq_responses[key] : null;
      if (Array.isArray(response)) {
        return response.join(CsvExportService._ARRAY_DELIMITER);
      }
      return response ?? "";
    });

    return [...baseValues, ...mcqValues]
      .map((val) => this._escapeCsvValue(val))
      .join(CsvExportService._VALUE_DELIMITER);
  }

  private _formatHeaderLabel(key: string): string {
    return key
      .split(/[_-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  private _escapeCsvValue(
    value: string | number | boolean | null | undefined,
  ): string {
    if (value === null || value === undefined) {
      return "";
    }
    const stringValue = String(value);
    const needsQuoting =
      stringValue.includes('"') ||
      stringValue.includes(",") ||
      stringValue.includes("\n") ||
      stringValue.includes("\r");

    if (needsQuoting) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  private _triggerDownload(content: string, fileName: string): void {
    const blob = new Blob([content], { type: CsvExportService._MIME_TYPE });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}
