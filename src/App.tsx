import { useState, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import CartPage from './pages/CartPage'
import AddressPage from './pages/AddressPage'
import PaymentPage from './pages/PaymentPage'
import ConfirmationPage from './pages/ConfirmationPage'
import OrderDetailsPage from './pages/OrderDetailsPage'
import ReportsListPage from './pages/ReportsListPage'
import CompareReportsPage from './pages/CompareReportsPage'
import UploadReportPage from './pages/UploadReportPage'
import UploadReportDetailsPage from './pages/UploadReportDetailsPage'
import AnalysingReportPage from './pages/AnalysingReportPage'
import ReviewReportPage from './pages/ReviewReportPage'
import PackagesPage from './pages/PackagesPage'
import OrdersPage from './pages/OrdersPage'
import ReportPage from './pages/ReportPage'
import TestPage from './pages/TestPage'
import type { CartItem, TestCardProps } from './types'

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const handleAddToCart = useCallback((test: TestCardProps) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.name === test.name)
      if (existing) return prev.map(i => i.name === test.name ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { name: test.name, type: test.type, price: test.price, originalPrice: test.originalPrice, quantity: 1 }]
    })
  }, [])

  const handleUpdateQty = useCallback((name: string, delta: number) => {
    setCartItems(prev =>
      prev
        .map(i => i.name === name ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0)
    )
  }, [])

  return (
    <Routes>
      <Route path="/" element={<TestPage onAddToCart={handleAddToCart} />} />
      <Route path="/cart" element={<CartPage items={cartItems} onUpdateQty={handleUpdateQty} />} />
      <Route path="/address" element={<AddressPage items={cartItems} />} />
      <Route path="/payment" element={<PaymentPage items={cartItems} />} />
      <Route path="/confirmation" element={<ConfirmationPage />} />
      <Route path="/orders" element={<OrdersPage items={cartItems} />} />
      <Route path="/order-details" element={<OrderDetailsPage items={cartItems} />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="/reports" element={<ReportsListPage />} />
      <Route path="/compare-reports" element={<CompareReportsPage />} />
      <Route path="/upload-report" element={<UploadReportPage />} />
      <Route path="/upload-report-details" element={<UploadReportDetailsPage />} />
      <Route path="/analysing-report" element={<AnalysingReportPage />} />
      <Route path="/review-report" element={<ReviewReportPage />} />
      <Route path="/packages" element={<PackagesPage onAddToCart={handleAddToCart} />} />
    </Routes>
  )
}