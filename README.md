# PDF-Answer-Automation-using-AI

It is a web application that helps users extract and process questions from PDF files and generate detailed answers using Google's Gemini AI.
This works with JNTU Question Banks

## Format of the Question Bank
![Image](https://github.com/user-attachments/assets/45412af1-97ec-452c-bb9a-db008a03db40)

## Features

- PDF file upload and text extraction
- AI-powered answer generation using Google's Gemini Pro model
- Customizable question parameters (subject, marks)
- Real-time processing and response

## Tech Stack

- **Frontend**: Next.js 13+, React
- **Backend**: Next.js API Routes
- **AI Integration**: Google Generative AI (Gemini Pro)
- **PDF Processing**: pdf-parse

## Getting Started

### Prerequisites

- Node.js 16.x or later
- npm or yarn
- Google AI API key

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/questionbanker.git
cd questionbanker
```

2. Install dependencies:
```
npm install
```

3. Create a `.env.local` file in the root directory and add your Google AI API key:
```
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
``` 

4. Start the development server:
```
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Usage

1. Upload a PDF file of question-bank (ALIET) using the file upload button
2. The system will extract text from the PDF
3. Enter the subject and marks for the question
4. Submit to receive an AI-generated detailed answer

## API Endpoints

- `POST /api/upload` - Upload and process PDF files
- `POST /api/gemini` - Generate answers using Gemini AI

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Generative AI
- pdf-parse library
- Next.js team
