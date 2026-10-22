const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DOG_PHOTO_PATH = path.resolve(__dirname, 'dog_closeup.jpg');
const ARMOR_PHOTO_PATH = path.resolve(__dirname, 'sample_armor.jpg');
const COLOSSEUM_PHOTO_PATH = path.resolve(__dirname, 'sample_colosseum.jpg');
const PUMPKIN_PHOTO_PATH = path.resolve(__dirname, 'sample_pumpkin.jpg');

const OUTPUT_PNG_DOCS = path.resolve(__dirname, '../docs/assets/roman-dog-halloween.png');
const OUTPUT_PNG_PUBLIC = path.resolve(__dirname, '../public/roman-dog-halloween.png');
const OUTPUT_SVG_DOCS = path.resolve(__dirname, '../docs/assets/roman-dog-halloween.svg');
const OUTPUT_SVG_PUBLIC = path.resolve(__dirname, '../public/roman-dog-halloween.svg');

async function main() {
  console.log('[mascot] Compositing realistic photographic Roman Dog mascot...');

  const dogB64 = fs.readFileSync(DOG_PHOTO_PATH).toString('base64');
  const armorB64 = fs.readFileSync(ARMOR_PHOTO_PATH).toString('base64');
  const colosseumB64 = fs.readFileSync(COLOSSEUM_PHOTO_PATH).toString('base64');
  const pumpkinB64 = fs.readFileSync(PUMPKIN_PHOTO_PATH).toString('base64');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=2400,1350',
      '--force-device-scale-factor=1',
    ],
    defaultViewport: {
      width: 2400,
      height: 1350,
      deviceScaleFactor: 1,
    },
  });

  const page = await browser.newPage();

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #030208; display: flex; justify-content: center; align-items: center; width: 2400px; height: 1350px; overflow: hidden; }
    canvas { width: 2400px; height: 1350px; }
  </style>
