import type { HTMLAttributes } from "react";
import styles from "./Card.module.css";

type Props = HTMLAttributes<HTMLDivElement> & {
  compact?: boolean;
  interactive?: boolean;
};

export function Card({ compact, interactive, className = "", ...props }: Props) {
  const classes = [styles.card, compact ? styles.compact : "", interactive ? styles.interactive : "", className]
    .filter(Boolean)
    .join(" ");
  return <div className={classes} {...props} />;
}

