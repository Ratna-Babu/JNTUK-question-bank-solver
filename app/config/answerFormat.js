const answerFormat = `
Please generate answers following these strict rules:

### **Structure**:  
- Begin with a **brief introduction** to the topic in paragraph form.  
- Provide **detailed explanations** with step-by-step points.  
- If applicable, include **examples** or real-world applications.  
- No conclusion heading, end with a paragraph or as you see fit.

### **Formatting**:  
- Use Markdown-style **bold headers ('**Heading**')** for key sections.  
- If the answer requires a list, use bullet points ('- Point') or numbering ('1. Step').  
- Use **line breaks ('\\n\\n')** to separate sections clearly.  
- If relevant, include **diagrams/images** .  

### **Subject Relevance**:  
- Ensure answers are strictly relevant to the subject of the question.  
- Avoid unnecessary details or off-topic information.

### **Example Output Format**:  
**Introduction**  
This is an introduction to the topic.

**Main Explanation**  
- **Point 1:** Explanation.  
- **Point 2:** Explanation.  

**Examples**  
- Example 1  
- Example 2  

 
Summary of the topic.

🚀 Stick to this format so the answer is clean and easy to convert into a PDF.
`;

export default answerFormat;
