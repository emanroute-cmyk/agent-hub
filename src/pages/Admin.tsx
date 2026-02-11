import { useState, useEffect } from "react";
import { AGENT_ICONS } from "@/lib/agents";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, Save, X, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const iconOptions = Object.keys(AGENT_ICONS);
const statusOptions = ["online", "offline", "maintenance"] as const;

interface AgentRow {
  id: string;
  name: string;
  description: string | null;
  endpoint: string;
  icon: string;
  status: string;
  category: string | null;
  created_by: string | null;
}

export default function AdminPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignEmail, setAssignEmail] = useState("");
  const { toast } = useToast();
  const { t } = useI18n();
  const { user, hasRole } = useAuth();

  const [form, setForm] = useState({
    name: "",
    description: "",
    endpoint: "",
    icon: "bot",
    category: "",
    status: "online",
  });

  const loadAgents = async () => {
    const { data } = await supabase.from("agents").select("*").order("created_at", { ascending: false });
    setAgents((data as AgentRow[]) || []);
  };

  useEffect(() => { loadAgents(); }, []);

  const resetForm = () => {
    setForm({ name: "", description: "", endpoint: "", icon: "bot", category: "", status: "online" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.endpoint) {
      toast({ title: t("admin.missingFields"), description: t("admin.missingFieldsDesc"), variant: "destructive" });
      return;
    }

    if (editingId) {
      await supabase.from("agents").update({ ...form }).eq("id", editingId);
      toast({ title: t("admin.agentUpdated") });
    } else {
      await supabase.from("agents").insert({ ...form, created_by: user?.id });
      toast({ title: t("admin.agentCreated") });
    }
    resetForm();
    loadAgents();
  };

  const handleEdit = (agent: AgentRow) => {
    setForm({
      name: agent.name,
      description: agent.description || "",
      endpoint: agent.endpoint,
      icon: agent.icon,
      category: agent.category || "",
      status: agent.status,
    });
    setEditingId(agent.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("agents").delete().eq("id", id);
    toast({ title: t("admin.agentDeleted") });
    loadAgents();
  };

  const handleAssign = async () => {
    if (!assigningId || !assignEmail.trim()) return;
    // Look up user by email from profiles
    // We need to find the user_id - since we can't query auth.users, we search by email in a different way
    // For now, use a simple approach with the profiles table
    toast({ title: t("admin.assignmentNote"), description: t("admin.assignmentNoteDesc") });
    setAssigningId(null);
    setAssignEmail("");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("admin.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("admin.subtitle")}</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 hover:shadow-lg"
        >
          <Plus className="h-4 w-4" /> {t("admin.newAgent")}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {editingId ? t("admin.editAgent") : t("admin.createAgent")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("admin.name")}</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40" placeholder={t("admin.namePlaceholder")} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("admin.category")}</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40" placeholder={t("admin.categoryPlaceholder")} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("admin.endpoint")}</label>
              <input value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} className="w-full rounded-xl bg-secondary px-3 py-2.5 text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-primary/40" placeholder={t("admin.endpointPlaceholder")} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("admin.description")}</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 resize-none" placeholder={t("admin.descriptionPlaceholder")} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("admin.icon")}</label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((key) => {
                  const Ic = AGENT_ICONS[key];
                  return (
                    <button key={key} onClick={() => setForm({ ...form, icon: key })} className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${form.icon === key ? "bg-primary text-primary-foreground shadow-lg" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                      <Ic className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("admin.status")}</label>
              <div className="flex gap-2">
                {statusOptions.map((s) => (
                  <button key={s} onClick={() => setForm({ ...form, status: s })} className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all ${form.status === s ? "bg-primary text-primary-foreground shadow-lg" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={handleSave} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 hover:shadow-lg transition-all">
              <Save className="h-4 w-4" /> {editingId ? t("admin.save") : t("admin.create")}
            </button>
            <button onClick={resetForm} className="flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-surface-hover transition-all">
              <X className="h-4 w-4" /> {t("admin.cancel")}
            </button>
          </div>
        </motion.div>
      )}

      {/* Agent List */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("admin.agent")}</th>
              <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">{t("admin.endpoint")}</th>
              <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("admin.status")}</th>
              <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">{t("admin.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => {
              const Ic = AGENT_ICONS[agent.icon] || AGENT_ICONS.bot;
              return (
                <tr key={agent.id} className="border-b border-border/50 last:border-0 hover:bg-surface-hover/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Ic className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <code className="text-xs font-mono text-muted-foreground bg-secondary rounded-md px-2 py-1">{agent.endpoint}</code>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="capitalize text-xs font-mono">{agent.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(agent)} className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      {hasRole("admin") && (
                        <button onClick={() => handleDelete(agent.id)} className="rounded-lg p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {agents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">{t("admin.noAgents")}</div>
        )}
      </div>
    </div>
  );
}
