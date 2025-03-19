"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function PdfProcessPage() {
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDownload, setShowDownload] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setLoading(true);
    setError("");
    setQuestions([]);
    setAnswers({});
    setShowDownload(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Step 1: Extract questions from the PDF
      const extractResponse = await fetch("/api/extract-questions", {
        method: "POST",
        body: formData,
      });

      if (!extractResponse.ok) {
        throw new Error(`Failed to extract questions: ${extractResponse.status}`);
      }

      const extractData = await extractResponse.json();
      setSubject(extractData.subject || "Unknown Subject");
      setQuestions(extractData.questions || []);

      // Step 2: Generate answers
      const response = await fetch("/api/generate-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: extractData.questions }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate answers: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let partialData = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        partialData += decoder.decode(value, { stream: true });

        const lines = partialData.split("\n");
        partialData = lines.pop(); // Keep the last incomplete line

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const { question, answer } = JSON.parse(line);
            setAnswers(prev => ({ ...prev, [question]: answer }));
          } catch (e) {
            console.error("JSON parse error:", e);
          }
        }
      }

      // All answers are generated, show the download button
      setShowDownload(true);
    } catch (err) {
      setError("Error processing file. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
  
      // ---------------------------
      // 1. Subject Header
      // ---------------------------
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      const subjectText = `Subject: ${subject}`;
      const subjectLines = doc.splitTextToSize(subjectText, 170);
      let y = 20;
      subjectLines.forEach((line) => {
        doc.text(line, 20, y);
        y += 10;
      });
      y += 5;
  
      // ---------------------------
      // 2. Process each Q&A
      // ---------------------------
      questions.forEach((question, index) => {
        // Add a new page if y is near bottom
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
  
        // --- Question ---
        doc.setFont("helvetica", "bold");
        const qText = `Q${index + 1}: ${question}`;
        const qLines = doc.splitTextToSize(qText, 170);
        qLines.forEach((line) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 20, y);
          y += 8;
        });
        y += 3;
  
        // --- Answer ---
        doc.setFont("helvetica", "normal");
        let answer = answers[question] || "Generating...";
        // Split answer into paragraphs by double newline
        const paragraphs = answer.split("\n\n");
        paragraphs.forEach((para) => {
          para = para.trim();
          if (!para) return;
  
          // If the paragraph is a heading (starts and ends with **)
          if (para.startsWith("**") && para.endsWith("**")) {
            doc.setFont("helvetica", "bold");
            const headingText = para.slice(2, -2).trim();
            const headingLines = doc.splitTextToSize(headingText, 170);
            headingLines.forEach((hl) => {
              if (y > 270) {
                doc.addPage();
                y = 20;
              }
              doc.text(hl, 20, y);
              y += 8;
            });
            doc.setFont("helvetica", "normal");
          }
          // If the paragraph is a bullet list (each line starts with "- ")
          else if (para.startsWith("- ")) {
            const bulletLines = para.split("\n");
            bulletLines.forEach((bullet) => {
              bullet = bullet.trim();
              if (bullet.startsWith("- ")) {
                const bulletContent = bullet.substring(2).trim();
                const wrappedBullet = doc.splitTextToSize(bulletContent, 160);
                // Draw bullet symbol at left
                if (y > 270) {
                  doc.addPage();
                  y = 20;
                }
                doc.text("•", 20, y);
                let xOffset = 30;
                wrappedBullet.forEach((line, i) => {
                  if (i > 0) {
                    y += 8;
                    xOffset = 30;
                  }
                  doc.text(line, xOffset, y);
                });
                y += 8;
              }
            });
          }
          // Otherwise, normal paragraph
          else {
            const normalLines = doc.splitTextToSize(para, 170);
            normalLines.forEach((line) => {
              if (y > 270) {
                doc.addPage();
                y = 20;
              }
              doc.text(line, 20, y);
              y += 8;
            });
          }
          // Add extra spacing between paragraphs
          y += 5;
        });
        // Extra space after each Q&A pair
        y += 10;
      });
  
      doc.save(`${subject.replace(/\s+/g, "_")}_Answers.pdf`);
    } catch (err) {
      setError("Error generating PDF. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  
  
  return (
    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-sky-50 to-indigo-50 min-h-screen">
      <div className="w-full max-w-2xl bg-white/30 backdrop-blur-lg rounded-2xl shadow-xl p-8 ring-1 ring-white/40">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center drop-shadow-md">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600 animate-text">
            PDF Answer Generator
          </span>
        </h1>

        <div className="flex flex-col items-center space-y-6">
          <label className="w-full max-w-md group cursor-pointer transition-all duration-300 hover:-translate-y-1">
            <div className="flex flex-col items-center px-6 py-8 bg-white/50 text-blue-600 rounded-xl border-2 border-dashed border-blue-100/80 group-hover:border-blue-400/90 transition-all relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-cyan-50/30 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
              <svg 
                className="w-14 h-14 mb-3 text-blue-500/80 group-hover:text-blue-600 transition-all duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="font-medium text-gray-600/90 group-hover:text-blue-700 transition-colors text-sm">
                {file ? (
                  <span className="flex items-center gap-2">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : "Click to choose PDF file"}
              </span>
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </div>
          </label>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full max-w-md bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold
                      hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-[1.02]
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="animate-spin">🌀</span>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  Generate Answers
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 mix-blend-overlay" />
          </button>

          {loading && (
            <div className="mt-6 space-y-4 text-center animate-fade-in">
              <div className="relative inline-block">
                <div className="w-16 h-16 border-4 border-blue-100/30 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600/90 font-medium animate-pulse">
                Analyzing document and generating answers...
              </p>
            </div>
          )}

          {showDownload && (
            <button
              onClick={handleDownloadPDF}
              className="w-full max-w-md bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-xl font-semibold
                        hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-[1.02]
                        relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Answer PDF
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 mix-blend-overlay" />
            </button>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50/90 border border-red-200 rounded-lg flex items-center space-x-3 animate-shake">
              <svg 
                className="w-6 h-6 text-red-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
);
}
