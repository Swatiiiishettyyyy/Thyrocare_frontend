import { Navbar, Footer } from '../components'

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

export default function RefundPolicyPage() {
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
            REFUND AND CANCELLATION POLICY
          </h1>

          <p style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '8px' }}>
            Nucleotide Healthcare Private Limited
          </p>
          <p style={{ fontSize: '14px', color: '#6B7280', fontStyle: 'italic', marginBottom: '32px' }}>
            Last Updated: 18/12/2025
          </p>

          {/* Policy Content */}
          <div style={{ width: '100%' }}>
            {/* Section 1 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                1. Introduction
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                This Refund and Cancellation Policy ("Policy") governs the cancellation and refund terms applicable to services offered through the website, mobile application, and other digital platforms operated by <strong>Nucleotide Healthcare Private Limited</strong>, a company incorporated under the Companies Act, 2013 and having its registered office in India ("Nucleotide", "we", "us", or "our").
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                This Policy should be read in conjunction with our Terms and Conditions and Privacy Policy. By placing an order, making a payment, or availing any service through the Platform, the user ("User", "you", or "your") agrees to be bound by this Policy.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 2 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                2. Nature of Services and Advance Payments
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                Nucleotide operates a digital health technology platform that facilitates and delivers healthcare-related services, including genomic analysis, diagnostic facilitation, preventive health insights, and other health and wellness services. Many of these services are fulfilled in coordination with independent third-party service providers such as laboratories, clinics, or other healthcare partners.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Certain services offered through the Platform require advance payment and involve operational commitments, including but not limited to partner allocation, logistics planning, appointment scheduling, data processing setup, and system provisioning. Accordingly, once an order is confirmed, the service enters an execution or preparation phase.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 3 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                3. Cancellation by User
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                Cancellation requests may be submitted by the User prior to the initiation of service execution. The ability to cancel an order depends on the nature of the service and the stage of processing at the time the cancellation request is received.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '8px' }}>
                Where service execution has not commenced and no third-party costs have been incurred, Nucleotide may, at its discretion, allow cancellation. However, once service execution has commenced, including initiation of partner processes, appointment scheduling, data provisioning, or laboratory coordination, cancellation may not be permitted.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                For services involving diagnostic testing, genomic sequencing, or partner-facilitated operations, cancellation requests received after order confirmation are generally not eligible for cancellation due to irreversible operational and regulatory processes.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 4 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                4. Refund Eligibility
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                Refunds, where applicable, are subject to verification and approval by Nucleotide. Refund eligibility depends on multiple factors, including but not limited to the type of service, timing of the request, and whether the service has been initiated or completed.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                Refunds shall not be provided in the following circumstances:
              </p>
              <ul style={{ paddingLeft: '24px', marginBottom: '12px' }}>
                <li style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '8px' }}>
                  Where service execution has commenced
                </li>
                <li style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '8px' }}>
                  Where third-party service providers have been assigned or engaged
                </li>
                <li style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '8px' }}>
                  Where data processing or analytical workflows have been initiated
                </li>
                <li style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '8px' }}>
                  Where delays or issues arise due to incorrect information provided by the User
                </li>
                <li style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '8px' }}>
                  Where services are completed or substantially delivered
                </li>
              </ul>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Refunds shall also not be applicable for services that are customized, personalized, or based on user-specific health or genomic data.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 5 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                5. Service Failure or Errors
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                In the event that a service cannot be delivered due to a verified technical error, system failure, or operational issue attributable solely to Nucleotide, the Company may, at its discretion, offer a partial refund, full refund, service reprocessing, or service credit, depending on the nature and extent of the issue.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Nucleotide shall not be responsible for delays, failures, or issues arising from third-party service providers beyond its defined role, including laboratory operations, logistics delays, or regulatory requirements.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 6 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                6. Refund Processing
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                Approved refunds, if any, shall be processed using the original payment method used by the User at the time of transaction. Refund timelines may vary depending on the payment gateway, bank processing times, and applicable financial regulations.
              </p>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Nucleotide shall not be responsible for delays caused by banks, payment gateways, or external financial institutions.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 7 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                7. No Cash Refunds
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                All refunds shall be processed electronically. Cash refunds shall not be provided under any circumstances.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 8 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                8. Modifications to Services
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Nucleotide reserves the right to modify, reschedule, or substitute services where required due to operational, regulatory, or partner-related constraints. Such modifications shall not automatically entitle the User to a refund unless explicitly determined by Nucleotide.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 9 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                9. Fraud, Abuse, and Misuse
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Nucleotide reserves the right to deny refunds or cancellations in cases involving suspected fraud, abuse of the Platform, violation of Terms and Conditions, or misuse of services.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 10 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                10. Changes to This Policy
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                Nucleotide may update or modify this Refund and Cancellation Policy from time to time. Any changes shall be effective upon publication on the Platform. Continued use of the Platform following such changes constitutes acceptance of the revised Policy.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 11 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                11. Governing Law and Jurisdiction
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px' }}>
                This Policy shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to this Policy shall be subject to the exclusive jurisdiction of the competent courts at <strong>Bangalore, Karnataka, India.</strong>
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '0.5px solid #E5E7EB', margin: '24px 0' }} />

            {/* Section 12 */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', marginBottom: '12px' }}>
                12. Contact Information
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563', lineHeight: '24px', marginBottom: '12px' }}>
                For any questions or concerns relating to this terms, you may contact:
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
