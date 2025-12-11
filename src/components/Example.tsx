import React, {useRef, useState, useEffect, useCallback} from 'react';

function easeOutElastic(x: number): number {
  const c4 = (2 * Math.PI) / 3;

  return x === 0
    ? 0
    : x === 1
      ? 1
      : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

const Example = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const squareRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(null);
  const dragStartPos = useRef<{ x: number, y: number } | null>(null)

  const lockedAxis = useRef<'x' | 'y' | null>(null);
  const [offset, setOffset] = useState({x: 0, y: 0});
  const [isDragging, setIsDragging] = useState(false);
  const HEAVINESS = 1;

  const getElasticDistance = (mouseDelta: number, limit: number) => {
    return limit * Math.tanh(mouseDelta / (limit * HEAVINESS));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();

    setIsDragging(true);

    lockedAxis.current = null;
    dragStartPos.current = {x: e.clientX, y: e.clientY};
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    lockedAxis.current = null;
    dragStartPos.current = null;

    const startX = offset.x;
    const startY = offset.y;
    const startTime = performance.now();
    const duration = 1000;

    const animate = (time: number) => {
      let timeFraction = (time - startTime) / duration;
      if (timeFraction > 1) timeFraction = 1;

      const bounce = easeOutElastic(timeFraction);
      const multiplier = 1 - bounce;

      setOffset({
        x: startX * multiplier,
        y: startY * multiplier
      });

      if (timeFraction < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [isDragging, offset]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging || !containerRef.current || !squareRef.current || !dragStartPos.current) return;

    e.preventDefault();

    const parentRect = containerRef.current.getBoundingClientRect();
    const centerX = parentRect.left + parentRect.width / 2;
    const centerY = parentRect.top + parentRect.height / 2;

    const rawDx = e.clientX - centerX;
    const rawDy = e.clientY - centerY;

    const gestureDx = e.clientX - dragStartPos.current.x;
    const gestureDy = e.clientY - dragStartPos.current.y;

    const maxDistX = (parentRect.width - squareRef.current.offsetWidth) / 2;
    const maxDistY = (parentRect.height - squareRef.current.offsetHeight) / 2;

    if (lockedAxis.current === null) {
      if (Math.abs(gestureDx) < 10 && Math.abs(gestureDy) < 10) return;
      if (Math.abs(gestureDx) > Math.abs(gestureDy)) {
        lockedAxis.current = 'x';
      } else {
        lockedAxis.current = 'y';
      }
    }

    let newX = 0;
    let newY = 0;
    if (lockedAxis.current === 'x') {
      newX = getElasticDistance(rawDx, maxDistX);
    } else if (lockedAxis.current === 'y') {
      newY = getElasticDistance(rawDy, maxDistY);
    }
    setOffset({x: newX, y: newY});

  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      if (isDragging) {
        document.body.style.cursor = 'grabbing';

        window.addEventListener('pointermove', handlePointerMove, {passive: false});
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp)
      } else {
        document.body.style.cursor = '';

        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp)
      }
    }
    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  return <main ref={containerRef} className={'main'}>
    <div
      ref={squareRef}
      className={'square'}
      onPointerDown={handlePointerDown}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        willChange: 'transform',
        transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`
      }}
    />
    <div
      className={'dashed-x'}
      style={{opacity: isDragging && lockedAxis.current === 'x' ? 1 : 0.4}}
    />
    <div
      className={'dashed-y'}
      style={{opacity: isDragging && lockedAxis.current === 'y' ? 1 : 0.4}}
    />
  </main>
};

export default Example;