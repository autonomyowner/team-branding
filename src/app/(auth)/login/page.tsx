"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import styles from "../auth.module.css";

interface TeamMember {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  role: string;
  roleAr: string;
  color: string;
  initials: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "wahab",
    name: "Wahab",
    nameAr: "وهاب",
    email: "wahab@brandingteam.app",
    role: "Product Manager",
    roleAr: "مدير المنتج",
    color: "#ff4500",
    initials: "وه"
  },
  {
    id: "azeddine",
    name: "Azeddine",
    nameAr: "عز الدين",
    email: "azeddine@brandingteam.app",
    role: "Tech",
    roleAr: "تقني",
    color: "#00b4d8",
    initials: "عز"
  },
  {
    id: "sohir",
    name: "Sohair",
    nameAr: "سهير",
    email: "sohir@brandingteam.app",
    role: "Creative Lead",
    roleAr: "قائدة الإبداع",
    color: "#f4a400",
    initials: "سه"
  },
  {
    id: "hythem",
    name: "Hythem",
    nameAr: "هيثم",
    email: "hythem@brandingteam.app",
    role: "Content Creator",
    roleAr: "صانع المحتوى",
    color: "#ff4500",
    initials: "هي"
  },
  {
    id: "meamar",
    name: "Meamar",
    nameAr: "معمر",
    email: "meamar@brandingteam.app",
    role: "Sales & Branding",
    roleAr: "المبيعات والعلامة التجارية",
    color: "#00b4d8",
    initials: "مع"
  },
];

export default function LoginPage() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const { loginAsTeamMember, continueAsGuest } = useAuth();
  const router = useRouter();

  const handleMemberSelect = async (member: TeamMember) => {
    setSelectedMember(member.id);
    await loginAsTeamMember(member);

    // Delay for animation
    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

  const handleGuestAccess = () => {
    continueAsGuest();
    router.push("/dashboard");
  };

  return (
    <div className={styles.authPage}>
      {/* Background Effects */}
      <div className={styles.authBackground}>
        <div className={styles.gridPattern} />
        <div className={styles.inkSplatter1} />
        <div className={styles.inkSplatter2} />
        <div className={styles.inkSplatter3} />
      </div>

      {/* Large Editorial Number */}
      <motion.div
        className={styles.editorialNumber}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 0.05, x: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        05
      </motion.div>

      <motion.div
        className={styles.authContainer}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className={styles.authHeader}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/" className={styles.logo}>
              <span className={styles.logoMark}>BT</span>
              <span className={styles.logoText}>BRANDING TEAM</span>
            </Link>
          </motion.div>

          <motion.h1
            className={styles.mainTitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            اختر عضو الفريق
          </motion.h1>

          <motion.p
            className={styles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            اختر اسمك للدخول إلى منصة الفريق
          </motion.p>

          {/* Accent Line */}
          <motion.div
            className={styles.accentBar}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          />
        </div>

        {/* Team Member Grid */}
        <div className={styles.teamMemberGrid}>
          {TEAM_MEMBERS.map((member, index) => (
            <motion.button
              key={member.id}
              type="button"
              className={`${styles.teamMemberCard} ${selectedMember === member.id ? styles.selected : ""}`}
              onClick={() => handleMemberSelect(member)}
              disabled={selectedMember !== null}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.5 + index * 0.1,
                ease: [0.16, 1, 0.3, 1]
              }}
              whileHover={{ scale: selectedMember === null ? 1.03 : 1, y: selectedMember === null ? -4 : 0 }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Member Number */}
              <div className={styles.memberNumber}>
                {String(index + 1).padStart(2, '0')}
              </div>

              {/* Avatar */}
              <div
                className={styles.memberAvatar}
                style={{
                  backgroundColor: member.color,
                  boxShadow: `0 8px 24px ${member.color}40`
                }}
              >
                <span>{member.initials}</span>
              </div>

              {/* Member Info */}
              <div className={styles.memberInfo}>
                <h3 className={styles.memberName}>{member.nameAr}</h3>
                <p className={styles.memberRole}>{member.roleAr}</p>
              </div>

              {/* Selection Indicator */}
              {selectedMember === member.id && (
                <motion.div
                  className={styles.selectionRing}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Guest Option */}
        <motion.div
          className={styles.guestOption}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <button onClick={handleGuestAccess} className={styles.guestButton}>
            <span>المتابعة كزائر</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
