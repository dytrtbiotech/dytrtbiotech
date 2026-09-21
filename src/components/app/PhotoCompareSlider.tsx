"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PhotoCompareSliderProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  beforeCaption: string;
  afterCaption: string;
};

export default function PhotoCompareSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  beforeCaption,
  afterCaption,
}: PhotoCompareSliderProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [position, setPosition] = useState(50);

  const setFromClientX = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width <= 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, next)));
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      setFromClientX(event.clientX);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [setFromClientX]);

  return (
    <div className="photo-slider-wrap">
      <div
        ref={frameRef}
        className="photo-slider"
        style={{ ["--pos" as string]: `${position}%` }}
        onPointerDown={(event) => {
          draggingRef.current = true;
          frameRef.current?.setPointerCapture(event.pointerId);
          setFromClientX(event.clientX);
        }}
        role="img"
        aria-label={`Porovnání snímků. ${beforeCaption} vlevo, ${afterCaption} vpravo. Přetáhněte linku pro srovnání.`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="photo-slider-img" src={afterSrc} alt={afterAlt} />
        <div className="photo-slider-before-clip" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="photo-slider-img" src={beforeSrc} alt="" />
        </div>

        <div className="photo-slider-divider" aria-hidden="true">
          <span className="photo-slider-handle" />
        </div>

        <span className="photo-slider-badge photo-slider-badge--before">
          První
        </span>
        <span className="photo-slider-badge photo-slider-badge--after">
          Nejnovější
        </span>
      </div>

      <div className="photo-slider-captions">
        <p>
          <span className="photo-compare-label">První</span>
          <span className="photo-compare-date">{beforeCaption}</span>
        </p>
        <p>
          <span className="photo-compare-label">Nejnovější</span>
          <span className="photo-compare-date">{afterCaption}</span>
        </p>
      </div>

      <label className="photo-slider-range-label" htmlFor="photo-compare-range">
        Posun porovnání
      </label>
      <input
        id="photo-compare-range"
        className="photo-slider-range"
        type="range"
        min={0}
        max={100}
        value={Math.round(position)}
        onChange={(event) => setPosition(Number(event.target.value))}
      />
    </div>
  );
}
