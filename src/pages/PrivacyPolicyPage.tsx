import { Navbar, Footer } from '../components'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar logoSrc="/favicon.svg" logoAlt="Nucleotide" links={NAV_LINKS} ctaLabel="My Cart" onCtaClick={() => window.location.href = '/cart'} />
      <div style={{ 
        fontFamily: 'Poppins, sans-serif',
        backgroundColor: '#FFFFFF',
        minHeight: '100vh',
        paddingTop: '80px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '40px 32px 48px',
        }}>
          {/* Main Title */}
          <h1 style={{
            fontSize: '32px',
            fontWeight: 600,
            color: '#1F2937',
            textAlign: 'center',
            marginBottom: '40px',
            lineHeight: '40px',
          }}>
            PRIVACY POLICY
          </h1>

          <p style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '8px' }}>
            Nucleotide Healthcare Private Limited
          </p>
          <p style={{ fontSize: '14px', color: '#6B7280', fontStyle: 'italic', marginBottom: '32px' }}>
            Last Updated: 18/12/2025
          </p>

          {/* Privacy Policy Content */}
          <div style={{ width: '100%' }}>
            {/* Section 1 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                1. Introduction
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                This Privacy Policy describes how <strong>Nucleotide Healthcare Private Limited</strong>, a company incorporated under the Companies Act, 2013 and having its registered office in India ("Nucleotide", "we", "us", or "our"), collects, uses, stores, discloses, and protects personal data and health-related information of users ("User", "you", or "your") who access or use our website, mobile applications, and any other digital platforms or interfaces operated by Nucleotide (collectively referred to as the "Platform").
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Nucleotide is committed to protecting the privacy, confidentiality, and security of user data and processes such data in accordance with applicable laws in India. By accessing or using the Platform, registering an account, or availing any services, you acknowledge that you have read, understood, and agreed to the terms of this Privacy Policy.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 2 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                2. Scope of Services
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                Nucleotide operates a digital health technology platform that offers a range of healthcare-related services, including genomic analysis, diagnostic facilitation, preventive health insights, wellness-related services, and other healthcare offerings that may be introduced from time to time. Certain services may be delivered directly by Nucleotide, while others may be facilitated or fulfilled through independent third-party service providers, laboratories, hospitals, clinics, or other healthcare partners.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Depending on the nature of the service availed, Nucleotide may collect personal data and health-related data either directly from the User or receive such data from authorized third-party service providers strictly for the purpose of delivering the requested service.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 3 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                3. Information We Collect
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                Nucleotide may collect personal information such as name, contact details, age, gender, location, and other identification details provided during account registration or service usage. We may also collect health-related information, including genomic data, diagnostic data, and service-related inputs, where such data is required for providing healthcare insights and reports.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                In addition, Nucleotide may collect technical and usage information such as device identifiers, IP address, browser type, operating system, application usage data, and interaction logs to ensure platform functionality, security, and performance improvement.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 4 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                4. Website and Mobile Application Access and OTP Authentication
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                Access to the Platform may be provided through both web browsers and mobile applications. Nucleotide uses One-Time Password (OTP) based authentication mechanisms for login and account access. By logging in using OTP, the User expressly consents to the collection, storage, processing, and use of their personal and health-related data for the purposes described in this Privacy Policy.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                OTP-based authentication is implemented to enhance security and prevent unauthorized access to user accounts.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 5 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                5. Laboratory and Third-Party Service Data
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                Where services involve diagnostic testing, genomic sequencing, or other laboratory-based procedures, such activities are performed by independent, accredited third-party service providers operating under their own clinical, ethical, and regulatory frameworks. Nucleotide does not collect, store, transport, or process biological samples.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Nucleotide may receive digital output data generated by such third-party service providers solely for the purpose of computational analysis, interpretation, and report generation through its proprietary systems.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 6 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                6. Use of Information
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Nucleotide uses the collected data to provide and improve services, generate personalized health insights and reports, manage user accounts, communicate service-related information, ensure platform security, comply with legal obligations, and enhance user experience. Data may also be used in anonymized or aggregated form for analytics, research, and platform improvement, provided such use does not identify individual users.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 7 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                7. Data Sharing and Disclosure
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                Nucleotide may share user data with authorized third-party service providers strictly on a need-to-know basis for service delivery, payment processing, customer support, regulatory compliance, or technical operations. Such third parties are contractually obligated to protect the confidentiality and security of the data.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Nucleotide does not sell personal data or use genetic or health-related data for marketing purposes without explicit user consent. Data may be disclosed where required by law, court order, or regulatory authority.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 8 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                8. Data Retention
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Nucleotide retains personal and health-related data only for as long as necessary to fulfill the purposes for which it was collected, comply with legal and regulatory requirements, resolve disputes, and enforce agreements. Retention periods may vary depending on the nature of the data and applicable legal obligations.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 9 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                9. Data Deletion and User Rights
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                Users may request deletion of their personal data by sending a written request from their registered email address to <strong>info@nucleotide.life</strong>. For security and fraud-prevention purposes, Nucleotide may require OTP-based verification or additional identity confirmation before processing any data deletion request.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Upon successful verification, Nucleotide will delete or anonymize the user's personal data, except where retention is required under applicable law or regulatory obligations.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 10 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                10. Data Security
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Nucleotide implements reasonable technical and organizational measures to protect personal and health-related data against unauthorized access, loss, misuse, alteration, or disclosure. While we strive to protect user data, no system can be guaranteed to be completely secure, and users acknowledge and accept this inherent risk.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 11 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                11. Children's Privacy
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                The Platform is not intended for use by individuals below the age of 18 years without the involvement and consent of a parent or legal guardian. Nucleotide does not knowingly collect personal data from minors without appropriate authorization.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 12 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                12. Limitation of Liability
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                To the maximum extent permitted under applicable law, Nucleotide shall not be liable for any loss, damage, or claim arising out of or in connection with third-party services, including laboratory or diagnostic services, beyond Nucleotide's defined role in data analysis and reporting.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 13 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                13. Changes to This Privacy Policy
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Nucleotide may update this Privacy Policy from time to time. Any changes shall be effective upon publication on the Platform. Continued use of the Platform after such updates constitutes acceptance of the revised Privacy Policy.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 14 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                14. Governing Law and Jurisdiction
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                This Privacy Policy shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to this Privacy Policy shall be subject to the exclusive jurisdiction of the competent courts at <strong>Bangalore, Karnataka, India.</strong>
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 15 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                15. Contact Information
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                For any questions or concerns relating to this Privacy Policy, you may contact:
              </p>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937', lineHeight: '24px' }}>
                Nucleotide Healthcare Private Limited
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563' }}>
                Email: <strong>info@nucleotide.life</strong>
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
