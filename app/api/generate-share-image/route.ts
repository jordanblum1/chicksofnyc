import { NextResponse } from 'next/server';
import { createCanvas, loadImage, registerFont, CanvasRenderingContext2D, Image } from 'canvas';
import sharp from 'sharp';
import { join } from 'path';
import * as fs from 'fs';
import logger from '../../utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Register the LilitaOne font which we know exists
const lilitaPath = join(process.cwd(), 'public', 'fonts', 'LilitaOne-Regular.ttf');
if (fs.existsSync(lilitaPath)) {
  registerFont(lilitaPath, { 
    family: 'LilitaOne',
    weight: 'normal'
  });
}

interface ImageDimensions {
  width: number;
  height: number;
  photoSize: number;
  photoGap: number;
  photosStartY: number;
  logoHeight: number;
}

const DIMENSIONS = {
  story: {
    width: 1080,
    height: 1920,
    photoSize: 400,
    photoGap: 20,
    photosStartY: 900,
    logoHeight: 160
  },
  square: {
    width: 1080,
    height: 1080,
    photoSize: 320,
    photoGap: 16,
    photosStartY: 580,
    logoHeight: 120
  }
} as const;

// Helper function to draw an image with error handling
async function drawImage(
  ctx: CanvasRenderingContext2D,
  imagePath: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  try {
    const image = await loadImage(imagePath);
    ctx.drawImage(image, x, y, width, height);
  } catch (err) {
    logger.error('APP', 'Error loading image:', err);
    throw new Error(`Failed to load image: ${imagePath}`);
  }
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
      photoUrl, 
      photos = [],
      instagram,
      format = 'story' 
    } = data;

    const canvas = createCanvas(1080, 1920);
    const ctx = canvas.getContext('2d');
    const logoPath = join(process.cwd(), 'public', 'chicks-of-nyc-logo.png');

    if (format === 'story') {
      // Story format
      ctx.fillStyle = '#FFF5EB';
      ctx.fillRect(0, 0, 1080, 1920);

      // Load and draw the logo at the top - centered
      const logo = await loadImage(logoPath);
      const logoHeight = 160;
      const logoWidth = logoHeight * (logo.width / logo.height);
      const logoX = (1080 - logoWidth) / 2;
      ctx.drawImage(logo, logoX, 40, logoWidth, logoHeight);

      // Add Instagram handle and website in top right
      ctx.textAlign = 'right';
      ctx.font = '32px LilitaOne';
      ctx.fillStyle = '#FF4438';
      ctx.fillText('@chicksofnyc', 1040, 80);
      
      ctx.font = '24px LilitaOne';
      ctx.fillStyle = '#8B4513';
      ctx.fillText('chicksofnyc.com', 1040, 120);

      // Restaurant name in primary color
      ctx.font = '64px LilitaOne';
      ctx.fillStyle = '#8B4513';
      ctx.textAlign = 'left';
      ctx.fillText(spotName, 40, 340);

      // Address in text-dark
      ctx.font = '32px LilitaOne';
      ctx.fillStyle = '#5D4037';
      ctx.fillText(address, 40, 400);

      // Overall rating with large display
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#FFFCF5';
      const overallText = `${overallRating.toFixed(1)}/10`;
      ctx.font = '160px LilitaOne';
      const overallMetrics = ctx.measureText(overallText);
      const overallWidth = Math.max(overallMetrics.width + 120, 520);
      roundRect(ctx, 40, 450, overallWidth, 220, 24);
      ctx.fill();
      
      ctx.strokeStyle = '#FF4438';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      ctx.font = '160px LilitaOne';
      ctx.fillStyle = '#8B4513';
      ctx.textAlign = 'left';
      ctx.fillText(overallText, 80, 600);
      
      ctx.font = '40px LilitaOne';
      ctx.fillStyle = '#5D4037';
      ctx.fillText('Overall Rating', 80, 650);

      // Individual ratings with icons
      const ratings = [
        { label: 'Sauce', value: sauceRating, icon: '💧', color: '#FF4438', bgColor: '#FFFCF5' },
        { label: 'Crispy', value: crispynessRating, icon: '🔥', color: '#FF4438', bgColor: '#FFFCF5' },
        { label: 'Meat', value: meatRating, icon: '🍗', color: '#FF4438', bgColor: '#FFFCF5' }
      ];

      const ratingWidth = 310;
      const ratingGap = 25;
      const ratingsY = 750;

      ratings.forEach((rating, index) => {
        const x = 40 + (index * (ratingWidth + ratingGap));
        
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#FFFFFF';
        roundRect(ctx, x, ratingsY, ratingWidth, 100, 16);
        ctx.fill();

        ctx.fillStyle = rating.color;
        ctx.fillRect(x, ratingsY, ratingWidth, 4);
        ctx.restore();

        ctx.font = '32px LilitaOne';
        ctx.fillStyle = '#8B4513';
        ctx.fillText(rating.icon, x + 20, ratingsY + 60);

        ctx.font = '32px LilitaOne';
        ctx.fillStyle = '#8B4513';
        ctx.fillText(rating.label, x + 60, ratingsY + 60);

        ctx.font = '40px LilitaOne';
        ctx.fillStyle = rating.color;
        ctx.textAlign = 'right';
        ctx.fillText(`${rating.value}/10`, x + ratingWidth - 20, ratingsY + 60);
        ctx.textAlign = 'left';
      });

      // Draw photos in a grid
      const gridPhotoSize = 400;
      const photoGap = 20;
      const photosStartY = 900;
      
      const totalWidth = (gridPhotoSize * 2) + photoGap;
      const startX = (1080 - totalWidth) / 2;
      
      await drawGridPhoto(photoUrl, startX, photosStartY, gridPhotoSize, ctx);
      
      const positions = [
        [startX + gridPhotoSize + photoGap, photosStartY],
        [startX, photosStartY + gridPhotoSize + photoGap],
        [startX + gridPhotoSize + photoGap, photosStartY + gridPhotoSize + photoGap]
      ];
      
      for (let i = 0; i < Math.min(3, photos.length); i++) {
        await drawGridPhoto(photos[i], positions[i][0], positions[i][1], gridPhotoSize, ctx);
      }
    } else {
      // Square format (1080x1080)
      canvas.width = 1080;
      canvas.height = 1080;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw main photo at the top
      const mainPhotoHeight = 600;
      await drawImage(ctx, photoUrl, 0, 0, canvas.width, mainPhotoHeight);

      // Add gradient overlay at the bottom of the photo
      const gradient = ctx.createLinearGradient(0, mainPhotoHeight - 100, 0, mainPhotoHeight);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, mainPhotoHeight - 100, canvas.width, 100);

      // Restaurant name and instagram (on top of the photo)
      ctx.font = 'bold 64px LilitaOne';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(spotName, canvas.width / 2, mainPhotoHeight - 80);
      
      if (instagram) {
        ctx.font = '32px LilitaOne';
        ctx.fillText(`@${instagram}`, canvas.width / 2, mainPhotoHeight - 30);
      }

      // Address
      ctx.font = '24px LilitaOne';
      ctx.fillStyle = '#666666';
      ctx.fillText(address, canvas.width / 2, mainPhotoHeight + 30);

      // Overall rating
      ctx.font = 'bold 120px LilitaOne';
      ctx.fillStyle = '#FF5722';
      ctx.textAlign = 'center';
      ctx.fillText(overallRating.toString(), canvas.width / 2, mainPhotoHeight + 180);

      // "OVERALL RATING" text
      ctx.font = '32px LilitaOne';
      ctx.fillStyle = '#666666';
      ctx.fillText('OVERALL RATING', canvas.width / 2, mainPhotoHeight + 240);

      // Individual ratings
      const ratingY = mainPhotoHeight + 340;
      const ratingSpacing = 200;
      
      // Sauce rating
      ctx.font = 'bold 48px LilitaOne';
      ctx.fillStyle = '#FF5722';
      ctx.fillText(sauceRating.toString(), canvas.width / 2 - ratingSpacing, ratingY);
      ctx.font = '24px LilitaOne';
      ctx.fillStyle = '#666666';
      ctx.fillText('SAUCE 💧', canvas.width / 2 - ratingSpacing, ratingY + 40);

      // Crispyness rating
      ctx.font = 'bold 48px LilitaOne';
      ctx.fillStyle = '#FF5722';
      ctx.fillText(crispynessRating.toString(), canvas.width / 2, ratingY);
      ctx.font = '24px LilitaOne';
      ctx.fillStyle = '#666666';
      ctx.fillText('CRISPY 🔥', canvas.width / 2, ratingY + 40);

      // Meat rating
      ctx.font = 'bold 48px LilitaOne';
      ctx.fillStyle = '#FF5722';
      ctx.fillText(meatRating.toString(), canvas.width / 2 + ratingSpacing, ratingY);
      ctx.font = '24px LilitaOne';
      ctx.fillStyle = '#666666';
      ctx.fillText('MEAT 🍗', canvas.width / 2 + ratingSpacing, ratingY + 40);

      // Logo as a badge in top right corner
      const logoSize = 120;
      const padding = 20;
      const logo = await loadImage(logoPath);
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 15;
      ctx.drawImage(logo, canvas.width - logoSize - padding, padding, logoSize, logoSize * (logo.height / logo.width));
      ctx.restore();

      // Add @chicksofnyc handle at the bottom
      ctx.font = '32px LilitaOne';
      ctx.fillStyle = '#FF5722';
      ctx.fillText('@chicksofnyc', canvas.width / 2, canvas.height - 40);
    }

    const buffer = canvas.toBuffer('image/png');
    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    logger.error('APP', 'Error generating share image:', error);
    return new Response(
      error instanceof Error ? error.message : 'Failed to generate share image',
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

// Helper function to draw a photo in the grid
async function drawGridPhoto(
  photo: string,
  x: number,
  y: number,
  size: number,
  ctx: CanvasRenderingContext2D
) {
  logger.info('APP', `Drawing grid photo at x=${x}, y=${y}, size=${size}`);
  
  try {
    const img = await loadImage(photo);
    logger.info('APP', 'Image loaded successfully:', {
      originalWidth: img.width,
      originalHeight: img.height,
      aspectRatio: img.width / img.height
    });
    
    ctx.save();
    logger.info('APP', 'Adding shadow and clipping');
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 15;
    roundRect(ctx, x, y, size, size, 16);
    ctx.clip();
    
    const imgAspect = img.width / img.height;
    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
    
    if (imgAspect > 1) {
      // Landscape
      drawHeight = size;
      drawWidth = size * imgAspect;
      offsetX = -(drawWidth - size) / 2;
      logger.info('APP', 'Landscape image:', { drawWidth, drawHeight, offsetX });
    } else {
      // Portrait
      drawWidth = size;
      drawHeight = size / imgAspect;
      offsetY = -(drawHeight - size) / 2;
      logger.info('APP', 'Portrait image:', { drawWidth, drawHeight, offsetY });
    }
    
    logger.info('APP', 'Drawing image with parameters:', {
      x: x + offsetX,
      y: y + offsetY,
      width: drawWidth,
      height: drawHeight
    });
    
    ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
    ctx.restore();
    logger.info('APP', 'Grid photo drawn successfully');
  } catch (error) {
    logger.error('APP', 'Error in drawGridPhoto:', error);
    throw error;
  }
} 
