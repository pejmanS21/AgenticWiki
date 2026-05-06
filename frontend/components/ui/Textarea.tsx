import type { TextareaHTMLAttributes } from "react";
import styles from "./Form.module.css";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function Textarea({ label, error, ...props }: Props) {
  return (
    <label className={styles.field}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <textarea className={styles.textarea} {...props} />
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  );
}

