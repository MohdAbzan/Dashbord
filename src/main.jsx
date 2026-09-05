import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import Papa from "papaparse";
import { BarChart3, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, Database, Download, Filter, Globe2, LayoutDashboard, Moon, Package, RotateCcw, Search, Sparkles, Sun, Target, TrendingDown, TrendingUp, Upload, X } from "lucide-react";
import "./styles.css";

const DEMO_DATA = [
  { Date:"2026-01-05", Customer:"Ahmed Khan", Product:"Laptop", Category:"Electronics", Region:"Dubai", Sales:4200, Quantity:2, Profit:850 },
  { Date:"2026-01-08", Customer:"Sara Ali", Product:"Monitor", Category:"Electronics", Region:"Abu Dhabi", Sales:1800, Quantity:3, Profit:360 },
  { Date:"2026-01-12", Customer:"Omar Hassan", Product:"Keyboard", Category:"Accessories", Region:"Dubai", Sales:450, Quantity:5, Profit:120 },
  { Date:"2026-01-15", Customer:"Fatima Noor", Product:"Mouse", Category:"Accessories", Region:"Sharjah", Sales:300, Quantity:6, Profit:90 },
  { Date:"2026-01-20", Customer:"Ali Raza", Product:"Laptop", Category:"Electronics", Region:"Abu Dhabi", Sales:2100, Quantity:1, Profit:420 },
  { Date:"2026-01-25", Customer:"Maryam Khan", Product:"Headphones", Category:"Electronics", Region:"Dubai", Sales:750, Quantity:5, Profit:180 },
  { Date:"2026-02-02", Customer:"Hassan Ahmed", Product:"Monitor", Category:"Electronics", Region:"Sharjah", Sales:1200, Quantity:2, Profit:240 },
  { Date:"2026-02-07", Customer:"Ayesha Malik", Product:"Keyboard", Category:"Accessories", Region:"Dubai", Sales:540, Quantity:6, Profit:150 },
  { Date:"2026-02-14", Customer:"Zaid Khan", Product:"Laptop", Category:"Electronics", Region:"Abu Dhabi", Sales:6300, Quantity:3, Profit:1260 },
  { Date:"2026-02-18", Customer:"Noura Ali", Product:"Mouse", Category:"Accessories", Region:"Dubai", Sales:250, Quantity:5, Profit:75 },
  { Date:"2026-02-22", Customer:"Yusuf Omar", Product:"Headphones", Category:"Electronics", Region:"Sharjah", Sales:900, Quantity:6, Profit:210 },
  { Date:"2026-03-01", Customer:"Sana Ahmed", Product:"Monitor", Category:"Electronics", Region:"Dubai", Sales:2400, Quantity:4, Profit:480 },
  { Date:"2026-03-05", Customer:"Imran Khan", Product:"Laptop", Category:"Electronics", Region:"Sharjah", Sales:4200, Quantity:2, Profit:840 },
  { Date:"2026-03-10", Customer:"Huda Ali", Product:"Keyboard", Category:"Accessories", Region:"Abu Dhabi", Sales:360, Quantity:4, Profit:100 },
  { Date:"2026-03-15", Customer:"Khalid Hassan", Product:"Mouse", Category:"Accessories", Region:"Dubai", Sales:400, Quantity:8, Profit:120 },
  { Date:"2026-03-20", Customer:"Maha Noor", Product:"Headphones", Category:"Electronics", Region:"Abu Dhabi", Sales:1050, Quantity:7, Profit:260 },
  { Date:"2026-03-25", Customer:"Sameer Ali", Product:"Monitor", Category:"Electronics", Region:"Sharjah", Sales:1800, Quantity:3, Profit:360 },
  { Date:"2026-04-02", Customer:"Reem Khan", Product:"Laptop", Category:"Electronics", Region:"Dubai", Sales:8400, Quantity:4, Profit:1680 },
  { Date:"2026-04-08", Customer:"Saif Ahmed", Product:"Keyboard", Category:"Accessories", Region:"Sharjah", Sales:630, Quantity:7, Profit:175 },
  { Date:"2026-04-15", Customer:"Lina Hassan", Product:"Mouse", Category:"Accessories", Region:"Abu Dhabi", Sales:350, Quantity:7, Profit:105 }
];