</head>
<body>
  <canvas id="canvas" width="2400" height="1350"></canvas>
  <img id="imgDog" src="data:image/jpeg;base64,${dogB64}" style="display:none;" />
  <img id="imgArmor" src="data:image/jpeg;base64,${armorB64}" style="display:none;" />
  <img id="imgColosseum" src="data:image/jpeg;base64,${colosseumB64}" style="display:none;" />
  <img id="imgPumpkin" src="data:image/jpeg;base64,${pumpkinB64}" style="display:none;" />

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const dogImg = document.getElementById('imgDog');
    const armorImg = document.getElementById('imgArmor');
    const colosseumImg = document.getElementById('imgColosseum');
    const pumpkinImg = document.getElementById('imgPumpkin');

    const W = 2400;
    const H = 1350;

    let s = 987654321;
    function rnd() {
      s = (1103515245 * s + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    }
    function rndRange(a, b) { return a + rnd() * (b - a); }

    Promise.all([
      dogImg.decode(),
      armorImg.decode(),
      colosseumImg.decode(),
      pumpkinImg.decode()
    ]).then(() => {
      renderScene();
    }).catch(err => {
      console.error(err);
    });

    // 1. Cutout Canvas for Dog Head
    function getCleanDogHeadCanvas() {
      const dw = dogImg.naturalWidth; // 3002
      const dh = dogImg.naturalHeight; // 2579
      const c = document.createElement('canvas');
      c.width = dw;
      c.height = dh;
      const cctx = c.getContext('2d');

      cctx.save();
      cctx.beginPath();
      // Top crown between ears
      cctx.moveTo(1120, 240);
      cctx.quadraticCurveTo(1500, 210, 1880, 240);

      // Right floppy ear (organic contour)
      cctx.bezierCurveTo(2250, 260, 2650, 430, 2770, 750);
      cctx.bezierCurveTo(2830, 950, 2780, 1220, 2660, 1370);
      cctx.bezierCurveTo(2540, 1450, 2420, 1400, 2340, 1330);

      // Right jowl and cheek curving down to chin
      cctx.bezierCurveTo(2280, 1440, 2220, 1680, 2140, 1920);
      cctx.bezierCurveTo(2060, 2150, 1920, 2360, 1740, 2490);

      // Throat base that enters the red tunic collar
      cctx.lineTo(1740, 2579);
      cctx.lineTo(1260, 2579);
      cctx.lineTo(1260, 2490);

      // Left jowl and cheek curving up
      cctx.bezierCurveTo(1080, 2360, 940, 2150, 860, 1920);
      cctx.bezierCurveTo(780, 1680, 720, 1440, 660, 1330);

      // Left floppy ear (organic contour)
      cctx.bezierCurveTo(580, 1400, 460, 1450, 340, 1370);
      cctx.bezierCurveTo(220, 1220, 170, 950, 230, 750);
      cctx.bezierCurveTo(350, 430, 750, 260, 1120, 240);
      cctx.closePath();
      cctx.clip();

      // Draw real dog photograph
      cctx.drawImage(dogImg, 0, 0);

      // Ambient night vignette
      const dogVig = cctx.createRadialGradient(1500, 1400, 500, 1500, 1400, 1350);
      dogVig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      dogVig.addColorStop(0.7, 'rgba(10, 5, 20, 0.1)');
      dogVig.addColorStop(1, 'rgba(3, 1, 8, 0.42)');
      cctx.fillStyle = dogVig;
      cctx.fillRect(0, 0, dw, dh);

      // Warm pumpkin candlelight on right cheek
      const dogAmber = cctx.createRadialGradient(2100, 2100, 100, 2100, 2100, 900);
      dogAmber.addColorStop(0, 'rgba(255, 145, 25, 0.32)');
      dogAmber.addColorStop(0.5, 'rgba(230, 95, 10, 0.12)');
      dogAmber.addColorStop(1, 'rgba(0, 0, 0, 0)');
      cctx.fillStyle = dogAmber;
      cctx.fillRect(0, 0, dw, dh);

      // Cool moonlight rim on left ear and crown
      const dogMoon = cctx.createLinearGradient(300, 400, 1500, 1200);
      dogMoon.addColorStop(0, 'rgba(235, 245, 255, 0.28)');
      dogMoon.addColorStop(0.4, 'rgba(190, 210, 255, 0.06)');
      dogMoon.addColorStop(1, 'rgba(0, 0, 0, 0)');
      cctx.fillStyle = dogMoon;
      cctx.fillRect(0, 0, dw, dh);

      cctx.restore();
      return c;
    }

    // 2. Cutout Canvas for Roman Armor Body (Lorica Segmentata) - ZERO background trees
    function getCleanArmorCanvas() {
      const aw = armorImg.naturalWidth; // 1768
      const ah = armorImg.naturalHeight; // 2770
      const c = document.createElement('canvas');
      c.width = aw;
      c.height = ah;
      const cctx = c.getContext('2d');

      cctx.save();
      cctx.beginPath();
      // Cut neckline following red tunic collar & steel plates tightly
      cctx.moveTo(640, 775);
      // Left shoulder steel plates - hugging steel directly, no green trees
      cctx.bezierCurveTo(550, 785, 450, 805, 340, 845);
      cctx.bezierCurveTo(280, 895, 220, 955, 190, 1045);
      cctx.bezierCurveTo(150, 1140, 120, 1280, 100, 1500);
      cctx.lineTo(40, 1800);
      cctx.lineTo(0, 2100);
      cctx.lineTo(0, ah);
      // Bottom across
      cctx.lineTo(aw, ah);
      // Right arm down
      cctx.lineTo(aw - 80, 2000);
      cctx.lineTo(aw - 60, 1500);
      cctx.lineTo(1580, 1200);
      // Right shoulder steel plates - hugging steel directly, no green trees
      cctx.bezierCurveTo(1560, 1050, 1500, 940, 1440, 870);
      cctx.bezierCurveTo(1320, 820, 1180, 785, 1060, 775);
      // Red tunic collar dipping to center V-neck
      cctx.bezierCurveTo(980, 755, 840, 790, 640, 775);
      cctx.closePath();
      cctx.clip();

      cctx.drawImage(armorImg, 0, 0);

      // Warm pumpkin reflection on right cuirass plates
      const armAmber = cctx.createRadialGradient(1450, 1750, 80, 1450, 1750, 950);
      armAmber.addColorStop(0, 'rgba(255, 140, 20, 0.42)');
      armAmber.addColorStop(0.5, 'rgba(230, 90, 10, 0.15)');
      armAmber.addColorStop(1, 'rgba(0, 0, 0, 0)');
      cctx.fillStyle = armAmber;
      cctx.fillRect(0, 0, aw, ah);

      // Moonlight sheen across left shoulder plates
      const armMoon = cctx.createLinearGradient(200, 800, 800, 1300);
      armMoon.addColorStop(0, 'rgba(230, 240, 255, 0.32)');
      armMoon.addColorStop(0.5, 'rgba(180, 200, 255, 0.06)');
      armMoon.addColorStop(1, 'rgba(0, 0, 0, 0)');
      cctx.fillStyle = armMoon;
      cctx.fillRect(0, 0, aw, ah);

      cctx.restore();
      return c;
    }

    // 3. Cutout Canvas for Glowing Jack-o'-Lantern (Full round pumpkin, natural bottom fade)
    function getCleanPumpkinCanvas() {
      const pw = pumpkinImg.naturalWidth; // 1024
      const ph = pumpkinImg.naturalHeight; // 819
      const c = document.createElement('canvas');
      c.width = pw;
      c.height = ph;
      const cctx = c.getContext('2d');

      cctx.save();
      cctx.beginPath();
      // Full organic round pumpkin contour
      cctx.moveTo(525, 315);
      // Right rib curve down to base
      cctx.bezierCurveTo(660, 320, 760, 420, 760, 520);
      cctx.bezierCurveTo(760, 620, 680, 725, 525, 725);
      // Left rib curve up to stem
      cctx.bezierCurveTo(370, 725, 300, 620, 300, 520);
      cctx.bezierCurveTo(300, 420, 390, 320, 525, 315);
      cctx.closePath();
      cctx.clip();

      cctx.drawImage(pumpkinImg, 0, 0);

      // Soft natural fade at base to sit onto stone floor seamlessly
      const baseGrad = cctx.createLinearGradient(0, 680, 0, 730);
      baseGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      baseGrad.addColorStop(1, 'rgba(10, 5, 2, 0.7)');
      cctx.fillStyle = baseGrad;
      cctx.fillRect(300, 680, 460, 50);

      cctx.restore();
      return c;
    }

    function renderScene() {
      const dogCanvas = getCleanDogHeadCanvas();
      const armorCanvas = getCleanArmorCanvas();
      const pumpkinCanvas = getCleanPumpkinCanvas();

      // =========================================================================
      // 1. BACKGROUND: REAL NIGHT COLOSSEUM ENVIRONMENT
      // =========================================================================
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#030108');
      sky.addColorStop(0.35, '#080414');
      sky.addColorStop(0.7, '#120822');
      sky.addColorStop(1, '#040208');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Colosseum photo in background with shallow depth-of-field
      ctx.save();
      const coloW = 2400;
      const coloH = 1884 * (coloW / 2528);
      const coloY = H - coloH + 110;
      ctx.filter = 'blur(4px) brightness(0.68) contrast(1.15) saturate(1.2)';
      ctx.drawImage(colosseumImg, 0, coloY, coloW, coloH);
      ctx.filter = 'none';

      // Midnight sky fade
      const skyFade = ctx.createLinearGradient(0, 0, 0, 480);
      skyFade.addColorStop(0, 'rgba(3, 1, 8, 0.98)');
      skyFade.addColorStop(0.5, 'rgba(5, 2, 12, 0.82)');
      skyFade.addColorStop(0.85, 'rgba(8, 4, 18, 0.25)');
      skyFade.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = skyFade;
      ctx.fillRect(0, 0, W, 480);

      // Starfield
      for (let i = 0; i < 300; i++) {
        const sx = rnd() * W;
        const sy = rnd() * 400;
        const r = rnd() > 0.95 ? rndRange(1.4, 2.2) : rndRange(0.5, 1.1);
        const a = rndRange(0.25, 0.9);
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 250, 235, ' + a + ')';
        ctx.fill();
      }

      // Radiant Harvest Moon
      const mx = 600;
      const my = 200;
      const mr = 92;

      const moonGlow = ctx.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 3.8);
      moonGlow.addColorStop(0, 'rgba(255, 240, 200, 0.48)');
      moonGlow.addColorStop(0.35, 'rgba(240, 180, 70, 0.18)');
      moonGlow.addColorStop(0.7, 'rgba(200, 110, 20, 0.04)');
      moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(mx, my, mr * 3.8, 0, Math.PI * 2);
      ctx.fill();

      const moonBody = ctx.createRadialGradient(mx - 25, my - 25, 15, mx, my, mr);
      moonBody.addColorStop(0, '#fffbf0');
      moonBody.addColorStop(0.45, '#fae6b2');
      moonBody.addColorStop(0.85, '#d6ae5c');
      moonBody.addColorStop(1, '#8c6720');
      ctx.fillStyle = moonBody;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();

      // Vignette
      const vig = ctx.createRadialGradient(W / 2, H / 2, 750, W / 2, H / 2, 1400);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(0.65, 'rgba(2, 1, 6, 0.42)');
      vig.addColorStop(1, 'rgba(1, 0, 3, 0.92)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Ancient Roman Flagstone Floor
      const floorY = 960;
      const floorGrad = ctx.createLinearGradient(0, floorY, 0, H);
      floorGrad.addColorStop(0, 'rgba(20, 13, 10, 0.96)');
      floorGrad.addColorStop(0.35, '#120b08');
      floorGrad.addColorStop(1, '#060302');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, floorY, W, H - floorY);

      // Flagstone seams with subtle perspective
      ctx.strokeStyle = 'rgba(45, 30, 20, 0.55)';
      ctx.lineWidth = 3;
      for (let r = 0; r < 5; r++) {
        const fy = floorY + 40 + r * 75;
        ctx.beginPath();
        ctx.moveTo(0, fy);
        ctx.lineTo(W, fy);
        ctx.stroke();
      }
      for (let c = 0; c < 14; c++) {
        const fx = 80 + c * 180;
        ctx.beginPath();
        ctx.moveTo(fx, floorY + 40);
        ctx.lineTo(fx - 40, H);
        ctx.stroke();
      }

      // =========================================================================
      // 2. ROMAN VEXILLUM LEGIONARY STANDARD ON LEFT
      // =========================================================================
      ctx.save();
      const vexX = 260;

      const staffGrad = ctx.createLinearGradient(vexX - 12, 0, vexX + 12, 0);
      staffGrad.addColorStop(0, '#3a2808');
      staffGrad.addColorStop(0.3, '#c29a28');
      staffGrad.addColorStop(0.6, '#ffd700');
      staffGrad.addColorStop(0.85, '#a67c1e');
      staffGrad.addColorStop(1, '#2b1c04');
      ctx.fillStyle = staffGrad;
      ctx.fillRect(vexX - 9, 130, 18, 1060);

      // Spearhead finial
      ctx.fillStyle = staffGrad;
      ctx.beginPath();
      ctx.moveTo(vexX, 75);
      ctx.lineTo(vexX - 25, 135);
      ctx.lineTo(vexX + 25, 135);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff6a0';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Crossbar with gold balls
      ctx.fillRect(vexX - 145, 195, 290, 18);
      ctx.beginPath(); ctx.arc(vexX - 145, 204, 15, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(vexX + 145, 204, 15, 0, Math.PI * 2); ctx.fill();

      // Imperial Crimson Velvet Banner
      const bannerW = 245;
      const bannerH = 430;
      const bX = vexX - bannerW / 2;
      const bY = 213;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetX = 12;
      ctx.shadowOffsetY = 16;

      const velGrad = ctx.createLinearGradient(bX, 0, bX + bannerW, 0);
      velGrad.addColorStop(0, '#4a0614');
      velGrad.addColorStop(0.2, '#7d0d26');
      velGrad.addColorStop(0.5, '#5c091b');
      velGrad.addColorStop(0.8, '#850f29');
      velGrad.addColorStop(1, '#33030d');
      ctx.fillStyle = velGrad;
      ctx.fillRect(bX, bY, bannerW, bannerH);
      ctx.shadowColor = 'transparent';

      // Gold embroidery border
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4.5;
      ctx.strokeRect(bX + 12, bY + 12, bannerW - 24, bannerH - 24);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(bX + 18, bY + 18, bannerW - 36, bannerH - 36);

      // SPQC Text
      ctx.fillStyle = '#ffd700';
      ctx.font = '900 35px "Cinzel", "Georgia", "Trajan Pro", serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '6px';
      ctx.fillText('S • P • Q • C', vexX, bY + 68);

      // Golden Cat Paw
      const pawY = bY + 185;
      const pawGrad = ctx.createRadialGradient(vexX, pawY, 8, vexX, pawY, 52);
      pawGrad.addColorStop(0, '#fff6a0');
      pawGrad.addColorStop(0.6, '#ffd700');
      pawGrad.addColorStop(1, '#9e7605');
      ctx.fillStyle = pawGrad;

      ctx.beginPath();
      ctx.ellipse(vexX, pawY + 18, 42, 33, 0, 0, Math.PI * 2);
      ctx.fill();

      const toes = [
        { dx: -38, dy: -20, rx: 13, ry: 17, rot: -0.3 },
        { dx: -14, dy: -36, rx: 14, ry: 19, rot: -0.1 },
        { dx: 14, dy: -36, rx: 14, ry: 19, rot: 0.1 },
        { dx: 38, dy: -20, rx: 13, ry: 17, rot: 0.3 },
      ];
      toes.forEach(t => {
        ctx.save();
        ctx.translate(vexX + t.dx, pawY + t.dy);
        ctx.rotate(t.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, t.rx, t.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Subtitle
      ctx.font = '800 15px "Inter", sans-serif';
      ctx.letterSpacing = '3px';
      ctx.fillStyle = '#ffecb3';
      ctx.fillText('FELIS INCOGNITUS', vexX, bY + 298);
      ctx.font = 'italic 700 13px "Georgia", serif';
      ctx.letterSpacing = '1px';
      ctx.fillStyle = '#ffd54f';
      ctx.fillText('"TOTALLY A REAL CAT"', vexX, bY + 332);

      // Gold fringe tassels
      ctx.fillStyle = '#ffd700';
      for (let t = 0; t < 18; t++) {
        const tx = bX + 7 + t * 13.5;
        ctx.fillRect(tx, bY + bannerH, 8, 28);
      }
      ctx.restore();

      // =========================================================================
      // 3. CENTER HERO: COMPOSITING DOG HEAD & ROMAN ARMOR
      // =========================================================================
      const heroX = 1200;
      const armorDrawW = 1220;
      const armorDrawH = Math.round(2770 * (armorDrawW / 1768)); // ~1911px
      const armorDrawX = heroX - armorDrawW / 2 + 30; // 620
      const armorDrawY = 320;

      // Canine head: 650px wide, chin settles naturally behind the armor's red tunic collar
      const dogDrawW = 650;
      const dogDrawH = Math.round(2579 * (dogDrawW / 3002)); // ~558px
      const dogDrawX = heroX - dogDrawW / 2 - 4; // 871
      const dogDrawY = 322; // chin reaches y=880; armor collar dip is at y=861

      // A. DRAW DOG HEAD FIRST (so base of neck enters tunic opening)
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 14;
      ctx.drawImage(dogCanvas, dogDrawX, dogDrawY, dogDrawW, dogDrawH);
      ctx.restore();

      // Photographic Eye Catchlights (bringing soulful eyes to life!)
      ctx.save();
      // Left eye pupil: cool moonlight catchlight dot
      const lEyeX = dogDrawX + 276 * (dogDrawW / 1000);
      const lEyeY = dogDrawY + 338 * (dogDrawH / 1000);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(220, 240, 255, 0.9)';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(lEyeX, lEyeY, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Right eye pupil: warm pumpkin candle reflection dot
      const rEyeX = dogDrawX + 724 * (dogDrawW / 1000);
      const rEyeY = dogDrawY + 338 * (dogDrawH / 1000);
      ctx.fillStyle = '#ffe082';
      ctx.shadowColor = 'rgba(255, 160, 20, 0.9)';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(rEyeX, rEyeY, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // B. DRAW ROMAN ARMOR ON TOP (so red tunic collar naturally overlaps the dog's neck base)
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 35;
      ctx.shadowOffsetY = 20;
      ctx.drawImage(armorCanvas, armorDrawX, armorDrawY, armorDrawW, armorDrawH);
      ctx.restore();

      // =========================================================================
      // 4. AUTHENTIC HALLOWEEN CAT DISGUISE ACCENTS
      // =========================================================================

      // --- A. Realistic Cosmetic White Greasepaint Cat Whiskers on Muzzle ---
      ctx.save();
      const muzzleX = heroX - 4;
      const muzzleY = dogDrawY + 388;

      function drawCosmeticWhiskers(startX, startY, isLeft) {
        const dir = isLeft ? -1 : 1;
        const whiskerAngles = [-0.15, 0.02, 0.20];
        const lengths = [130, 150, 125];

        whiskerAngles.forEach((ang, idx) => {
          const len = lengths[idx];
          ctx.save();
          ctx.beginPath();
          const yOff = idx * 14;
          ctx.moveTo(startX, startY + yOff);
          ctx.quadraticCurveTo(
            startX + dir * (len * 0.45),
            startY + yOff + ang * 35 - 4,
            startX + dir * len,
            startY + yOff + ang * 70
          );

          // Soft translucent outer greasepaint stroke (stippled fur look)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
          ctx.lineWidth = 3.2;
          ctx.lineCap = 'round';
          ctx.shadowColor = 'rgba(255, 255, 255, 0.35)';
          ctx.shadowBlur = 4;
          ctx.stroke();

          // Crisp core paint center
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 0;
          ctx.stroke();
          ctx.restore();
        });
      }

      // Draw whiskers on left and right muzzle cheeks
      drawCosmeticWhiskers(muzzleX - 70, muzzleY, true);
      drawCosmeticWhiskers(muzzleX + 70, muzzleY, false);

      // Cute cosmetic pink greasepaint kitten nose tint on actual nose leather
      const noseTipY = dogDrawY + 418;
      const noseGlow = ctx.createRadialGradient(muzzleX, noseTipY, 2, muzzleX, noseTipY, 18);
      noseGlow.addColorStop(0, 'rgba(255, 120, 160, 0.65)');
      noseGlow.addColorStop(0.5, 'rgba(240, 80, 130, 0.3)');
      noseGlow.addColorStop(1, 'rgba(240, 80, 130, 0)');
      ctx.fillStyle = noseGlow;
      ctx.beginPath();
      ctx.ellipse(muzzleX, noseTipY, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // --- B. Ultra-Realistic 3D Plush Cat Ears Headband ---
      // Sitting naturally on the dog's crown between the floppy ears
      const headbandCX = heroX;
      const headbandY = dogDrawY + 68;

      ctx.save();
      // Drop shadow of the headband onto the dog's skull fur
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 8;

      // Realistic arched padded black velvet headband
      ctx.strokeStyle = '#141414';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(headbandCX, headbandY + 36, 140, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();

      // Velvet sheen highlight along band
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(headbandCX, headbandY + 34, 141, Math.PI * 1.27, Math.PI * 1.73);
      ctx.stroke();
      ctx.shadowColor = 'transparent';

      // 3D Realistic Plush Cat Ears (smooth organic curved silhouette, soft pink velour lining, fine white down)
      function renderRealCatEar(cx, cy, isLeft) {
        ctx.save();
        const dir = isLeft ? -1 : 1;
        const earW = 96;
        const earH = 146;
        const tilt = dir * 0.18; // outward natural perky angle

        ctx.translate(cx, cy);
        ctx.rotate(tilt);

        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = dir * 6;
        ctx.shadowOffsetY = 10;

        // Outer Ear: Rich black/charcoal plush faux-fur with 3D cylindrical lighting
        const outG = ctx.createLinearGradient(-dir * (earW / 2), 0, 0, -earH);
        outG.addColorStop(0, '#0a0a0a');
        outG.addColorStop(0.4, '#242424');
        outG.addColorStop(0.75, '#121212');
        outG.addColorStop(1, '#050505');
        ctx.fillStyle = outG;

        // Organic curved ear silhouette (smooth rounded tip, not sharp needle!)
        ctx.beginPath();
        ctx.moveTo(-earW * 0.5, 0);
        // Outer curved flank
        ctx.bezierCurveTo(-earW * 0.42, -earH * 0.5, -earW * 0.15, -earH * 0.88, 0, -earH);
        // Soft rounded tip
        ctx.bezierCurveTo(earW * 0.08, -earH * 0.98, earW * 0.16, -earH * 0.92, earW * 0.22, -earH * 0.82);
        // Inner curved flank down to base
        ctx.bezierCurveTo(earW * 0.38, -earH * 0.5, earW * 0.46, -earH * 0.25, earW * 0.48, 0);
        ctx.closePath();
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // Outer micro-fur strands along the rim
        ctx.strokeStyle = '#2c2c2c';
        ctx.lineWidth = 1.5;
        for (let f = 0; f < 25; f++) {
          const fy = -rnd() * earH;
          const fx = -earW * 0.45 * (1 - Math.abs(fy) / earH);
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(fx + dir * rndRange(3, 8), fy - rndRange(2, 6));
          ctx.stroke();
        }

        // Inner Ear: Soft Velour Pastel Pink Lining with realistic depth crease
        const inG = ctx.createLinearGradient(0, 0, 0, -earH);
        inG.addColorStop(0, '#ff8da1');
        inG.addColorStop(0.65, '#f06292');
        inG.addColorStop(1, '#ad1457');
        ctx.fillStyle = inG;

        ctx.beginPath();
        ctx.moveTo(-earW * 0.28, -6);
        ctx.bezierCurveTo(-earW * 0.22, -earH * 0.45, -earW * 0.08, -earH * 0.8, 0, -earH * 0.88);
        ctx.bezierCurveTo(earW * 0.06, -earH * 0.85, earW * 0.14, -earH * 0.78, earW * 0.18, -earH * 0.7);
        ctx.bezierCurveTo(earW * 0.26, -earH * 0.42, earW * 0.28, -earH * 0.2, earW * 0.26, -10);
        ctx.closePath();
        ctx.fill();

        // Inner shadow crease down the center of the pink pinna
        ctx.strokeStyle = 'rgba(136, 14, 79, 0.35)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -earH * 0.1);
        ctx.quadraticCurveTo(0, -earH * 0.5, 0, -earH * 0.82);
        ctx.stroke();

        // Delicate white downy hair tufts inside ear
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.4;
        for (let t = 0; t < 22; t++) {
          const tx = rndRange(-12, 12);
          const ty = -rndRange(10, 65);
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.quadraticCurveTo(tx + dir * 10, ty - 6, tx + dir * 16, ty - 12);
          ctx.stroke();
        }
        ctx.restore();
      }

      renderRealCatEar(headbandCX - 86, headbandY - 10, true);
      renderRealCatEar(headbandCX + 86, headbandY - 10, false);

      // --- C. Laminated "HELLO MY NAME IS" Badge Pinned to Leather Baldric Strap ---
      const badgeW = 240;
      const badgeH = 145;
      const badgeX = heroX - 20;
      const badgeY = 925;
      const badgeRot = 0.07;

      ctx.save();
      ctx.translate(badgeX + badgeW / 2, badgeY + badgeH / 2);
      ctx.rotate(badgeRot);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 22;
      ctx.shadowOffsetX = 10;
      ctx.shadowOffsetY = 14;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 12);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      // Red header
      ctx.fillStyle = '#e50914';
      ctx.beginPath();
      ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, 42, [12, 12, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 15px "Inter", "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '2px';
      ctx.fillText('HELLO MY NAME IS', 0, -badgeH / 2 + 28);

      // Handwritten marker name
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 27px "Comic Sans MS", "Chalkboard", cursive, sans-serif';
      ctx.fillText('Felix (Meow!)', 0, 8);

      // Subtitle
      ctx.fillStyle = '#64748b';
      ctx.font = '700 11px "Inter", sans-serif';
      ctx.letterSpacing = '1.8px';
      ctx.fillText('[ 100% CERTIFIED REAL CAT ]', 0, 34);

      // Plastic lamination gloss reflection
      const shineGrad = ctx.createLinearGradient(-badgeW / 2, -badgeH / 2, badgeW / 2, badgeH / 2);
      shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
      shineGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
      shineGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
      shineGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.14)');
      ctx.fillStyle = shineGrad;
      ctx.beginPath();
      ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 12);
      ctx.fill();

      // Chrome safety pin at top
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-38, -badgeH / 2 - 4);
      ctx.lineTo(38, -badgeH / 2 - 4);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(36, -badgeH / 2 - 4, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // =========================================================================
      // 5. REAL GLOWING JACK-O'-LANTERN SITTING ON STONE FLOOR
      // =========================================================================
      const pkDrawW = 460;
      const pkDrawH = 420;
      const pkDrawX = 1760;
      const pkDrawY = 880;

      ctx.save();
      // Warm candle glow illuminating the floor
      const fireGlow = ctx.createRadialGradient(
        pkDrawX + pkDrawW * 0.5, pkDrawY + pkDrawH * 0.55, 50,
        pkDrawX + pkDrawW * 0.5, pkDrawY + pkDrawH * 0.55, 560
      );
      fireGlow.addColorStop(0, 'rgba(255, 140, 20, 0.65)');
      fireGlow.addColorStop(0.35, 'rgba(255, 90, 10, 0.32)');
      fireGlow.addColorStop(0.7, 'rgba(200, 50, 0, 0.08)');
      fireGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = fireGlow;
      ctx.fillRect(pkDrawX - 250, pkDrawY - 200, pkDrawW + 500, pkDrawH + 400);

      // Natural soft contact shadow under pumpkin
      const pkShadow = ctx.createRadialGradient(
        pkDrawX + pkDrawW * 0.5, pkDrawY + pkDrawH - 15, 20,
        pkDrawX + pkDrawW * 0.5, pkDrawY + pkDrawH - 15, pkDrawW * 0.48
      );
      pkShadow.addColorStop(0, 'rgba(0, 0, 0, 0.88)');
      pkShadow.addColorStop(0.6, 'rgba(10, 5, 2, 0.45)');
      pkShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = pkShadow;
      ctx.beginPath();
      ctx.ellipse(pkDrawX + pkDrawW * 0.5, pkDrawY + pkDrawH - 15, pkDrawW * 0.46, 26, 0, 0, Math.PI * 2);
      ctx.fill();

      // Full organic pumpkin source
      const pSrcX = 300;
      const pSrcY = 315;
      const pSrcW = 460;
      const pSrcH = 420;
      ctx.drawImage(pumpkinCanvas, pSrcX, pSrcY, pSrcW, pSrcH, pkDrawX, pkDrawY, pkDrawW, pkDrawH);

      // Floating fire embers
      for (let e = 0; e < 25; e++) {
        const ex = pkDrawX + rndRange(-80, 300);
        const ey = pkDrawY - rndRange(20, 320);
        const er = rndRange(1.5, 3.8);
        const ea = rndRange(0.4, 0.95);
        ctx.beginPath();
        ctx.arc(ex, ey, er, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 180, 50, ' + ea + ')';
        ctx.shadowColor = 'rgba(255, 120, 10, 0.9)';
        ctx.shadowBlur = 8;
        ctx.fill();
      }
      ctx.restore();

      // =========================================================================
      // 6. CINEMATIC POST-PROCESSING & TYPOGRAPHY
      // =========================================================================

      // Subtle photographic film grain to tie all layers together
      const imgData = ctx.getImageData(0, 0, W, H);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 16) {
        const noise = (rnd() - 0.5) * 5;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
        data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);

      // Header Typography: SERVICEMEOW & HALLOWEEN SPECIAL
      ctx.save();
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255, 215, 0, 0.55)';
      ctx.shadowBlur = 28;

      const titleGrad = ctx.createLinearGradient(W / 2 - 320, 0, W / 2 + 320, 0);
      titleGrad.addColorStop(0, '#ffd54f');
      titleGrad.addColorStop(0.5, '#fff9c4');
      titleGrad.addColorStop(1, '#ffb300');
      ctx.fillStyle = titleGrad;
      ctx.font = '900 68px "Cinzel", "Georgia", "Trajan Pro", serif';
      ctx.letterSpacing = '8px';
      ctx.fillText('SERVICEMEOW', W / 2, 95);

      ctx.shadowColor = 'transparent';
      const subW = 860;
      const subH = 44;
      const subX = W / 2 - subW / 2;
      const subY = 125;

      ctx.fillStyle = '#eb0029'; // International Swiss Red
      ctx.fillRect(subX, subY, subW, subH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(subX, subY, subW, subH);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 19px "Inter", "Helvetica Neue", Arial, sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('🎃 HALLOWEEN SPECIAL: OPERATION FELIS INCOGNITUS 🐾', W / 2, subY + 29);
      ctx.restore();

      // Bottom Classical Stone Inscription Plinth
      ctx.save();
      ctx.textAlign = 'center';
      const plinthW = 1420;
      const plinthH = 54;
      const plinthX = W / 2 - plinthW / 2;
      const plinthY = H - 85;

      ctx.fillStyle = 'rgba(8, 4, 16, 0.94)';
      ctx.fillRect(plinthX, plinthY, plinthW, plinthH);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(plinthX, plinthY, plinthW, plinthH);

      ctx.fillStyle = '#ffe082';
      ctx.font = '700 21px "Cinzel", "Georgia", serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('CANIS ROMANUS IN VESTE FELIS • "BARK? NO CITIZEN, DEFINITELY MEOW."', W / 2, plinthY + 35);

      // Swiss Grid Corner Crosshairs
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(40, 40); ctx.lineTo(100, 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(40, 40); ctx.lineTo(40, 100); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W - 40, 40); ctx.lineTo(W - 100, 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W - 40, 40); ctx.lineTo(W - 40, 100); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(40, H - 40); ctx.lineTo(100, H - 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(40, H - 40); ctx.lineTo(40, H - 100); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W - 40, H - 40); ctx.lineTo(W - 100, H - 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W - 40, H - 40); ctx.lineTo(W - 40, H - 100); ctx.stroke();
      ctx.restore();
    }
  </script>
</body>
</html>`;

  await page.setContent(htmlContent, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1800));

  console.log('[mascot] Capturing 2400x1350 photorealistic PNG render...');
  const canvasElement = await page.$('#canvas');
  const pngBuffer = await canvasElement.screenshot({ type: 'png' });

  fs.writeFileSync(OUTPUT_PNG_DOCS, pngBuffer);
  fs.writeFileSync(OUTPUT_PNG_PUBLIC, pngBuffer);
  console.log(`[mascot] Saved PNG to ${OUTPUT_PNG_DOCS}`);
  console.log(`[mascot] Saved PNG to ${OUTPUT_PNG_PUBLIC}`);

  const base64Data = pngBuffer.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 1350" width="100%" height="100%">
  <!-- Photorealistic High-Definition Canvas Render (2400x1350) -->
  <image href="data:image/png;base64,${base64Data}" width="2400" height="1350" preserveAspectRatio="xMidYMid slice"/>
</svg>
`;

  fs.writeFileSync(OUTPUT_SVG_DOCS, svgContent, 'utf-8');
  fs.writeFileSync(OUTPUT_SVG_PUBLIC, svgContent, 'utf-8');
  console.log(`[mascot] Saved SVG to ${OUTPUT_SVG_DOCS}`);
  console.log(`[mascot] Saved SVG to ${OUTPUT_SVG_PUBLIC}`);

  await browser.close();
  console.log('[mascot] Photorealistic mascot completed successfully!');
}

main().catch(err => {
  console.error('[mascot] Error:', err);
  process.exit(1);
});
