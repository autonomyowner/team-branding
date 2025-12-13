"use client";

import { useEffect, useRef, useState, memo } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./page.module.css";

// Simplified animation variants for better performance
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// Navigation Component
function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.navContainer}>
        <a href="#" className={styles.logo}>
          <span className={styles.logoMark}>N</span>
          <span className={styles.logoText}>Nexus</span>
        </a>

        <div className={styles.navLinks}>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it Works</a>
          <a href="#pricing">Pricing</a>
          <a href="/login" className={styles.navLogin}>
            Log in
          </a>
          <a href="/dashboard" className={styles.navCta}>
            Try Demo
          </a>
        </div>
      </div>
    </motion.nav>
  );
}

// Hero Section - Optimized: removed scroll-based transforms for better performance
const Hero = memo(function Hero() {
  return (
    <section className={styles.hero}>
      <div className="grid-pattern" />
      <div className={styles.heroGlow} />

      <div className={styles.heroContainer}>
        <motion.div
          className={styles.heroContent}
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.span className="label" variants={fadeInUp}>
            Enterprise Workflow Intelligence
          </motion.span>

          <motion.h1 className={styles.heroTitle} variants={fadeInUp}>
            Build systems that
            <br />
            <span className={styles.heroTitleAccent}>scale with you</span>
          </motion.h1>

          <motion.p className={`${styles.heroSubtitle} text-large`} variants={fadeInUp}>
            Nexus transforms how enterprises operate. Automate complex workflows,
            eliminate bottlenecks, and unlock unprecedented efficiency with
            AI-powered process intelligence.
          </motion.p>

          <motion.div className={styles.heroCtas} variants={fadeInUp}>
            <a href="/dashboard" className="btn btn-primary">
              <span>Try Demo Free</span>
            </a>
            <a href="/signup" className="btn btn-secondary">
              Create Account
            </a>
          </motion.div>

          <motion.div className={styles.heroStats} variants={fadeInUp}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>500+</span>
              <span className={styles.heroStatLabel}>Enterprise Clients</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>$2.4B</span>
              <span className={styles.heroStatLabel}>Costs Saved Annually</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>99.9%</span>
              <span className={styles.heroStatLabel}>Uptime SLA</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className={styles.heroVisual}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className={styles.heroVisualInner}>
            <div className={styles.dashboardMockup}>
              <div className={styles.dashboardHeader}>
                <div className={styles.dashboardDots}>
                  <span />
                  <span />
                  <span />
                </div>
                <span className={styles.dashboardTitle}>Workflow Dashboard</span>
              </div>
              <div className={styles.dashboardContent}>
                <div className={styles.dashboardSidebar}>
                  <div className={styles.sidebarItem} />
                  <div className={styles.sidebarItem} />
                  <div className={styles.sidebarItem} />
                  <div className={styles.sidebarItem} />
                </div>
                <div className={styles.dashboardMain}>
                  <div className={styles.dashboardCard}>
                    <div className={styles.cardTitle} />
                    <div className={styles.cardChart}>
                      <svg viewBox="0 0 200 80" className={styles.chartSvg}>
                        <path
                          d="M0,60 Q50,30 100,45 T200,20"
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="2"
                          className={styles.chartPath}
                        />
                      </svg>
                    </div>
                  </div>
                  <div className={styles.dashboardMetrics}>
                    <div className={styles.metricBox}>
                      <div className={styles.metricValue}>+147%</div>
                      <div className={styles.metricLabel}>Efficiency</div>
                    </div>
                    <div className={styles.metricBox}>
                      <div className={styles.metricValue}>-62%</div>
                      <div className={styles.metricLabel}>Manual Tasks</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className={styles.heroScrollIndicator}>
        <div className={`${styles.scrollLine} ${styles.scrollLineAnimated}`} />
      </div>
    </section>
  );
});

