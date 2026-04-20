// ============================================================
// src/pages/PrivacyPage.jsx
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

export default function PrivacyPage() {
  return (
    <div className="page min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <Logo size="sm" />
          <Link to="/auth" className="btn-ghost text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>

        <h1 className="font-display text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-white/30 text-sm mb-10">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="divider" />

        <Section title="1. Information We Collect">
          <p><strong className="text-white/70">Account information:</strong> When you register, we collect your full name, email address, and a hashed password (we never store plaintext passwords).</p>
          <p><strong className="text-white/70">Profile data:</strong> Optional phone number and your role within a mess.</p>
          <p><strong className="text-white/70">Usage data:</strong> Meal records, expense entries, and member interactions you create within the platform.</p>
          <p><strong className="text-white/70">Technical data:</strong> IP address (handled by Supabase/Vercel infrastructure), browser type, and access timestamps for security and abuse prevention.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>To provide and operate the MealON service</li>
            <li>To authenticate your identity and secure your account</li>
            <li>To display your meal and expense data to other members of your mess (only)</li>
            <li>To send account-related emails (verification, password reset)</li>
            <li>To improve the platform based on usage patterns</li>
          </ul>
          <p>We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
        </Section>

        <Section title="3. Data Visibility Within a Mess">
          <p>By joining a mess, you understand and consent that:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Your name, meal attendance, and expense contributions are visible to all members of that mess</li>
            <li>The mess manager can view and manage all member data within that mess</li>
            <li>Your data is NOT visible to members of other messes</li>
          </ul>
        </Section>

        <Section title="4. Data Storage and Security">
          <p>Your data is stored securely on <a href="https://supabase.com" className="text-brand-400 hover:underline" target="_blank" rel="noopener noreferrer">Supabase</a>, which uses PostgreSQL with row-level security policies. This means database queries are enforced at the row level so users can only access data they are authorized to see.</p>
          <p>We use HTTPS for all data in transit. Passwords are hashed by Supabase's auth system and are never accessible in plaintext, even to us.</p>
          <p>While we take security seriously, no system is 100% secure. Please use a strong, unique password.</p>
        </Section>

        <Section title="5. Cookies and Local Storage">
          <p>MealON uses browser local storage solely to maintain your authentication session (managed by the Supabase client library). We do not use tracking cookies or advertising cookies.</p>
        </Section>

        <Section title="6. Data Retention">
          <p>Your account data is retained as long as your account is active. If you delete your account or are removed from a mess, your associated data may be deleted in accordance with database cascade rules.</p>
          <p>You may request deletion of your account by contacting us.</p>
        </Section>

        <Section title="7. Third-Party Services">
          <p>MealON is built on the following third-party infrastructure:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong className="text-white/70">Supabase</strong> — database, authentication, real-time updates</li>
            <li><strong className="text-white/70">Vercel</strong> — hosting and edge delivery</li>
          </ul>
          <p>Each of these services has its own privacy policy. We encourage you to review them.</p>
        </Section>

        <Section title="8. Your Rights">
          <p>You have the right to access, correct, or request deletion of your personal data. To exercise these rights, contact us through the app. We will respond within a reasonable timeframe.</p>
        </Section>

        <Section title="9. Children">
          <p>The Service is not directed at children under 13. We do not knowingly collect data from children under 13.</p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the "last updated" date at the top of this page.</p>
        </Section>

        <div className="divider" />
        <p className="text-white/20 text-xs text-center font-body">© {new Date().getFullYear()} MealON. Made in Bangladesh 🇧🇩</p>
      </div>
    </div>
  );
}
