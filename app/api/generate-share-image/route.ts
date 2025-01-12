import { NextResponse } from 'next/server';
import { createCanvas, loadImage, registerFont } from 'canvas';
import sharp from 'sharp';
import { join } from 'path';
import * as fs from 'fs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Register fonts
const fontPath = join(process.cwd(), 'public/fonts/Inter_18pt-Bold.ttf');
const lilitaPath = join(process.cwd(), 'public/fonts/LilitaOne-Regular.ttf');

// Register fonts with simpler names
if (fs.existsSync(fontPath)) {
  registerFont(fontPath, { 
    family: 'Inter',
    weight: 'bold',
    style: 'normal'
  });
}
if (fs.existsSync(lilitaPath)) {
  registerFont(lilitaPath, { 
    family: 'LilitaOne',
    weight: 'normal',
    style: 'normal'
  });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      spotName, 
      address, 
      overallRating, 
      sauceRating, 
      crispynessRating, 
      meatRating, 
      instagram,
      photoUrl,
      photos = []
    } = data;

    if (!spotName || !photoUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create canvas with Instagram story dimensions (1080x1920)
    const canvas = createCanvas(1080, 1920);
    const ctx = canvas.getContext('2d');

    // Set background color (muted orange)
    ctx.fillStyle = '#FFF5EB';  // Warm, muted orange background
    ctx.fillRect(0, 0, 1080, 1920);

    // Load and draw the logo at the top - centered
    const logo = await loadImage(join(process.cwd(), 'public/chicks-of-nyc-logo.png'));
    const logoHeight = 160;
    const logoWidth = logoHeight * (logo.width / logo.height);
    const logoX = (1080 - logoWidth) / 2;
    ctx.drawImage(logo, logoX, 40, logoWidth, logoHeight);

    // Add Instagram handle and website in top right
    ctx.textAlign = 'right';
    ctx.font = 'bold 32px Inter';
    ctx.fillStyle = '#FF4438';  // Secondary red
    ctx.fillText('@chicksofnyc', 1040, 80);
    
    ctx.font = 'bold 24px Inter';
    ctx.fillStyle = '#8B4513';  // Primary brown
    ctx.fillText('chicksofnyc.com', 1040, 120);

    // Restaurant name in primary color
    ctx.font = 'bold 64px Inter';
    ctx.fillStyle = '#8B4513';  // --primary
    ctx.textAlign = 'left';
    ctx.fillText(spotName, 40, 340);

    // Address in text-dark
    ctx.font = '32px Inter';
    ctx.fillStyle = '#5D4037';  // --text-dark
    ctx.fillText(address, 40, 400);

    // Overall rating with large display
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#FFFCF5';  // --bg-warm
    const overallText = `${overallRating.toFixed(1)}/10`;
    ctx.font = 'bold 160px Inter';
    const overallMetrics = ctx.measureText(overallText);
    const overallWidth = Math.max(overallMetrics.width + 120, 520);  // Increased padding
    roundRect(ctx, 40, 450, overallWidth, 220, 24);
    ctx.fill();
    
    // Add outline
    ctx.strokeStyle = '#FF4438';  // --secondary
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Draw overall rating text
    ctx.font = 'bold 160px Inter';
    ctx.fillStyle = '#8B4513';  // --primary
    ctx.textAlign = 'left';
    ctx.fillText(overallText, 80, 600);
    
    ctx.font = '40px Inter';
    ctx.fillStyle = '#5D4037';  // --text-dark
    ctx.fillText('Overall Rating', 80, 650);

    // Individual ratings with icons and colored backgrounds
    const ratings = [
      { label: 'Sauce', value: sauceRating, icon: '💧', color: '#FF4438', bgColor: '#FFFCF5' },  // All ratings use secondary red
      { label: 'Crispy', value: crispynessRating, icon: '🔥', color: '#FF4438', bgColor: '#FFFCF5' },
      { label: 'Meat', value: meatRating, icon: '🍗', color: '#FF4438', bgColor: '#FFFCF5' }
    ];

    const ratingWidth = 310;
    const ratingGap = 25;
    const ratingsY = 750;

    ratings.forEach((rating, index) => {
      const x = 40 + (index * (ratingWidth + ratingGap));
      
      // Draw rating box with subtle shadow and background
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#FFFFFF';  // White background for contrast
      roundRect(ctx, x, ratingsY, ratingWidth, 100, 16);
      ctx.fill();

      // Add color accent bar
      ctx.fillStyle = rating.color;
      ctx.fillRect(x, ratingsY, ratingWidth, 4);
      ctx.restore();

      // Draw icon
      ctx.font = '40px Inter';
      ctx.fillText(rating.icon, x + 20, ratingsY + 60);

      // Draw label in dark brown and bold
      ctx.font = 'bold 32px Inter';  // Made bold
      ctx.fillStyle = '#8B4513';  // Primary brown
      ctx.fillText(rating.label, x + 80, ratingsY + 60);

      // Draw score with red color
      ctx.font = 'bold 40px Inter';
      ctx.fillStyle = rating.color;
      ctx.textAlign = 'right';
      ctx.fillText(`${rating.value}/10`, x + ratingWidth - 20, ratingsY + 60);
      ctx.textAlign = 'left';
    });

    // Draw photos in a 2x2 grid
    const gridPhotoSize = 400;  // Reduced from 480
    const photoGap = 20;  // Reduced from 40
    const photosStartY = 900;  // Moved up from 1550
    
    // Helper function to draw a photo in the grid
    const drawGridPhoto = async (photo: string, x: number, y: number) => {
      const img = await loadImage(photo);
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 15;
      roundRect(ctx, x, y, gridPhotoSize, gridPhotoSize, 16);
      ctx.clip();
      
      // Calculate dimensions to fill square while maintaining aspect ratio
      const imgAspect = img.width / img.height;
      let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
      
      if (imgAspect > 1) {
        // Landscape: fit to height
        drawHeight = gridPhotoSize;
        drawWidth = gridPhotoSize * imgAspect;
        offsetX = -(drawWidth - gridPhotoSize) / 2;
      } else {
        // Portrait: fit to width
        drawWidth = gridPhotoSize;
        drawHeight = gridPhotoSize / imgAspect;
        offsetY = -(drawHeight - gridPhotoSize) / 2;
      }
      
      ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
      ctx.restore();
    };

    // Calculate grid positions with proper centering
    const totalWidth = (gridPhotoSize * 2) + photoGap;
    const startX = (1080 - totalWidth) / 2;
    
    // Draw main photo in top left
    await drawGridPhoto(photoUrl, startX, photosStartY);
    
    // Draw up to 3 more photos from the photos array
    const positions = [
      [startX + gridPhotoSize + photoGap, photosStartY],  // Top right
      [startX, photosStartY + gridPhotoSize + photoGap],  // Bottom left
      [startX + gridPhotoSize + photoGap, photosStartY + gridPhotoSize + photoGap]  // Bottom right
    ];
    
    for (let i = 0; i < Math.min(3, photos.length); i++) {
      await drawGridPhoto(photos[i], positions[i][0], positions[i][1]);
    }

    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');

    // Optimize with sharp
    const optimized = await sharp(buffer)
      .png({ quality: 90 })
      .toBuffer();

    return new NextResponse(optimized, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Share image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate share image' },
      { status: 500 }
    );
  }
}

// Helper function to draw rounded rectangles
function roundRect(ctx: any, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Helper function to wrap text
function getLines(ctx: any, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

// Helper function to shade colors
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
} 