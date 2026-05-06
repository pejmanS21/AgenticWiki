import type { SelectHTMLAttributes } from "react";
import styles from "./Form.module.css";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ label, children, ...props }: Props) {
  return (
    <label className={styles.field}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <select className={styles.select} {...props}>
        {children}
      </select>
    </label>
  );
}