const money = v => new Intl.NumberFormat("en-US", {style:"currency", currency:"USD", maximumFractionDigits:0}).format(v || 0);
const num = v => new Intl.NumberFormat("en-US", {maximumFractionDigits:0}).format(v || 0);
const pct = v => `${(v || 0).toFixed(1)}%`;
const n = v => { const x = Number(String(v ?? "").replace(/[$,%\s,]/g,"")); return Number.isFinite(x) ? x : 0; };
const dateOf = v => { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; };
const monthKey = v => { const d = dateOf(v); return d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}` : String(v ?? "Unknown"); };
const monthLabel = k => { const [y,m] = k.split("-"); if (!m) return k; return new Date(Number(y), Number(m)-1, 1).toLocaleDateString("en-US", {month:"short", year:"2-digit"}); };
const isNumeric = (rows, key) => { const vals = rows.map(r=>r[key]).filter(v=>v!=="" && v!=null); return vals.length>0 && vals.filter(v=>Number.isFinite(n(v))).length/vals.length > .8; };

function analyze(rows) {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const numeric = columns.filter(c=>isNumeric(rows,c));
  const salesKey = numeric.find(c=>/sales|revenue|amount|income|turnover|value/i.test(c)) || numeric[0];
  const profitKey = numeric.find(c=>/profit|margin/i.test(c));
  const qtyKey = numeric.find(c=>/quantity|qty|units/i.test(c));
  const dateKey = columns.find(c=>/date|month|period|time/i.test(c));
  const categoryKey = columns.find(c=>/category|segment|department/i.test(c));
  const productKey = columns.find(c=>/product|item|sku/i.test(c));
  const regionKey = columns.find(c=>/region|country|state|city|location|geography/i.test(c));
  const missing = columns.reduce((a,c)=>a+rows.filter(r=>r[c]===""||r[c]==null).length,0);
  const duplicates = rows.length - new Set(rows.map(r=>JSON.stringify(r))).size;
  return {columns,numeric,salesKey,profitKey,qtyKey,dateKey,categoryKey,productKey,regionKey,missing,duplicates};
}

function aggregate(rows, key, valueKey) {
  const map = new Map();
  rows.forEach(r=>{ const k=String(r[key] ?? "Unknown"); map.set(k,(map.get(k)||0)+n(r[valueKey])); });
  return [...map].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);
}

function KPI({title,value,sub,icon,positive=true}) {
  return <div className="kpi-card"><div className="kpi-icon">{icon}</div><div className="kpi-label">{title}</div><div className="kpi-value">{value}</div><div className={positive?"kpi-sub positive":"kpi-sub negative"}>{sub}</div></div>;
}

function TrendChart({data, currency=true}) {
  if (!data.length) return <div className="empty-chart">Add a date and numeric sales field to display the trend.</div>;
  const w=900,h=300,p=42,max=Math.max(...data.map(x=>x.value),1), min=0;
  const pts=data.map((x,i)=>[p+i*(w-p*2)/Math.max(1,data.length-1), h-p-(x.value-min)/(max-min)*(h-p*2)]);
  const line=pts.map((p,i)=>`${i?"L":"M"}${p[0]},${p[1]}`).join(" ");
  const area=`M${pts[0][0]},${h-p} ${pts.map(p=>`L${p[0]},${p[1]}`).join(" ")} L${pts.at(-1)[0]},${h-p} Z`;
  return <div className="trend-wrap"><svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
    {[0,1,2,3,4].map(i=><line key={i} x1={p} x2={w-p} y1={p+i*(h-p*2)/4} y2={p+i*(h-p*2)/4} className="gridline"/>)}
    <path d={area} className="area-fill"/><path d={line} className="trend-line"/>
    {pts.map((point,i)=><circle key={i} cx={point[0]} cy={point[1]} r="4" className="trend-point"><title>{data[i].label}: {currency?money(data[i].value):num(data[i].value)}</title></circle>)}
  </svg><div className="xlabels">{data.map((x,i)=><span key={i}>{x.label}</span>)}</div></div>;
}

function HorizontalBars({data,currency=true,limit=6}) {
  const items=data.slice(0,limit), max=Math.max(...items.map(x=>x.value),1);
  return <div className="bars">{items.map((x,i)=><div className="bar-row" key={x.label}><div className="bar-name"><span>{i+1}</span><strong>{x.label}</strong><b>{currency?money(x.value):num(x.value)}</b></div><div className="bar-track"><i style={{width:`${Math.max(4,x.value/max*100)}%`}}/></div></div>)}{!items.length&&<div className="empty-chart">No segment data available.</div>}</div>;
}

function HierarchyChart({rows, stats, onProductFilter, currency=true}) {
  const [expanded, setExpanded] = useState(null);
  if (!stats.categoryKey || !stats.productKey || !stats.salesKey) return <HorizontalBars data={[]} />;
  const cats = aggregate(rows, stats.categoryKey, stats.salesKey);
  const max = Math.max(...cats.map(x=>x.value),1);
  return <div className="hierarchy">{cats.map((cat,i)=>{
    const open=expanded===cat.label;
    const children=aggregate(rows.filter(r=>String(r[stats.categoryKey])===cat.label), stats.productKey, stats.salesKey);
    return <div className="hier-row" key={cat.label}>
      <button className="hier-main" onClick={()=>setExpanded(open?null:cat.label)}><span className="rank">{i+1}</span><span className="hier-name"><ChevronRight size={13} className={open?"rot": ""}/>{cat.label}</span><b>{currency?money(cat.value):num(cat.value)}</b></button>
      <div className="bar-track"><i style={{width:`${Math.max(4,cat.value/max*100)}%`}}/></div>
      {open&&<div className="children">{children.map(child=><button key={child.label} className="child-row" onClick={()=>onProductFilter(child.label)}><span>↳ {child.label}</span><b>{currency?money(child.value):num(child.value)}</b></button>)}</div>}
    </div>;
  })}</div>;
}

function FilterSelect({label,value,onChange,options,allLabel="All"}) {
  return <label className="filter"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}><option value="">{allLabel}</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select><ChevronDown size={14}/></label>;
}

function App(){
  const [rows,setRows]=useState(DEMO_DATA), [fileName,setFileName]=useState("Demo sales dataset"), [dark,setDark]=useState(true);
  const [category,setCategory]=useState(""),[region,setRegion]=useState(""),[product,setProduct]=useState(""),[dateFrom,setDateFrom]=useState(""),[dateTo,setDateTo]=useState("");
  const [drill,setDrill]=useState("category"),[query,setQuery]=useState(""),[page,setPage]=useState("dashboard"),[toast,setToast]=useState("");
  const stats=useMemo(()=>analyze(rows),[rows]);
  const options=useMemo(()=>({
    category:stats.categoryKey?[...new Set(rows.map(r=>String(r[stats.categoryKey]??"")))].filter(Boolean).sort():[],
    region:stats.regionKey?[...new Set(rows.map(r=>String(r[stats.regionKey]??"")))].filter(Boolean).sort():[],
    product:stats.productKey?[...new Set(rows.map(r=>String(r[stats.productKey]??"")))].filter(Boolean).sort():[]
  }),[rows,stats]);
  const filtered=useMemo(()=>rows.filter(r=>{
    const d=stats.dateKey?dateOf(r[stats.dateKey]):null;
    return (!category||!stats.categoryKey||String(r[stats.categoryKey])===category)&&(!region||!stats.regionKey||String(r[stats.regionKey])===region)&&(!product||!stats.productKey||String(r[stats.productKey])===product)&&(!dateFrom||!d||d>=new Date(`${dateFrom}T00:00:00`))&&(!dateTo||!d||d<=new Date(`${dateTo}T23:59:59`))&&(!query||Object.values(r).some(v=>String(v).toLowerCase().includes(query.toLowerCase())));
  }),[rows,stats,category,region,product,dateFrom,dateTo,query]);
  const salesKey=stats.salesKey, profitKey=stats.profitKey, qtyKey=stats.qtyKey;
  const totalSales=useMemo(()=>filtered.reduce((a,r)=>a+n(r[salesKey]),0),[filtered,salesKey]);
  const totalProfit=useMemo(()=>profitKey?filtered.reduce((a,r)=>a+n(r[profitKey]),0):0,[filtered,profitKey]);
  const totalQty=useMemo(()=>qtyKey?filtered.reduce((a,r)=>a+n(r[qtyKey]),0):filtered.length,[filtered,qtyKey]);
  const margin=totalSales?totalProfit/totalSales*100:0;
  const uniqueCustomers=stats.columns.find(c=>/customer|client|account/i.test(c));
  const customers=uniqueCustomers?new Set(filtered.map(r=>String(r[uniqueCustomers]))).size:filtered.length;
  const aov=customers?totalSales/customers:0;
  const trend=useMemo(()=>{
    if(!stats.dateKey||!salesKey)return [];
    const map=new Map(); filtered.forEach(r=>{const k=monthKey(r[stats.dateKey]);map.set(k,(map.get(k)||0)+n(r[salesKey]));});
    return [...map].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>({label:monthLabel(k),value:v}));
  },[filtered,stats,salesKey]);
  const categories=stats.categoryKey&&salesKey?aggregate(filtered,stats.categoryKey,salesKey):[];
  const products=stats.productKey&&salesKey?aggregate(filtered,stats.productKey,salesKey):[];
  const regions=stats.regionKey&&salesKey?aggregate(filtered,stats.regionKey,salesKey):[];
  const drillData=drill==="category"?categories:drill==="region"?regions:products;
  const topProduct=products[0]?.label||"—", topRegion=regions[0]?.label||"—";
  const first=trend[0]?.value||0,last=trend.at(-1)?.value||0,growth=first?((last-first)/first)*100:0;
  const reset=()=>{setCategory("");setRegion("");setProduct("");setDateFrom("");setDateTo("");setQuery("");};
  const showToast=m=>{setToast(m);setTimeout(()=>setToast(""),2200)};
  const parseFile=file=>{if(!file)return;if(!/\.csv$/i.test(file.name)){showToast("Please choose a CSV file");return;}Papa.parse(file,{header:true,skipEmptyLines:true,complete:r=>{const clean=r.data.filter(x=>Object.values(x).some(v=>v!==""));if(!clean.length){showToast("No usable rows found");return;}setRows(clean);setFileName(file.name);reset();showToast(`Loaded ${num(clean.length)} rows`);},error:()=>showToast("Could not read the CSV")});};
  const exportCSV=()=>{const blob=new Blob([Papa.unparse(filtered)],{type:"text/csv;charset=utf-8"});const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download="datalens-sales-export.csv";a.click();URL.revokeObjectURL(u);};
  const insights=[
    topProduct!=="—"?`${topProduct} is the leading product by sales.`:"Upload product data to identify the sales leader.",
    topRegion!=="—"?`${topRegion} is the strongest region in the current selection.`:"Region performance will appear when geographic fields are available.",
    growth!==0?`The latest month is ${Math.abs(growth).toFixed(1)}% ${growth>0?"above":"below"} the first month in this selection.`:"Select a broader date range to reveal trend movement.",
    profitKey?`Overall profit margin is ${margin.toFixed(1)}% for the selected slice.`:"Add a Profit column to unlock margin analysis."
  ];

  return <div className={dark?"app dark":"app light"}>
    <header className="header"><div className="brand"><div className="brand-logo"><BarChart3 size={19}/></div><div><b>DataLens</b><small>SALES INTELLIGENCE</small></div></div>
      <nav><button className={page==="dashboard"?"active":""} onClick={()=>setPage("dashboard")}><LayoutDashboard size={15}/>Dashboard</button><button className={page==="data"?"active":""} onClick={()=>setPage("data")}><Database size={15}/>Data</button></nav>
      <div className="header-actions"><button className="icon-btn" onClick={()=>setDark(x=>!x)}>{dark?<Sun size={17}/>:<Moon size={17}/>}</button><label className="import-btn"><Upload size={15}/>Import CSV<input type="file" accept=".csv,text/csv" hidden onChange={e=>parseFile(e.target.files?.[0])}/></label></div>
    </header>
    <main>
      <section className="title-row"><div><div className="eyebrow"><span/>EXECUTIVE SALES OVERVIEW</div><h1>Sales performance, <em>at a glance.</em></h1><p>Interactive revenue, product, regional and profitability analysis designed for fast decisions.</p></div><div className="title-actions"><button className="secondary" onClick={reset}><RotateCcw size={14}/>Reset</button><button className="primary" onClick={exportCSV}><Download size={14}/>Export selection</button></div></section>
      <section className="filter-panel"><div className="filter-heading"><Filter size={15}/><strong>Explore performance</strong><span>{num(filtered.length)} of {num(rows.length)} rows</span></div><div className="filters"><FilterSelect label="Category" value={category} onChange={setCategory} options={options.category}/><FilterSelect label="Region" value={region} onChange={setRegion} options={options.region}/><FilterSelect label="Product" value={product} onChange={setProduct} options={options.product}/><label className="filter"><span>From</span><input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/></label><label className="filter"><span>To</span><input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}/></label></div></section>
      {page==="dashboard"&&<>
        <section className="kpi-grid"><KPI title="Total Sales" value={money(totalSales)} sub={`${growth>=0?"▲":"▼"} ${Math.abs(growth).toFixed(1)}% period movement`} icon={<Target size={16}/>} positive={growth>=0}/><KPI title="Total Profit" value={profitKey?money(totalProfit):"—"} sub={profitKey?`${pct(margin)} margin`:"Profit field not detected"} icon={<TrendingUp size={16}/>} positive={margin>=0}/><KPI title="Units / Records" value={num(totalQty)} sub={`${num(filtered.length)} filtered records`} icon={<Package size={16}/>} /><KPI title="Avg. Value" value={money(aov)} sub={`${num(customers)} customers / records`} icon={<Sparkles size={16}/>} /></section>
        <section className="main-grid"><div className="panel trend-panel"><div className="panel-head"><div><span>SALES TREND</span><h2>Monthly revenue trajectory</h2></div><div className="mini-stat"><b>{money(totalSales)}</b><small>selected sales</small></div></div><TrendChart data={trend}/></div><div className="panel top-panel"><div className="panel-head"><div><span>TOP PRODUCTS</span><h2>Sales leaders</h2></div><Package size={18}/></div><HorizontalBars data={products}/></div></section>
        <section className="lower-grid"><div className="panel drill-panel"><div className="panel-head"><div><span>HIERARCHICAL ANALYSIS</span><h2>{drill==="category"?"Category → Product":drill==="region"?"Regional performance":"Product performance"}</h2></div><div className="segmented"><button className={drill==="category"?"sel":""} onClick={()=>setDrill("category")}>Category</button><button className={drill==="region"?"sel":""} onClick={()=>setDrill("region")}>Region</button><button className={drill==="product"?"sel":""} onClick={()=>setDrill("product")}>Product</button></div></div><div className="hierarchy-area">{drill==="category" ? <HierarchyChart rows={filtered} stats={stats} onProductFilter={setProduct}/> : <HorizontalBars data={drillData} limit={8}/>}</div><div className="drill-note"><ChevronRight size={14}/>Select a segment above, then use the Product filter to focus the dashboard.</div></div><div className="panel insight-panel"><div className="panel-head"><div><span>DECISION LAYER</span><h2>Actionable insights</h2></div><Sparkles size={18}/></div>{insights.map((x,i)=><div className="insight" key={i}><div className="insight-num">0{i+1}</div><p>{x}</p></div>)}</div></section>
        <section className="bottom-grid"><div className="panel region-panel"><div className="panel-head"><div><span>GEOGRAPHY</span><h2>Sales by region</h2></div><Globe2 size={18}/></div><HorizontalBars data={regions}/></div><div className="panel quality-panel"><div className="panel-head"><div><span>DATA QUALITY</span><h2>Readiness check</h2></div><CheckCircle2 size={18}/></div><div className="quality-line"><span>Completeness</span><b>{pct(stats.columns.length&&rows.length?100-stats.missing/(rows.length*stats.columns.length)*100:0)}</b><i><em style={{width:`${Math.max(0,100-stats.missing/(Math.max(1,rows.length*stats.columns.length))*100)}%`}}/></i></div><div className="quality-facts"><span>Missing cells <b>{num(stats.missing)}</b></span><span>Duplicate rows <b>{num(stats.duplicates)}</b></span><span>Numeric fields <b>{num(stats.numeric.length)}</b></span></div></div></section>
      </>}
      {page==="data"&&<section className="data-page"><div className="data-head"><div><span>DATA EXPLORER</span><h2>Inspect the filtered dataset</h2></div><div className="searchbox"><Search size={15}/><input placeholder="Search rows..." value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button onClick={()=>setQuery("")}><X size={14}/></button>}</div></div><div className="table-wrap panel"><table><thead><tr>{stats.columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{filtered.slice(0,300).map((r,i)=><tr key={i}>{stats.columns.map(c=><td key={c}>{String(r[c]??"—")}</td>)}</tr>)}</tbody></table>{filtered.length>300&&<div className="table-foot">Showing first 300 rows. Export selection for the complete filtered set.</div>}</div></section>}
    </main>
    <footer><span>DataLens · Advanced Sales Intelligence</span><span>{fileName} · {num(rows.length)} records</span></footer>
    {toast&&<div className="toast"><CheckCircle2 size={15}/>{toast}</div>}
  </div>;
}
createRoot(document.getElementById("root")).render(<App/>);
