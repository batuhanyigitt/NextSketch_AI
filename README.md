# NextSketch_AI
A Next.js + TypeScript app for turning freehand sketches into AI-generated images using Stability AI.

is a modern web app that lets you draw on a canvas and turn your sketches into AI-generated images using **Stability AI**. Built with **Next.js + TypeScript + Tailwind CSS**.

## 🚀 Features

- 🖌️ **Drawing Canvas** — freehand drawing with mouse support (zoom & pan)  
- ↩️ **Undo / Redo** — revert or redo strokes easily  
- 🎨 **Brush Color & Size** — adjustable color and stroke thickness  
- 💾 **Save & Load Projects** — stores your sketches in browser LocalStorage  
- ✍️ **Prompt Input** — describe what the AI should generate  
- 🤖 **AI Image Generation** — send your sketch & prompt to Stability AI  
- 📥 **Download Images** — export generated results as PNG  
- 💡 **Prompt Suggestions** — optional AI suggestions via `/api/suggest`

## 🛠️ Tech Stack

- **Frontend:** [Next.js] + [TypeScript]
- **Styling:** [Tailwind CSS]
- **AI Service:** [Stability AI Image API]
- **State Management:** React Hooks (useState, useEffect, useRef)  
- **Storage:** Browser LocalStorage

## ⚡ Getting Started

```bash
# Clone the repository
git clone https://github.com/batuhanyigitt/NextSketch_AI.git
cd NextSketch_AI

# Install dependencies
yarn install

# Start development server
yarn dev

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
