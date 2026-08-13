'use client';

const Chevron = ({ up }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={up ? 'm5 15 7-7 7 7' : 'm5 9 7 7 7-7'} />
  </svg>
);

/** Flip controls for anyone not swiping — mouse, trackpad, assistive tech. */
export default function NavButtons({ index, total, onGo }) {
  return (
    <>
      <button
        type="button"
        className="nav prev"
        aria-label="Previous page"
        disabled={index === 0}
        onClick={() => onGo(index - 1)}
      >
        <Chevron up />
      </button>
      <button
        type="button"
        className="nav next"
        aria-label="Next page"
        disabled={index >= total - 1}
        onClick={() => onGo(index + 1)}
      >
        <Chevron />
      </button>
    </>
  );
}
