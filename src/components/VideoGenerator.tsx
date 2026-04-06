import { Video, Play } from "lucide-react";
import { TravelData } from "@/types/travel";
import { Button } from "@/components/ui/button";

interface VideoGeneratorProps {
  data: TravelData;
}

const VideoGenerator = ({ data }: VideoGeneratorProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-accent" />
          <h2 className="text-2xl font-display font-semibold">Vídeo Viral</h2>
        </div>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Play className="w-4 h-4 mr-2" />
          Gerar Vídeo
        </Button>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="aspect-[9/16] max-w-[280px] mx-auto rounded-xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, hsl(270 80% 30%), hsl(270 80% 45%))" }}>
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `url(https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="relative h-full flex flex-col justify-end p-6">
            <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Destino</p>
            <h3 className="text-white text-xl font-bold font-display">{data.destino}</h3>
            <p className="text-white/80 text-sm mt-1">{data.hotel}</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-xs text-white/60">a partir de</span>
              <span className="text-lg font-bold text-accent">{data.precoTotal}</span>
            </div>
          </div>
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Vídeo vertical de 15s para Reels/TikTok
          </p>
          <p className="text-xs text-muted-foreground/70">
            Cenas com transições dinâmicas, texto animado e música de fundo
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;
