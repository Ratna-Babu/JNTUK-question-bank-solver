# JNTUK Question Bank Solver using AI

It is a web application that helps users extract and process JNTUK Question Bank Questions (PDF file) and generate detailed answers PDF of any subject.
This works with any JNTUK Question Bank of any subject.

``` Note: The question bank must follow the below format and must be a PDF file ```
## Format of the Question Bank
![Image](https://github.com/user-attachments/assets/45412af1-97ec-452c-bb9a-db008a03db40)

## Features

- PDF file upload and text extractio
- AI-powered answer generation 
- Real-time processing and response
- Generate Answers PDF for any Question Bank

## Tech Stack

- **Frontend**: Next.js 13+, React
- **Backend**: Next.js API Routes
- **AI Integration**: Google Generative AI (Gemini)
- **PDF Processing**: pdf-parse

## Getting Started

### Prerequisites

- Node.js 16.x or later
- npm or yarn
- Google AI API key

### Installation

1. Clone the repository:
```
git clone https://github.com/ratna-babu/PDF-Answer-Automation-using-AI
cd PDF-Answer-Automation-using-AI
```

2. Install dependencies:
```
npm install
```

3. Create a `.env.local` file in the root directory and add your Google AI API key:
   ```You can get the Gemini API key from "https://aistudio.google.com/" ```
```
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```


4. Start the development server:
```
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Usage

1. Upload a PDF file of question-bank using the file upload button
2. The system will extract questions from the PDF
3. AI-generated detailed answer-pdf will be ready to download in a few seconds

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
