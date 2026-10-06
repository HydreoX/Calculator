# ✨ Modern Glassmorphic Calculator

A beautiful, sleek, and feature-rich Calculator built with modern HTML5, CSS3 (Vanilla), and JavaScript.

![Calculator Preview](https://raw.githubusercontent.com/placeholder/preview.png)

## 🌟 Features

- 🎨 **Glassmorphism Design**: Frosted glass panels, glowing ambient backdrop orbs, fluid animations.
- 🌓 **Dark & Light Modes**: Seamless theme switching with saved preference.
- 🧮 **Precision Math**: Accurate floating-point arithmetic (e.g. `0.1 + 0.2 = 0.3`).
- 📜 **Calculation History**: Collapsible flyout drawer to view past equations and click any to reuse.
- ⌨️ **Full Keyboard Support**: Numpad and keyboard navigation (`0-9`, `+`, `-`, `*`, `/`, `Enter`, `Backspace`, `Esc`, `%`, `.`).
- 📋 **Copy to Clipboard**: Quick copy of calculation results with visual toast feedback.
- 🔊 **Audio Synthesizer**: Subtle, non-intrusive sound effects powered by the Web Audio API (toggleable).
- 📱 **Fully Responsive**: Perfectly formatted across desktop, tablet, and mobile screens.

## 🚀 Live Demo on GitHub Pages

Follow the steps below to push and host your calculator on GitHub Pages:

### Step 1: Create a GitHub Repository
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g. `calculator` or `modern-calculator`).
3. Leave it **Public** and do not check "Initialize with README".
4. Click **Create repository**.

### Step 2: Push Your Local Code
Run the following commands in your terminal:

```bash
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository **Settings** → **Pages** on GitHub.
2. Under **Build and deployment** → **Source**, select **GitHub Actions** (or select **Deploy from a branch** -> `main` / `root`).
3. Your site will automatically go live at:
   `https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/`

---

## 🛠️ Local Development

To run locally:
Simply open `index.html` in any modern web browser or start a local server:

```bash
python -m http.server 5500
```
Open [http://localhost:5500](http://localhost:5500) in your browser.
