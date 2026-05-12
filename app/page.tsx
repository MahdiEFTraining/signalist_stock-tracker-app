import LandingHeader from "@/components/LandingHeader";
import TickerTape from "@/components/landing/TickerTape";
import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";
import Pillars from "@/components/landing/Pillars";
import HowItWorks from "@/components/landing/HowItWorks";
import Showcase from "@/components/landing/Showcase";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

function Divider() {
    return <div aria-hidden="true" className="section-divider container" />;
}

export default function LandingPage() {
    return (
        <div
            className="relative min-h-screen text-gray-400 overflow-hidden"
            style={{
                background:
                    "radial-gradient(ellipse 100% 80% at 50% 0%, #0d0e16 0%, #050505 70%)",
            }}
        >
            {/* Page-wide ambient aurora — large blurred orbs in brand colours.
                NOT z-indexed below the wrapper background — they sit on TOP of it,
                content sits relatively above them. */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[5%]   right-[-10%] h-[700px] w-[800px] rounded-full bg-yellow-400/[0.12] blur-3xl animate-float-soft" />
                <div className="absolute top-[30%]  left-[-15%]  h-[700px] w-[700px] rounded-full bg-teal-400/[0.10]   blur-3xl animate-float-soft-2" />
                <div className="absolute top-[55%]  right-[5%]   h-[700px] w-[700px] rounded-full bg-purple-500/[0.10] blur-3xl animate-float-soft-3" />
                <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 h-[500px] w-[1100px] rounded-full bg-yellow-500/[0.08] blur-3xl animate-float-soft" />
            </div>

            {/* Film-grain noise across the whole page */}
            <div className="absolute inset-0 pointer-events-none landing-noise" />

            {/* Content sits above the decorative layers */}
            <div className="relative">
                <LandingHeader />
                <TickerTape />

                <main>
                    <Hero />
                    <Divider />
                    <Stats />
                    <Pillars />
                    <Divider />
                    <HowItWorks />
                    <Showcase />
                    <CTA />
                </main>

                <Footer />
            </div>
        </div>
    );
}
