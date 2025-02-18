const answerFormat = `
Please generate answers in HTML format following these rules:

Structure the answer with:
- A brief introduction
- Main explanation with key points
- Examples where applicable
- A concise summary

Use this HTML template:
<div class="answer-container">
    <div class="introduction">
        <p>[Introduction text here]</p>
    </div>
    
    <div class="main-content">
        <h3>Key Points</h3>
        <ul>
            <li>[Point 1]</li>
            <li>[Point 2]</li>
        </ul>
        
        <h3>Examples</h3>
        <ul>
            <li>[Example 1]</li>
            <li>[Example 2]</li>
        </ul>
    </div>
    
    <div class="summary">
        <p>[Summary text here]</p>
    </div>
</div>

Important:
- Use proper HTML tags for structure
- Include class names for styling
- Maintain clean, semantic HTML
- Ensure content is well-formatted for PDF conversion
`;

export default answerFormat;
