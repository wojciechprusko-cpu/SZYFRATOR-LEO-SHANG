/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import MathCipherBoard from "./components/MathCipherBoard";

export default function App() {
  return (
    <div className="min-h-screen w-full bg-[#fbfbf9] text-neutral-800 transition-colors duration-300">
      
      {/* Dynamic Grid Overlay to give a technical blueprint math feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      <main className="relative z-10 py-4 sm:py-8">
        <MathCipherBoard />
      </main>

      <footer className="relative z-10 border-t border-neutral-200 mt-12 py-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-neutral-400 gap-2">
          <span>Struktura Algebr Przestrzennych • Wersja 1.0.0-Matematyczna</span>
          <span>© 2026 Szyfrator Matematyczny ($f(X) \rightarrow Y$). Wszystkie Prawa Zastrzeżone.</span>
        </div>
      </footer>
    </div>
  );
}

