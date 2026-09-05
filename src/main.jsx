import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import Papa from "papaparse";
import {
  Activity, ArrowUpRight, BarChart3, CheckCircle2, Database,
  Download, FileSpreadsheet, Filter, Gauge, Layers3, Menu,
  Moon, Search, ShieldCheck, Sparkles, Sun, TrendingUp, Upload
} from "lucide-react";
import "./styles.css";

const DEMO_DATA = [
  { Month: "Jan", Revenue: 42000, Orders: 318, Customers: 242, Conversion: 3.8 },
  { Month: "Feb", Revenue: 46800, Orders: 351, Customers: 259, Conversion: 4.1 },
  { Month: "Mar", Revenue: 49200, Orders: 377, Customers: 281, Conversion: 4.4 },
  { Month: "Apr", Revenue: 53100, Orders: 402, Customers: 296, Conversion: 4.7 },
  { Month: "May", Revenue: 58600, Orders: 438, Customers: 327, Conversion: 5.0 },
  { Month: "Jun", Revenue: 64100, Orders: 479, Customers: 351, Conversion: 5.3 },
  { Month: "Jul", Revenue: 69200, Orders: 511, Customers: 379, Conversion: 5.7 },
  { Month: "Aug", Revenue: 74800, Orders: 548, Customers: 405, Conversion: 6.0 }
];

const numericValue = (v) => {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
};

const isNumericColumn = (rows, key) => {
  const values = rows.map(r => r[key]).filter(v => v !== "" && v != null);
  if (!values.length) return false;
  return values.filter(v => Number.isFinite(numericValue(v))).length / values.length > 0.8;
};

const formatNumber = v => new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(v);
const formatCurrency = v => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

function analyze(rows) {
  if (!rows.length) return null;
  const columns = Object.keys(rows[0]);
  const numeric = columns.filter(c => isNumericColumn(rows, c));
  const missing = columns.reduce((sum, c) => sum + rows.filter(r => r[c] === "" || r[c] == null).length, 0);
  const duplicateRows = rows.length - new Set(rows.map(r => JSON.stringify(r))).size;
  const revenueKey = numeric.find(c => /revenue|sales|income|amount|profit|price/i.test(c));
  const countKey = numeric.find(c => /orders|units|quantity|customers|users|count/i.test(c));
  const mainKey = revenueKey || numeric[0];
  const values = mainKey ? rows.map(r => numericValue(r[mainKey])).filter(Number.isFinite) : [];
  const total = values.reduce((a, b) => a + b, 0);
  return { columns, numeric, missing, duplicateRows, revenueKey, countKey, mainKey, values, total, average: values.length ? total / values.length : 0 };
}

