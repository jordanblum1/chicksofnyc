import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { formatNumber } from '../../utils/formatNumber';

export const runtime = 'edge';

// Color palette from globals.css
const colors = {
  primary: '#8B4513',      // Saddle brown
  primaryDark: '#723A0F',
  primaryLight: '#A65D2E',
  secondary: '#FF4438',    // Red
  accent: '#FFA162',       // Orange
  bgWarm: '#FFFCF5',       // Cream background
  textDark: '#5D4037',     // Warm brown for text
  white: '#FFFFFF',
  gray: '#666666',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      spotName,
      address,
      overallRating,
      sauceRating,
      crispynessRating,
      meatRating,
      instagram,
      photos = [],
      format = 'story'
    } = body;

    // Get the host from the request headers to construct absolute URLs
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const logoUrl = `${protocol}://${host}/chicks-of-nyc-logo.png`;

    // Set dimensions based on format
    const dimensions = format === 'story' 
      ? { width: 1080, height: 1920 } // 9:16 for stories
      : { width: 1080, height: 1080 }; // 1:1 for posts

    // Format ratings
    const formattedOverall = formatNumber(overallRating, 'overall');
    const formattedSauce = formatNumber(sauceRating, 'sauce');
    const formattedCrispy = formatNumber(crispynessRating, 'crispy');
    const formattedMeat = formatNumber(meatRating, 'meat');

    // Get rating color
    const getRatingColor = (rating: number) => {
      if (rating >= 8) return '#10B981'; // green
      if (rating >= 6) return colors.accent; // orange
      return colors.secondary; // red
    };

    // Process photos - take exactly 4
    const displayPhotos = (photos || []).slice(0, 4);
    
    // Fill with placeholders if less than 4
    while (displayPhotos.length < 4) {
      displayPhotos.push('');
    }

    // Log for debugging
    console.log('Photos received:', photos?.length || 0);
    console.log('Display photos:', displayPhotos);

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: colors.bgWarm,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
          }}
        >
          {/* Photos Grid Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: format === 'story' ? 'column' : 'row',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '20px',
              paddingBottom: '0',
              height: format === 'story' ? '45%' : '55%',
            }}
          >
            {format === 'story' ? (
              // Story format: 1 large + 3 small photos
              <>
                {/* Large hero photo */}
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    height: '60%',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    backgroundColor: displayPhotos[0] ? 'transparent' : '#f0f0f0',
                  }}
                >
                  {displayPhotos[0] && (
                    <img
                      src={displayPhotos[0]}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                </div>
                
                {/* 3 smaller photos */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    height: '38%',
                    marginTop: '8px',
                  }}
                >
                  {[1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flex: 1,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                        backgroundColor: displayPhotos[idx] ? 'transparent' : '#f0f0f0',
                      }}
                    >
                      {displayPhotos[idx] && (
                        <img
                          src={displayPhotos[idx]}
                          alt=""
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // Square format: 2x2 grid with 4 photos
              [0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    width: '516px',
                    height: '283px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                    backgroundColor: displayPhotos[idx] ? 'transparent' : '#f0f0f0',
                  }}
                >
                  {displayPhotos[idx] && (
                    <img
                      src={displayPhotos[idx]}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Spot Info Section - INCREASED SIZES */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: format === 'story' ? '30px 25px 20px' : '20px',
              paddingBottom: '10px',
            }}
          >
            <h1
              style={{
                display: 'block',
                fontSize: format === 'story' ? '68px' : '56px', // Increased from 52/42
                fontWeight: 'bold',
                color: colors.primary,
                margin: 0,
                lineHeight: 1.1,
                letterSpacing: '-1px',
              }}
            >
              {spotName}
            </h1>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '8px',
              }}
            >
              <p
                style={{
                  display: 'block',
                  fontSize: format === 'story' ? '30px' : '24px', // Increased from 22/18
                  color: colors.gray,
                  margin: 0,
                }}
              >
                📍 {address}
              </p>
            </div>
            {instagram && (
              <p
                style={{
                  fontSize: format === 'story' ? '28px' : '22px', // Increased from 20/16
                  color: colors.accent,
                  margin: '6px 0 0 0',
                  display: 'flex',
                }}
              >
                @{instagram.replace('@', '')}
              </p>
            )}
          </div>

          {/* Ratings Card with Glass Effect - INCREASED SIZES */}
          <div
            style={{
              display: 'flex',
              margin: format === 'story' ? '20px 25px' : '0 20px 20px',
              padding: format === 'story' ? '28px' : '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              border: `1px solid rgba(139, 69, 19, 0.1)`,
              boxShadow: '0 8px 32px rgba(139, 69, 19, 0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                width: '100%',
                gap: format === 'story' ? '20px' : '16px',
                alignItems: 'center',
              }}
            >
              {/* Overall Score - Larger */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: '1.5',
                  borderRight: `1px solid rgba(139, 69, 19, 0.1)`,
                  paddingRight: format === 'story' ? '20px' : '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize: format === 'story' ? '18px' : '16px', // Increased from 14/12
                    color: colors.gray,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '4px',
                  }}
                >
                  Overall
                </div>
                <div
                  style={{
                    display: 'flex',
                    fontSize: format === 'story' ? '56px' : '48px', // Increased from 42/36
                    fontWeight: 'bold',
                    color: getRatingColor(Number(overallRating)),
                    lineHeight: 1,
                  }}
                >
                  {formattedOverall}
                </div>
                <div
                  style={{
                    display: 'flex',
                    fontSize: format === 'story' ? '18px' : '16px', // Increased from 14/12
                    color: colors.gray,
                    marginTop: '2px',
                  }}
                >
                  /10
                </div>
              </div>

              {/* Individual Ratings - INCREASED SIZES */}
              <div
                style={{
                  display: 'flex',
                  flex: 2,
                  justifyContent: 'space-around',
                }}
              >
                {[
                  { label: 'Sauce', value: formattedSauce, emoji: '🌶️' },
                  { label: 'Crispy', value: formattedCrispy, emoji: '🔥' },
                  { label: 'Meat', value: formattedMeat, emoji: '🍖' },
                ].map((rating) => (
                  <div
                    key={rating.label}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        fontSize: format === 'story' ? '32px' : '28px', // Increased from 24/20
                        marginBottom: '4px',
                      }}
                    >
                      {rating.emoji}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        fontSize: format === 'story' ? '36px' : '32px', // Increased from 28/24
                        fontWeight: 'bold',
                        color: colors.primaryDark,
                      }}
                    >
                      {rating.value}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        fontSize: format === 'story' ? '16px' : '14px', // Increased from 12/10
                        color: colors.gray,
                      }}
                    >
                      {rating.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Spacer to push footer to bottom */}
          <div style={{ display: 'flex', flex: 1 }} />

          {/* Footer with Logo - INCREASED SIZES */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: format === 'story' ? '20px 25px 30px' : '15px 20px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <img
                src={logoUrl}
                alt=""
                style={{
                  width: format === 'story' ? '70px' : '60px', // Increased from 50/40
                  height: format === 'story' ? '70px' : '60px',
                  objectFit: 'contain',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize: format === 'story' ? '24px' : '20px', // Increased from 18/16
                    fontWeight: 'bold',
                    color: colors.primary,
                    letterSpacing: '-0.5px',
                  }}
                >
                  CHICKS OF NYC
                </div>
                <div
                  style={{
                    display: 'flex',
                    fontSize: format === 'story' ? '18px' : '16px', // Increased from 14/12
                    color: colors.gray,
                    marginTop: '-2px',
                  }}
                >
                  chicksofnyc.com
                </div>
              </div>
            </div>
            
            {/* Small wing emoji decoration */}
            <div
              style={{
                display: 'flex',
                fontSize: format === 'story' ? '32px' : '28px', // Increased from 24/20
                opacity: 0.5,
              }}
            >
              🍗
            </div>
          </div>
        </div>
      ),
      {
        ...dimensions,
      }
    );
  } catch (error) {
    console.error('Error generating share image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
