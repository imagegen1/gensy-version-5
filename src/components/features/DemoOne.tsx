import { Features } from "@/components/ui/features";
import { Rocket, Shield, Palette } from "lucide-react";

const features = [
  {
    id: 1,
    icon: Rocket,
    title: "Imagen 4 Model",
    description:
      "Albino woman in satin clothing, red fur chair, dark blue studio. Disposable camera aesthetic with film grain and editorial flash lighting.",
    image: "/gensy thumb.png",
  },
  {
    id: 2,
    icon: Shield,
    title: "ByteDance Model",
    description:
      "Blooming light on the girl",
    image: "/gensy thumb2.png",
  },
  {
    id: 3,
    icon: Palette,
    title: "Flux Dev Model",
    description:
      "Anime portrait: stern African male, spiky black hair, leather jacket, fiery red stars backdrop with dramatic lighting.",
    image: "/gensy thumb3.png",
  },
];

const DemoOne = () => {
  return (
    <Features
      primaryColor="blue-600"
      progressGradientLight="bg-gradient-to-r from-blue-500 to-blue-600"
      progressGradientDark="bg-gradient-to-r from-blue-400 to-blue-500"
      features={features}
    />
  );
};

export { DemoOne };
