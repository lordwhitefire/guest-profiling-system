"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import {
  Activity, AlertCircle, ArrowRight, Bell, Building2, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Database, Download, Eye, FileClock, FileText, Filter, Home, LayoutDashboard, LockKeyhole, LogOut, Menu, MoreHorizontal, Plus, RefreshCw, Search, Settings, ShieldCheck, SlidersHorizontal, Sparkles, Users, UserRound, UserSearch, X, XCircle, Zap, ClipboardList, History, PlugZap, KeyRound, Mail, Phone, CalendarCheck, Save, Pencil, RotateCcw, Info, Loader2
} from "lucide-react";
import "./workspace.css";
import { useGuestSearch, useGuestDirectory, useGuest, useGuestCount, useStats, useAuditLogs, useSyncStatus, useDataRequests, useUsers, useTenants, useSettings, useReservations, useHealth } from "@/lib/workspace/hooks";
import type { WorkspaceGuest } from "@/lib/workspace/adapters";
import type { AuditLog } from "@gps/shared";
import { api, ApiError } from "@/lib/api-client";

type Screen =
  | "error" | "processing" | "settings" | "hotel-settings" | "registration"
  | "pms-sync" | "data-requests" | "audit-logs" | "users" | "tenants"
  | "directory" | "analytics" | "visit-history" | "guest-profile"
  | "guest-search" | "dashboard";

const NAV: { label: string; icon: any; screen: string; section?: boolean }[] = [
  { label: "Overview", icon: LayoutDashboard, screen: "dashboard" },
  { label: "Guest Search", icon: UserSearch, screen: "guest-search" },
  { label: "Guest Directory", icon: Users, screen: "directory" },
  { label: "Guest History", icon: History, screen: "visit-history" },
  { label: "Registration", icon: ClipboardList, screen: "registration" },
  { label: "Administration", icon: ShieldCheck, screen: "analytics", section: true },
  { label: "PMS Integration", icon: PlugZap, screen: "pms-sync" },
  { label: "Tenants", icon: Building2, screen: "tenants" },
  { label: "Users & Roles", icon: UserRound, screen: "users" },
  { label: "Data Requests", icon: FileText, screen: "data-requests" },
  { label: "Audit Logs", icon: FileClock, screen: "audit-logs" },
  { label: "Settings", icon: Settings, screen: "settings" },
] as const;

// NOTE: the GUESTS array below is a FALLBACK for when the live API is
// unreachable (e.g., during development without a logged-in session, or
// when the seeding script hasn't been run yet). When the API responds, the
// hooks in @/lib/workspace/hooks populate the same shape with real data and
// the GUESTS array is not used.
const GUESTS = [
  { name: "Adebola Kamal", initials: "AK", email: "adebola.kamal@email.com", phone: "+234 803 456 7890", visits: 5, last: "11 Nov 2026", hotel: "Grand Vista Hotel", status: "Returning", room: "305" },
  { name: "Sarah Kamal", initials: "SK", email: "sarah.kamal@email.com", phone: "+234 812 345 6789", visits: 3, last: "08 Nov 2026", hotel: "Grand Vista Hotel", status: "VIP", room: "412" },
  { name: "Michael Johnson", initials: "MJ", email: "m.johnson@email.com", phone: "+234 701 222 9011", visits: 8, last: "05 Nov 2026", hotel: "Lakeside Suites", status: "Returning", room: "208" },
  { name: "Fatima Bello", initials: "FB", email: "fatima.bello@email.com", phone: "+234 809 765 4321", visits: 2, last: "02 Nov 2026", hotel: "Grand Vista Hotel", status: "New", room: "117" },
  { name: "David Okafor", initials: "DO", email: "david.okafor@email.com", phone: "+234 806 111 2233", visits: 4, last: "29 Oct 2026", hotel: "Ocean Pearl Hotel", status: "Returning", room: "501" },
  { name: "Grace Williams", initials: "GW", email: "grace.w@email.com", phone: "+234 814 987 6543", visits: 6, last: "25 Oct 2026", hotel: "Grand Vista Hotel", status: "VIP", room: "220" },
];

// Type alias so the rest of the file can refer to it cleanly.
// WorkspaceGuest (from @/lib/workspace/adapters) is structurally compatible
// (it has all the same fields plus a couple of extras), so the components
// can accept either shape.
type GuestLike = typeof GUESTS[number] | WorkspaceGuest;

const TITLES: Record<Screen, string> = {
  error: "Guest Search", processing: "Guest Search", settings: "System Settings",
  "hotel-settings": "System Settings", registration: "Guest Registration",
  "pms-sync": "PMS Connection & Synchronisation", "data-requests": "Data Requests",
  "audit-logs": "Audit Logs", users: "User & Roles Management",
  tenants: "Tenant / Hotel Management", directory: "Guest Directory",
  analytics: "Administrator Dashboard", "visit-history": "Guest Visit History",
  "guest-profile": "Guest Profile", "guest-search": "Guest Search", dashboard: "Dashboard",
};

