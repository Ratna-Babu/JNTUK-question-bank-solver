import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function POST(req) {
    try {
        const { subject, questionAnswers } = await req.json();

        if (!questionAnswers?.length) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 });
        }

        // Create PDF document
        const pdfDoc = await PDFDocument.create();
        let currentPage = pdfDoc.addPage([595, 842]); // Standard A4 dimensions
        const { width, height } = currentPage.getSize();
        const margin = 50;

        // Load fonts
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Font sizes & line spacing
        const titleSize = 18;
        const questionSize = 14;
        const answerSize = 12;
        const lineHeightMultiplier = 1.2;

        // Function to calculate line height
        const getLineHeight = (fontSize) => font.heightAtSize(fontSize) * lineHeightMultiplier;

        let y = height - margin;

        // **Subject Name (Bold Heading)**
        const subjectLines = wrapText(`Subject: ${subject}`, boldFont, titleSize, width - margin * 2);
        ({ page: currentPage, newY: y } = drawTextBlock(currentPage, subjectLines, {
            x: margin,
            y,
            font: boldFont,
            size: titleSize,
            lineHeight: getLineHeight(titleSize),
            color: rgb(0, 0, 0),
            pdfDoc
        }));

        // **Process Questions & Answers**
        for (const { question, answer } of questionAnswers) {
            // **Check available space before adding new content**
            const requiredSpace = getLineHeight(questionSize) * 3 + getLineHeight(answerSize) * 5;
            
            if (y < margin + requiredSpace) {
                // **Add new page if needed**
                currentPage.drawText("(Continued on next page)", { x: margin, y: 30, font, size: 10, color: rgb(0, 0, 0) });
                currentPage = pdfDoc.addPage([595, 842]);
                y = height - margin;
            }

            // **Draw Question (Bold)**
            const questionLines = wrapText(`Q: ${question}`, boldFont, questionSize, width - margin * 2);
            ({ page: currentPage, newY: y } = drawTextBlock(currentPage, questionLines, {
                x: margin,
                y,
                font: boldFont,
                size: questionSize,
                lineHeight: getLineHeight(questionSize),
                color: rgb(0, 0, 0),
                pdfDoc
            }));

            // **Draw Answer (Indented)**
            const answerLines = wrapText(`Ans: ${answer}`, font, answerSize, width - margin * 2);
            ({ page: currentPage, newY: y } = drawTextBlock(currentPage, answerLines, {
                x: margin + 20, // Indent answers
                y,
                font,
                size: answerSize,
                lineHeight: getLineHeight(answerSize),
                color: rgb(0, 0, 0),
                pdfDoc
            }));

            // **Extra spacing between Q&A pairs**
            y -= getLineHeight(answerSize) * 0.8;
        }

        // **Finalize & Return PDF**
        const pdfBytes = await pdfDoc.save();
        return NextResponse.json({ 
            success: true, 
            pdfBase64: Buffer.from(pdfBytes).toString("base64") 
        });

    } catch (error) {
        console.error("PDF Generation Error:", error);
        return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
    }
}

// **Helper: Wrap Text Properly**
function wrapText(text, font, fontSize, maxWidth) {
    if (!text) return [];
    
    // **Remove unexpected newlines**
    text = text.replace(/\n/g, " ").trim();

    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

// **Helper: Draw Text Block with Line Spacing & Page Handling**
function drawTextBlock(page, lines, options) {
    const { x, y, font, size, lineHeight, color, pdfDoc } = options;
    let currentY = y;

    for (const line of lines) {
        if (currentY < 50) {  // **Check for space before writing**
            page.drawText("(Continued on next page)", { x, y: 30, font, size: 10, color });
            page = pdfDoc.addPage([595, 842]); // **A4 size new page**
            currentY = 800;  // Reset position
        }

        page.drawText(line, { x, y: currentY, font, size, color });
        currentY -= lineHeight;
    }

    return { page, newY: currentY - lineHeight * 0.5 }; // Updated Y position
}
