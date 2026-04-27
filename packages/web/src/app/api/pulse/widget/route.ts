import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    return new NextResponse("Missing projectId", { status: 400 });
  }

  // A basic embed script that creates an iframe pointing to our hosted form
  const script = `
    (function() {
      if (document.getElementById('loopkit-pulse-widget')) return;
      
      const container = document.createElement('div');
      container.id = 'loopkit-pulse-widget';
      container.style.position = 'fixed';
      container.style.bottom = '20px';
      container.style.right = '20px';
      container.style.zIndex = '999999';
      
      // Floating button
      const btn = document.createElement('button');
      btn.innerHTML = 'Feedback';
      btn.style.cssText = 'background: #7c3aed; color: white; border: none; border-radius: 999px; padding: 10px 20px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: transform 0.2s;';
      
      // Iframe container
      const iframeContainer = document.createElement('div');
      iframeContainer.style.cssText = 'display: none; position: absolute; bottom: 60px; right: 0; width: 350px; height: 450px; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); background: #09090b;';
      
      const iframe = document.createElement('iframe');
      // In production this would use the real domain (process.env.NEXT_PUBLIC_APP_URL)
      const appUrl = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL : 'https://loopkit.dev';
      iframe.src = \`\${appUrl}/pulse/\${encodeURIComponent('${projectId}')}\`;
      iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
      
      iframeContainer.appendChild(iframe);
      container.appendChild(iframeContainer);
      container.appendChild(btn);
      
      btn.addEventListener('click', () => {
        const isHidden = iframeContainer.style.display === 'none';
        iframeContainer.style.display = isHidden ? 'block' : 'none';
      });
      
      document.body.appendChild(container);
    })();
  `;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
