import { useTranslation } from "react-i18next";

/** Returns the BMI Corp assistant's fixed Indonesian greeting. */
export default function useGreeting() {
  useTranslation();
  return "Assalamualaikum, apa yang bisa Bimo bantu hari ini?";
}