function downloadCSV(rows) {
  const blob = new Blob([Papa.unparse(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = "datalens-export.csv"; link.click();
  URL.revokeObjectURL(url);
}

function KPI({ icon, label, value, note }) {
  return <div className="kpi panel">
    <div className="kpi-top"><div className="kpi-icon">{icon}</div><span>{note}</span></div>
    <strong>{value}</strong><label>{label}</label>
  </div>;
}

function Quality({ label, value }) {
  const safe = Math.max(0, Math.min(100, value || 0));
  return <div className="quality">
    <div><span>{label}</span><strong>{safe}%</strong></div>
    <div className="bar"><i style={{ width: `${safe}%` }} /></div>
  </div>;
}

function Sparkline({ data }) {
  if (!data?.length) return <div className="empty-chart">Add a numeric field to see the trajectory.</div>;
  const width = 900, height = 270, padding = 28;
  const max = Math.max(...data.map(d => d.value)), min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;
  const points = data.map((d, i) => [
    padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2),
    height - padding - ((d.value - min) / range) * (height - padding * 2)
  ]);
  const path = points.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  const area = `M${points[0][0]},${height-padding} ${points.map(p => `L${p[0]},${p[1]}`).join(" ")} L${points.at(-1)[0]},${height-padding} Z`;
  return <div className="spark-wrap">
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs><linearGradient id="fade" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopOpacity=".16"/><stop offset="100%" stopOpacity="0"/>
      </linearGradient></defs>
      {[0,1,2,3].map(i => <line key={i} x1={padding} x2={width-padding}
        y1={padding+i*((height-padding*2)/3)} y2={padding+i*((height-padding*2)/3)} className="gridline"/>)}
      <path d={area} fill="url(#fade)" className="area"/>
      <path d={path} fill="none" className="line"/>
      {points.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="4" className="point"/>)}
    </svg>
    <div className="axis">{data.map((d,i)=><span key={i}>{d.label}</span>)}</div>
  </div>;
}

function DataView({ rows, query, setQuery, onExport, reset }) {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return <section className="page-section">
    <div className="page-title"><div>
      <span className="section-kicker">DATA EXPLORER</span>
      <h1>Inspect every row.</h1><p>Search, scan, and export the exact slice you need.</p>
    </div><div className="title-actions">
      <button className="ghost-button" onClick={reset}>Reset</button>
      <button className="upload-button primary" onClick={onExport}><Download size={16}/>Export CSV</button>
    </div></div>
    <div className="toolbar panel">
      <div className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search any value..."/></div>
      <span><Filter size={15}/>{formatNumber(rows.length)} matching rows</span>
    </div>
    <div className="table-panel panel"><div className="table-scroll"><table><thead><tr>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead>
      <tbody>{rows.slice(0,200).map((r,i)=><tr key={i}>{columns.map(c=><td key={c}>{String(r[c] ?? "—")}</td>)}</tr>)}</tbody>
    </table></div>{rows.length>200&&<div className="table-note">Showing the first 200 matching rows for a fast interface.</div>}</div>
  </section>;
}

function InsightsView({ rows, stats }) {
  const key = stats?.mainKey;
  const values = key ? rows.map(r=>numericValue(r[key])).filter(Number.isFinite) : [];
  const first = values[0] || 0, last = values.at(-1) || 0;
  const change = first ? ((last-first)/Math.abs(first))*100 : 0;
  const top = key ? rows.map((r,index)=>({index,value:numericValue(r[key])||0})).sort((a,b)=>b.value-a.value).slice(0,5) : [];
  return <section className="page-section">
    <div className="page-title"><div><span className="section-kicker">DECISION LAYER</span>
      <h1>Signals worth noticing.</h1><p>DataLens converts basic profiling into concise business observations.</p>
    </div></div>
    <div className="insight-cards">
      <div className="panel insight-card featured"><div className="large-icon"><Sparkles/></div><span className="section-kicker">TREND</span>
        <h2>{change>=0 ? "The primary metric is moving upward." : "The primary metric is moving downward."}</h2>
        <p>{key ? `${key} changed ${Math.abs(change).toFixed(1)}% from the first to the latest row.` : "Add a numeric column to unlock trend analysis."}</p>
      </div>
      <div className="panel insight-card"><TrendingUp/><span className="section-kicker">AVERAGE</span>
        <strong>{key ? (/revenue|sales|income|amount/i.test(key) ? formatCurrency(stats.average) : formatNumber(stats.average)) : "—"}</strong>
        <p>Average value of {key || "the selected metric"}.</p>
      </div>
      <div className="panel insight-card"><ShieldCheck/><span className="section-kicker">QUALITY</span>
        <strong>{formatNumber(stats?.missing||0)} missing</strong><p>Cells that may need cleaning before deeper modeling.</p>
      </div>
    </div>
    <div className="panel ranking"><div className="panel-head"><div><span className="section-kicker">TOP OBSERVATIONS</span><h2>Highest metric rows</h2></div><Activity size={18}/></div>
      {top.length ? top.map((item,i)=><div className="rank-row" key={i}><span>#{i+1}</span><div className="rank-bar"><i style={{width:`${(item.value/(top[0].value||1))*100}%`}}/></div>
        <strong>{/revenue|sales|income|amount/i.test(key) ? formatCurrency(item.value) : formatNumber(item.value)}</strong></div>) : <div className="empty">No numeric metric available.</div>}
    </div>
  </section>;
}

function makeInsight(rows, stats) {
  if (!stats?.mainKey || !stats.values?.length) return "Upload a dataset with numeric fields to generate a performance signal.";
  const values = stats.values, half = Math.max(1, Math.floor(values.length/2));
  const early = values.slice(0,half).reduce((a,b)=>a+b,0)/half;
  const recent = values.slice(-half).reduce((a,b)=>a+b,0)/half;
  const pct = early ? ((recent-early)/Math.abs(early))*100 : 0;
  if (Math.abs(pct)<2) return `${stats.mainKey} is broadly stable across the dataset. Look for segment-level differences next.`;
  return `${stats.mainKey} ${pct>0?"accelerated":"softened"} by roughly ${Math.abs(pct).toFixed(1)}% between the early and recent periods.`;
}

function App() {
  const [rows,setRows]=useState(DEMO_DATA), [fileName,setFileName]=useState("Demo sales dataset");
  const [dark,setDark]=useState(true), [activePage,setActivePage]=useState("Overview");
  const [search,setSearch]=useState(""), [chartKey,setChartKey]=useState("Revenue");
  const [mobileMenu,setMobileMenu]=useState(false), [dragging,setDragging]=useState(false), [toast,setToast]=useState("");
  const stats=useMemo(()=>analyze(rows),[rows]);
  const numericKeys=stats?.numeric||[];
  const filteredRows=useMemo(()=>!search.trim()?rows:rows.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(search.toLowerCase()))),[rows,search]);
  const chartData=useMemo(()=>{
    if(!stats||!chartKey)return[];
    const labelKey=stats.columns.find(c=>/month|date|period|year|name|category/i.test(c));
    return rows.map((r,i)=>({label:r[labelKey]!==undefined?r[labelKey]:`#${i+1}`,value:numericValue(r[chartKey])||0}));
  },[rows,chartKey,stats]);

  const showToast=m=>{setToast(m);setTimeout(()=>setToast(""),2500)};
  const parseFile=file=>{
    if(!file)return;
    if(!file.name.toLowerCase().endsWith(".csv")) return showToast("Please select a CSV file.");
    Papa.parse(file,{header:true,skipEmptyLines:true,dynamicTyping:false,complete:result=>{
      const clean=result.data.filter(r=>Object.values(r).some(v=>v!==""));
      if(!clean.length)return showToast("No usable rows found.");
      setRows(clean);setFileName(file.name);setActivePage("Overview");showToast(`Loaded ${formatNumber(clean.length)} rows`);
    },error:()=>showToast("Could not read this CSV.")});
  };
  const restoreDemo=()=>{setRows(DEMO_DATA);setFileName("Demo sales dataset");setSearch("");showToast("Demo dataset restored")};

  return <div className={dark?"app dark":"app light"}>
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <header className="topbar">
      <div className="brand" onClick={()=>setActivePage("Overview")}><div className="brand-mark"><Layers3 size={19}/></div>
        <div><strong>DataLens</strong><span>analytics workspace</span></div>
      </div>
      <nav className="desktop-nav">{["Overview","Data","Insights"].map(item=><button key={item} className={activePage===item?"nav active":"nav"} onClick={()=>setActivePage(item)}>{item}</button>)}</nav>
      <div className="top-actions"><button className="icon-button" onClick={()=>setDark(v=>!v)}>{dark?<Sun size={17}/>:<Moon size={17}/>}</button>
        <label className="upload-button compact"><Upload size={16}/>Import CSV<input type="file" accept=".csv,text/csv" onChange={e=>parseFile(e.target.files?.[0])} hidden/></label>
        <button className="menu-button" onClick={()=>setMobileMenu(v=>!v)}><Menu size={19}/></button>
      </div>
    </header>
    {mobileMenu&&<div className="mobile-menu">{["Overview","Data","Insights"].map(item=><button key={item} onClick={()=>{setActivePage(item);setMobileMenu(false)}}>{item}</button>)}</div>}
    <main>
      {activePage==="Overview"&&<><section className="hero"><div><div className="eyebrow"><span className="pulse"/>LIVE WORKSPACE</div>
        <h1>Turn raw data<br/>into <em>clear decisions.</em></h1>
        <p className="hero-copy">Drop in a CSV and DataLens instantly profiles your dataset, surfaces patterns, and turns numbers into a decision-ready dashboard.</p>
        <div className="hero-actions"><label className="upload-button primary"><Upload size={17}/>Upload CSV<input type="file" accept=".csv,text/csv" onChange={e=>parseFile(e.target.files?.[0])} hidden/></label>
          <button className="ghost-button" onClick={()=>setActivePage("Data")}>Explore data<ArrowUpRight size={16}/></button></div>
      </div><div className="hero-orb"><div className="orb-grid"/><div className="orb-core"><BarChart3 size={42}/><span>DATA<br/>TO INSIGHT</span></div><div className="orbit o1"/><div className="orbit o2"/></div></section>
      <section className={dragging?"dropzone dragging":"dropzone"} onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);parseFile(e.dataTransfer.files?.[0])}}>
        <div className="drop-icon"><FileSpreadsheet size={21}/></div><div><strong>{dragging?"Release to analyze":fileName}</strong><span>CSV · {formatNumber(rows.length)} rows · {formatNumber(stats?.columns.length||0)} columns</span></div>
        <label className="small-button">Replace<input type="file" accept=".csv,text/csv" onChange={e=>parseFile(e.target.files?.[0])} hidden/></label>
      </section>
      <section className="kpi-grid">
        <KPI icon={<Database/>} label="Rows analyzed" value={formatNumber(rows.length)} note="records"/>
        <KPI icon={<Gauge/>} label="Numeric fields" value={formatNumber(numericKeys.length)} note="analysis-ready"/>
        <KPI icon={<ShieldCheck/>} label="Data quality" value={`${Math.max(0,100-Math.min(100,((stats?.missing||0)/Math.max(1,rows.length*(stats?.columns?.length||1)))*100)).toFixed(0)}%`} note="completeness"/>
        <KPI icon={<TrendingUp/>} label={stats?.mainKey||"Primary metric"} value={stats?.mainKey&&/revenue|sales|income|amount/i.test(stats.mainKey)?formatCurrency(stats.total):formatNumber(stats?.total||0)} note="total value"/>
      </section>
      <section className="dashboard-grid"><div className="panel chart-panel"><div className="panel-head"><div><span className="section-kicker">PERFORMANCE</span><h2>Metric trajectory</h2></div>
        <select value={chartKey} onChange={e=>setChartKey(e.target.value)}>{numericKeys.map(k=><option key={k} value={k}>{k}</option>)}</select></div>
        <Sparkline data={chartData}/><div className="chart-foot"><span><i className="dot"/>{chartKey}</span><strong>{chartData.length?formatNumber(chartData.at(-1).value):"—"} latest</strong></div>
      </div><div className="panel quality-panel"><div className="panel-head"><div><span className="section-kicker">DATA HEALTH</span><h2>Quality scan</h2></div><ShieldCheck size={19}/></div>
        <Quality label="Completeness" value={100-((stats?.missing||0)/Math.max(1,rows.length*(stats?.columns?.length||1)))*100}/>
        <Quality label="Unique rows" value={((rows.length - (stats?.duplicateRows || 0)) / Math.max(1, rows.length)) * 100}/>
        <div className="health-row"><span>Missing cells</span><strong>{formatNumber(stats?.missing||0)}</strong></div>
        <div className="health-row"><span>Duplicate rows</span><strong>{formatNumber(stats?.duplicateRows||0)}</strong></div>
      </div></section>
      <section className="insight-strip"><div className="insight-icon"><Sparkles size={19}/></div><div><span className="section-kicker">AUTOMATIC SIGNAL</span><strong>{makeInsight(rows,stats)}</strong></div>
        <button onClick={()=>setActivePage("Insights")}>Explore insights<ArrowUpRight size={15}/></button></section></>}
      {activePage==="Data"&&<DataView rows={filteredRows} query={search} setQuery={setSearch} onExport={()=>downloadCSV(filteredRows)} reset={restoreDemo}/>}
      {activePage==="Insights"&&<InsightsView rows={rows} stats={stats}/>}
    </main>
    <footer><span>DataLens v1.0 · Browser analytics</span><span><CheckCircle2 size={14}/>Your CSV stays in your browser</span></footer>
    {toast&&<div className="toast"><CheckCircle2 size={16}/>{toast}</div>}
  </div>;
}

createRoot(document.getElementById("root")).render(<App/>);