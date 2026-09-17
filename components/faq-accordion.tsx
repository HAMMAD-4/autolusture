'use client';

import { useState } from 'react';

export interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  className?: string;
}

export function FaqAccordion({ items, className = '' }: FaqAccordionProps) {
  // Only the first FAQ is opened by default (index 0)
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    // When an FAQ is clicked, it opens and the previously opened one closes
    // Clicking the already opened one can collapse it
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div
      className={`faq-accordion-container ${className}`}
      style={{
        maxWidth: 780,
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className={`faq-accordion-card${isOpen ? ' is-open' : ''}`}
            style={{
              background: isOpen ? '#102021' : '#f5f3ed',
              border: isOpen ? '1px solid rgba(200,242,93,0.35)' : '1px solid #d9ddd6',
              borderRadius: 14,
              overflow: 'hidden',
              transition: 'background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
              boxShadow: isOpen ? '0 8px 24px rgba(0,0,0,0.18)' : 'none'
            }}
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              aria-expanded={isOpen}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 22px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                gap: 16
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 15,
                  color: isOpen ? '#ffffff' : '#0d1517',
                  lineHeight: 1.4,
                  letterSpacing: -0.2,
                  transition: 'color 0.2s ease'
                }}
              >
                {item.q}
              </span>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: isOpen ? '#c8f25d' : '#e7e5dc',
                  color: isOpen ? '#0d1517' : '#0d1517',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'transform 0.25s ease, background 0.2s ease, color 0.2s ease',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </button>

            {isOpen && (
              <div
                style={{
                  padding: '0 22px 20px',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  paddingTop: 16
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    color: '#cbd5d2',
                    lineHeight: 1.75,
                    margin: 0
                  }}
                >
                  {item.a}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
