/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock,
  Unlock,
  Sliders,
  HelpCircle,
  Copy,
  RotateCcw,
  Sparkles,
  Check,
  Plus,
  AlertCircle,
  Hash,
  Activity,
  ArrowRight,
  RefreshCw,
  Globe
} from "lucide-react";
import {
  prngSubstitutionEncrypt,
  prngSubstitutionDecrypt,
  generatePrngMapping,
  aesEncrypt,
  aesDecrypt,
  BASIS_CHARS
} from "../utils/crypto";
// @ts-ignore
import agentCharacterImg from "../assets/images/agent_character_1779878998038.png";

// Słownik matematyczny zastępujący pojęcia gramatyczne i tradycyjne (Mathematical Dictionary)
export const MATH_DICTIONARY = [
  { term: "Zdefiniuj Argument X_0", meaning: "Wpisz wiadomość, którą chcesz zaszyfrować (tekst jawny)" },
  { term: "Wektor Przekształcony Y_c", meaning: "Szyfrogram – wynikowa sekwencja losowych cyfr" },
  { term: "Transformacja Postępowa f(X)", meaning: "Proces automatycznego szyfrowania w czasie rzeczywistym" },
  { term: "Retransformacja Odwrotna f⁻¹(Y)", meaning: "Proces dekodowania ciągu cyfr z powrotem na tekst" },
  { term: "Parametr Skalarny θ (Theta)", meaning: "Wybrany klucz kryptograficzny (hasło) stosowany do transformacji i AES-256" },
  { term: "Baza Ortonormalna B", meaning: "Dopuszczalny alfabet znaków, który ulega transformacji" },
  { term: "Kardynalność Składowa |X|", meaning: "Liczba znaków w polu wejściowym" },
  { term: "Anomalia Przeciwdziedziny", meaning: "Błąd odszyfrowania wywołany niespójnym ciągiem lub złym parametrem θ" },
  { term: "Interwał Różniczkowy dt", meaning: "Działanie natychmiastowe przy każdej zmianie argumentu" },
  { term: "Tensory Pozycyjne Retrograde", meaning: "Wprowadzone nazwy państw i koordynaty zapisane od tyłu (np. Polska -> aksloP)" }
];

// Predefiniowany układ punktów geograficznych (zapisany OD TYŁU zgodnie z wymaganiem)
export const REVERSED_GEOGRAPHIC_PRESETS = [
  {
    originalCountry: "Polska",
    reversedCountry: "aksloP",
    originalCapital: "Warszawa",
    reversedCapital: "awazsraW",
    originalCoords: "52.2297, 21.0122",
    reversedCoords: "2210.12 ,7922.25",
    description: "Kwadrat bazowy algebry geometrycznej"
  },
  {
    originalCountry: "Szwajcaria",
    reversedCountry: "airajzawS",
    originalCapital: "Zurych",
    reversedCapital: "hcyruZ",
    originalCoords: "47.3769, 8.5417",
    reversedCoords: "7145.8 ,9673.74",
    description: "Skarbiec macierzy symetrycznych i blokowych"
  },
  {
    originalCountry: "Grecja",
    reversedCountry: "ajcerG",
    originalCapital: "Ateny",
    reversedCapital: "ynatA",
    originalCoords: "37.9838, 23.7275",
    reversedCoords: "5727.32 ,8389.73",
    description: "Kolebka twierdzeń o liczbach pierwszych"
  },
  {
    originalCountry: "Egipt",
    reversedCountry: "tpigE",
    originalCapital: "Kair",
    reversedCapital: "riaK",
    originalCoords: "30.0444, 31.2357",
    reversedCoords: "7532.13 ,4440.03",
    description: "Wektor przestrzeni piramid geometrycznych"
  }
];

