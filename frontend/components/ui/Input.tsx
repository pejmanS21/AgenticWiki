import type { InputHTMLAttributes } from "react";
import styles from "./Form.module.css";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, ...props }: Props) {
  return (
    <label className={styles.field}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <input className={styles.input} {...props} />
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  );
}

