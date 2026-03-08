/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent } from "react";
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Download, Loader2, Image as ImageIcon, ArrowRight, Banana, Upload, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
      setReferenceImage({
        data: base64Data,
        mimeType: file.type,
        preview: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const parts: any[] = [{ text: prompt }];
      if (referenceImage) {
        parts.unshift({
          inlineData: {
            data: referenceImage.data,
            mimeType: referenceImage.mimeType,
          },
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts,
        },
      });

      let imageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setGeneratedImage(imageUrl);
      } else {
        throw new Error("No image data received from the model.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const img = imgRef.current;
    if (!img) {
      alert("No image to download");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Use original resolution
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.drawImage(img, 0, 0);

    // Export as PNG
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.download = `nano-banana-${Date.now()}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, "image/png");
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#141414] font-sans selection:bg-yellow-300">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400 p-2 rounded-lg border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <Banana className="w-6 h-6 fill-current" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">Nano Banana</h1>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs font-bold uppercase tracking-widest opacity-50">
          <span>Gemini 2.5 Flash Image</span>
          <span className="w-1 h-1 bg-[#141414] rounded-full"></span>
          <span>High Speed Generation</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
        {/* Left Column: Controls */}
        <section className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tight leading-none">
              IMAGINE <br />
              <span className="text-yellow-500">ANYTHING.</span>
            </h2>
            <p className="text-lg text-gray-500 font-medium">
              Enter a prompt below to generate high-quality images in seconds using the latest Gemini models.
            </p>
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={referenceImage ? "Describe how to modify this image..." : "A futuristic city with floating neon bananas..."}
                className="w-full h-48 p-6 bg-white border-2 border-[#141414] rounded-2xl shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] focus:shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] transition-all outline-none text-xl font-medium resize-none placeholder:text-gray-300"
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-4">
                <div className="text-xs font-bold uppercase opacity-30 group-focus-within:opacity-100 transition-opacity">
                  {prompt.length} characters
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              
              <AnimatePresence>
                {referenceImage ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative w-24 h-24 border-2 border-[#141414] rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
                  >
                    <img src={referenceImage.preview} alt="Reference" className="w-full h-full object-cover" />
                    <button
                      onClick={removeReferenceImage}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full border border-[#141414] hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 border-2 border-dashed border-[#141414]/20 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-yellow-400 hover:text-yellow-500 hover:bg-yellow-50 transition-all group"
                  >
                    <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Reference</span>
                  </button>
                )}
              </AnimatePresence>

              <button
                onClick={generateImage}
                disabled={isGenerating || !prompt.trim()}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-200 disabled:cursor-not-allowed border-2 border-[#141414] p-6 rounded-2xl shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-3 text-xl font-black uppercase tracking-tight"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    {referenceImage ? "Edit Image" : "Generate"}
                    <ArrowRight className="w-6 h-6 ml-auto" />
                  </>
                )}
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 font-bold text-sm"
              >
                {error}
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              "Cyberpunk jungle with robotic tigers",
              "Minimalist portrait of a jazz musician",
              "Vibrant abstract oil painting of a storm",
              "Isometric 3D render of a cozy library"
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setPrompt(suggestion)}
                className="text-left p-4 border-2 border-[#141414]/10 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-colors text-sm font-bold text-gray-600"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>

        {/* Right Column: Result */}
        <section className="relative min-h-[400px] lg:min-h-0">
          <div className="sticky top-32">
            <div className="w-full aspect-square bg-white border-2 border-[#141414] rounded-2xl shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] overflow-hidden flex items-center justify-center relative group">
              <AnimatePresence mode="wait">
                {generatedImage ? (
                  <motion.div
                    key="image"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="w-full h-full"
                  >
                    <img
                      id="ai-result"
                      ref={imgRef}
                      src={generatedImage}
                      alt="Generated"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <button
                        onClick={handleDownload}
                        className="bg-white text-[#141414] p-4 rounded-full border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:bg-yellow-400 transition-colors"
                        title="Download Image"
                      >
                        <Download className="w-6 h-6" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 text-gray-300"
                  >
                    {isGenerating ? (
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                          <Loader2 className="w-16 h-16 animate-spin text-yellow-400" />
                          <Banana className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-500" />
                        </div>
                        <p className="font-black uppercase tracking-widest text-sm animate-pulse">
                          Peeling the pixels...
                        </p>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-24 h-24 opacity-20" />
                        <p className="font-bold uppercase tracking-widest text-sm">
                          Your masterpiece will appear here
                        </p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {generatedImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex justify-center"
              >
                <button
                  onClick={handleDownload}
                  className="bg-white border-2 border-[#141414] px-8 py-4 rounded-2xl shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] hover:bg-yellow-50 active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center gap-3 font-black uppercase tracking-tight"
                >
                  <Download className="w-5 h-5" />
                  Download PNG
                </button>
              </motion.div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-[#141414] p-12 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Banana className="w-5 h-5 text-yellow-500" />
            <span className="font-black uppercase tracking-tighter">Nano Banana Studio</span>
          </div>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest opacity-50">
            <a href="#" className="hover:opacity-100 transition-opacity">Privacy</a>
            <a href="#" className="hover:opacity-100 transition-opacity">Terms</a>
            <a href="#" className="hover:opacity-100 transition-opacity">API Docs</a>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-30">
            © 2026 Nano Banana. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
