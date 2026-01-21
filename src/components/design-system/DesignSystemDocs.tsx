import React from 'react';
import { WellnessCard } from './WellnessCard';
import { SerifHeading } from './SerifHeading';

export function DesignSystemDocs() {
  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      <div className="text-center space-y-4">
        <SerifHeading size="4xl">Wellness Design System</SerifHeading>
        <p className="text-lg opacity-70 max-w-2xl mx-auto">
          A comprehensive UI component library for mental health and wellness SaaS applications,
          featuring soft gradients, elegant typography, and calming aesthetics.
        </p>
      </div>

      {/* Design Principles */}
      <section className="space-y-6">
        <SerifHeading size="xl">Design Principles</SerifHeading>
        <div className="grid md:grid-cols-3 gap-6">
          <WellnessCard>
            <h3 className="font-medium mb-2">🌸 Calm & Welcoming</h3>
            <p className="text-sm opacity-70">
              Soft pastel gradients and rounded corners create a soothing, non-threatening environment
              that encourages engagement without overwhelming users.
            </p>
          </WellnessCard>
          <WellnessCard>
            <h3 className="font-medium mb-2">✨ Elegant Typography</h3>
            <p className="text-sm opacity-70">
              Playfair Display serif for headlines adds personality and warmth, while Inter provides
              clean readability for body text and UI elements.
            </p>
          </WellnessCard>
          <WellnessCard>
            <h3 className="font-medium mb-2">🎨 Thoughtful Color</h3>
            <p className="text-sm opacity-70">
              Each color carries meaning: coral for action, lavender for calm, blue for trust, and
              pink for care - creating emotional resonance throughout the experience.
            </p>
          </WellnessCard>
        </div>
      </section>

      {/* Color Palette */}
      <section className="space-y-6">
        <SerifHeading size="xl">Color Palette</SerifHeading>
        <WellnessCard>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Gradient Backgrounds</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-[#ffecd2] via-[#ffd7ba] to-[#fcb69f]" />
                  <p className="text-xs mt-2 text-center">Peach</p>
                </div>
                <div>
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-[#e6dff5] via-[#d4c5f0] to-[#c8b8e8]" />
                  <p className="text-xs mt-2 text-center">Lavender</p>
                </div>
                <div>
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-[#fef3e2] via-[#ffecd2] to-[#ffd7ba]" />
                  <p className="text-xs mt-2 text-center">Cream</p>
                </div>
                <div>
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-[#ffd6e8] via-[#ffc9df] to-[#ffb5d5]" />
                  <p className="text-xs mt-2 text-center">Pink</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Accent Colors</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="h-16 rounded-2xl bg-[#ff8a65]" />
                  <p className="text-xs mt-2 text-center">Coral</p>
                </div>
                <div>
                  <div className="h-16 rounded-2xl bg-[#b8a0d6]" />
                  <p className="text-xs mt-2 text-center">Lavender</p>
                </div>
                <div>
                  <div className="h-16 rounded-2xl bg-[#a8d8ea]" />
                  <p className="text-xs mt-2 text-center">Soft Blue</p>
                </div>
                <div>
                  <div className="h-16 rounded-2xl bg-[#ffb5c5]" />
                  <p className="text-xs mt-2 text-center">Soft Pink</p>
                </div>
                <div>
                  <div className="h-16 rounded-2xl bg-[#1a1a1a]" />
                  <p className="text-xs mt-2 text-center">Primary</p>
                </div>
              </div>
            </div>
          </div>
        </WellnessCard>
      </section>

      {/* Typography */}
      <section className="space-y-6">
        <SerifHeading size="xl">Typography</SerifHeading>
        <WellnessCard>
          <div className="space-y-6">
            <div>
              <p className="text-sm opacity-70 mb-2">Headlines - Playfair Display</p>
              <div className="space-y-2">
                <h1 className="text-6xl font-serif font-medium">New Day Fresh Start!</h1>
                <h2 className="text-4xl font-serif font-medium">Good Mood</h2>
                <h3 className="text-2xl font-serif font-medium">How Well Did You Sleep?</h3>
              </div>
            </div>
            <div className="border-t pt-6">
              <p className="text-sm opacity-70 mb-2">Body Text - Inter</p>
              <div className="space-y-2">
                <p className="text-base">Regular body text for descriptions and content</p>
                <p className="text-sm opacity-70">Smaller text for secondary information</p>
                <p className="text-sm font-medium">Medium weight for labels and emphasis</p>
              </div>
            </div>
          </div>
        </WellnessCard>
      </section>

      {/* Spacing */}
      <section className="space-y-6">
        <SerifHeading size="xl">Spacing & Layout</SerifHeading>
        <WellnessCard>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Border Radius</p>
              <div className="flex gap-4 items-end">
                <div className="w-16 h-16 bg-[#ff8a65] rounded-lg" />
                <div className="w-16 h-16 bg-[#b8a0d6] rounded-xl" />
                <div className="w-16 h-16 bg-[#a8d8ea] rounded-2xl" />
                <div className="w-16 h-16 bg-[#ffb5c5] rounded-full" />
              </div>
              <p className="text-xs opacity-70">lg (0.5rem) → xl (0.75rem) → 2xl (1rem) → full (9999px)</p>
            </div>
            
            <div className="space-y-2 pt-4">
              <p className="text-sm font-medium">Shadows</p>
              <div className="space-y-3">
                <div className="p-4 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                  Soft shadow for cards (0_4px_20px_rgba(0,0,0,0.06))
                </div>
                <div className="p-4 bg-white rounded-2xl shadow-[0_6px_30px_rgba(0,0,0,0.1)]">
                  Medium shadow for hover states (0_6px_30px_rgba(0,0,0,0.1))
                </div>
              </div>
            </div>
          </div>
        </WellnessCard>
      </section>

      {/* Component Spacing */}
      <section className="space-y-6">
        <SerifHeading size="xl">Component Spacing</SerifHeading>
        <WellnessCard>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span>Mobile padding (horizontal)</span>
              <code className="bg-gray-100 px-2 py-1 rounded">24px (1.5rem)</code>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>Section spacing</span>
              <code className="bg-gray-100 px-2 py-1 rounded">24px (1.5rem)</code>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>Card padding</span>
              <code className="bg-gray-100 px-2 py-1 rounded">24px (1.5rem)</code>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>Card border radius</span>
              <code className="bg-gray-100 px-2 py-1 rounded">20px (1.25rem)</code>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>Button height (medium)</span>
              <code className="bg-gray-100 px-2 py-1 rounded">48px (3rem)</code>
            </div>
            <div className="flex justify-between">
              <span>Navigation icon size</span>
              <code className="bg-gray-100 px-2 py-1 rounded">48px × 48px</code>
            </div>
          </div>
        </WellnessCard>
      </section>

      {/* Interaction Patterns */}
      <section className="space-y-6">
        <SerifHeading size="xl">Interaction Patterns</SerifHeading>
        <WellnessCard>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Micro-interactions</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li>• Smooth transitions (200-300ms) for all hover and active states</li>
                <li>• Scale transforms (1.02-1.10) for emphasis on interactive elements</li>
                <li>• Emoji selectors with scale feedback on selection</li>
                <li>• Bottom navigation with smooth fill animation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Accessibility</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li>• Minimum 44×44px touch targets for mobile</li>
                <li>• Clear visual feedback for all interactive states</li>
                <li>• Sufficient color contrast for text readability</li>
                <li>• Semantic HTML structure throughout</li>
              </ul>
            </div>
          </div>
        </WellnessCard>
      </section>
    </div>
  );
}
