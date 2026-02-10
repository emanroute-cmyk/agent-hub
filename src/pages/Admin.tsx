import { useState } from "react";
import { MOCK_AGENTS, Agent, AGENT_ICONS } from "@/lib/agents";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, Save, X, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const iconOptions = Object.keys(AGENT_ICONS);
const statusOptions = ["online", "offline", "maintenance"] as const;

export default function AdminPage() {
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    description: "",
    endpoint: "",
    icon: "bot",
    category: "",
    status: "online" as Agent["status"],
  });

  const resetForm = () => {
    setForm({ name: "", description: "", endpoint: "", icon: "bot", category: "", status: "online" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.name || !form.endpoint) {
      toast({ title: "Missing fields", description: "Name and endpoint are required.", variant: "destructive" });
      return;
    }

    if (editingId) {
      setAgents((prev) => prev.map((a) => (a.id === editingId ? { ...a, ...form } : a)));
      toast({ title: "Agent updated" });
    } else {
      const newAgent: Agent = {
        id: Date.now().toString(),
        ...form,
        assignedUsers: [],
      };
      setAgents((prev) => [...prev, newAgent]);
      toast({ title: "Agent created" });
    }
    resetForm();
  };

  const handleEdit = (agent: Agent) => {
    setForm({
      name: agent.name,
      description: agent.description,
      endpoint: agent.endpoint,
      icon: agent.icon,
      category: agent.category,
      status: agent.status,
    });
    setEditingId(agent.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Agent deleted" });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage agents, endpoints, and access control</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New Agent
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="glass rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {editingId ? "Edit Agent" : "Create New Agent"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Agent name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="e.g. Analytics"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Endpoint URL</label>
              <input
                value={form.endpoint}
                onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="https://api.example.com/agents/..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                placeholder="What does this agent do?"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Icon</label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((key) => {
                  const Ic = AGENT_ICONS[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setForm({ ...form, icon: key })}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                        form.icon === key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Ic className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</label>
              <div className="flex gap-2">
                {statusOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setForm({ ...form, status: s })}
                    className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${
                      form.status === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Save className="h-4 w-4" /> {editingId ? "Update" : "Create"}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-surface-hover"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Agent List */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-6 py-3 text-xs font-medium text-muted-foreground">Agent</th>
              <th className="px-6 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Endpoint</th>
              <th className="px-6 py-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => {
              const Ic = AGENT_ICONS[agent.icon] || AGENT_ICONS.bot;
              return (
                <tr key={agent.id} className="border-b border-border/50 last:border-0 hover:bg-surface-hover/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Ic className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <code className="text-xs font-mono text-muted-foreground">{agent.endpoint}</code>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="capitalize text-xs font-mono">{agent.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(agent)}
                        className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="rounded-lg p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
