import { Download, Image as ImageIcon, RefreshCw } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { TravelData } from "@/types/travel";
import { Button } from "@/components/ui/button";

interface CanvasPreviewProps {
  data: TravelData;
}

const COND_PADRAO =
  "Valores por pessoa em Reais. Sujeito a disponibilidade e alterações sem prévio aviso. Parcelamento em até 10x, respeitando parcela mínima de R$ 150,00. Nos reservamos o direito a correções de possíveis erros de digitação. Consulte regras gerais em www.bwtoperadora.com.br";

// [sky, water, sand, palm]
const PALETTES: Record<string, [string, string, string, string]> = {
  // Internacional
  cancun: ["#87ceeb", "#00bcd4", "#f4d03f", "#1a6e30"],
  cancún: ["#87ceeb", "#00bcd4", "#f4d03f", "#1a6e30"],
  "punta cana": ["#87d3eb", "#20b2aa", "#f5deb3", "#1a7a40"],
  aruba: ["#a8d8ea", "#00ced1", "#deb887", "#8b6914"],
  jamaica: ["#7ec8e3", "#008080", "#f0e68c", "#1a6e20"],
  bahamas: ["#b0e0e6", "#40e0d0", "#ffe4b5", "#2a8a50"],
  cuba: ["#87ceeb", "#008b8b", "#d2b48c", "#8b6914"],
  paris: ["#b0c4de", "#4169e1", "#e8e8e8", "#2a3a6e"],
  europa: ["#b0c4de", "#4169e1", "#e8e8e8", "#2a3a6e"],
  miami: ["#87ceeb", "#00ced1", "#fffacd", "#20a050"],
  orlando: ["#87ceeb", "#1e90ff", "#ffd700", "#1a6e30"],
  dubai: ["#d4c5a0", "#4682b4", "#deb887", "#8b7914"],
  maldivas: ["#a8d8ea", "#00d4aa", "#f0e8d8", "#0a8a6a"],
  // Nacionais
  fortaleza: ["#7ec9e8", "#1a9ab0", "#f5e6b0", "#1a7a40"],
  "jericoacoara": ["#7ec9e8", "#1a9ab0", "#e8d898", "#2a7a30"],
  natal: ["#87d4ec", "#1a9ab0", "#f5e0a0", "#1a7a40"],
  "porto seguro": ["#87d4ec", "#1a9ab0", "#f5e0a0", "#1a7a40"],
  salvador: ["#87ceeb", "#1a6e8a", "#d4a870", "#1a6e30"],
  recife: ["#87ceeb", "#1a8a9a", "#d4b890", "#1a6e30"],
  maceió: ["#87d4ea", "#20a0b8", "#f0e4b0", "#1a7a30"],
  "porto de galinhas": ["#87d4ea", "#20a0b8", "#f0e4b0", "#1a7a30"],
  "foz do iguaçu": ["#87a8b0", "#2a7a4a", "#c8d8a0", "#1a6a30"],
  "foz do iguacu": ["#87a8b0", "#2a7a4a", "#c8d8a0", "#1a6a30"],
  florianópolis: ["#87ceeb", "#2080b0", "#f0e8d0", "#1a7a40"],
  florianopolis: ["#87ceeb", "#2080b0", "#f0e8d0", "#1a7a40"],
  "rio de janeiro": ["#87ceeb", "#1a7ab0", "#d4c890", "#1a7a30"],
  rio: ["#87ceeb", "#1a7ab0", "#d4c890", "#1a7a30"],
  gramado: ["#a0b4c0", "#3a6a8a", "#c8d0b0", "#2a6a3a"],
  "fernando de noronha": ["#87d4f0", "#1a9ab0", "#f0e0a0", "#1a7a40"],
  bonito: ["#87a8c0", "#2a8a6a", "#c8d8b0", "#1a7a30"],
  default: ["#87ceeb", "#00bcd4", "#f4d03f", "#1a6e30"],
};

function getPalette(destino: string): [string, string, string, string] {
  const d = destino.toLowerCase();
  for (const [k, v] of Object.entries(PALETTES)) {
    if (d.includes(k)) return v;
  }
  return PALETTES.default;
}

