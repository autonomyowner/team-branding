import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // For now, we'll generate a simple HTML template for TikTok-style videos
    // In a production setup, you would invoke Claude's tiktok-explainer skill here
    // or use a more sophisticated video generation approach

    const html = generateTikTokHTML(prompt);

    return NextResponse.json({ html });
  } catch (error: any) {
    console.error("Video generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate video" },
      { status: 500 }
    );
  }
}

function generateTikTokHTML(concept: string): string {
  // Parse the concept to extract hook, message, and visual plan
  const sections = parseConcept(concept);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TikTok Explainer</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }

    .container {
      width: 360px;
      height: 640px;
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      position: relative;
    }

    .slide {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0;
      animation: slideShow 9s infinite;
    }

    .slide:nth-child(1) {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      animation-delay: 0s;
    }

    .slide:nth-child(2) {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      animation-delay: 3s;
    }

    .slide:nth-child(3) {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
      animation-delay: 6s;
    }

    @keyframes slideShow {
      0%, 33.33% {
        opacity: 1;
        transform: scale(1);
      }
      36.33%, 100% {
        opacity: 0;
        transform: scale(0.95);
      }
    }

    h1 {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 20px;
      line-height: 1.2;
      animation: fadeInUp 0.6s ease-out;
    }

    p {
      font-size: 1.2rem;
      line-height: 1.6;
      animation: fadeInUp 0.6s ease-out 0.2s;
      animation-fill-mode: both;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .emoji {
      font-size: 4rem;
      margin-bottom: 20px;
      animation: bounce 1s infinite;
    }

    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-20px);
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Hook Slide -->
    <div class="slide">
      <div class="emoji">⚡</div>
      <h1>${escapeHtml(sections.hook)}</h1>
    </div>

    <!-- Message Slide -->
    <div class="slide">
      <div class="emoji">💡</div>
      <h1>الرسالة الأساسية</h1>
      <p>${escapeHtml(sections.message)}</p>
    </div>

    <!-- Visual Plan Slide -->
    <div class="slide">
      <div class="emoji">🎯</div>
      <h1>الخطة المرئية</h1>
      <p>${escapeHtml(sections.visual)}</p>
    </div>
  </div>

  <script>
    // Auto-play animation
    console.log('TikTok Explainer loaded. Animation running...');
  </script>
</body>
</html>`;
}

function parseConcept(concept: string): { hook: string; message: string; visual: string } {
  // Simple parsing logic to extract sections from the enhanced concept
  const hookMatch = concept.match(/HOOK[:\s]+([^\n]+)/i);
  const messageMatch = concept.match(/MESSAGE[:\s]+([^\n]+)/i);
  const visualMatch = concept.match(/VISUAL PLAN[:\s]+([^\n]+)/i);

  return {
    hook: hookMatch ? hookMatch[1].trim() : concept.split('\n')[0] || 'مفهوم مثير',
    message: messageMatch ? messageMatch[1].trim() : concept,
    visual: visualMatch ? visualMatch[1].trim() : 'تصميم جذاب ومؤثر',
  };
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
