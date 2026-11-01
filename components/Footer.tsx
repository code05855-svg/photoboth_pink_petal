export function Footer() {
  return (
    <footer className="shell pb-8 pt-12">
      <div className="flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.04em] text-petal-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Made with love &amp; a little pink magic</p>
        <p className="font-medium">Pink Petal Photobooth @IQO &nbsp;•&nbsp; {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
