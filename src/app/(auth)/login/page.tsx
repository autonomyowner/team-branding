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
    color: "#3b82f6",
    initials: "وه"
  },
  {
    id: "azeddine",
    name: "Azeddine",
    nameAr: "عز الدين",
    email: "azeddine@brandingteam.app",
    role: "Tech",
    roleAr: "تقني",
    color: "#10b981",
    initials: "عز"
  },
  {
    id: "sohir",
    name: "Sohair",
    nameAr: "سهير",
    email: "sohir@brandingteam.app",
    role: "Creative Lead",
    roleAr: "قائدة الإبداع",
    color: "#ec4899",
    initials: "سه"
  },
  {
    id: "hythem",
    name: "Hythem",
    nameAr: "هيثم",
    email: "hythem@brandingteam.app",
    role: "Content Creator",
    roleAr: "صانع المحتوى",
    color: "#f59e0b",
    initials: "هي"
  },
  {
    id: "meamar",
    name: "Meamar",
    nameAr: "معمار",
    email: "meamar@brandingteam.app",
    role: "Sales & Branding",
    roleAr: "المبيعات والعلامة التجارية",
    color: "#8b5cf6",
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
    router.push("/dashboard");
  };

  const handleGuestAccess = () => {
    continueAsGuest();
    router.push("/dashboard");
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
            <span className={styles.logoMark}>BT</span>
            <span className={styles.logoText}>BRANDING TEAM</span>
          </Link>
          <h1>اختر عضو الفريق</h1>
          <p>اختر اسمك للدخول إلى منصة الفريق</p>
        </div>

        <div className={styles.teamMemberGrid}>
          {TEAM_MEMBERS.map((member, index) => (
            <motion.button
              key={member.id}
              type="button"
              className={`${styles.teamMemberCard} ${selectedMember === member.id ? styles.selected : ""}`}
              onClick={() => handleMemberSelect(member)}
              disabled={selectedMember !== null}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={styles.memberAvatar}
                style={{ backgroundColor: member.color }}
              >
                {member.initials}
              </div>
              <div className={styles.memberInfo}>
                <h3 className={styles.memberName}>{member.nameAr}</h3>
                <p className={styles.memberRole}>{member.roleAr}</p>
              </div>
              {selectedMember === member.id && (
                <motion.div
                  className={styles.checkmark}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ✓
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        <div className={styles.guestOption}>
          <button onClick={handleGuestAccess} className={styles.guestButton}>
            المتابعة كزائر
          </button>
        </div>
      </motion.div>
    </div>
  );
}
