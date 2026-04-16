import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import HighlightSection from "@/components/home/HighlightSection";
import AmenitiesSection from "@/components/home/AmenitiesSection";
import DiferenciaisSection from "@/components/home/DiferenciaisSection";
import HomeSectionsDisplay from "@/components/home/HomeSectionsDisplay";
import FAQSection from "@/components/home/FAQSection";
import CTASection from "@/components/home/CTASection";
import ReviewSection from "@/components/home/ReviewSection";
import WelcomePopup from "@/components/WelcomePopup";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <HighlightSection />
      <AmenitiesSection />
      <DiferenciaisSection />
      <HomeSectionsDisplay />
      <FAQSection />
      <CTASection />
      <ReviewSection />
      <WelcomePopup />
    </Layout>
  );
};

export default Index;
