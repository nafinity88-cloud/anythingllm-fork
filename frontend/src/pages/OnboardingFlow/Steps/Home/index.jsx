import paths from "@/utils/paths";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useRedirectToHomeOnOnboardingComplete from "@/hooks/useOnboardingComplete";
import Wordmark from "@/media/logo/bmicorp-wordmark.svg";
import Logo from "@/media/logo/bmicorp.png";

export default function OnboardingHome() {
  const navigate = useNavigate();
  useRedirectToHomeOnOnboardingComplete();
  const { t } = useTranslation();

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden bg-zinc-950 light:bg-slate-50">
      {/* Dark mode background gradient */}
      <div
        className="absolute inset-0 light:hidden"
        style={{
          background:
            "radial-gradient(ellipse 160% 100% at 50% 0%, rgba(181, 132, 58, 0.35) 0%, rgba(91, 62, 31, 0.22) 45%, transparent 90%)",
        }}
      />
      {/* Light mode background gradient */}
      <div
        className="absolute inset-0 hidden light:block"
        style={{
          background:
            "radial-gradient(ellipse 160% 100% at 50% 0%, rgba(236, 212, 166, 0.7) 0%, rgba(248, 236, 211, 0.45) 50%, transparent 90%)",
        }}
      />

      <div className="relative z-10 flex justify-center pt-[58px]">
        <img src={Wordmark} alt="BMICorp AI-Assistant" className="h-[40px] w-auto" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center -mt-8">
        <div className="absolute flex items-center justify-center w-full px-4 md:px-0 md:max-w-[852px] md:w-[56%]">
          <img src={Logo} alt="" className="w-[180px] md:w-[240px] opacity-30" />
        </div>

        <h1 className="relative font-medium text-white light:text-slate-700 text-[64px] md:text-[96px] lg:text-[160px] leading-none tracking-[-0.06em] select-none">
          {t("onboarding.home.welcome")}
        </h1>

        <button
          type="button"
          onClick={() => navigate(paths.onboarding.llmPreference())}
          className="relative border-none z-10 h-[36px] w-[300px] py-2.5 px-5 rounded-lg bg-slate-50 hover:bg-slate-300 font-medium text-sm mt-[42px] text-zinc-900 light:text-white light:bg-slate-900 light:hover:bg-slate-800 text-center flex justify-center items-center transition-colors duration-200"
        >
          {t("onboarding.home.getStarted")}
        </button>
      </div>
    </div>
  );
}
