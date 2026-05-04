import { useState } from 'react'
import { Navbar, Footer } from '../components'

interface FAQItem {
  question: string
  answer: string
}

const NAV_LINKS = [
  { label: 'Tests', href: '/' },
  { label: 'Packages', href: '/packages' },
  { label: 'Reports', href: '/reports' },
  { label: 'Metrics', href: '/metrics' },
  { label: 'Orders', href: '/orders' },
]

const FAQ_DATA: FAQItem[] = [
  
  
  {
    question: "When will I receive my test results?",
    answer: "Test result timelines vary depending on the type of test. Standard blood tests typically take 24-48 hours. You'll receive a notification via email and SMS once your results are ready. You can view and download your reports from your account dashboard."
  },
  {
    question: "Are my health data and test results secure?",
    answer: "Yes, we take data security very seriously. All personal and health-related data is encrypted and stored securely in compliance with applicable Indian data protection laws. We use industry-standard security measures and never sell your personal or genetic data to third parties."
  },
  
  
  {
    question: "Do I need a doctor's prescription to book tests?",
    answer: "Most of our diagnostic tests do not require a prescription. However, certain specialized tests may require a doctor's recommendation. If a prescription is needed, this will be clearly indicated on the test page."
  },
  
  
  {
    question: "How do I track my order?",
    answer: "You can track your order status by logging into your account and visiting the 'Orders' section. You'll see the current status of your order including sample collection, processing, and report generation stages."
  },
  
  
  {
    question: "Can I download my test reports?",
    answer: "Yes, all your test reports are available for download in PDF format from your account dashboard. You can access them anytime and share them with your healthcare providers as needed."
  },
  
  {
    question: "Do you offer home sample collection in all areas?",
    answer: "We offer home sample collection in most major cities and towns across India. During the booking process, you can check if home collection is available in your area by entering your pincode."
  },
  
  
  {
    question: "What if I have questions about my report?",
    answer: "If you have questions about your test results, you can contact our support team at info@nucleotide.life or call +91 9403891587. For medical interpretation and advice, we recommend consulting with a qualified healthcare professional."
  }
  
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

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
          maxWidth: '900px',
          margin: '0 auto',
          padding: '40px 32px 48px',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 600,
              color: '#1F2937',
              marginBottom: '16px',
              lineHeight: '40px',
            }}>
              Frequently Asked Questions
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#6B7280',
              lineHeight: '24px',
            }}>
              Find answers to common questions about our services, testing process, and more.
            </p>
          </div>

          {/* FAQ List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {FAQ_DATA.map((faq, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Question */}
                <button
                  onClick={() => toggleFAQ(index)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: openIndex === index ? '#F9FAFB' : '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (openIndex !== index) {
                      e.currentTarget.style.backgroundColor = '#F9FAFB'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (openIndex !== index) {
                      e.currentTarget.style.backgroundColor = '#FFFFFF'
                    }
                  }}
                >
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1F2937',
                    lineHeight: '24px',
                    paddingRight: '16px',
                  }}>
                    {faq.question}
                  </span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    style={{
                      flexShrink: 0,
                      transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <path
                      d="M5 7.5L10 12.5L15 7.5"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Answer */}
                {openIndex === index && (
                  <div
                    style={{
                      padding: '0 24px 20px 24px',
                      backgroundColor: '#F9FAFB',
                    }}
                  >
                    <p style={{
                      fontSize: '15px',
                      color: '#4B5563',
                      lineHeight: '24px',
                      margin: 0,
                    }}>
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div style={{
            marginTop: '48px',
            padding: '32px',
            backgroundColor: '#F9FAFB',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#1F2937',
              marginBottom: '12px',
            }}>
              Still have questions?
            </h2>
            <p style={{
              fontSize: '15px',
              color: '#6B7280',
              marginBottom: '20px',
              lineHeight: '24px',
            }}>
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <a
              href="contact-us"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#8B5CF6',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 600,
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7C3AED'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8B5CF6'}
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
