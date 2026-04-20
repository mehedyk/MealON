// ============================================================
// src/pages/TermsPage.jsx
// ============================================================
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../components/ui';

const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="font-display text-base font-semibold text-white mb-3">{title}</h2>
    <div className="text-white/50 text-sm font-body leading-relaxed space-y-2">{children}</div>
  </section>
);

export default function TermsPage() {
  return (
    <div className="page min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <Logo size="sm" />
          <Link to="/auth" className="btn-ghost text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>

        <h1 className="font-display text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-white/30 text-sm mb-10">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="divider" />

        <Section title="1. Acceptance of Terms">
          <p>By creating an account or using MealON ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          <p>These terms apply to all users, including mess managers and members.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>MealON is a web-based mess management platform that allows users to track meals, record shared expenses, manage mess members, and generate reports. The Service is intended for use by student messes, hostels, and shared housing arrangements primarily in Bangladesh.</p>
        </Section>

        <Section title="3. User Accounts">
          <p>You must provide a valid email address and create a secure password to use the Service. You are responsible for maintaining the confidentiality of your login credentials.</p>
          <p>You must not share your account with others or attempt to access another user's account without authorization.</p>
          <p>You must be at least 13 years of age to use the Service.</p>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Use the Service for any unlawful purpose</li>
            <li>Submit false, misleading, or fraudulent expense or meal data</li>
            <li>Attempt to reverse-engineer, exploit, or disrupt the Service</li>
            <li>Use automated tools to scrape or abuse the Service</li>
            <li>Harass or harm other members of your mess through the platform</li>
          </ul>
        </Section>

        <Section title="5. Mess Management and Member Roles">
          <p>The user who creates a mess is assigned the "Manager" role and has administrative control over that mess, including the ability to add or remove members and manage financial records.</p>
          <p>Members join a mess voluntarily using a mess code. By joining, you consent to your meal attendance and financial contributions being visible to other members of that mess.</p>
        </Section>

        <Section title="6. Financial Data">
          <p>MealON records expense and meal data as entered by users. We do not process payments, hold funds, or act as a financial intermediary. All financial settlements between mess members are the sole responsibility of the users.</p>
          <p>MealON makes no guarantees about the accuracy of any financial calculations and accepts no liability for disputes arising from the use of expense data.</p>
        </Section>

        <Section title="7. Data and Privacy">
          <p>Your use of the Service is also governed by our <Link to="/privacy" className="text-brand-400 hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference.</p>
        </Section>

        <Section title="8. Service Availability">
          <p>We strive to maintain high availability but do not guarantee uninterrupted access to the Service. We may modify, suspend, or discontinue the Service at any time without prior notice.</p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>To the maximum extent permitted by applicable law, MealON and its developers shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including but not limited to data loss, financial disputes, or service downtime.</p>
        </Section>

        <Section title="10. Changes to Terms">
          <p>We reserve the right to update these Terms at any time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms.</p>
        </Section>

        <Section title="11. Contact">
          <p>For questions about these Terms, contact us at the email provided in the app's contact section.</p>
        </Section>

        <div className="divider" />
        <p className="text-white/20 text-xs text-center font-body">© {new Date().getFullYear()} MealON. Made in Bangladesh 🇧🇩</p>
      </div>
    </div>
  );
}
