'use client';

/** Story-style segments: one per page, tap any to jump. */
export default function ProgressBar({ total, index, onJump }) {
  return (
    <div className="topline">
      <div className="progress" role="tablist" aria-label="Jump to page">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-label={`Page ${i + 1}`}
            aria-selected={i === index}
            className={`seg${i === index ? ' active' : ''}${i < index ? ' done' : ''}`}
            onClick={() => onJump(i)}
          />
        ))}
      </div>
    </div>
  );
}
