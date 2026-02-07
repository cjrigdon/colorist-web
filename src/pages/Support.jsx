import React from 'react';
import { Link } from 'react-router-dom';

const Support = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm border border-slate-200 rounded-lg p-8 md:p-12">
          <div className="mb-6">
            <Link
              to="/"
              className="text-sm font-medium transition-colors inline-flex items-center"
              style={{ color: '#ea3663' }}
              onMouseEnter={(e) => e.target.style.color = '#d12a4f'}
              onMouseLeave={(e) => e.target.style.color = '#ea3663'}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Login
            </Link>
          </div>
          
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16" style={{ color: '#ea3663' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 font-venti mb-2">Support</h1>
            <p className="text-slate-600">We're here to help!</p>
          </div>

          <div className="prose prose-slate max-w-none space-y-6">
            <section className="text-center">
              <p className="text-slate-700 leading-relaxed text-lg mb-4">
                Need assistance? Have a question or feedback? We'd love to hear from you!
              </p>
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <p className="text-slate-700 mb-2 font-medium">Contact our support team:</p>
                <a 
                  href="mailto:support@coloristapp.com" 
                  className="text-xl font-semibold transition-colors"
                  style={{ color: '#ea3663' }}
                  onMouseEnter={(e) => e.target.style.color = '#d12a4f'}
                  onMouseLeave={(e) => e.target.style.color = '#ea3663'}
                >
                  support@coloristapp.com
                </a>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-semibold text-slate-800 font-venti mb-3">Common Topics</h2>
              <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                <li>Account questions and password reset</li>
                <li>Technical issues or bugs</li>
                <li>Feature requests and suggestions</li>
                <li>Billing and subscription inquiries</li>
                <li>General feedback</li>
              </ul>
            </section>

            <section className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500 text-center">
                We typically respond within 24-48 hours. For urgent matters, please include "URGENT" in your subject line.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;

