import styles from "./EmptyState.module.css";

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className={styles.empty}>
      <div className={styles.title}>{title}</div>
      <div>{message}</div>
    </div>
  );
}

