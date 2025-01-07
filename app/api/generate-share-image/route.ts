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

    // Set sophisticated background with gradient overlay
    const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGradient.addColorStop(0, '#292524');
    bgGradient.addColorStop(0.7, '#44403c');
    bgGradient.addColorStop(1, '#57534e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Add subtle pattern overlay
    for (let i = 0; i < 1920; i += 30) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1080, i);
      ctx.stroke();
    }

    // Load and draw the logo with slightly smaller size
    const logo = await loadImage(join(process.cwd(), 'public/chicks-of-nyc-logo.png'));
    const logoAspectRatio = logo.width / logo.height;
    const logoHeight = 500; // Reduced from 600
    const logoWidth = logoHeight * logoAspectRatio;
    
    ctx.save();
    ctx.drawImage(logo, (1080 - logoWidth) / 2, 60, logoWidth, logoHeight);
    ctx.restore();

    // Constants for layout
    const margin = 40;
    const contentWidth = 1080 - (margin * 2);
    const cardY = 600; // Adjusted to accommodate smaller logo

    // Draw the main card background with slight transparency
    ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    roundRect(ctx, margin, cardY, contentWidth, 1920 - cardY - margin, 24); // Extend to bottom of canvas
    ctx.fill();
    ctx.shadowBlur = 0;

    // Restaurant name with bold Comic Sans
    ctx.save();
    ctx.font = 'bold 80px "Comic Sans MS"';
    ctx.fillStyle = '#c2410c';
    ctx.textAlign = 'center';
    // Add stronger text shadow for more pop
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.fillText(spotName.toUpperCase(), 540, cardY + 70);
    ctx.restore();

    // Draw ratings grid
    const ratings = [
      { label: 'Overall', value: overallRating, color: '#4d7c0f' },
      { label: 'Sauce', value: sauceRating, color: '#b91c1c' },
      { label: 'Crispy', value: crispynessRating, color: '#b45309' },
      { label: 'Meat', value: meatRating, color: '#c2410c' }
    ];

    const ratingStartX = margin + 60;
    const ratingWidth = (contentWidth - 120) / 4;
    const ratingsY = cardY + 140;

    ratings.forEach((rating, index) => {
      const x = ratingStartX + (index * ratingWidth);
      const width = ratingWidth - 20;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, x, ratingsY, width, 120, 16);
      ctx.fill();

      ctx.fillStyle = rating.color;
      roundRect(ctx, x, ratingsY, width, 70, 16);
      ctx.fill();

      // Rating value
      ctx.font = 'bold 48px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(rating.value.toString(), x + width/2, ratingsY + 48);

      // Rating label
      ctx.font = '24px Arial';
      ctx.fillStyle = '#1f2937';
      ctx.fillText(rating.label, x + width/2, ratingsY + 100);
      ctx.restore();
    });

    // Photos section - slightly bigger
    const photoHeight = 320; // Increased from 280
    const photosStartY = ratingsY + 160;
    const photoGap = 40;
    const photoWidth = (contentWidth - photoGap - 120) / 2; // Reduced side padding
    const photosStartX = margin + 60; // Reduced from 80

    // First photo
    const mainImage = await loadImage(photoUrl);
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    roundRect(ctx, photosStartX, photosStartY, photoWidth, photoHeight, 16);
    ctx.clip();
    const mainAspectRatio = mainImage.width / mainImage.height;
    const mainDrawWidth = photoHeight * mainAspectRatio;
    const mainOffsetX = (photoWidth - mainDrawWidth) / 2;
    ctx.drawImage(mainImage, photosStartX + mainOffsetX, photosStartY, mainDrawWidth, photoHeight);
    ctx.restore();

    // Second photo
    if (photos.length > 0) {
      const secondPhoto = await loadImage(photos[0]);
      const x = photosStartX + photoWidth + photoGap;
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      roundRect(ctx, x, photosStartY, photoWidth, photoHeight, 16);
      ctx.clip();
      const secondAspectRatio = secondPhoto.width / secondPhoto.height;
      const secondDrawWidth = photoHeight * secondAspectRatio;
      const secondOffsetX = (photoWidth - secondDrawWidth) / 2;
      ctx.drawImage(secondPhoto, x + secondOffsetX, photosStartY, secondDrawWidth, photoHeight);
      ctx.restore();
    }

    // Draw map - slightly bigger
    const mapHeight = 340; // Increased from 300
    const mapY = photosStartY + photoHeight + 40;
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=15&size=1000x500&scale=2&maptype=roadmap&markers=color:orange%7C${encodeURIComponent(address)}&style=feature:poi|visibility:off&style=feature:transit|visibility:off&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    const mapImage = await loadImage(mapUrl);
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    roundRect(ctx, margin, mapY, contentWidth, mapHeight, 16);
    ctx.clip();
    const mapAspectRatio = mapImage.width / mapImage.height;
    const mapWidth = mapHeight * mapAspectRatio;
    const mapX = margin + (contentWidth - mapWidth) / 2;
    ctx.drawImage(mapImage, mapX, mapY, mapWidth, mapHeight);
    ctx.restore();

    // Address with bold black text
    const addressY = mapY + mapHeight + 60;
    ctx.save();
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('📍', 500, addressY);
    ctx.fillText(address, 540, addressY);
    ctx.restore();

    // Social info with more spacing but compact
    const instagramY = addressY + 80;
    const websiteY = instagramY + 70;

    // Instagram handle
    if (instagram) {
      ctx.save();
      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#c2410c';
      ctx.textAlign = 'center';
      ctx.fillText('📸', 500, instagramY);
      ctx.fillText('@' + instagram.replace('@', ''), 540, instagramY);
      ctx.restore();
    }

    // Website
    ctx.save();
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#c2410c';
    ctx.textAlign = 'center';
    ctx.fillText('🍗', 500, websiteY);
    ctx.fillText('chicksofnyc.com', 540, websiteY);
    ctx.fillText('🔥', 580, websiteY);
    ctx.restore();

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