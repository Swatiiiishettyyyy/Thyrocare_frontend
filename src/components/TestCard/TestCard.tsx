import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TestCardProps } from '../../types'
import cartIcon from '../../assets/figma/Test-detail/cart.svg'
import fileIcon from '../../assets/figma/file.svg'
import parametersIcon from '../../assets/figma/icons.svg'

const TestCard = React.memo(function TestCard({
  name, description, price, originalPrice, offerPercent,
  tests, fasting, type,
  thyrocareProductId, maxBeneficiaries,
  reportTime = 'within 24 hours',
  parametersLabel,
}: TestCardProps) {
  const navigate = useNavigate()

  // TEMP: hardcode offer badge to match Figma (167:2331) even if API discount is missing.
  // Once API discount is reliable everywhere, we can restore conditional rendering.
  const offerLabel = offerPercent?.trim() || '33% OFF'

  const goToDetail = useCallback(() => {
    const id = thyrocareProductId ?? encodeURIComponent(name)
    navigate(`/test/${id}`, {
      state: {
        test: {
          name,
          description,
          price,
          originalPrice,
          offerPercent,
          tests,
          fasting,
          type,
          thyrocareProductId,
          maxBeneficiaries,
        },
      },
    })
  }, [navigate, name, description, price, originalPrice, offerPercent, tests, fasting, type, thyrocareProductId, maxBeneficiaries])

  const secondTileLabel = parametersLabel ?? (type === 'Package' ? 'Tests included' : 'Parameters ')
  const metaValuePadLeft = 'var(--test-card-meta-pad)'
  const metaValuePadParams = 'calc(var(--test-card-meta-pad) - 1px)'

  const padX = 'var(--card-pad-x)'
  const padYTop = 'var(--card-pad-y-top)'

  return (
    <article
      onClick={goToDetail}
      className="test-card cursor-pointer h-full min-h-0 min-w-0 w-full box-border border border-[#E7E1FF] bg-white flex flex-col"
      style={{ borderRadius: 'var(--test-card-shell-radius)', padding: 'var(--test-card-shell-pad)' }}
    >
      <div
        className="flex flex-1 flex-col min-h-0 overflow-hidden w-full"
        style={{ borderRadius: 'var(--test-card-inner-radius)' }}
      >
        {/* Top: lavender → white (Figma); bottom: solid white footer below dashed rule */}
        <div
          className="flex flex-1 flex-col min-h-0 w-full"
          style={{
            background: 'linear-gradient(180deg, #E7E1FF 0%, #FFFFFF 82.054%)',
          }}
        >
          <div className="flex items-start justify-between min-w-0 shrink-0" style={{ gap: 'clamp(8px, 1.2vmin, 12px)' }}>
            <span
              className="shrink-0 flex items-center justify-center text-white type-ui"
              style={{
                borderTopLeftRadius: 'var(--test-card-inner-radius)',
                borderBottomRightRadius: '8px',
                paddingLeft: 'clamp(12px, 0.75rem + 1.4vmin, 30px)',
                paddingRight: 'clamp(12px, 0.75rem + 1.4vmin, 30px)',
                backgroundImage: 'linear-gradient(125.97deg, #101129 2.88%, #2A2C5B 93.49%)',
                height: 'var(--test-card-badge-h)',
              }}
            >
              <span className="whitespace-nowrap">{type}</span>
            </span>
            <span
              className="min-w-0 max-w-[min(100%,220px)] rounded-[8px] border border-[#E7E1FF] bg-white"
              style={{
                marginTop: 'var(--test-card-shell-pad)',
                marginRight: 'var(--test-card-shell-pad)',
                paddingLeft: 'var(--test-card-pill-pad-x)',
                paddingRight: 'var(--test-card-pill-pad-x)',
                paddingTop: 'var(--test-card-pill-pad-y)',
                paddingBottom: 'var(--test-card-pill-pad-y)',
              }}
            >
              <span className="test-card__fasting text-right break-words type-body text-[#414141]">
                {fasting}
              </span>
            </span>
          </div>

          <div
            className="flex flex-1 flex-col min-h-0 min-w-0"
            style={{
              paddingLeft: padX,
              paddingRight: padX,
              paddingTop: padYTop,
            }}
          >
            <div
              className="test-card__intro flex flex-1 flex-col min-h-0 min-w-0"
              style={{ gap: 'var(--test-card-intro-gap)' }}
            >
              <h3 className="type-card-title m-0 text-[#161616] line-clamp-3" title={name}>
                {name}
              </h3>
              <p className="type-body m-0 text-[#828282] line-clamp-4 overflow-hidden [overflow-wrap:anywhere]" title={description}>
                {description}
              </p>
            </div>

            <div
              className="grid grid-cols-2 w-full min-w-0 shrink-0"
              style={{ marginTop: 'var(--test-card-gap-lg)', gap: 'var(--test-card-tile-gap)' }}
            >
              <div
                className="bg-white shadow-[0px_4px_53.9px_0px_rgba(136,107,249,0.1)] rounded-[8px] box-border flex items-center min-w-0"
                style={{
                  height: 'var(--test-card-tile-h)',
                  minHeight: 'var(--test-card-tile-h)',
                  paddingLeft: 'var(--test-card-tile-pad-x)',
                  paddingRight: 'var(--test-card-tile-pad-x)',
                  paddingTop: 'var(--test-card-tile-pad-y)',
                  paddingBottom: 'var(--test-card-tile-pad-y)',
                }}
              >
                <img src={fileIcon} alt="" className="test-card-meta-icon block shrink-0" />
                <div className="min-w-0 flex flex-col" style={{ gap: 'var(--test-card-tile-text-gap)', marginLeft: 'var(--test-card-tile-inner-gap)' }}>
                  <span className="test-card__meta-label type-body text-[#828282] whitespace-nowrap">
                    {'Report Time: '}
                  </span>
                  <span className="test-card__meta-value type-body text-[#161616] break-words">
                    {reportTime}
                  </span>
                </div>
              </div>

              <div
                className="bg-white shadow-[0px_4px_53.9px_0px_rgba(136,107,249,0.1)] rounded-[8px] box-border flex items-center min-w-0"
                style={{
                  height: 'var(--test-card-tile-h)',
                  minHeight: 'var(--test-card-tile-h)',
                  paddingLeft: 'var(--test-card-tile-pad-x)',
                  paddingRight: 'var(--test-card-tile-pad-x)',
                  paddingTop: 'var(--test-card-tile-pad-y)',
                  paddingBottom: 'var(--test-card-tile-pad-y)',
                }}
              >
                <img src={parametersIcon} alt="" className="test-card-meta-icon block shrink-0" />
                <div className="min-w-0 flex flex-col" style={{ gap: 'var(--test-card-tile-text-gap)', marginLeft: 'var(--test-card-tile-inner-gap)' }}>
                  <span className="test-card__meta-label type-body text-[#828282] break-words">
                    {secondTileLabel}
                  </span>
                  <span className="test-card__meta-value type-body text-[#161616]">
                    {tests}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full border-t border-dashed border-[#8B5CF6] shrink-0" style={{ marginTop: 'var(--test-card-gap-lg)' }} />
          </div>
        </div>

        <div
          className="shrink-0 w-full bg-white min-w-0"
          style={{
            paddingLeft: padX,
            paddingRight: padX,
            paddingTop: 'var(--test-card-gap-md)',
            paddingBottom: 'var(--card-pad-y-bottom)',
          }}
        >
          <div className="test-card__footer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[16px] shrink-0">
            <div className="min-w-0">
              <div className="type-price text-[#161616]" style={{ lineHeight: '31px' }}>
                ₹{price}
              </div>
              <div className="flex items-center gap-[6px] flex-wrap" style={{ marginTop: 'var(--test-card-price-stack-gap)' }}>
                <span className="type-price-meta text-[#828282] line-through whitespace-nowrap">
                  ₹{originalPrice}
                </span>
                <span className="offer-badge">
                  <span className="offer-badge__text">{offerLabel}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={e => { e.stopPropagation(); goToDetail() }}
              className="test-card__cta type-ui shrink-0 w-full sm:w-auto rounded-[8px] bg-[#8B5CF6] py-[8px] text-white flex items-center justify-center gap-[10px]"
              style={{ height: 'var(--test-card-cta-h)', paddingInline: 'var(--test-card-cta-px)' }}
            >
              <img
                src={cartIcon}
                alt=""
                className="block shrink-0"
                style={{ width: 'var(--test-card-cart-w)', height: 'var(--test-card-cart-h)' }}
              />
              <span className="whitespace-nowrap">Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
})

export { TestCard }
