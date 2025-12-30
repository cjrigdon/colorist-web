import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6">
        <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-3xl font-bold text-slate-800 font-venti mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mb-8">Last updated: January 2024</p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-slate-800 font-venti mb-3">1. Information We Collect</h2>
              <p className="text-slate-700 leading-relaxed">
                We collect information that you provide directly to us, including your name, email address, 
                and any content you create or upload to Colorist, such as color palettes, pencil sets, 
                and journal entries.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 font-venti mb-3">2. How We Use Your Information</h2>
              <p className="text-slate-700 leading-relaxed mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process and complete transactions</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze trends and usage</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 font-venti mb-3">3. Information Sharing</h2>
              <p className="text-slate-700 leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                without your consent, except as described in this policy. We may share information with 
                service providers who assist us in operating our platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 font-venti mb-3">4. Data Security</h2>
              <p className="text-slate-700 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 font-venti mb-3">5. Your Rights</h2>
              <p className="text-slate-700 leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Access and receive a copy of your personal data</li>
                <li>Rectify inaccurate or incomplete data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request restriction of processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 font-venti mb-3">6. Cookies</h2>
              <p className="text-slate-700 leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our service and 
                hold certain information. You can instruct your browser to refuse all cookies or to 
                indicate when a cookie is being sent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 font-venti mb-3">7. Contact Us</h2>
              <p className="text-slate-700 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at 
                <a href="mailto:privacy@colorist.app" className="text-blue-600 hover:underline ml-1">privacy@colorist.app</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

