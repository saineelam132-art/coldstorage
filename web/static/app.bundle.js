(()=>{var jd=Object.defineProperty;var Gn=(s,e)=>()=>(s&&(e=s(s=0)),e);var Xd=(s,e)=>{for(var t in e)jd(s,t,{get:e[t],enumerable:!0})};async function it(s){if(window.STATIC_API)return window.STATIC_API.get(s);let e=await fetch(s);if(!e.ok)throw new Error(`${s}: ${e.status}`);return e.json()}async function Mn(s,e={}){if(window.STATIC_API)return window.STATIC_API.post(s,e);let t=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok)throw new Error(`${s}: ${t.status}`);return t.json()}var ur,dr,$n=Gn(()=>{ur=class{constructor(e=0,t=720){this.t=e,this.speed=t,this.playing=!0,this.last=performance.now()}tick(e=performance.now()){let t=Math.min(.25,(e-this.last)/1e3);return this.last=e,this.playing&&(this.t=(this.t+t*this.speed)%(365*86400)),window.STATIC_API&&(this.t=window.STATIC_API.clamp(this.t)),this.t}jump(e){this.t=window.STATIC_API?window.STATIC_API.clamp(e):e}},dr=class{constructor(e){this.clock=e,this.curtain=!0,this.listeners=[],this.state=null,this.raw=null,this.busy=!1,this.transform=t=>t}on(e){this.listeners.push(e),this.state&&e(this.state)}emit(){this.raw&&(this.state=this.transform({...this.raw,values:{...this.raw.values}}),this.listeners.forEach(e=>e(this.state)))}async poll(){if(!this.busy){this.busy=!0;try{this.raw=await it(`api/state?t=${this.clock.t.toFixed(0)}&curtain=${this.curtain?1:0}`),this.emit()}catch(e){console.warn(e)}this.busy=!1}}start(e=330){this.poll(),setInterval(()=>this.poll(),e)}}});function ye(s,e=""){if(s==null||Number.isNaN(s))return"\u2014";if(typeof s=="boolean")return s?"YES":"NO";let t=Xc[e]??2;return`${Number(s).toFixed(t)}${e?" "+e:""}`}function yo(s,e){let t=e?.values?.[s.quantity];return s.quantity==="door_open"?t?"OPEN":"CLOSED":s.quantity==="grid_on"?t?"GRID":"SOLAR / PCM":s.quantity==="gas_ppm"&&t==null?"no sensor connected":ye(t,s.unit)}function fr(s){return s?.source==="LIVE"?'<span class="badge live">LIVE sensor</span>':'<span class="badge sim">SIMULATED</span>'}function Pi(s,e,t){Li.innerHTML=s,Li.classList.add("on");let n=Li.getBoundingClientRect(),i=innerWidth,r=innerHeight,a=e+16,o=t-10-52;a+n.width>i-8&&(a=e-n.width-16),o+n.height>r-140&&(o=r-140-n.height),Li.style.left=`${a}px`,Li.style.top=`${Math.max(4,o)}px`}function Sn(){Li.classList.remove("on")}function xo(s){return mr=s,vo.innerHTML=s(),qc.classList.add("on"),vo}function wn(){qc.classList.remove("on"),mr=null,document.dispatchEvent(new Event("panelclose"))}function Yc(){if(!mr)return;let s=document.createElement("div");s.innerHTML=mr(),s.querySelectorAll("[data-live]").forEach(e=>{let t=vo.querySelector(`[data-live="${e.dataset.live}"]`);t&&(t.innerHTML=e.innerHTML)})}async function Zc(s,{quantity:e,t,unit:n,yTitle:i,today:r=null}){let a,o,l;if(r)a=r.labels,o=r.values,l="Real weather today (Open-Meteo, hourly)";else{let d=await it(`api/series?q=${e}&t=${t.toFixed(0)}&hours=24`);a=d.t,o=d.v.map(p=>p===null?null:typeof p=="boolean"?+p:p),l="Last 24 h of the digital twin (15-min points)"}pr&&(pr.destroy(),pr=null);let c=s.parentElement,h=c.parentElement.querySelector(".histsrc");if(h&&(h.textContent=l),!window.Chart||!o.some(d=>d!==null&&!Number.isNaN(d))){c.innerHTML='<div class="histnone">No history for this value</div>';return}let u=Xc[n]??2;pr=new window.Chart(s,{type:"line",data:{labels:a,datasets:[{label:i,data:o,borderColor:"#2a78d6",backgroundColor:"rgba(42,120,214,.12)",fill:!0,pointRadius:0,pointHoverRadius:5,pointHoverBackgroundColor:"#ef4444",borderWidth:2,tension:.25,spanGaps:!0}]},options:{responsive:!0,maintainAspectRatio:!1,animation:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!1},tooltip:{displayColors:!1,callbacks:{title:d=>`${d[0].label} IST`,label:d=>`${i}: ${d.parsed.y===null?"\u2014":d.parsed.y.toFixed(u)}${n?" "+n:""}`}}},scales:{x:{title:{display:!0,text:"Time (IST)",color:"#41566b",font:{weight:"600"}},ticks:{maxTicksLimit:7,maxRotation:0,color:"#41566b",font:{size:11}},grid:{color:"#e3ecf3"}},y:{title:{display:!0,text:n?`${i} (${n})`:i,color:"#41566b",font:{weight:"600"}},ticks:{color:"#41566b",font:{size:11}},grid:{color:"#e3ecf3"}}}},plugins:[cp]})}function Jc(s,e){let t=s.values,n=e.design.setpoint,i=Gt("d_room"),r=t.T_room_sensor??t.T_room;i.innerHTML=ye(r,"\xB0C")+(t.fault_active?`<small class="flag">${t.sensor_suspicious?"\u26A0 SENSOR SUSPICIOUS":"sensor \u2260 physics\u2026"}</small>`:""),i.className=t.sensor_suspicious||r<n.band_low_C||r>n.band_high_C?"bad":r>n.band_high_C-.5?"warn":"good",Gt("d_out").textContent=ye(t.T_out,"\xB0C"),Gt("d_load").textContent=ye(t.Q_total,"kW"),Gt("d_pv").textContent=ye(t.P_pv,"kW");let a=Gt("d_pcm");a.textContent=ye(t.pcm_pct,"%"),a.className=t.pcm_pct<e.design.controller.ats_pcm_pct?"bad":t.pcm_pct<40?"warn":"",Gt("d_backup").textContent=t.backup_h===null?"\u221E":ye(t.backup_h,"h"),Gt("d_src").textContent=t.grid_on?"GRID":t.P_solar_used>0?"SOLAR":"WAX",Gt("d_src").className=t.grid_on?"warn":"good",Gt("d_fan").textContent=`${(t.G_wax_W_K??0).toFixed(0)} W/K`,Gt("d_fan").title="Finned wax panels: passive, 0 W",Gt("d_clock").textContent=s.clock,Gt("d_src_label").innerHTML=fr(s)}var Xc,lp,xe,Li,qc,vo,mr,cp,pr,Gt,En=Gn(()=>{$n();Xc={"\xB0C":1,"%":0,kW:2,"m/s":2,Pa:2,h:1,"\xB0":0,ppm:0,"":2,"W/m\xB2":0};lp={M:"Measured by a sensor",C:"Calculated by a formula",E:"Estimated / design value",AI:"Prediction",W:"Real weather (Open-Meteo)",S:"Digital-twin simulation",L:"Live sensor reading"},xe=s=>`<span class="tag ${s}" title="${lp[s]||""}">${s}</span>`;Li=document.getElementById("tip");qc=document.getElementById("panel"),vo=document.getElementById("panelBody");document.getElementById("panelClose").onclick=()=>wn();mr=null;cp={id:"hoverLine",afterDatasetsDraw(s){let e=s.tooltip?.getActiveElements?.()||[];if(!e.length)return;let t=e[0].element.x,{top:n,bottom:i}=s.chartArea,r=s.ctx;r.save(),r.strokeStyle="rgba(13,27,42,.45)",r.lineWidth=1,r.setLineDash([4,3]),r.beginPath(),r.moveTo(t,n),r.lineTo(t,i),r.stroke(),r.restore()}},pr=null;Gt=s=>document.getElementById(s)});function eh(s){let e=devicePixelRatio||1,t=s.clientWidth,n=s.clientHeight;s.width=t*e,s.height=n*e;let i=s.getContext("2d");return i.scale(e,e),i.font="11px sans-serif",{g:i,W:t,H:n}}function bs(s,{x:e,series:t,unit:n="",band:i=null,yMin:r=null,yMax:a=null,xTitle:o=""}){let{g:l,W:c,H:h}=eh(s),u=t.flatMap(g=>g.y).filter(g=>g!==null&&!Number.isNaN(g));i&&u.push(...i);let d=r??Math.min(...u),p=a??Math.max(...u);p-d<1e-6&&(d-=1,p+=1);let f={l:36,r:8,t:10,b:30},_=Math.max(...t.map(g=>g.y.length)),m=g=>f.l+(c-f.l-f.r)*g/Math.max(1,_-1),y=g=>f.t+(h-f.t-f.b)*(1-(g-d)/(p-d));i&&(l.fillStyle="rgba(42,120,214,.08)",l.fillRect(f.l,y(i[1]),c-f.l-f.r,y(i[0])-y(i[1]))),l.strokeStyle=Qc,l.fillStyle=Kc,l.lineWidth=1;for(let g=0;g<=3;g++){let M=d+(p-d)*g/3;l.beginPath(),l.moveTo(f.l,y(M)),l.lineTo(c-f.r,y(M)),l.stroke(),l.fillText(M.toFixed(Math.abs(p-d)<5?1:0),2,y(M)+4)}e?.length&&(l.fillText(e[0],f.l,h-16),l.textAlign="right",l.fillText(e[e.length-1],c-f.r,h-16),l.textAlign="left"),l.fillText(`${o}${n?"   ("+n+")":""}`,f.l,h-3),t.forEach(g=>{l.strokeStyle=g.color,l.lineWidth=2,l.beginPath();let M=!1;g.y.forEach((T,w)=>{if(T===null||Number.isNaN(T)){M=!1;return}M?l.lineTo(m(w),y(T)):l.moveTo(m(w),y(T)),M=!0}),l.stroke()});let v=c-f.r;l.textAlign="right",[...t].reverse().forEach(g=>{g.label&&(l.fillStyle=g.color,l.fillText(g.label,v,f.t+10),v-=l.measureText(g.label).width+14)}),l.textAlign="left"}function th(s,e){let{g:t,W:n,H:i}=eh(s),r={l:40,r:10,t:10,b:30},a=100,o=720,l=1,c=45,h=p=>r.l+(n-r.l-r.r)*(p-a)/(o-a),u=p=>r.t+(i-r.t-r.b)*(1-Math.log(p/l)/Math.log(c/l));t.strokeStyle=Qc,t.fillStyle=Kc,[1,2,4,10,20,40].forEach(p=>{t.beginPath(),t.moveTo(r.l,u(p)),t.lineTo(n-r.r,u(p)),t.stroke(),t.fillText(p,4,u(p)+4)}),[200,400,600].forEach(p=>t.fillText(p,h(p)-8,i-16)),t.fillText("h, kJ/kg   \xB7   P, bar (log)",r.l,i-3),t.strokeStyle="#8a8984",t.lineWidth=1.5;for(let p of[e.dome.liquid,e.dome.vapour])t.beginPath(),p.forEach(([f,_],m)=>m?t.lineTo(h(f),u(_)):t.moveTo(h(f),u(_))),t.stroke();t.strokeStyle="#2a78d6",t.lineWidth=2.5,t.beginPath(),e.points.forEach(([p,f],_)=>_?t.lineTo(h(p),u(f)):t.moveTo(h(p),u(f))),t.stroke(),t.fillStyle="#0d1b2a",t.font="bold 12px sans-serif";let d=e.cycle;[[d.h1,d.P_evap_bar,"1",6,14],[d.h2,d.P_cond_bar,"2",6,-4],[d.h3,d.P_cond_bar,"3",-12,-4],[d.h4,d.P_evap_bar,"4",-12,14]].forEach(([p,f,_,m,y])=>{t.beginPath(),t.arc(h(p),u(f),3.5,0,7),t.fill(),t.fillText(_,h(p)+m,u(f)+y)})}var Kc,Qc,bo=Gn(()=>{Kc="#41566b",Qc="#d5e2ec"});function ih(s,e,t,n,i,r,a){Mo=s,wo=t,Eo=n,Ss=i,gr=r,a&&(nh=a),e.sensors.forEach(o=>So[o.id]=o)}function rh(s,e){return e?.source==="LIVE"&&s.tag==="M"?"L":sh.includes(s.quantity)?"W":s.tag==="C"?"C":"S"}function Ms(s){let e=Eo?.closeups?.[s],t=e&&wo?.A?.[e];return t?`<img class="closeup" src="${t.small}" alt="${s} close-up">`:""}function _r(s){return s&&wo?.B?.[s]?.src}function ah(s,e){let t=Eo?.cutouts?.[s]?.[e];if(!t)return"";if(t.startsWith("missing:"))return`<div class="cutph"><svg viewBox="0 0 80 50" width="80" height="50"><rect x="8" y="8" width="64" height="34" rx="5" fill="#e3ecf3" stroke="#93a8bb"/>
      <circle cx="26" cy="25" r="7" fill="none" stroke="#93a8bb" stroke-width="2"/><circle cx="54" cy="25" r="7" fill="none" stroke="#93a8bb" stroke-width="2"/>
      <path d="M33 25h14" stroke="#93a8bb" stroke-width="2"/></svg><span>Picture coming: ${t.slice(8)}</span></div>`;let n=_r(t);return n?`<img class="cutout" src="${n}" alt="${e}">`:""}function vr(s){let e=So[s],t=Ss();return e?`<b>${e.name}</b>${xe(rh(e,t))}<span class="v">${yo(e,t)}</span>`:""}function yr(s){if(s.startsWith("batch:"))return`<b>New batch ${s.slice(6)}</b><span class="v">click for batch card + QR</span>`;let e=jn[s],t=Ss();return!e||!t?"":`<b>${e.name}</b><span class="v">${e.headline(t.values)}</span><small>Click for details</small>`}function Ii(s){let e=So[s];if(!e)return;let t=!["door_open","door_angle","v_door_top","v_door_mid","v_door_bot","dp_top","gas_ppm","RH_room"].includes(e.quantity),i=xo(()=>{let r=Ss();return`<h2>${e.name} ${xe(rh(e,r))}</h2><div class="sub">${fr(r)}</div>
      ${ah("sensors",e.id)}
      <div class="big" data-live="v">${yo(e,r)}</div>
      ${e.tag==="C"?'<div class="note">In the twin this value is <b>calculated</b> from the door physics (ASHRAE Gosney\u2013Olama). With the real sensor fitted it becomes a measurement (M) that checks the formula.</div>':""}
      ${hp(e,r)}
      ${t?'<div class="hist"><div class="histbox"><canvas id="hist"></canvas></div><div class="histsrc"></div></div>':""}
      <table>
        <tr><td>Sensor type</td><td>${e.type}</td></tr>
        <tr><td>Range</td><td>${e.range}</td></tr>
        <tr><td>Accuracy</td><td>${e.accuracy}</td></tr>
        <tr><td>Used in</td><td>${e.used_in}</td></tr>
      </table>
      ${e.id==="t_out"||e.id==="wind"?Ms("mast"):""}
      <div class="note">${r?.label||""}</div>`});if(document.dispatchEvent(new CustomEvent("highlight",{detail:{kind:"sensor",id:s,label:`${e.name} sensor`}})),t){let r={T_out:"Outside temperature",RH_out:"Outside humidity",wind:"Wind speed"}[e.quantity]||e.name;Zc(i.querySelector("#hist"),{quantity:e.quantity,t:gr(),unit:e.unit,yTitle:r,today:sh.includes(e.quantity)?nh(e.quantity,gr()):null})}}function hp(s,e){let t=e?.values||{};return s.id==="door_angle"||s.id==="door_switch"?`<div class="kv" data-live="doorsens">
      <span>Door now</span><b>${t.door_open?"OPEN":"closed"}${t.door_by_demo?" (demo)":""}</b>
      <span>Angle</span><b>${ye(t.door_angle,"\xB0")}</b>
      <span>Seconds open today</span><b>${(t.door_open_today_s??0).toFixed(0)} s</b>
      <span>Warm air entering now</span><b>${t.door_open?`${(t.heat_now_kW*1e3).toFixed(0)} W`:"0 W"}</b></div>
      <div class="note">0\xB0 = shut, 90\xB0 = fully open. It swings in about 2 s each way.</div>`:s.id.startsWith("v_")||s.id==="dp"?`<div class="kv" data-live="door">
      <span>Door now</span><b>${t.door_open?"OPEN":"closed"}</b>
      <span>Air speed if the door opens</span><b>${ye(t.v_door_if_open,"m/s")}</b>
      <span>Heat entering if open</span><b>${ye(t.heat_if_open_kW,"kW")}</b>
      <span>Strip curtain</span><b>${t.curtain?"ON (E = 0.85)":"OFF"}</b></div>
      <div class="formula">V\u0307 = 0.221\xB7A\xB7\u221A(g\xB7H\xB7(1 \u2212 \u03C1_out/\u03C1_in))\xB7F_m<br>v \u2248 V\u0307 / (A/2) \xB7 (1 \u2212 E)<br>\u0394p_top = (\u03C1_in \u2212 \u03C1_out)\xB7g\xB7H/2</div>`:""}function ln(s){if(s.startsWith("batch:")){document.dispatchEvent(new CustomEvent("openbatch",{detail:s.slice(6)}));return}let e=jn[s];if(!e)return;let t=xo(()=>{let n=Ss();return`<h2>${e.name}</h2><div class="sub">${fr(n)}</div>
      ${ah("parts",s)}
      <div class="big" data-live="head">${n?e.headline(n.values):"\u2014"}</div>
      ${n?e.body(n.values,Mo):""}<div class="note">${n?.label||""}</div>`});document.dispatchEvent(new CustomEvent("highlight",{detail:{kind:"part",id:s,label:e.name}})),e.after&&e.after(t,gr())}function dp(s){let e=oh[s];return{name:e.name,headline:t=>`room ${ye(t.T_room,"\xB0C")}`,body:()=>`<div id="cropBody">Calculating shelf life from the room's temperature history\u2026</div>
      <canvas id="cropHist"></canvas>
      <div class="note">Entry time is an example (${e.days} day${e.days>1?"s":""} ago) ${xe("E")}. Batch ID, QR code and the
      \u201CRecord verified \u2713\u201D check come with the ledger in build step 4.</div>`,async after(t,n){let i=await it(`api/crop?key=${e.key}&t=${n.toFixed(0)}&days=${e.days}`),r=i.assess,a=r.freshness_score,o=a>70?"#22c55e":a>40?"#f59e0b":"#ef4444",l=[...r.warnings,i.chill_now].filter(Boolean);t.querySelector("#cropBody").innerHTML=`
        <div class="kv">
          <span>Stored for</span><b>${i.days_stored} day${i.days_stored>1?"s":""}</b>
          <span>Remaining shelf life (at ${i.T_ref_C} \xB0C) ${xe("C")}</span><b>${r.remaining_days_at_ref.toFixed(1)} days</b>
          <span>If kept at today's ${r.T_now_C.toFixed(1)} \xB0C ${xe("C")}</span><b>${r.remaining_days_at_current_T.toFixed(1)} days</b>
          <span>Freshness score</span><b style="color:${o}">${a.toFixed(0)} / 100</b>
          <span>Best storage</span><b>${i.T_opt[0]}\u2013${i.T_opt[1]} \xB0C</b></div>
        <div class="fresh"><i style="width:${a}%;background:${o}"></i></div>
        ${l.length?l.map(c=>`<div class="warnbox">\u26A0 ${c}</div>`).join(""):'<div class="okbox">\u2713 No chilling or freezing risk</div>'}
        <div class="formula">rate(T) = 1/SL_ref \xB7 Q10^((T \u2212 T_ref)/10)<br>remaining = SL_ref \xB7 (1 \u2212 \u03A3 rate\xB7\u0394t)<br>
        SL_ref = ${i.SL_ref_days} d at ${i.T_ref_C} \xB0C, Q10 = ${i.Q10}</div>
        <div class="note">Source: ${i.source}</div>`,bs(t.querySelector("#cropHist"),{x:[`${i.days_stored} d ago`,"now"],series:[{y:i.history_T,color:"#2a78d6",label:"room T while stored"}],unit:"\xB0C",band:[2,8],xTitle:"storage history"})}}}function pp(s){let e=s.wax_hx||{},t=s.design.live_run?.wax_hx||{},n=(r,a=0)=>r==null?"\u2014":Number(r).toFixed(a),i=_r("B16_finned_panel_cutaway");return`<div class="finbox"><b>Finned wax panel (final design)</b>
    ${i?`<img src="${i}" alt="Cut-away of a finned wax panel: copper coil in the wax, aluminium fins, drip tray">`:""}
    <div class="kv"><span>Fins</span><b>${n(e.b_mm)} mm deep \xB7 ${n(e.S_mm)} mm gap \xB7 ${n(e.t_mm)} mm thick</b>
    <span>Panel height</span><b>${n(e.L_m,1)} m</b>
    <span>Number of fins</span><b>${n(e.N_fins)}</b>
    <span>Surface area</span><b>\xD7 ${n(e.area_mult,1)}</b>
    <span>UA (room \u2194 wax)</span><b>${n(e.UA,1)} W/K</b>
    <span>Heat at 3 K</span><b>${n(e.Q_W)} W, no fan</b>
    <span>Below</span><b>drip tray + drain</b>
    <span>In front</span><b>${n((t.keep_clear_m||0)*100)} cm keep-clear zone</b></div></div>`}var Mo,So,wo,Eo,Ss,gr,nh,sh,up,jn,oh,rt,Di=Gn(()=>{En();$n();bo();Mo=null,So={},wo=null,Eo=null,Ss=()=>null,gr=()=>0,nh=()=>null;sh=["T_out","RH_out","wind"];up=s=>ye(s,"%"),jn={solar:{name:"Solar PV array",headline:s=>`${ye(s.P_pv,"kW")} now`,body:(s,e)=>{let t=e.geometry.pv;return`<div class="kv" data-live="pv">
        <span>PV power now ${xe("M")}</span><b>${ye(s.P_pv,"kW")}</b>
        <span>Sunlight on the panel ${xe("M")}</span><b>${ye(s.poa,"W/m\xB2")}</b>
        <span>Used by the compressor</span><b>${ye(s.P_solar_used,"kW")}</b>
        <span>Spare (not needed now)</span><b>${ye(Math.max(0,s.P_pv-s.P_solar_used),"kW")}</b></div>
        <table><tr><td>Array</td><td>${t.modules} modules \xD7 ${t.module_W} W = ${t.array_kWp.toFixed(2)} kWp ${xe("E")}</td></tr>
        <tr><td>Tilt / facing</td><td>${t.tilt_deg}\xB0 , south ${xe("E")}</td></tr>
        <tr><td>Performance ratio</td><td>${e.design.pv.performance_ratio}</td></tr></table>
        <div class="formula">P = P_rated\xB7(G/1000)\xB7PR\xB7[1 \u2212 0.004\xB7(T_cell \u2212 25)]<br>T_cell = T_amb + (NOCT \u2212 20)/800\xB7G</div>
        ${Ms("solar")}`}},condenser:{name:"R290 condensing unit",headline:s=>`${ye(s.P_comp,"kW")} \xB7 COP ${ye(s.cop,"")}`,body:(s,e)=>`<div class="kv" data-live="cond">
        <span>Compressor power ${xe("M")}</span><b>${ye(s.P_comp,"kW")}</b>
        <span>Cooling now ${xe("C")}</span><b>${ye(s.Q_cool,"kW")}</b>
        <span>Compressor speed ${xe("C")}</span><b>${up(s.comp_speed_pct)}</b>
        <span>COP (electrical) ${xe("C")}</span><b>${ye(s.cop,"")}</b>
        <span>Condensing temperature ${xe("C")}</span><b>${ye(s.T_out+e.design.refrigeration.cond_approach_K,"\xB0C")}</b>
        <span>Power from</span><b>${s.grid_on?"GRID (ATS)":"SOLAR"}</b></div>
        <table><tr><td>Refrigerant</td><td>R290 (propane), ${e.design.refrigeration.charge_g_min}\u2013${e.design.refrigeration.charge_g_max} g</td></tr>
        <tr><td>Max cooling</td><td>${e.design.refrigeration.design_capacity_kW} kW (inverter, 30\u2013100 %)</td></tr>
        <tr><td>Evaporating</td><td>${e.design.refrigeration.T_evap_C} \xB0C</td></tr></table>
        <div class="formula">T_cond = T_out + 10 K<br>COP_elec = (q_e / w_s)\xB7\u03B7_is\xB7\u03B7_motor (CoolProp)</div>
        ${Ms("condenser")}`},door:{name:"Door (0.8 \xD7 1.8 m) and strip curtain",headline:s=>s.door_open?`OPEN ${ye(s.door_angle,"\xB0")} \u2013 ${(s.heat_now_kW*1e3).toFixed(0)} W warm air coming in`:"closed",body:(s,e)=>`<div class="kv" data-live="door">
        <span>Door ${xe("S")}</span><b class="${s.door_open?"warnc":""}">${s.door_open?"OPEN":"closed"}${s.door_by_demo?" (demo)":""}</b>
        <span>Door angle ${xe("S")}</span><b>${ye(s.door_angle,"\xB0")}</b>
        <span>Seconds open today ${xe("S")}</span><b>${(s.door_open_today_s??0).toFixed(0)} s</b>
        <span>Warm air entering now ${xe("C")}</span><b>${s.door_open?`${(s.heat_now_kW*1e3).toFixed(0)} W`:"0 W (door shut)"}</b>
        <span>\u2026of which moisture (latent)</span><b>${(s.heat_latent_now_kW*1e3).toFixed(0)} W</b>
        <span>If the door opens fully now</span><b>${(s.heat_if_open_kW*1e3).toFixed(0)} W</b>
        <span>Strip curtain</span><b>${s.curtain?"ON (E = 0.85) \u2013 hangs in the doorway":"OFF (E = 0)"}</b>
        <span>Last opening lasted ${xe("S")}</span><b>${s.last_open_s.toFixed(0)} s</b>
        <span>Energy of that opening ${xe("C")}</span><b>${s.last_open_kJ.toFixed(0)} kJ</b>
        <span>\u2026same as the walls leak in</span><b>${s.last_open_wall_minutes.toFixed(0)} min</b></div>
        <div class="formula">q = 0.221\xB7A\xB7(h_out \u2212 h_in)\xB7\u03C1_in\xB7(1 \u2212 \u03C1_out/\u03C1_in)^0.5\xB7(g\xB7H)^0.5\xB7F_m<br>Q = q\xB7D_f\xB7(1 \u2212 E) \xB7 (angle / 90\xB0)</div>
        <div class="note">The strip curtain is seen only while the door is open (it hangs inside the doorway).
        Try the Curtain switch at the top: the warm air coming in changes immediately.</div>`},crates:{name:"Produce crates",headline:s=>s.T_batch!==null?`new batch at ${ye(s.T_batch,"\xB0C")}`:`stored at ${ye(s.T_room,"\xB0C")}`,body:(s,e)=>`<div class="kv" data-live="crates">
        <span>New batch temperature ${xe("M")}</span><b>${s.T_batch!==null?ye(s.T_batch,"\xB0C"):"no new batch now"}</b>
        <span>Heat from new batch ${xe("C")}</span><b>${ye(s.Q_batch,"kW")}</b>
        <span>Respiration heat ${xe("C")}</span><b>${ye(s.Q_resp,"kW")}</b></div>
        <table><tr><td>Daily batch</td><td>${e.design.product.batch_mass_kg} kg at ${e.design.product.T_entry_C} \xB0C, arrives ${e.design.simulation.batch_arrival_hour}:00 ${xe("E")}</td></tr>
        <tr><td>Pull-down</td><td>to ${e.design.product.T_final_C} \xB0C in ${e.design.product.pulldown_hours} h (7/8 cooling time)</td></tr>
        <tr><td>Already stored</td><td>${e.design.simulation.stock_mass_kg} kg ${xe("E")}</td></tr></table>
        <div class="formula">Q_batch = UA\xB7(T_batch \u2212 T_room),  UA = m\xB7cp\xB7ln 8 / 4 h</div>
        <div class="note">Batch IDs, QR codes and shelf life come in build step 4.</div>`},worker:{name:"Farmer bringing a crate",headline:s=>`door ${s.door_open?"OPEN":"closed"} \xB7 ${ye(s.heat_if_open_kW,"kW")} if open`,body:(s,e)=>jn.door.body(s,e)}};oh={crate_greens:{key:"leafy_greens",days:2,name:"Crate of leafy greens (spinach)"},crate_grapes:{key:"grapes",days:5,name:"Crate of grapes"},milk:{key:"milk",days:1,name:"Milk cans"},vaccine:{key:"vaccines",days:20,name:"Vaccine box (illustration)"}};Object.keys(oh).forEach(s=>jn[s]=dp(s));jn.pcm={name:"Wax (PCM) cold battery",headline:s=>`${ye(s.pcm_pct,"%")} frozen`,body:(s,e)=>{let t=e.design.pcm,n=e.geometry.pcm,i=t.mass_kg*t.latent_kJ_kg*s.pcm_pct/100/3600;return`<div class="kv" data-live="pcm">
        <span>Battery (frozen fraction) ${xe("C")}</span><b>${ye(s.pcm_pct,"%")}</b>
        <span>Backup time left ${xe("C")}</span><b>${s.backup_h===null?"\u221E":ye(s.backup_h,"h")}</b>
        <span>Wax temperature ${xe("M")}</span><b>${ye(s.T_pcm,"\xB0C")}</b>
        <span>Latent cold left ${xe("C")}</span><b>${i.toFixed(2)} kWh</b>
        <span>Melted thickness now ${xe("C")}</span><b>${((1-s.pcm_pct/100)*n.thickness_mm).toFixed(1)} of ${n.thickness_mm.toFixed(1)} mm</b>
        <span>Being charged by the coil</span><b>${ye(s.Q_coil_pcm,"kW")}</b></div>
      ${pp(e)}
      <table><tr><td>Wax</td><td>${t.mass_kg} kg paraffin, melts at ${t.T_melt_C} \xB0C, L = ${t.latent_kJ_kg} kJ/kg ${xe("E")}</td></tr>
      <tr><td>Panels</td><td>${n.area_m2} m\xB2 of wall, ${n.thickness_mm.toFixed(1)} mm thick</td></tr></table>
      <div class="formula">E = m\xB7L\xB7frozen fraction  \xB7  backup = E_remaining / holding load</div>
      <b>Melt front in one slab (FTCS model, room air 8 \xB0C)</b>
      <canvas id="slab"></canvas>
      <div class="note" id="slabNote"></div>${Ms("pcm")}`},async after(s){let e=await it("api/slab"),t=e.hours.map(n=>`${n.toFixed(0)} h`);bs(s.querySelector("#slab"),{x:[t[0],t[t.length-1]],series:[{y:e.melt_front_mm,color:"#eb6834",label:"melt front, mm"}],unit:"mm",yMin:0,yMax:e.thickness_mm*1.05,xTitle:"time"}),s.querySelector("#slabNote").textContent=`Enthalpy method, explicit FTCS: ${e.nx} cells, \u0394x = ${e.dx_mm.toFixed(2)} mm, \u0394t = ${e.dt_s.toFixed(2)} s, r = \u03B1\u0394t/\u0394x\xB2 = ${e.r.toFixed(2)} \u2264 0.5 (stable).`}};rt=(s,e=0)=>s==null||Number.isNaN(s)?"\u2014":Number(s).toFixed(e);jn.fins={name:"Finned wax panels (passive \u2013 no fan, no baffle)",headline:s=>`area \xD7 ${rt((Mo?.wax_hx||{}).area_mult,1)} \xB7 UA ${rt(s.G_wax_W_K)} W/K \xB7 0 W`,body:(s,e)=>{let t=e.wax_hx||{},n=e.design.live_run.wax_hx,i=e.design.live_run.battery_12V,r=t.plain||{},a=s.T_room-(s.T_pcm??4);return`<div class="kv" data-live="fins">
        <span>Heat into the wax now ${xe("C")}</span><b>${ye(s.Q_pcm_room,"kW")}</b>
        <span>Wax \u2194 room conductance now ${xe("C")}</span><b>${rt(s.G_wax_W_K,1)} W/K</b>
        <span>Room \u2212 wax ${xe("C")}</span><b>${ye(a,"K")}</b>
        <span>Electricity used ${xe("E")}</span><b>0 W (no moving parts)</b>
        <span>Room temperature ${xe("M")}</span><b>${ye(s.T_room,"\xB0C")}</b></div>
      <table><tr><td>Fins</td><td>${rt(t.b_mm)} mm deep, ${rt(t.S_mm)} mm gap, ${rt(t.t_mm)} mm thick aluminium, ${rt(t.N_fins)} fins over ${rt(t.A_m2/t.L_m,1)} m of wall, ${rt(t.L_m,1)} m tall ${xe("E")}</td></tr>
      <tr><td>Surface area</td><td><b>\xD7 ${rt(t.area_mult,2)}</b> compared with a plain panel; fin efficiency ${rt(t.eta,3)}</td></tr>
      <tr><td>Air film (natural convection)</td><td>h = ${rt(t.h,2)} W/m\xB2K (lower of Bar-Cohen & Rohsenow ${rt(t.h_bar_cohen,2)} and Van de Pol & Tierney ${rt(t.h_van_de_pol,2)})</td></tr>
      <tr><td>Conductance at 3 K</td><td>fins: UA = <b>${rt(t.UA,1)} W/K</b> \u2192 ${rt(t.Q_W)} W \xB7 plain panel: UA = ${rt(r.UA,1)} W/K \u2192 ${rt(r.Q_W)} W</td></tr>
      <tr><td>Needed</td><td>hottest 2026 night (${rt(t.T_out_design_night_C,1)} \xB0C outside): ${rt(t.load_W)} W at room 7 \xB0C</td></tr>
      <tr><td>Build</td><td>${n.material}; removable ${n.section_length_m} m sections for cleaning; ${rt(t.al_kg)} kg aluminium</td></tr>
      <tr><td>Keep clear</td><td>${n.keep_clear_m*100} cm free zone in front of the fins, floor stoppers for the crates</td></tr>
      <tr><td>Optional fans</td><td>mounting points + 12 V cable for ${n.optional_fans.provision} \xD7 120 mm fans \u2013 <b>optional</b>, add only if the Phase 4 test shows the fins &gt;25 % weaker</td></tr>
      <tr><td>12 V battery</td><td>${i.capacity_Ah} Ah ${i.chemistry} for controller, sensors and IoT gateway only \u2013 NO battery for cooling</td></tr></table>
      <div class="formula">El = Ra_S\xB7S/L, Nu_S = [576/El\xB2 + 2.873/El^0.5]^\u22120.5 (Bar-Cohen & Rohsenow)<br>
        \u03B7 = tanh(m\xB7Lc)/(m\xB7Lc), m = \u221A(2h/(k_al\xB7t))<br>UA = 1 / [1/(h\xB7(A_base + \u03B7\xB7A_fins)) + R_wax/A]</div>
      <div class="note">Cooled air falls between the fins by itself \u2013 nothing to switch on, nothing to break, nothing to power at night.</div>`}};jn.driptray={name:"Drip tray under the wax panels",headline:()=>"sloped tray \xB7 drain + trap",body:(s,e)=>`<div class="kv"><span>Fin surface ${xe("C")}</span><b>about ${ye((s.T_pcm??4)+.5,"\xB0C")}</b>
      <span>Room air ${xe("M")}</span><b>${ye(s.T_room,"\xB0C")} / ${ye(e.design.setpoint.rh_room_pct,"%")} RH</b></div>
    <p>The fins sit at about 4\u20135 \xB0C, below the dew point of the room air (about 5.5 \xB0C at 7 \xB0C and 90 % RH), so water condenses on them \u2013
    mostly moisture given off by the fresh produce. A sloped stainless tray under the panels collects it and a drain with a water trap
    takes it out (the trap stops warm outside air coming in). The wax never goes below 3 \xB0C, so the fins never frost.</p>
    <div class="note">Clean the tray and the fin sections (removable, 0.6 m long) every month \u2013 wet surfaces in a food room must not grow mould.</div>`};jn.evaporator={name:"Evaporator (R290 at \u22125 \xB0C)",headline:s=>`${ye(s.Q_coil_air,"kW")} from the air`,body:(s,e)=>`<div class="kv" data-live="evap">
      <span>Cooling the room air ${xe("C")}</span><b>${ye(s.Q_coil_air,"kW")}</b>
      <span>Freezing the wax ${xe("C")}</span><b>${ye(s.Q_coil_pcm,"kW")}</b>
      <span>Compressor speed ${xe("C")}</span><b>${ye(s.comp_speed_pct,"%")}</b>
      <span>Room temperature ${xe("M")}</span><b>${ye(s.T_room,"\xB0C")}</b></div>
      <b>Live R290 cycle (T_cond = outside + 10 K)</b>
      <canvas id="ph" style="height:200px"></canvas>
      <div class="kv" id="cyc"></div>
      <div class="formula">q_e = h1 \u2212 h4 \xB7 w = (h2s \u2212 h1)/\u03B7_is \xB7 COP_elec = q_e/w \xB7 \u03B7_motor</div>${Ms("evaporator")}`,async after(s,e){let t=await it(`api/cycle?t=${e.toFixed(0)}`);th(s.querySelector("#ph"),t);let n=t.cycle;s.querySelector("#cyc").innerHTML=`
      <span>Evaporating / condensing</span><b>${n.T_evap_C.toFixed(0)} / ${n.T_cond_C.toFixed(1)} \xB0C</b>
      <span>Pressures</span><b>${n.P_evap_bar.toFixed(2)} / ${n.P_cond_bar.toFixed(2)} bar</b>
      <span>h1 \xB7 h2 \xB7 h3 = h4</span><b>${n.h1.toFixed(0)} \xB7 ${n.h2.toFixed(0)} \xB7 ${n.h3.toFixed(0)} kJ/kg</b>
      <span>COP ideal / real / electrical</span><b>${n.COP_ideal.toFixed(2)} / ${n.COP_real.toFixed(2)} / ${n.COP_elec.toFixed(2)}</b>
      <span>R290 mass flow</span><b>${n.m_dot_g_s.toFixed(2)} g/s</b>
      <span>Design point (50 \xB0C condensing)</span><b>COP_elec ${t.design.COP_elec.toFixed(2)}</b>`}}});function mn(){let s=4294967295*Math.random()|0,e=4294967295*Math.random()|0,t=4294967295*Math.random()|0,n=4294967295*Math.random()|0;return(xt[255&s]+xt[s>>8&255]+xt[s>>16&255]+xt[s>>24&255]+"-"+xt[255&e]+xt[e>>8&255]+"-"+xt[e>>16&15|64]+xt[e>>24&255]+"-"+xt[63&t|128]+xt[t>>8&255]+"-"+xt[t>>16&255]+xt[t>>24&255]+xt[255&n]+xt[n>>8&255]+xt[n>>16&255]+xt[n>>24&255]).toLowerCase()}function ut(s,e,t){return Math.max(e,Math.min(t,s))}function Sl(s,e){return(s%e+e)%e}function Ds(s,e,t){return(1-t)*s+t*e}function wl(s){return(s&s-1)==0&&s!==0}function _a(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function pn(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return s/4294967295;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int32Array:return Math.max(s/2147483647,-1);case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("Invalid component type.")}}function Xe(s,e){switch(e.constructor){case Float32Array:return s;case Uint32Array:return Math.round(4294967295*s);case Uint16Array:return Math.round(65535*s);case Uint8Array:return Math.round(255*s);case Int32Array:return Math.round(2147483647*s);case Int16Array:return Math.round(32767*s);case Int8Array:return Math.round(127*s);default:throw new Error("Invalid component type.")}}function pd(s){for(let e=s.length-1;e>=0;--e)if(s[e]>=65535)return!0;return!1}function Hs(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function Up(){let s=Hs("canvas");return s.style.display="block",s}function Ns(s){s in Yh||(Yh[s]=!0,console.warn(s))}function is(s){return s<.04045?.0773993808*s:Math.pow(.9478672986*s+.0521327014,2.4)}function Bo(s){return s<.0031308?12.92*s:1.055*Math.pow(s,.41666)-.055}function ko(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?va.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}function Ho(s,e,t,n,i){for(let r=0,a=s.length-3;r<=a;r+=3){li.fromArray(s,r);let o=i.x*Math.abs(li.x)+i.y*Math.abs(li.y)+i.z*Math.abs(li.z),l=e.dot(li),c=t.dot(li),h=n.dot(li);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}function Zo(s,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?s+6*(e-s)*t:t<.5?e:t<2/3?s+6*(e-s)*(2/3-t):s}function qp(){let s=new ArrayBuffer(4),e=new Float32Array(s),t=new Uint32Array(s),n=new Uint32Array(512),i=new Uint32Array(512);for(let l=0;l<256;++l){let c=l-127;c<-27?(n[l]=0,n[256|l]=32768,i[l]=24,i[256|l]=24):c<-14?(n[l]=1024>>-c-14,n[256|l]=1024>>-c-14|32768,i[l]=-c-1,i[256|l]=-c-1):c<=15?(n[l]=c+15<<10,n[256|l]=c+15<<10|32768,i[l]=13,i[256|l]=13):c<128?(n[l]=31744,n[256|l]=64512,i[l]=24,i[256|l]=24):(n[l]=31744,n[256|l]=64512,i[l]=13,i[256|l]=13)}let r=new Uint32Array(2048),a=new Uint32Array(64),o=new Uint32Array(64);for(let l=1;l<1024;++l){let c=l<<13,h=0;for(;!(8388608&c);)c<<=1,h-=8388608;c&=-8388609,h+=947912704,r[l]=c|h}for(let l=1024;l<2048;++l)r[l]=939524096+(l-1024<<13);for(let l=1;l<31;++l)a[l]=l<<23;a[31]=1199570944,a[32]=2147483648;for(let l=33;l<63;++l)a[l]=2147483648+(l-32<<23);a[63]=3347054592;for(let l=1;l<64;++l)l!==32&&(o[l]=1024);return{floatView:e,uint32View:t,baseTable:n,shiftTable:i,mantissaTable:r,exponentTable:a,offsetTable:o}}function jr(s,e,t,n,i,r,a,o,l,c){s.getVertexPosition(o,$i),s.getVertexPosition(l,ji),s.getVertexPosition(c,Xi);let h=function(u,d,p,f,_,m,y,v){let g;if(g=d.side===It?f.intersectTriangle(y,m,_,!0,v):f.intersectTriangle(_,m,y,d.side===ii,v),g===null)return null;$r.copy(v),$r.applyMatrix4(u.matrixWorld);let M=p.ray.origin.distanceTo($r);return M<p.near||M>p.far?null:{distance:M,point:$r.clone(),object:u}}(s,e,t,n,$i,ji,Xi,Vr);if(h){i&&(Hr.fromBufferAttribute(i,o),Gr.fromBufferAttribute(i,l),Wr.fromBufferAttribute(i,c),h.uv=ei.getInterpolation(Vr,$i,ji,Xi,Hr,Gr,Wr,new ie)),r&&(Hr.fromBufferAttribute(r,o),Gr.fromBufferAttribute(r,l),Wr.fromBufferAttribute(r,c),h.uv1=ei.getInterpolation(Vr,$i,ji,Xi,Hr,Gr,Wr,new ie),h.uv2=h.uv1),a&&(lu.fromBufferAttribute(a,o),cu.fromBufferAttribute(a,l),hu.fromBufferAttribute(a,c),h.normal=ei.getInterpolation(Vr,$i,ji,Xi,lu,cu,hu,new A),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let u={a:o,b:l,c,normal:new A,materialIndex:0};ei.getNormal($i,ji,Xi,u.normal),h.face=u}return h}function hs(s){let e={};for(let t in s){e[t]={};for(let n in s[t]){let i=s[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function Tt(s){let e={};for(let t=0;t<s.length;t++){let n=hs(s[t]);for(let i in n)e[i]=n[i]}return e}function fd(s){return s.getRenderTarget()===null?s.outputColorSpace:qe.workingColorSpace}function gd(){let s=null,e=!1,t=null,n=null;function i(r,a){t(r,a),n=s.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&(n=s.requestAnimationFrame(i),e=!0)},stop:function(){s.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){s=r}}}function Qp(s,e){let t=e.isWebGL2,n=new WeakMap;return{get:function(i){return i.isInterleavedBufferAttribute&&(i=i.data),n.get(i)},remove:function(i){i.isInterleavedBufferAttribute&&(i=i.data);let r=n.get(i);r&&(s.deleteBuffer(r.buffer),n.delete(i))},update:function(i,r){if(i.isGLBufferAttribute){let o=n.get(i);return void((!o||o.version<i.version)&&n.set(i,{buffer:i.buffer,type:i.type,bytesPerElement:i.elementSize,version:i.version}))}i.isInterleavedBufferAttribute&&(i=i.data);let a=n.get(i);if(a===void 0)n.set(i,function(o,l){let c=o.array,h=o.usage,u=c.byteLength,d=s.createBuffer(),p;if(s.bindBuffer(l,d),s.bufferData(l,c,h),o.onUploadCallback(),c instanceof Float32Array)p=s.FLOAT;else if(c instanceof Uint16Array)if(o.isFloat16BufferAttribute){if(!t)throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");p=s.HALF_FLOAT}else p=s.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=s.SHORT;else if(c instanceof Uint32Array)p=s.UNSIGNED_INT;else if(c instanceof Int32Array)p=s.INT;else if(c instanceof Int8Array)p=s.BYTE;else if(c instanceof Uint8Array)p=s.UNSIGNED_BYTE;else{if(!(c instanceof Uint8ClampedArray))throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);p=s.UNSIGNED_BYTE}return{buffer:d,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}(i,r));else if(a.version<i.version){if(a.size!==i.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");(function(o,l,c){let h=l.array,u=l._updateRange,d=l.updateRanges;if(s.bindBuffer(c,o),u.count===-1&&d.length===0&&s.bufferSubData(c,0,h),d.length!==0){for(let p=0,f=d.length;p<f;p++){let _=d[p];t?s.bufferSubData(c,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count):s.bufferSubData(c,_.start*h.BYTES_PER_ELEMENT,h.subarray(_.start,_.start+_.count))}l.clearUpdateRanges()}u.count!==-1&&(t?s.bufferSubData(c,u.offset*h.BYTES_PER_ELEMENT,h,u.offset,u.count):s.bufferSubData(c,u.offset*h.BYTES_PER_ELEMENT,h.subarray(u.offset,u.offset+u.count)),u.count=-1),l.onUploadCallback()})(a.buffer,i,r),a.version=i.version}}}}function em(s,e,t,n,i,r,a){let o=new Ae(0),l,c,h=r===!0?0:1,u=null,d=0,p=null;function f(_,m){_.getRGB(qr,fd(s)),n.buffers.color.setClear(qr.r,qr.g,qr.b,m,a)}return{getClearColor:function(){return o},setClearColor:function(_,m=1){o.set(_),h=m,f(o,h)},getClearAlpha:function(){return h},setClearAlpha:function(_){h=_,f(o,h)},render:function(_,m){let y=!1,v=m.isScene===!0?m.background:null;v&&v.isTexture&&(v=(m.backgroundBlurriness>0?t:e).get(v)),v===null?f(o,h):v&&v.isColor&&(f(v,1),y=!0);let g=s.xr.getEnvironmentBlendMode();g==="additive"?n.buffers.color.setClear(0,0,0,1,a):g==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(s.autoClear||y)&&s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil),v&&(v.isCubeTexture||v.mapping===Za)?(c===void 0&&(c=new ge(new $e(1,1,1),new Fn({name:"BackgroundCubeMaterial",uniforms:hs(hn.backgroundCube.uniforms),vertexShader:hn.backgroundCube.vertexShader,fragmentShader:hn.backgroundCube.fragmentShader,side:It,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(M,T,w){this.matrixWorld.copyPosition(w.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=v,c.material.uniforms.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,c.material.uniforms.backgroundBlurriness.value=m.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=m.backgroundIntensity,c.material.toneMapped=qe.getTransfer(v.colorSpace)!==Ke,u===v&&d===v.version&&p===s.toneMapping||(c.material.needsUpdate=!0,u=v,d=v.version,p=s.toneMapping),c.layers.enableAll(),_.unshift(c,c.geometry,c.material,0,0,null)):v&&v.isTexture&&(l===void 0&&(l=new ge(new Bn(2,2),new Fn({name:"BackgroundMaterial",uniforms:hs(hn.background.uniforms),vertexShader:hn.background.vertexShader,fragmentShader:hn.background.fragmentShader,side:ii,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=v,l.material.uniforms.backgroundIntensity.value=m.backgroundIntensity,l.material.toneMapped=qe.getTransfer(v.colorSpace)!==Ke,v.matrixAutoUpdate===!0&&v.updateMatrix(),l.material.uniforms.uvTransform.value.copy(v.matrix),u===v&&d===v.version&&p===s.toneMapping||(l.material.needsUpdate=!0,u=v,d=v.version,p=s.toneMapping),l.layers.enableAll(),_.unshift(l,l.geometry,l.material,0,0,null))}}}function tm(s,e,t,n){let i=s.getParameter(s.MAX_VERTEX_ATTRIBS),r=n.isWebGL2?null:e.get("OES_vertex_array_object"),a=n.isWebGL2||r!==null,o={},l=p(null),c=l,h=!1;function u(T){return n.isWebGL2?s.bindVertexArray(T):r.bindVertexArrayOES(T)}function d(T){return n.isWebGL2?s.deleteVertexArray(T):r.deleteVertexArrayOES(T)}function p(T){let w=[],R=[],I=[];for(let P=0;P<i;P++)w[P]=0,R[P]=0,I[P]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:w,enabledAttributes:R,attributeDivisors:I,object:T,attributes:{},index:null}}function f(){let T=c.newAttributes;for(let w=0,R=T.length;w<R;w++)T[w]=0}function _(T){m(T,0)}function m(T,w){let R=c.newAttributes,I=c.enabledAttributes,P=c.attributeDivisors;R[T]=1,I[T]===0&&(s.enableVertexAttribArray(T),I[T]=1),P[T]!==w&&((n.isWebGL2?s:e.get("ANGLE_instanced_arrays"))[n.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](T,w),P[T]=w)}function y(){let T=c.newAttributes,w=c.enabledAttributes;for(let R=0,I=w.length;R<I;R++)w[R]!==T[R]&&(s.disableVertexAttribArray(R),w[R]=0)}function v(T,w,R,I,P,B,V){V===!0?s.vertexAttribIPointer(T,w,R,P,B):s.vertexAttribPointer(T,w,R,I,P,B)}function g(){M(),h=!0,c!==l&&(c=l,u(c.object))}function M(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:function(T,w,R,I,P){let B=!1;if(a){let V=function(L,O,k){let Q=k.wireframe===!0,oe=o[L.id];oe===void 0&&(oe={},o[L.id]=oe);let J=oe[O.id];J===void 0&&(J={},oe[O.id]=J);let j=J[Q];return j===void 0&&(j=p(n.isWebGL2?s.createVertexArray():r.createVertexArrayOES()),J[Q]=j),j}(I,R,w);c!==V&&(c=V,u(c.object)),B=function(L,O,k,Q){let oe=c.attributes,J=O.attributes,j=0,Y=k.getAttributes();for(let z in Y)if(Y[z].location>=0){let Z=oe[z],ce=J[z];if(ce===void 0&&(z==="instanceMatrix"&&L.instanceMatrix&&(ce=L.instanceMatrix),z==="instanceColor"&&L.instanceColor&&(ce=L.instanceColor)),Z===void 0||Z.attribute!==ce||ce&&Z.data!==ce.data)return!0;j++}return c.attributesNum!==j||c.index!==Q}(T,I,R,P),B&&function(L,O,k,Q){let oe={},J=O.attributes,j=0,Y=k.getAttributes();for(let z in Y)if(Y[z].location>=0){let Z=J[z];Z===void 0&&(z==="instanceMatrix"&&L.instanceMatrix&&(Z=L.instanceMatrix),z==="instanceColor"&&L.instanceColor&&(Z=L.instanceColor));let ce={};ce.attribute=Z,Z&&Z.data&&(ce.data=Z.data),oe[z]=ce,j++}c.attributes=oe,c.attributesNum=j,c.index=Q}(T,I,R,P)}else{let V=w.wireframe===!0;c.geometry===I.id&&c.program===R.id&&c.wireframe===V||(c.geometry=I.id,c.program=R.id,c.wireframe=V,B=!0)}P!==null&&t.update(P,s.ELEMENT_ARRAY_BUFFER),(B||h)&&(h=!1,function(V,L,O,k){if(n.isWebGL2===!1&&(V.isInstancedMesh||k.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;f();let Q=k.attributes,oe=O.getAttributes(),J=L.defaultAttributeValues;for(let j in oe){let Y=oe[j];if(Y.location>=0){let z=Q[j];if(z===void 0&&(j==="instanceMatrix"&&V.instanceMatrix&&(z=V.instanceMatrix),j==="instanceColor"&&V.instanceColor&&(z=V.instanceColor)),z!==void 0){let Z=z.normalized,ce=z.itemSize,x=t.get(z);if(x===void 0)continue;let S=x.buffer,U=x.type,X=x.bytesPerElement,D=n.isWebGL2===!0&&(U===s.INT||U===s.UNSIGNED_INT||z.gpuType===sd);if(z.isInterleavedBufferAttribute){let q=z.data,N=q.stride,F=z.offset;if(q.isInstancedInterleavedBuffer){for(let H=0;H<Y.locationSize;H++)m(Y.location+H,q.meshPerAttribute);V.isInstancedMesh!==!0&&k._maxInstanceCount===void 0&&(k._maxInstanceCount=q.meshPerAttribute*q.count)}else for(let H=0;H<Y.locationSize;H++)_(Y.location+H);s.bindBuffer(s.ARRAY_BUFFER,S);for(let H=0;H<Y.locationSize;H++)v(Y.location+H,ce/Y.locationSize,U,Z,N*X,(F+ce/Y.locationSize*H)*X,D)}else{if(z.isInstancedBufferAttribute){for(let q=0;q<Y.locationSize;q++)m(Y.location+q,z.meshPerAttribute);V.isInstancedMesh!==!0&&k._maxInstanceCount===void 0&&(k._maxInstanceCount=z.meshPerAttribute*z.count)}else for(let q=0;q<Y.locationSize;q++)_(Y.location+q);s.bindBuffer(s.ARRAY_BUFFER,S);for(let q=0;q<Y.locationSize;q++)v(Y.location+q,ce/Y.locationSize,U,Z,ce*X,ce/Y.locationSize*q*X,D)}}else if(J!==void 0){let Z=J[j];if(Z!==void 0)switch(Z.length){case 2:s.vertexAttrib2fv(Y.location,Z);break;case 3:s.vertexAttrib3fv(Y.location,Z);break;case 4:s.vertexAttrib4fv(Y.location,Z);break;default:s.vertexAttrib1fv(Y.location,Z)}}}}y()}(T,w,R,I),P!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,t.get(P).buffer))},reset:g,resetDefaultState:M,dispose:function(){g();for(let T in o){let w=o[T];for(let R in w){let I=w[R];for(let P in I)d(I[P].object),delete I[P];delete w[R]}delete o[T]}},releaseStatesOfGeometry:function(T){if(o[T.id]===void 0)return;let w=o[T.id];for(let R in w){let I=w[R];for(let P in I)d(I[P].object),delete I[P];delete w[R]}delete o[T.id]},releaseStatesOfProgram:function(T){for(let w in o){let R=o[w];if(R[T.id]===void 0)continue;let I=R[T.id];for(let P in I)d(I[P].object),delete I[P];delete R[T.id]}},initAttributes:f,enableAttribute:_,disableUnusedAttributes:y}}function nm(s,e,t,n){let i=n.isWebGL2,r;this.setMode=function(a){r=a},this.render=function(a,o){s.drawArrays(r,a,o),t.update(o,r,1)},this.renderInstances=function(a,o,l){if(l===0)return;let c,h;if(i)c=s,h="drawArraysInstanced";else if(c=e.get("ANGLE_instanced_arrays"),h="drawArraysInstancedANGLE",c===null)return void console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");c[h](r,a,o,l),t.update(o,r,l)},this.renderMultiDraw=function(a,o,l){if(l===0)return;let c=e.get("WEBGL_multi_draw");if(c===null)for(let h=0;h<l;h++)this.render(a[h],o[h]);else{c.multiDrawArraysWEBGL(r,a,0,o,0,l);let h=0;for(let u=0;u<l;u++)h+=o[u];t.update(h,r,1)}}}function im(s,e,t){let n;function i(M){if(M==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";M="mediump"}return M==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let r=typeof WebGL2RenderingContext<"u"&&s.constructor.name==="WebGL2RenderingContext",a=t.precision!==void 0?t.precision:"highp",o=i(a);o!==a&&(console.warn("THREE.WebGLRenderer:",a,"not supported, using",o,"instead."),a=o);let l=r||e.has("WEBGL_draw_buffers"),c=t.logarithmicDepthBuffer===!0,h=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),u=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),d=s.getParameter(s.MAX_TEXTURE_SIZE),p=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),f=s.getParameter(s.MAX_VERTEX_ATTRIBS),_=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),m=s.getParameter(s.MAX_VARYING_VECTORS),y=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),v=u>0,g=r||e.has("OES_texture_float");return{isWebGL2:r,drawBuffers:l,getMaxAnisotropy:function(){if(n!==void 0)return n;if(e.has("EXT_texture_filter_anisotropic")===!0){let M=e.get("EXT_texture_filter_anisotropic");n=s.getParameter(M.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n},getMaxPrecision:i,precision:a,logarithmicDepthBuffer:c,maxTextures:h,maxVertexTextures:u,maxTextureSize:d,maxCubemapSize:p,maxAttributes:f,maxVertexUniforms:_,maxVaryings:m,maxFragmentUniforms:y,vertexTextures:v,floatFragmentTextures:g,floatVertexTextures:v&&g,maxSamples:r?s.getParameter(s.MAX_SAMPLES):0}}function sm(s){let e=this,t=null,n=0,i=!1,r=!1,a=new sn,o=new Fe,l={value:null,needsUpdate:!1};function c(h,u,d,p){let f=h!==null?h.length:0,_=null;if(f!==0){if(_=l.value,p!==!0||_===null){let m=d+4*f,y=u.matrixWorldInverse;o.getNormalMatrix(y),(_===null||_.length<m)&&(_=new Float32Array(m));for(let v=0,g=d;v!==f;++v,g+=4)a.copy(h[v]).applyMatrix4(y,o),a.normal.toArray(_,g),_[g+3]=a.constant}l.value=_,l.needsUpdate=!0}return e.numPlanes=f,e.numIntersection=0,_}this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,u){let d=h.length!==0||u||n!==0||i;return i=u,n=h.length,d},this.beginShadows=function(){r=!0,c(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(h,u){t=c(h,u,0)},this.setState=function(h,u,d){let p=h.clippingPlanes,f=h.clipIntersection,_=h.clipShadows,m=s.get(h);if(!i||p===null||p.length===0||r&&!_)r?c(null):function(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}();else{let y=r?0:n,v=4*y,g=m.clippingState||null;l.value=g,g=c(p,u,v,d);for(let M=0;M!==v;++M)g[M]=t[M];m.clippingState=g,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=y}}}function rm(s){let e=new WeakMap;function t(i,r){return r===vl?i.mapping=rs:r===yl&&(i.mapping=as),i}function n(i){let r=i.target;r.removeEventListener("dispose",n);let a=e.get(r);a!==void 0&&(e.delete(r),a.dispose())}return{get:function(i){if(i&&i.isTexture){let r=i.mapping;if(r===vl||r===yl){if(e.has(i))return t(e.get(i).texture,i.mapping);{let a=i.image;if(a&&a.height>0){let o=new Rl(a.height/2);return o.fromEquirectangularTexture(s,i),e.set(i,o),i.addEventListener("dispose",n),t(o.texture,i.mapping)}return null}}}return i},dispose:function(){e=new WeakMap}}}function mu(s,e,t){let n=new Nn(s,e,t);return n.texture.mapping=Za,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Yr(s,e,t,n,i){s.viewport.set(e,t,n,i),s.scissor.set(e,t,n,i)}function fu(){return new Fn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Tc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function gu(){return new Fn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Tc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Tc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function am(s){let e=new WeakMap,t=null;function n(i){let r=i.target;r.removeEventListener("dispose",n);let a=e.get(r);a!==void 0&&(e.delete(r),a.dispose())}return{get:function(i){if(i&&i.isTexture){let r=i.mapping,a=r===vl||r===yl,o=r===rs||r===as;if(a||o){if(i.isRenderTargetTexture&&i.needsPMREMUpdate===!0){i.needsPMREMUpdate=!1;let l=e.get(i);return t===null&&(t=new Ta(s)),l=a?t.fromEquirectangular(i,l):t.fromCubemap(i,l),e.set(i,l),l.texture}if(e.has(i))return e.get(i).texture;{let l=i.image;if(a&&l&&l.height>0||o&&l&&function(c){let h=0,u=6;for(let d=0;d<u;d++)c[d]!==void 0&&h++;return h===u}(l)){t===null&&(t=new Ta(s));let c=a?t.fromEquirectangular(i):t.fromCubemap(i);return e.set(i,c),i.addEventListener("dispose",n),c.texture}return null}}}return i},dispose:function(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}}}function om(s){let e={};function t(n){if(e[n]!==void 0)return e[n];let i;switch(n){case"WEBGL_depth_texture":i=s.getExtension("WEBGL_depth_texture")||s.getExtension("MOZ_WEBGL_depth_texture")||s.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=s.getExtension("EXT_texture_filter_anisotropic")||s.getExtension("MOZ_EXT_texture_filter_anisotropic")||s.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=s.getExtension("WEBGL_compressed_texture_s3tc")||s.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=s.getExtension("WEBGL_compressed_texture_pvrtc")||s.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=s.getExtension(n)}return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(n){n.isWebGL2?(t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance")):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(n){let i=t(n);return i===null&&console.warn("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function lm(s,e,t,n){let i={},r=new WeakMap;function a(l){let c=l.target;c.index!==null&&e.remove(c.index);for(let u in c.attributes)e.remove(c.attributes[u]);for(let u in c.morphAttributes){let d=c.morphAttributes[u];for(let p=0,f=d.length;p<f;p++)e.remove(d[p])}c.removeEventListener("dispose",a),delete i[c.id];let h=r.get(c);h&&(e.remove(h),r.delete(c)),n.releaseStatesOfGeometry(c),c.isInstancedBufferGeometry===!0&&delete c._maxInstanceCount,t.memory.geometries--}function o(l){let c=[],h=l.index,u=l.attributes.position,d=0;if(h!==null){let _=h.array;d=h.version;for(let m=0,y=_.length;m<y;m+=3){let v=_[m+0],g=_[m+1],M=_[m+2];c.push(v,g,g,M,M,v)}}else{if(u===void 0)return;{let _=u.array;d=u.version;for(let m=0,y=_.length/3-1;m<y;m+=3){let v=m+0,g=m+1,M=m+2;c.push(v,g,g,M,M,v)}}}let p=new(pd(c)?Sa:Ma)(c,1);p.version=d;let f=r.get(l);f&&e.remove(f),r.set(l,p)}return{get:function(l,c){return i[c.id]===!0||(c.addEventListener("dispose",a),i[c.id]=!0,t.memory.geometries++),c},update:function(l){let c=l.attributes;for(let u in c)e.update(c[u],s.ARRAY_BUFFER);let h=l.morphAttributes;for(let u in h){let d=h[u];for(let p=0,f=d.length;p<f;p++)e.update(d[p],s.ARRAY_BUFFER)}},getWireframeAttribute:function(l){let c=r.get(l);if(c){let h=l.index;h!==null&&c.version<h.version&&o(l)}else o(l);return r.get(l)}}}function cm(s,e,t,n){let i=n.isWebGL2,r,a,o;this.setMode=function(l){r=l},this.setIndex=function(l){a=l.type,o=l.bytesPerElement},this.render=function(l,c){s.drawElements(r,c,a,l*o),t.update(c,r,1)},this.renderInstances=function(l,c,h){if(h===0)return;let u,d;if(i)u=s,d="drawElementsInstanced";else if(u=e.get("ANGLE_instanced_arrays"),d="drawElementsInstancedANGLE",u===null)return void console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");u[d](r,c,a,l*o,h),t.update(c,r,h)},this.renderMultiDraw=function(l,c,h){if(h===0)return;let u=e.get("WEBGL_multi_draw");if(u===null)for(let d=0;d<h;d++)this.render(l[d]/o,c[d]);else{u.multiDrawElementsWEBGL(r,c,0,a,l,0,h);let d=0;for(let p=0;p<h;p++)d+=c[p];t.update(d,r,1)}}}function hm(s){let e={frame:0,calls:0,triangles:0,points:0,lines:0};return{memory:{geometries:0,textures:0},render:e,programs:null,autoReset:!0,reset:function(){e.calls=0,e.triangles=0,e.points=0,e.lines=0},update:function(t,n,i){switch(e.calls++,n){case s.TRIANGLES:e.triangles+=i*(t/3);break;case s.LINES:e.lines+=i*(t/2);break;case s.LINE_STRIP:e.lines+=i*(t-1);break;case s.LINE_LOOP:e.lines+=i*t;break;case s.POINTS:e.points+=i*t;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",n)}}}}function um(s,e){return s[0]-e[0]}function dm(s,e){return Math.abs(e[1])-Math.abs(s[1])}function pm(s,e,t){let n={},i=new Float32Array(8),r=new WeakMap,a=new Je,o=[];for(let l=0;l<8;l++)o[l]=[l,0];return{update:function(l,c,h){let u=l.morphTargetInfluences;if(e.isWebGL2===!0){let d=c.morphAttributes.position||c.morphAttributes.normal||c.morphAttributes.color,p=d!==void 0?d.length:0,f=r.get(c);if(f===void 0||f.count!==p){let O=function(){V.dispose(),r.delete(c),c.removeEventListener("dispose",O)};f!==void 0&&f.texture.dispose();let y=c.morphAttributes.position!==void 0,v=c.morphAttributes.normal!==void 0,g=c.morphAttributes.color!==void 0,M=c.morphAttributes.position||[],T=c.morphAttributes.normal||[],w=c.morphAttributes.color||[],R=0;y===!0&&(R=1),v===!0&&(R=2),g===!0&&(R=3);let I=c.attributes.position.count*R,P=1;I>e.maxTextureSize&&(P=Math.ceil(I/e.maxTextureSize),I=e.maxTextureSize);let B=new Float32Array(I*P*4*p),V=new xa(B,I,P,p);V.type=Qn,V.needsUpdate=!0;let L=4*R;for(let k=0;k<p;k++){let Q=M[k],oe=T[k],J=w[k],j=I*P*4*k;for(let Y=0;Y<Q.count;Y++){let z=Y*L;y===!0&&(a.fromBufferAttribute(Q,Y),B[j+z+0]=a.x,B[j+z+1]=a.y,B[j+z+2]=a.z,B[j+z+3]=0),v===!0&&(a.fromBufferAttribute(oe,Y),B[j+z+4]=a.x,B[j+z+5]=a.y,B[j+z+6]=a.z,B[j+z+7]=0),g===!0&&(a.fromBufferAttribute(J,Y),B[j+z+8]=a.x,B[j+z+9]=a.y,B[j+z+10]=a.z,B[j+z+11]=J.itemSize===4?a.w:1)}}f={count:p,texture:V,size:new ie(I,P)},r.set(c,f),c.addEventListener("dispose",O)}let _=0;for(let y=0;y<u.length;y++)_+=u[y];let m=c.morphTargetsRelative?1:1-_;h.getUniforms().setValue(s,"morphTargetBaseInfluence",m),h.getUniforms().setValue(s,"morphTargetInfluences",u),h.getUniforms().setValue(s,"morphTargetsTexture",f.texture,t),h.getUniforms().setValue(s,"morphTargetsTextureSize",f.size)}else{let d=u===void 0?0:u.length,p=n[c.id];if(p===void 0||p.length!==d){p=[];for(let v=0;v<d;v++)p[v]=[v,0];n[c.id]=p}for(let v=0;v<d;v++){let g=p[v];g[0]=v,g[1]=u[v]}p.sort(dm);for(let v=0;v<8;v++)v<d&&p[v][1]?(o[v][0]=p[v][0],o[v][1]=p[v][1]):(o[v][0]=Number.MAX_SAFE_INTEGER,o[v][1]=0);o.sort(um);let f=c.morphAttributes.position,_=c.morphAttributes.normal,m=0;for(let v=0;v<8;v++){let g=o[v],M=g[0],T=g[1];M!==Number.MAX_SAFE_INTEGER&&T?(f&&c.getAttribute("morphTarget"+v)!==f[M]&&c.setAttribute("morphTarget"+v,f[M]),_&&c.getAttribute("morphNormal"+v)!==_[M]&&c.setAttribute("morphNormal"+v,_[M]),i[v]=T,m+=T):(f&&c.hasAttribute("morphTarget"+v)===!0&&c.deleteAttribute("morphTarget"+v),_&&c.hasAttribute("morphNormal"+v)===!0&&c.deleteAttribute("morphNormal"+v),i[v]=0)}let y=c.morphTargetsRelative?1:1-m;h.getUniforms().setValue(s,"morphTargetBaseInfluence",y),h.getUniforms().setValue(s,"morphTargetInfluences",i)}}}}function mm(s,e,t,n){let i=new WeakMap;function r(a){let o=a.target;o.removeEventListener("dispose",r),t.remove(o.instanceMatrix),o.instanceColor!==null&&t.remove(o.instanceColor)}return{update:function(a){let o=n.render.frame,l=a.geometry,c=e.get(a,l);if(i.get(c)!==o&&(e.update(c),i.set(c,o)),a.isInstancedMesh&&(a.hasEventListener("dispose",r)===!1&&a.addEventListener("dispose",r),i.get(a)!==o&&(t.update(a.instanceMatrix,s.ARRAY_BUFFER),a.instanceColor!==null&&t.update(a.instanceColor,s.ARRAY_BUFFER),i.set(a,o))),a.isSkinnedMesh){let h=a.skeleton;i.get(h)!==o&&(h.update(),i.set(h,o))}return c},dispose:function(){i=new WeakMap}}}function ms(s,e,t){let n=s[0];if(n<=0||n>0)return s;let i=e*t,r=_u[i];if(r===void 0&&(r=new Float32Array(i),_u[i]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,s[a].toArray(r,o)}return r}function dt(s,e){if(s.length!==e.length)return!1;for(let t=0,n=s.length;t<n;t++)if(s[t]!==e[t])return!1;return!0}function pt(s,e){for(let t=0,n=e.length;t<n;t++)s[t]=e[t]}function Ka(s,e){let t=vu[e];t===void 0&&(t=new Int32Array(e),vu[e]=t);for(let n=0;n!==e;++n)t[n]=s.allocateTextureUnit();return t}function fm(s,e){let t=this.cache;t[0]!==e&&(s.uniform1f(this.addr,e),t[0]=e)}function gm(s,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(s.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(dt(t,e))return;s.uniform2fv(this.addr,e),pt(t,e)}}function _m(s,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(s.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)t[0]===e.r&&t[1]===e.g&&t[2]===e.b||(s.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(dt(t,e))return;s.uniform3fv(this.addr,e),pt(t,e)}}function vm(s,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(s.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(dt(t,e))return;s.uniform4fv(this.addr,e),pt(t,e)}}function ym(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(dt(t,e))return;s.uniformMatrix2fv(this.addr,!1,e),pt(t,e)}else{if(dt(t,n))return;bu.set(n),s.uniformMatrix2fv(this.addr,!1,bu),pt(t,n)}}function xm(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(dt(t,e))return;s.uniformMatrix3fv(this.addr,!1,e),pt(t,e)}else{if(dt(t,n))return;xu.set(n),s.uniformMatrix3fv(this.addr,!1,xu),pt(t,n)}}function bm(s,e){let t=this.cache,n=e.elements;if(n===void 0){if(dt(t,e))return;s.uniformMatrix4fv(this.addr,!1,e),pt(t,e)}else{if(dt(t,n))return;yu.set(n),s.uniformMatrix4fv(this.addr,!1,yu),pt(t,n)}}function Mm(s,e){let t=this.cache;t[0]!==e&&(s.uniform1i(this.addr,e),t[0]=e)}function Sm(s,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(s.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(dt(t,e))return;s.uniform2iv(this.addr,e),pt(t,e)}}function wm(s,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(s.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(dt(t,e))return;s.uniform3iv(this.addr,e),pt(t,e)}}function Em(s,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(s.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(dt(t,e))return;s.uniform4iv(this.addr,e),pt(t,e)}}function Tm(s,e){let t=this.cache;t[0]!==e&&(s.uniform1ui(this.addr,e),t[0]=e)}function Am(s,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(s.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(dt(t,e))return;s.uniform2uiv(this.addr,e),pt(t,e)}}function Rm(s,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(s.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(dt(t,e))return;s.uniform3uiv(this.addr,e),pt(t,e)}}function Cm(s,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(s.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(dt(t,e))return;s.uniform4uiv(this.addr,e),pt(t,e)}}function Lm(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r=this.type===s.SAMPLER_2D_SHADOW?vd:_d;t.setTexture2D(e||r,i)}function Pm(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||xd,i)}function Im(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||bd,i)}function Dm(s,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||yd,i)}function Nm(s,e){s.uniform1fv(this.addr,e)}function Um(s,e){let t=ms(e,this.size,2);s.uniform2fv(this.addr,t)}function Om(s,e){let t=ms(e,this.size,3);s.uniform3fv(this.addr,t)}function Fm(s,e){let t=ms(e,this.size,4);s.uniform4fv(this.addr,t)}function Bm(s,e){let t=ms(e,this.size,4);s.uniformMatrix2fv(this.addr,!1,t)}function km(s,e){let t=ms(e,this.size,9);s.uniformMatrix3fv(this.addr,!1,t)}function zm(s,e){let t=ms(e,this.size,16);s.uniformMatrix4fv(this.addr,!1,t)}function Hm(s,e){s.uniform1iv(this.addr,e)}function Gm(s,e){s.uniform2iv(this.addr,e)}function Wm(s,e){s.uniform3iv(this.addr,e)}function Vm(s,e){s.uniform4iv(this.addr,e)}function $m(s,e){s.uniform1uiv(this.addr,e)}function jm(s,e){s.uniform2uiv(this.addr,e)}function Xm(s,e){s.uniform3uiv(this.addr,e)}function qm(s,e){s.uniform4uiv(this.addr,e)}function Ym(s,e,t){let n=this.cache,i=e.length,r=Ka(t,i);dt(n,r)||(s.uniform1iv(this.addr,r),pt(n,r));for(let a=0;a!==i;++a)t.setTexture2D(e[a]||_d,r[a])}function Zm(s,e,t){let n=this.cache,i=e.length,r=Ka(t,i);dt(n,r)||(s.uniform1iv(this.addr,r),pt(n,r));for(let a=0;a!==i;++a)t.setTexture3D(e[a]||xd,r[a])}function Jm(s,e,t){let n=this.cache,i=e.length,r=Ka(t,i);dt(n,r)||(s.uniform1iv(this.addr,r),pt(n,r));for(let a=0;a!==i;++a)t.setTextureCube(e[a]||bd,r[a])}function Km(s,e,t){let n=this.cache,i=e.length,r=Ka(t,i);dt(n,r)||(s.uniform1iv(this.addr,r),pt(n,r));for(let a=0;a!==i;++a)t.setTexture2DArray(e[a]||yd,r[a])}function Mu(s,e){s.seq.push(e),s.map[e.id]=e}function Qm(s,e,t){let n=s.name,i=n.length;for(sl.lastIndex=0;;){let r=sl.exec(n),a=sl.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o|=0),c===void 0||c==="["&&a+2===i){Mu(t,c===void 0?new Cl(o,s,e):new Ll(o,s,e));break}{let h=t.map[o];h===void 0&&(h=new Pl(o),Mu(t,h)),t=h}}}function Su(s,e,t){let n=s.createShader(e);return s.shaderSource(n,t),s.compileShader(n),n}function wu(s,e,t){let n=s.getShaderParameter(e,s.COMPILE_STATUS),i=s.getShaderInfoLog(e).trim();if(n&&i==="")return"";let r=/ERROR: 0:(\d+)/.exec(i);if(r){let a=parseInt(r[1]);return t.toUpperCase()+`

`+i+`

`+function(o,l){let c=o.split(`
`),h=[],u=Math.max(l-6,0),d=Math.min(l+6,c.length);for(let p=u;p<d;p++){let f=p+1;h.push(`${f===l?">":" "} ${f}: ${c[p]}`)}return h.join(`
`)}(s.getShaderSource(e),a)}return i}function nf(s,e){let t=function(n){let i=qe.getPrimaries(qe.workingColorSpace),r=qe.getPrimaries(n),a;switch(i===r?a="":i===fa&&r===ma?a="LinearDisplayP3ToLinearSRGB":i===ma&&r===fa&&(a="LinearSRGBToLinearDisplayP3"),n){case Dn:case Ja:return[a,"LinearTransferOETF"];case at:case Ec:return[a,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",n),[a,"LinearTransferOETF"]}}(e);return`vec4 ${s}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function sf(s,e){let t;switch(e){case Cp:t="Linear";break;case Lp:t="Reinhard";break;case Pp:t="OptimizedCineon";break;case Sc:t="ACESFilmic";break;case Dp:t="AgX";break;case Ip:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+s+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function Zi(s){return s!==""}function Eu(s,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Tu(s,e){return s.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}function Il(s){return s.replace(rf,of)}function of(s,e){let t=Ie[e];if(t===void 0){let n=af.get(e);if(n===void 0)throw new Error("Can not resolve #include <"+e+">");t=Ie[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n)}return Il(t)}function Au(s){return s.replace(lf,cf)}function cf(s,e,t,n){let i="";for(let r=parseInt(e);r<parseInt(t);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function Ru(s){let e="precision "+s.precision+` float;
precision `+s.precision+" int;";return s.precision==="highp"?e+=`
#define HIGH_PRECISION`:s.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function hf(s,e,t,n){let i=s.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,l=function(L){let O="SHADOWMAP_TYPE_BASIC";return L.shadowMapType===ed?O="SHADOWMAP_TYPE_PCF":L.shadowMapType===bc?O="SHADOWMAP_TYPE_PCF_SOFT":L.shadowMapType===Pn&&(O="SHADOWMAP_TYPE_VSM"),O}(t),c=function(L){let O="ENVMAP_TYPE_CUBE";if(L.envMap)switch(L.envMapMode){case rs:case as:O="ENVMAP_TYPE_CUBE";break;case Za:O="ENVMAP_TYPE_CUBE_UV"}return O}(t),h=function(L){let O="ENVMAP_MODE_REFLECTION";return L.envMap&&L.envMapMode===as&&(O="ENVMAP_MODE_REFRACTION"),O}(t),u=function(L){let O="ENVMAP_BLENDING_NONE";if(L.envMap)switch(L.combine){case Mc:O="ENVMAP_BLENDING_MULTIPLY";break;case Ap:O="ENVMAP_BLENDING_MIX";break;case Rp:O="ENVMAP_BLENDING_ADD"}return O}(t),d=function(L){let O=L.envMapCubeUVHeight;if(O===null)return null;let k=Math.log2(O)-2,Q=1/O;return{texelWidth:1/(3*Math.max(Math.pow(2,k),112)),texelHeight:Q,maxMip:k}}(t),p=t.isWebGL2?"":function(L){return[L.extensionDerivatives||L.envMapCubeUVHeight||L.bumpMap||L.normalMapTangentSpace||L.clearcoatNormalMap||L.flatShading||L.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(L.extensionFragDepth||L.logarithmicDepthBuffer)&&L.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",L.extensionDrawBuffers&&L.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(L.extensionShaderTextureLOD||L.envMap||L.transmission)&&L.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(Zi).join(`
`)}(t),f=function(L){return[L.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(Zi).join(`
`)}(t),_=function(L){let O=[];for(let k in L){let Q=L[k];Q!==!1&&O.push("#define "+k+" "+Q)}return O.join(`
`)}(r),m=i.createProgram(),y,v,g=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(y=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(Zi).join(`
`),y.length>0&&(y+=`
`),v=[p,"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(Zi).join(`
`),v.length>0&&(v+=`
`)):(y=[Ru(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Zi).join(`
`),v=[p,Ru(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==ti?"#define TONE_MAPPING":"",t.toneMapping!==ti?Ie.tonemapping_pars_fragment:"",t.toneMapping!==ti?sf("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ie.colorspace_pars_fragment,nf("linearToOutputTexel",t.outputColorSpace),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Zi).join(`
`)),a=Il(a),a=Eu(a,t),a=Tu(a,t),o=Il(o),o=Eu(o,t),o=Tu(o,t),a=Au(a),o=Au(o),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(g=`#version 300 es
`,y=[f,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+y,v=["precision mediump sampler2DArray;","#define varying in",t.glslVersion===Xh?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Xh?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+v);let M=g+y+a,T=g+v+o,w=Su(i,i.VERTEX_SHADER,M),R=Su(i,i.FRAGMENT_SHADER,T);function I(L){if(s.debug.checkShaderErrors){let O=i.getProgramInfoLog(m).trim(),k=i.getShaderInfoLog(w).trim(),Q=i.getShaderInfoLog(R).trim(),oe=!0,J=!0;if(i.getProgramParameter(m,i.LINK_STATUS)===!1)if(oe=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(i,m,w,R);else{let j=wu(i,w,"vertex"),Y=wu(i,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(m,i.VALIDATE_STATUS)+`

Program Info Log: `+O+`
`+j+`
`+Y)}else O!==""?console.warn("THREE.WebGLProgram: Program Info Log:",O):k!==""&&Q!==""||(J=!1);J&&(L.diagnostics={runnable:oe,programLog:O,vertexShader:{log:k,prefix:y},fragmentShader:{log:Q,prefix:v}})}i.deleteShader(w),i.deleteShader(R),P=new ss(i,m),B=function(O,k){let Q={},oe=O.getProgramParameter(k,O.ACTIVE_ATTRIBUTES);for(let J=0;J<oe;J++){let j=O.getActiveAttrib(k,J),Y=j.name,z=1;j.type===O.FLOAT_MAT2&&(z=2),j.type===O.FLOAT_MAT3&&(z=3),j.type===O.FLOAT_MAT4&&(z=4),Q[Y]={type:j.type,location:O.getAttribLocation(k,Y),locationSize:z}}return Q}(i,m)}let P,B;i.attachShader(m,w),i.attachShader(m,R),t.index0AttributeName!==void 0?i.bindAttribLocation(m,0,t.index0AttributeName):t.morphTargets===!0&&i.bindAttribLocation(m,0,"position"),i.linkProgram(m),this.getUniforms=function(){return P===void 0&&I(this),P},this.getAttributes=function(){return B===void 0&&I(this),B};let V=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return V===!1&&(V=i.getProgramParameter(m,ef)),V},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(m),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=tf++,this.cacheKey=e,this.usedTimes=1,this.program=m,this.vertexShader=w,this.fragmentShader=R,this}function df(s,e,t,n,i,r,a){let o=new Gs,l=new Dl,c=[],h=i.isWebGL2,u=i.logarithmicDepthBuffer,d=i.vertexTextures,p=i.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(m){return m===0?"uv":`uv${m}`}return{getParameters:function(m,y,v,g,M){let T=g.fog,w=M.geometry,R=m.isMeshStandardMaterial?g.environment:null,I=(m.isMeshStandardMaterial?t:e).get(m.envMap||R),P=I&&I.mapping===Za?I.image.height:null,B=f[m.type];m.precision!==null&&(p=i.getMaxPrecision(m.precision),p!==m.precision&&console.warn("THREE.WebGLProgram.getParameters:",m.precision,"not supported, using",p,"instead."));let V=w.morphAttributes.position||w.morphAttributes.normal||w.morphAttributes.color,L=V!==void 0?V.length:0,O,k,Q,oe,J=0;if(w.morphAttributes.position!==void 0&&(J=1),w.morphAttributes.normal!==void 0&&(J=2),w.morphAttributes.color!==void 0&&(J=3),B){let Re=hn[B];O=Re.vertexShader,k=Re.fragmentShader}else O=m.vertexShader,k=m.fragmentShader,l.update(m),Q=l.getVertexShaderID(m),oe=l.getFragmentShaderID(m);let j=s.getRenderTarget(),Y=M.isInstancedMesh===!0,z=M.isBatchedMesh===!0,Z=!!m.map,ce=!!m.matcap,x=!!I,S=!!m.aoMap,U=!!m.lightMap,X=!!m.bumpMap,D=!!m.normalMap,q=!!m.displacementMap,N=!!m.emissiveMap,F=!!m.metalnessMap,H=!!m.roughnessMap,te=m.anisotropy>0,ee=m.clearcoat>0,E=m.iridescence>0,se=m.sheen>0,G=m.transmission>0,W=te&&!!m.anisotropyMap,re=ee&&!!m.clearcoatMap,he=ee&&!!m.clearcoatNormalMap,de=ee&&!!m.clearcoatRoughnessMap,pe=E&&!!m.iridescenceMap,Se=E&&!!m.iridescenceThicknessMap,me=se&&!!m.sheenColorMap,_e=se&&!!m.sheenRoughnessMap,Le=!!m.specularMap,lt=!!m.specularColorMap,ve=!!m.specularIntensityMap,Ne=G&&!!m.transmissionMap,Ue=G&&!!m.thicknessMap,Ti=!!m.gradientMap,yn=!!m.alphaMap,Ai=m.alphaTest>0,Ct=!!m.alphaHash,_t=!!m.extensions,Dt=!!w.attributes.uv1,b=!!w.attributes.uv2,fe=!!w.attributes.uv3,De=ti;return m.toneMapped&&(j!==null&&j.isXRRenderTarget!==!0||(De=s.toneMapping)),{isWebGL2:h,shaderID:B,shaderType:m.type,shaderName:m.name,vertexShader:O,fragmentShader:k,defines:m.defines,customVertexShaderID:Q,customFragmentShaderID:oe,isRawShaderMaterial:m.isRawShaderMaterial===!0,glslVersion:m.glslVersion,precision:p,batching:z,instancing:Y,instancingColor:Y&&M.instanceColor!==null,supportsVertexTextures:d,outputColorSpace:j===null?s.outputColorSpace:j.isXRRenderTarget===!0?j.texture.colorSpace:Dn,map:Z,matcap:ce,envMap:x,envMapMode:x&&I.mapping,envMapCubeUVHeight:P,aoMap:S,lightMap:U,bumpMap:X,normalMap:D,displacementMap:d&&q,emissiveMap:N,normalMapObjectSpace:D&&m.normalMapType===1,normalMapTangentSpace:D&&m.normalMapType===0,metalnessMap:F,roughnessMap:H,anisotropy:te,anisotropyMap:W,clearcoat:ee,clearcoatMap:re,clearcoatNormalMap:he,clearcoatRoughnessMap:de,iridescence:E,iridescenceMap:pe,iridescenceThicknessMap:Se,sheen:se,sheenColorMap:me,sheenRoughnessMap:_e,specularMap:Le,specularColorMap:lt,specularIntensityMap:ve,transmission:G,transmissionMap:Ne,thicknessMap:Ue,gradientMap:Ti,opaque:m.transparent===!1&&m.blending===1,alphaMap:yn,alphaTest:Ai,alphaHash:Ct,combine:m.combine,mapUv:Z&&_(m.map.channel),aoMapUv:S&&_(m.aoMap.channel),lightMapUv:U&&_(m.lightMap.channel),bumpMapUv:X&&_(m.bumpMap.channel),normalMapUv:D&&_(m.normalMap.channel),displacementMapUv:q&&_(m.displacementMap.channel),emissiveMapUv:N&&_(m.emissiveMap.channel),metalnessMapUv:F&&_(m.metalnessMap.channel),roughnessMapUv:H&&_(m.roughnessMap.channel),anisotropyMapUv:W&&_(m.anisotropyMap.channel),clearcoatMapUv:re&&_(m.clearcoatMap.channel),clearcoatNormalMapUv:he&&_(m.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:de&&_(m.clearcoatRoughnessMap.channel),iridescenceMapUv:pe&&_(m.iridescenceMap.channel),iridescenceThicknessMapUv:Se&&_(m.iridescenceThicknessMap.channel),sheenColorMapUv:me&&_(m.sheenColorMap.channel),sheenRoughnessMapUv:_e&&_(m.sheenRoughnessMap.channel),specularMapUv:Le&&_(m.specularMap.channel),specularColorMapUv:lt&&_(m.specularColorMap.channel),specularIntensityMapUv:ve&&_(m.specularIntensityMap.channel),transmissionMapUv:Ne&&_(m.transmissionMap.channel),thicknessMapUv:Ue&&_(m.thicknessMap.channel),alphaMapUv:yn&&_(m.alphaMap.channel),vertexTangents:!!w.attributes.tangent&&(D||te),vertexColors:m.vertexColors,vertexAlphas:m.vertexColors===!0&&!!w.attributes.color&&w.attributes.color.itemSize===4,vertexUv1s:Dt,vertexUv2s:b,vertexUv3s:fe,pointsUvs:M.isPoints===!0&&!!w.attributes.uv&&(Z||yn),fog:!!T,useFog:m.fog===!0,fogExp2:T&&T.isFogExp2,flatShading:m.flatShading===!0,sizeAttenuation:m.sizeAttenuation===!0,logarithmicDepthBuffer:u,skinning:M.isSkinnedMesh===!0,morphTargets:w.morphAttributes.position!==void 0,morphNormals:w.morphAttributes.normal!==void 0,morphColors:w.morphAttributes.color!==void 0,morphTargetsCount:L,morphTextureStride:J,numDirLights:y.directional.length,numPointLights:y.point.length,numSpotLights:y.spot.length,numSpotLightMaps:y.spotLightMap.length,numRectAreaLights:y.rectArea.length,numHemiLights:y.hemi.length,numDirLightShadows:y.directionalShadowMap.length,numPointLightShadows:y.pointShadowMap.length,numSpotLightShadows:y.spotShadowMap.length,numSpotLightShadowsWithMaps:y.numSpotLightShadowsWithMaps,numLightProbes:y.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:m.dithering,shadowMapEnabled:s.shadowMap.enabled&&v.length>0,shadowMapType:s.shadowMap.type,toneMapping:De,useLegacyLights:s._useLegacyLights,decodeVideoTexture:Z&&m.map.isVideoTexture===!0&&qe.getTransfer(m.map.colorSpace)===Ke,premultipliedAlpha:m.premultipliedAlpha,doubleSided:m.side===2,flipSided:m.side===It,useDepthPacking:m.depthPacking>=0,depthPacking:m.depthPacking||0,index0AttributeName:m.index0AttributeName,extensionDerivatives:_t&&m.extensions.derivatives===!0,extensionFragDepth:_t&&m.extensions.fragDepth===!0,extensionDrawBuffers:_t&&m.extensions.drawBuffers===!0,extensionShaderTextureLOD:_t&&m.extensions.shaderTextureLOD===!0,extensionClipCullDistance:_t&&m.extensions.clipCullDistance&&n.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:h||n.has("EXT_frag_depth"),rendererExtensionDrawBuffers:h||n.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:h||n.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:m.customProgramCacheKey()}},getProgramCacheKey:function(m){let y=[];if(m.shaderID?y.push(m.shaderID):(y.push(m.customVertexShaderID),y.push(m.customFragmentShaderID)),m.defines!==void 0)for(let v in m.defines)y.push(v),y.push(m.defines[v]);return m.isRawShaderMaterial===!1&&(function(v,g){v.push(g.precision),v.push(g.outputColorSpace),v.push(g.envMapMode),v.push(g.envMapCubeUVHeight),v.push(g.mapUv),v.push(g.alphaMapUv),v.push(g.lightMapUv),v.push(g.aoMapUv),v.push(g.bumpMapUv),v.push(g.normalMapUv),v.push(g.displacementMapUv),v.push(g.emissiveMapUv),v.push(g.metalnessMapUv),v.push(g.roughnessMapUv),v.push(g.anisotropyMapUv),v.push(g.clearcoatMapUv),v.push(g.clearcoatNormalMapUv),v.push(g.clearcoatRoughnessMapUv),v.push(g.iridescenceMapUv),v.push(g.iridescenceThicknessMapUv),v.push(g.sheenColorMapUv),v.push(g.sheenRoughnessMapUv),v.push(g.specularMapUv),v.push(g.specularColorMapUv),v.push(g.specularIntensityMapUv),v.push(g.transmissionMapUv),v.push(g.thicknessMapUv),v.push(g.combine),v.push(g.fogExp2),v.push(g.sizeAttenuation),v.push(g.morphTargetsCount),v.push(g.morphAttributeCount),v.push(g.numDirLights),v.push(g.numPointLights),v.push(g.numSpotLights),v.push(g.numSpotLightMaps),v.push(g.numHemiLights),v.push(g.numRectAreaLights),v.push(g.numDirLightShadows),v.push(g.numPointLightShadows),v.push(g.numSpotLightShadows),v.push(g.numSpotLightShadowsWithMaps),v.push(g.numLightProbes),v.push(g.shadowMapType),v.push(g.toneMapping),v.push(g.numClippingPlanes),v.push(g.numClipIntersection),v.push(g.depthPacking)}(y,m),function(v,g){o.disableAll(),g.isWebGL2&&o.enable(0),g.supportsVertexTextures&&o.enable(1),g.instancing&&o.enable(2),g.instancingColor&&o.enable(3),g.matcap&&o.enable(4),g.envMap&&o.enable(5),g.normalMapObjectSpace&&o.enable(6),g.normalMapTangentSpace&&o.enable(7),g.clearcoat&&o.enable(8),g.iridescence&&o.enable(9),g.alphaTest&&o.enable(10),g.vertexColors&&o.enable(11),g.vertexAlphas&&o.enable(12),g.vertexUv1s&&o.enable(13),g.vertexUv2s&&o.enable(14),g.vertexUv3s&&o.enable(15),g.vertexTangents&&o.enable(16),g.anisotropy&&o.enable(17),g.alphaHash&&o.enable(18),g.batching&&o.enable(19),v.push(o.mask),o.disableAll(),g.fog&&o.enable(0),g.useFog&&o.enable(1),g.flatShading&&o.enable(2),g.logarithmicDepthBuffer&&o.enable(3),g.skinning&&o.enable(4),g.morphTargets&&o.enable(5),g.morphNormals&&o.enable(6),g.morphColors&&o.enable(7),g.premultipliedAlpha&&o.enable(8),g.shadowMapEnabled&&o.enable(9),g.useLegacyLights&&o.enable(10),g.doubleSided&&o.enable(11),g.flipSided&&o.enable(12),g.useDepthPacking&&o.enable(13),g.dithering&&o.enable(14),g.transmission&&o.enable(15),g.sheen&&o.enable(16),g.opaque&&o.enable(17),g.pointsUvs&&o.enable(18),g.decodeVideoTexture&&o.enable(19),v.push(o.mask)}(y,m),y.push(s.outputColorSpace)),y.push(m.customProgramCacheKey),y.join()},getUniforms:function(m){let y=f[m.type],v;if(y){let g=hn[y];v=Zp.clone(g.uniforms)}else v=m.uniforms;return v},acquireProgram:function(m,y){let v;for(let g=0,M=c.length;g<M;g++){let T=c[g];if(T.cacheKey===y){v=T,++v.usedTimes;break}}return v===void 0&&(v=new hf(s,y,m,r),c.push(v)),v},releaseProgram:function(m){if(--m.usedTimes==0){let y=c.indexOf(m);c[y]=c[c.length-1],c.pop(),m.destroy()}},releaseShaderCache:function(m){l.remove(m)},programs:c,dispose:function(){l.dispose()}}}function pf(){let s=new WeakMap;return{get:function(e){let t=s.get(e);return t===void 0&&(t={},s.set(e,t)),t},remove:function(e){s.delete(e)},update:function(e,t,n){s.get(e)[t]=n},dispose:function(){s=new WeakMap}}}function mf(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.material.id!==e.material.id?s.material.id-e.material.id:s.z!==e.z?s.z-e.z:s.id-e.id}function Cu(s,e){return s.groupOrder!==e.groupOrder?s.groupOrder-e.groupOrder:s.renderOrder!==e.renderOrder?s.renderOrder-e.renderOrder:s.z!==e.z?e.z-s.z:s.id-e.id}function Lu(){let s=[],e=0,t=[],n=[],i=[];function r(a,o,l,c,h,u){let d=s[e];return d===void 0?(d={id:a.id,object:a,geometry:o,material:l,groupOrder:c,renderOrder:a.renderOrder,z:h,group:u},s[e]=d):(d.id=a.id,d.object=a,d.geometry=o,d.material=l,d.groupOrder=c,d.renderOrder=a.renderOrder,d.z=h,d.group=u),e++,d}return{opaque:t,transmissive:n,transparent:i,init:function(){e=0,t.length=0,n.length=0,i.length=0},push:function(a,o,l,c,h,u){let d=r(a,o,l,c,h,u);l.transmission>0?n.push(d):l.transparent===!0?i.push(d):t.push(d)},unshift:function(a,o,l,c,h,u){let d=r(a,o,l,c,h,u);l.transmission>0?n.unshift(d):l.transparent===!0?i.unshift(d):t.unshift(d)},finish:function(){for(let a=e,o=s.length;a<o;a++){let l=s[a];if(l.id===null)break;l.id=null,l.object=null,l.geometry=null,l.material=null,l.group=null}},sort:function(a,o){t.length>1&&t.sort(a||mf),n.length>1&&n.sort(o||Cu),i.length>1&&i.sort(o||Cu)}}}function ff(){let s=new WeakMap;return{get:function(e,t){let n=s.get(e),i;return n===void 0?(i=new Lu,s.set(e,[i])):t>=n.length?(i=new Lu,n.push(i)):i=n[t],i},dispose:function(){s=new WeakMap}}}function gf(){let s={};return{get:function(e){if(s[e.id]!==void 0)return s[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new A,color:new Ae};break;case"SpotLight":t={position:new A,direction:new A,color:new Ae,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new A,color:new Ae,distance:0,decay:0};break;case"HemisphereLight":t={direction:new A,skyColor:new Ae,groundColor:new Ae};break;case"RectAreaLight":t={color:new Ae,position:new A,halfWidth:new A,halfHeight:new A}}return s[e.id]=t,t}}}function vf(s,e){return(e.castShadow?2:0)-(s.castShadow?2:0)+(e.map?1:0)-(s.map?1:0)}function yf(s,e){let t=new gf,n=function(){let l={};return{get:function(c){if(l[c.id]!==void 0)return l[c.id];let h;switch(c.type){case"DirectionalLight":case"SpotLight":h={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ie};break;case"PointLight":h={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ie,shadowCameraNear:1,shadowCameraFar:1e3}}return l[c.id]=h,h}}}(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new A);let r=new A,a=new Ce,o=new Ce;return{setup:function(l,c){let h=0,u=0,d=0;for(let B=0;B<9;B++)i.probe[B].set(0,0,0);let p=0,f=0,_=0,m=0,y=0,v=0,g=0,M=0,T=0,w=0,R=0;l.sort(vf);let I=c===!0?Math.PI:1;for(let B=0,V=l.length;B<V;B++){let L=l[B],O=L.color,k=L.intensity,Q=L.distance,oe=L.shadow&&L.shadow.map?L.shadow.map.texture:null;if(L.isAmbientLight)h+=O.r*k*I,u+=O.g*k*I,d+=O.b*k*I;else if(L.isLightProbe){for(let J=0;J<9;J++)i.probe[J].addScaledVector(L.sh.coefficients[J],k);R++}else if(L.isDirectionalLight){let J=t.get(L);if(J.color.copy(L.color).multiplyScalar(L.intensity*I),L.castShadow){let j=L.shadow,Y=n.get(L);Y.shadowBias=j.bias,Y.shadowNormalBias=j.normalBias,Y.shadowRadius=j.radius,Y.shadowMapSize=j.mapSize,i.directionalShadow[p]=Y,i.directionalShadowMap[p]=oe,i.directionalShadowMatrix[p]=L.shadow.matrix,v++}i.directional[p]=J,p++}else if(L.isSpotLight){let J=t.get(L);J.position.setFromMatrixPosition(L.matrixWorld),J.color.copy(O).multiplyScalar(k*I),J.distance=Q,J.coneCos=Math.cos(L.angle),J.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),J.decay=L.decay,i.spot[_]=J;let j=L.shadow;if(L.map&&(i.spotLightMap[T]=L.map,T++,j.updateMatrices(L),L.castShadow&&w++),i.spotLightMatrix[_]=j.matrix,L.castShadow){let Y=n.get(L);Y.shadowBias=j.bias,Y.shadowNormalBias=j.normalBias,Y.shadowRadius=j.radius,Y.shadowMapSize=j.mapSize,i.spotShadow[_]=Y,i.spotShadowMap[_]=oe,M++}_++}else if(L.isRectAreaLight){let J=t.get(L);J.color.copy(O).multiplyScalar(k),J.halfWidth.set(.5*L.width,0,0),J.halfHeight.set(0,.5*L.height,0),i.rectArea[m]=J,m++}else if(L.isPointLight){let J=t.get(L);if(J.color.copy(L.color).multiplyScalar(L.intensity*I),J.distance=L.distance,J.decay=L.decay,L.castShadow){let j=L.shadow,Y=n.get(L);Y.shadowBias=j.bias,Y.shadowNormalBias=j.normalBias,Y.shadowRadius=j.radius,Y.shadowMapSize=j.mapSize,Y.shadowCameraNear=j.camera.near,Y.shadowCameraFar=j.camera.far,i.pointShadow[f]=Y,i.pointShadowMap[f]=oe,i.pointShadowMatrix[f]=L.shadow.matrix,g++}i.point[f]=J,f++}else if(L.isHemisphereLight){let J=t.get(L);J.skyColor.copy(L.color).multiplyScalar(k*I),J.groundColor.copy(L.groundColor).multiplyScalar(k*I),i.hemi[y]=J,y++}}m>0&&(e.isWebGL2?s.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=le.LTC_FLOAT_1,i.rectAreaLTC2=le.LTC_FLOAT_2):(i.rectAreaLTC1=le.LTC_HALF_1,i.rectAreaLTC2=le.LTC_HALF_2):s.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=le.LTC_FLOAT_1,i.rectAreaLTC2=le.LTC_FLOAT_2):s.has("OES_texture_half_float_linear")===!0?(i.rectAreaLTC1=le.LTC_HALF_1,i.rectAreaLTC2=le.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),i.ambient[0]=h,i.ambient[1]=u,i.ambient[2]=d;let P=i.hash;P.directionalLength===p&&P.pointLength===f&&P.spotLength===_&&P.rectAreaLength===m&&P.hemiLength===y&&P.numDirectionalShadows===v&&P.numPointShadows===g&&P.numSpotShadows===M&&P.numSpotMaps===T&&P.numLightProbes===R||(i.directional.length=p,i.spot.length=_,i.rectArea.length=m,i.point.length=f,i.hemi.length=y,i.directionalShadow.length=v,i.directionalShadowMap.length=v,i.pointShadow.length=g,i.pointShadowMap.length=g,i.spotShadow.length=M,i.spotShadowMap.length=M,i.directionalShadowMatrix.length=v,i.pointShadowMatrix.length=g,i.spotLightMatrix.length=M+T-w,i.spotLightMap.length=T,i.numSpotLightShadowsWithMaps=w,i.numLightProbes=R,P.directionalLength=p,P.pointLength=f,P.spotLength=_,P.rectAreaLength=m,P.hemiLength=y,P.numDirectionalShadows=v,P.numPointShadows=g,P.numSpotShadows=M,P.numSpotMaps=T,P.numLightProbes=R,i.version=_f++)},setupView:function(l,c){let h=0,u=0,d=0,p=0,f=0,_=c.matrixWorldInverse;for(let m=0,y=l.length;m<y;m++){let v=l[m];if(v.isDirectionalLight){let g=i.directional[h];g.direction.setFromMatrixPosition(v.matrixWorld),r.setFromMatrixPosition(v.target.matrixWorld),g.direction.sub(r),g.direction.transformDirection(_),h++}else if(v.isSpotLight){let g=i.spot[d];g.position.setFromMatrixPosition(v.matrixWorld),g.position.applyMatrix4(_),g.direction.setFromMatrixPosition(v.matrixWorld),r.setFromMatrixPosition(v.target.matrixWorld),g.direction.sub(r),g.direction.transformDirection(_),d++}else if(v.isRectAreaLight){let g=i.rectArea[p];g.position.setFromMatrixPosition(v.matrixWorld),g.position.applyMatrix4(_),o.identity(),a.copy(v.matrixWorld),a.premultiply(_),o.extractRotation(a),g.halfWidth.set(.5*v.width,0,0),g.halfHeight.set(0,.5*v.height,0),g.halfWidth.applyMatrix4(o),g.halfHeight.applyMatrix4(o),p++}else if(v.isPointLight){let g=i.point[u];g.position.setFromMatrixPosition(v.matrixWorld),g.position.applyMatrix4(_),u++}else if(v.isHemisphereLight){let g=i.hemi[f];g.direction.setFromMatrixPosition(v.matrixWorld),g.direction.transformDirection(_),f++}}},state:i}}function Pu(s,e){let t=new yf(s,e),n=[],i=[];return{init:function(){n.length=0,i.length=0},state:{lightsArray:n,shadowsArray:i,lights:t},setupLights:function(r){t.setup(n,r)},setupLightsView:function(r){t.setupView(n,r)},pushLight:function(r){n.push(r)},pushShadow:function(r){i.push(r)}}}function xf(s,e){let t=new WeakMap;return{get:function(n,i=0){let r=t.get(n),a;return r===void 0?(a=new Pu(s,e),t.set(n,[a])):i>=r.length?(a=new Pu(s,e),r.push(a)):a=r[i],a},dispose:function(){t=new WeakMap}}}function bf(s,e,t){let n=new us,i=new ie,r=new ie,a=new Je,o=new Ul({depthPacking:3201}),l=new Ol,c={},h=t.maxTextureSize,u={[ii]:It,[It]:ii,2:2},d=new Fn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ie},radius:{value:4}},vertexShader:`void main() {
	gl_Position = vec4( position, 1.0 );
}`,fragmentShader:`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`}),p=d.clone();p.defines.HORIZONTAL_PASS=1;let f=new Ye;f.setAttribute("position",new Rt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let _=new ge(f,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ed;let y=this.type;function v(w,R){let I=e.update(_);d.defines.VSM_SAMPLES!==w.blurSamples&&(d.defines.VSM_SAMPLES=w.blurSamples,p.defines.VSM_SAMPLES=w.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),w.mapPass===null&&(w.mapPass=new Nn(i.x,i.y)),d.uniforms.shadow_pass.value=w.map.texture,d.uniforms.resolution.value=w.mapSize,d.uniforms.radius.value=w.radius,s.setRenderTarget(w.mapPass),s.clear(),s.renderBufferDirect(R,null,I,d,_,null),p.uniforms.shadow_pass.value=w.mapPass.texture,p.uniforms.resolution.value=w.mapSize,p.uniforms.radius.value=w.radius,s.setRenderTarget(w.map),s.clear(),s.renderBufferDirect(R,null,I,p,_,null)}function g(w,R,I,P){let B=null,V=I.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(V!==void 0)B=V;else if(B=I.isPointLight===!0?l:o,s.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0){let L=B.uuid,O=R.uuid,k=c[L];k===void 0&&(k={},c[L]=k);let Q=k[O];Q===void 0&&(Q=B.clone(),k[O]=Q,R.addEventListener("dispose",T)),B=Q}return B.visible=R.visible,B.wireframe=R.wireframe,B.side=P===Pn?R.shadowSide!==null?R.shadowSide:R.side:R.shadowSide!==null?R.shadowSide:u[R.side],B.alphaMap=R.alphaMap,B.alphaTest=R.alphaTest,B.map=R.map,B.clipShadows=R.clipShadows,B.clippingPlanes=R.clippingPlanes,B.clipIntersection=R.clipIntersection,B.displacementMap=R.displacementMap,B.displacementScale=R.displacementScale,B.displacementBias=R.displacementBias,B.wireframeLinewidth=R.wireframeLinewidth,B.linewidth=R.linewidth,I.isPointLight===!0&&B.isMeshDistanceMaterial===!0&&(s.properties.get(B).light=I),B}function M(w,R,I,P,B){if(w.visible===!1)return;if(w.layers.test(R.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&B===Pn)&&(!w.frustumCulled||n.intersectsObject(w))){w.modelViewMatrix.multiplyMatrices(I.matrixWorldInverse,w.matrixWorld);let L=e.update(w),O=w.material;if(Array.isArray(O)){let k=L.groups;for(let Q=0,oe=k.length;Q<oe;Q++){let J=k[Q],j=O[J.materialIndex];if(j&&j.visible){let Y=g(w,j,P,B);w.onBeforeShadow(s,w,R,I,L,Y,J),s.renderBufferDirect(I,null,L,Y,w,J),w.onAfterShadow(s,w,R,I,L,Y,J)}}}else if(O.visible){let k=g(w,O,P,B);w.onBeforeShadow(s,w,R,I,L,k,null),s.renderBufferDirect(I,null,L,k,w,null),w.onAfterShadow(s,w,R,I,L,k,null)}}let V=w.children;for(let L=0,O=V.length;L<O;L++)M(V[L],R,I,P,B)}function T(w){w.target.removeEventListener("dispose",T);for(let R in c){let I=c[R],P=w.target.uuid;P in I&&(I[P].dispose(),delete I[P])}}this.render=function(w,R,I){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||w.length===0)return;let P=s.getRenderTarget(),B=s.getActiveCubeFace(),V=s.getActiveMipmapLevel(),L=s.state;L.setBlending(0),L.buffers.color.setClear(1,1,1,1),L.buffers.depth.setTest(!0),L.setScissorTest(!1);let O=y!==Pn&&this.type===Pn,k=y===Pn&&this.type!==Pn;for(let Q=0,oe=w.length;Q<oe;Q++){let J=w[Q],j=J.shadow;if(j===void 0){console.warn("THREE.WebGLShadowMap:",J,"has no shadow.");continue}if(j.autoUpdate===!1&&j.needsUpdate===!1)continue;i.copy(j.mapSize);let Y=j.getFrameExtents();if(i.multiply(Y),r.copy(j.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(r.x=Math.floor(h/Y.x),i.x=r.x*Y.x,j.mapSize.x=r.x),i.y>h&&(r.y=Math.floor(h/Y.y),i.y=r.y*Y.y,j.mapSize.y=r.y)),j.map===null||O===!0||k===!0){let Z=this.type!==Pn?{minFilter:At,magFilter:At}:{};j.map!==null&&j.map.dispose(),j.map=new Nn(i.x,i.y,Z),j.map.texture.name=J.name+".shadowMap",j.camera.updateProjectionMatrix()}s.setRenderTarget(j.map),s.clear();let z=j.getViewportCount();for(let Z=0;Z<z;Z++){let ce=j.getViewport(Z);a.set(r.x*ce.x,r.y*ce.y,r.x*ce.z,r.y*ce.w),L.viewport(a),j.updateMatrices(J,Z),n=j.getFrustum(),M(R,I,j.camera,J,this.type)}j.isPointLightShadow!==!0&&this.type===Pn&&v(j,I),j.needsUpdate=!1}y=this.type,m.needsUpdate=!1,s.setRenderTarget(P,B,V)}}function Mf(s,e,t){let n=t.isWebGL2,i=new function(){let E=!1,se=new Je,G=null,W=new Je(0,0,0,0);return{setMask:function(re){G===re||E||(s.colorMask(re,re,re,re),G=re)},setLocked:function(re){E=re},setClear:function(re,he,de,pe,Se){Se===!0&&(re*=pe,he*=pe,de*=pe),se.set(re,he,de,pe),W.equals(se)===!1&&(s.clearColor(re,he,de,pe),W.copy(se))},reset:function(){E=!1,G=null,W.set(-1,0,0,0)}}},r=new function(){let E=!1,se=null,G=null,W=null;return{setTest:function(re){re?X(s.DEPTH_TEST):D(s.DEPTH_TEST)},setMask:function(re){se===re||E||(s.depthMask(re),se=re)},setFunc:function(re){if(G!==re){switch(re){case 0:s.depthFunc(s.NEVER);break;case 1:s.depthFunc(s.ALWAYS);break;case 2:s.depthFunc(s.LESS);break;case 3:default:s.depthFunc(s.LEQUAL);break;case 4:s.depthFunc(s.EQUAL);break;case 5:s.depthFunc(s.GEQUAL);break;case 6:s.depthFunc(s.GREATER);break;case 7:s.depthFunc(s.NOTEQUAL)}G=re}},setLocked:function(re){E=re},setClear:function(re){W!==re&&(s.clearDepth(re),W=re)},reset:function(){E=!1,se=null,G=null,W=null}}},a=new function(){let E=!1,se=null,G=null,W=null,re=null,he=null,de=null,pe=null,Se=null;return{setTest:function(me){E||(me?X(s.STENCIL_TEST):D(s.STENCIL_TEST))},setMask:function(me){se===me||E||(s.stencilMask(me),se=me)},setFunc:function(me,_e,Le){G===me&&W===_e&&re===Le||(s.stencilFunc(me,_e,Le),G=me,W=_e,re=Le)},setOp:function(me,_e,Le){he===me&&de===_e&&pe===Le||(s.stencilOp(me,_e,Le),he=me,de=_e,pe=Le)},setLocked:function(me){E=me},setClear:function(me){Se!==me&&(s.clearStencil(me),Se=me)},reset:function(){E=!1,se=null,G=null,W=null,re=null,he=null,de=null,pe=null,Se=null}}},o=new WeakMap,l=new WeakMap,c={},h={},u=new WeakMap,d=[],p=null,f=!1,_=null,m=null,y=null,v=null,g=null,M=null,T=null,w=new Ae(0,0,0),R=0,I=!1,P=null,B=null,V=null,L=null,O=null,k=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS),Q=!1,oe=0,J=s.getParameter(s.VERSION);J.indexOf("WebGL")!==-1?(oe=parseFloat(/^WebGL (\d)/.exec(J)[1]),Q=oe>=1):J.indexOf("OpenGL ES")!==-1&&(oe=parseFloat(/^OpenGL ES (\d)/.exec(J)[1]),Q=oe>=2);let j=null,Y={},z=s.getParameter(s.SCISSOR_BOX),Z=s.getParameter(s.VIEWPORT),ce=new Je().fromArray(z),x=new Je().fromArray(Z);function S(E,se,G,W){let re=new Uint8Array(4),he=s.createTexture();s.bindTexture(E,he),s.texParameteri(E,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(E,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let de=0;de<G;de++)!n||E!==s.TEXTURE_3D&&E!==s.TEXTURE_2D_ARRAY?s.texImage2D(se+de,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,re):s.texImage3D(se,0,s.RGBA,1,1,W,0,s.RGBA,s.UNSIGNED_BYTE,re);return he}let U={};function X(E){c[E]!==!0&&(s.enable(E),c[E]=!0)}function D(E){c[E]!==!1&&(s.disable(E),c[E]=!1)}U[s.TEXTURE_2D]=S(s.TEXTURE_2D,s.TEXTURE_2D,1),U[s.TEXTURE_CUBE_MAP]=S(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),n&&(U[s.TEXTURE_2D_ARRAY]=S(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),U[s.TEXTURE_3D]=S(s.TEXTURE_3D,s.TEXTURE_3D,1,1)),i.setClear(0,0,0,1),r.setClear(1),a.setClear(0),X(s.DEPTH_TEST),r.setFunc(3),H(!1),te(1),X(s.CULL_FACE),F(0);let q={[di]:s.FUNC_ADD,101:s.FUNC_SUBTRACT,102:s.FUNC_REVERSE_SUBTRACT};if(n)q[103]=s.MIN,q[104]=s.MAX;else{let E=e.get("EXT_blend_minmax");E!==null&&(q[103]=E.MIN_EXT,q[104]=E.MAX_EXT)}let N={200:s.ZERO,201:s.ONE,202:s.SRC_COLOR,[gl]:s.SRC_ALPHA,210:s.SRC_ALPHA_SATURATE,208:s.DST_COLOR,206:s.DST_ALPHA,203:s.ONE_MINUS_SRC_COLOR,[_l]:s.ONE_MINUS_SRC_ALPHA,209:s.ONE_MINUS_DST_COLOR,207:s.ONE_MINUS_DST_ALPHA,211:s.CONSTANT_COLOR,212:s.ONE_MINUS_CONSTANT_COLOR,213:s.CONSTANT_ALPHA,214:s.ONE_MINUS_CONSTANT_ALPHA};function F(E,se,G,W,re,he,de,pe,Se,me){if(E!==0){if(f===!1&&(X(s.BLEND),f=!0),E===5)re=re||se,he=he||G,de=de||W,se===m&&re===g||(s.blendEquationSeparate(q[se],q[re]),m=se,g=re),G===y&&W===v&&he===M&&de===T||(s.blendFuncSeparate(N[G],N[W],N[he],N[de]),y=G,v=W,M=he,T=de),pe.equals(w)!==!1&&Se===R||(s.blendColor(pe.r,pe.g,pe.b,Se),w.copy(pe),R=Se),_=E,I=!1;else if(E!==_||me!==I){if(m===di&&g===di||(s.blendEquation(s.FUNC_ADD),m=di,g=di),me)switch(E){case 1:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case 2:s.blendFunc(s.ONE,s.ONE);break;case 3:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case 4:s.blendFuncSeparate(s.ZERO,s.SRC_COLOR,s.ZERO,s.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",E)}else switch(E){case 1:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case 2:s.blendFunc(s.SRC_ALPHA,s.ONE);break;case 3:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case 4:s.blendFunc(s.ZERO,s.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",E)}y=null,v=null,M=null,T=null,w.set(0,0,0),R=0,_=E,I=me}}else f===!0&&(D(s.BLEND),f=!1)}function H(E){P!==E&&(E?s.frontFace(s.CW):s.frontFace(s.CCW),P=E)}function te(E){E!==0?(X(s.CULL_FACE),E!==B&&(E===1?s.cullFace(s.BACK):E===2?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):D(s.CULL_FACE),B=E}function ee(E,se,G){E?(X(s.POLYGON_OFFSET_FILL),L===se&&O===G||(s.polygonOffset(se,G),L=se,O=G)):D(s.POLYGON_OFFSET_FILL)}return{buffers:{color:i,depth:r,stencil:a},enable:X,disable:D,bindFramebuffer:function(E,se){return h[E]!==se&&(s.bindFramebuffer(E,se),h[E]=se,n&&(E===s.DRAW_FRAMEBUFFER&&(h[s.FRAMEBUFFER]=se),E===s.FRAMEBUFFER&&(h[s.DRAW_FRAMEBUFFER]=se)),!0)},drawBuffers:function(E,se){let G=d,W=!1;if(E)if(G=u.get(se),G===void 0&&(G=[],u.set(se,G)),E.isWebGLMultipleRenderTargets){let re=E.texture;if(G.length!==re.length||G[0]!==s.COLOR_ATTACHMENT0){for(let he=0,de=re.length;he<de;he++)G[he]=s.COLOR_ATTACHMENT0+he;G.length=re.length,W=!0}}else G[0]!==s.COLOR_ATTACHMENT0&&(G[0]=s.COLOR_ATTACHMENT0,W=!0);else G[0]!==s.BACK&&(G[0]=s.BACK,W=!0);W&&(t.isWebGL2?s.drawBuffers(G):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(G))},useProgram:function(E){return p!==E&&(s.useProgram(E),p=E,!0)},setBlending:F,setMaterial:function(E,se){E.side===2?D(s.CULL_FACE):X(s.CULL_FACE);let G=E.side===It;se&&(G=!G),H(G),E.blending===1&&E.transparent===!1?F(0):F(E.blending,E.blendEquation,E.blendSrc,E.blendDst,E.blendEquationAlpha,E.blendSrcAlpha,E.blendDstAlpha,E.blendColor,E.blendAlpha,E.premultipliedAlpha),r.setFunc(E.depthFunc),r.setTest(E.depthTest),r.setMask(E.depthWrite),i.setMask(E.colorWrite);let W=E.stencilWrite;a.setTest(W),W&&(a.setMask(E.stencilWriteMask),a.setFunc(E.stencilFunc,E.stencilRef,E.stencilFuncMask),a.setOp(E.stencilFail,E.stencilZFail,E.stencilZPass)),ee(E.polygonOffset,E.polygonOffsetFactor,E.polygonOffsetUnits),E.alphaToCoverage===!0?X(s.SAMPLE_ALPHA_TO_COVERAGE):D(s.SAMPLE_ALPHA_TO_COVERAGE)},setFlipSided:H,setCullFace:te,setLineWidth:function(E){E!==V&&(Q&&s.lineWidth(E),V=E)},setPolygonOffset:ee,setScissorTest:function(E){E?X(s.SCISSOR_TEST):D(s.SCISSOR_TEST)},activeTexture:function(E){E===void 0&&(E=s.TEXTURE0+k-1),j!==E&&(s.activeTexture(E),j=E)},bindTexture:function(E,se,G){G===void 0&&(G=j===null?s.TEXTURE0+k-1:j);let W=Y[G];W===void 0&&(W={type:void 0,texture:void 0},Y[G]=W),W.type===E&&W.texture===se||(j!==G&&(s.activeTexture(G),j=G),s.bindTexture(E,se||U[E]),W.type=E,W.texture=se)},unbindTexture:function(){let E=Y[j];E!==void 0&&E.type!==void 0&&(s.bindTexture(E.type,null),E.type=void 0,E.texture=void 0)},compressedTexImage2D:function(){try{s.compressedTexImage2D.apply(s,arguments)}catch(E){console.error("THREE.WebGLState:",E)}},compressedTexImage3D:function(){try{s.compressedTexImage3D.apply(s,arguments)}catch(E){console.error("THREE.WebGLState:",E)}},texImage2D:function(){try{s.texImage2D.apply(s,arguments)}catch(E){console.error("THREE.WebGLState:",E)}},texImage3D:function(){try{s.texImage3D.apply(s,arguments)}catch(E){console.error("THREE.WebGLState:",E)}},updateUBOMapping:function(E,se){let G=l.get(se);G===void 0&&(G=new WeakMap,l.set(se,G));let W=G.get(E);W===void 0&&(W=s.getUniformBlockIndex(se,E.name),G.set(E,W))},uniformBlockBinding:function(E,se){let G=l.get(se).get(E);o.get(se)!==G&&(s.uniformBlockBinding(se,G,E.__bindingPointIndex),o.set(se,G))},texStorage2D:function(){try{s.texStorage2D.apply(s,arguments)}catch(E){console.error("THREE.WebGLState:",E)}},texStorage3D:function(){try{s.texStorage3D.apply(s,arguments)}catch(E){console.error("THREE.WebGLState:",E)}},texSubImage2D:function(){try{s.texSubImage2D.apply(s,arguments)}catch(E){console.error("THREE.WebGLState:",E)}},texSubImage3D:function(){try{s.texSubImage3D.apply(s,arguments)}catch(E){console.error("THREE.WebGLState:",E)}},compressedTexSubImage2D:function(){try{s.compressedTexSubImage2D.apply(s,arguments)}catch(E){console.error("THREE.WebGLState:",E)}},compressedTexSubImage3D:function(){try{s.compressedTexSubImage3D.apply(s,arguments)}catch(E){console.error("THREE.WebGLState:",E)}},scissor:function(E){ce.equals(E)===!1&&(s.scissor(E.x,E.y,E.z,E.w),ce.copy(E))},viewport:function(E){x.equals(E)===!1&&(s.viewport(E.x,E.y,E.z,E.w),x.copy(E))},reset:function(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),n===!0&&(s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null)),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),c={},j=null,Y={},h={},u=new WeakMap,d=[],p=null,f=!1,_=null,m=null,y=null,v=null,g=null,M=null,T=null,w=new Ae(0,0,0),R=0,I=!1,P=null,B=null,V=null,L=null,O=null,ce.set(0,0,s.canvas.width,s.canvas.height),x.set(0,0,s.canvas.width,s.canvas.height),i.reset(),r.reset(),a.reset()}}}function Sf(s,e,t,n,i,r,a){let o=i.isWebGL2,l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator<"u"&&/OculusBrowser/g.test(navigator.userAgent),h=new WeakMap,u,d=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function f(x,S){return p?new OffscreenCanvas(x,S):Hs("canvas")}function _(x,S,U,X){let D=1;if((x.width>X||x.height>X)&&(D=X/Math.max(x.width,x.height)),D<1||S===!0){if(typeof HTMLImageElement<"u"&&x instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&x instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&x instanceof ImageBitmap){let q=S?_a:Math.floor,N=q(D*x.width),F=q(D*x.height);u===void 0&&(u=f(N,F));let H=U?f(N,F):u;return H.width=N,H.height=F,H.getContext("2d").drawImage(x,0,0,N,F),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+x.width+"x"+x.height+") to ("+N+"x"+F+")."),H}return"data"in x&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+x.width+"x"+x.height+")."),x}return x}function m(x){return wl(x.width)&&wl(x.height)}function y(x,S){return x.generateMipmaps&&S&&x.minFilter!==At&&x.minFilter!==nn}function v(x){s.generateMipmap(x)}function g(x,S,U,X,D=!1){if(o===!1)return S;if(x!==null){if(s[x]!==void 0)return s[x];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+x+"'")}let q=S;if(S===s.RED&&(U===s.FLOAT&&(q=s.R32F),U===s.HALF_FLOAT&&(q=s.R16F),U===s.UNSIGNED_BYTE&&(q=s.R8)),S===s.RED_INTEGER&&(U===s.UNSIGNED_BYTE&&(q=s.R8UI),U===s.UNSIGNED_SHORT&&(q=s.R16UI),U===s.UNSIGNED_INT&&(q=s.R32UI),U===s.BYTE&&(q=s.R8I),U===s.SHORT&&(q=s.R16I),U===s.INT&&(q=s.R32I)),S===s.RG&&(U===s.FLOAT&&(q=s.RG32F),U===s.HALF_FLOAT&&(q=s.RG16F),U===s.UNSIGNED_BYTE&&(q=s.RG8)),S===s.RGBA){let N=D?pa:qe.getTransfer(X);U===s.FLOAT&&(q=s.RGBA32F),U===s.HALF_FLOAT&&(q=s.RGBA16F),U===s.UNSIGNED_BYTE&&(q=N===Ke?s.SRGB8_ALPHA8:s.RGBA8),U===s.UNSIGNED_SHORT_4_4_4_4&&(q=s.RGBA4),U===s.UNSIGNED_SHORT_5_5_5_1&&(q=s.RGB5_A1)}return q!==s.R16F&&q!==s.R32F&&q!==s.RG16F&&q!==s.RG32F&&q!==s.RGBA16F&&q!==s.RGBA32F||e.get("EXT_color_buffer_float"),q}function M(x,S,U){return y(x,U)===!0||x.isFramebufferTexture&&x.minFilter!==At&&x.minFilter!==nn?Math.log2(Math.max(S.width,S.height))+1:x.mipmaps!==void 0&&x.mipmaps.length>0?x.mipmaps.length:x.isCompressedTexture&&Array.isArray(x.image)?S.mipmaps.length:1}function T(x){return x===At||x===vh||x===Lo?s.NEAREST:s.LINEAR}function w(x){let S=x.target;S.removeEventListener("dispose",w),function(U){let X=n.get(U);if(X.__webglInit===void 0)return;let D=U.source,q=d.get(D);if(q){let N=q[X.__cacheKey];N.usedTimes--,N.usedTimes===0&&I(U),Object.keys(q).length===0&&d.delete(D)}n.remove(U)}(S),S.isVideoTexture&&h.delete(S)}function R(x){let S=x.target;S.removeEventListener("dispose",R),function(U){let X=U.texture,D=n.get(U),q=n.get(X);if(q.__webglTexture!==void 0&&(s.deleteTexture(q.__webglTexture),a.memory.textures--),U.depthTexture&&U.depthTexture.dispose(),U.isWebGLCubeRenderTarget)for(let N=0;N<6;N++){if(Array.isArray(D.__webglFramebuffer[N]))for(let F=0;F<D.__webglFramebuffer[N].length;F++)s.deleteFramebuffer(D.__webglFramebuffer[N][F]);else s.deleteFramebuffer(D.__webglFramebuffer[N]);D.__webglDepthbuffer&&s.deleteRenderbuffer(D.__webglDepthbuffer[N])}else{if(Array.isArray(D.__webglFramebuffer))for(let N=0;N<D.__webglFramebuffer.length;N++)s.deleteFramebuffer(D.__webglFramebuffer[N]);else s.deleteFramebuffer(D.__webglFramebuffer);if(D.__webglDepthbuffer&&s.deleteRenderbuffer(D.__webglDepthbuffer),D.__webglMultisampledFramebuffer&&s.deleteFramebuffer(D.__webglMultisampledFramebuffer),D.__webglColorRenderbuffer)for(let N=0;N<D.__webglColorRenderbuffer.length;N++)D.__webglColorRenderbuffer[N]&&s.deleteRenderbuffer(D.__webglColorRenderbuffer[N]);D.__webglDepthRenderbuffer&&s.deleteRenderbuffer(D.__webglDepthRenderbuffer)}if(U.isWebGLMultipleRenderTargets)for(let N=0,F=X.length;N<F;N++){let H=n.get(X[N]);H.__webglTexture&&(s.deleteTexture(H.__webglTexture),a.memory.textures--),n.remove(X[N])}n.remove(X),n.remove(U)}(S)}function I(x){let S=n.get(x);s.deleteTexture(S.__webglTexture);let U=x.source;delete d.get(U)[S.__cacheKey],a.memory.textures--}let P=0;function B(x,S){let U=n.get(x);if(x.isVideoTexture&&function(X){let D=a.render.frame;h.get(X)!==D&&(h.set(X,D),X.update())}(x),x.isRenderTargetTexture===!1&&x.version>0&&U.__version!==x.version){let X=x.image;if(X===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else{if(X.complete!==!1)return void oe(U,x,S);console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete")}}t.bindTexture(s.TEXTURE_2D,U.__webglTexture,s.TEXTURE0+S)}let V={[os]:s.REPEAT,[In]:s.CLAMP_TO_EDGE,[xl]:s.MIRRORED_REPEAT},L={[At]:s.NEAREST,[vh]:s.NEAREST_MIPMAP_NEAREST,[Lo]:s.NEAREST_MIPMAP_LINEAR,[nn]:s.LINEAR,[Np]:s.LINEAR_MIPMAP_NEAREST,[ha]:s.LINEAR_MIPMAP_LINEAR},O={512:s.NEVER,519:s.ALWAYS,513:s.LESS,515:s.LEQUAL,514:s.EQUAL,518:s.GEQUAL,516:s.GREATER,517:s.NOTEQUAL};function k(x,S,U){if(U?(s.texParameteri(x,s.TEXTURE_WRAP_S,V[S.wrapS]),s.texParameteri(x,s.TEXTURE_WRAP_T,V[S.wrapT]),x!==s.TEXTURE_3D&&x!==s.TEXTURE_2D_ARRAY||s.texParameteri(x,s.TEXTURE_WRAP_R,V[S.wrapR]),s.texParameteri(x,s.TEXTURE_MAG_FILTER,L[S.magFilter]),s.texParameteri(x,s.TEXTURE_MIN_FILTER,L[S.minFilter])):(s.texParameteri(x,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(x,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE),x!==s.TEXTURE_3D&&x!==s.TEXTURE_2D_ARRAY||s.texParameteri(x,s.TEXTURE_WRAP_R,s.CLAMP_TO_EDGE),S.wrapS===In&&S.wrapT===In||console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),s.texParameteri(x,s.TEXTURE_MAG_FILTER,T(S.magFilter)),s.texParameteri(x,s.TEXTURE_MIN_FILTER,T(S.minFilter)),S.minFilter!==At&&S.minFilter!==nn&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),S.compareFunction&&(s.texParameteri(x,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(x,s.TEXTURE_COMPARE_FUNC,O[S.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){let X=e.get("EXT_texture_filter_anisotropic");if(S.magFilter===At||S.minFilter!==Lo&&S.minFilter!==ha||S.type===Qn&&e.has("OES_texture_float_linear")===!1||o===!1&&S.type===ks&&e.has("OES_texture_half_float_linear")===!1)return;(S.anisotropy>1||n.get(S).__currentAnisotropy)&&(s.texParameterf(x,X.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,i.getMaxAnisotropy())),n.get(S).__currentAnisotropy=S.anisotropy)}}function Q(x,S){let U=!1;x.__webglInit===void 0&&(x.__webglInit=!0,S.addEventListener("dispose",w));let X=S.source,D=d.get(X);D===void 0&&(D={},d.set(X,D));let q=function(N){let F=[];return F.push(N.wrapS),F.push(N.wrapT),F.push(N.wrapR||0),F.push(N.magFilter),F.push(N.minFilter),F.push(N.anisotropy),F.push(N.internalFormat),F.push(N.format),F.push(N.type),F.push(N.generateMipmaps),F.push(N.premultiplyAlpha),F.push(N.flipY),F.push(N.unpackAlignment),F.push(N.colorSpace),F.join()}(S);if(q!==x.__cacheKey){D[q]===void 0&&(D[q]={texture:s.createTexture(),usedTimes:0},a.memory.textures++,U=!0),D[q].usedTimes++;let N=D[x.__cacheKey];N!==void 0&&(D[x.__cacheKey].usedTimes--,N.usedTimes===0&&I(S)),x.__cacheKey=q,x.__webglTexture=D[q].texture}return U}function oe(x,S,U){let X=s.TEXTURE_2D;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(X=s.TEXTURE_2D_ARRAY),S.isData3DTexture&&(X=s.TEXTURE_3D);let D=Q(x,S),q=S.source;t.bindTexture(X,x.__webglTexture,s.TEXTURE0+U);let N=n.get(q);if(q.version!==N.__version||D===!0){t.activeTexture(s.TEXTURE0+U);let F=qe.getPrimaries(qe.workingColorSpace),H=S.colorSpace===dn?null:qe.getPrimaries(S.colorSpace),te=S.colorSpace===dn||F===H?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,S.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,S.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,te);let ee=function(_e){return!o&&(_e.wrapS!==In||_e.wrapT!==In||_e.minFilter!==At&&_e.minFilter!==nn)}(S)&&m(S.image)===!1,E=_(S.image,ee,!1,i.maxTextureSize);E=ce(S,E);let se=m(E)||o,G=r.convert(S.format,S.colorSpace),W,re=r.convert(S.type),he=g(S.internalFormat,G,re,S.colorSpace,S.isVideoTexture);k(X,S,se);let de=S.mipmaps,pe=o&&S.isVideoTexture!==!0&&he!==hd,Se=N.__version===void 0||D===!0,me=M(S,E,se);if(S.isDepthTexture)he=s.DEPTH_COMPONENT,o?he=S.type===Qn?s.DEPTH_COMPONENT32F:S.type===Kn?s.DEPTH_COMPONENT24:S.type===gi?s.DEPTH24_STENCIL8:s.DEPTH_COMPONENT16:S.type===Qn&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),S.format===_i&&he===s.DEPTH_COMPONENT&&S.type!==wc&&S.type!==Kn&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),S.type=Kn,re=r.convert(S.type)),S.format===ls&&he===s.DEPTH_COMPONENT&&(he=s.DEPTH_STENCIL,S.type!==gi&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),S.type=gi,re=r.convert(S.type))),Se&&(pe?t.texStorage2D(s.TEXTURE_2D,1,he,E.width,E.height):t.texImage2D(s.TEXTURE_2D,0,he,E.width,E.height,0,G,re,null));else if(S.isDataTexture)if(de.length>0&&se){pe&&Se&&t.texStorage2D(s.TEXTURE_2D,me,he,de[0].width,de[0].height);for(let _e=0,Le=de.length;_e<Le;_e++)W=de[_e],pe?t.texSubImage2D(s.TEXTURE_2D,_e,0,0,W.width,W.height,G,re,W.data):t.texImage2D(s.TEXTURE_2D,_e,he,W.width,W.height,0,G,re,W.data);S.generateMipmaps=!1}else pe?(Se&&t.texStorage2D(s.TEXTURE_2D,me,he,E.width,E.height),t.texSubImage2D(s.TEXTURE_2D,0,0,0,E.width,E.height,G,re,E.data)):t.texImage2D(s.TEXTURE_2D,0,he,E.width,E.height,0,G,re,E.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){pe&&Se&&t.texStorage3D(s.TEXTURE_2D_ARRAY,me,he,de[0].width,de[0].height,E.depth);for(let _e=0,Le=de.length;_e<Le;_e++)W=de[_e],S.format!==un?G!==null?pe?t.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,_e,0,0,0,W.width,W.height,E.depth,G,W.data,0,0):t.compressedTexImage3D(s.TEXTURE_2D_ARRAY,_e,he,W.width,W.height,E.depth,0,W.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):pe?t.texSubImage3D(s.TEXTURE_2D_ARRAY,_e,0,0,0,W.width,W.height,E.depth,G,re,W.data):t.texImage3D(s.TEXTURE_2D_ARRAY,_e,he,W.width,W.height,E.depth,0,G,re,W.data)}else{pe&&Se&&t.texStorage2D(s.TEXTURE_2D,me,he,de[0].width,de[0].height);for(let _e=0,Le=de.length;_e<Le;_e++)W=de[_e],S.format!==un?G!==null?pe?t.compressedTexSubImage2D(s.TEXTURE_2D,_e,0,0,W.width,W.height,G,W.data):t.compressedTexImage2D(s.TEXTURE_2D,_e,he,W.width,W.height,0,W.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):pe?t.texSubImage2D(s.TEXTURE_2D,_e,0,0,W.width,W.height,G,re,W.data):t.texImage2D(s.TEXTURE_2D,_e,he,W.width,W.height,0,G,re,W.data)}else if(S.isDataArrayTexture)pe?(Se&&t.texStorage3D(s.TEXTURE_2D_ARRAY,me,he,E.width,E.height,E.depth),t.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,E.width,E.height,E.depth,G,re,E.data)):t.texImage3D(s.TEXTURE_2D_ARRAY,0,he,E.width,E.height,E.depth,0,G,re,E.data);else if(S.isData3DTexture)pe?(Se&&t.texStorage3D(s.TEXTURE_3D,me,he,E.width,E.height,E.depth),t.texSubImage3D(s.TEXTURE_3D,0,0,0,0,E.width,E.height,E.depth,G,re,E.data)):t.texImage3D(s.TEXTURE_3D,0,he,E.width,E.height,E.depth,0,G,re,E.data);else if(S.isFramebufferTexture){if(Se)if(pe)t.texStorage2D(s.TEXTURE_2D,me,he,E.width,E.height);else{let _e=E.width,Le=E.height;for(let lt=0;lt<me;lt++)t.texImage2D(s.TEXTURE_2D,lt,he,_e,Le,0,G,re,null),_e>>=1,Le>>=1}}else if(de.length>0&&se){pe&&Se&&t.texStorage2D(s.TEXTURE_2D,me,he,de[0].width,de[0].height);for(let _e=0,Le=de.length;_e<Le;_e++)W=de[_e],pe?t.texSubImage2D(s.TEXTURE_2D,_e,0,0,G,re,W):t.texImage2D(s.TEXTURE_2D,_e,he,G,re,W);S.generateMipmaps=!1}else pe?(Se&&t.texStorage2D(s.TEXTURE_2D,me,he,E.width,E.height),t.texSubImage2D(s.TEXTURE_2D,0,0,0,G,re,E)):t.texImage2D(s.TEXTURE_2D,0,he,G,re,E);y(S,se)&&v(X),N.__version=q.version,S.onUpdate&&S.onUpdate(S)}x.__version=S.version}function J(x,S,U,X,D,q){let N=r.convert(U.format,U.colorSpace),F=r.convert(U.type),H=g(U.internalFormat,N,F,U.colorSpace);if(!n.get(S).__hasExternalTextures){let te=Math.max(1,S.width>>q),ee=Math.max(1,S.height>>q);D===s.TEXTURE_3D||D===s.TEXTURE_2D_ARRAY?t.texImage3D(D,q,H,te,ee,S.depth,0,N,F,null):t.texImage2D(D,q,H,te,ee,0,N,F,null)}t.bindFramebuffer(s.FRAMEBUFFER,x),Z(S)?l.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,X,D,n.get(U).__webglTexture,0,z(S)):(D===s.TEXTURE_2D||D>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&D<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,X,D,n.get(U).__webglTexture,q),t.bindFramebuffer(s.FRAMEBUFFER,null)}function j(x,S,U){if(s.bindRenderbuffer(s.RENDERBUFFER,x),S.depthBuffer&&!S.stencilBuffer){let X=o===!0?s.DEPTH_COMPONENT24:s.DEPTH_COMPONENT16;if(U||Z(S)){let D=S.depthTexture;D&&D.isDepthTexture&&(D.type===Qn?X=s.DEPTH_COMPONENT32F:D.type===Kn&&(X=s.DEPTH_COMPONENT24));let q=z(S);Z(S)?l.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,q,X,S.width,S.height):s.renderbufferStorageMultisample(s.RENDERBUFFER,q,X,S.width,S.height)}else s.renderbufferStorage(s.RENDERBUFFER,X,S.width,S.height);s.framebufferRenderbuffer(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.RENDERBUFFER,x)}else if(S.depthBuffer&&S.stencilBuffer){let X=z(S);U&&Z(S)===!1?s.renderbufferStorageMultisample(s.RENDERBUFFER,X,s.DEPTH24_STENCIL8,S.width,S.height):Z(S)?l.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,X,s.DEPTH24_STENCIL8,S.width,S.height):s.renderbufferStorage(s.RENDERBUFFER,s.DEPTH_STENCIL,S.width,S.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.RENDERBUFFER,x)}else{let X=S.isWebGLMultipleRenderTargets===!0?S.texture:[S.texture];for(let D=0;D<X.length;D++){let q=X[D],N=r.convert(q.format,q.colorSpace),F=r.convert(q.type),H=g(q.internalFormat,N,F,q.colorSpace),te=z(S);U&&Z(S)===!1?s.renderbufferStorageMultisample(s.RENDERBUFFER,te,H,S.width,S.height):Z(S)?l.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,te,H,S.width,S.height):s.renderbufferStorage(s.RENDERBUFFER,H,S.width,S.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function Y(x){let S=n.get(x),U=x.isWebGLCubeRenderTarget===!0;if(x.depthTexture&&!S.__autoAllocateDepthBuffer){if(U)throw new Error("target.depthTexture not supported in Cube render targets");(function(X,D){if(D&&D.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(s.FRAMEBUFFER,X),!D.depthTexture||!D.depthTexture.isDepthTexture)throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");n.get(D.depthTexture).__webglTexture&&D.depthTexture.image.width===D.width&&D.depthTexture.image.height===D.height||(D.depthTexture.image.width=D.width,D.depthTexture.image.height=D.height,D.depthTexture.needsUpdate=!0),B(D.depthTexture,0);let q=n.get(D.depthTexture).__webglTexture,N=z(D);if(D.depthTexture.format===_i)Z(D)?l.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,q,0,N):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_ATTACHMENT,s.TEXTURE_2D,q,0);else{if(D.depthTexture.format!==ls)throw new Error("Unknown depthTexture format");Z(D)?l.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,q,0,N):s.framebufferTexture2D(s.FRAMEBUFFER,s.DEPTH_STENCIL_ATTACHMENT,s.TEXTURE_2D,q,0)}})(S.__webglFramebuffer,x)}else if(U){S.__webglDepthbuffer=[];for(let X=0;X<6;X++)t.bindFramebuffer(s.FRAMEBUFFER,S.__webglFramebuffer[X]),S.__webglDepthbuffer[X]=s.createRenderbuffer(),j(S.__webglDepthbuffer[X],x,!1)}else t.bindFramebuffer(s.FRAMEBUFFER,S.__webglFramebuffer),S.__webglDepthbuffer=s.createRenderbuffer(),j(S.__webglDepthbuffer,x,!1);t.bindFramebuffer(s.FRAMEBUFFER,null)}function z(x){return Math.min(i.maxSamples,x.samples)}function Z(x){let S=n.get(x);return o&&x.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function ce(x,S){let U=x.colorSpace,X=x.format,D=x.type;return x.isCompressedTexture===!0||x.isVideoTexture===!0||x.format===Ml||U!==Dn&&U!==dn&&(qe.getTransfer(U)===Ke?o===!1?e.has("EXT_sRGB")===!0&&X===un?(x.format=Ml,x.minFilter=nn,x.generateMipmaps=!1):S=va.sRGBToLinear(S):X===un&&D===fi||console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",U)),S}this.allocateTextureUnit=function(){let x=P;return x>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+x+" texture units while this GPU supports only "+i.maxTextures),P+=1,x},this.resetTextureUnits=function(){P=0},this.setTexture2D=B,this.setTexture2DArray=function(x,S){let U=n.get(x);x.version>0&&U.__version!==x.version?oe(U,x,S):t.bindTexture(s.TEXTURE_2D_ARRAY,U.__webglTexture,s.TEXTURE0+S)},this.setTexture3D=function(x,S){let U=n.get(x);x.version>0&&U.__version!==x.version?oe(U,x,S):t.bindTexture(s.TEXTURE_3D,U.__webglTexture,s.TEXTURE0+S)},this.setTextureCube=function(x,S){let U=n.get(x);x.version>0&&U.__version!==x.version?function(X,D,q){if(D.image.length!==6)return;let N=Q(X,D),F=D.source;t.bindTexture(s.TEXTURE_CUBE_MAP,X.__webglTexture,s.TEXTURE0+q);let H=n.get(F);if(F.version!==H.__version||N===!0){t.activeTexture(s.TEXTURE0+q);let te=qe.getPrimaries(qe.workingColorSpace),ee=D.colorSpace===dn?null:qe.getPrimaries(D.colorSpace),E=D.colorSpace===dn||te===ee?s.NONE:s.BROWSER_DEFAULT_WEBGL;s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,D.flipY),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),s.pixelStorei(s.UNPACK_ALIGNMENT,D.unpackAlignment),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,E);let se=D.isCompressedTexture||D.image[0].isCompressedTexture,G=D.image[0]&&D.image[0].isDataTexture,W=[];for(let ve=0;ve<6;ve++)W[ve]=se||G?G?D.image[ve].image:D.image[ve]:_(D.image[ve],!1,!0,i.maxCubemapSize),W[ve]=ce(D,W[ve]);let re=W[0],he=m(re)||o,de=r.convert(D.format,D.colorSpace),pe=r.convert(D.type),Se=g(D.internalFormat,de,pe,D.colorSpace),me=o&&D.isVideoTexture!==!0,_e=H.__version===void 0||N===!0,Le,lt=M(D,re,he);if(k(s.TEXTURE_CUBE_MAP,D,he),se){me&&_e&&t.texStorage2D(s.TEXTURE_CUBE_MAP,lt,Se,re.width,re.height);for(let ve=0;ve<6;ve++){Le=W[ve].mipmaps;for(let Ne=0;Ne<Le.length;Ne++){let Ue=Le[Ne];D.format!==un?de!==null?me?t.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Ne,0,0,Ue.width,Ue.height,de,Ue.data):t.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Ne,Se,Ue.width,Ue.height,0,Ue.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):me?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Ne,0,0,Ue.width,Ue.height,de,pe,Ue.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Ne,Se,Ue.width,Ue.height,0,de,pe,Ue.data)}}}else{Le=D.mipmaps,me&&_e&&(Le.length>0&&lt++,t.texStorage2D(s.TEXTURE_CUBE_MAP,lt,Se,W[0].width,W[0].height));for(let ve=0;ve<6;ve++)if(G){me?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0,0,0,W[ve].width,W[ve].height,de,pe,W[ve].data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0,Se,W[ve].width,W[ve].height,0,de,pe,W[ve].data);for(let Ne=0;Ne<Le.length;Ne++){let Ue=Le[Ne].image[ve].image;me?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Ne+1,0,0,Ue.width,Ue.height,de,pe,Ue.data):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Ne+1,Se,Ue.width,Ue.height,0,de,pe,Ue.data)}}else{me?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0,0,0,de,pe,W[ve]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0,Se,de,pe,W[ve]);for(let Ne=0;Ne<Le.length;Ne++){let Ue=Le[Ne];me?t.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Ne+1,0,0,de,pe,Ue.image[ve]):t.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Ne+1,Se,de,pe,Ue.image[ve])}}}y(D,he)&&v(s.TEXTURE_CUBE_MAP),H.__version=F.version,D.onUpdate&&D.onUpdate(D)}X.__version=D.version}(U,x,S):t.bindTexture(s.TEXTURE_CUBE_MAP,U.__webglTexture,s.TEXTURE0+S)},this.rebindTextures=function(x,S,U){let X=n.get(x);S!==void 0&&J(X.__webglFramebuffer,x,x.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),U!==void 0&&Y(x)},this.setupRenderTarget=function(x){let S=x.texture,U=n.get(x),X=n.get(S);x.addEventListener("dispose",R),x.isWebGLMultipleRenderTargets!==!0&&(X.__webglTexture===void 0&&(X.__webglTexture=s.createTexture()),X.__version=S.version,a.memory.textures++);let D=x.isWebGLCubeRenderTarget===!0,q=x.isWebGLMultipleRenderTargets===!0,N=m(x)||o;if(D){U.__webglFramebuffer=[];for(let F=0;F<6;F++)if(o&&S.mipmaps&&S.mipmaps.length>0){U.__webglFramebuffer[F]=[];for(let H=0;H<S.mipmaps.length;H++)U.__webglFramebuffer[F][H]=s.createFramebuffer()}else U.__webglFramebuffer[F]=s.createFramebuffer()}else{if(o&&S.mipmaps&&S.mipmaps.length>0){U.__webglFramebuffer=[];for(let F=0;F<S.mipmaps.length;F++)U.__webglFramebuffer[F]=s.createFramebuffer()}else U.__webglFramebuffer=s.createFramebuffer();if(q)if(i.drawBuffers){let F=x.texture;for(let H=0,te=F.length;H<te;H++){let ee=n.get(F[H]);ee.__webglTexture===void 0&&(ee.__webglTexture=s.createTexture(),a.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(o&&x.samples>0&&Z(x)===!1){let F=q?S:[S];U.__webglMultisampledFramebuffer=s.createFramebuffer(),U.__webglColorRenderbuffer=[],t.bindFramebuffer(s.FRAMEBUFFER,U.__webglMultisampledFramebuffer);for(let H=0;H<F.length;H++){let te=F[H];U.__webglColorRenderbuffer[H]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,U.__webglColorRenderbuffer[H]);let ee=r.convert(te.format,te.colorSpace),E=r.convert(te.type),se=g(te.internalFormat,ee,E,te.colorSpace,x.isXRRenderTarget===!0),G=z(x);s.renderbufferStorageMultisample(s.RENDERBUFFER,G,se,x.width,x.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+H,s.RENDERBUFFER,U.__webglColorRenderbuffer[H])}s.bindRenderbuffer(s.RENDERBUFFER,null),x.depthBuffer&&(U.__webglDepthRenderbuffer=s.createRenderbuffer(),j(U.__webglDepthRenderbuffer,x,!0)),t.bindFramebuffer(s.FRAMEBUFFER,null)}}if(D){t.bindTexture(s.TEXTURE_CUBE_MAP,X.__webglTexture),k(s.TEXTURE_CUBE_MAP,S,N);for(let F=0;F<6;F++)if(o&&S.mipmaps&&S.mipmaps.length>0)for(let H=0;H<S.mipmaps.length;H++)J(U.__webglFramebuffer[F][H],x,S,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+F,H);else J(U.__webglFramebuffer[F],x,S,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+F,0);y(S,N)&&v(s.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(q){let F=x.texture;for(let H=0,te=F.length;H<te;H++){let ee=F[H],E=n.get(ee);t.bindTexture(s.TEXTURE_2D,E.__webglTexture),k(s.TEXTURE_2D,ee,N),J(U.__webglFramebuffer,x,ee,s.COLOR_ATTACHMENT0+H,s.TEXTURE_2D,0),y(ee,N)&&v(s.TEXTURE_2D)}t.unbindTexture()}else{let F=s.TEXTURE_2D;if((x.isWebGL3DRenderTarget||x.isWebGLArrayRenderTarget)&&(o?F=x.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(F,X.__webglTexture),k(F,S,N),o&&S.mipmaps&&S.mipmaps.length>0)for(let H=0;H<S.mipmaps.length;H++)J(U.__webglFramebuffer[H],x,S,s.COLOR_ATTACHMENT0,F,H);else J(U.__webglFramebuffer,x,S,s.COLOR_ATTACHMENT0,F,0);y(S,N)&&v(F),t.unbindTexture()}x.depthBuffer&&Y(x)},this.updateRenderTargetMipmap=function(x){let S=m(x)||o,U=x.isWebGLMultipleRenderTargets===!0?x.texture:[x.texture];for(let X=0,D=U.length;X<D;X++){let q=U[X];if(y(q,S)){let N=x.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:s.TEXTURE_2D,F=n.get(q).__webglTexture;t.bindTexture(N,F),v(N),t.unbindTexture()}}},this.updateMultisampleRenderTarget=function(x){if(o&&x.samples>0&&Z(x)===!1){let S=x.isWebGLMultipleRenderTargets?x.texture:[x.texture],U=x.width,X=x.height,D=s.COLOR_BUFFER_BIT,q=[],N=x.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,F=n.get(x),H=x.isWebGLMultipleRenderTargets===!0;if(H)for(let te=0;te<S.length;te++)t.bindFramebuffer(s.FRAMEBUFFER,F.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+te,s.RENDERBUFFER,null),t.bindFramebuffer(s.FRAMEBUFFER,F.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+te,s.TEXTURE_2D,null,0);t.bindFramebuffer(s.READ_FRAMEBUFFER,F.__webglMultisampledFramebuffer),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,F.__webglFramebuffer);for(let te=0;te<S.length;te++){q.push(s.COLOR_ATTACHMENT0+te),x.depthBuffer&&q.push(N);let ee=F.__ignoreDepthValues!==void 0&&F.__ignoreDepthValues;if(ee===!1&&(x.depthBuffer&&(D|=s.DEPTH_BUFFER_BIT),x.stencilBuffer&&(D|=s.STENCIL_BUFFER_BIT)),H&&s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,F.__webglColorRenderbuffer[te]),ee===!0&&(s.invalidateFramebuffer(s.READ_FRAMEBUFFER,[N]),s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[N])),H){let E=n.get(S[te]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,E,0)}s.blitFramebuffer(0,0,U,X,0,0,U,X,D,s.NEAREST),c&&s.invalidateFramebuffer(s.READ_FRAMEBUFFER,q)}if(t.bindFramebuffer(s.READ_FRAMEBUFFER,null),t.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),H)for(let te=0;te<S.length;te++){t.bindFramebuffer(s.FRAMEBUFFER,F.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+te,s.RENDERBUFFER,F.__webglColorRenderbuffer[te]);let ee=n.get(S[te]).__webglTexture;t.bindFramebuffer(s.FRAMEBUFFER,F.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+te,s.TEXTURE_2D,ee,0)}t.bindFramebuffer(s.DRAW_FRAMEBUFFER,F.__webglMultisampledFramebuffer)}},this.setupDepthRenderbuffer=Y,this.setupFrameBufferTexture=J,this.useMultisampledRTT=Z}function wf(s,e,t){let n=t.isWebGL2;return{convert:function(i,r=""){let a,o=qe.getTransfer(r);if(i===fi)return s.UNSIGNED_BYTE;if(i===rd)return s.UNSIGNED_SHORT_4_4_4_4;if(i===ad)return s.UNSIGNED_SHORT_5_5_5_1;if(i===1010)return s.BYTE;if(i===1011)return s.SHORT;if(i===wc)return s.UNSIGNED_SHORT;if(i===sd)return s.INT;if(i===Kn)return s.UNSIGNED_INT;if(i===Qn)return s.FLOAT;if(i===ks)return n?s.HALF_FLOAT:(a=e.get("OES_texture_half_float"),a!==null?a.HALF_FLOAT_OES:null);if(i===1021)return s.ALPHA;if(i===un)return s.RGBA;if(i===1024)return s.LUMINANCE;if(i===1025)return s.LUMINANCE_ALPHA;if(i===_i)return s.DEPTH_COMPONENT;if(i===ls)return s.DEPTH_STENCIL;if(i===Ml)return a=e.get("EXT_sRGB"),a!==null?a.SRGB_ALPHA_EXT:null;if(i===1028)return s.RED;if(i===od)return s.RED_INTEGER;if(i===1030)return s.RG;if(i===ld)return s.RG_INTEGER;if(i===cd)return s.RGBA_INTEGER;if(i===Po||i===Io||i===Do||i===No)if(o===Ke){if(a=e.get("WEBGL_compressed_texture_s3tc_srgb"),a===null)return null;if(i===Po)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Io)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Do)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===No)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else{if(a=e.get("WEBGL_compressed_texture_s3tc"),a===null)return null;if(i===Po)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Io)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Do)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===No)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}if(i===yh||i===xh||i===bh||i===Mh){if(a=e.get("WEBGL_compressed_texture_pvrtc"),a===null)return null;if(i===yh)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===xh)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===bh)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Mh)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}if(i===hd)return a=e.get("WEBGL_compressed_texture_etc1"),a!==null?a.COMPRESSED_RGB_ETC1_WEBGL:null;if(i===Sh||i===wh){if(a=e.get("WEBGL_compressed_texture_etc"),a===null)return null;if(i===Sh)return o===Ke?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(i===wh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC}if(i===Eh||i===Th||i===Ah||i===Rh||i===Ch||i===Lh||i===Ph||i===Ih||i===Dh||i===Nh||i===Uh||i===Oh||i===Fh||i===Bh){if(a=e.get("WEBGL_compressed_texture_astc"),a===null)return null;if(i===Eh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Th)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Ah)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Rh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Ch)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Lh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Ph)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Ih)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Dh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Nh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Uh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Oh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Fh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Bh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}if(i===Uo||i===kh||i===zh){if(a=e.get("EXT_texture_compression_bptc"),a===null)return null;if(i===Uo)return o===Ke?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===kh)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===zh)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}if(i===36283||i===Hh||i===Gh||i===Wh){if(a=e.get("EXT_texture_compression_rgtc"),a===null)return null;if(i===Uo)return a.COMPRESSED_RED_RGTC1_EXT;if(i===Hh)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Gh)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Wh)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}return i===gi?n?s.UNSIGNED_INT_24_8:(a=e.get("WEBGL_depth_texture"),a!==null?a.UNSIGNED_INT_24_8_WEBGL:null):s[i]!==void 0?s[i]:null}}}function Tf(s,e){function t(i,r){i.matrixAutoUpdate===!0&&i.updateMatrix(),r.value.copy(i.matrix)}function n(i,r){i.opacity.value=r.opacity,r.color&&i.diffuse.value.copy(r.color),r.emissive&&i.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(i.map.value=r.map,t(r.map,i.mapTransform)),r.alphaMap&&(i.alphaMap.value=r.alphaMap,t(r.alphaMap,i.alphaMapTransform)),r.bumpMap&&(i.bumpMap.value=r.bumpMap,t(r.bumpMap,i.bumpMapTransform),i.bumpScale.value=r.bumpScale,r.side===It&&(i.bumpScale.value*=-1)),r.normalMap&&(i.normalMap.value=r.normalMap,t(r.normalMap,i.normalMapTransform),i.normalScale.value.copy(r.normalScale),r.side===It&&i.normalScale.value.negate()),r.displacementMap&&(i.displacementMap.value=r.displacementMap,t(r.displacementMap,i.displacementMapTransform),i.displacementScale.value=r.displacementScale,i.displacementBias.value=r.displacementBias),r.emissiveMap&&(i.emissiveMap.value=r.emissiveMap,t(r.emissiveMap,i.emissiveMapTransform)),r.specularMap&&(i.specularMap.value=r.specularMap,t(r.specularMap,i.specularMapTransform)),r.alphaTest>0&&(i.alphaTest.value=r.alphaTest);let a=e.get(r).envMap;if(a&&(i.envMap.value=a,i.flipEnvMap.value=a.isCubeTexture&&a.isRenderTargetTexture===!1?-1:1,i.reflectivity.value=r.reflectivity,i.ior.value=r.ior,i.refractionRatio.value=r.refractionRatio),r.lightMap){i.lightMap.value=r.lightMap;let o=s._useLegacyLights===!0?Math.PI:1;i.lightMapIntensity.value=r.lightMapIntensity*o,t(r.lightMap,i.lightMapTransform)}r.aoMap&&(i.aoMap.value=r.aoMap,i.aoMapIntensity.value=r.aoMapIntensity,t(r.aoMap,i.aoMapTransform))}return{refreshFogUniforms:function(i,r){r.color.getRGB(i.fogColor.value,fd(s)),r.isFog?(i.fogNear.value=r.near,i.fogFar.value=r.far):r.isFogExp2&&(i.fogDensity.value=r.density)},refreshMaterialUniforms:function(i,r,a,o,l){r.isMeshBasicMaterial||r.isMeshLambertMaterial?n(i,r):r.isMeshToonMaterial?(n(i,r),function(c,h){h.gradientMap&&(c.gradientMap.value=h.gradientMap)}(i,r)):r.isMeshPhongMaterial?(n(i,r),function(c,h){c.specular.value.copy(h.specular),c.shininess.value=Math.max(h.shininess,1e-4)}(i,r)):r.isMeshStandardMaterial?(n(i,r),function(c,h){c.metalness.value=h.metalness,h.metalnessMap&&(c.metalnessMap.value=h.metalnessMap,t(h.metalnessMap,c.metalnessMapTransform)),c.roughness.value=h.roughness,h.roughnessMap&&(c.roughnessMap.value=h.roughnessMap,t(h.roughnessMap,c.roughnessMapTransform)),e.get(h).envMap&&(c.envMapIntensity.value=h.envMapIntensity)}(i,r),r.isMeshPhysicalMaterial&&function(c,h,u){c.ior.value=h.ior,h.sheen>0&&(c.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),c.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(c.sheenColorMap.value=h.sheenColorMap,t(h.sheenColorMap,c.sheenColorMapTransform)),h.sheenRoughnessMap&&(c.sheenRoughnessMap.value=h.sheenRoughnessMap,t(h.sheenRoughnessMap,c.sheenRoughnessMapTransform))),h.clearcoat>0&&(c.clearcoat.value=h.clearcoat,c.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(c.clearcoatMap.value=h.clearcoatMap,t(h.clearcoatMap,c.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(c.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,t(h.clearcoatRoughnessMap,c.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(c.clearcoatNormalMap.value=h.clearcoatNormalMap,t(h.clearcoatNormalMap,c.clearcoatNormalMapTransform),c.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===It&&c.clearcoatNormalScale.value.negate())),h.iridescence>0&&(c.iridescence.value=h.iridescence,c.iridescenceIOR.value=h.iridescenceIOR,c.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],c.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(c.iridescenceMap.value=h.iridescenceMap,t(h.iridescenceMap,c.iridescenceMapTransform)),h.iridescenceThicknessMap&&(c.iridescenceThicknessMap.value=h.iridescenceThicknessMap,t(h.iridescenceThicknessMap,c.iridescenceThicknessMapTransform))),h.transmission>0&&(c.transmission.value=h.transmission,c.transmissionSamplerMap.value=u.texture,c.transmissionSamplerSize.value.set(u.width,u.height),h.transmissionMap&&(c.transmissionMap.value=h.transmissionMap,t(h.transmissionMap,c.transmissionMapTransform)),c.thickness.value=h.thickness,h.thicknessMap&&(c.thicknessMap.value=h.thicknessMap,t(h.thicknessMap,c.thicknessMapTransform)),c.attenuationDistance.value=h.attenuationDistance,c.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(c.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(c.anisotropyMap.value=h.anisotropyMap,t(h.anisotropyMap,c.anisotropyMapTransform))),c.specularIntensity.value=h.specularIntensity,c.specularColor.value.copy(h.specularColor),h.specularColorMap&&(c.specularColorMap.value=h.specularColorMap,t(h.specularColorMap,c.specularColorMapTransform)),h.specularIntensityMap&&(c.specularIntensityMap.value=h.specularIntensityMap,t(h.specularIntensityMap,c.specularIntensityMapTransform))}(i,r,l)):r.isMeshMatcapMaterial?(n(i,r),function(c,h){h.matcap&&(c.matcap.value=h.matcap)}(i,r)):r.isMeshDepthMaterial?n(i,r):r.isMeshDistanceMaterial?(n(i,r),function(c,h){let u=e.get(h).light;c.referencePosition.value.setFromMatrixPosition(u.matrixWorld),c.nearDistance.value=u.shadow.camera.near,c.farDistance.value=u.shadow.camera.far}(i,r)):r.isMeshNormalMaterial?n(i,r):r.isLineBasicMaterial?(function(c,h){c.diffuse.value.copy(h.color),c.opacity.value=h.opacity,h.map&&(c.map.value=h.map,t(h.map,c.mapTransform))}(i,r),r.isLineDashedMaterial&&function(c,h){c.dashSize.value=h.dashSize,c.totalSize.value=h.dashSize+h.gapSize,c.scale.value=h.scale}(i,r)):r.isPointsMaterial?function(c,h,u,d){c.diffuse.value.copy(h.color),c.opacity.value=h.opacity,c.size.value=h.size*u,c.scale.value=.5*d,h.map&&(c.map.value=h.map,t(h.map,c.uvTransform)),h.alphaMap&&(c.alphaMap.value=h.alphaMap,t(h.alphaMap,c.alphaMapTransform)),h.alphaTest>0&&(c.alphaTest.value=h.alphaTest)}(i,r,a,o):r.isSpriteMaterial?function(c,h){c.diffuse.value.copy(h.color),c.opacity.value=h.opacity,c.rotation.value=h.rotation,h.map&&(c.map.value=h.map,t(h.map,c.mapTransform)),h.alphaMap&&(c.alphaMap.value=h.alphaMap,t(h.alphaMap,c.alphaMapTransform)),h.alphaTest>0&&(c.alphaTest.value=h.alphaTest)}(i,r):r.isShadowMaterial?(i.color.value.copy(r.color),i.opacity.value=r.opacity):r.isShaderMaterial&&(r.uniformsNeedUpdate=!1)}}}function Af(s,e,t,n){let i={},r={},a=[],o=t.isWebGL2?s.getParameter(s.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(u,d,p,f){let _=u.value,m=d+"_"+p;if(f[m]===void 0)return f[m]=typeof _=="number"||typeof _=="boolean"?_:_.clone(),!0;{let y=f[m];if(typeof _=="number"||typeof _=="boolean"){if(y!==_)return f[m]=_,!0}else if(y.equals(_)===!1)return y.copy(_),!0}return!1}function c(u){let d={boundary:0,storage:0};return typeof u=="number"||typeof u=="boolean"?(d.boundary=4,d.storage=4):u.isVector2?(d.boundary=8,d.storage=8):u.isVector3||u.isColor?(d.boundary=16,d.storage=12):u.isVector4?(d.boundary=16,d.storage=16):u.isMatrix3?(d.boundary=48,d.storage=48):u.isMatrix4?(d.boundary=64,d.storage=64):u.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",u),d}function h(u){let d=u.target;d.removeEventListener("dispose",h);let p=a.indexOf(d.__bindingPointIndex);a.splice(p,1),s.deleteBuffer(i[d.id]),delete i[d.id],delete r[d.id]}return{bind:function(u,d){let p=d.program;n.uniformBlockBinding(u,p)},update:function(u,d){let p=i[u.id];p===void 0&&(function(m){let y=m.uniforms,v=0,g=16;for(let T=0,w=y.length;T<w;T++){let R=Array.isArray(y[T])?y[T]:[y[T]];for(let I=0,P=R.length;I<P;I++){let B=R[I],V=Array.isArray(B.value)?B.value:[B.value];for(let L=0,O=V.length;L<O;L++){let k=c(V[L]),Q=v%g;Q!==0&&g-Q<k.boundary&&(v+=g-Q),B.__data=new Float32Array(k.storage/Float32Array.BYTES_PER_ELEMENT),B.__offset=v,v+=k.storage}}}let M=v%g;M>0&&(v+=g-M),m.__size=v,m.__cache={}}(u),p=function(m){let y=function(){for(let T=0;T<o;T++)if(a.indexOf(T)===-1)return a.push(T),T;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}();m.__bindingPointIndex=y;let v=s.createBuffer(),g=m.__size,M=m.usage;return s.bindBuffer(s.UNIFORM_BUFFER,v),s.bufferData(s.UNIFORM_BUFFER,g,M),s.bindBuffer(s.UNIFORM_BUFFER,null),s.bindBufferBase(s.UNIFORM_BUFFER,y,v),v}(u),i[u.id]=p,u.addEventListener("dispose",h));let f=d.program;n.updateUBOMapping(u,f);let _=e.render.frame;r[u.id]!==_&&(function(m){let y=i[m.id],v=m.uniforms,g=m.__cache;s.bindBuffer(s.UNIFORM_BUFFER,y);for(let M=0,T=v.length;M<T;M++){let w=Array.isArray(v[M])?v[M]:[v[M]];for(let R=0,I=w.length;R<I;R++){let P=w[R];if(l(P,M,R,g)===!0){let B=P.__offset,V=Array.isArray(P.value)?P.value:[P.value],L=0;for(let O=0;O<V.length;O++){let k=V[O],Q=c(k);typeof k=="number"||typeof k=="boolean"?(P.__data[0]=k,s.bufferSubData(s.UNIFORM_BUFFER,B+L,P.__data)):k.isMatrix3?(P.__data[0]=k.elements[0],P.__data[1]=k.elements[1],P.__data[2]=k.elements[2],P.__data[3]=0,P.__data[4]=k.elements[3],P.__data[5]=k.elements[4],P.__data[6]=k.elements[5],P.__data[7]=0,P.__data[8]=k.elements[6],P.__data[9]=k.elements[7],P.__data[10]=k.elements[8],P.__data[11]=0):(k.toArray(P.__data,L),L+=Q.storage/Float32Array.BYTES_PER_ELEMENT)}s.bufferSubData(s.UNIFORM_BUFFER,B,P.__data)}}}s.bindBuffer(s.UNIFORM_BUFFER,null)}(u),r[u.id]=_)},dispose:function(){for(let u in i)s.deleteBuffer(i[u]);a=[],i={},r={}}}}function Kr(s,e,t,n,i,r){es.subVectors(s,t).addScalar(.5).multiply(n),i!==void 0?(Ls.x=r*es.x-i*es.y,Ls.y=i*es.x+r*es.y):Ls.copy(es),s.copy(e),s.x+=Ls.x,s.y+=Ls.y,s.applyMatrix4(Md)}function zu(s,e,t,n,i,r,a){let o=Gl.distanceSqToPoint(s);if(o<t){let l=new A;Gl.closestPointToPoint(s,l),l.applyMatrix4(n);let c=i.ray.origin.distanceTo(l);if(c<i.near||c>i.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,object:a})}}function Ac(){let s=0,e=0,t=0,n=0;function i(r,a,o,l){s=r,e=o,t=-3*r+3*a-2*o-l,n=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,c){i(a,o,c*(o-r),c*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,c,h,u){let d=(a-r)/c-(o-r)/(c+h)+(o-a)/h,p=(o-a)/h-(l-a)/(h+u)+(l-o)/u;d*=h,p*=h,i(a,o,d,p)},calc:function(r){let a=r*r;return s+e*r+t*a+n*(a*r)}}}function Hu(s,e,t,n,i){let r=.5*(n-e),a=.5*(i-t),o=s*s;return(2*t-2*n+r+a)*(s*o)+(-3*t+3*n-2*r-a)*o+r*s+t}function Os(s,e,t,n){return function(i,r){let a=1-i;return a*a*r}(s,e)+function(i,r){return 2*(1-i)*i*r}(s,t)+function(i,r){return i*i*r}(s,n)}function Fs(s,e,t,n,i){return function(r,a){let o=1-r;return o*o*o*a}(s,e)+function(r,a){let o=1-r;return 3*o*o*r*a}(s,t)+function(r,a){return 3*(1-r)*r*r*a}(s,n)+function(r,a){return r*r*r*a}(s,i)}function Gu(s,e,t,n,i){let r,a;if(i===function(o,l,c,h){let u=0;for(let d=l,p=c-h;d<c;d+=h)u+=(o[p]-o[d])*(o[d+1]+o[p+1]),p=d;return u}(s,e,t,n)>0)for(r=e;r<t;r+=n)a=Wu(r,s[r],s[r+1],a);else for(r=t-n;r>=e;r-=n)a=Wu(r,s[r],s[r+1],a);return a&&Qa(a,a.next)&&(Js(a),a=a.next),a}function Mi(s,e){if(!s)return s;e||(e=s);let t,n=s;do if(t=!1,n.steiner||!Qa(n,n.next)&&nt(n.prev,n,n.next)!==0)n=n.next;else{if(Js(n),n=e=n.prev,n===n.next)break;t=!0}while(t||n!==e);return e}function Ys(s,e,t,n,i,r,a){if(!s)return;!a&&r&&function(h,u,d,p){let f=h;do f.z===0&&(f.z=Kl(f.x,f.y,u,d,p)),f.prevZ=f.prev,f.nextZ=f.next,f=f.next;while(f!==h);f.prevZ.nextZ=null,f.prevZ=null,function(_){let m,y,v,g,M,T,w,R,I=1;do{for(y=_,_=null,M=null,T=0;y;){for(T++,v=y,w=0,m=0;m<I&&(w++,v=v.nextZ,v);m++);for(R=I;w>0||R>0&&v;)w!==0&&(R===0||!v||y.z<=v.z)?(g=y,y=y.nextZ,w--):(g=v,v=v.nextZ,R--),M?M.nextZ=g:_=g,g.prevZ=M,M=g;y=v}M.nextZ=null,I*=2}while(T>1)}(f)}(s,n,i,r);let o,l,c=s;for(;s.prev!==s.next;)if(o=s.prev,l=s.next,r?Lf(s,n,i,r):Cf(s))e.push(o.i/t|0),e.push(s.i/t|0),e.push(l.i/t|0),Js(s),s=l.next,c=l.next;else if((s=l)===c){a?a===1?Ys(s=Pf(Mi(s),e,t),e,t,n,i,r,2):a===2&&If(s,e,t,n,i,r):Ys(Mi(s),e,t,n,i,r,1);break}}function Cf(s){let e=s.prev,t=s,n=s.next;if(nt(e,t,n)>=0)return!1;let i=e.x,r=t.x,a=n.x,o=e.y,l=t.y,c=n.y,h=i<r?i<a?i:a:r<a?r:a,u=o<l?o<c?o:c:l<c?l:c,d=i>r?i>a?i:a:r>a?r:a,p=o>l?o>c?o:c:l>c?l:c,f=n.next;for(;f!==e;){if(f.x>=h&&f.x<=d&&f.y>=u&&f.y<=p&&ts(i,o,r,l,a,c,f.x,f.y)&&nt(f.prev,f,f.next)>=0)return!1;f=f.next}return!0}function Lf(s,e,t,n){let i=s.prev,r=s,a=s.next;if(nt(i,r,a)>=0)return!1;let o=i.x,l=r.x,c=a.x,h=i.y,u=r.y,d=a.y,p=o<l?o<c?o:c:l<c?l:c,f=h<u?h<d?h:d:u<d?u:d,_=o>l?o>c?o:c:l>c?l:c,m=h>u?h>d?h:d:u>d?u:d,y=Kl(p,f,e,t,n),v=Kl(_,m,e,t,n),g=s.prevZ,M=s.nextZ;for(;g&&g.z>=y&&M&&M.z<=v;){if(g.x>=p&&g.x<=_&&g.y>=f&&g.y<=m&&g!==i&&g!==a&&ts(o,h,l,u,c,d,g.x,g.y)&&nt(g.prev,g,g.next)>=0||(g=g.prevZ,M.x>=p&&M.x<=_&&M.y>=f&&M.y<=m&&M!==i&&M!==a&&ts(o,h,l,u,c,d,M.x,M.y)&&nt(M.prev,M,M.next)>=0))return!1;M=M.nextZ}for(;g&&g.z>=y;){if(g.x>=p&&g.x<=_&&g.y>=f&&g.y<=m&&g!==i&&g!==a&&ts(o,h,l,u,c,d,g.x,g.y)&&nt(g.prev,g,g.next)>=0)return!1;g=g.prevZ}for(;M&&M.z<=v;){if(M.x>=p&&M.x<=_&&M.y>=f&&M.y<=m&&M!==i&&M!==a&&ts(o,h,l,u,c,d,M.x,M.y)&&nt(M.prev,M,M.next)>=0)return!1;M=M.nextZ}return!0}function Pf(s,e,t){let n=s;do{let i=n.prev,r=n.next.next;!Qa(i,r)&&Sd(i,n,n.next,r)&&Zs(i,r)&&Zs(r,i)&&(e.push(i.i/t|0),e.push(n.i/t|0),e.push(r.i/t|0),Js(n),Js(n.next),n=s=r),n=n.next}while(n!==s);return Mi(n)}function If(s,e,t,n,i,r){let a=s;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&Ff(a,o)){let l=wd(a,o);return a=Mi(a,a.next),l=Mi(l,l.next),Ys(a,e,t,n,i,r,0),void Ys(l,e,t,n,i,r,0)}o=o.next}a=a.next}while(a!==s)}function Df(s,e){return s.x-e.x}function Nf(s,e){let t=function(i,r){let a,o=r,l=-1/0,c=i.x,h=i.y;do{if(h<=o.y&&h>=o.next.y&&o.next.y!==o.y){let m=o.x+(h-o.y)*(o.next.x-o.x)/(o.next.y-o.y);if(m<=c&&m>l&&(l=m,a=o.x<o.next.x?o:o.next,m===c))return a}o=o.next}while(o!==r);if(!a)return null;let u=a,d=a.x,p=a.y,f,_=1/0;o=a;do c>=o.x&&o.x>=d&&c!==o.x&&ts(h<p?c:l,h,d,p,h<p?l:c,h,o.x,o.y)&&(f=Math.abs(h-o.y)/(c-o.x),Zs(o,i)&&(f<_||f===_&&(o.x>a.x||o.x===a.x&&Uf(a,o)))&&(a=o,_=f)),o=o.next;while(o!==u);return a}(s,e);if(!t)return e;let n=wd(t,s);return Mi(n,n.next),Mi(t,t.next)}function Uf(s,e){return nt(s.prev,s,e.prev)<0&&nt(e.next,s,s.next)<0}function Kl(s,e,t,n,i){return(s=1431655765&((s=858993459&((s=252645135&((s=16711935&((s=(s-t)*i|0)|s<<8))|s<<4))|s<<2))|s<<1))|(e=1431655765&((e=858993459&((e=252645135&((e=16711935&((e=(e-n)*i|0)|e<<8))|e<<4))|e<<2))|e<<1))<<1}function Of(s){let e=s,t=s;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==s);return t}function ts(s,e,t,n,i,r,a,o){return(i-a)*(e-o)>=(s-a)*(r-o)&&(s-a)*(n-o)>=(t-a)*(e-o)&&(t-a)*(r-o)>=(i-a)*(n-o)}function Ff(s,e){return s.next.i!==e.i&&s.prev.i!==e.i&&!function(t,n){let i=t;do{if(i.i!==t.i&&i.next.i!==t.i&&i.i!==n.i&&i.next.i!==n.i&&Sd(i,i.next,t,n))return!0;i=i.next}while(i!==t);return!1}(s,e)&&(Zs(s,e)&&Zs(e,s)&&function(t,n){let i=t,r=!1,a=(t.x+n.x)/2,o=(t.y+n.y)/2;do i.y>o!=i.next.y>o&&i.next.y!==i.y&&a<(i.next.x-i.x)*(o-i.y)/(i.next.y-i.y)+i.x&&(r=!r),i=i.next;while(i!==t);return r}(s,e)&&(nt(s.prev,s,e.prev)||nt(s,e.prev,e))||Qa(s,e)&&nt(s.prev,s,s.next)>0&&nt(e.prev,e,e.next)>0)}function nt(s,e,t){return(e.y-s.y)*(t.x-e.x)-(e.x-s.x)*(t.y-e.y)}function Qa(s,e){return s.x===e.x&&s.y===e.y}function Sd(s,e,t,n){let i=oa(nt(s,e,t)),r=oa(nt(s,e,n)),a=oa(nt(t,n,s)),o=oa(nt(t,n,e));return i!==r&&a!==o||!(i!==0||!aa(s,t,e))||!(r!==0||!aa(s,n,e))||!(a!==0||!aa(t,s,n))||!(o!==0||!aa(t,e,n))}function aa(s,e,t){return e.x<=Math.max(s.x,t.x)&&e.x>=Math.min(s.x,t.x)&&e.y<=Math.max(s.y,t.y)&&e.y>=Math.min(s.y,t.y)}function oa(s){return s>0?1:s<0?-1:0}function Zs(s,e){return nt(s.prev,s,s.next)<0?nt(s,e,s.next)>=0&&nt(s,s.prev,e)>=0:nt(s,e,s.prev)<0||nt(s,s.next,e)<0}function wd(s,e){let t=new Ql(s.i,s.x,s.y),n=new Ql(e.i,e.x,e.y),i=s.next,r=e.prev;return s.next=e,e.prev=s,t.next=i,i.prev=t,n.next=t,t.prev=n,r.next=n,n.prev=r,n}function Wu(s,e,t,n){let i=new Ql(s,e,t);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function Js(s){s.next.prev=s.prev,s.prev.next=s.next,s.prevZ&&(s.prevZ.nextZ=s.nextZ),s.nextZ&&(s.nextZ.prevZ=s.prevZ)}function Ql(s,e,t){this.i=s,this.x=e,this.y=t,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function Vu(s){let e=s.length;e>2&&s[e-1].equals(s[0])&&s.pop()}function $u(s,e){for(let t=0;t<e.length;t++)s.push(e[t].x),s.push(e[t].y)}function ju(s,e,t){let n=`${s.x},${s.y},${s.z}-${e.x},${e.y},${e.z}`,i=`${e.x},${e.y},${e.z}-${s.x},${s.y},${s.z}`;return t.has(n)!==!0&&t.has(i)!==!0&&(t.add(n),t.add(i),!0)}function la(s,e,t){return!s||!t&&s.constructor===e?s:typeof e.BYTES_PER_ELEMENT=="number"?new e(s):Array.prototype.slice.call(s)}function kf(s){return ArrayBuffer.isView(s)&&!(s instanceof DataView)}function Ju(){return(typeof performance>"u"?Date:performance).now()}function Ku(s,e){return s.distance-e.distance}function xc(s,e,t,n){if(s.layers.test(e.layers)&&s.raycast(e,t),n===!0){let i=s.children;for(let r=0,a=i.length;r<a;r++)xc(i[r],e,t,!0)}}var fl,Si,wi,ed,bc,Pn,ii,It,td,nd,di,gl,_l,Mc,Ap,Rp,ti,Cp,Lp,Pp,Sc,Ip,Dp,id,rs,as,vl,yl,Za,os,In,xl,At,vh,Lo,nn,Np,ha,fi,wc,sd,Kn,Qn,ks,rd,ad,gi,un,_i,ls,od,ld,cd,Po,Io,Do,No,yh,xh,bh,Mh,hd,Sh,wh,Eh,Th,Ah,Rh,Ch,Lh,Ph,Ih,Dh,Nh,Uh,Oh,Fh,Bh,Uo,kh,zh,Hh,Gh,Wh,ua,da,Oo,Vh,$h,jh,ud,vi,dn,at,Dn,Ec,Ja,pa,Ke,ma,fa,Ui,bl,Xh,Ml,cs,ga,fn,xt,qh,ns,zs,dd,ie,Fe,Fo,Yh,Zh,Jh,Rr,Op,qe,Oi,va,Fp,ya,Bp,Ot,Je,El,Nn,xa,Tl,Ft,A,zo,Kh,gn,Tn,Qt,Cr,Fi,Bi,ki,Xn,qn,oi,ws,Lr,Pr,li,kp,Es,Go,_n,An,Wo,Ir,Yn,Vo,Dr,$o,Un,Ce,zi,en,zp,Hp,Zn,Nr,Nt,Qh,eu,ba,Gs,Gp,tu,Hi,Rn,Ur,Ts,Wp,Vp,nu,iu,su,$p,jp,ot,tn,Cn,jo,Ln,Gi,Wi,ru,Xo,qo,Yo,Or,ei,md,Jn,Fr,Ae,bt,Xp,an,On,Og,ct,Br,Rt,Ma,Sa,we,Yp,Vt,Jo,Vi,Ut,As,ft,Ye,au,ci,kr,ou,$i,ji,Xi,Ko,zr,Hr,Gr,Wr,lu,cu,hu,Vr,$r,ge,$e,Zp,Fn,Ws,Mt,qi,Al,wa,Rl,Qo,Jp,Kp,sn,hi,Xr,us,Bn,Ie,le,hn,qr,Ea,uu,Rs,el,du,tl,nl,il,ui,Yi,pu,Ta,Aa,_d,vd,yd,xd,bd,_u,vu,yu,xu,bu,Cl,Ll,Pl,sl,ss,ef,tf,rf,af,lf,uf,Dl,Nl,_f,Ul,Ol,Fl,st,Ef,Us,Bl,Vs,kl,Ra,Ca,zl,Et,La,$s,Ji,Cs,Ki,Qi,es,Ls,Md,Zr,Ps,Jr,Iu,rl,Du,Pa,Fg,Bg,kg,zg,Hg,Gg,Wg,Vg,$g,jg,Xg,qg,Yg,Zg,Jg,Kg,Qg,e0,t0,Hl,n0,i0,s0,r0,a0,o0,l0,c0,h0,u0,yi,Nu,Uu,Ou,al,Qr,ds,Fu,Bu,Ia,js,ku,Gl,ea,ta,Da,Na,$t,Xs,Wl,na,ol,ll,cl,Vl,Ua,$l,Oa,jl,Fa,Ba,ka,za,Xl,qs,Ha,ql,xi,gt,Yl,bi,Zl,ia,sa,hl,ra,Jl,Ga,Rf,ni,ec,Bf,Ks,tc,nc,ic,kn,sc,rc,ac,oc,lc,d0,Pe,vn,Wa,ps,cc,hc,uc,rn,pi,dc,pc,mc,Bs,mi,fc,Xu,gc,zf,Qs,_c,Va,er,tr,ul,qu,Yu,$a,Zu,Is,dl,vc,nr,yc,ja,p0,m0,f0,Xa,g0,_0,v0,y0,x0,b0,M0,S0,Rc,Hf,pl,Gf,Wf,Vf,Qe,w0,qa,ir,E0,T0,A0,R0,C0,L0,P0,I0,D0,N0,U0,O0,F0,B0,k0,z0,Qu,ca,ml,Ya,eo=Gn(()=>{fl="160",Si={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},wi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},ed=1,bc=2,Pn=3,ii=0,It=1,td=2,nd=2,di=100,gl=204,_l=205,Mc=0,Ap=1,Rp=2,ti=0,Cp=1,Lp=2,Pp=3,Sc=4,Ip=5,Dp=6,id=300,rs=301,as=302,vl=303,yl=304,Za=306,os=1e3,In=1001,xl=1002,At=1003,vh=1004,Lo=1005,nn=1006,Np=1007,ha=1008,fi=1009,wc=1012,sd=1013,Kn=1014,Qn=1015,ks=1016,rd=1017,ad=1018,gi=1020,un=1023,_i=1026,ls=1027,od=1029,ld=1031,cd=1033,Po=33776,Io=33777,Do=33778,No=33779,yh=35840,xh=35841,bh=35842,Mh=35843,hd=36196,Sh=37492,wh=37496,Eh=37808,Th=37809,Ah=37810,Rh=37811,Ch=37812,Lh=37813,Ph=37814,Ih=37815,Dh=37816,Nh=37817,Uh=37818,Oh=37819,Fh=37820,Bh=37821,Uo=36492,kh=36494,zh=36495,Hh=36284,Gh=36285,Wh=36286,ua=2300,da=2301,Oo=2302,Vh=2400,$h=2401,jh=2402,ud=3e3,vi=3001,dn="",at="srgb",Dn="srgb-linear",Ec="display-p3",Ja="display-p3-linear",pa="linear",Ke="srgb",ma="rec709",fa="p3",Ui=7680,bl=35044,Xh="300 es",Ml=1035,cs=2e3,ga=2001,fn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let n=this._listeners[e];if(n!==void 0){let i=n.indexOf(t);i!==-1&&n.splice(i,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let t=this._listeners[e.type];if(t!==void 0){e.target=this;let n=t.slice(0);for(let i=0,r=n.length;i<r;i++)n[i].call(this,e);e.target=null}}},xt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],qh=1234567,ns=Math.PI/180,zs=180/Math.PI;dd={DEG2RAD:ns,RAD2DEG:zs,generateUUID:mn,clamp:ut,euclideanModulo:Sl,mapLinear:function(s,e,t,n,i){return n+(s-e)*(i-n)/(t-e)},inverseLerp:function(s,e,t){return s!==e?(t-s)/(e-s):0},lerp:Ds,damp:function(s,e,t,n){return Ds(s,e,1-Math.exp(-t*n))},pingpong:function(s,e=1){return e-Math.abs(Sl(s,2*e)-e)},smoothstep:function(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e))*s*(3-2*s)},smootherstep:function(s,e,t){return s<=e?0:s>=t?1:(s=(s-e)/(t-e))*s*s*(s*(6*s-15)+10)},randInt:function(s,e){return s+Math.floor(Math.random()*(e-s+1))},randFloat:function(s,e){return s+Math.random()*(e-s)},randFloatSpread:function(s){return s*(.5-Math.random())},seededRandom:function(s){s!==void 0&&(qh=s);let e=qh+=1831565813;return e=Math.imul(e^e>>>15,1|e),e^=e+Math.imul(e^e>>>7,61|e),((e^e>>>14)>>>0)/4294967296},degToRad:function(s){return s*ns},radToDeg:function(s){return s*zs},isPowerOfTwo:wl,ceilPowerOfTwo:function(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))},floorPowerOfTwo:_a,setQuaternionFromProperEuler:function(s,e,t,n,i){let r=Math.cos,a=Math.sin,o=r(t/2),l=a(t/2),c=r((e+n)/2),h=a((e+n)/2),u=r((e-n)/2),d=a((e-n)/2),p=r((n-e)/2),f=a((n-e)/2);switch(i){case"XYX":s.set(o*h,l*u,l*d,o*c);break;case"YZY":s.set(l*d,o*h,l*u,o*c);break;case"ZXZ":s.set(l*u,l*d,o*h,o*c);break;case"XZX":s.set(o*h,l*f,l*p,o*c);break;case"YXY":s.set(l*p,o*h,l*f,o*c);break;case"ZYZ":s.set(l*f,l*p,o*h,o*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}},normalize:Xe,denormalize:pn},ie=class s{constructor(e=0,t=0){s.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(ut(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),i=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*i+e.x,this.y=r*i+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Fe=class s{constructor(e,t,n,i,r,a,o,l,c){s.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,a,o,l,c)}set(e,t,n,i,r,a,o,l,c){let h=this.elements;return h[0]=e,h[1]=i,h[2]=o,h[3]=t,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],u=n[7],d=n[2],p=n[5],f=n[8],_=i[0],m=i[3],y=i[6],v=i[1],g=i[4],M=i[7],T=i[2],w=i[5],R=i[8];return r[0]=a*_+o*v+l*T,r[3]=a*m+o*g+l*w,r[6]=a*y+o*M+l*R,r[1]=c*_+h*v+u*T,r[4]=c*m+h*g+u*w,r[7]=c*y+h*M+u*R,r[2]=d*_+p*v+f*T,r[5]=d*m+p*g+f*w,r[8]=d*y+p*M+f*R,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-n*r*h+n*o*l+i*r*c-i*a*l}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=h*a-o*c,d=o*l-h*r,p=c*r-a*l,f=t*u+n*d+i*p;if(f===0)return this.set(0,0,0,0,0,0,0,0,0);let _=1/f;return e[0]=u*_,e[1]=(i*c-h*n)*_,e[2]=(o*n-i*a)*_,e[3]=d*_,e[4]=(h*t-i*l)*_,e[5]=(i*r-o*t)*_,e[6]=p*_,e[7]=(n*l-c*t)*_,e[8]=(a*t-n*r)*_,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-i*c,i*l,-i*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(Fo.makeScale(e,t)),this}rotate(e){return this.premultiply(Fo.makeRotation(-e)),this}translate(e,t){return this.premultiply(Fo.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Fo=new Fe;Yh={};Zh=new Fe().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Jh=new Fe().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Rr={[Dn]:{transfer:pa,primaries:ma,toReference:s=>s,fromReference:s=>s},[at]:{transfer:Ke,primaries:ma,toReference:s=>s.convertSRGBToLinear(),fromReference:s=>s.convertLinearToSRGB()},[Ja]:{transfer:pa,primaries:fa,toReference:s=>s.applyMatrix3(Jh),fromReference:s=>s.applyMatrix3(Zh)},[Ec]:{transfer:Ke,primaries:fa,toReference:s=>s.convertSRGBToLinear().applyMatrix3(Jh),fromReference:s=>s.applyMatrix3(Zh).convertLinearToSRGB()}},Op=new Set([Dn,Ja]),qe={enabled:!0,_workingColorSpace:Dn,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(s){if(!Op.has(s))throw new Error(`Unsupported working color space, "${s}".`);this._workingColorSpace=s},convert:function(s,e,t){if(this.enabled===!1||e===t||!e||!t)return s;let n=Rr[e].toReference;return(0,Rr[t].fromReference)(n(s))},fromWorkingColorSpace:function(s,e){return this.convert(s,this._workingColorSpace,e)},toWorkingColorSpace:function(s,e){return this.convert(s,e,this._workingColorSpace)},getPrimaries:function(s){return Rr[s].primaries},getTransfer:function(s){return s===dn?pa:Rr[s].transfer}};va=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{Oi===void 0&&(Oi=Hs("canvas")),Oi.width=e.width,Oi.height=e.height;let n=Oi.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=Oi}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Hs("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let i=n.getImageData(0,0,e.width,e.height),r=i.data;for(let a=0;a<r.length;a++)r[a]=255*is(r[a]/255);return n.putImageData(i,0,0),t}if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(255*is(t[n]/255)):t[n]=is(t[n]);return{data:t,width:e.width,height:e.height}}return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Fp=0,ya=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Fp++}),this.uuid=mn(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let a=0,o=i.length;a<o;a++)i[a].isDataTexture?r.push(ko(i[a].image)):r.push(ko(i[a]))}else r=ko(i);n.url=r}return t||(e.images[this.uuid]=n),n}};Bp=0,Ot=class s extends fn{constructor(e=s.DEFAULT_IMAGE,t=s.DEFAULT_MAPPING,n=1001,i=1001,r=1006,a=1008,o=1023,l=1009,c=s.DEFAULT_ANISOTROPY,h=""){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Bp++}),this.uuid=mn(),this.name="",this.source=new ya(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ie(0,0),this.repeat=new ie(1,1),this.center=new ie(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Fe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof h=="string"?this.colorSpace=h:(Ns("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=h===vi?at:dn),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==id)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case os:e.x=e.x-Math.floor(e.x);break;case In:e.x=e.x<0?0:1;break;case xl:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case os:e.y=e.y-Math.floor(e.y);break;case In:e.y=e.y<0?0:1;break;case xl:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return Ns("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===at?vi:ud}set encoding(e){Ns("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=e===vi?at:dn}};Ot.DEFAULT_IMAGE=null,Ot.DEFAULT_MAPPING=id,Ot.DEFAULT_ANISOTROPY=1;Je=class s{constructor(e=0,t=0,n=0,i=1){s.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*i+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*i+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*i+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*i+a[15]*r,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,r,l=e.elements,c=l[0],h=l[4],u=l[8],d=l[1],p=l[5],f=l[9],_=l[2],m=l[6],y=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-_)<.01&&Math.abs(f-m)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+_)<.1&&Math.abs(f+m)<.1&&Math.abs(c+p+y-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let g=(c+1)/2,M=(p+1)/2,T=(y+1)/2,w=(h+d)/4,R=(u+_)/4,I=(f+m)/4;return g>M&&g>T?g<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(g),i=w/n,r=R/n):M>T?M<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(M),n=w/i,r=I/i):T<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(T),n=R/r,i=I/r),this.set(n,i,r,t),this}let v=Math.sqrt((m-f)*(m-f)+(u-_)*(u-_)+(d-h)*(d-h));return Math.abs(v)<.001&&(v=1),this.x=(m-f)/v,this.y=(u-_)/v,this.z=(d-h)/v,this.w=Math.acos((c+p+y-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},El=class extends fn{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new Je(0,0,e,t),this.scissorTest=!1,this.viewport=new Je(0,0,e,t);let i={width:e,height:t,depth:1};n.encoding!==void 0&&(Ns("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),n.colorSpace=n.encoding===vi?at:dn),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:nn,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},n),this.texture=new Ot(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=n.generateMipmaps,this.texture.internalFormat=n.internalFormat,this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}setSize(e,t,n=1){this.width===e&&this.height===t&&this.depth===n||(this.width=e,this.height=t,this.depth=n,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=n,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new ya(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Nn=class extends El{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},xa=class extends Ot{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=At,this.minFilter=At,this.wrapR=In,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Tl=class extends Ot{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=At,this.minFilter=At,this.wrapR=In,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Ft=class{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,r,a,o){let l=n[i+0],c=n[i+1],h=n[i+2],u=n[i+3],d=r[a+0],p=r[a+1],f=r[a+2],_=r[a+3];if(o===0)return e[t+0]=l,e[t+1]=c,e[t+2]=h,void(e[t+3]=u);if(o===1)return e[t+0]=d,e[t+1]=p,e[t+2]=f,void(e[t+3]=_);if(u!==_||l!==d||c!==p||h!==f){let m=1-o,y=l*d+c*p+h*f+u*_,v=y>=0?1:-1,g=1-y*y;if(g>Number.EPSILON){let T=Math.sqrt(g),w=Math.atan2(T,y*v);m=Math.sin(m*w)/T,o=Math.sin(o*w)/T}let M=o*v;if(l=l*m+d*M,c=c*m+p*M,h=h*m+f*M,u=u*m+_*M,m===1-o){let T=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=T,c*=T,h*=T,u*=T}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,i,r,a){let o=n[i],l=n[i+1],c=n[i+2],h=n[i+3],u=r[a],d=r[a+1],p=r[a+2],f=r[a+3];return e[t]=o*f+h*u+l*p-c*d,e[t+1]=l*f+h*d+c*u-o*p,e[t+2]=c*f+h*p+o*d-l*u,e[t+3]=h*f-o*u-l*d-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,i=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(i/2),u=o(r/2),d=l(n/2),p=l(i/2),f=l(r/2);switch(a){case"XYZ":this._x=d*h*u+c*p*f,this._y=c*p*u-d*h*f,this._z=c*h*f+d*p*u,this._w=c*h*u-d*p*f;break;case"YXZ":this._x=d*h*u+c*p*f,this._y=c*p*u-d*h*f,this._z=c*h*f-d*p*u,this._w=c*h*u+d*p*f;break;case"ZXY":this._x=d*h*u-c*p*f,this._y=c*p*u+d*h*f,this._z=c*h*f+d*p*u,this._w=c*h*u-d*p*f;break;case"ZYX":this._x=d*h*u-c*p*f,this._y=c*p*u+d*h*f,this._z=c*h*f-d*p*u,this._w=c*h*u+d*p*f;break;case"YZX":this._x=d*h*u+c*p*f,this._y=c*p*u+d*h*f,this._z=c*h*f-d*p*u,this._w=c*h*u-d*p*f;break;case"XZY":this._x=d*h*u-c*p*f,this._y=c*p*u-d*h*f,this._z=c*h*f+d*p*u,this._w=c*h*u+d*p*f;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],i=t[4],r=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],u=t[10],d=n+o+u;if(d>0){let p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(h-l)*p,this._y=(r-c)*p,this._z=(a-i)*p}else if(n>o&&n>u){let p=2*Math.sqrt(1+n-o-u);this._w=(h-l)/p,this._x=.25*p,this._y=(i+a)/p,this._z=(r+c)/p}else if(o>u){let p=2*Math.sqrt(1+o-n-u);this._w=(r-c)/p,this._x=(i+a)/p,this._y=.25*p,this._z=(l+h)/p}else{let p=2*Math.sqrt(1+u-n-o);this._w=(a-i)/p,this._x=(r+c)/p,this._y=(l+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(ut(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,i=e._y,r=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+a*o+i*c-r*l,this._y=i*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-i*o,this._w=a*h-n*o-i*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,i=this._y,r=this._z,a=this._w,o=a*e._w+n*e._x+i*e._y+r*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=i,this._z=r,this;let l=1-o*o;if(l<=Number.EPSILON){let p=1-t;return this._w=p*a+t*this._w,this._x=p*n+t*this._x,this._y=p*i+t*this._y,this._z=p*r+t*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,o),u=Math.sin((1-t)*h)/c,d=Math.sin(t*h)/c;return this._w=a*u+this._w*d,this._x=n*u+this._x*d,this._y=i*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=Math.random(),t=Math.sqrt(1-e),n=Math.sqrt(e),i=2*Math.PI*Math.random(),r=2*Math.PI*Math.random();return this.set(t*Math.cos(i),n*Math.sin(r),n*Math.cos(r),t*Math.sin(i))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},A=class s{constructor(e=0,t=0,n=0){s.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Kh.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Kh.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*i,this.y=r[1]*t+r[4]*n+r[7]*i,this.z=r[2]*t+r[5]*n+r[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*i+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*i+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*i+r[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,i=this.z,r=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*i-o*n),h=2*(o*t-r*i),u=2*(r*n-a*t);return this.x=t+l*c+a*u-o*h,this.y=n+l*h+o*c-r*u,this.z=i+l*u+r*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,i=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*i,this.y=r[1]*t+r[5]*n+r[9]*i,this.z=r[2]*t+r[6]*n+r[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,i=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=i*l-r*o,this.y=r*a-n*l,this.z=n*o-i*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return zo.copy(this).projectOnVector(e),this.sub(zo)}reflect(e){return this.sub(zo.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(ut(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,4*t)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,3*t)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=2*(Math.random()-.5),t=Math.random()*Math.PI*2,n=Math.sqrt(1-e**2);return this.x=n*Math.cos(t),this.y=n*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},zo=new A,Kh=new Ft,gn=class{constructor(e=new A(1/0,1/0,1/0),t=new A(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Qt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Qt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Qt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Qt):Qt.fromBufferAttribute(r,a),Qt.applyMatrix4(e.matrixWorld),this.expandByPoint(Qt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Cr.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Cr.copy(n.boundingBox)),Cr.applyMatrix4(e.matrixWorld),this.union(Cr)}let i=e.children;for(let r=0,a=i.length;r<a;r++)this.expandByObject(i[r],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,Qt),Qt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(ws),Lr.subVectors(this.max,ws),Fi.subVectors(e.a,ws),Bi.subVectors(e.b,ws),ki.subVectors(e.c,ws),Xn.subVectors(Bi,Fi),qn.subVectors(ki,Bi),oi.subVectors(Fi,ki);let t=[0,-Xn.z,Xn.y,0,-qn.z,qn.y,0,-oi.z,oi.y,Xn.z,0,-Xn.x,qn.z,0,-qn.x,oi.z,0,-oi.x,-Xn.y,Xn.x,0,-qn.y,qn.x,0,-oi.y,oi.x,0];return!!Ho(t,Fi,Bi,ki,Lr)&&(t=[1,0,0,0,1,0,0,0,1],!!Ho(t,Fi,Bi,ki,Lr)&&(Pr.crossVectors(Xn,qn),t=[Pr.x,Pr.y,Pr.z],Ho(t,Fi,Bi,ki,Lr)))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Qt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=.5*this.getSize(Qt).length()),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(Tn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Tn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Tn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Tn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Tn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Tn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Tn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Tn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Tn)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},Tn=[new A,new A,new A,new A,new A,new A,new A,new A],Qt=new A,Cr=new gn,Fi=new A,Bi=new A,ki=new A,Xn=new A,qn=new A,oi=new A,ws=new A,Lr=new A,Pr=new A,li=new A;kp=new gn,Es=new A,Go=new A,_n=class{constructor(e=new A,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):kp.setFromPoints(e).getCenter(n);let i=0;for(let r=0,a=e.length;r<a;r++)i=Math.max(i,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Es.subVectors(e,this.center);let t=Es.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),i=.5*(n-this.radius);this.center.addScaledVector(Es,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Go.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Es.copy(e.center).add(Go)),this.expandByPoint(Es.copy(e.center).sub(Go))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},An=new A,Wo=new A,Ir=new A,Yn=new A,Vo=new A,Dr=new A,$o=new A,Un=class{constructor(e=new A,t=new A(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,An)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=An.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(An.copy(this.origin).addScaledVector(this.direction,t),An.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){Wo.copy(e).add(t).multiplyScalar(.5),Ir.copy(t).sub(e).normalize(),Yn.copy(this.origin).sub(Wo);let r=.5*e.distanceTo(t),a=-this.direction.dot(Ir),o=Yn.dot(this.direction),l=-Yn.dot(Ir),c=Yn.lengthSq(),h=Math.abs(1-a*a),u,d,p,f;if(h>0)if(u=a*l-o,d=a*o-l,f=r*h,u>=0)if(d>=-f)if(d<=f){let _=1/h;u*=_,d*=_,p=u*(u+a*d+2*o)+d*(a*u+d+2*l)+c}else d=r,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;else d=-r,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;else d<=-f?(u=Math.max(0,-(-a*r+o)),d=u>0?-r:Math.min(Math.max(-r,-l),r),p=-u*u+d*(d+2*l)+c):d<=f?(u=0,d=Math.min(Math.max(-r,-l),r),p=d*(d+2*l)+c):(u=Math.max(0,-(a*r+o)),d=u>0?r:Math.min(Math.max(-r,-l),r),p=-u*u+d*(d+2*l)+c);else d=a>0?-r:r,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(Wo).addScaledVector(Ir,d),p}intersectSphere(e,t){An.subVectors(e.center,this.origin);let n=An.dot(this.direction),i=An.dot(An)-n*n,r=e.radius*e.radius;if(i>r)return null;let a=Math.sqrt(r-i),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0?!0:e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,i=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,i=(e.min.x-d.x)*c),h>=0?(r=(e.min.y-d.y)*h,a=(e.max.y-d.y)*h):(r=(e.max.y-d.y)*h,a=(e.min.y-d.y)*h),n>a||r>i?null:((r>n||isNaN(n))&&(n=r),(a<i||isNaN(i))&&(i=a),u>=0?(o=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),n>l||o>i?null:((o>n||n!=n)&&(n=o),(l<i||i!=i)&&(i=l),i<0?null:this.at(n>=0?n:i,t)))}intersectsBox(e){return this.intersectBox(e,An)!==null}intersectTriangle(e,t,n,i,r){Vo.subVectors(t,e),Dr.subVectors(n,e),$o.crossVectors(Vo,Dr);let a,o=this.direction.dot($o);if(o>0){if(i)return null;a=1}else{if(!(o<0))return null;a=-1,o=-o}Yn.subVectors(this.origin,e);let l=a*this.direction.dot(Dr.crossVectors(Yn,Dr));if(l<0)return null;let c=a*this.direction.dot(Vo.cross(Yn));if(c<0||l+c>o)return null;let h=-a*Yn.dot($o);return h<0?null:this.at(h/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ce=class s{constructor(e,t,n,i,r,a,o,l,c,h,u,d,p,f,_,m){s.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,i,r,a,o,l,c,h,u,d,p,f,_,m)}set(e,t,n,i,r,a,o,l,c,h,u,d,p,f,_,m){let y=this.elements;return y[0]=e,y[4]=t,y[8]=n,y[12]=i,y[1]=r,y[5]=a,y[9]=o,y[13]=l,y[2]=c,y[6]=h,y[10]=u,y[14]=d,y[3]=p,y[7]=f,y[11]=_,y[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new s().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,i=1/zi.setFromMatrixColumn(e,0).length(),r=1/zi.setFromMatrixColumn(e,1).length(),a=1/zi.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,i=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(i),c=Math.sin(i),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let d=a*h,p=a*u,f=o*h,_=o*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=p+f*c,t[5]=d-_*c,t[9]=-o*l,t[2]=_-d*c,t[6]=f+p*c,t[10]=a*l}else if(e.order==="YXZ"){let d=l*h,p=l*u,f=c*h,_=c*u;t[0]=d+_*o,t[4]=f*o-p,t[8]=a*c,t[1]=a*u,t[5]=a*h,t[9]=-o,t[2]=p*o-f,t[6]=_+d*o,t[10]=a*l}else if(e.order==="ZXY"){let d=l*h,p=l*u,f=c*h,_=c*u;t[0]=d-_*o,t[4]=-a*u,t[8]=f+p*o,t[1]=p+f*o,t[5]=a*h,t[9]=_-d*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let d=a*h,p=a*u,f=o*h,_=o*u;t[0]=l*h,t[4]=f*c-p,t[8]=d*c+_,t[1]=l*u,t[5]=_*c+d,t[9]=p*c-f,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let d=a*l,p=a*c,f=o*l,_=o*c;t[0]=l*h,t[4]=_-d*u,t[8]=f*u+p,t[1]=u,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=p*u+f,t[10]=d-_*u}else if(e.order==="XZY"){let d=a*l,p=a*c,f=o*l,_=o*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=d*u+_,t[5]=a*h,t[9]=p*u-f,t[2]=f*u-p,t[6]=o*h,t[10]=_*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(zp,e,Hp)}lookAt(e,t,n){let i=this.elements;return Nt.subVectors(e,t),Nt.lengthSq()===0&&(Nt.z=1),Nt.normalize(),Zn.crossVectors(n,Nt),Zn.lengthSq()===0&&(Math.abs(n.z)===1?Nt.x+=1e-4:Nt.z+=1e-4,Nt.normalize(),Zn.crossVectors(n,Nt)),Zn.normalize(),Nr.crossVectors(Nt,Zn),i[0]=Zn.x,i[4]=Nr.x,i[8]=Nt.x,i[1]=Zn.y,i[5]=Nr.y,i[9]=Nt.y,i[2]=Zn.z,i[6]=Nr.z,i[10]=Nt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],u=n[5],d=n[9],p=n[13],f=n[2],_=n[6],m=n[10],y=n[14],v=n[3],g=n[7],M=n[11],T=n[15],w=i[0],R=i[4],I=i[8],P=i[12],B=i[1],V=i[5],L=i[9],O=i[13],k=i[2],Q=i[6],oe=i[10],J=i[14],j=i[3],Y=i[7],z=i[11],Z=i[15];return r[0]=a*w+o*B+l*k+c*j,r[4]=a*R+o*V+l*Q+c*Y,r[8]=a*I+o*L+l*oe+c*z,r[12]=a*P+o*O+l*J+c*Z,r[1]=h*w+u*B+d*k+p*j,r[5]=h*R+u*V+d*Q+p*Y,r[9]=h*I+u*L+d*oe+p*z,r[13]=h*P+u*O+d*J+p*Z,r[2]=f*w+_*B+m*k+y*j,r[6]=f*R+_*V+m*Q+y*Y,r[10]=f*I+_*L+m*oe+y*z,r[14]=f*P+_*O+m*J+y*Z,r[3]=v*w+g*B+M*k+T*j,r[7]=v*R+g*V+M*Q+T*Y,r[11]=v*I+g*L+M*oe+T*z,r[15]=v*P+g*O+M*J+T*Z,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],i=e[8],r=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],u=e[6],d=e[10],p=e[14];return e[3]*(+r*l*u-i*c*u-r*o*d+n*c*d+i*o*p-n*l*p)+e[7]*(+t*l*p-t*c*d+r*a*d-i*a*p+i*c*h-r*l*h)+e[11]*(+t*c*u-t*o*p-r*a*u+n*a*p+r*o*h-n*c*h)+e[15]*(-i*o*h-t*l*u+t*o*d+i*a*u-n*a*d+n*l*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=e[9],d=e[10],p=e[11],f=e[12],_=e[13],m=e[14],y=e[15],v=u*m*c-_*d*c+_*l*p-o*m*p-u*l*y+o*d*y,g=f*d*c-h*m*c-f*l*p+a*m*p+h*l*y-a*d*y,M=h*_*c-f*u*c+f*o*p-a*_*p-h*o*y+a*u*y,T=f*u*l-h*_*l-f*o*d+a*_*d+h*o*m-a*u*m,w=t*v+n*g+i*M+r*T;if(w===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let R=1/w;return e[0]=v*R,e[1]=(_*d*r-u*m*r-_*i*p+n*m*p+u*i*y-n*d*y)*R,e[2]=(o*m*r-_*l*r+_*i*c-n*m*c-o*i*y+n*l*y)*R,e[3]=(u*l*r-o*d*r-u*i*c+n*d*c+o*i*p-n*l*p)*R,e[4]=g*R,e[5]=(h*m*r-f*d*r+f*i*p-t*m*p-h*i*y+t*d*y)*R,e[6]=(f*l*r-a*m*r-f*i*c+t*m*c+a*i*y-t*l*y)*R,e[7]=(a*d*r-h*l*r+h*i*c-t*d*c-a*i*p+t*l*p)*R,e[8]=M*R,e[9]=(f*u*r-h*_*r-f*n*p+t*_*p+h*n*y-t*u*y)*R,e[10]=(a*_*r-f*o*r+f*n*c-t*_*c-a*n*y+t*o*y)*R,e[11]=(h*o*r-a*u*r-h*n*c+t*u*c+a*n*p-t*o*p)*R,e[12]=T*R,e[13]=(h*_*i-f*u*i+f*n*d-t*_*d-h*n*m+t*u*m)*R,e[14]=(f*o*i-a*_*i-f*n*l+t*_*l+a*n*m-t*o*m)*R,e[15]=(a*u*i-h*o*i+h*n*l-t*u*l-a*n*d+t*o*d)*R,this}scale(e){let t=this.elements,n=e.x,i=e.y,r=e.z;return t[0]*=n,t[4]*=i,t[8]*=r,t[1]*=n,t[5]*=i,t[9]*=r,t[2]*=n,t[6]*=i,t[10]*=r,t[3]*=n,t[7]*=i,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),i=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-i*l,c*l+i*o,0,c*o+i*l,h*o+n,h*l-i*a,0,c*l-i*o,h*l+i*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,r,a){return this.set(1,n,r,0,e,1,a,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){let i=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,c=r+r,h=a+a,u=o+o,d=r*c,p=r*h,f=r*u,_=a*h,m=a*u,y=o*u,v=l*c,g=l*h,M=l*u,T=n.x,w=n.y,R=n.z;return i[0]=(1-(_+y))*T,i[1]=(p+M)*T,i[2]=(f-g)*T,i[3]=0,i[4]=(p-M)*w,i[5]=(1-(d+y))*w,i[6]=(m+v)*w,i[7]=0,i[8]=(f+g)*R,i[9]=(m-v)*R,i[10]=(1-(d+_))*R,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){let i=this.elements,r=zi.set(i[0],i[1],i[2]).length(),a=zi.set(i[4],i[5],i[6]).length(),o=zi.set(i[8],i[9],i[10]).length();this.determinant()<0&&(r=-r),e.x=i[12],e.y=i[13],e.z=i[14],en.copy(this);let l=1/r,c=1/a,h=1/o;return en.elements[0]*=l,en.elements[1]*=l,en.elements[2]*=l,en.elements[4]*=c,en.elements[5]*=c,en.elements[6]*=c,en.elements[8]*=h,en.elements[9]*=h,en.elements[10]*=h,t.setFromRotationMatrix(en),n.x=r,n.y=a,n.z=o,this}makePerspective(e,t,n,i,r,a,o=2e3){let l=this.elements,c=2*r/(t-e),h=2*r/(n-i),u=(t+e)/(t-e),d=(n+i)/(n-i),p,f;if(o===cs)p=-(a+r)/(a-r),f=-2*a*r/(a-r);else{if(o!==ga)throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);p=-a/(a-r),f=-a*r/(a-r)}return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=f,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,i,r,a,o=2e3){let l=this.elements,c=1/(t-e),h=1/(n-i),u=1/(a-r),d=(t+e)*c,p=(n+i)*h,f,_;if(o===cs)f=(a+r)*u,_=-2*u;else{if(o!==ga)throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);f=r*u,_=-1*u}return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=_,l[14]=-f,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},zi=new A,en=new Ce,zp=new A(0,0,0),Hp=new A(1,1,1),Zn=new A,Nr=new A,Nt=new A,Qh=new Ce,eu=new Ft,ba=class s{constructor(e=0,t=0,n=0,i=s.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let i=e.elements,r=i[0],a=i[4],o=i[8],l=i[1],c=i[5],h=i[9],u=i[2],d=i[6],p=i[10];switch(t){case"XYZ":this._y=Math.asin(ut(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-ut(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(ut(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,p),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-ut(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(ut(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-ut(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Qh.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Qh,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return eu.setFromEuler(this),this.setFromQuaternion(eu,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};ba.DEFAULT_ORDER="XYZ";Gs=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!=0}isEnabled(e){return(this.mask&(1<<e|0))!=0}},Gp=0,tu=new A,Hi=new Ft,Rn=new Ce,Ur=new A,Ts=new A,Wp=new A,Vp=new Ft,nu=new A(1,0,0),iu=new A(0,1,0),su=new A(0,0,1),$p={type:"added"},jp={type:"removed"},ot=class s extends fn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Gp++}),this.uuid=mn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=s.DEFAULT_UP.clone();let e=new A,t=new ba,n=new Ft,i=new A(1,1,1);t._onChange(function(){n.setFromEuler(t,!1)}),n._onChange(function(){t.setFromQuaternion(n,void 0,!1)}),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Ce},normalMatrix:{value:new Fe}}),this.matrix=new Ce,this.matrixWorld=new Ce,this.matrixAutoUpdate=s.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=s.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Gs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Hi.setFromAxisAngle(e,t),this.quaternion.multiply(Hi),this}rotateOnWorldAxis(e,t){return Hi.setFromAxisAngle(e,t),this.quaternion.premultiply(Hi),this}rotateX(e){return this.rotateOnAxis(nu,e)}rotateY(e){return this.rotateOnAxis(iu,e)}rotateZ(e){return this.rotateOnAxis(su,e)}translateOnAxis(e,t){return tu.copy(e).applyQuaternion(this.quaternion),this.position.add(tu.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(nu,e)}translateY(e){return this.translateOnAxis(iu,e)}translateZ(e){return this.translateOnAxis(su,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Rn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Ur.copy(e):Ur.set(e,t,n);let i=this.parent;this.updateWorldMatrix(!0,!1),Ts.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Rn.lookAt(Ts,Ur,this.up):Rn.lookAt(Ur,Ts,this.up),this.quaternion.setFromRotationMatrix(Rn),i&&(Rn.extractRotation(i.matrixWorld),Hi.setFromRotationMatrix(Rn),this.quaternion.premultiply(Hi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent($p)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(jp)),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Rn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Rn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Rn),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let i=this.children;for(let r=0,a=i.length;r<a;r++)i[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ts,e,Wp),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ts,Vp,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,i=t.length;n<i;n++){let r=t[n];r.matrixWorldAutoUpdate!==!0&&e!==!0||r.updateMatrixWorld(e)}}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.matrixWorldAutoUpdate===!0&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){let i=this.children;for(let r=0,a=i.length;r<a;r++){let o=i[r];o.matrixWorldAutoUpdate===!0&&o.updateWorldMatrix(!1,!0)}}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let i={};function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.visibility=this._visibility,i.active=this._active,i.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),i.maxGeometryCount=this._maxGeometryCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.geometryCount=this._geometryCount,i.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(i.boundingSphere={center:i.boundingSphere.center.toArray(),radius:i.boundingSphere.radius}),this.boundingBox!==null&&(i.boundingBox={min:i.boundingBox.min.toArray(),max:i.boundingBox.max.toArray()})),this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(e.materials,this.material[l]));i.material=o}else i.material=r(e.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];i.animations.push(r(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),u=a(e.shapes),d=a(e.skeletons),p=a(e.animations),f=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),p.length>0&&(n.animations=p),f.length>0&&(n.nodes=f)}return n.object=i,n;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let i=e.children[n];this.add(i.clone())}return this}};ot.DEFAULT_UP=new A(0,1,0),ot.DEFAULT_MATRIX_AUTO_UPDATE=!0,ot.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;tn=new A,Cn=new A,jo=new A,Ln=new A,Gi=new A,Wi=new A,ru=new A,Xo=new A,qo=new A,Yo=new A,Or=!1,ei=class s{constructor(e=new A,t=new A,n=new A){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),tn.subVectors(e,t),i.cross(tn);let r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(e,t,n,i,r){tn.subVectors(i,t),Cn.subVectors(n,t),jo.subVectors(e,t);let a=tn.dot(tn),o=tn.dot(Cn),l=tn.dot(jo),c=Cn.dot(Cn),h=Cn.dot(jo),u=a*c-o*o;if(u===0)return r.set(0,0,0),null;let d=1/u,p=(c*l-o*h)*d,f=(a*h-o*l)*d;return r.set(1-p-f,f,p)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,Ln)!==null&&Ln.x>=0&&Ln.y>=0&&Ln.x+Ln.y<=1}static getUV(e,t,n,i,r,a,o,l){return Or===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),Or=!0),this.getInterpolation(e,t,n,i,r,a,o,l)}static getInterpolation(e,t,n,i,r,a,o,l){return this.getBarycoord(e,t,n,i,Ln)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Ln.x),l.addScaledVector(a,Ln.y),l.addScaledVector(o,Ln.z),l)}static isFrontFacing(e,t,n,i){return tn.subVectors(n,t),Cn.subVectors(e,t),tn.cross(Cn).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return tn.subVectors(this.c,this.b),Cn.subVectors(this.a,this.b),.5*tn.cross(Cn).length()}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return s.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return s.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,n,i,r){return Or===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),Or=!0),s.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}getInterpolation(e,t,n,i,r){return s.getInterpolation(e,this.a,this.b,this.c,t,n,i,r)}containsPoint(e){return s.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return s.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,i=this.b,r=this.c,a,o;Gi.subVectors(i,n),Wi.subVectors(r,n),Xo.subVectors(e,n);let l=Gi.dot(Xo),c=Wi.dot(Xo);if(l<=0&&c<=0)return t.copy(n);qo.subVectors(e,i);let h=Gi.dot(qo),u=Wi.dot(qo);if(h>=0&&u<=h)return t.copy(i);let d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return a=l/(l-h),t.copy(n).addScaledVector(Gi,a);Yo.subVectors(e,r);let p=Gi.dot(Yo),f=Wi.dot(Yo);if(f>=0&&p<=f)return t.copy(r);let _=p*c-l*f;if(_<=0&&c>=0&&f<=0)return o=c/(c-f),t.copy(n).addScaledVector(Wi,o);let m=h*f-p*u;if(m<=0&&u-h>=0&&p-f>=0)return ru.subVectors(r,i),o=(u-h)/(u-h+(p-f)),t.copy(i).addScaledVector(ru,o);let y=1/(m+_+d);return a=_*y,o=d*y,t.copy(n).addScaledVector(Gi,a).addScaledVector(Wi,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},md={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Jn={h:0,s:0,l:0},Fr={h:0,s:0,l:0};Ae=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=at){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(255&e)/255,qe.toWorkingColorSpace(this,t),this}setRGB(e,t,n,i=qe.workingColorSpace){return this.r=e,this.g=t,this.b=n,qe.toWorkingColorSpace(this,i),this}setHSL(e,t,n,i=qe.workingColorSpace){if(e=Sl(e,1),t=ut(t,0,1),n=ut(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=Zo(a,r,e+1/3),this.g=Zo(a,r,e),this.b=Zo(a,r,e-1/3)}return qe.toWorkingColorSpace(this,i),this}setStyle(e,t=at){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=i[1],o=i[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=i[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=at){let n=md[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=is(e.r),this.g=is(e.g),this.b=is(e.b),this}copyLinearToSRGB(e){return this.r=Bo(e.r),this.g=Bo(e.g),this.b=Bo(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=at){return qe.fromWorkingColorSpace(bt.copy(this),e),65536*Math.round(ut(255*bt.r,0,255))+256*Math.round(ut(255*bt.g,0,255))+Math.round(ut(255*bt.b,0,255))}getHexString(e=at){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=qe.workingColorSpace){qe.fromWorkingColorSpace(bt.copy(this),t);let n=bt.r,i=bt.g,r=bt.b,a=Math.max(n,i,r),o=Math.min(n,i,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case n:l=(i-r)/u+(i<r?6:0);break;case i:l=(r-n)/u+2;break;case r:l=(n-i)/u+4}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=qe.workingColorSpace){return qe.fromWorkingColorSpace(bt.copy(this),t),e.r=bt.r,e.g=bt.g,e.b=bt.b,e}getStyle(e=at){qe.fromWorkingColorSpace(bt.copy(this),e);let t=bt.r,n=bt.g,i=bt.b;return e!==at?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(255*t)},${Math.round(255*n)},${Math.round(255*i)})`}offsetHSL(e,t,n){return this.getHSL(Jn),this.setHSL(Jn.h+e,Jn.s+t,Jn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Jn),e.getHSL(Fr);let n=Ds(Jn.h,Fr.h,t),i=Ds(Jn.s,Fr.s,t),r=Ds(Jn.l,Fr.l,t);return this.setHSL(n,i,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,i=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*i,this.g=r[1]*t+r[4]*n+r[7]*i,this.b=r[2]*t+r[5]*n+r[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},bt=new Ae;Ae.NAMES=md;Xp=0,an=class extends fn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Xp++}),this.uuid=mn(),this.name="",this.type="Material",this.blending=1,this.side=ii,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=gl,this.blendDst=_l,this.blendEquation=di,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ae(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ui,this.stencilZFail=Ui,this.stencilZPass=Ui,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let i=this[t];i!==void 0?i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n:console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`)}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};function i(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==1&&(n.blending=this.blending),this.side!==ii&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==gl&&(n.blendSrc=this.blendSrc),this.blendDst!==_l&&(n.blendDst=this.blendDst),this.blendEquation!==di&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==3&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==519&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ui&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Ui&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Ui&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData),t){let r=i(e.textures),a=i(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let i=t.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},On=class extends an{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ae(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=Mc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Og=qp();ct=new A,Br=new ie,Rt=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=bl,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=Qn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Br.fromBufferAttribute(this,t),Br.applyMatrix3(e),this.setXY(t,Br.x,Br.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)ct.fromBufferAttribute(this,t),ct.applyMatrix3(e),this.setXYZ(t,ct.x,ct.y,ct.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)ct.fromBufferAttribute(this,t),ct.applyMatrix4(e),this.setXYZ(t,ct.x,ct.y,ct.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)ct.fromBufferAttribute(this,t),ct.applyNormalMatrix(e),this.setXYZ(t,ct.x,ct.y,ct.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)ct.fromBufferAttribute(this,t),ct.transformDirection(e),this.setXYZ(t,ct.x,ct.y,ct.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=pn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Xe(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=pn(t,this.array)),t}setX(e,t){return this.normalized&&(t=Xe(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=pn(t,this.array)),t}setY(e,t){return this.normalized&&(t=Xe(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=pn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Xe(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=pn(t,this.array)),t}setW(e,t){return this.normalized&&(t=Xe(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Xe(t,this.array),n=Xe(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=Xe(t,this.array),n=Xe(n,this.array),i=Xe(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e*=this.itemSize,this.normalized&&(t=Xe(t,this.array),n=Xe(n,this.array),i=Xe(i,this.array),r=Xe(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==bl&&(e.usage=this.usage),e}},Ma=class extends Rt{constructor(e,t,n){super(new Uint16Array(e),t,n)}},Sa=class extends Rt{constructor(e,t,n){super(new Uint32Array(e),t,n)}},we=class extends Rt{constructor(e,t,n){super(new Float32Array(e),t,n)}},Yp=0,Vt=new Ce,Jo=new ot,Vi=new A,Ut=new gn,As=new gn,ft=new A,Ye=class s extends fn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Yp++}),this.uuid=mn(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(pd(e)?Sa:Ma)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Fe().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Vt.makeRotationFromQuaternion(e),this.applyMatrix4(Vt),this}rotateX(e){return Vt.makeRotationX(e),this.applyMatrix4(Vt),this}rotateY(e){return Vt.makeRotationY(e),this.applyMatrix4(Vt),this}rotateZ(e){return Vt.makeRotationZ(e),this.applyMatrix4(Vt),this}translate(e,t,n){return Vt.makeTranslation(e,t,n),this.applyMatrix4(Vt),this}scale(e,t,n){return Vt.makeScale(e,t,n),this.applyMatrix4(Vt),this}lookAt(e){return Jo.lookAt(e),Jo.updateMatrix(),this.applyMatrix4(Jo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Vi).negate(),this.translate(Vi.x,Vi.y,Vi.z),this}setFromPoints(e){let t=[];for(let n=0,i=e.length;n<i;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new we(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new gn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)return console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),void this.boundingBox.set(new A(-1/0,-1/0,-1/0),new A(1/0,1/0,1/0));if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){let r=t[n];Ut.setFromBufferAttribute(r),this.morphTargetsRelative?(ft.addVectors(this.boundingBox.min,Ut.min),this.boundingBox.expandByPoint(ft),ft.addVectors(this.boundingBox.max,Ut.max),this.boundingBox.expandByPoint(ft)):(this.boundingBox.expandByPoint(Ut.min),this.boundingBox.expandByPoint(Ut.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new _n);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)return console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),void this.boundingSphere.set(new A,1/0);if(e){let n=this.boundingSphere.center;if(Ut.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];As.setFromBufferAttribute(o),this.morphTargetsRelative?(ft.addVectors(Ut.min,As.min),Ut.expandByPoint(ft),ft.addVectors(Ut.max,As.max),Ut.expandByPoint(ft)):(Ut.expandByPoint(As.min),Ut.expandByPoint(As.max))}Ut.getCenter(n);let i=0;for(let r=0,a=e.count;r<a;r++)ft.fromBufferAttribute(e,r),i=Math.max(i,n.distanceToSquared(ft));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)ft.fromBufferAttribute(o,c),l&&(Vi.fromBufferAttribute(e,c),ft.add(Vi)),i=Math.max(i,n.distanceToSquared(ft))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0)return void console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");let n=e.array,i=t.position.array,r=t.normal.array,a=t.uv.array,o=i.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Rt(new Float32Array(4*o),4));let l=this.getAttribute("tangent").array,c=[],h=[];for(let B=0;B<o;B++)c[B]=new A,h[B]=new A;let u=new A,d=new A,p=new A,f=new ie,_=new ie,m=new ie,y=new A,v=new A;function g(B,V,L){u.fromArray(i,3*B),d.fromArray(i,3*V),p.fromArray(i,3*L),f.fromArray(a,2*B),_.fromArray(a,2*V),m.fromArray(a,2*L),d.sub(u),p.sub(u),_.sub(f),m.sub(f);let O=1/(_.x*m.y-m.x*_.y);isFinite(O)&&(y.copy(d).multiplyScalar(m.y).addScaledVector(p,-_.y).multiplyScalar(O),v.copy(p).multiplyScalar(_.x).addScaledVector(d,-m.x).multiplyScalar(O),c[B].add(y),c[V].add(y),c[L].add(y),h[B].add(v),h[V].add(v),h[L].add(v))}let M=this.groups;M.length===0&&(M=[{start:0,count:n.length}]);for(let B=0,V=M.length;B<V;++B){let L=M[B],O=L.start;for(let k=O,Q=O+L.count;k<Q;k+=3)g(n[k+0],n[k+1],n[k+2])}let T=new A,w=new A,R=new A,I=new A;function P(B){R.fromArray(r,3*B),I.copy(R);let V=c[B];T.copy(V),T.sub(R.multiplyScalar(R.dot(V))).normalize(),w.crossVectors(I,V);let L=w.dot(h[B])<0?-1:1;l[4*B]=T.x,l[4*B+1]=T.y,l[4*B+2]=T.z,l[4*B+3]=L}for(let B=0,V=M.length;B<V;++B){let L=M[B],O=L.start;for(let k=O,Q=O+L.count;k<Q;k+=3)P(n[k+0]),P(n[k+1]),P(n[k+2])}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Rt(new Float32Array(3*t.count),3),this.setAttribute("normal",n);else for(let d=0,p=n.count;d<p;d++)n.setXYZ(d,0,0,0);let i=new A,r=new A,a=new A,o=new A,l=new A,c=new A,h=new A,u=new A;if(e)for(let d=0,p=e.count;d<p;d+=3){let f=e.getX(d+0),_=e.getX(d+1),m=e.getX(d+2);i.fromBufferAttribute(t,f),r.fromBufferAttribute(t,_),a.fromBufferAttribute(t,m),h.subVectors(a,r),u.subVectors(i,r),h.cross(u),o.fromBufferAttribute(n,f),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,m),o.add(h),l.add(h),c.add(h),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,p=t.count;d<p;d+=3)i.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),h.subVectors(a,r),u.subVectors(i,r),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)ft.fromBufferAttribute(e,t),ft.normalize(),e.setXYZ(t,ft.x,ft.y,ft.z)}toNonIndexed(){function e(o,l){let c=o.array,h=o.itemSize,u=o.normalized,d=new c.constructor(l.length*h),p=0,f=0;for(let _=0,m=l.length;_<m;_++){p=o.isInterleavedBufferAttribute?l[_]*o.data.stride+o.offset:l[_]*h;for(let y=0;y<h;y++)d[f++]=c[p++]}return new Rt(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new s,n=this.index.array,i=this.attributes;for(let o in i){let l=e(i[o],n);t.setAttribute(o,l)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,u=c.length;h<u;h++){let d=e(c[h],n);l.push(d)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let i={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){let p=c[u];h.push(p.toJSON(e.data))}h.length>0&&(i[l]=h,r=!0)}r&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone(t));let i=e.attributes;for(let c in i){let h=i[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],u=r[c];for(let d=0,p=u.length;d<p;d++)h.push(u[d].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,h=a.length;c<h;c++){let u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},au=new Ce,ci=new Un,kr=new _n,ou=new A,$i=new A,ji=new A,Xi=new A,Ko=new A,zr=new A,Hr=new ie,Gr=new ie,Wr=new ie,lu=new A,cu=new A,hu=new A,Vr=new A,$r=new A,ge=class extends ot{constructor(e=new Ye,t=new On){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,r=n.length;i<r;i++){let a=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=i}}}}getVertexPosition(e,t){let n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(i,e);let o=this.morphTargetInfluences;if(r&&o){zr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],u=r[l];h!==0&&(Ko.fromBufferAttribute(u,e),a?zr.addScaledVector(Ko,h):zr.addScaledVector(Ko.sub(t),h))}t.add(zr)}return t}raycast(e,t){let n=this.geometry,i=this.material,r=this.matrixWorld;if(i!==void 0){if(n.boundingSphere===null&&n.computeBoundingSphere(),kr.copy(n.boundingSphere),kr.applyMatrix4(r),ci.copy(e.ray).recast(e.near),kr.containsPoint(ci.origin)===!1&&(ci.intersectSphere(kr,ou)===null||ci.origin.distanceToSquared(ou)>(e.far-e.near)**2))return;au.copy(r).invert(),ci.copy(e.ray).applyMatrix4(au),n.boundingBox!==null&&ci.intersectsBox(n.boundingBox)===!1||this._computeIntersections(e,t,ci)}}_computeIntersections(e,t,n){let i,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,p=r.drawRange;if(o!==null)if(Array.isArray(a))for(let f=0,_=d.length;f<_;f++){let m=d[f],y=a[m.materialIndex];for(let v=Math.max(m.start,p.start),g=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));v<g;v+=3)i=jr(this,y,e,n,c,h,u,o.getX(v),o.getX(v+1),o.getX(v+2)),i&&(i.faceIndex=Math.floor(v/3),i.face.materialIndex=m.materialIndex,t.push(i))}else for(let f=Math.max(0,p.start),_=Math.min(o.count,p.start+p.count);f<_;f+=3)i=jr(this,a,e,n,c,h,u,o.getX(f),o.getX(f+1),o.getX(f+2)),i&&(i.faceIndex=Math.floor(f/3),t.push(i));else if(l!==void 0)if(Array.isArray(a))for(let f=0,_=d.length;f<_;f++){let m=d[f],y=a[m.materialIndex];for(let v=Math.max(m.start,p.start),g=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));v<g;v+=3)i=jr(this,y,e,n,c,h,u,v,v+1,v+2),i&&(i.faceIndex=Math.floor(v/3),i.face.materialIndex=m.materialIndex,t.push(i))}else for(let f=Math.max(0,p.start),_=Math.min(l.count,p.start+p.count);f<_;f+=3)i=jr(this,a,e,n,c,h,u,f,f+1,f+2),i&&(i.faceIndex=Math.floor(f/3),t.push(i))}};$e=class s extends Ye{constructor(e=1,t=1,n=1,i=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:r,depthSegments:a};let o=this;i=Math.floor(i),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],u=[],d=0,p=0;function f(_,m,y,v,g,M,T,w,R,I,P){let B=M/R,V=T/I,L=M/2,O=T/2,k=w/2,Q=R+1,oe=I+1,J=0,j=0,Y=new A;for(let z=0;z<oe;z++){let Z=z*V-O;for(let ce=0;ce<Q;ce++){let x=ce*B-L;Y[_]=x*v,Y[m]=Z*g,Y[y]=k,c.push(Y.x,Y.y,Y.z),Y[_]=0,Y[m]=0,Y[y]=w>0?1:-1,h.push(Y.x,Y.y,Y.z),u.push(ce/R),u.push(1-z/I),J+=1}}for(let z=0;z<I;z++)for(let Z=0;Z<R;Z++){let ce=d+Z+Q*z,x=d+Z+Q*(z+1),S=d+(Z+1)+Q*(z+1),U=d+(Z+1)+Q*z;l.push(ce,x,U),l.push(x,S,U),j+=6}o.addGroup(p,j,P),p+=j,d+=J}f("z","y","x",-1,-1,n,t,e,a,r,0),f("z","y","x",1,-1,n,t,-e,a,r,1),f("x","z","y",1,1,e,n,t,i,a,2),f("x","z","y",1,-1,e,n,-t,i,a,3),f("x","y","z",1,-1,e,t,n,i,r,4),f("x","y","z",-1,-1,e,t,-n,i,r,5),this.setIndex(l),this.setAttribute("position",new we(c,3)),this.setAttribute("normal",new we(h,3)),this.setAttribute("uv",new we(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};Zp={clone:hs,merge:Tt},Fn=class extends an{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,this.fragmentShader=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=hs(e.uniforms),this.uniformsGroups=function(t){let n=[];for(let i=0;i<t.length;i++)n.push(t[i].clone());return n}(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let i in this.uniforms){let r=this.uniforms[i].value;r&&r.isTexture?t.uniforms[i]={type:"t",value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[i]={type:"c",value:r.getHex()}:r&&r.isVector2?t.uniforms[i]={type:"v2",value:r.toArray()}:r&&r.isVector3?t.uniforms[i]={type:"v3",value:r.toArray()}:r&&r.isVector4?t.uniforms[i]={type:"v4",value:r.toArray()}:r&&r.isMatrix3?t.uniforms[i]={type:"m3",value:r.toArray()}:r&&r.isMatrix4?t.uniforms[i]={type:"m4",value:r.toArray()}:t.uniforms[i]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},Ws=class extends ot{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ce,this.projectionMatrix=new Ce,this.projectionMatrixInverse=new Ce,this.coordinateSystem=cs}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Mt=class extends Ws{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=2*zs*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(.5*ns*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return 2*zs*Math.atan(Math.tan(.5*ns*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,n,i,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(.5*ns*this.fov)/this.zoom,n=2*t,i=this.aspect*n,r=-.5*i,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*i/l,t-=a.offsetY*n/c,i*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},qi=-90,Al=class extends ot{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let i=new Mt(qi,1,e,t);i.layers=this.layers,this.add(i);let r=new Mt(qi,1,e,t);r.layers=this.layers,this.add(r);let a=new Mt(qi,1,e,t);a.layers=this.layers,this.add(a);let o=new Mt(qi,1,e,t);o.layers=this.layers,this.add(o);let l=new Mt(qi,1,e,t);l.layers=this.layers,this.add(l);let c=new Mt(qi,1,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,i,r,a,o,l]=t;for(let c of t)this.remove(c);if(e===cs)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else{if(e!==ga)throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1)}for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),f=e.xr.enabled;e.xr.enabled=!1;let _=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,i),e.render(t,r),e.setRenderTarget(n,1,i),e.render(t,a),e.setRenderTarget(n,2,i),e.render(t,o),e.setRenderTarget(n,3,i),e.render(t,l),e.setRenderTarget(n,4,i),e.render(t,c),n.texture.generateMipmaps=_,e.setRenderTarget(n,5,i),e.render(t,h),e.setRenderTarget(u,d,p),e.xr.enabled=f,n.texture.needsPMREMUpdate=!0}},wa=class extends Ot{constructor(e,t,n,i,r,a,o,l,c,h){super(e=e!==void 0?e:[],t=t!==void 0?t:rs,n,i,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Rl=class extends Nn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];t.encoding!==void 0&&(Ns("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),t.colorSpace=t.encoding===vi?at:dn),this.texture=new wa(i,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0&&t.generateMipmaps,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:nn}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new $e(5,5,5),r=new Fn({name:"CubemapFromEquirect",uniforms:hs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:It,blending:0});r.uniforms.tEquirect.value=t;let a=new ge(i,r),o=t.minFilter;return t.minFilter===ha&&(t.minFilter=nn),new Al(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,n,i){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,i);e.setRenderTarget(r)}},Qo=new A,Jp=new A,Kp=new Fe,sn=class{constructor(e=new A(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let i=Qo.subVectors(n,t).cross(Jp.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(Qo),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/i;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Kp.getNormalMatrix(e),i=this.coplanarPoint(Qo).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},hi=new _n,Xr=new A,us=class{constructor(e=new sn,t=new sn,n=new sn,i=new sn,r=new sn,a=new sn){this.planes=[e,t,n,i,r,a]}set(e,t,n,i,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(i),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=2e3){let n=this.planes,i=e.elements,r=i[0],a=i[1],o=i[2],l=i[3],c=i[4],h=i[5],u=i[6],d=i[7],p=i[8],f=i[9],_=i[10],m=i[11],y=i[12],v=i[13],g=i[14],M=i[15];if(n[0].setComponents(l-r,d-c,m-p,M-y).normalize(),n[1].setComponents(l+r,d+c,m+p,M+y).normalize(),n[2].setComponents(l+a,d+h,m+f,M+v).normalize(),n[3].setComponents(l-a,d-h,m-f,M-v).normalize(),n[4].setComponents(l-o,d-u,m-_,M-g).normalize(),t===cs)n[5].setComponents(l+o,d+u,m+_,M+g).normalize();else{if(t!==ga)throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);n[5].setComponents(o,u,_,g).normalize()}return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),hi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),hi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(hi)}intersectsSprite(e){return hi.center.set(0,0,0),hi.radius=.7071067811865476,hi.applyMatrix4(e.matrixWorld),this.intersectsSphere(hi)}intersectsSphere(e){let t=this.planes,n=e.center,i=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let i=t[n];if(Xr.x=i.normal.x>0?e.max.x:e.min.x,Xr.y=i.normal.y>0?e.max.y:e.min.y,Xr.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(Xr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};Bn=class s extends Ye{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};let r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(i),c=o+1,h=l+1,u=e/o,d=t/l,p=[],f=[],_=[],m=[];for(let y=0;y<h;y++){let v=y*d-a;for(let g=0;g<c;g++){let M=g*u-r;f.push(M,-v,0),_.push(0,0,1),m.push(g/o),m.push(1-y/l)}}for(let y=0;y<l;y++)for(let v=0;v<o;v++){let g=v+c*y,M=v+c*(y+1),T=v+1+c*(y+1),w=v+1+c*y;p.push(g,M,w),p.push(M,T,w)}this.setIndex(p),this.setAttribute("position",new we(f,3)),this.setAttribute("normal",new we(_,3)),this.setAttribute("uv",new we(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.width,e.height,e.widthSegments,e.heightSegments)}},Ie={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	attribute float batchId;
	uniform highp sampler2D batchingTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
	}
	#pragma unroll_loop_end
	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
		bool clipped = true;
		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
		}
		#pragma unroll_loop_end
		if ( clipped ) discard;
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,cube_uv_reflection_fragment:`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:"gl_FragColor = linearToOutputTexel( gl_FragColor );",colorspace_pars_fragment:`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_fragment:`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color *= toneMappingExposure;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	return color;
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,distanceRGBA_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distanceRGBA_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},le={common:{diffuse:{value:new Ae(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Fe},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Fe}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Fe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Fe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Fe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Fe},normalScale:{value:new ie(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Fe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Fe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Fe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Fe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ae(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ae(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0},uvTransform:{value:new Fe}},sprite:{diffuse:{value:new Ae(16777215)},opacity:{value:1},center:{value:new ie(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Fe},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0}}},hn={basic:{uniforms:Tt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.fog]),vertexShader:Ie.meshbasic_vert,fragmentShader:Ie.meshbasic_frag},lambert:{uniforms:Tt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Ae(0)}}]),vertexShader:Ie.meshlambert_vert,fragmentShader:Ie.meshlambert_frag},phong:{uniforms:Tt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Ae(0)},specular:{value:new Ae(1118481)},shininess:{value:30}}]),vertexShader:Ie.meshphong_vert,fragmentShader:Ie.meshphong_frag},standard:{uniforms:Tt([le.common,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.roughnessmap,le.metalnessmap,le.fog,le.lights,{emissive:{value:new Ae(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ie.meshphysical_vert,fragmentShader:Ie.meshphysical_frag},toon:{uniforms:Tt([le.common,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.gradientmap,le.fog,le.lights,{emissive:{value:new Ae(0)}}]),vertexShader:Ie.meshtoon_vert,fragmentShader:Ie.meshtoon_frag},matcap:{uniforms:Tt([le.common,le.bumpmap,le.normalmap,le.displacementmap,le.fog,{matcap:{value:null}}]),vertexShader:Ie.meshmatcap_vert,fragmentShader:Ie.meshmatcap_frag},points:{uniforms:Tt([le.points,le.fog]),vertexShader:Ie.points_vert,fragmentShader:Ie.points_frag},dashed:{uniforms:Tt([le.common,le.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ie.linedashed_vert,fragmentShader:Ie.linedashed_frag},depth:{uniforms:Tt([le.common,le.displacementmap]),vertexShader:Ie.depth_vert,fragmentShader:Ie.depth_frag},normal:{uniforms:Tt([le.common,le.bumpmap,le.normalmap,le.displacementmap,{opacity:{value:1}}]),vertexShader:Ie.meshnormal_vert,fragmentShader:Ie.meshnormal_frag},sprite:{uniforms:Tt([le.sprite,le.fog]),vertexShader:Ie.sprite_vert,fragmentShader:Ie.sprite_frag},background:{uniforms:{uvTransform:{value:new Fe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ie.background_vert,fragmentShader:Ie.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:Ie.backgroundCube_vert,fragmentShader:Ie.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ie.cube_vert,fragmentShader:Ie.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ie.equirect_vert,fragmentShader:Ie.equirect_frag},distanceRGBA:{uniforms:Tt([le.common,le.displacementmap,{referencePosition:{value:new A},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ie.distanceRGBA_vert,fragmentShader:Ie.distanceRGBA_frag},shadow:{uniforms:Tt([le.lights,le.fog,{color:{value:new Ae(0)},opacity:{value:1}}]),vertexShader:Ie.shadow_vert,fragmentShader:Ie.shadow_frag}};hn.physical={uniforms:Tt([hn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Fe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Fe},clearcoatNormalScale:{value:new ie(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Fe},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Fe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Fe},sheen:{value:0},sheenColor:{value:new Ae(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Fe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Fe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Fe},transmissionSamplerSize:{value:new ie},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Fe},attenuationDistance:{value:0},attenuationColor:{value:new Ae(0)},specularColor:{value:new Ae(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Fe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Fe},anisotropyVector:{value:new ie},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Fe}}]),vertexShader:Ie.meshphysical_vert,fragmentShader:Ie.meshphysical_frag};qr={r:0,b:0,g:0};Ea=class extends Ws{constructor(e=-1,t=1,n=1,i=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2,r=n-e,a=n+e,o=i+t,l=i-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},uu=[.125,.215,.35,.446,.526,.582],Rs=20,el=new Ea,du=new Ae,tl=null,nl=0,il=0,ui=(1+Math.sqrt(5))/2,Yi=1/ui,pu=[new A(1,1,1),new A(-1,1,1),new A(1,1,-1),new A(-1,1,-1),new A(0,ui,Yi),new A(0,ui,-Yi),new A(Yi,0,ui),new A(-Yi,0,ui),new A(ui,Yi,0),new A(-ui,Yi,0)],Ta=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,i=100){tl=this._renderer.getRenderTarget(),nl=this._renderer.getActiveCubeFace(),il=this._renderer.getActiveMipmapLevel(),this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,n,i,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=gu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=fu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(tl,nl,il),e.scissorTest=!1,Yr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===rs||e.mapping===as?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),tl=this._renderer.getRenderTarget(),nl=this._renderer.getActiveCubeFace(),il=this._renderer.getActiveMipmapLevel();let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:nn,minFilter:nn,generateMipmaps:!1,type:ks,format:un,colorSpace:Dn,depthBuffer:!1},i=mu(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=mu(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=function(a){let o=[],l=[],c=[],h=a,u=a-4+1+uu.length;for(let d=0;d<u;d++){let p=Math.pow(2,h);l.push(p);let f=1/p;d>a-4?f=uu[d-a+4-1]:d===0&&(f=0),c.push(f);let _=1/(p-2),m=-_,y=1+_,v=[m,m,y,m,y,y,m,m,y,y,m,y],g=6,M=6,T=3,w=2,R=1,I=new Float32Array(T*M*g),P=new Float32Array(w*M*g),B=new Float32Array(R*M*g);for(let L=0;L<g;L++){let O=L%3*2/3-1,k=L>2?0:-1,Q=[O,k,0,O+2/3,k,0,O+2/3,k+1,0,O,k,0,O+2/3,k+1,0,O,k+1,0];I.set(Q,T*M*L),P.set(v,w*M*L);let oe=[L,L,L,L,L,L];B.set(oe,R*M*L)}let V=new Ye;V.setAttribute("position",new Rt(I,T)),V.setAttribute("uv",new Rt(P,w)),V.setAttribute("faceIndex",new Rt(B,R)),o.push(V),h>4&&h--}return{lodPlanes:o,sizeLods:l,sigmas:c}}(r)),this._blurMaterial=function(a,o,l){let c=new Float32Array(Rs),h=new A(0,1,0);return new Fn({name:"SphericalGaussianBlur",defines:{n:Rs,CUBEUV_TEXEL_WIDTH:1/o,CUBEUV_TEXEL_HEIGHT:1/l,CUBEUV_MAX_MIP:`${a}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:c},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:h}},vertexShader:Tc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}(r,e,t)}return i}_compileMaterial(e){let t=new ge(this._lodPlanes[0],e);this._renderer.compile(t,el)}_sceneToCubeUV(e,t,n,i){let r=new Mt(90,1,t,n),a=[1,-1,1,1,1,1],o=[1,1,1,-1,-1,-1],l=this._renderer,c=l.autoClear,h=l.toneMapping;l.getClearColor(du),l.toneMapping=ti,l.autoClear=!1;let u=new On({name:"PMREM.Background",side:It,depthWrite:!1,depthTest:!1}),d=new ge(new $e,u),p=!1,f=e.background;f?f.isColor&&(u.color.copy(f),e.background=null,p=!0):(u.color.copy(du),p=!0);for(let _=0;_<6;_++){let m=_%3;m===0?(r.up.set(0,a[_],0),r.lookAt(o[_],0,0)):m===1?(r.up.set(0,0,a[_]),r.lookAt(0,o[_],0)):(r.up.set(0,a[_],0),r.lookAt(0,0,o[_]));let y=this._cubeSize;Yr(i,m*y,_>2?y:0,y,y),l.setRenderTarget(i),p&&l.render(d,r),l.render(e,r)}d.geometry.dispose(),d.material.dispose(),l.toneMapping=h,l.autoClear=c,e.background=f}_textureToCubeUV(e,t){let n=this._renderer,i=e.mapping===rs||e.mapping===as;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=gu()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=fu());let r=i?this._cubemapMaterial:this._equirectMaterial,a=new ge(this._lodPlanes[0],r);r.uniforms.envMap.value=e;let o=this._cubeSize;Yr(t,0,0,3*o,2*o),n.setRenderTarget(t),n.render(a,el)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;for(let i=1;i<this._lodPlanes.length;i++){let r=Math.sqrt(this._sigmas[i]*this._sigmas[i]-this._sigmas[i-1]*this._sigmas[i-1]),a=pu[(i-1)%pu.length];this._blur(e,i-1,i,r,a)}t.autoClear=n}_blur(e,t,n,i,r){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,i,"latitudinal",r),this._halfBlur(a,e,n,n,i,"longitudinal",r)}_halfBlur(e,t,n,i,r,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=new ge(this._lodPlanes[i],c),u=c.uniforms,d=this._sizeLods[n]-1,p=isFinite(r)?Math.PI/(2*d):2*Math.PI/39,f=r/p,_=isFinite(r)?1+Math.floor(3*f):Rs;_>Rs&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${_} samples when the maximum is set to 20`);let m=[],y=0;for(let M=0;M<Rs;++M){let T=M/f,w=Math.exp(-T*T/2);m.push(w),M===0?y+=w:M<_&&(y+=2*w)}for(let M=0;M<m.length;M++)m[M]=m[M]/y;u.envMap.value=e.texture,u.samples.value=_,u.weights.value=m,u.latitudinal.value=a==="latitudinal",o&&(u.poleAxis.value=o);let{_lodMax:v}=this;u.dTheta.value=p,u.mipInt.value=v-n;let g=this._sizeLods[i];Yr(t,3*g*(i>v-4?i-v+4:0),4*(this._cubeSize-g),3*g,2*g),l.setRenderTarget(t),l.render(h,el)}};Aa=class extends Ot{constructor(e,t,n,i,r,a,o,l,c,h){if((h=h!==void 0?h:_i)!==_i&&h!==ls)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===_i&&(n=Kn),n===void 0&&h===ls&&(n=gi),super(null,i,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:At,this.minFilter=l!==void 0?l:At,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},_d=new Ot,vd=new Aa(1,1);vd.compareFunction=515;yd=new xa,xd=new Tl,bd=new wa,_u=[],vu=[],yu=new Float32Array(16),xu=new Float32Array(9),bu=new Float32Array(4);Cl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=function(i){switch(i){case 5126:return fm;case 35664:return gm;case 35665:return _m;case 35666:return vm;case 35674:return ym;case 35675:return xm;case 35676:return bm;case 5124:case 35670:return Mm;case 35667:case 35671:return Sm;case 35668:case 35672:return wm;case 35669:case 35673:return Em;case 5125:return Tm;case 36294:return Am;case 36295:return Rm;case 36296:return Cm;case 35678:case 36198:case 36298:case 36306:case 35682:return Lm;case 35679:case 36299:case 36307:return Pm;case 35680:case 36300:case 36308:case 36293:return Im;case 36289:case 36303:case 36311:case 36292:return Dm}}(t.type)}},Ll=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=function(i){switch(i){case 5126:return Nm;case 35664:return Um;case 35665:return Om;case 35666:return Fm;case 35674:return Bm;case 35675:return km;case 35676:return zm;case 5124:case 35670:return Hm;case 35667:case 35671:return Gm;case 35668:case 35672:return Wm;case 35669:case 35673:return Vm;case 5125:return $m;case 36294:return jm;case 36295:return Xm;case 36296:return qm;case 35678:case 36198:case 36298:case 36306:case 35682:return Ym;case 35679:case 36299:case 36307:return Zm;case 35680:case 36300:case 36308:case 36293:return Jm;case 36289:case 36303:case 36311:case 36292:return Km}}(t.type)}},Pl=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let i=this.seq;for(let r=0,a=i.length;r!==a;++r){let o=i[r];o.setValue(e,t[o.id],n)}}},sl=/(\w+)(\])?(\[|\.)?/g;ss=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){let r=e.getActiveUniform(t,i);Qm(r,e.getUniformLocation(t,r.name),this)}}setValue(e,t,n,i){let r=this.map[t];r!==void 0&&r.setValue(e,n,i)}setOptional(e,t,n){let i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let r=0,a=t.length;r!==a;++r){let o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,i)}}static seqWithValue(e,t){let n=[];for(let i=0,r=e.length;i!==r;++i){let a=e[i];a.id in t&&n.push(a)}return n}};ef=37297,tf=0;rf=/^[ \t]*#include +<([\w\d./]+)>/gm;af=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);lf=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;uf=0,Dl=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,i=this._getShaderStage(t),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(i)===!1&&(a.add(i),i.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Nl(e),t.set(e,n)),n}},Nl=class{constructor(e){this.id=uf++,this.code=e,this.usedTimes=0}};_f=0;Ul=class extends an{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Ol=class extends an{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};Fl=class extends Mt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},st=class extends ot{constructor(){super(),this.isGroup=!0,this.type="Group"}},Ef={type:"move"},Us=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new st,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new st,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new A,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new A),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new st,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new A,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new A),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let _ of e.hand.values()){let m=t.getJointPose(_,n),y=this._getHandJoint(c,_);m!==null&&(y.matrix.fromArray(m.transform.matrix),y.matrix.decompose(y.position,y.rotation,y.scale),y.matrixWorldNeedsUpdate=!0,y.jointRadius=m.radius),y.visible=m!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),p=.02,f=.005;c.inputState.pinching&&d>p+f?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=p-f&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Ef)))}return o!==null&&(o.visible=i!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new st;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Bl=class extends fn{constructor(e,t){super();let n=this,i=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,d=null,p=null,f=null,_=t.getContextAttributes(),m=null,y=null,v=[],g=[],M=new ie,T=null,w=new Mt;w.layers.enable(1),w.viewport=new Je;let R=new Mt;R.layers.enable(2),R.viewport=new Je;let I=[w,R],P=new Fl;P.layers.enable(1),P.layers.enable(2);let B=null,V=null;function L(z){let Z=g.indexOf(z.inputSource);if(Z===-1)return;let ce=v[Z];ce!==void 0&&(ce.update(z.inputSource,z.frame,c||a),ce.dispatchEvent({type:z.type,data:z.inputSource}))}function O(){i.removeEventListener("select",L),i.removeEventListener("selectstart",L),i.removeEventListener("selectend",L),i.removeEventListener("squeeze",L),i.removeEventListener("squeezestart",L),i.removeEventListener("squeezeend",L),i.removeEventListener("end",O),i.removeEventListener("inputsourceschange",k);for(let z=0;z<v.length;z++){let Z=g[z];Z!==null&&(g[z]=null,v[z].disconnect(Z))}B=null,V=null,e.setRenderTarget(m),p=null,d=null,u=null,i=null,y=null,Y.stop(),n.isPresenting=!1,e.setPixelRatio(T),e.setSize(M.width,M.height,!1),n.dispatchEvent({type:"sessionend"})}function k(z){for(let Z=0;Z<z.removed.length;Z++){let ce=z.removed[Z],x=g.indexOf(ce);x>=0&&(g[x]=null,v[x].disconnect(ce))}for(let Z=0;Z<z.added.length;Z++){let ce=z.added[Z],x=g.indexOf(ce);if(x===-1){for(let U=0;U<v.length;U++){if(U>=g.length){g.push(ce),x=U;break}if(g[U]===null){g[U]=ce,x=U;break}}if(x===-1)break}let S=v[x];S&&S.connect(ce)}}this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(z){let Z=v[z];return Z===void 0&&(Z=new Us,v[z]=Z),Z.getTargetRaySpace()},this.getControllerGrip=function(z){let Z=v[z];return Z===void 0&&(Z=new Us,v[z]=Z),Z.getGripSpace()},this.getHand=function(z){let Z=v[z];return Z===void 0&&(Z=new Us,v[z]=Z),Z.getHandSpace()},this.setFramebufferScaleFactor=function(z){r=z,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(z){o=z,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(z){c=z},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return u},this.getFrame=function(){return f},this.getSession=function(){return i},this.setSession=async function(z){if(i=z,i!==null){if(m=e.getRenderTarget(),i.addEventListener("select",L),i.addEventListener("selectstart",L),i.addEventListener("selectend",L),i.addEventListener("squeeze",L),i.addEventListener("squeezestart",L),i.addEventListener("squeezeend",L),i.addEventListener("end",O),i.addEventListener("inputsourceschange",k),_.xrCompatible!==!0&&await t.makeXRCompatible(),T=e.getPixelRatio(),e.getSize(M),i.renderState.layers===void 0||e.capabilities.isWebGL2===!1){let Z={antialias:i.renderState.layers!==void 0||_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(i,t,Z),i.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),y=new Nn(p.framebufferWidth,p.framebufferHeight,{format:un,type:fi,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil})}else{let Z=null,ce=null,x=null;_.depth&&(x=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Z=_.stencil?ls:_i,ce=_.stencil?gi:Kn);let S={colorFormat:t.RGBA8,depthFormat:x,scaleFactor:r};u=new XRWebGLBinding(i,t),d=u.createProjectionLayer(S),i.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new Nn(d.textureWidth,d.textureHeight,{format:un,type:fi,depthTexture:new Aa(d.textureWidth,d.textureHeight,ce,void 0,void 0,void 0,void 0,void 0,void 0,Z),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0}),e.properties.get(y).__ignoreDepthValues=d.ignoreDepthValues}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await i.requestReferenceSpace(o),Y.setContext(i),Y.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode};let Q=new A,oe=new A;function J(z,Z){Z===null?z.matrixWorld.copy(z.matrix):z.matrixWorld.multiplyMatrices(Z.matrixWorld,z.matrix),z.matrixWorldInverse.copy(z.matrixWorld).invert()}this.updateCamera=function(z){if(i===null)return;P.near=R.near=w.near=z.near,P.far=R.far=w.far=z.far,B===P.near&&V===P.far||(i.updateRenderState({depthNear:P.near,depthFar:P.far}),B=P.near,V=P.far);let Z=z.parent,ce=P.cameras;J(P,Z);for(let x=0;x<ce.length;x++)J(ce[x],Z);ce.length===2?function(x,S,U){Q.setFromMatrixPosition(S.matrixWorld),oe.setFromMatrixPosition(U.matrixWorld);let X=Q.distanceTo(oe),D=S.projectionMatrix.elements,q=U.projectionMatrix.elements,N=D[14]/(D[10]-1),F=D[14]/(D[10]+1),H=(D[9]+1)/D[5],te=(D[9]-1)/D[5],ee=(D[8]-1)/D[0],E=(q[8]+1)/q[0],se=N*ee,G=N*E,W=X/(-ee+E),re=W*-ee;S.matrixWorld.decompose(x.position,x.quaternion,x.scale),x.translateX(re),x.translateZ(W),x.matrixWorld.compose(x.position,x.quaternion,x.scale),x.matrixWorldInverse.copy(x.matrixWorld).invert();let he=N+W,de=F+W,pe=se-re,Se=G+(X-re),me=H*F/de*he,_e=te*F/de*he;x.projectionMatrix.makePerspective(pe,Se,me,_e,he,de),x.projectionMatrixInverse.copy(x.projectionMatrix).invert()}(P,w,R):P.projectionMatrix.copy(w.projectionMatrix),function(x,S,U){U===null?x.matrix.copy(S.matrixWorld):(x.matrix.copy(U.matrixWorld),x.matrix.invert(),x.matrix.multiply(S.matrixWorld)),x.matrix.decompose(x.position,x.quaternion,x.scale),x.updateMatrixWorld(!0),x.projectionMatrix.copy(S.projectionMatrix),x.projectionMatrixInverse.copy(S.projectionMatrixInverse),x.isPerspectiveCamera&&(x.fov=2*zs*Math.atan(1/x.projectionMatrix.elements[5]),x.zoom=1)}(z,P,Z)},this.getCamera=function(){return P},this.getFoveation=function(){if(d!==null||p!==null)return l},this.setFoveation=function(z){l=z,d!==null&&(d.fixedFoveation=z),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=z)};let j=null,Y=new gd;Y.setAnimationLoop(function(z,Z){if(h=Z.getViewerPose(c||a),f=Z,h!==null){let ce=h.views;p!==null&&(e.setRenderTargetFramebuffer(y,p.framebuffer),e.setRenderTarget(y));let x=!1;ce.length!==P.cameras.length&&(P.cameras.length=0,x=!0);for(let S=0;S<ce.length;S++){let U=ce[S],X=null;if(p!==null)X=p.getViewport(U);else{let q=u.getViewSubImage(d,U);X=q.viewport,S===0&&(e.setRenderTargetTextures(y,q.colorTexture,d.ignoreDepthValues?void 0:q.depthStencilTexture),e.setRenderTarget(y))}let D=I[S];D===void 0&&(D=new Mt,D.layers.enable(S),D.viewport=new Je,I[S]=D),D.matrix.fromArray(U.transform.matrix),D.matrix.decompose(D.position,D.quaternion,D.scale),D.projectionMatrix.fromArray(U.projectionMatrix),D.projectionMatrixInverse.copy(D.projectionMatrix).invert(),D.viewport.set(X.x,X.y,X.width,X.height),S===0&&(P.matrix.copy(D.matrix),P.matrix.decompose(P.position,P.quaternion,P.scale)),x===!0&&P.cameras.push(D)}}for(let ce=0;ce<v.length;ce++){let x=g[ce],S=v[ce];x!==null&&S!==void 0&&S.update(x,Z,c||a)}j&&j(z,Z),Z.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Z}),f=null}),this.setAnimationLoop=function(z){j=z},this.dispose=function(){}}};Vs=class{constructor(e={}){let{canvas:t=Up(),context:n=null,depth:i=!0,stencil:r=!0,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1}=e,d;this.isWebGLRenderer=!0,d=n!==null?n.getContextAttributes().alpha:a;let p=new Uint32Array(4),f=new Int32Array(4),_=null,m=null,y=[],v=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=at,this._useLegacyLights=!1,this.toneMapping=ti,this.toneMappingExposure=1;let g=this,M=!1,T=0,w=0,R=null,I=-1,P=null,B=new Je,V=new Je,L=null,O=new Ae(0),k=0,Q=t.width,oe=t.height,J=1,j=null,Y=null,z=new Je(0,0,Q,oe),Z=new Je(0,0,Q,oe),ce=!1,x=new us,S=!1,U=!1,X=null,D=new Ce,q=new ie,N=new A,F={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function H(){return R===null?J:1}let te,ee,E,se,G,W,re,he,de,pe,Se,me,_e,Le,lt,ve,Ne,Ue,Ti,yn,Ai,Ct,_t,Dt,b=n;function fe(C,$){for(let K=0;K<C.length;K++){let ae=C[K],ne=t.getContext(ae,$);if(ne!==null)return ne}return null}try{let C={alpha:!0,depth:i,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${fl}`),t.addEventListener("webglcontextlost",mt,!1),t.addEventListener("webglcontextrestored",jt,!1),t.addEventListener("webglcontextcreationerror",St,!1),b===null){let $=["webgl2","webgl","experimental-webgl"];if(g.isWebGL1Renderer===!0&&$.shift(),b=fe($,C),b===null)throw fe($)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&b instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),b.getShaderPrecisionFormat===void 0&&(b.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(C){throw console.error("THREE.WebGLRenderer: "+C.message),C}function De(){te=new om(b),ee=new im(b,te,e),te.init(ee),Ct=new wf(b,te,ee),E=new Mf(b,te,ee),se=new hm(b),G=new pf,W=new Sf(b,te,E,G,ee,Ct,se),re=new rm(g),he=new am(g),de=new Qp(b,ee),_t=new tm(b,te,de,ee),pe=new lm(b,de,se,_t),Se=new mm(b,pe,de,se),Ti=new pm(b,ee,W),ve=new sm(G),me=new df(g,re,he,te,ee,_t,ve),_e=new Tf(g,G),Le=new ff,lt=new xf(te,ee),Ue=new em(g,re,he,E,Se,d,l),Ne=new bf(g,Se,ee),Dt=new Af(b,se,ee,E),yn=new nm(b,te,se,ee),Ai=new cm(b,te,se,ee),se.programs=me.programs,g.capabilities=ee,g.extensions=te,g.properties=G,g.renderLists=Le,g.shadowMap=Ne,g.state=E,g.info=se}De();let Re=new Bl(g,b);function mt(C){C.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),M=!0}function jt(){console.log("THREE.WebGLRenderer: Context Restored."),M=!1;let C=se.autoReset,$=Ne.enabled,K=Ne.autoUpdate,ae=Ne.needsUpdate,ne=Ne.type;De(),se.autoReset=C,Ne.enabled=$,Ne.autoUpdate=K,Ne.needsUpdate=ae,Ne.type=ne}function St(C){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",C.statusMessage)}function ro(C){let $=C.target;$.removeEventListener("dispose",ro),function(K){(function(ae){let ne=G.get(ae).programs;ne!==void 0&&(ne.forEach(function(ue){me.releaseProgram(ue)}),ae.isShaderMaterial&&me.releaseShaderCache(ae))})(K),G.remove(K)}($)}function rr(C,$,K){C.transparent===!0&&C.side===2&&C.forceSinglePass===!1?(C.side=It,C.needsUpdate=!0,ar(C,$,K),C.side=ii,C.needsUpdate=!0,ar(C,$,K),C.side=2):ar(C,$,K)}this.xr=Re,this.getContext=function(){return b},this.getContextAttributes=function(){return b.getContextAttributes()},this.forceContextLoss=function(){let C=te.get("WEBGL_lose_context");C&&C.loseContext()},this.forceContextRestore=function(){let C=te.get("WEBGL_lose_context");C&&C.restoreContext()},this.getPixelRatio=function(){return J},this.setPixelRatio=function(C){C!==void 0&&(J=C,this.setSize(Q,oe,!1))},this.getSize=function(C){return C.set(Q,oe)},this.setSize=function(C,$,K=!0){Re.isPresenting?console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting."):(Q=C,oe=$,t.width=Math.floor(C*J),t.height=Math.floor($*J),K===!0&&(t.style.width=C+"px",t.style.height=$+"px"),this.setViewport(0,0,C,$))},this.getDrawingBufferSize=function(C){return C.set(Q*J,oe*J).floor()},this.setDrawingBufferSize=function(C,$,K){Q=C,oe=$,J=K,t.width=Math.floor(C*K),t.height=Math.floor($*K),this.setViewport(0,0,C,$)},this.getCurrentViewport=function(C){return C.copy(B)},this.getViewport=function(C){return C.copy(z)},this.setViewport=function(C,$,K,ae){C.isVector4?z.set(C.x,C.y,C.z,C.w):z.set(C,$,K,ae),E.viewport(B.copy(z).multiplyScalar(J).floor())},this.getScissor=function(C){return C.copy(Z)},this.setScissor=function(C,$,K,ae){C.isVector4?Z.set(C.x,C.y,C.z,C.w):Z.set(C,$,K,ae),E.scissor(V.copy(Z).multiplyScalar(J).floor())},this.getScissorTest=function(){return ce},this.setScissorTest=function(C){E.setScissorTest(ce=C)},this.setOpaqueSort=function(C){j=C},this.setTransparentSort=function(C){Y=C},this.getClearColor=function(C){return C.copy(Ue.getClearColor())},this.setClearColor=function(){Ue.setClearColor.apply(Ue,arguments)},this.getClearAlpha=function(){return Ue.getClearAlpha()},this.setClearAlpha=function(){Ue.setClearAlpha.apply(Ue,arguments)},this.clear=function(C=!0,$=!0,K=!0){let ae=0;if(C){let ne=!1;if(R!==null){let ue=R.texture.format;ne=ue===cd||ue===ld||ue===od}if(ne){let ue=R.texture.type,Me=ue===fi||ue===Kn||ue===wc||ue===gi||ue===rd||ue===ad,Ee=Ue.getClearColor(),Oe=Ue.getClearAlpha(),ke=Ee.r,ze=Ee.g,He=Ee.b;Me?(p[0]=ke,p[1]=ze,p[2]=He,p[3]=Oe,b.clearBufferuiv(b.COLOR,0,p)):(f[0]=ke,f[1]=ze,f[2]=He,f[3]=Oe,b.clearBufferiv(b.COLOR,0,f))}else ae|=b.COLOR_BUFFER_BIT}$&&(ae|=b.DEPTH_BUFFER_BIT),K&&(ae|=b.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),b.clear(ae)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",mt,!1),t.removeEventListener("webglcontextrestored",jt,!1),t.removeEventListener("webglcontextcreationerror",St,!1),Le.dispose(),lt.dispose(),G.dispose(),re.dispose(),he.dispose(),Se.dispose(),_t.dispose(),Dt.dispose(),me.dispose(),Re.dispose(),Re.removeEventListener("sessionstart",Bt),Re.removeEventListener("sessionend",kt),X&&(X.dispose(),X=null),Xt.stop()},this.renderBufferDirect=function(C,$,K,ae,ne,ue){$===null&&($=F);let Me=ne.isMesh&&ne.matrixWorld.determinant()<0,Ee=function(ht,zt,Lt,Ge,We){zt.isScene!==!0&&(zt=F),W.resetTextureUnits();let _s=zt.fog,ao=Ge.isMeshStandardMaterial?zt.environment:null,Fd=R===null?g.outputColorSpace:R.isXRRenderTarget===!0?R.texture.colorSpace:Dn,or=(Ge.isMeshStandardMaterial?he:re).get(Ge.envMap||ao),Bd=Ge.vertexColors===!0&&!!Lt.attributes.color&&Lt.attributes.color.itemSize===4,kd=!!Lt.attributes.tangent&&(!!Ge.normalMap||Ge.anisotropy>0),zd=!!Lt.morphAttributes.position,Hd=!!Lt.morphAttributes.normal,Gd=!!Lt.morphAttributes.color,Nc=ti;Ge.toneMapped&&(R!==null&&R.isXRRenderTarget!==!0||(Nc=g.toneMapping));let Uc=Lt.morphAttributes.position||Lt.morphAttributes.normal||Lt.morphAttributes.color,Wd=Uc!==void 0?Uc.length:0,Ve=G.get(Ge),Vd=m.state.lights;if(S===!0&&(U===!0||ht!==P)){let Ht=ht===P&&Ge.id===I;ve.setState(Ge,ht,Ht)}let Yt=!1;Ge.version===Ve.__version?Ve.needsLights&&Ve.lightsStateVersion!==Vd.state.version||Ve.outputColorSpace!==Fd||We.isBatchedMesh&&Ve.batching===!1?Yt=!0:We.isBatchedMesh||Ve.batching!==!0?We.isInstancedMesh&&Ve.instancing===!1?Yt=!0:We.isInstancedMesh||Ve.instancing!==!0?We.isSkinnedMesh&&Ve.skinning===!1?Yt=!0:We.isSkinnedMesh||Ve.skinning!==!0?We.isInstancedMesh&&Ve.instancingColor===!0&&We.instanceColor===null||We.isInstancedMesh&&Ve.instancingColor===!1&&We.instanceColor!==null||Ve.envMap!==or||Ge.fog===!0&&Ve.fog!==_s?Yt=!0:Ve.numClippingPlanes===void 0||Ve.numClippingPlanes===ve.numPlanes&&Ve.numIntersection===ve.numIntersection?(Ve.vertexAlphas!==Bd||Ve.vertexTangents!==kd||Ve.morphTargets!==zd||Ve.morphNormals!==Hd||Ve.morphColors!==Gd||Ve.toneMapping!==Nc||ee.isWebGL2===!0&&Ve.morphTargetsCount!==Wd)&&(Yt=!0):Yt=!0:Yt=!0:Yt=!0:Yt=!0:(Yt=!0,Ve.__version=Ge.version);let ri=Ve.currentProgram;Yt===!0&&(ri=ar(Ge,zt,We));let Oc=!1,vs=!1,oo=!1,vt=ri.getUniforms(),ai=Ve.uniforms;if(E.useProgram(ri.program)&&(Oc=!0,vs=!0,oo=!0),Ge.id!==I&&(I=Ge.id,vs=!0),Oc||P!==ht){vt.setValue(b,"projectionMatrix",ht.projectionMatrix),vt.setValue(b,"viewMatrix",ht.matrixWorldInverse);let Ht=vt.map.cameraPosition;Ht!==void 0&&Ht.setValue(b,N.setFromMatrixPosition(ht.matrixWorld)),ee.logarithmicDepthBuffer&&vt.setValue(b,"logDepthBufFC",2/(Math.log(ht.far+1)/Math.LN2)),(Ge.isMeshPhongMaterial||Ge.isMeshToonMaterial||Ge.isMeshLambertMaterial||Ge.isMeshBasicMaterial||Ge.isMeshStandardMaterial||Ge.isShaderMaterial)&&vt.setValue(b,"isOrthographic",ht.isOrthographicCamera===!0),P!==ht&&(P=ht,vs=!0,oo=!0)}if(We.isSkinnedMesh){vt.setOptional(b,We,"bindMatrix"),vt.setOptional(b,We,"bindMatrixInverse");let Ht=We.skeleton;Ht&&(ee.floatVertexTextures?(Ht.boneTexture===null&&Ht.computeBoneTexture(),vt.setValue(b,"boneTexture",Ht.boneTexture,W)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}We.isBatchedMesh&&(vt.setOptional(b,We,"batchingTexture"),vt.setValue(b,"batchingTexture",We._matricesTexture,W));let lo=Lt.morphAttributes;(lo.position!==void 0||lo.normal!==void 0||lo.color!==void 0&&ee.isWebGL2===!0)&&Ti.update(We,Lt,ri),(vs||Ve.receiveShadow!==We.receiveShadow)&&(Ve.receiveShadow=We.receiveShadow,vt.setValue(b,"receiveShadow",We.receiveShadow)),Ge.isMeshGouraudMaterial&&Ge.envMap!==null&&(ai.envMap.value=or,ai.flipEnvMap.value=or.isCubeTexture&&or.isRenderTargetTexture===!1?-1:1),vs&&(vt.setValue(b,"toneMappingExposure",g.toneMappingExposure),Ve.needsLights&&(Zt=oo,(on=ai).ambientLightColor.needsUpdate=Zt,on.lightProbe.needsUpdate=Zt,on.directionalLights.needsUpdate=Zt,on.directionalLightShadows.needsUpdate=Zt,on.pointLights.needsUpdate=Zt,on.pointLightShadows.needsUpdate=Zt,on.spotLights.needsUpdate=Zt,on.spotLightShadows.needsUpdate=Zt,on.rectAreaLights.needsUpdate=Zt,on.hemisphereLights.needsUpdate=Zt),_s&&Ge.fog===!0&&_e.refreshFogUniforms(ai,_s),_e.refreshMaterialUniforms(ai,Ge,J,oe,X),ss.upload(b,Ic(Ve),ai,W));var on,Zt;if(Ge.isShaderMaterial&&Ge.uniformsNeedUpdate===!0&&(ss.upload(b,Ic(Ve),ai,W),Ge.uniformsNeedUpdate=!1),Ge.isSpriteMaterial&&vt.setValue(b,"center",We.center),vt.setValue(b,"modelViewMatrix",We.modelViewMatrix),vt.setValue(b,"normalMatrix",We.normalMatrix),vt.setValue(b,"modelMatrix",We.matrixWorld),Ge.isShaderMaterial||Ge.isRawShaderMaterial){let Ht=Ge.uniformsGroups;for(let co=0,$d=Ht.length;co<$d;co++)if(ee.isWebGL2){let Fc=Ht[co];Dt.update(Fc,ri),Dt.bind(Fc,ri)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return ri}(C,$,K,ae,ne);E.setMaterial(ae,Me);let Oe=K.index,ke=1;if(ae.wireframe===!0){if(Oe=pe.getWireframeAttribute(K),Oe===void 0)return;ke=2}let ze=K.drawRange,He=K.attributes.position,et=ze.start*ke,qt=(ze.start+ze.count)*ke;ue!==null&&(et=Math.max(et,ue.start*ke),qt=Math.min(qt,(ue.start+ue.count)*ke)),Oe!==null?(et=Math.max(et,0),qt=Math.min(qt,Oe.count)):He!=null&&(et=Math.max(et,0),qt=Math.min(qt,He.count));let bn=qt-et;if(bn<0||bn===1/0)return;let si;_t.setup(ne,ae,Ee,K,Oe);let tt=yn;if(Oe!==null&&(si=de.get(Oe),tt=Ai,tt.setIndex(si)),ne.isMesh)ae.wireframe===!0?(E.setLineWidth(ae.wireframeLinewidth*H()),tt.setMode(b.LINES)):tt.setMode(b.TRIANGLES);else if(ne.isLine){let ht=ae.linewidth;ht===void 0&&(ht=1),E.setLineWidth(ht*H()),ne.isLineSegments?tt.setMode(b.LINES):ne.isLineLoop?tt.setMode(b.LINE_LOOP):tt.setMode(b.LINE_STRIP)}else ne.isPoints?tt.setMode(b.POINTS):ne.isSprite&&tt.setMode(b.TRIANGLES);if(ne.isBatchedMesh)tt.renderMultiDraw(ne._multiDrawStarts,ne._multiDrawCounts,ne._multiDrawCount);else if(ne.isInstancedMesh)tt.renderInstances(et,bn,ne.count);else if(K.isInstancedBufferGeometry){let ht=K._maxInstanceCount!==void 0?K._maxInstanceCount:1/0,zt=Math.min(K.instanceCount,ht);tt.renderInstances(et,bn,zt)}else tt.render(et,bn)},this.compile=function(C,$,K=null){K===null&&(K=C),m=lt.get(K),m.init(),v.push(m),K.traverseVisible(function(ne){ne.isLight&&ne.layers.test($.layers)&&(m.pushLight(ne),ne.castShadow&&m.pushShadow(ne))}),C!==K&&C.traverseVisible(function(ne){ne.isLight&&ne.layers.test($.layers)&&(m.pushLight(ne),ne.castShadow&&m.pushShadow(ne))}),m.setupLights(g._useLegacyLights);let ae=new Set;return C.traverse(function(ne){let ue=ne.material;if(ue)if(Array.isArray(ue))for(let Me=0;Me<ue.length;Me++){let Ee=ue[Me];rr(Ee,K,ne),ae.add(Ee)}else rr(ue,K,ne),ae.add(ue)}),v.pop(),m=null,ae},this.compileAsync=function(C,$,K=null){let ae=this.compile(C,$,K);return new Promise(ne=>{function ue(){ae.forEach(function(Me){G.get(Me).currentProgram.isReady()&&ae.delete(Me)}),ae.size!==0?setTimeout(ue,10):ne(C)}te.get("KHR_parallel_shader_compile")!==null?ue():setTimeout(ue,10)})};let Ri=null;function Bt(){Xt.stop()}function kt(){Xt.start()}let Xt=new gd;function zn(C,$,K,ae){if(C.visible===!1)return;if(C.layers.test($.layers)){if(C.isGroup)K=C.renderOrder;else if(C.isLOD)C.autoUpdate===!0&&C.update($);else if(C.isLight)m.pushLight(C),C.castShadow&&m.pushShadow(C);else if(C.isSprite){if(!C.frustumCulled||x.intersectsSprite(C)){ae&&N.setFromMatrixPosition(C.matrixWorld).applyMatrix4(D);let ue=Se.update(C),Me=C.material;Me.visible&&_.push(C,ue,Me,K,N.z,null)}}else if((C.isMesh||C.isLine||C.isPoints)&&(!C.frustumCulled||x.intersectsObject(C))){let ue=Se.update(C),Me=C.material;if(ae&&(C.boundingSphere!==void 0?(C.boundingSphere===null&&C.computeBoundingSphere(),N.copy(C.boundingSphere.center)):(ue.boundingSphere===null&&ue.computeBoundingSphere(),N.copy(ue.boundingSphere.center)),N.applyMatrix4(C.matrixWorld).applyMatrix4(D)),Array.isArray(Me)){let Ee=ue.groups;for(let Oe=0,ke=Ee.length;Oe<ke;Oe++){let ze=Ee[Oe],He=Me[ze.materialIndex];He&&He.visible&&_.push(C,ue,He,K,N.z,ze)}}else Me.visible&&_.push(C,ue,Me,K,N.z,null)}}let ne=C.children;for(let ue=0,Me=ne.length;ue<Me;ue++)zn(ne[ue],$,K,ae)}function Hn(C,$,K,ae){let ne=C.opaque,ue=C.transmissive,Me=C.transparent;m.setupLightsView(K),S===!0&&ve.setGlobalState(g.clippingPlanes,K),ue.length>0&&function(Ee,Oe,ke,ze){if((ke.isScene===!0?ke.overrideMaterial:null)!==null)return;let et=ee.isWebGL2;X===null&&(X=new Nn(1,1,{generateMipmaps:!0,type:te.has("EXT_color_buffer_half_float")?ks:fi,minFilter:ha,samples:et?4:0})),g.getDrawingBufferSize(q),et?X.setSize(q.x,q.y):X.setSize(_a(q.x),_a(q.y));let qt=g.getRenderTarget();g.setRenderTarget(X),g.getClearColor(O),k=g.getClearAlpha(),k<1&&g.setClearColor(16777215,.5),g.clear();let bn=g.toneMapping;g.toneMapping=ti,xn(Ee,ke,ze),W.updateMultisampleRenderTarget(X),W.updateRenderTargetMipmap(X);let si=!1;for(let tt=0,ht=Oe.length;tt<ht;tt++){let zt=Oe[tt],Lt=zt.object,Ge=zt.geometry,We=zt.material,_s=zt.group;if(We.side===2&&Lt.layers.test(ze.layers)){let ao=We.side;We.side=It,We.needsUpdate=!0,Pc(Lt,ke,ze,Ge,We,_s),We.side=ao,We.needsUpdate=!0,si=!0}}si===!0&&(W.updateMultisampleRenderTarget(X),W.updateRenderTargetMipmap(X)),g.setRenderTarget(qt),g.setClearColor(O,k),g.toneMapping=bn}(ne,ue,$,K),ae&&E.viewport(B.copy(ae)),ne.length>0&&xn(ne,$,K),ue.length>0&&xn(ue,$,K),Me.length>0&&xn(Me,$,K),E.buffers.depth.setTest(!0),E.buffers.depth.setMask(!0),E.buffers.color.setMask(!0),E.setPolygonOffset(!1)}function xn(C,$,K){let ae=$.isScene===!0?$.overrideMaterial:null;for(let ne=0,ue=C.length;ne<ue;ne++){let Me=C[ne],Ee=Me.object,Oe=Me.geometry,ke=ae===null?Me.material:ae,ze=Me.group;Ee.layers.test(K.layers)&&Pc(Ee,$,K,Oe,ke,ze)}}function Pc(C,$,K,ae,ne,ue){C.onBeforeRender(g,$,K,ae,ne,ue),C.modelViewMatrix.multiplyMatrices(K.matrixWorldInverse,C.matrixWorld),C.normalMatrix.getNormalMatrix(C.modelViewMatrix),ne.onBeforeRender(g,$,K,ae,C,ue),ne.transparent===!0&&ne.side===2&&ne.forceSinglePass===!1?(ne.side=It,ne.needsUpdate=!0,g.renderBufferDirect(K,$,ae,ne,C,ue),ne.side=ii,ne.needsUpdate=!0,g.renderBufferDirect(K,$,ae,ne,C,ue),ne.side=2):g.renderBufferDirect(K,$,ae,ne,C,ue),C.onAfterRender(g,$,K,ae,ne,ue)}function ar(C,$,K){$.isScene!==!0&&($=F);let ae=G.get(C),ne=m.state.lights,ue=m.state.shadowsArray,Me=ne.state.version,Ee=me.getParameters(C,ne.state,ue,$,K),Oe=me.getProgramCacheKey(Ee),ke=ae.programs;ae.environment=C.isMeshStandardMaterial?$.environment:null,ae.fog=$.fog,ae.envMap=(C.isMeshStandardMaterial?he:re).get(C.envMap||ae.environment),ke===void 0&&(C.addEventListener("dispose",ro),ke=new Map,ae.programs=ke);let ze=ke.get(Oe);if(ze!==void 0){if(ae.currentProgram===ze&&ae.lightsStateVersion===Me)return Dc(C,Ee),ze}else Ee.uniforms=me.getUniforms(C),C.onBuild(K,Ee,g),C.onBeforeCompile(Ee,g),ze=me.acquireProgram(Ee,Oe),ke.set(Oe,ze),ae.uniforms=Ee.uniforms;let He=ae.uniforms;return(C.isShaderMaterial||C.isRawShaderMaterial)&&C.clipping!==!0||(He.clippingPlanes=ve.uniform),Dc(C,Ee),ae.needsLights=function(et){return et.isMeshLambertMaterial||et.isMeshToonMaterial||et.isMeshPhongMaterial||et.isMeshStandardMaterial||et.isShadowMaterial||et.isShaderMaterial&&et.lights===!0}(C),ae.lightsStateVersion=Me,ae.needsLights&&(He.ambientLightColor.value=ne.state.ambient,He.lightProbe.value=ne.state.probe,He.directionalLights.value=ne.state.directional,He.directionalLightShadows.value=ne.state.directionalShadow,He.spotLights.value=ne.state.spot,He.spotLightShadows.value=ne.state.spotShadow,He.rectAreaLights.value=ne.state.rectArea,He.ltc_1.value=ne.state.rectAreaLTC1,He.ltc_2.value=ne.state.rectAreaLTC2,He.pointLights.value=ne.state.point,He.pointLightShadows.value=ne.state.pointShadow,He.hemisphereLights.value=ne.state.hemi,He.directionalShadowMap.value=ne.state.directionalShadowMap,He.directionalShadowMatrix.value=ne.state.directionalShadowMatrix,He.spotShadowMap.value=ne.state.spotShadowMap,He.spotLightMatrix.value=ne.state.spotLightMatrix,He.spotLightMap.value=ne.state.spotLightMap,He.pointShadowMap.value=ne.state.pointShadowMap,He.pointShadowMatrix.value=ne.state.pointShadowMatrix),ae.currentProgram=ze,ae.uniformsList=null,ze}function Ic(C){if(C.uniformsList===null){let $=C.currentProgram.getUniforms();C.uniformsList=ss.seqWithValue($.seq,C.uniforms)}return C.uniformsList}function Dc(C,$){let K=G.get(C);K.outputColorSpace=$.outputColorSpace,K.batching=$.batching,K.instancing=$.instancing,K.instancingColor=$.instancingColor,K.skinning=$.skinning,K.morphTargets=$.morphTargets,K.morphNormals=$.morphNormals,K.morphColors=$.morphColors,K.morphTargetsCount=$.morphTargetsCount,K.numClippingPlanes=$.numClippingPlanes,K.numIntersection=$.numClipIntersection,K.vertexAlphas=$.vertexAlphas,K.vertexTangents=$.vertexTangents,K.toneMapping=$.toneMapping}Xt.setAnimationLoop(function(C){Ri&&Ri(C)}),typeof self<"u"&&Xt.setContext(self),this.setAnimationLoop=function(C){Ri=C,Re.setAnimationLoop(C),C===null?Xt.stop():Xt.start()},Re.addEventListener("sessionstart",Bt),Re.addEventListener("sessionend",kt),this.render=function(C,$){if($!==void 0&&$.isCamera!==!0)return void console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");if(M===!0)return;C.matrixWorldAutoUpdate===!0&&C.updateMatrixWorld(),$.parent===null&&$.matrixWorldAutoUpdate===!0&&$.updateMatrixWorld(),Re.enabled===!0&&Re.isPresenting===!0&&(Re.cameraAutoUpdate===!0&&Re.updateCamera($),$=Re.getCamera()),C.isScene===!0&&C.onBeforeRender(g,C,$,R),m=lt.get(C,v.length),m.init(),v.push(m),D.multiplyMatrices($.projectionMatrix,$.matrixWorldInverse),x.setFromProjectionMatrix(D),U=this.localClippingEnabled,S=ve.init(this.clippingPlanes,U),_=Le.get(C,y.length),_.init(),y.push(_),zn(C,$,0,g.sortObjects),_.finish(),g.sortObjects===!0&&_.sort(j,Y),this.info.render.frame++,S===!0&&ve.beginShadows();let K=m.state.shadowsArray;if(Ne.render(K,C,$),S===!0&&ve.endShadows(),this.info.autoReset===!0&&this.info.reset(),Ue.render(_,C),m.setupLights(g._useLegacyLights),$.isArrayCamera){let ae=$.cameras;for(let ne=0,ue=ae.length;ne<ue;ne++){let Me=ae[ne];Hn(_,C,Me,Me.viewport)}}else Hn(_,C,$);R!==null&&(W.updateMultisampleRenderTarget(R),W.updateRenderTargetMipmap(R)),C.isScene===!0&&C.onAfterRender(g,C,$),_t.resetDefaultState(),I=-1,P=null,v.pop(),m=v.length>0?v[v.length-1]:null,y.pop(),_=y.length>0?y[y.length-1]:null},this.getActiveCubeFace=function(){return T},this.getActiveMipmapLevel=function(){return w},this.getRenderTarget=function(){return R},this.setRenderTargetTextures=function(C,$,K){G.get(C.texture).__webglTexture=$,G.get(C.depthTexture).__webglTexture=K;let ae=G.get(C);ae.__hasExternalTextures=!0,ae.__hasExternalTextures&&(ae.__autoAllocateDepthBuffer=K===void 0,ae.__autoAllocateDepthBuffer||te.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),ae.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(C,$){let K=G.get(C);K.__webglFramebuffer=$,K.__useDefaultFramebuffer=$===void 0},this.setRenderTarget=function(C,$=0,K=0){R=C,T=$,w=K;let ae=!0,ne=null,ue=!1,Me=!1;if(C){let Ee=G.get(C);Ee.__useDefaultFramebuffer!==void 0?(E.bindFramebuffer(b.FRAMEBUFFER,null),ae=!1):Ee.__webglFramebuffer===void 0?W.setupRenderTarget(C):Ee.__hasExternalTextures&&W.rebindTextures(C,G.get(C.texture).__webglTexture,G.get(C.depthTexture).__webglTexture);let Oe=C.texture;(Oe.isData3DTexture||Oe.isDataArrayTexture||Oe.isCompressedArrayTexture)&&(Me=!0);let ke=G.get(C).__webglFramebuffer;C.isWebGLCubeRenderTarget?(ne=Array.isArray(ke[$])?ke[$][K]:ke[$],ue=!0):ne=ee.isWebGL2&&C.samples>0&&W.useMultisampledRTT(C)===!1?G.get(C).__webglMultisampledFramebuffer:Array.isArray(ke)?ke[K]:ke,B.copy(C.viewport),V.copy(C.scissor),L=C.scissorTest}else B.copy(z).multiplyScalar(J).floor(),V.copy(Z).multiplyScalar(J).floor(),L=ce;if(E.bindFramebuffer(b.FRAMEBUFFER,ne)&&ee.drawBuffers&&ae&&E.drawBuffers(C,ne),E.viewport(B),E.scissor(V),E.setScissorTest(L),ue){let Ee=G.get(C.texture);b.framebufferTexture2D(b.FRAMEBUFFER,b.COLOR_ATTACHMENT0,b.TEXTURE_CUBE_MAP_POSITIVE_X+$,Ee.__webglTexture,K)}else if(Me){let Ee=G.get(C.texture),Oe=$||0;b.framebufferTextureLayer(b.FRAMEBUFFER,b.COLOR_ATTACHMENT0,Ee.__webglTexture,K||0,Oe)}I=-1},this.readRenderTargetPixels=function(C,$,K,ae,ne,ue,Me){if(!C||!C.isWebGLRenderTarget)return void console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ee=G.get(C).__webglFramebuffer;if(C.isWebGLCubeRenderTarget&&Me!==void 0&&(Ee=Ee[Me]),Ee){E.bindFramebuffer(b.FRAMEBUFFER,Ee);try{let Oe=C.texture,ke=Oe.format,ze=Oe.type;if(ke!==un&&Ct.convert(ke)!==b.getParameter(b.IMPLEMENTATION_COLOR_READ_FORMAT))return void console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");let He=ze===ks&&(te.has("EXT_color_buffer_half_float")||ee.isWebGL2&&te.has("EXT_color_buffer_float"));if(!(ze===fi||Ct.convert(ze)===b.getParameter(b.IMPLEMENTATION_COLOR_READ_TYPE)||ze===Qn&&(ee.isWebGL2||te.has("OES_texture_float")||te.has("WEBGL_color_buffer_float"))||He))return void console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");$>=0&&$<=C.width-ae&&K>=0&&K<=C.height-ne&&b.readPixels($,K,ae,ne,Ct.convert(ke),Ct.convert(ze),ue)}finally{let Oe=R!==null?G.get(R).__webglFramebuffer:null;E.bindFramebuffer(b.FRAMEBUFFER,Oe)}}},this.copyFramebufferToTexture=function(C,$,K=0){let ae=Math.pow(2,-K),ne=Math.floor($.image.width*ae),ue=Math.floor($.image.height*ae);W.setTexture2D($,0),b.copyTexSubImage2D(b.TEXTURE_2D,K,0,0,C.x,C.y,ne,ue),E.unbindTexture()},this.copyTextureToTexture=function(C,$,K,ae=0){let ne=$.image.width,ue=$.image.height,Me=Ct.convert(K.format),Ee=Ct.convert(K.type);W.setTexture2D(K,0),b.pixelStorei(b.UNPACK_FLIP_Y_WEBGL,K.flipY),b.pixelStorei(b.UNPACK_PREMULTIPLY_ALPHA_WEBGL,K.premultiplyAlpha),b.pixelStorei(b.UNPACK_ALIGNMENT,K.unpackAlignment),$.isDataTexture?b.texSubImage2D(b.TEXTURE_2D,ae,C.x,C.y,ne,ue,Me,Ee,$.image.data):$.isCompressedTexture?b.compressedTexSubImage2D(b.TEXTURE_2D,ae,C.x,C.y,$.mipmaps[0].width,$.mipmaps[0].height,Me,$.mipmaps[0].data):b.texSubImage2D(b.TEXTURE_2D,ae,C.x,C.y,Me,Ee,$.image),ae===0&&K.generateMipmaps&&b.generateMipmap(b.TEXTURE_2D),E.unbindTexture()},this.copyTextureToTexture3D=function(C,$,K,ae,ne=0){if(g.isWebGL1Renderer)return void console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");let ue=C.max.x-C.min.x+1,Me=C.max.y-C.min.y+1,Ee=C.max.z-C.min.z+1,Oe=Ct.convert(ae.format),ke=Ct.convert(ae.type),ze;if(ae.isData3DTexture)W.setTexture3D(ae,0),ze=b.TEXTURE_3D;else{if(!ae.isDataArrayTexture&&!ae.isCompressedArrayTexture)return void console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");W.setTexture2DArray(ae,0),ze=b.TEXTURE_2D_ARRAY}b.pixelStorei(b.UNPACK_FLIP_Y_WEBGL,ae.flipY),b.pixelStorei(b.UNPACK_PREMULTIPLY_ALPHA_WEBGL,ae.premultiplyAlpha),b.pixelStorei(b.UNPACK_ALIGNMENT,ae.unpackAlignment);let He=b.getParameter(b.UNPACK_ROW_LENGTH),et=b.getParameter(b.UNPACK_IMAGE_HEIGHT),qt=b.getParameter(b.UNPACK_SKIP_PIXELS),bn=b.getParameter(b.UNPACK_SKIP_ROWS),si=b.getParameter(b.UNPACK_SKIP_IMAGES),tt=K.isCompressedTexture?K.mipmaps[ne]:K.image;b.pixelStorei(b.UNPACK_ROW_LENGTH,tt.width),b.pixelStorei(b.UNPACK_IMAGE_HEIGHT,tt.height),b.pixelStorei(b.UNPACK_SKIP_PIXELS,C.min.x),b.pixelStorei(b.UNPACK_SKIP_ROWS,C.min.y),b.pixelStorei(b.UNPACK_SKIP_IMAGES,C.min.z),K.isDataTexture||K.isData3DTexture?b.texSubImage3D(ze,ne,$.x,$.y,$.z,ue,Me,Ee,Oe,ke,tt.data):K.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),b.compressedTexSubImage3D(ze,ne,$.x,$.y,$.z,ue,Me,Ee,Oe,tt.data)):b.texSubImage3D(ze,ne,$.x,$.y,$.z,ue,Me,Ee,Oe,ke,tt),b.pixelStorei(b.UNPACK_ROW_LENGTH,He),b.pixelStorei(b.UNPACK_IMAGE_HEIGHT,et),b.pixelStorei(b.UNPACK_SKIP_PIXELS,qt),b.pixelStorei(b.UNPACK_SKIP_ROWS,bn),b.pixelStorei(b.UNPACK_SKIP_IMAGES,si),ne===0&&ae.generateMipmaps&&b.generateMipmap(ze),E.unbindTexture()},this.initTexture=function(C){C.isCubeTexture?W.setTextureCube(C,0):C.isData3DTexture?W.setTexture3D(C,0):C.isDataArrayTexture||C.isCompressedArrayTexture?W.setTexture2DArray(C,0):W.setTexture2D(C,0),E.unbindTexture()},this.resetState=function(){T=0,w=0,R=null,E.reset(),_t.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return cs}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=e===Ec?"display-p3":"srgb",t.unpackColorSpace=qe.workingColorSpace===Ja?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===at?vi:ud}set outputEncoding(e){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=e===vi?at:Dn}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(e){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=e}},kl=class extends Vs{};kl.prototype.isWebGL1Renderer=!0;Ra=class s{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new Ae(e),this.near=t,this.far=n}clone(){return new s(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},Ca=class extends ot{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}},zl=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=bl,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.version=0,this.uuid=mn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return console.warn("THREE.InterleavedBuffer: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let i=0,r=this.stride;i<r;i++)this.array[e+i]=t.array[n+i];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=mn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=mn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},Et=new A,La=class s{constructor(e,t,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Et.fromBufferAttribute(this,t),Et.applyMatrix4(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Et.fromBufferAttribute(this,t),Et.applyNormalMatrix(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Et.fromBufferAttribute(this,t),Et.transformDirection(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}setX(e,t){return this.normalized&&(t=Xe(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=Xe(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=Xe(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=Xe(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=pn(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=pn(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=pn(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=pn(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=Xe(t,this.array),n=Xe(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=Xe(t,this.array),n=Xe(n,this.array),i=Xe(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this}setXYZW(e,t,n,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=Xe(t,this.array),n=Xe(n,this.array),i=Xe(i,this.array),r=Xe(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this.data.array[e+3]=r,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return new Rt(new this.array.constructor(t),this.itemSize,this.normalized)}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new s(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[i+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},$s=class extends an{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Ae(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Cs=new A,Ki=new A,Qi=new A,es=new ie,Ls=new ie,Md=new Ce,Zr=new A,Ps=new A,Jr=new A,Iu=new ie,rl=new ie,Du=new ie,Pa=class extends ot{constructor(e=new $s){if(super(),this.isSprite=!0,this.type="Sprite",Ji===void 0){Ji=new Ye;let t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new zl(t,5);Ji.setIndex([0,1,2,0,2,3]),Ji.setAttribute("position",new La(n,3,0,!1)),Ji.setAttribute("uv",new La(n,2,3,!1))}this.geometry=Ji,this.material=e,this.center=new ie(.5,.5)}raycast(e,t){e.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),Ki.setFromMatrixScale(this.matrixWorld),Md.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),Qi.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Ki.multiplyScalar(-Qi.z);let n=this.material.rotation,i,r;n!==0&&(r=Math.cos(n),i=Math.sin(n));let a=this.center;Kr(Zr.set(-.5,-.5,0),Qi,a,Ki,i,r),Kr(Ps.set(.5,-.5,0),Qi,a,Ki,i,r),Kr(Jr.set(.5,.5,0),Qi,a,Ki,i,r),Iu.set(0,0),rl.set(1,0),Du.set(1,1);let o=e.ray.intersectTriangle(Zr,Ps,Jr,!1,Cs);if(o===null&&(Kr(Ps.set(-.5,.5,0),Qi,a,Ki,i,r),rl.set(0,1),o=e.ray.intersectTriangle(Zr,Jr,Ps,!1,Cs),o===null))return;let l=e.ray.origin.distanceTo(Cs);l<e.near||l>e.far||t.push({distance:l,point:Cs.clone(),uv:ei.getInterpolation(Cs,Zr,Ps,Jr,Iu,rl,Du,new ie),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};Fg=new A,Bg=new A,kg=new A,zg=new Je,Hg=new Je,Gg=new A,Wg=new Ce,Vg=new A,$g=new _n,jg=new Ce,Xg=new Un,qg=new Ce,Yg=new Ce,Zg=new Ce,Jg=new Ce,Kg=new gn,Qg=new Ce,e0=new ge,t0=new _n,Hl=class{constructor(){this.index=0,this.pool=[],this.list=[]}push(e,t){let n=this.pool,i=this.list;this.index>=n.length&&n.push({start:-1,count:-1,z:-1});let r=n[this.index];i.push(r),this.index++,r.start=e.start,r.count=e.count,r.z=t}reset(){this.list.length=0,this.index=0}},n0=new Ce,i0=new Ce,s0=new Ce,r0=new Ce,a0=new us,o0=new gn,l0=new _n,c0=new A,h0=new Hl,u0=new ge,yi=class extends an{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ae(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Nu=new A,Uu=new A,Ou=new Ce,al=new Un,Qr=new _n,ds=class extends ot{constructor(e=new Ye,t=new yi){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let i=1,r=t.count;i<r;i++)Nu.fromBufferAttribute(t,i-1),Uu.fromBufferAttribute(t,i),n[i]=n[i-1],n[i]+=Nu.distanceTo(Uu);e.setAttribute("lineDistance",new we(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let n=this.geometry,i=this.matrixWorld,r=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Qr.copy(n.boundingSphere),Qr.applyMatrix4(i),Qr.radius+=r,e.ray.intersectsSphere(Qr)===!1)return;Ou.copy(i).invert(),al.copy(e.ray).applyMatrix4(Ou);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=new A,h=new A,u=new A,d=new A,p=this.isLineSegments?2:1,f=n.index,_=n.attributes.position;if(f!==null)for(let m=Math.max(0,a.start),y=Math.min(f.count,a.start+a.count)-1;m<y;m+=p){let v=f.getX(m),g=f.getX(m+1);if(c.fromBufferAttribute(_,v),h.fromBufferAttribute(_,g),al.distanceSqToSegment(c,h,d,u)>l)continue;d.applyMatrix4(this.matrixWorld);let M=e.ray.origin.distanceTo(d);M<e.near||M>e.far||t.push({distance:M,point:u.clone().applyMatrix4(this.matrixWorld),index:m,face:null,faceIndex:null,object:this})}else for(let m=Math.max(0,a.start),y=Math.min(_.count,a.start+a.count)-1;m<y;m+=p){if(c.fromBufferAttribute(_,m),h.fromBufferAttribute(_,m+1),al.distanceSqToSegment(c,h,d,u)>l)continue;d.applyMatrix4(this.matrixWorld);let v=e.ray.origin.distanceTo(d);v<e.near||v>e.far||t.push({distance:v,point:u.clone().applyMatrix4(this.matrixWorld),index:m,face:null,faceIndex:null,object:this})}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,r=n.length;i<r;i++){let a=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=i}}}}},Fu=new A,Bu=new A,Ia=class extends ds{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let i=0,r=t.count;i<r;i+=2)Fu.fromBufferAttribute(t,i),Bu.fromBufferAttribute(t,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+Fu.distanceTo(Bu);e.setAttribute("lineDistance",new we(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},js=class extends an{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Ae(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},ku=new Ce,Gl=new Un,ea=new _n,ta=new A,Da=class extends ot{constructor(e=new Ye,t=new js){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let n=this.geometry,i=this.matrixWorld,r=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ea.copy(n.boundingSphere),ea.applyMatrix4(i),ea.radius+=r,e.ray.intersectsSphere(ea)===!1)return;ku.copy(i).invert(),Gl.copy(e.ray).applyMatrix4(ku);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,h=n.attributes.position;if(c!==null)for(let u=Math.max(0,a.start),d=Math.min(c.count,a.start+a.count);u<d;u++){let p=c.getX(u);ta.fromBufferAttribute(h,p),zu(ta,p,l,i,e,t,this)}else for(let u=Math.max(0,a.start),d=Math.min(h.count,a.start+a.count);u<d;u++)ta.fromBufferAttribute(h,u),zu(ta,u,l,i,e,t,this)}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,r=n.length;i<r;i++){let a=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=i}}}}};Na=class extends Ot{constructor(e,t,n,i,r,a,o,l,c){super(e,t,n,i,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},$t=class{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,i=this.getPoint(0),r=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),r+=n.distanceTo(i),t.push(r),i=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t){let n=this.getLengths(),i=0,r=n.length,a;a=t||e*n[r-1];let o,l=0,c=r-1;for(;l<=c;)if(i=Math.floor(l+(c-l)/2),o=n[i]-a,o<0)l=i+1;else{if(!(o>0)){c=i;break}c=i-1}if(i=c,n[i]===a)return i/(r-1);let h=n[i];return(i+(a-h)/(n[i+1]-h))/(r-1)}getTangent(e,t){let i=e-1e-4,r=e+1e-4;i<0&&(i=0),r>1&&(r=1);let a=this.getPoint(i),o=this.getPoint(r),l=t||(a.isVector2?new ie:new A);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t){let n=new A,i=[],r=[],a=[],o=new A,l=new Ce;for(let p=0;p<=e;p++){let f=p/e;i[p]=this.getTangentAt(f,new A)}r[0]=new A,a[0]=new A;let c=Number.MAX_VALUE,h=Math.abs(i[0].x),u=Math.abs(i[0].y),d=Math.abs(i[0].z);h<=c&&(c=h,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),d<=c&&n.set(0,0,1),o.crossVectors(i[0],n).normalize(),r[0].crossVectors(i[0],o),a[0].crossVectors(i[0],r[0]);for(let p=1;p<=e;p++){if(r[p]=r[p-1].clone(),a[p]=a[p-1].clone(),o.crossVectors(i[p-1],i[p]),o.length()>Number.EPSILON){o.normalize();let f=Math.acos(ut(i[p-1].dot(i[p]),-1,1));r[p].applyMatrix4(l.makeRotationAxis(o,f))}a[p].crossVectors(i[p],r[p])}if(t===!0){let p=Math.acos(ut(r[0].dot(r[e]),-1,1));p/=e,i[0].dot(o.crossVectors(r[0],r[e]))>0&&(p=-p);for(let f=1;f<=e;f++)r[f].applyMatrix4(l.makeRotationAxis(i[f],p*f)),a[f].crossVectors(i[f],r[f])}return{tangents:i,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},Xs=class extends $t{constructor(e=0,t=0,n=1,i=1,r=0,a=2*Math.PI,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=i,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(e,t){let n=t||new ie,i=2*Math.PI,r=this.aEndAngle-this.aStartAngle,a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=i;for(;r>i;)r-=i;r<Number.EPSILON&&(r=a?0:i),this.aClockwise!==!0||a||(r===i?r=-i:r-=i);let o=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=l-this.aX,p=c-this.aY;l=d*h-p*u+this.aX,c=d*u+p*h+this.aY}return n.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Wl=class extends Xs{constructor(e,t,n,i,r,a){super(e,t,n,n,i,r,a),this.isArcCurve=!0,this.type="ArcCurve"}};na=new A,ol=new Ac,ll=new Ac,cl=new Ac,Vl=class extends $t{constructor(e=[],t=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=i}getPoint(e,t=new A){let n=t,i=this.points,r=i.length,a=(r-(this.closed?0:1))*e,o,l,c=Math.floor(a),h=a-c;this.closed?c+=c>0?0:(Math.floor(Math.abs(c)/r)+1)*r:h===0&&c===r-1&&(c=r-2,h=1),this.closed||c>0?o=i[(c-1)%r]:(na.subVectors(i[0],i[1]).add(i[0]),o=na);let u=i[c%r],d=i[(c+1)%r];if(this.closed||c+2<r?l=i[(c+2)%r]:(na.subVectors(i[r-1],i[r-2]).add(i[r-1]),l=na),this.curveType==="centripetal"||this.curveType==="chordal"){let p=this.curveType==="chordal"?.5:.25,f=Math.pow(o.distanceToSquared(u),p),_=Math.pow(u.distanceToSquared(d),p),m=Math.pow(d.distanceToSquared(l),p);_<1e-4&&(_=1),f<1e-4&&(f=_),m<1e-4&&(m=_),ol.initNonuniformCatmullRom(o.x,u.x,d.x,l.x,f,_,m),ll.initNonuniformCatmullRom(o.y,u.y,d.y,l.y,f,_,m),cl.initNonuniformCatmullRom(o.z,u.z,d.z,l.z,f,_,m)}else this.curveType==="catmullrom"&&(ol.initCatmullRom(o.x,u.x,d.x,l.x,this.tension),ll.initCatmullRom(o.y,u.y,d.y,l.y,this.tension),cl.initCatmullRom(o.z,u.z,d.z,l.z,this.tension));return n.set(ol.calc(h),ll.calc(h),cl.calc(h)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(i.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let i=this.points[t];e.points.push(i.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(new A().fromArray(i))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};Ua=class extends $t{constructor(e=new ie,t=new ie,n=new ie,i=new ie){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new ie){let n=t,i=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(Fs(e,i.x,r.x,a.x,o.x),Fs(e,i.y,r.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},$l=class extends $t{constructor(e=new A,t=new A,n=new A,i=new A){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new A){let n=t,i=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(Fs(e,i.x,r.x,a.x,o.x),Fs(e,i.y,r.y,a.y,o.y),Fs(e,i.z,r.z,a.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Oa=class extends $t{constructor(e=new ie,t=new ie){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ie){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ie){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},jl=class extends $t{constructor(e=new A,t=new A){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new A){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new A){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Fa=class extends $t{constructor(e=new ie,t=new ie,n=new ie){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new ie){let n=t,i=this.v0,r=this.v1,a=this.v2;return n.set(Os(e,i.x,r.x,a.x),Os(e,i.y,r.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ba=class extends $t{constructor(e=new A,t=new A,n=new A){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new A){let n=t,i=this.v0,r=this.v1,a=this.v2;return n.set(Os(e,i.x,r.x,a.x),Os(e,i.y,r.y,a.y),Os(e,i.z,r.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ka=class extends $t{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ie){let n=t,i=this.points,r=(i.length-1)*e,a=Math.floor(r),o=r-a,l=i[a===0?a:a-1],c=i[a],h=i[a>i.length-2?i.length-1:a+1],u=i[a>i.length-3?i.length-1:a+2];return n.set(Hu(o,l.x,c.x,h.x,u.x),Hu(o,l.y,c.y,h.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(i.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let i=this.points[t];e.points.push(i.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(new ie().fromArray(i))}return this}},za=Object.freeze({__proto__:null,ArcCurve:Wl,CatmullRomCurve3:Vl,CubicBezierCurve:Ua,CubicBezierCurve3:$l,EllipseCurve:Xs,LineCurve:Oa,LineCurve3:jl,QuadraticBezierCurve:Fa,QuadraticBezierCurve3:Ba,SplineCurve:ka}),Xl=class extends $t{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new za[n](t,e))}return this}getPoint(e,t){let n=e*this.getLength(),i=this.getCurveLengths(),r=0;for(;r<i.length;){if(i[r]>=n){let a=i[r]-n,o=this.curves[r],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let n=0,i=this.curves.length;n<i;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],n;for(let i=0,r=this.curves;i<r.length;i++){let a=r[i],o=a.isEllipseCurve?2*e:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,l=a.getPoints(o);for(let c=0;c<l.length;c++){let h=l[c];n&&n.equals(h)||(t.push(h),n=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let i=e.curves[t];this.curves.push(i.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){let i=this.curves[t];e.curves.push(i.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let i=e.curves[t];this.curves.push(new za[i.type]().fromJSON(i))}return this}},qs=class extends Xl{constructor(e){super(),this.type="Path",this.currentPoint=new ie,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let n=new Oa(this.currentPoint.clone(),new ie(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,i){let r=new Fa(this.currentPoint.clone(),new ie(e,t),new ie(n,i));return this.curves.push(r),this.currentPoint.set(n,i),this}bezierCurveTo(e,t,n,i,r,a){let o=new Ua(this.currentPoint.clone(),new ie(e,t),new ie(n,i),new ie(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),n=new ka(t);return this.curves.push(n),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,i,r,a){let o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,n,i,r,a),this}absarc(e,t,n,i,r,a){return this.absellipse(e,t,n,n,i,r,a),this}ellipse(e,t,n,i,r,a,o,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,n,i,r,a,o,l),this}absellipse(e,t,n,i,r,a,o,l){let c=new Xs(e,t,n,i,r,a,o,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},Ha=class s extends Ye{constructor(e=[new ie(0,-.5),new ie(.5,0),new ie(0,.5)],t=12,n=0,i=2*Math.PI){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:n,phiLength:i},t=Math.floor(t),i=ut(i,0,2*Math.PI);let r=[],a=[],o=[],l=[],c=[],h=1/t,u=new A,d=new ie,p=new A,f=new A,_=new A,m=0,y=0;for(let v=0;v<=e.length-1;v++)switch(v){case 0:m=e[v+1].x-e[v].x,y=e[v+1].y-e[v].y,p.x=1*y,p.y=-m,p.z=0*y,_.copy(p),p.normalize(),l.push(p.x,p.y,p.z);break;case e.length-1:l.push(_.x,_.y,_.z);break;default:m=e[v+1].x-e[v].x,y=e[v+1].y-e[v].y,p.x=1*y,p.y=-m,p.z=0*y,f.copy(p),p.x+=_.x,p.y+=_.y,p.z+=_.z,p.normalize(),l.push(p.x,p.y,p.z),_.copy(f)}for(let v=0;v<=t;v++){let g=n+v*h*i,M=Math.sin(g),T=Math.cos(g);for(let w=0;w<=e.length-1;w++){u.x=e[w].x*M,u.y=e[w].y,u.z=e[w].x*T,a.push(u.x,u.y,u.z),d.x=v/t,d.y=w/(e.length-1),o.push(d.x,d.y);let R=l[3*w+0]*M,I=l[3*w+1],P=l[3*w+0]*T;c.push(R,I,P)}}for(let v=0;v<t;v++)for(let g=0;g<e.length-1;g++){let M=g+v*e.length,T=M,w=M+e.length,R=M+e.length+1,I=M+1;r.push(T,w,I),r.push(R,I,w)}this.setIndex(r),this.setAttribute("position",new we(a,3)),this.setAttribute("uv",new we(o,2)),this.setAttribute("normal",new we(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.points,e.segments,e.phiStart,e.phiLength)}},ql=class s extends Ha{constructor(e=1,t=1,n=4,i=8){let r=new qs;r.absarc(0,-t/2,e,1.5*Math.PI,0),r.absarc(0,t/2,e,0,.5*Math.PI),super(r.getPoints(n),i),this.type="CapsuleGeometry",this.parameters={radius:e,length:t,capSegments:n,radialSegments:i}}static fromJSON(e){return new s(e.radius,e.length,e.capSegments,e.radialSegments)}},xi=class s extends Ye{constructor(e=1,t=32,n=0,i=2*Math.PI){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:i},t=Math.max(3,t);let r=[],a=[],o=[],l=[],c=new A,h=new ie;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let p=n+u/t*i;c.x=e*Math.cos(p),c.y=e*Math.sin(p),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[d]/e+1)/2,h.y=(a[d+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new we(a,3)),this.setAttribute("normal",new we(o,3)),this.setAttribute("uv",new we(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.segments,e.thetaStart,e.thetaLength)}},gt=class s extends Ye{constructor(e=1,t=1,n=1,i=32,r=1,a=!1,o=0,l=2*Math.PI){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:i,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let c=this;i=Math.floor(i),r=Math.floor(r);let h=[],u=[],d=[],p=[],f=0,_=[],m=n/2,y=0;function v(g){let M=f,T=new ie,w=new A,R=0,I=g===!0?e:t,P=g===!0?1:-1;for(let V=1;V<=i;V++)u.push(0,m*P,0),d.push(0,P,0),p.push(.5,.5),f++;let B=f;for(let V=0;V<=i;V++){let L=V/i*l+o,O=Math.cos(L),k=Math.sin(L);w.x=I*k,w.y=m*P,w.z=I*O,u.push(w.x,w.y,w.z),d.push(0,P,0),T.x=.5*O+.5,T.y=.5*k*P+.5,p.push(T.x,T.y),f++}for(let V=0;V<i;V++){let L=M+V,O=B+V;g===!0?h.push(O,O+1,L):h.push(O+1,O,L),R+=3}c.addGroup(y,R,g===!0?1:2),y+=R}(function(){let g=new A,M=new A,T=0,w=(t-e)/n;for(let R=0;R<=r;R++){let I=[],P=R/r,B=P*(t-e)+e;for(let V=0;V<=i;V++){let L=V/i,O=L*l+o,k=Math.sin(O),Q=Math.cos(O);M.x=B*k,M.y=-P*n+m,M.z=B*Q,u.push(M.x,M.y,M.z),g.set(k,w,Q).normalize(),d.push(g.x,g.y,g.z),p.push(L,1-P),I.push(f++)}_.push(I)}for(let R=0;R<i;R++)for(let I=0;I<r;I++){let P=_[I][R],B=_[I+1][R],V=_[I+1][R+1],L=_[I][R+1];h.push(P,B,L),h.push(B,V,L),T+=6}c.addGroup(y,T,0),y+=T})(),a===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(h),this.setAttribute("position",new we(u,3)),this.setAttribute("normal",new we(d,3)),this.setAttribute("uv",new we(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Yl=class s extends gt{constructor(e=1,t=1,n=32,i=1,r=!1,a=0,o=2*Math.PI){super(0,e,t,n,i,r,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:i,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(e){return new s(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},bi=class s extends Ye{constructor(e=[],t=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:i};let r=[],a=[];function o(d,p,f,_){let m=_+1,y=[];for(let v=0;v<=m;v++){y[v]=[];let g=d.clone().lerp(f,v/m),M=p.clone().lerp(f,v/m),T=m-v;for(let w=0;w<=T;w++)y[v][w]=w===0&&v===m?g:g.clone().lerp(M,w/T)}for(let v=0;v<m;v++)for(let g=0;g<2*(m-v)-1;g++){let M=Math.floor(g/2);g%2==0?(l(y[v][M+1]),l(y[v+1][M]),l(y[v][M])):(l(y[v][M+1]),l(y[v+1][M+1]),l(y[v+1][M]))}}function l(d){r.push(d.x,d.y,d.z)}function c(d,p){let f=3*d;p.x=e[f+0],p.y=e[f+1],p.z=e[f+2]}function h(d,p,f,_){_<0&&d.x===1&&(a[p]=d.x-1),f.x===0&&f.z===0&&(a[p]=_/2/Math.PI+.5)}function u(d){return Math.atan2(d.z,-d.x)}(function(d){let p=new A,f=new A,_=new A;for(let m=0;m<t.length;m+=3)c(t[m+0],p),c(t[m+1],f),c(t[m+2],_),o(p,f,_,d)})(i),function(d){let p=new A;for(let f=0;f<r.length;f+=3)p.x=r[f+0],p.y=r[f+1],p.z=r[f+2],p.normalize().multiplyScalar(d),r[f+0]=p.x,r[f+1]=p.y,r[f+2]=p.z}(n),function(){let d=new A;for(let f=0;f<r.length;f+=3){d.x=r[f+0],d.y=r[f+1],d.z=r[f+2];let _=u(d)/2/Math.PI+.5,m=(p=d,Math.atan2(-p.y,Math.sqrt(p.x*p.x+p.z*p.z))/Math.PI+.5);a.push(_,1-m)}var p;(function(){let f=new A,_=new A,m=new A,y=new A,v=new ie,g=new ie,M=new ie;for(let T=0,w=0;T<r.length;T+=9,w+=6){f.set(r[T+0],r[T+1],r[T+2]),_.set(r[T+3],r[T+4],r[T+5]),m.set(r[T+6],r[T+7],r[T+8]),v.set(a[w+0],a[w+1]),g.set(a[w+2],a[w+3]),M.set(a[w+4],a[w+5]),y.copy(f).add(_).add(m).divideScalar(3);let R=u(y);h(v,w+0,f,R),h(g,w+2,_,R),h(M,w+4,m,R)}})(),function(){for(let f=0;f<a.length;f+=6){let _=a[f+0],m=a[f+2],y=a[f+4],v=Math.max(_,m,y),g=Math.min(_,m,y);v>.9&&g<.1&&(_<.2&&(a[f+0]+=1),m<.2&&(a[f+2]+=1),y<.2&&(a[f+4]+=1))}}()}(),this.setAttribute("position",new we(r,3)),this.setAttribute("normal",new we(r.slice(),3)),this.setAttribute("uv",new we(a,2)),i===0?this.computeVertexNormals():this.normalizeNormals()}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.vertices,e.indices,e.radius,e.details)}},Zl=class s extends bi{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,i=1/n;super([-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-i,-n,0,-i,n,0,i,-n,0,i,n,-i,-n,0,-i,n,0,i,-n,0,i,n,0,-n,0,-i,n,0,-i,-n,0,i,n,0,i],[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9],e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new s(e.radius,e.detail)}},ia=new A,sa=new A,hl=new A,ra=new ei,Jl=class extends Ye{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){let i=Math.pow(10,4),r=Math.cos(ns*t),a=e.getIndex(),o=e.getAttribute("position"),l=a?a.count:o.count,c=[0,0,0],h=["a","b","c"],u=new Array(3),d={},p=[];for(let f=0;f<l;f+=3){a?(c[0]=a.getX(f),c[1]=a.getX(f+1),c[2]=a.getX(f+2)):(c[0]=f,c[1]=f+1,c[2]=f+2);let{a:_,b:m,c:y}=ra;if(_.fromBufferAttribute(o,c[0]),m.fromBufferAttribute(o,c[1]),y.fromBufferAttribute(o,c[2]),ra.getNormal(hl),u[0]=`${Math.round(_.x*i)},${Math.round(_.y*i)},${Math.round(_.z*i)}`,u[1]=`${Math.round(m.x*i)},${Math.round(m.y*i)},${Math.round(m.z*i)}`,u[2]=`${Math.round(y.x*i)},${Math.round(y.y*i)},${Math.round(y.z*i)}`,u[0]!==u[1]&&u[1]!==u[2]&&u[2]!==u[0])for(let v=0;v<3;v++){let g=(v+1)%3,M=u[v],T=u[g],w=ra[h[v]],R=ra[h[g]],I=`${M}_${T}`,P=`${T}_${M}`;P in d&&d[P]?(hl.dot(d[P].normal)<=r&&(p.push(w.x,w.y,w.z),p.push(R.x,R.y,R.z)),d[P]=null):I in d||(d[I]={index0:c[v],index1:c[g],normal:hl.clone()})}}for(let f in d)if(d[f]){let{index0:_,index1:m}=d[f];ia.fromBufferAttribute(o,_),sa.fromBufferAttribute(o,m),p.push(ia.x,ia.y,ia.z),p.push(sa.x,sa.y,sa.z)}this.setAttribute("position",new we(p,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}},Ga=class extends qs{constructor(e){super(e),this.uuid=mn(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let n=0,i=this.holes.length;n<i;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let i=e.holes[t];this.holes.push(i.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){let i=this.holes[t];e.holes.push(i.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let i=e.holes[t];this.holes.push(new qs().fromJSON(i))}return this}},Rf=function(s,e,t=2){let n=e&&e.length,i=n?e[0]*t:s.length,r=Gu(s,0,i,t,!0),a=[];if(!r||r.next===r.prev)return a;let o,l,c,h,u,d,p;if(n&&(r=function(f,_,m,y){let v=[],g,M,T,w,R;for(g=0,M=_.length;g<M;g++)T=_[g]*y,w=g<M-1?_[g+1]*y:f.length,R=Gu(f,T,w,y,!1),R===R.next&&(R.steiner=!0),v.push(Of(R));for(v.sort(Df),g=0;g<v.length;g++)m=Nf(v[g],m);return m}(s,e,r,t)),s.length>80*t){o=c=s[0],l=h=s[1];for(let f=t;f<i;f+=t)u=s[f],d=s[f+1],u<o&&(o=u),d<l&&(l=d),u>c&&(c=u),d>h&&(h=d);p=Math.max(c-o,h-l),p=p!==0?32767/p:0}return Ys(r,a,t,o,l,p,0),a};ni=class s{static area(e){let t=e.length,n=0;for(let i=t-1,r=0;r<t;i=r++)n+=e[i].x*e[r].y-e[r].x*e[i].y;return .5*n}static isClockWise(e){return s.area(e)<0}static triangulateShape(e,t){let n=[],i=[],r=[];Vu(e),$u(n,e);let a=e.length;t.forEach(Vu);for(let l=0;l<t.length;l++)i.push(a),a+=t[l].length,$u(n,t[l]);let o=Rf(n,i);for(let l=0;l<o.length;l+=3)r.push(o.slice(l,l+3));return r}};ec=class s extends Ye{constructor(e=new Ga([new ie(.5,.5),new ie(-.5,.5),new ie(-.5,-.5),new ie(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let n=this,i=[],r=[];for(let o=0,l=e.length;o<l;o++)a(e[o]);function a(o){let l=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,u=t.depth!==void 0?t.depth:1,d=t.bevelEnabled===void 0||t.bevelEnabled,p=t.bevelThickness!==void 0?t.bevelThickness:.2,f=t.bevelSize!==void 0?t.bevelSize:p-.1,_=t.bevelOffset!==void 0?t.bevelOffset:0,m=t.bevelSegments!==void 0?t.bevelSegments:3,y=t.extrudePath,v=t.UVGenerator!==void 0?t.UVGenerator:Bf,g,M,T,w,R,I=!1;y&&(g=y.getSpacedPoints(h),I=!0,d=!1,M=y.computeFrenetFrames(h,!1),T=new A,w=new A,R=new A),d||(m=0,p=0,f=0,_=0);let P=o.extractPoints(c),B=P.shape,V=P.holes;if(!ni.isClockWise(B)){B=B.reverse();for(let N=0,F=V.length;N<F;N++){let H=V[N];ni.isClockWise(H)&&(V[N]=H.reverse())}}let L=ni.triangulateShape(B,V),O=B;for(let N=0,F=V.length;N<F;N++){let H=V[N];B=B.concat(H)}function k(N,F,H){return F||console.error("THREE.ExtrudeGeometry: vec does not exist"),N.clone().addScaledVector(F,H)}let Q=B.length,oe=L.length;function J(N,F,H){let te,ee,E,se=N.x-F.x,G=N.y-F.y,W=H.x-N.x,re=H.y-N.y,he=se*se+G*G,de=se*re-G*W;if(Math.abs(de)>Number.EPSILON){let pe=Math.sqrt(he),Se=Math.sqrt(W*W+re*re),me=F.x-G/pe,_e=F.y+se/pe,Le=((H.x-re/Se-me)*re-(H.y+W/Se-_e)*W)/(se*re-G*W);te=me+se*Le-N.x,ee=_e+G*Le-N.y;let lt=te*te+ee*ee;if(lt<=2)return new ie(te,ee);E=Math.sqrt(lt/2)}else{let pe=!1;se>Number.EPSILON?W>Number.EPSILON&&(pe=!0):se<-Number.EPSILON?W<-Number.EPSILON&&(pe=!0):Math.sign(G)===Math.sign(re)&&(pe=!0),pe?(te=-G,ee=se,E=Math.sqrt(he)):(te=se,ee=G,E=Math.sqrt(he/2))}return new ie(te/E,ee/E)}let j=[];for(let N=0,F=O.length,H=F-1,te=N+1;N<F;N++,H++,te++)H===F&&(H=0),te===F&&(te=0),j[N]=J(O[N],O[H],O[te]);let Y=[],z,Z=j.concat();for(let N=0,F=V.length;N<F;N++){let H=V[N];z=[];for(let te=0,ee=H.length,E=ee-1,se=te+1;te<ee;te++,E++,se++)E===ee&&(E=0),se===ee&&(se=0),z[te]=J(H[te],H[E],H[se]);Y.push(z),Z=Z.concat(z)}for(let N=0;N<m;N++){let F=N/m,H=p*Math.cos(F*Math.PI/2),te=f*Math.sin(F*Math.PI/2)+_;for(let ee=0,E=O.length;ee<E;ee++){let se=k(O[ee],j[ee],te);S(se.x,se.y,-H)}for(let ee=0,E=V.length;ee<E;ee++){let se=V[ee];z=Y[ee];for(let G=0,W=se.length;G<W;G++){let re=k(se[G],z[G],te);S(re.x,re.y,-H)}}}let ce=f+_;for(let N=0;N<Q;N++){let F=d?k(B[N],Z[N],ce):B[N];I?(w.copy(M.normals[0]).multiplyScalar(F.x),T.copy(M.binormals[0]).multiplyScalar(F.y),R.copy(g[0]).add(w).add(T),S(R.x,R.y,R.z)):S(F.x,F.y,0)}for(let N=1;N<=h;N++)for(let F=0;F<Q;F++){let H=d?k(B[F],Z[F],ce):B[F];I?(w.copy(M.normals[N]).multiplyScalar(H.x),T.copy(M.binormals[N]).multiplyScalar(H.y),R.copy(g[N]).add(w).add(T),S(R.x,R.y,R.z)):S(H.x,H.y,u/h*N)}for(let N=m-1;N>=0;N--){let F=N/m,H=p*Math.cos(F*Math.PI/2),te=f*Math.sin(F*Math.PI/2)+_;for(let ee=0,E=O.length;ee<E;ee++){let se=k(O[ee],j[ee],te);S(se.x,se.y,u+H)}for(let ee=0,E=V.length;ee<E;ee++){let se=V[ee];z=Y[ee];for(let G=0,W=se.length;G<W;G++){let re=k(se[G],z[G],te);I?S(re.x,re.y+g[h-1].y,g[h-1].x+H):S(re.x,re.y,u+H)}}}function x(N,F){let H=N.length;for(;--H>=0;){let te=H,ee=H-1;ee<0&&(ee=N.length-1);for(let E=0,se=h+2*m;E<se;E++){let G=Q*E,W=Q*(E+1);X(F+te+G,F+ee+G,F+ee+W,F+te+W)}}}function S(N,F,H){l.push(N),l.push(F),l.push(H)}function U(N,F,H){D(N),D(F),D(H);let te=i.length/3,ee=v.generateTopUV(n,i,te-3,te-2,te-1);q(ee[0]),q(ee[1]),q(ee[2])}function X(N,F,H,te){D(N),D(F),D(te),D(F),D(H),D(te);let ee=i.length/3,E=v.generateSideWallUV(n,i,ee-6,ee-3,ee-2,ee-1);q(E[0]),q(E[1]),q(E[3]),q(E[1]),q(E[2]),q(E[3])}function D(N){i.push(l[3*N+0]),i.push(l[3*N+1]),i.push(l[3*N+2])}function q(N){r.push(N.x),r.push(N.y)}(function(){let N=i.length/3;if(d){let F=0,H=Q*F;for(let te=0;te<oe;te++){let ee=L[te];U(ee[2]+H,ee[1]+H,ee[0]+H)}F=h+2*m,H=Q*F;for(let te=0;te<oe;te++){let ee=L[te];U(ee[0]+H,ee[1]+H,ee[2]+H)}}else{for(let F=0;F<oe;F++){let H=L[F];U(H[2],H[1],H[0])}for(let F=0;F<oe;F++){let H=L[F];U(H[0]+Q*h,H[1]+Q*h,H[2]+Q*h)}}n.addGroup(N,i.length/3-N,0)})(),function(){let N=i.length/3,F=0;x(O,F),F+=O.length;for(let H=0,te=V.length;H<te;H++){let ee=V[H];x(ee,F),F+=ee.length}n.addGroup(N,i.length/3-N,1)}()}this.setAttribute("position",new we(i,3)),this.setAttribute("uv",new we(r,2)),this.computeVertexNormals()}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return function(t,n,i){if(i.shapes=[],Array.isArray(t))for(let r=0,a=t.length;r<a;r++){let o=t[r];i.shapes.push(o.uuid)}else i.shapes.push(t.uuid);return i.options=Object.assign({},n),n.extrudePath!==void 0&&(i.options.extrudePath=n.extrudePath.toJSON()),i}(this.parameters.shapes,this.parameters.options,e)}static fromJSON(e,t){let n=[];for(let r=0,a=e.shapes.length;r<a;r++){let o=t[e.shapes[r]];n.push(o)}let i=e.options.extrudePath;return i!==void 0&&(e.options.extrudePath=new za[i.type]().fromJSON(i)),new s(n,e.options)}},Bf={generateTopUV:function(s,e,t,n,i){let r=e[3*t],a=e[3*t+1],o=e[3*n],l=e[3*n+1],c=e[3*i],h=e[3*i+1];return[new ie(r,a),new ie(o,l),new ie(c,h)]},generateSideWallUV:function(s,e,t,n,i,r){let a=e[3*t],o=e[3*t+1],l=e[3*t+2],c=e[3*n],h=e[3*n+1],u=e[3*n+2],d=e[3*i],p=e[3*i+1],f=e[3*i+2],_=e[3*r],m=e[3*r+1],y=e[3*r+2];return Math.abs(o-h)<Math.abs(a-c)?[new ie(a,1-l),new ie(c,1-u),new ie(d,1-f),new ie(_,1-y)]:[new ie(o,1-l),new ie(h,1-u),new ie(p,1-f),new ie(m,1-y)]}},Ks=class s extends bi{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2;super([-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1],e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new s(e.radius,e.detail)}},tc=class s extends bi{constructor(e=1,t=0){super([1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2],e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new s(e.radius,e.detail)}},nc=class s extends Ye{constructor(e=.5,t=1,n=32,i=1,r=0,a=2*Math.PI){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:i,thetaStart:r,thetaLength:a},n=Math.max(3,n);let o=[],l=[],c=[],h=[],u=e,d=(t-e)/(i=Math.max(1,i)),p=new A,f=new ie;for(let _=0;_<=i;_++){for(let m=0;m<=n;m++){let y=r+m/n*a;p.x=u*Math.cos(y),p.y=u*Math.sin(y),l.push(p.x,p.y,p.z),c.push(0,0,1),f.x=(p.x/t+1)/2,f.y=(p.y/t+1)/2,h.push(f.x,f.y)}u+=d}for(let _=0;_<i;_++){let m=_*(n+1);for(let y=0;y<n;y++){let v=y+m,g=v,M=v+n+1,T=v+n+2,w=v+1;o.push(g,M,w),o.push(M,T,w)}}this.setIndex(o),this.setAttribute("position",new we(l,3)),this.setAttribute("normal",new we(c,3)),this.setAttribute("uv",new we(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}},ic=class s extends Ye{constructor(e=new Ga([new ie(0,.5),new ie(-.5,-.5),new ie(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let n=[],i=[],r=[],a=[],o=0,l=0;if(Array.isArray(e)===!1)c(e);else for(let h=0;h<e.length;h++)c(e[h]),this.addGroup(o,l,h),o+=l,l=0;function c(h){let u=i.length/3,d=h.extractPoints(t),p=d.shape,f=d.holes;ni.isClockWise(p)===!1&&(p=p.reverse());for(let m=0,y=f.length;m<y;m++){let v=f[m];ni.isClockWise(v)===!0&&(f[m]=v.reverse())}let _=ni.triangulateShape(p,f);for(let m=0,y=f.length;m<y;m++){let v=f[m];p=p.concat(v)}for(let m=0,y=p.length;m<y;m++){let v=p[m];i.push(v.x,v.y,0),r.push(0,0,1),a.push(v.x,v.y)}for(let m=0,y=_.length;m<y;m++){let v=_[m],g=v[0]+u,M=v[1]+u,T=v[2]+u;n.push(g,M,T),l+=3}}this.setIndex(n),this.setAttribute("position",new we(i,3)),this.setAttribute("normal",new we(r,3)),this.setAttribute("uv",new we(a,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return function(t,n){if(n.shapes=[],Array.isArray(t))for(let i=0,r=t.length;i<r;i++){let a=t[i];n.shapes.push(a.uuid)}else n.shapes.push(t.uuid);return n}(this.parameters.shapes,e)}static fromJSON(e,t){let n=[];for(let i=0,r=e.shapes.length;i<r;i++){let a=t[e.shapes[i]];n.push(a)}return new s(n,e.curveSegments)}},kn=class s extends Ye{constructor(e=1,t=32,n=16,i=0,r=2*Math.PI,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:i,phiLength:r,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(a+o,Math.PI),c=0,h=[],u=new A,d=new A,p=[],f=[],_=[],m=[];for(let y=0;y<=n;y++){let v=[],g=y/n,M=0;y===0&&a===0?M=.5/t:y===n&&l===Math.PI&&(M=-.5/t);for(let T=0;T<=t;T++){let w=T/t;u.x=-e*Math.cos(i+w*r)*Math.sin(a+g*o),u.y=e*Math.cos(a+g*o),u.z=e*Math.sin(i+w*r)*Math.sin(a+g*o),f.push(u.x,u.y,u.z),d.copy(u).normalize(),_.push(d.x,d.y,d.z),m.push(w+M,1-g),v.push(c++)}h.push(v)}for(let y=0;y<n;y++)for(let v=0;v<t;v++){let g=h[y][v+1],M=h[y][v],T=h[y+1][v],w=h[y+1][v+1];(y!==0||a>0)&&p.push(g,M,w),(y!==n-1||l<Math.PI)&&p.push(M,T,w)}this.setIndex(p),this.setAttribute("position",new we(f,3)),this.setAttribute("normal",new we(_,3)),this.setAttribute("uv",new we(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}},sc=class s extends bi{constructor(e=1,t=0){super([1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],[2,1,0,0,3,2,1,3,0,2,3,1],e,t),this.type="TetrahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new s(e.radius,e.detail)}},rc=class s extends Ye{constructor(e=1,t=.4,n=12,i=48,r=2*Math.PI){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:i,arc:r},n=Math.floor(n),i=Math.floor(i);let a=[],o=[],l=[],c=[],h=new A,u=new A,d=new A;for(let p=0;p<=n;p++)for(let f=0;f<=i;f++){let _=f/i*r,m=p/n*Math.PI*2;u.x=(e+t*Math.cos(m))*Math.cos(_),u.y=(e+t*Math.cos(m))*Math.sin(_),u.z=t*Math.sin(m),o.push(u.x,u.y,u.z),h.x=e*Math.cos(_),h.y=e*Math.sin(_),d.subVectors(u,h).normalize(),l.push(d.x,d.y,d.z),c.push(f/i),c.push(p/n)}for(let p=1;p<=n;p++)for(let f=1;f<=i;f++){let _=(i+1)*p+f-1,m=(i+1)*(p-1)+f-1,y=(i+1)*(p-1)+f,v=(i+1)*p+f;a.push(_,m,v),a.push(m,y,v)}this.setIndex(a),this.setAttribute("position",new we(o,3)),this.setAttribute("normal",new we(l,3)),this.setAttribute("uv",new we(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}},ac=class s extends Ye{constructor(e=1,t=.4,n=64,i=8,r=2,a=3){super(),this.type="TorusKnotGeometry",this.parameters={radius:e,tube:t,tubularSegments:n,radialSegments:i,p:r,q:a},n=Math.floor(n),i=Math.floor(i);let o=[],l=[],c=[],h=[],u=new A,d=new A,p=new A,f=new A,_=new A,m=new A,y=new A;for(let g=0;g<=n;++g){let M=g/n*r*Math.PI*2;v(M,r,a,e,p),v(M+.01,r,a,e,f),m.subVectors(f,p),y.addVectors(f,p),_.crossVectors(m,y),y.crossVectors(_,m),_.normalize(),y.normalize();for(let T=0;T<=i;++T){let w=T/i*Math.PI*2,R=-t*Math.cos(w),I=t*Math.sin(w);u.x=p.x+(R*y.x+I*_.x),u.y=p.y+(R*y.y+I*_.y),u.z=p.z+(R*y.z+I*_.z),l.push(u.x,u.y,u.z),d.subVectors(u,p).normalize(),c.push(d.x,d.y,d.z),h.push(g/n),h.push(T/i)}}for(let g=1;g<=n;g++)for(let M=1;M<=i;M++){let T=(i+1)*(g-1)+(M-1),w=(i+1)*g+(M-1),R=(i+1)*g+M,I=(i+1)*(g-1)+M;o.push(T,w,I),o.push(w,R,I)}function v(g,M,T,w,R){let I=Math.cos(g),P=Math.sin(g),B=T/M*g,V=Math.cos(B);R.x=w*(2+V)*.5*I,R.y=w*(2+V)*P*.5,R.z=w*Math.sin(B)*.5}this.setIndex(o),this.setAttribute("position",new we(l,3)),this.setAttribute("normal",new we(c,3)),this.setAttribute("uv",new we(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new s(e.radius,e.tube,e.tubularSegments,e.radialSegments,e.p,e.q)}},oc=class s extends Ye{constructor(e=new Ba(new A(-1,-1,0),new A(-1,1,0),new A(1,1,0)),t=64,n=1,i=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:n,radialSegments:i,closed:r};let a=e.computeFrenetFrames(t,r);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;let o=new A,l=new A,c=new ie,h=new A,u=[],d=[],p=[],f=[];function _(m){h=e.getPointAt(m/t,h);let y=a.normals[m],v=a.binormals[m];for(let g=0;g<=i;g++){let M=g/i*Math.PI*2,T=Math.sin(M),w=-Math.cos(M);l.x=w*y.x+T*v.x,l.y=w*y.y+T*v.y,l.z=w*y.z+T*v.z,l.normalize(),d.push(l.x,l.y,l.z),o.x=h.x+n*l.x,o.y=h.y+n*l.y,o.z=h.z+n*l.z,u.push(o.x,o.y,o.z)}}(function(){for(let m=0;m<t;m++)_(m);_(r===!1?t:0),function(){for(let m=0;m<=t;m++)for(let y=0;y<=i;y++)c.x=m/t,c.y=y/i,p.push(c.x,c.y)}(),function(){for(let m=1;m<=t;m++)for(let y=1;y<=i;y++){let v=(i+1)*(m-1)+(y-1),g=(i+1)*m+(y-1),M=(i+1)*m+y,T=(i+1)*(m-1)+y;f.push(v,g,T),f.push(g,M,T)}}()})(),this.setIndex(f),this.setAttribute("position",new we(u,3)),this.setAttribute("normal",new we(d,3)),this.setAttribute("uv",new we(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new s(new za[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}},lc=class extends Ye{constructor(e=null){if(super(),this.type="WireframeGeometry",this.parameters={geometry:e},e!==null){let t=[],n=new Set,i=new A,r=new A;if(e.index!==null){let a=e.attributes.position,o=e.index,l=e.groups;l.length===0&&(l=[{start:0,count:o.count,materialIndex:0}]);for(let c=0,h=l.length;c<h;++c){let u=l[c],d=u.start;for(let p=d,f=d+u.count;p<f;p+=3)for(let _=0;_<3;_++){let m=o.getX(p+_),y=o.getX(p+(_+1)%3);i.fromBufferAttribute(a,m),r.fromBufferAttribute(a,y),ju(i,r,n)===!0&&(t.push(i.x,i.y,i.z),t.push(r.x,r.y,r.z))}}}else{let a=e.attributes.position;for(let o=0,l=a.count/3;o<l;o++)for(let c=0;c<3;c++){let h=3*o+c,u=3*o+(c+1)%3;i.fromBufferAttribute(a,h),r.fromBufferAttribute(a,u),ju(i,r,n)===!0&&(t.push(i.x,i.y,i.z),t.push(r.x,r.y,r.z))}}this.setAttribute("position",new we(t,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}};d0=Object.freeze({__proto__:null,BoxGeometry:$e,CapsuleGeometry:ql,CircleGeometry:xi,ConeGeometry:Yl,CylinderGeometry:gt,DodecahedronGeometry:Zl,EdgesGeometry:Jl,ExtrudeGeometry:ec,IcosahedronGeometry:Ks,LatheGeometry:Ha,OctahedronGeometry:tc,PlaneGeometry:Bn,PolyhedronGeometry:bi,RingGeometry:nc,ShapeGeometry:ic,SphereGeometry:kn,TetrahedronGeometry:sc,TorusGeometry:rc,TorusKnotGeometry:ac,TubeGeometry:oc,WireframeGeometry:lc}),Pe=class extends an{constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new Ae(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ae(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new ie(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},vn=class extends an{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Ae(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ae(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new ie(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=Mc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},Wa=class extends yi{constructor(e){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}};ps=class{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,i=t[n],r=t[n-1];t:{e:{let a;n:{i:if(!(e<i)){for(let o=n+2;;){if(i===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=i,i=t[++n],e<i)break e}a=t.length;break n}if(e>=r)break t;{let o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(i=r,r=t[--n-1],e>=r)break e}a=n,n=0}}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(i=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=e*i;for(let a=0;a!==i;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},cc=class extends ps{constructor(e,t,n,i){super(e,t,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Vh,endingEnd:Vh}}intervalChanged_(e,t,n){let i=this.parameterPositions,r=e-2,a=e+1,o=i[r],l=i[a];if(o===void 0)switch(this.getSettings_().endingStart){case $h:r=e,o=2*t-n;break;case jh:r=i.length-2,o=t+i[r]-i[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case $h:a=e,l=2*n-t;break;case jh:a=1,l=n+i[1]-i[0];break;default:a=e-1,l=t}let c=.5*(n-t),h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(e,t,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,p=this._weightNext,f=(n-t)/(i-t),_=f*f,m=_*f,y=-d*m+2*d*_-d*f,v=(1+d)*m+(-1.5-2*d)*_+(-.5+d)*f+1,g=(-1-p)*m+(1.5+p)*_+.5*f,M=p*m-p*_;for(let T=0;T!==o;++T)r[T]=y*a[h+T]+v*a[c+T]+g*a[l+T]+M*a[u+T];return r}},hc=class extends ps{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(n-t)/(i-t),u=1-h;for(let d=0;d!==o;++d)r[d]=a[c+d]*u+a[l+d]*h;return r}},uc=class extends ps{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}},rn=class{constructor(e,t,n,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=la(t,this.TimeBufferType),this.values=la(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:la(e.times,Array),values:la(e.values,Array)};let i=e.getInterpolation();i!==e.DefaultInterpolation&&(n.interpolation=i)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new uc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new hc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new cc(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case ua:t=this.InterpolantFactoryMethodDiscrete;break;case da:t=this.InterpolantFactoryMethodLinear;break;case Oo:t=this.InterpolantFactoryMethodSmooth}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0){if(e===this.DefaultInterpolation)throw new Error(n);this.setInterpolation(this.DefaultInterpolation)}return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return ua;case this.InterpolantFactoryMethodLinear:return da;case this.InterpolantFactoryMethodSmooth:return Oo}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e}return this}trim(e,t){let n=this.times,i=n.length,r=0,a=i-1;for(;r!==i&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==i){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!=0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,i=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(i!==void 0&&kf(i))for(let o=0,l=i.length;o!==l;++o){let c=i[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===Oo,r=e.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=e[o];if(c!==e[o+1]&&(o!==1||c!==e[0]))if(i)l=!0;else{let h=o*n,u=h-n,d=h+n;for(let p=0;p!==n;++p){let f=t[h+p];if(f!==t[u+p]||f!==t[d+p]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let h=o*n,u=a*n;for(let d=0;d!==n;++d)t[u+d]=t[h+d]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=new this.constructor(this.name,e,t);return n.createInterpolant=this.createInterpolant,n}};rn.prototype.TimeBufferType=Float32Array,rn.prototype.ValueBufferType=Float32Array,rn.prototype.DefaultInterpolation=da;pi=class extends rn{};pi.prototype.ValueTypeName="bool",pi.prototype.ValueBufferType=Array,pi.prototype.DefaultInterpolation=ua,pi.prototype.InterpolantFactoryMethodLinear=void 0,pi.prototype.InterpolantFactoryMethodSmooth=void 0;dc=class extends rn{};dc.prototype.ValueTypeName="color";pc=class extends rn{};pc.prototype.ValueTypeName="number";mc=class extends ps{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(i-t),c=e*o;for(let h=c+o;c!==h;c+=4)Ft.slerpFlat(r,0,a,c-o,a,c,l);return r}},Bs=class extends rn{InterpolantFactoryMethodLinear(e){return new mc(this.times,this.values,this.getValueSize(),e)}};Bs.prototype.ValueTypeName="quaternion",Bs.prototype.DefaultInterpolation=da,Bs.prototype.InterpolantFactoryMethodSmooth=void 0;mi=class extends rn{};mi.prototype.ValueTypeName="string",mi.prototype.ValueBufferType=Array,mi.prototype.DefaultInterpolation=ua,mi.prototype.InterpolantFactoryMethodLinear=void 0,mi.prototype.InterpolantFactoryMethodSmooth=void 0;fc=class extends rn{};fc.prototype.ValueTypeName="vector";Xu={enabled:!1,files:{},add:function(s,e){this.enabled!==!1&&(this.files[s]=e)},get:function(s){if(this.enabled!==!1)return this.files[s]},remove:function(s){delete this.files[s]},clear:function(){this.files={}}},gc=class{constructor(e,t,n){let i=this,r,a=!1,o=0,l=0,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(h){l++,a===!1&&i.onStart!==void 0&&i.onStart(h,o,l),a=!0},this.itemEnd=function(h){o++,i.onProgress!==void 0&&i.onProgress(h,o,l),o===l&&(a=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return r?r(h):h},this.setURLModifier=function(h){return r=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){let p=c[u],f=c[u+1];if(p.global&&(p.lastIndex=0),p.test(h))return f}return null}}},zf=new gc,Qs=class{constructor(e){this.manager=e!==void 0?e:zf,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(i,r){n.load(e,i,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};Qs.DEFAULT_MATERIAL_NAME="__DEFAULT";_c=class extends Qs{constructor(e){super(e)}load(e,t,n,i){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,a=Xu.get(e);if(a!==void 0)return r.manager.itemStart(e),setTimeout(function(){t&&t(a),r.manager.itemEnd(e)},0),a;let o=Hs("img");function l(){h(),Xu.add(e,this),t&&t(this),r.manager.itemEnd(e)}function c(u){h(),i&&i(u),r.manager.itemError(e),r.manager.itemEnd(e)}function h(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),r.manager.itemStart(e),o.src=e,o}},Va=class extends Qs{constructor(e){super(e)}load(e,t,n,i){let r=new Ot,a=new _c(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){r.image=o,r.needsUpdate=!0,t!==void 0&&t(r)},n,i),r}},er=class extends ot{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ae(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}},tr=class extends er{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(ot.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ae(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},ul=new Ce,qu=new A,Yu=new A,$a=class{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ie(512,512),this.map=null,this.mapPass=null,this.matrix=new Ce,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new us,this._frameExtents=new ie(1,1),this._viewportCount=1,this._viewports=[new Je(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;qu.setFromMatrixPosition(e.matrixWorld),t.position.copy(qu),Yu.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Yu),t.updateMatrixWorld(),ul.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ul),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(ul)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),this.mapSize.x===512&&this.mapSize.y===512||(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Zu=new Ce,Is=new A,dl=new A,vc=class extends $a{constructor(){super(new Mt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new ie(4,2),this._viewportCount=6,this._viewports=[new Je(2,1,1,1),new Je(0,1,1,1),new Je(3,1,1,1),new Je(1,1,1,1),new Je(3,0,1,1),new Je(1,0,1,1)],this._cubeDirections=[new A(1,0,0),new A(-1,0,0),new A(0,0,1),new A(0,0,-1),new A(0,1,0),new A(0,-1,0)],this._cubeUps=[new A(0,1,0),new A(0,1,0),new A(0,1,0),new A(0,1,0),new A(0,0,1),new A(0,0,-1)]}updateMatrices(e,t=0){let n=this.camera,i=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),Is.setFromMatrixPosition(e.matrixWorld),n.position.copy(Is),dl.copy(n.position),dl.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(dl),n.updateMatrixWorld(),i.makeTranslation(-Is.x,-Is.y,-Is.z),Zu.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Zu)}},nr=class extends er{constructor(e,t,n=0,i=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new vc}get power(){return 4*this.intensity*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},yc=class extends $a{constructor(){super(new Ea(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},ja=class extends er{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ot.DEFAULT_UP),this.updateMatrix(),this.target=new ot,this.shadow=new yc}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},p0=new Ce,m0=new Ce,f0=new Ce,Xa=class{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Ju(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let t=Ju();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}};g0=new A,_0=new Ft,v0=new A,y0=new A,x0=new A,b0=new Ft,M0=new A,S0=new A,Rc="\\[\\]\\.:\\/",Hf=new RegExp("["+Rc+"]","g"),pl="[^"+Rc+"]",Gf="[^"+Rc.replace("\\.","")+"]",Wf=new RegExp("^"+/((?:WC+[\/:])*)/.source.replace("WC",pl)+/(WCOD+)?/.source.replace("WCOD",Gf)+/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",pl)+/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",pl)+"$"),Vf=["material","materials","bones","map"],Qe=class s{constructor(e,t,n){this.path=t,this.parsedPath=n||s.parseTrackName(t),this.node=s.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new s.Composite(e,t,n):new s(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Hf,"")}static parseTrackName(e){let t=Wf.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let r=n.nodeName.substring(i+1);Vf.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let l=n(o.children);if(l)return l}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,i=t.propertyName,r=t.propertyIndex;if(e||(e=s.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e)return void console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material)return void console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);if(!e.material.materials)return void console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);e=e.material.materials;break;case"bones":if(!e.skeleton)return void console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material)return void console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);if(!e.material.map)return void console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);e=e.material.map;break;default:if(e[n]===void 0)return void console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);e=e[n]}if(c!==void 0){if(e[c]===void 0)return void console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);e=e[c]}}let a=e[i];if(a===void 0){let c=t.nodeName;return void console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",e)}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry)return void console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);if(!e.geometry.morphAttributes)return void console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=i;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Qe.Composite=class{constructor(s,e,t){let n=t||Qe.parseTrackName(e);this._targetGroup=s,this._bindings=s.subscribe_(e,n)}getValue(s,e){this.bind();let t=this._targetGroup.nCachedObjects_,n=this._bindings[t];n!==void 0&&n.getValue(s,e)}setValue(s,e){let t=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=t.length;n!==i;++n)t[n].setValue(s,e)}bind(){let s=this._bindings;for(let e=this._targetGroup.nCachedObjects_,t=s.length;e!==t;++e)s[e].bind()}unbind(){let s=this._bindings;for(let e=this._targetGroup.nCachedObjects_,t=s.length;e!==t;++e)s[e].unbind()}},Qe.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},Qe.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},Qe.prototype.GetterByBindingType=[Qe.prototype._getValue_direct,Qe.prototype._getValue_array,Qe.prototype._getValue_arrayElement,Qe.prototype._getValue_toArray],Qe.prototype.SetterByBindingTypeAndVersioning=[[Qe.prototype._setValue_direct,Qe.prototype._setValue_direct_setNeedsUpdate,Qe.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Qe.prototype._setValue_array,Qe.prototype._setValue_array_setNeedsUpdate,Qe.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Qe.prototype._setValue_arrayElement,Qe.prototype._setValue_arrayElement_setNeedsUpdate,Qe.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Qe.prototype._setValue_fromArray,Qe.prototype._setValue_fromArray_setNeedsUpdate,Qe.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];w0=new Float32Array(1),qa=class{constructor(e,t,n=0,i=1/0){this.ray=new Un(e,t),this.near=n,this.far=i,this.camera=null,this.layers=new Gs,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}intersectObject(e,t=!0,n=[]){return xc(e,this,n,t),n.sort(Ku),n}intersectObjects(e,t=!0,n=[]){for(let i=0,r=e.length;i<r;i++)xc(e[i],this,n,t);return n.sort(Ku),n}};ir=class{constructor(e=1,t=0,n=0){return this.radius=e,this.phi=t,this.theta=n,this}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(ut(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}},E0=new ie,T0=new A,A0=new A,R0=new A,C0=new A,L0=new Ce,P0=new Ce,I0=new A,D0=new Ae,N0=new Ae,U0=new A,O0=new A,F0=new A,B0=new A,k0=new Ws,z0=new gn,Qu=new A,Ya=class extends ot{constructor(e=new A(0,0,1),t=new A(0,0,0),n=1,i=16776960,r=.2*n,a=.2*r){super(),this.type="ArrowHelper",ca===void 0&&(ca=new Ye,ca.setAttribute("position",new we([0,0,0,0,1,0],3)),ml=new gt(0,.5,1,5,1),ml.translate(0,-.5,0)),this.position.copy(t),this.line=new ds(ca,new yi({color:i,toneMapped:!1})),this.line.matrixAutoUpdate=!1,this.add(this.line),this.cone=new ge(ml,new On({color:i,toneMapped:!1})),this.cone.matrixAutoUpdate=!1,this.add(this.cone),this.setDirection(e),this.setLength(n,r,a)}setDirection(e){if(e.y>.99999)this.quaternion.set(0,0,0,1);else if(e.y<-.99999)this.quaternion.set(1,0,0,0);else{Qu.set(e.z,0,-e.x).normalize();let t=Math.acos(e.y);this.quaternion.setFromAxisAngle(Qu,t)}}setLength(e,t=.2*e,n=.2*t){this.line.scale.set(1,Math.max(1e-4,e-t),1),this.line.updateMatrix(),this.cone.scale.set(n,t,n),this.cone.position.y=e,this.cone.updateMatrix()}setColor(e){this.line.material.color.set(e),this.cone.material.color.set(e)}copy(e){return super.copy(e,!1),this.line.copy(e.line),this.cone.copy(e.cone),this}dispose(){this.line.geometry.dispose(),this.line.material.dispose(),this.cone.geometry.dispose(),this.cone.material.dispose()}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:fl}})),typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=fl)});var Ed,Cc,Td,to,Ad,jf,no,Rd=Gn(()=>{eo();Ed={type:"change"},Cc={type:"start"},Td={type:"end"},to=new Un,Ad=new sn,jf=Math.cos(70*dd.DEG2RAD),no=class extends fn{constructor(e,t){super(),this.object=e,this.domElement=t,this.domElement.style.touchAction="none",this.enabled=!0,this.target=new A,this.cursor=new A,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Si.ROTATE,MIDDLE:Si.DOLLY,RIGHT:Si.PAN},this.touches={ONE:wi.ROTATE,TWO:wi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this.getPolarAngle=function(){return o.phi},this.getAzimuthalAngle=function(){return o.theta},this.getDistance=function(){return this.object.position.distanceTo(this.target)},this.listenToKeyEvents=function(b){b.addEventListener("keydown",Ne),this._domElementKeyEvents=b},this.stopListenToKeyEvents=function(){this._domElementKeyEvents.removeEventListener("keydown",Ne),this._domElementKeyEvents=null},this.saveState=function(){n.target0.copy(n.target),n.position0.copy(n.object.position),n.zoom0=n.object.zoom},this.reset=function(){n.target.copy(n.target0),n.object.position.copy(n.position0),n.object.zoom=n.zoom0,n.object.updateProjectionMatrix(),n.dispatchEvent(Ed),n.update(),r=i.NONE},this.update=function(){let b=new A,fe=new Ft().setFromUnitVectors(e.up,new A(0,1,0)),De=fe.clone().invert(),Re=new A,mt=new Ft,jt=new A,St=2*Math.PI;return function(rr=null){let Ri=n.object.position;b.copy(Ri).sub(n.target),b.applyQuaternion(fe),o.setFromVector3(b),n.autoRotate&&r===i.NONE&&L(B(rr)),n.enableDamping?(o.theta+=l.theta*n.dampingFactor,o.phi+=l.phi*n.dampingFactor):(o.theta+=l.theta,o.phi+=l.phi);let Bt=n.minAzimuthAngle,kt=n.maxAzimuthAngle;isFinite(Bt)&&isFinite(kt)&&(Bt<-Math.PI?Bt+=St:Bt>Math.PI&&(Bt-=St),kt<-Math.PI?kt+=St:kt>Math.PI&&(kt-=St),Bt<=kt?o.theta=Math.max(Bt,Math.min(kt,o.theta)):o.theta=o.theta>(Bt+kt)/2?Math.max(Bt,o.theta):Math.min(kt,o.theta)),o.phi=Math.max(n.minPolarAngle,Math.min(n.maxPolarAngle,o.phi)),o.makeSafe(),n.enableDamping===!0?n.target.addScaledVector(h,n.dampingFactor):n.target.add(h),n.target.sub(n.cursor),n.target.clampLength(n.minTargetRadius,n.maxTargetRadius),n.target.add(n.cursor),n.zoomToCursor&&w||n.object.isOrthographicCamera?o.radius=z(o.radius):o.radius=z(o.radius*c),b.setFromSpherical(o),b.applyQuaternion(De),Ri.copy(n.target).add(b),n.object.lookAt(n.target),n.enableDamping===!0?(l.theta*=1-n.dampingFactor,l.phi*=1-n.dampingFactor,h.multiplyScalar(1-n.dampingFactor)):(l.set(0,0,0),h.set(0,0,0));let Xt=!1;if(n.zoomToCursor&&w){let zn=null;if(n.object.isPerspectiveCamera){let Hn=b.length();zn=z(Hn*c);let xn=Hn-zn;n.object.position.addScaledVector(M,xn),n.object.updateMatrixWorld()}else if(n.object.isOrthographicCamera){let Hn=new A(T.x,T.y,0);Hn.unproject(n.object),n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/c)),n.object.updateProjectionMatrix(),Xt=!0;let xn=new A(T.x,T.y,0);xn.unproject(n.object),n.object.position.sub(xn).add(Hn),n.object.updateMatrixWorld(),zn=b.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),n.zoomToCursor=!1;zn!==null&&(this.screenSpacePanning?n.target.set(0,0,-1).transformDirection(n.object.matrix).multiplyScalar(zn).add(n.object.position):(to.origin.copy(n.object.position),to.direction.set(0,0,-1).transformDirection(n.object.matrix),Math.abs(n.object.up.dot(to.direction))<jf?e.lookAt(n.target):(Ad.setFromNormalAndCoplanarPoint(n.object.up,n.target),to.intersectPlane(Ad,n.target))))}else n.object.isOrthographicCamera&&(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/c)),n.object.updateProjectionMatrix(),Xt=!0);return c=1,w=!1,Xt||Re.distanceToSquared(n.object.position)>a||8*(1-mt.dot(n.object.quaternion))>a||jt.distanceToSquared(n.target)>0?(n.dispatchEvent(Ed),Re.copy(n.object.position),mt.copy(n.object.quaternion),jt.copy(n.target),!0):!1}}(),this.dispose=function(){n.domElement.removeEventListener("contextmenu",yn),n.domElement.removeEventListener("pointerdown",he),n.domElement.removeEventListener("pointercancel",pe),n.domElement.removeEventListener("wheel",_e),n.domElement.removeEventListener("pointermove",de),n.domElement.removeEventListener("pointerup",pe),n._domElementKeyEvents!==null&&(n._domElementKeyEvents.removeEventListener("keydown",Ne),n._domElementKeyEvents=null)};let n=this,i={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},r=i.NONE,a=1e-6,o=new ir,l=new ir,c=1,h=new A,u=new ie,d=new ie,p=new ie,f=new ie,_=new ie,m=new ie,y=new ie,v=new ie,g=new ie,M=new A,T=new ie,w=!1,R=[],I={},P=!1;function B(b){return b!==null?2*Math.PI/60*n.autoRotateSpeed*b:2*Math.PI/60/60*n.autoRotateSpeed}function V(b){let fe=Math.abs(b*.01);return Math.pow(.95,n.zoomSpeed*fe)}function L(b){l.theta-=b}function O(b){l.phi-=b}let k=function(){let b=new A;return function(De,Re){b.setFromMatrixColumn(Re,0),b.multiplyScalar(-De),h.add(b)}}(),Q=function(){let b=new A;return function(De,Re){n.screenSpacePanning===!0?b.setFromMatrixColumn(Re,1):(b.setFromMatrixColumn(Re,0),b.crossVectors(n.object.up,b)),b.multiplyScalar(De),h.add(b)}}(),oe=function(){let b=new A;return function(De,Re){let mt=n.domElement;if(n.object.isPerspectiveCamera){let jt=n.object.position;b.copy(jt).sub(n.target);let St=b.length();St*=Math.tan(n.object.fov/2*Math.PI/180),k(2*De*St/mt.clientHeight,n.object.matrix),Q(2*Re*St/mt.clientHeight,n.object.matrix)}else n.object.isOrthographicCamera?(k(De*(n.object.right-n.object.left)/n.object.zoom/mt.clientWidth,n.object.matrix),Q(Re*(n.object.top-n.object.bottom)/n.object.zoom/mt.clientHeight,n.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),n.enablePan=!1)}}();function J(b){n.object.isPerspectiveCamera||n.object.isOrthographicCamera?c/=b:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function j(b){n.object.isPerspectiveCamera||n.object.isOrthographicCamera?c*=b:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function Y(b,fe){if(!n.zoomToCursor)return;w=!0;let De=n.domElement.getBoundingClientRect(),Re=b-De.left,mt=fe-De.top,jt=De.width,St=De.height;T.x=Re/jt*2-1,T.y=-(mt/St)*2+1,M.set(T.x,T.y,1).unproject(n.object).sub(n.object.position).normalize()}function z(b){return Math.max(n.minDistance,Math.min(n.maxDistance,b))}function Z(b){u.set(b.clientX,b.clientY)}function ce(b){Y(b.clientX,b.clientX),y.set(b.clientX,b.clientY)}function x(b){f.set(b.clientX,b.clientY)}function S(b){d.set(b.clientX,b.clientY),p.subVectors(d,u).multiplyScalar(n.rotateSpeed);let fe=n.domElement;L(2*Math.PI*p.x/fe.clientHeight),O(2*Math.PI*p.y/fe.clientHeight),u.copy(d),n.update()}function U(b){v.set(b.clientX,b.clientY),g.subVectors(v,y),g.y>0?J(V(g.y)):g.y<0&&j(V(g.y)),y.copy(v),n.update()}function X(b){_.set(b.clientX,b.clientY),m.subVectors(_,f).multiplyScalar(n.panSpeed),oe(m.x,m.y),f.copy(_),n.update()}function D(b){Y(b.clientX,b.clientY),b.deltaY<0?j(V(b.deltaY)):b.deltaY>0&&J(V(b.deltaY)),n.update()}function q(b){let fe=!1;switch(b.code){case n.keys.UP:b.ctrlKey||b.metaKey||b.shiftKey?O(2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):oe(0,n.keyPanSpeed),fe=!0;break;case n.keys.BOTTOM:b.ctrlKey||b.metaKey||b.shiftKey?O(-2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):oe(0,-n.keyPanSpeed),fe=!0;break;case n.keys.LEFT:b.ctrlKey||b.metaKey||b.shiftKey?L(2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):oe(n.keyPanSpeed,0),fe=!0;break;case n.keys.RIGHT:b.ctrlKey||b.metaKey||b.shiftKey?L(-2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):oe(-n.keyPanSpeed,0),fe=!0;break}fe&&(b.preventDefault(),n.update())}function N(b){if(R.length===1)u.set(b.pageX,b.pageY);else{let fe=Dt(b),De=.5*(b.pageX+fe.x),Re=.5*(b.pageY+fe.y);u.set(De,Re)}}function F(b){if(R.length===1)f.set(b.pageX,b.pageY);else{let fe=Dt(b),De=.5*(b.pageX+fe.x),Re=.5*(b.pageY+fe.y);f.set(De,Re)}}function H(b){let fe=Dt(b),De=b.pageX-fe.x,Re=b.pageY-fe.y,mt=Math.sqrt(De*De+Re*Re);y.set(0,mt)}function te(b){n.enableZoom&&H(b),n.enablePan&&F(b)}function ee(b){n.enableZoom&&H(b),n.enableRotate&&N(b)}function E(b){if(R.length==1)d.set(b.pageX,b.pageY);else{let De=Dt(b),Re=.5*(b.pageX+De.x),mt=.5*(b.pageY+De.y);d.set(Re,mt)}p.subVectors(d,u).multiplyScalar(n.rotateSpeed);let fe=n.domElement;L(2*Math.PI*p.x/fe.clientHeight),O(2*Math.PI*p.y/fe.clientHeight),u.copy(d)}function se(b){if(R.length===1)_.set(b.pageX,b.pageY);else{let fe=Dt(b),De=.5*(b.pageX+fe.x),Re=.5*(b.pageY+fe.y);_.set(De,Re)}m.subVectors(_,f).multiplyScalar(n.panSpeed),oe(m.x,m.y),f.copy(_)}function G(b){let fe=Dt(b),De=b.pageX-fe.x,Re=b.pageY-fe.y,mt=Math.sqrt(De*De+Re*Re);v.set(0,mt),g.set(0,Math.pow(v.y/y.y,n.zoomSpeed)),J(g.y),y.copy(v);let jt=(b.pageX+fe.x)*.5,St=(b.pageY+fe.y)*.5;Y(jt,St)}function W(b){n.enableZoom&&G(b),n.enablePan&&se(b)}function re(b){n.enableZoom&&G(b),n.enableRotate&&E(b)}function he(b){n.enabled!==!1&&(R.length===0&&(n.domElement.setPointerCapture(b.pointerId),n.domElement.addEventListener("pointermove",de),n.domElement.addEventListener("pointerup",pe)),Ai(b),b.pointerType==="touch"?Ue(b):Se(b))}function de(b){n.enabled!==!1&&(b.pointerType==="touch"?Ti(b):me(b))}function pe(b){Ct(b),R.length===0&&(n.domElement.releasePointerCapture(b.pointerId),n.domElement.removeEventListener("pointermove",de),n.domElement.removeEventListener("pointerup",pe)),n.dispatchEvent(Td),r=i.NONE}function Se(b){let fe;switch(b.button){case 0:fe=n.mouseButtons.LEFT;break;case 1:fe=n.mouseButtons.MIDDLE;break;case 2:fe=n.mouseButtons.RIGHT;break;default:fe=-1}switch(fe){case Si.DOLLY:if(n.enableZoom===!1)return;ce(b),r=i.DOLLY;break;case Si.ROTATE:if(b.ctrlKey||b.metaKey||b.shiftKey){if(n.enablePan===!1)return;x(b),r=i.PAN}else{if(n.enableRotate===!1)return;Z(b),r=i.ROTATE}break;case Si.PAN:if(b.ctrlKey||b.metaKey||b.shiftKey){if(n.enableRotate===!1)return;Z(b),r=i.ROTATE}else{if(n.enablePan===!1)return;x(b),r=i.PAN}break;default:r=i.NONE}r!==i.NONE&&n.dispatchEvent(Cc)}function me(b){switch(r){case i.ROTATE:if(n.enableRotate===!1)return;S(b);break;case i.DOLLY:if(n.enableZoom===!1)return;U(b);break;case i.PAN:if(n.enablePan===!1)return;X(b);break}}function _e(b){n.enabled===!1||n.enableZoom===!1||r!==i.NONE||(b.preventDefault(),n.dispatchEvent(Cc),D(Le(b)),n.dispatchEvent(Td))}function Le(b){let fe=b.deltaMode,De={clientX:b.clientX,clientY:b.clientY,deltaY:b.deltaY};switch(fe){case 1:De.deltaY*=16;break;case 2:De.deltaY*=100;break}return b.ctrlKey&&!P&&(De.deltaY*=10),De}function lt(b){b.key==="Control"&&(P=!0,document.addEventListener("keyup",ve,{passive:!0,capture:!0}))}function ve(b){b.key==="Control"&&(P=!1,document.removeEventListener("keyup",ve,{passive:!0,capture:!0}))}function Ne(b){n.enabled===!1||n.enablePan===!1||q(b)}function Ue(b){switch(_t(b),R.length){case 1:switch(n.touches.ONE){case wi.ROTATE:if(n.enableRotate===!1)return;N(b),r=i.TOUCH_ROTATE;break;case wi.PAN:if(n.enablePan===!1)return;F(b),r=i.TOUCH_PAN;break;default:r=i.NONE}break;case 2:switch(n.touches.TWO){case wi.DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;te(b),r=i.TOUCH_DOLLY_PAN;break;case wi.DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;ee(b),r=i.TOUCH_DOLLY_ROTATE;break;default:r=i.NONE}break;default:r=i.NONE}r!==i.NONE&&n.dispatchEvent(Cc)}function Ti(b){switch(_t(b),r){case i.TOUCH_ROTATE:if(n.enableRotate===!1)return;E(b),n.update();break;case i.TOUCH_PAN:if(n.enablePan===!1)return;se(b),n.update();break;case i.TOUCH_DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;W(b),n.update();break;case i.TOUCH_DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;re(b),n.update();break;default:r=i.NONE}}function yn(b){n.enabled!==!1&&b.preventDefault()}function Ai(b){R.push(b.pointerId)}function Ct(b){delete I[b.pointerId];for(let fe=0;fe<R.length;fe++)if(R[fe]==b.pointerId){R.splice(fe,1);return}}function _t(b){let fe=I[b.pointerId];fe===void 0&&(fe=new ie,I[b.pointerId]=fe),fe.set(b.pageX,b.pageY)}function Dt(b){let fe=b.pointerId===R[0]?R[1]:R[0];return I[fe]}n.domElement.addEventListener("contextmenu",yn),n.domElement.addEventListener("pointerdown",he),n.domElement.addEventListener("pointercancel",pe),n.domElement.addEventListener("wheel",_e,{passive:!1}),document.addEventListener("keydown",lt,{passive:!0,capture:!0}),this.update()}}});var Ei,fs,Cd,Ld,Pd,Id,io,Dd=Gn(()=>{eo();Ei=class extends ot{constructor(e=document.createElement("div")){super(),this.isCSS2DObject=!0,this.element=e,this.element.style.position="absolute",this.element.style.userSelect="none",this.element.setAttribute("draggable",!1),this.center=new ie(.5,.5),this.addEventListener("removed",function(){this.traverse(function(t){t.element instanceof Element&&t.element.parentNode!==null&&t.element.parentNode.removeChild(t.element)})})}copy(e,t){return super.copy(e,t),this.element=e.element.cloneNode(!0),this.center=e.center,this}},fs=new A,Cd=new Ce,Ld=new Ce,Pd=new A,Id=new A,io=class{constructor(e={}){let t=this,n,i,r,a,o={objects:new WeakMap},l=e.element!==void 0?e.element:document.createElement("div");l.style.overflow="hidden",this.domElement=l,this.getSize=function(){return{width:n,height:i}},this.render=function(p,f){p.matrixWorldAutoUpdate===!0&&p.updateMatrixWorld(),f.parent===null&&f.matrixWorldAutoUpdate===!0&&f.updateMatrixWorld(),Cd.copy(f.matrixWorldInverse),Ld.multiplyMatrices(f.projectionMatrix,Cd),c(p,p,f),d(p)},this.setSize=function(p,f){n=p,i=f,r=n/2,a=i/2,l.style.width=p+"px",l.style.height=f+"px"};function c(p,f,_){if(p.isCSS2DObject){fs.setFromMatrixPosition(p.matrixWorld),fs.applyMatrix4(Ld);let m=p.visible===!0&&fs.z>=-1&&fs.z<=1&&p.layers.test(_.layers)===!0;if(p.element.style.display=m===!0?"":"none",m===!0){p.onBeforeRender(t,f,_);let v=p.element;v.style.transform="translate("+-100*p.center.x+"%,"+-100*p.center.y+"%)translate("+(fs.x*r+r)+"px,"+(-fs.y*a+a)+"px)",v.parentNode!==l&&l.appendChild(v),p.onAfterRender(t,f,_)}let y={distanceToCameraSquared:h(_,p)};o.objects.set(p,y)}for(let m=0,y=p.children.length;m<y;m++)c(p.children[m],f,_)}function h(p,f){return Pd.setFromMatrixPosition(p.matrixWorld),Id.setFromMatrixPosition(f.matrixWorld),Pd.distanceToSquared(Id)}function u(p){let f=[];return p.traverse(function(_){_.isCSS2DObject&&f.push(_)}),f}function d(p){let f=u(p).sort(function(m,y){if(m.renderOrder!==y.renderOrder)return y.renderOrder-m.renderOrder;let v=o.objects.get(m).distanceToCameraSquared,g=o.objects.get(y).distanceToCameraSquared;return v-g}),_=f.length;for(let m=0,y=f.length;m<y;m++)f[m].element.style.zIndex=_-m}}}});var Ud={};Xd(Ud,{Model3D:()=>Lc});function so(s,e,t,n=[1,1]){let i=document.createElement("canvas");i.width=s,i.height=e,t(i.getContext("2d"),s,e);let r=new Na(i);return r.wrapS=r.wrapT=os,r.repeat.set(...n),r.colorSpace=at,r.anisotropy=4,r}function sr(s,e,t,n){let i=s?.C?.[t];if(i){let r=new Va().load(i.src);return r.wrapS=r.wrapT=os,r.repeat.set(...n),r.colorSpace=at,r.anisotropy=4,r}return so(256,256,Nd[e],n)}var gs,Nd,Lc,Od=Gn(()=>{eo();Rd();Dd();En();Di();gs=Math.PI/180;Nd={wall:(s,e,t)=>{s.fillStyle="#efeadf",s.fillRect(0,0,e,t),s.fillStyle="#d9d3c6",s.fillRect(0,0,3,t),s.fillStyle="#f6f2ea",s.fillRect(3,0,2,t)},pad:(s,e,t)=>{s.fillStyle="#b9b9b4",s.fillRect(0,0,e,t);for(let n=0;n<900;n++)s.fillStyle=`rgba(0,0,0,${Math.random()*.06})`,s.fillRect(Math.random()*e,Math.random()*t,2,2)},ground:(s,e,t)=>{s.fillStyle="#a5643a",s.fillRect(0,0,e,t);for(let n=0;n<3e3;n++){let i=Math.random();s.fillStyle=i<.5?`rgba(80,40,20,${Math.random()*.25})`:`rgba(120,140,60,${Math.random()*.25})`,s.fillRect(Math.random()*e,Math.random()*t,3,3)}},solar:(s,e,t)=>{s.fillStyle="#1b2f57",s.fillRect(0,0,e,t),s.strokeStyle="#8fa6c8",s.lineWidth=1.2;for(let n=0;n<=e;n+=e/6)s.beginPath(),s.moveTo(n,0),s.lineTo(n,t),s.stroke();for(let n=0;n<=t;n+=t/10)s.beginPath(),s.moveTo(0,n),s.lineTo(e,n),s.stroke();s.strokeStyle="#c9d2dc",s.lineWidth=6,s.strokeRect(0,0,e,t)},crate:(s,e,t)=>{s.fillStyle="#ffffff",s.fillRect(0,0,e,t),s.fillStyle="rgba(0,0,0,.28)";for(let n=8;n<e;n+=16)s.fillRect(n,14,7,t-28)}};Lc=class{constructor(e,t,n,i){this.host=e,this.cfg=t,this.geo=t.geometry,this.manifest=i,this.sensors=n.sensors,this.picks=[],this.hoverObj=null,this.low=!1,this.mode="auto",this.doorAngle=0,this.state=null,this.clock=new Xa,this.renderer=new Vs({antialias:!0,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75)),this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=bc,this.renderer.outputColorSpace=at,this.renderer.toneMapping=Sc,e.appendChild(this.renderer.domElement),this.labels=new io,this.labels.domElement.style.cssText="position:absolute;inset:0;pointer-events:none",e.appendChild(this.labels.domElement),this.scene=new Ca,this.scene.fog=new Ra(12572650,25,90),this.camera=new Mt(45,1,.1,300),this.camera.position.set(4.6,2.7,6),this.controls=new no(this.camera,this.renderer.domElement),this.controls.target.set(0,1.3,0),this.controls.enableDamping=!0,this.controls.minDistance=3,this.controls.maxDistance=30,this.controls.maxPolarAngle=88*gs,this.controls.autoRotateSpeed=.6,this.lastInput=performance.now(),this.controls.addEventListener("start",()=>{this.lastInput=performance.now(),this.controls.autoRotate=!1}),this.lights(),this.world(),this.building(),this.canopy(),this.equipment(),this.interior(),this.sensorDots(),this.dimensions(),this.airflow(),this.pointer(),addEventListener("resize",()=>this.resize()),this.resize(),this.renderer.setAnimationLoop(()=>this.frame())}lights(){this.hemi=new tr(14675967,9067066,.9),this.scene.add(this.hemi),this.sun=new ja(16773596,2.4),this.sun.castShadow=!0,this.sun.shadow.mapSize.set(1024,1024);let e=this.sun.shadow.camera;e.left=e.bottom=-7,e.right=e.top=7,e.near=1,e.far=60,this.sun.shadow.bias=-5e-4,this.scene.add(this.sun,this.sun.target),this.lamp=new nr(16767392,0,7,1.6),this.scene.add(this.lamp)}world(){let e=new ge(new xi(120,48),new vn({map:sr(this.manifest,"ground","C5_ground",[40,40])}));e.rotation.x=-Math.PI/2,e.position.y=-.15,e.receiveShadow=!0,this.scene.add(e);let t=7,n=()=>(t=t*16807%2147483647)/2147483647,i=new vn({color:6262588});for(let l=0;l<6;l++){let c=new ge(new Bn(40,3.2),i);c.rotation.x=-Math.PI/2,c.position.set(0,-.13,-18-l*4.2),this.scene.add(c)}let r=new vn({color:7031346}),a=new vn({color:4157230});for(let l=0;l<16;l++){let c=n()*Math.PI*2,h=11+n()*14,u=Math.cos(c)*h,d=Math.sin(c)*h;if(d>4&&Math.abs(u)<8)continue;let p=1.8+n()*1.8,f=new ge(new gt(.09,.14,p,6),r);f.position.set(u,p/2-.15,d);let _=new ge(new Ks(.8+n()*.6,1),a);_.position.set(u,p+.5,d),_.castShadow=!0,this.scene.add(f,_)}let o=new ge(new $e(3.7,.15,3.6),new vn({map:sr(this.manifest,"pad","C2_pad",[3,3])}));o.position.set(0,-.075,.35),o.receiveShadow=!0,this.scene.add(o)}building(){let[e,t,n]=this.geo.outer,i=this.geo.wall_t,[r,a]=this.geo.door,o=sr(this.manifest,"wall","C1_wall",[e/1.1,1]),l=new Pe({map:o,roughness:.75,metalness:.05}),c=new Pe({color:15331830,roughness:.6}),h=(M,T,w,R,I,P,B=l)=>{let V=new ge(new $e(M,T,w),B);return V.position.set(R,I,P),V.castShadow=V.receiveShadow=!0,this.scene.add(V),this.picks.push(V),V};h(e,i,n,0,i/2,0,new Pe({color:14278370})),h(e,i,n,0,t-i/2,0),h(e,t-2*i,i,0,t/2,-n/2+i/2),h(i,t-2*i,n-2*i,-e/2+i/2,t/2,0),h(i,t-2*i,n-2*i,e/2-i/2,t/2,0);let u=(e-r)/2,d=n/2-i/2;h(u,t-2*i,i,-e/2+u/2,t/2,d),h(u,t-2*i,i,e/2-u/2,t/2,d);let p=t-2*i-a;h(r,p,i,0,i+a+p/2,d),this.doorPivot=new st,this.doorPivot.position.set(-r/2,i,n/2);let f=new ge(new $e(r,a,.09),new Pe({color:15855076,roughness:.6}));f.position.set(r/2,a/2,.02),f.castShadow=!0,new ge(new $e(r+.08,a+.06,.02),new Pe({color:2236962})).position.set(r/2,a/2,-.02);let m=new ge(new $e(.14,.03,.05),new Pe({color:11184810,metalness:.8,roughness:.3}));m.position.set(r-.12,1,.09),this.doorPivot.add(f,m),this.scene.add(this.doorPivot);let y=new Pe({color:2764595,metalness:.4,roughness:.5});for(let[M,T,w,R]of[[.04,a+.04,-r/2-.02,i+a/2],[.04,a+.04,r/2+.02,i+a/2],[r+.08,.04,0,i+a+.02]]){let I=new ge(new $e(M,T,.03),y);I.position.set(w,R,n/2+.012),this.scene.add(I)}f.userData.part="door",this.picks.push(f),this.curtain=new st;let v=new Pe({color:13625599,transparent:!0,opacity:.35,roughness:.1,side:td});for(let M=0;M<6;M++){let T=new ge(new Bn(r/6+.02,a),v);T.position.set(-r/2+r/12+M*r/6,i+a/2,n/2-i-.02),this.curtain.add(T)}this.scene.add(this.curtain);let g=new ge(new Bn(e-2*i,t-2*i),new On({color:13625079}));g.position.set(0,t/2,-n/2+i+.01),this.scene.add(g)}canopy(){let e=this.geo.pv,t=this.geo.outer[1],n=e.tilt_deg*gs,i=e.cols*e.module_w+.12,r=e.rows*e.module_l+.12,a=t+e.low_edge_above_roof_m,o=a+r/2*Math.sin(n);this.canopyGroup=new st,this.canopyGroup.position.set(0,o,0),this.canopyGroup.rotation.x=n;let l=new Pe({color:12107460,metalness:.7,roughness:.4}),c=new ge(new $e(i,.06,r),l);c.castShadow=!0,this.canopyGroup.add(c);let h=sr(this.manifest,"solar","C6_solar",[1,1]);this.pvMat=new Pe({map:h,metalness:.35,roughness:.25,emissive:1718906,emissiveIntensity:0});for(let f=0;f<e.rows;f++)for(let _=0;_<e.cols;_++){if(f*e.cols+_>=e.modules)continue;let m=new ge(new $e(e.module_w-.02,.035,e.module_l-.02),this.pvMat);m.position.set(-i/2+.06+e.module_w*(_+.5),.045,-r/2+.06+e.module_l*(f+.5)),m.castShadow=!0,m.userData.part="solar",this.picks.push(m),this.canopyGroup.add(m)}this.scene.add(this.canopyGroup);let[u,,d]=this.geo.outer;for(let[f,_]of[[-u/2+.1,-d/2+.1],[u/2-.1,-d/2+.1],[-u/2+.1,d/2-.1],[u/2-.1,d/2-.1]]){let y=o-_*Math.tan(n)-.04-t,v=new ge(new $e(.06,y,.06),l);v.position.set(f,t+y/2,_),v.castShadow=!0,this.scene.add(v)}this.canopyInfo={cw:i,cl:r,low:a,high:a+r*Math.sin(n),cy:o};let p=document.createElement("div");p.className="lbl3d pv",p.textContent="PV \u2013",this.pvLabel=new Ei(p),this.pvLabel.position.set(0,this.canopyInfo.high+.35,-r/2*Math.cos(n)),this.scene.add(this.pvLabel)}equipment(){let[e,t,n]=this.geo.outer,i=new st,r=new ge(new $e(.3,.55,.8),new Pe({color:15527664,roughness:.5}));r.castShadow=!0,r.userData.part="condenser",this.picks.push(r);let a=new ge(new xi(.2,32),new Pe({color:5593952,metalness:.6,roughness:.5}));a.rotation.y=Math.PI/2,a.position.set(.152,0,-.1),this.fan=new st;for(let y=0;y<3;y++){let v=new ge(new $e(.01,.17,.06),new Pe({color:14540253}));v.position.y=.08;let g=new st;g.add(v),g.rotation.x=y*2*Math.PI/3,this.fan.add(g)}this.fan.position.set(.16,0,-.1);let o=new ge(new $e(.34,.03,.7),new Pe({color:9213083}));o.position.y=-.29,i.add(r,a,this.fan,o),i.position.set(e/2+.17,.9,.45),this.scene.add(i);let l=new Pe({color:12088115,metalness:.8,roughness:.35}),c=new ge(new gt(.012,.012,1,8),l);c.position.set(e/2+.02,1.65,.05),this.scene.add(c);let h=new ge(new $e(.4,.5,.15),new Pe({color:10133670,metalness:.3}));h.position.set(.6,1.3,-n/2-.08),h.castShadow=!0,this.scene.add(h);let u=new st,d=new ge(new gt(.025,.03,2.3,10),new Pe({color:13159890,metalness:.6,roughness:.4}));d.position.y=1.15-.15;let p=new st;for(let y=0;y<6;y++){let v=new ge(new gt(.075,.09,.025,16),new Pe({color:16777215}));v.position.y=y*.03,p.add(v)}p.position.set(.12,1.43,0),this.cups=new st;for(let y=0;y<3;y++){let v=new st,g=new ge(new kn(.03,8,6,0,Math.PI),new Pe({color:2236962}));g.position.x=.11,v.add(g),v.rotation.y=y*2*Math.PI/3,this.cups.add(v)}this.cups.position.y=2.17,u.add(d,p,this.cups),u.position.set(1.75,0,2.05),u.traverse(y=>{y.isMesh&&(y.castShadow=!0)}),this.scene.add(u);let f=sr(this.manifest,"crate","C8_crate",[1,1]),_=[5939279,9400210,5664952,10512981],m=0;for(let[y,v,g]of[[-1.15,0,1.45],[-.62,0,1.45],[-1.15,.31,1.45],[-.62,.31,1.45]]){let M=new ge(new $e(.5,.3,.36),new Pe({map:f,color:_[m++%4]}));M.position.set(y,v+.15,g),M.castShadow=!0,M.userData.part="crates",this.picks.push(M),this.scene.add(M);let T=new ge(new kn(.2,8,6,0,Math.PI*2,0,Math.PI/2),new vn({color:5216826}));T.scale.set(1.1,.45,.8),T.position.set(y,v+.3,g),v>0&&this.scene.add(T)}this.lamp.position.set(0,t-.05,n/2+.4)}interior(){let[e,t,n]=this.geo.inner,i=this.geo.wall_t,r=-e/2,a=-n/2,o=i,l=new Pe({color:13226456,metalness:.8,roughness:.35}),c=new Pe({color:14278886,metalness:.7,roughness:.4,transparent:!0,opacity:.55}),h=(O,k)=>(O.castShadow=!1,k&&(O.userData.part=k,this.picks.push(O)),this.scene.add(O),O),u=1.35,d=.45,p=a+.1+u/2,f=[.18,.62,1.06,1.5];for(let O of[-1,1]){let k=O*(e/2-d/2-.03);for(let[Q,oe]of[[-1,-1],[-1,1],[1,-1],[1,1]]){let J=new ge(new gt(.012,.012,1.75,6),l);J.position.set(k+Q*(d/2-.02),o+.875,p+oe*(u/2-.02)),h(J)}f.forEach(Q=>{let oe=new ge(new $e(d,.015,u),c);oe.position.set(k,o+Q,p),h(oe)})}let _=so(256,256,Nd.crate),m=(O,k,Q,oe,J,j)=>{let Y=new ge(new $e(.38,.24,.5),new Pe({map:_,color:oe}));Y.position.set(O,o+k+.13,Q),h(Y,j);let z=new ge(new kn(.2,10,6,0,Math.PI*2,0,Math.PI/2),new vn({color:J}));z.scale.set(.95,.35,1.2),z.position.set(O,o+k+.25,Q),h(z,j)},y=e/2-d/2-.03;[[-y,.62,p-.38,9400210,3111466,"crate_greens"],[-y,.62,p+.3,5939279,3111466,"crate_greens"],[-y,.18,p-.38,5664952,3901998,"crate_greens"],[-y,.18,p+.3,10512981,11916138,"crate_grapes"],[y,.62,p-.38,5939279,11916138,"crate_grapes"],[y,.62,p+.3,9400210,11916138,"crate_grapes"],[y,.18,p-.38,5939279,11916138,"crate_grapes"],[y,1.06,p-.38,5939279,3111466,"crate_greens"]].forEach(O=>m(...O));let v=new Pe({color:14673128,metalness:.85,roughness:.25});for(let[O,k]of[[-.3,a+.25],[.3,a+.25]]){let Q=new ge(new gt(.15,.17,.5,18),v);Q.position.set(O,o+.25,k),h(Q,"milk");let oe=new ge(new gt(.07,.12,.12,14),v);oe.position.set(O,o+.56,k),h(oe,"milk")}let g=new ge(new $e(.3,.22,.3),new Pe({color:16054266}));g.position.set(y,o+1.5+.12,p+.3),h(g,"vaccine");let M=new ge(new Bn(.12,.12),new On({color:2783446}));M.rotation.y=-Math.PI/2,M.position.set(y-.151,o+1.62,p+.3),h(M),this.pcmMat=new Pe({color:10275317,metalness:.5,roughness:.45,transparent:!0,opacity:.95});let T=(O,k,Q,oe,J,j)=>{let Y=new ge(new $e(O,k,.03),this.pcmMat);Y.position.set(Q,o+oe,J),Y.rotation.y=j,h(Y,"pcm")};T(.55,1.2,-.55,.95,a+.035,0),T(.55,1.2,.55,.95,a+.035,0),T(.55,.35,r+.035,1.92,a+.45,Math.PI/2),T(.55,.35,-r-.035,1.92,a+.45,-Math.PI/2);let w=new Pe({color:14279144,metalness:.7,roughness:.35}),R=new $e(.004,1.2,.04);for(let O of[-.55,.55])for(let k=0;k<22;k++){let Q=new ge(R,w);Q.position.set(O-.2625+k*.025,o+.95,a+.035+.015+.02),h(Q,"fins")}let I=new ge(new $e(1.25,.04,.14),new Pe({color:11122370,metalness:.6,roughness:.4}));I.position.set(0,o+.31,a+.09),I.rotation.x=.06,h(I,"driptray");let P=new ge(new gt(.012,.012,.3,8),new Pe({color:7043720}));P.position.set(.64,o+.16,a+.09),h(P,"driptray");let B=new ge(new gt(.01,.01,.55,8),new Pe({color:12088115,metalness:.8,roughness:.3}));B.rotation.z=Math.PI/2,B.position.set(0,o+.95,a+.05),h(B);let V=new ge(new $e(.72,.36,.34),new Pe({color:15922422,roughness:.5}));V.position.set(0,o+t-.3,a+.19),h(V,"evaporator");let L=new ge(new xi(.14,28),new Pe({color:5988968,metalness:.5}));L.position.set(0,o+t-.3,a+.362),h(L,"evaporator"),this.evapFan=new st;for(let O=0;O<4;O++){let k=new ge(new $e(.035,.12,.01),new Pe({color:13620956}));k.position.y=.06;let Q=new st;Q.add(k),Q.rotation.z=O*Math.PI/2,this.evapFan.add(Q)}this.evapFan.position.set(0,o+t-.3,a+.37),this.scene.add(this.evapFan)}sensorDots(){this.dotGroup=new st;let e=so(64,64,(t,n)=>{let i=t.createRadialGradient(32,32,0,32,32,32);i.addColorStop(0,"rgba(160,255,240,1)"),i.addColorStop(.35,"rgba(20,184,166,.7)"),i.addColorStop(1,"rgba(20,184,166,0)"),t.fillStyle=i,t.fillRect(0,0,n,n)});this.dots=[];for(let t of this.sensors){let n=new ge(new kn(.045,14,10),new On({color:16777215})),i=new Pa(new $s({map:e,depthWrite:!1,blending:nd,transparent:!0}));i.scale.set(.22,.22,1),n.add(i),n.position.set(...t.pos),n.userData.sensor=t.id,n.userData.halo=i,n.userData.scene=t.scene,n.visible=t.scene!=="inside",this.dotGroup.add(n),this.picks.push(n),this.dots.push(n)}this.scene.add(this.dotGroup)}dimensions(){let[e,t,n]=this.geo.outer,i=this.geo.wall_t,[r,a]=this.geo.door,o=this.geo.inner;this.dimGroup=new st;let l=new yi({color:16777215}),c=(v,g,M)=>{let T=[v,g],w=M.clone().multiplyScalar(.08);T.push(v.clone().add(w),v.clone().sub(w),g.clone().add(w),g.clone().sub(w));let R=new Ye().setFromPoints([T[0],T[1],T[2],T[3],T[4],T[5]]);this.dimGroup.add(new Ia(R,l))},h=(v,g)=>{let M=document.createElement("div");M.className="lbl3d dim",M.textContent=v;let T=new Ei(M);T.position.copy(g),this.dimGroup.add(T)},u=(v,g,M)=>new A(v,g,M),d=n/2+.55,p=e/2+.75;c(u(-e/2,.02,d),u(e/2,.02,d),u(0,0,1)),h(`${e.toFixed(2)} m outside (${o[0]} m inside)`,u(0,.02,d+.12)),c(u(p,.02,-n/2),u(p,.02,n/2),u(1,0,0)),h(`${n.toFixed(2)} m (${o[2]} m inside)`,u(p+.1,.02,0)),c(u(-e/2-.35,0,n/2),u(-e/2-.35,t,n/2),u(1,0,0)),h(`${t.toFixed(2)} m (${o[1]} m inside)`,u(-e/2-.4,t/2,n/2)),c(u(-r/2,i+a+.12,n/2+.05),u(r/2,i+a+.12,n/2+.05),u(0,1,0)),h(`door ${r} \xD7 ${a} m`,u(0,i+a+.22,n/2+.05)),h(`wall: ${Math.round(i*1e3)} mm PUF, U = ${(this.cfg.design.chamber.insulation_k_W_mK/i).toFixed(2)} W/m\xB2K`,u(e/2,t+.05,n/2));let f=this.canopyInfo,_=this.geo.pv.tilt_deg,m=f.cl/2*Math.cos(_*gs);c(u(-f.cw/2-.15,f.low,m),u(-f.cw/2-.15,f.high,-m),u(1,0,0)),h(`PV tilt ${_}\xB0 facing south \xB7 ${this.geo.pv.modules} \xD7 ${this.geo.pv.module_W} W = ${this.geo.pv.array_kWp.toFixed(1)} kWp`,u(-f.cw/2-.2,(f.low+f.high)/2+.25,0));let y=new Ya(u(0,0,1),u(2.6,.02,1.8),.9,16765286,.22,.14);this.dimGroup.add(y),h("S (sun side)",u(2.6,.05,2.85)),this.scene.add(this.dimGroup)}airflow(){let[,e,t]=this.geo.outer,n=this.geo.wall_t,[i,r]=this.geo.door;this.door={z:t/2,y0:n,dw:i,dh:r},this.flowMax=700;let a=so(32,32,(h,u)=>{let d=h.createRadialGradient(16,16,0,16,16,16);d.addColorStop(0,"rgba(255,255,255,1)"),d.addColorStop(.6,"rgba(255,255,255,.6)"),d.addColorStop(1,"rgba(255,255,255,0)"),h.fillStyle=d,h.fillRect(0,0,u,u)}),o=h=>{let u=new Ye;u.setAttribute("position",new Rt(new Float32Array(this.flowMax*3),3)),u.setDrawRange(0,0);let d=new js({color:h,map:a,size:.06,transparent:!0,opacity:.9,depthWrite:!1,sizeAttenuation:!0}),p=new Da(u,d);return p.frustumCulled=!1,this.scene.add(p),{pts:p,list:[]}};this.warm=o(16742973),this.cold=o(5286655),this.flowAcc=0;let l=document.createElement("div");l.className="lbl3d heat",l.style.display="none",this.heatLabel=new Ei(l),this.heatLabel.position.set(0,n+r+.45,t/2+.3),this.scene.add(this.heatLabel);let c=new ds(new Ye().setFromPoints([new A(-i/2,n+r/2,t/2+.02),new A(i/2,n+r/2,t/2+.02)]),new Wa({color:16777215,dashSize:.06,gapSize:.04}));c.computeLineDistances(),c.visible=!1,this.neutralLine=c,this.scene.add(c),this.inLight=new nr(14676223,0,6,1),this.inLight.position.set(0,e-.55,.35),this.scene.add(this.inLight),this.inFill=new tr(15398143,10466244,0),this.scene.add(this.inFill)}stepAirflow(e,t){let n=this.state?.values,i=this.door,r=[this.warm,this.cold];if(!t||!n){r.forEach(c=>{c.list.length=0,c.pts.geometry.setDrawRange(0,0)}),this.heatLabel.element.style.display="none",this.neutralLine.visible=!1;return}let a=n.heat_if_open_kW,o=.45+1.6*n.v_door_if_open;for(this.flowAcc+=Math.min(this.low?140:320,9*a)*e;this.flowAcc>=1;){this.flowAcc-=1;let c=Math.random()<.5,h=c?this.warm:this.cold;if(h.list.length>=this.flowMax)continue;let u=(Math.random()-.5)*i.dw,d=c?i.y0+i.dh*(.55+Math.random()*.42):i.y0+i.dh*(.03+Math.random()*.42);h.list.push(c?{x:u,y:d,z:i.z+1.2,vz:-o,vy:.06}:{x:u,y:d,z:i.z-.9,vz:o,vy:-.25})}for(let c of r){let h=c.pts.geometry.attributes.position.array;c.list=c.list.filter(u=>(u.z+=u.vz*e,u.y=Math.max(.03,u.y+u.vy*e*(u.vz>0?u.z>i.z?1:.2:.3)),u.vz>0&&(u.x*=1+.35*e*(u.z>i.z?1:0)),u.vz<0?u.z>i.z-1.3:u.z<i.z+1.6)),c.list.forEach((u,d)=>{h[d*3]=u.x,h[d*3+1]=u.y,h[d*3+2]=u.z}),c.pts.geometry.attributes.position.needsUpdate=!0,c.pts.geometry.setDrawRange(0,c.list.length)}let l=this.heatLabel.element;l.style.display="",l.innerHTML=`Heat entering now: <b>${a.toFixed(1)} kW</b> \xB7 curtain ${n.curtain?"ON":"OFF"}<br><small>this opening ${n.last_open_s.toFixed(0)} s \u2192 ${n.last_open_kJ.toFixed(0)} kJ (= ${n.last_open_wall_minutes.toFixed(0)} min of wall heat)</small>`,this.neutralLine.visible=!0}tweenCamera(e,t,n){return new Promise(i=>{let r=this.camera.position.clone(),a=this.controls.target.clone(),o=performance.now();this.tween=()=>{let l=Math.min(1,(performance.now()-o)/(n*1e3)),c=l<.5?2*l*l:1-Math.pow(-2*l+2,2)/2;this.camera.position.lerpVectors(r,e,c),this.controls.target.lerpVectors(a,t,c),l>=1&&(this.tween=null,i())}})}async enter(){if(this.busy)return;this.busy=!0,this.forceDoor=!0,this.lastInput=performance.now()+1e9,this.controls.enabled=!1;let e=this.geo.outer[2],t=(n,i,r)=>new A(n,i,r);this.setDimsVisible(!1),this.sensorsVisible(!1),await this.tweenCamera(t(.9,1.65,e/2+3.2),t(0,1.2,e/2),2.5),await new Promise(n=>setTimeout(n,4200)),this.camera.fov=62,this.camera.updateProjectionMatrix(),await this.tweenCamera(t(0,1.6,e/2-.25),t(0,1.15,-.55),2.8),this.inside=!0,this.insideSensors(!0),this.forceDoor=!1,this.controls.enabled=!0,this.controls.minDistance=.4,this.controls.maxDistance=1.75,this.controls.enablePan=!1,this.busy=!1,this.onInside?.(!0)}async walkIn(e){if(this.busy)return;this.inside&&await this.exit();let t=this.geo.outer[2],n=this.geo.wall_t,i=new st,r=new Pe({color:15327954}),a=new Pe({color:7031346}),o=new ge(new gt(.17,.15,.75,12),r);o.position.y=1.15;let l=new ge(new gt(.14,.11,.8,10),new Pe({color:3882822}));l.position.y=.4;let c=new ge(new kn(.11,14,10),a);c.position.y=1.65;let h=new ge(new $e(.42,.24,.32),new Pe({color:5939279}));h.position.set(0,1.1,-.25),i.add(o,l,c,h),i.traverse(v=>v.isMesh&&(v.castShadow=!0)),this.scene.add(i),this.busy=!0,this.controls.enabled=!1,await this.tweenCamera(new A(2.6,2.1,t/2+3.6),new A(0,1,t/2),1.5);let u=[[1.8,t/2+2.4],[0,t/2+.6],[0,t/2-.4],[-.45,-.1]],d=[u[0][0],u[0][1]];i.position.set(d[0],0,d[1]);for(let v=1;v<u.length;v++){v===2&&(this.forceDoor=!0,await new Promise(R=>setTimeout(R,900)));let g=u[v],M=Math.hypot(g[0]-d[0],g[1]-d[1]),T=M/1.1*1e3,w=performance.now();i.rotation.y=Math.atan2(g[0]-d[0],g[1]-d[1])+Math.PI,await new Promise(R=>{let I=()=>{let P=Math.min(1,(performance.now()-w)/T);i.position.set(d[0]+(g[0]-d[0])*P,Math.abs(Math.sin(P*M*6))*.03,d[1]+(g[1]-d[1])*P),P<1?requestAnimationFrame(I):R()};I()}),d=g}this.scene.remove(i);let p=n,f=this.geo.inner[0]/2-.255,_=new ge(new $e(.38,.24,.5),new Pe({color:16096779,emissive:8014336,emissiveIntensity:.35}));_.position.set(-f,p+1.5+.13,-.55),_.userData.part="batch:"+e,this.picks.push(_),this.scene.add(_);let m=document.createElement("div");m.className="lbl3d heat",m.textContent=`NEW \xB7 ${e}`;let y=new Ei(m);y.position.set(-f,p+1.9,-.55),this.scene.add(y),this.newCrate?.forEach(v=>this.scene.remove(v)),this.newCrate=[_,y],this.forceDoor=!1,this.busy=!1,this.controls.enabled=!0,this.lastInput=performance.now()}sensorsVisible(e){this.dots.forEach(t=>t.visible=e&&t.userData.scene!=="inside")}insideSensors(e){this.dots.forEach(t=>{t.userData.scene!=="outside"&&(t.visible=e||t.userData.scene==="both"),e&&t.userData.scene==="outside"&&(t.visible=!1)})}async exit(){this.busy||(this.busy=!0,this.controls.enabled=!1,this.controls.minDistance=3,this.controls.maxDistance=30,this.controls.enablePan=!0,this.camera.fov=45,this.camera.updateProjectionMatrix(),await this.tweenCamera(new A(4.6,2.7,6),new A(0,1.3,0),2.5),this.inside=!1,this.forceDoor=!1,this.insideSensors(!1),this.setDimsVisible(this.dimsOn!==!1),this.sensorsVisible(!0),this.controls.enabled=!0,this.busy=!1,this.lastInput=performance.now(),this.onInside?.(!1))}pointer(){let e=new qa,t=new ie,n=this.renderer.domElement,i=a=>{let o=n.getBoundingClientRect();t.set((a.clientX-o.left)/o.width*2-1,-((a.clientY-o.top)/o.height)*2+1),e.setFromCamera(t,this.camera);let l=e.intersectObjects(this.picks,!1)[0];return l&&(l.object.userData.sensor||l.object.userData.part)?l.object:null};n.addEventListener("pointermove",a=>{this.lastInput=performance.now();let o=i(a);if(this.hoverObj&&this.hoverObj!==o&&this.hoverObj.userData.sensor&&this.hoverObj.scale.setScalar(1),this.hoverObj=o,n.style.cursor=o?"pointer":"grab",!o)return Sn();o.userData.sensor?(o.scale.setScalar(1.6),Pi(vr(o.userData.sensor),a.clientX,a.clientY)):Pi(yr(o.userData.part),a.clientX,a.clientY)}),n.addEventListener("pointerleave",Sn);let r=null;n.addEventListener("pointerdown",a=>r=[a.clientX,a.clientY]),n.addEventListener("pointerup",a=>{if(!r||Math.hypot(a.clientX-r[0],a.clientY-r[1])>5)return;let o=i(a);o&&(Sn(),o.userData.sensor?Ii(o.userData.sensor):ln(o.userData.part))})}update(e,t){this.state=e,this.mode=t;let n=e.values;this.pvLabel.element.textContent=`PV ${n.P_pv.toFixed(2)} kW`,this.pvMat.emissiveIntensity=Math.min(.5,n.P_pv/3),this.curtain.visible=!!n.curtain;let i=Math.max(0,Math.min(1,n.pcm_pct/100));this.pcmMat.color.setRGB(.86-.25*i,.88-.09*i,.9+.06*i),this.pcmMat.opacity=.5+.45*i,this.sky(e,t)}sky(e,t){let n=e.sun.elevation_deg,i=e.sun.azimuth_deg,r=n<-2?"night":e.day_class==="rainy"?"monsoon":"day",a=Math.max(n,3)*gs,o=i*gs,l=new A(Math.cos(a)*Math.sin(o),Math.sin(a),-Math.cos(a)*Math.cos(o));this.sun.position.copy(l.multiplyScalar(30));let c=r==="night",h=r==="monsoon",u=!c&&n<12,d=c?727088:h?9279391:u?15775626:10472430;this.scene.background=new Ae(d),this.scene.fog.color.set(d),this.scene.fog.near=h?12:25,this.scene.fog.far=h?55:90,this.sun.intensity=c?.05:h?.6:u?1.2:2.4,this.hemi.intensity=c?.4:.9,this.lamp.intensity=c?9:0,this.renderer.toneMappingExposure=c?.8:1}setLow(e){this.low=e,this.renderer.setPixelRatio(e?1:Math.min(devicePixelRatio,1.75)),this.renderer.shadowMap.enabled=!e,this.scene.traverse(t=>{t.material&&(t.material.needsUpdate=!0)}),this.resize()}setDimsVisible(e){this.dimGroup.traverse(t=>t.visible=e)}showDims(e){this.dimsOn=e,!this.inside&&!this.busy&&this.setDimsVisible(e)}setActive(e){this.active=e,e&&this.resize()}resize(){let e=this.host.clientWidth||innerWidth,t=this.host.clientHeight||innerHeight;this.camera.aspect=e/t,this.camera.updateProjectionMatrix(),this.renderer.setSize(e,t),this.labels.setSize(e,t)}frame(){if(!this.active)return;let e=Math.min(.1,this.clock.getDelta()),t=this.state?.values;if(t){let i=(this.forceDoor?95:t.door_angle||0)*gs;this.doorAngle+=(i-this.doorAngle)*Math.min(1,e*3),this.doorPivot.rotation.y=-this.doorAngle,this.fan.rotation.x+=e*(t.comp_speed_pct/100)*25,this.evapFan.rotation.z+=e*(.25+t.comp_speed_pct/100)*18,this.cups.rotation.y+=e*(t.wind||0)*2.2}let n=1+.25*Math.sin(performance.now()/300);for(let i of this.dots)i.userData.halo.scale.setScalar(.22*n);this.stepAirflow(e,this.doorAngle>.5),this.inLight.intensity=this.doorAngle>.2||this.inside?9:0,this.inFill.intensity=this.inside?.45:0,this.tween&&this.tween(),this.controls.autoRotate=!this.inside&&!this.busy&&performance.now()-this.lastInput>8e3,this.controls.update(),this.fps?.(this.renderer.info.render),this.renderer.render(this.scene,this.camera),this.labels.render(this.scene,this.camera)}}});var qd=new Uint32Array([1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298]);function Bc(s){let e=new TextEncoder().encode(s),t=e.length,n=t*8,i=t+9+63>>6<<6,r=new Uint8Array(i);r.set(e),r[t]=128;let a=new DataView(r.buffer);a.setUint32(i-4,n>>>0),a.setUint32(i-8,Math.floor(n/2**32));let o=new Uint32Array([1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225]),l=new Uint32Array(64),c=(h,u)=>h>>>u|h<<32-u;for(let h=0;h<i;h+=64){for(let g=0;g<16;g++)l[g]=a.getUint32(h+g*4);for(let g=16;g<64;g++){let M=c(l[g-15],7)^c(l[g-15],18)^l[g-15]>>>3,T=c(l[g-2],17)^c(l[g-2],19)^l[g-2]>>>10;l[g]=l[g-16]+M+l[g-7]+T>>>0}let[u,d,p,f,_,m,y,v]=o;for(let g=0;g<64;g++){let M=c(_,6)^c(_,11)^c(_,25),T=_&m^~_&y,w=v+M+T+qd[g]+l[g]>>>0,R=c(u,2)^c(u,13)^c(u,22),I=u&d^u&p^d&p,P=R+I>>>0;v=y,y=m,m=_,_=f+w>>>0,f=p,p=d,d=u,u=w+P>>>0}o[0]+=u,o[1]+=d,o[2]+=p,o[3]+=f,o[4]+=_,o[5]+=m,o[6]+=y,o[7]+=v}return[...o].map(h=>h.toString(16).padStart(8,"0")).join("")}var ho="0".repeat(64),Yd=["T_min","T_avg","T_max","RH_avg","door_min","pcm_pct"];function Zd(s){let e=Yd.map(t=>`${t}=${Number(s.summary[t]).toFixed(2)}`).join(";");return[s.index,s.timestamp,s.batch_ids.join(","),e,s.flag,s.prev_hash].join("|")}var lr=s=>Bc(Zd(s));function kc(s){return s.map((e,t)=>({index:e.index,ownOk:lr(e)===e.hash,linkOk:t===0?!0:e.prev_hash===s[t-1].hash}))}var Ze=window.STATIC_DATA,Te=Ze.cols,Qf=Ze.n,Jt=Ze.dt,mo="coldtrust-static-v1",ys=Ze.windows;function xs(s){for(let[t,,n]of ys)if(s>=t&&s<t+n*Jt)return s;let e=ys.find(([t])=>t>s);return e?e[0]:ys[0][0]}function Vn(s){s=xs(s);for(let[e,t,n]of ys)if(s>=e&&s<e+n*Jt)return t+Math.floor((s-e)/Jt);return 0}function cr(s){return ys.find(([,e,t])=>s>=e&&s<e+t)}var zc=s=>{let[e,t]=cr(s);return e+(s-t)*Jt};function fo(s,e){let[,t]=cr(s),n=Math.max(t,s-e),i=[];for(let r=n;r<=s;r++)i.push(r);return i}var Wn=s=>String(s).padStart(2,"0"),Hc=Date.parse((Ze.t0||"2026-01-01T00:00:00")+"Z");function hr(s,e=!0){let t=new Date(Hc+s*1e3);return`${t.getUTCFullYear()}-${Wn(t.getUTCMonth()+1)}-${Wn(t.getUTCDate())} ${Wn(t.getUTCHours())}:${Wn(t.getUTCMinutes())}`+(e?`:${Wn(t.getUTCSeconds())}`:"")}var Jd=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function Gc(s){let e=new Date(Hc+s*1e3);return`${Wn(e.getUTCDate())} ${Jd[e.getUTCMonth()]} ${Wn(e.getUTCHours())}:${Wn(e.getUTCMinutes())}`}var be=null;function go(){try{be=JSON.parse(localStorage.getItem(mo))}catch{be=null}be||(be={blocks:[],batches:{},seq:0,lastHour:null,fault:null,orig:{}})}function Ci(){try{localStorage.setItem(mo,JSON.stringify(be))}catch{}}go();var uo=Ze.design.physics_check.threshold_K,Wc=Ze.design.physics_check.persist_minutes*60,po=s=>be.fault&&s>=be.fault.since?be.fault.offset:0;function Vc(s,e,t,n){be.seq+=1;let i=hr(s,!1),r=`CT-${i.slice(2,4)}${i.slice(5,7)}${i.slice(8,10)}-${String(be.seq).padStart(3,"0")}`,a={id:r,farmer:(e||"Farmer").trim().slice(0,40),crop:t,crop_label:Ze.crops[t].label,weight_kg:+n,entry_t:s,entry_time:i};return be.batches[r]=a,Ci(),a}function Kd(s,e,t,n){let i=be.blocks.length?be.blocks[be.blocks.length-1].hash:ho,r=o=>Math.round(o*100)/100,a={index:be.blocks.length,timestamp:s,batch_ids:[...e].sort(),flag:n,prev_hash:i,summary:Object.fromEntries(Object.entries(t).map(([o,l])=>[o,r(l)]))};a.hash=lr(a),be.blocks.push(a)}function Qd(s){let e=Vn(s*3600),t=3600/Jt,n=[],i=[];for(let c=0;c<t;c++){let h=s*3600+c*Jt;n.push(Te.T_room[e+c]+po(h)),i.push(po(h))}let r=0;for(let c=0;c<t;c++)r+=Te.door_s[e+c];let a=i.some(c=>Math.abs(c)>uo),o=be.fault&&(s+1)*3600-be.fault.since>=Wc,l=Object.values(be.batches).filter(c=>c.entry_t<(s+1)*3600).map(c=>c.id);Kd(hr(s*3600,!1),l,{T_min:Math.min(...n),T_avg:n.reduce((c,h)=>c+h,0)/t,T_max:Math.max(...n),RH_avg:Ze.design.setpoint.rh_room_pct,door_min:r/60,pcm_pct:Te.pcm_pct[e+t-1]},a&&o?"Sensor suspicious \u2013 check":"OK")}function $c(s){s=xs(s);let e=Math.floor(s/3600);if(be.lastHour===null){[["grapes",5,"Ramu (Anakapalle)",120],["leafy_greens",2,"Lakshmi (Sabbavaram)",60],["milk",1,"Dairy co-op Pendurthi",80]].forEach(([r,a,o,l])=>Vc(s-a*86400,o,r,l)),be.lastHour=e-24;let[i]=cr(Vn(s));be.lastHour=Math.max(be.lastHour,Math.ceil(i/3600))}if(e<be.lastHour){be.lastHour=e,Ci();return}let t=be.lastHour,[n]=cr(Vn(s));t=Math.max(t,Math.ceil(n/3600),e-24);for(let i=t;i<e;i++)Qd(i);e!==be.lastHour&&(be.lastHour=e,Ci())}function _o(){let s=null,e=[];return be.blocks.forEach((t,n)=>{let i=lr(t)===t.hash,r=t.prev_hash===(n?be.blocks[n-1].hash:ho),a=s!==null?"untrusted":i?r?"ok":"link broken":"data changed";a!=="ok"&&s===null&&(s=n),e.push(a)}),{valid:s===null,first_bad:s,status:e}}function jc(s,e,t){let n=0,i=0,r=0,a=s.chill_injury_below_C,o=s.freeze_below_C??null;for(let u of e)n+=1/s.SL_ref_days*s.Q10**((u-s.T_ref_C)/10)*t/24,a!=null&&u<a&&(i+=t*60),o!==null&&u<o&&(r+=t*60);n=Math.min(1,n);let l=e[e.length-1],c=1/s.SL_ref_days*s.Q10**((l-s.T_ref_C)/10),h=[];return a!=null&&i>=60&&h.push(`Chilling injury risk: ${(i/60).toFixed(1)} h below ${a} C (safe range for ${s.label} is ${s.T_opt_low_C}-${s.T_opt_high_C} C).`),o!==null&&r>0&&h.push(`Freezing risk: ${r.toFixed(0)} min below ${o} C.`),{fraction_used:n,freshness_score:Math.round(1e3*(1-n))/10,remaining_days_at_ref:s.SL_ref_days*(1-n),remaining_days_at_current_T:(1-n)/c,T_ref_C:s.T_ref_C,T_now_C:l,chill_minutes:i,freeze_minutes:r,warnings:h}}function ep(s,e){s=xs(s),$c(s);let t=Vn(s),n=e===null?Ze.design.door.curtain_installed:e,i=n?"on":"off",r=Te.door_s[t],a=s-zc(t),o=r>0&&a<r,l=Te[`heat_if_open_${i}`][t],c=po(s),h=be.fault&&s>=be.fault.since?s-be.fault.since:0,u=Math.abs(c)>uo&&h>=Wc,d={};for(let f of Ze.state_fields)d[f]=Te[f][t];Object.assign(d,{RH_room:Ze.design.setpoint.rh_room_pct,T_batch:Number.isNaN(Te.T_batch[t])||Te.T_batch[t]===null?null:Te.T_batch[t],grid_on:!!Te.grid_on[t],backup_h:Te.backup_h[t],door_open:o,door_angle:o?90*Math.max(0,Math.min(1,a/2,(r-a)/2)):0,door_s_this_5min:r,door_open_today_s:(Te.door_before?Te.door_before[t]:0)+Math.min(a,r),heat_if_open_kW:l,heat_now_kW:o?l:0,heat_sensible_now_kW:o?l*(1-Te.lat_frac[t]):0,heat_latent_now_kW:o?l*Te.lat_frac[t]:0,v_door_if_open:Te[`v_if_open_${i}`][t],v_door_top:o?Te[`v_if_open_${i}`][t]:0,v_door_mid:0,v_door_bot:o?Te[`v_if_open_${i}`][t]:0,last_open_kJ:l*Te.last_open_s[t],last_open_wall_minutes:l*Te.last_open_s[t]/Math.max(Te.Q_wall[t],1e-6)/60,curtain:n,E:n?Ze.design.door.curtain_effectiveness_E:0,gas_ppm:null,T_room_sensor:Te.T_room[t]+c,physics_residual_K:c,sensor_suspicious:u,fault_active:!!be.fault,physics_status:u?"Sensor suspicious \u2013 check":Math.abs(c)>uo?"Disagrees with physics \u2013 watching":"OK \u2013 matches physics"});let p=_o();return{t:s,time:hr(s),clock:Gc(s),label:Ze.label,source:"SIMULATED",sun:{elevation_deg:Te.sun_elev[t],azimuth_deg:Te.sun_az[t]},day_class:Ze.day_classes[Te.day[t]],day_poa_kWh_m2:Te.day_poa[t],values:d,ledger:{length:be.blocks.length,valid:p.valid,batches:Object.keys(be.batches).length},compare:{normal:{T_room:(Te.n_T_room||Te.T_room)[t],pcm_pct:(Te.n_pcm_pct||Te.pcm_pct)[t],grid_on:!!(Te.n_grid_on||Te.grid_on)[t],grid_h_so_far:Te.grid_h_n[t]},smart:{T_room:Te.s_T_room[t],pcm_pct:Te.s_pcm_pct[t],grid_on:!!Te.s_grid_on[t],grid_h_so_far:Te.grid_h_s[t]},year:Ze.compare_year}}}function tp(s){let e=Vn(s),t=Math.round(Te.T_out[e]*4)/4,n={...Ze.cycles[String(Math.min(Ze.cycle_T[1],Math.max(Ze.cycle_T[0],t)).toFixed(2))]},i=Math.max(.3,Te.Q_coil_air[e]+Te.Q_coil_pcm[e]);["Q_evap_kW","m_dot_kg_s","m_dot_g_s","P_shaft_kW","P_elec_kW","Q_cond_kW"].forEach(a=>n[a]*=i);let r=[[n.h1,n.P_evap_bar],[n.h2,n.P_cond_bar],[n.h3,n.P_cond_bar],[n.h4,n.P_evap_bar],[n.h1,n.P_evap_bar]];return{cycle:n,points:r,dome:Ze.dome,design:Ze.cycle_design}}function np(s,e,t){let n=Vn(e),i=Ze.crops[s],a=fo(n,Math.round(t*86400/Jt)).map(c=>Te.T_room[c]),o=jc(i,a,Jt/3600),l=i.chill_injury_below_C;return{crop:s,label:i.label,days_stored:t,source:i.source,T_opt:[i.T_opt_low_C,i.T_opt_high_C],chill_below_C:l,SL_ref_days:i.SL_ref_days,T_ref_C:i.T_ref_C,Q10:i.Q10,assess:o,history_T:a.filter((c,h)=>h%12===0),chill_now:l!=null&&a[a.length-1]<l?`Room ${a[a.length-1].toFixed(1)} C is below the chilling-injury limit of ${l} C for ${i.label}.`:null}}function ip(s,e){let t=be.batches[s];if(!t)return null;e=xs(e>=0?e:(be.lastHour||0)*3600);let n=Ze.crops[t.crop],i=Math.max(1/24,(e-t.entry_t)/86400),r=fo(Vn(e),Math.round(i*86400/Jt)),a=r.map(l=>Te.T_room[l]),o=Math.max(1,Math.floor(a.length/120));return{batch:t,crop:{label:n.label,T_opt:[n.T_opt_low_C,n.T_opt_high_C],SL_ref_days:n.SL_ref_days,T_ref_C:n.T_ref_C,Q10:n.Q10,source:n.source},days_stored:i,assess:jc(n,a,Jt/3600),history_T:a.filter((l,c)=>c%o===0),blocks:be.blocks.filter(l=>l.batch_ids.includes(s)),chain_valid:_o().valid,now:hr(e,!1)}}function sp(s,e,t){let n=fo(Vn(e),Math.round(t*3600/Jt)).filter((r,a)=>a%3===0),i=Te[s]||(s==="T_room_sensor"?Te.T_room:null);return i?{quantity:s,t:n.map(r=>Gc(zc(r)).slice(-5)),v:n.map(r=>i[r])}:{quantity:s,t:[],v:[]}}async function rp(s){let[e,t]=s.split("?"),n=new URLSearchParams(t||""),i=(r,a=0)=>n.has(r)?+n.get(r):a;if(Ze.files[e])return JSON.parse(JSON.stringify(Ze.files[e]));if(e==="api/state")return ep(i("t"),n.has("curtain")&&n.get("curtain")!=="-1"?n.get("curtain")==="1":null);if(e==="api/series")return sp(n.get("q"),i("t"),i("hours",24));if(e==="api/cycle")return tp(i("t"));if(e==="api/crop")return np(n.get("key"),i("t"),i("days",2));if(e==="api/batches")return Object.values(be.batches);if(e.startsWith("api/batch/")){let r=ip(decodeURIComponent(e.slice(10)),i("t",-1));if(!r)throw new Error("batch not found");return r}if(e==="api/ledger"){let r=_o(),a=i("last",40),o=Math.max(0,be.blocks.length-a);return{blocks:be.blocks.slice(o),status:r.status.slice(o),valid:r.valid,first_bad:r.first_bad,length:be.blocks.length,note:Ze.ledger_note}}if(e==="api/health")return{ok:!0,static:!0};throw new Error(`static backup has no data for ${e}`)}async function ap(s,e={}){if(go(),s==="api/batch")return $c(+e.t),Vc(+e.t,e.farmer,e.crop,e.weight_kg);if(s==="api/ledger/tamper"){let t=be.blocks.length;if(t<3)return{error:"ledger too short"};let n=Math.max(0,t-7),i=be.blocks[n];be.orig[n]||(be.orig[n]=JSON.parse(JSON.stringify(i)));let r=i.summary.T_max;return i.summary.T_max=Math.round((r-3)*100)/100,Ci(),{index:n,field:"T_max",old:r,new:i.summary.T_max,explain:`Block ${n}'s T_max was changed from ${r} to ${i.summary.T_max} \xB0C. Its hash no longer matches the copy stored in block ${n+1}, so block ${n} and every block after it are untrusted.`}}if(s==="api/ledger/reset")return Object.entries(be.orig).forEach(([t,n])=>be.blocks[t]=n),be.orig={},Ci(),{ok:!0};if(s==="api/fault")return be.fault=e.clear?null:{offset:+(e.offset||3),since:+e.t},Ci(),{fault:be.fault};throw new Error(`static backup cannot handle ${s}`)}function op(){try{localStorage.removeItem(mo)}catch{}go()}window.STATIC_API={get:rp,post:ap,clamp:xs,resetAll:op};$n();En();Di();En();Di();var mp=[255,122,61],fp=[80,170,255],xr=class{constructor(e,t){this.spec=t,this.p=[],this.acc=0,this.heat=0,this.speed=.3,this.on=!1,this.low=!1,this.canvas=document.createElement("canvas"),this.canvas.className="airflow",e.appendChild(this.canvas),this.label=document.createElement("div"),this.label.className="flowlbl",this.label.style.left=`${(t.x0+t.x1)/2}%`,this.label.style.top=`${t.label_y}%`,e.appendChild(this.label),this.neutral=document.createElement("div"),this.neutral.className="neutral",this.neutral.style.cssText=`left:${t.x0-1}%;width:${t.x1-t.x0+2}%;top:${(t.y0+t.y1)/2}%`,this.neutral.innerHTML="<span>neutral line \xB7 \u0394p = 0</span>",e.appendChild(this.neutral)}set(e,t){this.heat=e.heat_if_open_kW,this.speed=.35+1.4*e.v_door_if_open;let n=e.heat_if_open_kW*(e.heat_latent_now_kW&&e.heat_now_kW?e.heat_latent_now_kW/e.heat_now_kW:.58);this.label.innerHTML=`Heat entering now (door open): <b>${e.heat_if_open_kW.toFixed(1)} kW</b> <span class="tag C">C</span><span class="per">this opening lasted <b>${e.last_open_s.toFixed(0)} s</b> \u2192 energy per opening <b>${e.last_open_kJ.toFixed(0)} kJ</b> (= ${e.last_open_wall_minutes.toFixed(0)} min of wall heat)</span><small>strip curtain ${t?"ON \u2013 cuts it by 85 %":"OFF"} \xB7 big kW, but only for seconds \xB7 warm air in at the top, cold air out at the bottom</small>`}resize(){let e=this.canvas.parentElement.getBoundingClientRect(),t=Math.min(devicePixelRatio||1,this.low?1:1.5);this.canvas.width=e.width*t/(this.scaleHint||1),this.canvas.height=e.height*t/(this.scaleHint||1),this.W=this.canvas.width,this.H=this.canvas.height}spawn(e){let t=e?.04+Math.random()*.42:.56+Math.random()*.4,n=this.spec.view==="outside"?!e:e;this.p.push({warm:e,u:Math.random(),v:t,d:n?0:1,dir:n?1:-1,jit:Math.random()*Math.PI*2,life:0})}step(e){if(!this.on){this.p.length&&(this.p.length=0);return}this.W||this.resize();let t=Math.min(this.low?160:360,9*this.heat);for(this.acc+=t*e;this.acc>=1;)this.acc-=1,this.spawn(Math.random()<.5);let n=this.spec,i=this.W,r=this.H,a=this.canvas.getContext("2d");a.clearRect(0,0,i,r);let o=n.x0/100*i,l=n.x1/100*i,c=n.y0/100*r,h=n.y1/100*r,u=(o+l)/2,d=l-o,p=h-c,f=n.view==="inside",_=[];for(let m of this.p){if(m.d+=m.dir*this.speed*e,m.life+=e,m.d<-.02||m.d>1.02)continue;_.push(m);let y=Math.max(0,Math.min(1,m.d)),v=u+(m.u-.5)*d*(1+1.3*y)+Math.sin(m.life*3+m.jit)*3*y,g=c+m.v*p;m.warm?g-=y*p*(f?.18:.06):g+=y*p*(f?.06:.14)+y*y*p*.05;let M=(2+6*y)*(i/1400),T=Math.min(1,m.life*3)*(m.dir>0?1-y*.75:.25+y*.75)*.75,w=m.warm?mp:fp;a.fillStyle=`rgba(${w[0]},${w[1]},${w[2]},${T})`,a.beginPath(),a.arc(v,g,M,0,Math.PI*2),a.fill()}this.p=_}show(e){this.on=e,this.canvas.style.display=this.label.style.display=this.neutral.style.display=e?"":"none",e&&this.resize()}};var gp=s=>s<.5?2*s*s:1-(-2*s+2)**2/2,cn={active:!1,from:0,to:0,t0:0,openSince:null,extraS:0,day:null,lastDay:null,listeners:[],now(){if(!this.active)return 0;let s=Math.min(1,(performance.now()-this.t0)/2e3);return this.from+(this.to-this.from)*gp(s)},swing(s){this.from=this.now(),this.to=s,this.t0=performance.now(),this.active=!0,s>0&&this.openSince===null&&(this.openSince=performance.now(),this.day!==this.lastDay&&(this.extraS=0,this.day=this.lastDay)),this.listeners.forEach(e=>e()),s===0&&setTimeout(()=>{this.to===0&&(this.extraS+=this.openSince===null?0:(performance.now()-this.openSince)/1e3,this.openSince=null,this.active=!1,this.listeners.forEach(e=>e()))},2050)},open(){this.swing(90)},close(){this.swing(0)},onChange(s){this.listeners.push(s)},apply(s,e=0){this.lastDay=Math.floor(e/86400);let t=this.day===this.lastDay?this.extraS:0;if(!this.active)return t&&(s.door_open_today_s=(s.door_open_today_s||0)+t),s;let n=this.now(),i=n>.5,r=n/90,a=s.heat_if_open_kW?s.heat_latent_now_kW&&s.heat_now_kW?s.heat_latent_now_kW/s.heat_now_kW:.58:0;return s.door_angle=n,s.door_open=i,s.heat_now_kW=i?s.heat_if_open_kW*r:0,s.heat_latent_now_kW=s.heat_now_kW*a,s.heat_sensible_now_kW=s.heat_now_kW-s.heat_latent_now_kW,s.v_door_top=i?s.v_door_if_open:0,s.v_door_bot=s.v_door_top,s.door_open_today_s=(s.door_open_today_s||0)+t+(this.openSince===null?0:(performance.now()-this.openSince)/1e3),s.door_by_demo=!0,s}};var br=class{constructor(e,t,n,i){this.root=e,this.manifest=t,this.scenes=n,this.hot=i,n.home_photo&&t.A[n.home_photo]&&(n.story=[n.home_photo,...n.story.slice(1)],n.modes={...n.modes,day:n.home_photo},n.real_photos=[...new Set([...n.real_photos||[],n.home_photo])]),this.story=n.story.filter(o=>t.A[o]),this.doorOpen=!1,this.concept=document.createElement("div"),this.concept.className="concepttag",e.parentElement.appendChild(this.concept),this.idx=0,this.mode="day",this.layers={},this.low=!1,this.flows={},this.caption=document.getElementById("caption"),this.dots=document.getElementById("storyDots"),this.build(),addEventListener("resize",()=>this.layout()),e.addEventListener("mousemove",o=>this.parallax(o)),e.addEventListener("wheel",o=>this.onWheel(o),{passive:!0}),document.getElementById("prevScene").onclick=()=>this.go(this.idx-1,!0),document.getElementById("nextScene").onclick=()=>this.go(this.idx+1,!0),this.enterBtn=document.createElement("button"),this.enterBtn.className="enterbtn",this.enterBtn.textContent="Enter the cold room \u25B8",this.enterBtn.onclick=()=>this.enter(),e.parentElement.appendChild(this.enterBtn),this.layout(),this.show(),document.addEventListener("highlight",o=>this.highlight(o.detail)),document.addEventListener("panelclose",()=>this.highlight(null)),new URLSearchParams(location.search).get("edit")==="1"&&this.editor();let r=performance.now(),a=o=>{let l=Math.min(.1,(o-r)/1e3);r=o;let c=this.flows[this.current()];c&&this.root.parentElement.classList.contains("on")&&c.step(l),requestAnimationFrame(a)};requestAnimationFrame(a)}enter(){let e=(this.scenes.enter_sequence||[]).filter(o=>this.story.includes(o));clearTimeout(this.enterTimer);let[t,,...n]=e,i=[[t,1400,()=>{}],[null,2600,()=>cn.open()]];n.forEach(o=>i.push([o,4200,()=>{}])),i.push([null,0,()=>cn.close()]);let r=0,a=()=>{if(r>=i.length)return;let[o,l,c]=i[r++];o&&this.go(this.story.indexOf(o)),c(),this.enterTimer=setTimeout(a,l)};a()}build(){let e=[this.scenes.door_open_alt,this.scenes.night_alt].flatMap(n=>Object.entries(n||{}).filter(([i])=>!i.startsWith("_")).map(([,i])=>i)),t=new Set([...this.story,...Object.values(this.scenes.modes),...e].filter(n=>this.manifest.A[n]));for(let n of t){let i=this.manifest.A[n],r=document.createElement("div");r.className="scene",r.dataset.name=n,r.innerHTML=`<div class="kb"><img alt="${n}" src="${i.src}" loading="${n===this.story[0]?"eager":"lazy"}"><div class="hots"></div></div>`,r.aspect=i.w/i.h;let a=r.querySelector(".hots");(this.hot[n]||[]).forEach(u=>{let d=document.createElement("button");d.className="hot"+(u.part?" part":""),d.style.left=`${u.x}%`,d.style.top=`${u.y}%`,d.setAttribute("aria-label",u.label||u.sensor||u.part);let p=()=>u.sensor?vr(u.sensor):yr(u.part);d.onmouseenter=f=>Pi(p(),f.clientX,f.clientY),d.onmousemove=f=>Pi(p(),f.clientX,f.clientY),d.onmouseleave=Sn,d.onclick=()=>{Sn(),u.sensor?Ii(u.sensor):ln(u.part)},d.dataset.sensor=u.sensor||"",d.dataset.part=u.part||"",a.appendChild(d)});let o=r.querySelector(".kb"),l=this.scenes.pcm_panels?.[n];if(l){r.pcm=l.map(([_,m,y,v])=>{let g=document.createElement("div");return g.className="pcmtint",g.style.cssText=`left:${_}%;top:${m}%;width:${y-_}%;height:${v-m}%`,o.insertBefore(g,o.querySelector(".hots")),g});let u=document.createElement("div");u.className="pcmlbl";let[d,p,f]=l[0];u.style.left=`${Math.min(80,Math.max(20,(d+f)/2))}%`,u.style.top=`${Math.max(8,p)}%`,o.insertBefore(u,o.querySelector(".hots")),r.pcmLabel=u}(this.scenes.fins?.[n]||[]).forEach(([u,d,p,f])=>{let _=document.createElement("div");_.className="finpack",_.style.cssText=`left:${u}%;top:${d}%;width:${p-u}%;height:${f-d}%`,o.insertBefore(_,o.querySelector(".hots"))}),(this.scenes.drip_trays?.[n]||[]).forEach(([u,d,p,f])=>{let _=document.createElement("div");_.className="driptray",_.style.cssText=`left:${u}%;top:${d}%;width:${p-u}%;height:${f-d}%`,o.insertBefore(_,o.querySelector(".hots"))});let c=this.scenes.fans?.[n];if(c){let u=document.createElement("div");u.className="fanglow",u.style.cssText=`left:${c.x}%;top:${c.y}%;width:${2*c.r}%;aspect-ratio:1`,o.insertBefore(u,o.querySelector(".hots")),r.fan=u}let h=this.scenes.doorways?.[n];h&&(this.flows[n]=new xr(r.querySelector(".kb"),h)),this.root.appendChild(r),this.layers[n]=r}this.dots.innerHTML=this.story.map((n,i)=>`<i data-i="${i}"></i>`).join(""),this.dots.onclick=n=>{n.target.dataset.i&&this.go(+n.target.dataset.i,!0)}}layout(){let e=this.root.clientWidth,t=this.root.clientHeight;for(let n of Object.values(this.layers)){let i=n.aspect,r=e,a=e/i;a<t&&(a=t,r=t*i),r*=1.04,a*=1.04,n.style.width=`${r}px`,n.style.height=`${a}px`,n.style.marginLeft=`${-r/2}px`,n.style.marginTop=`${-a/2}px`}Object.values(this.flows).forEach(n=>n.resize())}parallax(e){if(this.low)return;let t=(e.clientX/innerWidth-.5)*-14,n=(e.clientY/innerHeight-.5)*-10;for(let i of Object.values(this.layers))i.style.transform=`translate(${t}px, ${n}px)`}onWheel(e){let t=performance.now();t-(this.lastWheel||0)<900||Math.abs(e.deltaY)<20||(this.lastWheel=t,this.go(this.idx+(e.deltaY>0?1:-1),!0))}go(e,t=!1){t&&clearTimeout(this.enterTimer),this.idx=Math.max(0,Math.min(this.story.length-1,e)),this.show()}goByName(e){let t=this.story.indexOf(e);t>=0&&this.go(t,!0)}addBatchSpot(e,[t,n],i){let r=this.layers[this.current()]||this.layers.A8_interior_wide;if(!r)return;let a=r.querySelector(".hots");if(a.querySelectorAll('.newtag,.crate-cut,.hot[aria-label^="batch:"]').forEach(c=>c.remove()),i){let c=document.createElement("img");c.className="crate-cut",c.src=i,c.style.left=`${t}%`,c.style.top=`${n}%`,c.style.width="15%",a.appendChild(c)}let o=document.createElement("button");o.className="hot part",o.style.left=`${t}%`,o.style.top=`${n-6}%`,o.setAttribute("aria-label","batch:"+e),o.onclick=()=>document.dispatchEvent(new CustomEvent("openbatch",{detail:e}));let l=document.createElement("div");l.className="newtag",l.style.left=`${t}%`,l.style.top=`${n-14}%`,l.textContent=`NEW \xB7 ${e}`,a.append(o,l)}setMode(e){e!==this.mode&&(this.mode=e,this.show())}setLow(e){this.low=e;for(let[t,n]of Object.entries(this.layers)){let i=this.manifest.A[t];n.querySelector("img").src=e?i.small:i.src,e&&(n.style.transform="")}Object.values(this.flows).forEach(t=>{t.low=e,t.resize()})}current(){let e=this.story[this.idx],t=(n,i)=>n&&n[i]&&this.manifest.A[n[i]]?n[i]:i;if(this.doorOpen&&(e=t(this.scenes.door_open_alt,e)),this.mode==="night"&&(e=t(this.scenes.night_alt,e)),e===this.scenes.modes.day&&this.mode!=="day"){let n=this.scenes.modes[this.mode];n&&this.manifest.A[n]&&(e=n)}return e}highlight(e){if(this.hl=e,this.root.querySelectorAll(".hot.hl").forEach(h=>h.classList.remove("hl")),this.root.querySelectorAll(".hots.dimmed").forEach(h=>h.classList.remove("dimmed")),this.root.querySelectorAll(".hllabel").forEach(h=>h.remove()),this.root.style.transform="",!e)return;let t=e.kind==="sensor"?`.hot[data-sensor="${e.id}"]`:`.hot[data-part="${e.id}"]`,n=this.layers[this.current()];if(!n?.querySelector(t)&&e.move!==!1){let h=this.story.find(u=>this.layers[u]?.querySelector(t));if(h){this.goByName(h);return}}if(!n)return;let i=[...n.querySelectorAll(t)];if(!i.length)return;let r=n.querySelector(".hots");r.classList.add("dimmed"),i.forEach(h=>h.classList.add("hl"));let a=i[0],o=document.createElement("div");o.className="hllabel",o.textContent=e.label;let l=parseFloat(a.style.left),c=parseFloat(a.style.top);o.style.top=`${c}%`,l>70?(o.style.right=`${100-l+2.2}%`,o.classList.add("left")):o.style.left=`${l+2.2}%`,r.appendChild(o),clearTimeout(this.fitTimer),this.fitTimer=setTimeout(()=>this.fitHighlight(a),450)}fitHighlight(e){if(!e.isConnected||!e.classList.contains("hl"))return;this.root.style.transform="";let t=document.getElementById("panel"),n=document.getElementById("tourBar"),i=e.getBoundingClientRect(),r=0,a=0;if(t.classList.contains("on")){let o=t.getBoundingClientRect().left;i.left>o-40&&(r=-Math.min(t.offsetWidth+10,i.left-o+90))}if(n.classList.contains("on")){let o=n.getBoundingClientRect().top;i.bottom>o-30&&(a=-Math.min(n.offsetHeight+60,i.bottom-o+50))}(r||a)&&(this.root.style.transform=`translate(${r}px, ${a}px)`)}editor(){document.body.classList.add("editmode");let e=document.createElement("div");e.className="edittoast",e.textContent="EDIT MODE: click on the picture to read x, y (%)",document.body.appendChild(e),this.root.addEventListener("click",t=>{let n=this.current(),i=this.layers[n]?.querySelector(".kb");if(!i)return;let r=i.getBoundingClientRect(),a=(100*(t.clientX-r.left)/r.width).toFixed(1),o=(100*(t.clientY-r.top)/r.height).toFixed(1),l=`${n}: "x": ${a}, "y": ${o}`;console.log(l),e.textContent=l+"   (also in the console)";let c=document.createElement("div");c.className="editmark",c.style.left=`${a}%`,c.style.top=`${o}%`,i.querySelector(".hots").appendChild(c),setTimeout(()=>c.remove(),4e3)},!0)}show(){let e=this.current();for(let[r,a]of Object.entries(this.layers))a.classList.toggle("on",r===e);[...this.dots.children].forEach((r,a)=>r.classList.toggle("on",a===this.idx));let t=this.scenes.mode_captions?.[e]||this.scenes.story_captions[this.story[this.idx]]||"";this.caption.textContent=t,this.caption.style.display=t?"":"none",this.caption.classList.toggle("right",(this.scenes.caption_right||[]).includes(e));for(let[r,a]of Object.entries(this.flows))a.show(r===e);this.hl&&this.highlight({...this.hl,move:!1});let n=(this.hot[e]||[]).some(r=>r.sensor==="t_out");this.enterBtn.style.display=n?"":"none";let i=(this.scenes.real_photos||[]).includes(e);this.concept.textContent=i?"Real photo":"Concept illustration (AI-generated picture)",this.concept.classList.toggle("real",i)}update(e){let t=e.values,n=t.door_angle>1||t.door_open&&!t.door_by_demo;n!==this.doorOpen&&(this.doorOpen=n,this.show()),Object.values(this.flows).forEach(r=>r.set(t,t.curtain));let i=Math.max(0,Math.min(1,t.pcm_pct/100));for(let r of Object.values(this.layers))if(r.pcm&&(r.pcm.forEach(a=>a.style.backgroundColor=`rgba(70,150,255,${(.03+.27*i).toFixed(3)})`),r.pcmLabel.innerHTML=`Wax battery <b>${t.pcm_pct.toFixed(0)} % frozen</b> \xB7 backup <b>${t.backup_h===null?"\u221E":t.backup_h.toFixed(1)+" h"}</b> <span class="tag C">C</span>`),r.fan){let a=Math.max(0,Math.min(1,t.comp_speed_pct/100));r.fan.style.opacity=(.15+.85*a).toFixed(2),r.fan.style.animationDuration=a>.02?`${(1.6-1.3*a).toFixed(2)}s`:"0s",r.fan.style.animationPlayState=a>.02?"running":"paused",r.fan.title=`Compressor ${t.comp_speed_pct.toFixed(0)} %`}this.root.querySelectorAll('.hot[data-sensor="door_switch"]').forEach(r=>r.classList.toggle("warn",!!t.door_open))}};$n();var wt=s=>document.getElementById(s),lh=s=>`${s.slice(0,6)}\u2026${s.slice(-4)}`,Mr=class{constructor(e,t){this.clock=e,this.feed=t,this.seen=new Set,this.msg="",wt("ledgerBtn").onclick=()=>this.isOpen()?this.close():this.open(),wt("ledgerClose").onclick=()=>this.close(),wt("tamperBtn").onclick=async()=>{let n=await Mn("api/ledger/tamper");this.msg=n.explain?`\u2717 ${n.explain}`:"Ledger too short \u2013 let the clock run a few hours.",this.refresh(!0)},wt("resetBtn").onclick=async()=>{await Mn("api/ledger/reset"),this.msg="Tamper undone \u2013 every hash matches again.",this.refresh(!0)},wt("faultBtn").onclick=async()=>{let n=wt("faultBtn").dataset.on==="1";await Mn("api/fault",n?{clear:!0}:{t:this.clock.t,offset:3}),this.msg=n?"Sensor fault cleared.":"Room sensor now reads 3 \xB0C too high. The twin predicts the real value; after 15 simulated minutes the reading is flagged \u201CSensor suspicious \u2013 check\u201D, and the flag is sealed in the next block.",this.feed.poll(),this.refresh(!0)},setInterval(()=>this.isOpen()&&this.refresh(),1500),t.on(n=>this.badge(n))}isOpen(){return wt("ledgerDrawer").classList.contains("on")}open(e){e&&(this.msg=e),wt("ledgerDrawer").classList.add("on"),this.refresh(!0)}close(){wt("ledgerDrawer").classList.remove("on")}badge(e){let t=wt("ledgerBadge");t.className="lb "+(e.ledger.valid?"ok":"bad"),t.textContent=e.ledger.valid?`\u2713 ${e.ledger.length}`:"\u2717";let n=e.values.fault_active;wt("faultBtn").dataset.on=n?"1":"0",wt("faultBtn").textContent=n?"Clear sensor fault":"Inject sensor fault (+3 \xB0C)"}async refresh(e=!1){let t=await it("api/ledger?last=14"),n=kc(t.blocks),i=wt("ledgerStatus");i.className=t.valid?"ok":"bad",i.textContent=t.valid?`\u2713 all ${t.length} blocks verified (server and this browser agree)`:`\u2717 chain broken at block ${t.first_bad}`;let r=wt("ledgerExplain");r.textContent=this.msg,r.className="explain"+(this.msg.startsWith("\u2717")?" bad":"");let a=[];t.blocks.forEach((c,h)=>{let u=t.status[h],d=u!=="ok",p=n[h],f=!this.seen.has(c.hash);this.seen.add(c.hash),h&&a.push(`<div class="link ${d?"bad":""}" title="prev_hash = hash of the block before">${d?"\u2717":"\u2192"}</div>`),a.push(`<div class="blk ${d?"bad":""} ${c.flag!=="OK"?"flag":""} ${f&&!e?"newb":""}">
        <h4>#${c.index} \xB7 ${c.timestamp.slice(5)}</h4>
        <div>T ${c.summary.T_min.toFixed(1)} / <b>${c.summary.T_avg.toFixed(1)}</b> / ${c.summary.T_max.toFixed(1)} \xB0C</div>
        <div>door ${c.summary.door_min.toFixed(1)} min \xB7 wax ${c.summary.pcm_pct.toFixed(0)} %</div>
        <div class="ids">${c.batch_ids.length?c.batch_ids.join(" "):"\u2014"}</div>
        <div>${c.flag==="OK"?"physics check OK":"\u26A0 "+c.flag}</div>
        <div class="h">prev ${lh(c.prev_hash)}</div><div class="h">hash ${lh(c.hash)}</div>
        <div class="st ${d?"bad":"ok"}">${u==="ok"?"\u2713 verified":"\u2717 "+u}${p&&!p.ownOk?" (hash \u2260 data)":""}</div></div>`)});let o=wt("chain"),l=o.scrollLeft+o.clientWidth>=o.scrollWidth-30;o.innerHTML=a.join(""),(l||e)&&(o.scrollLeft=o.scrollWidth)}};$n();bo();var Pt=s=>document.getElementById(s),_p=`<svg viewBox="0 0 60 120" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="30" cy="116" rx="18" ry="3.5" fill="rgba(0,0,0,.25)"/>
  <circle cx="30" cy="14" r="9" fill="#6b4a32"/><path d="M21 12 q9 -10 18 0" fill="#222"/>
  <path d="M19 28 q11 -6 22 0 l3 42 h-28z" fill="#e9e2d2" stroke="#b9ae98"/>
  <path d="M21 70 l-2 42 h9 l3 -36 l3 36 h9 l-2 -42z" fill="#3b3f46"/>
  <rect x="9" y="40" width="42" height="22" rx="2" fill="#4f8f47" stroke="#2f5f2a"/>
  <path d="M11 44 h38 M11 50 h38 M11 56 h38" stroke="#2f5f2a" stroke-width="1.2"/>
  <ellipse cx="30" cy="40" rx="18" ry="5" fill="#3f9a3a"/>
</svg>`,vp=[50,86],Sr=class{constructor({cfg:e,manifest:t,photo:n,getModel:i,clock:r,feed:a,ledgerUI:o}){Object.assign(this,{cfg:e,manifest:t,photo:n,getModel:i,clock:r,feed:a,ledgerUI:o});let l=Pt("cropSel");Object.entries(e.crops).forEach(([u,d])=>l.insertAdjacentHTML("beforeend",`<option value="${u}">${d.label} (best ${d.T_opt[0]}\u2013${d.T_opt[1]} \xB0C)</option>`)),l.value="pomegranate",Pt("newBatchBtn").onclick=()=>Pt("batchModal").classList.add("on"),Pt("batchCancel").onclick=()=>Pt("batchModal").classList.remove("on"),Pt("batchForm").onsubmit=u=>{u.preventDefault(),this.create(new FormData(u.target))},Pt("cardModal").onclick=u=>{u.target.id==="cardModal"&&Pt("cardModal").classList.remove("on")},document.addEventListener("openbatch",u=>this.showCard(u.detail));let c=this.cut=u=>u&&t.B?.[u]?.src||null,h=n.scenes.cutouts||{};this.side=c(h.worker_side),this.back=c(h.worker_back),this.cropImg=u=>c(h.crops?.[u])||c(h.crops?.default),this.workerHTML=this.side?`<img src="${this.side}" alt="worker" style="transform:scaleX(-1)">`:_p}buyerURL(e){if(location.protocol==="file:")return`buyer.html?b=${encodeURIComponent(e)}`;let t=location.hostname;return`http://${t==="localhost"||t==="127.0.0.1"?`${this.cfg.lan_ip}:${location.port||8e3}`:location.host}/buyer.html?b=${encodeURIComponent(e)}`}async create(e){Pt("batchModal").classList.remove("on");let t=Object.fromEntries(e.entries());t.t=this.clock.t;let n=await Mn("api/batch",t);this.feed.poll(),(document.body.classList.contains("model")?"model":"photo")==="model"?await this.getModel()?.walkIn(n.id):await this.walkPhoto(n),this.showCard(n.id,!0),this.ledgerUI.open(`New batch ${n.id} is in the room. It will be sealed in the next hourly block (watch a new block appear on the right).`)}async walkPhoto(e){let t=this.photo,n=_=>new Promise(m=>setTimeout(m,_)),i="A2b_front_door_closed_nocurtain";t.goByName(i),await n(1500);let a=t.layers[i].getBoundingClientRect(),o=Pt("walker");o.innerHTML=this.workerHTML,o.classList.add("on");let l=a.height*.46,c=l*(this.side?507/900:.5);o.style.width=`${c}px`,o.style.height=`${l}px`;let h=a.left+a.width*.1,u=a.left+a.width*.44,d=a.top+a.height*.88,p=(_,m,y,v=1,g=!1)=>new Promise(M=>{let T=performance.now(),w=R=>{let I=Math.min(1,(R-T)/y),P=1+(v-1)*I,B=_+(m-_)*I,V=Math.abs(Math.sin(I*Math.PI*y/380))*l*.018;o.style.width=`${c*P}px`,o.style.height=`${l*P}px`,o.style.left=`${B-c*P/2}px`,o.style.top=`${d-l*P-V-(1-P)*l*.35}px`,o.style.opacity=g?1-I:1,I<1?requestAnimationFrame(w):M()};requestAnimationFrame(w)});await p(h,u,2600),this.back&&(o.innerHTML=`<img src="${this.back}" alt="worker from behind">`);let f=a.left+a.width*.515;await p(u,f,600),cn.open(),await n(2100),await p(f,f,900,.82,!0),o.classList.remove("on"),await n(2600),t.goByName("A8_interior_wide"),t.addBatchSpot(e.id,vp,this.cropImg(e.crop)),await n(1600),cn.close()}async showCard(e,t=!1){let n=await it(`api/batch/${encodeURIComponent(e)}?t=${this.clock.t.toFixed(0)}`),i=n.batch,r=n.assess,a=this.buyerURL(e),o=r.freshness_score,l=o>70?"#22c55e":o>40?"#f59e0b":"#ef4444";Pt("cardBody").innerHTML=`
      <div class="bc"><div>
        <div class="note">${t?"New batch created":"Batch card"}</div>
        ${this.cropImg(i.crop)?`<img class="cropimg" src="${this.cropImg(i.crop)}" alt="${i.crop_label}">`:""}
        <div class="id">${i.id}</div>
        <div class="kv" style="display:grid;grid-template-columns:1fr auto;gap:4px 10px;margin-top:8px;font-size:14px">
          <span>Farmer</span><b>${i.farmer}</b><span>Crop</span><b>${i.crop_label}</b>
          <span>Weight</span><b>${i.weight_kg} kg</b><span>Entered (sim. time)</span><b>${i.entry_time}</b>
          <span>Remaining shelf life</span><b>${r.remaining_days_at_ref.toFixed(1)} days at ${n.crop.T_ref_C} \xB0C</b>
          <span>Freshness</span><b style="color:${l}">${o.toFixed(0)} / 100</b>
          <span>Ledger blocks for this batch</span><b>${n.blocks.length}</b>
          <span>Record</span><b style="color:${n.chain_valid?"#15803d":"#b91c1c"}">${n.chain_valid?"verified \u2713":"changed \u2717"}</b></div>
        ${r.warnings.map(h=>`<div class="warnbox">\u26A0 ${h}</div>`).join("")}
        <canvas id="cardHist" style="width:100%;height:100px"></canvas>
      </div><div>
        <div id="qr"></div><div class="url">${a}</div>
        <div class="note">${location.protocol==="file:"?"Static backup (no server): the buyer page opens on this laptop only \u2013 phones need the Python version.":"Buyers scan this on a phone connected to the laptop's Wi-Fi hotspot."}</div>
        <a href="buyer.html?b=${encodeURIComponent(e)}" target="_blank">Open buyer page \u25B8</a>
      </div></div>
      <div class="row"><button class="ghost" onclick="document.getElementById('cardModal').classList.remove('on')">Close</button></div>`;let c=qrcode(0,"M");c.addData(a),c.make(),Pt("qr").innerHTML=c.createSvgTag({cellSize:4,margin:2,scalable:!0}),Pt("cardModal").classList.add("on"),bs(Pt("cardHist"),{x:["entry","now"],series:[{y:n.history_T,color:"#2a78d6",label:"room T since entry"}],unit:"\xB0C",band:[2,8]})}};$n();En();En();var yp="#c27a3a";function ch(s,e,t,n){return`<g id="${t}" class="eev" transform="translate(${s},${e})">
    <path d="M-14 -10 L14 10 L14 -10 L-14 10 Z" fill="#e8eef3" stroke="#41566b" stroke-width="2"/>
    <rect x="-7" y="-30" width="14" height="16" rx="3" fill="#41566b"/><line x1="0" y1="-14" x2="0" y2="-3" stroke="#41566b" stroke-width="3"/>
    <text x="0" y="-36" text-anchor="middle" class="lbl b">${n}</text></g>`}function hh(s){return`<p class="lead">How the solar cold reaches the room <b>and</b> the wax: one R290 compressor, one liquid line, split into two
    branches with their own electronic expansion valve (EEV). Live numbers from the digital twin ${xe("S")}.</p>
  <div class="splitwrap"><svg id="splitSvg" viewBox="0 0 780 380" role="img" aria-label="Refrigerant flow: compressor, condenser, split point, two expansion valves, air evaporator and wax coil">
    <defs><marker id="sar" markerWidth="9" markerHeight="9" refX="5" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9z" fill="#0e7490"/></marker></defs>
    <!-- equipment -->
    <rect x="40" y="30" width="170" height="62" rx="8" class="box cond"/><text x="125" y="56" class="lbl b" text-anchor="middle">Condenser (outside)</text>
    <text x="125" y="76" class="lbl" text-anchor="middle">heat out to the air</text>
    <circle cx="125" cy="300" r="40" class="box comp"/><text x="125" y="296" class="lbl b" text-anchor="middle">Compressor</text>
    <text x="125" y="314" class="lbl" text-anchor="middle">R290, DC inverter</text>
    <rect x="520" y="34" width="200" height="70" rx="8" class="box cold"/><text x="620" y="62" class="lbl b" text-anchor="middle">Air evaporator</text>
    <text x="620" y="82" class="lbl" text-anchor="middle">cools the room air</text>
    <rect x="520" y="170" width="200" height="78" rx="8" class="box wax"/>
    <g class="fins">${Array.from({length:14},(e,t)=>`<line x1="${530+t*13.5}" y1="176" x2="${530+t*13.5}" y2="242"/>`).join("")}</g>
    <text x="620" y="198" class="lbl b" text-anchor="middle">Coil inside the wax panels</text>
    <text x="620" y="218" class="lbl" text-anchor="middle">freezes the wax (cold battery)</text>
    <!-- pipes: base copper + moving dots on top -->
    <g class="pipes">
      <path id="pDis" d="M125 260 V92"/>
      <path id="pLiq" d="M210 61 H330"/>
      <path id="pA" d="M330 61 H520"/>
      <path id="pB" d="M330 61 V209 H520"/>
      <path id="pSucA" d="M720 69 H750 V330 H165"/>
      <path id="pSucB" d="M720 209 H750"/>
    </g>
    <g class="flow">
      <path id="fDis" d="M125 260 V92" class="vap"/>
      <path id="fLiq" d="M210 61 H330" class="liq"/>
      <path id="fA" d="M330 61 H520" class="liq"/>
      <path id="fB" d="M330 61 V209 H520" class="liq"/>
      <path id="fSuc" d="M720 69 H750 V330 H165" class="vap"/>
      <path id="fSucB" d="M720 209 H750" class="vap"/>
    </g>
    <circle cx="330" cy="61" r="7" fill="${yp}" stroke="#7a4a1f" stroke-width="2"/>
    <text x="330" y="22" class="lbl b" text-anchor="middle">split point</text><text x="330" y="38" class="lbl" text-anchor="middle">(liquid line)</text>
    ${ch(430,61,"eevA","EEV-A")}${ch(430,209,"eevB","EEV-B")}
    <text x="460" y="128" class="lbl" text-anchor="middle">branch A: room</text>
    <text x="430" y="262" class="lbl" text-anchor="middle">branch B: wax</text>
    <text x="760" y="200" class="lbl" text-anchor="end" transform="rotate(-90 760 200)">suction line</text>
    <!-- night: wax gives cold to the room through the fins -->
    <g id="waxNight" class="night">
      <path d="M560 250 V282" stroke="#0e7490" stroke-width="3" marker-end="url(#sar)"/><path d="M620 250 V282" stroke="#0e7490" stroke-width="3" marker-end="url(#sar)"/><path d="M680 250 V282" stroke="#0e7490" stroke-width="3" marker-end="url(#sar)"/>
      <text x="620" y="300" class="lbl b nightt" text-anchor="middle">wax \u2192 room air through the fins, no fan</text>
      <text x="620" y="316" class="lbl nightt" text-anchor="middle" id="waxNightW"></text>
    </g>
    <text x="430" y="365" class="lbl stopnote" id="stopNote" text-anchor="middle"></text>
  </svg>
  ${s?`<figure class="splitimg"><img src="${s}" alt="Copper Y-split in the liquid line with two electronic expansion valves"><figcaption>The split: a copper Y in the liquid line, then one EEV per branch (concept picture)</figcaption></figure>`:""}</div>
  <div class="splitnums" id="splitNums"></div>
  <p class="note">The controller opens <b>EEV-B</b> only when there is spare solar after the room is cold enough. The split happens in the
  <b>liquid line, before expansion</b>, so each branch gets an even flow; each EEV then sets its own branch's flow and superheat.
  Both branches join again in the suction line back to the compressor.</p>`}function Ni(s,e,t){if(!s)return;let n=e>.005,i=Math.min(1,e/t);s.style.strokeWidth=n?(3+9*i).toFixed(1):0,s.style.animationDuration=`${(1.6-1.2*i).toFixed(2)}s`,s.style.opacity=n?1:0}function To(s,e){let t=document.getElementById("splitSvg");if(!t)return;let n=Math.max(0,s.Q_coil_air||0),i=Math.max(0,s.Q_coil_pcm||0),r=n+i,a=e.design.refrigeration.design_capacity_kW||1.5;Ni(t.querySelector("#fA"),n,a),Ni(t.querySelector("#fB"),i,a),Ni(t.querySelector("#fLiq"),r,a),Ni(t.querySelector("#fDis"),r,a),Ni(t.querySelector("#fSuc"),r,a),Ni(t.querySelector("#fSucB"),i,a),t.querySelector("#eevA").classList.toggle("shut",n<=.005),t.querySelector("#eevB").classList.toggle("shut",i<=.005),t.querySelector("#pB").classList.toggle("idle",i<=.005);let o=Math.max(0,s.Q_pcm_room||0),l=i<=.005&&o>.002;t.querySelector("#waxNight").style.display=l?"":"none",t.querySelector("#waxNightW").textContent=l?`${(o*1e3).toFixed(0)} W of cold from the wax now`:"",t.querySelector("#stopNote").textContent=r<=.005?s.poa>20?"Compressor off: room cold enough and wax full":"Compressor off (no sun): branch B stopped \u2013 the wax cools the room":i<=.005?"All the cooling goes to the room now (no spare solar for the wax)":"",document.getElementById("splitNums").innerHTML=`<span>Room: <b>${(n*1e3).toFixed(0)} W</b></span><span>Wax charging: <b>${(i*1e3).toFixed(0)} W</b></span>
     <span>Solar used: <b>${((s.P_solar_used||0)*1e3).toFixed(0)} W</b> (electric)</span>
     <span>Wax \u2192 room: <b>${(o*1e3).toFixed(0)} W</b></span>
     <span>Power from: <b>${s.grid_on?"GRID":s.P_solar_used>0?"SOLAR":"WAX"}</b></span>`}Di();var je=s=>document.getElementById(s),xp=[["final_00_design_journey","Design journey: plain \u2192 baffle + fans \u2192 fins"],["final_01_fins_hottest_night","Hottest night: plain vs finned panels"],["final_02_fin_calculation","Fin calculation: depth, gap, UA"],["final_07_fin_panel_drawing","Finned panel + drip tray (drawing)"],["final_03_loading_options","When should the 150 kg come in?"],["final_04_wax_115_vs_172","115 kg vs 172 kg wax"],["final_05_monthly_energy_2026","Monthly energy 2026"],["final_06_money_co2","Money and CO\u2082 saved"],["final_08_payback","Payback estimate (prices GUESS)"]],bp=[["11_heatmap_wax_solar","Wax \xD7 solar: grid backup hours per year"],["14_current_vs_recommended","Current vs recommended design"],["05_power_cut_night","Power-cut night: with vs without wax"],["12_curtain_vs_none","Strip curtain vs no curtain"],["13_forecast_vs_normal","Normal vs forecast charging"],["02_day_counts","Sunny / cloudy / rainy days 2025"],["04_pcm_battery_heatmap","Wax battery % by hour and month"],["10_monthly_energy","Monthly solar vs cooling energy"],["01_weather_monthly","Vizag sunlight 2025 vs long-term"],["09_r290_ph_diagram","R290 cycle on the P\u2013h diagram"],["08_load_breakdown","Design-point heat load"],["07_pcm_melt_front","Wax slab melt front (FTCS)"]],wr=class{constructor({cfg:e,sensors:t,feed:n}){Object.assign(this,{cfg:e,sensors:t,feed:n}),this.tab="calc",je("ccBtn").onclick=()=>this.open(),je("ccClose").onclick=()=>this.close(),je("ccTabs").onclick=i=>{let r=i.target.closest("button");r&&this.show(r.dataset.tab)},n.on(i=>{this.isOpen()&&["rooms","sensors","calc","how"].includes(this.tab)&&this.live(i)})}isOpen(){return je("cc").classList.contains("on")}open(e){je("cc").classList.add("on"),this.show(e||this.tab)}close(){je("cc").classList.remove("on")}async show(e){this.tab=e,[...je("ccTabs").children].forEach(n=>n.classList.toggle("on",n.dataset.tab===e));let t=je("ccBody");e==="how"&&(t.innerHTML=hh(_r("B17_split_valve_manifold")),this.feed.state&&To(this.feed.state.values,this.cfg)),e==="calc"&&(t.innerHTML=await this.calc()),e==="whatif"&&(t.innerHTML=await this.whatifHTML(),this.whatifWire()),e==="rooms"&&(t.innerHTML=this.roomsHTML()),e==="year"&&(t.innerHTML=this.yearHTML()),e==="sensors"&&(t.innerHTML=this.sensorsHTML()),this.feed.state&&this.live(this.feed.state)}async calc(){this.dp=this.dp||await it("results/design_point.json");let e=`<p class="lead">Every formula with the numbers put in, at the design point (35 \xB0C, 65 % RH outside, room 5 \xB0C).
      All values are calculated by the engine (tag ${xe("C")}); design inputs are tag ${xe("E")}.</p>
      <h3>Heat entering the room, by source</h3><div id="bySource"></div><h3>Formulas</h3><table class="calc">`,t=null;for(let n of this.dp)n.value!==n.value||n.value===null||(n.group!==t&&(t=n.group,e+=`<tr class="grp"><td colspan="3">${t}</td></tr>`),e+=`<tr><td>${n.name}</td><td><code>${n.formula}</code>${n.substituted?`<br><code class="sub">= ${n.substituted}</code>`:""}</td>
        <td class="num">${Number(n.value).toPrecision(4)} ${n.unit}</td></tr>`);return e+"</table>"}bySource(e){let t=this.cfg.year_summary,n=e.values,i=[["Walls (U\xB7A\xB7\u0394T)",n.Q_wall,t.load_wall_kWh],["Door \u2013 sensible",n.Q_door-n.Q_door*(t.load_door_latent_kWh/t.load_door_kWh),t.load_door_kWh-t.load_door_latent_kWh],["Door \u2013 latent (moisture)",n.Q_door*(t.load_door_latent_kWh/t.load_door_kWh),t.load_door_latent_kWh],["Produce pull-down",n.Q_batch,t.load_product_kWh],["Respiration",n.Q_resp,t.load_resp_kWh],["Evaporator fan, lights, controller",n.Q_int,t.load_internal_kWh]],r=i.reduce((a,o)=>a+o[2],0);return`<table class="calc"><tr class="grp"><td>Source</td><td class="num">Now (kW) ${xe("C")}</td><td class="num">2026 so far (kWh)</td><td class="num">Share of year</td></tr>
      ${i.map(a=>`<tr><td>${a[0]}</td><td class="num">${a[1].toFixed(3)}</td><td class="num">${a[2].toFixed(0)}</td>
      <td class="num"><span class="sharebar"><i style="width:${(100*a[2]/r).toFixed(1)}%"></i></span>${(100*a[2]/r).toFixed(0)} %</td></tr>`).join("")}
      <tr class="grp"><td>Total</td><td class="num">${n.Q_total.toFixed(3)}</td><td class="num">${r.toFixed(0)}</td><td></td></tr></table>
      <p class="small">"Now" = this 5-minute step of the simulated 2026 (door load averaged over the 5 minutes). Year = final design, 1 Jan 2026 to today.</p>`}async whatifHTML(){this.wi=this.wi||await it("results/whatif.json");let e=this.wi.grid,t=this.cfg.crops,n=(i,r,a,o,l)=>`<label class="sl"><span>${r}: <b id="${i}V"></b> ${l}</span>
      <input type="range" id="${i}" min="0" max="${a.length-1}" step="1" value="${Math.max(0,a.indexOf(o))}"></label>`;return`<p class="lead">Move a slider \u2013 the result comes from the engine (every slider position was calculated with the same formulas as the twin).</p>
      <div class="wi"><div class="wiIn">
        ${n("wT","Outside temperature",e.T_out,35,"\xB0C")}${n("wRH","Outside humidity",e.RH_out,65,"%")}
        ${n("wDoor","Door openings per hour",e.door_per_h,4,`(${this.wi.seconds_per_opening} s each)`)}
        ${n("wPcm","Wax (PCM) mass",e.pcm_kg,this.cfg.design.pcm.mass_kg,"kg")}
        <label class="chk2"><input type="checkbox" id="wCur" checked> Strip curtain</label>
        <label class="chk2"><input type="checkbox" id="wCloud"> Cloudy day</label>
        <label class="sl"><span>Crop</span><select id="wCrop">${Object.entries(t).map(([i,r])=>`<option value="${i}" ${i==="pomegranate"?"selected":""}>${r.label}</option>`).join("")}</select></label>
      </div><div class="wiOut" id="wiOut"></div></div><p class="small">${this.wi.note}</p>`}whatifWire(){["wT","wRH","wDoor","wPcm","wCur","wCloud","wCrop"].forEach(e=>je(e).oninput=()=>this.whatif()),this.whatif()}whatif(){let e=this.wi.grid,t=this.wi.fields,n=e.T_out[je("wT").value],i=e.RH_out[je("wRH").value],r=e.door_per_h[je("wDoor").value],a=e.pcm_kg[je("wPcm").value];je("wTV").textContent=n,je("wRHV").textContent=i,je("wDoorV").textContent=r,je("wPcmV").textContent=a;let o=`${n.toFixed(1)}|${i}|${r}|${je("wCur").checked?1:0}|${a}|${je("wCloud").checked?1:0}`,l=Object.fromEntries(t.map((m,y)=>[m,this.wi.rows[o][y]])),c=this.cfg.crops[je("wCrop").value],h=m=>1/c.SL_ref_days*c.Q10**((m-c.T_ref_C)/10),u=1/h(this.cfg.design.setpoint.target_C),d=1/h(l.T_room_night_C),p=c.chill_injury_below_C!==null&&this.cfg.design.setpoint.target_C<c.chill_injury_below_C,f=l.load_pulldown_kW>this.wi.Qmax_kW,_=(m,y,v="",g="")=>`<div class="out ${g}"><span>${m}</span><b>${y}</b><small>${v}</small></div>`;je("wiOut").innerHTML=_("Total heat load (with new batch)",ye(l.load_pulldown_kW,"kW"),f?`more than the ${this.wi.Qmax_kW} kW compressor \u2013 the wax covers the gap`:`holding load ${ye(l.load_holding_kW,"kW")}`,f?"warn":"")+_("\u2026of which door",ye(l.door_kW,"kW"),`latent (moisture) ${ye(l.door_latent_kW,"kW")}`)+_("Compressor electricity",ye(l.comp_kW,"kW"),`COP ${l.cop.toFixed(2)} (T_cond = ${n+10} \xB0C)`)+_("Wax battery after a 12 h night",`${l.pcm_after_night_pct.toFixed(0)} %`,`started full: ${l.pcm_kWh.toFixed(1)} kWh of cold`,l.pcm_after_night_pct<15?"bad":"")+_("Backup time (no sun, no grid)",`${l.backup_h.toFixed(1)} h`,`room stays near ${l.T_room_night_C.toFixed(1)} \xB0C on wax only`,l.T_room_night_C>8?"bad":"")+_(`Solar covers the day (${je("wCloud").checked?"cloudy":"sunny"})`,`${l.solar_cover_pct.toFixed(0)} %`,`${l.solar_day_kWh.toFixed(1)} kWh solar vs ${l.need_day_kWh.toFixed(1)} kWh needed`,l.solar_cover_pct<100?"warn":"")+_(`Shelf life \u2013 ${c.label}`,`${u.toFixed(0)} days`,`at 5 \xB0C; ${d.toFixed(0)} days if the room sits at ${l.T_room_night_C.toFixed(1)} \xB0C`+(p?" \xB7 \u26A0 5 \xB0C is below this crop\u2019s chilling limit":""),p?"warn":"")}roomsHTML(){return`<p class="lead">The <b>same room, same 2026 weather, same 150 kg loading</b> \u2013 left with PLAIN wax panels,
      right with FINNED wax panels (final design). Plain panels have too little surface: at night the wax cannot take the room's heat fast enough
      and the grid must help. The fins multiply the surface by 4.3 \u2013 no fan, no battery for cooling, nothing that moves.</p>
      <div class="rooms"><div class="room" id="rmN"></div><div class="room smart" id="rmS"></div></div><div id="rmY"></div>`}roomCard(e,t,n){let i=Math.max(0,Math.min(100,t.pcm_pct));return`<h3>${e}</h3><div class="rbig">${t.T_room.toFixed(1)} \xB0C</div>
      <div class="tank"><i style="height:${i}%"></i><span>${i.toFixed(0)} %<br>wax</span></div>
      <div class="kv2"><span>Power now</span><b class="${t.grid_on?"g":"s"}">${t.grid_on?"GRID (ATS)":"solar / wax"}</b>
      <span>Grid hours so far in 2026</span><b>${t.grid_h_so_far.toFixed(0)} h</b></div><p class="small">${n}</p>`}yearHTML(){let e=([t,n])=>`<figure><a href="figures/${t}.png" target="_blank"><img loading="lazy" src="figures/${t}.png" alt="${n}"></a><figcaption>${n}</figcaption></figure>`;return`<p class="lead"><b>Final design on real 2026 weather</b> (simulated, conservative sun). Click a graph to enlarge.</p>
      <div class="figs">${xp.map(e).join("")}</div>
      <p class="lead">How we chose the size (NASA POWER 2025 study, Phase 2):</p><div class="figs">
      ${bp.map(([t,n])=>`<figure><a href="figures/${t}.png" target="_blank"><img loading="lazy" src="figures/${t}.png" alt="${n}"></a><figcaption>${n}</figcaption></figure>`).join("")}</div>`}sensorsHTML(){return`<p class="lead">Every sensor: type, range, accuracy, location and protocol. Tag M = measured, C = calculated from a formula.</p>
      <table class="calc sens"><tr class="grp"><td>Sensor</td><td>Type</td><td>Range</td><td>Accuracy</td><td>Location</td><td>Protocol</td><td class="num">Now</td></tr>
      ${this.sensors.sensors.map(e=>`<tr><td>${e.name} ${xe(e.tag)}</td><td>${e.type}</td><td>${e.range}</td><td>${e.accuracy}</td><td>${e.location}</td><td>${e.protocol}</td><td class="num" data-q="${e.quantity}" data-u="${e.unit}"></td></tr>`).join("")}</table>`}live(e){if(this.tab==="how"&&To(e.values,this.cfg),this.tab==="calc"&&je("bySource")&&(je("bySource").innerHTML=this.bySource(e)),this.tab==="rooms"&&je("rmN")){let t=e.compare;je("rmN").innerHTML=this.roomCard("Plain wax panels",t.normal,"Flat panel face, natural convection only."),je("rmS").innerHTML=this.roomCard("Finned wax panels (final design)",t.smart,"40 mm aluminium fins, 23 mm gap: cooled air falls between the fins by itself."),je("rmY").innerHTML=`<div class="kv2 wide"><span>Whole year: grid backup hours</span><b>${t.year.normal_grid_h.toFixed(0)} h \u2192 ${t.year.smart_grid_h.toFixed(0)} h</b>
        <span>Days fully on solar + wax</span><b>${t.year.normal_days_pct.toFixed(1)} % \u2192 ${t.year.smart_days_pct.toFixed(1)} %</b></div>
        <p class="small">${e.clock} \xB7 ${e.label}. Final design: 115 kg wax with fins, 1.8 kWp, 150 kg produce loaded at 6 am.</p>`}this.tab==="sensors"&&document.querySelectorAll("#ccBody td[data-q]").forEach(t=>{let n=e.values[t.dataset.q];t.textContent=n==null?"\u2014":typeof n=="boolean"?n?"YES":"no":ye(n,t.dataset.u)})}};$n();Di();En();var yt=s=>document.getElementById(s),Mp=s=>new Promise(e=>setTimeout(e,s)),Er=class{constructor(e){this.app=e,this.i=-1,this.paused=!1,this.running=!1,this.timer=null;let{photo:t,clock:n,feed:i,demo:r,ledgerUI:a,control:o,batches:l}=e,c=m=>Math.floor(r.find(y=>y.why.startsWith(m)).t/86400)*86400,h=c("Hottest"),u=c("Dullest"),d=m=>{yt("curtain").checked=m,i.curtain=m,i.poll()},p=()=>i.state?.values||{},f=()=>{wn(),a.close(),o.close(),yt("cardModal").classList.remove("on")},_=e.cfg.year_summary;this.steps=[{s:9,cap:()=>"This is our solar\u2013PCM cold room for farmers near Visakhapatnam, rated for <b>150 kg</b> of fresh produce. It runs on a digital twin with the <b>real 2026 weather</b> of Vizag.",go:()=>{f(),this.app.toPhoto(),n.jump(h+5*3600),n.speed=720,t.goByName("A1_outside")}},{s:9,cap:()=>`Every glowing dot is a sensor. Outside air now: <b>${p().T_out?.toFixed(1)} \xB0C</b>, ${p().RH_out?.toFixed(0)} % humidity \u2013 this is the hottest day of 2026.`,go:()=>{t.goByName("A2b_front_door_closed_nocurtain"),Ii("t_out")}},{s:9,cap:()=>`The 1.8 kWp solar canopy faces south at 17\xB0. Right now it gives <b>${p().P_pv?.toFixed(2)} kW</b> to the R290 (propane) compressor. No battery for cooling \u2013 the wax is the storage.`,go:()=>{wn(),t.goByName("A3_exterior_side_condenser"),ln("solar")}},{s:9,cap:()=>`Opening the door lets warm air in at the top and cold air out at the bottom. <b>Without the strip curtain: ${p().heat_if_open_kW?.toFixed(1)} kW</b> pours in\u2026`,go:()=>{wn(),d(!1),t.goByName("A6b_door_worker_curtain")}},{s:7,cap:()=>`\u2026with the curtain only <b>${p().heat_if_open_kW?.toFixed(1)} kW</b> \u2013 and only for ${p().last_open_s?.toFixed(0)} seconds per opening.`,go:()=>d(!0)},{s:13,cap:()=>"At 6 am the farmer brings the day's 150 kg. The batch gets an ID and a QR code, and is <b>sealed into a hash-chain ledger</b> every hour.",go:async()=>{await l.create(new Map([["farmer","Demo farmer (tour)"],["crop","pomegranate"],["weight_kg","150"]]))}},{s:9,cap:()=>`Inside it is <b>${p().T_room?.toFixed(1)} \xB0C</b>. The blue wax (PCM) panels are the cold battery: <b>${p().pcm_pct?.toFixed(0)} % frozen</b>, enough for <b>${p().backup_h?.toFixed(0)} hours</b> without sun.`,go:()=>{yt("cardModal").classList.remove("on"),a.close(),t.goByName("A8_interior_wide"),ln("pcm")}},{s:11,cap:()=>`Night: the compressor sleeps. <b>Aluminium fins</b> on the wax panels give <b>4.3 \xD7 more surface</b>; cooled air falls between them by itself \u2013 <b>no fan, 0 W</b>. Now ${p().G_wax_W_K?.toFixed(0)} W/K, room <b>${p().T_room?.toFixed(1)} \xB0C</b>. A drip tray catches the condensate.`,go:()=>{wn(),n.jump(h+22*3600),t.goByName("A9b_interior_finned_pcm_wall"),ln("fins")}},{s:8,cap:()=>`By day the evaporator runs on R290 at \u22125 \xB0C. COP <b>${p().cop?.toFixed(2)}</b>, calculated with CoolProp from the outside temperature.`,go:()=>{wn(),n.jump(h+13*3600+86400),t.goByName("A10_interior_evaporator"),ln("evaporator")}},{s:8,cap:()=>"Each crate knows its <b>remaining shelf life in days</b>, from the real temperature history of this room (Q10 model).",go:()=>{wn(),t.goByName("A8_interior_wide"),ln("crate_greens")}},{s:11,cap:()=>"A dull monsoon night. The same room with <b>plain</b> and with <b>finned</b> wax panels: plain panels need the grid every night; with fins the wax alone holds 2\u20138 \xB0C.",go:()=>{wn(),n.jump(u+21*3600),t.goByName("A1_outside"),o.open("rooms")}},{s:12,cap:()=>`2026 so far: <b>${_.days_full_solar_pcm} of ${_.days} days fully on solar + wax</b>, ${_.grid_hours.toFixed(0)} grid hours. Room air above 8 \xB0C only while a fresh warm batch cools (${_.hot_load_h_per_day.toFixed(1)} h/day); all other times 0 h outside 2\u20138 \xB0C.`,go:()=>o.open("year")},{s:11,cap:()=>"Can someone cheat? We change one old temperature reading\u2026 <b>the chain turns red from that block onward</b>, and the buyer's QR page shows \u201CRecord changed \u2717\u201D.",go:async()=>{o.close(),a.open(),await Mp(1500);let m=await Mn("api/ledger/tamper");a.msg=`\u2717 ${m.explain}`,a.refresh(!0)}},{s:7,cap:()=>"Thank you! Scan any batch QR code, open \u201C\u{1F4C5} Live 2026\u201D for today and tomorrow, or ask us to move a What-If slider.",go:async()=>{await Mn("api/ledger/reset"),a.close(),t.goByName("A1_outside"),n.jump(h+11*3600)}}],yt("tourBtn").onclick=()=>this.running?this.stop():this.start(),yt("tourPrev").onclick=()=>this.goto(this.i-1),yt("tourNext").onclick=()=>this.goto(this.i+1),yt("tourPause").onclick=()=>this.pause(),yt("tourStop").onclick=()=>this.stop(),addEventListener("keydown",m=>{!this.running||["INPUT","SELECT","TEXTAREA"].includes(m.target.tagName)||(m.key==="ArrowRight"&&(m.stopImmediatePropagation(),this.goto(this.i+1)),m.key==="ArrowLeft"&&(m.stopImmediatePropagation(),this.goto(this.i-1)),m.key===" "&&(m.preventDefault(),this.pause()),m.key==="Escape"&&this.stop())},!0),i.on(()=>this.running&&this.render())}start(){this.running=!0,document.body.classList.add("touring"),yt("tourBtn").textContent="\u25A0 Stop demo",this.goto(0)}stop(){this.running=!1,clearTimeout(this.timer),document.body.classList.remove("touring"),yt("tourBtn").textContent="\u25B6 Start demo",yt("tourBar").classList.remove("on")}pause(){this.paused=!this.paused,yt("tourPause").textContent=this.paused?"\u25B6":"\u275A\u275A",this.paused?clearTimeout(this.timer):this.schedule()}async goto(e){if(e<0&&(e=0),e>=this.steps.length)return this.loop?this.goto(0):this.stop();clearTimeout(this.timer),this.i=e,this.t0=performance.now(),yt("tourBar").classList.add("on"),this.render();let t=this.steps[e];try{await t.go()}catch(n){console.warn("tour step",e,n)}this.render(),this.paused||this.schedule()}schedule(){clearTimeout(this.timer),this.timer=setTimeout(()=>this.goto(this.i+1),this.steps[this.i].s*1e3*(this.slow||1))}render(){if(this.i<0)return;yt("tourCap").innerHTML=this.steps[this.i].cap(),yt("tourStep").textContent=`${this.i+1} / ${this.steps.length}`;let e=this.steps.slice(0,this.i).reduce((n,i)=>n+i.s,0),t=this.steps.reduce((n,i)=>n+i.s,0);yt("tourProg").style.width=`${(100*e/t).toFixed(1)}%`}};En();var Sp=17.69,uh=83.22,Co=330,wp=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],_h=["January","February","March","April","May","June","July","August","September","October","November","December"],Wt=s=>String(s).padStart(2,"0"),Kt=s=>document.getElementById(s),Ao=()=>new Date(Date.now()+Co*6e4),Tr=s=>`${s.getUTCFullYear()}-${Wt(s.getUTCMonth()+1)}-${Wt(s.getUTCDate())} ${Wt(s.getUTCHours())}`,Ep=s=>Tr(s).slice(0,10),dh=s=>`${Wt(Math.floor(s/60)%24)}:${Wt(Math.round(s%60)%60)}`;function Tp(s){let e=/^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d)/.exec(s||"");return e?new Date(Date.UTC(+e[1],e[2]-1,+e[3],+e[4],+e[5])):null}var Ro=s=>`${s.getUTCDate()} ${_h[s.getUTCMonth()].slice(0,3)} ${Wt(s.getUTCHours())}:${Wt(s.getUTCMinutes())}`;function ph(s){let e=s.getUTCFullYear(),t=Math.round((Date.UTC(e,s.getUTCMonth(),s.getUTCDate())-Date.UTC(e,0,1))/864e5)+1,n=2*Math.PI/365*(t-1),i=229.18*(75e-6+.001868*Math.cos(n)-.032077*Math.sin(n)-.014615*Math.cos(2*n)-.040849*Math.sin(2*n)),r=.006918-.399912*Math.cos(n)+.070257*Math.sin(n)-.006758*Math.cos(2*n)+907e-6*Math.sin(2*n)-.002697*Math.cos(3*n)+.00148*Math.sin(3*n),a=Sp*Math.PI/180,o=Math.acos(Math.cos(90.833*Math.PI/180)/(Math.cos(a)*Math.cos(r))-Math.tan(a)*Math.tan(r))*180/Math.PI;return{rise:720-4*(uh+o)-i+Co,set:720-4*(uh-o)-i+Co}}function mh(s){return new Promise((e,t)=>{let n=document.createElement("script");n.src=s,n.onload=()=>{n.remove(),e()},n.onerror=()=>{n.remove(),t(new Error(s))},document.head.appendChild(n)})}function fh(s,e){return s.rain_mm!==null&&s.rain_mm!==void 0&&s.rain_mm>=.5?"rain":s.cloud_pct!==null&&s.cloud_pct!==void 0?s.cloud_pct>=70?"cloudy":s.cloud_pct>=30?e?"partly cloudy":"cloudy":e?"sunny":"clear":e?s.poa>450?"sunny":s.poa>150?"partly cloudy":"cloudy":"night"}var gh={sunny:"\u2600\uFE0F",clear:"\u{1F319}",night:"\u{1F319}","partly cloudy":"\u26C5",cloudy:"\u2601\uFE0F",rain:"\u{1F327}\uFE0F"},Ar=class{constructor(e){this.cfg=e,this.rows=null,this.S=null,this.i=-1,this.listeners=[],this.el=Kt("today"),this.el.querySelector(".tdtoggle").onclick=()=>this.toggle(),innerWidth<760&&this.toggle(!0),addEventListener("online",()=>{this.badge(),this.refresh()}),addEventListener("offline",()=>this.badge()),setInterval(()=>this.tick(),1e3),setInterval(()=>this.refresh(),30*6e4)}on(e){this.listeners.push(e)}toggle(e){let t=e??!this.el.classList.contains("small");this.el.classList.toggle("small",t),this.el.querySelector(".tdtoggle").textContent=t?"\u25BE more":"\u25B4 less",this.el.querySelector(".tdtoggle").setAttribute("aria-expanded",String(!t)),dispatchEvent(new Event("resize"))}async load(e=!1){let t=e?`?v=${Date.now()}`:"";window.LIVE=window.LIVE||{};try{await mh(`live/data/summary.js${t}`)}catch{}this.S=window.LIVE.summary||null;let n=Ao(),i=o=>`${o.getUTCFullYear()}-${Wt(o.getUTCMonth()+1)}`,r=new Set([i(n),i(new Date(n-864e5)),i(new Date(+n+864e5))]);this.S?.today&&r.add(this.S.today.slice(0,7));let a={t:[]};for(let o of[...r].sort()){let l=`h_current_${o}`;try{await mh(`live/data/${l}.js${t}`)}catch{continue}let c=window.LIVE[l];if(!c)continue;let h=Object.keys(c);h.forEach(u=>{a[u]=a[u]||[]}),c.t.forEach((u,d)=>{a.t.includes(u)||h.forEach(p=>a[p].push(c[p][d]))})}this.rows=a.t.length?a:null,this.compute()}refresh(){navigator.onLine&&this.load(!0)}row(e){let t=this.rows,n={};return Object.keys(t).forEach(i=>n[i]=t[i][e]),n}dayRows(e){return this.rows.t.map((t,n)=>t.startsWith(e)?n:-1).filter(t=>t>=0)}compute(){let e=Ao();if(this.stale=!1,this.missing=!this.rows,!this.rows){this.render();return}let t=this.rows.t.indexOf(Tr(e)),n=Tp(this.S?.weather?.forecast?.updated||this.S?.generated);if(n&&e-n>24*36e5&&(this.stale=!0),t<0){this.stale=!0;let i=Tr(e);t=this.rows.t.reduce((r,a,o)=>a<=i?o:r,-1),t<0&&(t=this.rows.t.length-1)}this.i=t,this.gen=n,this.render(),this.listeners.forEach(i=>i(this))}get rainToday(){if(!this.rows||this.i<0)return!1;let e=this.rows.t[this.i].slice(0,10),t=this.dayRows(e),n=t.reduce((r,a)=>r+(this.rows.rain_mm?.[a]||0),0);return this.rows.rain_mm?.some(r=>r!=null)?n>=2:t.reduce((r,a)=>r+(this.rows.ghi[a]||0),0)/1e3<(this.cfg.design.day_classes?.cloudy_min_kWh_m2??2.5)}saving(e){let t=this.S?.money?.defaults?.grid_tariff_INR_kWh??8;return this.rows.gonly_kWh?e.reduce((n,i)=>n+((this.rows.gonly_kWh[i]||0)-(this.rows.P_grid[i]||0)),0)*t:null}tick(){let e=Ao();Kt("tdDate").textContent=`${wp[e.getUTCDay()]}, ${e.getUTCDate()} ${_h[e.getUTCMonth()]} ${e.getUTCFullYear()}`,Kt("tdClock").textContent=`${Wt(e.getUTCHours())}:${Wt(e.getUTCMinutes())}:${Wt(e.getUTCSeconds())} IST`,this.rows&&this.i>=0&&Tr(e)!==this.rows.t[this.i]&&!this.stale?this.compute():this.rows&&this.stale&&e.getUTCSeconds()===0&&this.compute()}badge(){let e=!navigator.onLine,t=Kt("tdOffline");t.hidden=!e,t.textContent=`Offline \u2013 using data from ${this.gen?Ro(this.gen):"the laptop copy"}`}render(){this.tick(),this.badge();let e=Kt("tdLive"),t=Kt("tdWarn");if(this.missing){e.innerHTML='<span class="dot off"></span>No live data file',t.hidden=!1,t.textContent="Live data not found \u2013 showing the simulation only (run python -m twin.live_run).",["tdWx","tdTwin","tdTom"].forEach(I=>Kt(I).innerHTML="");return}let n=this.row(this.i),i=this.rows.t[this.i],r=i.slice(0,10),a=+i.slice(11,13),o=new Date(Date.UTC(+r.slice(0,4),+r.slice(5,7)-1,+r.slice(8,10))),l=ph(o),c=a*60+30,h=c>l.rise&&c<l.set,u=fh(n,h),d=this.dayRows(r),p=d.map(I=>this.rows.T_out[I]).filter(I=>I!==null);e.innerHTML=this.stale?`<span class="dot old"></span>Updated ${this.gen?Ro(this.gen):"\u2014"}`:`<span class="dot"></span>Live \xB7 updated ${this.gen?Ro(this.gen):"\u2014"}`,t.hidden=!this.stale,t.textContent=`Showing data from ${r} ${Wt(a)}:00 \u2013 live update pending`;let f=n.pred?' <i class="fc">forecast</i>':"",_=xe("W"),m=xe("S"),y=xe("C");Kt("tdWx").innerHTML=`
      <span class="sky" title="${u}">${gh[u]||""} <b>${u}</b></span>
      <span><b>${n.T_out?.toFixed(1)} \xB0C</b> outside${_}${f}</span>
      <span>RH <b>${n.RH_out?.toFixed(0)} %</b>${_}</span>
      <span>Wind <b>${(n.wind*3.6).toFixed(0)} km/h</b>${_}</span>
      <span>Sun on panel <b>${(n.poa??0).toFixed(0)} W/m\xB2</b>${m}</span>
      <span>\u{1F305} ${dh(l.rise)} \xB7 \u{1F307} ${dh(l.set)}${y}</span>
      <span>Today <b>${Math.min(...p).toFixed(1)} \u2013 ${Math.max(...p).toFixed(1)} \xB0C</b>${_}</span>`;let v=n.grid_on>.5?"Grid":n.P_solar_used>.01?"Solar":"Wax",g=d.filter(I=>I<=this.i),M=this.saving(g);Kt("tdTwin").innerHTML=`
      <span>Room <b>${n.T_room?.toFixed(1)} \xB0C</b>${m}</span>
      <span>Wax <b>${n.pcm_pct?.toFixed(0)} %</b> charged${m}</span>
      <span>Power now <b class="src ${v.toLowerCase()}">${v}</b>${m}</span>
      <span>Saved today so far <b>${M===null?"\u2014":"\u20B9"+Math.max(0,M).toFixed(0)}</b>${y}</span>`;let T=new Date(+o+864e5),w=Ep(T),R=this.dayRows(w);if(R.length>=20){let I=Math.max(...R.map(k=>this.rows.T_out[k])),P=this.row(R[Math.min(R.length-1,12)]),B=ph(T),L=R.reduce((k,Q)=>k+(this.rows.rain_mm?.[Q]||0),0)>=2?"rain":fh(P,12*60>B.rise&&12*60<B.set),O=this.saving(R);Kt("tdTom").innerHTML=`Tomorrow: max <b>${I.toFixed(0)} \xB0C</b>, ${gh[L]||""} ${L}, expected saving <b>${O===null?"\u2014":"\u20B9"+Math.max(0,O).toFixed(0)}</b> <i class="fc">prediction</i>`}else Kt("tdTom").innerHTML="Tomorrow: forecast pending (next data update)"}};var Be=s=>document.getElementById(s);async function Xf(){let[s,e,t,n,i,r]=await Promise.all([it("api/config"),it("api/sensors"),it("assets/manifest.json"),it("assets/scenes.json"),it("assets/hotspots.json"),it("api/demo_days")]),a=new Ar(s),o=Be("today"),l=-1,c=()=>{o.offsetHeight!==l&&(l=o.offsetHeight,document.documentElement.style.setProperty("--todayH",`${l}px`),dispatchEvent(new Event("resize")))};new ResizeObserver(c).observe(o),c(),a.load();let h=s.time||{},u=()=>(Date.now()+5.5*36e5-Date.parse((h.t0||"2026-01-01T00:00:00")+"Z"))/1e3,d=()=>h.t_end&&u()>=0&&u()<h.t_end,p=d()&&new URLSearchParams(location.search).get("judge")!=="1",f=new ur(p?u():r[0].t,p?1:720);window.STATIC_API&&p&&Math.abs(window.STATIC_API.clamp(f.t)-f.t)>3600&&(f.t=r[0].t,f.speed=720),Be("speed").value=String(f.speed);let _=()=>d()&&Math.abs(f.t-u())<1800;Be("liveNow").onclick=()=>{if(!d()){alert("The saved data does not reach today yet \u2013 the next data update will add it.");return}f.jump(u()),f.speed=1,f.playing=!0,Be("speed").value="1",Be("play").textContent="\u275A\u275A",m.poll()},setInterval(()=>Be("liveNow").classList.toggle("on",_()),1e3);let m=new dr(f);m.transform=x=>(cn.apply(x.values,x.t),x);let y=null;cn.onChange(()=>{clearInterval(y),y=setInterval(()=>{m.emit(),cn.active||clearInterval(y)},80)}),ih(s,e,t,n,()=>m.state,()=>f.t,x=>{if(!a.rows||a.stale||!_()||!a.rows[x])return null;let S=a.rows.t[a.i].slice(0,10),U=a.dayRows(S).filter(X=>X<=a.i);return{labels:U.map(X=>`${a.rows.t[X].slice(11)}:00`),values:U.map(X=>a.rows[x][X])}});let g=s.year_summary||{};g.hot_load_h_per_day!==void 0&&(Be("simnote").innerHTML+=` \xB7 Rated 150 kg. Room air above 8 \xB0C only while a fresh warm batch is cooling (no stored product inside): ${g.hot_load_h_per_day.toFixed(1)} h/day average. All other times: ${g.hot_other_h.toFixed(0)} h outside 2\u20138 \xB0C.`);let M=new br(Be("photoFrame"),t,n,i),T=null,w="photo",R="auto";async function I(){if(T)return T;let{Model3D:x}=await Promise.resolve().then(()=>(Od(),Ud));return T=new x(Be("three"),s,e,t),T.setLow(Be("lowgfx").checked),T.showDims(Be("dims").checked),m.state&&T.update(m.state,R),T.fps=S=>J=S,window.__model=T,T.onInside=S=>{Be("enter3d").textContent=S?"\u25C2 Back outside":"Enter the cold room \u25B8"},T}let P=new Mr(f,m),B=new Sr({cfg:s,manifest:t,photo:M,getModel:()=>T,clock:f,feed:m,ledgerUI:P}),V=new wr({cfg:s,sensors:e,feed:m}),L=()=>{w!=="photo"&&Be("viewSeg").querySelector("[data-view=photo]").click()},O=new Er({photo:M,clock:f,feed:m,demo:r,ledgerUI:P,control:V,batches:B,toPhoto:L,cfg:s});if(it("results/live/design_study_2026.json").then(x=>{let S=Object.entries(x.journey||{}).find(([X])=>X.startsWith("3)"))?.[1],U=Object.values(x.wax_compare||{})[0];!S||!U||(Be("tdHeadline").innerHTML=`<span class="hlt">Poster headline \xB7 simulated on real 2026 Vizag weather:</span>
      <span class="hn"><b>${S.days_full_solar_wax}/${S.days}</b> days on solar + wax</span>
      <span class="hn"><b>${S.moving_parts}</b> fans</span>
      <span class="hn"><b>${S.grid_h_per_year.toFixed(0)}</b> grid h/yr</span>
      <span class="hn"><b>\u20B9${(U.saved_vs_diesel_INR_yr/1e3).toFixed(1)}k</b>/yr vs diesel</span>
      <span class="hn"><b>${(U.co2_saved_vs_diesel_kg_yr/1e3).toFixed(1)} t</b> CO\u2082/yr</span>`,c())}).catch(x=>console.warn("headline",x)),new URLSearchParams(location.search).get("judge")==="1"){document.body.classList.add("judge"),O.slow=1.6,O.loop=!0;let x=document.createElement("button");x.className="judgego",x.innerHTML="\u25B6 Start the demo<br><small>full screen \xB7 click anywhere to pause / resume</small>",document.body.appendChild(x),x.onclick=async()=>{x.remove();try{await document.documentElement.requestFullscreen()}catch{}O.start(),Be("stage").addEventListener("click",S=>{!O.running||S.target.closest("#panel,.tourbar,button,a,select,input")||O.pause()})}}let k=x=>{document.body.classList.toggle("flat",x),Be("flat2d").checked=x;try{localStorage.setItem("ct2d",x?"1":"0")}catch{}x&&L()};Be("flat2d").onchange=x=>k(x.target.checked);let Q=new URLSearchParams(location.search).get("2d")==="1";try{Q=Q||localStorage.getItem("ct2d")==="1"}catch{}Be("viewSeg").onclick=async x=>{let S=x.target.closest("button");S&&(w=S.dataset.view,[...Be("viewSeg").children].forEach(U=>U.classList.toggle("on",U===S)),Be("photoView").classList.toggle("on",w==="photo"),Be("modelView").classList.toggle("on",w==="model"),document.body.classList.toggle("model",w==="model"),Sn(),w==="model"?(await I()).setActive(!0):T?.setActive(!1))},Be("modeSeg").onclick=x=>{let S=x.target.closest("button");if(!S)return;let U=Math.floor(f.t/86400)*86400,X=r.find(D=>D.why.startsWith("Dullest"));S.dataset.mode==="day"&&f.jump(U+11*3600),S.dataset.mode==="night"&&f.jump(U+22*3600),S.dataset.mode==="monsoon"&&X&&f.jump(Math.floor(X.t/86400)*86400+11*3600),m.poll(),oe(S)};function oe(x){[...Be("modeSeg").children].forEach(S=>S.classList.toggle("on",S===x)),setTimeout(()=>[...Be("modeSeg").children].forEach(S=>S.classList.toggle("on",S.dataset.mode==="auto")),1500)}Be("enter3d").onclick=async()=>{let x=await I();x.inside?x.exit():x.enter()};let J=null,j=0,Y=performance.now();addEventListener("keydown",x=>{(x.key==="f"||x.key==="F")&&!["INPUT","SELECT","TEXTAREA"].includes(x.target.tagName)&&Be("fps").classList.toggle("on")});let z=x=>{if(j++,x-Y>=1e3){if(Be("fps").classList.contains("on")){let S=j*1e3/(x-Y),U=`${S.toFixed(0)} fps  (${w==="model"?"3D model":"photo view"})`;U+=S>=30?"  OK":S>=20?"  try Low graphics":"  SLOW \u2013 use Low graphics",w==="model"&&J&&(U+=`
${J.calls} draw calls \xB7 ${(J.triangles/1e3).toFixed(0)}k triangles`),U+=`
screen ${innerWidth}\xD7${innerHeight} @${devicePixelRatio}x \xB7 low gfx ${Be("lowgfx").checked?"ON":"off"}`,Be("fps").textContent=U}j=0,Y=x}requestAnimationFrame(z)};requestAnimationFrame(z),Be("curtain").onchange=x=>{m.curtain=x.target.checked,m.poll()},Be("dims").onchange=x=>T?.showDims(x.target.checked),Be("lowgfx").onchange=x=>{document.body.classList.toggle("lowgfx",x.target.checked),M.setLow(x.target.checked),T?.setLow(x.target.checked)},Be("play").onclick=()=>{f.playing=!f.playing,Be("play").textContent=f.playing?"\u275A\u275A":"\u25B6"},Be("speed").onchange=x=>f.speed=+x.target.value,r.forEach(x=>Be("jump").insertAdjacentHTML("beforeend",`<option value="${x.t}">${x.date}: ${x.why}</option>`)),Be("jump").onchange=x=>{x.target.value&&(f.jump(+x.target.value),f.speed===1&&(f.speed=720,Be("speed").value="720"),m.poll()),x.target.value=""},addEventListener("keydown",x=>{w!=="photo"||x.target.tagName==="SELECT"||(x.key==="ArrowRight"&&M.go(M.idx+1,!0),x.key==="ArrowLeft"&&M.go(M.idx-1,!0))});function Z(x){return x.sun.elevation_deg<-.83?"night":_()&&a.rows?a.rainToday?"monsoon":"day":x.day_class==="rainy"?"monsoon":"day"}m.on(x=>{Jc(x,s),M.update(x),M.setMode(Z(x)),T?.update(x,R),Yc()}),m.start(),(Q||window.STATIC_FORCE_2D)&&k(!0);let ce=()=>{f.tick(),requestAnimationFrame(ce)};ce()}Xf().catch(s=>{document.body.insertAdjacentHTML("beforeend",`<div style="position:fixed;inset:30% 20%;background:#fff;color:#000;padding:20px;border-radius:10px;z-index:99">
     <b>Could not start.</b> Is the server running? Start it with <code>python run.py</code>.<br><small>${s}</small></div>`),console.error(s)});})();
/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
