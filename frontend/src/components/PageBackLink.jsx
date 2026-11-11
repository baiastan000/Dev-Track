import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function PageBackLink({ to = "/dashboard" }) {
  const { t } = useLanguage();

  return (
    <Link
      to={to}
      className="mb-5 inline-flex items-center gap-2 text-[11px] font-medium text-slate-400 transition hover:text-white"
    >
      <ArrowLeft size={14} />
      {t("common.back")}
    </Link>
  );
}
