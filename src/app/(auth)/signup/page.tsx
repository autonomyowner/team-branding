"use client";

import { useState, FormEvent, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import styles from "../auth.module.css";

function getPasswordStrength(password: string): {
  score: number;
  label: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "ضعيفة" };
  if (score <= 2) return { score: 2, label: "متوسطة" };
  if (score <= 3) return { score: 3, label: "جيدة" };
  return { score: 4, label: "قوية" };
}

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Validation
    if (!formData.name || !formData.email || !formData.company || !formData.password) {
      setError("يرجى ملء جميع الحقول");
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل");
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      setIsSubmitting(false);
      return;
    }

    if (!acceptTerms) {
      setError("يرجى الموافقة على الشروط والأحكام");
      setIsSubmitting(false);
      return;
    }

    const result = await signup({
      name: formData.name,
      email: formData.email,
      company: formData.company,
      password: formData.password,
    });

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "فشل إنشاء الحساب");
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authBackground}>
        <div className={styles.gridPattern} />
        <div className={styles.glowOrb} />
      </div>

      <motion.div
        className={styles.authContainer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.authHeader}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoMark}>N</span>
            <span className={styles.logoText}>نيكسس</span>
          </Link>
          <h1>إنشاء حسابك</h1>
          <p>ابدأ تجربتك المجانية لمدة 14 يوماً</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          {error && (
            <motion.div
              className={styles.errorMessage}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              {error}
            </motion.div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="name">الاسم الكامل</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="محمد أحمد"
                autoComplete="name"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="company">الشركة</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="اسم الشركة"
                autoComplete="organization"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">كلمة المرور</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="8 أحرف على الأقل"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
            {formData.password && (
              <>
                <div className={styles.passwordStrength}>
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`${styles.strengthBar} ${
                        level <= passwordStrength.score
                          ? passwordStrength.score <= 1
                            ? styles.weak
                            : passwordStrength.score <= 2
                            ? styles.medium
                            : styles.strong
                          : ""
                      }`}
                    />
                  ))}
                </div>
                <span className={styles.strengthText}>
                  قوة كلمة المرور: {passwordStrength.label}
                </span>
              </>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">تأكيد كلمة المرور</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="أعد إدخال كلمة المرور"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
          </div>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              disabled={isSubmitting}
            />
            <span>
              أوافق على{" "}
              <Link href="/terms">شروط الخدمة</Link> و{" "}
              <Link href="/privacy">سياسة الخصوصية</Link>
            </span>
          </label>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className={styles.spinner} />
            ) : (
              "إنشاء الحساب"
            )}
          </button>
        </form>

        <div className={styles.authDivider}>
          <span>أو تابع باستخدام</span>
        </div>

        <div className={styles.socialButtons}>
          <button type="button" className={styles.socialButton}>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>
          <button type="button" className={styles.socialButton}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </button>
        </div>

        <div className={styles.guestOption}>
          <Link href="/dashboard" className={styles.guestButton}>
            المتابعة كزائر
          </Link>
        </div>

        <p className={styles.authFooter}>
          لديك حساب بالفعل؟{" "}
          <Link href="/login">تسجيل الدخول</Link>
        </p>
      </motion.div>
    </div>
  );
}
