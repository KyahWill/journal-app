import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Journal App protects your personal information and ensures your privacy.',
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              ← Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: December 6, 2024</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              At Journal App, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, 
              and safeguard your information when you use our journaling application. Please read this privacy policy 
              carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Categories We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect various types of information to provide and improve our services:
            </p>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Account Information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Name and email address</li>
              <li>Profile information and preferences</li>
              <li>Authentication credentials</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Journal Content</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Written journal entries and reflections</li>
              <li>Goals, milestones, and progress tracking data</li>
              <li>Categories and tags you create</li>
              <li>Timestamps and metadata associated with entries</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Voice Data</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Audio recordings when using voice journaling features</li>
              <li>Transcriptions generated from your voice input</li>
              <li>Voice interaction data with AI coach features</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">AI Interaction Data</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Conversations with AI coaching features</li>
              <li>AI-generated insights and recommendations</li>
              <li>Coach personality preferences and settings</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Integration Data</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Google Calendar events and schedule information (when connected)</li>
              <li>Theme customization preferences</li>
              <li>Application settings and configurations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Technical Data</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Usage patterns and feature interactions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Voice Data Collection & Processing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you use our voice journaling features, we process your audio data as follows:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Real-time transcription:</strong> Voice recordings are converted to text using secure speech-to-text services</li>
              <li><strong>Temporary storage:</strong> Audio files are processed in real-time and are not permanently stored unless you explicitly save them</li>
              <li><strong>AI processing:</strong> Transcribed text may be processed by our AI systems to provide coaching and insights</li>
              <li><strong>Voice preferences:</strong> We may store voice-related settings such as language preferences and speech patterns to improve transcription accuracy</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You can disable voice features at any time through your account settings. When disabled, no audio data will be collected or processed.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Integrations</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Google Calendar Integration</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you connect your Google Calendar to Journal App:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>We access your calendar events to provide context-aware coaching</li>
              <li>Calendar data is used to understand your schedule and commitments</li>
              <li>We do not modify, create, or delete events in your calendar</li>
              <li>Calendar access can be revoked at any time through your Google account settings or within our app</li>
              <li>We only request read-only access to your calendar data</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Google Authentication</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you sign in using Google:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>We receive basic profile information (name, email, profile picture)</li>
              <li>We use OAuth 2.0 for secure authentication</li>
              <li>We do not receive or store your Google password</li>
              <li>You can disconnect Google authentication at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">AI/ML Data Processing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our AI-powered features process your data to provide personalized insights and coaching:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Personalized insights:</strong> Your journal entries are analyzed to identify patterns, themes, and growth opportunities</li>
              <li><strong>Weekly summaries:</strong> AI generates summaries of your reflections to help you track progress</li>
              <li><strong>Coaching responses:</strong> Your journal history provides context for AI coaching conversations</li>
              <li><strong>Goal recommendations:</strong> AI may suggest goals and milestones based on your entries</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Important:</strong> Your personal journal data is not used to train general AI models. Your data remains private 
              and is only used to provide personalized features within your own account.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We use Google's Gemini AI services. Data sent to these services is processed according to their respective privacy 
              policies and our data processing agreements with them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your transactions and send you related information</li>
              <li>Send you technical notices, updates, security alerts, and support messages</li>
              <li>Respond to your comments, questions, and customer service requests</li>
              <li>Provide personalized AI coaching based on your journal entries</li>
              <li>Generate insights and summaries from your reflections</li>
              <li>Sync your data across devices</li>
              <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
              <li>Detect, prevent, and address technical issues and protect against fraud</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement robust technical and organizational security measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Encryption in transit:</strong> All data transmitted between your device and our servers uses TLS/SSL encryption</li>
              <li><strong>Encryption at rest:</strong> Your journal entries and personal data are encrypted when stored</li>
              <li><strong>Row-level security:</strong> Database-level security ensures users can only access their own data</li>
              <li><strong>Secure authentication:</strong> We use industry-standard authentication practices including OAuth 2.0</li>
              <li><strong>Regular audits:</strong> We conduct regular security reviews and vulnerability assessments</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              However, please note that no method of transmission over the Internet or method of electronic storage 
              is 100% secure. While we strive to use commercially acceptable means to protect your personal information, 
              we cannot guarantee its absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights & Choices</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the following rights regarding your personal data:
            </p>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Access & Portability</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Request a copy of your personal data</li>
              <li>Export your journal entries and data in a portable format</li>
              <li>Access information about how your data is processed</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Correction & Deletion</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Update or correct your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Request deletion of specific entries or data</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Control & Consent</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Disable voice features and voice data collection</li>
              <li>Disconnect third-party integrations (Google Calendar, etc.)</li>
              <li>Opt out of non-essential communications</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">GDPR Compliance (European Users)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR):
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Legal basis:</strong> We process your data based on your consent, contractual necessity, and our legitimate interests</li>
              <li><strong>Right to object:</strong> You can object to processing based on legitimate interests</li>
              <li><strong>Right to restriction:</strong> You can request we limit how we use your data</li>
              <li><strong>Right to lodge a complaint:</strong> You can file a complaint with your local data protection authority</li>
              <li><strong>Data transfers:</strong> When data is transferred outside the EEA, we ensure appropriate safeguards are in place</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">CCPA Compliance (California Users)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Right to know:</strong> Request information about what personal data we collect, use, and disclose</li>
              <li><strong>Right to delete:</strong> Request deletion of your personal information</li>
              <li><strong>Right to opt-out:</strong> We do not sell personal information to third parties</li>
              <li><strong>Right to non-discrimination:</strong> We will not discriminate against you for exercising your CCPA rights</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              To exercise any of these rights, please contact us using the information provided below.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We retain your personal information for as long as necessary to provide you with our services:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Active accounts:</strong> Data is retained while your account is active</li>
              <li><strong>Account deletion:</strong> Upon account deletion, we remove or anonymize your data within 30 days</li>
              <li><strong>Backup retention:</strong> Encrypted backups may be retained for up to 90 days for disaster recovery</li>
              <li><strong>Legal requirements:</strong> Some data may be retained longer if required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the following third-party services to operate our application:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Firebase/Google Cloud:</strong> Authentication, database, and hosting services</li>
              <li><strong>Google Gemini:</strong> AI-powered features and insights</li>
              <li><strong>Google Calendar API:</strong> Calendar integration (when enabled)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              These third parties have access to your personal information only to perform specific tasks on our behalf 
              and are obligated not to disclose or use it for any other purpose.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Journal App is not intended for use by children under the age of 13. We do not knowingly collect personal 
              information from children under 13. If you are a parent or guardian and believe your child has provided us 
              with personal information, please contact us so we can delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any material changes by posting the 
              new Privacy Policy on this page, updating the "Last updated" date, and sending you an email notification 
              when appropriate. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us at:
            </p>
            <p className="text-gray-700 mt-4">
              Email: <a href="mailto:wvparrone@gmail.com" className="text-orange-600 hover:text-orange-700">wvparrone@gmail.com</a>
            </p>
            <p className="text-gray-700 mt-2">
              For GDPR-related inquiries, you may also contact our Data Protection contact at the email address above.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
