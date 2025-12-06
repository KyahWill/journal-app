import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the terms and conditions for using Journal App.',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              ← Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: December 6, 2025</p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing or using Journal App, you agree to be bound by these Terms of Service and all applicable 
              laws and regulations. If you do not agree with any of these terms, you are prohibited from using or 
              accessing this application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Use License</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Permission is granted to use Journal App for personal, non-commercial purposes. This is the 
              grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Modify or copy the application materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software contained in Journal App</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              <li>Use automated systems or bots to access the service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Accounts</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you create an account with us, you must provide accurate, complete, and current information. 
              Failure to do so constitutes a breach of the Terms, which may result in immediate termination of 
              your account.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You are responsible for safeguarding the password that you use to access the service and for any 
              activities or actions under your password. You agree not to disclose your password to any third party 
              and to notify us immediately upon becoming aware of any breach of security or unauthorized use of 
              your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Content</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You retain all rights to your journal entries, goals, voice recordings, and any other content you create, 
              post, or store using our service ("User Content"). By posting User Content, you grant us a limited license 
              to use, store, and process your content solely for the purpose of providing and improving our services.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              You are solely responsible for your User Content. You represent and warrant that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>You own or have the necessary rights to your User Content</li>
              <li>Your User Content does not violate the privacy rights, publicity rights, or other rights of any person</li>
              <li>Your User Content does not contain any unlawful, harmful, or objectionable material</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Voice Journaling Features</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Journal App offers voice journaling capabilities. By using these features, you agree to the following:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>You consent to the recording and processing of your voice for transcription purposes</li>
              <li>You will only record your own voice or have consent from any other individuals whose voices may be captured</li>
              <li>Voice recordings are processed in real-time and transcriptions become part of your journal content</li>
              <li>You are responsible for the content of your voice recordings</li>
              <li>You will not use voice features to record confidential information belonging to others</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              We use speech-to-text technology to transcribe your recordings. While we strive for accuracy, transcriptions 
              may contain errors. You are responsible for reviewing and correcting your transcribed content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">AI Coaching & Insights Features</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our AI-powered features, including coaching, weekly insights, and goal recommendations, are subject to the following terms:
            </p>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Nature of AI Features</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>AI coaching is provided for informational and personal development purposes only</li>
              <li>The AI coach does not provide professional therapy, medical advice, or psychological counseling</li>
              <li>AI-generated insights are based on pattern recognition and may not always be accurate or applicable</li>
              <li>You should not rely solely on AI recommendations for important life decisions</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">AI Coach Personalities</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Journal App offers various AI coach personalities. These personalities:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Represent different coaching styles and approaches</li>
              <li>Are AI-generated and do not represent real human coaches</li>
              <li>May be changed or discontinued at our discretion</li>
              <li>Should be chosen based on your personal preferences and needs</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Weekly Insights</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Weekly insights are automatically generated summaries of your journal entries:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Insights are generated using AI analysis of your journal content</li>
              <li>The accuracy and relevance of insights depends on the content you provide</li>
              <li>Insights are meant to enhance self-reflection, not replace professional guidance</li>
            </ul>

            <p className="text-gray-700 leading-relaxed font-medium">
              If you are experiencing a mental health crisis or emergency, please contact your local emergency services 
              or a qualified mental health professional immediately. The AI coach is not equipped to handle emergencies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Goals & Progress Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Journal App provides goal setting and progress tracking features:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>You are responsible for setting realistic and achievable goals</li>
              <li>Progress tracking is based on information you provide and may not reflect actual progress</li>
              <li>Goal recommendations from AI are suggestions only and may not suit your circumstances</li>
              <li>Milestones and deadlines are self-set and we do not guarantee achievement of any goals</li>
              <li>You may link journal entries to goals; linked entries remain subject to User Content terms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Integrations</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Google Calendar Integration</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you connect your Google Calendar to Journal App:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>You authorize us to access your calendar data according to the permissions you grant</li>
              <li>Calendar data is used to provide context-aware coaching and insights</li>
              <li>You are responsible for ensuring you have the right to share calendar information that may include events with others</li>
              <li>We are not responsible for any issues arising from calendar integration, including scheduling conflicts</li>
              <li>You may disconnect the integration at any time through your account settings</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Google Authentication</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you choose to authenticate using Google:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>You agree to Google's Terms of Service in addition to these terms</li>
              <li>We receive basic profile information as authorized by you</li>
              <li>You are responsible for maintaining the security of your Google account</li>
              <li>Changes to your Google account may affect your access to Journal App</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">General Third-Party Terms</h3>
            <p className="text-gray-700 leading-relaxed">
              Third-party integrations are provided "as is" and may be modified or discontinued. We are not 
              responsible for the availability, accuracy, or functionality of third-party services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Theme Customization</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Journal App allows you to customize the appearance of the application:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Theme customizations are stored with your account</li>
              <li>Custom themes you create are for personal use only</li>
              <li>We reserve the right to remove themes that violate our policies</li>
              <li>Pre-made themes are provided by Journal App and may be modified or removed</li>
              <li>Theme compatibility may vary across devices and browsers</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prohibited Uses</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You may not use Journal App:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>In any way that violates any applicable national or international law or regulation</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material without our prior written consent</li>
              <li>To impersonate or attempt to impersonate the Company, another user, or any other person or entity</li>
              <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the service</li>
              <li>To attempt to gain unauthorized access to any portion of the service or any other systems or networks</li>
              <li>To use AI features to generate harmful, illegal, or misleading content</li>
              <li>To share your account credentials with others</li>
              <li>To abuse voice features by recording content that violates these terms</li>
              <li>To manipulate or exploit the goal tracking system</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Availability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We strive to maintain the availability of our service, but we do not guarantee that the service will 
              always be available or uninterrupted. We may suspend, withdraw, or restrict the availability of all or 
              any part of our service for business and operational reasons.
            </p>
            <p className="text-gray-700 leading-relaxed">
              This includes, but is not limited to: AI coaching features, voice transcription, calendar integration, 
              weekly insights, and theme customization. We will make reasonable efforts to notify users of planned 
              maintenance or significant service changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To the maximum extent permitted by applicable law, Journal App shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether 
              incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses 
              resulting from:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Your use of or inability to use the service</li>
              <li>Any AI-generated content, advice, or recommendations</li>
              <li>Errors in voice transcription</li>
              <li>Third-party integration issues or data synchronization problems</li>
              <li>Loss of journal entries, goals, or other user content</li>
              <li>Unauthorized access to your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless Journal App and its affiliates, officers, directors, employees, 
              and agents from any claims, damages, losses, or expenses (including reasonable attorney's fees) arising 
              from your use of the service, your User Content, your violation of these Terms, or your violation of 
              any rights of another.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may terminate or suspend your account and bar access to the service immediately, without prior 
              notice or liability, under our sole discretion, for any reason whatsoever, including but not limited 
              to a breach of the Terms.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Upon termination, your right to use the service will immediately cease. If you wish to terminate your 
              account, you may do so through the account settings. Upon termination, your data will be handled 
              according to our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision 
              is material, we will provide at least 30 days' notice prior to any new terms taking effect by posting 
              on this page and/or sending you an email notification. What constitutes a material change will be 
              determined at our sole discretion. Your continued use of the service after changes become effective 
              constitutes acceptance of the revised terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed and construed in accordance with applicable laws, without regard to its 
              conflict of law provisions. Any legal action or proceeding arising out of or related to these Terms 
              shall be brought exclusively in the courts of competent jurisdiction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Severability</h2>
            <p className="text-gray-700 leading-relaxed">
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited 
              or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force 
              and effect and enforceable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-gray-700 mt-4">
              Email: <a href="mailto:wvparrone@gmail.com" className="text-orange-600 hover:text-orange-700">wvparrone@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
