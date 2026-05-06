import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
};

export function Button({ variant = "primary", loading, children, disabled, ...props }: Props) {
  return (
    <button className={`${styles.button} ${styles[variant]}`} disabled={disabled || loading} {...props}>
      {loading ? "Working…" : children}
    </button>
  );
}