// Trusted By Section - Simplified animations
const TrustedBy = memo(function TrustedBy() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const companies = ["Microsoft", "Salesforce", "Adobe", "Oracle", "SAP", "IBM"];

  return (
    <section ref={ref} className={styles.trustedBy}>
      <div className="container">
        <p className={`${styles.trustedByLabel} ${isInView ? styles.fadeIn : ""}`}>
          Trusted by industry leaders
        </p>
        <div className={`${styles.trustedByLogos} ${isInView ? styles.fadeIn : ""}`}>
          {companies.map((company) => (
            <div key={company} className={styles.trustedByLogo}>
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

// Features data outside component to prevent re-creation
const featuresData = [
  { title: "Intelligent Automation", description: "AI-powered workflows that adapt to your business logic. Reduce manual intervention by 90% while maintaining complete control.", tag: "Core Engine" },
  { title: "Real-time Analytics", description: "Deep insights into every process. Identify bottlenecks, optimize performance, and make data-driven decisions instantly.", tag: "Insights" },
  { title: "Enterprise Security", description: "SOC 2 Type II certified. End-to-end encryption, role-based access, and comprehensive audit trails for full compliance.", tag: "Security" },
  { title: "Seamless Integration", description: "Connect with 200+ enterprise tools out of the box. Custom API support for proprietary systems with zero downtime.", tag: "Connect" },
  { title: "Collaborative Workflows", description: "Built for teams. Real-time collaboration, approval chains, and smart notifications keep everyone aligned.", tag: "Teams" },
  { title: "Predictive Scaling", description: "Machine learning anticipates demand spikes. Auto-scale resources before you need them, optimizing costs.", tag: "AI" },
];

// Features Section - Simplified with CSS animations
const Features = memo(function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="features" ref={ref} className={styles.features}>
      <div className="diagonal-lines" />
      <div className="container">
        <div className={`${styles.sectionHeader} ${isInView ? styles.fadeIn : ""}`}>
          <span className="label">Capabilities</span>
          <h2>
            Everything you need to
            <br />
            <span className="accent">transform operations</span>
          </h2>
          <p className="text-large">
            A complete platform designed for enterprise scale. Built by engineers
            who understand the complexity of modern business.
          </p>
        </div>

        <div className={`${styles.featuresGrid} ${isInView ? styles.fadeIn : ""}`}>
          {featuresData.map((feature, i) => (
            <div key={i} className={styles.featureCard} style={{ animationDelay: `${i * 0.05}s` }}>
              <span className={styles.featureTag}>{feature.tag}</span>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.description}</p>
              <div className={styles.featureArrow}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

// Steps data outside component
const stepsData = [
  { number: "01", title: "Connect Your Systems", description: "Integrate with your existing tech stack in minutes. Our universal connectors work with any API, database, or legacy system." },
  { number: "02", title: "Map Your Workflows", description: "Use our visual builder to design workflows. Our AI suggests optimizations based on industry best practices and your data." },
  { number: "03", title: "Deploy & Monitor", description: "Launch with confidence. Real-time monitoring, automatic error handling, and instant rollback keep operations smooth." },
  { number: "04", title: "Scale Without Limits", description: "From 100 to 100 million operations. Our infrastructure scales elastically, maintaining performance at any volume." },
];

// How It Works Section - CSS animations
const HowItWorks = memo(function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="how-it-works" ref={ref} className={styles.howItWorks}>
      <div className="container">
        <div className={`${styles.sectionHeader} ${isInView ? styles.fadeIn : ""}`}>
          <span className="label">Process</span>
          <h2>
            From chaos to
            <br />
            <span className="accent">controlled efficiency</span>
          </h2>
        </div>

        <div className={`${styles.stepsContainer} ${isInView ? styles.fadeIn : ""}`}>
          <div className={styles.stepsLine} />
          {stepsData.map((step, i) => (
            <div key={i} className={styles.step} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={styles.stepNumber}>{step.number}</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

// Testimonials data
const testimonialsData = [
  { quote: "Nexus reduced our operational costs by 47% in the first quarter. The ROI was immediate and continues to compound.", author: "Sarah Chen", role: "VP of Operations", company: "TechCorp Global" },
  { quote: "We evaluated 12 platforms. Nexus was the only one that could handle our complexity without compromising on speed.", author: "Michael Torres", role: "CTO", company: "FinanceFlow Inc." },
  { quote: "The implementation team understood enterprise. We were live in 6 weeks with zero disruption to existing operations.", author: "Emily Watson", role: "Director of Digital Transformation", company: "HealthCore Systems" },
];

// Testimonials Section - CSS animations
const Testimonials = memo(function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className={styles.testimonials}>
      <div className="container">
        <div className={`${styles.sectionHeader} ${isInView ? styles.fadeIn : ""}`}>
          <span className="label">Testimonials</span>
          <h2>
            Leaders trust Nexus
            <br />
            <span className="accent">to transform operations</span>
          </h2>
        </div>

        <div className={`${styles.testimonialsGrid} ${isInView ? styles.fadeIn : ""}`}>
          {testimonialsData.map((testimonial, i) => (
            <div key={i} className={styles.testimonialCard} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={styles.testimonialQuote}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className={styles.quoteIcon}>
                  <path d="M14 24H8C8 17.373 13.373 12 20 12V16C15.582 16 12 19.582 12 24V36H24V24H14ZM38 24H32C32 17.373 37.373 12 44 12V16C39.582 16 36 19.582 36 24V36H48V24H38Z" fill="currentColor" />
                </svg>
                <p>{testimonial.quote}</p>
              </div>
              <div className={styles.testimonialAuthor}>
                <div className={styles.authorAvatar}>{testimonial.author.charAt(0)}</div>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{testimonial.author}</span>
                  <span className={styles.authorRole}>{testimonial.role}, {testimonial.company}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

// Pricing data
const plansData = [
  { name: "Starter", description: "For growing teams ready to automate", price: "$499", period: "/month", features: ["Up to 10,000 workflow executions", "5 team members", "50+ integrations", "Email support", "Basic analytics"], cta: "Start Free Trial", highlighted: false },
  { name: "Enterprise", description: "For organizations at scale", price: "Custom", period: "", features: ["Unlimited workflow executions", "Unlimited team members", "200+ integrations + custom", "24/7 dedicated support", "Advanced analytics & AI insights", "Custom SLA", "On-premise deployment option"], cta: "Contact Sales", highlighted: true },
  { name: "Professional", description: "For established operations teams", price: "$1,499", period: "/month", features: ["Up to 100,000 workflow executions", "25 team members", "100+ integrations", "Priority support", "Advanced analytics", "API access"], cta: "Start Free Trial", highlighted: false },
];

// Pricing Section - CSS animations
const Pricing = memo(function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="pricing" ref={ref} className={styles.pricing}>
      <div className="grid-pattern" />
      <div className="container">
        <div className={`${styles.sectionHeader} ${isInView ? styles.fadeIn : ""}`}>
          <span className="label">Pricing</span>
          <h2>
            Transparent pricing
            <br />
            <span className="accent">that scales with you</span>
          </h2>
          <p className="text-large">
            Start free. Scale as you grow. Enterprise-grade features included in every plan.
          </p>
        </div>

        <div className={`${styles.pricingGrid} ${isInView ? styles.fadeIn : ""}`}>
          {plansData.map((plan, i) => (
            <div key={i} className={`${styles.pricingCard} ${plan.highlighted ? styles.pricingCardHighlighted : ""}`} style={{ animationDelay: `${i * 0.1}s` }}>
              {plan.highlighted && <div className={styles.pricingBadge}>Most Popular</div>}
              <div className={styles.pricingHeader}>
                <h3 className={styles.pricingName}>{plan.name}</h3>
                <p className={styles.pricingDesc}>{plan.description}</p>
              </div>
              <div className={styles.pricingPrice}>
                <span className={styles.priceValue}>{plan.price}</span>
                <span className={styles.pricePeriod}>{plan.period}</span>
              </div>
              <ul className={styles.pricingFeatures}>
                {plan.features.map((feature, j) => (
                  <li key={j}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M16.667 5L7.5 14.167L3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <a href="/dashboard" className={`btn ${plan.highlighted ? "btn-primary" : "btn-secondary"} ${styles.pricingCta}`}>
                <span>{plan.cta}</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

// CTA Section - CSS animations
const CtaSection = memo(function CtaSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className={styles.cta}>
      <div className={styles.ctaGlow} />
      <div className="container">
        <div className={`${styles.ctaContent} ${isInView ? styles.fadeIn : ""}`}>
          <h2>
            Ready to transform
            <br />
            your operations?
          </h2>
          <p className="text-large">
            Join 500+ enterprises already using Nexus to build more efficient,
            scalable operations. Start your free trial today.
          </p>
          <div className={styles.ctaButtons}>
            <a href="/dashboard" className="btn btn-primary">
              <span>Try Demo Free</span>
            </a>
            <a href="/signup" className="btn btn-secondary">
              Create Account
            </a>
          </div>
        </div>
      </div>
    </section>
  );
});

// Footer links data
const footerLinks = {
  Product: ["Features", "Pricing", "Integrations", "Changelog", "Roadmap"],
  Company: ["About", "Careers", "Press", "Partners", "Contact"],
  Resources: ["Documentation", "API Reference", "Guides", "Blog", "Community"],
  Legal: ["Privacy", "Terms", "Security", "GDPR", "SOC 2"],
};

// Footer - No animations needed, static content
const Footer = memo(function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <a href="#" className={styles.logo}>
              <span className={styles.logoMark}>N</span>
              <span className={styles.logoText}>Nexus</span>
            </a>
            <p className={styles.footerTagline}>
              Enterprise workflow intelligence
              <br />
              for the modern business.
            </p>
          </div>

          <div className={styles.footerLinks}>
            {Object.entries(footerLinks).map(([category, items]) => (
              <div key={category} className={styles.footerColumn}>
                <h4>{category}</h4>
                <ul>
                  {items.map((item) => (
                    <li key={item}><a href="#">{item}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>&copy; 2024 Nexus. All rights reserved.</p>
          <div className={styles.footerSocial}>
            <a href="#" aria-label="Twitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a href="#" aria-label="GitHub">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
});

// Main Page Component
export default function Home() {
  return (
    <main>
      <Navigation />
      <Hero />
      <TrustedBy />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CtaSection />
      <Footer />
    </main>
  );
}
