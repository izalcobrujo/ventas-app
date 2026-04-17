// VENTAS — App de Registro de Ventas y Gastos Diarios v2
// PWA + Google Drive backup — Versión con Registro Individual

const { useState, useEffect, useCallback, useMemo } = React;

// ─── Reemplaza con tu URL de Google Apps Script desplegada como Web App ────────
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

// ─── SEED DATA ────────────────────────────────────────────────────────────────
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

// ─── COLLAPSIBLE DAY ENTRY CARD ───────────────────────────────────────────────
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
          {(entry.ventas||[]).length>0&&(
            <div style={{marginTop:10}}>
              <div style={{fontSize:11,fontWeight:700,color:T.accent,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Ventas</div>
              {(entry.ventas||[]).map((v,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:`1px solid ${T.border}`}}>
                  <span style={{color:T.textMid}}>{v.concepto}</span><span style={{fontWeight:600,color:T.text}}>{fmt(v.monto)}</span>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"6px 0",fontWeight:700,color:T.accent}><span>Total ventas</span><span>{fmt(tv)}</span></div>
            </div>
          )}
          {(entry.gastos||[]).length>0&&(
            <div style={{marginTop:6}}>
              <div style={{fontSize:11,fontWeight:700,color:T.expense,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Gastos</div>
              {(entry.gastos||[]).map((g,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:`1px solid ${T.border}`}}>
                  <span style={{color:T.textMid}}>{g.concepto}</span><span style={{fontWeight:600,color:T.expense}}>{fmt(g.monto)}</span>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"6px 0",fontWeight:700,color:T.expense}><span>Total gastos</span><span>{fmt(tg)}</span></div>
            </div>
          )}
          <div style={{marginTop:8,padding:"10px 12px",background:hasDiff?T.warningLight:T.accentLight,borderRadius:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{fontWeight:600,color:T.textMid}}>Esperado en caja</span><span style={{fontWeight:700,color:T.text}}>{fmt(tv-tg)}</span></div>
            {entry.caja!=null&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginTop:4}}><span style={{fontWeight:600,color:T.textMid}}>Caja reportada</span><span style={{fontWeight:700,color:T.text}}>{fmt(entry.caja)}</span></div>}
            {hasDiff&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginTop:4}}><span style={{fontWeight:700,color:T.warning}}>Diferencia</span><span style={{fontWeight:800,color:T.warning}}>{diff>0?"+":""}{fmt(diff)}</span></div>}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── BACKUP HOOK (Google Apps Script — sin OAuth, sin Client ID) ───────────────
const useBackup = (data, setData, toast) => {
  const [status, setStatus]   = useState("idle"); // idle | syncing | ok | error
  const [lastSync, setLastSync] = useState(LS.get("ventas_lastSync", null));

  const urlConfigurada = APPS_SCRIPT_URL && !APPS_SCRIPT_URL.includes("TU_URL_AQUI");

  // Guardar en la nube via POST
  const saveToCloud = useCallback(async () => {
    if (!urlConfigurada) { toast("Configura la URL del script primero"); return; }
    setStatus("syncing");
    try {
      const payload = {
        entries:       data.entries,
        sucursales:    data.sucursales,
        conceptosVenta: data.conceptosVenta,
        conceptosGasto: data.conceptosGasto,
        _savedAt:      new Date().toISOString(),
      };
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body:   JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        const now = new Date().toISOString();
        setLastSync(now); LS.set("ventas_lastSync", now);
        setStatus("ok");
        if (json.saved === false) toast(`☁ Sin cambios (${json.reason || "igual"})`);
        else toast("✓ Respaldo guardado en la nube");
      } else {
        throw new Error(json.error || "respuesta inválida");
      }
    } catch (err) {
      setStatus("error");
      toast("Error al guardar: " + err.message);
    }
  }, [data, urlConfigurada]);

  // Restaurar desde la nube via GET
  const restoreFromCloud = useCallback(async () => {
    if (!urlConfigurada) { toast("Configura la URL del script primero"); return; }
    setStatus("syncing");
    try {
      const res  = await fetch(APPS_SCRIPT_URL);
      const json = await res.json();
      if (json.empty) { toast("No hay respaldo aún"); setStatus("idle"); return; }
      if (json.entries) {
        setData(d => ({
          ...d,
          entries:       json.entries,
          sucursales:    json.sucursales    || d.sucursales,
          conceptosVenta: json.conceptosVenta || d.conceptosVenta,
          conceptosGasto: json.conceptosGasto || d.conceptosGasto,
        }));
        LS.set("ventas_entries",       json.entries);
        LS.set("ventas_sucursales",    json.sucursales);
        LS.set("ventas_conceptosVenta", json.conceptosVenta);
        LS.set("ventas_conceptosGasto", json.conceptosGasto);
        const now = new Date().toISOString();
        setLastSync(now); LS.set("ventas_lastSync", now);
        setStatus("ok");
        toast("✓ Datos restaurados desde la nube");
      } else {
        throw new Error("formato inesperado");
      }
    } catch (err) {
      setStatus("error");
      toast("Error al restaurar: " + err.message);
    }
  }, [urlConfigurada]);

  // Auto-guardar cada 30 minutos si la URL está configurada
  useEffect(() => {
    if (!urlConfigurada) return;
    const id = setInterval(() => saveToCloud(), 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [urlConfigurada, saveToCloud]);

  return { status, lastSync, urlConfigurada, saveToCloud, restoreFromCloud };
};

// ─── FILTER HELPERS ───────────────────────────────────────────────────────────
const filterPeriod = (entries,period) => {
  const now=new Date(),cm=getMonth(today()),cw=getWeekNum(today()),cy=String(now.getFullYear());
  return entries.filter(e=>period==="mes"?getMonth(e.fecha)===cm:(getWeekNum(e.fecha)===cw&&e.fecha.slice(0,4)===cy));
};

// ─── PIE + LEGEND ─────────────────────────────────────────────────────────────
const PieSection = ({title,data:pieData}) => (
  pieData.length>0?(
    <Card style={{marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:14,color:T.text,marginBottom:14}}>{title}</div>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <PieChart data={pieData} size={110}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
          {pieData.slice(0,7).map((d,i)=>(
            <div key={d.name} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:10,height:10,borderRadius:3,background:T.pieColors[i%T.pieColors.length],flexShrink:0}}/>
              <span style={{fontSize:11,color:T.textMid,flex:1,lineHeight:1.3}}>{d.name}</span>
              <span style={{fontSize:11,fontWeight:700,color:T.text}}>{fmt(d.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  ):null
);

// ─── STATS ROW ────────────────────────────────────────────────────────────────
const StatsRow = ({sumV,sumG,neto,prom}) => (
  <>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
      <StatCard label="Ventas" value={fmt(sumV)} icon={<Icon name="trendUp" size={18}/>} accent={T.accent} accentBg={T.accentLight}/>
      <StatCard label="Gastos" value={fmt(sumG)} icon={<Icon name="trendDown" size={18}/>} accent={T.expense} accentBg={T.expenseLight}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
      <StatCard label="Neto" value={fmt(neto)} icon={<Icon name="dollar" size={18}/>} accent={neto>=0?T.accent:T.expense} accentBg={neto>=0?T.accentLight:T.expenseLight}/>
      <StatCard label="Prom. diario" value={fmt(prom)} icon={<Icon name="bar" size={18}/>} accent={T.primaryMid} accentBg="#EEF2FF"/>
    </div>
  </>
);

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({data}) => {
  const [period,setPeriod]=useState("semana");
  const [sucFilter,setSucFilter]=useState("__all");
  const now=new Date();

  const filtered=useMemo(()=>{
    let base=filterPeriod(data.entries,period);
    if(sucFilter!=="__all") base=base.filter(e=>e.sucursal===sucFilter);
    return base;
  },[data.entries,period,sucFilter]);

  const sumV=filtered.reduce((a,e)=>a+totalV(e),0);
  const sumG=filtered.reduce((a,e)=>a+totalG(e),0);
  const neto=sumV-sumG;
  const days=period==="semana"?7:new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  const prom=sumV/Math.max(days,1);

  const chartData=useMemo(()=>{
    if(period==="semana"){
      return Array.from({length:7},(_,i)=>{
        const d=new Date(now); d.setDate(d.getDate()-(6-i));
        const ds=d.toISOString().split("T")[0];
        let base=data.entries.filter(e=>e.fecha===ds);
        if(sucFilter!=="__all") base=base.filter(e=>e.sucursal===sucFilter);
        return{label:DAYS_ES[d.getDay()],value:base.reduce((a,e)=>a+totalV(e),0)};
      });
    }
    const bw={};
    filtered.forEach(e=>{const w=getWeekNum(e.fecha);bw[w]=(bw[w]||0)+totalV(e);});
    return Object.entries(bw).sort().map(([w,v])=>({label:`S${w}`,value:v})).slice(-6);
  },[filtered,period,sucFilter,data.entries]);

  const byConcepto=useMemo(()=>{
    const m={};
    filtered.forEach(e=>(e.ventas||[]).forEach(v=>{m[v.concepto]=(m[v.concepto]||0)+Number(v.monto);}));
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value}));
  },[filtered]);

  const byBranch=useMemo(()=>{
    const m={};
    filtered.forEach(e=>{m[e.sucursal]=(m[e.sucursal]||0)+totalV(e);});
    return Object.entries(m).sort((a,b)=>b[1]-a[1]);
  },[filtered]);

  return (
    <div style={{paddingBottom:12}}>
      <PeriodToggle value={period} onChange={setPeriod}/>
      <SucursalPicker value={sucFilter} onChange={setSucFilter} sucursales={data.sucursales} showAll/>
      <StatsRow sumV={sumV} sumG={sumG} neto={neto} prom={prom}/>

      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <span style={{fontWeight:700,fontSize:14,color:T.text}}>Tendencia de ventas</span>
          <Badge color={T.accent} bg={T.accentLight}>Ventas</Badge>
        </div>
        <MiniBar data={chartData} colorFn={(_,i)=>i===chartData.length-1?T.accent:`${T.accent}66`}/>
      </Card>

      <PieSection title="Ventas por concepto" data={byConcepto}/>

      <Card>
        <div style={{fontWeight:700,fontSize:14,color:T.text,marginBottom:14}}>Ranking por sucursal</div>
        {byBranch.length===0&&<div style={{color:T.textLight,fontSize:13,textAlign:"center",padding:"12px 0"}}>Sin datos</div>}
        {byBranch.map(([suc,val],i)=>{
          const pct=sumV>0?(val/sumV)*100:0;
          return (
            <div key={suc} style={{marginBottom:i<byBranch.length-1?14:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:28,height:28,borderRadius:8,background:i===0?T.accent:T.border,color:i===0?T.white:T.textMid,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12}}>{i+1}</div>
                  <span style={{fontWeight:600,fontSize:13,color:T.text}}>{suc}</span>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:700,fontSize:13,color:T.text}}>{fmt(val)}</div>
                  <div style={{fontSize:11,color:T.textLight}}>{pct.toFixed(1)}%</div>
                </div>
              </div>
              <div style={{height:4,background:T.border,borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,background:i===0?T.accent:`${T.accent}66`,borderRadius:2,transition:"width .5s"}}/>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
};

// ─── SUCURSAL DETAIL ──────────────────────────────────────────────────────────
const SucursalDetail = ({data}) => {
  const [selected,setSelected]=useState(data.sucursales[0]||"");
  const [period,setPeriod]=useState("mes");
  const now=new Date();

  useEffect(()=>{if(!selected&&data.sucursales.length) setSelected(data.sucursales[0]);},[data.sucursales]);

  const filtered=useMemo(()=>filterPeriod(data.entries,period).filter(e=>e.sucursal===selected),[data.entries,selected,period]);
  const sumV=filtered.reduce((a,e)=>a+totalV(e),0);
  const sumG=filtered.reduce((a,e)=>a+totalG(e),0);
  const neto=sumV-sumG,ratio=sumV>0?(sumG/sumV)*100:0;
  const days=period==="semana"?7:new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  const prom=sumV/Math.max(days,1);

  const chartData=useMemo(()=>{
    const m={};
    filtered.forEach(e=>{m[e.fecha]=(m[e.fecha]||0)+totalV(e);});
    return Object.entries(m).sort().slice(-7).map(([ds,v])=>({label:DAYS_ES[new Date(ds+"T12:00:00").getDay()],value:v}));
  },[filtered]);

  const byConcepto=useMemo(()=>{
    const m={};
    filtered.forEach(e=>(e.ventas||[]).forEach(v=>{m[v.concepto]=(m[v.concepto]||0)+Number(v.monto);}));
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value}));
  },[filtered]);

  const sorted=useMemo(()=>[...filtered].sort((a,b)=>b.fecha.localeCompare(a.fecha)),[filtered]);

  return (
    <div style={{paddingBottom:12}}>
      <SucursalPicker value={selected} onChange={setSelected} sucursales={data.sucursales}/>
      <PeriodToggle value={period} onChange={setPeriod}/>
      <StatsRow sumV={sumV} sumG={sumG} neto={neto} prom={prom}/>

      <Card style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontWeight:700,fontSize:14}}>Neto del período</span>
          <span style={{fontWeight:800,fontSize:20,color:neto>=0?T.accent:T.expense}}>{fmt(neto)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.textLight,marginBottom:4}}>
          <span>Ratio gastos/ventas</span><span>{ratio.toFixed(1)}%</span>
        </div>
        <div style={{height:6,background:T.border,borderRadius:3,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${Math.min(ratio,100)}%`,background:ratio>50?T.expense:T.accent,borderRadius:3}}/>
        </div>
      </Card>

      {chartData.length>0&&(
        <Card style={{marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:13,color:T.text,marginBottom:12}}>Tendencia de ventas</div>
          <MiniBar data={chartData} colorFn={()=>T.accent}/>
        </Card>
      )}

      <PieSection title="Ventas por concepto" data={byConcepto}/>

      <Card>
        <div style={{fontWeight:700,fontSize:14,color:T.text,marginBottom:12}}>Detalle diario</div>
        {sorted.length===0&&<div style={{color:T.textLight,fontSize:13,textAlign:"center",padding:"12px 0"}}>Sin registros</div>}
        {sorted.map(e=>{
          const diff=e.caja!=null?e.caja-(totalV(e)-totalG(e)):null;
          return <DayEntryCard key={e.id} entry={e} diff={diff}/>;
        })}
      </Card>
    </div>
  );
};

// ─── REGISTRO (LÓGICA INDIVIDUALIZADA) ────────────────────────────────────────
const Registro = ({data,setData,toast}) => {
  const makeEmpty=()=>({
    fecha:today(),
    sucursal:data.sucursales[0]||"",
    otraSucursal:"",
    tipo:"VENTA",
    concepto:data.conceptosVenta[0]||"",
    monto:"",
    caja:""
  });

  const [form,setForm]=useState(makeEmpty);
  const [saving,setSaving]=useState(false);

  const iS={width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.card,fontFamily:"inherit",fontSize:14,color:T.text,outline:"none",boxSizing:"border-box"};
  const lS={fontSize:11,fontWeight:700,color:T.textLight,textTransform:"uppercase",letterSpacing:".08em",display:"block",marginBottom:5};

  const sf=(k,v)=>setForm(f=>({...f,[k]:v}));

  const handleSave=()=>{
    const suc=form.sucursal==="__otra"?form.otraSucursal.trim():form.sucursal;
    if(!suc){toast("Selecciona o escribe una sucursal");return;}
    if(!form.concepto || !form.monto){toast("Ingresa el concepto y el monto");return;}
    
    setSaving(true);
    
    const entry={
      id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,
      fecha:form.fecha,
      sucursal:suc,
      ventas:form.tipo==="VENTA" ? [{concepto:form.concepto, monto:parseFloat(form.monto)}] : [],
      gastos:form.tipo==="GASTO" ? [{concepto:form.concepto, monto:parseFloat(form.monto)}] : [],
      caja:form.caja ? parseFloat(form.caja) : null
    };

    const ne=[...data.entries,entry]; 
    let ns=data.sucursales;
    if(form.sucursal==="__otra"&&suc&&!data.sucursales.includes(suc)){
      ns=[...data.sucursales,suc];
      LS.set("ventas_sucursales",ns);
    }

    setData(d=>({...d,entries:ne,sucursales:ns})); 
    LS.set("ventas_entries",ne);

    setTimeout(()=>{
      setSaving(false);
      // Solo limpiamos monto y caja, dejamos fecha y sucursal para agilidad
      setForm(f=>({...f, monto:"", caja:""}));
      toast("✓ Guardado correctamente");
    },400);
  };

  return (
    <div style={{paddingBottom:12}}>
      <Card style={{marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:16,color:T.primary,marginBottom:18}}>Nueva entrada rápida</div>

        {/* Sucursal */}
        <div style={{marginBottom:14}}>
          <label style={lS}>Sucursal</label>
          <select value={form.sucursal} onChange={e=>sf("sucursal",e.target.value)} style={iS}>
            {data.sucursales.map(s=><option key={s} value={s}>{s}</option>)}
            <option value="__otra">OTRA...</option>
          </select>
          {form.sucursal==="__otra"&&<input value={form.otraSucursal} onChange={e=>sf("otraSucursal",e.target.value)} placeholder="Nombre de la sucursal" style={{...iS,marginTop:8}}/>}
        </div>

        {/* Fecha */}
        <div style={{marginBottom:16}}>
          <label style={lS}>Fecha</label>
          <input type="date" value={form.fecha} onChange={e=>sf("fecha",e.target.value)} style={iS}/>
        </div>

        {/* Tipo de Registro */}
        <div style={{display:"flex", gap:8, marginBottom:16}}>
          {["VENTA", "GASTO"].map(t => (
             <button key={t} onClick={()=>{
               sf("tipo", t);
               sf("concepto", t==="VENTA" ? data.conceptosVenta[0] : data.conceptosGasto[0]);
             }} style={{
               flex:1, padding:"12px", borderRadius:10, fontWeight:700, cursor:"pointer", border:"none",
               background: form.tipo === t ? (t==="VENTA" ? T.accent : T.expense) : T.border,
               color: form.tipo === t ? T.white : T.textMid
             }}>
               {t}
             </button>
          ))}
        </div>

        {/* Detalle del movimiento */}
        <div style={{background: form.tipo === "VENTA" ? `${T.accentLight}55` : `${T.expenseLight}55`, borderRadius:12, padding:16, marginBottom:16, border:`1px solid ${form.tipo==="VENTA" ? T.accentLight : T.expenseLight}`}}>
          <label style={lS}>Concepto de {form.tipo.toLowerCase()}</label>
          <select value={form.concepto} onChange={e=>{
            const v=e.target.value;
            if(v==="__nuevo"){
              const n=window.prompt("Nombre del nuevo concepto:");
              if(n){
                const up=n.trim().toUpperCase();
                const a = form.tipo === "VENTA" ? [...data.conceptosVenta, up] : [...data.conceptosGasto, up];
                if(form.tipo === "VENTA"){
                  setData(d=>({...d, conceptosVenta:a}));
                  LS.set("ventas_conceptosVenta", a);
                } else {
                  setData(d=>({...d, conceptosGasto:a}));
                  LS.set("ventas_conceptosGasto", a);
                }
                sf("concepto", up);
              }
            } else sf("concepto", v);
          }} style={{...iS, marginBottom:12}}>
            {(form.tipo === "VENTA" ? data.conceptosVenta : data.conceptosGasto).map(c=><option key={c} value={c}>{c}</option>)}
            <option value="__nuevo">＋ Nuevo concepto...</option>
          </select>

          <label style={lS}>Monto ($)</label>
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.textMid,fontWeight:700,fontSize:13}}>$</span>
            <input type="number" min="0" step="0.01" value={form.monto} onChange={e=>sf("monto", e.target.value)} placeholder="0.00" style={{...iS, paddingLeft:24}}/>
          </div>
        </div>

        {/* Caja (Opcional) */}
        <div style={{marginBottom:18}}>
          <label style={lS}>Caja reportada hoy (Opcional)</label>
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T.textMid,fontWeight:700}}>$</span>
            <input type="number" min="0" step="0.01" value={form.caja} onChange={e=>sf("caja",e.target.value)} placeholder="Solo si cierra caja hoy" style={{...iS,paddingLeft:26}}/>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:"15px 0",borderRadius:14,border:"none",background:saving?`${T.primary}99`:T.primary,color:T.white,fontFamily:"inherit",fontWeight:800,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {saving?"Guardando...":<><Icon name="check" size={18} color={T.white}/> Guardar registro</>}
        </button>
      </Card>

      <Card>
        <div style={{fontWeight:700,fontSize:14,color:T.text,marginBottom:12}}>Movimientos hoy</div>
        {data.entries.filter(e=>e.fecha===today()).length===0
          ?<div style={{color:T.textLight,fontSize:13,textAlign:"center",padding:"10px 0"}}>Sin movimientos hoy</div>
          :data.entries.filter(e=>e.fecha===today()).reverse().map(e=>{const d=e.caja!=null?e.caja-(totalV(e)-totalG(e)):null;return <DayEntryCard key={e.id} entry={e} diff={d}/>;})
        }
      </Card>
    </div>
  );
};

// ─── BALANCE ──────────────────────────────────────────────────────────────────
const Balance = ({data}) => {
  const [period,setPeriod]=useState("mes");
  const [sucFilter,setSucFilter]=useState("__all");

  const filtered=useMemo(()=>{
    let base=filterPeriod(data.entries,period);
    if(sucFilter!=="__all") base=base.filter(e=>e.sucursal===sucFilter);
    return base;
  },[data.entries,period,sucFilter]);

  const faltantes=filtered.filter(e=>e.caja!=null&&Math.abs(e.caja-(totalV(e)-totalG(e)))>0.01);
  const totalFaltante=faltantes.reduce((a,e)=>a+Math.abs(e.caja-(totalV(e)-totalG(e))),0);
  const sorted=useMemo(()=>[...filtered].sort((a,b)=>b.fecha.localeCompare(a.fecha)),[filtered]);

  return (
    <div style={{paddingBottom:12}}>
      <PeriodToggle value={period} onChange={setPeriod}/>
      <SucursalPicker value={sucFilter} onChange={setSucFilter} sucursales={data.sucursales} showAll/>

      <Card style={{marginBottom:20,background:faltantes.length>0?"#FFFBF0":"#F0FDF4",borderColor:faltantes.length>0?T.warning:"#BBF7D0"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:12,background:faltantes.length>0?T.warningLight:T.accentLight,display:"flex",alignItems:"center",justifyContent:"center",color:faltantes.length>0?T.warning:T.accent}}>
            <Icon name={faltantes.length>0?"warning":"check"} size={22}/>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:T.textMid}}>{faltantes.length>0?`${faltantes.length} diferencia(s) detectada(s)`:"Sin diferencias en este período"}</div>
            {faltantes.length>0&&<div style={{fontSize:22,fontWeight:800,color:T.warning}}>−{fmt(totalFaltante)}</div>}
          </div>
        </div>
      </Card>

      <div style={{fontWeight:700,fontSize:14,color:T.text,marginBottom:12}}>Detalle por día</div>
      {sorted.length===0&&<div style={{color:T.textLight,fontSize:13,textAlign:"center",padding:"24px 0"}}>Sin datos para este período</div>}
      {sorted.map(e=>{const d=e.caja!=null?e.caja-(totalV(e)-totalG(e)):null;return <DayEntryCard key={e.id} entry={e} diff={d}/>;
      })}
    </div>
  );
};

// ─── BACKUPS ──────────────────────────────────────────────────────────────────
const Backups = ({backup, data, setData, toast}) => {
  const {status, lastSync, urlConfigurada, saveToCloud, restoreFromCloud} = backup;

  const handleExport = () => {
    const b = new Blob([JSON.stringify({entries:data.entries,sucursales:data.sucursales,conceptosVenta:data.conceptosVenta,conceptosGasto:data.conceptosGasto,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `ventas_backup_${today()}.json`; a.click();
    toast("✓ Archivo descargado");
  };
  const handleImport = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const p = JSON.parse(ev.target.result);
        if (p.entries) {
          setData(d => ({...d, entries:p.entries, sucursales:p.sucursales||d.sucursales, conceptosVenta:p.conceptosVenta||d.conceptosVenta, conceptosGasto:p.conceptosGasto||d.conceptosGasto}));
          LS.set("ventas_entries", p.entries); LS.set("ventas_sucursales", p.sucursales);
          LS.set("ventas_conceptosVenta", p.conceptosVenta); LS.set("ventas_conceptosGasto", p.conceptosGasto);
          toast("✓ Datos importados");
        }
      } catch { toast("Error al leer el archivo"); }
    };
    r.readAsText(f);
  };
  const handleClear = () => {
    if (window.confirm("¿Eliminar TODOS los registros? Esta acción no se puede deshacer.")) {
      setData(d => ({...d, entries:[]})); LS.set("ventas_entries", []); toast("Datos eliminados");
    }
  };

  const sC = {idle:T.textLight, syncing:T.warning, ok:"#16A34A", error:T.expense};
  const sL = {idle:"Sin sincronizar", syncing:"Guardando...", ok:"Sincronizado", error:"Error"};

  return (
    <div style={{paddingBottom:12}}>
      {/* Estado nube */}
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:12,background:T.accentLight,display:"flex",alignItems:"center",justifyContent:"center",color:T.accent}}>
              <Icon name="cloud" size={20}/>
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:T.text}}>Respaldo en la nube</div>
              <div style={{fontSize:11,color:sC[status],fontWeight:600}}>{sL[status]}</div>
            </div>
          </div>
          <div style={{width:10,height:10,borderRadius:99,background:sC[status]}}/>
        </div>
        {lastSync && <div style={{fontSize:11,color:T.textLight,marginBottom:14}}>Último respaldo: {new Date(lastSync).toLocaleString("es-SV")}</div>}

        {!urlConfigurada ? (
          <div style={{padding:"12px 14px",borderRadius:10,background:T.warningLight,border:`1px solid ${T.warning}`,fontSize:12,color:T.warning,fontWeight:600,lineHeight:1.6}}>
            ⚠ URL del script no configurada.<br/>
            <span style={{fontWeight:400,color:T.textMid}}>Edita el archivo <code>ventas-app.jsx</code> y reemplaza <code>TU_URL_AQUI</code> con la URL de tu Google Apps Script.</span>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <button onClick={saveToCloud} style={{padding:"12px 0",borderRadius:12,border:"none",background:T.accent,color:T.white,fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <Icon name="cloudUp" size={16} color={T.white}/> Guardar
            </button>
            <button onClick={restoreFromCloud} style={{padding:"12px 0",borderRadius:12,border:`1.5px solid ${T.border}`,background:T.card,color:T.primaryMid,fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <Icon name="cloudDown" size={16}/> Restaurar
            </button>
          </div>
        )}
      </Card>

      {/* Manual */}
      <Card style={{marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:14,color:T.text,marginBottom:12}}>Respaldo manual (archivo)</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={handleExport} style={{padding:"12px 16px",borderRadius:12,border:`1.5px solid ${T.border}`,background:T.card,color:T.text,fontFamily:"inherit",fontWeight:600,fontSize:13,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
            <Icon name="cloudDown" size={18} color={T.primaryMid}/>
            <div><div style={{fontWeight:700}}>Descargar respaldo (JSON)</div><div style={{fontSize:11,color:T.textLight}}>{data.entries.length} registros guardados</div></div>
          </button>
          <label style={{padding:"12px 16px",borderRadius:12,border:`1.5px solid ${T.border}`,background:T.card,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
            <Icon name="cloudUp" size={18} color={T.primaryMid}/>
            <div><div style={{fontWeight:700,fontSize:13,color:T.text}}>Importar respaldo</div><div style={{fontSize:11,color:T.textLight}}>Seleccionar archivo JSON</div></div>
            <input type="file" accept=".json" onChange={handleImport} style={{display:"none"}}/>
          </label>
        </div>
      </Card>

      {/* Peligro */}
      <Card style={{borderColor:T.expenseLight}}>
        <div style={{fontWeight:700,fontSize:14,color:T.expense,marginBottom:12}}>Zona peligrosa</div>
        <button onClick={handleClear} style={{padding:"12px 16px",borderRadius:12,border:`1.5px solid ${T.expense}`,background:T.expenseLight,color:T.expense,fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer",width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <Icon name="trash" size={16} color={T.expense}/> Eliminar todos los datos
        </button>
      </Card>
    </div>
  );
};

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS=[
  {id:"dashboard",label:"Inicio",icon:"dashboard",title:"Panel general"},
  {id:"sucursal",label:"Sucursal",icon:"store",title:"Por sucursal"},
  {id:"registro",label:"Registrar",icon:"plus",title:"Nueva entrada"},
  {id:"balance",label:"Balance",icon:"wallet",title:"Balances y faltantes"},
];
const ALL_SECTIONS=[
  ...TABS,
  {id:"respaldo",label:"Respaldo",icon:"cloud",title:"Respaldo"},
];

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState("dashboard");
  const [sidebar,setSidebar]=useState(false);
  const [toast,setToast]=useState("");
  const showToast=(m)=>setToast(m);

  const [data,setData]=useState(()=>({
    entries: LS.get("ventas_entries",null)??genSeedData(),
    sucursales: LS.get("ventas_sucursales",null)??SUCURSALES_DEFAULT,
    conceptosVenta: LS.get("ventas_conceptosVenta",null)??CONCEPTOS_VENTA_DEFAULT,
    conceptosGasto: LS.get("ventas_conceptosGasto",null)??CONCEPTOS_GASTO_DEFAULT,
  }));

  useEffect(()=>{LS.set("ventas_entries",data.entries);},[data.entries]);

  const backup = useBackup(data, setData, showToast);
  const title=ALL_SECTIONS.find(t=>t.id===tab)?.title||"";

  const views={
    dashboard:<Dashboard data={data}/>,
    sucursal:<SucursalDetail data={data}/>,
    registro:<Registro data={data} setData={setData} toast={showToast}/>,
    balance:<Balance data={data}/>,
    respaldo:<Backups backup={backup} data={data} setData={setData} toast={showToast}/>,
  };

  return (
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:T.bg,minHeight:"100dvh",maxWidth:480,margin:"0 auto",position:"relative"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box}input:focus,select:focus{border-color:${T.accent}!important;outline:none}input[type=date]::-webkit-calendar-picker-indicator{opacity:.5}select{-webkit-appearance:none}`}</style>

      <header style={{position:"sticky",top:0,zIndex:100,background:`${T.bg}EE`,backdropFilter:"blur(12px)",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`}}>
        <button onClick={()=>setSidebar(true)} style={{background:"none",border:"none",cursor:"pointer",padding:4,color:T.text}}><Icon name="menu" size={22}/></button>
        <div style={{fontWeight:900,fontSize:20,color:T.primary,letterSpacing:"-0.5px"}}>Ventas</div>
        <div style={{width:34,height:34,borderRadius:10,background:T.primary,display:"flex",alignItems:"center",justifyContent:"center",color:T.white,fontSize:11,fontWeight:800}}>
          {backup.status==="syncing" ? "↻" : backup.status==="ok" ? "✓" : <Icon name="cloud" size={16} color={T.white}/>}
        </div>
      </header>

      <div style={{padding:"14px 20px 4px"}}>
        <div style={{fontSize:22,fontWeight:900,color:T.text,letterSpacing:"-0.5px"}}>{title}</div>
      </div>

      <main style={{padding:"10px 20px 100px"}}>{views[tab]}</main>

      <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:`${T.card}F8`,backdropFilter:"blur(16px)",borderTop:`1px solid ${T.border}`,display:"flex",padding:"10px 8px 20px",gap:4,zIndex:50}}>
        {TABS.map(t=>{
          const active=tab===t.id;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:active?T.primary:"none",border:"none",cursor:"pointer",padding:"8px 4px",borderRadius:12}}>
              <div style={{color:active?T.white:T.textLight}}>
                {t.id==="registro"
                  ?<div style={{width:30,height:30,borderRadius:9,background:active?T.accent:T.accentLight,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="plus" size={18} color={active?T.white:T.accent}/></div>
                  :<Icon name={t.icon} size={20} color={active?T.white:T.textLight}/>
                }
              </div>
              <span style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:active?T.white:T.textLight}}>{t.label}</span>
            </button>
          );
        })}
      </nav>

      {sidebar&&(
        <>
          <div onClick={()=>setSidebar(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200}}/>
          <aside style={{position:"fixed",top:0,left:0,bottom:0,width:280,zIndex:201,background:T.primary,display:"flex",flexDirection:"column"}}>
            <div style={{padding:"52px 24px 20px",borderBottom:"1px solid rgba(255,255,255,.1)",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:26,fontWeight:900,color:T.white,letterSpacing:"-0.5px"}}>Ventas</div>
                <button onClick={()=>setSidebar(false)} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.6)",padding:4}}><Icon name="close" size={22}/></button>
              </div>
              <div style={{fontSize:12,color:"rgba(255,255,255,.4)",marginTop:4}}>{data.entries.length} registros · {data.sucursales.length} sucursales</div>
            </div>
            {ALL_SECTIONS.map(t=>{
              const active=tab===t.id;
              return (
                <button key={t.id} onClick={()=>{setTab(t.id);setSidebar(false);}} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 24px",background:active?"rgba(255,255,255,.12)":"none",border:"none",cursor:"pointer",borderLeft:`3px solid ${active?T.accent:"transparent"}`,color:active?T.white:"rgba(255,255,255,.6)"}}>
                  <Icon name={t.icon} size={20} color={active?T.white:"rgba(255,255,255,.6)"}/>
                  <span style={{fontWeight:700,fontSize:14}}>{t.title}</span>
                </button>
              );
            })}
            <div style={{marginTop:"auto",padding:"16px 24px",borderTop:"1px solid rgba(255,255,255,.1)"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,.35)",fontWeight:600}}>
                {backup.urlConfigurada ? (backup.status==="ok" ? "☁ Nube activa" : "☁ Nube configurada") : "⚪ Nube no configurada"}<br/>
                {backup.lastSync ? `Último: ${new Date(backup.lastSync).toLocaleDateString("es-SV")}` : "Sin respaldo aún"}
              </div>
            </div>
          </aside>
        </>
      )}

      <Toast msg={toast} onClose={()=>setToast("")}/>
    </div>
  );
}

// Exponer App globalmente para que index.html pueda montarla
window.App = App;
