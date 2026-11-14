import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { AQI_LABEL_TO_NUMERIC } from "@/constants/filterConstants";
import type {
  EpaIndexText,
  IEnvironmentalData,
} from "@/types/environmental";
import styles from "./EnvironmentalEditModal.module.css";

export interface IEnvironmentalEditModalProps {
  isOpen: boolean;
  initialData: IEnvironmentalData | null;
  onSave: (data: IEnvironmentalData) => Promise<void> | void;
  onClose: () => void;
  isSaving?: boolean;
}

const MODAL_TITLE = "Edit Environmental Data" as const;
const KEY_ESCAPE = "Escape" as const;
const SOURCE_MANUAL = "manual" as const;
const SAVE_BUTTON_LABEL = "Save" as const;
const SAVING_BUTTON_LABEL = "Saving..." as const;
const CANCEL_BUTTON_LABEL = "Cancel" as const;

const AQI_OPTIONS: readonly EpaIndexText[] = [
  "Good",
  "Moderate",
  "Unhealthy for Sensitive Groups",
  "Unhealthy",
  "Very Unhealthy",
  "Hazardous",
] as const;

/**
 * Modal form facilitating manual modification of temperature, condition, AQI, and PM2.5.
 */
export function EnvironmentalEditModal({
  isOpen,
  initialData,
  onSave,
  onClose,
  isSaving = false,
}: IEnvironmentalEditModalProps) {
  const [temperature, setTemperature] = useState<string>("");
  const [condition, setCondition] = useState<string>("");
  const [aqi, setAqi] = useState<EpaIndexText>("Good");
  const [pm25, setPm25] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setTemperature(initialData?.temperature ?? "");
      setCondition(initialData?.condition ?? "");
      setAqi(initialData?.aqi && initialData.aqi !== "Unknown" ? initialData.aqi : "Good");
      setPm25(
        initialData?.pm25 !== undefined && initialData?.pm25 !== null
          ? String(initialData.pm25)
          : "",
      );
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent): void => {
      if (e.key === KEY_ESCAPE) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isOpen, onClose]);

  const handleTempChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      setTemperature(e.target.value);
    },
    [],
  );

  const handleConditionChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      setCondition(e.target.value);
    },
    [],
  );

  const handleAqiChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>): void => {
      setAqi(e.target.value as EpaIndexText);
    },
    [],
  );

  const handlePm25Change = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      setPm25(e.target.value);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: FormEvent): Promise<void> => {
      e.preventDefault();
      const trimmedPm25 = pm25.trim();
      const parsedPm25 =
        trimmedPm25 !== "" ? Number.parseFloat(trimmedPm25) : null;
      const validPm25 =
        parsedPm25 !== null && !Number.isNaN(parsedPm25) ? parsedPm25 : null;

      const updatedData: IEnvironmentalData = {
        temperature: temperature.trim() || null,
        condition: condition.trim() || null,
        aqi: aqi || null,
        aqi_numeric: AQI_LABEL_TO_NUMERIC[aqi] ?? null,
        pm25: validPm25,
        source: SOURCE_MANUAL,
      };
      await onSave(updatedData);
    },
    [temperature, condition, aqi, pm25, onSave],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={MODAL_TITLE}
      className={styles.overlay}
    >
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>{MODAL_TITLE}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="env-temp" className={styles.formLabel}>
              Temperature
            </label>
            <input
              id="env-temp"
              type="text"
              className={styles.inputField}
              value={temperature}
              placeholder="e.g. 28C"
              onChange={handleTempChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="env-condition" className={styles.formLabel}>
              Condition
            </label>
            <input
              id="env-condition"
              type="text"
              className={styles.inputField}
              value={condition}
              placeholder="e.g. Sunny"
              onChange={handleConditionChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="env-aqi" className={styles.formLabel}>
              Air Quality Index (AQI)
            </label>
            <select
              id="env-aqi"
              className={styles.selectField}
              value={aqi}
              onChange={handleAqiChange}
            >
              {AQI_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="env-pm25" className={styles.formLabel}>
              PM2.5 (ug/m3)
            </label>
            <input
              id="env-pm25"
              type="number"
              step="0.1"
              min="0"
              className={styles.inputField}
              value={pm25}
              placeholder="e.g. 15.2"
              onChange={handlePm25Change}
            />
          </div>

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSaving}
            >
              {CANCEL_BUTTON_LABEL}
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSaving}
            >
              {isSaving ? SAVING_BUTTON_LABEL : SAVE_BUTTON_LABEL}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EnvironmentalEditModal;