export function WorkspaceApp({ initialScreen }: { initialScreen: string }) {
  const screen = (initialScreen in TITLES ? initialScreen : "dashboard") as Screen;
  const [query, setQuery] = useState("");
  const [globalQuery, setGlobalQuery] = useState("");
  // The guest the receptionist actually clicked. Keeping the object (and its
  // guestId) avoids mapping a search-result index onto a different directory
  // list, which used to open the wrong profile.
  const [selectedGuestObj, setSelectedGuestObj] = useState<GuestLike | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [modal, setModal] = useState("");
  const [toast, setToast] = useState("");
  const [tab, setTab] = useState("Overview");
  const [filter, setFilter] = useState("All");
  const [hotel, setHotel] = useState("Grand Vista Hotel");
  const [page, setPage] = useState(1);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    "Email notifications": true, "Auto sync": true, "Multi-factor authentication": false,
    "Guest profile matching": true, "Data retention": true,
  });
  const [form, setForm] = useState({ name: "", email: "", phone: "", room: "" });

  // ── Live data hooks ───────────────────────────────────────────────────────
  // These hit the real /api/guests endpoints. When the API is unreachable
  // (no logged-in session, dev without seeded DB), the hooks set `error`
  // and the components below fall back to the GUESTS mock array so the UI
  // still renders. A small "demo data" banner is shown when falling back.
  //
  // For guest-search we use the live-search hook (debounced, min 2 chars).
  // For directory we use the paginated hook.
  // For guest-profile / visit-history we use useGuest(guestId) — but the
  // search/directory screens already have full Guest objects in hand, so
  // we don't need a second fetch; we pass the WorkspaceGuest down directly.
  const searchHook = useGuestSearch(query);
  const directoryHook = useGuestDirectory(page, 20);
  const countHook = useGuestCount();
  const statsHook = useStats();
  const auditLogsHook = useAuditLogs(1, 20);
  const syncStatusHook = useSyncStatus();
  const dataRequestsHook = useDataRequests(1, 20);
  const usersHook = useUsers();
  const tenantsHook = useTenants();
  const settingsHook = useSettings();
  const healthHook = useHealth();

  // Reflect the tenant's saved settings in the toggles. The toggles stay
  // local while editing; saving writes them back below.
  useEffect(() => {
    const saved = settingsHook.settings;
    if (!saved) return;
    setToggles((current) => ({
      ...current,
      "Email notifications": saved.emailNotifications,
      "Auto sync": saved.autoSync,
      "Multi-factor authentication": saved.multiFactorAuth,
      "Guest profile matching": saved.guestProfileMatching,
    }));
  }, [settingsHook.settings]);

  // For the search screen: if the user has typed ≥2 chars, use the live
  // search results; otherwise show the demo list until they type (with a
  // visible demo-data banner — never silently).
  const isSearching = query.trim().length >= 2;
  const searchResults: GuestLike[] = isSearching ? searchHook.guests : GUESTS;
  const searchUsingDemoData = !isSearching || searchHook.error !== null;
  const searchLoading = isSearching && searchHook.loading;
  const searchError = isSearching ? searchHook.error : null;

  // For the directory: prefer live data; fall back to mock on error.
  const directoryGuests: GuestLike[] = directoryHook.guests.length > 0 || !directoryHook.error
    ? directoryHook.guests
    : GUESTS;
  const directoryTotal = directoryHook.guests.length > 0 || !directoryHook.error
    ? directoryHook.total
    : GUESTS.length;

  // For dashboard counts: prefer live count; fall back to mock.
  // Dashboard counts: prefer real /api/stats; fall back to useGuestCount
  // (which fetches /api/guests?page=1&limit=1 and reads metadata.total);
  // final fallback is the mock count (only if BOTH fail).
  const realStats = statsHook.stats;
  const dashboardTotal = realStats?.totalGuests ?? (countHook.error ? 12480 : countHook.total);
  const dashboardVip = realStats?.totalVip ?? 0;
  const dashboardReturning = realStats?.totalReturning ?? 0;
  const dashboardNew = realStats?.totalNew ?? 0;
  const dashboardThisMonth = realStats?.totalThisMonth ?? 0;
  const dashboardLastSync = realStats?.lastSyncAt ?? null;
  const dashboardAudit24h = realStats?.auditEvents24h ?? 0;
  const dashboardUsingDemoData = !realStats && !!countHook.error;

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };

  const saveSettings = async () => {
    await settingsHook.update({
      emailNotifications: toggles["Email notifications"] ?? true,
      autoSync: toggles["Auto sync"] ?? true,
      multiFactorAuth: toggles["Multi-factor authentication"] ?? false,
      guestProfileMatching: toggles["Guest profile matching"] ?? true,
    });
  };

  // For the search/directory filter dropdown. The mock GUESTS use "VIP",
  // "Returning", "New" — the WorkspaceGuest adapter uses the same labels.
  const filteredGuests = useMemo(() => {
    const source: GuestLike[] = (screen === "directory" ? directoryGuests : searchResults) as GuestLike[];
    const q = query.toLowerCase();
    return source.filter((g) => {
      // The live search endpoint already matched the text query; re-filtering
      // it here could drop valid matches (e.g. phone formatting).
      const matches = screen === "guest-search"
        ? true
        : !q || `${g.name} ${g.email} ${g.phone} ${g.hotel}`.toLowerCase().includes(q);
      return matches && (filter === "All" || g.status === filter);
    });
  }, [query, filter, screen, directoryGuests, searchResults]);

  const title = TITLES[screen];
  const activeNav = screen === "analytics" ? "analytics" : screen;

  // For the "current guest" (used by guest-profile, visit-history, modal):
  // prefer the guest the receptionist clicked, then the id saved across a
  // route change, then the index fallback.
  const liveGuestList: GuestLike[] = directoryGuests.length > 0 ? directoryGuests : GUESTS;
  const currentGuest: GuestLike =
    selectedGuestObj
    ?? (selectedGuestId
      ? liveGuestList.find((g) => "guestId" in g && g.guestId === selectedGuestId)
      : undefined)
    ?? liveGuestList[0]
    ?? GUESTS[0]!;

  useEffect(() => {
    const storedGuestId = window.sessionStorage.getItem("gps-selected-guest-id");
    if (storedGuestId) setSelectedGuestId(storedGuestId);
  }, []);

  const selectGuest = (g: GuestLike) => {
    setSelectedGuestObj(g);
    if ("guestId" in g) {
      setSelectedGuestId(g.guestId);
      window.sessionStorage.setItem("gps-selected-guest-id", g.guestId);
    }
    setModal("guest-detail");
  };

  if (screen === "registration") {
    return <div className="gps-registration-screen">
      <Registration form={form} setForm={setForm} onAction={notify} tenantName={tenantsHook.tenants[0]?.name ?? "—"} matches={liveGuestList}/>
      {toast && <div className="gps-toast"><CheckCircle2 size={17}/>{toast}<button onClick={() => setToast("")}><X size={14}/></button></div>}
    </div>;
  }

  return (
    <div className="gps-app">
      <aside className={`gps-sidebar ${showMobileNav ? "gps-sidebar-open" : ""}`}>
        <Link href="/workspace/dashboard" className="gps-brand">
          <span className="gps-brand-mark"><span /></span>
          <span><b>Guest Profiling</b><small>System</small></span>
          <button className="gps-sidebar-close" onClick={(e) => { e.preventDefault(); setShowMobileNav(false); }} aria-label="Close menu"><X size={17}/></button>
        </Link>
        <div className="gps-nav-label">WORKSPACE</div>
        <nav className="gps-nav">
          {NAV.map((item) => {
            const Icon = item.icon;
            return <div key={item.screen}>
              {item.section && <div className="gps-nav-label gps-nav-section">{item.label}</div>}
              <Link href={`/workspace/${item.screen}`} className={`gps-nav-item ${activeNav === item.screen ? "active" : ""}`}>
                <Icon size={16}/><span>{item.label}</span>
              </Link>
            </div>;
          })}
        </nav>
        <div className="gps-sidebar-bottom">
          <div className="gps-hotel-badge"><Building2 size={17}/><span><b>Grand Vista Hotel</b><small>Hotel workspace</small></span><ChevronDown size={14}/></div>
          <div className="gps-sidebar-user"><div className="gps-avatar gps-avatar-small">AO</div><span><b>Admin Operator</b><small>Administrator</small></span><MoreHorizontal size={17}/></div>
        </div>
      </aside>

      <main className="gps-main">
        <header className="gps-topbar">
          <button className="gps-mobile-menu" onClick={() => setShowMobileNav(!showMobileNav)} aria-label="Toggle navigation"><Menu/></button>
          <div className="gps-global-search"><Search size={16}/><input value={globalQuery} onChange={(e) => setGlobalQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (setQuery(globalQuery), window.location.assign("/workspace/guest-search"))} placeholder="Search guests, properties, users..." /><kbd>⌘ K</kbd></div>
          <div className="gps-top-actions">
            <span className="gps-sync-indicator"><i/> Sync Online</span>
            <button className="gps-top-button" onClick={() => notify("Report export is being prepared.")}><Download size={15}/> <span>Download Report</span></button>
            <div className="gps-notification-wrap">
              <button className="gps-icon-button" onClick={() => setShowNotifications(!showNotifications)} aria-label="Notifications"><Bell size={17}/><i/></button>
              {showNotifications && <div className="gps-popover"><b>Notifications</b><p><CheckCircle2/> PMS sync completed successfully.</p><p><Info/> 2 guest profiles need review.</p><button onClick={() => setShowNotifications(false)}>Close</button></div>}
            </div>
            <button className="gps-profile-button" onClick={() => setModal("account")}><span className="gps-avatar">AO</span><ChevronDown size={14}/></button>
          </div>
        </header>

        <div className="gps-content">
          <div className="gps-page-heading">
            <div><div className="gps-breadcrumb">Home <ChevronRight size={12}/> {title}</div><h1>{title}</h1><p>{subtitleFor(screen)}</p></div>
            <div className="gps-heading-actions">
              {screen === "directory" && <button className="gps-primary" onClick={() => setModal("add-guest")}><Plus size={15}/> Add Guest</button>}
              {screen === "users" && <button className="gps-primary" onClick={() => setModal("invite-user")}><Plus size={15}/> Invite User</button>}
              {screen === "tenants" && <button className="gps-primary" onClick={() => setModal("add-hotel")}><Plus size={15}/> Add Hotel</button>}
              {screen === "pms-sync" && <button className="gps-primary" onClick={() => notify("A new synchronisation has been queued.")}><RefreshCw size={15}/> Sync Now</button>}
              {screen === "settings" && <button className="gps-outline" onClick={() => notify("Settings saved successfully.")}><Save size={15}/> Save Defaults</button>}
              {screen === "audit-logs" && <button className="gps-outline" onClick={() => notify("Audit log export started.")}><Download size={15}/> Export</button>}
              {screen === "data-requests" && <button className="gps-primary" onClick={() => setModal("new-request")}><Plus size={15}/> New Request</button>}
            </div>
          </div>

          {screen === "dashboard" && <Dashboard onAction={notify} onNavigate={(s) => window.location.assign(`/workspace/${s}`)} totalCount={dashboardTotal} vipCount={dashboardVip} returningCount={dashboardReturning} newCount={dashboardNew} thisMonthCount={dashboardThisMonth} lastSyncAt={dashboardLastSync} auditEvents24h={dashboardAudit24h} syncErrors={realStats?.syncErrors ?? 0} usingDemoData={dashboardUsingDemoData} onRetry={statsHook.refetch} guests={liveGuestList} logs={auditLogsHook.logs} />}
          {screen === "analytics" && <Analytics onAction={notify} totalCount={dashboardTotal} auditEvents24h={dashboardAudit24h} logs={auditLogsHook.logs} tenantCount={tenantsHook.tenants.length} health={healthHook.health} healthError={healthHook.error} pmsConnected={syncStatusHook.status?.hasAdapterConnection ?? false}/>}
          {screen === "guest-search" && <GuestSearch query={query} setQuery={setQuery} guests={filteredGuests} loading={searchLoading} error={searchError} usingDemoData={searchUsingDemoData} onRetry={searchHook.refetch} onSelect={selectGuest} onAction={notify} />}
          {screen === "directory" && <Directory query={query} setQuery={setQuery} guests={filteredGuests} total={directoryTotal} loading={directoryHook.loading && directoryGuests === GUESTS} usingDemoData={directoryHook.error !== null && directoryGuests === GUESTS} onRetry={directoryHook.refetch} filter={filter} setFilter={setFilter} page={page} setPage={setPage} onSelect={selectGuest} onAction={notify}/>}
          {screen === "guest-profile" && <GuestProfile guest={currentGuest} onAction={notify} logs={auditLogsHook.logs} onEdit={() => { setForm({name:currentGuest.name,email:currentGuest.email,phone:currentGuest.phone,room:"Deluxe Room"}); setModal("edit-guest"); }}/>}
          {screen === "visit-history" && <VisitHistory guest={currentGuest} onAction={notify}/>}
          {screen === "pms-sync" && <PmsSync onAction={notify} syncStatus={syncStatusHook.status} loading={syncStatusHook.loading} error={syncStatusHook.error} onRetry={syncStatusHook.refetch}/>}
          {screen === "data-requests" && <DataRequests onAction={notify} requests={dataRequestsHook.requests} total={dataRequestsHook.total} loading={dataRequestsHook.loading} error={dataRequestsHook.error} onRetry={dataRequestsHook.refetch} onCreate={() => setModal("new-request")}/>}
          {screen === "audit-logs" && <AuditLogs onAction={notify} logs={auditLogsHook.logs} total={auditLogsHook.total} loading={auditLogsHook.loading} error={auditLogsHook.error} onRetry={auditLogsHook.refetch} page={auditLogsHook.page} setPage={auditLogsHook.setPage}/>}
          {screen === "users" && <UsersPage onAction={notify} onInvite={() => setModal("invite-user")} users={usersHook.users} total={usersHook.total} loading={usersHook.loading} error={usersHook.error} onRetry={usersHook.refetch}/>}
          {screen === "tenants" && <Tenants onAction={notify} onAdd={() => setModal("add-hotel")} tenants={tenantsHook.tenants} loading={tenantsHook.loading} error={tenantsHook.error} onRetry={tenantsHook.refetch}/>}
          {screen === "settings" && <SettingsPage toggles={toggles} setToggles={setToggles} tab={tab} setTab={setTab} onAction={notify} onSave={saveSettings} tenantName={tenantsHook.tenants[0]?.name ?? "—"}/>}
          {screen === "hotel-settings" && <HotelSettings toggles={toggles} setToggles={setToggles} onAction={notify} onSave={saveSettings} tenantName={tenantsHook.tenants[0]?.name ?? "—"} pmsConnected={syncStatusHook.status?.hasAdapterConnection ?? false}/>}
          {screen === "processing" && <Processing/>}
          {screen === "error" && <ErrorState onAction={notify}/>}
        </div>
      </main>

      {modal && <Modal name={modal} guest={currentGuest} form={form} onClose={() => setModal("")} onAction={notify} refetchGuests={directoryHook.refetch} refetchUsers={usersHook.refetch} refetchTenants={tenantsHook.refetch} refetchDataRequests={dataRequestsHook.refetch}/>}
      {toast && <div className="gps-toast"><CheckCircle2 size={17}/>{toast}<button onClick={() => setToast("")}><X size={14}/></button></div>}
    </div>
  );
}

