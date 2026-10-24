# ⏰ CogniWake — AI-Powered Smart Alarm System

> **Wake up with purpose.** CogniWake combines cognitive challenges, biometric eye tracking, and voice verification to eliminate morning laziness and guarantee you actually get out of bed.

[![Deployment](https://img.shields.io/badge/Deployed-Vercel-black?style=flat&logo=vercel)](https://cogniwake-alarm.vercel.app)
[![React](https://img.shields.io/badge/React-18-blue?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)

---

## 🚀 Key Features

- 🧠 **Multi-Step Cognitive Missions:**
  - **Arithmetic Challenge:** Solve randomized math equations to spark mental clarity.
  - **AI Eye Tracking:** Real-time face and eye landmark verification powered by MediaPipe. Both eyes must remain open to progress.
  - **Voice & Decibel Verification:** Speak dynamic wake-up affirmations with live mic decibel meter detection.
- 📝 **Morning Motivation Notes:** Add custom goals and notes for specific alarms that display front and center when the alarm triggers.
- 🎵 **Extensive Sound Library:**
  - 12 viral prank & meme alarm tones.
  - 5 high-frequency standard alert ringtones.
  - 5 soft ambient & relaxing chime tracks.
  - Custom MP3 upload support with local caching.
- ☁️ **Cloud Synchronization:** Instant, debounced backup of alarms and user settings using **Supabase**.
- ⏱️ **Strict 1-Minute Snooze:** Strict snooze mode limiting delay to keep your schedule disciplined.
- 📱 **Screen Wake Lock:** Keeps screen active and prevents display timeout during alarms.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Lucide React (Icons)
- **Computer Vision:** Google MediaPipe (`@mediapipe/tasks-vision`)
- **Audio Processing:** Web Audio API (Synthesizers & Decibel Analyser), Web Speech API
- **Backend / Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel (CI/CD)

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
📦 Getting Started Locally
Clone the repository:

Bash
git clone [https://github.com/sksaqibkhan110-glitch/cogniwake-alarm.git](https://github.com/sksaqibkhan110-glitch/cogniwake-alarm.git)
cd cogniwake-alarm
Install dependencies:

Bash
npm install
Start the development server:

Bash
npm run dev
Build for production:

Bash
npm run build
📄 License
This project is licensed under the MIT License.