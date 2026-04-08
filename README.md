# StudyForge 🧠⚡

StudyForge is a full-stack, AI-powered educational application designed to drastically accelerate the studying process. It allows students to upload standard academic documents (PDFs, PPT exports, syllabi) and instantly generates interactive Flashcards, Multiple Choice Questions (MCQs), and Constructed Response Questions (CRQs) relying on a complex extraction and processing pipeline. 

Built with scalability, clean architecture, and modern UX paradigms in mind.

---

## 🛠 Tech Stack & Architecture

- **Frontend Framework**: Next.js 14+ (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS (extensively customized with CSS variables for dynamic Dark/Light modes and glassmorphism)
- **Backend Infrastructure**: Next.js Serverless API Routes deployed on **Vercel**
- **Authentication**: Firebase Authentication (Google OAuth provider)
- **Database**: Cloud Firestore (NoSQL, optimized document-based tracking)
- **AI Integration**: Google Gemini SDK (`gemini-2.5-flash` / `gemini-1.5-pro`)
- **Document Parsing**: PDF.js (Client-side, browser-based extraction engine)

---

## ⚙️ Core Workflows & Data Pipeline

### 1. Document Extraction & Parallel Processing (Browser -> Server)
In traditional LLM wrappers, document processing occurs on the backend, which consumes vast amounts of server memory. StudyForge offloads extraction completely to the client:
1. **Local Parsing**: When a user drops a `.pdf`, StudyForge utilizes `pdf.js` to physically read the ArrayBuffer entirely inside the browser.
2. **Sanitation**: The text is filtered for non-printable characters (common in PowerPoint conversions) to prevent server/WAF socket hang-ups and truncated to `30,000 characters` (approx. 7,000 words)—striking the perfect balance between high-fidelity textbook context and blazing fast (< 4 seconds) API response times.
3. **Concurrency**: Uploading multiple files triggers a `Promise.allSettled` block. Instead of serial queuing, 10 documents are processed perfectly in parallel, vastly reducing user friction.

### 2. The Generation Engine (Server -> AI)
The processed text is packaged into a standard Node `FormData` payload and pushed to the Next.js API `/api/extract-and-generate`.
- The route acts as a secure middleware layer to inject the `GEMINI_API_KEY`.
- StudyForge utilizes strict structured prompting. The backend dynamically commands the Gemini API to respond *strictly* in a predefined JSON format containing multidimensional objects for Flashcards, MCQs, and CRQs.
- **Resilience**: A recursive auto-retry loop intercepts potential 503 network timeouts during heavy system delays and safely attempts generation 3 times before failing out.

### 3. Infinite Generative Expandability
StudyForge is designed to scale with a user's study needs. 
During the initial extraction, the raw `30,000` character payload is securely cached deep inside the resulting Firestore Document. Later, when a user accesses their flashcard set in `/study/[docId]/page.tsx`, they can hit **Generate More**. The frontend pulls the invisible cached payload, prompts the user via a settings modal, hits the generation endpoint again, and merges the resulting JSON data seamlessly into the existing active deck via Firestore `updateDoc` without requiring a full page reload.

### 4. Interactive Grading Sandbox (CRQs)
StudyForge doesn't just show users flashcards; it creates interactive grading loops:
- For Constructed Response Questions (CRQ), the user is presented a `<textarea>` to type out their response from raw memory.
- Submitting the text triggers `/api/grade-crq`, a specialized endpoint that passes the user's string alongside the AI's cached "Optimal Example Answer" and "Key Concepts" array.
- Gemini acts as a strict academic professor, returning a scored metric (X/10), structured critique, and a programmatic array highlighting specifically which contextual key concepts the user failed to mention.

### 5. Spaced Repetition Algorithm (SM-2 implementation)
Flashcards in StudyForge run on a local implementation of the SuperMemo-2 (SM-2) algorithm. 
- During study mode, users grade their recall on a quality scale of 0-5. 
- The algorithm calculates the `Easiness Factor`, altering the `Interval` (in days) defining when the user next needs to see the card to maximize memory retention. Cards constantly re-sort dynamically by priority and due-date.

---

## 🎨 UI/UX Design System
A hyper-focus was placed on keeping the application looking sleek, dark, and highly responsive.
- **Glassmorphism**: Panels utilize strict backdrop filters overlaying animated subtle gradients to achieve a premium aesthetic.
- **Staggered Animations**: Utilizing custom CSS animations (`animate-fade-in-up`, `stagger-children`), the components render linearly rather than snapping rigidly onto the DOM.
- **State Feedback**: Modals contain multi-stage visualizations (`idle` -> `uploading` -> `processing` -> `success`), transforming seamlessly and informing the user of granular backend progress.

---

## 🗄 Firestore Data Schema

```json
users/{userId}
  ├── profile/main
  │    └── (displayName, email, photoURL, streakCount, lastDate)
  ├── sessions/{date}
  │    └── (cardsReviewed, correctCount)
  └── documents/{docId}
       ├── fileName: "Lecture 8.pdf"
       ├── uploadedAt: "ISO Date"
       ├── extractedText: "Raw 30k string..."
       ├── flashcards: [{ front, back, nextReviewDate... }]
       ├── mcQuestions: [{ question, options, correctIndex... }]
       └── crQuestions: [{ question, sampleAnswer, keyConcepts... }]
```

---

## 🚀 Running Locally

Ensure you have your environment variables set properly in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=xxx

GEMINI_API_KEY=xxx
```

Install Dependencies & Start the dev environment:
```bash
npm install
npm run dev
```
