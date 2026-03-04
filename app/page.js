'use client';

import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════
   KICKOFF ⚽  –  Aplicație Fotbal Amateur  –  Persistent + CRUD
   Storage: window.storage API (Artifacts) → migrabil la Supabase
   ═══════════════════════════════════════════════════════════════════ */

// ─── STYLES GLOBALE ───────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&family=Barlow:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #040d16; color: #e2e8f0; font-family: 'Barlow', sans-serif; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 2px; }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes slideUp  { from { opacity:0; transform:translate(-50%,20px); } to { opacity:1; transform:translate(-50%,0); } }
  @keyframes pulse    { 0%,100%{transform:scale(1);opacity:.3;} 50%{transform:scale(2.5);opacity:0;} }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes popIn    { 0%{transform:scale(.8);opacity:0;} 60%{transform:scale(1.05);} 100%{transform:scale(1);opacity:1;} }
  input[type="date"]::-webkit-calendar-picker-indicator,
  input[type="time"]::-webkit-calendar-picker-indicator { filter:invert(.4); cursor:pointer; }
  input::placeholder, textarea::placeholder { color: #2d4a6a !important; }
  button { font-family: 'Barlow Condensed', sans-serif; }
  .fade-up { animation: fadeUp .35s ease both; }
`;

// ─── CONSTANTE ────────────────────────────────────────────────────
const POZITII      = ["PO","FD","MF","ÎN"];
const POZITII_FULL = { PO:"Portar", FD:"Fundaș", MF:"Mijlocaș", ÎN:"Înaintas" };
const CULORI_POZ   = { PO:"#f59e0b", FD:"#3b82f6", MF:"#10b981", ÎN:"#ef4444" };
const CULORI_POOL  = ["#00f5a0","#00d4ff","#ff6b35","#a855f7","#f59e0b","#ec4899","#14b8a6","#6366f1","#84cc16","#f43f5e","#fb923c","#38bdf8"];

const INSIGNE_DEF = {
  golgheter:        { label:"⚽ Golgheter",            culoare:"#f59e0b", desc:"10+ goluri într-un sezon" },
  zid_aparare:      { label:"🧱 Zidul Apărării",       culoare:"#3b82f6", desc:"Cel mai bun fundaș" },
  creier:           { label:"🎯 Creierul Jocului",     culoare:"#10b981", desc:"15+ pase decisive" },
  clutch:           { label:"⚡ Jucătorul Cheie",      culoare:"#f97316", desc:"Gol în 5 victorii consecutive" },
  ronaldo_duminica: { label:"👑 Ronaldo de Duminică",  culoare:"#a855f7", desc:"Cel mai bine cotat" },
  magnet_carton:    { label:"🟥 Magnetul Cartonașelor",culoare:"#ef4444", desc:"3+ cartonașe roșii" },
  iron_man:         { label:"🦾 Iron Man",             culoare:"#8b5cf6", desc:"20+ meciuri consecutive" },
  imbatabil:        { label:"🛡️ Imbatabil",            culoare:"#06b6d4", desc:"10 victorii la rând" },
};

// ─── DATE IMPLICITE ────────────────────────────────────────────────
const JUCATORI_DEFAULT = [
  { id:"j1", nume:"Alexandru Popescu", initiale:"AP", poza:"ÎN", picior:"D", rating:8.4, goluri:34, pase:12, victorii:28, meciuri:42, mvp:9,  culoare:"#00f5a0", insigne:["golgheter","clutch"],        forma:[9,8,7,9,8], seria:3, bio:"Atacant rapid cu fler deosebit pentru gol." },
  { id:"j2", nume:"Radu Ionescu",       initiale:"RI", poza:"PO", picior:"D", rating:7.9, goluri:1,  pase:2,  victorii:25, meciuri:38, mvp:11, culoare:"#00d4ff", insigne:["zid_aparare","ronaldo_duminica"], forma:[8,9,7,8,9], seria:5, bio:"Portar reflexiv, liderul echipei." },
  { id:"j3", nume:"Marco Dumitrescu",   initiale:"MD", poza:"MF", picior:"S", rating:8.1, goluri:18, pase:27, victorii:30, meciuri:44, mvp:7,  culoare:"#ff6b35", insigne:["creier"],                     forma:[7,8,9,8,7], seria:2, bio:"Mijlocaș vizionar, distributorul echipei." },
  { id:"j4", nume:"Ionuț Gheorghe",     initiale:"IG", poza:"FD", picior:"D", rating:7.5, goluri:5,  pase:8,  victorii:22, meciuri:36, mvp:3,  culoare:"#a855f7", insigne:["zid_aparare"],                forma:[7,6,8,7,8], seria:0, bio:"Fundaș solid, dur la duel." },
  { id:"j5", nume:"Luca Bălan",         initiale:"LB", poza:"ÎN", picior:"D", rating:7.8, goluri:22, pase:19, victorii:26, meciuri:40, mvp:5,  culoare:"#f59e0b", insigne:["golgheter"],                  forma:[8,7,8,6,9], seria:1, bio:"Extremă dinamică, dublu amenințare." },
  { id:"j6", nume:"Karim Stancu",       initiale:"KS", poza:"ÎN", picior:"S", rating:8.2, goluri:29, pase:14, victorii:27, meciuri:41, mvp:8,  culoare:"#ec4899", insigne:["clutch","creier"],             forma:[9,9,8,7,9], seria:4, bio:"Tehnic și creativ. 'Balotelli de București'." },
  { id:"j7", nume:"Toma Niculescu",     initiale:"TN", poza:"MF", picior:"D", rating:7.6, goluri:8,  pase:16, victorii:21, meciuri:35, mvp:2,  culoare:"#14b8a6", insigne:["magnet_carton"],              forma:[6,7,8,7,6], seria:0, bio:"Midfielder de luptă, câștigă fiecare minge." },
  { id:"j8", nume:"Bogdan Ciobanu",     initiale:"BC", poza:"ÎN", picior:"D", rating:7.3, goluri:15, pase:9,  victorii:18, meciuri:32, mvp:4,  culoare:"#6366f1", insigne:["golgheter"],                  forma:[7,6,7,8,7], seria:1, bio:"Centru mobil, goluri importante în momente cheie." },
];

const MECIURI_DEFAULT = [
  { id:"m1", data:"2026-02-28", format:"5v5", locatie:"Terenul Tineretului, București",
    echipaA:["j1","j3","j5","j7"], echipaB:["j2","j4","j6","j8"],
    golA:5, golB:3, mvp:"j1",
    goluri:[{jucator:"j1",count:3},{jucator:"j5",count:2},{jucator:"j6",count:2},{jucator:"j8",count:1}],
    pase:[{jucator:"j3",count:2},{jucator:"j7",count:1}],
    comentarii:[{autor:"Alexandru Popescu",text:"Hat-trick! Ziua perfectă! 🔥",timp:"acum 2h"}],
    cartonaseG:["j7"], cartonaseR:[], finalizat:true },
  { id:"m2", data:"2026-02-21", format:"5v5", locatie:"Sala Polivalentă Nord",
    echipaA:["j2","j4","j6","j8"], echipaB:["j1","j3","j5","j7"],
    golA:4, golB:4, mvp:"j2",
    goluri:[{jucator:"j6",count:2},{jucator:"j8",count:2},{jucator:"j1",count:2},{jucator:"j3",count:2}],
    pase:[{jucator:"j7",count:2}],
    comentarii:[{autor:"Radu Ionescu",text:"Remiză perfectă, ambele echipe au meritat!",timp:"acum 5 zile"}],
    cartonaseG:["j3"], cartonaseR:[], finalizat:true },
];

const USER_DEFAULT = { id:"u1", nume:"Admin", email:"admin@kickoff.ro", avatar:"⚽", culoare:"#00f5a0", rol:"admin" };

// ─── STORAGE LAYER (Artifacts API → swap cu Supabase) ────────────
const DB = {
  async get(key) {
    try {
      const r = await window.storage.get(key, true);
      return r ? JSON.parse(r.value) : null;
    } catch { return null; }
  },
  async set(key, val) {
    try {
      await window.storage.set(key, JSON.stringify(val), true);
      return true;
    } catch { return false; }
  },
  async getJucatori()  { return (await DB.get("kickoff:jucatori"))  || JUCATORI_DEFAULT; },
  async getMeciuri()   { return (await DB.get("kickoff:meciuri"))   || MECIURI_DEFAULT;  },
  async getUsers()     { return (await DB.get("kickoff:users"))     || [USER_DEFAULT];   },
  async saveJucatori(d){ return DB.set("kickoff:jucatori", d); },
  async saveMeciuri(d) { return DB.set("kickoff:meciuri",  d); },
  async saveUsers(d)   { return DB.set("kickoff:users",    d); },
};

// ─── UTILITARE ────────────────────────────────────────────────────
const uid  = () => Math.random().toString(36).slice(2,10);
const getJ = (id, lista) => lista?.find(j => j.id === id);
const culoareForma = v => v >= 9 ? "#00f5a0" : v >= 7 ? "#f59e0b" : "#ef4444";
const initiale = name => name.trim().split(" ").slice(0,2).map(p=>p[0]?.toUpperCase()||"").join("");
const dataRo = iso => {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("ro-RO", {day:"numeric",month:"short",year:"numeric"}); }
  catch { return iso; }
};
const genEchipeBalansate = jucatori => {
  const sorted = [...jucatori].sort((a,b) => {
    const s = j => .5*j.rating + .2*(j.goluri/Math.max(j.meciuri,1)) + .15*(j.pase/Math.max(j.meciuri,1)) + .15*(j.victorii/Math.max(j.meciuri,1));
    return s(b)-s(a);
  });
  const a=[], b=[];
  sorted.forEach((j,i) => (i%2===0?a:b).push(j));
  return [a,b];
};
const genEchipeAleator = jucatori => {
  const s = [...jucatori].sort(()=>Math.random()-.5);
  const h = Math.ceil(s.length/2);
  return [s.slice(0,h), s.slice(h)];
};

// ─── DESIGN TOKENS ────────────────────────────────────────────────
const C = {
  bg0:"#040d16", bg1:"#0a1628", bg2:"#0d1e35", bg3:"#112440",
  border:"#1a3050", borderHover:"#2a5080",
  text:"#e2e8f0", textMuted:"#4a7090", textFaint:"#1e3a5f",
  green:"#00f5a0", cyan:"#00c8ff", yellow:"#f59e0b",
  red:"#ef4444", blue:"#3b82f6", purple:"#a855f7",
};

// ════════════════════════════════════════════════════════════════════
//  COMPONENTE UI DE BAZĂ
// ════════════════════════════════════════════════════════════════════

const Avatar = ({ j, size=42, noGlow=false }) => (
  <div style={{
    width:size, height:size, borderRadius:"50%", flexShrink:0,
    background:`radial-gradient(circle at 35% 35%, ${j.culoare}30, ${j.culoare}10)`,
    border:`2px solid ${j.culoare}70`,
    boxShadow: noGlow ? "none" : `0 0 14px ${j.culoare}25`,
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:size*.28, fontWeight:900, color:j.culoare,
    fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:.5,
    userSelect:"none",
  }}>{j.initiale}</div>
);

const AvatarPhoto = ({ j, size=42 }) => (
  j.foto
    ? <img src={j.foto} alt={j.nume} style={{ width:size,height:size,borderRadius:"50%",objectFit:"cover",border:`2px solid ${j.culoare}70`,flexShrink:0 }} onError={e=>{e.target.style.display="none";}} />
    : <Avatar j={j} size={size} />
);

const Forma = ({ forma, small=false }) => (
  <div style={{ display:"flex", gap:small?2:3, alignItems:"flex-end" }}>
    {forma.map((v,i) => (
      <div key={i} style={{ width:small?4:6, borderRadius:2, background:culoareForma(v),
        height:small?(4+v*1.2):(6+v*2.2), transition:"height .4s" }} />
    ))}
  </div>
);

const Badge = ({ cheie, small=false }) => {
  const b = INSIGNE_DEF[cheie]; if (!b) return null;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:3,
      background:`${b.culoare}15`, border:`1px solid ${b.culoare}40`,
      borderRadius:small?6:8, padding:small?"2px 7px":"5px 11px",
      fontSize:small?10:12, color:b.culoare, fontWeight:700,
      fontFamily:"'Barlow Condensed',sans-serif", whiteSpace:"nowrap" }}>
      {b.label}
    </span>
  );
};

const Btn = ({ children, onClick, v="primary", full=false, sm=false, disabled=false, style:sx={}, type="button" }) => {
  const vars = {
    primary:  "linear-gradient(135deg,#00f5a0,#00c896)",
    secondary:`background:${C.bg2}`,
    danger:   "linear-gradient(135deg,#ef4444,#dc2626)",
    ghost:    "transparent",
    outline:  "transparent",
  };
  const colors = { primary:"#040d16", secondary:C.text, danger:"#fff", ghost:C.text, outline:C.green };
  const borders = { primary:"none", secondary:`1px solid ${C.border}`, danger:"none", ghost:"none", outline:`1px solid ${C.green}50` };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      background: v==="secondary"?C.bg2 : v==="ghost"?"transparent" : v==="outline"?"transparent" : vars[v],
      color: colors[v], border: borders[v],
      borderRadius:10, padding:sm?"8px 16px":"12px 22px",
      fontSize:sm?11:13, fontWeight:800, letterSpacing:.5,
      cursor:disabled?"not-allowed":"pointer", width:full?"100%":"auto",
      opacity:disabled?.5:1, transition:"all .18s",
      fontFamily:"'Barlow Condensed',sans-serif",
      display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6,
      ...sx,
    }}
    onMouseEnter={e=>{ if(!disabled){ e.currentTarget.style.filter="brightness(1.12)"; e.currentTarget.style.transform="translateY(-1px)"; }}}
    onMouseLeave={e=>{ e.currentTarget.style.filter=""; e.currentTarget.style.transform=""; }}
    >{children}</button>
  );
};

const Input = ({ label, value, onChange, placeholder, type="text", rows, required, style:sx={} }) => {
  const [focus, setFocus] = useState(false);
  const base = {
    width:"100%", background:C.bg1, color:C.text, fontSize:13,
    border:`1px solid ${focus?"#00f5a050":C.border}`,
    borderRadius:10, padding:"12px 14px", outline:"none",
    fontFamily:"'Barlow',sans-serif", transition:"border-color .2s", ...sx,
  };
  return (
    <div>
      {label && <div style={{ fontSize:10, color:C.textMuted, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>{label}{required&&<span style={{color:C.red}}> *</span>}</div>}
      {rows
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ ...base, resize:"vertical" }}
            onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} />
        : <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={base}
            onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} />
      }
    </div>
  );
};

const Select = ({ label, value, onChange, options }) => {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      {label && <div style={{ fontSize:10, color:C.textMuted, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>{label}</div>}
      <select value={value} onChange={onChange} style={{
        width:"100%", background:C.bg1, color:C.text, fontSize:13,
        border:`1px solid ${focus?"#00f5a050":C.border}`,
        borderRadius:10, padding:"12px 14px", outline:"none",
        fontFamily:"'Barlow',sans-serif",
      }}
      onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}>
        {options.map(([v,l])=><option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
};

const Modal = ({ titlu, onClose, children, wide=false }) => (
  <div style={{ position:"fixed", inset:0, background:"#000a", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center", animation:"fadeIn .2s" }}
    onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{
      background:C.bg1, borderRadius:"20px 20px 0 0",
      border:`1px solid ${C.border}`, borderBottom:"none",
      width:"100%", maxWidth:wide?640:480, maxHeight:"92vh",
      overflowY:"auto", animation:"slideUp .3s ease",
      padding:"0 0 env(safe-area-inset-bottom,0)",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px 14px", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, background:C.bg1, zIndex:1 }}>
        <div style={{ fontSize:17, fontWeight:900, color:C.text, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1 }}>{titlu}</div>
        <button onClick={onClose} style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:8, width:32, height:32, cursor:"pointer", color:C.textMuted, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
      </div>
      <div style={{ padding:"18px 20px 28px" }}>{children}</div>
    </div>
  </div>
);

const Card = ({ children, style:sx={}, onClick, glow }) => (
  <div onClick={onClick} style={{
    background:`linear-gradient(145deg,${C.bg2},${C.bg1})`,
    border:`1px solid ${glow?glow+"30":C.border}`,
    borderRadius:16, padding:16, transition:"all .2s",
    cursor:onClick?"pointer":"default",
    boxShadow: glow?`0 4px 20px ${glow}15`:"none",
    ...sx,
  }}
  onMouseEnter={e=>{ if(onClick){ e.currentTarget.style.borderColor=glow?glow+"60":C.borderHover; e.currentTarget.style.transform="translateY(-2px)"; }}}
  onMouseLeave={e=>{ e.currentTarget.style.borderColor=glow?glow+"30":C.border; e.currentTarget.style.transform=""; }}
  >{children}</div>
);

const Stat = ({ icon, val, label, color=C.text }) => (
  <div style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 8px", textAlign:"center" }}>
    <div style={{ fontSize:16, marginBottom:3 }}>{icon}</div>
    <div style={{ fontSize:20, fontWeight:900, color, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>{val}</div>
    <div style={{ fontSize:9, color:C.textMuted, marginTop:2, textTransform:"uppercase", letterSpacing:.5 }}>{label}</div>
  </div>
);

const PulseDot = ({ color=C.green }) => (
  <div style={{ position:"relative", width:8, height:8, flexShrink:0 }}>
    <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:color, opacity:.3, animation:"pulse 2s infinite" }} />
    <div style={{ position:"absolute", inset:2, borderRadius:"50%", background:color }} />
  </div>
);

const Spinner = () => (
  <div style={{ textAlign:"center", padding:40 }}>
    <div style={{ width:32, height:32, border:`3px solid ${C.bg3}`, borderTopColor:C.green, borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 12px" }} />
    <div style={{ fontSize:12, color:C.textMuted }}>Se încarcă...</div>
  </div>
);

const Toast = ({ toast }) => {
  if (!toast) return null;
  const c = { success:C.green, error:C.red, info:C.blue }[toast.tip]||C.green;
  return (
    <div style={{ position:"fixed", bottom:88, left:"50%", transform:"translateX(-50%)", background:C.bg2, border:`1px solid ${c}50`, borderRadius:12, padding:"11px 20px", fontSize:13, color:C.text, fontWeight:700, zIndex:9999, boxShadow:"0 8px 32px #0008", animation:"slideUp .3s ease", whiteSpace:"nowrap", fontFamily:"'Barlow Condensed',sans-serif" }}>
      {toast.tip==="success"?"✅ ":toast.tip==="error"?"❌ ":"ℹ️ "}{toast.msg}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
//  CARD FIFA JUCĂTOR
// ════════════════════════════════════════════════════════════════════
const CardFIFA = ({ j, onClick }) => {
  const pct = Math.round(j.victorii/Math.max(j.meciuri,1)*100);
  return (
    <div onClick={()=>onClick&&onClick(j)} style={{
      width:148, height:215, borderRadius:14, flexShrink:0, position:"relative",
      overflow:"hidden", cursor:onClick?"pointer":"default",
      background:`linear-gradient(160deg,#0e1e30,#08121e)`,
      border:`1.5px solid ${j.culoare}55`,
      boxShadow:`0 6px 28px ${j.culoare}28`,
      transition:"transform .25s, box-shadow .25s",
    }}
    onMouseEnter={e=>{ if(onClick){ e.currentTarget.style.transform="translateY(-7px) scale(1.04)"; e.currentTarget.style.boxShadow=`0 18px 48px ${j.culoare}50`; }}}
    onMouseLeave={e=>{ e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=`0 6px 28px ${j.culoare}28`; }}
    >
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 75% 20%, ${j.culoare}22,transparent 60%)` }} />
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${j.culoare},transparent)` }} />
      <div style={{ position:"absolute", top:11, left:11 }}>
        <div style={{ fontSize:28, fontWeight:900, color:j.culoare, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1 }}>{j.rating}</div>
        <div style={{ fontSize:11, color:j.culoare, fontWeight:700, opacity:.9 }}>{j.poza}</div>
      </div>
      <div style={{ position:"absolute", top:10, right:10 }}>
        <AvatarPhoto j={j} size={46} />
      </div>
      {j.seria>0 && <div style={{ position:"absolute", top:64, left:11, fontSize:9, color:"#f59e0b", background:"#f59e0b18", padding:"2px 6px", borderRadius:20, fontWeight:700 }}>🔥{j.seria}</div>}
      <div style={{ position:"absolute", top:72, left:11 }}><Forma forma={j.forma} small /></div>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"9px 10px", background:"linear-gradient(to top,#000d,#0007,transparent)" }}>
        <div style={{ fontSize:11, fontWeight:900, color:"#fff", fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:1, textAlign:"center", marginBottom:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{j.nume.split(" ")[0].toUpperCase()}</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:2 }}>
          {[["G",j.goluri],["A",j.pase],["V%",pct]].map(([l,v])=>(
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:13, fontWeight:900, color:"#fff", fontFamily:"'Barlow Condensed',sans-serif" }}>{v}</div>
              <div style={{ fontSize:8, color:j.culoare, fontWeight:700 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
//  CARD MECI
// ════════════════════════════════════════════════════════════════════
const CardMeci = ({ m, jucatori, onClick }) => {
  const mvpJ = getJ(m.mvp, jucatori);
  const vA = m.golA > m.golB, vB = m.golB > m.golA;
  return (
    <Card onClick={()=>onClick&&onClick(m)} glow={vA?C.blue:vB?C.red:null}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <span style={{ fontSize:10, color:C.textMuted }}>📅 {dataRo(m.data)} · {m.format}</span>
        {mvpJ && <span style={{ fontSize:10, color:"#f59e0b", background:"#f59e0b12", padding:"2px 8px", borderRadius:20, fontWeight:700 }}>👑 {mvpJ.nume.split(" ")[0]}</span>}
        {m.finalizat===false && <span style={{ fontSize:9, color:C.green, background:`${C.green}15`, padding:"2px 8px", borderRadius:20, fontWeight:700 }}>⏳ Planificat</span>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:9, color:C.blue, fontWeight:800, letterSpacing:1, marginBottom:4 }}>ECHIPA A</div>
          <div style={{ display:"flex" }}>
            {m.echipaA.slice(0,4).map((id,i) => { const j=getJ(id,jucatori); if(!j)return null; return <div key={id} style={{ width:20,height:20,borderRadius:"50%",background:`${j.culoare}20`,border:`1.5px solid ${j.culoare}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:6,color:j.culoare,fontWeight:900,marginLeft:i>0?-4:0,zIndex:10-i }}>{j.initiale}</div>; })}
          </div>
        </div>
        <div style={{ textAlign:"center", padding:"0 8px" }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:34, letterSpacing:3, lineHeight:1 }}>
            <span style={{ color:vA?C.green:m.golA>0?C.text:C.textFaint }}>{m.golA}</span>
            <span style={{ color:C.textFaint, fontSize:20, padding:"0 3px" }}>–</span>
            <span style={{ color:vB?C.green:m.golB>0?C.text:C.textFaint }}>{m.golB}</span>
          </div>
        </div>
        <div style={{ flex:1, textAlign:"right" }}>
          <div style={{ fontSize:9, color:C.red, fontWeight:800, letterSpacing:1, marginBottom:4 }}>ECHIPA B</div>
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            {m.echipaB.slice(0,4).map((id,i) => { const j=getJ(id,jucatori); if(!j)return null; return <div key={id} style={{ width:20,height:20,borderRadius:"50%",background:`${j.culoare}20`,border:`1.5px solid ${j.culoare}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:6,color:j.culoare,fontWeight:900,marginLeft:i>0?-4:0,zIndex:10-i }}>{j.initiale}</div>; })}
          </div>
        </div>
      </div>
      {m.locatie && <div style={{ fontSize:10, color:C.textFaint, marginTop:8, paddingTop:8, borderTop:`1px solid ${C.border}` }}>📍 {m.locatie}</div>}
    </Card>
  );
};

// ════════════════════════════════════════════════════════════════════
//  MODAL: EDITARE JUCĂTOR
// ════════════════════════════════════════════════════════════════════
const ModalEditJucator = ({ jucator, onSave, onDelete, onClose }) => {
  const isNou = !jucator?.id;
  const [form, setForm] = useState(jucator || { nume:"", poza:"MF", picior:"D", bio:"", culoare:"#00f5a0", foto:"" });
  const [confirmaStergere, setConfirmaStergere] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleFoto = e => {
    const file = e.target.files?.[0]; if(!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = ev => { set("foto", ev.target.result); setUploading(false); };
    reader.readAsDataURL(file);
  };

  const salveaza = () => {
    if (!form.nume.trim()) return;
    const ini = initiale(form.nume);
    onSave({ ...form, initiale:ini, id: jucator?.id || "j"+uid() });
  };

  return (
    <Modal titlu={isNou ? "➕ Jucător Nou" : "✏️ Editează Jucătorul"} onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {/* Foto + avatar preview */}
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <AvatarPhoto j={form.initiale?form:{...form,initiale:initiale(form.nume)||"?"}} size={64} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:C.textMuted, fontWeight:700, letterSpacing:1, marginBottom:6 }}>FOTOGRAFIE PROFIL</div>
            <Btn sm onClick={()=>fileRef.current?.click()} disabled={uploading}>
              {uploading?"Se încarcă...":"📷 Încarcă Poza"}
            </Btn>
            {form.foto && <Btn sm v="ghost" onClick={()=>set("foto","")} sx={{marginLeft:6,color:C.red}}>✕ Șterge</Btn>}
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFoto} />
          </div>
        </div>

        <Input label="Nume Complet" value={form.nume} onChange={e=>set("nume",e.target.value)} placeholder="Ion Popescu" required />

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Select label="Poziție" value={form.poza} onChange={e=>set("poza",e.target.value)}
            options={POZITII.map(p=>[p,POZITII_FULL[p]])} />
          <Select label="Picior Dominant" value={form.picior} onChange={e=>set("picior",e.target.value)}
            options={[["D","⚽ Drept"],["S","⚽ Stâng"]]} />
        </div>

        {/* Culoare */}
        <div>
          <div style={{ fontSize:10, color:C.textMuted, fontWeight:700, letterSpacing:1, marginBottom:8 }}>CULOARE JUCĂTOR</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {CULORI_POOL.map(c=>(
              <div key={c} onClick={()=>set("culoare",c)} style={{ width:28, height:28, borderRadius:"50%", background:c, cursor:"pointer", border:form.culoare===c?`3px solid #fff`:"3px solid transparent", transition:"border .15s", boxShadow:form.culoare===c?`0 0 12px ${c}80`:"none" }} />
            ))}
          </div>
        </div>

        <Input label="Bio / Descriere" value={form.bio} onChange={e=>set("bio",e.target.value)} placeholder="Câteva cuvinte despre stilul de joc..." rows={2} />

        <div style={{ display:"flex", gap:10 }}>
          <Btn full onClick={salveaza} disabled={!form.nume.trim()}>
            {isNou?"➕ Adaugă Jucătorul":"💾 Salvează Modificările"}
          </Btn>
        </div>

        {!isNou && (
          confirmaStergere
            ? <div style={{ background:"#ef444415", border:"1px solid #ef444440", borderRadius:12, padding:14, textAlign:"center" }}>
                <div style={{ fontSize:13, color:C.red, marginBottom:12, fontWeight:700 }}>Ești sigur că vrei să ștergi jucătorul?</div>
                <div style={{ display:"flex", gap:8 }}>
                  <Btn full v="secondary" onClick={()=>setConfirmaStergere(false)}>Anulează</Btn>
                  <Btn full v="danger" onClick={()=>onDelete(jucator.id)}>🗑️ Șterge Definitiv</Btn>
                </div>
              </div>
            : <Btn full v="ghost" onClick={()=>setConfirmaStergere(true)} style={{ color:C.red, fontSize:12 }}>🗑️ Șterge Jucătorul</Btn>
        )}
      </div>
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════════
//  MODAL: CREARE / EDITARE MECI
// ════════════════════════════════════════════════════════════════════
const ModalMeci = ({ meci, jucatori, onSave, onDelete, onClose }) => {
  const isNou = !meci?.id;
  const empty = { format:"5v5", locatie:"", data:new Date().toISOString().slice(0,10), ora:"20:00", echipaA:[], echipaB:[], golA:0, golB:0, mvp:null, goluri:[], pase:[], comentarii:[], cartonaseG:[], cartonaseR:[], finalizat:false };
  const [form, setForm] = useState(meci||empty);
  const [pas, setPas] = useState(1);
  const [modEchipe, setModEchipe] = useState("manual");
  const [selectati, setSelectati] = useState(meci?[...meci.echipaA,...meci.echipaB]:[]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const toggleSel = id => setSelectati(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const toggleEchipa = (id, echipa) => {
    const altaEchipa = echipa==="A"?"echipaB":"echipaA";
    setForm(f => {
      const inAlta = f[`echipa${altaEchipa.slice(-1)}`].includes(id);
      if(inAlta) return f;
      const inAcesta = f[`echipa${echipa}`].includes(id);
      return { ...f, [`echipa${echipa}`]: inAcesta ? f[`echipa${echipa}`].filter(x=>x!==id) : [...f[`echipa${echipa}`],id] };
    });
  };
  const setGolJucator = (id, count) => {
    setForm(f => {
      const goluri = f.goluri.filter(g=>g.jucator!==id);
      if(count>0) goluri.push({jucator:id,count});
      return {...f, goluri};
    });
  };
  const setMVP = id => set("mvp", form.mvp===id?null:id);

  const genereaza = () => {
    const pool = jucatori.filter(j=>selectati.includes(j.id));
    const [a,b] = modEchipe==="balansat" ? genEchipeBalansate(pool) : genEchipeAleator(pool);
    setForm(f=>({...f, echipaA:a.map(j=>j.id), echipaB:b.map(j=>j.id)}));
  };

  const salveaza = () => {
    onSave({ ...form, id:meci?.id||"m"+uid(), finalizat:true });
  };

  const toatiSel = [...form.echipaA,...form.echipaB];

  return (
    <Modal titlu={isNou?"➕ Meci Nou":"⚽ Editează Meciul"} onClose={onClose} wide>
      {/* Progress */}
      {isNou && (
        <div style={{ display:"flex", gap:4, marginBottom:20 }}>
          {["Detalii","Jucători","Echipe","Scor & MVP"].map((l,i)=>(
            <div key={i} style={{ flex:1, textAlign:"center" }}>
              <div style={{ height:3, borderRadius:2, background:i<pas?"linear-gradient(90deg,#00f5a0,#00c8ff)":C.border, transition:"background .3s", marginBottom:4 }} />
              <div style={{ fontSize:9, color:i+1===pas?C.green:C.textMuted, fontWeight:700 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* PAS 1: Detalii */}
      {(isNou?pas===1:true) && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {isNou && <div style={{ fontSize:16, fontWeight:900, color:C.text, fontFamily:"'Barlow Condensed',sans-serif", marginBottom:4 }}>DETALII MECI</div>}

          <div style={{ display:"flex", gap:8 }}>
            {["5v5","6v6","7v7"].map(f=>(
              <button key={f} onClick={()=>set("format",f)} style={{
                flex:1, padding:"14px 8px", borderRadius:12,
                background:form.format===f?"#00f5a015":C.bg1,
                border:`2px solid ${form.format===f?C.green:C.border}`,
                color:form.format===f?C.green:C.textMuted,
                fontSize:18, fontWeight:900, cursor:"pointer",
                fontFamily:"'Barlow Condensed',sans-serif", transition:"all .2s",
              }}>{f}</button>
            ))}
          </div>

          <Input label="Locație" value={form.locatie} onChange={e=>set("locatie",e.target.value)} placeholder="Terenul Tineretului, Sector 3" />

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <Input label="Data" type="date" value={form.data} onChange={e=>set("data",e.target.value)} />
            <Input label="Ora" type="time" value={form.ora} onChange={e=>set("ora",e.target.value)} />
          </div>

          {isNou && <Btn full onClick={()=>setPas(2)}>Continuă →</Btn>}
          {!isNou && <Btn full onClick={salveaza}>💾 Salvează Modificările</Btn>}
        </div>
      )}

      {/* PAS 2: Jucători */}
      {isNou && pas===2 && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ fontSize:16, fontWeight:900, color:C.text, fontFamily:"'Barlow Condensed',sans-serif" }}>
            SELECTEAZĂ JUCĂTORII <span style={{ color:C.textMuted, fontSize:13 }}>({selectati.length})</span>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {jucatori.map(j=>(
              <div key={j.id} onClick={()=>toggleSel(j.id)} style={{
                display:"flex", alignItems:"center", gap:7, padding:"7px 12px", borderRadius:20, cursor:"pointer",
                background:selectati.includes(j.id)?`${j.culoare}18`:C.bg1,
                border:`1px solid ${selectati.includes(j.id)?j.culoare+"50":C.border}`,
                transition:"all .15s",
              }}>
                <AvatarPhoto j={j} size={22} />
                <span style={{ fontSize:12, color:selectati.includes(j.id)?C.text:C.textMuted, fontWeight:700 }}>{j.nume.split(" ")[0]}</span>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn v="secondary" onClick={()=>setPas(1)}>← Înapoi</Btn>
            <Btn full onClick={()=>{ setForm(f=>({...f,echipaA:[],echipaB:[]})); setPas(3); }} disabled={selectati.length<4}>Continuă →</Btn>
          </div>
        </div>
      )}

      {/* PAS 3: Echipe */}
      {isNou && pas===3 && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ fontSize:16, fontWeight:900, color:C.text, fontFamily:"'Barlow Condensed',sans-serif" }}>ALCĂTUIEȘTE ECHIPELE</div>

          <div style={{ display:"flex", gap:8 }}>
            {[["manual","✋ Manual"],["balansat","⚖️ Balansat"],["aleator","🎲 Aleator"]].map(([k,l])=>(
              <button key={k} onClick={()=>setModEchipe(k)} style={{
                flex:1, padding:"9px 4px", borderRadius:10,
                background:modEchipe===k?"linear-gradient(135deg,#00f5a0,#00c8ff)":C.bg1,
                border:`1px solid ${modEchipe===k?"transparent":C.border}`,
                color:modEchipe===k?"#040d16":C.textMuted,
                fontSize:11, fontWeight:800, cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif",
              }}>{l}</button>
            ))}
          </div>

          {modEchipe!=="manual" && (
            <Btn full v="outline" onClick={genereaza}>⚡ Generează Automat</Btn>
          )}

          {modEchipe==="manual" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{echipa:"A",culoare:C.blue},{echipa:"B",culoare:C.red}].map(({echipa,culoare})=>(
                <div key={echipa} style={{ background:`${culoare}0d`, border:`1px solid ${culoare}25`, borderRadius:12, padding:10 }}>
                  <div style={{ fontSize:11, fontWeight:900, color:culoare, marginBottom:8, letterSpacing:1 }}>ECHIPA {echipa}</div>
                  {jucatori.filter(j=>selectati.includes(j.id)).map(j=>(
                    <div key={j.id} onClick={()=>toggleEchipa(j.id,echipa)} style={{
                      display:"flex", alignItems:"center", gap:6, padding:"5px 6px", borderRadius:8, cursor:"pointer", marginBottom:3,
                      background:form[`echipa${echipa}`].includes(j.id)?`${j.culoare}20`:"transparent",
                      border:`1px solid ${form[`echipa${echipa}`].includes(j.id)?j.culoare+"40":"transparent"}`,
                    }}>
                      <AvatarPhoto j={j} size={20} />
                      <span style={{ fontSize:11, color:form[`echipa${echipa}`].includes(j.id)?C.text:C.textMuted, fontWeight:600 }}>{j.nume.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {(form.echipaA.length>0||form.echipaB.length>0) && (
            <div style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:12, padding:12, textAlign:"center" }}>
              <span style={{ color:C.blue, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>A: {form.echipaA.length}</span>
              <span style={{ color:C.textFaint, margin:"0 12px" }}>vs</span>
              <span style={{ color:C.red, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>B: {form.echipaB.length}</span>
            </div>
          )}

          <div style={{ display:"flex", gap:8 }}>
            <Btn v="secondary" onClick={()=>setPas(2)}>← Înapoi</Btn>
            <Btn full onClick={()=>setPas(4)} disabled={form.echipaA.length===0||form.echipaB.length===0}>Continuă →</Btn>
          </div>
        </div>
      )}

      {/* PAS 4: Scor & MVP */}
      {isNou && pas===4 && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ fontSize:16, fontWeight:900, color:C.text, fontFamily:"'Barlow Condensed',sans-serif" }}>SCOR & MVP</div>

          {/* Scor */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:10, color:C.blue, fontWeight:800, marginBottom:6 }}>ECHIPA A</div>
              <div style={{ display:"flex", gap:4 }}>
                <button onClick={()=>set("golA",Math.max(0,form.golA-1))} style={{ width:36,height:36,borderRadius:8,background:C.bg1,border:`1px solid ${C.border}`,color:C.text,fontSize:18,cursor:"pointer" }}>−</button>
                <div style={{ width:52, textAlign:"center", fontFamily:"'Barlow Condensed',sans-serif", fontSize:42, fontWeight:900, color:C.blue, lineHeight:"36px" }}>{form.golA}</div>
                <button onClick={()=>set("golA",form.golA+1)} style={{ width:36,height:36,borderRadius:8,background:C.bg1,border:`1px solid ${C.border}`,color:C.text,fontSize:18,cursor:"pointer" }}>+</button>
              </div>
            </div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:28, color:C.textFaint }}>–</div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:10, color:C.red, fontWeight:800, marginBottom:6 }}>ECHIPA B</div>
              <div style={{ display:"flex", gap:4 }}>
                <button onClick={()=>set("golB",Math.max(0,form.golB-1))} style={{ width:36,height:36,borderRadius:8,background:C.bg1,border:`1px solid ${C.border}`,color:C.text,fontSize:18,cursor:"pointer" }}>−</button>
                <div style={{ width:52, textAlign:"center", fontFamily:"'Barlow Condensed',sans-serif", fontSize:42, fontWeight:900, color:C.red, lineHeight:"36px" }}>{form.golB}</div>
                <button onClick={()=>set("golB",form.golB+1)} style={{ width:36,height:36,borderRadius:8,background:C.bg1,border:`1px solid ${C.border}`,color:C.text,fontSize:18,cursor:"pointer" }}>+</button>
              </div>
            </div>
          </div>

          {/* Goluri per jucător */}
          {toatiSel.length > 0 && (
            <div>
              <div style={{ fontSize:10, color:C.textMuted, fontWeight:700, letterSpacing:1, marginBottom:8 }}>GOLURI PER JUCĂTOR</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {toatiSel.map(id => {
                  const j=getJ(id,jucatori); if(!j)return null;
                  const g=form.goluri.find(x=>x.jucator===id)?.count||0;
                  return (
                    <div key={id} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 10px", background:C.bg1, borderRadius:10 }}>
                      <AvatarPhoto j={j} size={28} />
                      <div style={{ flex:1, fontSize:12, fontWeight:700, color:C.text }}>{j.nume.split(" ")[0]}</div>
                      <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                        <button onClick={()=>setGolJucator(id,Math.max(0,g-1))} style={{ width:26,height:26,borderRadius:6,background:C.bg2,border:`1px solid ${C.border}`,color:C.text,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>−</button>
                        <span style={{ width:24, textAlign:"center", fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:900, color:g>0?C.green:C.textFaint }}>{g}</span>
                        <button onClick={()=>setGolJucator(id,g+1)} style={{ width:26,height:26,borderRadius:6,background:C.bg2,border:`1px solid ${C.border}`,color:C.text,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MVP */}
          <div>
            <div style={{ fontSize:10, color:C.textMuted, fontWeight:700, letterSpacing:1, marginBottom:8 }}>MVP AL MECIULUI 👑</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {toatiSel.map(id => {
                const j=getJ(id,jucatori); if(!j) return null;
                const sel = form.mvp===id;
                return (
                  <div key={id} onClick={()=>setMVP(id)} style={{
                    display:"flex", alignItems:"center", gap:6, padding:"6px 10px", borderRadius:20, cursor:"pointer",
                    background:sel?"#f59e0b18":C.bg1,
                    border:`1px solid ${sel?"#f59e0b50":C.border}`,
                    transition:"all .15s",
                  }}>
                    <AvatarPhoto j={j} size={22} />
                    <span style={{ fontSize:11, color:sel?"#f59e0b":C.textMuted, fontWeight:700 }}>{j.nume.split(" ")[0]}</span>
                    {sel && <span>👑</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display:"flex", gap:8 }}>
            <Btn v="secondary" onClick={()=>setPas(3)}>← Înapoi</Btn>
            <Btn full onClick={salveaza}>✅ Salvează Meciul</Btn>
          </div>
        </div>
      )}

      {/* Ștergere meci (edit mode) */}
      {!isNou && onDelete && (
        <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
          <Btn full v="ghost" onClick={()=>onDelete(meci.id)} style={{ color:C.red, fontSize:12 }}>🗑️ Șterge Meciul</Btn>
        </div>
      )}
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════════
//  ECRAN LOGIN
// ════════════════════════════════════════════════════════════════════
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [mod, setMod] = useState("login"); // login | register
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr(""); setLoading(true);
    await new Promise(r=>setTimeout(r,800));
    if (mod==="login") {
      if (email && parola) {
        onLogin({ id:"u"+uid(), nume:email.split("@")[0], email, avatar:"⚽", culoare:CULORI_POOL[Math.floor(Math.random()*CULORI_POOL.length)], rol:"user" });
      } else setErr("Completează email-ul și parola.");
    } else {
      if (email && parola && name) {
        onLogin({ id:"u"+uid(), nume:name, email, avatar:"⚽", culoare:CULORI_POOL[Math.floor(Math.random()*CULORI_POOL.length)], rol:"user" });
      } else setErr("Completează toate câmpurile.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'Barlow',sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      <div style={{ width:"100%", maxWidth:380, animation:"fadeUp .5s ease" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:64, marginBottom:8, animation:"popIn .6s ease" }}>⚽</div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:40, fontWeight:900, letterSpacing:5, background:"linear-gradient(135deg,#00f5a0,#00c8ff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>KICKOFF</div>
          <div style={{ fontSize:12, color:C.textMuted, marginTop:4 }}>Fotbal de Amatori · Sezon 2026</div>
        </div>

        <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:20, padding:28 }}>
          {/* Tab switch */}
          <div style={{ display:"flex", background:C.bg1, borderRadius:10, padding:3, marginBottom:24 }}>
            {[["login","Intră în cont"],["register","Cont Nou"]].map(([key,label])=>(
              <button key={key} onClick={()=>{setMod(key);setErr("");}} style={{
                flex:1, padding:"9px", borderRadius:8, border:"none", cursor:"pointer",
                background:mod===key?"linear-gradient(135deg,#00f5a0,#00c8ff)":C.bg1,
                color:mod===key?"#040d16":C.textMuted,
                fontSize:12, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif",
                transition:"all .2s",
              }}>{label}</button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {mod==="register" && <Input label="Numele tău" value={name} onChange={e=>setName(e.target.value)} placeholder="Ion Popescu" />}
            <Input label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ion@email.com" />
            <Input label="Parolă" type="password" value={parola} onChange={e=>setParola(e.target.value)} placeholder="••••••••" />

            {err && <div style={{ background:"#ef444415", border:"1px solid #ef444440", borderRadius:8, padding:"9px 12px", fontSize:12, color:C.red }}>{err}</div>}

            <Btn full onClick={submit} disabled={loading}>
              {loading ? "Se verifică..." : mod==="login" ? "🔑 Intră în Cont" : "✅ Creează Contul"}
            </Btn>
          </div>
        </div>

        {/* Demo shortcut */}
        <div style={{ textAlign:"center", marginTop:16 }}>
          <button onClick={()=>onLogin(USER_DEFAULT)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 20px", color:C.textMuted, cursor:"pointer", fontSize:12, fontFamily:"'Barlow Condensed',sans-serif" }}>
            👤 Intră ca Demo (fără cont)
          </button>
        </div>

        {/* Supabase notice */}
        <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, padding:14, marginTop:20, fontSize:11, color:C.textMuted, lineHeight:1.6 }}>
          <div style={{ fontWeight:800, color:C.textMuted, marginBottom:4 }}>ℹ️ NOTĂ DEZVOLTATOR</div>
          Aceasta este o simulare de login. Pentru sincronizare reală între telefoane, conectează Supabase Auth la <code style={{color:C.green}}>DB.getUsers()</code> / <code style={{color:C.green}}>DB.saveUsers()</code>. Documentația completă în pagina <strong>Arhitectură</strong>.
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
//  PAGINI PRINCIPALE
// ════════════════════════════════════════════════════════════════════

// ── ACASĂ ─────────────────────────────────────────────────────────
const PaginaAcasa = ({ stare }) => {
  const { nav, jucatori, meciuri, user, setMeciModal } = stare;
  const golgheter = [...jucatori].sort((a,b)=>b.goluri-a.goluri)[0];
  const topRated  = [...jucatori].sort((a,b)=>b.rating-a.rating)[0];
  const topMvp    = [...jucatori].sort((a,b)=>b.mvp-a.mvp)[0];
  const recente   = meciuri.slice(0,3);
  const totalGoluri = meciuri.reduce((s,m)=>s+m.golA+m.golB,0);

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:18 }}>
      {/* HERO */}
      <div style={{ background:`linear-gradient(135deg,${C.bg2},${C.bg1})`, border:`1px solid ${C.green}18`, borderRadius:20, padding:22, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40,right:-40, width:200,height:200, background:`radial-gradient(circle,${C.green}10,transparent)`, borderRadius:"50%", pointerEvents:"none" }} />
        <div style={{ position:"absolute", top:0,left:0,right:0, height:2, background:`linear-gradient(90deg,transparent,${C.green},transparent)` }} />
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
          <PulseDot />
          <span style={{ fontSize:9, color:C.green, fontWeight:800, letterSpacing:2 }}>FOTBAL DE MIERCURI SEARA</span>
        </div>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:30, fontWeight:900, lineHeight:1, marginBottom:4 }}>
          SEZON <span style={{ background:"linear-gradient(135deg,#00f5a0,#00c8ff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>PRIMĂVARĂ 2026</span>
        </div>
        <div style={{ fontSize:11, color:C.textMuted, marginBottom:18 }}>{jucatori.length} jucători · {meciuri.length} meciuri · {totalGoluri} goluri</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <Btn onClick={()=>setMeciModal({open:true,meci:null})}>+ Meci Nou</Btn>
          <Btn v="secondary" onClick={()=>nav("echipe")}>⚡ Echipe</Btn>
          <Btn v="outline" onClick={()=>nav("clasament")}>🏆 Clasament</Btn>
        </div>
      </div>

      {/* TOP 3 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        {[{label:"GOLGHETER",j:golgheter,stat:`${golgheter.goluri}G`,icon:"⚽"},{label:"CEL MAI BUN",j:topRated,stat:`${topRated.rating}★`,icon:"⭐"},{label:"REGE MVP",j:topMvp,stat:`${topMvp.mvp}×`,icon:"👑"}].map(({label,j,stat,icon})=>(
          <Card key={label} onClick={()=>nav("profil",{jucator:j})} glow={j.culoare} style={{ padding:12 }}>
            <div style={{ fontSize:8, color:C.textMuted, letterSpacing:.5, marginBottom:8 }}>{icon} {label}</div>
            <AvatarPhoto j={j} size={32} />
            <div style={{ fontSize:11, fontWeight:800, color:C.text, marginTop:6, fontFamily:"'Barlow Condensed',sans-serif" }}>{j.nume.split(" ")[0]}</div>
            <div style={{ fontSize:15, fontWeight:900, color:j.culoare, fontFamily:"'Barlow Condensed',sans-serif" }}>{stat}</div>
          </Card>
        ))}
      </div>

      {/* MECIURI RECENTE */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:9, color:C.textMuted, fontWeight:800, letterSpacing:2 }}>MECIURI RECENTE</div>
          <button onClick={()=>nav("meciuri")} style={{ background:"none",border:"none",color:C.green,fontSize:11,cursor:"pointer",fontWeight:700 }}>Vezi toate →</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {recente.length===0 && <div style={{ textAlign:"center", padding:24, color:C.textFaint, fontSize:13 }}>Niciun meci înregistrat încă.<br/>Apasă "+ Meci Nou" pentru a începe!</div>}
          {recente.map(m=><CardMeci key={m.id} m={m} jucatori={jucatori} onClick={m=>nav("detaliuMeci",{meci:m})} />)}
        </div>
      </div>

      {/* STATISTICI SEZON */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
        <Stat icon="🎮" val={meciuri.length} label="Meciuri" color={C.green} />
        <Stat icon="⚽" val={totalGoluri} label="Goluri" color={C.yellow} />
        <Stat icon="👥" val={jucatori.length} label="Jucători" color={C.cyan} />
        <Stat icon="👑" val={meciuri.filter(m=>m.mvp).length} label="MVP-uri" color={C.purple} />
      </div>
    </div>
  );
};

// ── JUCĂTORI ──────────────────────────────────────────────────────
const PaginaJucatori = ({ stare }) => {
  const { nav, jucatori, setJucatorModal } = stare;
  const [sortBy, setSortBy] = useState("rating");
  const [view, setView] = useState("list");
  const sortati = [...jucatori].sort((a,b)=>b[sortBy]-a[sortBy]);

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {[["rating","⭐ Rating"],["goluri","⚽ Goluri"],["pase","🎯 Pase"],["mvp","👑 MVP"],["victorii","🏆 Victorii"]].map(([k,l])=>(
          <button key={k} onClick={()=>setSortBy(k)} style={{
            background:sortBy===k?"linear-gradient(135deg,#00f5a0,#00c8ff)":C.bg2,
            color:sortBy===k?"#040d16":C.textMuted,
            border:`1px solid ${sortBy===k?"transparent":C.border}`,
            borderRadius:20, padding:"6px 14px", fontSize:11, fontWeight:800, cursor:"pointer",
            fontFamily:"'Barlow Condensed',sans-serif",
          }}>{l}</button>
        ))}
        <button onClick={()=>setView(v=>v==="list"?"fifa":"list")} style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:20, padding:"6px 12px", fontSize:11, fontWeight:800, cursor:"pointer", color:C.textMuted, fontFamily:"'Barlow Condensed',sans-serif", marginLeft:"auto" }}>
          {view==="list"?"🃏 FIFA":"📋 Listă"}
        </button>
      </div>

      {/* Header + add */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:9, color:C.textMuted, fontWeight:800, letterSpacing:2 }}>TOȚI JUCĂTORII ({jucatori.length})</div>
        <Btn sm onClick={()=>setJucatorModal({open:true,jucator:null})}>➕ Adaugă</Btn>
      </div>

      {view==="fifa" && (
        <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:10 }}>
          {sortati.map(j=><CardFIFA key={j.id} j={j} onClick={j=>nav("profil",{jucator:j})} />)}
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {sortati.map((j,i)=>(
          <Card key={j.id} glow={j.culoare} onClick={()=>nav("profil",{jucator:j})}>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              <div style={{ width:26,textAlign:"center",fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:900,color:i<3?["#f59e0b","#94a3b8","#cd7c3e"][i]:C.textFaint,flexShrink:0 }}>{i+1}</div>
              <AvatarPhoto j={j} size={44} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:800, color:C.text, fontFamily:"'Barlow Condensed',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{j.nume}</div>
                <div style={{ display:"flex", gap:6, marginTop:3, alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{ fontSize:9,color:CULORI_POZ[j.poza],background:`${CULORI_POZ[j.poza]}18`,padding:"2px 6px",borderRadius:4,fontWeight:800 }}>{POZITII_FULL[j.poza]}</span>
                  {j.seria>0 && <span style={{fontSize:9,color:"#f59e0b"}}>🔥{j.seria}</span>}
                  {j.insigne.slice(0,1).map(ins=><Badge key={ins} cheie={ins} small />)}
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:26,fontWeight:900,color:j.culoare,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1 }}>{j[sortBy]}</div>
                <Forma forma={j.forma} small />
              </div>
              <button onClick={e=>{e.stopPropagation();setJucatorModal({open:true,jucator:j});}} style={{ background:C.bg1,border:`1px solid ${C.border}`,borderRadius:8,width:30,height:30,cursor:"pointer",color:C.textMuted,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>✏️</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ── PROFIL JUCĂTOR ────────────────────────────────────────────────
const PaginaProfil = ({ stare }) => {
  const { jucatorActiv:j, nav, meciuri, setJucatorModal } = stare;
  if (!j) return <div style={{padding:40,textAlign:"center",color:C.textMuted}}>Selectează un jucător.</div>;

  const pct = Math.round(j.victorii/Math.max(j.meciuri,1)*100);
  const meciurileJ = meciuri.filter(m=>[...m.echipaA,...m.echipaB].includes(j.id));

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Hero */}
      <div style={{ background:`linear-gradient(145deg,${j.culoare}12,${C.bg0})`, border:`1px solid ${j.culoare}30`, borderRadius:20, padding:22, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${j.culoare},transparent)` }} />
        <div style={{ position:"absolute",top:-50,right:-50,width:220,height:220,background:`radial-gradient(circle,${j.culoare}10,transparent)`,borderRadius:"50%",pointerEvents:"none" }} />
        <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
          <div style={{ position:"relative" }}>
            <AvatarPhoto j={j} size={76} />
            {j.seria>0 && <div style={{ position:"absolute",bottom:-4,right:-4,background:"#f59e0b",borderRadius:20,padding:"2px 6px",fontSize:9,fontWeight:900,color:"#040d16" }}>🔥{j.seria}</div>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:900,color:C.text,letterSpacing:1,lineHeight:1 }}>{j.nume}</div>
            <div style={{ display:"flex",gap:6,marginTop:7,flexWrap:"wrap" }}>
              <span style={{background:`${CULORI_POZ[j.poza]}18`,color:CULORI_POZ[j.poza],padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:800}}>{POZITII_FULL[j.poza]}</span>
              <span style={{background:C.bg2,color:C.textMuted,padding:"3px 10px",borderRadius:20,fontSize:11}}>{j.picior==="D"?"⚽ Drept":"⚽ Stâng"}</span>
            </div>
            {j.bio && <div style={{fontSize:11,color:C.textMuted,marginTop:8,lineHeight:1.5,fontStyle:"italic"}}>"{j.bio}"</div>}
            <div style={{display:"flex",gap:16,marginTop:12}}>
              <div><div style={{fontSize:30,fontWeight:900,color:j.culoare,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{j.rating}</div><div style={{fontSize:8,color:C.textMuted}}>RATING</div></div>
              <div><div style={{fontSize:30,fontWeight:900,color:C.text,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1}}>{pct}%</div><div style={{fontSize:8,color:C.textMuted}}>VICTORII</div></div>
            </div>
          </div>
          <button onClick={()=>setJucatorModal({open:true,jucator:j})} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 12px",cursor:"pointer",color:C.textMuted,fontSize:12,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,flexShrink:0}}>✏️ Edit</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        <Stat icon="⚽" val={j.goluri}   label="Goluri"   color={j.culoare} />
        <Stat icon="🎯" val={j.pase}     label="Pase Dec." color={j.culoare} />
        <Stat icon="👑" val={j.mvp}      label="MVP"      color="#f59e0b" />
        <Stat icon="🏆" val={j.victorii} label="Victorii" color={C.green} />
        <Stat icon="❌" val={j.meciuri-j.victorii} label="Înfrângeri" color={C.red} />
        <Stat icon="🎮" val={j.meciuri}  label="Meciuri"  color={C.text} />
      </div>

      {/* Forma */}
      <Card>
        <div style={{fontSize:9,color:C.textMuted,fontWeight:800,letterSpacing:2,marginBottom:12}}>FORMĂ – ULTIMELE 5 MECIURI</div>
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          {j.forma.map((v,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:900,color:culoareForma(v)}}>{v}</div>
              <div style={{width:"100%",borderRadius:5,background:culoareForma(v),height:4+v*3,transition:"height .5s"}} />
              <div style={{fontSize:8,color:C.textFaint}}>M{i+1}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Insigne */}
      {j.insigne.length>0 && (
        <div>
          <div style={{fontSize:9,color:C.textMuted,fontWeight:800,letterSpacing:2,marginBottom:10}}>INSIGNE</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {j.insigne.map(ins=>{
              const b=INSIGNE_DEF[ins]; if(!b) return null;
              return <div key={ins} style={{background:`${b.culoare}12`,border:`1px solid ${b.culoare}40`,borderRadius:10,padding:"8px 14px"}}>
                <div style={{fontSize:13,color:b.culoare,fontWeight:900,fontFamily:"'Barlow Condensed',sans-serif"}}>{b.label}</div>
                <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>{b.desc}</div>
              </div>;
            })}
          </div>
        </div>
      )}

      {/* Meciuri */}
      {meciurileJ.length>0 && (
        <div>
          <div style={{fontSize:9,color:C.textMuted,fontWeight:800,letterSpacing:2,marginBottom:10}}>MECIURI RECENTE</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {meciurileJ.slice(0,3).map(m=><CardMeci key={m.id} m={m} jucatori={stare.jucatori} onClick={m=>nav("detaliuMeci",{meci:m})} />)}
          </div>
        </div>
      )}

      {/* Card FIFA */}
      <div style={{display:"flex",justifyContent:"center",padding:"8px 0"}}>
        <CardFIFA j={j} onClick={null} />
      </div>
    </div>
  );
};

// ── MECIURI HISTORY ───────────────────────────────────────────────
const PaginaMeciuri = ({ stare }) => {
  const { meciuri, jucatori, nav, setMeciModal } = stare;
  const [filtru, setFiltru] = useState("toate");
  const filtrate = filtru==="toate"?meciuri:meciuri.filter(m=>m.format===filtru);
  const total = meciuri.reduce((s,m)=>s+m.golA+m.golB,0);

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        <Stat icon="🎮" val={meciuri.length} label="Total Meciuri" color={C.green} />
        <Stat icon="⚽" val={total}          label="Goluri Totale" color={C.yellow} />
        <Stat icon="📊" val={meciuri.length?(total/meciuri.length).toFixed(1):"—"} label="Goluri/Meci" color={C.cyan} />
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:6 }}>
          {["toate","5v5","6v6","7v7"].map(f=>(
            <button key={f} onClick={()=>setFiltru(f)} style={{
              background:filtru===f?"linear-gradient(135deg,#00f5a0,#00c8ff)":C.bg2,
              color:filtru===f?"#040d16":C.textMuted,
              border:`1px solid ${filtru===f?"transparent":C.border}`,
              borderRadius:20, padding:"6px 12px", fontSize:11, fontWeight:800, cursor:"pointer",
              fontFamily:"'Barlow Condensed',sans-serif",
            }}>{f==="toate"?"Toate":f}</button>
          ))}
        </div>
        <Btn sm onClick={()=>setMeciModal({open:true,meci:null})}>➕ Nou</Btn>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {filtrate.length===0 && <div style={{textAlign:"center",padding:30,color:C.textFaint,fontSize:13}}>Niciun meci cu filtrul selectat.</div>}
        {filtrate.map(m=>(
          <div key={m.id} style={{ position:"relative" }}>
            <CardMeci m={m} jucatori={jucatori} onClick={m=>nav("detaliuMeci",{meci:m})} />
            <button onClick={()=>setMeciModal({open:true,meci:m})} style={{ position:"absolute",top:10,right:10,background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,width:28,height:28,cursor:"pointer",color:C.textMuted,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",zIndex:2 }}>✏️</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── DETALIU MECI ──────────────────────────────────────────────────
const PaginaDetaliuMeci = ({ stare }) => {
  const { meciActiv:m, jucatori, meciuri, setMeciuri, toast:showToast, setMeciModal } = stare;
  const [tab, setTab] = useState("rezumat");
  const [votMVP, setVotMVP] = useState(null);
  const [ratings, setRatings] = useState({});
  const [comentariu, setComentariu] = useState("");
  const [meci, setMeciLocal] = useState(m);

  useEffect(()=>{setMeciLocal(m);},[m]);
  if (!meci) return <div style={{padding:40,textAlign:"center",color:C.textMuted}}>Selectează un meci.</div>;

  const toati = [...meci.echipaA,...meci.echipaB];
  const vA=meci.golA>meci.golB, vB=meci.golB>meci.golA;
  const mvpJ=getJ(meci.mvp,jucatori);

  const updateMeci = (update) => {
    const nou = {...meci,...update};
    setMeciLocal(nou);
    setMeciuri(prev=>prev.map(x=>x.id===nou.id?nou:x));
  };

  const adaugaComentariu = () => {
    if (!comentariu.trim()) return;
    const c = {autor:"Tu", text:comentariu, timp:"acum"};
    updateMeci({comentarii:[...meci.comentarii,c]});
    setComentariu("");
    showToast("Comentariu adăugat! 💬","success");
  };

  const submitRatings = () => {
    showToast(`${Object.keys(ratings).length} ratinguri trimise! ⭐`,"success");
    setRatings({});
  };

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Scor */}
      <div style={{ background:`linear-gradient(145deg,${C.bg2},${C.bg0})`, border:`1px solid ${C.border}`, borderRadius:20, padding:22, textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.blue},transparent 40%,transparent 60%,${C.red})` }} />
        <div style={{fontSize:9,color:C.textMuted,letterSpacing:2,marginBottom:6}}>{meci.finalizat?"FT":"⏳ PLANIFICAT"} · {dataRo(meci.data)} · {meci.format}</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:60,letterSpacing:4,lineHeight:1}}>
          <span style={{color:vA?C.green:meci.golA>0?C.text:C.textFaint}}>{meci.golA}</span>
          <span style={{color:C.textFaint,fontSize:32,padding:"0 14px"}}>–</span>
          <span style={{color:vB?C.green:meci.golB>0?C.text:C.textFaint}}>{meci.golB}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-around",marginTop:6,fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,fontWeight:900}}>
          <span style={{color:vA?C.blue:C.textFaint}}>ECHIPA A{vA?" 🏆":""}</span>
          <span style={{color:vB?C.red:C.textFaint}}>ECHIPA B{vB?" 🏆":""}</span>
        </div>
        {meci.locatie && <div style={{fontSize:10,color:C.textFaint,marginTop:8}}>📍 {meci.locatie}</div>}
        <button onClick={()=>setMeciModal({open:true,meci})} style={{position:"absolute",top:12,right:12,background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",cursor:"pointer",color:C.textMuted,fontSize:11,fontFamily:"'Barlow Condensed',sans-serif"}}>✏️ Edit</button>
      </div>

      {/* MVP */}
      {mvpJ && (
        <div style={{background:"linear-gradient(135deg,#f59e0b15,#040d16)",border:"1px solid #f59e0b30",borderRadius:14,padding:14,display:"flex",gap:12,alignItems:"center"}}>
          <div style={{fontSize:32}}>👑</div>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:"#f59e0b",fontWeight:800,letterSpacing:2}}>MVP AL MECIULUI</div>
            <div style={{fontSize:20,fontWeight:900,color:C.text,fontFamily:"'Barlow Condensed',sans-serif"}}>{mvpJ.nume}</div>
          </div>
          <AvatarPhoto j={mvpJ} size={44} />
        </div>
      )}

      {/* Tabs */}
      <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2}}>
        {[["rezumat","📋"],["statistici","📊"],["ratinguri","⭐"],["comentarii",`💬${meci.comentarii.length>0?" "+meci.comentarii.length:""}`]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{
            background:tab===k?"linear-gradient(135deg,#00f5a0,#00c8ff)":C.bg2,
            color:tab===k?"#040d16":C.textMuted,
            border:`1px solid ${tab===k?"transparent":C.border}`,
            borderRadius:20,padding:"7px 14px",fontSize:11,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap",
            fontFamily:"'Barlow Condensed',sans-serif",
          }}>{l} {k.charAt(0).toUpperCase()+k.slice(1)}</button>
        ))}
      </div>

      {/* Tab: Rezumat */}
      {tab==="rezumat" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[{ids:meci.echipaA,nume:"ECHIPA A",culoare:C.blue},{ids:meci.echipaB,nume:"ECHIPA B",culoare:C.red}].map(({ids,nume,culoare})=>(
              <div key={nume} style={{background:`${culoare}0c`,border:`1px solid ${culoare}25`,borderRadius:12,padding:12}}>
                <div style={{fontSize:9,color:culoare,fontWeight:900,letterSpacing:1,marginBottom:8}}>{nume}</div>
                {ids.map(id=>{
                  const j=getJ(id,jucatori); if(!j)return null;
                  const g=meci.goluri.find(x=>x.jucator===id);
                  return <div key={id} style={{display:"flex",alignItems:"center",gap:7,padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
                    <AvatarPhoto j={j} size={22} />
                    <div style={{flex:1,fontSize:11,color:C.text,fontWeight:700}}>{j.nume.split(" ")[0]}</div>
                    {g&&<span style={{fontSize:10}}>{"⚽".repeat(g.count)}</span>}
                    {meci.mvp===id&&<span>👑</span>}
                  </div>;
                })}
              </div>
            ))}
          </div>

          {/* Vot MVP dacă nu există */}
          {!meci.mvp && (
            <Card>
              <div style={{fontSize:9,color:"#f59e0b",fontWeight:800,letterSpacing:2,marginBottom:10}}>👑 VOTEAZĂ MVP-UL</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {toati.map(id=>{const j=getJ(id,jucatori);if(!j)return null;return(
                  <div key={id} onClick={()=>setVotMVP(id)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:20,cursor:"pointer",background:votMVP===id?"#f59e0b15":C.bg1,border:`1px solid ${votMVP===id?"#f59e0b40":C.border}`,transition:"all .15s"}}>
                    <AvatarPhoto j={j} size={20} />
                    <span style={{fontSize:11,color:votMVP===id?"#f59e0b":C.textMuted,fontWeight:700}}>{j.nume.split(" ")[0]}</span>
                    {votMVP===id&&<span>👑</span>}
                  </div>
                );})}
              </div>
              {votMVP&&<Btn full onClick={()=>{updateMeci({mvp:votMVP});showToast("MVP votat! 👑","success");}} style={{marginTop:12}}>Confirmă Votul 👑</Btn>}
            </Card>
          )}

          {(meci.cartonaseG?.length>0||meci.cartonaseR?.length>0) && (
            <Card>
              <div style={{fontSize:9,color:C.textMuted,fontWeight:800,letterSpacing:2,marginBottom:8}}>CARTONAȘE</div>
              {meci.cartonaseG?.map(id=>{const j=getJ(id,jucatori);return j&&<div key={id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0"}}><span style={{fontSize:14}}>🟨</span><span style={{fontSize:12,color:C.text}}>{j.nume}</span></div>;})}
              {meci.cartonaseR?.map(id=>{const j=getJ(id,jucatori);return j&&<div key={id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0"}}><span style={{fontSize:14}}>🟥</span><span style={{fontSize:12,color:C.text}}>{j.nume}</span></div>;})}
            </Card>
          )}
        </div>
      )}

      {/* Tab: Statistici */}
      {tab==="statistici" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {meci.goluri.length>0&&<div style={{fontSize:9,color:C.textMuted,fontWeight:800,letterSpacing:2,marginBottom:4}}>MARCATORI</div>}
          {meci.goluri.map(({jucator:id,count})=>{const j=getJ(id,jucatori);if(!j)return null;return(
            <div key={id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:C.bg2,borderRadius:12,border:`1px solid ${C.border}`}}>
              <AvatarPhoto j={j} size={32} />
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:800,color:C.text,fontFamily:"'Barlow Condensed',sans-serif"}}>{j.nume}</div>
                <div style={{fontSize:9,color:C.textMuted}}>{POZITII_FULL[j.poza]}</div>
              </div>
              <div style={{display:"flex",gap:2}}>{Array(count).fill(0).map((_,i)=><span key={i} style={{fontSize:16}}>⚽</span>)}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,color:j.culoare,fontWeight:900}}>{count}</div>
            </div>
          );})}
          {meci.pase?.length>0&&<div style={{fontSize:9,color:C.textMuted,fontWeight:800,letterSpacing:2,marginTop:8,marginBottom:4}}>PASE DECISIVE</div>}
          {meci.pase?.map(({jucator:id,count})=>{const j=getJ(id,jucatori);if(!j)return null;return(
            <div key={id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",background:C.bg2,borderRadius:12,border:`1px solid ${C.border}`}}>
              <AvatarPhoto j={j} size={32} />
              <div style={{flex:1,fontSize:13,fontWeight:800,color:C.text,fontFamily:"'Barlow Condensed',sans-serif"}}>{j.nume}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,color:"#10b981",fontWeight:900}}>🎯 ×{count}</div>
            </div>
          );})}
          {meci.goluri.length===0&&meci.pase?.length===0&&<div style={{textAlign:"center",padding:24,color:C.textFaint,fontSize:12}}>Nicio statistică înregistrată pentru acest meci.</div>}
        </div>
      )}

      {/* Tab: Ratinguri */}
      {tab==="ratinguri" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:12,color:C.textMuted,marginBottom:4}}>Acordă note de la 1 la 10:</div>
          {toati.map(id=>{const j=getJ(id,jucatori);if(!j)return null;return(
            <Card key={id}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <AvatarPhoto j={j} size={30} />
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:800,color:C.text,fontFamily:"'Barlow Condensed',sans-serif"}}>{j.nume}</div>
                  <div style={{fontSize:9,color:C.textMuted}}>{POZITII_FULL[j.poza]}</div>
                </div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:900,color:ratings[id]?C.green:C.textFaint}}>{ratings[id]||"—"}/10</div>
              </div>
              <div style={{display:"flex",gap:3}}>
                {[1,2,3,4,5,6,7,8,9,10].map(v=>(
                  <button key={v} onClick={()=>setRatings(r=>({...r,[id]:v}))} style={{flex:1,padding:"6px 0",borderRadius:5,background:ratings[id]>=v?`${j.culoare}35`:C.bg1,border:`1px solid ${ratings[id]>=v?j.culoare+"60":C.border}`,color:ratings[id]>=v?"#fff":C.textFaint,fontSize:10,fontWeight:800,cursor:"pointer",transition:"all .1s"}}>{v}</button>
                ))}
              </div>
            </Card>
          );})}
          {Object.keys(ratings).length>0&&<Btn full onClick={submitRatings}>Trimite Ratinguri ({Object.keys(ratings).length}) ⭐</Btn>}
        </div>
      )}

      {/* Tab: Comentarii */}
      {tab==="comentarii" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {meci.comentarii.length===0&&<div style={{textAlign:"center",padding:24,color:C.textFaint,fontSize:12}}>Niciun comentariu încă. Fii primul!</div>}
          {meci.comentarii.map((c,i)=>(
            <div key={i} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:11,fontWeight:800,color:C.green}}>{c.autor}</span>
                <span style={{fontSize:10,color:C.textFaint}}>{c.timp}</span>
              </div>
              <div style={{fontSize:13,color:"#cbd5e1",lineHeight:1.5}}>{c.text}</div>
            </div>
          ))}
          <div style={{display:"flex",gap:8}}>
            <input value={comentariu} onChange={e=>setComentariu(e.target.value)} placeholder="Adaugă un comentariu..." onKeyDown={e=>e.key==="Enter"&&adaugaComentariu()} style={{flex:1,background:C.bg2,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 14px",color:C.text,fontSize:13,outline:"none",fontFamily:"'Barlow',sans-serif"}} onFocus={e=>e.target.style.borderColor="#00f5a040"} onBlur={e=>e.target.style.borderColor=C.border} />
            <button onClick={adaugaComentariu} style={{background:"linear-gradient(135deg,#00f5a0,#00c8ff)",color:"#040d16",border:"none",borderRadius:10,padding:"11px 16px",fontWeight:900,fontSize:14,cursor:"pointer"}}>→</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── ECHIPE / GENERATOR ────────────────────────────────────────────
const PaginaEchipe = ({ stare }) => {
  const { jucatori } = stare;
  const [mod, setMod] = useState("balansat");
  const [sel, setSel] = useState(jucatori.map(j=>j.id));
  const [echipe, setEchipe] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggle = id => setSel(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const selectToti = () => setSel(jucatori.map(j=>j.id));
  const deselectToti = () => setSel([]);

  const genereaza = () => {
    setLoading(true); setEchipe(null);
    const pool = jucatori.filter(j=>sel.includes(j.id));
    setTimeout(()=>{
      setEchipe(mod==="balansat"?genEchipeBalansate(pool):genEchipeAleator(pool));
      setLoading(false);
    },700);
  };

  const avg = e => e.length?(e.reduce((s,j)=>s+j.rating,0)/e.length).toFixed(2):"—";

  return (
    <div className="fade-up" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[["balansat","⚖️ Echilibrat"],["aleator","🎲 Aleator"]].map(([k,l])=>(
          <button key={k} onClick={()=>setMod(k)} style={{padding:"14px",borderRadius:12,background:mod===k?"linear-gradient(135deg,#00f5a0,#00c8ff)":C.bg2,border:`2px solid ${mod===k?"transparent":C.border}`,color:mod===k?"#040d16":C.textMuted,fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",transition:"all .2s"}}>{l}</button>
        ))}
      </div>

      {mod==="balansat"&&<div style={{background:"#00f5a00c",border:"1px solid #00f5a020",borderRadius:10,padding:"10px 14px",fontSize:11,color:"#00f5a070",lineHeight:1.5}}>⚖️ <strong>Mod Echilibrat:</strong> Scor compozit = 0.5×rating + 0.2×goluri/meci + 0.15×pase/meci + 0.15×rată victorii → Snake Draft.</div>}

      <div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <div style={{fontSize:9,color:C.textMuted,fontWeight:800,letterSpacing:2}}>JUCĂTORI ({sel.length}/{jucatori.length})</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={selectToti} style={{background:"none",border:"none",color:C.green,fontSize:10,cursor:"pointer",fontWeight:700}}>Toți</button>
            <button onClick={deselectToti} style={{background:"none",border:"none",color:C.textMuted,fontSize:10,cursor:"pointer"}}>Niciunul</button>
          </div>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {jucatori.map(j=>(
            <div key={j.id} onClick={()=>toggle(j.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 11px",borderRadius:20,cursor:"pointer",transition:"all .15s",background:sel.includes(j.id)?`${j.culoare}18`:C.bg2,border:`1px solid ${sel.includes(j.id)?j.culoare+"50":C.border}`}}>
              <AvatarPhoto j={j} size={20} />
              <span style={{fontSize:11,color:sel.includes(j.id)?C.text:C.textMuted,fontWeight:700}}>{j.nume.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </div>

      <Btn full onClick={genereaza} disabled={loading||sel.length<4}>
        {loading?"⚡ SE GENEREAZĂ...":"⚡ GENEREAZĂ ECHIPELE"}
      </Btn>

      {loading&&<div style={{textAlign:"center",padding:20}}><div style={{fontSize:36,animation:"spin 1s linear infinite",display:"inline-block"}}>⚽</div><div style={{fontSize:12,color:C.textMuted,marginTop:8}}>Algoritmul lucrează...</div></div>}

      {echipe&&(
        <div style={{animation:"fadeUp .4s ease"}}>
          {/* Bară echilibru */}
          <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:12}}>
            <div style={{fontSize:9,color:C.textMuted,letterSpacing:2,marginBottom:8}}>INDICE ECHILIBRU</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:15,fontWeight:900,color:C.blue,fontFamily:"'Barlow Condensed',sans-serif",minWidth:36}}>{avg(echipe[0])}</span>
              <div style={{flex:1,height:8,background:C.bg1,borderRadius:4,overflow:"hidden",position:"relative"}}>
                {(() => {const ta=parseFloat(avg(echipe[0])),tb=parseFloat(avg(echipe[1]));const tot=ta+tb;const pA=tot?(ta/tot*100).toFixed(0):50;return(<><div style={{position:"absolute",left:0,top:0,bottom:0,width:`${pA}%`,background:`linear-gradient(90deg,${C.blue},${C.blue}80)`,transition:"width .5s"}} /><div style={{position:"absolute",right:0,top:0,bottom:0,width:`${100-pA}%`,background:`linear-gradient(90deg,${C.red}80,${C.red})`,transition:"width .5s"}} /></>);})()}
              </div>
              <span style={{fontSize:15,fontWeight:900,color:C.red,fontFamily:"'Barlow Condensed',sans-serif",minWidth:36,textAlign:"right"}}>{avg(echipe[1])}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:9,color:C.textFaint}}><span>ECHIPA A</span><span>ECHIPA B</span></div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[{e:echipe[0],n:"ECHIPA A",c:C.blue},{e:echipe[1],n:"ECHIPA B",c:C.red}].map(({e,n,c})=>(
              <div key={n} style={{background:`${c}0c`,border:`1px solid ${c}25`,borderRadius:14,padding:12}}>
                <div style={{fontSize:13,fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:2,marginBottom:3}}>{n}</div>
                <div style={{fontSize:10,color:C.textMuted,marginBottom:10}}>Avg: {avg(e)} ⭐</div>
                {e.map(j=>(
                  <div key={j.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
                    <AvatarPhoto j={j} size={24} />
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,color:C.text,fontWeight:700}}>{j.nume.split(" ")[0]}</div>
                      <div style={{fontSize:9,color:C.textMuted}}>{POZITII_FULL[j.poza]}</div>
                    </div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,color:j.culoare,fontWeight:900}}>{j.rating}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── CLASAMENT ─────────────────────────────────────────────────────
const PaginaClasament = ({ stare }) => {
  const { nav, jucatori, meciuri } = stare;
  const [cat, setCat] = useState("general");
  const cats = [["general","🏆 General"],["golgheter","⚽ Goluri"],["creier","🎯 Pase"],["mvp","👑 MVP"],["portar","🧤 Portari"]];

  const top = () => {
    switch(cat){
      case "golgheter": return [...jucatori].sort((a,b)=>b.goluri-a.goluri);
      case "creier":    return [...jucatori].sort((a,b)=>b.pase-a.pase);
      case "mvp":       return [...jucatori].sort((a,b)=>b.mvp-a.mvp);
      case "portar":    return jucatori.filter(j=>j.poza==="PO").sort((a,b)=>b.rating-a.rating);
      default: return [...jucatori].sort((a,b)=>(b.victorii*3+b.goluri*.5)-(a.victorii*3+a.goluri*.5));
    }
  };
  const val = j => { switch(cat){ case "golgheter":return`${j.goluri}G`;case"creier":return`${j.pase}A`;case"mvp":return`${j.mvp}👑`;case"portar":return`${j.rating}★`;default:return`${j.victorii*3}pt`; }};
  const lista = top();

  return (
    <div className="fade-up" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{background:"linear-gradient(135deg,#f59e0b15,#040d16)",border:"1px solid #f59e0b20",borderRadius:18,padding:18,textAlign:"center"}}>
        <div style={{fontSize:10,color:"#f59e0b",fontWeight:800,letterSpacing:2,marginBottom:3}}>🏆 CLASAMENT OFICIAL</div>
        <div style={{fontSize:24,fontWeight:900,color:C.text,fontFamily:"'Barlow Condensed',sans-serif"}}>SEZON PRIMĂVARĂ 2026</div>
        <div style={{fontSize:11,color:C.textMuted,marginTop:3}}>{jucatori.length} jucători · {meciuri.length} meciuri</div>
      </div>

      {/* Podium */}
      {lista.length>=3&&(
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:8,padding:"0 8px"}}>
          {[{j:lista[1],pos:2,h:70,c:"#94a3b8"},{j:lista[0],pos:1,h:95,c:"#f59e0b"},{j:lista[2],pos:3,h:55,c:"#cd7c3e"}].map(({j,pos,h,c})=>(
            <div key={pos} style={{flex:1,textAlign:"center",cursor:"pointer"}} onClick={()=>nav("profil",{jucator:j})}>
              {pos===1&&<div style={{fontSize:18,marginBottom:4}}>👑</div>}
              <AvatarPhoto j={j} size={pos===1?52:38} />
              <div style={{fontSize:11,fontWeight:800,color:c,marginTop:5,fontFamily:"'Barlow Condensed',sans-serif"}}>{j.nume.split(" ")[0]}</div>
              <div style={{fontSize:14,fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{val(j)}</div>
              <div style={{background:`${c}18`,border:`1px solid ${c}40`,borderRadius:"10px 10px 0 0",padding:`${h/4}px 8px`,marginTop:6}}>
                <div style={{fontSize:22,fontWeight:900,color:c,fontFamily:"'Barlow Condensed',sans-serif"}}>{pos}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selector */}
      <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2}}>
        {cats.map(([k,l])=>(
          <button key={k} onClick={()=>setCat(k)} style={{background:cat===k?"linear-gradient(135deg,#00f5a0,#00c8ff)":C.bg2,color:cat===k?"#040d16":C.textMuted,border:`1px solid ${cat===k?"transparent":C.border}`,borderRadius:20,padding:"7px 14px",fontSize:11,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Barlow Condensed',sans-serif"}}>{l}</button>
        ))}
      </div>

      {/* Lista */}
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {lista.map((j,i)=>(
          <div key={j.id} onClick={()=>nav("profil",{jucator:j})} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:`linear-gradient(145deg,${C.bg2},${C.bg1})`,border:`1px solid ${i<3?j.culoare+"25":C.border}`,borderRadius:14,cursor:"pointer",transition:"all .2s"}}
          onMouseEnter={e=>{e.currentTarget.style.transform="translateX(4px)";e.currentTarget.style.borderColor=j.culoare+"40";}}
          onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor=i<3?j.culoare+"25":C.border;}}>
            <div style={{width:26,textAlign:"center",fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:900,color:i<3?["#f59e0b","#94a3b8","#cd7c3e"][i]:C.textFaint,flexShrink:0}}>{i+1}</div>
            <AvatarPhoto j={j} size={38} />
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:800,color:C.text,fontFamily:"'Barlow Condensed',sans-serif"}}>{j.nume}</div>
              <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>{j.meciuri} meciuri · {Math.round(j.victorii/Math.max(j.meciuri,1)*100)}% victorii</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:20,fontWeight:900,color:i===0?"#f59e0b":j.culoare,fontFamily:"'Barlow Condensed',sans-serif"}}>{val(j)}</div>
              <Forma forma={j.forma} small />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── ARHITECTURĂ + GHID SUPABASE ───────────────────────────────────
const PaginaArhitectura = () => (
  <div className="fade-up" style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{background:"linear-gradient(135deg,#00f5a015,#040d16)",border:"1px solid #00f5a025",borderRadius:18,padding:20}}>
      <div style={{fontSize:22,fontWeight:900,color:C.green,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:2}}>🗄️ GHID SUPABASE</div>
      <div style={{fontSize:12,color:C.textMuted,marginTop:4,lineHeight:1.6}}>Pași pentru a face aplicația live, cu sincronizare reală între telefoane.</div>
    </div>

    {[
      { titlu:"1️⃣  CREAZĂ PROIECT SUPABASE", culoare:C.green, items:[
        ["supabase.com","→ New Project → alege regiune (eu-central-1)"],
        ["Settings → API","Copiază: Project URL + anon public key"],
        ["npm install","npm install @supabase/supabase-js"],
      ]},
      { titlu:"2️⃣  SCHEMA BASE DE DATE", culoare:C.cyan, items:[
        ["users","id, email, name, avatar_url, color, position, foot, bio, created_at"],
        ["matches","id, group_id, format, location, date, score_a, score_b, mvp_id, finalized"],
        ["match_players","match_id, user_id, team (A/B), goals, assists, yellow_cards, red_cards"],
        ["ratings","id, match_id, rater_id, rated_id, score (1-10), created_at"],
        ["badges","id, user_id, badge_type, earned_at"],
        ["player_stats","VIEW: user_id, season, matches, wins, goals, assists, avg_rating"],
      ]},
      { titlu:"3️⃣  ÎNLOCUIEȘTE DB LAYER", culoare:C.yellow, items:[
        ["DB.getJucatori()","→ supabase.from('users').select('*')"],
        ["DB.saveJucatori()","→ supabase.from('users').upsert(data)"],
        ["DB.getMeciuri()","→ supabase.from('matches').select('*, match_players(*)')"],
        ["DB.saveMeciuri()","→ supabase.from('matches').upsert(data)"],
      ]},
      { titlu:"4️⃣  AUTH REAL (Google + Email)", culoare:C.purple, items:[
        ["Email/Password","supabase.auth.signUp({ email, password })"],
        ["Google OAuth","supabase.auth.signInWithOAuth({ provider: 'google' })"],
        ["Login","supabase.auth.signInWithPassword({ email, password })"],
        ["Logout","supabase.auth.signOut()"],
        ["Session","supabase.auth.getSession() / onAuthStateChange()"],
      ]},
      { titlu:"5️⃣  REAL-TIME (live updates)", culoare:"#f97316", items:[
        ["Live match","supabase.channel('match:id').on('postgres_changes', ...)"],
        ["Fan voting","supabase.channel('votes').on('broadcast', ...)"],
        ["New goals","supabase.channel('goals').subscribe(callback)"],
      ]},
      { titlu:"6️⃣  DEPLOY", culoare:"#10b981", items:[
        ["Next.js","npx create-next-app kickoff → copy components → vercel deploy"],
        ["Env vars","NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY"],
        ["Domain","kickoff-fotbal.vercel.app (gratuit) sau domeniu propriu"],
        ["Mobile","PWA: add to homescreen → funcționează ca app nativ"],
      ]},
    ].map(sec=>(
      <Card key={sec.titlu}>
        <div style={{fontSize:13,fontWeight:900,color:sec.culoare,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,marginBottom:12}}>{sec.titlu}</div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {sec.items.map(([k,v])=>(
            <div key={k} style={{display:"grid",gridTemplateColumns:"145px 1fr",gap:10}}>
              <code style={{fontSize:10,color:sec.culoare,fontFamily:"monospace",background:`${sec.culoare}10`,padding:"3px 7px",borderRadius:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{k}</code>
              <span style={{fontSize:11,color:"#cbd5e1",lineHeight:1.5}}>{v}</span>
            </div>
          ))}
        </div>
      </Card>
    ))}

    <Card>
      <div style={{fontSize:13,fontWeight:900,color:C.green,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:10}}>💡 COST ESTIMAT</div>
      {[["Supabase Free","0€/lună · 500MB DB · 50k req/zi · perfect pentru grupuri mici"],["Supabase Pro","25$/lună · dacă depășești 500MB sau 50k req"],["Vercel Free","0€ deploy · perfect pentru Next.js"],["Domeniu","10€/an dacă vrei kickoff-fotbal.ro"]].map(([k,v])=>(
        <div key={k} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
          <span style={{fontSize:11,fontWeight:800,color:C.green,fontFamily:"'Barlow Condensed',sans-serif",minWidth:120}}>{k}</span>
          <span style={{fontSize:11,color:C.textMuted,lineHeight:1.4}}>{v}</span>
        </div>
      ))}
    </Card>
  </div>
);

// ── MENIU ─────────────────────────────────────────────────────────
const PaginaMeniu = ({ stare }) => {
  const { nav, jucatori, meciuri, user, onLogout } = stare;
  return (
    <div className="fade-up" style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* User card */}
      <Card glow={user?.culoare||C.green}>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:`${user?.culoare||C.green}20`,border:`2px solid ${user?.culoare||C.green}70`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{user?.avatar||"⚽"}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:18,fontWeight:900,color:C.text,fontFamily:"'Barlow Condensed',sans-serif"}}>{user?.nume||"Admin"}</div>
            <div style={{fontSize:11,color:C.textMuted}}>{user?.email||"demo@kickoff.ro"}</div>
            <div style={{fontSize:9,color:user?.culoare||C.green,background:`${user?.culoare||C.green}15`,padding:"2px 8px",borderRadius:20,fontWeight:700,display:"inline-block",marginTop:4}}>{user?.rol==="admin"?"👑 Admin":"👤 Jucător"}</div>
          </div>
          <Btn sm v="secondary" onClick={onLogout}>Ieși</Btn>
        </div>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        <Stat icon="🎮" val={meciuri.length} label="Meciuri" color={C.green}/>
        <Stat icon="⚽" val={meciuri.reduce((s,m)=>s+m.golA+m.golB,0)} label="Goluri" color={C.yellow}/>
        <Stat icon="👥" val={jucatori.length} label="Jucători" color={C.cyan}/>
      </div>

      {[
        { titlu:"⚽ JOC", items:[
          {icon:"🏠",l:"Acasă",pg:"acasa"},{icon:"🎮",l:"Istoric Meciuri",pg:"meciuri"},
          {icon:"⚡",l:"Generator Echipe",pg:"echipe"},{icon:"🏆",l:"Clasament",pg:"clasament"},
        ]},
        { titlu:"👥 JUCĂTORI", items:[
          {icon:"👤",l:"Toți Jucătorii",pg:"jucatori"},{icon:"🏅",l:"Insigne & Realizări",pg:"insigne"},
        ]},
        { titlu:"⚙️ SISTEM", items:[
          {icon:"🗄️",l:"Ghid Supabase / Deploy",pg:"arhitectura"},
        ]},
      ].map(sec=>(
        <div key={sec.titlu}>
          <div style={{fontSize:9,color:C.textFaint,fontWeight:800,letterSpacing:2,marginBottom:8}}>{sec.titlu}</div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {sec.items.map(item=>(
              <div key={item.pg} onClick={()=>nav(item.pg)} style={{display:"flex",alignItems:"center",gap:13,padding:"13px 15px",background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,cursor:"pointer",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.borderHover;e.currentTarget.style.background=C.bg3;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.bg2;}}>
                <div style={{fontSize:20,width:36,height:36,borderRadius:10,background:C.bg1,display:"flex",alignItems:"center",justifyContent:"center"}}>{item.icon}</div>
                <div style={{flex:1,fontSize:14,fontWeight:800,color:C.text,fontFamily:"'Barlow Condensed',sans-serif"}}>{item.l}</div>
                <div style={{color:C.textFaint}}>›</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{textAlign:"center",padding:12,fontSize:10,color:C.textFaint}}>⚽ KICKOFF v2.0 · Storage: Persistent · Made with ❤️</div>
    </div>
  );
};

// ── INSIGNE ───────────────────────────────────────────────────────
const PaginaInsigne = ({ stare }) => {
  const { jucatori, nav } = stare;
  return (
    <div className="fade-up" style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:"linear-gradient(135deg,#a855f715,#040d16)",border:"1px solid #a855f725",borderRadius:18,padding:18,textAlign:"center"}}>
        <div style={{fontSize:34,marginBottom:6}}>🏅</div>
        <div style={{fontSize:22,fontWeight:900,color:C.text,fontFamily:"'Barlow Condensed',sans-serif"}}>INSIGNE & REALIZĂRI</div>
        <div style={{fontSize:11,color:C.textMuted,marginTop:3}}>Câștigă insigne pentru performanțe remarcabile</div>
      </div>
      {Object.entries(INSIGNE_DEF).map(([cheie,ins])=>{
        const det=jucatori.filter(j=>j.insigne.includes(cheie));
        return(
          <Card key={cheie} glow={ins.culoare}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{width:44,height:44,borderRadius:12,background:`${ins.culoare}15`,border:`1px solid ${ins.culoare}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{ins.label.split(" ")[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:900,color:ins.culoare,fontFamily:"'Barlow Condensed',sans-serif"}}>{ins.label.slice(ins.label.indexOf(" ")+1)}</div>
                <div style={{fontSize:11,color:C.textMuted,marginTop:2,marginBottom:det.length>0?10:0}}>{ins.desc}</div>
                {det.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:5}}>{det.map(j=><div key={j.id} onClick={()=>nav("profil",{jucator:j})} style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",background:`${j.culoare}12`,border:`1px solid ${j.culoare}25`,borderRadius:20,padding:"2px 7px"}}><AvatarPhoto j={j} size={16}/><span style={{fontSize:10,color:j.culoare,fontWeight:700}}>{j.nume.split(" ")[0]}</span></div>)}</div>}
                {det.length===0&&<div style={{fontSize:10,color:C.textFaint,fontStyle:"italic"}}>Nicio insignă acordată încă</div>}
              </div>
              <div style={{fontSize:11,color:C.textFaint,fontWeight:700,flexShrink:0}}>{det.length}×</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
//  NAVIGARE
// ════════════════════════════════════════════════════════════════════
const NAV_ITEMS = [
  {k:"acasa",    icon:"🏠", l:"Acasă"},
  {k:"jucatori", icon:"👤", l:"Jucători"},
  {k:"echipe",   icon:"⚡", l:"Echipe"},
  {k:"clasament",icon:"🏆", l:"Clasament"},
  {k:"meniu",    icon:"☰",  l:"Meniu"},
];

const TITLURI = {
  acasa:"KICKOFF ⚽", jucatori:"JUCĂTORI", profil:"PROFIL",
  meciuri:"MECIURI", detaliuMeci:"DETALII MECI",
  echipe:"GENEREAZĂ ECHIPE", clasament:"CLASAMENT",
  insigne:"INSIGNE 🏅", arhitectura:"GHID SUPABASE",
  meniu:"MENIU",
};

const PAGINI_BOTTOM = ["acasa","jucatori","echipe","clasament","meniu"];

// ════════════════════════════════════════════════════════════════════
//  APP ROOT
// ════════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser]         = useState(null);
  const [pagina, setPagina]     = useState("acasa");
  const [jucatori, setJucatoriS]= useState([]);
  const [meciuri, setMeciuriS]  = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);
  const [jucatorActiv, setJucatorActiv] = useState(null);
  const [meciActiv, setMeciActiv]       = useState(null);
  const [istoricPag, setIstoricPag]     = useState(["acasa"]);
  const [jucatorModal, setJucatorModal] = useState({open:false,jucator:null});
  const [meciModal, setMeciModal]       = useState({open:false,meci:null});

  // Load from storage
  useEffect(()=>{
    (async()=>{
      const [j,m] = await Promise.all([DB.getJucatori(), DB.getMeciuri()]);
      setJucatoriS(j); setMeciuriS(m);
      setLoading(false);
    })();
  },[]);

  // Persist jucatori
  const setJucatori = useCallback(async updater => {
    setJucatoriS(prev=>{
      const next = typeof updater==="function"?updater(prev):updater;
      DB.saveJucatori(next);
      return next;
    });
  },[]);

  // Persist meciuri
  const setMeciuri = useCallback(async updater => {
    setMeciuriS(prev=>{
      const next = typeof updater==="function"?updater(prev):updater;
      DB.saveMeciuri(next);
      return next;
    });
  },[]);

  const showToast = useCallback((msg,tip="success")=>{
    setToast({msg,tip}); setTimeout(()=>setToast(null),3000);
  },[]);

  const nav = useCallback((pg, extra={})=>{
    if(extra.jucator) setJucatorActiv(extra.jucator);
    if(extra.meci)    setMeciActiv(extra.meci);
    setIstoricPag(p=>[...p.slice(-6),pg]);
    setPagina(pg);
    window.scrollTo(0,0);
  },[]);

  const goBack = () => {
    const prev = istoricPag[istoricPag.length-2]||"acasa";
    setIstoricPag(p=>p.slice(0,-1));
    setPagina(prev);
    window.scrollTo(0,0);
  };

  // Jucator CRUD
  const salveazaJucator = useCallback(j => {
    setJucatori(prev=>{
      const idx=prev.findIndex(x=>x.id===j.id);
      const next = idx>=0 ? prev.map(x=>x.id===j.id?{...x,...j}:x) : [...prev,{...j,rating:7.0,goluri:0,pase:0,victorii:0,meciuri:0,mvp:0,insigne:[],forma:[7,7,7,7,7],seria:0}];
      return next;
    });
    if(jucatorActiv?.id===j.id) setJucatorActiv(prev=>({...prev,...j}));
    setJucatorModal({open:false,jucator:null});
    showToast(j.id&&jucatori.find(x=>x.id===j.id)?"Jucător actualizat! ✅":"Jucător adăugat! 🎉");
  },[jucatori,jucatorActiv]);

  const stergeJucator = useCallback(id=>{
    setJucatori(prev=>prev.filter(j=>j.id!==id));
    setJucatorModal({open:false,jucator:null});
    if(pagina==="profil") nav("jucatori");
    showToast("Jucător șters.","info");
  },[pagina]);

  // Meci CRUD
  const salveazaMeci = useCallback(m=>{
    setMeciuri(prev=>{
      const idx=prev.findIndex(x=>x.id===m.id);
      return idx>=0 ? prev.map(x=>x.id===m.id?m:x) : [m,...prev];
    });
    setMeciModal({open:false,meci:null});
    showToast(meciuri.find(x=>x.id===m.id)?"Meci actualizat! ✅":"Meci salvat! ⚽");
  },[meciuri]);

  const stergeMeci = useCallback(id=>{
    setMeciuri(prev=>prev.filter(m=>m.id!==id));
    setMeciModal({open:false,meci:null});
    if(pagina==="detaliuMeci") nav("meciuri");
    showToast("Meci șters.","info");
  },[pagina]);

  const stare = {
    nav, pagina, user, jucatori, setJucatori, meciuri, setMeciuri,
    jucatorActiv, meciActiv, toast:showToast,
    setJucatorModal, setMeciModal,
    onLogout:()=>setUser(null),
  };

  if (!user) return <LoginScreen onLogin={u=>{setUser(u);showToast(`Bun venit, ${u.nume}! ⚽`,"success");}}/>;
  if (loading) return <div style={{minHeight:"100vh",background:C.bg0,display:"flex",alignItems:"center",justifyContent:"center"}}><style>{GLOBAL_CSS}</style><Spinner /></div>;

  const arataSageata = !PAGINI_BOTTOM.includes(pagina);

  const randPagina = () => {
    switch(pagina){
      case "acasa":       return <PaginaAcasa       stare={stare}/>;
      case "jucatori":    return <PaginaJucatori     stare={stare}/>;
      case "profil":      return <PaginaProfil       stare={stare}/>;
      case "meciuri":     return <PaginaMeciuri      stare={stare}/>;
      case "detaliuMeci": return <PaginaDetaliuMeci  stare={stare}/>;
      case "echipe":      return <PaginaEchipe       stare={stare}/>;
      case "clasament":   return <PaginaClasament    stare={stare}/>;
      case "insigne":     return <PaginaInsigne      stare={stare}/>;
      case "arhitectura": return <PaginaArhitectura  />;
      case "meniu":       return <PaginaMeniu        stare={stare}/>;
      default:            return <PaginaAcasa        stare={stare}/>;
    }
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg0,maxWidth:480,margin:"0 auto",position:"relative",fontFamily:"'Barlow',sans-serif",color:C.text}}>
      <style>{GLOBAL_CSS}</style>

      {/* HEADER */}
      <div style={{position:"sticky",top:0,zIndex:150,background:C.bg0+"f5",backdropFilter:"blur(20px)",borderBottom:`1px solid ${C.border}`,height:56,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {arataSageata&&<button onClick={goBack} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:9,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.textMuted,fontSize:15,flexShrink:0}}>←</button>}
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:19,fontWeight:900,letterSpacing:2,background:"linear-gradient(135deg,#00f5a0,#00c8ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{TITLURI[pagina]||"KICKOFF"}</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}><PulseDot/><span style={{fontSize:9,color:C.textFaint,letterSpacing:1}}>LIVE</span></div>
          <div style={{width:30,height:30,borderRadius:"50%",background:`${user.culoare||C.green}20`,border:`1.5px solid ${user.culoare||C.green}60`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,cursor:"pointer"}} onClick={()=>nav("meniu")}>{user.avatar||"⚽"}</div>
        </div>
      </div>

      {/* MAIN */}
      <main style={{padding:"16px 14px 88px"}} key={pagina}>
        {randPagina()}
      </main>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.bg0+"f5",backdropFilter:"blur(20px)",borderTop:`1px solid ${C.border}`,padding:"6px 6px 18px",display:"flex",justifyContent:"space-around",zIndex:200}}>
        {NAV_ITEMS.map(({k,icon,l})=>{
          const activ=pagina===k||(k==="meniu"&&["insigne","arhitectura"].includes(pagina));
          return(
            <button key={k} onClick={()=>nav(k)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px 10px",borderRadius:12}}>
              <div style={{width:38,height:38,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,background:activ?"linear-gradient(135deg,#00f5a020,#00c8ff18)":"transparent",border:activ?`1px solid ${C.green}35`:"1px solid transparent",transition:"all .2s"}}>{icon}</div>
              <span style={{fontSize:9,color:activ?C.green:C.textFaint,fontWeight:activ?800:500,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:.5}}>{l}</span>
            </button>
          );
        })}
      </div>

      {/* MODALS */}
      {jucatorModal.open&&<ModalEditJucator jucator={jucatorModal.jucator} onSave={salveazaJucator} onDelete={stergeJucator} onClose={()=>setJucatorModal({open:false,jucator:null})} />}
      {meciModal.open&&<ModalMeci meci={meciModal.meci} jucatori={jucatori} onSave={salveazaMeci} onDelete={stergeMeci} onClose={()=>setMeciModal({open:false,meci:null})} />}

      {/* TOAST */}
      <Toast toast={toast}/>
    </div>
  );
}
