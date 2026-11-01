/** Big friendly numeral. Re-keyed on every tick so the pop animation replays. */
export function Countdown({ value, shot, total }: { value: number; shot: number; total: number }) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-petal-plum/25" role="status" aria-live="assertive">
      <div className="text-center">
        <div
          key={value}
          className="animate-pop grid h-36 w-36 place-items-center rounded-full bg-white/90 font-display text-[88px] font-extrabold italic leading-none text-petal shadow-soft sm:h-44 sm:w-44 sm:text-[108px]"
        >
          {value}
        </div>
        <p className="mt-4 rounded-full bg-petal-plum/70 px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.05em] text-white">
          Photo {shot} of {total}
        </p>
      </div>
    </div>
  );
}
