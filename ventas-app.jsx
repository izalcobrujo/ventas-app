// VENTAS — App de Registro de Ventas y Gastos Diarios v2
// PWA + Google Drive backup — Registro Individual y Sidebar corregido

const { useState, useEffect, useCallback, useMemo } = React;

// ─── URL de tu Script ─────────────────────────────────────────────────────────
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyNgCSqgADH_l6TqMqz2hoAf1QDae8ork4vdWmoOj6nx1j93_H3hUMQJp9_UsMT14gl/exec";

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg: "#F4F2EF", card: "#FFFFFF", cardAlt: "#F9F8F6",
  primary: "#1A3353", primaryMid: "#1E4080",
  accent: "#2563EB", accentLight: "#DBEAFE", accentMid: "#3B82F6",
  sale: "#1A3353", saleLight: "#E0EAFF",
  expense: "#991B1B", expenseLight: "#FEE2E2",
  warning: "#D97706", warningLight: "#FEF3C7",
  text: "#1C1917", textMid: "#57534E", textLight: "#A8A29E",
  border: "#E5E3DF", white: "#FFFFFF",
  pieColors: ["#2563EB","#7C3AED","#DB2777","#D97706","#059669","#0891B2","#DC2626","#65A30D","#EA580C","#0D9488"],
};

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────
const SUCURSALES_DEFAULT = ["GARAN 1", "GARAN 2", "GARAN 7"];
const CONCEPTOS_VENTA_DEFAULT = ["DESAYUNO","ALMUERZO","REFRIGERIO MAÑANA","REFRIGERIO TARDE","CENA","EVENTOS"];
const CONCEPTOS_GASTO_DEFAULT = ["INSUMOS","PERSONAL","SERVICIOS","RENTA","OTROS"];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt = (n) => `$${Number(n||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const today = () => new Date().toISOString().split("T")[0];
const getWeekNum = (ds) => { const d=new Date(ds),j=new Date(d.getFullYear(),0,1); return Math.ceil(((d-j)/86400000+j.getDay()+1)/7); };
const getMonth = (ds) => ds.slice(0,7);
const DAYS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const LS = { get:(k,def)=>{try{const v=localStorage.getItem(k);return v!==null?JSON.parse(v):def;}catch{return def;}}, set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}} };
const totalV = (e) => (e.ventas||[]).reduce((a,b)=>a+Number(b.monto),0);
const totalG = (e) => (e.gastos||[]).reduce((a,b)=>a+Number(b.monto),0);

const genSeedData = () => {
  const entries=[]; const now=new Date();
  for(let i=28;i>=1;i--){
    const d=new Date(now); d.setDate(d.getDate()-i);
    const ds=d.toISOString().split("T")[0];
    SUCURSALES_DEFAULT.forEach((suc)=>{
      const ventas=[]; CONCEPTOS_VENTA_DEFAULT.forEach((c)=>{ if(Math.random()>0.35) ventas.push({concepto:c,monto:Math.round(80+Math.random()*600)}); });
      const gastos=[]; CONCEPTOS_GASTO_DEFAULT.forEach((c)=>{ if(Math.random()>0.65) gastos.push({concepto:c,monto:Math.round(20+Math.random()*180)}); });
      const tv=ventas.reduce((a,b)=>a+b.monto,0), tg=gastos.reduce((a,b)=>a+b.monto,0);
      const caja=(tv-tg)+(Math.random()>0.8?Math.round((Math.random()-0.5)*80):0);
      entries.push({id:`e-${ds}-${suc}`,fecha:ds,sucursal:suc,ventas,gastos,caja:Math.max(0,Math.round(caja*100)/100)});
    });
  }
  return entries;
};

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({name,size=22,color="currentColor"}) => {
  const s={width:size,height:size,display:"inline-block",flexShrink:0,verticalAlign:"middle"};
  const m={
    dashboard:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    store:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-5h16l1 5"/><path d="M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9"/><path d="M9 9v11M15 9v11M3 9h18"/></svg>,
    plus:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    wallet:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><circle cx="16" cy="13" r="1" fill={color}/><path d="M20 7V5a2 2 0 00-2-2H6a2 2 0 00-2 2v2"/></svg>,
    cloud:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>,
    cloudUp:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
    cloudDown:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 16 12 20 16 16"/><line x1="12" y1="20" x2="12" y2="11"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
    trendUp:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    trendDown:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
    warning:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    check:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    trash:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
    menu:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>,
    close:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    chevDown:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
    chevRight:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
    dollar:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    bar:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    pie:<svg viewBox="0 0 24 24" style={s} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>,
  };
  return m[name]||null;
};

// ─── MINI COMPONENTS ──────────────────────────────────────────────────────────
const Card = ({children,style={}}) => <div style={{background:T.card,borderRadius:16,padding:20,border:`1px solid ${T.border}`,...style}}>{children}</div>;
const Badge = ({children,color=T.accent,bg=T.accentLight}) => <span style={{fontSize:11,fontWeight:700,color,background:bg,borderRadius:99,padding:"2px 9px",display:"inline-block"}}>{children}</span>;

const StatCard = ({label,value,sub,icon,accent=T.accent,accentBg=T.accentLight}) => (
  <Card style={{display:"flex",flexDirection:"column",gap:8}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <span style={{fontSize:11,fontWeight:700,color:T.textLight,textTransform:"uppercase",letterSpacing:".08em"}}>{label}</span>
      <div style={{width:34,height:34,borderRadius:10,background:accentBg,display:"flex",alignItems:"center",justifyContent:"center",color:accent}}>{icon}</div>
    </div>
    <div style={{fontSize:26,fontWeight:800,color:T.text,letterSpacing:"-0.5px"}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:T.textMid}}>{sub}</div>}
  </Card>
);

const PeriodToggle = ({value,onChange}) => (
  <div style={{display:"flex",gap:8,marginBottom:20}}>
    {["semana","mes"].map(p=>(
      <button key={p} onClick={()=>onChange(p)} style={{flex:1,padding:"10px 0",borderRadius:10,border:`1px solid ${value===p?T.accent:T.border}`,background:value===p?T.accent:T.card,color:value===p?T.white:T.textMid,fontFamily:"inherit",fontWeight:700,fontSize:13,letterSpacing:".04em",textTransform:"uppercase",cursor:"pointer"}}>
        {p==="semana"?"Esta semana":"Este mes"}
      </button>
    ))}
  </div>
);

const SucursalPicker = ({value,onChange,sucursales,showAll=false}) => (
  <div style={{marginBottom:16}}>
    <label style={{fontSize:11,fontWeight:700,color:T.textLight,textTransform:"uppercase",letterSpacing:".08em",display:"block",marginBottom:6}}>Sucursal</label>
    <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"12px 16px",borderRadius:12,border:`1px solid ${T.border}`,background:T.card,fontFamily:"inherit",fontSize:14,fontWeight:600,color:T.text,appearance:"none",outline:"none",cursor:"pointer"}}>
      {showAll&&<option value="__all">Todas las sucursales</option>}
      {sucursales.map(s=><option key={s} value={s}>{s}</option>)}
    </select>
  </div>
);

const MiniBar = ({data,colorFn}) => {
  const max=Math.max(...data.map(d=>d.value),1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:4,height:60}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
          <div style={{width:"100%",borderRadius:"4px 4px 0 0",height:Math.max(4,(d.value/max)*52),background:colorFn(d,i),transition:"height .3s"}}/>
          <span style={{fontSize:9,color:T.textLight,fontWeight:600}}>{d.label}</span>
        </div>
      ))}
    </div>
  );
};

const PieChart = ({data,size=130}) => {
  const total=data.reduce((a,b)=>a+b.value,0); if(!total||!data.length) return null;
  const cx=size/2,cy=size/2,r=size*0.38; let start=-Math.PI/2;
  const slices=data.map((d,i)=>{ const a=(d.value/total)*2*Math.PI,x1=cx+r*Math.cos(start),y1=cy+r*Math.sin(start),x2=cx+r*Math.cos(start+a),y2=cy+r*Math.sin(start+a),lg=a>Math.PI?1:0,path=`M${cx} ${cy}L${x1} ${y1}A${r} ${r} 0 ${lg} 1 ${x2} ${y2}Z`; start+=a; return {...d,path,color:T.pieColors[i%T.pieColors.length]}; });
  return (<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{slices.map((s,i)=><path key={i} d={s.path} fill={s.color} stroke={T.white} strokeWidth="1.5"/>)}<circle cx={cx} cy={cy} r={r*0.48} fill={T.white}/></svg>);
};

const Toast = ({msg,onClose}) => { useEffect(()=>{if(msg){const t=setTimeout(onClose,3000);return()=>clearTimeout(t);}},[msg]); if(!msg) return null; return <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:T.text,color:T.white,borderRadius:12,padding:"12px 22px",fontSize:13,fontWeight:600,zIndex:9999,whiteSpace:"nowrap",boxShadow:"0 8px 24px rgba(0,0,0,.18)"}}>{msg}</div>; };

const DayEntryCard = ({entry,diff}) => {
  const [open,setOpen]=useState(false);
  const tv=totalV(entry),tg=totalG(entry),hasDiff=diff!=null&&Math.abs(diff)>0.01;
  return (
    <div style={{marginBottom:10,border:`1px solid ${hasDiff?T.warning:T.border}`,borderRadius:12,overflow:"hidden",background:hasDiff?"#FFFBF0":T.bg}}>
      <button onClick={()=>setOpen(!open)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
        <div>
          <div style={{fontWeight:700,fontSize:13,color:T.text}}>{entry.fecha} <span style={{fontWeight:500,color:T.textLight,fontSize:12}}>— {entry.sucursal||""}</span></div>
          <div style={{fontSize:11,color:T.textLight,marginTop:2}}>
            <span style={{color:T.accent,fontWeight:600}}>+{fmt(tv)}</span>{" "}
            <span style={{color:T.expense,fontWeight:600}}>−{fmt(tg)}</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {hasDiff&&<Badge color={T.warning} bg={T.warningLight}>{diff>0?"+":""}{fmt(diff)}</Badge>}
          {entry.caja==null&&<Badge color={T.textLight} bg={T.border}>Sin caja</Badge>}
          <Icon name={open?"chevDown":"chevRight"} size={16} color={T.textLight}/>
        </div>
      </button>
      {open&&(
        <div style={{padding:"0 14px 14px",borderTop:`1px solid ${T.border}`}}>
          {(entry.ventas||[]).map((v,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:`1px solid ${T.border}`}}>
              <span style={{color:T.textMid}}>{v.concepto}</span><span style={{fontWeight:600,color:T.text}}>{fmt(v.monto)}</span>
            </div>
          ))}
          {(entry.gastos||[]).map((g,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:`1px solid ${T.border}`}}>
              <span style={{color:T.textMid}}>{g.concepto}</span><span style={{fontWeight:600,color:T.expense}}>{fmt(g.monto)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const useBackup = (data, setData, toast) => {
  const [status, setStatus] = useState("idle");
  const [lastSync, setLastSync] = useState(LS.get("ventas_lastSync", null));
  const urlConfigurada = APPS_SCRIPT_URL && !APPS_SCRIPT_URL.includes("TU_URL_AQUI");

  const saveToCloud = useCallback(async () => {
    if (!urlConfigurada) return;
    setStatus("syncing");
    try {
      const payload = { ...data, _savedAt: new Date().toISOString() };
      const res = await fetch(APPS_SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
      const json = await res.json();
      if (json.ok) {
        const now = new Date().toISOString();
        setLastSync(now); LS.set("ventas_lastSync", now);
        setStatus("ok"); toast("✓ Respaldo guardado");
      }
    } catch (err) { setStatus("error"); toast("Error al guardar"); }
  }, [data, urlConfigurada]);

  const restoreFromCloud = useCallback(async () => {
    if (!urlConfigurada) return;
    setStatus("syncing");
    try {
      const res = await fetch(APPS_SCRIPT_URL);
      const json = await res.json();
      if (json.entries) {
        setData(json); LS.set("ventas_entries", json.entries);
        const now = new Date().toISOString();
        setLastSync(now); LS.set("ventas_lastSync", now);
        setStatus("ok"); toast("✓ Restaurado");
      }
    } catch (err) { setStatus("error"); toast("Error al restaurar"); }
  }, [urlConfigurada]);

  return { status, lastSync, urlConfigurada, saveToCloud, restoreFromCloud };
};

// ─── VIEWS ────────────────────────────────────────────────────────────────────
const Dashboard = ({data}) => {
  const [period,setPeriod]=useState("semana");
  const filtered = filterPeriod(data.entries, period);
  const sumV = filtered.reduce((a,e)=>a+totalV(e),0);
  const sumG = filtered.reduce((a,e)=>a+totalG(e),0);
  return (
    <div>
      <PeriodToggle value={period} onChange={setPeriod}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <StatCard label="Ventas" value={fmt(sumV)} icon={<Icon name="trendUp" size={18}/>}/>
        <StatCard label="Gastos" value={fmt(sumG)} icon={<Icon name="trendDown" size={18}/>} accent={T.expense} accentBg={T.expenseLight}/>
      </div>
    </div>
  );
};

const SucursalDetail = ({data}) => {
  const [sel,setSel]=useState(data.sucursales[0]||"");
  const sorted = [...data.entries].filter(e=>e.sucursal===sel).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  return (
    <div>
      <SucursalPicker value={sel} onChange={setSel} sucursales={data.sucursales}/>
      <Card><div style={{fontWeight:700,marginBottom:12}}>Movimientos</div>{sorted.map(e=><DayEntryCard key={e.id} entry={e}/>)}</Card>
    </div>
  );
};

// ─── REGISTRO INDIVIDUAL ──────────────────────────────────────────────────────
const Registro = ({data,setData,toast}) => {
  const makeEmpty=()=>({fecha:today(),sucursal:data.sucursales[0]||"",otraSucursal:"",tipo:"VENTA",concepto:(data.conceptosVenta||[])[0]||"",monto:"",caja:""});
  const [form,setForm]=useState(makeEmpty);
  const sf=(k,v)=>setForm(f=>({...f,[k]:v}));

  const handleSave=()=>{
    const suc=form.sucursal==="__otra"?form.otraSucursal.trim():form.sucursal;
    if(!suc||!form.concepto||!form.monto){toast("Faltan datos");return;}
    const entry={
      id:`${Date.now()}`, fecha:form.fecha, sucursal:suc,
      ventas:form.tipo==="VENTA"?[{concepto:form.concepto,monto:parseFloat(form.monto)}]:[],
      gastos:form.tipo==="GASTO"?[{concepto:form.concepto,monto:parseFloat(form.monto)}]:[],
      caja:form.caja?parseFloat(form.caja):null
    };
    const ne=[...data.entries,entry]; setData(d=>({...d,entries:ne})); LS.set("ventas_entries",ne);
    setForm(f=>({...f,monto:"",caja:""})); toast("✓ Guardado");
  };

  const iS={width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.card,fontSize:14,color:T.text,outline:"none"};

  return (
    <Card>
      <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:700}}>FECHA</label><input type="date" value={form.fecha} onChange={e=>sf("fecha",e.target.value)} style={iS}/></div>
      <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:700}}>SUCURSAL</label><select value={form.sucursal} onChange={e=>sf("sucursal",e.target.value)} style={iS}>{data.sucursales.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button onClick={()=>sf("tipo","VENTA")} style={{flex:1,padding:12,borderRadius:10,background:form.tipo==="VENTA"?T.accent:T.border,color:form.tipo==="VENTA"?T.white:T.textMid,border:"none",fontWeight:700}}>VENTA</button>
        <button onClick={()=>sf("tipo","GASTO")} style={{flex:1,padding:12,borderRadius:10,background:form.tipo==="GASTO"?T.expense:T.border,color:form.tipo==="GASTO"?T.white:T.textMid,border:"none",fontWeight:700}}>GASTO</button>
      </div>
      <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:700}}>CONCEPTO</label><select value={form.concepto} onChange={e=>sf("concepto",e.target.value)} style={iS}>{(form.tipo==="VENTA"?data.conceptosVenta:data.conceptosGasto).map(c=><option key={c} value={c}>{c}</option>)}</select></div>
      <div style={{marginBottom:18}}><label style={{fontSize:11,fontWeight:700}}>MONTO ($)</label><input type="number" value={form.monto} onChange={e=>sf("monto",e.target.value)} placeholder="0.00" style={iS}/></div>
      <button onClick={handleSave} style={{width:"100%",padding:15,borderRadius:12,background:T.primary,color:T.white,border:"none",fontWeight:800}}>Guardar Registro</button>
    </Card>
  );
};

const Balance = ({data}) => <Card>Historial: {[...data.entries].reverse().map(e=><DayEntryCard key={e.id} entry={e}/>)}</Card>;
const Backups = ({backup}) => <Card><button onClick={backup.saveToCloud} style={{width:"100%",padding:12,background:T.accent,color:white,border:"none",borderRadius:10,marginBottom:10}}>Guardar Nube</button><button onClick={backup.restoreFromCloud} style={{width:"100%",padding:12,background:T.card,border:`1px solid ${T.border}`,borderRadius:10}}>Restaurar</button></Card>;

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [sidebar, setSidebar] = useState(false);
  const [toast, setToast] = useState("");
  
  const [data, setData] = useState(() => ({
    entries: LS.get("ventas_entries", []),
    sucursales: LS.get("ventas_sucursales", SUCURSALES_DEFAULT),
    conceptosVenta: LS.get("ventas_conceptosVenta", CONCEPTOS_VENTA_DEFAULT),
    conceptosGasto: LS.get("ventas_conceptosGasto", CONCEPTOS_GASTO_DEFAULT),
  }));

  const backup = useBackup(data, setData, m => setToast(m));

  const TABS = [
    {id:"dashboard", label:"Inicio", icon:"dashboard"},
    {id:"sucursal", label:"Sucursal", icon:"store"},
    {id:"registro", label:"Registrar", icon:"plus"},
    {id:"balance", label:"Balance", icon:"wallet"}
  ];

  const views = {
    dashboard: <Dashboard data={data}/>,
    sucursal: <SucursalDetail data={data}/>,
    registro: <Registro data={data} setData={setData} toast={m=>setToast(m)}/>,
    balance: <Balance data={data}/>,
    respaldo: <Backups backup={backup}/>
  };

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:T.bg,minHeight:"100vh",maxWidth:480,margin:"0 auto",position:"relative"}}>
      <header style={{position:"sticky",top:0,zIndex:100,background:`${T.bg}EE`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`}}>
        <button onClick={()=>setSidebar(true)} style={{background:"none",border:"none",cursor:"pointer"}}><Icon name="menu"/></button>
        <div style={{fontWeight:900,fontSize:20}}>Ventas</div>
        <Icon name="cloud" size={20} color={backup.status==="ok"?T.accent:T.textLight}/>
      </header>

      <main style={{padding:20}}>{views[tab]}</main>

      <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:T.card,display:"flex",padding:"10px 0 20px",borderTop:`1px solid ${T.border}`}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",background:"none",border:"none"}}>
            <Icon name={t.icon} color={tab===t.id?T.accent:T.textLight}/>
            <span style={{fontSize:10,color:tab===t.id?T.accent:T.textLight}}>{t.label}</span>
          </button>
        ))}
      </nav>

      {sidebar && (
        <>
          <div onClick={()=>setSidebar(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200}}/>
          <aside style={{position:"fixed",top:0,left:0,bottom:0,width:280,background:T.primary,zIndex:201,padding:20,color:T.white}}>
             <div style={{display:"flex",justifyContent:"space-between",marginBottom:30}}><h2>Ventas</h2><button onClick={()=>setSidebar(false)} style={{background:"none",border:"none",color:T.white}}>X</button></div>
             <button onClick={()=>{setTab("respaldo");setSidebar(false)}} style={{width:"100%",textAlign:"left",padding:12,background:"none",border:"none",color:T.white,fontWeight:700}}>RESPALDO NUBE</button>
          </aside>
        </>
      )}
      <Toast msg={toast} onClose={()=>setToast("")}/>
    </div>
  );
}

window.App = App;
