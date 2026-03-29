import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import HighlightSection from "@/components/home/HighlightSection";
import PromotionsSection from "@/components/home/PromotionsSection";
import CTASection from "@/components/home/CTASection";
import WelcomePopup from "@/components/WelcomePopup";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <HighlightSection />
      <PromotionsSection />
      <CTASection />
      <WelcomePopup />
    </Layout>
  );
};

export default Index;
