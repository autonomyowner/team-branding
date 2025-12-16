"use client";

import styles from "./ContentTools.module.css";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  placeholder: string;
}

export default function PromptInput({
  value,
  onChange,
  onGenerate,
  isLoading,
  placeholder,
}: PromptInputProps) {
  return (
    <div className={styles.promptInput}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.textarea}
        rows={4}
        disabled={isLoading}
      />

      <button
        onClick={onGenerate}
        disabled={isLoading || !value.trim()}
        className={styles.generateBtn}
      >
        {isLoading ? (
          <>
            <div className={styles.buttonSpinner} />
            جاري الإنشاء...
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            إنشاء
          </>
        )}
      </button>
    </div>
  );
}
