import { Download, Image as ImageIcon, RefreshCw } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { TravelData } from "@/types/travel";
import { getDestinationContext } from "@/lib/destinationContext";
import { Button } from "@/components/ui/button";

interface CanvasPreviewProps { data: TravelData; }

const COND = "Valores por pessoa em Reais. Sujeito a disponibilidade e alterações sem prévio aviso. Parcelamento em até 10x, respeitando parcela mínima de R$ 150,00. Nos reservamos o direito a correções de possíveis erros de digitação. Consulte regras gerais em www.bwtoperadora.com.br";

// ── helpers ──────────────────────────────────────────────────────────────────
function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, t: string, x: number, y: number, mw: number, lh: number): number {
  const words = t.split(" "); let line = ""; let cy = y;
  for (const w of words) {
    const test = line+(line?" ":"")+w;
    if (ctx.measureText(test).width > mw && line) { ctx.fillText(line,x,cy); cy+=lh; line=w; }
    else line=test;
  }
  if (line) { ctx.fillText(line,x,cy); cy+=lh; }
  return cy;
}

function drawScenery(ctx: CanvasRenderingContext2D, W: number, imgH: number, pal: any) {
  // Céu com gradiente rico
  const skyG = ctx.createLinearGradient(0,0,0,imgH*0.6);
  skyG.addColorStop(0, adjustColor(pal.sky, 20));
  skyG.addColorStop(0.5, pal.sky);
  skyG.addColorStop(1, "#d4f1f9");
  ctx.fillStyle = skyG; ctx.fillRect(0,0,W,imgH*0.6);

  // Sol com halo
  const sunX = W*0.75, sunY = imgH*0.15, sunR = W*0.055;
  const halo = ctx.createRadialGradient(sunX,sunY,sunR*0.4,sunX,sunY,sunR*2.2);
  halo.addColorStop(0,"rgba(255,253,200,0.5)"); halo.addColorStop(1,"rgba(255,253,200,0)");
  ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(sunX,sunY,sunR*2.2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="rgba(255,253,190,0.95)"; ctx.beginPath(); ctx.arc(sunX,sunY,sunR,0,Math.PI*2); ctx.fill();

  // Nuvens volumosas
  const drawCloud = (cx: number, cy: number, scale: number, alpha: number) => {
    ctx.fillStyle=`rgba(255,255,255,${alpha})`;
    [[0,0,1],[-.6,0.3,.7],[.6,0.3,.75],[0,.5,.65]].forEach(([dx,dy,s]) => {
      ctx.beginPath();
      ctx.ellipse(cx+dx*scale*60,cy+dy*scale*30,scale*s*55,scale*s*28,0,0,Math.PI*2);
      ctx.fill();
    });
  };
  drawCloud(W*0.1, imgH*0.14, 1, 0.7);
  drawCloud(W*0.38, imgH*0.1, 0.85, 0.55);
  drawCloud(W*0.58, imgH*0.18, 0.9, 0.5);

  // Água com profundidade
  const waterY = imgH*0.58, waterH = imgH*0.24;
  const wG = ctx.createLinearGradient(0,waterY,0,waterY+waterH);
  wG.addColorStop(0, pal.water); wG.addColorStop(0.5, adjustColor(pal.water,-15)); wG.addColorStop(1,"#094558");
  ctx.fillStyle=wG; ctx.fillRect(0,waterY,W,waterH);

  // Reflexo de luz na água
  ctx.fillStyle="rgba(255,255,255,0.08)";
  for (let i=0; i<4; i++) {
    ctx.beginPath(); ctx.ellipse(W*(0.2+i*0.2), waterY+waterH*0.3, W*0.06, waterH*0.06, 0,0,Math.PI*2); ctx.fill();
  }

  // Ondas com variação
  for (let w=0; w<3; w++) {
    ctx.strokeStyle=`rgba(255,255,255,${0.25-w*0.06})`; ctx.lineWidth=2.5-w;
    ctx.beginPath(); ctx.moveTo(0,waterY+w*8);
    for (let x=0;x<=W;x+=6) ctx.lineTo(x, waterY+w*8 + (4+w*2)*Math.sin((x/(60+w*20))*Math.PI + w*1.2));
    ctx.stroke();
  }

  // Areia com textura
  const sandY = waterY+waterH;
  const sandG = ctx.createLinearGradient(0,sandY,0,imgH);
  sandG.addColorStop(0, pal.sand); sandG.addColorStop(1, adjustColor(pal.sand,-10));
  ctx.fillStyle=sandG; ctx.fillRect(0,sandY,W,imgH-sandY);

  // Palmeiras detalhadas
  drawDetailedPalm(ctx, W*0.12, sandY+4, imgH*0.42, pal.palm, -0.1);
  drawDetailedPalm(ctx, W*0.72, sandY+2, imgH*0.30, pal.palm, 0.15);
}

function drawDetailedPalm(ctx: CanvasRenderingContext2D, px: number, groundY: number, height: number, color: string, lean: number) {
  ctx.save();
  // Tronco com curvatura
  ctx.strokeStyle = adjustColor(color,-20); ctx.lineWidth = height*0.055; ctx.lineCap="round";
  ctx.beginPath(); ctx.moveTo(px, groundY);
  ctx.quadraticCurveTo(px+lean*height*0.4, groundY-height*0.5, px+lean*height*0.15, groundY-height);
  ctx.stroke();
  // Anéis no tronco
  ctx.lineWidth=1; ctx.globalAlpha=0.3; ctx.strokeStyle=adjustColor(color,-40);
  for (let i=3; i<8; i++) {
    const ty = groundY - height*(i/10);
    const tx = px + lean*height*(i/10)*0.4;
    ctx.beginPath(); ctx.ellipse(tx, ty, height*0.03, height*0.008, 0.3, 0, Math.PI*2); ctx.stroke();
  }
  ctx.globalAlpha=1;
  // Folhas
  const topX = px+lean*height*0.15, topY = groundY-height;
  const fronds = [
    [0.0, 0, height*0.42], [-0.55, -0.05, height*0.36], [0.5, -0.03, height*0.38],
    [-0.9, 0.1, height*0.28], [0.85, 0.08, height*0.28], [-0.25, 0.15, height*0.24],
  ] as [number,number,number][];
  fronds.forEach(([angle, droop, len]) => {
    ctx.save(); ctx.translate(topX, topY); ctx.rotate(angle);
    const g = ctx.createLinearGradient(0,0,len*0.7,len*droop);
    g.addColorStop(0, color); g.addColorStop(1, adjustColor(color,15));
    ctx.fillStyle=g; ctx.globalAlpha=0.88;
    ctx.beginPath(); ctx.moveTo(0,0);
    ctx.quadraticCurveTo(len*0.4, len*droop*0.5+4, len*0.72, len*droop+8);
    ctx.quadraticCurveTo(len*0.4, len*droop*0.5-4, 0, 0);
    ctx.fill(); ctx.restore();
  });
  ctx.restore();
}

function adjustColor(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#",""),16);
  const r = Math.min(255,Math.max(0,((n>>16)&0xff)+amt));
  const g = Math.min(255,Math.max(0,((n>>8)&0xff)+amt));
  const b = Math.min(255,Math.max(0,(n&0xff)+amt));
  return `#${((r<<16)|(g<<8)|b).toString(16).padStart(6,"0")}`;
}

// ── draw principal ────────────────────────────────────────────────────────────
function drawLamina(canvas: HTMLCanvasElement, data: TravelData, W: number, H: number) {
  const ctx = canvas.getContext("2d")!;
  canvas.width=W; canvas.height=H;

  const dest = getDestinationContext(data.destino);
  const pal = dest.palette;
  const imgH = Math.round(H*0.42);
  const bX = Math.round(W*0.037);

  // Fundo navy
  ctx.fillStyle="#0d1b2a"; ctx.fillRect(0,0,W,H);

  // Cena ilustrada
  drawScenery(ctx, W, imgH, pal);

  // Overlay gradiente foto→corpo
  const ovG = ctx.createLinearGradient(0,0,0,imgH);
  ovG.addColorStop(0.55,"rgba(0,0,0,0)"); ovG.addColorStop(1,"rgba(13,27,42,0.78)");
  ctx.fillStyle=ovG; ctx.fillRect(0,0,W,imgH);

  // Badge desconto (sup. dir.)
  if (data.desconto) {
    const bW=Math.round(W*0.23), tagTop=Math.round(H*0.027), numH=Math.round(H*0.052);
    ctx.fillStyle="#00b4c8"; ctx.fillRect(W-bW,0,bW,tagTop);
    ctx.fillStyle="#003d45"; ctx.font=`700 ${Math.round(H*0.013)}px sans-serif`; ctx.textAlign="center";
    ctx.fillText("COM ATÉ", W-bW/2, tagTop*0.72);
    ctx.fillStyle="#111"; ctx.fillRect(W-bW, tagTop, bW, numH);
    ctx.fillStyle="#fff"; ctx.font=`900 ${Math.round(H*0.043)}px sans-serif`;
    ctx.fillText(`${data.desconto}% OFF`, W-bW/2, tagTop+numH*0.75);
  }

  // Tag produto (inf. esq. foto)
  const tagY = imgH-Math.round(H*0.048), tagH = Math.round(H*0.034);
  ctx.fillStyle="rgba(13,27,42,0.9)";
  rrect(ctx, bX, tagY, Math.round(W*0.26), tagH, tagH/2); ctx.fill();
  ctx.strokeStyle="rgba(0,180,200,0.5)"; ctx.lineWidth=1.5;
  rrect(ctx, bX, tagY, Math.round(W*0.26), tagH, tagH/2); ctx.stroke();
  ctx.fillStyle="#fff"; ctx.font=`600 ${Math.round(H*0.018)}px sans-serif`; ctx.textAlign="left";
  ctx.fillText(`✈ ${data.tipoProduto||"Aéreo + Hotel"}`, bX+Math.round(W*0.025), tagY+tagH*0.68);

  // Emoji destino no selo
  const emoji = dest.emoji || "🌴";

  // Selo campanha (inf. dir. foto)
  if (data.campanha) {
    const sr=Math.round(W*0.092), sx=W-sr-Math.round(W*0.04), sy=imgH-Math.round(H*0.018);
    ctx.fillStyle="#062d36";
    ctx.beginPath(); ctx.arc(sx,sy+sr*0.45,sr,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#00b4c8"; ctx.lineWidth=Math.round(W*0.007);
    ctx.beginPath(); ctx.arc(sx,sy+sr*0.45,sr,0,Math.PI*2); ctx.stroke();
    ctx.font=`${Math.round(H*0.024)}px sans-serif`; ctx.textAlign="center";
    ctx.fillText(emoji, sx, sy+sr*0.25);
    ctx.fillStyle="#00b4c8"; ctx.font=`700 ${Math.round(H*0.011)}px sans-serif`;
    const campLines = data.campanha.toUpperCase().split(" ");
    campLines.forEach((cl,i)=> ctx.fillText(cl, sx, sy+sr*0.45+i*Math.round(H*0.014)));
    ctx.fillStyle="#fff"; ctx.font=`900 ${Math.round(H*0.018)}px sans-serif`;
    ctx.fillText("2026", sx, sy+sr*0.88);
  }

  // ── CORPO ──
  const bodyY = imgH+Math.round(H*0.018);
  const lB = Math.round(H*0.016);

  // Título destino — fonte grande condensada
  ctx.fillStyle="#fff";
  const destFontSize = data.destino.length > 10 ? Math.round(H*0.062) : Math.round(H*0.072);
  ctx.font=`800 ${destFontSize}px 'Barlow Condensed',sans-serif`;
  ctx.textAlign="left";
  ctx.fillText(data.destino, bX, bodyY+Math.round(H*0.058));

  // Subtítulo hotel (menor, muted)
  if (data.hotel && data.hotel !== "Hotel") {
    ctx.fillStyle="#8aaabb"; ctx.font=`400 ${Math.round(H*0.014)}px sans-serif`;
    ctx.fillText(data.hotel.split(" ").slice(0,6).join(" "), bX, bodyY+Math.round(H*0.074));
  }

  // INCLUI
  let iy = bodyY+Math.round(H*0.085);
  ctx.fillStyle="#fff"; ctx.font=`700 ${lB}px sans-serif`;
  ctx.fillText("INCLUI", bX, iy); iy+=Math.round(H*0.022);

  const items = (data.inclui||[]).slice(0,5);
  items.forEach(item => {
    ctx.fillStyle="#00b4c8"; ctx.font=`${lB}px sans-serif`; ctx.fillText("•",bX,iy);
    ctx.fillStyle="#c8d8e8"; ctx.font=`${lB}px sans-serif`;
    ctx.fillText(item.length>54 ? item.substring(0,54)+"…" : item, bX+Math.round(W*0.026), iy);
    iy+=Math.round(H*0.02);
  });

  // Preço (coluna direita)
  if (data.precoParcela) {
    const px2=W-Math.round(W*0.037);
    let py2=bodyY+Math.round(H*0.04);
    ctx.textAlign="right";
    ctx.fillStyle="#8aaabb"; ctx.font=`${Math.round(H*0.012)}px sans-serif`;
    ctx.fillText("A PARTIR DE",px2,py2); py2+=Math.round(H*0.018);
    ctx.fillStyle="#00d4e8"; ctx.font=`900 ${Math.round(H*0.05)}px sans-serif`;
    ctx.fillText(`${data.parcelas}x`,px2,py2); py2+=Math.round(H*0.01);
    ctx.fillStyle="#fff"; ctx.font=`900 ${Math.round(H*0.057)}px sans-serif`;
    ctx.fillText(`R$ ${data.precoParcela.replace("R$ ","")}`,px2,py2+Math.round(H*0.05)); py2+=Math.round(H*0.065);
    if (data.precoAVista) {
      ctx.fillStyle="#fff"; ctx.font=`600 ${Math.round(H*0.014)}px sans-serif`;
      ctx.fillText(`Ou ${data.precoAVista}`,px2,py2); py2+=Math.round(H*0.018);
    }
    ctx.fillStyle="#8aaabb"; ctx.font=`${Math.round(H*0.012)}px sans-serif`;
    ctx.fillText("por pessoa em apto duplo",px2,py2);
  }

  // Cia aérea
  if (data.companhiaAerea) {
    ctx.textAlign="right"; ctx.fillStyle="#fff";
    ctx.font=`700 ${Math.round(H*0.022)}px sans-serif`;
    ctx.fillText(data.companhiaAerea, W-Math.round(W*0.037), iy+Math.round(H*0.01));
    iy+=Math.round(H*0.032);
  }

  // Data pill
  if (data.dataInicio && data.dataFim) {
    const pillH=Math.round(H*0.033);
    const txt=`📅 ${data.dataInicio} a ${data.dataFim}`;
    ctx.font=`700 ${Math.round(H*0.016)}px sans-serif`; ctx.textAlign="left";
    const pillW=ctx.measureText(txt).width+Math.round(W*0.04);
    ctx.fillStyle="#00b4c8";
    rrect(ctx,bX,iy,pillW,pillH,pillH/2); ctx.fill();
    ctx.fillStyle="#003d45"; ctx.fillText(txt,bX+Math.round(W*0.02),iy+pillH*0.68);
    iy+=pillH+Math.round(H*0.01);
  }

  // Footer BWT
  const footY=H-Math.round(H*0.085);
  ctx.strokeStyle="rgba(255,255,255,0.1)"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,footY); ctx.lineTo(W,footY); ctx.stroke();
  ctx.fillStyle="#fff"; ctx.font=`700 ${Math.round(H*0.016)}px sans-serif`; ctx.textAlign="center";
  ctx.fillText("UM PRODUTO BWT OPERADORA",W/2,footY+Math.round(H*0.027));

  // Rodapé condições
  const condY=footY+Math.round(H*0.048);
  ctx.fillStyle="#f0ede8"; ctx.fillRect(0,condY,W,H-condY);
  ctx.fillStyle="#444"; ctx.font=`${Math.round(H*0.0092)}px sans-serif`; ctx.textAlign="left";
  wrapText(ctx, COND, Math.round(W*0.018), condY+Math.round(H*0.012), W-Math.round(W*0.036), Math.round(H*0.013));
}

// ── componente ────────────────────────────────────────────────────────────────
const CanvasPreview = ({ data }: CanvasPreviewProps) => {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [exporting, setExporting] = useState(false);
  const PW=360, PH=Math.round(360*1350/1080);

  useEffect(() => { if (previewRef.current) drawLamina(previewRef.current, data, PW, PH); }, [data]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const c=document.createElement("canvas");
      drawLamina(c, data, 1080, 1350);
      c.toBlob(blob => {
        if (!blob) return;
        const url=URL.createObjectURL(blob);
        const a=document.createElement("a");
        a.href=url; a.download=`bwt-${data.destino.toLowerCase().replace(/\s+/g,"-")}.png`;
        a.click(); URL.revokeObjectURL(url);
      },"image/png");
    } finally { setExporting(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" style={{color:"#00b4c8"}} />
          <h2 className="text-2xl font-display font-semibold">Lâmina Estática</h2>
        </div>
        <Button onClick={handleExport} disabled={exporting} size="sm"
          style={{background:"#00b4c8",color:"#0d1b2a"}} className="hover:opacity-90 font-semibold">
          {exporting
            ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin"/>Gerando...</>
            : <><Download className="w-4 h-4 mr-2"/>Exportar PNG 1080×1350</>}
        </Button>
      </div>
      <div className="flex justify-center">
        <div style={{borderRadius:12,overflow:"hidden",boxShadow:"0 10px 40px rgba(0,0,0,0.3)"}}>
          <canvas ref={previewRef} width={PW} height={PH} style={{display:"block"}}/>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Preview {PW}px · Exporta em 1080×1350px · Padrão Story BWT
      </p>
    </div>
  );
};

export default CanvasPreview;