function subtitleFor(s: Screen) {
  const map: Record<Screen,string> = {
    dashboard:"Welcome back. Here's what's happening across your guest profiling system.",
    analytics:"Monitor guest activity, system performance and hotel operations.",
    "guest-search":"Find returning guests quickly and securely.",
    directory:"Browse, search and manage your guest profiles.",
    "guest-profile":"View guest information, preferences and visit activity.",
    "visit-history":"Review previous stays and guest activity.",
    "pms-sync":"Monitor the connection between your PMS and Guest Profiling System.",
    "data-requests":"Manage guest data access, export and deletion requests.",
    "audit-logs":"Track important actions and events across your workspace.",
    users:"Manage team members, access levels and permissions.",
    tenants:"Manage hotel workspaces and their integrations.",
    settings:"Configure system preferences, notifications and security.",
    "hotel-settings":"Manage the settings for this hotel workspace.",
    registration:"A returning guest can be matched and their details prepared for the hotel's registration form.",
    processing:"Searching guest records and preparing matching profiles.",
    error:"We couldn't complete your request. You can retry or return to guest search.",
  };
  return map[s];
}

function Metric({ icon: Icon, label, value, delta, tone="blue" }: {icon:any;label:string;value:string;delta?:string;tone?:string}) {
  return <div className="gps-metric"><div className={`gps-metric-icon ${tone}`}><Icon size={18}/></div><div className="gps-metric-copy"><span>{label}</span><strong>{value}</strong>{delta && <small><b>↗ {delta}</b> vs last month</small>}</div></div>;
}
function Panel({ title, action, children, className="" }: {title:string;action?:ReactNode;children:ReactNode;className?:string}) {
  return <section className={`gps-panel ${className}`}><div className="gps-panel-head"><h2>{title}</h2>{action}</div>{children}</section>;
}
function Dashboard({onAction,onNavigate,totalCount=12480,vipCount=0,returningCount=0,newCount=0,thisMonthCount=0,lastSyncAt=null,auditEvents24h=0,syncErrors=0,usingDemoData=false,onRetry,guests,logs}:{onAction:(s:string)=>void;onNavigate:(s:string)=>void;totalCount?:number;vipCount?:number;returningCount?:number;newCount?:number;thisMonthCount?:number;lastSyncAt?:string|null;auditEvents24h?:number;syncErrors?:number;usingDemoData?:boolean;onRetry?:()=>void;guests?:GuestLike[];logs?:AuditLog[]}) {
  return <>
    {usingDemoData && <DemoDataBanner onRetry={onRetry}/>}
    <div className="gps-welcome"><div><span className="gps-eyebrow">{new Intl.DateTimeFormat("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date()).toUpperCase()}</span><h2>Welcome back, Receptionist!</h2><p>Quickly identify returning guests and deliver a better stay.</p></div><div className="gps-welcome-actions"><button className="gps-outline" onClick={()=>onNavigate("guest-search")}><Search size={15}/> Search for a guest</button><button className="gps-primary" onClick={()=>onNavigate("guest-search")}>Quick Search <ArrowRight size={15}/></button></div></div>
    <div className="gps-metrics"><Metric icon={Users} label="Total Guest Profiles" value={totalCount.toLocaleString()} delta={thisMonthCount > 0 ? `+${thisMonthCount} this month` : undefined} tone="blue"/><Metric icon={UserRound} label="Returning Guests" value={returningCount.toLocaleString()} tone="violet"/><Metric icon={CalendarCheck} label="New This Month" value={thisMonthCount.toLocaleString()} tone="green"/><Metric icon={Activity} label="Audit Events (24h)" value={auditEvents24h.toLocaleString()} tone="orange"/></div>
    <div className="gps-grid-two">
      <Panel title="Recent Guest Matches" action={<button className="gps-text-button" onClick={()=>onNavigate("directory")}>View all <ArrowRight size={13}/></button>}>
        <GuestRows compact guests={guests} onAction={onAction}/>
      </Panel>
      <Panel title="Recent Activity" action={<button className="gps-text-button" onClick={()=>onNavigate("audit-logs")}>View all <ArrowRight size={13}/></button>}>
        <ActivityRows logs={logs}/>
      </Panel>
    </div>
    <div className="gps-grid-two lower-grid">
      <Panel title="PMS Sync Status" action={<span className={`gps-status ${syncErrors>0?"status-bad":"status-good"}`}><i/> {syncErrors>0?"Needs attention":"All Systems Operational"}</span>}>
        <div className="gps-sync-summary"><div className="gps-sync-big"><span className="gps-check-circle"><Check size={20}/></span><div><b>{lastSyncAt?"Last sync completed":"No sync recorded yet"}</b><small>{lastSyncAt?formatRelative(lastSyncAt):"Run a PMS sync to populate this panel."}</small></div></div><div className="gps-sync-stats"><div><b>{totalCount.toLocaleString()}</b><small>Profiles synced</small></div><div><b>{syncErrors.toLocaleString()}</b><small>Sync errors</small></div><div><b>{auditEvents24h.toLocaleString()}</b><small>Audit events (24h)</small></div></div><button className="gps-outline gps-full" onClick={()=>onAction("Opening PMS synchronisation details.")}>View Sync Details <ArrowRight size={14}/></button></div>
      </Panel>
      <div className="gps-help-card"><div className="gps-help-icon"><CircleHelp size={22}/></div><div><b>Need help?</b><p>Explore the quick guide to learn how to find returning guests and use profile matching.</p><button className="gps-text-button" onClick={()=>onAction("Quick guide opened.")}>View Quick Guide <ArrowRight size={13}/></button></div></div>
    </div>
  </>;
}
function Analytics({onAction,totalCount=0,auditEvents24h=0,logs,tenantCount=0,health=null,healthError=null,pmsConnected=false}:{onAction:(s:string)=>void;totalCount?:number;auditEvents24h?:number;logs?:AuditLog[];tenantCount?:number;health?:{status:string;uptime:number;timestamp:string}|null;healthError?:string|null;pmsConnected?:boolean}) {
  const healthy = health?.status === "ok";
  const uptime = health ? `${Math.floor(health.uptime / 60)} min` : healthError ? "—" : "…";
  return <>
    <div className="gps-metrics"><Metric icon={Users} label="Total Guest Profiles" value={totalCount.toLocaleString()} delta="live"/><Metric icon={CalendarCheck} label="Audit Events (24h)" value={auditEvents24h.toLocaleString()} tone="violet"/><Metric icon={Activity} label="System Health" value={healthy?"Healthy":healthError?"Unavailable":"…"} tone={healthy?"green":"orange"}/><Metric icon={Building2} label="Active Tenants" value={tenantCount.toLocaleString()} tone="orange"/></div>
    <div className="gps-grid-two analytics-grid">
      <Panel title="Guest Activity Analytics" action={<select className="gps-select"><option>Last 30 days</option><option>Last 7 days</option><option>Last 90 days</option></select>}><Chart/><p className="gps-chart-note">Illustrative 30-day trend — live reporting is not connected yet.</p></Panel>
      <Panel title="System Health"><div className="gps-health"><div className="gps-health-ring"><b>{healthy?"OK":"—"}</b><small>{healthy?"Healthy":healthError?"Unavailable":"Checking"}</small></div><div className="gps-health-list">{[["API Response",healthy],["Process uptime",health?uptime:null],["PMS Sync",pmsConnected],["Database",null]].map(([label,state])=><div key={String(label)}><span><i className={`health-dot ${state===false?"health-dot-bad":state===null?"health-dot-unknown":""}`}/>{label}</span><b>{state===true?"Operational":state===false?"Not connected":state===null?"Monitored separately":String(state)}</b></div>)}</div></div></Panel>
    </div>
    <div className="gps-grid-two"><Panel title="Recent Administrator Activity"><ActivityRows logs={logs}/></Panel><Panel title="Quick Access"><div className="gps-quick-grid">{[{label:"Guest Directory",icon:Users,route:"directory"},{label:"PMS Integration",icon:PlugZap,route:"pms-sync"},{label:"User Management",icon:ShieldCheck,route:"users"},{label:"System Settings",icon:Settings,route:"settings"}].map(x=><button key={x.label} onClick={()=>window.location.assign(`/workspace/${x.route}`)}><x.icon size={19}/><span>{x.label}</span><ArrowRight size={13}/></button>)}</div></Panel></div>
  </>;
}
function Chart() {
  const vals=[36,48,43,60,52,72,66,82,70,91,76,88,96,82,100,92,112,96,120,108,126,112,138,126,144,130,152,140,160,148];
  return <div className="gps-chart"><div className="gps-chart-y"><span>160</span><span>120</span><span>80</span><span>40</span><span>0</span></div><div className="gps-chart-area"><div className="gps-chart-lines"><i/><i/><i/><i/><i/></div><svg viewBox="0 0 600 180" preserveAspectRatio="none" aria-label="Guest activity line chart"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2563eb" stopOpacity=".2"/><stop offset="1" stopColor="#2563eb" stopOpacity="0"/></linearGradient></defs><path d={`M ${vals.map((v,i)=>`${i*20},${170-v}`).join(" L ")} L 580,180 L 0,180 Z`} fill="url(#chartFill)"/><polyline points={vals.map((v,i)=>`${i*20},${170-v}`).join(" ")} fill="none" stroke="#2563eb" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></svg><div className="gps-chart-x"><span>Oct 13</span><span>Oct 20</span><span>Oct 27</span><span>Nov 03</span><span>Nov 11</span></div></div></div>;
}
function GuestRows({compact=false,onAction,guests}:{compact?:boolean;onAction:(s:string)=>void;guests?:GuestLike[]}) {
  const rows = guests && guests.length > 0 ? guests : GUESTS;
  return <div className="gps-table-wrap"><table className="gps-table"><thead><tr><th>Guest</th><th>Last Visit</th><th>Visits</th><th>Status</th><th></th></tr></thead><tbody>{rows.slice(0,compact?4:6).map((g)=><tr key={(g as any).guestId ?? g.email}><td><div className="gps-person"><span className="gps-avatar">{g.initials}</span><span><b>{g.name}</b><small>{g.email}</small></span></div></td><td>{g.last}</td><td>{g.visits}</td><td><span className={`gps-pill ${g.status==="VIP"?"pill-violet":g.status==="New"?"pill-blue":"pill-green"}`}>{g.status}</span></td><td><button className="gps-row-action" onClick={()=>onAction(`${g.name}'s profile opened.`)} aria-label={`View ${g.name}`}><ArrowRight size={15}/></button></td></tr>)}</tbody></table></div>;
}
function formatRelative(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";
  const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
function ActivityRows({logs}:{logs?:AuditLog[]}) {
  if (!logs || logs.length === 0) {
    return <div className="gps-activity-empty">No activity recorded yet.</div>;
  }
  return <div className="gps-activity-list">{logs.slice(0, 4).map((log) => {
    const tone = log.action === "SYNC" ? "green" : log.action === "CREATE" ? "violet" : log.action === "UPDATE" ? "orange" : "blue";
    const icon = log.action === "SYNC" ? <RefreshCw size={15}/> : log.action === "UPDATE" ? <ShieldCheck size={15}/> : log.action === "CREATE" ? <UserRound size={15}/> : <UserSearch size={15}/>;
    return <div className="gps-activity-item" key={log.logId}><span className={`gps-activity-icon ${tone}`}>{icon}</span><div><b>{log.action} {log.entityType}</b><small>{log.entityId ?? "System"}</small></div><time>{formatRelative(log.createdAt)}</time></div>;
  })}</div>;
}
function GuestSearch({query,setQuery,guests,loading,error,usingDemoData,onRetry,onSelect,onAction}:{query:string;setQuery:(v:string)=>void;guests:GuestLike[];loading?:boolean;error?:string|null;usingDemoData?:boolean;onRetry?:()=>void;onSelect:(g:GuestLike)=>void;onAction:(s:string)=>void}) {
  return <>
    {usingDemoData && <DemoDataBanner onRetry={onRetry}/>}
    <div className="gps-search-banner"><div className="gps-search-art"><div className="gps-search-art-card"><UserSearch size={42}/><span/></div></div><div><span className="gps-eyebrow">SMART GUEST MATCHING</span><h2>Find a returning guest</h2><p>Search by name, phone number or email address. Matches update as you type.</p><div className="gps-search-box"><Search size={18}/>{loading?<Loader2 size={18} className="gps-spin"/>:null}<input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Enter guest name, phone number or email..."/><kbd>⌘ K</kbd><button onClick={()=>onAction("Guest search refreshed.")}>Search</button></div><div className="gps-search-hints"><span><CheckCircle2 size={13}/> Live matching</span><span><ShieldCheck size={13}/> Secure & private</span><span><Zap size={13}/> Instant results</span></div></div></div>
    <div className="gps-results-head"><div><h2>Search Results <span>{guests.length}</span></h2><p>{loading?"Searching…":query?`Matches for “${query}”`:"Start typing to find guest profiles."}</p></div><button className="gps-outline" onClick={()=>setQuery("")}><RotateCcw size={14}/> Clear search</button></div>
    {loading && guests.length === 0 ? <LoadingState label="Searching guests…"/>
    : error && guests.length === 0 ? <ApiErrorState message={error} onRetry={onRetry}/>
    : guests.length ? <div className="gps-guest-card-grid">{guests.map((g)=><button className="gps-guest-card" key={(g as any).guestId ?? g.email} onClick={()=>onSelect(g)}><div className="gps-guest-card-top"><span className="gps-avatar gps-avatar-large">{g.initials}</span><span className={`gps-pill ${g.status==="VIP"?"pill-violet":"pill-green"}`}>{g.status}</span></div><b>{g.name}</b><small>{g.email}</small><small>{g.phone}</small><div className="gps-guest-card-foot"><span>{g.visits} visits</span><span>Last: {g.last}</span><ArrowRight size={14}/></div></button>)}</div> : <EmptyState title="No matching guests found" detail="Try another name, email address or phone number." action="Clear search" onAction={()=>setQuery("")}/>}
  </>;
}
function Directory({query,setQuery,guests,total,loading,usingDemoData,onRetry,filter,setFilter,page,setPage,onSelect,onAction}:{query:string;setQuery:(v:string)=>void;guests:GuestLike[];total?:number;loading?:boolean;usingDemoData?:boolean;onRetry?:()=>void;filter:string;setFilter:(v:string)=>void;page:number;setPage:(v:number)=>void;onSelect:(g:GuestLike)=>void;onAction:(s:string)=>void}) {
  const totalCount = total ?? guests.length;
  return <>
    {usingDemoData && <DemoDataBanner onRetry={onRetry}/>}
    <div className="gps-metrics"><Metric icon={Users} label="Total Profiles" value={totalCount.toLocaleString()}/><Metric icon={StarIcon} label="VIP Guests" value={Math.max(0, guests.filter(g=>g.status==="VIP").length).toLocaleString()} tone="violet"/><Metric icon={UserRound} label="Returning Guests" value={Math.max(0, guests.filter(g=>g.status==="Returning").length).toLocaleString()} tone="green"/><Metric icon={CalendarDays} label="New This Month" value={Math.max(0, guests.filter(g=>g.status==="New").length).toLocaleString()} tone="orange"/></div>
    <Panel title="All Guest Profiles" action={<button className="gps-outline" onClick={()=>onAction("Guest directory exported.")}><Download size={14}/> Export</button>}>
      <div className="gps-toolbar"><div className="gps-search-inline"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search guest name, email or phone..."/></div><select className="gps-select" value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>VIP</option><option>Returning</option><option>New</option></select><button className="gps-outline" onClick={()=>{setQuery("");setFilter("All");}}><Filter size={14}/> Filters</button></div>
      <div className="gps-table-wrap"><table className="gps-table"><thead><tr><th><input type="checkbox" aria-label="Select all"/></th><th>Guest Name</th><th>Email Address</th><th>Phone Number</th><th>Total Visits</th><th>Last Visit</th><th>Status</th><th>Actions</th></tr></thead><tbody>{loading && guests.length === 0 ? <tr><td colSpan={8}><LoadingState label="Loading guests…"/></td></tr> : guests.map((g)=><tr key={(g as any).guestId ?? g.email}><td><input type="checkbox" aria-label={`Select ${g.name}`}/></td><td><div className="gps-person"><span className="gps-avatar">{g.initials}</span><b>{g.name}</b></div></td><td>{g.email}</td><td>{g.phone}</td><td>{g.visits}</td><td>{g.last}</td><td><span className={`gps-pill ${g.status==="VIP"?"pill-violet":g.status==="New"?"pill-blue":"pill-green"}`}>{g.status}</span></td><td><button className="gps-row-action" onClick={()=>onSelect(g)}><Eye size={14}/></button><button className="gps-row-action" onClick={()=>onAction(`Editing ${g.name}.`)}><MoreHorizontal size={14}/></button></td></tr>)}</tbody></table></div>
      <div className="gps-pagination"><span>Showing {guests.length} of {totalCount.toLocaleString()} profiles</span><div><button onClick={()=>setPage(Math.max(1,page-1))} disabled={page===1}><ChevronLeft size={15}/></button><button className="current">{page}</button><button onClick={()=>setPage(page+1)}>{page+1}</button><button onClick={()=>setPage(page+2)}>{page+2}</button><button onClick={()=>setPage(page+1)}><ChevronRight size={15}/></button></div></div>
    </Panel>
  </>;
}
function StarIcon({size=18}:{size?:number}) { return <Sparkles size={size}/>; }
function isoDate(value: unknown): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function storeGuestInExtension(payload: unknown): Promise<boolean> {
  return new Promise((resolve) => {
    const onAck = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.origin !== window.location.origin) return;
      if ((event.data as { type?: string } | null)?.type !== "GPS_STORE_GUEST_ACK") return;
      window.clearTimeout(timer);
      window.removeEventListener("message", onAck);
      resolve(true);
    };
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onAck);
      resolve(false);
    }, 700);
    window.addEventListener("message", onAck);

    const extensionId = process.env.NEXT_PUBLIC_GPS_EXTENSION_ID;
    const chromeGlobal = (globalThis as unknown as {
      chrome?: { runtime?: { sendMessage?: (id: string, msg: unknown, cb: () => void) => void; lastError?: unknown } };
    }).chrome;
    if (extensionId && chromeGlobal?.runtime?.sendMessage) {
      try {
        chromeGlobal.runtime.sendMessage(extensionId, { type: "STORE_GUEST", payload }, () => {
          void chromeGlobal.runtime?.lastError;
        });
      } catch {
        // Fall through to the content-script bridge below.
      }
    }
    // The extension's content script listens for this, forwards it to the
    // background worker, and acknowledges.
    window.postMessage({ type: "GPS_STORE_GUEST", payload }, window.location.origin);
  });
}

