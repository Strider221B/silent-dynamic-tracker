import type { ChangeEvent } from "react";
import {
  LOCATION_LABEL,
  LOCATION_PLACEHOLDER,
} from "@/constants/checklistConstants";
import styles from "./LocationInput.module.css";

export interface ILocationInputProps {
  location: string;
  onChange: (location: string) => void;
  placeholder?: string;
}

const INPUT_ID = "location-input-field" as const;

/**
 * Text input component for capturing manual user location for weather enrichment.
 */
export function LocationInput({
  location,
  onChange,
  placeholder = LOCATION_PLACEHOLDER,
}: ILocationInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.value);
  };

  return (
    <section className={styles.locationContainer}>
      <label htmlFor={INPUT_ID} className={styles.locationLabel}>
        {LOCATION_LABEL}
      </label>
      <input
        id={INPUT_ID}
        type="text"
        className={styles.locationInput}
        value={location}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </section>
  );
}

export default LocationInput;
