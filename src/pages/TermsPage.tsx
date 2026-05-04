import { Navbar, Footer } from '../components'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

export default function TermsPage() {
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
            TERMS AND CONDITIONS
          </h1>

          <p style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '8px' }}>
            Nucleotide Healthcare Private Limited
          </p>
          <p style={{ fontSize: '14px', color: '#6B7280', fontStyle: 'italic', marginBottom: '32px' }}>
            Last Updated: 18/12/2025
          </p>

          {/* Terms Content */}
          <div style={{ width: '100%' }}>
            {/* Section 1 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                1. Introduction and Acceptance of Terms
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                These Terms and Conditions ("Terms") govern the access to and use of the website, mobile application, and related digital platforms (collectively, the "Platform") operated by <strong>Nucleotide Healthcare Private Limited</strong>, a company incorporated under the Companies Act, 2013, and having its registered office in India ("Nucleotide", "Company", "we", "us", or "our").
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                By accessing, browsing, registering on, or using the Platform or any services made available through it, the user ("User", "you", or "your") acknowledges that they have read, understood, and agreed to be bound by these Terms, along with the applicable Privacy Policy and any other policies referenced herein. If you do not agree with these Terms, you must not use the Platform or the services.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 2 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                2. Nature and Scope of Services
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                Nucleotide Healthcare Private Limited provides a digital health technology platform offering a range of healthcare-related services, including but not limited to genomic analytics, diagnostic facilitation, preventive health insights, and other health and wellness services, which may be introduced from time to time.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Certain services may be delivered directly by Nucleotide, while others may be facilitated or fulfilled through independent third-party service providers, laboratories, hospitals, clinics, or other healthcare partners. Nucleotide's role in such services may vary depending on the nature of the offering and shall be limited to the scope expressly described at the time of service delivery.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 3 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                3. Laboratory Services and Third-Party Involvement
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                Where biological sample collection, laboratory processing, or DNA sequencing is required for the delivery of services, such activities are performed by independent third-party diagnostic laboratories. At present, Nucleotide has partnered with MedGenome Labs Limited, an accredited laboratory operating under its own clinical, ethical, and regulatory framework, to perform blood sample collection and DNA sequencing. The Platform may integrate or facilitate services provided by multiple independent third-party service providers, and Nucleotide does not control or assume responsibility for services performed independently by such providers beyond its defined role.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                The User acknowledges and agrees that all responsibilities relating to sample collection, handling, transportation, sequencing, laboratory quality control, and compliance with applicable medical and diagnostic regulations rest solely with the laboratory partner. Nucleotide does not exercise control over, nor does it assume responsibility for, the operational or clinical aspects of laboratory services.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 4 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                4. Genomic Data Receipt and Use
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                Following completion of sequencing by the laboratory partner, Nucleotide receives raw genomic output data in standard formats generated by the laboratory. Such data is received solely for the purpose of computational analysis and interpretation through Nucleotide's proprietary analytical systems.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Nucleotide does not alter, manipulate, or re-sequence the laboratory-generated raw data and does not perform any biological or laboratory-level processing. The User understands that the accuracy and integrity of the raw genomic data are dependent on the laboratory processes and are outside Nucleotide's direct control.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 5 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                5. Nature of Reports and Disclaimers
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                All reports, insights, and outputs generated by Nucleotide are analytical and informational in nature. These outputs are intended to support health awareness, risk understanding, and informed discussions with qualified healthcare professionals.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                The services provided through the Platform do not constitute medical advice, diagnosis, treatment, or clinical recommendations. Users are strongly advised to consult licensed medical practitioners or genetic counselors before making any healthcare, lifestyle, or treatment-related decisions based on the information provided.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 6 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                6. User Obligations and Representations
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                The User represents and warrants that all information provided to Nucleotide, including personal details and health-related information, is accurate, complete, and up to date. The User further agrees to comply with any consent requirements, declarations, or procedural formalities mandated by the laboratory partner in connection with sample collection and sequencing.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                The User is responsible for maintaining the confidentiality of their account credentials and for all activities carried out through their account on the Platform.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 7 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                7. Data Privacy and Confidentiality
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                Nucleotide processes personal and genomic data in accordance with applicable Indian data protection laws and its Privacy Policy. Genomic and personal data are used strictly for the purpose of providing the services and improving platform functionality, subject to applicable legal requirements.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Nucleotide does not sell or commercially exploit personally identifiable information. Any data processing by third-party laboratories is governed by their respective consent frameworks and regulatory obligations.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 8 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                8. Intellectual Property Rights
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                All rights, title, and interest in and to the Platform, including its software, algorithms, analytical models, reports, content, design, and underlying technology, are the exclusive property of Nucleotide Healthcare Private Limited.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Subject to compliance with these Terms, the User is granted a limited, non-exclusive, non-transferable, and non-commercial right to access and use their reports solely for personal purposes. No part of the Platform or its content may be copied, modified, distributed, or exploited without prior written consent from Nucleotide.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 9 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                9. Limitation of Liability
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                To the maximum extent permitted under applicable law, Nucleotide shall not be liable for any loss, damage, or claim arising out of or in connection with laboratory services performed by third-party diagnostic partners, including sample collection, handling, transportation, or sequencing.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Nucleotide's total liability, if any, arising out of the services shall be limited to the amount paid by the User for the specific service giving rise to the claim. In no event shall Nucleotide be liable for any indirect, incidental, consequential, or special damages.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 10 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                10. Suspension and Termination
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Nucleotide reserves the right to suspend or terminate a User's access to the Platform, with or without notice, in the event of misuse, violation of these Terms, fraudulent activity, or where required to comply with applicable laws or regulatory directions.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 11 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                11. TRF Processing and Partner Laboratory Compliance
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                For services involving genomic analysis, Nucleotide acts as the primary provider for data processing and reporting, while utilizing authorized partner laboratories solely for sample collection and raw sequencing services.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                By accepting the Terms and Conditions and Privacy Policy through OTP-based login and electronic authentication, as displayed during the onboarding or purchase process, the User expressly authorizes Nucleotide to act as their designated representative for the limited purpose of preparing, executing, and submitting all required Test Requisition Forms (TRF) and related administrative documentation to authorized partner laboratories.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                Such electronic acceptance through successful OTP verification and continued use of the platform shall constitute valid and binding consent for Nucleotide to complete and sign TRF forms and associated documentation on the User's behalf, strictly for regulatory, compliance, and laboratory coordination purposes.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                No separate in-person or physical signature shall be required. The User's OTP-based authentication and acceptance of the Terms and Conditions and Privacy Policy shall serve as the governing authorization for these purposes.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 12 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                12. Amendments to Terms
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Nucleotide may modify or update these Terms from time to time. Any such modifications shall be effective upon being published on the Platform. Continued use of the Platform following such changes constitutes acceptance of the revised Terms.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 13 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                13. Governing Law and Jurisdiction
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                These Terms shall be governed by and construed in accordance with the laws of India. Any dispute arising out of or relating to these Terms or the services provided shall be subject to the exclusive jurisdiction of the competent courts at <strong>Bangalore, Karnataka, India.</strong>
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 14 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                14. Contact Information
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                For any questions or concerns relating to these Terms, you may contact:
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