function formatGuestDate(value: unknown, opts: Intl.DateTimeFormatOptions): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(String(value));
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "UTC" }).format(d);
}

function GuestProfile({guest,onAction,onEdit,logs}:{guest:GuestLike;onAction:(s:string)=>void;onEdit:()=>void;logs?:AuditLog[]}) {
  // Send the guest to the FormFilla extension. Delivery is confirmed by an
  // acknowledgement from the extension's content script — we never claim
  // success when the extension is missing.
  const prepareForExtension = async () => {
    const raw = "raw" in guest ? guest.raw : null;
    const payload = {
      guest: {
        guestId: ("guestId" in guest ? guest.guestId : "unknown") as string,
        firstName: raw?.firstName ?? guest.name.split(" ")[0] ?? null,
        lastName: raw?.lastName ?? (guest.name.split(" ").slice(1).join(" ") || null),
        email: guest.email === "—" ? null : guest.email,
        phone: guest.phone === "—" ? null : guest.phone,
        dateOfBirth: isoDate(raw?.dateOfBirth),
        nationality: raw?.nationality ?? null,
        addressLine1: raw?.addressLine1 ?? null,
        addressLine2: raw?.addressLine2 ?? null,
        city: raw?.city ?? null,
        state: raw?.state ?? null,
        postalCode: raw?.postalCode ?? null,
        country: raw?.country ?? null,
        company: null,
        notes: null,
      },
      storedAt: Date.now(),
    };
    const delivered = await storeGuestInExtension(payload);
    onAction(delivered
      ? "Guest prepared. Open the hotel's registration form and click the extension icon."
      : "Extension not detected. Install and enable the Guest Profiling extension, then try again.");
  };

  const raw = "raw" in guest ? guest.raw : null;
  const guestId = "guestId" in guest ? guest.guestId : null;
  const preferences = raw
    ? [
        ...Object.entries(raw.preferences ?? {}).map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").toLowerCase()}: ${String(v)}`),
        ...(raw.tags ?? []),
      ].filter(Boolean)
    : [];
  const guestLogs = logs?.filter((log) => guestId && log.entityType === "guest" && log.entityId === guestId) ?? [];
  const statusPill = guest.status === "VIP" ? "pill-violet" : guest.status === "New" ? "pill-blue" : "pill-green";

  return <>
    <div className="gps-profile-hero"><span className="gps-avatar gps-avatar-xl">{guest.initials}</span><div className="gps-profile-name"><h2>{guest.name} <span className={`gps-pill ${statusPill}`}>{guest.status} Guest</span></h2><p><Mail size={13}/>{guest.email} <Phone size={13}/>{guest.phone}</p><small>Guest ID: {guestId ?? "—"}{raw?.createdAt ? ` · Member since ${formatGuestDate(raw.createdAt, { month: "long", year: "numeric" })}` : ""}</small></div><div className="gps-profile-actions"><button className="gps-outline" onClick={onEdit}><Pencil size={14}/> Edit Profile</button><button className="gps-primary" onClick={prepareForExtension}><ClipboardList size={14}/> Prepare Registration</button></div></div>
    <div className="gps-profile-tabs">{["Overview","Visit History","Preferences","Activity"].map(t=><button className={t==="Overview"?"active":""} key={t} onClick={()=>onAction(`${t} tab selected.`)}>{t}</button>)}</div>
    <div className="gps-grid-two"><Panel title="Personal Information"><InfoRows rows={[["Full Name",guest.name],["Email Address",guest.email],["Phone Number",guest.phone],["Nationality",raw?.nationality ?? "—"],["Date of Birth",formatGuestDate(raw?.dateOfBirth, { day: "numeric", month: "long", year: "numeric" })],["Guest Status",`${guest.status} Guest`]]}/></Panel><Panel title="Guest Statistics"><div className="gps-stat-grid"><div><b>{guest.visits}</b><small>Total Visits</small></div><div><b>{raw ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(raw.totalSpend ?? 0) : "—"}</b><small>Total Spend</small></div><div><b>{raw?.vipLevel && raw.vipLevel !== "NONE" ? raw.vipLevel : "—"}</b><small>VIP Level</small></div><div><b>{raw?.guestPhase ?? "—"}</b><small>Guest Phase</small></div></div><h3 className="gps-subhead">Guest Preferences</h3><div className="gps-tag-row">{preferences.length ? preferences.map((p) => <span key={p}>{p}</span>) : <span>No preferences recorded</span>}</div></Panel></div>
    <Panel title="Recent Activity"><ActivityRows logs={guestLogs}/></Panel>
  </>;
}
function InfoRows({rows}:{rows:string[][]}) { return <div className="gps-info-rows">{rows.map(([a,b])=><div key={a}><span>{a}</span><b>{b}</b></div>)}</div>; }
function VisitHistory({guest,onAction}:{guest:GuestLike;onAction:(s:string)=>void}) {
  const guestId = "guestId" in guest ? guest.guestId : null;
  const { reservations, loading, error, refetch } = useReservations(guestId);
  const raw = "raw" in guest ? guest.raw : null;
  const nights = reservations.reduce((sum, r) => {
    const checkIn = new Date(r.checkIn).getTime();
    const checkOut = new Date(r.checkOut).getTime();
    return sum + Math.max(0, Math.round((checkOut - checkIn) / 86400000));
  }, 0);
  const statusTone = (status: string) => status === "CHECKED_IN" ? "pill-blue" : status === "CANCELLED" || status === "NO_SHOW" ? "pill-red" : "pill-green";

  return <>
    <div className="gps-profile-hero"><span className="gps-avatar gps-avatar-xl">{guest.initials}</span><div className="gps-profile-name"><h2>{guest.name}</h2><p>{guest.email} · {guest.phone}</p><small>Guest visit records and stay history</small></div><button className="gps-outline" onClick={()=>onAction("Visit history exported.")}><Download size={14}/> Export History</button></div>
    <div className="gps-metrics"><Metric icon={CalendarCheck} label="Total Visits" value={String(guest.visits)}/><Metric icon={MoonIcon} label="Total Nights" value={loading?"…":String(nights)} tone="violet"/><Metric icon={Clock3} label="Last Visit" value={guest.last} tone="green"/><Metric icon={Building2} label="Total Spend" value={raw ? new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(raw.totalSpend??0) : "—"} tone="orange"/></div>
    <Panel title="Visit History" action={<select className="gps-select"><option>All time</option><option>2026</option><option>2025</option></select>}>
      {error ? <ApiErrorState message={error} onRetry={refetch}/>
      : !guestId ? <EmptyState title="No database profile selected" detail="Open a guest from the directory to see their real stay records." action="Open directory" onAction={()=>window.location.assign("/workspace/directory")}/>
      : loading ? <LoadingState label="Loading visit history…"/>
      : reservations.length === 0 ? <EmptyState title="No visits recorded" detail="This guest has no stay records in the profiling database yet." action="Refresh" onAction={refetch}/>
      : <div className="gps-table-wrap"><table className="gps-table"><thead><tr><th>Stay ID</th><th>Check-in</th><th>Check-out</th><th>Room</th><th>Nights</th><th>Guests</th><th>Status</th></tr></thead><tbody>{reservations.map((r) => {
        const stayNights = Math.max(0, Math.round((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86400000));
        return <tr key={r.reservationId}><td>{r.reservationId.slice(0, 8)}</td><td>{formatGuestDate(r.checkIn,{day:"numeric",month:"short",year:"numeric"})}</td><td>{formatGuestDate(r.checkOut,{day:"numeric",month:"short",year:"numeric"})}</td><td>{r.roomType ?? "—"}</td><td>{stayNights}</td><td>{r.numGuests}</td><td><span className={`gps-pill ${statusTone(r.status)}`}>{r.status.replace("_"," ")}</span></td></tr>;
      })}</tbody></table></div>}
    </Panel>
  </>;
}
function MoonIcon({size=18}:{size?:number}) { return <CalendarDays size={size}/>; }
function PmsSync({onAction,syncStatus=null,loading=false,error=null,onRetry}:{onAction:(s:string)=>void;syncStatus?:import("@/lib/api-client").SyncStatusResponse|null;loading?:boolean;error?:string|null;onRetry?:()=>void}) {
  // Use real sync status; fall back to mock layout if loading
  const states = syncStatus?.states ?? [];
  const events = syncStatus?.recentEvents ?? [];
  const hasConn = syncStatus?.hasAdapterConnection ?? false;
  const lastSync = states[0]?.updatedAt ?? null;
  const lastSyncStr = lastSync ? new Date(lastSync).toLocaleString() : "—";
  return <>
    {error && <ApiErrorState message={error} onRetry={onRetry}/>}
    {loading && !syncStatus && <LoadingState label="Loading sync status…"/>}
    <div className="gps-sync-hero"><div className="gps-sync-logo"><Database size={28}/></div><div><span className="gps-eyebrow">CONNECTION STATUS</span><h2>PMS Database</h2><p>{hasConn ? "Connected to the hotel's property management system." : "No adapter connection configured for this tenant."}</p></div><span className={`gps-status ${hasConn?"status-good":"status-warn"}`}><i/> {hasConn ? "Connected" : "Not configured"}</span></div>
    <div className="gps-metrics"><Metric icon={Database} label="Tables Synced" value={String(states.length)}/><Metric icon={RefreshCw} label="Last Sync" value={lastSync ? new Date(lastSync).toLocaleTimeString() : "—"} tone="violet"/><Metric icon={CheckCircle2} label="Status" value={hasConn ? "Healthy" : "—"} tone="green"/><Metric icon={AlertCircle} label="Sync Errors" value="0" tone="orange"/></div>
    <div className="gps-grid-two"><Panel title="Synchronisation Pipeline"><div className="gps-pipeline">{[{t:"PMS Database",d:"Read-only connection",i:Database},{t:"Guest Data Adapter",d:"Data extraction and mapping",i:Zap},{t:"Guest Profiling System",d:"Profile indexing and matching",i:Users}].map((x,i)=><div className="gps-pipeline-step" key={x.t}><span><x.i size={18}/></span><div><b>{x.t}</b><small>{x.d}</small></div><span className={`gps-status ${hasConn?"status-good":"status-warn"}`}><i/> {hasConn ? "Active" : "Pending"}</span>{i!==2&&<ArrowRight className="gps-pipeline-arrow" size={17}/>}</div>)}</div></Panel><Panel title="Connection Details"><InfoRows rows={[["PMS Provider","QloApps (v1 mapping)"],["Connection Type","Read-only Postgres"],["Sync Frequency","Manual (per pnpm seed:source)"],["Last Successful Sync",lastSyncStr],["Connection",hasConn?"Encrypted / Read-only":"Not configured"]]}/><button className="gps-outline gps-full" onClick={()=>onAction("Connection test successful.")}><PlugZap size={14}/> Test Connection</button></Panel></div>
    <Panel title="Sync State (per table)" action={<button className="gps-text-button" onClick={onRetry}><RefreshCw size={13}/> Refresh</button>}><div className="gps-table-wrap"><table className="gps-table"><thead><tr><th>Table</th><th>Last xmin</th><th>Updated</th><th>Status</th></tr></thead><tbody>{states.length === 0 ? <tr><td colSpan={4} style={{textAlign:"center",color:"#97a4b6",padding:"20px"}}>No sync state recorded yet. Run the seeding script first.</td></tr> : states.map((s,i)=><tr key={i}><td><b>{s.tableName}</b></td><td>{s.lastSeenXmin}</td><td>{new Date(s.updatedAt).toLocaleString()}</td><td><span className="gps-pill pill-green">Synced</span></td></tr>)}</tbody></table></div></Panel>
    {events.length > 0 && <Panel title="Recent Sync Events"><div className="gps-table-wrap"><table className="gps-table"><thead><tr><th>Event</th><th>Entity Type</th><th>Date</th></tr></thead><tbody>{events.map((e,i)=><tr key={i}><td><b>{e.action}</b></td><td>{e.entityType}</td><td>{new Date(e.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div></Panel>}
  </>;
}
function DataRequests({onAction,requests=[],total=0,loading=false,error=null,onRetry,onCreate}:{onAction:(s:string)=>void;requests?:import("@/lib/api-client").DataRequest[];total?:number;loading?:boolean;error?:string|null;onRetry?:()=>void;onCreate?:()=>void}) {
  const submitted = requests.filter(r => r.status === "SUBMITTED").length;
  const fulfilled = requests.filter(r => r.status === "FULFILLED").length;
  const rejected = requests.filter(r => r.status === "REJECTED").length;
  return <>
    {error && <ApiErrorState message={error} onRetry={onRetry}/>}
    <div className="gps-metrics"><Metric icon={FileText} label="Total Requests" value={total.toLocaleString()}/><Metric icon={Clock3} label="Pending Review" value={String(submitted)} tone="violet"/><Metric icon={CheckCircle2} label="Fulfilled" value={String(fulfilled)} tone="green"/><Metric icon={XCircle} label="Rejected" value={String(rejected)} tone="orange"/></div>
    <Panel title="Data Subject Requests (NDPR/GDPR/CCPA)" action={<button className="gps-primary" onClick={onCreate}><Plus size={14}/> New Request</button>}>
      {loading && requests.length === 0 ? <LoadingState label="Loading requests…"/> :
      <div className="gps-table-wrap"><table className="gps-table"><thead><tr><th>Request ID</th><th>Guest Email</th><th>Type</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>{requests.length === 0 ? <tr><td colSpan={6} style={{textAlign:"center",color:"#97a4b6",padding:"20px"}}>No data subject requests yet.</td></tr> : requests.map(r=><tr key={r.requestId}><td><b>{r.requestId.slice(0,8)}</b></td><td>{r.guestEmail ?? "—"}</td><td>{r.type}</td><td><span className={`gps-pill ${r.status==="FULFILLED"?"pill-green":r.status==="REJECTED"?"pill-red":"pill-orange"}`}>{r.status}</span></td><td>{new Date(r.submittedAt).toLocaleString()}</td><td><button className="gps-row-action" onClick={()=>onAction(`${r.requestId} details opened.`)}><Eye size={14}/></button></td></tr>)}</tbody></table></div>}
    </Panel>
  </>;
}
function AuditLogs({onAction,logs=[],total=0,loading=false,error=null,onRetry,page=1,setPage}:{onAction:(s:string)=>void;logs?:import("@gps/shared").AuditLog[];total?:number;loading?:boolean;error?:string|null;onRetry?:()=>void;page?:number;setPage?:(p:number)=>void}) {
  return <>
    {error && <ApiErrorState message={error} onRetry={onRetry}/>}
    <div className="gps-metrics"><Metric icon={Activity} label="Total Events" value={total.toLocaleString()}/><Metric icon={ShieldCheck} label="Audit Table" value="append-only" tone="violet"/><Metric icon={Clock3} label="Showing Page" value={String(page)} tone="green"/><Metric icon={AlertCircle} label="Errors" value="0" tone="orange"/></div>
    <Panel title="Activity Log" action={<button className="gps-outline" onClick={()=>onAction("Audit logs export started.")}><Download size={14}/> Export Logs</button>}>
      {loading && logs.length === 0 ? <LoadingState label="Loading audit logs…"/> :
      <div className="gps-table-wrap"><table className="gps-table"><thead><tr><th>Action</th><th>Entity Type</th><th>Entity ID</th><th>Actor</th><th>Date & Time</th></tr></thead><tbody>{logs.length === 0 ? <tr><td colSpan={5} style={{textAlign:"center",color:"#97a4b6",padding:"20px"}}>No audit log entries yet. Mutations to guest records will appear here.</td></tr> : logs.map(l=><tr key={l.logId}><td><span className={`gps-pill ${l.action==="DELETE"?"pill-red":l.action==="CREATE"?"pill-green":l.action.startsWith("DSR")?"pill-violet":"pill-blue"}`}>{l.action}</span></td><td>{l.entityType}</td><td>{l.entityId ? l.entityId.slice(0,8) : "—"}</td><td>{l.actorUserId ? l.actorUserId.slice(0,8) : "system"}</td><td>{new Date(l.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>}
      {total > 20 && <div className="gps-pagination"><span>Showing {logs.length} of {total.toLocaleString()} events</span><div><button onClick={()=>setPage?.(Math.max(1,page-1))} disabled={page===1}><ChevronLeft size={15}/></button><button className="current">{page}</button><button onClick={()=>setPage?.(page+1)}>{page+1}</button><button onClick={()=>setPage?.(page+1)}><ChevronRight size={15}/></button></div></div>}
    </Panel>
  </>;
}
function UsersPage({onAction,onInvite,users=[],total=0,loading=false,error=null,onRetry}:{onAction:(s:string)=>void;onInvite:()=>void;users?:import("@gps/shared").User[];total?:number;loading?:boolean;error?:string|null;onRetry?:()=>void}) {
  const active = users.filter(u => u.active).length;
  return <>
    {error && <ApiErrorState message={error} onRetry={onRetry}/>}
    <div className="gps-metrics"><Metric icon={Users} label="Total Users" value={total.toLocaleString()}/><Metric icon={CheckCircle2} label="Active Users" value={String(active)} tone="green"/><Metric icon={Clock3} label="Pending Invites" value="0" tone="violet"/><Metric icon={ShieldCheck} label="Roles Defined" value="3" tone="orange"/></div>
    <Panel title="Team Members" action={<button className="gps-primary" onClick={onInvite}><Plus size={14}/> Invite User</button>}>
      {loading && users.length === 0 ? <LoadingState label="Loading users…"/> :
      <div className="gps-table-wrap"><table className="gps-table"><thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{users.length === 0 ? <tr><td colSpan={5} style={{textAlign:"center",color:"#97a4b6",padding:"20px"}}>No users yet. Invite team members to grant them access.</td></tr> : users.map(u=><tr key={u.userId}><td><b>{u.email}</b></td><td>{u.groups.join(", ")}</td><td><span className={`gps-pill ${u.active?"pill-green":"pill-orange"}`}>{u.active?"Active":"Disabled"}</span></td><td>{new Date(u.createdAt).toLocaleDateString()}</td><td><button className="gps-row-action" onClick={()=>onAction(`Editing ${u.email}.`)}><Pencil size={14}/></button></td></tr>)}</tbody></table></div>}
    </Panel>
    <Panel title="Roles & Permissions"><div className="gps-role-grid">{[["Administrator","Full system access","Admin"],["Regional Manager","Multi-tenant management","RegionalManager"],["Receptionist","Guest search and registration","Receptionist"]].map(r=><div key={r[0]}><span className="gps-role-icon"><KeyRound size={17}/></span><b>{r[0]}</b><small>{r[1]}</small><em>{users.filter(u => u.groups.includes(r[2] as never)).length} users</em><button onClick={()=>onAction(`${r[0]} permissions opened.`)}>View permissions <ArrowRight size={12}/></button></div>)}</div></Panel>
  </>;
}
function Tenants({onAction,onAdd,tenants=[],loading=false,error=null,onRetry}:{onAction:(s:string)=>void;onAdd:()=>void;tenants?:import("@gps/shared").Tenant[];loading?:boolean;error?:string|null;onRetry?:()=>void}) {
  return <>
    {error && <ApiErrorState message={error} onRetry={onRetry}/>}
    <div className="gps-metrics"><Metric icon={Building2} label="Total Tenants" value={String(tenants.length)}/><Metric icon={CheckCircle2} label="Active" value={String(tenants.length)} tone="green"/><Metric icon={Clock3} label="Pending Setup" value="0" tone="violet"/><Metric icon={Users} label="Tenant Mode" value="single" tone="orange"/></div>
    <div className="gps-grid-two"><Panel title="Tenants" action={<button className="gps-text-button" onClick={onAdd}><Plus size={13}/> Add tenant</button>}>
      {loading && tenants.length === 0 ? <LoadingState label="Loading tenants…"/> :
      <div className="gps-hotel-list">{tenants.length === 0 ? <div style={{padding:"20px",color:"#97a4b6",textAlign:"center"}}>No tenants found. The first tenant is seeded via the migration.</div> : tenants.map(t=><div className="gps-hotel-item" key={t.tenantId}><span className="gps-hotel-icon"><Building2 size={18}/></span><div><b>{t.name}</b><small>Tenant ID: {t.tenantId.slice(0,8)} · Created {new Date(t.createdAt).toLocaleDateString()}</small></div><span className="gps-pill pill-green">Active</span><button className="gps-row-action" onClick={()=>onAction(`${t.name} workspace opened.`)}><ChevronRight size={15}/></button></div>)}</div>}
    </Panel><Panel title="Tenant Mode"><div className="gps-tenant-detail"><div className="gps-tenant-logo"><Building2 size={27}/></div><h3>Single-Tenant</h3><p>v1 deployment</p><span className="gps-status status-good"><i/> Production</span><InfoRows rows={[["Tenant Mode","Single-tenant (v1)"],["Multi-tenant Schema","Built-in (tenant_id on every table)"],["Chain-level Deploy","Deferred to v2"],["Isolation Boundary","JWT-enforced at every query"]]}/><button className="gps-outline gps-full" onClick={()=>window.location.assign("/workspace/hotel-settings")}><Settings size={14}/> Manage Hotel Settings</button></div></Panel></div>
  </>;
}
function SettingsPage({toggles,setToggles,tab,setTab,onAction,onSave,tenantName}:{toggles:Record<string,boolean>;setToggles:(v:Record<string,boolean>)=>void;tab:string;setTab:(v:string)=>void;onAction:(s:string)=>void;onSave:()=>Promise<void>;tenantName:string}) {
  const [saving,setSaving]=useState(false);
  const save=async()=>{setSaving(true);try{await onSave();onAction("Settings saved successfully.");}catch(err){onAction(err instanceof ApiError?err.message:"Could not save settings.");}finally{setSaving(false);}};
  const tabs=["General","Notifications","Security","Integrations","Account"];
  const settingsRows: [string,string][] = tab==="General"
    ? [["Hotel Name",tenantName],["Default Language","English (United States)"],["Timezone","Africa/Lagos"],["Date Format","DD/MM/YYYY"]]
    : tab==="Notifications"
    ? [["Email notifications","Receive important system alerts"],["Guest match alerts","Get notified when a guest match is found"],["Sync notifications","Receive PMS synchronisation updates"]]
    : tab==="Security"
    ? [["Multi-factor authentication","Require an additional sign-in step"],["Session timeout","Automatically sign out inactive users"],["Login alerts","Notify administrators of new logins"]]
    : tab==="Integrations"
    ? [["Auto sync","Automatically synchronise guest records"],["Guest profile matching","Enable real-time guest matching"],["PMS connection","Grand Vista PMS · Connected"]]
    : [["Account email","admin@grandvista.com"],["Display name","Admin Operator"],["Two-factor security","Manage account security"]];
  return <>
    <div className="gps-success-banner"><CheckCircle2 size={19}/><div><b>Settings successfully updated</b><small>Your preferences have been saved.</small></div><button onClick={()=>onAction("Settings notice dismissed.")}><X size={15}/></button></div>
    <div className="gps-settings-layout"><aside className="gps-settings-tabs">{tabs.map(t=><button className={tab===t?"active":""} onClick={()=>setTab(t)} key={t}>{t==="General"?<Settings size={15}/>:t==="Notifications"?<Bell size={15}/>:t==="Security"?<LockKeyhole size={15}/>:t==="Integrations"?<PlugZap size={15}/>:<UserRound size={15}/>} {t}</button>)}</aside><div className="gps-settings-content">
      <Panel title={`${tab} Settings`}><div className="gps-settings-section"><h3>{tab==="General"?"System Preferences":tab==="Notifications"?"Notification Preferences":tab==="Security"?"Security & Access":tab==="Integrations"?"Integration Settings":"Account Preferences"}</h3><p>Manage how your Guest Profiling System operates.</p>
        {settingsRows.map(([label,desc])=><div className="gps-setting-row" key={label}><div><b>{label}</b><small>{desc}</small></div>{toggles[label]!==undefined?<button className={`gps-switch ${toggles[label]?"on":""}`} onClick={()=>setToggles({...toggles,[label]:!toggles[label]})} aria-label={`Toggle ${label}`}><i/></button>:<button className="gps-select-button" onClick={()=>onAction(`${label} options opened.`)}>{desc} <ChevronDown size={13}/></button>}</div>)}
      </div></Panel><div className="gps-form-actions"><button className="gps-outline" onClick={()=>onAction("Changes discarded.")}>Cancel</button><button className="gps-primary" onClick={save} disabled={saving}><Save size={14}/> {saving?"Saving…":"Save Changes"}</button></div>
    </div></div>
  </>;
}
function HotelSettings({toggles,setToggles,onAction,onSave,tenantName,pmsConnected}:{toggles:Record<string,boolean>;setToggles:(v:Record<string,boolean>)=>void;onAction:(s:string)=>void;onSave:()=>Promise<void>;tenantName:string;pmsConnected:boolean}) {
  const [saving,setSaving]=useState(false);
  const save=async()=>{setSaving(true);try{await onSave();onAction("Hotel settings saved.");}catch(err){onAction(err instanceof ApiError?err.message:"Could not save hotel settings.");}finally{setSaving(false);}};
  return <><div className="gps-success-banner"><CheckCircle2 size={18}/><div><b>{tenantName} settings</b><small>Workspace configuration is stored in the profiling database.</small></div></div><div className="gps-grid-two"><Panel title="Hotel Information"><InfoRows rows={[["Hotel Name",tenantName],["Hotel Code","—"],["Location","—"],["Timezone","—"],["PMS Provider",pmsConnected?"Connected":"Not connected"]]}/><button className="gps-outline gps-full" onClick={()=>onAction("Hotel information editor opened.")}><Pencil size={14}/> Edit Hotel Information</button></Panel><Panel title="Integration Preferences">{["Auto sync","Guest profile matching","Data retention"].map(t=><div className="gps-setting-row" key={t}><div><b>{t}</b><small>Configure {t.toLowerCase()} for this hotel.</small></div><button className={`gps-switch ${toggles[t]?"on":""}`} onClick={()=>setToggles({...toggles,[t]:!toggles[t]})}><i/></button></div>)}</Panel></div><Panel title="System Defaults"><div className="gps-form-grid"><label>Default language<select className="gps-input"><option>English (United States)</option><option>English (United Kingdom)</option></select></label><label>Timezone<select className="gps-input"><option>Africa/Lagos (WAT)</option><option>UTC</option></select></label><label>Search matching<select className="gps-input"><option>Phone, email and name</option><option>Phone only</option></select></label><label>Sync frequency<select className="gps-input"><option>Every 15 minutes</option><option>Every 30 minutes</option><option>Hourly</option></select></label></div><div className="gps-form-actions"><button className="gps-primary" onClick={save} disabled={saving}><Save size={14}/> {saving?"Saving…":"Save Settings"}</button></div></Panel></>;
}
function Registration({form,setForm,onAction,tenantName,matches}:{form:{name:string;email:string;phone:string;room:string};setForm:(v:{name:string;email:string;phone:string;room:string})=>void;onAction:(s:string)=>void;tenantName:string;matches:GuestLike[]}) {
  const now = new Date();
  const checkIn = now.toISOString().slice(0, 10);
  const checkOut = new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10);
  const brandInitials = tenantName.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "GP";
  return <div className="gps-pms-preview">
    <header className="gps-pms-sitebar"><div className="gps-pms-brand"><span>{brandInitials}</span><b>{tenantName.toUpperCase()}</b><small>HOTEL</small></div><nav><span>Home</span><span>Rooms</span><span>Services</span><span>Offers</span><span>Contact</span></nav><button onClick={()=>onAction("Hotel PMS home opened.")}>Hotel PMS</button></header>
    <div className="gps-pms-hero"><span>{tenantName.toUpperCase()}</span><h1>Guest Registration</h1><p>Welcome back. Complete guest details to continue with check-in.</p></div>
    <div className="gps-registration-wrap"><div className="gps-registration-card"><div className="gps-registration-brand"><Building2 size={22}/><b>{tenantName.toUpperCase()}</b><span>Guest Registration</span></div><h2>Guest Information</h2><p>Enter guest details or select a matched profile to prepare the registration form.</p><div className="gps-form-grid"><label>Full Name<input className="gps-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Enter guest full name"/></label><label>Email Address<input className="gps-input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="guest@email.com"/></label><label>Phone Number<input className="gps-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+234 000 000 0000"/></label><label>Room Type<select className="gps-input" value={form.room} onChange={e=>setForm({...form,room:e.target.value})}><option value="">Select room type</option><option>Deluxe Room</option><option>Executive Suite</option><option>Standard Room</option></select></label><label>Check-in Date<input className="gps-input" type="date" defaultValue={checkIn}/></label><label>Check-out Date<input className="gps-input" type="date" defaultValue={checkOut}/></label></div><label className="gps-checkbox"><input type="checkbox" defaultChecked/> I confirm the guest information has been reviewed.</label><div className="gps-form-actions"><button className="gps-outline" onClick={()=>setForm({name:"",email:"",phone:"",room:""})}>Cancel</button><button className="gps-primary" onClick={()=>onAction(form.name&&form.email?"Guest details prepared. Complete registration in the hotel PMS.":"Please complete the guest name and email fields.")}>Complete Registration <ArrowRight size={14}/></button></div></div><aside className="gps-match-aside"><div className="gps-match-head"><Sparkles size={18}/><b>Guest Profiling</b><span className="gps-pill pill-green">Active</span></div><h3>Returning guest matches</h3><p>As you enter guest information, matching profiles will appear here.</p>{matches.slice(0,3).map((g)=><button className="gps-match-row" key={(g as any).guestId ?? g.email} onClick={()=>{setForm({name:g.name,email:g.email,phone:g.phone,room:"Deluxe Room"});onAction(`${g.name} details filled into the registration form.`);}}><span className="gps-avatar">{g.initials}</span><span><b>{g.name}</b><small>{g.phone}</small></span><ArrowRight size={14}/></button>)}<div className="gps-match-note"><ShieldCheck size={15}/> Guest data is read-only. Your PMS remains the source of truth.</div></aside></div>
  </div>;
}
function Processing() {
  return <div className="gps-state-page"><div className="gps-state-illustration processing-art"><div className="gps-art-card"><Users size={40}/><span/><span/></div><div className="gps-loader-ring"/></div><span className="gps-eyebrow">PLEASE WAIT</span><h2>Searching Guest Profiles...</h2><p>We're securely searching the hotel's guest records and preparing matching profiles.</p><div className="gps-progress"><i/></div><small className="gps-progress-label">Searching database · Matching guest records · Preparing results</small><div className="gps-step-list">{["Searching database","Checking guest details","Preparing results"].map((s,i)=><div key={s} className={i===0?"done":i===1?"current":""}><span>{i===0?<Check size={12}/>:i+1}</span>{s}</div>)}</div></div>;
}
function ErrorState({onAction}:{onAction:(s:string)=>void}) {
  return <div className="gps-state-page"><div className="gps-state-illustration error-art"><div className="gps-error-window"><AlertCircle size={44}/><span>!</span></div></div><span className="gps-eyebrow">REQUEST INTERRUPTED</span><h2>Something went wrong</h2><p>We couldn't complete your request. Please try again or return to guest search.</p><div className="gps-error-code"><span>Error Code</span><b>GP-0017</b><span>·</span><span>Reference: 11NOV26-0942</span><button onClick={()=>onAction("Error reference copied.")}>Copy</button></div><div className="gps-state-actions"><button className="gps-primary" onClick={()=>onAction("Retrying your request...")}><RefreshCw size={14}/> Try Again</button><button className="gps-outline" onClick={()=>window.location.assign("/workspace/guest-search")}><Search size={14}/> Go to Guest Search</button><button className="gps-outline" onClick={()=>window.location.assign("/workspace/dashboard")}><Home size={14}/> Return to Dashboard</button></div></div>;
}
function EmptyState({title,detail,action,onAction}:{title:string;detail:string;action:string;onAction:()=>void}) { return <div className="gps-empty"><Search size={27}/><h3>{title}</h3><p>{detail}</p><button className="gps-outline" onClick={onAction}>{action}</button></div>; }

// Small banner that appears at the top of screens when the UI is showing
// mock data because the live API is unreachable. Helps the demo viewer
// understand they're seeing fallback data, not real guest records.
function DemoDataBanner({onRetry}:{onRetry?:()=>void}) {
  return <div className="gps-demo-banner" role="status" aria-live="polite">
    <Info size={15}/>
    <span>Showing demo data — the live API is unreachable. Run <code>pnpm db:migrate</code> + <code>pnpm seed:source</code> to load real guest records.</span>
    {onRetry && <button className="gps-text-button" onClick={onRetry}>Retry <RefreshCw size={13}/></button>}
  </div>;
}

// Loading state for the search and directory screens.
function LoadingState({label="Loading…"}:{label?:string}) {
  return <div className="gps-empty"><Loader2 size={27} className="gps-spin"/><h3>{label}</h3><p>Fetching from the guest profiling API.</p></div>;
}

// Error state — shown when the API returned an error and no fallback was
// available. Distinguished from the static ErrorState screen (which is one
// of the 17 routes).
function ApiErrorState({message,onRetry}:{message:string;onRetry?:()=>void}) {
  return <div className="gps-empty"><AlertCircle size={27}/><h3>Couldn't load guests</h3><p>{message}</p>{onRetry && <button className="gps-outline" onClick={onRetry}>Retry <RefreshCw size={13}/></button>}</div>;
}

function InfoIcon() { return <Info size={14}/>; }
function Modal({name,guest,form,onClose,onAction,refetchGuests,refetchUsers,refetchTenants,refetchDataRequests}:{
  name:string;
  guest:GuestLike;
  form:{name:string;email:string;phone:string;room:string};
  onClose:()=>void;
  onAction:(s:string)=>void;
  refetchGuests?:()=>void;
  refetchUsers?:()=>void;
  refetchTenants?:()=>void;
  refetchDataRequests?:()=>void;
}) {
  const titles:Record<string,string>={"guest-detail":"Guest Profile","add-guest":"Add Guest","edit-guest":"Edit Guest Profile","invite-user":"Invite Team Member","add-hotel":"Add Hotel Workspace","new-request":"Create Data Request",account:"Account"};
  const title=titles[name]??"Details";

  const [inviteEmail,setInviteEmail]=useState("");
  const [invitePassword,setInvitePassword]=useState("");
  const [inviteRole,setInviteRole]=useState("Receptionist");
  const [hotelName,setHotelName]=useState("");
  const [requestEmail,setRequestEmail]=useState(guest.email!=="—"?guest.email:"");
  const [requestType,setRequestType]=useState("ACCESS");
  const [requestDescription,setRequestDescription]=useState("");
  const editing = name !== "add-guest";
  const [firstName,setFirstName]=useState(editing?(form.name.split(" ")[0]??""):"");
  const [lastName,setLastName]=useState(editing?form.name.split(" ").slice(1).join(" "):"");
  const [editEmail,setEditEmail]=useState(editing&&form.email!=="—"?form.email:"");
  const [editPhone,setEditPhone]=useState(editing&&form.phone!=="—"?form.phone:"");
  const [submitting,setSubmitting]=useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (name==="invite-user") {
        await api.createUser(inviteEmail.trim(), invitePassword, [inviteRole]);
        refetchUsers?.();
        onAction("Team member invited.");
      } else if (name==="add-hotel") {
        await api.createTenant(hotelName.trim());
        refetchTenants?.();
        onAction("Hotel workspace created.");
      } else if (name==="new-request") {
        await api.createDataRequest({
          guestEmail: requestEmail.trim(),
          type: requestType as "ACCESS"|"EXPORT"|"CORRECTION"|"DELETION",
          description: requestDescription.trim()||undefined,
        });
        refetchDataRequests?.();
        onAction("Data request created.");
      } else if (name==="add-guest") {
        await api.createGuest({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim()||undefined,
        });
        refetchGuests?.();
        onAction("Guest profile created.");
      } else {
        const guestId = "guestId" in guest ? guest.guestId : null;
        if (!guestId) throw new Error("This demo guest has no database id.");
        await api.updateGuest(guestId, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim()||undefined,
        });
        refetchGuests?.();
        onAction("Guest profile updated.");
      }
      onClose();
    } catch (err) {
      onAction(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSubmitting(false);
    }
  };

  let fields: ReactNode;
  if (name==="invite-user") {
    fields = <>
      <label>Email address<input className="gps-input" type="email" required value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="name@hotel.com"/></label>
      <label>Temporary password<input className="gps-input" type="password" required minLength={8} value={invitePassword} onChange={e=>setInvitePassword(e.target.value)} placeholder="At least 8 characters"/></label>
      <label>Role<select className="gps-input" value={inviteRole} onChange={e=>setInviteRole(e.target.value)}><option value="Receptionist">Receptionist</option><option value="RegionalManager">Hotel Manager</option><option value="Admin">Administrator</option></select></label>
    </>;
  } else if (name==="add-hotel") {
    fields = <label>Hotel name<input className="gps-input" required value={hotelName} onChange={e=>setHotelName(e.target.value)} placeholder="e.g. Lakeside Suites"/></label>;
  } else if (name==="new-request") {
    fields = <>
      <label>Guest email<input className="gps-input" type="email" required value={requestEmail} onChange={e=>setRequestEmail(e.target.value)} placeholder="guest@example.com"/></label>
      <label>Request type<select className="gps-input" value={requestType} onChange={e=>setRequestType(e.target.value)}><option value="ACCESS">Data Access</option><option value="EXPORT">Data Export</option><option value="CORRECTION">Correction</option><option value="DELETION">Deletion</option></select></label>
      <label>Description<textarea className="gps-input" rows={3} value={requestDescription} onChange={e=>setRequestDescription(e.target.value)} placeholder="What should be done?"/></label>
    </>;
  } else {
    fields = <>
      <label>First name<input className="gps-input" required value={firstName} onChange={e=>setFirstName(e.target.value)}/></label>
      <label>Last name<input className="gps-input" required value={lastName} onChange={e=>setLastName(e.target.value)}/></label>
      <label>Email address<input className="gps-input" type="email" required value={editEmail} onChange={e=>setEditEmail(e.target.value)}/></label>
      <label>Phone number<input className="gps-input" value={editPhone} onChange={e=>setEditPhone(e.target.value)}/></label>
    </>;
  }

  return <div className="gps-modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="gps-modal"><div className="gps-modal-head"><h2>{title}</h2><button onClick={onClose} aria-label="Close"><X size={18}/></button></div>
    {name==="guest-detail"?<><div className="gps-profile-hero modal-profile"><span className="gps-avatar gps-avatar-xl">{guest.initials}</span><div className="gps-profile-name"><h2>{guest.name}</h2><p>{guest.email}</p><small>{guest.phone}</small></div></div><InfoRows rows={[["Guest ID",("guestId" in guest ? guest.guestId : "GPS-2026-001284")],["Hotel",guest.hotel],["Total visits",String(guest.visits)],["Last visit",guest.last],["Guest status",guest.status]]}/><div className="gps-form-actions"><button className="gps-outline" onClick={onClose}>Close</button><button className="gps-primary" onClick={()=>{onClose();window.location.assign("/workspace/guest-profile");}}>Open Full Profile <ArrowRight size={14}/></button></div></>
    :name==="account"?<><div className="gps-account-menu"><div className="gps-person"><span className="gps-avatar gps-avatar-large">AO</span><span><b>Admin Operator</b><small>admin@guestprofiling.com</small></span></div><button onClick={()=>{onClose();window.location.assign("/workspace/settings");}}><Settings size={15}/> Account settings</button><button onClick={()=>{onClose();window.location.assign("/login");}}><LogOut size={15}/> Sign out</button></div></>
    :<form onSubmit={submit}><div className="gps-modal-fields">{fields}</div><div className="gps-form-actions"><button type="button" className="gps-outline" onClick={onClose}>Cancel</button><button className="gps-primary" type="submit" disabled={submitting}><Check size={14}/> {submitting?"Saving…":"Save"}</button></div></form>}
  </div></div>;
}
