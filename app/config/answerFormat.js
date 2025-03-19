const answerFormat = `
Please generate answers in HTML format following these rules:

### **General Structure (Adapt Based on the Question)**
1. **Introduction**  
   - Start with a **brief but informative paragraph** introducing the topic.  
   - Do not simply repeat the question.  

2. **Detailed Explanation**  
   - Include **clear headings and subheadings** (<h3>, <h4> when needed).  
   - **Every heading must be followed by an explanation in paragraph form**.  
   - **Before listing key points, first provide a short explanation** in paragraph form.  
   - Use **bullet points**, **numbered lists**, or **tables** only after explaining the topic.  

3. **Examples & Applications (If applicable)**  
   - **Examples must have a brief explanation before listing them**.  
   - Real-world applications should be included only if relevant.  

4. **Conclusion (Only if necessary)**  
   - If needed, **write a paragraph summarizing key points**.  
   - Do not use a "Conclusion" heading—just end naturally.  

---

### **Important Rules**:
✅ **Every heading must be followed by a meaningful explanation**—no empty sections.  
✅ **A short paragraph must precede every list**—lists should never appear without an introduction.  
✅ The structure **must be flexible**—adapt to the complexity of the question.  
✅ Use **semantic HTML** (<h3>, <strong>, <ul>, <p>, etc.) for clean formatting.  
✅ Ensure content is **well-spaced and aligned** for proper PDF conversion.  
✅ Avoid redundancy and **keep responses concise yet informative**.  

---



📌 **Reminder:**  
- **Never generate just subheadings**—each must be followed by an explanation.  
- **A paragraph must always come before a list** to introduce it.  
`;

export default answerFormat;
