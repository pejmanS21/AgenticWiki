import styles from "./StatusBadge.module.css";

type Props = {
  status: string;
  tone?: "neutral" | "success" | "warning" | "danger";
};

export function StatusBadge({ status, tone = "neutral" }: Props) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{status}</span>;
}

