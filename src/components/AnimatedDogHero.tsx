import React from "react";
import mascotVideo from "@/assets/ezwhelp-mascot-video.mp4";
import ezwhelpLogo from "@/assets/ezwhelp-logo.png";

const AnimatedDogHero: React.FC = () => {
  return (
    <div className="w-full mb-3 md:mb-6 relative">
      <div className="max-w-[95%] sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto relative">
        <div
          className="overflow-hidden relative rounded-xl md:rounded-2xl"
          style={{
            background: '#F5F0E8',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <video
            src={mascotVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto mix-blend-multiply"
            style={{ background: 'transparent' }}
            draggable={false}
          />
          {/* Watermark — top-left corner */}
          <a href="https://www.ezwhelp.com/" target="_blank" rel="noopener noreferrer" className="absolute top-3 left-3 md:top-5 md:left-5">
            <img
              src={ezwhelpLogo}
              alt="EZWhelp"
              className="h-14 md:h-24 object-contain select-none"
              style={{
                opacity: 0.5,
                filter: 'brightness(1.1) drop-shadow(0 2px 6px rgba(0,0,0,0.1))',
              }}
              draggable={false}
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default AnimatedDogHero;
