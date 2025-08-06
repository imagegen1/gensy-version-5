import { BeamsBackground } from "@/components/ui/beams-background";

export function BeamsBackgroundDemo() {
  return (
    <BeamsBackground className="min-h-screen" intensity="strong">
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-6 px-4 text-center">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-semibold text-white tracking-tighter">
            Beams
            <br />
            Background
          </h1>
          <p className="text-lg md:text-2xl lg:text-3xl text-white/70 tracking-tighter">
            For your pleasure
          </p>
          <div className="mt-8 flex gap-4">
            <div className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <span className="text-white/80">Animated Gradients</span>
            </div>
            <div className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <span className="text-white/80">Dark Theme</span>
            </div>
            <div className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <span className="text-white/80">Customizable</span>
            </div>
          </div>
        </div>
      </div>
    </BeamsBackground>
  );
}
