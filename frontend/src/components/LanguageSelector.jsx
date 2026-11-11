import { useLanguage } from "../context/LanguageContext.jsx";

export default function LanguageSelector({
  className = "",
  compact = false,
  id = "interface-language",
}) {
  const { language, setLanguage, t } = useLanguage();
  const options = compact
    ? [["kg", "KG"], ["ru", "RU"], ["en", "EN"]]
    : [["kg", t("language.kg")], ["ru", t("language.ru")], ["en", t("language.en")]];

  return (
    <>
      <label className="sr-only" htmlFor={id}>
        {t("language.label")}
      </label>
      <select
        id={id}
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className={`rounded-lg border border-white/[0.08] bg-[#101827] px-2 py-2 text-[10px] font-semibold text-slate-300 outline-none focus:border-sky-300/40 ${className}`}
      >
        {options.map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </>
  );
}