export default function MathCipherBoard() {
  // Wybór modelu operacyjnego transformacji (PRNG stochastyczne versus AES-256)
  const [operatorMode, setOperatorMode] = useState<"substitution" | "aes">("substitution");

  // Klucz algorytmu - Parametr Skalarny θ
  const [thetaKey, setThetaKey] = useState<string>("3.141592");

  // --- MODEL SZYFROWANIA (Transformacja Postępowa f(X) -> Y) ---
  const [plainInput, setPlainInput] = useState<string>("");
  const [cipherOutput, setCipherOutput] = useState<string>("");
  const [encryptError, setEncryptError] = useState<string | null>(null);

  // --- MODEL DESZYFROWANIA (Retransformacja Odwrotna f⁻¹(Y) -> X) ---
  const [cipherInput, setCipherInput] = useState<string>("");
  const [plainOutput, setPlainOutput] = useState<string>("");
  const [decryptError, setDecryptError] = useState<string | null>(null);

  // Dynamiczne państwa retrograde (od tyłu)
  const [customCountry, setCustomCountry] = useState<string>("");
  const [customCoords, setCustomCoords] = useState<string>("");

  // Statusy UI
  const [copiedEnc, setCopiedEnc] = useState(false);
  const [copiedDec, setCopiedDec] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);

  // Zegar interwału dH/dt
  const [calculatingTime, setCalculatingTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCalculatingTime(
        `${now.getUTCHours().toString().padStart(2, "0")}:${now
          .getUTCMinutes()
          .toString()
          .padStart(2, "0")}:${now
          .getUTCSeconds()
          .toString()
          .padStart(2, "0")}.${now.getUTCMilliseconds().toString().padEnd(3, "0")}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, []);

  // Odwracacz retrograde
  const computeRetrograde = (txt: string) => {
    return txt.split("").reverse().join("");
  };

  const reversedCountryOutput = useMemo(() => computeRetrograde(customCountry), [customCountry]);
  const reversedCoordsOutput = useMemo(() => computeRetrograde(customCoords), [customCoords]);

  // Transformacja Postępowa w czasie rzeczywistym f(X)
  useEffect(() => {
    if (!plainInput) {
      setCipherOutput("");
      setEncryptError(null);
      return;
    }

    const runEncryption = async () => {
      try {
        setEncryptError(null);
        if (operatorMode === "substitution") {
          // Litery to losowe cyfry za pomocą deterministycznego PRNG
          const result = prngSubstitutionEncrypt(plainInput, thetaKey);
          setCipherOutput(result);
        } else {
          // AES-256 i konwersja do bajtów decimal (losowe cyfry)
          const result = await aesEncrypt(plainInput, thetaKey);
          setCipherOutput(result);
        }
      } catch (err: any) {
        setEncryptError("Anomalia transformacji: " + (err.message || "Błąd argumentu."));
        setCipherOutput("");
      }
    };

    runEncryption();
  }, [plainInput, thetaKey, operatorMode]);

  // Retransformacja Odwrotna w czasie rzeczywistym f⁻¹(Y)
  useEffect(() => {
    if (!cipherInput) {
      setPlainOutput("");
      setDecryptError(null);
      return;
    }

    const runDecryption = async () => {
      try {
        setDecryptError(null);
        if (operatorMode === "substitution") {
          const result = prngSubstitutionDecrypt(cipherInput, thetaKey);
          setPlainOutput(result);
        } else {
          const result = await aesDecrypt(cipherInput, thetaKey);
          setPlainOutput(result);
        }
      } catch (err: any) {
        setDecryptError("Anomalia Przeciwdziedziny: Niepoprawny parametr θ lub uszkodzony wektor Y.");
        setPlainOutput("");
      }
    };

    const timer = setTimeout(runDecryption, 50);
    return () => clearTimeout(timer);
  }, [cipherInput, thetaKey, operatorMode]);

  // Kopiowanie systemowe z bezpiecznym awaryjnym fallbackiem
  const copyValue = (text: string, isEncPanel: boolean) => {
    if (!text) return;

    const finalizeCopy = () => {
      if (isEncPanel) {
        setCopiedEnc(true);
        setTimeout(() => setCopiedEnc(false), 2000);
      } else {
        setCopiedDec(true);
        setTimeout(() => setCopiedDec(false), 2000);
      }
    };

    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(text)
        .then(finalizeCopy)
        .catch(() => fallbackCopy(text, finalizeCopy));
    } else {
      fallbackCopy(text, finalizeCopy);
    }
  };

  const fallbackCopy = (text: string, onSuccess: () => void) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      onSuccess();
    } catch (err) {
      console.error("Błąd zapisu do schowka:", err);
    }
    document.body.removeChild(textArea);
  };

  // Stałe matematyczne pod klawisze szybkich stałych kosmicznych
  const applyConstant = (type: "pi" | "e" | "phi" | "sqrt2") => {
    switch (type) {
      case "pi": setThetaKey("3.141592653589793"); break;
      case "e": setThetaKey("2.718281828459045"); break;
      case "phi": setThetaKey("1.618033988749894"); break;
      case "sqrt2": setThetaKey("1.414213562373095"); break;
    }
  };

  // Mapowanie elementów PRNG w celach demonstracyjnych
  const mappingPreviewList = useMemo(() => {
    const { charToCode } = generatePrngMapping(thetaKey);
    const elements = "abc123?. ";
    return elements.split("").map(char => ({
      raw: char === " " ? "spacja" : char,
      code: charToCode[char] || "???"
    }));
  }, [thetaKey]);

  // Szybkie zerowanie układu wejściowego
  const clearEncState = () => {
    setPlainInput("");
    setCipherOutput("");
    setEncryptError(null);
  };

  const clearDecState = () => {
    setCipherInput("");
    setPlainOutput("");
    setDecryptError(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 font-sans">
      
      {/* SEKCJA PREZENTACJI AGENTA NA SAMEJ GÓRZE */}
      <div className="flex flex-col items-center justify-center mb-6 text-center">
        <div className="relative p-2 bg-white rounded-2xl border border-neutral-200 shadow-sm max-w-[200px] transition-transform duration-500 hover:scale-[1.02]">
          <img
            src={agentCharacterImg}
            alt="Operator Matematyczny Szyfru"
            className="w-40 h-auto rounded-xl object-contain grayscale tracking-normal select-none"
            style={{ maxHeight: "180px" }}
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-2 -right-3 bg-neutral-900 border border-neutral-800 text-white font-mono text-[9px] px-2 py-0.5 rounded shadow whitespace-nowrap uppercase tracking-wider font-bold">
            OPERATOR θ
          </div>
        </div>
      </div>

      {/* JEDNORAZOWA BELKA STATUSU SYSTEMU */}
      <div className="bg-neutral-900 text-white rounded-t-xl px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between border-b border-neutral-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-neutral-300">
            Kalkulator Szyfrujący $dH/dt$ • Układ Skrajnie Zbieżny
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-neutral-400">
          <span>Interwał dt: <strong className="text-white">{calculatingTime || "00:00:00.000"}</strong></span>
          <span className="hidden md:inline">|B| = {BASIS_CHARS.length}</span>
        </div>
      </div>

      {/* GLÓWNY PANEL PRACY */}
      <div className="bg-white border-x border-b border-neutral-200 rounded-b-xl shadow-lg p-5 sm:p-7">
        
        {/* Wstęp objaśniający krótki i nienachalny */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
              Szyfrowanie Wiadomości w Czasie Rzeczywistym
            </h1>
            <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
              Napisz dowolny ciąg znaków. System natychmiast przekształci go w losowe struktury cyfrowe według wybranej metody i parametru klucza. Wszystkie pojęcia zostały zamienione na czystą terminologię matematyczną dla zachowania spójności.
            </p>
          </div>

          <button
            onClick={() => setShowDictionary(!showDictionary)}
            className="shrink-0 flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 transition-colors text-neutral-800 font-semibold px-3 py-1.5 rounded text-xs"
          >
            <HelpCircle className="h-4 w-4" />
            {showDictionary ? "Zwiń Słownik Matematyczny" : "Rozwiń Słownik Matematyczny"}
          </button>
        </div>

        {/* ROZWIJANY SŁOWNIK POJĘĆ */}
        <AnimatePresence>
          {showDictionary && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-2">
                {MATH_DICTIONARY.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded border border-neutral-150 shadow-sm">
                    <span className="font-mono text-neutral-900 font-bold block mb-0.5">{item.term}</span>
                    <span className="text-neutral-500 font-sans block">{item.meaning}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SEKCJA RETROGRADE - KOORDYNATY I PAŃSTWA PISANE OD TYŁU */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 sm:p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-neutral-700" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-800">
              Tensory Pozycyjne Retrograde (Nazwy i Koordynaty od tyłu)
            </h3>
          </div>
          
          <p className="text-xs text-neutral-500 mb-4 font-sans leading-relaxed">
            Zgodnie z wymaganiem, nazwy państw, miast oraz współrzędne geograficzne w tym ujęciu muszą być wprowadzane retrograde (od tyłu). Poniższy kalkulator natychmiast konwertuje surowe dane na wektor odwrócony, który możesz dodać do swojej wiadomości:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs mb-4">
            
            {/* Pole wprowadzania własnego państwa */}
            <div className="bg-white p-3 rounded-lg border border-neutral-200">
              <span className="block font-mono text-neutral-600 mb-1 font-semibold">Państwo (Surowe X_g)</span>
              <input
                type="text"
                placeholder="Np. Polska"
                value={customCountry}
                onChange={(e) => setCustomCountry(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 focus:border-neutral-900 focus:outline-none p-1.5 rounded transition-colors text-neutral-900 font-sans"
              />
              {customCountry && (
                <div className="mt-2 pt-2 border-t border-neutral-100 flex justify-between items-center bg-white">
                  <span className="font-mono font-bold text-neural-900">Retrograde: {reversedCountryOutput}</span>
                  <button
                    onClick={() => {
                      setPlainInput(prev => prev ? prev + " " + reversedCountryOutput : reversedCountryOutput);
                    }}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded px-2 py-0.5 text-[10px]"
                  >
                    + Wklej do X_0
                  </button>
                </div>
              )}
            </div>

            {/* Pole współrzędnych */}
            <div className="bg-white p-3 rounded-lg border border-neutral-200">
              <span className="block font-mono text-neutral-600 mb-1 font-semibold">Surowe Współrzędne Geo_c</span>
              <input
                type="text"
                placeholder="Np. 52.2297, 21.0122"
                value={customCoords}
                onChange={(e) => setCustomCoords(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 focus:border-neutral-900 focus:outline-none p-1.5 rounded transition-colors text-neutral-900 font-sans"
              />
              {customCoords && (
                <div className="mt-2 pt-2 border-t border-neutral-100 flex justify-between items-center bg-white">
                  <span className="font-mono font-bold text-neutral-900 truncate">Retrograde: {reversedCoordsOutput}</span>
                  <button
                    onClick={() => {
                      setPlainInput(prev => prev ? prev + " " + reversedCoordsOutput : reversedCoordsOutput);
                    }}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded px-2 py-0.5 text-[10px] shrink-0 ml-1"
                  >
                    + Wklej do X_0
                  </button>
                </div>
              )}
            </div>

            {/* Szybkie predefiniowane przyciski */}
            <div className="bg-white p-3 rounded-lg border border-neutral-200 flex flex-col justify-between">
              <span className="block font-mono text-neutral-400 mb-1">Predefiniowane wektory retrograde:</span>
              <div className="flex flex-wrap gap-1.5">
                {REVERSED_GEOGRAPHIC_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPlainInput(prev => prev ? prev + ` [${p.reversedCountry} / ${p.reversedCapital} - ${p.reversedCoords}]` : `[${p.reversedCountry} / ${p.reversedCapital} - ${p.reversedCoords}]`);
                    }}
                    className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-mono font-bold text-[10px] py-1 px-1.5 rounded border border-neutral-150 transition-colors"
                    title={`${p.originalCountry} - ${p.originalCapital} (${p.originalCoords})`}
                  >
                    {p.reversedCountry}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* PARAMETRY ALGEBRY (METHOD SELECT & THE KEY) */}
        <div className="mb-8 bg-neutral-50 border border-neutral-200 p-5 rounded-xl">
          
          {/* Słowo kluczowe - Parametr Skalarny θ */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-mono font-bold text-xs uppercase text-neutral-500">
                  Parametr Skalarny Kluczowy θ (Klucz Szyfru)
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">Długość: {thetaKey.length}</span>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  value={thetaKey}
                  onChange={(e) => setThetaKey(e.target.value)}
                  placeholder="Dowolne słowo lub stała liczbowka"
                  className="w-full bg-white border border-neutral-200 focus:border-neutral-950 focus:outline-none p-2.5 rounded font-mono text-sm transition-colors text-neutral-900 font-bold"
                />
              </div>

              {/* Szybkie kosmiczne stałe matematyczne */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[9px] font-mono text-neutral-400 uppercase">Wpleć stałe globalne:</span>
                {["pi", "e", "phi", "sqrt2"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => applyConstant(c as any)}
                    className="bg-white hover:bg-neutral-100 border border-neutral-200 rounded px-2 py-0.5 text-[10px] font-mono text-neutral-700 transition-colors uppercase"
                  >
                    {c === "sqrt2" ? "√2" : c === "phi" ? "φ" : c === "pi" ? "π" : "e"}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* PODGLĄD TRANSPOZYCJI LITER W LOSOWE CYFRY */}
        {operatorMode === "substitution" && (
          <div className="bg-neutral-50 border border-neutral-150 rounded-xl p-4 mb-8">
            <span className="block font-mono text-[10px] uppercase text-neutral-400 mb-2">
              Transformacja Przestrzeni Bazy B (Wektor wejściowy znaku przyporządkowuje unikalne 3 cyfry):
            </span>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              {mappingPreviewList.map((item, idx) => (
                <span key={idx} className="bg-white border border-neutral-205 py-1 px-2.5 rounded flex items-center gap-1">
                  <span className="text-neutral-500">'{item.raw}'</span>
                  <span className="text-neutral-300">→</span>
                  <strong className="text-neutral-950">{item.code}</strong>
                </span>
              ))}
              <span className="text-neutral-400 italic text-[11px] font-sans flex items-center ml-1">
                i wszystkie pozostałe polskie znaki/znaki specjalne bazy...
              </span>
            </div>
          </div>
        )}

        {/* DWA RÓWNOLEGŁE PANELE DZIAŁANIA: SZYFROWE I DESZYFROWE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
          
          {/* KOLUMNA LEWA: TRANSFORMACJA POSTĘPOWA f(X) i.e. SZYFROWANIE */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-mono font-bold text-sm">
                    f
                  </div>
                  <h2 className="font-extrabold text-sm uppercase tracking-wider text-neutral-900">
                    Transformacja Postępowa f(X)
                  </h2>
                </div>
                <span className="text-[10px] bg-neutral-100 text-neutral-500 font-mono px-2 py-0.5 rounded">
                  [Szyfrowanie]
                </span>
              </div>

              {/* Argument X_0 */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-mono text-neutral-600 font-bold">
                    Zdefiniuj Argument X_0 (Wiadomość Wejściowa)
                  </span>
                  <span className="text-neutral-400 font-mono">
                    |X_0| = <strong className="text-neutral-800">{plainInput.length}</strong>
                  </span>
                </div>
                
                <textarea
                  value={plainInput}
                  onChange={(e) => setPlainInput(e.target.value)}
                  placeholder="Wpisz treść wiadomości, którą chcesz natychmiast zaszyfrować..."
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-neutral-900 focus:outline-none p-3.5 rounded h-40 font-sans text-sm tracking-wide leading-relaxed resize-none transition-colors text-neutral-900"
                />
              </div>

              {/* Przyciski czyszczenia */}
              <div className="mb-4 flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={clearEncState}
                  className="px-3 py-1.5 border border-neutral-200 hover:border-neutral-900 bg-white text-neutral-700 hover:text-neutral-900 rounded font-bold text-xs transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Sprowadź do Wektora Zerowego
                </button>
              </div>
            </div>

            {/* Wyjście: Wektor Przekształcony Y_c */}
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <span className="font-mono text-neutral-600 font-bold">
                  Obraz Przeciwdziedziny Y_c (Zaszyfrowana Sekwencja)
                </span>
                {cipherOutput && (
                  <button
                    onClick={() => copyValue(cipherOutput, true)}
                    className="text-neutral-500 hover:text-neutral-900 flex items-center gap-1 font-mono transition-colors text-[11px]"
                  >
                    {copiedEnc ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    [Klonowanie Stanu do schowka]
                  </button>
                )}
              </div>

              <div className="relative">
                <div className="w-full bg-neutral-900 text-neutral-100 p-4 rounded font-mono text-sm leading-6 min-h-[140px] max-h-[220px] overflow-y-auto break-all tracking-wider selection:bg-neutral-750 border border-neutral-950 shadow-inner">
                  {cipherOutput ? (
                    cipherOutput
                  ) : (
                    <span className="text-neutral-500 italic block mt-8 text-center text-xs">
                      Ekosystem gotowy. Oczekiwanie na wprowadzenie argumentu X_0...
                    </span>
                  )}
                </div>

                {encryptError && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-150 rounded p-2.5 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{encryptError}</span>
                  </div>
                )}
              </div>

              {/* Automatyczny mostek (przerzucenie zaszyfrowanej do panelu odszyfrowania) */}
              {cipherOutput && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCipherInput(cipherOutput);
                    }}
                    className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs px-3 py-1.5 rounded font-bold transition-colors flex items-center gap-1 border border-neutral-250"
                  >
                    Projektuj do Równania Odwrotnego f⁻¹(Y_c)
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* KOLUMNA PRAWA: RETRANSFORMACJA ODWROTNA f⁻¹(Y) i.e. DESZYFROWANIE */}
          <div className="flex flex-col justify-between pt-8 md:pt-0 md:pl-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-mono font-bold text-sm">
                    f⁻¹
                  </div>
                  <h2 className="font-extrabold text-sm uppercase tracking-wider text-neutral-900">
                    Retransformacja Odwrotna f⁻¹(Y)
                  </h2>
                </div>
                <span className="text-[10px] bg-neutral-100 text-neutral-500 font-mono px-2 py-0.5 rounded">
                  [Deszyfrowanie]
                </span>
              </div>

              {/* Szyfrogram wejściowy Y_c */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-mono text-neutral-600 font-bold">
                    Zaszyfrowany Ciąg Współczynników Y_c
                  </span>
                  <span className="text-neutral-400 font-mono">
                    Segmentacja = <strong className="text-neutral-800">{cipherInput.replace(/[^0-9]/g, "").length} cyfr</strong>
                  </span>
                </div>

                <textarea
                  value={cipherInput}
                  onChange={(e) => setCipherInput(e.target.value)}
                  placeholder={
                    operatorMode === "substitution"
                      ? "Wklej potrójne kombinacje cyfrowe (np. 452102194...)"
                      : "Wklej spacjowane bajty z bazy AES-256 (np. 124 093 004...)"
                  }
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-neutral-900 focus:outline-none p-3.5 rounded h-40 font-mono text-sm tracking-widest leading-relaxed resize-none transition-colors text-neutral-900"
                />
              </div>

              {/* Czyszczenie */}
              <div className="mb-4 flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={clearDecState}
                  className="px-3 py-1.5 border border-neutral-200 hover:border-neutral-900 bg-white text-neutral-700 hover:text-neutral-900 rounded font-bold text-xs transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Przestrzeni Wynikowej
                </button>
              </div>
            </div>

            {/* Wynik odkodowania (Zrekonstruowana X_0) */}
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <span className="font-mono text-neutral-600 font-bold">
                  Zrekonstruowany Argument Pochodny X_0
                </span>
                {plainOutput && (
                  <button
                    onClick={() => copyValue(plainOutput, false)}
                    className="text-neutral-500 hover:text-neutral-900 flex items-center gap-1 font-mono transition-colors text-[11px]"
                  >
                    {copiedDec ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    [Kopiuj obraz dziedziny]
                  </button>
                )}
              </div>

              <div className="relative">
                <div className="w-full bg-neutral-100 text-neutral-900 p-4 rounded font-sans text-sm leading-relaxed min-h-[140px] max-h-[220px] overflow-y-auto break-words border border-neutral-200">
                  {plainOutput ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-semibold text-neutral-950"
                    >
                      {plainOutput}
                    </motion.span>
                  ) : decryptError ? (
                    <span className="text-red-500 block text-xs mt-4 text-center">
                      {decryptError}
                    </span>
                  ) : (
                    <span className="text-neutral-400 italic block mt-8 text-center text-xs">
                      Brak sygnału. Ograniczenie retransformacji aktywne...
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 text-[10px] text-neutral-400 font-mono text-right uppercase">
                Zbieżność transformacji stochastycznej f⁻¹(f(X)) = I
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
