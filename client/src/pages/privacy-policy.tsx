import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import BackButton from '@/components/BackButton';

export default function PrivacyPolicy() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc]">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-6">
          <BackButton />
        </div>
        
        <h1 className="text-3xl font-bold text-primary mb-4">Privacy Policy</h1>
        <p className="text-[#94a3b8] text-sm mb-10">Last updated: March 20, 2025</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">1. Introduction</h2>
            <p className="text-[#e2e8f0] leading-relaxed">
              Welcome to DevScripts. This Privacy Policy explains how we handle your personal data when you visit our website,
              including the use of cookies, ads, and pop-ups. By using our website, you agree to the terms outlined in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">2. Cookies</h2>
            <p className="text-[#e2e8f0] leading-relaxed">
              We use cookies to enhance your experience on our website. Cookies are small text files stored on your device
              that help us analyze website traffic and improve our services. You can manage or disable cookies through your
              browser settings, but this may affect your ability to use certain features of our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">3. Ads and Pop-ups</h2>
            <p className="text-[#e2e8f0] leading-relaxed">
              Our website uses third-party advertising services to display ads and pop-ups. These services may collect
              information about your visits to our website and other sites to provide relevant advertisements. We do not
              control the content of these ads or the data collected by third-party advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">4. Data Collection</h2>
            <p className="text-[#e2e8f0] leading-relaxed">
              We do not collect personal data unless you voluntarily provide it (e.g., by joining our Discord server or creating an account).
              Any data collected through cookies or ads is used solely for improving your experience and is not shared
              with unauthorized third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">5. Your Rights</h2>
            <p className="text-[#e2e8f0] leading-relaxed">
              Under GDPR, you have the right to access, correct, or delete your personal data. If you have any questions
              or requests regarding your data, please contact us at devscripts@mail2world.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">6. Changes to This Policy</h2>
            <p className="text-[#e2e8f0] leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page, and the
              "Last updated" date will be revised accordingly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">7. Contact Us</h2>
            <p className="text-[#e2e8f0] leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at devscripts@mail2world.com.
            </p>
          </section>
        </div>
        
        <div className="mt-10 pt-6 border-t border-[#334155] text-center text-[#94a3b8] text-sm">
          <p>© 2025 DevScripts. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}