// ─── Funções de desenho auxiliares ────────────────────────────────────────────

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawPalm(ctx: CanvasRenderingContext2D, px: number, py: number, size: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.05;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(px, py + size);
  ctx.quadraticCurveTo(px + size * 0.1, py + size * 0.5, px + size * 0.05, py);
  ctx.stroke();
  const fronds = [[-0.5, 0], [0, -0.05], [0.45, 0.05]];
  fronds.forEach(([angle]) => {
    ctx.save();
    ctx.translate(px + size * 0.05, py);
    ctx.rotate(angle as number);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.32, size * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number): number {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const w of words) {
    const test = line + (line ? " " : "") + w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy);
      cy += lineH;
      line = w;
    } else line = test;
  }
  if (line) { ctx.fillText(line, x, cy); cy += lineH; }
  return cy;
}

// ─── LÂMINA STORY (1080 × 1350) ───────────────────────────────────────────────

function drawStory(canvas: HTMLCanvasElement, data: TravelData, W: number, H: number) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = W;
  canvas.height = H;

  const [sky, water, sand, palm] = getPalette(data.destino);
  const imgH = Math.round(H * 0.41);

  ctx.fillStyle = "#0d1b2a";
  ctx.fillRect(0, 0, W, H);

  // Céu
  const skyGrd = ctx.createLinearGradient(0, 0, 0, imgH * 0.58);
  skyGrd.addColorStop(0, sky);
  skyGrd.addColorStop(1, "#d4f1f9");
  ctx.fillStyle = skyGrd;
  ctx.fillRect(0, 0, W, imgH * 0.58);

  // Sol
  ctx.fillStyle = "rgba(255,253,200,0.92)";
  ctx.beginPath();
  ctx.arc(W * 0.73, imgH * 0.16, W * 0.057, 0, Math.PI * 2);
  ctx.fill();

  // Nuvens
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  [[0.08, 0.2, 68, 26], [0.26, 0.13, 90, 32], [0.47, 0.18, 72, 26]].forEach(([x, y, rx, ry]) => {
    ctx.beginPath();
    ctx.ellipse(W * x, imgH * y, rx as number, ry as number, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Água
  const waterY = imgH * 0.58, waterH = imgH * 0.24;
  const wGrd = ctx.createLinearGradient(0, waterY, 0, waterY + waterH);
  wGrd.addColorStop(0, water);
  wGrd.addColorStop(1, "#0a5a6e");
  ctx.fillStyle = wGrd;
  ctx.fillRect(0, waterY, W, waterH);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, waterY);
  for (let x = 0; x <= W; x += 8) ctx.lineTo(x, waterY + 5 * Math.sin((x / 70) * Math.PI));
  ctx.stroke();

  // Areia
  ctx.fillStyle = sand;
  ctx.fillRect(0, waterY + waterH, W, imgH - (waterY + waterH));

  // Palmeiras
  drawPalm(ctx, W * 0.13, imgH * 0.19, imgH * 0.33, palm);
  drawPalm(ctx, W * 0.71, imgH * 0.2, imgH * 0.24, palm);

  // Overlay
  const ovGrd = ctx.createLinearGradient(0, 0, 0, imgH);
  ovGrd.addColorStop(0.55, "rgba(0,0,0,0)");
  ovGrd.addColorStop(1, "rgba(13,27,42,0.72)");
  ctx.fillStyle = ovGrd;
  ctx.fillRect(0, 0, W, imgH);

  // Badge desconto
  if (data.desconto) {
    ctx.fillStyle = "#00b4c8";
    ctx.fillRect(W - Math.round(W * 0.22), 0, Math.round(W * 0.22), Math.round(H * 0.027));
    ctx.fillStyle = "#003d45";
    ctx.font = `700 ${Math.round(H * 0.014)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("COM ATÉ", W - Math.round(W * 0.11), Math.round(H * 0.02));
    ctx.fillStyle = "#000";
    ctx.fillRect(W - Math.round(W * 0.22), Math.round(H * 0.027), Math.round(W * 0.22), Math.round(H * 0.05));
    ctx.fillStyle = "#fff";
    ctx.font = `900 ${Math.round(H * 0.042)}px sans-serif`;
    ctx.fillText(`${data.desconto}% OFF`, W - Math.round(W * 0.11), Math.round(H * 0.066));
  }

  // Tag produto
  const tagY = imgH - Math.round(H * 0.044), tagH = Math.round(H * 0.033);
  ctx.fillStyle = "rgba(13,27,42,0.9)";
  rrect(ctx, Math.round(W * 0.037), tagY, Math.round(W * 0.22), tagH, tagH / 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,180,200,0.5)";
  ctx.lineWidth = 1.5;
  rrect(ctx, Math.round(W * 0.037), tagY, Math.round(W * 0.22), tagH, tagH / 2);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = `600 ${Math.round(H * 0.019)}px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(`✈ ${data.tipoProduto || "Aéreo + Hotel"}`, Math.round(W * 0.06), tagY + tagH * 0.68);

  // Corpo
  const bodyX = Math.round(W * 0.037), bodyY = imgH + Math.round(H * 0.025), lineBase = Math.round(H * 0.016);

  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.round(H * 0.065)}px 'Barlow Condensed', sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(data.destino, bodyX, bodyY + Math.round(H * 0.055));

  let iy = bodyY + Math.round(H * 0.075);
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${lineBase}px sans-serif`;
  ctx.fillText("INCLUI", bodyX, iy);
  iy += Math.round(H * 0.022);

  (data.inclui || []).slice(0, 5).forEach((item) => {
    ctx.fillStyle = "#00b4c8";
    ctx.font = `${lineBase}px sans-serif`;
    ctx.fillText("•", bodyX, iy);
    ctx.fillStyle = "#c8d8e8";
    const txt = item.length > 55 ? item.substring(0, 55) + "…" : item;
    ctx.fillText(txt, bodyX + Math.round(W * 0.025), iy);
    iy += Math.round(H * 0.02);
  });

  // Bagagem (se sem despacho, destaca)
  if (data.bagagem && /sem mala despachada/i.test(data.bagagem)) {
    ctx.fillStyle = "#ffaa00";
    ctx.font = `600 ${Math.round(H * 0.013)}px sans-serif`;
    ctx.fillText("⚠ Bagagem somente de mão", bodyX, iy + Math.round(H * 0.006));
    iy += Math.round(H * 0.022);
  }

  // Preço
  if (data.precoParcela) {
    const px2 = W - Math.round(W * 0.037);
    let py2 = bodyY + Math.round(H * 0.042);
    ctx.textAlign = "right";
    ctx.fillStyle = "#8aaabb";
    ctx.font = `${Math.round(H * 0.013)}px sans-serif`;
    ctx.fillText("A PARTIR DE", px2, py2);
    py2 += Math.round(H * 0.018);
    ctx.fillStyle = "#00d4e8";
    ctx.font = `900 ${Math.round(H * 0.048)}px sans-serif`;
    ctx.fillText(`${data.parcelas}x`, px2, py2);
    py2 += Math.round(H * 0.008);
    ctx.fillStyle = "#fff";
    ctx.font = `900 ${Math.round(H * 0.056)}px sans-serif`;
    ctx.fillText(`R$ ${data.precoParcela.replace("R$ ", "")}`, px2, py2 + Math.round(H * 0.048));
    py2 += Math.round(H * 0.062);
    if (data.precoAVista) {
      ctx.fillStyle = "#fff";
      ctx.font = `600 ${Math.round(H * 0.014)}px sans-serif`;
      ctx.fillText(`Ou ${data.precoAVista}`, px2, py2);
      py2 += Math.round(H * 0.018);
    }
    ctx.fillStyle = "#8aaabb";
    ctx.font = `${Math.round(H * 0.012)}px sans-serif`;
    ctx.fillText("por pessoa em apto duplo", px2, py2);
  }

  // Cia aérea
  if (data.companhiaAerea) {
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.round(H * 0.022)}px sans-serif`;
    ctx.fillText(data.companhiaAerea, W - Math.round(W * 0.037), iy + Math.round(H * 0.01));
    iy += Math.round(H * 0.032);
  }

  // Data pill
  if (data.dataInicio && data.dataFim) {
    const pillH = Math.round(H * 0.032);
    const dataTxt = `📅 ${data.dataInicio} a ${data.dataFim}`;
    ctx.font = `700 ${Math.round(H * 0.016)}px sans-serif`;
    ctx.textAlign = "left";
    const pillW = ctx.measureText(dataTxt).width + Math.round(W * 0.04);
    ctx.fillStyle = "#00b4c8";
    rrect(ctx, bodyX, iy, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = "#003d45";
    ctx.fillText(dataTxt, bodyX + Math.round(W * 0.02), iy + pillH * 0.68);
  }

  // Footer
  const footerY = H - Math.round(H * 0.083);
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(W, footerY);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${Math.round(H * 0.016)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("UM PRODUTO BWT OPERADORA", W / 2, footerY + Math.round(H * 0.026));

  const condY = footerY + Math.round(H * 0.046);
  ctx.fillStyle = "#f0ede8";
  ctx.fillRect(0, condY, W, H - condY);
  ctx.fillStyle = "#444";
  ctx.font = `${Math.round(H * 0.0095)}px sans-serif`;
  ctx.textAlign = "left";
  wrapText(ctx, COND_PADRAO, Math.round(W * 0.018), condY + Math.round(H * 0.012), W - Math.round(W * 0.036), Math.round(H * 0.013));
}

// ─── LÂMINA FEED (1080 × 1080) ────────────────────────────────────────────────

function drawFeed(canvas: HTMLCanvasElement, data: TravelData, W: number, H: number) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = W;
  canvas.height = H;

  const [sky, water, sand, palm] = getPalette(data.destino);
  const imgH = Math.round(H * 0.46);

  // Fundo
  ctx.fillStyle = "#0d1b2a";
  ctx.fillRect(0, 0, W, H);

  // Céu
  const skyGrd = ctx.createLinearGradient(0, 0, 0, imgH * 0.6);
  skyGrd.addColorStop(0, sky);
  skyGrd.addColorStop(1, "#d4f1f9");
  ctx.fillStyle = skyGrd;
  ctx.fillRect(0, 0, W, imgH * 0.6);

  // Sol
  ctx.fillStyle = "rgba(255,253,200,0.92)";
  ctx.beginPath();
  ctx.arc(W * 0.76, imgH * 0.18, W * 0.055, 0, Math.PI * 2);
  ctx.fill();

  // Nuvens
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  [[0.1, 0.22, 75, 28], [0.32, 0.14, 95, 34], [0.54, 0.19, 70, 25]].forEach(([x, y, rx, ry]) => {
    ctx.beginPath();
    ctx.ellipse(W * x, imgH * y, rx as number, ry as number, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Água
  const waterY = imgH * 0.6, waterH = imgH * 0.24;
  const wGrd = ctx.createLinearGradient(0, waterY, 0, waterY + waterH);
  wGrd.addColorStop(0, water);
  wGrd.addColorStop(1, "#0a5a6e");
  ctx.fillStyle = wGrd;
  ctx.fillRect(0, waterY, W, waterH);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, waterY);
  for (let x = 0; x <= W; x += 8) ctx.lineTo(x, waterY + 5 * Math.sin((x / 70) * Math.PI));
  ctx.stroke();

  // Areia
  ctx.fillStyle = sand;
  ctx.fillRect(0, waterY + waterH, W, imgH - (waterY + waterH));

  // Palmeiras
  drawPalm(ctx, W * 0.1, imgH * 0.2, imgH * 0.35, palm);
  drawPalm(ctx, W * 0.72, imgH * 0.22, imgH * 0.26, palm);

  // Overlay
  const ovGrd = ctx.createLinearGradient(0, 0, 0, imgH);
  ovGrd.addColorStop(0.5, "rgba(0,0,0,0)");
  ovGrd.addColorStop(1, "rgba(13,27,42,0.75)");
  ctx.fillStyle = ovGrd;
  ctx.fillRect(0, 0, W, imgH);

  // Badge desconto (canto superior esquerdo no feed)
  if (data.desconto) {
    const bW = Math.round(W * 0.26), bH = Math.round(H * 0.065);
    ctx.fillStyle = "#00b4c8";
    rrect(ctx, Math.round(W * 0.037), Math.round(H * 0.025), bW, bH, 8);
    ctx.fill();
    ctx.fillStyle = "#003d45";
    ctx.font = `900 ${Math.round(H * 0.036)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`${data.desconto}% OFF`, Math.round(W * 0.037) + bW / 2, Math.round(H * 0.025) + bH * 0.72);
  }

  // Destino (grande, sobreposto à imagem, parte inferior)
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.round(H * 0.082)}px 'Barlow Condensed', sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(data.destino, Math.round(W * 0.037), imgH - Math.round(H * 0.03));

  // Separador
  const sepY = imgH + Math.round(H * 0.02);
  ctx.strokeStyle = "rgba(0,180,200,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(Math.round(W * 0.037), sepY);
  ctx.lineTo(W - Math.round(W * 0.037), sepY);
  ctx.stroke();

  // Corpo — duas colunas
  const bodyX = Math.round(W * 0.037);
  const bodyY = sepY + Math.round(H * 0.025);
  const col2X = Math.round(W * 0.55);
  const lineBase = Math.round(H * 0.018);

  // Coluna esquerda: hotel, duração, regime
  ctx.fillStyle = "#8aaabb";
  ctx.font = `${Math.round(H * 0.014)}px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("HOTEL", bodyX, bodyY);

  ctx.fillStyle = "#fff";
  ctx.font = `700 ${Math.round(H * 0.02)}px sans-serif`;
  const hotelTxt = data.hotel.length > 28 ? data.hotel.substring(0, 28) + "…" : data.hotel;
  ctx.fillText(hotelTxt, bodyX, bodyY + Math.round(H * 0.022));

  ctx.fillStyle = "#8aaabb";
  ctx.font = `${Math.round(H * 0.014)}px sans-serif`;
  ctx.fillText("DURAÇÃO · REGIME", bodyX, bodyY + Math.round(H * 0.048));

  ctx.fillStyle = "#00d4e8";
  ctx.font = `700 ${Math.round(H * 0.019)}px sans-serif`;
  ctx.fillText(`${data.duracao}  ·  ${data.regime}`, bodyX, bodyY + Math.round(H * 0.068));

  // Cia aérea + bagagem
  if (data.companhiaAerea) {
    ctx.fillStyle = "#8aaabb";
    ctx.font = `${Math.round(H * 0.014)}px sans-serif`;
    ctx.fillText("VIA", bodyX, bodyY + Math.round(H * 0.094));
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.round(H * 0.019)}px sans-serif`;
    ctx.fillText(data.companhiaAerea, bodyX, bodyY + Math.round(H * 0.114));
  }

  if (data.bagagem && /sem mala despachada/i.test(data.bagagem)) {
    ctx.fillStyle = "#ffaa00";
    ctx.font = `600 ${Math.round(H * 0.015)}px sans-serif`;
    ctx.fillText("⚠ Só bagagem de mão", bodyX, bodyY + Math.round(H * 0.14));
  }

  // Coluna direita: preço
  ctx.textAlign = "right";
  const px2 = W - Math.round(W * 0.037);
  let py2 = bodyY;

  ctx.fillStyle = "#8aaabb";
  ctx.font = `${Math.round(H * 0.014)}px sans-serif`;
  ctx.fillText("A PARTIR DE", px2, py2);
  py2 += Math.round(H * 0.022);

  ctx.fillStyle = "#00d4e8";
  ctx.font = `900 ${Math.round(H * 0.038)}px sans-serif`;
  ctx.fillText(`${data.parcelas}x`, px2, py2 + Math.round(H * 0.032));

  ctx.fillStyle = "#fff";
  ctx.font = `900 ${Math.round(H * 0.05)}px sans-serif`;
  ctx.fillText(`R$ ${data.precoParcela.replace("R$ ", "")}`, px2, py2 + Math.round(H * 0.08));
  py2 += Math.round(H * 0.09);

  if (data.precoAVista) {
    ctx.fillStyle = "#c8d8e8";
    ctx.font = `600 ${Math.round(H * 0.016)}px sans-serif`;
    ctx.fillText(`Ou ${data.precoAVista}`, px2, py2);
    py2 += Math.round(H * 0.022);
  }
  ctx.fillStyle = "#8aaabb";
  ctx.font = `${Math.round(H * 0.013)}px sans-serif`;
  ctx.fillText("por pessoa · apto duplo", px2, py2);

  // Inclui (linha horizontal abaixo)
  const incY = bodyY + Math.round(H * 0.165);
  ctx.strokeStyle = "rgba(0,180,200,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bodyX, incY);
  ctx.lineTo(W - Math.round(W * 0.037), incY);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = `700 ${Math.round(H * 0.013)}px sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("INCLUI:", bodyX, incY + Math.round(H * 0.022));

  const incItems = (data.inclui || []).slice(0, 4);
  const colW = (W - Math.round(W * 0.074)) / 2;
  incItems.forEach((item, idx) => {
    const ix = bodyX + (idx % 2 === 0 ? 0 : colW);
    const iyItem = incY + Math.round(H * 0.022) + Math.round(H * 0.024) * (Math.floor(idx / 2) + 1);
    ctx.fillStyle = "#00b4c8";
    ctx.font = `${Math.round(H * 0.015)}px sans-serif`;
    ctx.fillText("•", ix, iyItem);
    ctx.fillStyle = "#c8d8e8";
    const txt = item.length > 30 ? item.substring(0, 30) + "…" : item;
    ctx.fillText(txt, ix + Math.round(W * 0.022), iyItem);
  });

  // Data pill
  if (data.dataInicio && data.dataFim) {
    const pillH = Math.round(H * 0.032);
    const dataTxt = `📅 ${data.dataInicio}  →  ${data.dataFim}`;
    ctx.font = `700 ${Math.round(H * 0.016)}px sans-serif`;
    ctx.textAlign = "left";
    const pillW = ctx.measureText(dataTxt).width + Math.round(W * 0.04);
    const pillY = H - Math.round(H * 0.105);
    ctx.fillStyle = "#00b4c8";
    rrect(ctx, bodyX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = "#003d45";
    ctx.fillText(dataTxt, bodyX + Math.round(W * 0.02), pillY + pillH * 0.68);
  }

  // Footer
  const footerY = H - Math.round(H * 0.068);
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(W, footerY);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = `700 ${Math.round(H * 0.016)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("UM PRODUTO BWT OPERADORA", W / 2, footerY + Math.round(H * 0.026));

  const condY = footerY + Math.round(H * 0.038);
  ctx.fillStyle = "#f0ede8";
  ctx.fillRect(0, condY, W, H - condY);
  ctx.fillStyle = "#444";
  ctx.font = `${Math.round(H * 0.0095)}px sans-serif`;
  ctx.textAlign = "left";
  wrapText(ctx, COND_PADRAO, Math.round(W * 0.018), condY + Math.round(H * 0.01), W - Math.round(W * 0.036), Math.round(H * 0.013));
}

// ─── Componente ───────────────────────────────────────────────────────────────

const CanvasPreview = ({ data }: CanvasPreviewProps) => {
  const storyRef = useRef<HTMLCanvasElement>(null);
  const feedRef = useRef<HTMLCanvasElement>(null);
  const [exportingStory, setExportingStory] = useState(false);
  const [exportingFeed, setExportingFeed] = useState(false);

  // Preview story: 320px wide
  const SW = 320, SH = Math.round((320 * 1350) / 1080);
  // Preview feed: 320px
  const FW = 320, FH = 320;

  useEffect(() => {
    if (storyRef.current) drawStory(storyRef.current, data, SW, SH);
    if (feedRef.current) drawFeed(feedRef.current, data, FW, FH);
  }, [data]);

  const handleExportStory = async () => {
    setExportingStory(true);
    try {
      const canvas = document.createElement("canvas");
      drawStory(canvas, data, 1080, 1350);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bwt-${data.destino.toLowerCase().replace(/\s+/g, "-")}-story.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } finally {
      setExportingStory(false);
    }
  };

  const handleExportFeed = async () => {
    setExportingFeed(true);
    try {
      const canvas = document.createElement("canvas");
      drawFeed(canvas, data, 1080, 1080);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bwt-${data.destino.toLowerCase().replace(/\s+/g, "-")}-feed.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } finally {
      setExportingFeed(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-5 h-5" style={{ color: "#00b4c8" }} />
        <h2 className="text-2xl font-display font-semibold">Lâminas</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Story */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Story</p>
              <p className="text-xs text-muted-foreground">1080 × 1350 px</p>
            </div>
            <Button
              onClick={handleExportStory}
              disabled={exportingStory}
              size="sm"
              style={{ background: "#00b4c8", color: "#0d1b2a" }}
              className="hover:opacity-90 font-semibold"
            >
              {exportingStory ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" />Exportar PNG</>
              )}
            </Button>
          </div>
          <div className="flex justify-center">
            <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
              <canvas ref={storyRef} width={SW} height={SH} style={{ display: "block" }} />
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Feed</p>
              <p className="text-xs text-muted-foreground">1080 × 1080 px</p>
            </div>
            <Button
              onClick={handleExportFeed}
              disabled={exportingFeed}
              size="sm"
              style={{ background: "#00b4c8", color: "#0d1b2a" }}
              className="hover:opacity-90 font-semibold"
            >
              {exportingFeed ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" />Exportar PNG</>
              )}
            </Button>
          </div>
          <div className="flex justify-center">
            <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
              <canvas ref={feedRef} width={FW} height={FH} style={{ display: "block" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasPreview;
