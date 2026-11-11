import { useState } from "react";
import { ExternalLink, FolderKanban, Pencil, Plus, Trash2, X } from "lucide-react";
import { useLearningProgress } from "../context/ProgressContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import PageBackLink from "../components/PageBackLink.jsx";

const emptyProject = { title: "", description: "", url: "" };

function ProjectForm({ initialValue, submitLabel, onSubmit, onCancel }) {
  const { t } = useLanguage();
  const [values, setValues] = useState(initialValue);
  const [error, setError] = useState("");

  function handleChange(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    const title = values.title.trim();
    const description = values.description.trim();
    const url = values.url.trim();

    if (!title || !description) {
      setError(t("projects.nameError"));
      return;
    }

    if (url) {
      try {
        const parsedUrl = new URL(url);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error(t("projects.invalidProtocol"));
        }
      } catch {
        setError(t("projects.urlError"));
        return;
      }
    }

    onSubmit({ title, description, url });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-[10px] font-medium text-slate-300">{t("projects.titleField")}</span>
        <input name="title" value={values.title} onChange={handleChange} maxLength={80} required placeholder={t("projects.titlePlaceholder")} className="w-full rounded-lg border border-white/[0.08] bg-[#0b111c] px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-600 focus:border-sky-300/40" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[10px] font-medium text-slate-300">{t("projects.descriptionField")}</span>
        <textarea name="description" value={values.description} onChange={handleChange} maxLength={500} required rows={3} placeholder={t("projects.descriptionPlaceholder")} className="w-full resize-y rounded-lg border border-white/[0.08] bg-[#0b111c] px-3 py-2.5 text-xs leading-5 text-white outline-none placeholder:text-slate-600 focus:border-sky-300/40" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[10px] font-medium text-slate-300">{t("projects.linkField")}</span>
        <input name="url" value={values.url} onChange={handleChange} type="url" placeholder="https://example.com" className="w-full rounded-lg border border-white/[0.08] bg-[#0b111c] px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-600 focus:border-sky-300/40" />
      </label>
      {error && <p role="alert" className="text-[10px] text-rose-300">{error}</p>}
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-sky-400 px-3.5 py-2.5 text-[10px] font-bold text-slate-950 transition hover:bg-sky-300">
          <Plus size={13} /> {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2.5 text-[10px] font-semibold text-slate-300 hover:bg-white/[0.04]">
            <X size={13} /> {t("projects.cancel")}
          </button>
        )}
      </div>
    </form>
  );
}

export default function ProjectsPage() {
  const { progress, addProject, updateProject, deleteProject } = useLearningProgress();
  const { t } = useLanguage();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const projects = progress.projects;

  return (
    <div>
      <PageBackLink />
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-slate-500">{t("projects.eyebrow")}</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">{t("projects.title")}</h2>
          <p className="mt-2 text-xs text-slate-400">{t("projects.description")}</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingId(null); setFormOpen((open) => !open); }}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-400 px-4 py-2.5 text-[10px] font-bold text-slate-950 transition hover:bg-sky-300"
        >
          {formOpen ? <X size={13} /> : <Plus size={13} />}
          {formOpen ? t("projects.closeForm") : t("projects.add")}
        </button>
      </div>

      {formOpen && (
        <section className="mb-5 rounded-xl border border-sky-300/15 bg-[#101827] p-5">
          <h3 className="mb-4 font-display text-sm font-bold text-white">{t("projects.new")}</h3>
          <ProjectForm
            initialValue={emptyProject}
            submitLabel={t("projects.add")}
            onSubmit={(project) => { addProject(project); setFormOpen(false); }}
          />
        </section>
      )}

      {projects.length === 0 && !formOpen ? (
        <section className="flex min-h-[340px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-[#101827]/60 px-6 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-sky-300/15 bg-sky-300/[0.06] text-sky-300"><FolderKanban size={24} /></span>
          <h3 className="mt-5 font-display text-base font-bold text-white">{t("projects.emptyTitle")}</h3>
          <p className="mt-2 max-w-sm text-[11px] leading-5 text-slate-500">{t("projects.emptyDescription")}</p>
          <button type="button" onClick={() => setFormOpen(true)} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-sky-300/15 bg-sky-300/[0.06] px-3.5 py-2.5 text-[10px] font-semibold text-sky-200 hover:bg-sky-300/[0.12]">
            <Plus size={13} /> {t("projects.addFirst")}
          </button>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article key={project.id} className="rounded-xl border border-white/[0.07] bg-[#101827] p-5">
              {editingId === project.id ? (
                <>
                  <h3 className="mb-4 font-display text-sm font-bold text-white">{t("projects.edit")}</h3>
                  <ProjectForm
                    initialValue={{ title: project.title, description: project.description, url: project.url || "" }}
                    submitLabel={t("projects.save")}
                    onSubmit={(updates) => { updateProject(project.id, updates); setEditingId(null); }}
                    onCancel={() => setEditingId(null)}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400/10 text-sky-300"><FolderKanban size={19} /></span>
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label={t("projects.editProject").replace("{title}", project.title)} onClick={() => { setFormOpen(false); setEditingId(project.id); }} className="rounded-md p-2 text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"><Pencil size={14} /></button>
                      <button
                        type="button"
                        aria-label={t("projects.deleteProject").replace("{title}", project.title)}
                        onClick={() => {
                          if (window.confirm(t("projects.deleteProject").replace("{title}", project.title))) deleteProject(project.id);
                        }}
                        className="rounded-md p-2 text-slate-500 hover:bg-rose-400/[0.08] hover:text-rose-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <h3 className="mt-4 font-display text-sm font-bold text-white">{project.title}</h3>
                  <p className="mt-2 min-h-12 whitespace-pre-wrap text-[11px] leading-5 text-slate-400">{project.description}</p>
                  {project.url ? (
                    <a href={project.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex max-w-full items-center gap-1.5 truncate text-[10px] font-semibold text-sky-300 hover:text-sky-200">
                      <ExternalLink size={12} /> <span className="truncate">{project.url}</span>
                    </a>
                  ) : (
                    <p className="mt-4 text-[10px] text-slate-600">{t("projects.removeLink")}</p>
                  )}
                </>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
