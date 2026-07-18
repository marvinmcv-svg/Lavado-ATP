"use client";
// Module 4.9 — Staff: list with role badges, active toggle, role change dropdown, invite form.
import * as React from "react";
import { Shield, UserPlus, RefreshCw, Mail } from "lucide-react";
import { useLang, t } from "@/lib/i18n";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { adminFetch, LoadingBlock, EmptyState, RoleBadge, Spinner } from "./_shared";
import type { StaffMember, StaffRole } from "@/lib/types";

interface StaffResponse { staff: StaffMember[] }

const ROLES: StaffRole[] = ["owner", "manager", "crew"];

export function Staff() {
  const lang = useLang((s) => s.lang);
  const [staff, setStaff] = React.useState<StaffMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<StaffRole>("crew");
  const [inviting, setInviting] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<StaffResponse>("/api/admin/staff");
      setStaff(res.staff);
    } catch (e) {
      toast.error(lang === "en" ? "Failed to load staff" : "Error al cargar personal");
      void e;
    } finally {
      setLoading(false);
    }
  }, [lang]);

  React.useEffect(() => { void reload(); }, [reload]);

  const updateMember = async (id: string, patch: Partial<StaffMember>, msg?: string) => {
    setStaff((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    try {
      await adminFetch(`/api/admin/staff/${id}`, { method: "PUT", body: JSON.stringify(patch) });
      if (msg) toast.success(msg);
    } catch {
      toast.error(lang === "en" ? "Update failed" : "Error al actualizar");
      void reload();
    }
  };

  const invite = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error(lang === "en" ? "Name and email required" : "Nombre y email requeridos");
      return;
    }
    setInviting(true);
    try {
      const created = await adminFetch<StaffMember>("/api/admin/staff", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), role }),
      });
      setStaff((prev) => [...prev, created]);
      toast.success(lang === "en" ? "Staff member invited" : "Personal invitado");
      setName(""); setEmail(""); setRole("crew");
    } catch (e) {
      toast.error(lang === "en" ? "Invite failed" : "Error al invitar");
      void e;
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t(lang, "admin_staff")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === "en" ? "Manage team members and roles." : "Gestiona equipo y roles."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void reload()}><RefreshCw className="size-4" />{lang === "en" ? "Refresh" : "Actualizar"}</Button>
      </div>

      {/* Invite form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><UserPlus className="size-4 text-primary" />{lang === "en" ? "Invite team member" : "Invitar miembro"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>{lang === "en" ? "Name" : "Nombre"}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@lavadoatp.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{lang === "en" ? "Role" : "Rol"}</Label>
              <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{roleLabel(r, lang)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => void invite()} disabled={inviting} className="mt-3">
            {inviting ? <Spinner className="mr-2" /> : <UserPlus className="size-4" />}
            {lang === "en" ? "Send invite" : "Enviar invitación"}
          </Button>
        </CardContent>
      </Card>

      {/* Staff list */}
      {loading ? (
        <Card><CardContent><LoadingBlock rows={4} /></CardContent></Card>
      ) : staff.length === 0 ? (
        <Card><CardContent><EmptyState title={lang === "en" ? "No staff yet" : "Sin personal"} /></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {staff.map((m) => (
                <li key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Shield className="size-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{m.name}</span>
                      <RoleBadge role={m.role} lang={lang} />
                      {!m.active ? <span className="text-[10px] text-muted-foreground">({lang === "en" ? "inactive" : "inactivo"})</span> : null}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate"><Mail className="size-3" />{m.email}</p>
                  </div>
                  <Separator orientation="vertical" className="hidden sm:block h-8" />
                  <div className="flex items-center gap-2">
                    <Select value={m.role} onValueChange={(v) => void updateMember(m.id, { role: v as StaffRole }, lang === "en" ? "Role updated" : "Rol actualizado")}>
                      <SelectTrigger className="h-8 w-32" size="sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{roleLabel(r, lang)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Switch
                      checked={m.active}
                      onCheckedChange={(v) => void updateMember(m.id, { active: v }, v ? (lang === "en" ? "Activated" : "Activado") : (lang === "en" ? "Deactivated" : "Desactivado"))}
                      aria-label="active"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function roleLabel(role: StaffRole, lang: "es" | "en"): string {
  if (role === "owner") return lang === "en" ? "Owner" : "Propietario";
  if (role === "manager") return lang === "en" ? "Manager" : "Gerente";
  return lang === "en" ? "Crew" : "Equipo";
}
