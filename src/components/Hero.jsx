import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Pause, Play, RotateCcw } from 'lucide-react';
export default function Hero() {
  const video = useRef(null),
    [playing, setPlaying] = useState(false),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!media.matches) video.current?.play().catch(() => setPlaying(false));
    const change = () => {
      if (media.matches) video.current?.pause();
    };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  return (
    <section className="hero" aria-label="Welcome to AutoBest Motors">
      {!failed && (
        <video
          ref={video}
          className="hero-video"
          playsInline
          autoPlay
          preload="none"
          poster="/media/hero-poster.jpg"
          onError={() => setFailed(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        >
          <source src="/media/hero.mp4" type="video/mp4" />
        </video>
      )}
      <div className="hero-shade" />
      <a className="hero-scroll" href="#collection" aria-label="Explore the collection">
        <ArrowDown size={18} aria-hidden="true" />
      </a>
      <div className="hero-bottom">
        <div className="video-controls">
          <button
            disabled={failed}
            aria-label={playing ? 'Pause film' : 'Play film'}
            onClick={() =>
              playing ? video.current?.pause() : video.current?.play().catch(() => setFailed(true))
            }
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            disabled={failed}
            aria-label="Replay film"
            onClick={() => {
              if (video.current) {
                video.current.currentTime = 0;
                video.current.play().catch(() => setFailed(true));
              }
            }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
