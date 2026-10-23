import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Pause, Play, RotateCcw } from 'lucide-react';
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
          muted
          playsInline
          preload="auto"
          poster="/media/porsche.jpg"
          onError={() => setFailed(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        >
          <source src="/media/hero.mp4" type="video/mp4" />
        </video>
      )}
      <div className="hero-shade" />
      <div className="hero-topline">
        <span>
          <i /> THE AUTOBEST COLLECTION
        </span>
        <span>EXCEPTIONAL CARS. PERSONAL SERVICE.</span>
      </div>
      <div className="hero-copy">
        <p className="eyebrow">FOR THE LOVE OF THE DRIVE</p>
        <h1>
          Your next chapter.
          <br />
          <em>Extraordinary.</em>
        </h1>
        <p>
          Distinctive cars. Considered choices.
          <br />
          Find the one that moves you.
        </p>
        <a className="button primary" href="#collection">
          Explore the collection <ArrowUpRight size={18} />
        </a>
      </div>
      <div className="hero-bottom">
        <a href="#collection">
          <ArrowDown size={16} /> SCROLL TO DISCOVER
        </a>
        <div className="video-controls">
          <span>THE AUTOBEST FILM</span>
          <button
            aria-label={playing ? 'Pause film' : 'Play film'}
            onClick={() =>
              playing ? video.current?.pause() : video.current?.play().catch(() => setFailed(true))
            }
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
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
