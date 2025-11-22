import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Understand how Journal App uses cookies to enhance your experience.',
}

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              ← Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Are Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Cookies are small text files that are placed on your device when you visit a website. They are widely 
              used to make websites work more efficiently and provide information to website owners.
            </p>
            <p className="text-gray-700 leading-relaxed">
              At Journal App, we use cookies and similar tracking technologies to improve your experience, keep you 
              signed in, remember your preferences, and understand how you use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Authentication:</strong> To keep you signed in and verify your identity
              </li>
              <li>
                <strong>Security:</strong> To protect your account and detect malicious activity
              </li>
              <li>
                <strong>Preferences:</strong> To remember your settings and preferences
              </li>
              <li>
                <strong>Analytics:</strong> To understand how you use our service and improve it
              </li>
              <li>
                <strong>Performance:</strong> To monitor the performance and reliability of our service
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Types of Cookies We Use</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Essential Cookies</h3>
              <p className="text-gray-700 leading-relaxed">
                These cookies are necessary for the website to function properly. They enable core functionality such 
                as security, network management, and accessibility. You cannot opt-out of these cookies as they are 
                essential for the service to work.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Functional Cookies</h3>
              <p className="text-gray-700 leading-relaxed">
                These cookies enable the website to provide enhanced functionality and personalization. They may be 
                set by us or by third-party providers whose services we have added to our pages. If you do not allow 
                these cookies, some or all of these services may not function properly.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics Cookies</h3>
              <p className="text-gray-700 leading-relaxed">
                These cookies help us understand how visitors interact with our website by collecting and reporting 
                information anonymously. This helps us improve our website and services. We use analytics to track 
                page views, session duration, and user interactions.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Session Cookies</h3>
              <p className="text-gray-700 leading-relaxed">
                These temporary cookies are erased when you close your browser. They are used to maintain your 
                session state and remember your actions within a browsing session.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Persistent Cookies</h3>
              <p className="text-gray-700 leading-relaxed">
                These cookies remain on your device for a set period of time or until you delete them. They help us 
                recognize you as a returning visitor and remember your preferences.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              In addition to our own cookies, we may also use various third-party cookies to report usage statistics 
              of our service and deliver content. These third parties may include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Analytics providers (e.g., Google Analytics)</li>
              <li>AI service providers for our coaching features</li>
              <li>Authentication services</li>
              <li>Content delivery networks</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Managing Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Most web browsers allow you to control cookies through their settings preferences. However, limiting 
              cookies may impact your experience of our service and prevent certain features from working properly.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              You can manage cookies in several ways:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Delete all cookies from your browser</li>
              <li>Block all cookies from being set</li>
              <li>Allow all cookies</li>
              <li>Block third-party cookies only</li>
              <li>Clear all cookies when you close your browser</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              To manage cookies in your browser, please refer to your browser's help documentation or visit 
              <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700"> www.allaboutcookies.org</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Do Not Track Signals</h2>
            <p className="text-gray-700 leading-relaxed">
              Some web browsers have a "Do Not Track" feature that signals to websites that you do not want to have 
              your online activity tracked. Currently, we do not respond to Do Not Track signals. We will continue 
              to monitor industry developments regarding Do Not Track and may adjust our practices in the future.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other 
              operational, legal, or regulatory reasons. We encourage you to review this policy periodically to stay 
              informed about how we use cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about our use of cookies or this Cookie Policy, please contact us at:
            </p>
            <p className="text-gray-700 mt-4">
              Email: <a href="mailto:privacy@journalapp.com" className="text-orange-600 hover:text-orange-700">privacy@journalapp.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

