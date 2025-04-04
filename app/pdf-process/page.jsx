"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ErrorBoundary from '../components/ErrorBoundary';

// Add this outside the component


export default function PdfProcessPage() {
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDownload, setShowDownload] = useState(false);
  const [progress, setProgress] = useState([]);

  const addProgress = (message) => {
    const id = uuidv4(); // Generate a unique ID
    setProgress(prev => [...prev, { 
      id, 
      message 
    }]);
  };

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
    setProgress([]);
    // Do not reset uniqueId here

    const formData = new FormData();
    formData.append("file", file);

    try {
      addProgress("📄 Starting PDF processing...");
      
      // Step 1: Extract questions from the PDF
      addProgress("🔍 Extracting questions from PDF...");
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
      addProgress(`✅ Extracted ${extractData.questions.length} questions successfully`);

      // Step 2: Generate answers
      addProgress("🤖 Starting answer generation...");
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
      let answeredCount = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        partialData += decoder.decode(value, { stream: true });
        const lines = partialData.split("\n");
        partialData = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const { question, answer } = JSON.parse(line);
            setAnswers(prev => ({ ...prev, [question]: answer }));
            answeredCount++;
            addProgress(`✍️ Generated answer for question ${answeredCount}/${extractData.questions.length}`);
          } catch (e) {
            console.error("JSON parse error:", e);
          }
        }
      }

      addProgress("✨ All answers generated successfully!");
      setShowDownload(true);
    } catch (err) {
      setError("Error processing file. Please try again.");
      addProgress("❌ Error occurred during processing");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addWatermark = (doc) => {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.setFont("helvetica", "italic");
  
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        "https://github.com/Ratna-Babu/JNTUK-question-bank-solver",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      let y = 30;
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentSection = 0;
  
      // Add header and footer functions
      const addHeader = () => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40);
        doc.setFontSize(16);
        doc.text(`Subject: ${subject}`, 15, 15);
        doc.setDrawColor(200);
        doc.line(15, 18, pageWidth - 15, 18);
      };
  
      const addFooter = () => {
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text(
            `Page ${i} of ${pageCount}`,
            pageWidth - 25,
            doc.internal.pageSize.getHeight() - 10
          );
        }
      };
  
      // Initial header
      addHeader();
  
      // Process each question and answer
      for (const [index, question] of questions.entries()) {
        if (y > 260) {
          doc.addPage();
          y = 30;
          addHeader();
        }
  
        // Add question
        doc.setFont("helvetica", "bold");
        doc.setTextColor(33, 150, 243); // Blue color
        doc.setFontSize(12);
        const questionText = `Question ${index + 1}: ${question}`;
        const questionLines = doc.splitTextToSize(questionText, 170);
        questionLines.forEach(line => {
          doc.text(15, y, line);
          y += 7;
        });
        doc.setTextColor(0); // Reset color
        y += 8;
  
        // Process answer
        const answer = answers[question];
        if (answer) {
          const parser = new DOMParser();
          const docAnswer = parser.parseFromString(answer, "text/html");
          const body = docAnswer.body;
  
          // Process all child elements
          Array.from(body.children).forEach(element => {
            if (y > 260) {
              doc.addPage();
              y = 30;
              addHeader();
            }
  
            switch (element.tagName.toLowerCase()) {
              case "h3":
                // Section heading
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text(15, y, element.textContent);
                y += 10;
                break;
  
              case "h4":
                // Subheading
                doc.setFontSize(11);
                doc.setFont("helvetica", "bolditalic");
                doc.text(20, y, element.textContent);
                y += 8;
                break;
  
              case "p":
                // Paragraph text
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                const lines = doc.splitTextToSize(element.textContent, 170);
                lines.forEach(line => {
                  doc.text(15, y, line);
                  y += 6;
                });
                y += 4;
                break;
  
              case "ul":
              case "ol":
                // List items
                const listItems = Array.from(element.children);
                let counter = 1;
                listItems.forEach(item => {
                  const prefix = element.tagName.toLowerCase() === "ol" ? `${counter}. ` : "• ";
                  const text = prefix + item.textContent;
                  const itemLines = doc.splitTextToSize(text, 160);
                  itemLines.forEach(line => {
                    doc.text(20, y, line);
                    y += 6;
                  });
                  counter++;
                });
                y += 6;
                break;
  
              case "table":
                // Table handling
                const rows = Array.from(element.querySelectorAll("tr"));
                const columns = Array.from(rows[0].querySelectorAll("th, td"));
                const tableData = rows.map(row =>
                  Array.from(row.querySelectorAll("td")).map(cell => cell.textContent)
                );
  
                doc.autoTable({
                  startY: y,
                  head: [columns.map(c => c.textContent)],
                  body: tableData,
                  margin: { left: 15 },
                  styles: { fontSize: 8, cellPadding: 1.5 },
                  headerStyles: { fillColor: [240, 240, 240] },
                  alternateRowStyles: { fillColor: [255, 255, 255] }
                });
                y = doc.lastAutoTable.finalY + 8;
                break;
            }
          });
        }
        y += 15; // Space between questions
      }
  
      addFooter();
      addWatermark(doc); // Add watermark to all pages
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

          {progress.length > 0 && (
            <ErrorBoundary>
              <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4 mt-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Processing Status
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {progress.map((item) => (
                    <div 
                      key={item.id}
                      className="text-sm text-gray-600 py-1 px-2 rounded bg-white/50 border border-blue-50"
                    >
                      {item.message}
                    </div>
                  ))}
                </div>
              </div>
            </ErrorBoundary>
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
