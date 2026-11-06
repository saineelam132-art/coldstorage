(()=>{var xd=Object.defineProperty;var Bn=(r,e)=>()=>(r&&(e=r(r=0)),e);var bd=(r,e)=>{for(var t in e)xd(r,t,{get:e[t],enumerable:!0})};async function rt(r){if(window.STATIC_API)return window.STATIC_API.get(r);let e=await fetch(r);if(!e.ok)throw new Error(`${r}: ${e.status}`);return e.json()}async function yn(r,e={}){if(window.STATIC_API)return window.STATIC_API.post(r,e);let t=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok)throw new Error(`${r}: ${t.status}`);return t.json()}var os,ls,Hn=Bn(()=>{os=class{constructor(e=0,t=720){this.t=e,this.speed=t,this.playing=!0,this.last=performance.now()}tick(e=performance.now()){let t=Math.min(.25,(e-this.last)/1e3);return this.last=e,this.playing&&(this.t=(this.t+t*this.speed)%(365*86400)),window.STATIC_API&&(this.t=window.STATIC_API.clamp(this.t)),this.t}jump(e){this.t=window.STATIC_API?window.STATIC_API.clamp(e):e}},ls=class{constructor(e){this.clock=e,this.curtain=!0,this.listeners=[],this.state=null,this.busy=!1}on(e){this.listeners.push(e),this.state&&e(this.state)}async poll(){if(!this.busy){this.busy=!0;try{let e=await rt(`api/state?t=${this.clock.t.toFixed(0)}&curtain=${this.curtain?1:0}`);this.state=e,this.listeners.forEach(t=>t(e))}catch(e){console.warn(e)}this.busy=!1}}start(e=330){this.poll(),setInterval(()=>this.poll(),e)}}});function ve(r,e=""){if(r==null||Number.isNaN(r))return"\u2014";if(typeof r=="boolean")return r?"YES":"NO";let t=Od[e]??2;return`${Number(r).toFixed(t)}${e?" "+e:""}`}function co(r,e){let t=e?.values?.[r.quantity];return r.quantity==="door_open"?t?"OPEN":"CLOSED":r.quantity==="grid_on"?t?"GRID":"SOLAR / PCM":r.quantity==="gas_ppm"&&t==null?"no sensor connected":ve(t,r.unit)}function hs(r){return r?.source==="LIVE"?'<span class="badge live">LIVE sensor</span>':'<span class="badge sim">SIMULATED</span>'}function Ri(r,e,t){Ai.innerHTML=r,Ai.classList.add("on");let n=Ai.getBoundingClientRect(),i=innerWidth,s=innerHeight,a=e+16,o=t-10-52;a+n.width>i-8&&(a=e-n.width-16),o+n.height>s-140&&(o=s-140-n.height),Ai.style.left=`${a}px`,Ai.style.top=`${Math.max(4,o)}px`}function xn(){Ai.classList.remove("on")}function ho(r){return cs=r,lo.innerHTML=r(),Nc.classList.add("on"),lo}function bn(){Nc.classList.remove("on"),cs=null}function Uc(){if(!cs)return;let r=document.createElement("div");r.innerHTML=cs(),r.querySelectorAll("[data-live]").forEach(e=>{let t=lo.querySelector(`[data-live="${e.dataset.live}"]`);t&&(t.innerHTML=e.innerHTML)})}async function Oc(r,e,t,n,i){let s=await rt(`api/series?q=${e}&t=${t.toFixed(0)}&hours=24`),a=r.getContext("2d"),o=devicePixelRatio||1,l=r.clientWidth,c=r.clientHeight;r.width=l*o,r.height=c*o,a.scale(o,o);let h=s.v.map(g=>g===null?NaN:typeof g=="boolean"?+g:g),u=h.filter(g=>!Number.isNaN(g));if(!u.length){a.fillStyle="#7b8a99",a.font="12px sans-serif",a.fillText("No history for this value",8,20);return}let d=Math.min(...u),p=Math.max(...u);p-d<1e-6&&(d-=1,p+=1);let f={l:38,r:8,t:14,b:18},v=g=>f.l+(l-f.l-f.r)*g/(h.length-1),m=g=>f.t+(c-f.t-f.b)*(1-(g-d)/(p-d));a.strokeStyle="#d5e2ec",a.lineWidth=1,a.fillStyle="#41566b",a.font="11px sans-serif",[d,(d+p)/2,p].forEach(g=>{a.beginPath(),a.moveTo(f.l,m(g)),a.lineTo(l-f.r,m(g)),a.stroke(),a.fillText(ve(g,n).replace(" "+n,""),2,m(g)+4)}),a.fillText(s.t[0],f.l,c-4),a.textAlign="right",a.fillText(`${s.t[s.t.length-1]}  (last 24 h, ${n})`,l-f.r,c-4),a.textAlign="left",a.strokeStyle="#2a78d6",a.lineWidth=2,a.beginPath();let y=!1;h.forEach((g,_)=>{if(Number.isNaN(g)){y=!1;return}y?a.lineTo(v(_),m(g)):a.moveTo(v(_),m(g)),y=!0}),a.stroke()}function Fc(r,e){let t=r.values,n=e.design.setpoint,i=Gt("d_room"),s=t.T_room_sensor??t.T_room;i.innerHTML=ve(s,"\xB0C")+(t.fault_active?`<small class="flag">${t.sensor_suspicious?"\u26A0 SENSOR SUSPICIOUS":"sensor \u2260 physics\u2026"}</small>`:""),i.className=t.sensor_suspicious||s<n.band_low_C||s>n.band_high_C?"bad":s>n.band_high_C-.5?"warn":"good",Gt("d_out").textContent=ve(t.T_out,"\xB0C"),Gt("d_load").textContent=ve(t.Q_total,"kW"),Gt("d_pv").textContent=ve(t.P_pv,"kW");let a=Gt("d_pcm");a.textContent=ve(t.pcm_pct,"%"),a.className=t.pcm_pct<e.design.controller.ats_pcm_pct?"bad":t.pcm_pct<40?"warn":"",Gt("d_backup").textContent=t.backup_h===null?"\u221E":ve(t.backup_h,"h"),Gt("d_src").textContent=t.grid_on?"GRID":t.P_solar_used>0?"SOLAR":"WAX",Gt("d_src").className=t.grid_on?"warn":"good",Gt("d_fan").textContent=`${(t.G_wax_W_K??0).toFixed(0)} W/K`,Gt("d_fan").title="Finned wax panels: passive, 0 W",Gt("d_clock").textContent=r.clock,Gt("d_src_label").innerHTML=hs(r)}var Od,Me,Ai,Nc,lo,cs,Gt,ii=Bn(()=>{Hn();Od={"\xB0C":1,"%":0,kW:2,"m/s":2,Pa:2,h:1,"\xB0":0,ppm:0,"":2,"W/m\xB2":0};Me=r=>`<span class="tag ${r}" title="${{M:"Measured by a sensor",C:"Calculated by a formula",E:"Estimated / design value",AI:"Prediction"}[r]||""}">${r}</span>`;Ai=document.getElementById("tip");Nc=document.getElementById("panel"),lo=document.getElementById("panelBody");document.getElementById("panelClose").onclick=()=>bn();cs=null;Gt=r=>document.getElementById(r)});function zc(r){let e=devicePixelRatio||1,t=r.clientWidth,n=r.clientHeight;r.width=t*e,r.height=n*e;let i=r.getContext("2d");return i.scale(e,e),i.font="11px sans-serif",{g:i,W:t,H:n}}function gr(r,{x:e,series:t,unit:n="",band:i=null,yMin:s=null,yMax:a=null,xTitle:o=""}){let{g:l,W:c,H:h}=zc(r),u=t.flatMap(_=>_.y).filter(_=>_!==null&&!Number.isNaN(_));i&&u.push(...i);let d=s??Math.min(...u),p=a??Math.max(...u);p-d<1e-6&&(d-=1,p+=1);let f={l:36,r:8,t:10,b:30},v=Math.max(...t.map(_=>_.y.length)),m=_=>f.l+(c-f.l-f.r)*_/Math.max(1,v-1),y=_=>f.t+(h-f.t-f.b)*(1-(_-d)/(p-d));i&&(l.fillStyle="rgba(42,120,214,.08)",l.fillRect(f.l,y(i[1]),c-f.l-f.r,y(i[0])-y(i[1]))),l.strokeStyle=kc,l.fillStyle=Bc,l.lineWidth=1;for(let _=0;_<=3;_++){let b=d+(p-d)*_/3;l.beginPath(),l.moveTo(f.l,y(b)),l.lineTo(c-f.r,y(b)),l.stroke(),l.fillText(b.toFixed(Math.abs(p-d)<5?1:0),2,y(b)+4)}e?.length&&(l.fillText(e[0],f.l,h-16),l.textAlign="right",l.fillText(e[e.length-1],c-f.r,h-16),l.textAlign="left"),l.fillText(`${o}${n?"   ("+n+")":""}`,f.l,h-3),t.forEach(_=>{l.strokeStyle=_.color,l.lineWidth=2,l.beginPath();let b=!1;_.y.forEach((T,M)=>{if(T===null||Number.isNaN(T)){b=!1;return}b?l.lineTo(m(M),y(T)):l.moveTo(m(M),y(T)),b=!0}),l.stroke()});let g=c-f.r;l.textAlign="right",[...t].reverse().forEach(_=>{_.label&&(l.fillStyle=_.color,l.fillText(_.label,g,f.t+10),g-=l.measureText(_.label).width+14)}),l.textAlign="left"}function Hc(r,e){let{g:t,W:n,H:i}=zc(r),s={l:40,r:10,t:10,b:30},a=100,o=720,l=1,c=45,h=p=>s.l+(n-s.l-s.r)*(p-a)/(o-a),u=p=>s.t+(i-s.t-s.b)*(1-Math.log(p/l)/Math.log(c/l));t.strokeStyle=kc,t.fillStyle=Bc,[1,2,4,10,20,40].forEach(p=>{t.beginPath(),t.moveTo(s.l,u(p)),t.lineTo(n-s.r,u(p)),t.stroke(),t.fillText(p,4,u(p)+4)}),[200,400,600].forEach(p=>t.fillText(p,h(p)-8,i-16)),t.fillText("h, kJ/kg   \xB7   P, bar (log)",s.l,i-3),t.strokeStyle="#8a8984",t.lineWidth=1.5;for(let p of[e.dome.liquid,e.dome.vapour])t.beginPath(),p.forEach(([f,v],m)=>m?t.lineTo(h(f),u(v)):t.moveTo(h(f),u(v))),t.stroke();t.strokeStyle="#2a78d6",t.lineWidth=2.5,t.beginPath(),e.points.forEach(([p,f],v)=>v?t.lineTo(h(p),u(f)):t.moveTo(h(p),u(f))),t.stroke(),t.fillStyle="#0d1b2a",t.font="bold 12px sans-serif";let d=e.cycle;[[d.h1,d.P_evap_bar,"1",6,14],[d.h2,d.P_cond_bar,"2",6,-4],[d.h3,d.P_cond_bar,"3",-12,-4],[d.h4,d.P_evap_bar,"4",-12,14]].forEach(([p,f,v,m,y])=>{t.beginPath(),t.arc(h(p),u(f),3.5,0,7),t.fill(),t.fillText(v,h(p)+m,u(f)+y)})}var Bc,kc,uo=Bn(()=>{Bc="#41566b",kc="#d5e2ec"});function Gc(r,e,t,n,i,s){po=r,fo=t,go=n,vr=i,_o=s,e.sensors.forEach(a=>mo[a.id]=a)}function _r(r){let e=go?.closeups?.[r],t=e&&fo?.A?.[e];return t?`<img class="closeup" src="${t.small}" alt="${r} close-up">`:""}function Fd(r){return r&&fo?.B?.[r]?.src}function Vc(r,e){let t=go?.cutouts?.[r]?.[e];if(!t)return"";if(t.startsWith("missing:"))return`<div class="cutph"><svg viewBox="0 0 80 50" width="80" height="50"><rect x="8" y="8" width="64" height="34" rx="5" fill="#e3ecf3" stroke="#93a8bb"/>
      <circle cx="26" cy="25" r="7" fill="none" stroke="#93a8bb" stroke-width="2"/><circle cx="54" cy="25" r="7" fill="none" stroke="#93a8bb" stroke-width="2"/>
      <path d="M33 25h14" stroke="#93a8bb" stroke-width="2"/></svg><span>Picture coming: ${t.slice(8)}</span></div>`;let n=Fd(t);return n?`<img class="cutout" src="${n}" alt="${e}">`:""}function us(r){let e=mo[r],t=vr();return e?`<b>${e.name}</b>${Me(e.tag)}<span class="v">${co(e,t)}</span><small>${e.location}</small>`:""}function ds(r){if(r.startsWith("batch:"))return`<b>New batch ${r.slice(6)}</b><span class="v">click for batch card + QR</span>`;let e=Gn[r],t=vr();return!e||!t?"":`<b>${e.name}</b><span class="v">${e.headline(t.values)}</span><small>Click for details</small>`}function Ci(r){let e=mo[r];if(!e)return;let t=!["door_open","door_angle","v_door_top","v_door_mid","v_door_bot","dp_top","gas_ppm","RH_room"].includes(e.quantity),i=ho(()=>{let s=vr();return`<h2>${e.name}</h2><div class="sub">${Me(e.tag)} ${hs(s)}</div>
      ${Vc("sensors",e.id)}
      <div class="big" data-live="v">${co(e,s)}</div>
      ${e.tag==="C"?'<div class="note">In the twin this value is <b>calculated</b> from the door physics (ASHRAE Gosney\u2013Olama). With the real sensor fitted it becomes a measurement (M) that checks the formula.</div>':""}
      ${Bd(e,s)}
      ${t?'<canvas id="hist"></canvas>':""}
      <table>
        <tr><td>Sensor type</td><td>${e.type}</td></tr>
        <tr><td>Range</td><td>${e.range}</td></tr>
        <tr><td>Accuracy</td><td>${e.accuracy}</td></tr>
        <tr><td>Location</td><td>${e.location}</td></tr>
        <tr><td>Protocol</td><td>${e.protocol}</td></tr>
        <tr><td>Used in</td><td>${e.used_in}</td></tr>
      </table>
      ${e.id==="t_out"||e.id==="wind"?_r("mast"):""}
      <div class="note">${s?.label||""}</div>`});t&&Oc(i.querySelector("#hist"),e.quantity,_o(),e.unit,e.name)}function Bd(r,e){let t=e?.values||{};return r.id.startsWith("v_")||r.id==="dp"?`<div class="kv" data-live="door">
      <span>Door now</span><b>${t.door_open?"OPEN":"closed"}</b>
      <span>Air speed if the door opens</span><b>${ve(t.v_door_if_open,"m/s")}</b>
      <span>Heat entering if open</span><b>${ve(t.heat_if_open_kW,"kW")}</b>
      <span>Strip curtain</span><b>${t.curtain?"ON (E = 0.85)":"OFF"}</b></div>
      <div class="formula">V\u0307 = 0.221\xB7A\xB7\u221A(g\xB7H\xB7(1 \u2212 \u03C1_out/\u03C1_in))\xB7F_m<br>v \u2248 V\u0307 / (A/2) \xB7 (1 \u2212 E)<br>\u0394p_top = (\u03C1_in \u2212 \u03C1_out)\xB7g\xB7H/2</div>`:""}function an(r){if(r.startsWith("batch:")){document.dispatchEvent(new CustomEvent("openbatch",{detail:r.slice(6)}));return}let e=Gn[r];if(!e)return;let t=ho(()=>{let n=vr();return`<h2>${e.name}</h2><div class="sub">${hs(n)}</div>
      ${Vc("parts",r)}
      <div class="big" data-live="head">${n?e.headline(n.values):"\u2014"}</div>
      ${n?e.body(n.values,po):""}<div class="note">${n?.label||""}</div>`});e.after&&e.after(t,_o())}function zd(r){let e=Wc[r];return{name:e.name,headline:t=>`room ${ve(t.T_room,"\xB0C")}`,body:()=>`<div id="cropBody">Calculating shelf life from the room's temperature history\u2026</div>
      <canvas id="cropHist"></canvas>
      <div class="note">Entry time is an example (${e.days} day${e.days>1?"s":""} ago) ${Me("E")}. Batch ID, QR code and the
      \u201CRecord verified \u2713\u201D check come with the ledger in build step 4.</div>`,async after(t,n){let i=await rt(`api/crop?key=${e.key}&t=${n.toFixed(0)}&days=${e.days}`),s=i.assess,a=s.freshness_score,o=a>70?"#22c55e":a>40?"#f59e0b":"#ef4444",l=[...s.warnings,i.chill_now].filter(Boolean);t.querySelector("#cropBody").innerHTML=`
        <div class="kv">
          <span>Stored for</span><b>${i.days_stored} day${i.days_stored>1?"s":""}</b>
          <span>Remaining shelf life (at ${i.T_ref_C} \xB0C) ${Me("C")}</span><b>${s.remaining_days_at_ref.toFixed(1)} days</b>
          <span>If kept at today's ${s.T_now_C.toFixed(1)} \xB0C ${Me("C")}</span><b>${s.remaining_days_at_current_T.toFixed(1)} days</b>
          <span>Freshness score</span><b style="color:${o}">${a.toFixed(0)} / 100</b>
          <span>Best storage</span><b>${i.T_opt[0]}\u2013${i.T_opt[1]} \xB0C</b></div>
        <div class="fresh"><i style="width:${a}%;background:${o}"></i></div>
        ${l.length?l.map(c=>`<div class="warnbox">\u26A0 ${c}</div>`).join(""):'<div class="okbox">\u2713 No chilling or freezing risk</div>'}
        <div class="formula">rate(T) = 1/SL_ref \xB7 Q10^((T \u2212 T_ref)/10)<br>remaining = SL_ref \xB7 (1 \u2212 \u03A3 rate\xB7\u0394t)<br>
        SL_ref = ${i.SL_ref_days} d at ${i.T_ref_C} \xB0C, Q10 = ${i.Q10}</div>
        <div class="note">Source: ${i.source}</div>`,gr(t.querySelector("#cropHist"),{x:[`${i.days_stored} d ago`,"now"],series:[{y:i.history_T,color:"#2a78d6",label:"room T while stored"}],unit:"\xB0C",band:[2,8],xTitle:"storage history"})}}}var po,mo,fo,go,vr,_o,kd,Gn,Wc,st,yr=Bn(()=>{ii();Hn();uo();po=null,mo={},fo=null,go=null,vr=()=>null,_o=()=>0;kd=r=>ve(r,"%"),Gn={solar:{name:"Solar PV array",headline:r=>`${ve(r.P_pv,"kW")} now`,body:(r,e)=>{let t=e.geometry.pv;return`<div class="kv" data-live="pv">
        <span>PV power now ${Me("M")}</span><b>${ve(r.P_pv,"kW")}</b>
        <span>Sunlight on the panel ${Me("M")}</span><b>${ve(r.poa,"W/m\xB2")}</b>
        <span>Used by the compressor</span><b>${ve(r.P_solar_used,"kW")}</b>
        <span>Spare (not needed now)</span><b>${ve(Math.max(0,r.P_pv-r.P_solar_used),"kW")}</b></div>
        <table><tr><td>Array</td><td>${t.modules} modules \xD7 ${t.module_W} W = ${t.array_kWp.toFixed(2)} kWp ${Me("E")}</td></tr>
        <tr><td>Tilt / facing</td><td>${t.tilt_deg}\xB0 , south ${Me("E")}</td></tr>
        <tr><td>Performance ratio</td><td>${e.design.pv.performance_ratio}</td></tr></table>
        <div class="formula">P = P_rated\xB7(G/1000)\xB7PR\xB7[1 \u2212 0.004\xB7(T_cell \u2212 25)]<br>T_cell = T_amb + (NOCT \u2212 20)/800\xB7G</div>
        ${_r("solar")}`}},condenser:{name:"R290 condensing unit",headline:r=>`${ve(r.P_comp,"kW")} \xB7 COP ${ve(r.cop,"")}`,body:(r,e)=>`<div class="kv" data-live="cond">
        <span>Compressor power ${Me("M")}</span><b>${ve(r.P_comp,"kW")}</b>
        <span>Cooling now ${Me("C")}</span><b>${ve(r.Q_cool,"kW")}</b>
        <span>Compressor speed ${Me("C")}</span><b>${kd(r.comp_speed_pct)}</b>
        <span>COP (electrical) ${Me("C")}</span><b>${ve(r.cop,"")}</b>
        <span>Condensing temperature ${Me("C")}</span><b>${ve(r.T_out+e.design.refrigeration.cond_approach_K,"\xB0C")}</b>
        <span>Power from</span><b>${r.grid_on?"GRID (ATS)":"SOLAR"}</b></div>
        <table><tr><td>Refrigerant</td><td>R290 (propane), ${e.design.refrigeration.charge_g_min}\u2013${e.design.refrigeration.charge_g_max} g</td></tr>
        <tr><td>Max cooling</td><td>${e.design.refrigeration.design_capacity_kW} kW (inverter, 30\u2013100 %)</td></tr>
        <tr><td>Evaporating</td><td>${e.design.refrigeration.T_evap_C} \xB0C</td></tr></table>
        <div class="formula">T_cond = T_out + 10 K<br>COP_elec = (q_e / w_s)\xB7\u03B7_is\xB7\u03B7_motor (CoolProp)</div>
        ${_r("condenser")}`},door:{name:"Door (0.8 \xD7 1.8 m) and strip curtain",headline:r=>r.door_open?`OPEN \u2013 ${ve(r.heat_now_kW,"kW")} coming in`:"closed",body:(r,e)=>`<div class="kv" data-live="door">
        <span>Door ${Me("M")}</span><b>${r.door_open?"OPEN":"closed"}</b>
        <span>Heat entering now ${Me("C")}</span><b>${ve(r.heat_now_kW,"kW")}</b>
        <span>\u2026of which moisture (latent)</span><b>${ve(r.heat_latent_now_kW,"kW")}</b>
        <span>Heat if the door opens now</span><b>${ve(r.heat_if_open_kW,"kW")}</b>
        <span>Last opening lasted ${Me("M")}</span><b>${r.last_open_s.toFixed(0)} s</b>
        <span>Energy of that opening ${Me("C")}</span><b>${r.last_open_kJ.toFixed(0)} kJ</b>
        <span>\u2026same as the walls leak in</span><b>${r.last_open_wall_minutes.toFixed(0)} min</b>
        <span>Strip curtain</span><b>${r.curtain?"ON (E = 0.85)":"OFF (E = 0)"}</b>
        <span>Door open in this 5 min</span><b>${ve(r.door_s_this_5min,"")} s</b>
        <span>Door load, 5-min average ${Me("C")}</span><b>${ve(r.Q_door,"kW")}</b></div>
        <div class="formula">q = 0.221\xB7A\xB7(h_out \u2212 h_in)\xB7\u03C1_in\xB7(1 \u2212 \u03C1_out/\u03C1_in)^0.5\xB7(g\xB7H)^0.5\xB7F_m<br>Q = q\xB7D_t\xB7D_f\xB7(1 \u2212 E)</div>
        <div class="note">Try the Curtain switch at the top: the heat entering changes immediately.</div>`},crates:{name:"Produce crates",headline:r=>r.T_batch!==null?`new batch at ${ve(r.T_batch,"\xB0C")}`:`stored at ${ve(r.T_room,"\xB0C")}`,body:(r,e)=>`<div class="kv" data-live="crates">
        <span>New batch temperature ${Me("M")}</span><b>${r.T_batch!==null?ve(r.T_batch,"\xB0C"):"no new batch now"}</b>
        <span>Heat from new batch ${Me("C")}</span><b>${ve(r.Q_batch,"kW")}</b>
        <span>Respiration heat ${Me("C")}</span><b>${ve(r.Q_resp,"kW")}</b></div>
        <table><tr><td>Daily batch</td><td>${e.design.product.batch_mass_kg} kg at ${e.design.product.T_entry_C} \xB0C, arrives ${e.design.simulation.batch_arrival_hour}:00 ${Me("E")}</td></tr>
        <tr><td>Pull-down</td><td>to ${e.design.product.T_final_C} \xB0C in ${e.design.product.pulldown_hours} h (7/8 cooling time)</td></tr>
        <tr><td>Already stored</td><td>${e.design.simulation.stock_mass_kg} kg ${Me("E")}</td></tr></table>
        <div class="formula">Q_batch = UA\xB7(T_batch \u2212 T_room),  UA = m\xB7cp\xB7ln 8 / 4 h</div>
        <div class="note">Batch IDs, QR codes and shelf life come in build step 4.</div>`},worker:{name:"Farmer bringing a crate",headline:r=>`door ${r.door_open?"OPEN":"closed"} \xB7 ${ve(r.heat_if_open_kW,"kW")} if open`,body:(r,e)=>Gn.door.body(r,e)}};Wc={crate_greens:{key:"leafy_greens",days:2,name:"Crate of leafy greens (spinach)"},crate_grapes:{key:"grapes",days:5,name:"Crate of grapes"},milk:{key:"milk",days:1,name:"Milk cans"},vaccine:{key:"vaccines",days:20,name:"Vaccine box (illustration)"}};Object.keys(Wc).forEach(r=>Gn[r]=zd(r));Gn.pcm={name:"Wax (PCM) cold battery",headline:r=>`${ve(r.pcm_pct,"%")} frozen`,body:(r,e)=>{let t=e.design.pcm,n=e.geometry.pcm,i=t.mass_kg*t.latent_kJ_kg*r.pcm_pct/100/3600;return`<div class="kv" data-live="pcm">
        <span>Battery (frozen fraction) ${Me("C")}</span><b>${ve(r.pcm_pct,"%")}</b>
        <span>Backup time left ${Me("C")}</span><b>${r.backup_h===null?"\u221E":ve(r.backup_h,"h")}</b>
        <span>Wax temperature ${Me("M")}</span><b>${ve(r.T_pcm,"\xB0C")}</b>
        <span>Latent cold left ${Me("C")}</span><b>${i.toFixed(2)} kWh</b>
        <span>Melted thickness now ${Me("C")}</span><b>${((1-r.pcm_pct/100)*n.thickness_mm).toFixed(1)} of ${n.thickness_mm.toFixed(1)} mm</b>
        <span>Being charged by the coil</span><b>${ve(r.Q_coil_pcm,"kW")}</b></div>
      <table><tr><td>Wax</td><td>${t.mass_kg} kg paraffin, melts at ${t.T_melt_C} \xB0C, L = ${t.latent_kJ_kg} kJ/kg ${Me("E")}</td></tr>
      <tr><td>Panels</td><td>${n.area_m2} m\xB2 of wall, ${n.thickness_mm.toFixed(1)} mm thick</td></tr></table>
      <div class="formula">E = m\xB7L\xB7frozen fraction  \xB7  backup = E_remaining / holding load</div>
      <b>Melt front in one slab (FTCS model, room air 8 \xB0C)</b>
      <canvas id="slab"></canvas>
      <div class="note" id="slabNote"></div>${_r("pcm")}`},async after(r){let e=await rt("api/slab"),t=e.hours.map(n=>`${n.toFixed(0)} h`);gr(r.querySelector("#slab"),{x:[t[0],t[t.length-1]],series:[{y:e.melt_front_mm,color:"#eb6834",label:"melt front, mm"}],unit:"mm",yMin:0,yMax:e.thickness_mm*1.05,xTitle:"time"}),r.querySelector("#slabNote").textContent=`Enthalpy method, explicit FTCS: ${e.nx} cells, \u0394x = ${e.dx_mm.toFixed(2)} mm, \u0394t = ${e.dt_s.toFixed(2)} s, r = \u03B1\u0394t/\u0394x\xB2 = ${e.r.toFixed(2)} \u2264 0.5 (stable).`}};st=(r,e=0)=>r==null||Number.isNaN(r)?"\u2014":Number(r).toFixed(e);Gn.fins={name:"Finned wax panels (passive \u2013 no fan, no baffle)",headline:r=>`area \xD7 ${st((po?.wax_hx||{}).area_mult,1)} \xB7 UA ${st(r.G_wax_W_K)} W/K \xB7 0 W`,body:(r,e)=>{let t=e.wax_hx||{},n=e.design.live_run.wax_hx,i=e.design.live_run.battery_12V,s=t.plain||{},a=r.T_room-(r.T_pcm??4);return`<div class="kv" data-live="fins">
        <span>Heat into the wax now ${Me("C")}</span><b>${ve(r.Q_pcm_room,"kW")}</b>
        <span>Wax \u2194 room conductance now ${Me("C")}</span><b>${st(r.G_wax_W_K,1)} W/K</b>
        <span>Room \u2212 wax ${Me("C")}</span><b>${ve(a,"K")}</b>
        <span>Electricity used ${Me("E")}</span><b>0 W (no moving parts)</b>
        <span>Room temperature ${Me("M")}</span><b>${ve(r.T_room,"\xB0C")}</b></div>
      <table><tr><td>Fins</td><td>${st(t.b_mm)} mm deep, ${st(t.S_mm)} mm gap, ${st(t.t_mm)} mm thick aluminium, ${st(t.N_fins)} fins over ${st(t.A_m2/t.L_m,1)} m of wall, ${st(t.L_m,1)} m tall ${Me("E")}</td></tr>
      <tr><td>Surface area</td><td><b>\xD7 ${st(t.area_mult,2)}</b> compared with a plain panel; fin efficiency ${st(t.eta,3)}</td></tr>
      <tr><td>Air film (natural convection)</td><td>h = ${st(t.h,2)} W/m\xB2K (lower of Bar-Cohen & Rohsenow ${st(t.h_bar_cohen,2)} and Van de Pol & Tierney ${st(t.h_van_de_pol,2)})</td></tr>
      <tr><td>Conductance at 3 K</td><td>fins: UA = <b>${st(t.UA,1)} W/K</b> \u2192 ${st(t.Q_W)} W \xB7 plain panel: UA = ${st(s.UA,1)} W/K \u2192 ${st(s.Q_W)} W</td></tr>
      <tr><td>Needed</td><td>hottest 2026 night (${st(t.T_out_design_night_C,1)} \xB0C outside): ${st(t.load_W)} W at room 7 \xB0C</td></tr>
      <tr><td>Build</td><td>${n.material}; removable ${n.section_length_m} m sections for cleaning; ${st(t.al_kg)} kg aluminium</td></tr>
      <tr><td>Keep clear</td><td>${n.keep_clear_m*100} cm free zone in front of the fins, floor stoppers for the crates</td></tr>
      <tr><td>Optional fans</td><td>mounting points + 12 V cable for ${n.optional_fans.provision} \xD7 120 mm fans \u2013 <b>optional</b>, add only if the Phase 4 test shows the fins &gt;25 % weaker</td></tr>
      <tr><td>12 V battery</td><td>${i.capacity_Ah} Ah ${i.chemistry} for controller, sensors and IoT gateway only \u2013 NO battery for cooling</td></tr></table>
      <div class="formula">El = Ra_S\xB7S/L, Nu_S = [576/El\xB2 + 2.873/El^0.5]^\u22120.5 (Bar-Cohen & Rohsenow)<br>
        \u03B7 = tanh(m\xB7Lc)/(m\xB7Lc), m = \u221A(2h/(k_al\xB7t))<br>UA = 1 / [1/(h\xB7(A_base + \u03B7\xB7A_fins)) + R_wax/A]</div>
      <div class="note">Cooled air falls between the fins by itself \u2013 nothing to switch on, nothing to break, nothing to power at night.</div>`}};Gn.driptray={name:"Drip tray under the wax panels",headline:()=>"sloped tray \xB7 drain + trap",body:(r,e)=>`<div class="kv"><span>Fin surface ${Me("C")}</span><b>about ${ve((r.T_pcm??4)+.5,"\xB0C")}</b>
      <span>Room air ${Me("M")}</span><b>${ve(r.T_room,"\xB0C")} / ${ve(e.design.setpoint.rh_room_pct,"%")} RH</b></div>
    <p>The fins sit at about 4\u20135 \xB0C, below the dew point of the room air (about 5.5 \xB0C at 7 \xB0C and 90 % RH), so water condenses on them \u2013
    mostly moisture given off by the fresh produce. A sloped stainless tray under the panels collects it and a drain with a water trap
    takes it out (the trap stops warm outside air coming in). The wax never goes below 3 \xB0C, so the fins never frost.</p>
    <div class="note">Clean the tray and the fin sections (removable, 0.6 m long) every month \u2013 wet surfaces in a food room must not grow mould.</div>`};Gn.evaporator={name:"Evaporator (R290 at \u22125 \xB0C)",headline:r=>`${ve(r.Q_coil_air,"kW")} from the air`,body:(r,e)=>`<div class="kv" data-live="evap">
      <span>Cooling the room air ${Me("C")}</span><b>${ve(r.Q_coil_air,"kW")}</b>
      <span>Freezing the wax ${Me("C")}</span><b>${ve(r.Q_coil_pcm,"kW")}</b>
      <span>Compressor speed ${Me("C")}</span><b>${ve(r.comp_speed_pct,"%")}</b>
      <span>Room temperature ${Me("M")}</span><b>${ve(r.T_room,"\xB0C")}</b></div>
      <b>Live R290 cycle (T_cond = outside + 10 K)</b>
      <canvas id="ph" style="height:200px"></canvas>
      <div class="kv" id="cyc"></div>
      <div class="formula">q_e = h1 \u2212 h4 \xB7 w = (h2s \u2212 h1)/\u03B7_is \xB7 COP_elec = q_e/w \xB7 \u03B7_motor</div>${_r("evaporator")}`,async after(r,e){let t=await rt(`api/cycle?t=${e.toFixed(0)}`);Hc(r.querySelector("#ph"),t);let n=t.cycle;r.querySelector("#cyc").innerHTML=`
      <span>Evaporating / condensing</span><b>${n.T_evap_C.toFixed(0)} / ${n.T_cond_C.toFixed(1)} \xB0C</b>
      <span>Pressures</span><b>${n.P_evap_bar.toFixed(2)} / ${n.P_cond_bar.toFixed(2)} bar</b>
      <span>h1 \xB7 h2 \xB7 h3 = h4</span><b>${n.h1.toFixed(0)} \xB7 ${n.h2.toFixed(0)} \xB7 ${n.h3.toFixed(0)} kJ/kg</b>
      <span>COP ideal / real / electrical</span><b>${n.COP_ideal.toFixed(2)} / ${n.COP_real.toFixed(2)} / ${n.COP_elec.toFixed(2)}</b>
      <span>R290 mass flow</span><b>${n.m_dot_g_s.toFixed(2)} g/s</b>
      <span>Design point (50 \xB0C condensing)</span><b>COP_elec ${t.design.COP_elec.toFixed(2)}</b>`}}});function un(){let r=4294967295*Math.random()|0,e=4294967295*Math.random()|0,t=4294967295*Math.random()|0,n=4294967295*Math.random()|0;return(xt[255&r]+xt[r>>8&255]+xt[r>>16&255]+xt[r>>24&255]+"-"+xt[255&e]+xt[e>>8&255]+"-"+xt[e>>16&15|64]+xt[e>>24&255]+"-"+xt[63&t|128]+xt[t>>8&255]+"-"+xt[t>>16&255]+xt[t>>24&255]+xt[255&n]+xt[n>>8&255]+xt[n>>16&255]+xt[n>>24&255]).toLowerCase()}function ut(r,e,t){return Math.max(e,Math.min(t,r))}function ul(r,e){return(r%e+e)%e}function Cr(r,e,t){return(1-t)*r+t*e}function dl(r){return(r&r-1)==0&&r!==0}function la(r){return Math.pow(2,Math.floor(Math.log(r)/Math.LN2))}function hn(r,e){switch(e.constructor){case Float32Array:return r;case Uint32Array:return r/4294967295;case Uint16Array:return r/65535;case Uint8Array:return r/255;case Int32Array:return Math.max(r/2147483647,-1);case Int16Array:return Math.max(r/32767,-1);case Int8Array:return Math.max(r/127,-1);default:throw new Error("Invalid component type.")}}function Xe(r,e){switch(e.constructor){case Float32Array:return r;case Uint32Array:return Math.round(4294967295*r);case Uint16Array:return Math.round(65535*r);case Uint8Array:return Math.round(255*r);case Int32Array:return Math.round(2147483647*r);case Int16Array:return Math.round(32767*r);case Int8Array:return Math.round(127*r);default:throw new Error("Invalid component type.")}}function Hu(r){for(let e=r.length-1;e>=0;--e)if(r[e]>=65535)return!0;return!1}function Fr(r){return document.createElementNS("http://www.w3.org/1999/xhtml",r)}function np(){let r=Fr("canvas");return r.style.display="block",r}function Pr(r){r in Sh||(Sh[r]=!0,console.warn(r))}function Ki(r){return r<.04045?.0773993808*r:Math.pow(.9478672986*r+.0521327014,2.4)}function To(r){return r<.0031308?12.92*r:1.055*Math.pow(r,.41666)-.055}function Ao(r){return typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&r instanceof ImageBitmap?ca.getDataURL(r):r.data?{data:Array.from(r.data),width:r.width,height:r.height,type:r.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}function Co(r,e,t,n,i){for(let s=0,a=r.length-3;s<=a;s+=3){si.fromArray(r,s);let o=i.x*Math.abs(si.x)+i.y*Math.abs(si.y)+i.z*Math.abs(si.z),l=e.dot(si),c=t.dot(si),h=n.dot(si);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}function Bo(r,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?r+6*(e-r)*t:t<.5?e:t<2/3?r+6*(e-r)*(2/3-t):r}function fp(){let r=new ArrayBuffer(4),e=new Float32Array(r),t=new Uint32Array(r),n=new Uint32Array(512),i=new Uint32Array(512);for(let l=0;l<256;++l){let c=l-127;c<-27?(n[l]=0,n[256|l]=32768,i[l]=24,i[256|l]=24):c<-14?(n[l]=1024>>-c-14,n[256|l]=1024>>-c-14|32768,i[l]=-c-1,i[256|l]=-c-1):c<=15?(n[l]=c+15<<10,n[256|l]=c+15<<10|32768,i[l]=13,i[256|l]=13):c<128?(n[l]=31744,n[256|l]=64512,i[l]=24,i[256|l]=24):(n[l]=31744,n[256|l]=64512,i[l]=13,i[256|l]=13)}let s=new Uint32Array(2048),a=new Uint32Array(64),o=new Uint32Array(64);for(let l=1;l<1024;++l){let c=l<<13,h=0;for(;!(8388608&c);)c<<=1,h-=8388608;c&=-8388609,h+=947912704,s[l]=c|h}for(let l=1024;l<2048;++l)s[l]=939524096+(l-1024<<13);for(let l=1;l<31;++l)a[l]=l<<23;a[31]=1199570944,a[32]=2147483648;for(let l=33;l<63;++l)a[l]=2147483648+(l-32<<23);a[63]=3347054592;for(let l=1;l<64;++l)l!==32&&(o[l]=1024);return{floatView:e,uint32View:t,baseTable:n,shiftTable:i,mantissaTable:s,exponentTable:a,offsetTable:o}}function Fs(r,e,t,n,i,s,a,o,l,c){r.getVertexPosition(o,zi),r.getVertexPosition(l,Hi),r.getVertexPosition(c,Gi);let h=function(u,d,p,f,v,m,y,g){let _;if(_=d.side===It?f.intersectTriangle(y,m,v,!0,g):f.intersectTriangle(v,m,y,d.side===Qn,g),_===null)return null;Os.copy(g),Os.applyMatrix4(u.matrixWorld);let b=p.ray.origin.distanceTo(Os);return b<p.near||b>p.far?null:{distance:b,point:Os.clone(),object:u}}(r,e,t,n,zi,Hi,Gi,Us);if(h){i&&(Is.fromBufferAttribute(i,o),Ds.fromBufferAttribute(i,l),Ns.fromBufferAttribute(i,c),h.uv=Zn.getInterpolation(Us,zi,Hi,Gi,Is,Ds,Ns,new ie)),s&&(Is.fromBufferAttribute(s,o),Ds.fromBufferAttribute(s,l),Ns.fromBufferAttribute(s,c),h.uv1=Zn.getInterpolation(Us,zi,Hi,Gi,Is,Ds,Ns,new ie),h.uv2=h.uv1),a&&(Oh.fromBufferAttribute(a,o),Fh.fromBufferAttribute(a,l),Bh.fromBufferAttribute(a,c),h.normal=Zn.getInterpolation(Us,zi,Hi,Gi,Oh,Fh,Bh,new w),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let u={a:o,b:l,c,normal:new w,materialIndex:0};Zn.getNormal(zi,Hi,Gi,u.normal),h.face=u}return h}function sr(r){let e={};for(let t in r){e[t]={};for(let n in r[t]){let i=r[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function Tt(r){let e={};for(let t=0;t<r.length;t++){let n=sr(r[t]);for(let i in n)e[i]=n[i]}return e}function Vu(r){return r.getRenderTarget()===null?r.outputColorSpace:qe.workingColorSpace}function Wu(){let r=null,e=!1,t=null,n=null;function i(s,a){t(s,a),n=r.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&(n=r.requestAnimationFrame(i),e=!0)},stop:function(){r.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){r=s}}}function xp(r,e){let t=e.isWebGL2,n=new WeakMap;return{get:function(i){return i.isInterleavedBufferAttribute&&(i=i.data),n.get(i)},remove:function(i){i.isInterleavedBufferAttribute&&(i=i.data);let s=n.get(i);s&&(r.deleteBuffer(s.buffer),n.delete(i))},update:function(i,s){if(i.isGLBufferAttribute){let o=n.get(i);return void((!o||o.version<i.version)&&n.set(i,{buffer:i.buffer,type:i.type,bytesPerElement:i.elementSize,version:i.version}))}i.isInterleavedBufferAttribute&&(i=i.data);let a=n.get(i);if(a===void 0)n.set(i,function(o,l){let c=o.array,h=o.usage,u=c.byteLength,d=r.createBuffer(),p;if(r.bindBuffer(l,d),r.bufferData(l,c,h),o.onUploadCallback(),c instanceof Float32Array)p=r.FLOAT;else if(c instanceof Uint16Array)if(o.isFloat16BufferAttribute){if(!t)throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");p=r.HALF_FLOAT}else p=r.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=r.SHORT;else if(c instanceof Uint32Array)p=r.UNSIGNED_INT;else if(c instanceof Int32Array)p=r.INT;else if(c instanceof Int8Array)p=r.BYTE;else if(c instanceof Uint8Array)p=r.UNSIGNED_BYTE;else{if(!(c instanceof Uint8ClampedArray))throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);p=r.UNSIGNED_BYTE}return{buffer:d,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}(i,s));else if(a.version<i.version){if(a.size!==i.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");(function(o,l,c){let h=l.array,u=l._updateRange,d=l.updateRanges;if(r.bindBuffer(c,o),u.count===-1&&d.length===0&&r.bufferSubData(c,0,h),d.length!==0){for(let p=0,f=d.length;p<f;p++){let v=d[p];t?r.bufferSubData(c,v.start*h.BYTES_PER_ELEMENT,h,v.start,v.count):r.bufferSubData(c,v.start*h.BYTES_PER_ELEMENT,h.subarray(v.start,v.start+v.count))}l.clearUpdateRanges()}u.count!==-1&&(t?r.bufferSubData(c,u.offset*h.BYTES_PER_ELEMENT,h,u.offset,u.count):r.bufferSubData(c,u.offset*h.BYTES_PER_ELEMENT,h.subarray(u.offset,u.offset+u.count)),u.count=-1),l.onUploadCallback()})(a.buffer,i,s),a.version=i.version}}}}function bp(r,e,t,n,i,s,a){let o=new Te(0),l,c,h=s===!0?0:1,u=null,d=0,p=null;function f(v,m){v.getRGB(ks,Vu(r)),n.buffers.color.setClear(ks.r,ks.g,ks.b,m,a)}return{getClearColor:function(){return o},setClearColor:function(v,m=1){o.set(v),h=m,f(o,h)},getClearAlpha:function(){return h},setClearAlpha:function(v){h=v,f(o,h)},render:function(v,m){let y=!1,g=m.isScene===!0?m.background:null;g&&g.isTexture&&(g=(m.backgroundBlurriness>0?t:e).get(g)),g===null?f(o,h):g&&g.isColor&&(f(g,1),y=!0);let _=r.xr.getEnvironmentBlendMode();_==="additive"?n.buffers.color.setClear(0,0,0,1,a):_==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(r.autoClear||y)&&r.clear(r.autoClearColor,r.autoClearDepth,r.autoClearStencil),g&&(g.isCubeTexture||g.mapping===Ha)?(c===void 0&&(c=new ge(new We(1,1,1),new Dn({name:"BackgroundCubeMaterial",uniforms:sr(on.backgroundCube.uniforms),vertexShader:on.backgroundCube.vertexShader,fragmentShader:on.backgroundCube.fragmentShader,side:It,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(b,T,M){this.matrixWorld.copyPosition(M.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=g,c.material.uniforms.flipEnvMap.value=g.isCubeTexture&&g.isRenderTargetTexture===!1?-1:1,c.material.uniforms.backgroundBlurriness.value=m.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=m.backgroundIntensity,c.material.toneMapped=qe.getTransfer(g.colorSpace)!==Ke,u===g&&d===g.version&&p===r.toneMapping||(c.material.needsUpdate=!0,u=g,d=g.version,p=r.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null)):g&&g.isTexture&&(l===void 0&&(l=new ge(new Nn(2,2),new Dn({name:"BackgroundMaterial",uniforms:sr(on.background.uniforms),vertexShader:on.background.vertexShader,fragmentShader:on.background.fragmentShader,side:Qn,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=g,l.material.uniforms.backgroundIntensity.value=m.backgroundIntensity,l.material.toneMapped=qe.getTransfer(g.colorSpace)!==Ke,g.matrixAutoUpdate===!0&&g.updateMatrix(),l.material.uniforms.uvTransform.value.copy(g.matrix),u===g&&d===g.version&&p===r.toneMapping||(l.material.needsUpdate=!0,u=g,d=g.version,p=r.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null))}}}function Mp(r,e,t,n){let i=r.getParameter(r.MAX_VERTEX_ATTRIBS),s=n.isWebGL2?null:e.get("OES_vertex_array_object"),a=n.isWebGL2||s!==null,o={},l=p(null),c=l,h=!1;function u(T){return n.isWebGL2?r.bindVertexArray(T):s.bindVertexArrayOES(T)}function d(T){return n.isWebGL2?r.deleteVertexArray(T):s.deleteVertexArrayOES(T)}function p(T){let M=[],E=[],N=[];for(let I=0;I<i;I++)M[I]=0,E[I]=0,N[I]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:M,enabledAttributes:E,attributeDivisors:N,object:T,attributes:{},index:null}}function f(){let T=c.newAttributes;for(let M=0,E=T.length;M<E;M++)T[M]=0}function v(T){m(T,0)}function m(T,M){let E=c.newAttributes,N=c.enabledAttributes,I=c.attributeDivisors;E[T]=1,N[T]===0&&(r.enableVertexAttribArray(T),N[T]=1),I[T]!==M&&((n.isWebGL2?r:e.get("ANGLE_instanced_arrays"))[n.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](T,M),I[T]=M)}function y(){let T=c.newAttributes,M=c.enabledAttributes;for(let E=0,N=M.length;E<N;E++)M[E]!==T[E]&&(r.disableVertexAttribArray(E),M[E]=0)}function g(T,M,E,N,I,B,D){D===!0?r.vertexAttribIPointer(T,M,E,I,B):r.vertexAttribPointer(T,M,E,N,I,B)}function _(){b(),h=!0,c!==l&&(c=l,u(c.object))}function b(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:function(T,M,E,N,I){let B=!1;if(a){let D=function(P,O,k){let ee=k.wireframe===!0,oe=o[P.id];oe===void 0&&(oe={},o[P.id]=oe);let K=oe[O.id];K===void 0&&(K={},oe[O.id]=K);let X=K[ee];return X===void 0&&(X=p(n.isWebGL2?r.createVertexArray():s.createVertexArrayOES()),K[ee]=X),X}(N,E,M);c!==D&&(c=D,u(c.object)),B=function(P,O,k,ee){let oe=c.attributes,K=O.attributes,X=0,J=k.getAttributes();for(let H in J)if(J[H].location>=0){let Y=oe[H],he=K[H];if(he===void 0&&(H==="instanceMatrix"&&P.instanceMatrix&&(he=P.instanceMatrix),H==="instanceColor"&&P.instanceColor&&(he=P.instanceColor)),Y===void 0||Y.attribute!==he||he&&Y.data!==he.data)return!0;X++}return c.attributesNum!==X||c.index!==ee}(T,N,E,I),B&&function(P,O,k,ee){let oe={},K=O.attributes,X=0,J=k.getAttributes();for(let H in J)if(J[H].location>=0){let Y=K[H];Y===void 0&&(H==="instanceMatrix"&&P.instanceMatrix&&(Y=P.instanceMatrix),H==="instanceColor"&&P.instanceColor&&(Y=P.instanceColor));let he={};he.attribute=Y,Y&&Y.data&&(he.data=Y.data),oe[H]=he,X++}c.attributes=oe,c.attributesNum=X,c.index=ee}(T,N,E,I)}else{let D=M.wireframe===!0;c.geometry===N.id&&c.program===E.id&&c.wireframe===D||(c.geometry=N.id,c.program=E.id,c.wireframe=D,B=!0)}I!==null&&t.update(I,r.ELEMENT_ARRAY_BUFFER),(B||h)&&(h=!1,function(D,P,O,k){if(n.isWebGL2===!1&&(D.isInstancedMesh||k.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;f();let ee=k.attributes,oe=O.getAttributes(),K=P.defaultAttributeValues;for(let X in oe){let J=oe[X];if(J.location>=0){let H=ee[X];if(H===void 0&&(X==="instanceMatrix"&&D.instanceMatrix&&(H=D.instanceMatrix),X==="instanceColor"&&D.instanceColor&&(H=D.instanceColor)),H!==void 0){let Y=H.normalized,he=H.itemSize,A=t.get(H);if(A===void 0)continue;let R=A.buffer,z=A.type,q=A.bytesPerElement,L=n.isWebGL2===!0&&(z===r.INT||z===r.UNSIGNED_INT||H.gpuType===Iu);if(H.isInterleavedBufferAttribute){let j=H.data,U=j.stride,F=H.offset;if(j.isInstancedInterleavedBuffer){for(let G=0;G<J.locationSize;G++)m(J.location+G,j.meshPerAttribute);D.isInstancedMesh!==!0&&k._maxInstanceCount===void 0&&(k._maxInstanceCount=j.meshPerAttribute*j.count)}else for(let G=0;G<J.locationSize;G++)v(J.location+G);r.bindBuffer(r.ARRAY_BUFFER,R);for(let G=0;G<J.locationSize;G++)g(J.location+G,he/J.locationSize,z,Y,U*q,(F+he/J.locationSize*G)*q,L)}else{if(H.isInstancedBufferAttribute){for(let j=0;j<J.locationSize;j++)m(J.location+j,H.meshPerAttribute);D.isInstancedMesh!==!0&&k._maxInstanceCount===void 0&&(k._maxInstanceCount=H.meshPerAttribute*H.count)}else for(let j=0;j<J.locationSize;j++)v(J.location+j);r.bindBuffer(r.ARRAY_BUFFER,R);for(let j=0;j<J.locationSize;j++)g(J.location+j,he/J.locationSize,z,Y,he*q,he/J.locationSize*j*q,L)}}else if(K!==void 0){let Y=K[X];if(Y!==void 0)switch(Y.length){case 2:r.vertexAttrib2fv(J.location,Y);break;case 3:r.vertexAttrib3fv(J.location,Y);break;case 4:r.vertexAttrib4fv(J.location,Y);break;default:r.vertexAttrib1fv(J.location,Y)}}}}y()}(T,M,E,N),I!==null&&r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,t.get(I).buffer))},reset:_,resetDefaultState:b,dispose:function(){_();for(let T in o){let M=o[T];for(let E in M){let N=M[E];for(let I in N)d(N[I].object),delete N[I];delete M[E]}delete o[T]}},releaseStatesOfGeometry:function(T){if(o[T.id]===void 0)return;let M=o[T.id];for(let E in M){let N=M[E];for(let I in N)d(N[I].object),delete N[I];delete M[E]}delete o[T.id]},releaseStatesOfProgram:function(T){for(let M in o){let E=o[M];if(E[T.id]===void 0)continue;let N=E[T.id];for(let I in N)d(N[I].object),delete N[I];delete E[T.id]}},initAttributes:f,enableAttribute:v,disableUnusedAttributes:y}}function Sp(r,e,t,n){let i=n.isWebGL2,s;this.setMode=function(a){s=a},this.render=function(a,o){r.drawArrays(s,a,o),t.update(o,s,1)},this.renderInstances=function(a,o,l){if(l===0)return;let c,h;if(i)c=r,h="drawArraysInstanced";else if(c=e.get("ANGLE_instanced_arrays"),h="drawArraysInstancedANGLE",c===null)return void console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");c[h](s,a,o,l),t.update(o,s,l)},this.renderMultiDraw=function(a,o,l){if(l===0)return;let c=e.get("WEBGL_multi_draw");if(c===null)for(let h=0;h<l;h++)this.render(a[h],o[h]);else{c.multiDrawArraysWEBGL(s,a,0,o,0,l);let h=0;for(let u=0;u<l;u++)h+=o[u];t.update(h,s,1)}}}function wp(r,e,t){let n;function i(b){if(b==="highp"){if(r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.HIGH_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.HIGH_FLOAT).precision>0)return"highp";b="mediump"}return b==="mediump"&&r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.MEDIUM_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let s=typeof WebGL2RenderingContext<"u"&&r.constructor.name==="WebGL2RenderingContext",a=t.precision!==void 0?t.precision:"highp",o=i(a);o!==a&&(console.warn("THREE.WebGLRenderer:",a,"not supported, using",o,"instead."),a=o);let l=s||e.has("WEBGL_draw_buffers"),c=t.logarithmicDepthBuffer===!0,h=r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS),u=r.getParameter(r.MAX_VERTEX_TEXTURE_IMAGE_UNITS),d=r.getParameter(r.MAX_TEXTURE_SIZE),p=r.getParameter(r.MAX_CUBE_MAP_TEXTURE_SIZE),f=r.getParameter(r.MAX_VERTEX_ATTRIBS),v=r.getParameter(r.MAX_VERTEX_UNIFORM_VECTORS),m=r.getParameter(r.MAX_VARYING_VECTORS),y=r.getParameter(r.MAX_FRAGMENT_UNIFORM_VECTORS),g=u>0,_=s||e.has("OES_texture_float");return{isWebGL2:s,drawBuffers:l,getMaxAnisotropy:function(){if(n!==void 0)return n;if(e.has("EXT_texture_filter_anisotropic")===!0){let b=e.get("EXT_texture_filter_anisotropic");n=r.getParameter(b.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n},getMaxPrecision:i,precision:a,logarithmicDepthBuffer:c,maxTextures:h,maxVertexTextures:u,maxTextureSize:d,maxCubemapSize:p,maxAttributes:f,maxVertexUniforms:v,maxVaryings:m,maxFragmentUniforms:y,vertexTextures:g,floatFragmentTextures:_,floatVertexTextures:g&&_,maxSamples:s?r.getParameter(r.MAX_SAMPLES):0}}function Ep(r){let e=this,t=null,n=0,i=!1,s=!1,a=new tn,o=new Fe,l={value:null,needsUpdate:!1};function c(h,u,d,p){let f=h!==null?h.length:0,v=null;if(f!==0){if(v=l.value,p!==!0||v===null){let m=d+4*f,y=u.matrixWorldInverse;o.getNormalMatrix(y),(v===null||v.length<m)&&(v=new Float32Array(m));for(let g=0,_=d;g!==f;++g,_+=4)a.copy(h[g]).applyMatrix4(y,o),a.normal.toArray(v,_),v[_+3]=a.constant}l.value=v,l.needsUpdate=!0}return e.numPlanes=f,e.numIntersection=0,v}this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,u){let d=h.length!==0||u||n!==0||i;return i=u,n=h.length,d},this.beginShadows=function(){s=!0,c(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(h,u){t=c(h,u,0)},this.setState=function(h,u,d){let p=h.clippingPlanes,f=h.clipIntersection,v=h.clipShadows,m=r.get(h);if(!i||p===null||p.length===0||s&&!v)s?c(null):function(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}();else{let y=s?0:n,g=4*y,_=m.clippingState||null;l.value=_,_=c(p,u,g,d);for(let b=0;b!==g;++b)_[b]=t[b];m.clippingState=_,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=y}}}function Tp(r){let e=new WeakMap;function t(i,s){return s===al?i.mapping=er:s===ol&&(i.mapping=tr),i}function n(i){let s=i.target;s.removeEventListener("dispose",n);let a=e.get(s);a!==void 0&&(e.delete(s),a.dispose())}return{get:function(i){if(i&&i.isTexture){let s=i.mapping;if(s===al||s===ol){if(e.has(i))return t(e.get(i).texture,i.mapping);{let a=i.image;if(a&&a.height>0){let o=new gl(a.height/2);return o.fromEquirectangularTexture(r,i),e.set(i,o),i.addEventListener("dispose",n),t(o.texture,i.mapping)}return null}}}return i},dispose:function(){e=new WeakMap}}}function Gh(r,e,t){let n=new Pn(r,e,t);return n.texture.mapping=Ha,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function zs(r,e,t,n,i){r.viewport.set(e,t,n,i),r.scissor.set(e,t,n,i)}function Vh(){return new Dn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:mc(),fragmentShader:`

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
		`,blending:0,depthTest:!1,depthWrite:!1})}function Wh(){return new Dn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:mc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function mc(){return`

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
	`}function Ap(r){let e=new WeakMap,t=null;function n(i){let s=i.target;s.removeEventListener("dispose",n);let a=e.get(s);a!==void 0&&(e.delete(s),a.dispose())}return{get:function(i){if(i&&i.isTexture){let s=i.mapping,a=s===al||s===ol,o=s===er||s===tr;if(a||o){if(i.isRenderTargetTexture&&i.needsPMREMUpdate===!0){i.needsPMREMUpdate=!1;let l=e.get(i);return t===null&&(t=new _a(r)),l=a?t.fromEquirectangular(i,l):t.fromCubemap(i,l),e.set(i,l),l.texture}if(e.has(i))return e.get(i).texture;{let l=i.image;if(a&&l&&l.height>0||o&&l&&function(c){let h=0,u=6;for(let d=0;d<u;d++)c[d]!==void 0&&h++;return h===u}(l)){t===null&&(t=new _a(r));let c=a?t.fromEquirectangular(i):t.fromCubemap(i);return e.set(i,c),i.addEventListener("dispose",n),c.texture}return null}}}return i},dispose:function(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}}}function Rp(r){let e={};function t(n){if(e[n]!==void 0)return e[n];let i;switch(n){case"WEBGL_depth_texture":i=r.getExtension("WEBGL_depth_texture")||r.getExtension("MOZ_WEBGL_depth_texture")||r.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=r.getExtension("EXT_texture_filter_anisotropic")||r.getExtension("MOZ_EXT_texture_filter_anisotropic")||r.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=r.getExtension("WEBGL_compressed_texture_s3tc")||r.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=r.getExtension("WEBGL_compressed_texture_pvrtc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=r.getExtension(n)}return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(n){n.isWebGL2?(t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance")):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(n){let i=t(n);return i===null&&console.warn("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function Cp(r,e,t,n){let i={},s=new WeakMap;function a(l){let c=l.target;c.index!==null&&e.remove(c.index);for(let u in c.attributes)e.remove(c.attributes[u]);for(let u in c.morphAttributes){let d=c.morphAttributes[u];for(let p=0,f=d.length;p<f;p++)e.remove(d[p])}c.removeEventListener("dispose",a),delete i[c.id];let h=s.get(c);h&&(e.remove(h),s.delete(c)),n.releaseStatesOfGeometry(c),c.isInstancedBufferGeometry===!0&&delete c._maxInstanceCount,t.memory.geometries--}function o(l){let c=[],h=l.index,u=l.attributes.position,d=0;if(h!==null){let v=h.array;d=h.version;for(let m=0,y=v.length;m<y;m+=3){let g=v[m+0],_=v[m+1],b=v[m+2];c.push(g,_,_,b,b,g)}}else{if(u===void 0)return;{let v=u.array;d=u.version;for(let m=0,y=v.length/3-1;m<y;m+=3){let g=m+0,_=m+1,b=m+2;c.push(g,_,_,b,b,g)}}}let p=new(Hu(c)?ma:pa)(c,1);p.version=d;let f=s.get(l);f&&e.remove(f),s.set(l,p)}return{get:function(l,c){return i[c.id]===!0||(c.addEventListener("dispose",a),i[c.id]=!0,t.memory.geometries++),c},update:function(l){let c=l.attributes;for(let u in c)e.update(c[u],r.ARRAY_BUFFER);let h=l.morphAttributes;for(let u in h){let d=h[u];for(let p=0,f=d.length;p<f;p++)e.update(d[p],r.ARRAY_BUFFER)}},getWireframeAttribute:function(l){let c=s.get(l);if(c){let h=l.index;h!==null&&c.version<h.version&&o(l)}else o(l);return s.get(l)}}}function Pp(r,e,t,n){let i=n.isWebGL2,s,a,o;this.setMode=function(l){s=l},this.setIndex=function(l){a=l.type,o=l.bytesPerElement},this.render=function(l,c){r.drawElements(s,c,a,l*o),t.update(c,s,1)},this.renderInstances=function(l,c,h){if(h===0)return;let u,d;if(i)u=r,d="drawElementsInstanced";else if(u=e.get("ANGLE_instanced_arrays"),d="drawElementsInstancedANGLE",u===null)return void console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");u[d](s,c,a,l*o,h),t.update(c,s,h)},this.renderMultiDraw=function(l,c,h){if(h===0)return;let u=e.get("WEBGL_multi_draw");if(u===null)for(let d=0;d<h;d++)this.render(l[d]/o,c[d]);else{u.multiDrawElementsWEBGL(s,c,0,a,l,0,h);let d=0;for(let p=0;p<h;p++)d+=c[p];t.update(d,s,1)}}}function Lp(r){let e={frame:0,calls:0,triangles:0,points:0,lines:0};return{memory:{geometries:0,textures:0},render:e,programs:null,autoReset:!0,reset:function(){e.calls=0,e.triangles=0,e.points=0,e.lines=0},update:function(t,n,i){switch(e.calls++,n){case r.TRIANGLES:e.triangles+=i*(t/3);break;case r.LINES:e.lines+=i*(t/2);break;case r.LINE_STRIP:e.lines+=i*(t-1);break;case r.LINE_LOOP:e.lines+=i*t;break;case r.POINTS:e.points+=i*t;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",n)}}}}function Ip(r,e){return r[0]-e[0]}function Dp(r,e){return Math.abs(e[1])-Math.abs(r[1])}function Np(r,e,t){let n={},i=new Float32Array(8),s=new WeakMap,a=new Ze,o=[];for(let l=0;l<8;l++)o[l]=[l,0];return{update:function(l,c,h){let u=l.morphTargetInfluences;if(e.isWebGL2===!0){let d=c.morphAttributes.position||c.morphAttributes.normal||c.morphAttributes.color,p=d!==void 0?d.length:0,f=s.get(c);if(f===void 0||f.count!==p){let O=function(){D.dispose(),s.delete(c),c.removeEventListener("dispose",O)};f!==void 0&&f.texture.dispose();let y=c.morphAttributes.position!==void 0,g=c.morphAttributes.normal!==void 0,_=c.morphAttributes.color!==void 0,b=c.morphAttributes.position||[],T=c.morphAttributes.normal||[],M=c.morphAttributes.color||[],E=0;y===!0&&(E=1),g===!0&&(E=2),_===!0&&(E=3);let N=c.attributes.position.count*E,I=1;N>e.maxTextureSize&&(I=Math.ceil(N/e.maxTextureSize),N=e.maxTextureSize);let B=new Float32Array(N*I*4*p),D=new ua(B,N,I,p);D.type=Yn,D.needsUpdate=!0;let P=4*E;for(let k=0;k<p;k++){let ee=b[k],oe=T[k],K=M[k],X=N*I*4*k;for(let J=0;J<ee.count;J++){let H=J*P;y===!0&&(a.fromBufferAttribute(ee,J),B[X+H+0]=a.x,B[X+H+1]=a.y,B[X+H+2]=a.z,B[X+H+3]=0),g===!0&&(a.fromBufferAttribute(oe,J),B[X+H+4]=a.x,B[X+H+5]=a.y,B[X+H+6]=a.z,B[X+H+7]=0),_===!0&&(a.fromBufferAttribute(K,J),B[X+H+8]=a.x,B[X+H+9]=a.y,B[X+H+10]=a.z,B[X+H+11]=K.itemSize===4?a.w:1)}}f={count:p,texture:D,size:new ie(N,I)},s.set(c,f),c.addEventListener("dispose",O)}let v=0;for(let y=0;y<u.length;y++)v+=u[y];let m=c.morphTargetsRelative?1:1-v;h.getUniforms().setValue(r,"morphTargetBaseInfluence",m),h.getUniforms().setValue(r,"morphTargetInfluences",u),h.getUniforms().setValue(r,"morphTargetsTexture",f.texture,t),h.getUniforms().setValue(r,"morphTargetsTextureSize",f.size)}else{let d=u===void 0?0:u.length,p=n[c.id];if(p===void 0||p.length!==d){p=[];for(let g=0;g<d;g++)p[g]=[g,0];n[c.id]=p}for(let g=0;g<d;g++){let _=p[g];_[0]=g,_[1]=u[g]}p.sort(Dp);for(let g=0;g<8;g++)g<d&&p[g][1]?(o[g][0]=p[g][0],o[g][1]=p[g][1]):(o[g][0]=Number.MAX_SAFE_INTEGER,o[g][1]=0);o.sort(Ip);let f=c.morphAttributes.position,v=c.morphAttributes.normal,m=0;for(let g=0;g<8;g++){let _=o[g],b=_[0],T=_[1];b!==Number.MAX_SAFE_INTEGER&&T?(f&&c.getAttribute("morphTarget"+g)!==f[b]&&c.setAttribute("morphTarget"+g,f[b]),v&&c.getAttribute("morphNormal"+g)!==v[b]&&c.setAttribute("morphNormal"+g,v[b]),i[g]=T,m+=T):(f&&c.hasAttribute("morphTarget"+g)===!0&&c.deleteAttribute("morphTarget"+g),v&&c.hasAttribute("morphNormal"+g)===!0&&c.deleteAttribute("morphNormal"+g),i[g]=0)}let y=c.morphTargetsRelative?1:1-m;h.getUniforms().setValue(r,"morphTargetBaseInfluence",y),h.getUniforms().setValue(r,"morphTargetInfluences",i)}}}}function Up(r,e,t,n){let i=new WeakMap;function s(a){let o=a.target;o.removeEventListener("dispose",s),t.remove(o.instanceMatrix),o.instanceColor!==null&&t.remove(o.instanceColor)}return{update:function(a){let o=n.render.frame,l=a.geometry,c=e.get(a,l);if(i.get(c)!==o&&(e.update(c),i.set(c,o)),a.isInstancedMesh&&(a.hasEventListener("dispose",s)===!1&&a.addEventListener("dispose",s),i.get(a)!==o&&(t.update(a.instanceMatrix,r.ARRAY_BUFFER),a.instanceColor!==null&&t.update(a.instanceColor,r.ARRAY_BUFFER),i.set(a,o))),a.isSkinnedMesh){let h=a.skeleton;i.get(h)!==o&&(h.update(),i.set(h,o))}return c},dispose:function(){i=new WeakMap}}}function cr(r,e,t){let n=r[0];if(n<=0||n>0)return r;let i=e*t,s=$h[i];if(s===void 0&&(s=new Float32Array(i),$h[i]=s),e!==0){n.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,r[a].toArray(s,o)}return s}function dt(r,e){if(r.length!==e.length)return!1;for(let t=0,n=r.length;t<n;t++)if(r[t]!==e[t])return!1;return!0}function pt(r,e){for(let t=0,n=e.length;t<n;t++)r[t]=e[t]}function Va(r,e){let t=jh[e];t===void 0&&(t=new Int32Array(e),jh[e]=t);for(let n=0;n!==e;++n)t[n]=r.allocateTextureUnit();return t}function Op(r,e){let t=this.cache;t[0]!==e&&(r.uniform1f(this.addr,e),t[0]=e)}function Fp(r,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(r.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(dt(t,e))return;r.uniform2fv(this.addr,e),pt(t,e)}}function Bp(r,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(r.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)t[0]===e.r&&t[1]===e.g&&t[2]===e.b||(r.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(dt(t,e))return;r.uniform3fv(this.addr,e),pt(t,e)}}function kp(r,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(r.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(dt(t,e))return;r.uniform4fv(this.addr,e),pt(t,e)}}function zp(r,e){let t=this.cache,n=e.elements;if(n===void 0){if(dt(t,e))return;r.uniformMatrix2fv(this.addr,!1,e),pt(t,e)}else{if(dt(t,n))return;Yh.set(n),r.uniformMatrix2fv(this.addr,!1,Yh),pt(t,n)}}function Hp(r,e){let t=this.cache,n=e.elements;if(n===void 0){if(dt(t,e))return;r.uniformMatrix3fv(this.addr,!1,e),pt(t,e)}else{if(dt(t,n))return;qh.set(n),r.uniformMatrix3fv(this.addr,!1,qh),pt(t,n)}}function Gp(r,e){let t=this.cache,n=e.elements;if(n===void 0){if(dt(t,e))return;r.uniformMatrix4fv(this.addr,!1,e),pt(t,e)}else{if(dt(t,n))return;Xh.set(n),r.uniformMatrix4fv(this.addr,!1,Xh),pt(t,n)}}function Vp(r,e){let t=this.cache;t[0]!==e&&(r.uniform1i(this.addr,e),t[0]=e)}function Wp(r,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(r.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(dt(t,e))return;r.uniform2iv(this.addr,e),pt(t,e)}}function $p(r,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(r.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(dt(t,e))return;r.uniform3iv(this.addr,e),pt(t,e)}}function jp(r,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(r.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(dt(t,e))return;r.uniform4iv(this.addr,e),pt(t,e)}}function Xp(r,e){let t=this.cache;t[0]!==e&&(r.uniform1ui(this.addr,e),t[0]=e)}function qp(r,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(r.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(dt(t,e))return;r.uniform2uiv(this.addr,e),pt(t,e)}}function Yp(r,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(r.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(dt(t,e))return;r.uniform3uiv(this.addr,e),pt(t,e)}}function Zp(r,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(r.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(dt(t,e))return;r.uniform4uiv(this.addr,e),pt(t,e)}}function Jp(r,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i);let s=this.type===r.SAMPLER_2D_SHADOW?ju:$u;t.setTexture2D(e||s,i)}function Kp(r,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||qu,i)}function Qp(r,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||Yu,i)}function em(r,e,t){let n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||Xu,i)}function tm(r,e){r.uniform1fv(this.addr,e)}function nm(r,e){let t=cr(e,this.size,2);r.uniform2fv(this.addr,t)}function im(r,e){let t=cr(e,this.size,3);r.uniform3fv(this.addr,t)}function rm(r,e){let t=cr(e,this.size,4);r.uniform4fv(this.addr,t)}function sm(r,e){let t=cr(e,this.size,4);r.uniformMatrix2fv(this.addr,!1,t)}function am(r,e){let t=cr(e,this.size,9);r.uniformMatrix3fv(this.addr,!1,t)}function om(r,e){let t=cr(e,this.size,16);r.uniformMatrix4fv(this.addr,!1,t)}function lm(r,e){r.uniform1iv(this.addr,e)}function cm(r,e){r.uniform2iv(this.addr,e)}function hm(r,e){r.uniform3iv(this.addr,e)}function um(r,e){r.uniform4iv(this.addr,e)}function dm(r,e){r.uniform1uiv(this.addr,e)}function pm(r,e){r.uniform2uiv(this.addr,e)}function mm(r,e){r.uniform3uiv(this.addr,e)}function fm(r,e){r.uniform4uiv(this.addr,e)}function gm(r,e,t){let n=this.cache,i=e.length,s=Va(t,i);dt(n,s)||(r.uniform1iv(this.addr,s),pt(n,s));for(let a=0;a!==i;++a)t.setTexture2D(e[a]||$u,s[a])}function _m(r,e,t){let n=this.cache,i=e.length,s=Va(t,i);dt(n,s)||(r.uniform1iv(this.addr,s),pt(n,s));for(let a=0;a!==i;++a)t.setTexture3D(e[a]||qu,s[a])}function vm(r,e,t){let n=this.cache,i=e.length,s=Va(t,i);dt(n,s)||(r.uniform1iv(this.addr,s),pt(n,s));for(let a=0;a!==i;++a)t.setTextureCube(e[a]||Yu,s[a])}function ym(r,e,t){let n=this.cache,i=e.length,s=Va(t,i);dt(n,s)||(r.uniform1iv(this.addr,s),pt(n,s));for(let a=0;a!==i;++a)t.setTexture2DArray(e[a]||Xu,s[a])}function Zh(r,e){r.seq.push(e),r.map[e.id]=e}function xm(r,e,t){let n=r.name,i=n.length;for(jo.lastIndex=0;;){let s=jo.exec(n),a=jo.lastIndex,o=s[1],l=s[2]==="]",c=s[3];if(l&&(o|=0),c===void 0||c==="["&&a+2===i){Zh(t,c===void 0?new _l(o,r,e):new vl(o,r,e));break}{let h=t.map[o];h===void 0&&(h=new yl(o),Zh(t,h)),t=h}}}function Jh(r,e,t){let n=r.createShader(e);return r.shaderSource(n,t),r.compileShader(n),n}function Kh(r,e,t){let n=r.getShaderParameter(e,r.COMPILE_STATUS),i=r.getShaderInfoLog(e).trim();if(n&&i==="")return"";let s=/ERROR: 0:(\d+)/.exec(i);if(s){let a=parseInt(s[1]);return t.toUpperCase()+`

`+i+`

`+function(o,l){let c=o.split(`
`),h=[],u=Math.max(l-6,0),d=Math.min(l+6,c.length);for(let p=u;p<d;p++){let f=p+1;h.push(`${f===l?">":" "} ${f}: ${c[p]}`)}return h.join(`
`)}(r.getShaderSource(e),a)}return i}function Sm(r,e){let t=function(n){let i=qe.getPrimaries(qe.workingColorSpace),s=qe.getPrimaries(n),a;switch(i===s?a="":i===aa&&s===sa?a="LinearDisplayP3ToLinearSRGB":i===sa&&s===aa&&(a="LinearSRGBToLinearDisplayP3"),n){case Cn:case Ga:return[a,"LinearTransferOETF"];case at:case pc:return[a,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",n),[a,"LinearTransferOETF"]}}(e);return`vec4 ${r}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function wm(r,e){let t;switch(e){case Zd:t="Linear";break;case Jd:t="Reinhard";break;case Kd:t="OptimizedCineon";break;case uc:t="ACESFilmic";break;case ep:t="AgX";break;case Qd:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+r+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function $i(r){return r!==""}function Qh(r,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return r.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function eu(r,e){return r.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}function xl(r){return r.replace(Em,Am)}function Am(r,e){let t=Le[e];if(t===void 0){let n=Tm.get(e);if(n===void 0)throw new Error("Can not resolve #include <"+e+">");t=Le[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n)}return xl(t)}function tu(r){return r.replace(Rm,Cm)}function Cm(r,e,t,n){let i="";for(let s=parseInt(e);s<parseInt(t);s++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return i}function nu(r){let e="precision "+r.precision+` float;
precision `+r.precision+" int;";return r.precision==="highp"?e+=`
#define HIGH_PRECISION`:r.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:r.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Pm(r,e,t,n){let i=r.getContext(),s=t.defines,a=t.vertexShader,o=t.fragmentShader,l=function(P){let O="SHADOWMAP_TYPE_BASIC";return P.shadowMapType===Ru?O="SHADOWMAP_TYPE_PCF":P.shadowMapType===cc?O="SHADOWMAP_TYPE_PCF_SOFT":P.shadowMapType===An&&(O="SHADOWMAP_TYPE_VSM"),O}(t),c=function(P){let O="ENVMAP_TYPE_CUBE";if(P.envMap)switch(P.envMapMode){case er:case tr:O="ENVMAP_TYPE_CUBE";break;case Ha:O="ENVMAP_TYPE_CUBE_UV"}return O}(t),h=function(P){let O="ENVMAP_MODE_REFLECTION";return P.envMap&&P.envMapMode===tr&&(O="ENVMAP_MODE_REFRACTION"),O}(t),u=function(P){let O="ENVMAP_BLENDING_NONE";if(P.envMap)switch(P.combine){case hc:O="ENVMAP_BLENDING_MULTIPLY";break;case qd:O="ENVMAP_BLENDING_MIX";break;case Yd:O="ENVMAP_BLENDING_ADD"}return O}(t),d=function(P){let O=P.envMapCubeUVHeight;if(O===null)return null;let k=Math.log2(O)-2,ee=1/O;return{texelWidth:1/(3*Math.max(Math.pow(2,k),112)),texelHeight:ee,maxMip:k}}(t),p=t.isWebGL2?"":function(P){return[P.extensionDerivatives||P.envMapCubeUVHeight||P.bumpMap||P.normalMapTangentSpace||P.clearcoatNormalMap||P.flatShading||P.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(P.extensionFragDepth||P.logarithmicDepthBuffer)&&P.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",P.extensionDrawBuffers&&P.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(P.extensionShaderTextureLOD||P.envMap||P.transmission)&&P.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter($i).join(`
`)}(t),f=function(P){return[P.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter($i).join(`
`)}(t),v=function(P){let O=[];for(let k in P){let ee=P[k];ee!==!1&&O.push("#define "+k+" "+ee)}return O.join(`
`)}(s),m=i.createProgram(),y,g,_=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(y=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v].filter($i).join(`
`),y.length>0&&(y+=`
`),g=[p,"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v].filter($i).join(`
`),g.length>0&&(g+=`
`)):(y=[nu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter($i).join(`
`),g=[p,nu(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,v,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Jn?"#define TONE_MAPPING":"",t.toneMapping!==Jn?Le.tonemapping_pars_fragment:"",t.toneMapping!==Jn?wm("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Le.colorspace_pars_fragment,Sm("linearToOutputTexel",t.outputColorSpace),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter($i).join(`
`)),a=xl(a),a=Qh(a,t),a=eu(a,t),o=xl(o),o=Qh(o,t),o=eu(o,t),a=tu(a),o=tu(o),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,y=[f,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+y,g=["precision mediump sampler2DArray;","#define varying in",t.glslVersion===bh?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===bh?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+g);let b=_+y+a,T=_+g+o,M=Jh(i,i.VERTEX_SHADER,b),E=Jh(i,i.FRAGMENT_SHADER,T);function N(P){if(r.debug.checkShaderErrors){let O=i.getProgramInfoLog(m).trim(),k=i.getShaderInfoLog(M).trim(),ee=i.getShaderInfoLog(E).trim(),oe=!0,K=!0;if(i.getProgramParameter(m,i.LINK_STATUS)===!1)if(oe=!1,typeof r.debug.onShaderError=="function")r.debug.onShaderError(i,m,M,E);else{let X=Kh(i,M,"vertex"),J=Kh(i,E,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(m,i.VALIDATE_STATUS)+`

Program Info Log: `+O+`
`+X+`
`+J)}else O!==""?console.warn("THREE.WebGLProgram: Program Info Log:",O):k!==""&&ee!==""||(K=!1);K&&(P.diagnostics={runnable:oe,programLog:O,vertexShader:{log:k,prefix:y},fragmentShader:{log:ee,prefix:g}})}i.deleteShader(M),i.deleteShader(E),I=new Qi(i,m),B=function(O,k){let ee={},oe=O.getProgramParameter(k,O.ACTIVE_ATTRIBUTES);for(let K=0;K<oe;K++){let X=O.getActiveAttrib(k,K),J=X.name,H=1;X.type===O.FLOAT_MAT2&&(H=2),X.type===O.FLOAT_MAT3&&(H=3),X.type===O.FLOAT_MAT4&&(H=4),ee[J]={type:X.type,location:O.getAttribLocation(k,J),locationSize:H}}return ee}(i,m)}let I,B;i.attachShader(m,M),i.attachShader(m,E),t.index0AttributeName!==void 0?i.bindAttribLocation(m,0,t.index0AttributeName):t.morphTargets===!0&&i.bindAttribLocation(m,0,"position"),i.linkProgram(m),this.getUniforms=function(){return I===void 0&&N(this),I},this.getAttributes=function(){return B===void 0&&N(this),B};let D=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return D===!1&&(D=i.getProgramParameter(m,bm)),D},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(m),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Mm++,this.cacheKey=e,this.usedTimes=1,this.program=m,this.vertexShader=M,this.fragmentShader=E,this}function Im(r,e,t,n,i,s,a){let o=new Br,l=new bl,c=[],h=i.isWebGL2,u=i.logarithmicDepthBuffer,d=i.vertexTextures,p=i.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(m){return m===0?"uv":`uv${m}`}return{getParameters:function(m,y,g,_,b){let T=_.fog,M=b.geometry,E=m.isMeshStandardMaterial?_.environment:null,N=(m.isMeshStandardMaterial?t:e).get(m.envMap||E),I=N&&N.mapping===Ha?N.image.height:null,B=f[m.type];m.precision!==null&&(p=i.getMaxPrecision(m.precision),p!==m.precision&&console.warn("THREE.WebGLProgram.getParameters:",m.precision,"not supported, using",p,"instead."));let D=M.morphAttributes.position||M.morphAttributes.normal||M.morphAttributes.color,P=D!==void 0?D.length:0,O,k,ee,oe,K=0;if(M.morphAttributes.position!==void 0&&(K=1),M.morphAttributes.normal!==void 0&&(K=2),M.morphAttributes.color!==void 0&&(K=3),B){let Ae=on[B];O=Ae.vertexShader,k=Ae.fragmentShader}else O=m.vertexShader,k=m.fragmentShader,l.update(m),ee=l.getVertexShaderID(m),oe=l.getFragmentShaderID(m);let X=r.getRenderTarget(),J=b.isInstancedMesh===!0,H=b.isBatchedMesh===!0,Y=!!m.map,he=!!m.matcap,A=!!N,R=!!m.aoMap,z=!!m.lightMap,q=!!m.bumpMap,L=!!m.normalMap,j=!!m.displacementMap,U=!!m.emissiveMap,F=!!m.metalnessMap,G=!!m.roughnessMap,te=m.anisotropy>0,Q=m.clearcoat>0,S=m.iridescence>0,re=m.sheen>0,V=m.transmission>0,W=te&&!!m.anisotropyMap,se=Q&&!!m.clearcoatMap,ce=Q&&!!m.clearcoatNormalMap,de=Q&&!!m.clearcoatRoughnessMap,pe=S&&!!m.iridescenceMap,Se=S&&!!m.iridescenceThicknessMap,me=re&&!!m.sheenColorMap,_e=re&&!!m.sheenRoughnessMap,Ce=!!m.specularMap,lt=!!m.specularColorMap,ye=!!m.specularIntensityMap,Ne=V&&!!m.transmissionMap,Ue=V&&!!m.thicknessMap,Si=!!m.gradientMap,gn=!!m.alphaMap,wi=m.alphaTest>0,Ct=!!m.alphaHash,_t=!!m.extensions,Dt=!!M.attributes.uv1,x=!!M.attributes.uv2,fe=!!M.attributes.uv3,Ie=Jn;return m.toneMapped&&(X!==null&&X.isXRRenderTarget!==!0||(Ie=r.toneMapping)),{isWebGL2:h,shaderID:B,shaderType:m.type,shaderName:m.name,vertexShader:O,fragmentShader:k,defines:m.defines,customVertexShaderID:ee,customFragmentShaderID:oe,isRawShaderMaterial:m.isRawShaderMaterial===!0,glslVersion:m.glslVersion,precision:p,batching:H,instancing:J,instancingColor:J&&b.instanceColor!==null,supportsVertexTextures:d,outputColorSpace:X===null?r.outputColorSpace:X.isXRRenderTarget===!0?X.texture.colorSpace:Cn,map:Y,matcap:he,envMap:A,envMapMode:A&&N.mapping,envMapCubeUVHeight:I,aoMap:R,lightMap:z,bumpMap:q,normalMap:L,displacementMap:d&&j,emissiveMap:U,normalMapObjectSpace:L&&m.normalMapType===1,normalMapTangentSpace:L&&m.normalMapType===0,metalnessMap:F,roughnessMap:G,anisotropy:te,anisotropyMap:W,clearcoat:Q,clearcoatMap:se,clearcoatNormalMap:ce,clearcoatRoughnessMap:de,iridescence:S,iridescenceMap:pe,iridescenceThicknessMap:Se,sheen:re,sheenColorMap:me,sheenRoughnessMap:_e,specularMap:Ce,specularColorMap:lt,specularIntensityMap:ye,transmission:V,transmissionMap:Ne,thicknessMap:Ue,gradientMap:Si,opaque:m.transparent===!1&&m.blending===1,alphaMap:gn,alphaTest:wi,alphaHash:Ct,combine:m.combine,mapUv:Y&&v(m.map.channel),aoMapUv:R&&v(m.aoMap.channel),lightMapUv:z&&v(m.lightMap.channel),bumpMapUv:q&&v(m.bumpMap.channel),normalMapUv:L&&v(m.normalMap.channel),displacementMapUv:j&&v(m.displacementMap.channel),emissiveMapUv:U&&v(m.emissiveMap.channel),metalnessMapUv:F&&v(m.metalnessMap.channel),roughnessMapUv:G&&v(m.roughnessMap.channel),anisotropyMapUv:W&&v(m.anisotropyMap.channel),clearcoatMapUv:se&&v(m.clearcoatMap.channel),clearcoatNormalMapUv:ce&&v(m.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:de&&v(m.clearcoatRoughnessMap.channel),iridescenceMapUv:pe&&v(m.iridescenceMap.channel),iridescenceThicknessMapUv:Se&&v(m.iridescenceThicknessMap.channel),sheenColorMapUv:me&&v(m.sheenColorMap.channel),sheenRoughnessMapUv:_e&&v(m.sheenRoughnessMap.channel),specularMapUv:Ce&&v(m.specularMap.channel),specularColorMapUv:lt&&v(m.specularColorMap.channel),specularIntensityMapUv:ye&&v(m.specularIntensityMap.channel),transmissionMapUv:Ne&&v(m.transmissionMap.channel),thicknessMapUv:Ue&&v(m.thicknessMap.channel),alphaMapUv:gn&&v(m.alphaMap.channel),vertexTangents:!!M.attributes.tangent&&(L||te),vertexColors:m.vertexColors,vertexAlphas:m.vertexColors===!0&&!!M.attributes.color&&M.attributes.color.itemSize===4,vertexUv1s:Dt,vertexUv2s:x,vertexUv3s:fe,pointsUvs:b.isPoints===!0&&!!M.attributes.uv&&(Y||gn),fog:!!T,useFog:m.fog===!0,fogExp2:T&&T.isFogExp2,flatShading:m.flatShading===!0,sizeAttenuation:m.sizeAttenuation===!0,logarithmicDepthBuffer:u,skinning:b.isSkinnedMesh===!0,morphTargets:M.morphAttributes.position!==void 0,morphNormals:M.morphAttributes.normal!==void 0,morphColors:M.morphAttributes.color!==void 0,morphTargetsCount:P,morphTextureStride:K,numDirLights:y.directional.length,numPointLights:y.point.length,numSpotLights:y.spot.length,numSpotLightMaps:y.spotLightMap.length,numRectAreaLights:y.rectArea.length,numHemiLights:y.hemi.length,numDirLightShadows:y.directionalShadowMap.length,numPointLightShadows:y.pointShadowMap.length,numSpotLightShadows:y.spotShadowMap.length,numSpotLightShadowsWithMaps:y.numSpotLightShadowsWithMaps,numLightProbes:y.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:m.dithering,shadowMapEnabled:r.shadowMap.enabled&&g.length>0,shadowMapType:r.shadowMap.type,toneMapping:Ie,useLegacyLights:r._useLegacyLights,decodeVideoTexture:Y&&m.map.isVideoTexture===!0&&qe.getTransfer(m.map.colorSpace)===Ke,premultipliedAlpha:m.premultipliedAlpha,doubleSided:m.side===2,flipSided:m.side===It,useDepthPacking:m.depthPacking>=0,depthPacking:m.depthPacking||0,index0AttributeName:m.index0AttributeName,extensionDerivatives:_t&&m.extensions.derivatives===!0,extensionFragDepth:_t&&m.extensions.fragDepth===!0,extensionDrawBuffers:_t&&m.extensions.drawBuffers===!0,extensionShaderTextureLOD:_t&&m.extensions.shaderTextureLOD===!0,extensionClipCullDistance:_t&&m.extensions.clipCullDistance&&n.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:h||n.has("EXT_frag_depth"),rendererExtensionDrawBuffers:h||n.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:h||n.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:m.customProgramCacheKey()}},getProgramCacheKey:function(m){let y=[];if(m.shaderID?y.push(m.shaderID):(y.push(m.customVertexShaderID),y.push(m.customFragmentShaderID)),m.defines!==void 0)for(let g in m.defines)y.push(g),y.push(m.defines[g]);return m.isRawShaderMaterial===!1&&(function(g,_){g.push(_.precision),g.push(_.outputColorSpace),g.push(_.envMapMode),g.push(_.envMapCubeUVHeight),g.push(_.mapUv),g.push(_.alphaMapUv),g.push(_.lightMapUv),g.push(_.aoMapUv),g.push(_.bumpMapUv),g.push(_.normalMapUv),g.push(_.displacementMapUv),g.push(_.emissiveMapUv),g.push(_.metalnessMapUv),g.push(_.roughnessMapUv),g.push(_.anisotropyMapUv),g.push(_.clearcoatMapUv),g.push(_.clearcoatNormalMapUv),g.push(_.clearcoatRoughnessMapUv),g.push(_.iridescenceMapUv),g.push(_.iridescenceThicknessMapUv),g.push(_.sheenColorMapUv),g.push(_.sheenRoughnessMapUv),g.push(_.specularMapUv),g.push(_.specularColorMapUv),g.push(_.specularIntensityMapUv),g.push(_.transmissionMapUv),g.push(_.thicknessMapUv),g.push(_.combine),g.push(_.fogExp2),g.push(_.sizeAttenuation),g.push(_.morphTargetsCount),g.push(_.morphAttributeCount),g.push(_.numDirLights),g.push(_.numPointLights),g.push(_.numSpotLights),g.push(_.numSpotLightMaps),g.push(_.numHemiLights),g.push(_.numRectAreaLights),g.push(_.numDirLightShadows),g.push(_.numPointLightShadows),g.push(_.numSpotLightShadows),g.push(_.numSpotLightShadowsWithMaps),g.push(_.numLightProbes),g.push(_.shadowMapType),g.push(_.toneMapping),g.push(_.numClippingPlanes),g.push(_.numClipIntersection),g.push(_.depthPacking)}(y,m),function(g,_){o.disableAll(),_.isWebGL2&&o.enable(0),_.supportsVertexTextures&&o.enable(1),_.instancing&&o.enable(2),_.instancingColor&&o.enable(3),_.matcap&&o.enable(4),_.envMap&&o.enable(5),_.normalMapObjectSpace&&o.enable(6),_.normalMapTangentSpace&&o.enable(7),_.clearcoat&&o.enable(8),_.iridescence&&o.enable(9),_.alphaTest&&o.enable(10),_.vertexColors&&o.enable(11),_.vertexAlphas&&o.enable(12),_.vertexUv1s&&o.enable(13),_.vertexUv2s&&o.enable(14),_.vertexUv3s&&o.enable(15),_.vertexTangents&&o.enable(16),_.anisotropy&&o.enable(17),_.alphaHash&&o.enable(18),_.batching&&o.enable(19),g.push(o.mask),o.disableAll(),_.fog&&o.enable(0),_.useFog&&o.enable(1),_.flatShading&&o.enable(2),_.logarithmicDepthBuffer&&o.enable(3),_.skinning&&o.enable(4),_.morphTargets&&o.enable(5),_.morphNormals&&o.enable(6),_.morphColors&&o.enable(7),_.premultipliedAlpha&&o.enable(8),_.shadowMapEnabled&&o.enable(9),_.useLegacyLights&&o.enable(10),_.doubleSided&&o.enable(11),_.flipSided&&o.enable(12),_.useDepthPacking&&o.enable(13),_.dithering&&o.enable(14),_.transmission&&o.enable(15),_.sheen&&o.enable(16),_.opaque&&o.enable(17),_.pointsUvs&&o.enable(18),_.decodeVideoTexture&&o.enable(19),g.push(o.mask)}(y,m),y.push(r.outputColorSpace)),y.push(m.customProgramCacheKey),y.join()},getUniforms:function(m){let y=f[m.type],g;if(y){let _=on[y];g=_p.clone(_.uniforms)}else g=m.uniforms;return g},acquireProgram:function(m,y){let g;for(let _=0,b=c.length;_<b;_++){let T=c[_];if(T.cacheKey===y){g=T,++g.usedTimes;break}}return g===void 0&&(g=new Pm(r,y,m,s),c.push(g)),g},releaseProgram:function(m){if(--m.usedTimes==0){let y=c.indexOf(m);c[y]=c[c.length-1],c.pop(),m.destroy()}},releaseShaderCache:function(m){l.remove(m)},programs:c,dispose:function(){l.dispose()}}}function Dm(){let r=new WeakMap;return{get:function(e){let t=r.get(e);return t===void 0&&(t={},r.set(e,t)),t},remove:function(e){r.delete(e)},update:function(e,t,n){r.get(e)[t]=n},dispose:function(){r=new WeakMap}}}function Nm(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.material.id!==e.material.id?r.material.id-e.material.id:r.z!==e.z?r.z-e.z:r.id-e.id}function iu(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.z!==e.z?e.z-r.z:r.id-e.id}function ru(){let r=[],e=0,t=[],n=[],i=[];function s(a,o,l,c,h,u){let d=r[e];return d===void 0?(d={id:a.id,object:a,geometry:o,material:l,groupOrder:c,renderOrder:a.renderOrder,z:h,group:u},r[e]=d):(d.id=a.id,d.object=a,d.geometry=o,d.material=l,d.groupOrder=c,d.renderOrder=a.renderOrder,d.z=h,d.group=u),e++,d}return{opaque:t,transmissive:n,transparent:i,init:function(){e=0,t.length=0,n.length=0,i.length=0},push:function(a,o,l,c,h,u){let d=s(a,o,l,c,h,u);l.transmission>0?n.push(d):l.transparent===!0?i.push(d):t.push(d)},unshift:function(a,o,l,c,h,u){let d=s(a,o,l,c,h,u);l.transmission>0?n.unshift(d):l.transparent===!0?i.unshift(d):t.unshift(d)},finish:function(){for(let a=e,o=r.length;a<o;a++){let l=r[a];if(l.id===null)break;l.id=null,l.object=null,l.geometry=null,l.material=null,l.group=null}},sort:function(a,o){t.length>1&&t.sort(a||Nm),n.length>1&&n.sort(o||iu),i.length>1&&i.sort(o||iu)}}}function Um(){let r=new WeakMap;return{get:function(e,t){let n=r.get(e),i;return n===void 0?(i=new ru,r.set(e,[i])):t>=n.length?(i=new ru,n.push(i)):i=n[t],i},dispose:function(){r=new WeakMap}}}function Om(){let r={};return{get:function(e){if(r[e.id]!==void 0)return r[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new w,color:new Te};break;case"SpotLight":t={position:new w,direction:new w,color:new Te,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new w,color:new Te,distance:0,decay:0};break;case"HemisphereLight":t={direction:new w,skyColor:new Te,groundColor:new Te};break;case"RectAreaLight":t={color:new Te,position:new w,halfWidth:new w,halfHeight:new w}}return r[e.id]=t,t}}}function Bm(r,e){return(e.castShadow?2:0)-(r.castShadow?2:0)+(e.map?1:0)-(r.map?1:0)}function km(r,e){let t=new Om,n=function(){let l={};return{get:function(c){if(l[c.id]!==void 0)return l[c.id];let h;switch(c.type){case"DirectionalLight":case"SpotLight":h={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ie};break;case"PointLight":h={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ie,shadowCameraNear:1,shadowCameraFar:1e3}}return l[c.id]=h,h}}}(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new w);let s=new w,a=new Re,o=new Re;return{setup:function(l,c){let h=0,u=0,d=0;for(let B=0;B<9;B++)i.probe[B].set(0,0,0);let p=0,f=0,v=0,m=0,y=0,g=0,_=0,b=0,T=0,M=0,E=0;l.sort(Bm);let N=c===!0?Math.PI:1;for(let B=0,D=l.length;B<D;B++){let P=l[B],O=P.color,k=P.intensity,ee=P.distance,oe=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)h+=O.r*k*N,u+=O.g*k*N,d+=O.b*k*N;else if(P.isLightProbe){for(let K=0;K<9;K++)i.probe[K].addScaledVector(P.sh.coefficients[K],k);E++}else if(P.isDirectionalLight){let K=t.get(P);if(K.color.copy(P.color).multiplyScalar(P.intensity*N),P.castShadow){let X=P.shadow,J=n.get(P);J.shadowBias=X.bias,J.shadowNormalBias=X.normalBias,J.shadowRadius=X.radius,J.shadowMapSize=X.mapSize,i.directionalShadow[p]=J,i.directionalShadowMap[p]=oe,i.directionalShadowMatrix[p]=P.shadow.matrix,g++}i.directional[p]=K,p++}else if(P.isSpotLight){let K=t.get(P);K.position.setFromMatrixPosition(P.matrixWorld),K.color.copy(O).multiplyScalar(k*N),K.distance=ee,K.coneCos=Math.cos(P.angle),K.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),K.decay=P.decay,i.spot[v]=K;let X=P.shadow;if(P.map&&(i.spotLightMap[T]=P.map,T++,X.updateMatrices(P),P.castShadow&&M++),i.spotLightMatrix[v]=X.matrix,P.castShadow){let J=n.get(P);J.shadowBias=X.bias,J.shadowNormalBias=X.normalBias,J.shadowRadius=X.radius,J.shadowMapSize=X.mapSize,i.spotShadow[v]=J,i.spotShadowMap[v]=oe,b++}v++}else if(P.isRectAreaLight){let K=t.get(P);K.color.copy(O).multiplyScalar(k),K.halfWidth.set(.5*P.width,0,0),K.halfHeight.set(0,.5*P.height,0),i.rectArea[m]=K,m++}else if(P.isPointLight){let K=t.get(P);if(K.color.copy(P.color).multiplyScalar(P.intensity*N),K.distance=P.distance,K.decay=P.decay,P.castShadow){let X=P.shadow,J=n.get(P);J.shadowBias=X.bias,J.shadowNormalBias=X.normalBias,J.shadowRadius=X.radius,J.shadowMapSize=X.mapSize,J.shadowCameraNear=X.camera.near,J.shadowCameraFar=X.camera.far,i.pointShadow[f]=J,i.pointShadowMap[f]=oe,i.pointShadowMatrix[f]=P.shadow.matrix,_++}i.point[f]=K,f++}else if(P.isHemisphereLight){let K=t.get(P);K.skyColor.copy(P.color).multiplyScalar(k*N),K.groundColor.copy(P.groundColor).multiplyScalar(k*N),i.hemi[y]=K,y++}}m>0&&(e.isWebGL2?r.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=le.LTC_FLOAT_1,i.rectAreaLTC2=le.LTC_FLOAT_2):(i.rectAreaLTC1=le.LTC_HALF_1,i.rectAreaLTC2=le.LTC_HALF_2):r.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=le.LTC_FLOAT_1,i.rectAreaLTC2=le.LTC_FLOAT_2):r.has("OES_texture_half_float_linear")===!0?(i.rectAreaLTC1=le.LTC_HALF_1,i.rectAreaLTC2=le.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),i.ambient[0]=h,i.ambient[1]=u,i.ambient[2]=d;let I=i.hash;I.directionalLength===p&&I.pointLength===f&&I.spotLength===v&&I.rectAreaLength===m&&I.hemiLength===y&&I.numDirectionalShadows===g&&I.numPointShadows===_&&I.numSpotShadows===b&&I.numSpotMaps===T&&I.numLightProbes===E||(i.directional.length=p,i.spot.length=v,i.rectArea.length=m,i.point.length=f,i.hemi.length=y,i.directionalShadow.length=g,i.directionalShadowMap.length=g,i.pointShadow.length=_,i.pointShadowMap.length=_,i.spotShadow.length=b,i.spotShadowMap.length=b,i.directionalShadowMatrix.length=g,i.pointShadowMatrix.length=_,i.spotLightMatrix.length=b+T-M,i.spotLightMap.length=T,i.numSpotLightShadowsWithMaps=M,i.numLightProbes=E,I.directionalLength=p,I.pointLength=f,I.spotLength=v,I.rectAreaLength=m,I.hemiLength=y,I.numDirectionalShadows=g,I.numPointShadows=_,I.numSpotShadows=b,I.numSpotMaps=T,I.numLightProbes=E,i.version=Fm++)},setupView:function(l,c){let h=0,u=0,d=0,p=0,f=0,v=c.matrixWorldInverse;for(let m=0,y=l.length;m<y;m++){let g=l[m];if(g.isDirectionalLight){let _=i.directional[h];_.direction.setFromMatrixPosition(g.matrixWorld),s.setFromMatrixPosition(g.target.matrixWorld),_.direction.sub(s),_.direction.transformDirection(v),h++}else if(g.isSpotLight){let _=i.spot[d];_.position.setFromMatrixPosition(g.matrixWorld),_.position.applyMatrix4(v),_.direction.setFromMatrixPosition(g.matrixWorld),s.setFromMatrixPosition(g.target.matrixWorld),_.direction.sub(s),_.direction.transformDirection(v),d++}else if(g.isRectAreaLight){let _=i.rectArea[p];_.position.setFromMatrixPosition(g.matrixWorld),_.position.applyMatrix4(v),o.identity(),a.copy(g.matrixWorld),a.premultiply(v),o.extractRotation(a),_.halfWidth.set(.5*g.width,0,0),_.halfHeight.set(0,.5*g.height,0),_.halfWidth.applyMatrix4(o),_.halfHeight.applyMatrix4(o),p++}else if(g.isPointLight){let _=i.point[u];_.position.setFromMatrixPosition(g.matrixWorld),_.position.applyMatrix4(v),u++}else if(g.isHemisphereLight){let _=i.hemi[f];_.direction.setFromMatrixPosition(g.matrixWorld),_.direction.transformDirection(v),f++}}},state:i}}function su(r,e){let t=new km(r,e),n=[],i=[];return{init:function(){n.length=0,i.length=0},state:{lightsArray:n,shadowsArray:i,lights:t},setupLights:function(s){t.setup(n,s)},setupLightsView:function(s){t.setupView(n,s)},pushLight:function(s){n.push(s)},pushShadow:function(s){i.push(s)}}}function zm(r,e){let t=new WeakMap;return{get:function(n,i=0){let s=t.get(n),a;return s===void 0?(a=new su(r,e),t.set(n,[a])):i>=s.length?(a=new su(r,e),s.push(a)):a=s[i],a},dispose:function(){t=new WeakMap}}}function Hm(r,e,t){let n=new ar,i=new ie,s=new ie,a=new Ze,o=new Sl({depthPacking:3201}),l=new wl,c={},h=t.maxTextureSize,u={[Qn]:It,[It]:Qn,2:2},d=new Dn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ie},radius:{value:4}},vertexShader:`void main() {
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
}`}),p=d.clone();p.defines.HORIZONTAL_PASS=1;let f=new Ye;f.setAttribute("position",new Rt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let v=new ge(f,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ru;let y=this.type;function g(M,E){let N=e.update(v);d.defines.VSM_SAMPLES!==M.blurSamples&&(d.defines.VSM_SAMPLES=M.blurSamples,p.defines.VSM_SAMPLES=M.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),M.mapPass===null&&(M.mapPass=new Pn(i.x,i.y)),d.uniforms.shadow_pass.value=M.map.texture,d.uniforms.resolution.value=M.mapSize,d.uniforms.radius.value=M.radius,r.setRenderTarget(M.mapPass),r.clear(),r.renderBufferDirect(E,null,N,d,v,null),p.uniforms.shadow_pass.value=M.mapPass.texture,p.uniforms.resolution.value=M.mapSize,p.uniforms.radius.value=M.radius,r.setRenderTarget(M.map),r.clear(),r.renderBufferDirect(E,null,N,p,v,null)}function _(M,E,N,I){let B=null,D=N.isPointLight===!0?M.customDistanceMaterial:M.customDepthMaterial;if(D!==void 0)B=D;else if(B=N.isPointLight===!0?l:o,r.localClippingEnabled&&E.clipShadows===!0&&Array.isArray(E.clippingPlanes)&&E.clippingPlanes.length!==0||E.displacementMap&&E.displacementScale!==0||E.alphaMap&&E.alphaTest>0||E.map&&E.alphaTest>0){let P=B.uuid,O=E.uuid,k=c[P];k===void 0&&(k={},c[P]=k);let ee=k[O];ee===void 0&&(ee=B.clone(),k[O]=ee,E.addEventListener("dispose",T)),B=ee}return B.visible=E.visible,B.wireframe=E.wireframe,B.side=I===An?E.shadowSide!==null?E.shadowSide:E.side:E.shadowSide!==null?E.shadowSide:u[E.side],B.alphaMap=E.alphaMap,B.alphaTest=E.alphaTest,B.map=E.map,B.clipShadows=E.clipShadows,B.clippingPlanes=E.clippingPlanes,B.clipIntersection=E.clipIntersection,B.displacementMap=E.displacementMap,B.displacementScale=E.displacementScale,B.displacementBias=E.displacementBias,B.wireframeLinewidth=E.wireframeLinewidth,B.linewidth=E.linewidth,N.isPointLight===!0&&B.isMeshDistanceMaterial===!0&&(r.properties.get(B).light=N),B}function b(M,E,N,I,B){if(M.visible===!1)return;if(M.layers.test(E.layers)&&(M.isMesh||M.isLine||M.isPoints)&&(M.castShadow||M.receiveShadow&&B===An)&&(!M.frustumCulled||n.intersectsObject(M))){M.modelViewMatrix.multiplyMatrices(N.matrixWorldInverse,M.matrixWorld);let P=e.update(M),O=M.material;if(Array.isArray(O)){let k=P.groups;for(let ee=0,oe=k.length;ee<oe;ee++){let K=k[ee],X=O[K.materialIndex];if(X&&X.visible){let J=_(M,X,I,B);M.onBeforeShadow(r,M,E,N,P,J,K),r.renderBufferDirect(N,null,P,J,M,K),M.onAfterShadow(r,M,E,N,P,J,K)}}}else if(O.visible){let k=_(M,O,I,B);M.onBeforeShadow(r,M,E,N,P,k,null),r.renderBufferDirect(N,null,P,k,M,null),M.onAfterShadow(r,M,E,N,P,k,null)}}let D=M.children;for(let P=0,O=D.length;P<O;P++)b(D[P],E,N,I,B)}function T(M){M.target.removeEventListener("dispose",T);for(let E in c){let N=c[E],I=M.target.uuid;I in N&&(N[I].dispose(),delete N[I])}}this.render=function(M,E,N){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||M.length===0)return;let I=r.getRenderTarget(),B=r.getActiveCubeFace(),D=r.getActiveMipmapLevel(),P=r.state;P.setBlending(0),P.buffers.color.setClear(1,1,1,1),P.buffers.depth.setTest(!0),P.setScissorTest(!1);let O=y!==An&&this.type===An,k=y===An&&this.type!==An;for(let ee=0,oe=M.length;ee<oe;ee++){let K=M[ee],X=K.shadow;if(X===void 0){console.warn("THREE.WebGLShadowMap:",K,"has no shadow.");continue}if(X.autoUpdate===!1&&X.needsUpdate===!1)continue;i.copy(X.mapSize);let J=X.getFrameExtents();if(i.multiply(J),s.copy(X.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(s.x=Math.floor(h/J.x),i.x=s.x*J.x,X.mapSize.x=s.x),i.y>h&&(s.y=Math.floor(h/J.y),i.y=s.y*J.y,X.mapSize.y=s.y)),X.map===null||O===!0||k===!0){let Y=this.type!==An?{minFilter:At,magFilter:At}:{};X.map!==null&&X.map.dispose(),X.map=new Pn(i.x,i.y,Y),X.map.texture.name=K.name+".shadowMap",X.camera.updateProjectionMatrix()}r.setRenderTarget(X.map),r.clear();let H=X.getViewportCount();for(let Y=0;Y<H;Y++){let he=X.getViewport(Y);a.set(s.x*he.x,s.y*he.y,s.x*he.z,s.y*he.w),P.viewport(a),X.updateMatrices(K,Y),n=X.getFrustum(),b(E,N,X.camera,K,this.type)}X.isPointLightShadow!==!0&&this.type===An&&g(X,N),X.needsUpdate=!1}y=this.type,m.needsUpdate=!1,r.setRenderTarget(I,B,D)}}function Gm(r,e,t){let n=t.isWebGL2,i=new function(){let S=!1,re=new Ze,V=null,W=new Ze(0,0,0,0);return{setMask:function(se){V===se||S||(r.colorMask(se,se,se,se),V=se)},setLocked:function(se){S=se},setClear:function(se,ce,de,pe,Se){Se===!0&&(se*=pe,ce*=pe,de*=pe),re.set(se,ce,de,pe),W.equals(re)===!1&&(r.clearColor(se,ce,de,pe),W.copy(re))},reset:function(){S=!1,V=null,W.set(-1,0,0,0)}}},s=new function(){let S=!1,re=null,V=null,W=null;return{setTest:function(se){se?q(r.DEPTH_TEST):L(r.DEPTH_TEST)},setMask:function(se){re===se||S||(r.depthMask(se),re=se)},setFunc:function(se){if(V!==se){switch(se){case 0:r.depthFunc(r.NEVER);break;case 1:r.depthFunc(r.ALWAYS);break;case 2:r.depthFunc(r.LESS);break;case 3:default:r.depthFunc(r.LEQUAL);break;case 4:r.depthFunc(r.EQUAL);break;case 5:r.depthFunc(r.GEQUAL);break;case 6:r.depthFunc(r.GREATER);break;case 7:r.depthFunc(r.NOTEQUAL)}V=se}},setLocked:function(se){S=se},setClear:function(se){W!==se&&(r.clearDepth(se),W=se)},reset:function(){S=!1,re=null,V=null,W=null}}},a=new function(){let S=!1,re=null,V=null,W=null,se=null,ce=null,de=null,pe=null,Se=null;return{setTest:function(me){S||(me?q(r.STENCIL_TEST):L(r.STENCIL_TEST))},setMask:function(me){re===me||S||(r.stencilMask(me),re=me)},setFunc:function(me,_e,Ce){V===me&&W===_e&&se===Ce||(r.stencilFunc(me,_e,Ce),V=me,W=_e,se=Ce)},setOp:function(me,_e,Ce){ce===me&&de===_e&&pe===Ce||(r.stencilOp(me,_e,Ce),ce=me,de=_e,pe=Ce)},setLocked:function(me){S=me},setClear:function(me){Se!==me&&(r.clearStencil(me),Se=me)},reset:function(){S=!1,re=null,V=null,W=null,se=null,ce=null,de=null,pe=null,Se=null}}},o=new WeakMap,l=new WeakMap,c={},h={},u=new WeakMap,d=[],p=null,f=!1,v=null,m=null,y=null,g=null,_=null,b=null,T=null,M=new Te(0,0,0),E=0,N=!1,I=null,B=null,D=null,P=null,O=null,k=r.getParameter(r.MAX_COMBINED_TEXTURE_IMAGE_UNITS),ee=!1,oe=0,K=r.getParameter(r.VERSION);K.indexOf("WebGL")!==-1?(oe=parseFloat(/^WebGL (\d)/.exec(K)[1]),ee=oe>=1):K.indexOf("OpenGL ES")!==-1&&(oe=parseFloat(/^OpenGL ES (\d)/.exec(K)[1]),ee=oe>=2);let X=null,J={},H=r.getParameter(r.SCISSOR_BOX),Y=r.getParameter(r.VIEWPORT),he=new Ze().fromArray(H),A=new Ze().fromArray(Y);function R(S,re,V,W){let se=new Uint8Array(4),ce=r.createTexture();r.bindTexture(S,ce),r.texParameteri(S,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(S,r.TEXTURE_MAG_FILTER,r.NEAREST);for(let de=0;de<V;de++)!n||S!==r.TEXTURE_3D&&S!==r.TEXTURE_2D_ARRAY?r.texImage2D(re+de,0,r.RGBA,1,1,0,r.RGBA,r.UNSIGNED_BYTE,se):r.texImage3D(re,0,r.RGBA,1,1,W,0,r.RGBA,r.UNSIGNED_BYTE,se);return ce}let z={};function q(S){c[S]!==!0&&(r.enable(S),c[S]=!0)}function L(S){c[S]!==!1&&(r.disable(S),c[S]=!1)}z[r.TEXTURE_2D]=R(r.TEXTURE_2D,r.TEXTURE_2D,1),z[r.TEXTURE_CUBE_MAP]=R(r.TEXTURE_CUBE_MAP,r.TEXTURE_CUBE_MAP_POSITIVE_X,6),n&&(z[r.TEXTURE_2D_ARRAY]=R(r.TEXTURE_2D_ARRAY,r.TEXTURE_2D_ARRAY,1,1),z[r.TEXTURE_3D]=R(r.TEXTURE_3D,r.TEXTURE_3D,1,1)),i.setClear(0,0,0,1),s.setClear(1),a.setClear(0),q(r.DEPTH_TEST),s.setFunc(3),G(!1),te(1),q(r.CULL_FACE),F(0);let j={[ci]:r.FUNC_ADD,101:r.FUNC_SUBTRACT,102:r.FUNC_REVERSE_SUBTRACT};if(n)j[103]=r.MIN,j[104]=r.MAX;else{let S=e.get("EXT_blend_minmax");S!==null&&(j[103]=S.MIN_EXT,j[104]=S.MAX_EXT)}let U={200:r.ZERO,201:r.ONE,202:r.SRC_COLOR,[rl]:r.SRC_ALPHA,210:r.SRC_ALPHA_SATURATE,208:r.DST_COLOR,206:r.DST_ALPHA,203:r.ONE_MINUS_SRC_COLOR,[sl]:r.ONE_MINUS_SRC_ALPHA,209:r.ONE_MINUS_DST_COLOR,207:r.ONE_MINUS_DST_ALPHA,211:r.CONSTANT_COLOR,212:r.ONE_MINUS_CONSTANT_COLOR,213:r.CONSTANT_ALPHA,214:r.ONE_MINUS_CONSTANT_ALPHA};function F(S,re,V,W,se,ce,de,pe,Se,me){if(S!==0){if(f===!1&&(q(r.BLEND),f=!0),S===5)se=se||re,ce=ce||V,de=de||W,re===m&&se===_||(r.blendEquationSeparate(j[re],j[se]),m=re,_=se),V===y&&W===g&&ce===b&&de===T||(r.blendFuncSeparate(U[V],U[W],U[ce],U[de]),y=V,g=W,b=ce,T=de),pe.equals(M)!==!1&&Se===E||(r.blendColor(pe.r,pe.g,pe.b,Se),M.copy(pe),E=Se),v=S,N=!1;else if(S!==v||me!==N){if(m===ci&&_===ci||(r.blendEquation(r.FUNC_ADD),m=ci,_=ci),me)switch(S){case 1:r.blendFuncSeparate(r.ONE,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case 2:r.blendFunc(r.ONE,r.ONE);break;case 3:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case 4:r.blendFuncSeparate(r.ZERO,r.SRC_COLOR,r.ZERO,r.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",S)}else switch(S){case 1:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case 2:r.blendFunc(r.SRC_ALPHA,r.ONE);break;case 3:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case 4:r.blendFunc(r.ZERO,r.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",S)}y=null,g=null,b=null,T=null,M.set(0,0,0),E=0,v=S,N=me}}else f===!0&&(L(r.BLEND),f=!1)}function G(S){I!==S&&(S?r.frontFace(r.CW):r.frontFace(r.CCW),I=S)}function te(S){S!==0?(q(r.CULL_FACE),S!==B&&(S===1?r.cullFace(r.BACK):S===2?r.cullFace(r.FRONT):r.cullFace(r.FRONT_AND_BACK))):L(r.CULL_FACE),B=S}function Q(S,re,V){S?(q(r.POLYGON_OFFSET_FILL),P===re&&O===V||(r.polygonOffset(re,V),P=re,O=V)):L(r.POLYGON_OFFSET_FILL)}return{buffers:{color:i,depth:s,stencil:a},enable:q,disable:L,bindFramebuffer:function(S,re){return h[S]!==re&&(r.bindFramebuffer(S,re),h[S]=re,n&&(S===r.DRAW_FRAMEBUFFER&&(h[r.FRAMEBUFFER]=re),S===r.FRAMEBUFFER&&(h[r.DRAW_FRAMEBUFFER]=re)),!0)},drawBuffers:function(S,re){let V=d,W=!1;if(S)if(V=u.get(re),V===void 0&&(V=[],u.set(re,V)),S.isWebGLMultipleRenderTargets){let se=S.texture;if(V.length!==se.length||V[0]!==r.COLOR_ATTACHMENT0){for(let ce=0,de=se.length;ce<de;ce++)V[ce]=r.COLOR_ATTACHMENT0+ce;V.length=se.length,W=!0}}else V[0]!==r.COLOR_ATTACHMENT0&&(V[0]=r.COLOR_ATTACHMENT0,W=!0);else V[0]!==r.BACK&&(V[0]=r.BACK,W=!0);W&&(t.isWebGL2?r.drawBuffers(V):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(V))},useProgram:function(S){return p!==S&&(r.useProgram(S),p=S,!0)},setBlending:F,setMaterial:function(S,re){S.side===2?L(r.CULL_FACE):q(r.CULL_FACE);let V=S.side===It;re&&(V=!V),G(V),S.blending===1&&S.transparent===!1?F(0):F(S.blending,S.blendEquation,S.blendSrc,S.blendDst,S.blendEquationAlpha,S.blendSrcAlpha,S.blendDstAlpha,S.blendColor,S.blendAlpha,S.premultipliedAlpha),s.setFunc(S.depthFunc),s.setTest(S.depthTest),s.setMask(S.depthWrite),i.setMask(S.colorWrite);let W=S.stencilWrite;a.setTest(W),W&&(a.setMask(S.stencilWriteMask),a.setFunc(S.stencilFunc,S.stencilRef,S.stencilFuncMask),a.setOp(S.stencilFail,S.stencilZFail,S.stencilZPass)),Q(S.polygonOffset,S.polygonOffsetFactor,S.polygonOffsetUnits),S.alphaToCoverage===!0?q(r.SAMPLE_ALPHA_TO_COVERAGE):L(r.SAMPLE_ALPHA_TO_COVERAGE)},setFlipSided:G,setCullFace:te,setLineWidth:function(S){S!==D&&(ee&&r.lineWidth(S),D=S)},setPolygonOffset:Q,setScissorTest:function(S){S?q(r.SCISSOR_TEST):L(r.SCISSOR_TEST)},activeTexture:function(S){S===void 0&&(S=r.TEXTURE0+k-1),X!==S&&(r.activeTexture(S),X=S)},bindTexture:function(S,re,V){V===void 0&&(V=X===null?r.TEXTURE0+k-1:X);let W=J[V];W===void 0&&(W={type:void 0,texture:void 0},J[V]=W),W.type===S&&W.texture===re||(X!==V&&(r.activeTexture(V),X=V),r.bindTexture(S,re||z[S]),W.type=S,W.texture=re)},unbindTexture:function(){let S=J[X];S!==void 0&&S.type!==void 0&&(r.bindTexture(S.type,null),S.type=void 0,S.texture=void 0)},compressedTexImage2D:function(){try{r.compressedTexImage2D.apply(r,arguments)}catch(S){console.error("THREE.WebGLState:",S)}},compressedTexImage3D:function(){try{r.compressedTexImage3D.apply(r,arguments)}catch(S){console.error("THREE.WebGLState:",S)}},texImage2D:function(){try{r.texImage2D.apply(r,arguments)}catch(S){console.error("THREE.WebGLState:",S)}},texImage3D:function(){try{r.texImage3D.apply(r,arguments)}catch(S){console.error("THREE.WebGLState:",S)}},updateUBOMapping:function(S,re){let V=l.get(re);V===void 0&&(V=new WeakMap,l.set(re,V));let W=V.get(S);W===void 0&&(W=r.getUniformBlockIndex(re,S.name),V.set(S,W))},uniformBlockBinding:function(S,re){let V=l.get(re).get(S);o.get(re)!==V&&(r.uniformBlockBinding(re,V,S.__bindingPointIndex),o.set(re,V))},texStorage2D:function(){try{r.texStorage2D.apply(r,arguments)}catch(S){console.error("THREE.WebGLState:",S)}},texStorage3D:function(){try{r.texStorage3D.apply(r,arguments)}catch(S){console.error("THREE.WebGLState:",S)}},texSubImage2D:function(){try{r.texSubImage2D.apply(r,arguments)}catch(S){console.error("THREE.WebGLState:",S)}},texSubImage3D:function(){try{r.texSubImage3D.apply(r,arguments)}catch(S){console.error("THREE.WebGLState:",S)}},compressedTexSubImage2D:function(){try{r.compressedTexSubImage2D.apply(r,arguments)}catch(S){console.error("THREE.WebGLState:",S)}},compressedTexSubImage3D:function(){try{r.compressedTexSubImage3D.apply(r,arguments)}catch(S){console.error("THREE.WebGLState:",S)}},scissor:function(S){he.equals(S)===!1&&(r.scissor(S.x,S.y,S.z,S.w),he.copy(S))},viewport:function(S){A.equals(S)===!1&&(r.viewport(S.x,S.y,S.z,S.w),A.copy(S))},reset:function(){r.disable(r.BLEND),r.disable(r.CULL_FACE),r.disable(r.DEPTH_TEST),r.disable(r.POLYGON_OFFSET_FILL),r.disable(r.SCISSOR_TEST),r.disable(r.STENCIL_TEST),r.disable(r.SAMPLE_ALPHA_TO_COVERAGE),r.blendEquation(r.FUNC_ADD),r.blendFunc(r.ONE,r.ZERO),r.blendFuncSeparate(r.ONE,r.ZERO,r.ONE,r.ZERO),r.blendColor(0,0,0,0),r.colorMask(!0,!0,!0,!0),r.clearColor(0,0,0,0),r.depthMask(!0),r.depthFunc(r.LESS),r.clearDepth(1),r.stencilMask(4294967295),r.stencilFunc(r.ALWAYS,0,4294967295),r.stencilOp(r.KEEP,r.KEEP,r.KEEP),r.clearStencil(0),r.cullFace(r.BACK),r.frontFace(r.CCW),r.polygonOffset(0,0),r.activeTexture(r.TEXTURE0),r.bindFramebuffer(r.FRAMEBUFFER,null),n===!0&&(r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.bindFramebuffer(r.READ_FRAMEBUFFER,null)),r.useProgram(null),r.lineWidth(1),r.scissor(0,0,r.canvas.width,r.canvas.height),r.viewport(0,0,r.canvas.width,r.canvas.height),c={},X=null,J={},h={},u=new WeakMap,d=[],p=null,f=!1,v=null,m=null,y=null,g=null,_=null,b=null,T=null,M=new Te(0,0,0),E=0,N=!1,I=null,B=null,D=null,P=null,O=null,he.set(0,0,r.canvas.width,r.canvas.height),A.set(0,0,r.canvas.width,r.canvas.height),i.reset(),s.reset(),a.reset()}}}function Vm(r,e,t,n,i,s,a){let o=i.isWebGL2,l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator<"u"&&/OculusBrowser/g.test(navigator.userAgent),h=new WeakMap,u,d=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function f(A,R){return p?new OffscreenCanvas(A,R):Fr("canvas")}function v(A,R,z,q){let L=1;if((A.width>q||A.height>q)&&(L=q/Math.max(A.width,A.height)),L<1||R===!0){if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap){let j=R?la:Math.floor,U=j(L*A.width),F=j(L*A.height);u===void 0&&(u=f(U,F));let G=z?f(U,F):u;return G.width=U,G.height=F,G.getContext("2d").drawImage(A,0,0,U,F),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+A.width+"x"+A.height+") to ("+U+"x"+F+")."),G}return"data"in A&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+A.width+"x"+A.height+")."),A}return A}function m(A){return dl(A.width)&&dl(A.height)}function y(A,R){return A.generateMipmaps&&R&&A.minFilter!==At&&A.minFilter!==en}function g(A){r.generateMipmap(A)}function _(A,R,z,q,L=!1){if(o===!1)return R;if(A!==null){if(r[A]!==void 0)return r[A];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let j=R;if(R===r.RED&&(z===r.FLOAT&&(j=r.R32F),z===r.HALF_FLOAT&&(j=r.R16F),z===r.UNSIGNED_BYTE&&(j=r.R8)),R===r.RED_INTEGER&&(z===r.UNSIGNED_BYTE&&(j=r.R8UI),z===r.UNSIGNED_SHORT&&(j=r.R16UI),z===r.UNSIGNED_INT&&(j=r.R32UI),z===r.BYTE&&(j=r.R8I),z===r.SHORT&&(j=r.R16I),z===r.INT&&(j=r.R32I)),R===r.RG&&(z===r.FLOAT&&(j=r.RG32F),z===r.HALF_FLOAT&&(j=r.RG16F),z===r.UNSIGNED_BYTE&&(j=r.RG8)),R===r.RGBA){let U=L?ra:qe.getTransfer(q);z===r.FLOAT&&(j=r.RGBA32F),z===r.HALF_FLOAT&&(j=r.RGBA16F),z===r.UNSIGNED_BYTE&&(j=U===Ke?r.SRGB8_ALPHA8:r.RGBA8),z===r.UNSIGNED_SHORT_4_4_4_4&&(j=r.RGBA4),z===r.UNSIGNED_SHORT_5_5_5_1&&(j=r.RGB5_A1)}return j!==r.R16F&&j!==r.R32F&&j!==r.RG16F&&j!==r.RG32F&&j!==r.RGBA16F&&j!==r.RGBA32F||e.get("EXT_color_buffer_float"),j}function b(A,R,z){return y(A,z)===!0||A.isFramebufferTexture&&A.minFilter!==At&&A.minFilter!==en?Math.log2(Math.max(R.width,R.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?R.mipmaps.length:1}function T(A){return A===At||A===jc||A===vo?r.NEAREST:r.LINEAR}function M(A){let R=A.target;R.removeEventListener("dispose",M),function(z){let q=n.get(z);if(q.__webglInit===void 0)return;let L=z.source,j=d.get(L);if(j){let U=j[q.__cacheKey];U.usedTimes--,U.usedTimes===0&&N(z),Object.keys(j).length===0&&d.delete(L)}n.remove(z)}(R),R.isVideoTexture&&h.delete(R)}function E(A){let R=A.target;R.removeEventListener("dispose",E),function(z){let q=z.texture,L=n.get(z),j=n.get(q);if(j.__webglTexture!==void 0&&(r.deleteTexture(j.__webglTexture),a.memory.textures--),z.depthTexture&&z.depthTexture.dispose(),z.isWebGLCubeRenderTarget)for(let U=0;U<6;U++){if(Array.isArray(L.__webglFramebuffer[U]))for(let F=0;F<L.__webglFramebuffer[U].length;F++)r.deleteFramebuffer(L.__webglFramebuffer[U][F]);else r.deleteFramebuffer(L.__webglFramebuffer[U]);L.__webglDepthbuffer&&r.deleteRenderbuffer(L.__webglDepthbuffer[U])}else{if(Array.isArray(L.__webglFramebuffer))for(let U=0;U<L.__webglFramebuffer.length;U++)r.deleteFramebuffer(L.__webglFramebuffer[U]);else r.deleteFramebuffer(L.__webglFramebuffer);if(L.__webglDepthbuffer&&r.deleteRenderbuffer(L.__webglDepthbuffer),L.__webglMultisampledFramebuffer&&r.deleteFramebuffer(L.__webglMultisampledFramebuffer),L.__webglColorRenderbuffer)for(let U=0;U<L.__webglColorRenderbuffer.length;U++)L.__webglColorRenderbuffer[U]&&r.deleteRenderbuffer(L.__webglColorRenderbuffer[U]);L.__webglDepthRenderbuffer&&r.deleteRenderbuffer(L.__webglDepthRenderbuffer)}if(z.isWebGLMultipleRenderTargets)for(let U=0,F=q.length;U<F;U++){let G=n.get(q[U]);G.__webglTexture&&(r.deleteTexture(G.__webglTexture),a.memory.textures--),n.remove(q[U])}n.remove(q),n.remove(z)}(R)}function N(A){let R=n.get(A);r.deleteTexture(R.__webglTexture);let z=A.source;delete d.get(z)[R.__cacheKey],a.memory.textures--}let I=0;function B(A,R){let z=n.get(A);if(A.isVideoTexture&&function(q){let L=a.render.frame;h.get(q)!==L&&(h.set(q,L),q.update())}(A),A.isRenderTargetTexture===!1&&A.version>0&&z.__version!==A.version){let q=A.image;if(q===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else{if(q.complete!==!1)return void oe(z,A,R);console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete")}}t.bindTexture(r.TEXTURE_2D,z.__webglTexture,r.TEXTURE0+R)}let D={[nr]:r.REPEAT,[Rn]:r.CLAMP_TO_EDGE,[ll]:r.MIRRORED_REPEAT},P={[At]:r.NEAREST,[jc]:r.NEAREST_MIPMAP_NEAREST,[vo]:r.NEAREST_MIPMAP_LINEAR,[en]:r.LINEAR,[tp]:r.LINEAR_MIPMAP_NEAREST,[ta]:r.LINEAR_MIPMAP_LINEAR},O={512:r.NEVER,519:r.ALWAYS,513:r.LESS,515:r.LEQUAL,514:r.EQUAL,518:r.GEQUAL,516:r.GREATER,517:r.NOTEQUAL};function k(A,R,z){if(z?(r.texParameteri(A,r.TEXTURE_WRAP_S,D[R.wrapS]),r.texParameteri(A,r.TEXTURE_WRAP_T,D[R.wrapT]),A!==r.TEXTURE_3D&&A!==r.TEXTURE_2D_ARRAY||r.texParameteri(A,r.TEXTURE_WRAP_R,D[R.wrapR]),r.texParameteri(A,r.TEXTURE_MAG_FILTER,P[R.magFilter]),r.texParameteri(A,r.TEXTURE_MIN_FILTER,P[R.minFilter])):(r.texParameteri(A,r.TEXTURE_WRAP_S,r.CLAMP_TO_EDGE),r.texParameteri(A,r.TEXTURE_WRAP_T,r.CLAMP_TO_EDGE),A!==r.TEXTURE_3D&&A!==r.TEXTURE_2D_ARRAY||r.texParameteri(A,r.TEXTURE_WRAP_R,r.CLAMP_TO_EDGE),R.wrapS===Rn&&R.wrapT===Rn||console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),r.texParameteri(A,r.TEXTURE_MAG_FILTER,T(R.magFilter)),r.texParameteri(A,r.TEXTURE_MIN_FILTER,T(R.minFilter)),R.minFilter!==At&&R.minFilter!==en&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),R.compareFunction&&(r.texParameteri(A,r.TEXTURE_COMPARE_MODE,r.COMPARE_REF_TO_TEXTURE),r.texParameteri(A,r.TEXTURE_COMPARE_FUNC,O[R.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){let q=e.get("EXT_texture_filter_anisotropic");if(R.magFilter===At||R.minFilter!==vo&&R.minFilter!==ta||R.type===Yn&&e.has("OES_texture_float_linear")===!1||o===!1&&R.type===Ur&&e.has("OES_texture_half_float_linear")===!1)return;(R.anisotropy>1||n.get(R).__currentAnisotropy)&&(r.texParameterf(A,q.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(R.anisotropy,i.getMaxAnisotropy())),n.get(R).__currentAnisotropy=R.anisotropy)}}function ee(A,R){let z=!1;A.__webglInit===void 0&&(A.__webglInit=!0,R.addEventListener("dispose",M));let q=R.source,L=d.get(q);L===void 0&&(L={},d.set(q,L));let j=function(U){let F=[];return F.push(U.wrapS),F.push(U.wrapT),F.push(U.wrapR||0),F.push(U.magFilter),F.push(U.minFilter),F.push(U.anisotropy),F.push(U.internalFormat),F.push(U.format),F.push(U.type),F.push(U.generateMipmaps),F.push(U.premultiplyAlpha),F.push(U.flipY),F.push(U.unpackAlignment),F.push(U.colorSpace),F.join()}(R);if(j!==A.__cacheKey){L[j]===void 0&&(L[j]={texture:r.createTexture(),usedTimes:0},a.memory.textures++,z=!0),L[j].usedTimes++;let U=L[A.__cacheKey];U!==void 0&&(L[A.__cacheKey].usedTimes--,U.usedTimes===0&&N(R)),A.__cacheKey=j,A.__webglTexture=L[j].texture}return z}function oe(A,R,z){let q=r.TEXTURE_2D;(R.isDataArrayTexture||R.isCompressedArrayTexture)&&(q=r.TEXTURE_2D_ARRAY),R.isData3DTexture&&(q=r.TEXTURE_3D);let L=ee(A,R),j=R.source;t.bindTexture(q,A.__webglTexture,r.TEXTURE0+z);let U=n.get(j);if(j.version!==U.__version||L===!0){t.activeTexture(r.TEXTURE0+z);let F=qe.getPrimaries(qe.workingColorSpace),G=R.colorSpace===cn?null:qe.getPrimaries(R.colorSpace),te=R.colorSpace===cn||F===G?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,R.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,R.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,R.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,te);let Q=function(_e){return!o&&(_e.wrapS!==Rn||_e.wrapT!==Rn||_e.minFilter!==At&&_e.minFilter!==en)}(R)&&m(R.image)===!1,S=v(R.image,Q,!1,i.maxTextureSize);S=he(R,S);let re=m(S)||o,V=s.convert(R.format,R.colorSpace),W,se=s.convert(R.type),ce=_(R.internalFormat,V,se,R.colorSpace,R.isVideoTexture);k(q,R,re);let de=R.mipmaps,pe=o&&R.isVideoTexture!==!0&&ce!==Bu,Se=U.__version===void 0||L===!0,me=b(R,S,re);if(R.isDepthTexture)ce=r.DEPTH_COMPONENT,o?ce=R.type===Yn?r.DEPTH_COMPONENT32F:R.type===qn?r.DEPTH_COMPONENT24:R.type===pi?r.DEPTH24_STENCIL8:r.DEPTH_COMPONENT16:R.type===Yn&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),R.format===mi&&ce===r.DEPTH_COMPONENT&&R.type!==dc&&R.type!==qn&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),R.type=qn,se=s.convert(R.type)),R.format===ir&&ce===r.DEPTH_COMPONENT&&(ce=r.DEPTH_STENCIL,R.type!==pi&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),R.type=pi,se=s.convert(R.type))),Se&&(pe?t.texStorage2D(r.TEXTURE_2D,1,ce,S.width,S.height):t.texImage2D(r.TEXTURE_2D,0,ce,S.width,S.height,0,V,se,null));else if(R.isDataTexture)if(de.length>0&&re){pe&&Se&&t.texStorage2D(r.TEXTURE_2D,me,ce,de[0].width,de[0].height);for(let _e=0,Ce=de.length;_e<Ce;_e++)W=de[_e],pe?t.texSubImage2D(r.TEXTURE_2D,_e,0,0,W.width,W.height,V,se,W.data):t.texImage2D(r.TEXTURE_2D,_e,ce,W.width,W.height,0,V,se,W.data);R.generateMipmaps=!1}else pe?(Se&&t.texStorage2D(r.TEXTURE_2D,me,ce,S.width,S.height),t.texSubImage2D(r.TEXTURE_2D,0,0,0,S.width,S.height,V,se,S.data)):t.texImage2D(r.TEXTURE_2D,0,ce,S.width,S.height,0,V,se,S.data);else if(R.isCompressedTexture)if(R.isCompressedArrayTexture){pe&&Se&&t.texStorage3D(r.TEXTURE_2D_ARRAY,me,ce,de[0].width,de[0].height,S.depth);for(let _e=0,Ce=de.length;_e<Ce;_e++)W=de[_e],R.format!==ln?V!==null?pe?t.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,_e,0,0,0,W.width,W.height,S.depth,V,W.data,0,0):t.compressedTexImage3D(r.TEXTURE_2D_ARRAY,_e,ce,W.width,W.height,S.depth,0,W.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):pe?t.texSubImage3D(r.TEXTURE_2D_ARRAY,_e,0,0,0,W.width,W.height,S.depth,V,se,W.data):t.texImage3D(r.TEXTURE_2D_ARRAY,_e,ce,W.width,W.height,S.depth,0,V,se,W.data)}else{pe&&Se&&t.texStorage2D(r.TEXTURE_2D,me,ce,de[0].width,de[0].height);for(let _e=0,Ce=de.length;_e<Ce;_e++)W=de[_e],R.format!==ln?V!==null?pe?t.compressedTexSubImage2D(r.TEXTURE_2D,_e,0,0,W.width,W.height,V,W.data):t.compressedTexImage2D(r.TEXTURE_2D,_e,ce,W.width,W.height,0,W.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):pe?t.texSubImage2D(r.TEXTURE_2D,_e,0,0,W.width,W.height,V,se,W.data):t.texImage2D(r.TEXTURE_2D,_e,ce,W.width,W.height,0,V,se,W.data)}else if(R.isDataArrayTexture)pe?(Se&&t.texStorage3D(r.TEXTURE_2D_ARRAY,me,ce,S.width,S.height,S.depth),t.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,0,S.width,S.height,S.depth,V,se,S.data)):t.texImage3D(r.TEXTURE_2D_ARRAY,0,ce,S.width,S.height,S.depth,0,V,se,S.data);else if(R.isData3DTexture)pe?(Se&&t.texStorage3D(r.TEXTURE_3D,me,ce,S.width,S.height,S.depth),t.texSubImage3D(r.TEXTURE_3D,0,0,0,0,S.width,S.height,S.depth,V,se,S.data)):t.texImage3D(r.TEXTURE_3D,0,ce,S.width,S.height,S.depth,0,V,se,S.data);else if(R.isFramebufferTexture){if(Se)if(pe)t.texStorage2D(r.TEXTURE_2D,me,ce,S.width,S.height);else{let _e=S.width,Ce=S.height;for(let lt=0;lt<me;lt++)t.texImage2D(r.TEXTURE_2D,lt,ce,_e,Ce,0,V,se,null),_e>>=1,Ce>>=1}}else if(de.length>0&&re){pe&&Se&&t.texStorage2D(r.TEXTURE_2D,me,ce,de[0].width,de[0].height);for(let _e=0,Ce=de.length;_e<Ce;_e++)W=de[_e],pe?t.texSubImage2D(r.TEXTURE_2D,_e,0,0,V,se,W):t.texImage2D(r.TEXTURE_2D,_e,ce,V,se,W);R.generateMipmaps=!1}else pe?(Se&&t.texStorage2D(r.TEXTURE_2D,me,ce,S.width,S.height),t.texSubImage2D(r.TEXTURE_2D,0,0,0,V,se,S)):t.texImage2D(r.TEXTURE_2D,0,ce,V,se,S);y(R,re)&&g(q),U.__version=j.version,R.onUpdate&&R.onUpdate(R)}A.__version=R.version}function K(A,R,z,q,L,j){let U=s.convert(z.format,z.colorSpace),F=s.convert(z.type),G=_(z.internalFormat,U,F,z.colorSpace);if(!n.get(R).__hasExternalTextures){let te=Math.max(1,R.width>>j),Q=Math.max(1,R.height>>j);L===r.TEXTURE_3D||L===r.TEXTURE_2D_ARRAY?t.texImage3D(L,j,G,te,Q,R.depth,0,U,F,null):t.texImage2D(L,j,G,te,Q,0,U,F,null)}t.bindFramebuffer(r.FRAMEBUFFER,A),Y(R)?l.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,q,L,n.get(z).__webglTexture,0,H(R)):(L===r.TEXTURE_2D||L>=r.TEXTURE_CUBE_MAP_POSITIVE_X&&L<=r.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&r.framebufferTexture2D(r.FRAMEBUFFER,q,L,n.get(z).__webglTexture,j),t.bindFramebuffer(r.FRAMEBUFFER,null)}function X(A,R,z){if(r.bindRenderbuffer(r.RENDERBUFFER,A),R.depthBuffer&&!R.stencilBuffer){let q=o===!0?r.DEPTH_COMPONENT24:r.DEPTH_COMPONENT16;if(z||Y(R)){let L=R.depthTexture;L&&L.isDepthTexture&&(L.type===Yn?q=r.DEPTH_COMPONENT32F:L.type===qn&&(q=r.DEPTH_COMPONENT24));let j=H(R);Y(R)?l.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,j,q,R.width,R.height):r.renderbufferStorageMultisample(r.RENDERBUFFER,j,q,R.width,R.height)}else r.renderbufferStorage(r.RENDERBUFFER,q,R.width,R.height);r.framebufferRenderbuffer(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.RENDERBUFFER,A)}else if(R.depthBuffer&&R.stencilBuffer){let q=H(R);z&&Y(R)===!1?r.renderbufferStorageMultisample(r.RENDERBUFFER,q,r.DEPTH24_STENCIL8,R.width,R.height):Y(R)?l.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,q,r.DEPTH24_STENCIL8,R.width,R.height):r.renderbufferStorage(r.RENDERBUFFER,r.DEPTH_STENCIL,R.width,R.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.RENDERBUFFER,A)}else{let q=R.isWebGLMultipleRenderTargets===!0?R.texture:[R.texture];for(let L=0;L<q.length;L++){let j=q[L],U=s.convert(j.format,j.colorSpace),F=s.convert(j.type),G=_(j.internalFormat,U,F,j.colorSpace),te=H(R);z&&Y(R)===!1?r.renderbufferStorageMultisample(r.RENDERBUFFER,te,G,R.width,R.height):Y(R)?l.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,te,G,R.width,R.height):r.renderbufferStorage(r.RENDERBUFFER,G,R.width,R.height)}}r.bindRenderbuffer(r.RENDERBUFFER,null)}function J(A){let R=n.get(A),z=A.isWebGLCubeRenderTarget===!0;if(A.depthTexture&&!R.__autoAllocateDepthBuffer){if(z)throw new Error("target.depthTexture not supported in Cube render targets");(function(q,L){if(L&&L.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(r.FRAMEBUFFER,q),!L.depthTexture||!L.depthTexture.isDepthTexture)throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");n.get(L.depthTexture).__webglTexture&&L.depthTexture.image.width===L.width&&L.depthTexture.image.height===L.height||(L.depthTexture.image.width=L.width,L.depthTexture.image.height=L.height,L.depthTexture.needsUpdate=!0),B(L.depthTexture,0);let j=n.get(L.depthTexture).__webglTexture,U=H(L);if(L.depthTexture.format===mi)Y(L)?l.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,j,0,U):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,j,0);else{if(L.depthTexture.format!==ir)throw new Error("Unknown depthTexture format");Y(L)?l.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,j,0,U):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,j,0)}})(R.__webglFramebuffer,A)}else if(z){R.__webglDepthbuffer=[];for(let q=0;q<6;q++)t.bindFramebuffer(r.FRAMEBUFFER,R.__webglFramebuffer[q]),R.__webglDepthbuffer[q]=r.createRenderbuffer(),X(R.__webglDepthbuffer[q],A,!1)}else t.bindFramebuffer(r.FRAMEBUFFER,R.__webglFramebuffer),R.__webglDepthbuffer=r.createRenderbuffer(),X(R.__webglDepthbuffer,A,!1);t.bindFramebuffer(r.FRAMEBUFFER,null)}function H(A){return Math.min(i.maxSamples,A.samples)}function Y(A){let R=n.get(A);return o&&A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&R.__useRenderToTexture!==!1}function he(A,R){let z=A.colorSpace,q=A.format,L=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||A.format===hl||z!==Cn&&z!==cn&&(qe.getTransfer(z)===Ke?o===!1?e.has("EXT_sRGB")===!0&&q===ln?(A.format=hl,A.minFilter=en,A.generateMipmaps=!1):R=ca.sRGBToLinear(R):q===ln&&L===di||console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",z)),R}this.allocateTextureUnit=function(){let A=I;return A>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+A+" texture units while this GPU supports only "+i.maxTextures),I+=1,A},this.resetTextureUnits=function(){I=0},this.setTexture2D=B,this.setTexture2DArray=function(A,R){let z=n.get(A);A.version>0&&z.__version!==A.version?oe(z,A,R):t.bindTexture(r.TEXTURE_2D_ARRAY,z.__webglTexture,r.TEXTURE0+R)},this.setTexture3D=function(A,R){let z=n.get(A);A.version>0&&z.__version!==A.version?oe(z,A,R):t.bindTexture(r.TEXTURE_3D,z.__webglTexture,r.TEXTURE0+R)},this.setTextureCube=function(A,R){let z=n.get(A);A.version>0&&z.__version!==A.version?function(q,L,j){if(L.image.length!==6)return;let U=ee(q,L),F=L.source;t.bindTexture(r.TEXTURE_CUBE_MAP,q.__webglTexture,r.TEXTURE0+j);let G=n.get(F);if(F.version!==G.__version||U===!0){t.activeTexture(r.TEXTURE0+j);let te=qe.getPrimaries(qe.workingColorSpace),Q=L.colorSpace===cn?null:qe.getPrimaries(L.colorSpace),S=L.colorSpace===cn||te===Q?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,L.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,L.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,L.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,S);let re=L.isCompressedTexture||L.image[0].isCompressedTexture,V=L.image[0]&&L.image[0].isDataTexture,W=[];for(let ye=0;ye<6;ye++)W[ye]=re||V?V?L.image[ye].image:L.image[ye]:v(L.image[ye],!1,!0,i.maxCubemapSize),W[ye]=he(L,W[ye]);let se=W[0],ce=m(se)||o,de=s.convert(L.format,L.colorSpace),pe=s.convert(L.type),Se=_(L.internalFormat,de,pe,L.colorSpace),me=o&&L.isVideoTexture!==!0,_e=G.__version===void 0||U===!0,Ce,lt=b(L,se,ce);if(k(r.TEXTURE_CUBE_MAP,L,ce),re){me&&_e&&t.texStorage2D(r.TEXTURE_CUBE_MAP,lt,Se,se.width,se.height);for(let ye=0;ye<6;ye++){Ce=W[ye].mipmaps;for(let Ne=0;Ne<Ce.length;Ne++){let Ue=Ce[Ne];L.format!==ln?de!==null?me?t.compressedTexSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ye,Ne,0,0,Ue.width,Ue.height,de,Ue.data):t.compressedTexImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ye,Ne,Se,Ue.width,Ue.height,0,Ue.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):me?t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ye,Ne,0,0,Ue.width,Ue.height,de,pe,Ue.data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ye,Ne,Se,Ue.width,Ue.height,0,de,pe,Ue.data)}}}else{Ce=L.mipmaps,me&&_e&&(Ce.length>0&&lt++,t.texStorage2D(r.TEXTURE_CUBE_MAP,lt,Se,W[0].width,W[0].height));for(let ye=0;ye<6;ye++)if(V){me?t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ye,0,0,0,W[ye].width,W[ye].height,de,pe,W[ye].data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ye,0,Se,W[ye].width,W[ye].height,0,de,pe,W[ye].data);for(let Ne=0;Ne<Ce.length;Ne++){let Ue=Ce[Ne].image[ye].image;me?t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ye,Ne+1,0,0,Ue.width,Ue.height,de,pe,Ue.data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ye,Ne+1,Se,Ue.width,Ue.height,0,de,pe,Ue.data)}}else{me?t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ye,0,0,0,de,pe,W[ye]):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ye,0,Se,de,pe,W[ye]);for(let Ne=0;Ne<Ce.length;Ne++){let Ue=Ce[Ne];me?t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ye,Ne+1,0,0,de,pe,Ue.image[ye]):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ye,Ne+1,Se,de,pe,Ue.image[ye])}}}y(L,ce)&&g(r.TEXTURE_CUBE_MAP),G.__version=F.version,L.onUpdate&&L.onUpdate(L)}q.__version=L.version}(z,A,R):t.bindTexture(r.TEXTURE_CUBE_MAP,z.__webglTexture,r.TEXTURE0+R)},this.rebindTextures=function(A,R,z){let q=n.get(A);R!==void 0&&K(q.__webglFramebuffer,A,A.texture,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,0),z!==void 0&&J(A)},this.setupRenderTarget=function(A){let R=A.texture,z=n.get(A),q=n.get(R);A.addEventListener("dispose",E),A.isWebGLMultipleRenderTargets!==!0&&(q.__webglTexture===void 0&&(q.__webglTexture=r.createTexture()),q.__version=R.version,a.memory.textures++);let L=A.isWebGLCubeRenderTarget===!0,j=A.isWebGLMultipleRenderTargets===!0,U=m(A)||o;if(L){z.__webglFramebuffer=[];for(let F=0;F<6;F++)if(o&&R.mipmaps&&R.mipmaps.length>0){z.__webglFramebuffer[F]=[];for(let G=0;G<R.mipmaps.length;G++)z.__webglFramebuffer[F][G]=r.createFramebuffer()}else z.__webglFramebuffer[F]=r.createFramebuffer()}else{if(o&&R.mipmaps&&R.mipmaps.length>0){z.__webglFramebuffer=[];for(let F=0;F<R.mipmaps.length;F++)z.__webglFramebuffer[F]=r.createFramebuffer()}else z.__webglFramebuffer=r.createFramebuffer();if(j)if(i.drawBuffers){let F=A.texture;for(let G=0,te=F.length;G<te;G++){let Q=n.get(F[G]);Q.__webglTexture===void 0&&(Q.__webglTexture=r.createTexture(),a.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(o&&A.samples>0&&Y(A)===!1){let F=j?R:[R];z.__webglMultisampledFramebuffer=r.createFramebuffer(),z.__webglColorRenderbuffer=[],t.bindFramebuffer(r.FRAMEBUFFER,z.__webglMultisampledFramebuffer);for(let G=0;G<F.length;G++){let te=F[G];z.__webglColorRenderbuffer[G]=r.createRenderbuffer(),r.bindRenderbuffer(r.RENDERBUFFER,z.__webglColorRenderbuffer[G]);let Q=s.convert(te.format,te.colorSpace),S=s.convert(te.type),re=_(te.internalFormat,Q,S,te.colorSpace,A.isXRRenderTarget===!0),V=H(A);r.renderbufferStorageMultisample(r.RENDERBUFFER,V,re,A.width,A.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+G,r.RENDERBUFFER,z.__webglColorRenderbuffer[G])}r.bindRenderbuffer(r.RENDERBUFFER,null),A.depthBuffer&&(z.__webglDepthRenderbuffer=r.createRenderbuffer(),X(z.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(r.FRAMEBUFFER,null)}}if(L){t.bindTexture(r.TEXTURE_CUBE_MAP,q.__webglTexture),k(r.TEXTURE_CUBE_MAP,R,U);for(let F=0;F<6;F++)if(o&&R.mipmaps&&R.mipmaps.length>0)for(let G=0;G<R.mipmaps.length;G++)K(z.__webglFramebuffer[F][G],A,R,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+F,G);else K(z.__webglFramebuffer[F],A,R,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+F,0);y(R,U)&&g(r.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(j){let F=A.texture;for(let G=0,te=F.length;G<te;G++){let Q=F[G],S=n.get(Q);t.bindTexture(r.TEXTURE_2D,S.__webglTexture),k(r.TEXTURE_2D,Q,U),K(z.__webglFramebuffer,A,Q,r.COLOR_ATTACHMENT0+G,r.TEXTURE_2D,0),y(Q,U)&&g(r.TEXTURE_2D)}t.unbindTexture()}else{let F=r.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(o?F=A.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(F,q.__webglTexture),k(F,R,U),o&&R.mipmaps&&R.mipmaps.length>0)for(let G=0;G<R.mipmaps.length;G++)K(z.__webglFramebuffer[G],A,R,r.COLOR_ATTACHMENT0,F,G);else K(z.__webglFramebuffer,A,R,r.COLOR_ATTACHMENT0,F,0);y(R,U)&&g(F),t.unbindTexture()}A.depthBuffer&&J(A)},this.updateRenderTargetMipmap=function(A){let R=m(A)||o,z=A.isWebGLMultipleRenderTargets===!0?A.texture:[A.texture];for(let q=0,L=z.length;q<L;q++){let j=z[q];if(y(j,R)){let U=A.isWebGLCubeRenderTarget?r.TEXTURE_CUBE_MAP:r.TEXTURE_2D,F=n.get(j).__webglTexture;t.bindTexture(U,F),g(U),t.unbindTexture()}}},this.updateMultisampleRenderTarget=function(A){if(o&&A.samples>0&&Y(A)===!1){let R=A.isWebGLMultipleRenderTargets?A.texture:[A.texture],z=A.width,q=A.height,L=r.COLOR_BUFFER_BIT,j=[],U=A.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,F=n.get(A),G=A.isWebGLMultipleRenderTargets===!0;if(G)for(let te=0;te<R.length;te++)t.bindFramebuffer(r.FRAMEBUFFER,F.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+te,r.RENDERBUFFER,null),t.bindFramebuffer(r.FRAMEBUFFER,F.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+te,r.TEXTURE_2D,null,0);t.bindFramebuffer(r.READ_FRAMEBUFFER,F.__webglMultisampledFramebuffer),t.bindFramebuffer(r.DRAW_FRAMEBUFFER,F.__webglFramebuffer);for(let te=0;te<R.length;te++){j.push(r.COLOR_ATTACHMENT0+te),A.depthBuffer&&j.push(U);let Q=F.__ignoreDepthValues!==void 0&&F.__ignoreDepthValues;if(Q===!1&&(A.depthBuffer&&(L|=r.DEPTH_BUFFER_BIT),A.stencilBuffer&&(L|=r.STENCIL_BUFFER_BIT)),G&&r.framebufferRenderbuffer(r.READ_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.RENDERBUFFER,F.__webglColorRenderbuffer[te]),Q===!0&&(r.invalidateFramebuffer(r.READ_FRAMEBUFFER,[U]),r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,[U])),G){let S=n.get(R[te]).__webglTexture;r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,S,0)}r.blitFramebuffer(0,0,z,q,0,0,z,q,L,r.NEAREST),c&&r.invalidateFramebuffer(r.READ_FRAMEBUFFER,j)}if(t.bindFramebuffer(r.READ_FRAMEBUFFER,null),t.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),G)for(let te=0;te<R.length;te++){t.bindFramebuffer(r.FRAMEBUFFER,F.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+te,r.RENDERBUFFER,F.__webglColorRenderbuffer[te]);let Q=n.get(R[te]).__webglTexture;t.bindFramebuffer(r.FRAMEBUFFER,F.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+te,r.TEXTURE_2D,Q,0)}t.bindFramebuffer(r.DRAW_FRAMEBUFFER,F.__webglMultisampledFramebuffer)}},this.setupDepthRenderbuffer=J,this.setupFrameBufferTexture=K,this.useMultisampledRTT=Y}function Wm(r,e,t){let n=t.isWebGL2;return{convert:function(i,s=""){let a,o=qe.getTransfer(s);if(i===di)return r.UNSIGNED_BYTE;if(i===Du)return r.UNSIGNED_SHORT_4_4_4_4;if(i===Nu)return r.UNSIGNED_SHORT_5_5_5_1;if(i===1010)return r.BYTE;if(i===1011)return r.SHORT;if(i===dc)return r.UNSIGNED_SHORT;if(i===Iu)return r.INT;if(i===qn)return r.UNSIGNED_INT;if(i===Yn)return r.FLOAT;if(i===Ur)return n?r.HALF_FLOAT:(a=e.get("OES_texture_half_float"),a!==null?a.HALF_FLOAT_OES:null);if(i===1021)return r.ALPHA;if(i===ln)return r.RGBA;if(i===1024)return r.LUMINANCE;if(i===1025)return r.LUMINANCE_ALPHA;if(i===mi)return r.DEPTH_COMPONENT;if(i===ir)return r.DEPTH_STENCIL;if(i===hl)return a=e.get("EXT_sRGB"),a!==null?a.SRGB_ALPHA_EXT:null;if(i===1028)return r.RED;if(i===Uu)return r.RED_INTEGER;if(i===1030)return r.RG;if(i===Ou)return r.RG_INTEGER;if(i===Fu)return r.RGBA_INTEGER;if(i===yo||i===xo||i===bo||i===Mo)if(o===Ke){if(a=e.get("WEBGL_compressed_texture_s3tc_srgb"),a===null)return null;if(i===yo)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===xo)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===bo)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Mo)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else{if(a=e.get("WEBGL_compressed_texture_s3tc"),a===null)return null;if(i===yo)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===xo)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===bo)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Mo)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}if(i===Xc||i===qc||i===Yc||i===Zc){if(a=e.get("WEBGL_compressed_texture_pvrtc"),a===null)return null;if(i===Xc)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===qc)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Yc)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Zc)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}if(i===Bu)return a=e.get("WEBGL_compressed_texture_etc1"),a!==null?a.COMPRESSED_RGB_ETC1_WEBGL:null;if(i===Jc||i===Kc){if(a=e.get("WEBGL_compressed_texture_etc"),a===null)return null;if(i===Jc)return o===Ke?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(i===Kc)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC}if(i===Qc||i===eh||i===th||i===nh||i===ih||i===rh||i===sh||i===ah||i===oh||i===lh||i===ch||i===hh||i===uh||i===dh){if(a=e.get("WEBGL_compressed_texture_astc"),a===null)return null;if(i===Qc)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===eh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===th)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===nh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===ih)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===rh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===sh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===ah)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===oh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===lh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===ch)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===hh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===uh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===dh)return o===Ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}if(i===So||i===ph||i===mh){if(a=e.get("EXT_texture_compression_bptc"),a===null)return null;if(i===So)return o===Ke?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===ph)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===mh)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}if(i===36283||i===fh||i===gh||i===_h){if(a=e.get("EXT_texture_compression_rgtc"),a===null)return null;if(i===So)return a.COMPRESSED_RED_RGTC1_EXT;if(i===fh)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===gh)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===_h)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}return i===pi?n?r.UNSIGNED_INT_24_8:(a=e.get("WEBGL_depth_texture"),a!==null?a.UNSIGNED_INT_24_8_WEBGL:null):r[i]!==void 0?r[i]:null}}}function jm(r,e){function t(i,s){i.matrixAutoUpdate===!0&&i.updateMatrix(),s.value.copy(i.matrix)}function n(i,s){i.opacity.value=s.opacity,s.color&&i.diffuse.value.copy(s.color),s.emissive&&i.emissive.value.copy(s.emissive).multiplyScalar(s.emissiveIntensity),s.map&&(i.map.value=s.map,t(s.map,i.mapTransform)),s.alphaMap&&(i.alphaMap.value=s.alphaMap,t(s.alphaMap,i.alphaMapTransform)),s.bumpMap&&(i.bumpMap.value=s.bumpMap,t(s.bumpMap,i.bumpMapTransform),i.bumpScale.value=s.bumpScale,s.side===It&&(i.bumpScale.value*=-1)),s.normalMap&&(i.normalMap.value=s.normalMap,t(s.normalMap,i.normalMapTransform),i.normalScale.value.copy(s.normalScale),s.side===It&&i.normalScale.value.negate()),s.displacementMap&&(i.displacementMap.value=s.displacementMap,t(s.displacementMap,i.displacementMapTransform),i.displacementScale.value=s.displacementScale,i.displacementBias.value=s.displacementBias),s.emissiveMap&&(i.emissiveMap.value=s.emissiveMap,t(s.emissiveMap,i.emissiveMapTransform)),s.specularMap&&(i.specularMap.value=s.specularMap,t(s.specularMap,i.specularMapTransform)),s.alphaTest>0&&(i.alphaTest.value=s.alphaTest);let a=e.get(s).envMap;if(a&&(i.envMap.value=a,i.flipEnvMap.value=a.isCubeTexture&&a.isRenderTargetTexture===!1?-1:1,i.reflectivity.value=s.reflectivity,i.ior.value=s.ior,i.refractionRatio.value=s.refractionRatio),s.lightMap){i.lightMap.value=s.lightMap;let o=r._useLegacyLights===!0?Math.PI:1;i.lightMapIntensity.value=s.lightMapIntensity*o,t(s.lightMap,i.lightMapTransform)}s.aoMap&&(i.aoMap.value=s.aoMap,i.aoMapIntensity.value=s.aoMapIntensity,t(s.aoMap,i.aoMapTransform))}return{refreshFogUniforms:function(i,s){s.color.getRGB(i.fogColor.value,Vu(r)),s.isFog?(i.fogNear.value=s.near,i.fogFar.value=s.far):s.isFogExp2&&(i.fogDensity.value=s.density)},refreshMaterialUniforms:function(i,s,a,o,l){s.isMeshBasicMaterial||s.isMeshLambertMaterial?n(i,s):s.isMeshToonMaterial?(n(i,s),function(c,h){h.gradientMap&&(c.gradientMap.value=h.gradientMap)}(i,s)):s.isMeshPhongMaterial?(n(i,s),function(c,h){c.specular.value.copy(h.specular),c.shininess.value=Math.max(h.shininess,1e-4)}(i,s)):s.isMeshStandardMaterial?(n(i,s),function(c,h){c.metalness.value=h.metalness,h.metalnessMap&&(c.metalnessMap.value=h.metalnessMap,t(h.metalnessMap,c.metalnessMapTransform)),c.roughness.value=h.roughness,h.roughnessMap&&(c.roughnessMap.value=h.roughnessMap,t(h.roughnessMap,c.roughnessMapTransform)),e.get(h).envMap&&(c.envMapIntensity.value=h.envMapIntensity)}(i,s),s.isMeshPhysicalMaterial&&function(c,h,u){c.ior.value=h.ior,h.sheen>0&&(c.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),c.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(c.sheenColorMap.value=h.sheenColorMap,t(h.sheenColorMap,c.sheenColorMapTransform)),h.sheenRoughnessMap&&(c.sheenRoughnessMap.value=h.sheenRoughnessMap,t(h.sheenRoughnessMap,c.sheenRoughnessMapTransform))),h.clearcoat>0&&(c.clearcoat.value=h.clearcoat,c.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(c.clearcoatMap.value=h.clearcoatMap,t(h.clearcoatMap,c.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(c.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,t(h.clearcoatRoughnessMap,c.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(c.clearcoatNormalMap.value=h.clearcoatNormalMap,t(h.clearcoatNormalMap,c.clearcoatNormalMapTransform),c.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===It&&c.clearcoatNormalScale.value.negate())),h.iridescence>0&&(c.iridescence.value=h.iridescence,c.iridescenceIOR.value=h.iridescenceIOR,c.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],c.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(c.iridescenceMap.value=h.iridescenceMap,t(h.iridescenceMap,c.iridescenceMapTransform)),h.iridescenceThicknessMap&&(c.iridescenceThicknessMap.value=h.iridescenceThicknessMap,t(h.iridescenceThicknessMap,c.iridescenceThicknessMapTransform))),h.transmission>0&&(c.transmission.value=h.transmission,c.transmissionSamplerMap.value=u.texture,c.transmissionSamplerSize.value.set(u.width,u.height),h.transmissionMap&&(c.transmissionMap.value=h.transmissionMap,t(h.transmissionMap,c.transmissionMapTransform)),c.thickness.value=h.thickness,h.thicknessMap&&(c.thicknessMap.value=h.thicknessMap,t(h.thicknessMap,c.thicknessMapTransform)),c.attenuationDistance.value=h.attenuationDistance,c.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(c.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(c.anisotropyMap.value=h.anisotropyMap,t(h.anisotropyMap,c.anisotropyMapTransform))),c.specularIntensity.value=h.specularIntensity,c.specularColor.value.copy(h.specularColor),h.specularColorMap&&(c.specularColorMap.value=h.specularColorMap,t(h.specularColorMap,c.specularColorMapTransform)),h.specularIntensityMap&&(c.specularIntensityMap.value=h.specularIntensityMap,t(h.specularIntensityMap,c.specularIntensityMapTransform))}(i,s,l)):s.isMeshMatcapMaterial?(n(i,s),function(c,h){h.matcap&&(c.matcap.value=h.matcap)}(i,s)):s.isMeshDepthMaterial?n(i,s):s.isMeshDistanceMaterial?(n(i,s),function(c,h){let u=e.get(h).light;c.referencePosition.value.setFromMatrixPosition(u.matrixWorld),c.nearDistance.value=u.shadow.camera.near,c.farDistance.value=u.shadow.camera.far}(i,s)):s.isMeshNormalMaterial?n(i,s):s.isLineBasicMaterial?(function(c,h){c.diffuse.value.copy(h.color),c.opacity.value=h.opacity,h.map&&(c.map.value=h.map,t(h.map,c.mapTransform))}(i,s),s.isLineDashedMaterial&&function(c,h){c.dashSize.value=h.dashSize,c.totalSize.value=h.dashSize+h.gapSize,c.scale.value=h.scale}(i,s)):s.isPointsMaterial?function(c,h,u,d){c.diffuse.value.copy(h.color),c.opacity.value=h.opacity,c.size.value=h.size*u,c.scale.value=.5*d,h.map&&(c.map.value=h.map,t(h.map,c.uvTransform)),h.alphaMap&&(c.alphaMap.value=h.alphaMap,t(h.alphaMap,c.alphaMapTransform)),h.alphaTest>0&&(c.alphaTest.value=h.alphaTest)}(i,s,a,o):s.isSpriteMaterial?function(c,h){c.diffuse.value.copy(h.color),c.opacity.value=h.opacity,c.rotation.value=h.rotation,h.map&&(c.map.value=h.map,t(h.map,c.mapTransform)),h.alphaMap&&(c.alphaMap.value=h.alphaMap,t(h.alphaMap,c.alphaMapTransform)),h.alphaTest>0&&(c.alphaTest.value=h.alphaTest)}(i,s):s.isShadowMaterial?(i.color.value.copy(s.color),i.opacity.value=s.opacity):s.isShaderMaterial&&(s.uniformsNeedUpdate=!1)}}}function Xm(r,e,t,n){let i={},s={},a=[],o=t.isWebGL2?r.getParameter(r.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(u,d,p,f){let v=u.value,m=d+"_"+p;if(f[m]===void 0)return f[m]=typeof v=="number"||typeof v=="boolean"?v:v.clone(),!0;{let y=f[m];if(typeof v=="number"||typeof v=="boolean"){if(y!==v)return f[m]=v,!0}else if(y.equals(v)===!1)return y.copy(v),!0}return!1}function c(u){let d={boundary:0,storage:0};return typeof u=="number"||typeof u=="boolean"?(d.boundary=4,d.storage=4):u.isVector2?(d.boundary=8,d.storage=8):u.isVector3||u.isColor?(d.boundary=16,d.storage=12):u.isVector4?(d.boundary=16,d.storage=16):u.isMatrix3?(d.boundary=48,d.storage=48):u.isMatrix4?(d.boundary=64,d.storage=64):u.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",u),d}function h(u){let d=u.target;d.removeEventListener("dispose",h);let p=a.indexOf(d.__bindingPointIndex);a.splice(p,1),r.deleteBuffer(i[d.id]),delete i[d.id],delete s[d.id]}return{bind:function(u,d){let p=d.program;n.uniformBlockBinding(u,p)},update:function(u,d){let p=i[u.id];p===void 0&&(function(m){let y=m.uniforms,g=0,_=16;for(let T=0,M=y.length;T<M;T++){let E=Array.isArray(y[T])?y[T]:[y[T]];for(let N=0,I=E.length;N<I;N++){let B=E[N],D=Array.isArray(B.value)?B.value:[B.value];for(let P=0,O=D.length;P<O;P++){let k=c(D[P]),ee=g%_;ee!==0&&_-ee<k.boundary&&(g+=_-ee),B.__data=new Float32Array(k.storage/Float32Array.BYTES_PER_ELEMENT),B.__offset=g,g+=k.storage}}}let b=g%_;b>0&&(g+=_-b),m.__size=g,m.__cache={}}(u),p=function(m){let y=function(){for(let T=0;T<o;T++)if(a.indexOf(T)===-1)return a.push(T),T;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}();m.__bindingPointIndex=y;let g=r.createBuffer(),_=m.__size,b=m.usage;return r.bindBuffer(r.UNIFORM_BUFFER,g),r.bufferData(r.UNIFORM_BUFFER,_,b),r.bindBuffer(r.UNIFORM_BUFFER,null),r.bindBufferBase(r.UNIFORM_BUFFER,y,g),g}(u),i[u.id]=p,u.addEventListener("dispose",h));let f=d.program;n.updateUBOMapping(u,f);let v=e.render.frame;s[u.id]!==v&&(function(m){let y=i[m.id],g=m.uniforms,_=m.__cache;r.bindBuffer(r.UNIFORM_BUFFER,y);for(let b=0,T=g.length;b<T;b++){let M=Array.isArray(g[b])?g[b]:[g[b]];for(let E=0,N=M.length;E<N;E++){let I=M[E];if(l(I,b,E,_)===!0){let B=I.__offset,D=Array.isArray(I.value)?I.value:[I.value],P=0;for(let O=0;O<D.length;O++){let k=D[O],ee=c(k);typeof k=="number"||typeof k=="boolean"?(I.__data[0]=k,r.bufferSubData(r.UNIFORM_BUFFER,B+P,I.__data)):k.isMatrix3?(I.__data[0]=k.elements[0],I.__data[1]=k.elements[1],I.__data[2]=k.elements[2],I.__data[3]=0,I.__data[4]=k.elements[3],I.__data[5]=k.elements[4],I.__data[6]=k.elements[5],I.__data[7]=0,I.__data[8]=k.elements[6],I.__data[9]=k.elements[7],I.__data[10]=k.elements[8],I.__data[11]=0):(k.toArray(I.__data,P),P+=ee.storage/Float32Array.BYTES_PER_ELEMENT)}r.bufferSubData(r.UNIFORM_BUFFER,B,I.__data)}}}r.bindBuffer(r.UNIFORM_BUFFER,null)}(u),s[u.id]=v)},dispose:function(){for(let u in i)r.deleteBuffer(i[u]);a=[],i={},s={}}}}function Vs(r,e,t,n,i,s){Yi.subVectors(r,t).addScalar(.5).multiply(n),i!==void 0?(Tr.x=s*Yi.x-i*Yi.y,Tr.y=i*Yi.x+s*Yi.y):Tr.copy(Yi),r.copy(e),r.x+=Tr.x,r.y+=Tr.y,r.applyMatrix4(Zu)}function mu(r,e,t,n,i,s,a){let o=Pl.distanceSqToPoint(r);if(o<t){let l=new w;Pl.closestPointToPoint(r,l),l.applyMatrix4(n);let c=i.ray.origin.distanceTo(l);if(c<i.near||c>i.far)return;s.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,object:a})}}function fc(){let r=0,e=0,t=0,n=0;function i(s,a,o,l){r=s,e=o,t=-3*s+3*a-2*o-l,n=2*s-2*a+o+l}return{initCatmullRom:function(s,a,o,l,c){i(a,o,c*(o-s),c*(l-a))},initNonuniformCatmullRom:function(s,a,o,l,c,h,u){let d=(a-s)/c-(o-s)/(c+h)+(o-a)/h,p=(o-a)/h-(l-a)/(h+u)+(l-o)/u;d*=h,p*=h,i(a,o,d,p)},calc:function(s){let a=s*s;return r+e*s+t*a+n*(a*s)}}}function fu(r,e,t,n,i){let s=.5*(n-e),a=.5*(i-t),o=r*r;return(2*t-2*n+s+a)*(r*o)+(-3*t+3*n-2*s-a)*o+s*r+t}function Ir(r,e,t,n){return function(i,s){let a=1-i;return a*a*s}(r,e)+function(i,s){return 2*(1-i)*i*s}(r,t)+function(i,s){return i*i*s}(r,n)}function Dr(r,e,t,n,i){return function(s,a){let o=1-s;return o*o*o*a}(r,e)+function(s,a){let o=1-s;return 3*o*o*s*a}(r,t)+function(s,a){return 3*(1-s)*s*s*a}(r,n)+function(s,a){return s*s*s*a}(r,i)}function gu(r,e,t,n,i){let s,a;if(i===function(o,l,c,h){let u=0;for(let d=l,p=c-h;d<c;d+=h)u+=(o[p]-o[d])*(o[d+1]+o[p+1]),p=d;return u}(r,e,t,n)>0)for(s=e;s<t;s+=n)a=_u(s,r[s],r[s+1],a);else for(s=t-n;s>=e;s-=n)a=_u(s,r[s],r[s+1],a);return a&&Wa(a,a.next)&&(Xr(a),a=a.next),a}function yi(r,e){if(!r)return r;e||(e=r);let t,n=r;do if(t=!1,n.steiner||!Wa(n,n.next)&&nt(n.prev,n,n.next)!==0)n=n.next;else{if(Xr(n),n=e=n.prev,n===n.next)break;t=!0}while(t||n!==e);return e}function $r(r,e,t,n,i,s,a){if(!r)return;!a&&s&&function(h,u,d,p){let f=h;do f.z===0&&(f.z=zl(f.x,f.y,u,d,p)),f.prevZ=f.prev,f.nextZ=f.next,f=f.next;while(f!==h);f.prevZ.nextZ=null,f.prevZ=null,function(v){let m,y,g,_,b,T,M,E,N=1;do{for(y=v,v=null,b=null,T=0;y;){for(T++,g=y,M=0,m=0;m<N&&(M++,g=g.nextZ,g);m++);for(E=N;M>0||E>0&&g;)M!==0&&(E===0||!g||y.z<=g.z)?(_=y,y=y.nextZ,M--):(_=g,g=g.nextZ,E--),b?b.nextZ=_:v=_,_.prevZ=b,b=_;y=g}b.nextZ=null,N*=2}while(T>1)}(f)}(r,n,i,s);let o,l,c=r;for(;r.prev!==r.next;)if(o=r.prev,l=r.next,s?Zm(r,n,i,s):Ym(r))e.push(o.i/t|0),e.push(r.i/t|0),e.push(l.i/t|0),Xr(r),r=l.next,c=l.next;else if((r=l)===c){a?a===1?$r(r=Jm(yi(r),e,t),e,t,n,i,s,2):a===2&&Km(r,e,t,n,i,s):$r(yi(r),e,t,n,i,s,1);break}}function Ym(r){let e=r.prev,t=r,n=r.next;if(nt(e,t,n)>=0)return!1;let i=e.x,s=t.x,a=n.x,o=e.y,l=t.y,c=n.y,h=i<s?i<a?i:a:s<a?s:a,u=o<l?o<c?o:c:l<c?l:c,d=i>s?i>a?i:a:s>a?s:a,p=o>l?o>c?o:c:l>c?l:c,f=n.next;for(;f!==e;){if(f.x>=h&&f.x<=d&&f.y>=u&&f.y<=p&&Zi(i,o,s,l,a,c,f.x,f.y)&&nt(f.prev,f,f.next)>=0)return!1;f=f.next}return!0}function Zm(r,e,t,n){let i=r.prev,s=r,a=r.next;if(nt(i,s,a)>=0)return!1;let o=i.x,l=s.x,c=a.x,h=i.y,u=s.y,d=a.y,p=o<l?o<c?o:c:l<c?l:c,f=h<u?h<d?h:d:u<d?u:d,v=o>l?o>c?o:c:l>c?l:c,m=h>u?h>d?h:d:u>d?u:d,y=zl(p,f,e,t,n),g=zl(v,m,e,t,n),_=r.prevZ,b=r.nextZ;for(;_&&_.z>=y&&b&&b.z<=g;){if(_.x>=p&&_.x<=v&&_.y>=f&&_.y<=m&&_!==i&&_!==a&&Zi(o,h,l,u,c,d,_.x,_.y)&&nt(_.prev,_,_.next)>=0||(_=_.prevZ,b.x>=p&&b.x<=v&&b.y>=f&&b.y<=m&&b!==i&&b!==a&&Zi(o,h,l,u,c,d,b.x,b.y)&&nt(b.prev,b,b.next)>=0))return!1;b=b.nextZ}for(;_&&_.z>=y;){if(_.x>=p&&_.x<=v&&_.y>=f&&_.y<=m&&_!==i&&_!==a&&Zi(o,h,l,u,c,d,_.x,_.y)&&nt(_.prev,_,_.next)>=0)return!1;_=_.prevZ}for(;b&&b.z<=g;){if(b.x>=p&&b.x<=v&&b.y>=f&&b.y<=m&&b!==i&&b!==a&&Zi(o,h,l,u,c,d,b.x,b.y)&&nt(b.prev,b,b.next)>=0)return!1;b=b.nextZ}return!0}function Jm(r,e,t){let n=r;do{let i=n.prev,s=n.next.next;!Wa(i,s)&&Ju(i,n,n.next,s)&&jr(i,s)&&jr(s,i)&&(e.push(i.i/t|0),e.push(n.i/t|0),e.push(s.i/t|0),Xr(n),Xr(n.next),n=r=s),n=n.next}while(n!==r);return yi(n)}function Km(r,e,t,n,i,s){let a=r;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&rf(a,o)){let l=Ku(a,o);return a=yi(a,a.next),l=yi(l,l.next),$r(a,e,t,n,i,s,0),void $r(l,e,t,n,i,s,0)}o=o.next}a=a.next}while(a!==r)}function Qm(r,e){return r.x-e.x}function ef(r,e){let t=function(i,s){let a,o=s,l=-1/0,c=i.x,h=i.y;do{if(h<=o.y&&h>=o.next.y&&o.next.y!==o.y){let m=o.x+(h-o.y)*(o.next.x-o.x)/(o.next.y-o.y);if(m<=c&&m>l&&(l=m,a=o.x<o.next.x?o:o.next,m===c))return a}o=o.next}while(o!==s);if(!a)return null;let u=a,d=a.x,p=a.y,f,v=1/0;o=a;do c>=o.x&&o.x>=d&&c!==o.x&&Zi(h<p?c:l,h,d,p,h<p?l:c,h,o.x,o.y)&&(f=Math.abs(h-o.y)/(c-o.x),jr(o,i)&&(f<v||f===v&&(o.x>a.x||o.x===a.x&&tf(a,o)))&&(a=o,v=f)),o=o.next;while(o!==u);return a}(r,e);if(!t)return e;let n=Ku(t,r);return yi(n,n.next),yi(t,t.next)}function tf(r,e){return nt(r.prev,r,e.prev)<0&&nt(e.next,r,r.next)<0}function zl(r,e,t,n,i){return(r=1431655765&((r=858993459&((r=252645135&((r=16711935&((r=(r-t)*i|0)|r<<8))|r<<4))|r<<2))|r<<1))|(e=1431655765&((e=858993459&((e=252645135&((e=16711935&((e=(e-n)*i|0)|e<<8))|e<<4))|e<<2))|e<<1))<<1}function nf(r){let e=r,t=r;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==r);return t}function Zi(r,e,t,n,i,s,a,o){return(i-a)*(e-o)>=(r-a)*(s-o)&&(r-a)*(n-o)>=(t-a)*(e-o)&&(t-a)*(s-o)>=(i-a)*(n-o)}function rf(r,e){return r.next.i!==e.i&&r.prev.i!==e.i&&!function(t,n){let i=t;do{if(i.i!==t.i&&i.next.i!==t.i&&i.i!==n.i&&i.next.i!==n.i&&Ju(i,i.next,t,n))return!0;i=i.next}while(i!==t);return!1}(r,e)&&(jr(r,e)&&jr(e,r)&&function(t,n){let i=t,s=!1,a=(t.x+n.x)/2,o=(t.y+n.y)/2;do i.y>o!=i.next.y>o&&i.next.y!==i.y&&a<(i.next.x-i.x)*(o-i.y)/(i.next.y-i.y)+i.x&&(s=!s),i=i.next;while(i!==t);return s}(r,e)&&(nt(r.prev,r,e.prev)||nt(r,e.prev,e))||Wa(r,e)&&nt(r.prev,r,r.next)>0&&nt(e.prev,e,e.next)>0)}function nt(r,e,t){return(e.y-r.y)*(t.x-e.x)-(e.x-r.x)*(t.y-e.y)}function Wa(r,e){return r.x===e.x&&r.y===e.y}function Ju(r,e,t,n){let i=Ks(nt(r,e,t)),s=Ks(nt(r,e,n)),a=Ks(nt(t,n,r)),o=Ks(nt(t,n,e));return i!==s&&a!==o||!(i!==0||!Js(r,t,e))||!(s!==0||!Js(r,n,e))||!(a!==0||!Js(t,r,n))||!(o!==0||!Js(t,e,n))}function Js(r,e,t){return e.x<=Math.max(r.x,t.x)&&e.x>=Math.min(r.x,t.x)&&e.y<=Math.max(r.y,t.y)&&e.y>=Math.min(r.y,t.y)}function Ks(r){return r>0?1:r<0?-1:0}function jr(r,e){return nt(r.prev,r,r.next)<0?nt(r,e,r.next)>=0&&nt(r,r.prev,e)>=0:nt(r,e,r.prev)<0||nt(r,r.next,e)<0}function Ku(r,e){let t=new Hl(r.i,r.x,r.y),n=new Hl(e.i,e.x,e.y),i=r.next,s=e.prev;return r.next=e,e.prev=r,t.next=i,i.prev=t,n.next=t,t.prev=n,s.next=n,n.prev=s,n}function _u(r,e,t,n){let i=new Hl(r,e,t);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function Xr(r){r.next.prev=r.prev,r.prev.next=r.next,r.prevZ&&(r.prevZ.nextZ=r.nextZ),r.nextZ&&(r.nextZ.prevZ=r.prevZ)}function Hl(r,e,t){this.i=r,this.x=e,this.y=t,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function vu(r){let e=r.length;e>2&&r[e-1].equals(r[0])&&r.pop()}function yu(r,e){for(let t=0;t<e.length;t++)r.push(e[t].x),r.push(e[t].y)}function xu(r,e,t){let n=`${r.x},${r.y},${r.z}-${e.x},${e.y},${e.z}`,i=`${e.x},${e.y},${e.z}-${r.x},${r.y},${r.z}`;return t.has(n)!==!0&&t.has(i)!==!0&&(t.add(n),t.add(i),!0)}function Qs(r,e,t){return!r||!t&&r.constructor===e?r:typeof e.BYTES_PER_ELEMENT=="number"?new e(r):Array.prototype.slice.call(r)}function af(r){return ArrayBuffer.isView(r)&&!(r instanceof DataView)}function Eu(){return(typeof performance>"u"?Date:performance).now()}function Tu(r,e){return r.distance-e.distance}function lc(r,e,t,n){if(r.layers.test(e.layers)&&r.raycast(e,t),n===!0){let i=r.children;for(let s=0,a=i.length;s<a;s++)lc(i[s],e,t,!0)}}var il,xi,bi,Ru,cc,An,Qn,It,Cu,Pu,ci,rl,sl,hc,qd,Yd,Jn,Zd,Jd,Kd,uc,Qd,ep,Lu,er,tr,al,ol,Ha,nr,Rn,ll,At,jc,vo,en,tp,ta,di,dc,Iu,qn,Yn,Ur,Du,Nu,pi,ln,mi,ir,Uu,Ou,Fu,yo,xo,bo,Mo,Xc,qc,Yc,Zc,Bu,Jc,Kc,Qc,eh,th,nh,ih,rh,sh,ah,oh,lh,ch,hh,uh,dh,So,ph,mh,fh,gh,_h,na,ia,wo,vh,yh,xh,ku,fi,cn,at,Cn,pc,Ga,ra,Ke,sa,aa,Pi,cl,bh,hl,rr,oa,dn,xt,Mh,Ji,Or,zu,ie,Fe,Eo,Sh,wh,Eh,ys,ip,qe,Li,ca,rp,ha,sp,Ot,Ze,pl,Pn,ua,ml,Ft,w,Ro,Th,pn,Mn,Jt,xs,Ii,Di,Ni,Vn,Wn,ri,xr,bs,Ms,si,ap,br,Po,mn,Sn,Lo,Ss,$n,Io,ws,Do,Ln,Re,Ui,Kt,op,lp,jn,Es,Nt,Ah,Rh,da,Br,cp,Ch,Oi,wn,Ts,Mr,hp,up,Ph,Lh,Ih,dp,pp,ot,Qt,En,No,Tn,Fi,Bi,Dh,Uo,Oo,Fo,As,Zn,Gu,Xn,Rs,Te,bt,mp,rn,In,qf,ct,Cs,Rt,pa,ma,we,gp,Vt,ko,ki,Ut,Sr,ft,Ye,Nh,ai,Ps,Uh,zi,Hi,Gi,zo,Ls,Is,Ds,Ns,Oh,Fh,Bh,Us,Os,ge,We,_p,Dn,kr,Mt,Vi,fl,fa,gl,Ho,vp,yp,tn,oi,Bs,ar,Nn,Le,le,on,ks,ga,kh,wr,Go,zh,Vo,Wo,$o,li,Wi,Hh,_a,va,$u,ju,Xu,qu,Yu,$h,jh,Xh,qh,Yh,_l,vl,yl,jo,Qi,bm,Mm,Em,Tm,Rm,Lm,bl,Ml,Fm,Sl,wl,El,it,$m,Lr,Tl,zr,Al,ya,xa,Rl,Et,ba,Hr,ji,Er,Xi,qi,Yi,Tr,Zu,Hs,Ar,Gs,au,Xo,ou,Ma,Yf,Zf,Jf,Kf,Qf,eg,tg,ng,ig,rg,sg,ag,og,lg,cg,hg,ug,dg,pg,Cl,mg,fg,gg,_g,vg,yg,xg,bg,Mg,Sg,gi,lu,cu,hu,qo,Ws,or,uu,du,Sa,Gr,pu,Pl,$s,js,wa,Ea,Wt,Vr,Ll,Xs,Yo,Zo,Jo,Il,Ta,Dl,Aa,Nl,Ra,Ca,Pa,La,Ul,Wr,Ia,Ol,_i,gt,Fl,vi,Bl,qs,Ys,Ko,Zs,kl,Da,qm,Kn,Gl,sf,qr,Vl,Wl,$l,Un,jl,Xl,ql,Yl,Zl,wg,Pe,fn,Na,lr,Jl,Kl,Ql,nn,hi,ec,tc,nc,Nr,ui,ic,bu,rc,of,Yr,sc,Ua,Zr,Jr,Qo,Mu,Su,Oa,wu,Rr,el,ac,Kr,oc,Fa,Eg,Tg,Ag,Ba,Rg,Cg,Pg,Lg,Ig,Dg,Ng,Ug,gc,lf,tl,cf,hf,uf,Qe,Og,ka,Qr,Fg,Bg,kg,zg,Hg,Gg,Vg,Wg,$g,jg,Xg,qg,Yg,Zg,Jg,Kg,Au,ea,nl,za,$a=Bn(()=>{il="160",xi={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},bi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Ru=1,cc=2,An=3,Qn=0,It=1,Cu=2,Pu=2,ci=100,rl=204,sl=205,hc=0,qd=1,Yd=2,Jn=0,Zd=1,Jd=2,Kd=3,uc=4,Qd=5,ep=6,Lu=300,er=301,tr=302,al=303,ol=304,Ha=306,nr=1e3,Rn=1001,ll=1002,At=1003,jc=1004,vo=1005,en=1006,tp=1007,ta=1008,di=1009,dc=1012,Iu=1013,qn=1014,Yn=1015,Ur=1016,Du=1017,Nu=1018,pi=1020,ln=1023,mi=1026,ir=1027,Uu=1029,Ou=1031,Fu=1033,yo=33776,xo=33777,bo=33778,Mo=33779,Xc=35840,qc=35841,Yc=35842,Zc=35843,Bu=36196,Jc=37492,Kc=37496,Qc=37808,eh=37809,th=37810,nh=37811,ih=37812,rh=37813,sh=37814,ah=37815,oh=37816,lh=37817,ch=37818,hh=37819,uh=37820,dh=37821,So=36492,ph=36494,mh=36495,fh=36284,gh=36285,_h=36286,na=2300,ia=2301,wo=2302,vh=2400,yh=2401,xh=2402,ku=3e3,fi=3001,cn="",at="srgb",Cn="srgb-linear",pc="display-p3",Ga="display-p3-linear",ra="linear",Ke="srgb",sa="rec709",aa="p3",Pi=7680,cl=35044,bh="300 es",hl=1035,rr=2e3,oa=2001,dn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let n=this._listeners[e];if(n!==void 0){let i=n.indexOf(t);i!==-1&&n.splice(i,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let t=this._listeners[e.type];if(t!==void 0){e.target=this;let n=t.slice(0);for(let i=0,s=n.length;i<s;i++)n[i].call(this,e);e.target=null}}},xt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Mh=1234567,Ji=Math.PI/180,Or=180/Math.PI;zu={DEG2RAD:Ji,RAD2DEG:Or,generateUUID:un,clamp:ut,euclideanModulo:ul,mapLinear:function(r,e,t,n,i){return n+(r-e)*(i-n)/(t-e)},inverseLerp:function(r,e,t){return r!==e?(t-r)/(e-r):0},lerp:Cr,damp:function(r,e,t,n){return Cr(r,e,1-Math.exp(-t*n))},pingpong:function(r,e=1){return e-Math.abs(ul(r,2*e)-e)},smoothstep:function(r,e,t){return r<=e?0:r>=t?1:(r=(r-e)/(t-e))*r*(3-2*r)},smootherstep:function(r,e,t){return r<=e?0:r>=t?1:(r=(r-e)/(t-e))*r*r*(r*(6*r-15)+10)},randInt:function(r,e){return r+Math.floor(Math.random()*(e-r+1))},randFloat:function(r,e){return r+Math.random()*(e-r)},randFloatSpread:function(r){return r*(.5-Math.random())},seededRandom:function(r){r!==void 0&&(Mh=r);let e=Mh+=1831565813;return e=Math.imul(e^e>>>15,1|e),e^=e+Math.imul(e^e>>>7,61|e),((e^e>>>14)>>>0)/4294967296},degToRad:function(r){return r*Ji},radToDeg:function(r){return r*Or},isPowerOfTwo:dl,ceilPowerOfTwo:function(r){return Math.pow(2,Math.ceil(Math.log(r)/Math.LN2))},floorPowerOfTwo:la,setQuaternionFromProperEuler:function(r,e,t,n,i){let s=Math.cos,a=Math.sin,o=s(t/2),l=a(t/2),c=s((e+n)/2),h=a((e+n)/2),u=s((e-n)/2),d=a((e-n)/2),p=s((n-e)/2),f=a((n-e)/2);switch(i){case"XYX":r.set(o*h,l*u,l*d,o*c);break;case"YZY":r.set(l*d,o*h,l*u,o*c);break;case"ZXZ":r.set(l*u,l*d,o*h,o*c);break;case"XZX":r.set(o*h,l*f,l*p,o*c);break;case"YXY":r.set(l*p,o*h,l*f,o*c);break;case"ZYZ":r.set(l*f,l*p,o*h,o*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}},normalize:Xe,denormalize:hn},ie=class r{constructor(e=0,t=0){r.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(ut(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),i=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*n-a*i+e.x,this.y=s*i+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Fe=class r{constructor(e,t,n,i,s,a,o,l,c){r.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,i,s,a,o,l,c)}set(e,t,n,i,s,a,o,l,c){let h=this.elements;return h[0]=e,h[1]=i,h[2]=o,h[3]=t,h[4]=s,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,s=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],u=n[7],d=n[2],p=n[5],f=n[8],v=i[0],m=i[3],y=i[6],g=i[1],_=i[4],b=i[7],T=i[2],M=i[5],E=i[8];return s[0]=a*v+o*g+l*T,s[3]=a*m+o*_+l*M,s[6]=a*y+o*b+l*E,s[1]=c*v+h*g+u*T,s[4]=c*m+h*_+u*M,s[7]=c*y+h*b+u*E,s[2]=d*v+p*g+f*T,s[5]=d*m+p*_+f*M,s[8]=d*y+p*b+f*E,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],i=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-n*s*h+n*o*l+i*s*c-i*a*l}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=h*a-o*c,d=o*l-h*s,p=c*s-a*l,f=t*u+n*d+i*p;if(f===0)return this.set(0,0,0,0,0,0,0,0,0);let v=1/f;return e[0]=u*v,e[1]=(i*c-h*n)*v,e[2]=(o*n-i*a)*v,e[3]=d*v,e[4]=(h*t-i*l)*v,e[5]=(i*s-o*t)*v,e[6]=p*v,e[7]=(n*l-c*t)*v,e[8]=(a*t-n*s)*v,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,s,a,o){let l=Math.cos(s),c=Math.sin(s);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-i*c,i*l,-i*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(Eo.makeScale(e,t)),this}rotate(e){return this.premultiply(Eo.makeRotation(-e)),this}translate(e,t){return this.premultiply(Eo.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Eo=new Fe;Sh={};wh=new Fe().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Eh=new Fe().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),ys={[Cn]:{transfer:ra,primaries:sa,toReference:r=>r,fromReference:r=>r},[at]:{transfer:Ke,primaries:sa,toReference:r=>r.convertSRGBToLinear(),fromReference:r=>r.convertLinearToSRGB()},[Ga]:{transfer:ra,primaries:aa,toReference:r=>r.applyMatrix3(Eh),fromReference:r=>r.applyMatrix3(wh)},[pc]:{transfer:Ke,primaries:aa,toReference:r=>r.convertSRGBToLinear().applyMatrix3(Eh),fromReference:r=>r.applyMatrix3(wh).convertLinearToSRGB()}},ip=new Set([Cn,Ga]),qe={enabled:!0,_workingColorSpace:Cn,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(r){if(!ip.has(r))throw new Error(`Unsupported working color space, "${r}".`);this._workingColorSpace=r},convert:function(r,e,t){if(this.enabled===!1||e===t||!e||!t)return r;let n=ys[e].toReference;return(0,ys[t].fromReference)(n(r))},fromWorkingColorSpace:function(r,e){return this.convert(r,this._workingColorSpace,e)},toWorkingColorSpace:function(r,e){return this.convert(r,e,this._workingColorSpace)},getPrimaries:function(r){return ys[r].primaries},getTransfer:function(r){return r===cn?ra:ys[r].transfer}};ca=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{Li===void 0&&(Li=Fr("canvas")),Li.width=e.width,Li.height=e.height;let n=Li.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=Li}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Fr("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let i=n.getImageData(0,0,e.width,e.height),s=i.data;for(let a=0;a<s.length;a++)s[a]=255*Ki(s[a]/255);return n.putImageData(i,0,0),t}if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(255*Ki(t[n]/255)):t[n]=Ki(t[n]);return{data:t,width:e.width,height:e.height}}return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},rp=0,ha=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:rp++}),this.uuid=un(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let s;if(Array.isArray(i)){s=[];for(let a=0,o=i.length;a<o;a++)i[a].isDataTexture?s.push(Ao(i[a].image)):s.push(Ao(i[a]))}else s=Ao(i);n.url=s}return t||(e.images[this.uuid]=n),n}};sp=0,Ot=class r extends dn{constructor(e=r.DEFAULT_IMAGE,t=r.DEFAULT_MAPPING,n=1001,i=1001,s=1006,a=1008,o=1023,l=1009,c=r.DEFAULT_ANISOTROPY,h=""){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:sp++}),this.uuid=un(),this.name="",this.source=new ha(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ie(0,0),this.repeat=new ie(1,1),this.center=new ie(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Fe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof h=="string"?this.colorSpace=h:(Pr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=h===fi?at:cn),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Lu)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case nr:e.x=e.x-Math.floor(e.x);break;case Rn:e.x=e.x<0?0:1;break;case ll:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case nr:e.y=e.y-Math.floor(e.y);break;case Rn:e.y=e.y<0?0:1;break;case ll:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return Pr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===at?fi:ku}set encoding(e){Pr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=e===fi?at:cn}};Ot.DEFAULT_IMAGE=null,Ot.DEFAULT_MAPPING=Lu,Ot.DEFAULT_ANISOTROPY=1;Ze=class r{constructor(e=0,t=0,n=0,i=1){r.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*i+a[12]*s,this.y=a[1]*t+a[5]*n+a[9]*i+a[13]*s,this.z=a[2]*t+a[6]*n+a[10]*i+a[14]*s,this.w=a[3]*t+a[7]*n+a[11]*i+a[15]*s,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,s,l=e.elements,c=l[0],h=l[4],u=l[8],d=l[1],p=l[5],f=l[9],v=l[2],m=l[6],y=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-v)<.01&&Math.abs(f-m)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+v)<.1&&Math.abs(f+m)<.1&&Math.abs(c+p+y-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let _=(c+1)/2,b=(p+1)/2,T=(y+1)/2,M=(h+d)/4,E=(u+v)/4,N=(f+m)/4;return _>b&&_>T?_<.01?(n=0,i=.707106781,s=.707106781):(n=Math.sqrt(_),i=M/n,s=E/n):b>T?b<.01?(n=.707106781,i=0,s=.707106781):(i=Math.sqrt(b),n=M/i,s=N/i):T<.01?(n=.707106781,i=.707106781,s=0):(s=Math.sqrt(T),n=E/s,i=N/s),this.set(n,i,s,t),this}let g=Math.sqrt((m-f)*(m-f)+(u-v)*(u-v)+(d-h)*(d-h));return Math.abs(g)<.001&&(g=1),this.x=(m-f)/g,this.y=(u-v)/g,this.z=(d-h)/g,this.w=Math.acos((c+p+y-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},pl=class extends dn{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new Ze(0,0,e,t),this.scissorTest=!1,this.viewport=new Ze(0,0,e,t);let i={width:e,height:t,depth:1};n.encoding!==void 0&&(Pr("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),n.colorSpace=n.encoding===fi?at:cn),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:en,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},n),this.texture=new Ot(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=n.generateMipmaps,this.texture.internalFormat=n.internalFormat,this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}setSize(e,t,n=1){this.width===e&&this.height===t&&this.depth===n||(this.width=e,this.height=t,this.depth=n,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=n,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new ha(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Pn=class extends pl{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},ua=class extends Ot{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=At,this.minFilter=At,this.wrapR=Rn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},ml=class extends Ot{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=At,this.minFilter=At,this.wrapR=Rn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Ft=class{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,s,a,o){let l=n[i+0],c=n[i+1],h=n[i+2],u=n[i+3],d=s[a+0],p=s[a+1],f=s[a+2],v=s[a+3];if(o===0)return e[t+0]=l,e[t+1]=c,e[t+2]=h,void(e[t+3]=u);if(o===1)return e[t+0]=d,e[t+1]=p,e[t+2]=f,void(e[t+3]=v);if(u!==v||l!==d||c!==p||h!==f){let m=1-o,y=l*d+c*p+h*f+u*v,g=y>=0?1:-1,_=1-y*y;if(_>Number.EPSILON){let T=Math.sqrt(_),M=Math.atan2(T,y*g);m=Math.sin(m*M)/T,o=Math.sin(o*M)/T}let b=o*g;if(l=l*m+d*b,c=c*m+p*b,h=h*m+f*b,u=u*m+v*b,m===1-o){let T=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=T,c*=T,h*=T,u*=T}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,i,s,a){let o=n[i],l=n[i+1],c=n[i+2],h=n[i+3],u=s[a],d=s[a+1],p=s[a+2],f=s[a+3];return e[t]=o*f+h*u+l*p-c*d,e[t+1]=l*f+h*d+c*u-o*p,e[t+2]=c*f+h*p+o*d-l*u,e[t+3]=h*f-o*u-l*d-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,i=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(i/2),u=o(s/2),d=l(n/2),p=l(i/2),f=l(s/2);switch(a){case"XYZ":this._x=d*h*u+c*p*f,this._y=c*p*u-d*h*f,this._z=c*h*f+d*p*u,this._w=c*h*u-d*p*f;break;case"YXZ":this._x=d*h*u+c*p*f,this._y=c*p*u-d*h*f,this._z=c*h*f-d*p*u,this._w=c*h*u+d*p*f;break;case"ZXY":this._x=d*h*u-c*p*f,this._y=c*p*u+d*h*f,this._z=c*h*f+d*p*u,this._w=c*h*u-d*p*f;break;case"ZYX":this._x=d*h*u-c*p*f,this._y=c*p*u+d*h*f,this._z=c*h*f-d*p*u,this._w=c*h*u+d*p*f;break;case"YZX":this._x=d*h*u+c*p*f,this._y=c*p*u+d*h*f,this._z=c*h*f-d*p*u,this._w=c*h*u-d*p*f;break;case"XZY":this._x=d*h*u-c*p*f,this._y=c*p*u-d*h*f,this._z=c*h*f+d*p*u,this._w=c*h*u+d*p*f;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],i=t[4],s=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],u=t[10],d=n+o+u;if(d>0){let p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(h-l)*p,this._y=(s-c)*p,this._z=(a-i)*p}else if(n>o&&n>u){let p=2*Math.sqrt(1+n-o-u);this._w=(h-l)/p,this._x=.25*p,this._y=(i+a)/p,this._z=(s+c)/p}else if(o>u){let p=2*Math.sqrt(1+o-n-u);this._w=(s-c)/p,this._x=(i+a)/p,this._y=.25*p,this._z=(l+h)/p}else{let p=2*Math.sqrt(1+u-n-o);this._w=(a-i)/p,this._x=(s+c)/p,this._y=(l+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(ut(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,i=e._y,s=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+a*o+i*c-s*l,this._y=i*h+a*l+s*o-n*c,this._z=s*h+a*c+n*l-i*o,this._w=a*h-n*o-i*l-s*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,i=this._y,s=this._z,a=this._w,o=a*e._w+n*e._x+i*e._y+s*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=i,this._z=s,this;let l=1-o*o;if(l<=Number.EPSILON){let p=1-t;return this._w=p*a+t*this._w,this._x=p*n+t*this._x,this._y=p*i+t*this._y,this._z=p*s+t*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,o),u=Math.sin((1-t)*h)/c,d=Math.sin(t*h)/c;return this._w=a*u+this._w*d,this._x=n*u+this._x*d,this._y=i*u+this._y*d,this._z=s*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=Math.random(),t=Math.sqrt(1-e),n=Math.sqrt(e),i=2*Math.PI*Math.random(),s=2*Math.PI*Math.random();return this.set(t*Math.cos(i),n*Math.sin(s),n*Math.cos(s),t*Math.sin(i))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},w=class r{constructor(e=0,t=0,n=0){r.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Th.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Th.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,i=this.z,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6]*i,this.y=s[1]*t+s[4]*n+s[7]*i,this.z=s[2]*t+s[5]*n+s[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,i=this.z,s=e.elements,a=1/(s[3]*t+s[7]*n+s[11]*i+s[15]);return this.x=(s[0]*t+s[4]*n+s[8]*i+s[12])*a,this.y=(s[1]*t+s[5]*n+s[9]*i+s[13])*a,this.z=(s[2]*t+s[6]*n+s[10]*i+s[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,i=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*i-o*n),h=2*(o*t-s*i),u=2*(s*n-a*t);return this.x=t+l*c+a*u-o*h,this.y=n+l*h+o*c-s*u,this.z=i+l*u+s*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,i=this.z,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*i,this.y=s[1]*t+s[5]*n+s[9]*i,this.z=s[2]*t+s[6]*n+s[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,i=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=i*l-s*o,this.y=s*a-n*l,this.z=n*o-i*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Ro.copy(this).projectOnVector(e),this.sub(Ro)}reflect(e){return this.sub(Ro.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(ut(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,4*t)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,3*t)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=2*(Math.random()-.5),t=Math.random()*Math.PI*2,n=Math.sqrt(1-e**2);return this.x=n*Math.cos(t),this.y=n*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Ro=new w,Th=new Ft,pn=class{constructor(e=new w(1/0,1/0,1/0),t=new w(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Jt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Jt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Jt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let s=n.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Jt):Jt.fromBufferAttribute(s,a),Jt.applyMatrix4(e.matrixWorld),this.expandByPoint(Jt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),xs.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),xs.copy(n.boundingBox)),xs.applyMatrix4(e.matrixWorld),this.union(xs)}let i=e.children;for(let s=0,a=i.length;s<a;s++)this.expandByObject(i[s],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,Jt),Jt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(xr),bs.subVectors(this.max,xr),Ii.subVectors(e.a,xr),Di.subVectors(e.b,xr),Ni.subVectors(e.c,xr),Vn.subVectors(Di,Ii),Wn.subVectors(Ni,Di),ri.subVectors(Ii,Ni);let t=[0,-Vn.z,Vn.y,0,-Wn.z,Wn.y,0,-ri.z,ri.y,Vn.z,0,-Vn.x,Wn.z,0,-Wn.x,ri.z,0,-ri.x,-Vn.y,Vn.x,0,-Wn.y,Wn.x,0,-ri.y,ri.x,0];return!!Co(t,Ii,Di,Ni,bs)&&(t=[1,0,0,0,1,0,0,0,1],!!Co(t,Ii,Di,Ni,bs)&&(Ms.crossVectors(Vn,Wn),t=[Ms.x,Ms.y,Ms.z],Co(t,Ii,Di,Ni,bs)))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Jt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=.5*this.getSize(Jt).length()),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(Mn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Mn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Mn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Mn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Mn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Mn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Mn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Mn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Mn)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},Mn=[new w,new w,new w,new w,new w,new w,new w,new w],Jt=new w,xs=new pn,Ii=new w,Di=new w,Ni=new w,Vn=new w,Wn=new w,ri=new w,xr=new w,bs=new w,Ms=new w,si=new w;ap=new pn,br=new w,Po=new w,mn=class{constructor(e=new w,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):ap.setFromPoints(e).getCenter(n);let i=0;for(let s=0,a=e.length;s<a;s++)i=Math.max(i,n.distanceToSquared(e[s]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;br.subVectors(e,this.center);let t=br.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),i=.5*(n-this.radius);this.center.addScaledVector(br,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Po.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(br.copy(e.center).add(Po)),this.expandByPoint(br.copy(e.center).sub(Po))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},Sn=new w,Lo=new w,Ss=new w,$n=new w,Io=new w,ws=new w,Do=new w,Ln=class{constructor(e=new w,t=new w(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Sn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Sn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Sn.copy(this.origin).addScaledVector(this.direction,t),Sn.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){Lo.copy(e).add(t).multiplyScalar(.5),Ss.copy(t).sub(e).normalize(),$n.copy(this.origin).sub(Lo);let s=.5*e.distanceTo(t),a=-this.direction.dot(Ss),o=$n.dot(this.direction),l=-$n.dot(Ss),c=$n.lengthSq(),h=Math.abs(1-a*a),u,d,p,f;if(h>0)if(u=a*l-o,d=a*o-l,f=s*h,u>=0)if(d>=-f)if(d<=f){let v=1/h;u*=v,d*=v,p=u*(u+a*d+2*o)+d*(a*u+d+2*l)+c}else d=s,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;else d=-s,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;else d<=-f?(u=Math.max(0,-(-a*s+o)),d=u>0?-s:Math.min(Math.max(-s,-l),s),p=-u*u+d*(d+2*l)+c):d<=f?(u=0,d=Math.min(Math.max(-s,-l),s),p=d*(d+2*l)+c):(u=Math.max(0,-(a*s+o)),d=u>0?s:Math.min(Math.max(-s,-l),s),p=-u*u+d*(d+2*l)+c);else d=a>0?-s:s,u=Math.max(0,-(a*d+o)),p=-u*u+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(Lo).addScaledVector(Ss,d),p}intersectSphere(e,t){Sn.subVectors(e.center,this.origin);let n=Sn.dot(this.direction),i=Sn.dot(Sn)-n*n,s=e.radius*e.radius;if(i>s)return null;let a=Math.sqrt(s-i),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0?!0:e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,s,a,o,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,i=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,i=(e.min.x-d.x)*c),h>=0?(s=(e.min.y-d.y)*h,a=(e.max.y-d.y)*h):(s=(e.max.y-d.y)*h,a=(e.min.y-d.y)*h),n>a||s>i?null:((s>n||isNaN(n))&&(n=s),(a<i||isNaN(i))&&(i=a),u>=0?(o=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),n>l||o>i?null:((o>n||n!=n)&&(n=o),(l<i||i!=i)&&(i=l),i<0?null:this.at(n>=0?n:i,t)))}intersectsBox(e){return this.intersectBox(e,Sn)!==null}intersectTriangle(e,t,n,i,s){Io.subVectors(t,e),ws.subVectors(n,e),Do.crossVectors(Io,ws);let a,o=this.direction.dot(Do);if(o>0){if(i)return null;a=1}else{if(!(o<0))return null;a=-1,o=-o}$n.subVectors(this.origin,e);let l=a*this.direction.dot(ws.crossVectors($n,ws));if(l<0)return null;let c=a*this.direction.dot(Io.cross($n));if(c<0||l+c>o)return null;let h=-a*$n.dot(Do);return h<0?null:this.at(h/o,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Re=class r{constructor(e,t,n,i,s,a,o,l,c,h,u,d,p,f,v,m){r.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,i,s,a,o,l,c,h,u,d,p,f,v,m)}set(e,t,n,i,s,a,o,l,c,h,u,d,p,f,v,m){let y=this.elements;return y[0]=e,y[4]=t,y[8]=n,y[12]=i,y[1]=s,y[5]=a,y[9]=o,y[13]=l,y[2]=c,y[6]=h,y[10]=u,y[14]=d,y[3]=p,y[7]=f,y[11]=v,y[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new r().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,i=1/Ui.setFromMatrixColumn(e,0).length(),s=1/Ui.setFromMatrixColumn(e,1).length(),a=1/Ui.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*s,t[5]=n[5]*s,t[6]=n[6]*s,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,i=e.y,s=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(i),c=Math.sin(i),h=Math.cos(s),u=Math.sin(s);if(e.order==="XYZ"){let d=a*h,p=a*u,f=o*h,v=o*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=p+f*c,t[5]=d-v*c,t[9]=-o*l,t[2]=v-d*c,t[6]=f+p*c,t[10]=a*l}else if(e.order==="YXZ"){let d=l*h,p=l*u,f=c*h,v=c*u;t[0]=d+v*o,t[4]=f*o-p,t[8]=a*c,t[1]=a*u,t[5]=a*h,t[9]=-o,t[2]=p*o-f,t[6]=v+d*o,t[10]=a*l}else if(e.order==="ZXY"){let d=l*h,p=l*u,f=c*h,v=c*u;t[0]=d-v*o,t[4]=-a*u,t[8]=f+p*o,t[1]=p+f*o,t[5]=a*h,t[9]=v-d*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let d=a*h,p=a*u,f=o*h,v=o*u;t[0]=l*h,t[4]=f*c-p,t[8]=d*c+v,t[1]=l*u,t[5]=v*c+d,t[9]=p*c-f,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let d=a*l,p=a*c,f=o*l,v=o*c;t[0]=l*h,t[4]=v-d*u,t[8]=f*u+p,t[1]=u,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=p*u+f,t[10]=d-v*u}else if(e.order==="XZY"){let d=a*l,p=a*c,f=o*l,v=o*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=d*u+v,t[5]=a*h,t[9]=p*u-f,t[2]=f*u-p,t[6]=o*h,t[10]=v*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(op,e,lp)}lookAt(e,t,n){let i=this.elements;return Nt.subVectors(e,t),Nt.lengthSq()===0&&(Nt.z=1),Nt.normalize(),jn.crossVectors(n,Nt),jn.lengthSq()===0&&(Math.abs(n.z)===1?Nt.x+=1e-4:Nt.z+=1e-4,Nt.normalize(),jn.crossVectors(n,Nt)),jn.normalize(),Es.crossVectors(Nt,jn),i[0]=jn.x,i[4]=Es.x,i[8]=Nt.x,i[1]=jn.y,i[5]=Es.y,i[9]=Nt.y,i[2]=jn.z,i[6]=Es.z,i[10]=Nt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,i=t.elements,s=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],u=n[5],d=n[9],p=n[13],f=n[2],v=n[6],m=n[10],y=n[14],g=n[3],_=n[7],b=n[11],T=n[15],M=i[0],E=i[4],N=i[8],I=i[12],B=i[1],D=i[5],P=i[9],O=i[13],k=i[2],ee=i[6],oe=i[10],K=i[14],X=i[3],J=i[7],H=i[11],Y=i[15];return s[0]=a*M+o*B+l*k+c*X,s[4]=a*E+o*D+l*ee+c*J,s[8]=a*N+o*P+l*oe+c*H,s[12]=a*I+o*O+l*K+c*Y,s[1]=h*M+u*B+d*k+p*X,s[5]=h*E+u*D+d*ee+p*J,s[9]=h*N+u*P+d*oe+p*H,s[13]=h*I+u*O+d*K+p*Y,s[2]=f*M+v*B+m*k+y*X,s[6]=f*E+v*D+m*ee+y*J,s[10]=f*N+v*P+m*oe+y*H,s[14]=f*I+v*O+m*K+y*Y,s[3]=g*M+_*B+b*k+T*X,s[7]=g*E+_*D+b*ee+T*J,s[11]=g*N+_*P+b*oe+T*H,s[15]=g*I+_*O+b*K+T*Y,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],i=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],u=e[6],d=e[10],p=e[14];return e[3]*(+s*l*u-i*c*u-s*o*d+n*c*d+i*o*p-n*l*p)+e[7]*(+t*l*p-t*c*d+s*a*d-i*a*p+i*c*h-s*l*h)+e[11]*(+t*c*u-t*o*p-s*a*u+n*a*p+s*o*h-n*c*h)+e[15]*(-i*o*h-t*l*u+t*o*d+i*a*u-n*a*d+n*l*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],i=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=e[9],d=e[10],p=e[11],f=e[12],v=e[13],m=e[14],y=e[15],g=u*m*c-v*d*c+v*l*p-o*m*p-u*l*y+o*d*y,_=f*d*c-h*m*c-f*l*p+a*m*p+h*l*y-a*d*y,b=h*v*c-f*u*c+f*o*p-a*v*p-h*o*y+a*u*y,T=f*u*l-h*v*l-f*o*d+a*v*d+h*o*m-a*u*m,M=t*g+n*_+i*b+s*T;if(M===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let E=1/M;return e[0]=g*E,e[1]=(v*d*s-u*m*s-v*i*p+n*m*p+u*i*y-n*d*y)*E,e[2]=(o*m*s-v*l*s+v*i*c-n*m*c-o*i*y+n*l*y)*E,e[3]=(u*l*s-o*d*s-u*i*c+n*d*c+o*i*p-n*l*p)*E,e[4]=_*E,e[5]=(h*m*s-f*d*s+f*i*p-t*m*p-h*i*y+t*d*y)*E,e[6]=(f*l*s-a*m*s-f*i*c+t*m*c+a*i*y-t*l*y)*E,e[7]=(a*d*s-h*l*s+h*i*c-t*d*c-a*i*p+t*l*p)*E,e[8]=b*E,e[9]=(f*u*s-h*v*s-f*n*p+t*v*p+h*n*y-t*u*y)*E,e[10]=(a*v*s-f*o*s+f*n*c-t*v*c-a*n*y+t*o*y)*E,e[11]=(h*o*s-a*u*s-h*n*c+t*u*c+a*n*p-t*o*p)*E,e[12]=T*E,e[13]=(h*v*i-f*u*i+f*n*d-t*v*d-h*n*m+t*u*m)*E,e[14]=(f*o*i-a*v*i-f*n*l+t*v*l+a*n*m-t*o*m)*E,e[15]=(a*u*i-h*o*i+h*n*l-t*u*l-a*n*d+t*o*d)*E,this}scale(e){let t=this.elements,n=e.x,i=e.y,s=e.z;return t[0]*=n,t[4]*=i,t[8]*=s,t[1]*=n,t[5]*=i,t[9]*=s,t[2]*=n,t[6]*=i,t[10]*=s,t[3]*=n,t[7]*=i,t[11]*=s,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),i=Math.sin(t),s=1-n,a=e.x,o=e.y,l=e.z,c=s*a,h=s*o;return this.set(c*a+n,c*o-i*l,c*l+i*o,0,c*o+i*l,h*o+n,h*l-i*a,0,c*l-i*o,h*l+i*a,s*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,s,a){return this.set(1,n,s,0,e,1,a,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){let i=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,c=s+s,h=a+a,u=o+o,d=s*c,p=s*h,f=s*u,v=a*h,m=a*u,y=o*u,g=l*c,_=l*h,b=l*u,T=n.x,M=n.y,E=n.z;return i[0]=(1-(v+y))*T,i[1]=(p+b)*T,i[2]=(f-_)*T,i[3]=0,i[4]=(p-b)*M,i[5]=(1-(d+y))*M,i[6]=(m+g)*M,i[7]=0,i[8]=(f+_)*E,i[9]=(m-g)*E,i[10]=(1-(d+v))*E,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){let i=this.elements,s=Ui.set(i[0],i[1],i[2]).length(),a=Ui.set(i[4],i[5],i[6]).length(),o=Ui.set(i[8],i[9],i[10]).length();this.determinant()<0&&(s=-s),e.x=i[12],e.y=i[13],e.z=i[14],Kt.copy(this);let l=1/s,c=1/a,h=1/o;return Kt.elements[0]*=l,Kt.elements[1]*=l,Kt.elements[2]*=l,Kt.elements[4]*=c,Kt.elements[5]*=c,Kt.elements[6]*=c,Kt.elements[8]*=h,Kt.elements[9]*=h,Kt.elements[10]*=h,t.setFromRotationMatrix(Kt),n.x=s,n.y=a,n.z=o,this}makePerspective(e,t,n,i,s,a,o=2e3){let l=this.elements,c=2*s/(t-e),h=2*s/(n-i),u=(t+e)/(t-e),d=(n+i)/(n-i),p,f;if(o===rr)p=-(a+s)/(a-s),f=-2*a*s/(a-s);else{if(o!==oa)throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);p=-a/(a-s),f=-a*s/(a-s)}return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=f,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,i,s,a,o=2e3){let l=this.elements,c=1/(t-e),h=1/(n-i),u=1/(a-s),d=(t+e)*c,p=(n+i)*h,f,v;if(o===rr)f=(a+s)*u,v=-2*u;else{if(o!==oa)throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);f=s*u,v=-1*u}return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=v,l[14]=-f,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Ui=new w,Kt=new Re,op=new w(0,0,0),lp=new w(1,1,1),jn=new w,Es=new w,Nt=new w,Ah=new Re,Rh=new Ft,da=class r{constructor(e=0,t=0,n=0,i=r.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let i=e.elements,s=i[0],a=i[4],o=i[8],l=i[1],c=i[5],h=i[9],u=i[2],d=i[6],p=i[10];switch(t){case"XYZ":this._y=Math.asin(ut(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-ut(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,s),this._z=0);break;case"ZXY":this._x=Math.asin(ut(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,p),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-ut(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(ut(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,s)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-ut(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-h,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Ah.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Ah,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Rh.setFromEuler(this),this.setFromQuaternion(Rh,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};da.DEFAULT_ORDER="XYZ";Br=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!=0}isEnabled(e){return(this.mask&(1<<e|0))!=0}},cp=0,Ch=new w,Oi=new Ft,wn=new Re,Ts=new w,Mr=new w,hp=new w,up=new Ft,Ph=new w(1,0,0),Lh=new w(0,1,0),Ih=new w(0,0,1),dp={type:"added"},pp={type:"removed"},ot=class r extends dn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:cp++}),this.uuid=un(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=r.DEFAULT_UP.clone();let e=new w,t=new da,n=new Ft,i=new w(1,1,1);t._onChange(function(){n.setFromEuler(t,!1)}),n._onChange(function(){t.setFromQuaternion(n,void 0,!1)}),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Re},normalMatrix:{value:new Fe}}),this.matrix=new Re,this.matrixWorld=new Re,this.matrixAutoUpdate=r.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=r.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Br,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Oi.setFromAxisAngle(e,t),this.quaternion.multiply(Oi),this}rotateOnWorldAxis(e,t){return Oi.setFromAxisAngle(e,t),this.quaternion.premultiply(Oi),this}rotateX(e){return this.rotateOnAxis(Ph,e)}rotateY(e){return this.rotateOnAxis(Lh,e)}rotateZ(e){return this.rotateOnAxis(Ih,e)}translateOnAxis(e,t){return Ch.copy(e).applyQuaternion(this.quaternion),this.position.add(Ch.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Ph,e)}translateY(e){return this.translateOnAxis(Lh,e)}translateZ(e){return this.translateOnAxis(Ih,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(wn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Ts.copy(e):Ts.set(e,t,n);let i=this.parent;this.updateWorldMatrix(!0,!1),Mr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?wn.lookAt(Mr,Ts,this.up):wn.lookAt(Ts,Mr,this.up),this.quaternion.setFromRotationMatrix(wn),i&&(wn.extractRotation(i.matrixWorld),Oi.setFromRotationMatrix(wn),this.quaternion.premultiply(Oi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(dp)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(pp)),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),wn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),wn.multiply(e.parent.matrixWorld)),e.applyMatrix4(wn),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){let s=this.children[n].getObjectByProperty(e,t);if(s!==void 0)return s}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let i=this.children;for(let s=0,a=i.length;s<a;s++)i[s].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Mr,e,hp),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Mr,up,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,i=t.length;n<i;n++){let s=t[n];s.matrixWorldAutoUpdate!==!0&&e!==!0||s.updateMatrixWorld(e)}}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.matrixWorldAutoUpdate===!0&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){let i=this.children;for(let s=0,a=i.length;s<a;s++){let o=i[s];o.matrixWorldAutoUpdate===!0&&o.updateWorldMatrix(!1,!0)}}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let i={};function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.visibility=this._visibility,i.active=this._active,i.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),i.maxGeometryCount=this._maxGeometryCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.geometryCount=this._geometryCount,i.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(i.boundingSphere={center:i.boundingSphere.center.toArray(),radius:i.boundingSphere.radius}),this.boundingBox!==null&&(i.boundingBox={min:i.boundingBox.min.toArray(),max:i.boundingBox.max.toArray()})),this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=s(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];s(e.shapes,u)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));i.material=o}else i.material=s(e.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];i.animations.push(s(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),u=a(e.shapes),d=a(e.skeletons),p=a(e.animations),f=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),p.length>0&&(n.animations=p),f.length>0&&(n.nodes=f)}return n.object=i,n;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let i=e.children[n];this.add(i.clone())}return this}};ot.DEFAULT_UP=new w(0,1,0),ot.DEFAULT_MATRIX_AUTO_UPDATE=!0,ot.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;Qt=new w,En=new w,No=new w,Tn=new w,Fi=new w,Bi=new w,Dh=new w,Uo=new w,Oo=new w,Fo=new w,As=!1,Zn=class r{constructor(e=new w,t=new w,n=new w){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),Qt.subVectors(e,t),i.cross(Qt);let s=i.lengthSq();return s>0?i.multiplyScalar(1/Math.sqrt(s)):i.set(0,0,0)}static getBarycoord(e,t,n,i,s){Qt.subVectors(i,t),En.subVectors(n,t),No.subVectors(e,t);let a=Qt.dot(Qt),o=Qt.dot(En),l=Qt.dot(No),c=En.dot(En),h=En.dot(No),u=a*c-o*o;if(u===0)return s.set(0,0,0),null;let d=1/u,p=(c*l-o*h)*d,f=(a*h-o*l)*d;return s.set(1-p-f,f,p)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,Tn)!==null&&Tn.x>=0&&Tn.y>=0&&Tn.x+Tn.y<=1}static getUV(e,t,n,i,s,a,o,l){return As===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),As=!0),this.getInterpolation(e,t,n,i,s,a,o,l)}static getInterpolation(e,t,n,i,s,a,o,l){return this.getBarycoord(e,t,n,i,Tn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,Tn.x),l.addScaledVector(a,Tn.y),l.addScaledVector(o,Tn.z),l)}static isFrontFacing(e,t,n,i){return Qt.subVectors(n,t),En.subVectors(e,t),Qt.cross(En).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Qt.subVectors(this.c,this.b),En.subVectors(this.a,this.b),.5*Qt.cross(En).length()}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return r.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return r.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,n,i,s){return As===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),As=!0),r.getInterpolation(e,this.a,this.b,this.c,t,n,i,s)}getInterpolation(e,t,n,i,s){return r.getInterpolation(e,this.a,this.b,this.c,t,n,i,s)}containsPoint(e){return r.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return r.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,i=this.b,s=this.c,a,o;Fi.subVectors(i,n),Bi.subVectors(s,n),Uo.subVectors(e,n);let l=Fi.dot(Uo),c=Bi.dot(Uo);if(l<=0&&c<=0)return t.copy(n);Oo.subVectors(e,i);let h=Fi.dot(Oo),u=Bi.dot(Oo);if(h>=0&&u<=h)return t.copy(i);let d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return a=l/(l-h),t.copy(n).addScaledVector(Fi,a);Fo.subVectors(e,s);let p=Fi.dot(Fo),f=Bi.dot(Fo);if(f>=0&&p<=f)return t.copy(s);let v=p*c-l*f;if(v<=0&&c>=0&&f<=0)return o=c/(c-f),t.copy(n).addScaledVector(Bi,o);let m=h*f-p*u;if(m<=0&&u-h>=0&&p-f>=0)return Dh.subVectors(s,i),o=(u-h)/(u-h+(p-f)),t.copy(i).addScaledVector(Dh,o);let y=1/(m+v+d);return a=v*y,o=d*y,t.copy(n).addScaledVector(Fi,a).addScaledVector(Bi,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Gu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Xn={h:0,s:0,l:0},Rs={h:0,s:0,l:0};Te=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=at){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(255&e)/255,qe.toWorkingColorSpace(this,t),this}setRGB(e,t,n,i=qe.workingColorSpace){return this.r=e,this.g=t,this.b=n,qe.toWorkingColorSpace(this,i),this}setHSL(e,t,n,i=qe.workingColorSpace){if(e=ul(e,1),t=ut(t,0,1),n=ut(n,0,1),t===0)this.r=this.g=this.b=n;else{let s=n<=.5?n*(1+t):n+t-n*t,a=2*n-s;this.r=Bo(a,s,e+1/3),this.g=Bo(a,s,e),this.b=Bo(a,s,e-1/3)}return qe.toWorkingColorSpace(this,i),this}setStyle(e,t=at){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let s,a=i[1],o=i[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){let s=i[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=at){let n=Gu[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Ki(e.r),this.g=Ki(e.g),this.b=Ki(e.b),this}copyLinearToSRGB(e){return this.r=To(e.r),this.g=To(e.g),this.b=To(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=at){return qe.fromWorkingColorSpace(bt.copy(this),e),65536*Math.round(ut(255*bt.r,0,255))+256*Math.round(ut(255*bt.g,0,255))+Math.round(ut(255*bt.b,0,255))}getHexString(e=at){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=qe.workingColorSpace){qe.fromWorkingColorSpace(bt.copy(this),t);let n=bt.r,i=bt.g,s=bt.b,a=Math.max(n,i,s),o=Math.min(n,i,s),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case n:l=(i-s)/u+(i<s?6:0);break;case i:l=(s-n)/u+2;break;case s:l=(n-i)/u+4}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=qe.workingColorSpace){return qe.fromWorkingColorSpace(bt.copy(this),t),e.r=bt.r,e.g=bt.g,e.b=bt.b,e}getStyle(e=at){qe.fromWorkingColorSpace(bt.copy(this),e);let t=bt.r,n=bt.g,i=bt.b;return e!==at?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(255*t)},${Math.round(255*n)},${Math.round(255*i)})`}offsetHSL(e,t,n){return this.getHSL(Xn),this.setHSL(Xn.h+e,Xn.s+t,Xn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Xn),e.getHSL(Rs);let n=Cr(Xn.h,Rs.h,t),i=Cr(Xn.s,Rs.s,t),s=Cr(Xn.l,Rs.l,t);return this.setHSL(n,i,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,i=this.b,s=e.elements;return this.r=s[0]*t+s[3]*n+s[6]*i,this.g=s[1]*t+s[4]*n+s[7]*i,this.b=s[2]*t+s[5]*n+s[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},bt=new Te;Te.NAMES=Gu;mp=0,rn=class extends dn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:mp++}),this.uuid=un(),this.name="",this.type="Material",this.blending=1,this.side=Qn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=rl,this.blendDst=sl,this.blendEquation=ci,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Te(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Pi,this.stencilZFail=Pi,this.stencilZPass=Pi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let i=this[t];i!==void 0?i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n:console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`)}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};function i(s){let a=[];for(let o in s){let l=s[o];delete l.metadata,a.push(l)}return a}if(n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==1&&(n.blending=this.blending),this.side!==Qn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==rl&&(n.blendSrc=this.blendSrc),this.blendDst!==sl&&(n.blendDst=this.blendDst),this.blendEquation!==ci&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==3&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==519&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Pi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Pi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Pi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData),t){let s=i(e.textures),a=i(e.images);s.length>0&&(n.textures=s),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let i=t.length;n=new Array(i);for(let s=0;s!==i;++s)n[s]=t[s].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},In=class extends rn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Te(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=hc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},qf=fp();ct=new w,Cs=new ie,Rt=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=cl,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=Yn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,s=this.itemSize;i<s;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Cs.fromBufferAttribute(this,t),Cs.applyMatrix3(e),this.setXY(t,Cs.x,Cs.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)ct.fromBufferAttribute(this,t),ct.applyMatrix3(e),this.setXYZ(t,ct.x,ct.y,ct.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)ct.fromBufferAttribute(this,t),ct.applyMatrix4(e),this.setXYZ(t,ct.x,ct.y,ct.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)ct.fromBufferAttribute(this,t),ct.applyNormalMatrix(e),this.setXYZ(t,ct.x,ct.y,ct.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)ct.fromBufferAttribute(this,t),ct.transformDirection(e),this.setXYZ(t,ct.x,ct.y,ct.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=hn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Xe(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=hn(t,this.array)),t}setX(e,t){return this.normalized&&(t=Xe(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=hn(t,this.array)),t}setY(e,t){return this.normalized&&(t=Xe(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=hn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Xe(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=hn(t,this.array)),t}setW(e,t){return this.normalized&&(t=Xe(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Xe(t,this.array),n=Xe(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=Xe(t,this.array),n=Xe(n,this.array),i=Xe(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,s){return e*=this.itemSize,this.normalized&&(t=Xe(t,this.array),n=Xe(n,this.array),i=Xe(i,this.array),s=Xe(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==cl&&(e.usage=this.usage),e}},pa=class extends Rt{constructor(e,t,n){super(new Uint16Array(e),t,n)}},ma=class extends Rt{constructor(e,t,n){super(new Uint32Array(e),t,n)}},we=class extends Rt{constructor(e,t,n){super(new Float32Array(e),t,n)}},gp=0,Vt=new Re,ko=new ot,ki=new w,Ut=new pn,Sr=new pn,ft=new w,Ye=class r extends dn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:gp++}),this.uuid=un(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Hu(e)?ma:pa)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let s=new Fe().getNormalMatrix(e);n.applyNormalMatrix(s),n.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Vt.makeRotationFromQuaternion(e),this.applyMatrix4(Vt),this}rotateX(e){return Vt.makeRotationX(e),this.applyMatrix4(Vt),this}rotateY(e){return Vt.makeRotationY(e),this.applyMatrix4(Vt),this}rotateZ(e){return Vt.makeRotationZ(e),this.applyMatrix4(Vt),this}translate(e,t,n){return Vt.makeTranslation(e,t,n),this.applyMatrix4(Vt),this}scale(e,t,n){return Vt.makeScale(e,t,n),this.applyMatrix4(Vt),this}lookAt(e){return ko.lookAt(e),ko.updateMatrix(),this.applyMatrix4(ko.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ki).negate(),this.translate(ki.x,ki.y,ki.z),this}setFromPoints(e){let t=[];for(let n=0,i=e.length;n<i;n++){let s=e[n];t.push(s.x,s.y,s.z||0)}return this.setAttribute("position",new we(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new pn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)return console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),void this.boundingBox.set(new w(-1/0,-1/0,-1/0),new w(1/0,1/0,1/0));if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){let s=t[n];Ut.setFromBufferAttribute(s),this.morphTargetsRelative?(ft.addVectors(this.boundingBox.min,Ut.min),this.boundingBox.expandByPoint(ft),ft.addVectors(this.boundingBox.max,Ut.max),this.boundingBox.expandByPoint(ft)):(this.boundingBox.expandByPoint(Ut.min),this.boundingBox.expandByPoint(Ut.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new mn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)return console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),void this.boundingSphere.set(new w,1/0);if(e){let n=this.boundingSphere.center;if(Ut.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){let o=t[s];Sr.setFromBufferAttribute(o),this.morphTargetsRelative?(ft.addVectors(Ut.min,Sr.min),Ut.expandByPoint(ft),ft.addVectors(Ut.max,Sr.max),Ut.expandByPoint(ft)):(Ut.expandByPoint(Sr.min),Ut.expandByPoint(Sr.max))}Ut.getCenter(n);let i=0;for(let s=0,a=e.count;s<a;s++)ft.fromBufferAttribute(e,s),i=Math.max(i,n.distanceToSquared(ft));if(t)for(let s=0,a=t.length;s<a;s++){let o=t[s],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)ft.fromBufferAttribute(o,c),l&&(ki.fromBufferAttribute(e,c),ft.add(ki)),i=Math.max(i,n.distanceToSquared(ft))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0)return void console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");let n=e.array,i=t.position.array,s=t.normal.array,a=t.uv.array,o=i.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Rt(new Float32Array(4*o),4));let l=this.getAttribute("tangent").array,c=[],h=[];for(let B=0;B<o;B++)c[B]=new w,h[B]=new w;let u=new w,d=new w,p=new w,f=new ie,v=new ie,m=new ie,y=new w,g=new w;function _(B,D,P){u.fromArray(i,3*B),d.fromArray(i,3*D),p.fromArray(i,3*P),f.fromArray(a,2*B),v.fromArray(a,2*D),m.fromArray(a,2*P),d.sub(u),p.sub(u),v.sub(f),m.sub(f);let O=1/(v.x*m.y-m.x*v.y);isFinite(O)&&(y.copy(d).multiplyScalar(m.y).addScaledVector(p,-v.y).multiplyScalar(O),g.copy(p).multiplyScalar(v.x).addScaledVector(d,-m.x).multiplyScalar(O),c[B].add(y),c[D].add(y),c[P].add(y),h[B].add(g),h[D].add(g),h[P].add(g))}let b=this.groups;b.length===0&&(b=[{start:0,count:n.length}]);for(let B=0,D=b.length;B<D;++B){let P=b[B],O=P.start;for(let k=O,ee=O+P.count;k<ee;k+=3)_(n[k+0],n[k+1],n[k+2])}let T=new w,M=new w,E=new w,N=new w;function I(B){E.fromArray(s,3*B),N.copy(E);let D=c[B];T.copy(D),T.sub(E.multiplyScalar(E.dot(D))).normalize(),M.crossVectors(N,D);let P=M.dot(h[B])<0?-1:1;l[4*B]=T.x,l[4*B+1]=T.y,l[4*B+2]=T.z,l[4*B+3]=P}for(let B=0,D=b.length;B<D;++B){let P=b[B],O=P.start;for(let k=O,ee=O+P.count;k<ee;k+=3)I(n[k+0]),I(n[k+1]),I(n[k+2])}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Rt(new Float32Array(3*t.count),3),this.setAttribute("normal",n);else for(let d=0,p=n.count;d<p;d++)n.setXYZ(d,0,0,0);let i=new w,s=new w,a=new w,o=new w,l=new w,c=new w,h=new w,u=new w;if(e)for(let d=0,p=e.count;d<p;d+=3){let f=e.getX(d+0),v=e.getX(d+1),m=e.getX(d+2);i.fromBufferAttribute(t,f),s.fromBufferAttribute(t,v),a.fromBufferAttribute(t,m),h.subVectors(a,s),u.subVectors(i,s),h.cross(u),o.fromBufferAttribute(n,f),l.fromBufferAttribute(n,v),c.fromBufferAttribute(n,m),o.add(h),l.add(h),c.add(h),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(v,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,p=t.count;d<p;d+=3)i.fromBufferAttribute(t,d+0),s.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),h.subVectors(a,s),u.subVectors(i,s),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)ft.fromBufferAttribute(e,t),ft.normalize(),e.setXYZ(t,ft.x,ft.y,ft.z)}toNonIndexed(){function e(o,l){let c=o.array,h=o.itemSize,u=o.normalized,d=new c.constructor(l.length*h),p=0,f=0;for(let v=0,m=l.length;v<m;v++){p=o.isInterleavedBufferAttribute?l[v]*o.data.stride+o.offset:l[v]*h;for(let y=0;y<h;y++)d[f++]=c[p++]}return new Rt(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new r,n=this.index.array,i=this.attributes;for(let o in i){let l=e(i[o],n);t.setAttribute(o,l)}let s=this.morphAttributes;for(let o in s){let l=[],c=s[o];for(let h=0,u=c.length;h<u;h++){let d=e(c[h],n);l.push(d)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let i={},s=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){let p=c[u];h.push(p.toJSON(e.data))}h.length>0&&(i[l]=h,s=!0)}s&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone(t));let i=e.attributes;for(let c in i){let h=i[c];this.setAttribute(c,h.clone(t))}let s=e.morphAttributes;for(let c in s){let h=[],u=s[c];for(let d=0,p=u.length;d<p;d++)h.push(u[d].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,h=a.length;c<h;c++){let u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},Nh=new Re,ai=new Ln,Ps=new mn,Uh=new w,zi=new w,Hi=new w,Gi=new w,zo=new w,Ls=new w,Is=new ie,Ds=new ie,Ns=new ie,Oh=new w,Fh=new w,Bh=new w,Us=new w,Os=new w,ge=class extends ot{constructor(e=new Ye,t=new In){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,s=n.length;i<s;i++){let a=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=i}}}}getVertexPosition(e,t){let n=this.geometry,i=n.attributes.position,s=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(i,e);let o=this.morphTargetInfluences;if(s&&o){Ls.set(0,0,0);for(let l=0,c=s.length;l<c;l++){let h=o[l],u=s[l];h!==0&&(zo.fromBufferAttribute(u,e),a?Ls.addScaledVector(zo,h):Ls.addScaledVector(zo.sub(t),h))}t.add(Ls)}return t}raycast(e,t){let n=this.geometry,i=this.material,s=this.matrixWorld;if(i!==void 0){if(n.boundingSphere===null&&n.computeBoundingSphere(),Ps.copy(n.boundingSphere),Ps.applyMatrix4(s),ai.copy(e.ray).recast(e.near),Ps.containsPoint(ai.origin)===!1&&(ai.intersectSphere(Ps,Uh)===null||ai.origin.distanceToSquared(Uh)>(e.far-e.near)**2))return;Nh.copy(s).invert(),ai.copy(e.ray).applyMatrix4(Nh),n.boundingBox!==null&&ai.intersectsBox(n.boundingBox)===!1||this._computeIntersections(e,t,ai)}}_computeIntersections(e,t,n){let i,s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,h=s.attributes.uv1,u=s.attributes.normal,d=s.groups,p=s.drawRange;if(o!==null)if(Array.isArray(a))for(let f=0,v=d.length;f<v;f++){let m=d[f],y=a[m.materialIndex];for(let g=Math.max(m.start,p.start),_=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));g<_;g+=3)i=Fs(this,y,e,n,c,h,u,o.getX(g),o.getX(g+1),o.getX(g+2)),i&&(i.faceIndex=Math.floor(g/3),i.face.materialIndex=m.materialIndex,t.push(i))}else for(let f=Math.max(0,p.start),v=Math.min(o.count,p.start+p.count);f<v;f+=3)i=Fs(this,a,e,n,c,h,u,o.getX(f),o.getX(f+1),o.getX(f+2)),i&&(i.faceIndex=Math.floor(f/3),t.push(i));else if(l!==void 0)if(Array.isArray(a))for(let f=0,v=d.length;f<v;f++){let m=d[f],y=a[m.materialIndex];for(let g=Math.max(m.start,p.start),_=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));g<_;g+=3)i=Fs(this,y,e,n,c,h,u,g,g+1,g+2),i&&(i.faceIndex=Math.floor(g/3),i.face.materialIndex=m.materialIndex,t.push(i))}else for(let f=Math.max(0,p.start),v=Math.min(l.count,p.start+p.count);f<v;f+=3)i=Fs(this,a,e,n,c,h,u,f,f+1,f+2),i&&(i.faceIndex=Math.floor(f/3),t.push(i))}};We=class r extends Ye{constructor(e=1,t=1,n=1,i=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:s,depthSegments:a};let o=this;i=Math.floor(i),s=Math.floor(s),a=Math.floor(a);let l=[],c=[],h=[],u=[],d=0,p=0;function f(v,m,y,g,_,b,T,M,E,N,I){let B=b/E,D=T/N,P=b/2,O=T/2,k=M/2,ee=E+1,oe=N+1,K=0,X=0,J=new w;for(let H=0;H<oe;H++){let Y=H*D-O;for(let he=0;he<ee;he++){let A=he*B-P;J[v]=A*g,J[m]=Y*_,J[y]=k,c.push(J.x,J.y,J.z),J[v]=0,J[m]=0,J[y]=M>0?1:-1,h.push(J.x,J.y,J.z),u.push(he/E),u.push(1-H/N),K+=1}}for(let H=0;H<N;H++)for(let Y=0;Y<E;Y++){let he=d+Y+ee*H,A=d+Y+ee*(H+1),R=d+(Y+1)+ee*(H+1),z=d+(Y+1)+ee*H;l.push(he,A,z),l.push(A,R,z),X+=6}o.addGroup(p,X,I),p+=X,d+=K}f("z","y","x",-1,-1,n,t,e,a,s,0),f("z","y","x",1,-1,n,t,-e,a,s,1),f("x","z","y",1,1,e,n,t,i,a,2),f("x","z","y",1,-1,e,n,-t,i,a,3),f("x","y","z",1,-1,e,t,n,i,s,4),f("x","y","z",-1,-1,e,t,-n,i,s,5),this.setIndex(l),this.setAttribute("position",new we(c,3)),this.setAttribute("normal",new we(h,3)),this.setAttribute("uv",new we(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};_p={clone:sr,merge:Tt},Dn=class extends rn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,this.fragmentShader=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=sr(e.uniforms),this.uniformsGroups=function(t){let n=[];for(let i=0;i<t.length;i++)n.push(t[i].clone());return n}(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let i in this.uniforms){let s=this.uniforms[i].value;s&&s.isTexture?t.uniforms[i]={type:"t",value:s.toJSON(e).uuid}:s&&s.isColor?t.uniforms[i]={type:"c",value:s.getHex()}:s&&s.isVector2?t.uniforms[i]={type:"v2",value:s.toArray()}:s&&s.isVector3?t.uniforms[i]={type:"v3",value:s.toArray()}:s&&s.isVector4?t.uniforms[i]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?t.uniforms[i]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?t.uniforms[i]={type:"m4",value:s.toArray()}:t.uniforms[i]={value:s}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},kr=class extends ot{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Re,this.projectionMatrix=new Re,this.projectionMatrixInverse=new Re,this.coordinateSystem=rr}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Mt=class extends kr{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=2*Or*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(.5*Ji*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return 2*Or*Math.atan(Math.tan(.5*Ji*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,n,i,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(.5*Ji*this.fov)/this.zoom,n=2*t,i=this.aspect*n,s=-.5*i,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*i/l,t-=a.offsetY*n/c,i*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+i,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Vi=-90,fl=class extends ot{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let i=new Mt(Vi,1,e,t);i.layers=this.layers,this.add(i);let s=new Mt(Vi,1,e,t);s.layers=this.layers,this.add(s);let a=new Mt(Vi,1,e,t);a.layers=this.layers,this.add(a);let o=new Mt(Vi,1,e,t);o.layers=this.layers,this.add(o);let l=new Mt(Vi,1,e,t);l.layers=this.layers,this.add(l);let c=new Mt(Vi,1,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,i,s,a,o,l]=t;for(let c of t)this.remove(c);if(e===rr)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else{if(e!==oa)throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1)}for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[s,a,o,l,c,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),f=e.xr.enabled;e.xr.enabled=!1;let v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,i),e.render(t,s),e.setRenderTarget(n,1,i),e.render(t,a),e.setRenderTarget(n,2,i),e.render(t,o),e.setRenderTarget(n,3,i),e.render(t,l),e.setRenderTarget(n,4,i),e.render(t,c),n.texture.generateMipmaps=v,e.setRenderTarget(n,5,i),e.render(t,h),e.setRenderTarget(u,d,p),e.xr.enabled=f,n.texture.needsPMREMUpdate=!0}},fa=class extends Ot{constructor(e,t,n,i,s,a,o,l,c,h){super(e=e!==void 0?e:[],t=t!==void 0?t:er,n,i,s,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},gl=class extends Pn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];t.encoding!==void 0&&(Pr("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),t.colorSpace=t.encoding===fi?at:cn),this.texture=new fa(i,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0&&t.generateMipmaps,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:en}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},i=new We(5,5,5),s=new Dn({name:"CubemapFromEquirect",uniforms:sr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:It,blending:0});s.uniforms.tEquirect.value=t;let a=new ge(i,s),o=t.minFilter;return t.minFilter===ta&&(t.minFilter=en),new fl(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,n,i){let s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,i);e.setRenderTarget(s)}},Ho=new w,vp=new w,yp=new Fe,tn=class{constructor(e=new w(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let i=Ho.subVectors(n,t).cross(vp.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(Ho),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let s=-(e.start.dot(this.normal)+this.constant)/i;return s<0||s>1?null:t.copy(e.start).addScaledVector(n,s)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||yp.getNormalMatrix(e),i=this.coplanarPoint(Ho).applyMatrix4(e),s=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},oi=new mn,Bs=new w,ar=class{constructor(e=new tn,t=new tn,n=new tn,i=new tn,s=new tn,a=new tn){this.planes=[e,t,n,i,s,a]}set(e,t,n,i,s,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(i),o[4].copy(s),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=2e3){let n=this.planes,i=e.elements,s=i[0],a=i[1],o=i[2],l=i[3],c=i[4],h=i[5],u=i[6],d=i[7],p=i[8],f=i[9],v=i[10],m=i[11],y=i[12],g=i[13],_=i[14],b=i[15];if(n[0].setComponents(l-s,d-c,m-p,b-y).normalize(),n[1].setComponents(l+s,d+c,m+p,b+y).normalize(),n[2].setComponents(l+a,d+h,m+f,b+g).normalize(),n[3].setComponents(l-a,d-h,m-f,b-g).normalize(),n[4].setComponents(l-o,d-u,m-v,b-_).normalize(),t===rr)n[5].setComponents(l+o,d+u,m+v,b+_).normalize();else{if(t!==oa)throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);n[5].setComponents(o,u,v,_).normalize()}return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),oi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),oi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(oi)}intersectsSprite(e){return oi.center.set(0,0,0),oi.radius=.7071067811865476,oi.applyMatrix4(e.matrixWorld),this.intersectsSphere(oi)}intersectsSphere(e){let t=this.planes,n=e.center,i=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let i=t[n];if(Bs.x=i.normal.x>0?e.max.x:e.min.x,Bs.y=i.normal.y>0?e.max.y:e.min.y,Bs.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(Bs)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};Nn=class r extends Ye{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};let s=e/2,a=t/2,o=Math.floor(n),l=Math.floor(i),c=o+1,h=l+1,u=e/o,d=t/l,p=[],f=[],v=[],m=[];for(let y=0;y<h;y++){let g=y*d-a;for(let _=0;_<c;_++){let b=_*u-s;f.push(b,-g,0),v.push(0,0,1),m.push(_/o),m.push(1-y/l)}}for(let y=0;y<l;y++)for(let g=0;g<o;g++){let _=g+c*y,b=g+c*(y+1),T=g+1+c*(y+1),M=g+1+c*y;p.push(_,b,M),p.push(b,T,M)}this.setIndex(p),this.setAttribute("position",new we(f,3)),this.setAttribute("normal",new we(v,3)),this.setAttribute("uv",new we(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.width,e.height,e.widthSegments,e.heightSegments)}},Le={alphahash_fragment:`#ifdef USE_ALPHAHASH
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
}`},le={common:{diffuse:{value:new Te(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Fe},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Fe}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Fe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Fe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Fe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Fe},normalScale:{value:new ie(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Fe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Fe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Fe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Fe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Te(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Te(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0},uvTransform:{value:new Fe}},sprite:{diffuse:{value:new Te(16777215)},opacity:{value:1},center:{value:new ie(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Fe},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0}}},on={basic:{uniforms:Tt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.fog]),vertexShader:Le.meshbasic_vert,fragmentShader:Le.meshbasic_frag},lambert:{uniforms:Tt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Te(0)}}]),vertexShader:Le.meshlambert_vert,fragmentShader:Le.meshlambert_frag},phong:{uniforms:Tt([le.common,le.specularmap,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.fog,le.lights,{emissive:{value:new Te(0)},specular:{value:new Te(1118481)},shininess:{value:30}}]),vertexShader:Le.meshphong_vert,fragmentShader:Le.meshphong_frag},standard:{uniforms:Tt([le.common,le.envmap,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.roughnessmap,le.metalnessmap,le.fog,le.lights,{emissive:{value:new Te(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Le.meshphysical_vert,fragmentShader:Le.meshphysical_frag},toon:{uniforms:Tt([le.common,le.aomap,le.lightmap,le.emissivemap,le.bumpmap,le.normalmap,le.displacementmap,le.gradientmap,le.fog,le.lights,{emissive:{value:new Te(0)}}]),vertexShader:Le.meshtoon_vert,fragmentShader:Le.meshtoon_frag},matcap:{uniforms:Tt([le.common,le.bumpmap,le.normalmap,le.displacementmap,le.fog,{matcap:{value:null}}]),vertexShader:Le.meshmatcap_vert,fragmentShader:Le.meshmatcap_frag},points:{uniforms:Tt([le.points,le.fog]),vertexShader:Le.points_vert,fragmentShader:Le.points_frag},dashed:{uniforms:Tt([le.common,le.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Le.linedashed_vert,fragmentShader:Le.linedashed_frag},depth:{uniforms:Tt([le.common,le.displacementmap]),vertexShader:Le.depth_vert,fragmentShader:Le.depth_frag},normal:{uniforms:Tt([le.common,le.bumpmap,le.normalmap,le.displacementmap,{opacity:{value:1}}]),vertexShader:Le.meshnormal_vert,fragmentShader:Le.meshnormal_frag},sprite:{uniforms:Tt([le.sprite,le.fog]),vertexShader:Le.sprite_vert,fragmentShader:Le.sprite_frag},background:{uniforms:{uvTransform:{value:new Fe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Le.background_vert,fragmentShader:Le.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:Le.backgroundCube_vert,fragmentShader:Le.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Le.cube_vert,fragmentShader:Le.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Le.equirect_vert,fragmentShader:Le.equirect_frag},distanceRGBA:{uniforms:Tt([le.common,le.displacementmap,{referencePosition:{value:new w},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Le.distanceRGBA_vert,fragmentShader:Le.distanceRGBA_frag},shadow:{uniforms:Tt([le.lights,le.fog,{color:{value:new Te(0)},opacity:{value:1}}]),vertexShader:Le.shadow_vert,fragmentShader:Le.shadow_frag}};on.physical={uniforms:Tt([on.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Fe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Fe},clearcoatNormalScale:{value:new ie(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Fe},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Fe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Fe},sheen:{value:0},sheenColor:{value:new Te(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Fe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Fe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Fe},transmissionSamplerSize:{value:new ie},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Fe},attenuationDistance:{value:0},attenuationColor:{value:new Te(0)},specularColor:{value:new Te(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Fe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Fe},anisotropyVector:{value:new ie},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Fe}}]),vertexShader:Le.meshphysical_vert,fragmentShader:Le.meshphysical_frag};ks={r:0,b:0,g:0};ga=class extends kr{constructor(e=-1,t=1,n=1,i=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2,s=n-e,a=n+e,o=i+t,l=i-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},kh=[.125,.215,.35,.446,.526,.582],wr=20,Go=new ga,zh=new Te,Vo=null,Wo=0,$o=0,li=(1+Math.sqrt(5))/2,Wi=1/li,Hh=[new w(1,1,1),new w(-1,1,1),new w(1,1,-1),new w(-1,1,-1),new w(0,li,Wi),new w(0,li,-Wi),new w(Wi,0,li),new w(-Wi,0,li),new w(li,Wi,0),new w(-li,Wi,0)],_a=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,i=100){Vo=this._renderer.getRenderTarget(),Wo=this._renderer.getActiveCubeFace(),$o=this._renderer.getActiveMipmapLevel(),this._setSize(256);let s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,i,s),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Wh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Vh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Vo,Wo,$o),e.scissorTest=!1,zs(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===er||e.mapping===tr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Vo=this._renderer.getRenderTarget(),Wo=this._renderer.getActiveCubeFace(),$o=this._renderer.getActiveMipmapLevel();let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:en,minFilter:en,generateMipmaps:!1,type:Ur,format:ln,colorSpace:Cn,depthBuffer:!1},i=Gh(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Gh(e,t,n);let{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=function(a){let o=[],l=[],c=[],h=a,u=a-4+1+kh.length;for(let d=0;d<u;d++){let p=Math.pow(2,h);l.push(p);let f=1/p;d>a-4?f=kh[d-a+4-1]:d===0&&(f=0),c.push(f);let v=1/(p-2),m=-v,y=1+v,g=[m,m,y,m,y,y,m,m,y,y,m,y],_=6,b=6,T=3,M=2,E=1,N=new Float32Array(T*b*_),I=new Float32Array(M*b*_),B=new Float32Array(E*b*_);for(let P=0;P<_;P++){let O=P%3*2/3-1,k=P>2?0:-1,ee=[O,k,0,O+2/3,k,0,O+2/3,k+1,0,O,k,0,O+2/3,k+1,0,O,k+1,0];N.set(ee,T*b*P),I.set(g,M*b*P);let oe=[P,P,P,P,P,P];B.set(oe,E*b*P)}let D=new Ye;D.setAttribute("position",new Rt(N,T)),D.setAttribute("uv",new Rt(I,M)),D.setAttribute("faceIndex",new Rt(B,E)),o.push(D),h>4&&h--}return{lodPlanes:o,sizeLods:l,sigmas:c}}(s)),this._blurMaterial=function(a,o,l){let c=new Float32Array(wr),h=new w(0,1,0);return new Dn({name:"SphericalGaussianBlur",defines:{n:wr,CUBEUV_TEXEL_WIDTH:1/o,CUBEUV_TEXEL_HEIGHT:1/l,CUBEUV_MAX_MIP:`${a}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:c},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:h}},vertexShader:mc(),fragmentShader:`

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
		`,blending:0,depthTest:!1,depthWrite:!1})}(s,e,t)}return i}_compileMaterial(e){let t=new ge(this._lodPlanes[0],e);this._renderer.compile(t,Go)}_sceneToCubeUV(e,t,n,i){let s=new Mt(90,1,t,n),a=[1,-1,1,1,1,1],o=[1,1,1,-1,-1,-1],l=this._renderer,c=l.autoClear,h=l.toneMapping;l.getClearColor(zh),l.toneMapping=Jn,l.autoClear=!1;let u=new In({name:"PMREM.Background",side:It,depthWrite:!1,depthTest:!1}),d=new ge(new We,u),p=!1,f=e.background;f?f.isColor&&(u.color.copy(f),e.background=null,p=!0):(u.color.copy(zh),p=!0);for(let v=0;v<6;v++){let m=v%3;m===0?(s.up.set(0,a[v],0),s.lookAt(o[v],0,0)):m===1?(s.up.set(0,0,a[v]),s.lookAt(0,o[v],0)):(s.up.set(0,a[v],0),s.lookAt(0,0,o[v]));let y=this._cubeSize;zs(i,m*y,v>2?y:0,y,y),l.setRenderTarget(i),p&&l.render(d,s),l.render(e,s)}d.geometry.dispose(),d.material.dispose(),l.toneMapping=h,l.autoClear=c,e.background=f}_textureToCubeUV(e,t){let n=this._renderer,i=e.mapping===er||e.mapping===tr;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Wh()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Vh());let s=i?this._cubemapMaterial:this._equirectMaterial,a=new ge(this._lodPlanes[0],s);s.uniforms.envMap.value=e;let o=this._cubeSize;zs(t,0,0,3*o,2*o),n.setRenderTarget(t),n.render(a,Go)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;for(let i=1;i<this._lodPlanes.length;i++){let s=Math.sqrt(this._sigmas[i]*this._sigmas[i]-this._sigmas[i-1]*this._sigmas[i-1]),a=Hh[(i-1)%Hh.length];this._blur(e,i-1,i,s,a)}t.autoClear=n}_blur(e,t,n,i,s){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,i,"latitudinal",s),this._halfBlur(a,e,n,n,i,"longitudinal",s)}_halfBlur(e,t,n,i,s,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=new ge(this._lodPlanes[i],c),u=c.uniforms,d=this._sizeLods[n]-1,p=isFinite(s)?Math.PI/(2*d):2*Math.PI/39,f=s/p,v=isFinite(s)?1+Math.floor(3*f):wr;v>wr&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${v} samples when the maximum is set to 20`);let m=[],y=0;for(let b=0;b<wr;++b){let T=b/f,M=Math.exp(-T*T/2);m.push(M),b===0?y+=M:b<v&&(y+=2*M)}for(let b=0;b<m.length;b++)m[b]=m[b]/y;u.envMap.value=e.texture,u.samples.value=v,u.weights.value=m,u.latitudinal.value=a==="latitudinal",o&&(u.poleAxis.value=o);let{_lodMax:g}=this;u.dTheta.value=p,u.mipInt.value=g-n;let _=this._sizeLods[i];zs(t,3*_*(i>g-4?i-g+4:0),4*(this._cubeSize-_),3*_,2*_),l.setRenderTarget(t),l.render(h,Go)}};va=class extends Ot{constructor(e,t,n,i,s,a,o,l,c,h){if((h=h!==void 0?h:mi)!==mi&&h!==ir)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===mi&&(n=qn),n===void 0&&h===ir&&(n=pi),super(null,i,s,a,o,l,h,n,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:At,this.minFilter=l!==void 0?l:At,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},$u=new Ot,ju=new va(1,1);ju.compareFunction=515;Xu=new ua,qu=new ml,Yu=new fa,$h=[],jh=[],Xh=new Float32Array(16),qh=new Float32Array(9),Yh=new Float32Array(4);_l=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=function(i){switch(i){case 5126:return Op;case 35664:return Fp;case 35665:return Bp;case 35666:return kp;case 35674:return zp;case 35675:return Hp;case 35676:return Gp;case 5124:case 35670:return Vp;case 35667:case 35671:return Wp;case 35668:case 35672:return $p;case 35669:case 35673:return jp;case 5125:return Xp;case 36294:return qp;case 36295:return Yp;case 36296:return Zp;case 35678:case 36198:case 36298:case 36306:case 35682:return Jp;case 35679:case 36299:case 36307:return Kp;case 35680:case 36300:case 36308:case 36293:return Qp;case 36289:case 36303:case 36311:case 36292:return em}}(t.type)}},vl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=function(i){switch(i){case 5126:return tm;case 35664:return nm;case 35665:return im;case 35666:return rm;case 35674:return sm;case 35675:return am;case 35676:return om;case 5124:case 35670:return lm;case 35667:case 35671:return cm;case 35668:case 35672:return hm;case 35669:case 35673:return um;case 5125:return dm;case 36294:return pm;case 36295:return mm;case 36296:return fm;case 35678:case 36198:case 36298:case 36306:case 35682:return gm;case 35679:case 36299:case 36307:return _m;case 35680:case 36300:case 36308:case 36293:return vm;case 36289:case 36303:case 36311:case 36292:return ym}}(t.type)}},yl=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let i=this.seq;for(let s=0,a=i.length;s!==a;++s){let o=i[s];o.setValue(e,t[o.id],n)}}},jo=/(\w+)(\])?(\[|\.)?/g;Qi=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){let s=e.getActiveUniform(t,i);xm(s,e.getUniformLocation(t,s.name),this)}}setValue(e,t,n,i){let s=this.map[t];s!==void 0&&s.setValue(e,n,i)}setOptional(e,t,n){let i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let s=0,a=t.length;s!==a;++s){let o=t[s],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,i)}}static seqWithValue(e,t){let n=[];for(let i=0,s=e.length;i!==s;++i){let a=e[i];a.id in t&&n.push(a)}return n}};bm=37297,Mm=0;Em=/^[ \t]*#include +<([\w\d./]+)>/gm;Tm=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);Rm=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;Lm=0,bl=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,i=this._getShaderStage(t),s=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(i)===!1&&(a.add(i),i.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Ml(e),t.set(e,n)),n}},Ml=class{constructor(e){this.id=Lm++,this.code=e,this.usedTimes=0}};Fm=0;Sl=class extends rn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},wl=class extends rn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};El=class extends Mt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},it=class extends ot{constructor(){super(),this.isGroup=!0,this.type="Group"}},$m={type:"move"},Lr=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new it,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new it,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new w,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new w),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new it,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new w,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new w),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,s=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let v of e.hand.values()){let m=t.getJointPose(v,n),y=this._getHandJoint(c,v);m!==null&&(y.matrix.fromArray(m.transform.matrix),y.matrix.decompose(y.position,y.rotation,y.scale),y.matrixWorldNeedsUpdate=!0,y.jointRadius=m.radius),y.visible=m!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),p=.02,f=.005;c.inputState.pinching&&d>p+f?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=p-f&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&s!==null&&(i=s),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent($m)))}return o!==null&&(o.visible=i!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new it;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Tl=class extends dn{constructor(e,t){super();let n=this,i=null,s=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,d=null,p=null,f=null,v=t.getContextAttributes(),m=null,y=null,g=[],_=[],b=new ie,T=null,M=new Mt;M.layers.enable(1),M.viewport=new Ze;let E=new Mt;E.layers.enable(2),E.viewport=new Ze;let N=[M,E],I=new El;I.layers.enable(1),I.layers.enable(2);let B=null,D=null;function P(H){let Y=_.indexOf(H.inputSource);if(Y===-1)return;let he=g[Y];he!==void 0&&(he.update(H.inputSource,H.frame,c||a),he.dispatchEvent({type:H.type,data:H.inputSource}))}function O(){i.removeEventListener("select",P),i.removeEventListener("selectstart",P),i.removeEventListener("selectend",P),i.removeEventListener("squeeze",P),i.removeEventListener("squeezestart",P),i.removeEventListener("squeezeend",P),i.removeEventListener("end",O),i.removeEventListener("inputsourceschange",k);for(let H=0;H<g.length;H++){let Y=_[H];Y!==null&&(_[H]=null,g[H].disconnect(Y))}B=null,D=null,e.setRenderTarget(m),p=null,d=null,u=null,i=null,y=null,J.stop(),n.isPresenting=!1,e.setPixelRatio(T),e.setSize(b.width,b.height,!1),n.dispatchEvent({type:"sessionend"})}function k(H){for(let Y=0;Y<H.removed.length;Y++){let he=H.removed[Y],A=_.indexOf(he);A>=0&&(_[A]=null,g[A].disconnect(he))}for(let Y=0;Y<H.added.length;Y++){let he=H.added[Y],A=_.indexOf(he);if(A===-1){for(let z=0;z<g.length;z++){if(z>=_.length){_.push(he),A=z;break}if(_[z]===null){_[z]=he,A=z;break}}if(A===-1)break}let R=g[A];R&&R.connect(he)}}this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(H){let Y=g[H];return Y===void 0&&(Y=new Lr,g[H]=Y),Y.getTargetRaySpace()},this.getControllerGrip=function(H){let Y=g[H];return Y===void 0&&(Y=new Lr,g[H]=Y),Y.getGripSpace()},this.getHand=function(H){let Y=g[H];return Y===void 0&&(Y=new Lr,g[H]=Y),Y.getHandSpace()},this.setFramebufferScaleFactor=function(H){s=H,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(H){o=H,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(H){c=H},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return u},this.getFrame=function(){return f},this.getSession=function(){return i},this.setSession=async function(H){if(i=H,i!==null){if(m=e.getRenderTarget(),i.addEventListener("select",P),i.addEventListener("selectstart",P),i.addEventListener("selectend",P),i.addEventListener("squeeze",P),i.addEventListener("squeezestart",P),i.addEventListener("squeezeend",P),i.addEventListener("end",O),i.addEventListener("inputsourceschange",k),v.xrCompatible!==!0&&await t.makeXRCompatible(),T=e.getPixelRatio(),e.getSize(b),i.renderState.layers===void 0||e.capabilities.isWebGL2===!1){let Y={antialias:i.renderState.layers!==void 0||v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:s};p=new XRWebGLLayer(i,t,Y),i.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),y=new Pn(p.framebufferWidth,p.framebufferHeight,{format:ln,type:di,colorSpace:e.outputColorSpace,stencilBuffer:v.stencil})}else{let Y=null,he=null,A=null;v.depth&&(A=v.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Y=v.stencil?ir:mi,he=v.stencil?pi:qn);let R={colorFormat:t.RGBA8,depthFormat:A,scaleFactor:s};u=new XRWebGLBinding(i,t),d=u.createProjectionLayer(R),i.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new Pn(d.textureWidth,d.textureHeight,{format:ln,type:di,depthTexture:new va(d.textureWidth,d.textureHeight,he,void 0,void 0,void 0,void 0,void 0,void 0,Y),stencilBuffer:v.stencil,colorSpace:e.outputColorSpace,samples:v.antialias?4:0}),e.properties.get(y).__ignoreDepthValues=d.ignoreDepthValues}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await i.requestReferenceSpace(o),J.setContext(i),J.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode};let ee=new w,oe=new w;function K(H,Y){Y===null?H.matrixWorld.copy(H.matrix):H.matrixWorld.multiplyMatrices(Y.matrixWorld,H.matrix),H.matrixWorldInverse.copy(H.matrixWorld).invert()}this.updateCamera=function(H){if(i===null)return;I.near=E.near=M.near=H.near,I.far=E.far=M.far=H.far,B===I.near&&D===I.far||(i.updateRenderState({depthNear:I.near,depthFar:I.far}),B=I.near,D=I.far);let Y=H.parent,he=I.cameras;K(I,Y);for(let A=0;A<he.length;A++)K(he[A],Y);he.length===2?function(A,R,z){ee.setFromMatrixPosition(R.matrixWorld),oe.setFromMatrixPosition(z.matrixWorld);let q=ee.distanceTo(oe),L=R.projectionMatrix.elements,j=z.projectionMatrix.elements,U=L[14]/(L[10]-1),F=L[14]/(L[10]+1),G=(L[9]+1)/L[5],te=(L[9]-1)/L[5],Q=(L[8]-1)/L[0],S=(j[8]+1)/j[0],re=U*Q,V=U*S,W=q/(-Q+S),se=W*-Q;R.matrixWorld.decompose(A.position,A.quaternion,A.scale),A.translateX(se),A.translateZ(W),A.matrixWorld.compose(A.position,A.quaternion,A.scale),A.matrixWorldInverse.copy(A.matrixWorld).invert();let ce=U+W,de=F+W,pe=re-se,Se=V+(q-se),me=G*F/de*ce,_e=te*F/de*ce;A.projectionMatrix.makePerspective(pe,Se,me,_e,ce,de),A.projectionMatrixInverse.copy(A.projectionMatrix).invert()}(I,M,E):I.projectionMatrix.copy(M.projectionMatrix),function(A,R,z){z===null?A.matrix.copy(R.matrixWorld):(A.matrix.copy(z.matrixWorld),A.matrix.invert(),A.matrix.multiply(R.matrixWorld)),A.matrix.decompose(A.position,A.quaternion,A.scale),A.updateMatrixWorld(!0),A.projectionMatrix.copy(R.projectionMatrix),A.projectionMatrixInverse.copy(R.projectionMatrixInverse),A.isPerspectiveCamera&&(A.fov=2*Or*Math.atan(1/A.projectionMatrix.elements[5]),A.zoom=1)}(H,I,Y)},this.getCamera=function(){return I},this.getFoveation=function(){if(d!==null||p!==null)return l},this.setFoveation=function(H){l=H,d!==null&&(d.fixedFoveation=H),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=H)};let X=null,J=new Wu;J.setAnimationLoop(function(H,Y){if(h=Y.getViewerPose(c||a),f=Y,h!==null){let he=h.views;p!==null&&(e.setRenderTargetFramebuffer(y,p.framebuffer),e.setRenderTarget(y));let A=!1;he.length!==I.cameras.length&&(I.cameras.length=0,A=!0);for(let R=0;R<he.length;R++){let z=he[R],q=null;if(p!==null)q=p.getViewport(z);else{let j=u.getViewSubImage(d,z);q=j.viewport,R===0&&(e.setRenderTargetTextures(y,j.colorTexture,d.ignoreDepthValues?void 0:j.depthStencilTexture),e.setRenderTarget(y))}let L=N[R];L===void 0&&(L=new Mt,L.layers.enable(R),L.viewport=new Ze,N[R]=L),L.matrix.fromArray(z.transform.matrix),L.matrix.decompose(L.position,L.quaternion,L.scale),L.projectionMatrix.fromArray(z.projectionMatrix),L.projectionMatrixInverse.copy(L.projectionMatrix).invert(),L.viewport.set(q.x,q.y,q.width,q.height),R===0&&(I.matrix.copy(L.matrix),I.matrix.decompose(I.position,I.quaternion,I.scale)),A===!0&&I.cameras.push(L)}}for(let he=0;he<g.length;he++){let A=_[he],R=g[he];A!==null&&R!==void 0&&R.update(A,Y,c||a)}X&&X(H,Y),Y.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Y}),f=null}),this.setAnimationLoop=function(H){X=H},this.dispose=function(){}}};zr=class{constructor(e={}){let{canvas:t=np(),context:n=null,depth:i=!0,stencil:s=!0,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1}=e,d;this.isWebGLRenderer=!0,d=n!==null?n.getContextAttributes().alpha:a;let p=new Uint32Array(4),f=new Int32Array(4),v=null,m=null,y=[],g=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=at,this._useLegacyLights=!1,this.toneMapping=Jn,this.toneMappingExposure=1;let _=this,b=!1,T=0,M=0,E=null,N=-1,I=null,B=new Ze,D=new Ze,P=null,O=new Te(0),k=0,ee=t.width,oe=t.height,K=1,X=null,J=null,H=new Ze(0,0,ee,oe),Y=new Ze(0,0,ee,oe),he=!1,A=new ar,R=!1,z=!1,q=null,L=new Re,j=new ie,U=new w,F={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function G(){return E===null?K:1}let te,Q,S,re,V,W,se,ce,de,pe,Se,me,_e,Ce,lt,ye,Ne,Ue,Si,gn,wi,Ct,_t,Dt,x=n;function fe(C,$){for(let Z=0;Z<C.length;Z++){let ae=C[Z],ne=t.getContext(ae,$);if(ne!==null)return ne}return null}try{let C={alpha:!0,depth:i,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${il}`),t.addEventListener("webglcontextlost",mt,!1),t.addEventListener("webglcontextrestored",$t,!1),t.addEventListener("webglcontextcreationerror",St,!1),x===null){let $=["webgl2","webgl","experimental-webgl"];if(_.isWebGL1Renderer===!0&&$.shift(),x=fe($,C),x===null)throw fe($)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&x instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),x.getShaderPrecisionFormat===void 0&&(x.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(C){throw console.error("THREE.WebGLRenderer: "+C.message),C}function Ie(){te=new Rp(x),Q=new wp(x,te,e),te.init(Q),Ct=new Wm(x,te,Q),S=new Gm(x,te,Q),re=new Lp(x),V=new Dm,W=new Vm(x,te,S,V,Q,Ct,re),se=new Tp(_),ce=new Ap(_),de=new xp(x,Q),_t=new Mp(x,te,de,Q),pe=new Cp(x,de,re,_t),Se=new Up(x,pe,de,re),Si=new Np(x,Q,W),ye=new Ep(V),me=new Im(_,se,ce,te,Q,_t,ye),_e=new jm(_,V),Ce=new Um,lt=new zm(te,Q),Ue=new bp(_,se,ce,S,Se,d,l),Ne=new Hm(_,Se,Q),Dt=new Xm(x,re,Q,S),gn=new Sp(x,te,re,Q),wi=new Pp(x,te,re,Q),re.programs=me.programs,_.capabilities=Q,_.extensions=te,_.properties=V,_.renderLists=Ce,_.shadowMap=Ne,_.state=S,_.info=re}Ie();let Ae=new Tl(_,x);function mt(C){C.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),b=!0}function $t(){console.log("THREE.WebGLRenderer: Context Restored."),b=!1;let C=re.autoReset,$=Ne.enabled,Z=Ne.autoUpdate,ae=Ne.needsUpdate,ne=Ne.type;Ie(),re.autoReset=C,Ne.enabled=$,Ne.autoUpdate=Z,Ne.needsUpdate=ae,Ne.type=ne}function St(C){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",C.statusMessage)}function Za(C){let $=C.target;$.removeEventListener("dispose",Za),function(Z){(function(ae){let ne=V.get(ae).programs;ne!==void 0&&(ne.forEach(function(ue){me.releaseProgram(ue)}),ae.isShaderMaterial&&me.releaseShaderCache(ae))})(Z),V.remove(Z)}($)}function ts(C,$,Z){C.transparent===!0&&C.side===2&&C.forceSinglePass===!1?(C.side=It,C.needsUpdate=!0,ns(C,$,Z),C.side=Qn,C.needsUpdate=!0,ns(C,$,Z),C.side=2):ns(C,$,Z)}this.xr=Ae,this.getContext=function(){return x},this.getContextAttributes=function(){return x.getContextAttributes()},this.forceContextLoss=function(){let C=te.get("WEBGL_lose_context");C&&C.loseContext()},this.forceContextRestore=function(){let C=te.get("WEBGL_lose_context");C&&C.restoreContext()},this.getPixelRatio=function(){return K},this.setPixelRatio=function(C){C!==void 0&&(K=C,this.setSize(ee,oe,!1))},this.getSize=function(C){return C.set(ee,oe)},this.setSize=function(C,$,Z=!0){Ae.isPresenting?console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting."):(ee=C,oe=$,t.width=Math.floor(C*K),t.height=Math.floor($*K),Z===!0&&(t.style.width=C+"px",t.style.height=$+"px"),this.setViewport(0,0,C,$))},this.getDrawingBufferSize=function(C){return C.set(ee*K,oe*K).floor()},this.setDrawingBufferSize=function(C,$,Z){ee=C,oe=$,K=Z,t.width=Math.floor(C*Z),t.height=Math.floor($*Z),this.setViewport(0,0,C,$)},this.getCurrentViewport=function(C){return C.copy(B)},this.getViewport=function(C){return C.copy(H)},this.setViewport=function(C,$,Z,ae){C.isVector4?H.set(C.x,C.y,C.z,C.w):H.set(C,$,Z,ae),S.viewport(B.copy(H).multiplyScalar(K).floor())},this.getScissor=function(C){return C.copy(Y)},this.setScissor=function(C,$,Z,ae){C.isVector4?Y.set(C.x,C.y,C.z,C.w):Y.set(C,$,Z,ae),S.scissor(D.copy(Y).multiplyScalar(K).floor())},this.getScissorTest=function(){return he},this.setScissorTest=function(C){S.setScissorTest(he=C)},this.setOpaqueSort=function(C){X=C},this.setTransparentSort=function(C){J=C},this.getClearColor=function(C){return C.copy(Ue.getClearColor())},this.setClearColor=function(){Ue.setClearColor.apply(Ue,arguments)},this.getClearAlpha=function(){return Ue.getClearAlpha()},this.setClearAlpha=function(){Ue.setClearAlpha.apply(Ue,arguments)},this.clear=function(C=!0,$=!0,Z=!0){let ae=0;if(C){let ne=!1;if(E!==null){let ue=E.texture.format;ne=ue===Fu||ue===Ou||ue===Uu}if(ne){let ue=E.texture.type,be=ue===di||ue===qn||ue===dc||ue===pi||ue===Du||ue===Nu,Ee=Ue.getClearColor(),Oe=Ue.getClearAlpha(),Be=Ee.r,ke=Ee.g,ze=Ee.b;be?(p[0]=Be,p[1]=ke,p[2]=ze,p[3]=Oe,x.clearBufferuiv(x.COLOR,0,p)):(f[0]=Be,f[1]=ke,f[2]=ze,f[3]=Oe,x.clearBufferiv(x.COLOR,0,f))}else ae|=x.COLOR_BUFFER_BIT}$&&(ae|=x.DEPTH_BUFFER_BIT),Z&&(ae|=x.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),x.clear(ae)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",mt,!1),t.removeEventListener("webglcontextrestored",$t,!1),t.removeEventListener("webglcontextcreationerror",St,!1),Ce.dispose(),lt.dispose(),V.dispose(),se.dispose(),ce.dispose(),Se.dispose(),_t.dispose(),Dt.dispose(),me.dispose(),Ae.dispose(),Ae.removeEventListener("sessionstart",Bt),Ae.removeEventListener("sessionend",kt),q&&(q.dispose(),q=null),jt.stop()},this.renderBufferDirect=function(C,$,Z,ae,ne,ue){$===null&&($=F);let be=ne.isMesh&&ne.matrixWorld.determinant()<0,Ee=function(ht,zt,Pt,He,Ge){zt.isScene!==!0&&(zt=F),W.resetTextureUnits();let dr=zt.fog,Ja=He.isMeshStandardMaterial?zt.environment:null,ud=E===null?_.outputColorSpace:E.isXRRenderTarget===!0?E.texture.colorSpace:Cn,is=(He.isMeshStandardMaterial?ce:se).get(He.envMap||Ja),dd=He.vertexColors===!0&&!!Pt.attributes.color&&Pt.attributes.color.itemSize===4,pd=!!Pt.attributes.tangent&&(!!He.normalMap||He.anisotropy>0),md=!!Pt.morphAttributes.position,fd=!!Pt.morphAttributes.normal,gd=!!Pt.morphAttributes.color,Mc=Jn;He.toneMapped&&(E!==null&&E.isXRRenderTarget!==!0||(Mc=_.toneMapping));let Sc=Pt.morphAttributes.position||Pt.morphAttributes.normal||Pt.morphAttributes.color,_d=Sc!==void 0?Sc.length:0,Ve=V.get(He),vd=m.state.lights;if(R===!0&&(z===!0||ht!==I)){let Ht=ht===I&&He.id===N;ye.setState(He,ht,Ht)}let qt=!1;He.version===Ve.__version?Ve.needsLights&&Ve.lightsStateVersion!==vd.state.version||Ve.outputColorSpace!==ud||Ge.isBatchedMesh&&Ve.batching===!1?qt=!0:Ge.isBatchedMesh||Ve.batching!==!0?Ge.isInstancedMesh&&Ve.instancing===!1?qt=!0:Ge.isInstancedMesh||Ve.instancing!==!0?Ge.isSkinnedMesh&&Ve.skinning===!1?qt=!0:Ge.isSkinnedMesh||Ve.skinning!==!0?Ge.isInstancedMesh&&Ve.instancingColor===!0&&Ge.instanceColor===null||Ge.isInstancedMesh&&Ve.instancingColor===!1&&Ge.instanceColor!==null||Ve.envMap!==is||He.fog===!0&&Ve.fog!==dr?qt=!0:Ve.numClippingPlanes===void 0||Ve.numClippingPlanes===ye.numPlanes&&Ve.numIntersection===ye.numIntersection?(Ve.vertexAlphas!==dd||Ve.vertexTangents!==pd||Ve.morphTargets!==md||Ve.morphNormals!==fd||Ve.morphColors!==gd||Ve.toneMapping!==Mc||Q.isWebGL2===!0&&Ve.morphTargetsCount!==_d)&&(qt=!0):qt=!0:qt=!0:qt=!0:qt=!0:(qt=!0,Ve.__version=He.version);let ti=Ve.currentProgram;qt===!0&&(ti=ns(He,zt,Ge));let wc=!1,pr=!1,Ka=!1,vt=ti.getUniforms(),ni=Ve.uniforms;if(S.useProgram(ti.program)&&(wc=!0,pr=!0,Ka=!0),He.id!==N&&(N=He.id,pr=!0),wc||I!==ht){vt.setValue(x,"projectionMatrix",ht.projectionMatrix),vt.setValue(x,"viewMatrix",ht.matrixWorldInverse);let Ht=vt.map.cameraPosition;Ht!==void 0&&Ht.setValue(x,U.setFromMatrixPosition(ht.matrixWorld)),Q.logarithmicDepthBuffer&&vt.setValue(x,"logDepthBufFC",2/(Math.log(ht.far+1)/Math.LN2)),(He.isMeshPhongMaterial||He.isMeshToonMaterial||He.isMeshLambertMaterial||He.isMeshBasicMaterial||He.isMeshStandardMaterial||He.isShaderMaterial)&&vt.setValue(x,"isOrthographic",ht.isOrthographicCamera===!0),I!==ht&&(I=ht,pr=!0,Ka=!0)}if(Ge.isSkinnedMesh){vt.setOptional(x,Ge,"bindMatrix"),vt.setOptional(x,Ge,"bindMatrixInverse");let Ht=Ge.skeleton;Ht&&(Q.floatVertexTextures?(Ht.boneTexture===null&&Ht.computeBoneTexture(),vt.setValue(x,"boneTexture",Ht.boneTexture,W)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}Ge.isBatchedMesh&&(vt.setOptional(x,Ge,"batchingTexture"),vt.setValue(x,"batchingTexture",Ge._matricesTexture,W));let Qa=Pt.morphAttributes;(Qa.position!==void 0||Qa.normal!==void 0||Qa.color!==void 0&&Q.isWebGL2===!0)&&Si.update(Ge,Pt,ti),(pr||Ve.receiveShadow!==Ge.receiveShadow)&&(Ve.receiveShadow=Ge.receiveShadow,vt.setValue(x,"receiveShadow",Ge.receiveShadow)),He.isMeshGouraudMaterial&&He.envMap!==null&&(ni.envMap.value=is,ni.flipEnvMap.value=is.isCubeTexture&&is.isRenderTargetTexture===!1?-1:1),pr&&(vt.setValue(x,"toneMappingExposure",_.toneMappingExposure),Ve.needsLights&&(Yt=Ka,(sn=ni).ambientLightColor.needsUpdate=Yt,sn.lightProbe.needsUpdate=Yt,sn.directionalLights.needsUpdate=Yt,sn.directionalLightShadows.needsUpdate=Yt,sn.pointLights.needsUpdate=Yt,sn.pointLightShadows.needsUpdate=Yt,sn.spotLights.needsUpdate=Yt,sn.spotLightShadows.needsUpdate=Yt,sn.rectAreaLights.needsUpdate=Yt,sn.hemisphereLights.needsUpdate=Yt),dr&&He.fog===!0&&_e.refreshFogUniforms(ni,dr),_e.refreshMaterialUniforms(ni,He,K,oe,q),Qi.upload(x,xc(Ve),ni,W));var sn,Yt;if(He.isShaderMaterial&&He.uniformsNeedUpdate===!0&&(Qi.upload(x,xc(Ve),ni,W),He.uniformsNeedUpdate=!1),He.isSpriteMaterial&&vt.setValue(x,"center",Ge.center),vt.setValue(x,"modelViewMatrix",Ge.modelViewMatrix),vt.setValue(x,"normalMatrix",Ge.normalMatrix),vt.setValue(x,"modelMatrix",Ge.matrixWorld),He.isShaderMaterial||He.isRawShaderMaterial){let Ht=He.uniformsGroups;for(let eo=0,yd=Ht.length;eo<yd;eo++)if(Q.isWebGL2){let Ec=Ht[eo];Dt.update(Ec,ti),Dt.bind(Ec,ti)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return ti}(C,$,Z,ae,ne);S.setMaterial(ae,be);let Oe=Z.index,Be=1;if(ae.wireframe===!0){if(Oe=pe.getWireframeAttribute(Z),Oe===void 0)return;Be=2}let ke=Z.drawRange,ze=Z.attributes.position,et=ke.start*Be,Xt=(ke.start+ke.count)*Be;ue!==null&&(et=Math.max(et,ue.start*Be),Xt=Math.min(Xt,(ue.start+ue.count)*Be)),Oe!==null?(et=Math.max(et,0),Xt=Math.min(Xt,Oe.count)):ze!=null&&(et=Math.max(et,0),Xt=Math.min(Xt,ze.count));let vn=Xt-et;if(vn<0||vn===1/0)return;let ei;_t.setup(ne,ae,Ee,Z,Oe);let tt=gn;if(Oe!==null&&(ei=de.get(Oe),tt=wi,tt.setIndex(ei)),ne.isMesh)ae.wireframe===!0?(S.setLineWidth(ae.wireframeLinewidth*G()),tt.setMode(x.LINES)):tt.setMode(x.TRIANGLES);else if(ne.isLine){let ht=ae.linewidth;ht===void 0&&(ht=1),S.setLineWidth(ht*G()),ne.isLineSegments?tt.setMode(x.LINES):ne.isLineLoop?tt.setMode(x.LINE_LOOP):tt.setMode(x.LINE_STRIP)}else ne.isPoints?tt.setMode(x.POINTS):ne.isSprite&&tt.setMode(x.TRIANGLES);if(ne.isBatchedMesh)tt.renderMultiDraw(ne._multiDrawStarts,ne._multiDrawCounts,ne._multiDrawCount);else if(ne.isInstancedMesh)tt.renderInstances(et,vn,ne.count);else if(Z.isInstancedBufferGeometry){let ht=Z._maxInstanceCount!==void 0?Z._maxInstanceCount:1/0,zt=Math.min(Z.instanceCount,ht);tt.renderInstances(et,vn,zt)}else tt.render(et,vn)},this.compile=function(C,$,Z=null){Z===null&&(Z=C),m=lt.get(Z),m.init(),g.push(m),Z.traverseVisible(function(ne){ne.isLight&&ne.layers.test($.layers)&&(m.pushLight(ne),ne.castShadow&&m.pushShadow(ne))}),C!==Z&&C.traverseVisible(function(ne){ne.isLight&&ne.layers.test($.layers)&&(m.pushLight(ne),ne.castShadow&&m.pushShadow(ne))}),m.setupLights(_._useLegacyLights);let ae=new Set;return C.traverse(function(ne){let ue=ne.material;if(ue)if(Array.isArray(ue))for(let be=0;be<ue.length;be++){let Ee=ue[be];ts(Ee,Z,ne),ae.add(Ee)}else ts(ue,Z,ne),ae.add(ue)}),g.pop(),m=null,ae},this.compileAsync=function(C,$,Z=null){let ae=this.compile(C,$,Z);return new Promise(ne=>{function ue(){ae.forEach(function(be){V.get(be).currentProgram.isReady()&&ae.delete(be)}),ae.size!==0?setTimeout(ue,10):ne(C)}te.get("KHR_parallel_shader_compile")!==null?ue():setTimeout(ue,10)})};let Ei=null;function Bt(){jt.stop()}function kt(){jt.start()}let jt=new Wu;function On(C,$,Z,ae){if(C.visible===!1)return;if(C.layers.test($.layers)){if(C.isGroup)Z=C.renderOrder;else if(C.isLOD)C.autoUpdate===!0&&C.update($);else if(C.isLight)m.pushLight(C),C.castShadow&&m.pushShadow(C);else if(C.isSprite){if(!C.frustumCulled||A.intersectsSprite(C)){ae&&U.setFromMatrixPosition(C.matrixWorld).applyMatrix4(L);let ue=Se.update(C),be=C.material;be.visible&&v.push(C,ue,be,Z,U.z,null)}}else if((C.isMesh||C.isLine||C.isPoints)&&(!C.frustumCulled||A.intersectsObject(C))){let ue=Se.update(C),be=C.material;if(ae&&(C.boundingSphere!==void 0?(C.boundingSphere===null&&C.computeBoundingSphere(),U.copy(C.boundingSphere.center)):(ue.boundingSphere===null&&ue.computeBoundingSphere(),U.copy(ue.boundingSphere.center)),U.applyMatrix4(C.matrixWorld).applyMatrix4(L)),Array.isArray(be)){let Ee=ue.groups;for(let Oe=0,Be=Ee.length;Oe<Be;Oe++){let ke=Ee[Oe],ze=be[ke.materialIndex];ze&&ze.visible&&v.push(C,ue,ze,Z,U.z,ke)}}else be.visible&&v.push(C,ue,be,Z,U.z,null)}}let ne=C.children;for(let ue=0,be=ne.length;ue<be;ue++)On(ne[ue],$,Z,ae)}function Fn(C,$,Z,ae){let ne=C.opaque,ue=C.transmissive,be=C.transparent;m.setupLightsView(Z),R===!0&&ye.setGlobalState(_.clippingPlanes,Z),ue.length>0&&function(Ee,Oe,Be,ke){if((Be.isScene===!0?Be.overrideMaterial:null)!==null)return;let et=Q.isWebGL2;q===null&&(q=new Pn(1,1,{generateMipmaps:!0,type:te.has("EXT_color_buffer_half_float")?Ur:di,minFilter:ta,samples:et?4:0})),_.getDrawingBufferSize(j),et?q.setSize(j.x,j.y):q.setSize(la(j.x),la(j.y));let Xt=_.getRenderTarget();_.setRenderTarget(q),_.getClearColor(O),k=_.getClearAlpha(),k<1&&_.setClearColor(16777215,.5),_.clear();let vn=_.toneMapping;_.toneMapping=Jn,_n(Ee,Be,ke),W.updateMultisampleRenderTarget(q),W.updateRenderTargetMipmap(q);let ei=!1;for(let tt=0,ht=Oe.length;tt<ht;tt++){let zt=Oe[tt],Pt=zt.object,He=zt.geometry,Ge=zt.material,dr=zt.group;if(Ge.side===2&&Pt.layers.test(ke.layers)){let Ja=Ge.side;Ge.side=It,Ge.needsUpdate=!0,yc(Pt,Be,ke,He,Ge,dr),Ge.side=Ja,Ge.needsUpdate=!0,ei=!0}}ei===!0&&(W.updateMultisampleRenderTarget(q),W.updateRenderTargetMipmap(q)),_.setRenderTarget(Xt),_.setClearColor(O,k),_.toneMapping=vn}(ne,ue,$,Z),ae&&S.viewport(B.copy(ae)),ne.length>0&&_n(ne,$,Z),ue.length>0&&_n(ue,$,Z),be.length>0&&_n(be,$,Z),S.buffers.depth.setTest(!0),S.buffers.depth.setMask(!0),S.buffers.color.setMask(!0),S.setPolygonOffset(!1)}function _n(C,$,Z){let ae=$.isScene===!0?$.overrideMaterial:null;for(let ne=0,ue=C.length;ne<ue;ne++){let be=C[ne],Ee=be.object,Oe=be.geometry,Be=ae===null?be.material:ae,ke=be.group;Ee.layers.test(Z.layers)&&yc(Ee,$,Z,Oe,Be,ke)}}function yc(C,$,Z,ae,ne,ue){C.onBeforeRender(_,$,Z,ae,ne,ue),C.modelViewMatrix.multiplyMatrices(Z.matrixWorldInverse,C.matrixWorld),C.normalMatrix.getNormalMatrix(C.modelViewMatrix),ne.onBeforeRender(_,$,Z,ae,C,ue),ne.transparent===!0&&ne.side===2&&ne.forceSinglePass===!1?(ne.side=It,ne.needsUpdate=!0,_.renderBufferDirect(Z,$,ae,ne,C,ue),ne.side=Qn,ne.needsUpdate=!0,_.renderBufferDirect(Z,$,ae,ne,C,ue),ne.side=2):_.renderBufferDirect(Z,$,ae,ne,C,ue),C.onAfterRender(_,$,Z,ae,ne,ue)}function ns(C,$,Z){$.isScene!==!0&&($=F);let ae=V.get(C),ne=m.state.lights,ue=m.state.shadowsArray,be=ne.state.version,Ee=me.getParameters(C,ne.state,ue,$,Z),Oe=me.getProgramCacheKey(Ee),Be=ae.programs;ae.environment=C.isMeshStandardMaterial?$.environment:null,ae.fog=$.fog,ae.envMap=(C.isMeshStandardMaterial?ce:se).get(C.envMap||ae.environment),Be===void 0&&(C.addEventListener("dispose",Za),Be=new Map,ae.programs=Be);let ke=Be.get(Oe);if(ke!==void 0){if(ae.currentProgram===ke&&ae.lightsStateVersion===be)return bc(C,Ee),ke}else Ee.uniforms=me.getUniforms(C),C.onBuild(Z,Ee,_),C.onBeforeCompile(Ee,_),ke=me.acquireProgram(Ee,Oe),Be.set(Oe,ke),ae.uniforms=Ee.uniforms;let ze=ae.uniforms;return(C.isShaderMaterial||C.isRawShaderMaterial)&&C.clipping!==!0||(ze.clippingPlanes=ye.uniform),bc(C,Ee),ae.needsLights=function(et){return et.isMeshLambertMaterial||et.isMeshToonMaterial||et.isMeshPhongMaterial||et.isMeshStandardMaterial||et.isShadowMaterial||et.isShaderMaterial&&et.lights===!0}(C),ae.lightsStateVersion=be,ae.needsLights&&(ze.ambientLightColor.value=ne.state.ambient,ze.lightProbe.value=ne.state.probe,ze.directionalLights.value=ne.state.directional,ze.directionalLightShadows.value=ne.state.directionalShadow,ze.spotLights.value=ne.state.spot,ze.spotLightShadows.value=ne.state.spotShadow,ze.rectAreaLights.value=ne.state.rectArea,ze.ltc_1.value=ne.state.rectAreaLTC1,ze.ltc_2.value=ne.state.rectAreaLTC2,ze.pointLights.value=ne.state.point,ze.pointLightShadows.value=ne.state.pointShadow,ze.hemisphereLights.value=ne.state.hemi,ze.directionalShadowMap.value=ne.state.directionalShadowMap,ze.directionalShadowMatrix.value=ne.state.directionalShadowMatrix,ze.spotShadowMap.value=ne.state.spotShadowMap,ze.spotLightMatrix.value=ne.state.spotLightMatrix,ze.spotLightMap.value=ne.state.spotLightMap,ze.pointShadowMap.value=ne.state.pointShadowMap,ze.pointShadowMatrix.value=ne.state.pointShadowMatrix),ae.currentProgram=ke,ae.uniformsList=null,ke}function xc(C){if(C.uniformsList===null){let $=C.currentProgram.getUniforms();C.uniformsList=Qi.seqWithValue($.seq,C.uniforms)}return C.uniformsList}function bc(C,$){let Z=V.get(C);Z.outputColorSpace=$.outputColorSpace,Z.batching=$.batching,Z.instancing=$.instancing,Z.instancingColor=$.instancingColor,Z.skinning=$.skinning,Z.morphTargets=$.morphTargets,Z.morphNormals=$.morphNormals,Z.morphColors=$.morphColors,Z.morphTargetsCount=$.morphTargetsCount,Z.numClippingPlanes=$.numClippingPlanes,Z.numIntersection=$.numClipIntersection,Z.vertexAlphas=$.vertexAlphas,Z.vertexTangents=$.vertexTangents,Z.toneMapping=$.toneMapping}jt.setAnimationLoop(function(C){Ei&&Ei(C)}),typeof self<"u"&&jt.setContext(self),this.setAnimationLoop=function(C){Ei=C,Ae.setAnimationLoop(C),C===null?jt.stop():jt.start()},Ae.addEventListener("sessionstart",Bt),Ae.addEventListener("sessionend",kt),this.render=function(C,$){if($!==void 0&&$.isCamera!==!0)return void console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");if(b===!0)return;C.matrixWorldAutoUpdate===!0&&C.updateMatrixWorld(),$.parent===null&&$.matrixWorldAutoUpdate===!0&&$.updateMatrixWorld(),Ae.enabled===!0&&Ae.isPresenting===!0&&(Ae.cameraAutoUpdate===!0&&Ae.updateCamera($),$=Ae.getCamera()),C.isScene===!0&&C.onBeforeRender(_,C,$,E),m=lt.get(C,g.length),m.init(),g.push(m),L.multiplyMatrices($.projectionMatrix,$.matrixWorldInverse),A.setFromProjectionMatrix(L),z=this.localClippingEnabled,R=ye.init(this.clippingPlanes,z),v=Ce.get(C,y.length),v.init(),y.push(v),On(C,$,0,_.sortObjects),v.finish(),_.sortObjects===!0&&v.sort(X,J),this.info.render.frame++,R===!0&&ye.beginShadows();let Z=m.state.shadowsArray;if(Ne.render(Z,C,$),R===!0&&ye.endShadows(),this.info.autoReset===!0&&this.info.reset(),Ue.render(v,C),m.setupLights(_._useLegacyLights),$.isArrayCamera){let ae=$.cameras;for(let ne=0,ue=ae.length;ne<ue;ne++){let be=ae[ne];Fn(v,C,be,be.viewport)}}else Fn(v,C,$);E!==null&&(W.updateMultisampleRenderTarget(E),W.updateRenderTargetMipmap(E)),C.isScene===!0&&C.onAfterRender(_,C,$),_t.resetDefaultState(),N=-1,I=null,g.pop(),m=g.length>0?g[g.length-1]:null,y.pop(),v=y.length>0?y[y.length-1]:null},this.getActiveCubeFace=function(){return T},this.getActiveMipmapLevel=function(){return M},this.getRenderTarget=function(){return E},this.setRenderTargetTextures=function(C,$,Z){V.get(C.texture).__webglTexture=$,V.get(C.depthTexture).__webglTexture=Z;let ae=V.get(C);ae.__hasExternalTextures=!0,ae.__hasExternalTextures&&(ae.__autoAllocateDepthBuffer=Z===void 0,ae.__autoAllocateDepthBuffer||te.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),ae.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(C,$){let Z=V.get(C);Z.__webglFramebuffer=$,Z.__useDefaultFramebuffer=$===void 0},this.setRenderTarget=function(C,$=0,Z=0){E=C,T=$,M=Z;let ae=!0,ne=null,ue=!1,be=!1;if(C){let Ee=V.get(C);Ee.__useDefaultFramebuffer!==void 0?(S.bindFramebuffer(x.FRAMEBUFFER,null),ae=!1):Ee.__webglFramebuffer===void 0?W.setupRenderTarget(C):Ee.__hasExternalTextures&&W.rebindTextures(C,V.get(C.texture).__webglTexture,V.get(C.depthTexture).__webglTexture);let Oe=C.texture;(Oe.isData3DTexture||Oe.isDataArrayTexture||Oe.isCompressedArrayTexture)&&(be=!0);let Be=V.get(C).__webglFramebuffer;C.isWebGLCubeRenderTarget?(ne=Array.isArray(Be[$])?Be[$][Z]:Be[$],ue=!0):ne=Q.isWebGL2&&C.samples>0&&W.useMultisampledRTT(C)===!1?V.get(C).__webglMultisampledFramebuffer:Array.isArray(Be)?Be[Z]:Be,B.copy(C.viewport),D.copy(C.scissor),P=C.scissorTest}else B.copy(H).multiplyScalar(K).floor(),D.copy(Y).multiplyScalar(K).floor(),P=he;if(S.bindFramebuffer(x.FRAMEBUFFER,ne)&&Q.drawBuffers&&ae&&S.drawBuffers(C,ne),S.viewport(B),S.scissor(D),S.setScissorTest(P),ue){let Ee=V.get(C.texture);x.framebufferTexture2D(x.FRAMEBUFFER,x.COLOR_ATTACHMENT0,x.TEXTURE_CUBE_MAP_POSITIVE_X+$,Ee.__webglTexture,Z)}else if(be){let Ee=V.get(C.texture),Oe=$||0;x.framebufferTextureLayer(x.FRAMEBUFFER,x.COLOR_ATTACHMENT0,Ee.__webglTexture,Z||0,Oe)}N=-1},this.readRenderTargetPixels=function(C,$,Z,ae,ne,ue,be){if(!C||!C.isWebGLRenderTarget)return void console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ee=V.get(C).__webglFramebuffer;if(C.isWebGLCubeRenderTarget&&be!==void 0&&(Ee=Ee[be]),Ee){S.bindFramebuffer(x.FRAMEBUFFER,Ee);try{let Oe=C.texture,Be=Oe.format,ke=Oe.type;if(Be!==ln&&Ct.convert(Be)!==x.getParameter(x.IMPLEMENTATION_COLOR_READ_FORMAT))return void console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");let ze=ke===Ur&&(te.has("EXT_color_buffer_half_float")||Q.isWebGL2&&te.has("EXT_color_buffer_float"));if(!(ke===di||Ct.convert(ke)===x.getParameter(x.IMPLEMENTATION_COLOR_READ_TYPE)||ke===Yn&&(Q.isWebGL2||te.has("OES_texture_float")||te.has("WEBGL_color_buffer_float"))||ze))return void console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");$>=0&&$<=C.width-ae&&Z>=0&&Z<=C.height-ne&&x.readPixels($,Z,ae,ne,Ct.convert(Be),Ct.convert(ke),ue)}finally{let Oe=E!==null?V.get(E).__webglFramebuffer:null;S.bindFramebuffer(x.FRAMEBUFFER,Oe)}}},this.copyFramebufferToTexture=function(C,$,Z=0){let ae=Math.pow(2,-Z),ne=Math.floor($.image.width*ae),ue=Math.floor($.image.height*ae);W.setTexture2D($,0),x.copyTexSubImage2D(x.TEXTURE_2D,Z,0,0,C.x,C.y,ne,ue),S.unbindTexture()},this.copyTextureToTexture=function(C,$,Z,ae=0){let ne=$.image.width,ue=$.image.height,be=Ct.convert(Z.format),Ee=Ct.convert(Z.type);W.setTexture2D(Z,0),x.pixelStorei(x.UNPACK_FLIP_Y_WEBGL,Z.flipY),x.pixelStorei(x.UNPACK_PREMULTIPLY_ALPHA_WEBGL,Z.premultiplyAlpha),x.pixelStorei(x.UNPACK_ALIGNMENT,Z.unpackAlignment),$.isDataTexture?x.texSubImage2D(x.TEXTURE_2D,ae,C.x,C.y,ne,ue,be,Ee,$.image.data):$.isCompressedTexture?x.compressedTexSubImage2D(x.TEXTURE_2D,ae,C.x,C.y,$.mipmaps[0].width,$.mipmaps[0].height,be,$.mipmaps[0].data):x.texSubImage2D(x.TEXTURE_2D,ae,C.x,C.y,be,Ee,$.image),ae===0&&Z.generateMipmaps&&x.generateMipmap(x.TEXTURE_2D),S.unbindTexture()},this.copyTextureToTexture3D=function(C,$,Z,ae,ne=0){if(_.isWebGL1Renderer)return void console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");let ue=C.max.x-C.min.x+1,be=C.max.y-C.min.y+1,Ee=C.max.z-C.min.z+1,Oe=Ct.convert(ae.format),Be=Ct.convert(ae.type),ke;if(ae.isData3DTexture)W.setTexture3D(ae,0),ke=x.TEXTURE_3D;else{if(!ae.isDataArrayTexture&&!ae.isCompressedArrayTexture)return void console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");W.setTexture2DArray(ae,0),ke=x.TEXTURE_2D_ARRAY}x.pixelStorei(x.UNPACK_FLIP_Y_WEBGL,ae.flipY),x.pixelStorei(x.UNPACK_PREMULTIPLY_ALPHA_WEBGL,ae.premultiplyAlpha),x.pixelStorei(x.UNPACK_ALIGNMENT,ae.unpackAlignment);let ze=x.getParameter(x.UNPACK_ROW_LENGTH),et=x.getParameter(x.UNPACK_IMAGE_HEIGHT),Xt=x.getParameter(x.UNPACK_SKIP_PIXELS),vn=x.getParameter(x.UNPACK_SKIP_ROWS),ei=x.getParameter(x.UNPACK_SKIP_IMAGES),tt=Z.isCompressedTexture?Z.mipmaps[ne]:Z.image;x.pixelStorei(x.UNPACK_ROW_LENGTH,tt.width),x.pixelStorei(x.UNPACK_IMAGE_HEIGHT,tt.height),x.pixelStorei(x.UNPACK_SKIP_PIXELS,C.min.x),x.pixelStorei(x.UNPACK_SKIP_ROWS,C.min.y),x.pixelStorei(x.UNPACK_SKIP_IMAGES,C.min.z),Z.isDataTexture||Z.isData3DTexture?x.texSubImage3D(ke,ne,$.x,$.y,$.z,ue,be,Ee,Oe,Be,tt.data):Z.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),x.compressedTexSubImage3D(ke,ne,$.x,$.y,$.z,ue,be,Ee,Oe,tt.data)):x.texSubImage3D(ke,ne,$.x,$.y,$.z,ue,be,Ee,Oe,Be,tt),x.pixelStorei(x.UNPACK_ROW_LENGTH,ze),x.pixelStorei(x.UNPACK_IMAGE_HEIGHT,et),x.pixelStorei(x.UNPACK_SKIP_PIXELS,Xt),x.pixelStorei(x.UNPACK_SKIP_ROWS,vn),x.pixelStorei(x.UNPACK_SKIP_IMAGES,ei),ne===0&&ae.generateMipmaps&&x.generateMipmap(ke),S.unbindTexture()},this.initTexture=function(C){C.isCubeTexture?W.setTextureCube(C,0):C.isData3DTexture?W.setTexture3D(C,0):C.isDataArrayTexture||C.isCompressedArrayTexture?W.setTexture2DArray(C,0):W.setTexture2D(C,0),S.unbindTexture()},this.resetState=function(){T=0,M=0,E=null,S.reset(),_t.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return rr}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=e===pc?"display-p3":"srgb",t.unpackColorSpace=qe.workingColorSpace===Ga?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===at?fi:ku}set outputEncoding(e){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=e===fi?at:Cn}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(e){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=e}},Al=class extends zr{};Al.prototype.isWebGL1Renderer=!0;ya=class r{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new Te(e),this.near=t,this.far=n}clone(){return new r(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},xa=class extends ot{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}},Rl=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=cl,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.version=0,this.uuid=un()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return console.warn("THREE.InterleavedBuffer: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let i=0,s=this.stride;i<s;i++)this.array[e+i]=t.array[n+i];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=un()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=un()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},Et=new w,ba=class r{constructor(e,t,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Et.fromBufferAttribute(this,t),Et.applyMatrix4(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Et.fromBufferAttribute(this,t),Et.applyNormalMatrix(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Et.fromBufferAttribute(this,t),Et.transformDirection(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}setX(e,t){return this.normalized&&(t=Xe(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=Xe(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=Xe(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=Xe(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=hn(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=hn(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=hn(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=hn(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=Xe(t,this.array),n=Xe(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=Xe(t,this.array),n=Xe(n,this.array),i=Xe(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this}setXYZW(e,t,n,i,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=Xe(t,this.array),n=Xe(n,this.array),i=Xe(i,this.array),s=Xe(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this.data.array[e+3]=s,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[i+s])}return new Rt(new this.array.constructor(t),this.itemSize,this.normalized)}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new r(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[i+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Hr=class extends rn{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Te(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Er=new w,Xi=new w,qi=new w,Yi=new ie,Tr=new ie,Zu=new Re,Hs=new w,Ar=new w,Gs=new w,au=new ie,Xo=new ie,ou=new ie,Ma=class extends ot{constructor(e=new Hr){if(super(),this.isSprite=!0,this.type="Sprite",ji===void 0){ji=new Ye;let t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new Rl(t,5);ji.setIndex([0,1,2,0,2,3]),ji.setAttribute("position",new ba(n,3,0,!1)),ji.setAttribute("uv",new ba(n,2,3,!1))}this.geometry=ji,this.material=e,this.center=new ie(.5,.5)}raycast(e,t){e.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),Xi.setFromMatrixScale(this.matrixWorld),Zu.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),qi.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Xi.multiplyScalar(-qi.z);let n=this.material.rotation,i,s;n!==0&&(s=Math.cos(n),i=Math.sin(n));let a=this.center;Vs(Hs.set(-.5,-.5,0),qi,a,Xi,i,s),Vs(Ar.set(.5,-.5,0),qi,a,Xi,i,s),Vs(Gs.set(.5,.5,0),qi,a,Xi,i,s),au.set(0,0),Xo.set(1,0),ou.set(1,1);let o=e.ray.intersectTriangle(Hs,Ar,Gs,!1,Er);if(o===null&&(Vs(Ar.set(-.5,.5,0),qi,a,Xi,i,s),Xo.set(0,1),o=e.ray.intersectTriangle(Hs,Gs,Ar,!1,Er),o===null))return;let l=e.ray.origin.distanceTo(Er);l<e.near||l>e.far||t.push({distance:l,point:Er.clone(),uv:Zn.getInterpolation(Er,Hs,Ar,Gs,au,Xo,ou,new ie),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};Yf=new w,Zf=new w,Jf=new w,Kf=new Ze,Qf=new Ze,eg=new w,tg=new Re,ng=new w,ig=new mn,rg=new Re,sg=new Ln,ag=new Re,og=new Re,lg=new Re,cg=new Re,hg=new pn,ug=new Re,dg=new ge,pg=new mn,Cl=class{constructor(){this.index=0,this.pool=[],this.list=[]}push(e,t){let n=this.pool,i=this.list;this.index>=n.length&&n.push({start:-1,count:-1,z:-1});let s=n[this.index];i.push(s),this.index++,s.start=e.start,s.count=e.count,s.z=t}reset(){this.list.length=0,this.index=0}},mg=new Re,fg=new Re,gg=new Re,_g=new Re,vg=new ar,yg=new pn,xg=new mn,bg=new w,Mg=new Cl,Sg=new ge,gi=class extends rn{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Te(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},lu=new w,cu=new w,hu=new Re,qo=new Ln,Ws=new mn,or=class extends ot{constructor(e=new Ye,t=new gi){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let i=1,s=t.count;i<s;i++)lu.fromBufferAttribute(t,i-1),cu.fromBufferAttribute(t,i),n[i]=n[i-1],n[i]+=lu.distanceTo(cu);e.setAttribute("lineDistance",new we(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let n=this.geometry,i=this.matrixWorld,s=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ws.copy(n.boundingSphere),Ws.applyMatrix4(i),Ws.radius+=s,e.ray.intersectsSphere(Ws)===!1)return;hu.copy(i).invert(),qo.copy(e.ray).applyMatrix4(hu);let o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=new w,h=new w,u=new w,d=new w,p=this.isLineSegments?2:1,f=n.index,v=n.attributes.position;if(f!==null)for(let m=Math.max(0,a.start),y=Math.min(f.count,a.start+a.count)-1;m<y;m+=p){let g=f.getX(m),_=f.getX(m+1);if(c.fromBufferAttribute(v,g),h.fromBufferAttribute(v,_),qo.distanceSqToSegment(c,h,d,u)>l)continue;d.applyMatrix4(this.matrixWorld);let b=e.ray.origin.distanceTo(d);b<e.near||b>e.far||t.push({distance:b,point:u.clone().applyMatrix4(this.matrixWorld),index:m,face:null,faceIndex:null,object:this})}else for(let m=Math.max(0,a.start),y=Math.min(v.count,a.start+a.count)-1;m<y;m+=p){if(c.fromBufferAttribute(v,m),h.fromBufferAttribute(v,m+1),qo.distanceSqToSegment(c,h,d,u)>l)continue;d.applyMatrix4(this.matrixWorld);let g=e.ray.origin.distanceTo(d);g<e.near||g>e.far||t.push({distance:g,point:u.clone().applyMatrix4(this.matrixWorld),index:m,face:null,faceIndex:null,object:this})}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,s=n.length;i<s;i++){let a=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=i}}}}},uu=new w,du=new w,Sa=class extends or{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let i=0,s=t.count;i<s;i+=2)uu.fromBufferAttribute(t,i),du.fromBufferAttribute(t,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+uu.distanceTo(du);e.setAttribute("lineDistance",new we(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},Gr=class extends rn{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Te(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},pu=new Re,Pl=new Ln,$s=new mn,js=new w,wa=class extends ot{constructor(e=new Ye,t=new Gr){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let n=this.geometry,i=this.matrixWorld,s=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),$s.copy(n.boundingSphere),$s.applyMatrix4(i),$s.radius+=s,e.ray.intersectsSphere($s)===!1)return;pu.copy(i).invert(),Pl.copy(e.ray).applyMatrix4(pu);let o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,h=n.attributes.position;if(c!==null)for(let u=Math.max(0,a.start),d=Math.min(c.count,a.start+a.count);u<d;u++){let p=c.getX(u);js.fromBufferAttribute(h,p),mu(js,p,l,i,e,t,this)}else for(let u=Math.max(0,a.start),d=Math.min(h.count,a.start+a.count);u<d;u++)js.fromBufferAttribute(h,u),mu(js,u,l,i,e,t,this)}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let i=0,s=n.length;i<s;i++){let a=n[i].name||String(i);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=i}}}}};Ea=class extends Ot{constructor(e,t,n,i,s,a,o,l,c){super(e,t,n,i,s,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Wt=class{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,i=this.getPoint(0),s=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),s+=n.distanceTo(i),t.push(s),i=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t){let n=this.getLengths(),i=0,s=n.length,a;a=t||e*n[s-1];let o,l=0,c=s-1;for(;l<=c;)if(i=Math.floor(l+(c-l)/2),o=n[i]-a,o<0)l=i+1;else{if(!(o>0)){c=i;break}c=i-1}if(i=c,n[i]===a)return i/(s-1);let h=n[i];return(i+(a-h)/(n[i+1]-h))/(s-1)}getTangent(e,t){let i=e-1e-4,s=e+1e-4;i<0&&(i=0),s>1&&(s=1);let a=this.getPoint(i),o=this.getPoint(s),l=t||(a.isVector2?new ie:new w);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t){let n=new w,i=[],s=[],a=[],o=new w,l=new Re;for(let p=0;p<=e;p++){let f=p/e;i[p]=this.getTangentAt(f,new w)}s[0]=new w,a[0]=new w;let c=Number.MAX_VALUE,h=Math.abs(i[0].x),u=Math.abs(i[0].y),d=Math.abs(i[0].z);h<=c&&(c=h,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),d<=c&&n.set(0,0,1),o.crossVectors(i[0],n).normalize(),s[0].crossVectors(i[0],o),a[0].crossVectors(i[0],s[0]);for(let p=1;p<=e;p++){if(s[p]=s[p-1].clone(),a[p]=a[p-1].clone(),o.crossVectors(i[p-1],i[p]),o.length()>Number.EPSILON){o.normalize();let f=Math.acos(ut(i[p-1].dot(i[p]),-1,1));s[p].applyMatrix4(l.makeRotationAxis(o,f))}a[p].crossVectors(i[p],s[p])}if(t===!0){let p=Math.acos(ut(s[0].dot(s[e]),-1,1));p/=e,i[0].dot(o.crossVectors(s[0],s[e]))>0&&(p=-p);for(let f=1;f<=e;f++)s[f].applyMatrix4(l.makeRotationAxis(i[f],p*f)),a[f].crossVectors(i[f],s[f])}return{tangents:i,normals:s,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},Vr=class extends Wt{constructor(e=0,t=0,n=1,i=1,s=0,a=2*Math.PI,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=i,this.aStartAngle=s,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(e,t){let n=t||new ie,i=2*Math.PI,s=this.aEndAngle-this.aStartAngle,a=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=i;for(;s>i;)s-=i;s<Number.EPSILON&&(s=a?0:i),this.aClockwise!==!0||a||(s===i?s=-i:s-=i);let o=this.aStartAngle+e*s,l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=l-this.aX,p=c-this.aY;l=d*h-p*u+this.aX,c=d*u+p*h+this.aY}return n.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Ll=class extends Vr{constructor(e,t,n,i,s,a){super(e,t,n,n,i,s,a),this.isArcCurve=!0,this.type="ArcCurve"}};Xs=new w,Yo=new fc,Zo=new fc,Jo=new fc,Il=class extends Wt{constructor(e=[],t=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=i}getPoint(e,t=new w){let n=t,i=this.points,s=i.length,a=(s-(this.closed?0:1))*e,o,l,c=Math.floor(a),h=a-c;this.closed?c+=c>0?0:(Math.floor(Math.abs(c)/s)+1)*s:h===0&&c===s-1&&(c=s-2,h=1),this.closed||c>0?o=i[(c-1)%s]:(Xs.subVectors(i[0],i[1]).add(i[0]),o=Xs);let u=i[c%s],d=i[(c+1)%s];if(this.closed||c+2<s?l=i[(c+2)%s]:(Xs.subVectors(i[s-1],i[s-2]).add(i[s-1]),l=Xs),this.curveType==="centripetal"||this.curveType==="chordal"){let p=this.curveType==="chordal"?.5:.25,f=Math.pow(o.distanceToSquared(u),p),v=Math.pow(u.distanceToSquared(d),p),m=Math.pow(d.distanceToSquared(l),p);v<1e-4&&(v=1),f<1e-4&&(f=v),m<1e-4&&(m=v),Yo.initNonuniformCatmullRom(o.x,u.x,d.x,l.x,f,v,m),Zo.initNonuniformCatmullRom(o.y,u.y,d.y,l.y,f,v,m),Jo.initNonuniformCatmullRom(o.z,u.z,d.z,l.z,f,v,m)}else this.curveType==="catmullrom"&&(Yo.initCatmullRom(o.x,u.x,d.x,l.x,this.tension),Zo.initCatmullRom(o.y,u.y,d.y,l.y,this.tension),Jo.initCatmullRom(o.z,u.z,d.z,l.z,this.tension));return n.set(Yo.calc(h),Zo.calc(h),Jo.calc(h)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(i.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let i=this.points[t];e.points.push(i.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(new w().fromArray(i))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};Ta=class extends Wt{constructor(e=new ie,t=new ie,n=new ie,i=new ie){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new ie){let n=t,i=this.v0,s=this.v1,a=this.v2,o=this.v3;return n.set(Dr(e,i.x,s.x,a.x,o.x),Dr(e,i.y,s.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Dl=class extends Wt{constructor(e=new w,t=new w,n=new w,i=new w){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=i}getPoint(e,t=new w){let n=t,i=this.v0,s=this.v1,a=this.v2,o=this.v3;return n.set(Dr(e,i.x,s.x,a.x,o.x),Dr(e,i.y,s.y,a.y,o.y),Dr(e,i.z,s.z,a.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Aa=class extends Wt{constructor(e=new ie,t=new ie){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ie){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ie){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Nl=class extends Wt{constructor(e=new w,t=new w){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new w){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new w){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ra=class extends Wt{constructor(e=new ie,t=new ie,n=new ie){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new ie){let n=t,i=this.v0,s=this.v1,a=this.v2;return n.set(Ir(e,i.x,s.x,a.x),Ir(e,i.y,s.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ca=class extends Wt{constructor(e=new w,t=new w,n=new w){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new w){let n=t,i=this.v0,s=this.v1,a=this.v2;return n.set(Ir(e,i.x,s.x,a.x),Ir(e,i.y,s.y,a.y),Ir(e,i.z,s.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Pa=class extends Wt{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ie){let n=t,i=this.points,s=(i.length-1)*e,a=Math.floor(s),o=s-a,l=i[a===0?a:a-1],c=i[a],h=i[a>i.length-2?i.length-1:a+1],u=i[a>i.length-3?i.length-1:a+2];return n.set(fu(o,l.x,c.x,h.x,u.x),fu(o,l.y,c.y,h.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(i.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let i=this.points[t];e.points.push(i.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let i=e.points[t];this.points.push(new ie().fromArray(i))}return this}},La=Object.freeze({__proto__:null,ArcCurve:Ll,CatmullRomCurve3:Il,CubicBezierCurve:Ta,CubicBezierCurve3:Dl,EllipseCurve:Vr,LineCurve:Aa,LineCurve3:Nl,QuadraticBezierCurve:Ra,QuadraticBezierCurve3:Ca,SplineCurve:Pa}),Ul=class extends Wt{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new La[n](t,e))}return this}getPoint(e,t){let n=e*this.getLength(),i=this.getCurveLengths(),s=0;for(;s<i.length;){if(i[s]>=n){let a=i[s]-n,o=this.curves[s],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,t)}s++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let n=0,i=this.curves.length;n<i;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],n;for(let i=0,s=this.curves;i<s.length;i++){let a=s[i],o=a.isEllipseCurve?2*e:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,l=a.getPoints(o);for(let c=0;c<l.length;c++){let h=l[c];n&&n.equals(h)||(t.push(h),n=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let i=e.curves[t];this.curves.push(i.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){let i=this.curves[t];e.curves.push(i.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let i=e.curves[t];this.curves.push(new La[i.type]().fromJSON(i))}return this}},Wr=class extends Ul{constructor(e){super(),this.type="Path",this.currentPoint=new ie,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let n=new Aa(this.currentPoint.clone(),new ie(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,i){let s=new Ra(this.currentPoint.clone(),new ie(e,t),new ie(n,i));return this.curves.push(s),this.currentPoint.set(n,i),this}bezierCurveTo(e,t,n,i,s,a){let o=new Ta(this.currentPoint.clone(),new ie(e,t),new ie(n,i),new ie(s,a));return this.curves.push(o),this.currentPoint.set(s,a),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),n=new Pa(t);return this.curves.push(n),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,i,s,a){let o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,n,i,s,a),this}absarc(e,t,n,i,s,a){return this.absellipse(e,t,n,n,i,s,a),this}ellipse(e,t,n,i,s,a,o,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,n,i,s,a,o,l),this}absellipse(e,t,n,i,s,a,o,l){let c=new Vr(e,t,n,i,s,a,o,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},Ia=class r extends Ye{constructor(e=[new ie(0,-.5),new ie(.5,0),new ie(0,.5)],t=12,n=0,i=2*Math.PI){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:n,phiLength:i},t=Math.floor(t),i=ut(i,0,2*Math.PI);let s=[],a=[],o=[],l=[],c=[],h=1/t,u=new w,d=new ie,p=new w,f=new w,v=new w,m=0,y=0;for(let g=0;g<=e.length-1;g++)switch(g){case 0:m=e[g+1].x-e[g].x,y=e[g+1].y-e[g].y,p.x=1*y,p.y=-m,p.z=0*y,v.copy(p),p.normalize(),l.push(p.x,p.y,p.z);break;case e.length-1:l.push(v.x,v.y,v.z);break;default:m=e[g+1].x-e[g].x,y=e[g+1].y-e[g].y,p.x=1*y,p.y=-m,p.z=0*y,f.copy(p),p.x+=v.x,p.y+=v.y,p.z+=v.z,p.normalize(),l.push(p.x,p.y,p.z),v.copy(f)}for(let g=0;g<=t;g++){let _=n+g*h*i,b=Math.sin(_),T=Math.cos(_);for(let M=0;M<=e.length-1;M++){u.x=e[M].x*b,u.y=e[M].y,u.z=e[M].x*T,a.push(u.x,u.y,u.z),d.x=g/t,d.y=M/(e.length-1),o.push(d.x,d.y);let E=l[3*M+0]*b,N=l[3*M+1],I=l[3*M+0]*T;c.push(E,N,I)}}for(let g=0;g<t;g++)for(let _=0;_<e.length-1;_++){let b=_+g*e.length,T=b,M=b+e.length,E=b+e.length+1,N=b+1;s.push(T,M,N),s.push(E,N,M)}this.setIndex(s),this.setAttribute("position",new we(a,3)),this.setAttribute("uv",new we(o,2)),this.setAttribute("normal",new we(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.points,e.segments,e.phiStart,e.phiLength)}},Ol=class r extends Ia{constructor(e=1,t=1,n=4,i=8){let s=new Wr;s.absarc(0,-t/2,e,1.5*Math.PI,0),s.absarc(0,t/2,e,0,.5*Math.PI),super(s.getPoints(n),i),this.type="CapsuleGeometry",this.parameters={radius:e,length:t,capSegments:n,radialSegments:i}}static fromJSON(e){return new r(e.radius,e.length,e.capSegments,e.radialSegments)}},_i=class r extends Ye{constructor(e=1,t=32,n=0,i=2*Math.PI){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:i},t=Math.max(3,t);let s=[],a=[],o=[],l=[],c=new w,h=new ie;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let p=n+u/t*i;c.x=e*Math.cos(p),c.y=e*Math.sin(p),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[d]/e+1)/2,h.y=(a[d+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)s.push(u,u+1,0);this.setIndex(s),this.setAttribute("position",new we(a,3)),this.setAttribute("normal",new we(o,3)),this.setAttribute("uv",new we(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.radius,e.segments,e.thetaStart,e.thetaLength)}},gt=class r extends Ye{constructor(e=1,t=1,n=1,i=32,s=1,a=!1,o=0,l=2*Math.PI){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:i,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:l};let c=this;i=Math.floor(i),s=Math.floor(s);let h=[],u=[],d=[],p=[],f=0,v=[],m=n/2,y=0;function g(_){let b=f,T=new ie,M=new w,E=0,N=_===!0?e:t,I=_===!0?1:-1;for(let D=1;D<=i;D++)u.push(0,m*I,0),d.push(0,I,0),p.push(.5,.5),f++;let B=f;for(let D=0;D<=i;D++){let P=D/i*l+o,O=Math.cos(P),k=Math.sin(P);M.x=N*k,M.y=m*I,M.z=N*O,u.push(M.x,M.y,M.z),d.push(0,I,0),T.x=.5*O+.5,T.y=.5*k*I+.5,p.push(T.x,T.y),f++}for(let D=0;D<i;D++){let P=b+D,O=B+D;_===!0?h.push(O,O+1,P):h.push(O+1,O,P),E+=3}c.addGroup(y,E,_===!0?1:2),y+=E}(function(){let _=new w,b=new w,T=0,M=(t-e)/n;for(let E=0;E<=s;E++){let N=[],I=E/s,B=I*(t-e)+e;for(let D=0;D<=i;D++){let P=D/i,O=P*l+o,k=Math.sin(O),ee=Math.cos(O);b.x=B*k,b.y=-I*n+m,b.z=B*ee,u.push(b.x,b.y,b.z),_.set(k,M,ee).normalize(),d.push(_.x,_.y,_.z),p.push(P,1-I),N.push(f++)}v.push(N)}for(let E=0;E<i;E++)for(let N=0;N<s;N++){let I=v[N][E],B=v[N+1][E],D=v[N+1][E+1],P=v[N][E+1];h.push(I,B,P),h.push(B,D,P),T+=6}c.addGroup(y,T,0),y+=T})(),a===!1&&(e>0&&g(!0),t>0&&g(!1)),this.setIndex(h),this.setAttribute("position",new we(u,3)),this.setAttribute("normal",new we(d,3)),this.setAttribute("uv",new we(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Fl=class r extends gt{constructor(e=1,t=1,n=32,i=1,s=!1,a=0,o=2*Math.PI){super(0,e,t,n,i,s,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:i,openEnded:s,thetaStart:a,thetaLength:o}}static fromJSON(e){return new r(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},vi=class r extends Ye{constructor(e=[],t=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:i};let s=[],a=[];function o(d,p,f,v){let m=v+1,y=[];for(let g=0;g<=m;g++){y[g]=[];let _=d.clone().lerp(f,g/m),b=p.clone().lerp(f,g/m),T=m-g;for(let M=0;M<=T;M++)y[g][M]=M===0&&g===m?_:_.clone().lerp(b,M/T)}for(let g=0;g<m;g++)for(let _=0;_<2*(m-g)-1;_++){let b=Math.floor(_/2);_%2==0?(l(y[g][b+1]),l(y[g+1][b]),l(y[g][b])):(l(y[g][b+1]),l(y[g+1][b+1]),l(y[g+1][b]))}}function l(d){s.push(d.x,d.y,d.z)}function c(d,p){let f=3*d;p.x=e[f+0],p.y=e[f+1],p.z=e[f+2]}function h(d,p,f,v){v<0&&d.x===1&&(a[p]=d.x-1),f.x===0&&f.z===0&&(a[p]=v/2/Math.PI+.5)}function u(d){return Math.atan2(d.z,-d.x)}(function(d){let p=new w,f=new w,v=new w;for(let m=0;m<t.length;m+=3)c(t[m+0],p),c(t[m+1],f),c(t[m+2],v),o(p,f,v,d)})(i),function(d){let p=new w;for(let f=0;f<s.length;f+=3)p.x=s[f+0],p.y=s[f+1],p.z=s[f+2],p.normalize().multiplyScalar(d),s[f+0]=p.x,s[f+1]=p.y,s[f+2]=p.z}(n),function(){let d=new w;for(let f=0;f<s.length;f+=3){d.x=s[f+0],d.y=s[f+1],d.z=s[f+2];let v=u(d)/2/Math.PI+.5,m=(p=d,Math.atan2(-p.y,Math.sqrt(p.x*p.x+p.z*p.z))/Math.PI+.5);a.push(v,1-m)}var p;(function(){let f=new w,v=new w,m=new w,y=new w,g=new ie,_=new ie,b=new ie;for(let T=0,M=0;T<s.length;T+=9,M+=6){f.set(s[T+0],s[T+1],s[T+2]),v.set(s[T+3],s[T+4],s[T+5]),m.set(s[T+6],s[T+7],s[T+8]),g.set(a[M+0],a[M+1]),_.set(a[M+2],a[M+3]),b.set(a[M+4],a[M+5]),y.copy(f).add(v).add(m).divideScalar(3);let E=u(y);h(g,M+0,f,E),h(_,M+2,v,E),h(b,M+4,m,E)}})(),function(){for(let f=0;f<a.length;f+=6){let v=a[f+0],m=a[f+2],y=a[f+4],g=Math.max(v,m,y),_=Math.min(v,m,y);g>.9&&_<.1&&(v<.2&&(a[f+0]+=1),m<.2&&(a[f+2]+=1),y<.2&&(a[f+4]+=1))}}()}(),this.setAttribute("position",new we(s,3)),this.setAttribute("normal",new we(s.slice(),3)),this.setAttribute("uv",new we(a,2)),i===0?this.computeVertexNormals():this.normalizeNormals()}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.vertices,e.indices,e.radius,e.details)}},Bl=class r extends vi{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,i=1/n;super([-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-i,-n,0,-i,n,0,i,-n,0,i,n,-i,-n,0,-i,n,0,i,-n,0,i,n,0,-n,0,-i,n,0,-i,-n,0,i,n,0,i],[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9],e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new r(e.radius,e.detail)}},qs=new w,Ys=new w,Ko=new w,Zs=new Zn,kl=class extends Ye{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){let i=Math.pow(10,4),s=Math.cos(Ji*t),a=e.getIndex(),o=e.getAttribute("position"),l=a?a.count:o.count,c=[0,0,0],h=["a","b","c"],u=new Array(3),d={},p=[];for(let f=0;f<l;f+=3){a?(c[0]=a.getX(f),c[1]=a.getX(f+1),c[2]=a.getX(f+2)):(c[0]=f,c[1]=f+1,c[2]=f+2);let{a:v,b:m,c:y}=Zs;if(v.fromBufferAttribute(o,c[0]),m.fromBufferAttribute(o,c[1]),y.fromBufferAttribute(o,c[2]),Zs.getNormal(Ko),u[0]=`${Math.round(v.x*i)},${Math.round(v.y*i)},${Math.round(v.z*i)}`,u[1]=`${Math.round(m.x*i)},${Math.round(m.y*i)},${Math.round(m.z*i)}`,u[2]=`${Math.round(y.x*i)},${Math.round(y.y*i)},${Math.round(y.z*i)}`,u[0]!==u[1]&&u[1]!==u[2]&&u[2]!==u[0])for(let g=0;g<3;g++){let _=(g+1)%3,b=u[g],T=u[_],M=Zs[h[g]],E=Zs[h[_]],N=`${b}_${T}`,I=`${T}_${b}`;I in d&&d[I]?(Ko.dot(d[I].normal)<=s&&(p.push(M.x,M.y,M.z),p.push(E.x,E.y,E.z)),d[I]=null):N in d||(d[N]={index0:c[g],index1:c[_],normal:Ko.clone()})}}for(let f in d)if(d[f]){let{index0:v,index1:m}=d[f];qs.fromBufferAttribute(o,v),Ys.fromBufferAttribute(o,m),p.push(qs.x,qs.y,qs.z),p.push(Ys.x,Ys.y,Ys.z)}this.setAttribute("position",new we(p,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}},Da=class extends Wr{constructor(e){super(e),this.uuid=un(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let n=0,i=this.holes.length;n<i;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let i=e.holes[t];this.holes.push(i.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){let i=this.holes[t];e.holes.push(i.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let i=e.holes[t];this.holes.push(new Wr().fromJSON(i))}return this}},qm=function(r,e,t=2){let n=e&&e.length,i=n?e[0]*t:r.length,s=gu(r,0,i,t,!0),a=[];if(!s||s.next===s.prev)return a;let o,l,c,h,u,d,p;if(n&&(s=function(f,v,m,y){let g=[],_,b,T,M,E;for(_=0,b=v.length;_<b;_++)T=v[_]*y,M=_<b-1?v[_+1]*y:f.length,E=gu(f,T,M,y,!1),E===E.next&&(E.steiner=!0),g.push(nf(E));for(g.sort(Qm),_=0;_<g.length;_++)m=ef(g[_],m);return m}(r,e,s,t)),r.length>80*t){o=c=r[0],l=h=r[1];for(let f=t;f<i;f+=t)u=r[f],d=r[f+1],u<o&&(o=u),d<l&&(l=d),u>c&&(c=u),d>h&&(h=d);p=Math.max(c-o,h-l),p=p!==0?32767/p:0}return $r(s,a,t,o,l,p,0),a};Kn=class r{static area(e){let t=e.length,n=0;for(let i=t-1,s=0;s<t;i=s++)n+=e[i].x*e[s].y-e[s].x*e[i].y;return .5*n}static isClockWise(e){return r.area(e)<0}static triangulateShape(e,t){let n=[],i=[],s=[];vu(e),yu(n,e);let a=e.length;t.forEach(vu);for(let l=0;l<t.length;l++)i.push(a),a+=t[l].length,yu(n,t[l]);let o=qm(n,i);for(let l=0;l<o.length;l+=3)s.push(o.slice(l,l+3));return s}};Gl=class r extends Ye{constructor(e=new Da([new ie(.5,.5),new ie(-.5,.5),new ie(-.5,-.5),new ie(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let n=this,i=[],s=[];for(let o=0,l=e.length;o<l;o++)a(e[o]);function a(o){let l=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,u=t.depth!==void 0?t.depth:1,d=t.bevelEnabled===void 0||t.bevelEnabled,p=t.bevelThickness!==void 0?t.bevelThickness:.2,f=t.bevelSize!==void 0?t.bevelSize:p-.1,v=t.bevelOffset!==void 0?t.bevelOffset:0,m=t.bevelSegments!==void 0?t.bevelSegments:3,y=t.extrudePath,g=t.UVGenerator!==void 0?t.UVGenerator:sf,_,b,T,M,E,N=!1;y&&(_=y.getSpacedPoints(h),N=!0,d=!1,b=y.computeFrenetFrames(h,!1),T=new w,M=new w,E=new w),d||(m=0,p=0,f=0,v=0);let I=o.extractPoints(c),B=I.shape,D=I.holes;if(!Kn.isClockWise(B)){B=B.reverse();for(let U=0,F=D.length;U<F;U++){let G=D[U];Kn.isClockWise(G)&&(D[U]=G.reverse())}}let P=Kn.triangulateShape(B,D),O=B;for(let U=0,F=D.length;U<F;U++){let G=D[U];B=B.concat(G)}function k(U,F,G){return F||console.error("THREE.ExtrudeGeometry: vec does not exist"),U.clone().addScaledVector(F,G)}let ee=B.length,oe=P.length;function K(U,F,G){let te,Q,S,re=U.x-F.x,V=U.y-F.y,W=G.x-U.x,se=G.y-U.y,ce=re*re+V*V,de=re*se-V*W;if(Math.abs(de)>Number.EPSILON){let pe=Math.sqrt(ce),Se=Math.sqrt(W*W+se*se),me=F.x-V/pe,_e=F.y+re/pe,Ce=((G.x-se/Se-me)*se-(G.y+W/Se-_e)*W)/(re*se-V*W);te=me+re*Ce-U.x,Q=_e+V*Ce-U.y;let lt=te*te+Q*Q;if(lt<=2)return new ie(te,Q);S=Math.sqrt(lt/2)}else{let pe=!1;re>Number.EPSILON?W>Number.EPSILON&&(pe=!0):re<-Number.EPSILON?W<-Number.EPSILON&&(pe=!0):Math.sign(V)===Math.sign(se)&&(pe=!0),pe?(te=-V,Q=re,S=Math.sqrt(ce)):(te=re,Q=V,S=Math.sqrt(ce/2))}return new ie(te/S,Q/S)}let X=[];for(let U=0,F=O.length,G=F-1,te=U+1;U<F;U++,G++,te++)G===F&&(G=0),te===F&&(te=0),X[U]=K(O[U],O[G],O[te]);let J=[],H,Y=X.concat();for(let U=0,F=D.length;U<F;U++){let G=D[U];H=[];for(let te=0,Q=G.length,S=Q-1,re=te+1;te<Q;te++,S++,re++)S===Q&&(S=0),re===Q&&(re=0),H[te]=K(G[te],G[S],G[re]);J.push(H),Y=Y.concat(H)}for(let U=0;U<m;U++){let F=U/m,G=p*Math.cos(F*Math.PI/2),te=f*Math.sin(F*Math.PI/2)+v;for(let Q=0,S=O.length;Q<S;Q++){let re=k(O[Q],X[Q],te);R(re.x,re.y,-G)}for(let Q=0,S=D.length;Q<S;Q++){let re=D[Q];H=J[Q];for(let V=0,W=re.length;V<W;V++){let se=k(re[V],H[V],te);R(se.x,se.y,-G)}}}let he=f+v;for(let U=0;U<ee;U++){let F=d?k(B[U],Y[U],he):B[U];N?(M.copy(b.normals[0]).multiplyScalar(F.x),T.copy(b.binormals[0]).multiplyScalar(F.y),E.copy(_[0]).add(M).add(T),R(E.x,E.y,E.z)):R(F.x,F.y,0)}for(let U=1;U<=h;U++)for(let F=0;F<ee;F++){let G=d?k(B[F],Y[F],he):B[F];N?(M.copy(b.normals[U]).multiplyScalar(G.x),T.copy(b.binormals[U]).multiplyScalar(G.y),E.copy(_[U]).add(M).add(T),R(E.x,E.y,E.z)):R(G.x,G.y,u/h*U)}for(let U=m-1;U>=0;U--){let F=U/m,G=p*Math.cos(F*Math.PI/2),te=f*Math.sin(F*Math.PI/2)+v;for(let Q=0,S=O.length;Q<S;Q++){let re=k(O[Q],X[Q],te);R(re.x,re.y,u+G)}for(let Q=0,S=D.length;Q<S;Q++){let re=D[Q];H=J[Q];for(let V=0,W=re.length;V<W;V++){let se=k(re[V],H[V],te);N?R(se.x,se.y+_[h-1].y,_[h-1].x+G):R(se.x,se.y,u+G)}}}function A(U,F){let G=U.length;for(;--G>=0;){let te=G,Q=G-1;Q<0&&(Q=U.length-1);for(let S=0,re=h+2*m;S<re;S++){let V=ee*S,W=ee*(S+1);q(F+te+V,F+Q+V,F+Q+W,F+te+W)}}}function R(U,F,G){l.push(U),l.push(F),l.push(G)}function z(U,F,G){L(U),L(F),L(G);let te=i.length/3,Q=g.generateTopUV(n,i,te-3,te-2,te-1);j(Q[0]),j(Q[1]),j(Q[2])}function q(U,F,G,te){L(U),L(F),L(te),L(F),L(G),L(te);let Q=i.length/3,S=g.generateSideWallUV(n,i,Q-6,Q-3,Q-2,Q-1);j(S[0]),j(S[1]),j(S[3]),j(S[1]),j(S[2]),j(S[3])}function L(U){i.push(l[3*U+0]),i.push(l[3*U+1]),i.push(l[3*U+2])}function j(U){s.push(U.x),s.push(U.y)}(function(){let U=i.length/3;if(d){let F=0,G=ee*F;for(let te=0;te<oe;te++){let Q=P[te];z(Q[2]+G,Q[1]+G,Q[0]+G)}F=h+2*m,G=ee*F;for(let te=0;te<oe;te++){let Q=P[te];z(Q[0]+G,Q[1]+G,Q[2]+G)}}else{for(let F=0;F<oe;F++){let G=P[F];z(G[2],G[1],G[0])}for(let F=0;F<oe;F++){let G=P[F];z(G[0]+ee*h,G[1]+ee*h,G[2]+ee*h)}}n.addGroup(U,i.length/3-U,0)})(),function(){let U=i.length/3,F=0;A(O,F),F+=O.length;for(let G=0,te=D.length;G<te;G++){let Q=D[G];A(Q,F),F+=Q.length}n.addGroup(U,i.length/3-U,1)}()}this.setAttribute("position",new we(i,3)),this.setAttribute("uv",new we(s,2)),this.computeVertexNormals()}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return function(t,n,i){if(i.shapes=[],Array.isArray(t))for(let s=0,a=t.length;s<a;s++){let o=t[s];i.shapes.push(o.uuid)}else i.shapes.push(t.uuid);return i.options=Object.assign({},n),n.extrudePath!==void 0&&(i.options.extrudePath=n.extrudePath.toJSON()),i}(this.parameters.shapes,this.parameters.options,e)}static fromJSON(e,t){let n=[];for(let s=0,a=e.shapes.length;s<a;s++){let o=t[e.shapes[s]];n.push(o)}let i=e.options.extrudePath;return i!==void 0&&(e.options.extrudePath=new La[i.type]().fromJSON(i)),new r(n,e.options)}},sf={generateTopUV:function(r,e,t,n,i){let s=e[3*t],a=e[3*t+1],o=e[3*n],l=e[3*n+1],c=e[3*i],h=e[3*i+1];return[new ie(s,a),new ie(o,l),new ie(c,h)]},generateSideWallUV:function(r,e,t,n,i,s){let a=e[3*t],o=e[3*t+1],l=e[3*t+2],c=e[3*n],h=e[3*n+1],u=e[3*n+2],d=e[3*i],p=e[3*i+1],f=e[3*i+2],v=e[3*s],m=e[3*s+1],y=e[3*s+2];return Math.abs(o-h)<Math.abs(a-c)?[new ie(a,1-l),new ie(c,1-u),new ie(d,1-f),new ie(v,1-y)]:[new ie(o,1-l),new ie(h,1-u),new ie(p,1-f),new ie(m,1-y)]}},qr=class r extends vi{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2;super([-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1],e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new r(e.radius,e.detail)}},Vl=class r extends vi{constructor(e=1,t=0){super([1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2],e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new r(e.radius,e.detail)}},Wl=class r extends Ye{constructor(e=.5,t=1,n=32,i=1,s=0,a=2*Math.PI){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:i,thetaStart:s,thetaLength:a},n=Math.max(3,n);let o=[],l=[],c=[],h=[],u=e,d=(t-e)/(i=Math.max(1,i)),p=new w,f=new ie;for(let v=0;v<=i;v++){for(let m=0;m<=n;m++){let y=s+m/n*a;p.x=u*Math.cos(y),p.y=u*Math.sin(y),l.push(p.x,p.y,p.z),c.push(0,0,1),f.x=(p.x/t+1)/2,f.y=(p.y/t+1)/2,h.push(f.x,f.y)}u+=d}for(let v=0;v<i;v++){let m=v*(n+1);for(let y=0;y<n;y++){let g=y+m,_=g,b=g+n+1,T=g+n+2,M=g+1;o.push(_,b,M),o.push(b,T,M)}}this.setIndex(o),this.setAttribute("position",new we(l,3)),this.setAttribute("normal",new we(c,3)),this.setAttribute("uv",new we(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}},$l=class r extends Ye{constructor(e=new Da([new ie(0,.5),new ie(-.5,-.5),new ie(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let n=[],i=[],s=[],a=[],o=0,l=0;if(Array.isArray(e)===!1)c(e);else for(let h=0;h<e.length;h++)c(e[h]),this.addGroup(o,l,h),o+=l,l=0;function c(h){let u=i.length/3,d=h.extractPoints(t),p=d.shape,f=d.holes;Kn.isClockWise(p)===!1&&(p=p.reverse());for(let m=0,y=f.length;m<y;m++){let g=f[m];Kn.isClockWise(g)===!0&&(f[m]=g.reverse())}let v=Kn.triangulateShape(p,f);for(let m=0,y=f.length;m<y;m++){let g=f[m];p=p.concat(g)}for(let m=0,y=p.length;m<y;m++){let g=p[m];i.push(g.x,g.y,0),s.push(0,0,1),a.push(g.x,g.y)}for(let m=0,y=v.length;m<y;m++){let g=v[m],_=g[0]+u,b=g[1]+u,T=g[2]+u;n.push(_,b,T),l+=3}}this.setIndex(n),this.setAttribute("position",new we(i,3)),this.setAttribute("normal",new we(s,3)),this.setAttribute("uv",new we(a,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return function(t,n){if(n.shapes=[],Array.isArray(t))for(let i=0,s=t.length;i<s;i++){let a=t[i];n.shapes.push(a.uuid)}else n.shapes.push(t.uuid);return n}(this.parameters.shapes,e)}static fromJSON(e,t){let n=[];for(let i=0,s=e.shapes.length;i<s;i++){let a=t[e.shapes[i]];n.push(a)}return new r(n,e.curveSegments)}},Un=class r extends Ye{constructor(e=1,t=32,n=16,i=0,s=2*Math.PI,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:i,phiLength:s,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(a+o,Math.PI),c=0,h=[],u=new w,d=new w,p=[],f=[],v=[],m=[];for(let y=0;y<=n;y++){let g=[],_=y/n,b=0;y===0&&a===0?b=.5/t:y===n&&l===Math.PI&&(b=-.5/t);for(let T=0;T<=t;T++){let M=T/t;u.x=-e*Math.cos(i+M*s)*Math.sin(a+_*o),u.y=e*Math.cos(a+_*o),u.z=e*Math.sin(i+M*s)*Math.sin(a+_*o),f.push(u.x,u.y,u.z),d.copy(u).normalize(),v.push(d.x,d.y,d.z),m.push(M+b,1-_),g.push(c++)}h.push(g)}for(let y=0;y<n;y++)for(let g=0;g<t;g++){let _=h[y][g+1],b=h[y][g],T=h[y+1][g],M=h[y+1][g+1];(y!==0||a>0)&&p.push(_,b,M),(y!==n-1||l<Math.PI)&&p.push(b,T,M)}this.setIndex(p),this.setAttribute("position",new we(f,3)),this.setAttribute("normal",new we(v,3)),this.setAttribute("uv",new we(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}},jl=class r extends vi{constructor(e=1,t=0){super([1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],[2,1,0,0,3,2,1,3,0,2,3,1],e,t),this.type="TetrahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new r(e.radius,e.detail)}},Xl=class r extends Ye{constructor(e=1,t=.4,n=12,i=48,s=2*Math.PI){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:i,arc:s},n=Math.floor(n),i=Math.floor(i);let a=[],o=[],l=[],c=[],h=new w,u=new w,d=new w;for(let p=0;p<=n;p++)for(let f=0;f<=i;f++){let v=f/i*s,m=p/n*Math.PI*2;u.x=(e+t*Math.cos(m))*Math.cos(v),u.y=(e+t*Math.cos(m))*Math.sin(v),u.z=t*Math.sin(m),o.push(u.x,u.y,u.z),h.x=e*Math.cos(v),h.y=e*Math.sin(v),d.subVectors(u,h).normalize(),l.push(d.x,d.y,d.z),c.push(f/i),c.push(p/n)}for(let p=1;p<=n;p++)for(let f=1;f<=i;f++){let v=(i+1)*p+f-1,m=(i+1)*(p-1)+f-1,y=(i+1)*(p-1)+f,g=(i+1)*p+f;a.push(v,m,g),a.push(m,y,g)}this.setIndex(a),this.setAttribute("position",new we(o,3)),this.setAttribute("normal",new we(l,3)),this.setAttribute("uv",new we(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}},ql=class r extends Ye{constructor(e=1,t=.4,n=64,i=8,s=2,a=3){super(),this.type="TorusKnotGeometry",this.parameters={radius:e,tube:t,tubularSegments:n,radialSegments:i,p:s,q:a},n=Math.floor(n),i=Math.floor(i);let o=[],l=[],c=[],h=[],u=new w,d=new w,p=new w,f=new w,v=new w,m=new w,y=new w;for(let _=0;_<=n;++_){let b=_/n*s*Math.PI*2;g(b,s,a,e,p),g(b+.01,s,a,e,f),m.subVectors(f,p),y.addVectors(f,p),v.crossVectors(m,y),y.crossVectors(v,m),v.normalize(),y.normalize();for(let T=0;T<=i;++T){let M=T/i*Math.PI*2,E=-t*Math.cos(M),N=t*Math.sin(M);u.x=p.x+(E*y.x+N*v.x),u.y=p.y+(E*y.y+N*v.y),u.z=p.z+(E*y.z+N*v.z),l.push(u.x,u.y,u.z),d.subVectors(u,p).normalize(),c.push(d.x,d.y,d.z),h.push(_/n),h.push(T/i)}}for(let _=1;_<=n;_++)for(let b=1;b<=i;b++){let T=(i+1)*(_-1)+(b-1),M=(i+1)*_+(b-1),E=(i+1)*_+b,N=(i+1)*(_-1)+b;o.push(T,M,N),o.push(M,E,N)}function g(_,b,T,M,E){let N=Math.cos(_),I=Math.sin(_),B=T/b*_,D=Math.cos(B);E.x=M*(2+D)*.5*N,E.y=M*(2+D)*I*.5,E.z=M*Math.sin(B)*.5}this.setIndex(o),this.setAttribute("position",new we(l,3)),this.setAttribute("normal",new we(c,3)),this.setAttribute("uv",new we(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new r(e.radius,e.tube,e.tubularSegments,e.radialSegments,e.p,e.q)}},Yl=class r extends Ye{constructor(e=new Ca(new w(-1,-1,0),new w(-1,1,0),new w(1,1,0)),t=64,n=1,i=8,s=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:n,radialSegments:i,closed:s};let a=e.computeFrenetFrames(t,s);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;let o=new w,l=new w,c=new ie,h=new w,u=[],d=[],p=[],f=[];function v(m){h=e.getPointAt(m/t,h);let y=a.normals[m],g=a.binormals[m];for(let _=0;_<=i;_++){let b=_/i*Math.PI*2,T=Math.sin(b),M=-Math.cos(b);l.x=M*y.x+T*g.x,l.y=M*y.y+T*g.y,l.z=M*y.z+T*g.z,l.normalize(),d.push(l.x,l.y,l.z),o.x=h.x+n*l.x,o.y=h.y+n*l.y,o.z=h.z+n*l.z,u.push(o.x,o.y,o.z)}}(function(){for(let m=0;m<t;m++)v(m);v(s===!1?t:0),function(){for(let m=0;m<=t;m++)for(let y=0;y<=i;y++)c.x=m/t,c.y=y/i,p.push(c.x,c.y)}(),function(){for(let m=1;m<=t;m++)for(let y=1;y<=i;y++){let g=(i+1)*(m-1)+(y-1),_=(i+1)*m+(y-1),b=(i+1)*m+y,T=(i+1)*(m-1)+y;f.push(g,_,T),f.push(_,b,T)}}()})(),this.setIndex(f),this.setAttribute("position",new we(u,3)),this.setAttribute("normal",new we(d,3)),this.setAttribute("uv",new we(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new r(new La[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}},Zl=class extends Ye{constructor(e=null){if(super(),this.type="WireframeGeometry",this.parameters={geometry:e},e!==null){let t=[],n=new Set,i=new w,s=new w;if(e.index!==null){let a=e.attributes.position,o=e.index,l=e.groups;l.length===0&&(l=[{start:0,count:o.count,materialIndex:0}]);for(let c=0,h=l.length;c<h;++c){let u=l[c],d=u.start;for(let p=d,f=d+u.count;p<f;p+=3)for(let v=0;v<3;v++){let m=o.getX(p+v),y=o.getX(p+(v+1)%3);i.fromBufferAttribute(a,m),s.fromBufferAttribute(a,y),xu(i,s,n)===!0&&(t.push(i.x,i.y,i.z),t.push(s.x,s.y,s.z))}}}else{let a=e.attributes.position;for(let o=0,l=a.count/3;o<l;o++)for(let c=0;c<3;c++){let h=3*o+c,u=3*o+(c+1)%3;i.fromBufferAttribute(a,h),s.fromBufferAttribute(a,u),xu(i,s,n)===!0&&(t.push(i.x,i.y,i.z),t.push(s.x,s.y,s.z))}}this.setAttribute("position",new we(t,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}};wg=Object.freeze({__proto__:null,BoxGeometry:We,CapsuleGeometry:Ol,CircleGeometry:_i,ConeGeometry:Fl,CylinderGeometry:gt,DodecahedronGeometry:Bl,EdgesGeometry:kl,ExtrudeGeometry:Gl,IcosahedronGeometry:qr,LatheGeometry:Ia,OctahedronGeometry:Vl,PlaneGeometry:Nn,PolyhedronGeometry:vi,RingGeometry:Wl,ShapeGeometry:$l,SphereGeometry:Un,TetrahedronGeometry:jl,TorusGeometry:Xl,TorusKnotGeometry:ql,TubeGeometry:Yl,WireframeGeometry:Zl}),Pe=class extends rn{constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new Te(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Te(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new ie(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},fn=class extends rn{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Te(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Te(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new ie(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=hc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},Na=class extends gi{constructor(e){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(e)}copy(e){return super.copy(e),this.scale=e.scale,this.dashSize=e.dashSize,this.gapSize=e.gapSize,this}};lr=class{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,i=t[n],s=t[n-1];t:{e:{let a;n:{i:if(!(e<i)){for(let o=n+2;;){if(i===void 0){if(e<s)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(s=i,i=t[++n],e<i)break e}a=t.length;break n}if(e>=s)break t;{let o=t[1];e<o&&(n=2,s=o);for(let l=n-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(i=s,s=t[--n-1],e>=s)break e}a=n,n=0}}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(i=t[n],s=t[n-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,s,i)}return this.interpolate_(n,s,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,s=e*i;for(let a=0;a!==i;++a)t[a]=n[s+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Jl=class extends lr{constructor(e,t,n,i){super(e,t,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:vh,endingEnd:vh}}intervalChanged_(e,t,n){let i=this.parameterPositions,s=e-2,a=e+1,o=i[s],l=i[a];if(o===void 0)switch(this.getSettings_().endingStart){case yh:s=e,o=2*t-n;break;case xh:s=i.length-2,o=t+i[s]-i[s+1];break;default:s=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case yh:a=e,l=2*n-t;break;case xh:a=1,l=n+i[1]-i[0];break;default:a=e-1,l=t}let c=.5*(n-t),h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=s*h,this._offsetNext=a*h}interpolate_(e,t,n,i){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,p=this._weightNext,f=(n-t)/(i-t),v=f*f,m=v*f,y=-d*m+2*d*v-d*f,g=(1+d)*m+(-1.5-2*d)*v+(-.5+d)*f+1,_=(-1-p)*m+(1.5+p)*v+.5*f,b=p*m-p*v;for(let T=0;T!==o;++T)s[T]=y*a[h+T]+g*a[c+T]+_*a[l+T]+b*a[u+T];return s}},Kl=class extends lr{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(n-t)/(i-t),u=1-h;for(let d=0;d!==o;++d)s[d]=a[c+d]*u+a[l+d]*h;return s}},Ql=class extends lr{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}},nn=class{constructor(e,t,n,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Qs(t,this.TimeBufferType),this.values=Qs(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Qs(e.times,Array),values:Qs(e.values,Array)};let i=e.getInterpolation();i!==e.DefaultInterpolation&&(n.interpolation=i)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Ql(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Kl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Jl(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case na:t=this.InterpolantFactoryMethodDiscrete;break;case ia:t=this.InterpolantFactoryMethodLinear;break;case wo:t=this.InterpolantFactoryMethodSmooth}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0){if(e===this.DefaultInterpolation)throw new Error(n);this.setInterpolation(this.DefaultInterpolation)}return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return na;case this.InterpolantFactoryMethodLinear:return ia;case this.InterpolantFactoryMethodSmooth:return wo}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e}return this}trim(e,t){let n=this.times,i=n.length,s=0,a=i-1;for(;s!==i&&n[s]<e;)++s;for(;a!==-1&&n[a]>t;)--a;if(++a,s!==0||a!==i){s>=a&&(a=Math.max(a,1),s=a-1);let o=this.getValueSize();this.times=n.slice(s,a),this.values=this.values.slice(s*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!=0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,i=this.values,s=n.length;s===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==s;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(i!==void 0&&af(i))for(let o=0,l=i.length;o!==l;++o){let c=i[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===wo,s=e.length-1,a=1;for(let o=1;o<s;++o){let l=!1,c=e[o];if(c!==e[o+1]&&(o!==1||c!==e[0]))if(i)l=!0;else{let h=o*n,u=h-n,d=h+n;for(let p=0;p!==n;++p){let f=t[h+p];if(f!==t[u+p]||f!==t[d+p]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let h=o*n,u=a*n;for(let d=0;d!==n;++d)t[u+d]=t[h+d]}++a}}if(s>0){e[a]=e[s];for(let o=s*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=new this.constructor(this.name,e,t);return n.createInterpolant=this.createInterpolant,n}};nn.prototype.TimeBufferType=Float32Array,nn.prototype.ValueBufferType=Float32Array,nn.prototype.DefaultInterpolation=ia;hi=class extends nn{};hi.prototype.ValueTypeName="bool",hi.prototype.ValueBufferType=Array,hi.prototype.DefaultInterpolation=na,hi.prototype.InterpolantFactoryMethodLinear=void 0,hi.prototype.InterpolantFactoryMethodSmooth=void 0;ec=class extends nn{};ec.prototype.ValueTypeName="color";tc=class extends nn{};tc.prototype.ValueTypeName="number";nc=class extends lr{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){let s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(i-t),c=e*o;for(let h=c+o;c!==h;c+=4)Ft.slerpFlat(s,0,a,c-o,a,c,l);return s}},Nr=class extends nn{InterpolantFactoryMethodLinear(e){return new nc(this.times,this.values,this.getValueSize(),e)}};Nr.prototype.ValueTypeName="quaternion",Nr.prototype.DefaultInterpolation=ia,Nr.prototype.InterpolantFactoryMethodSmooth=void 0;ui=class extends nn{};ui.prototype.ValueTypeName="string",ui.prototype.ValueBufferType=Array,ui.prototype.DefaultInterpolation=na,ui.prototype.InterpolantFactoryMethodLinear=void 0,ui.prototype.InterpolantFactoryMethodSmooth=void 0;ic=class extends nn{};ic.prototype.ValueTypeName="vector";bu={enabled:!1,files:{},add:function(r,e){this.enabled!==!1&&(this.files[r]=e)},get:function(r){if(this.enabled!==!1)return this.files[r]},remove:function(r){delete this.files[r]},clear:function(){this.files={}}},rc=class{constructor(e,t,n){let i=this,s,a=!1,o=0,l=0,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(h){l++,a===!1&&i.onStart!==void 0&&i.onStart(h,o,l),a=!0},this.itemEnd=function(h){o++,i.onProgress!==void 0&&i.onProgress(h,o,l),o===l&&(a=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return s?s(h):h},this.setURLModifier=function(h){return s=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){let p=c[u],f=c[u+1];if(p.global&&(p.lastIndex=0),p.test(h))return f}return null}}},of=new rc,Yr=class{constructor(e){this.manager=e!==void 0?e:of,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(i,s){n.load(e,i,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};Yr.DEFAULT_MATERIAL_NAME="__DEFAULT";sc=class extends Yr{constructor(e){super(e)}load(e,t,n,i){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let s=this,a=bu.get(e);if(a!==void 0)return s.manager.itemStart(e),setTimeout(function(){t&&t(a),s.manager.itemEnd(e)},0),a;let o=Fr("img");function l(){h(),bu.add(e,this),t&&t(this),s.manager.itemEnd(e)}function c(u){h(),i&&i(u),s.manager.itemError(e),s.manager.itemEnd(e)}function h(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),s.manager.itemStart(e),o.src=e,o}},Ua=class extends Yr{constructor(e){super(e)}load(e,t,n,i){let s=new Ot,a=new sc(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){s.image=o,s.needsUpdate=!0,t!==void 0&&t(s)},n,i),s}},Zr=class extends ot{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Te(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}},Jr=class extends Zr{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(ot.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Te(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},Qo=new Re,Mu=new w,Su=new w,Oa=class{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ie(512,512),this.map=null,this.mapPass=null,this.matrix=new Re,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ar,this._frameExtents=new ie(1,1),this._viewportCount=1,this._viewports=[new Ze(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;Mu.setFromMatrixPosition(e.matrixWorld),t.position.copy(Mu),Su.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Su),t.updateMatrixWorld(),Qo.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Qo),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Qo)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),this.mapSize.x===512&&this.mapSize.y===512||(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},wu=new Re,Rr=new w,el=new w,ac=class extends Oa{constructor(){super(new Mt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new ie(4,2),this._viewportCount=6,this._viewports=[new Ze(2,1,1,1),new Ze(0,1,1,1),new Ze(3,1,1,1),new Ze(1,1,1,1),new Ze(3,0,1,1),new Ze(1,0,1,1)],this._cubeDirections=[new w(1,0,0),new w(-1,0,0),new w(0,0,1),new w(0,0,-1),new w(0,1,0),new w(0,-1,0)],this._cubeUps=[new w(0,1,0),new w(0,1,0),new w(0,1,0),new w(0,1,0),new w(0,0,1),new w(0,0,-1)]}updateMatrices(e,t=0){let n=this.camera,i=this.matrix,s=e.distance||n.far;s!==n.far&&(n.far=s,n.updateProjectionMatrix()),Rr.setFromMatrixPosition(e.matrixWorld),n.position.copy(Rr),el.copy(n.position),el.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(el),n.updateMatrixWorld(),i.makeTranslation(-Rr.x,-Rr.y,-Rr.z),wu.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(wu)}},Kr=class extends Zr{constructor(e,t,n=0,i=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new ac}get power(){return 4*this.intensity*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},oc=class extends Oa{constructor(){super(new ga(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Fa=class extends Zr{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ot.DEFAULT_UP),this.updateMatrix(),this.target=new ot,this.shadow=new oc}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},Eg=new Re,Tg=new Re,Ag=new Re,Ba=class{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Eu(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let t=Eu();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}};Rg=new w,Cg=new Ft,Pg=new w,Lg=new w,Ig=new w,Dg=new Ft,Ng=new w,Ug=new w,gc="\\[\\]\\.:\\/",lf=new RegExp("["+gc+"]","g"),tl="[^"+gc+"]",cf="[^"+gc.replace("\\.","")+"]",hf=new RegExp("^"+/((?:WC+[\/:])*)/.source.replace("WC",tl)+/(WCOD+)?/.source.replace("WCOD",cf)+/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",tl)+/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",tl)+"$"),uf=["material","materials","bones","map"],Qe=class r{constructor(e,t,n){this.path=t,this.parsedPath=n||r.parseTrackName(t),this.node=r.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new r.Composite(e,t,n):new r(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(lf,"")}static parseTrackName(e){let t=hf.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let s=n.nodeName.substring(i+1);uf.indexOf(s)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=s)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(s){for(let a=0;a<s.length;a++){let o=s[a];if(o.name===t||o.uuid===t)return o;let l=n(o.children);if(l)return l}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,i=t.propertyName,s=t.propertyIndex;if(e||(e=r.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e)return void console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material)return void console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);if(!e.material.materials)return void console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);e=e.material.materials;break;case"bones":if(!e.skeleton)return void console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material)return void console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);if(!e.material.map)return void console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);e=e.material.map;break;default:if(e[n]===void 0)return void console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);e=e[n]}if(c!==void 0){if(e[c]===void 0)return void console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);e=e[c]}}let a=e[i];if(a===void 0){let c=t.nodeName;return void console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",e)}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(s!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry)return void console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);if(!e.geometry.morphAttributes)return void console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=s}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=i;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Qe.Composite=class{constructor(r,e,t){let n=t||Qe.parseTrackName(e);this._targetGroup=r,this._bindings=r.subscribe_(e,n)}getValue(r,e){this.bind();let t=this._targetGroup.nCachedObjects_,n=this._bindings[t];n!==void 0&&n.getValue(r,e)}setValue(r,e){let t=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=t.length;n!==i;++n)t[n].setValue(r,e)}bind(){let r=this._bindings;for(let e=this._targetGroup.nCachedObjects_,t=r.length;e!==t;++e)r[e].bind()}unbind(){let r=this._bindings;for(let e=this._targetGroup.nCachedObjects_,t=r.length;e!==t;++e)r[e].unbind()}},Qe.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},Qe.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},Qe.prototype.GetterByBindingType=[Qe.prototype._getValue_direct,Qe.prototype._getValue_array,Qe.prototype._getValue_arrayElement,Qe.prototype._getValue_toArray],Qe.prototype.SetterByBindingTypeAndVersioning=[[Qe.prototype._setValue_direct,Qe.prototype._setValue_direct_setNeedsUpdate,Qe.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Qe.prototype._setValue_array,Qe.prototype._setValue_array_setNeedsUpdate,Qe.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Qe.prototype._setValue_arrayElement,Qe.prototype._setValue_arrayElement_setNeedsUpdate,Qe.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Qe.prototype._setValue_fromArray,Qe.prototype._setValue_fromArray_setNeedsUpdate,Qe.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];Og=new Float32Array(1),ka=class{constructor(e,t,n=0,i=1/0){this.ray=new Ln(e,t),this.near=n,this.far=i,this.camera=null,this.layers=new Br,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}intersectObject(e,t=!0,n=[]){return lc(e,this,n,t),n.sort(Tu),n}intersectObjects(e,t=!0,n=[]){for(let i=0,s=e.length;i<s;i++)lc(e[i],this,n,t);return n.sort(Tu),n}};Qr=class{constructor(e=1,t=0,n=0){return this.radius=e,this.phi=t,this.theta=n,this}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(ut(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}},Fg=new ie,Bg=new w,kg=new w,zg=new w,Hg=new w,Gg=new Re,Vg=new Re,Wg=new w,$g=new Te,jg=new Te,Xg=new w,qg=new w,Yg=new w,Zg=new w,Jg=new kr,Kg=new pn,Au=new w,za=class extends ot{constructor(e=new w(0,0,1),t=new w(0,0,0),n=1,i=16776960,s=.2*n,a=.2*s){super(),this.type="ArrowHelper",ea===void 0&&(ea=new Ye,ea.setAttribute("position",new we([0,0,0,0,1,0],3)),nl=new gt(0,.5,1,5,1),nl.translate(0,-.5,0)),this.position.copy(t),this.line=new or(ea,new gi({color:i,toneMapped:!1})),this.line.matrixAutoUpdate=!1,this.add(this.line),this.cone=new ge(nl,new In({color:i,toneMapped:!1})),this.cone.matrixAutoUpdate=!1,this.add(this.cone),this.setDirection(e),this.setLength(n,s,a)}setDirection(e){if(e.y>.99999)this.quaternion.set(0,0,0,1);else if(e.y<-.99999)this.quaternion.set(1,0,0,0);else{Au.set(e.z,0,-e.x).normalize();let t=Math.acos(e.y);this.quaternion.setFromAxisAngle(Au,t)}}setLength(e,t=.2*e,n=.2*t){this.line.scale.set(1,Math.max(1e-4,e-t),1),this.line.updateMatrix(),this.cone.scale.set(n,t,n),this.cone.position.y=e,this.cone.updateMatrix()}setColor(e){this.line.material.color.set(e),this.cone.material.color.set(e)}copy(e){return super.copy(e,!1),this.line.copy(e.line),this.cone.copy(e.cone),this}dispose(){this.line.geometry.dispose(),this.line.material.dispose(),this.cone.geometry.dispose(),this.cone.material.dispose()}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:il}})),typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=il)});var Qu,_c,ed,ja,td,pf,Xa,nd=Bn(()=>{$a();Qu={type:"change"},_c={type:"start"},ed={type:"end"},ja=new Ln,td=new tn,pf=Math.cos(70*zu.DEG2RAD),Xa=class extends dn{constructor(e,t){super(),this.object=e,this.domElement=t,this.domElement.style.touchAction="none",this.enabled=!0,this.target=new w,this.cursor=new w,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:xi.ROTATE,MIDDLE:xi.DOLLY,RIGHT:xi.PAN},this.touches={ONE:bi.ROTATE,TWO:bi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this.getPolarAngle=function(){return o.phi},this.getAzimuthalAngle=function(){return o.theta},this.getDistance=function(){return this.object.position.distanceTo(this.target)},this.listenToKeyEvents=function(x){x.addEventListener("keydown",Ne),this._domElementKeyEvents=x},this.stopListenToKeyEvents=function(){this._domElementKeyEvents.removeEventListener("keydown",Ne),this._domElementKeyEvents=null},this.saveState=function(){n.target0.copy(n.target),n.position0.copy(n.object.position),n.zoom0=n.object.zoom},this.reset=function(){n.target.copy(n.target0),n.object.position.copy(n.position0),n.object.zoom=n.zoom0,n.object.updateProjectionMatrix(),n.dispatchEvent(Qu),n.update(),s=i.NONE},this.update=function(){let x=new w,fe=new Ft().setFromUnitVectors(e.up,new w(0,1,0)),Ie=fe.clone().invert(),Ae=new w,mt=new Ft,$t=new w,St=2*Math.PI;return function(ts=null){let Ei=n.object.position;x.copy(Ei).sub(n.target),x.applyQuaternion(fe),o.setFromVector3(x),n.autoRotate&&s===i.NONE&&P(B(ts)),n.enableDamping?(o.theta+=l.theta*n.dampingFactor,o.phi+=l.phi*n.dampingFactor):(o.theta+=l.theta,o.phi+=l.phi);let Bt=n.minAzimuthAngle,kt=n.maxAzimuthAngle;isFinite(Bt)&&isFinite(kt)&&(Bt<-Math.PI?Bt+=St:Bt>Math.PI&&(Bt-=St),kt<-Math.PI?kt+=St:kt>Math.PI&&(kt-=St),Bt<=kt?o.theta=Math.max(Bt,Math.min(kt,o.theta)):o.theta=o.theta>(Bt+kt)/2?Math.max(Bt,o.theta):Math.min(kt,o.theta)),o.phi=Math.max(n.minPolarAngle,Math.min(n.maxPolarAngle,o.phi)),o.makeSafe(),n.enableDamping===!0?n.target.addScaledVector(h,n.dampingFactor):n.target.add(h),n.target.sub(n.cursor),n.target.clampLength(n.minTargetRadius,n.maxTargetRadius),n.target.add(n.cursor),n.zoomToCursor&&M||n.object.isOrthographicCamera?o.radius=H(o.radius):o.radius=H(o.radius*c),x.setFromSpherical(o),x.applyQuaternion(Ie),Ei.copy(n.target).add(x),n.object.lookAt(n.target),n.enableDamping===!0?(l.theta*=1-n.dampingFactor,l.phi*=1-n.dampingFactor,h.multiplyScalar(1-n.dampingFactor)):(l.set(0,0,0),h.set(0,0,0));let jt=!1;if(n.zoomToCursor&&M){let On=null;if(n.object.isPerspectiveCamera){let Fn=x.length();On=H(Fn*c);let _n=Fn-On;n.object.position.addScaledVector(b,_n),n.object.updateMatrixWorld()}else if(n.object.isOrthographicCamera){let Fn=new w(T.x,T.y,0);Fn.unproject(n.object),n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/c)),n.object.updateProjectionMatrix(),jt=!0;let _n=new w(T.x,T.y,0);_n.unproject(n.object),n.object.position.sub(_n).add(Fn),n.object.updateMatrixWorld(),On=x.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),n.zoomToCursor=!1;On!==null&&(this.screenSpacePanning?n.target.set(0,0,-1).transformDirection(n.object.matrix).multiplyScalar(On).add(n.object.position):(ja.origin.copy(n.object.position),ja.direction.set(0,0,-1).transformDirection(n.object.matrix),Math.abs(n.object.up.dot(ja.direction))<pf?e.lookAt(n.target):(td.setFromNormalAndCoplanarPoint(n.object.up,n.target),ja.intersectPlane(td,n.target))))}else n.object.isOrthographicCamera&&(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/c)),n.object.updateProjectionMatrix(),jt=!0);return c=1,M=!1,jt||Ae.distanceToSquared(n.object.position)>a||8*(1-mt.dot(n.object.quaternion))>a||$t.distanceToSquared(n.target)>0?(n.dispatchEvent(Qu),Ae.copy(n.object.position),mt.copy(n.object.quaternion),$t.copy(n.target),!0):!1}}(),this.dispose=function(){n.domElement.removeEventListener("contextmenu",gn),n.domElement.removeEventListener("pointerdown",ce),n.domElement.removeEventListener("pointercancel",pe),n.domElement.removeEventListener("wheel",_e),n.domElement.removeEventListener("pointermove",de),n.domElement.removeEventListener("pointerup",pe),n._domElementKeyEvents!==null&&(n._domElementKeyEvents.removeEventListener("keydown",Ne),n._domElementKeyEvents=null)};let n=this,i={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},s=i.NONE,a=1e-6,o=new Qr,l=new Qr,c=1,h=new w,u=new ie,d=new ie,p=new ie,f=new ie,v=new ie,m=new ie,y=new ie,g=new ie,_=new ie,b=new w,T=new ie,M=!1,E=[],N={},I=!1;function B(x){return x!==null?2*Math.PI/60*n.autoRotateSpeed*x:2*Math.PI/60/60*n.autoRotateSpeed}function D(x){let fe=Math.abs(x*.01);return Math.pow(.95,n.zoomSpeed*fe)}function P(x){l.theta-=x}function O(x){l.phi-=x}let k=function(){let x=new w;return function(Ie,Ae){x.setFromMatrixColumn(Ae,0),x.multiplyScalar(-Ie),h.add(x)}}(),ee=function(){let x=new w;return function(Ie,Ae){n.screenSpacePanning===!0?x.setFromMatrixColumn(Ae,1):(x.setFromMatrixColumn(Ae,0),x.crossVectors(n.object.up,x)),x.multiplyScalar(Ie),h.add(x)}}(),oe=function(){let x=new w;return function(Ie,Ae){let mt=n.domElement;if(n.object.isPerspectiveCamera){let $t=n.object.position;x.copy($t).sub(n.target);let St=x.length();St*=Math.tan(n.object.fov/2*Math.PI/180),k(2*Ie*St/mt.clientHeight,n.object.matrix),ee(2*Ae*St/mt.clientHeight,n.object.matrix)}else n.object.isOrthographicCamera?(k(Ie*(n.object.right-n.object.left)/n.object.zoom/mt.clientWidth,n.object.matrix),ee(Ae*(n.object.top-n.object.bottom)/n.object.zoom/mt.clientHeight,n.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),n.enablePan=!1)}}();function K(x){n.object.isPerspectiveCamera||n.object.isOrthographicCamera?c/=x:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function X(x){n.object.isPerspectiveCamera||n.object.isOrthographicCamera?c*=x:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function J(x,fe){if(!n.zoomToCursor)return;M=!0;let Ie=n.domElement.getBoundingClientRect(),Ae=x-Ie.left,mt=fe-Ie.top,$t=Ie.width,St=Ie.height;T.x=Ae/$t*2-1,T.y=-(mt/St)*2+1,b.set(T.x,T.y,1).unproject(n.object).sub(n.object.position).normalize()}function H(x){return Math.max(n.minDistance,Math.min(n.maxDistance,x))}function Y(x){u.set(x.clientX,x.clientY)}function he(x){J(x.clientX,x.clientX),y.set(x.clientX,x.clientY)}function A(x){f.set(x.clientX,x.clientY)}function R(x){d.set(x.clientX,x.clientY),p.subVectors(d,u).multiplyScalar(n.rotateSpeed);let fe=n.domElement;P(2*Math.PI*p.x/fe.clientHeight),O(2*Math.PI*p.y/fe.clientHeight),u.copy(d),n.update()}function z(x){g.set(x.clientX,x.clientY),_.subVectors(g,y),_.y>0?K(D(_.y)):_.y<0&&X(D(_.y)),y.copy(g),n.update()}function q(x){v.set(x.clientX,x.clientY),m.subVectors(v,f).multiplyScalar(n.panSpeed),oe(m.x,m.y),f.copy(v),n.update()}function L(x){J(x.clientX,x.clientY),x.deltaY<0?X(D(x.deltaY)):x.deltaY>0&&K(D(x.deltaY)),n.update()}function j(x){let fe=!1;switch(x.code){case n.keys.UP:x.ctrlKey||x.metaKey||x.shiftKey?O(2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):oe(0,n.keyPanSpeed),fe=!0;break;case n.keys.BOTTOM:x.ctrlKey||x.metaKey||x.shiftKey?O(-2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):oe(0,-n.keyPanSpeed),fe=!0;break;case n.keys.LEFT:x.ctrlKey||x.metaKey||x.shiftKey?P(2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):oe(n.keyPanSpeed,0),fe=!0;break;case n.keys.RIGHT:x.ctrlKey||x.metaKey||x.shiftKey?P(-2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):oe(-n.keyPanSpeed,0),fe=!0;break}fe&&(x.preventDefault(),n.update())}function U(x){if(E.length===1)u.set(x.pageX,x.pageY);else{let fe=Dt(x),Ie=.5*(x.pageX+fe.x),Ae=.5*(x.pageY+fe.y);u.set(Ie,Ae)}}function F(x){if(E.length===1)f.set(x.pageX,x.pageY);else{let fe=Dt(x),Ie=.5*(x.pageX+fe.x),Ae=.5*(x.pageY+fe.y);f.set(Ie,Ae)}}function G(x){let fe=Dt(x),Ie=x.pageX-fe.x,Ae=x.pageY-fe.y,mt=Math.sqrt(Ie*Ie+Ae*Ae);y.set(0,mt)}function te(x){n.enableZoom&&G(x),n.enablePan&&F(x)}function Q(x){n.enableZoom&&G(x),n.enableRotate&&U(x)}function S(x){if(E.length==1)d.set(x.pageX,x.pageY);else{let Ie=Dt(x),Ae=.5*(x.pageX+Ie.x),mt=.5*(x.pageY+Ie.y);d.set(Ae,mt)}p.subVectors(d,u).multiplyScalar(n.rotateSpeed);let fe=n.domElement;P(2*Math.PI*p.x/fe.clientHeight),O(2*Math.PI*p.y/fe.clientHeight),u.copy(d)}function re(x){if(E.length===1)v.set(x.pageX,x.pageY);else{let fe=Dt(x),Ie=.5*(x.pageX+fe.x),Ae=.5*(x.pageY+fe.y);v.set(Ie,Ae)}m.subVectors(v,f).multiplyScalar(n.panSpeed),oe(m.x,m.y),f.copy(v)}function V(x){let fe=Dt(x),Ie=x.pageX-fe.x,Ae=x.pageY-fe.y,mt=Math.sqrt(Ie*Ie+Ae*Ae);g.set(0,mt),_.set(0,Math.pow(g.y/y.y,n.zoomSpeed)),K(_.y),y.copy(g);let $t=(x.pageX+fe.x)*.5,St=(x.pageY+fe.y)*.5;J($t,St)}function W(x){n.enableZoom&&V(x),n.enablePan&&re(x)}function se(x){n.enableZoom&&V(x),n.enableRotate&&S(x)}function ce(x){n.enabled!==!1&&(E.length===0&&(n.domElement.setPointerCapture(x.pointerId),n.domElement.addEventListener("pointermove",de),n.domElement.addEventListener("pointerup",pe)),wi(x),x.pointerType==="touch"?Ue(x):Se(x))}function de(x){n.enabled!==!1&&(x.pointerType==="touch"?Si(x):me(x))}function pe(x){Ct(x),E.length===0&&(n.domElement.releasePointerCapture(x.pointerId),n.domElement.removeEventListener("pointermove",de),n.domElement.removeEventListener("pointerup",pe)),n.dispatchEvent(ed),s=i.NONE}function Se(x){let fe;switch(x.button){case 0:fe=n.mouseButtons.LEFT;break;case 1:fe=n.mouseButtons.MIDDLE;break;case 2:fe=n.mouseButtons.RIGHT;break;default:fe=-1}switch(fe){case xi.DOLLY:if(n.enableZoom===!1)return;he(x),s=i.DOLLY;break;case xi.ROTATE:if(x.ctrlKey||x.metaKey||x.shiftKey){if(n.enablePan===!1)return;A(x),s=i.PAN}else{if(n.enableRotate===!1)return;Y(x),s=i.ROTATE}break;case xi.PAN:if(x.ctrlKey||x.metaKey||x.shiftKey){if(n.enableRotate===!1)return;Y(x),s=i.ROTATE}else{if(n.enablePan===!1)return;A(x),s=i.PAN}break;default:s=i.NONE}s!==i.NONE&&n.dispatchEvent(_c)}function me(x){switch(s){case i.ROTATE:if(n.enableRotate===!1)return;R(x);break;case i.DOLLY:if(n.enableZoom===!1)return;z(x);break;case i.PAN:if(n.enablePan===!1)return;q(x);break}}function _e(x){n.enabled===!1||n.enableZoom===!1||s!==i.NONE||(x.preventDefault(),n.dispatchEvent(_c),L(Ce(x)),n.dispatchEvent(ed))}function Ce(x){let fe=x.deltaMode,Ie={clientX:x.clientX,clientY:x.clientY,deltaY:x.deltaY};switch(fe){case 1:Ie.deltaY*=16;break;case 2:Ie.deltaY*=100;break}return x.ctrlKey&&!I&&(Ie.deltaY*=10),Ie}function lt(x){x.key==="Control"&&(I=!0,document.addEventListener("keyup",ye,{passive:!0,capture:!0}))}function ye(x){x.key==="Control"&&(I=!1,document.removeEventListener("keyup",ye,{passive:!0,capture:!0}))}function Ne(x){n.enabled===!1||n.enablePan===!1||j(x)}function Ue(x){switch(_t(x),E.length){case 1:switch(n.touches.ONE){case bi.ROTATE:if(n.enableRotate===!1)return;U(x),s=i.TOUCH_ROTATE;break;case bi.PAN:if(n.enablePan===!1)return;F(x),s=i.TOUCH_PAN;break;default:s=i.NONE}break;case 2:switch(n.touches.TWO){case bi.DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;te(x),s=i.TOUCH_DOLLY_PAN;break;case bi.DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;Q(x),s=i.TOUCH_DOLLY_ROTATE;break;default:s=i.NONE}break;default:s=i.NONE}s!==i.NONE&&n.dispatchEvent(_c)}function Si(x){switch(_t(x),s){case i.TOUCH_ROTATE:if(n.enableRotate===!1)return;S(x),n.update();break;case i.TOUCH_PAN:if(n.enablePan===!1)return;re(x),n.update();break;case i.TOUCH_DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;W(x),n.update();break;case i.TOUCH_DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;se(x),n.update();break;default:s=i.NONE}}function gn(x){n.enabled!==!1&&x.preventDefault()}function wi(x){E.push(x.pointerId)}function Ct(x){delete N[x.pointerId];for(let fe=0;fe<E.length;fe++)if(E[fe]==x.pointerId){E.splice(fe,1);return}}function _t(x){let fe=N[x.pointerId];fe===void 0&&(fe=new ie,N[x.pointerId]=fe),fe.set(x.pageX,x.pageY)}function Dt(x){let fe=x.pointerId===E[0]?E[1]:E[0];return N[fe]}n.domElement.addEventListener("contextmenu",gn),n.domElement.addEventListener("pointerdown",ce),n.domElement.addEventListener("pointercancel",pe),n.domElement.addEventListener("wheel",_e,{passive:!1}),document.addEventListener("keydown",lt,{passive:!0,capture:!0}),this.update()}}});var Mi,hr,id,rd,sd,ad,qa,od=Bn(()=>{$a();Mi=class extends ot{constructor(e=document.createElement("div")){super(),this.isCSS2DObject=!0,this.element=e,this.element.style.position="absolute",this.element.style.userSelect="none",this.element.setAttribute("draggable",!1),this.center=new ie(.5,.5),this.addEventListener("removed",function(){this.traverse(function(t){t.element instanceof Element&&t.element.parentNode!==null&&t.element.parentNode.removeChild(t.element)})})}copy(e,t){return super.copy(e,t),this.element=e.element.cloneNode(!0),this.center=e.center,this}},hr=new w,id=new Re,rd=new Re,sd=new w,ad=new w,qa=class{constructor(e={}){let t=this,n,i,s,a,o={objects:new WeakMap},l=e.element!==void 0?e.element:document.createElement("div");l.style.overflow="hidden",this.domElement=l,this.getSize=function(){return{width:n,height:i}},this.render=function(p,f){p.matrixWorldAutoUpdate===!0&&p.updateMatrixWorld(),f.parent===null&&f.matrixWorldAutoUpdate===!0&&f.updateMatrixWorld(),id.copy(f.matrixWorldInverse),rd.multiplyMatrices(f.projectionMatrix,id),c(p,p,f),d(p)},this.setSize=function(p,f){n=p,i=f,s=n/2,a=i/2,l.style.width=p+"px",l.style.height=f+"px"};function c(p,f,v){if(p.isCSS2DObject){hr.setFromMatrixPosition(p.matrixWorld),hr.applyMatrix4(rd);let m=p.visible===!0&&hr.z>=-1&&hr.z<=1&&p.layers.test(v.layers)===!0;if(p.element.style.display=m===!0?"":"none",m===!0){p.onBeforeRender(t,f,v);let g=p.element;g.style.transform="translate("+-100*p.center.x+"%,"+-100*p.center.y+"%)translate("+(hr.x*s+s)+"px,"+(-hr.y*a+a)+"px)",g.parentNode!==l&&l.appendChild(g),p.onAfterRender(t,f,v)}let y={distanceToCameraSquared:h(v,p)};o.objects.set(p,y)}for(let m=0,y=p.children.length;m<y;m++)c(p.children[m],f,v)}function h(p,f){return sd.setFromMatrixPosition(p.matrixWorld),ad.setFromMatrixPosition(f.matrixWorld),sd.distanceToSquared(ad)}function u(p){let f=[];return p.traverse(function(v){v.isCSS2DObject&&f.push(v)}),f}function d(p){let f=u(p).sort(function(m,y){if(m.renderOrder!==y.renderOrder)return y.renderOrder-m.renderOrder;let g=o.objects.get(m).distanceToCameraSquared,_=o.objects.get(y).distanceToCameraSquared;return g-_}),v=f.length;for(let m=0,y=f.length;m<y;m++)f[m].element.style.zIndex=v-m}}}});var cd={};bd(cd,{Model3D:()=>vc});function Ya(r,e,t,n=[1,1]){let i=document.createElement("canvas");i.width=r,i.height=e,t(i.getContext("2d"),r,e);let s=new Ea(i);return s.wrapS=s.wrapT=nr,s.repeat.set(...n),s.colorSpace=at,s.anisotropy=4,s}function es(r,e,t,n){let i=r?.C?.[t];if(i){let s=new Ua().load(i.src);return s.wrapS=s.wrapT=nr,s.repeat.set(...n),s.colorSpace=at,s.anisotropy=4,s}return Ya(256,256,ld[e],n)}var ur,ld,vc,hd=Bn(()=>{$a();nd();od();ii();yr();ur=Math.PI/180;ld={wall:(r,e,t)=>{r.fillStyle="#efeadf",r.fillRect(0,0,e,t),r.fillStyle="#d9d3c6",r.fillRect(0,0,3,t),r.fillStyle="#f6f2ea",r.fillRect(3,0,2,t)},pad:(r,e,t)=>{r.fillStyle="#b9b9b4",r.fillRect(0,0,e,t);for(let n=0;n<900;n++)r.fillStyle=`rgba(0,0,0,${Math.random()*.06})`,r.fillRect(Math.random()*e,Math.random()*t,2,2)},ground:(r,e,t)=>{r.fillStyle="#a5643a",r.fillRect(0,0,e,t);for(let n=0;n<3e3;n++){let i=Math.random();r.fillStyle=i<.5?`rgba(80,40,20,${Math.random()*.25})`:`rgba(120,140,60,${Math.random()*.25})`,r.fillRect(Math.random()*e,Math.random()*t,3,3)}},solar:(r,e,t)=>{r.fillStyle="#1b2f57",r.fillRect(0,0,e,t),r.strokeStyle="#8fa6c8",r.lineWidth=1.2;for(let n=0;n<=e;n+=e/6)r.beginPath(),r.moveTo(n,0),r.lineTo(n,t),r.stroke();for(let n=0;n<=t;n+=t/10)r.beginPath(),r.moveTo(0,n),r.lineTo(e,n),r.stroke();r.strokeStyle="#c9d2dc",r.lineWidth=6,r.strokeRect(0,0,e,t)},crate:(r,e,t)=>{r.fillStyle="#ffffff",r.fillRect(0,0,e,t),r.fillStyle="rgba(0,0,0,.28)";for(let n=8;n<e;n+=16)r.fillRect(n,14,7,t-28)}};vc=class{constructor(e,t,n,i){this.host=e,this.cfg=t,this.geo=t.geometry,this.manifest=i,this.sensors=n.sensors,this.picks=[],this.hoverObj=null,this.low=!1,this.mode="auto",this.doorAngle=0,this.state=null,this.clock=new Ba,this.renderer=new zr({antialias:!0,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75)),this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=cc,this.renderer.outputColorSpace=at,this.renderer.toneMapping=uc,e.appendChild(this.renderer.domElement),this.labels=new qa,this.labels.domElement.style.cssText="position:absolute;inset:0;pointer-events:none",e.appendChild(this.labels.domElement),this.scene=new xa,this.scene.fog=new ya(12572650,25,90),this.camera=new Mt(45,1,.1,300),this.camera.position.set(4.6,2.7,6),this.controls=new Xa(this.camera,this.renderer.domElement),this.controls.target.set(0,1.3,0),this.controls.enableDamping=!0,this.controls.minDistance=3,this.controls.maxDistance=30,this.controls.maxPolarAngle=88*ur,this.controls.autoRotateSpeed=.6,this.lastInput=performance.now(),this.controls.addEventListener("start",()=>{this.lastInput=performance.now(),this.controls.autoRotate=!1}),this.lights(),this.world(),this.building(),this.canopy(),this.equipment(),this.interior(),this.sensorDots(),this.dimensions(),this.airflow(),this.pointer(),addEventListener("resize",()=>this.resize()),this.resize(),this.renderer.setAnimationLoop(()=>this.frame())}lights(){this.hemi=new Jr(14675967,9067066,.9),this.scene.add(this.hemi),this.sun=new Fa(16773596,2.4),this.sun.castShadow=!0,this.sun.shadow.mapSize.set(1024,1024);let e=this.sun.shadow.camera;e.left=e.bottom=-7,e.right=e.top=7,e.near=1,e.far=60,this.sun.shadow.bias=-5e-4,this.scene.add(this.sun,this.sun.target),this.lamp=new Kr(16767392,0,7,1.6),this.scene.add(this.lamp)}world(){let e=new ge(new _i(120,48),new fn({map:es(this.manifest,"ground","C5_ground",[40,40])}));e.rotation.x=-Math.PI/2,e.position.y=-.15,e.receiveShadow=!0,this.scene.add(e);let t=7,n=()=>(t=t*16807%2147483647)/2147483647,i=new fn({color:6262588});for(let l=0;l<6;l++){let c=new ge(new Nn(40,3.2),i);c.rotation.x=-Math.PI/2,c.position.set(0,-.13,-18-l*4.2),this.scene.add(c)}let s=new fn({color:7031346}),a=new fn({color:4157230});for(let l=0;l<16;l++){let c=n()*Math.PI*2,h=11+n()*14,u=Math.cos(c)*h,d=Math.sin(c)*h;if(d>4&&Math.abs(u)<8)continue;let p=1.8+n()*1.8,f=new ge(new gt(.09,.14,p,6),s);f.position.set(u,p/2-.15,d);let v=new ge(new qr(.8+n()*.6,1),a);v.position.set(u,p+.5,d),v.castShadow=!0,this.scene.add(f,v)}let o=new ge(new We(3.7,.15,3.6),new fn({map:es(this.manifest,"pad","C2_pad",[3,3])}));o.position.set(0,-.075,.35),o.receiveShadow=!0,this.scene.add(o)}building(){let[e,t,n]=this.geo.outer,i=this.geo.wall_t,[s,a]=this.geo.door,o=es(this.manifest,"wall","C1_wall",[e/1.1,1]),l=new Pe({map:o,roughness:.75,metalness:.05}),c=new Pe({color:15331830,roughness:.6}),h=(b,T,M,E,N,I,B=l)=>{let D=new ge(new We(b,T,M),B);return D.position.set(E,N,I),D.castShadow=D.receiveShadow=!0,this.scene.add(D),this.picks.push(D),D};h(e,i,n,0,i/2,0,new Pe({color:14278370})),h(e,i,n,0,t-i/2,0),h(e,t-2*i,i,0,t/2,-n/2+i/2),h(i,t-2*i,n-2*i,-e/2+i/2,t/2,0),h(i,t-2*i,n-2*i,e/2-i/2,t/2,0);let u=(e-s)/2,d=n/2-i/2;h(u,t-2*i,i,-e/2+u/2,t/2,d),h(u,t-2*i,i,e/2-u/2,t/2,d);let p=t-2*i-a;h(s,p,i,0,i+a+p/2,d),this.doorPivot=new it,this.doorPivot.position.set(-s/2,i,n/2);let f=new ge(new We(s,a,.09),new Pe({color:15855076,roughness:.6}));f.position.set(s/2,a/2,.02),f.castShadow=!0,new ge(new We(s+.08,a+.06,.02),new Pe({color:2236962})).position.set(s/2,a/2,-.02);let m=new ge(new We(.14,.03,.05),new Pe({color:11184810,metalness:.8,roughness:.3}));m.position.set(s-.12,1,.09),this.doorPivot.add(f,m),this.scene.add(this.doorPivot);let y=new Pe({color:2764595,metalness:.4,roughness:.5});for(let[b,T,M,E]of[[.04,a+.04,-s/2-.02,i+a/2],[.04,a+.04,s/2+.02,i+a/2],[s+.08,.04,0,i+a+.02]]){let N=new ge(new We(b,T,.03),y);N.position.set(M,E,n/2+.012),this.scene.add(N)}f.userData.part="door",this.picks.push(f),this.curtain=new it;let g=new Pe({color:13625599,transparent:!0,opacity:.35,roughness:.1,side:Cu});for(let b=0;b<6;b++){let T=new ge(new Nn(s/6+.02,a),g);T.position.set(-s/2+s/12+b*s/6,i+a/2,n/2-i-.02),this.curtain.add(T)}this.scene.add(this.curtain);let _=new ge(new Nn(e-2*i,t-2*i),new In({color:13625079}));_.position.set(0,t/2,-n/2+i+.01),this.scene.add(_)}canopy(){let e=this.geo.pv,t=this.geo.outer[1],n=e.tilt_deg*ur,i=e.cols*e.module_w+.12,s=e.rows*e.module_l+.12,a=t+e.low_edge_above_roof_m,o=a+s/2*Math.sin(n);this.canopyGroup=new it,this.canopyGroup.position.set(0,o,0),this.canopyGroup.rotation.x=n;let l=new Pe({color:12107460,metalness:.7,roughness:.4}),c=new ge(new We(i,.06,s),l);c.castShadow=!0,this.canopyGroup.add(c);let h=es(this.manifest,"solar","C6_solar",[1,1]);this.pvMat=new Pe({map:h,metalness:.35,roughness:.25,emissive:1718906,emissiveIntensity:0});for(let f=0;f<e.rows;f++)for(let v=0;v<e.cols;v++){if(f*e.cols+v>=e.modules)continue;let m=new ge(new We(e.module_w-.02,.035,e.module_l-.02),this.pvMat);m.position.set(-i/2+.06+e.module_w*(v+.5),.045,-s/2+.06+e.module_l*(f+.5)),m.castShadow=!0,m.userData.part="solar",this.picks.push(m),this.canopyGroup.add(m)}this.scene.add(this.canopyGroup);let[u,,d]=this.geo.outer;for(let[f,v]of[[-u/2+.1,-d/2+.1],[u/2-.1,-d/2+.1],[-u/2+.1,d/2-.1],[u/2-.1,d/2-.1]]){let y=o-v*Math.tan(n)-.04-t,g=new ge(new We(.06,y,.06),l);g.position.set(f,t+y/2,v),g.castShadow=!0,this.scene.add(g)}this.canopyInfo={cw:i,cl:s,low:a,high:a+s*Math.sin(n),cy:o};let p=document.createElement("div");p.className="lbl3d pv",p.textContent="PV \u2013",this.pvLabel=new Mi(p),this.pvLabel.position.set(0,this.canopyInfo.high+.35,-s/2*Math.cos(n)),this.scene.add(this.pvLabel)}equipment(){let[e,t,n]=this.geo.outer,i=new it,s=new ge(new We(.3,.55,.8),new Pe({color:15527664,roughness:.5}));s.castShadow=!0,s.userData.part="condenser",this.picks.push(s);let a=new ge(new _i(.2,32),new Pe({color:5593952,metalness:.6,roughness:.5}));a.rotation.y=Math.PI/2,a.position.set(.152,0,-.1),this.fan=new it;for(let y=0;y<3;y++){let g=new ge(new We(.01,.17,.06),new Pe({color:14540253}));g.position.y=.08;let _=new it;_.add(g),_.rotation.x=y*2*Math.PI/3,this.fan.add(_)}this.fan.position.set(.16,0,-.1);let o=new ge(new We(.34,.03,.7),new Pe({color:9213083}));o.position.y=-.29,i.add(s,a,this.fan,o),i.position.set(e/2+.17,.9,.45),this.scene.add(i);let l=new Pe({color:12088115,metalness:.8,roughness:.35}),c=new ge(new gt(.012,.012,1,8),l);c.position.set(e/2+.02,1.65,.05),this.scene.add(c);let h=new ge(new We(.4,.5,.15),new Pe({color:10133670,metalness:.3}));h.position.set(.6,1.3,-n/2-.08),h.castShadow=!0,this.scene.add(h);let u=new it,d=new ge(new gt(.025,.03,2.3,10),new Pe({color:13159890,metalness:.6,roughness:.4}));d.position.y=1.15-.15;let p=new it;for(let y=0;y<6;y++){let g=new ge(new gt(.075,.09,.025,16),new Pe({color:16777215}));g.position.y=y*.03,p.add(g)}p.position.set(.12,1.43,0),this.cups=new it;for(let y=0;y<3;y++){let g=new it,_=new ge(new Un(.03,8,6,0,Math.PI),new Pe({color:2236962}));_.position.x=.11,g.add(_),g.rotation.y=y*2*Math.PI/3,this.cups.add(g)}this.cups.position.y=2.17,u.add(d,p,this.cups),u.position.set(1.75,0,2.05),u.traverse(y=>{y.isMesh&&(y.castShadow=!0)}),this.scene.add(u);let f=es(this.manifest,"crate","C8_crate",[1,1]),v=[5939279,9400210,5664952,10512981],m=0;for(let[y,g,_]of[[-1.15,0,1.45],[-.62,0,1.45],[-1.15,.31,1.45],[-.62,.31,1.45]]){let b=new ge(new We(.5,.3,.36),new Pe({map:f,color:v[m++%4]}));b.position.set(y,g+.15,_),b.castShadow=!0,b.userData.part="crates",this.picks.push(b),this.scene.add(b);let T=new ge(new Un(.2,8,6,0,Math.PI*2,0,Math.PI/2),new fn({color:5216826}));T.scale.set(1.1,.45,.8),T.position.set(y,g+.3,_),g>0&&this.scene.add(T)}this.lamp.position.set(0,t-.05,n/2+.4)}interior(){let[e,t,n]=this.geo.inner,i=this.geo.wall_t,s=-e/2,a=-n/2,o=i,l=new Pe({color:13226456,metalness:.8,roughness:.35}),c=new Pe({color:14278886,metalness:.7,roughness:.4,transparent:!0,opacity:.55}),h=(O,k)=>(O.castShadow=!1,k&&(O.userData.part=k,this.picks.push(O)),this.scene.add(O),O),u=1.35,d=.45,p=a+.1+u/2,f=[.18,.62,1.06,1.5];for(let O of[-1,1]){let k=O*(e/2-d/2-.03);for(let[ee,oe]of[[-1,-1],[-1,1],[1,-1],[1,1]]){let K=new ge(new gt(.012,.012,1.75,6),l);K.position.set(k+ee*(d/2-.02),o+.875,p+oe*(u/2-.02)),h(K)}f.forEach(ee=>{let oe=new ge(new We(d,.015,u),c);oe.position.set(k,o+ee,p),h(oe)})}let v=Ya(256,256,ld.crate),m=(O,k,ee,oe,K,X)=>{let J=new ge(new We(.38,.24,.5),new Pe({map:v,color:oe}));J.position.set(O,o+k+.13,ee),h(J,X);let H=new ge(new Un(.2,10,6,0,Math.PI*2,0,Math.PI/2),new fn({color:K}));H.scale.set(.95,.35,1.2),H.position.set(O,o+k+.25,ee),h(H,X)},y=e/2-d/2-.03;[[-y,.62,p-.38,9400210,3111466,"crate_greens"],[-y,.62,p+.3,5939279,3111466,"crate_greens"],[-y,.18,p-.38,5664952,3901998,"crate_greens"],[-y,.18,p+.3,10512981,11916138,"crate_grapes"],[y,.62,p-.38,5939279,11916138,"crate_grapes"],[y,.62,p+.3,9400210,11916138,"crate_grapes"],[y,.18,p-.38,5939279,11916138,"crate_grapes"],[y,1.06,p-.38,5939279,3111466,"crate_greens"]].forEach(O=>m(...O));let g=new Pe({color:14673128,metalness:.85,roughness:.25});for(let[O,k]of[[-.3,a+.25],[.3,a+.25]]){let ee=new ge(new gt(.15,.17,.5,18),g);ee.position.set(O,o+.25,k),h(ee,"milk");let oe=new ge(new gt(.07,.12,.12,14),g);oe.position.set(O,o+.56,k),h(oe,"milk")}let _=new ge(new We(.3,.22,.3),new Pe({color:16054266}));_.position.set(y,o+1.5+.12,p+.3),h(_,"vaccine");let b=new ge(new Nn(.12,.12),new In({color:2783446}));b.rotation.y=-Math.PI/2,b.position.set(y-.151,o+1.62,p+.3),h(b),this.pcmMat=new Pe({color:10275317,metalness:.5,roughness:.45,transparent:!0,opacity:.95});let T=(O,k,ee,oe,K,X)=>{let J=new ge(new We(O,k,.03),this.pcmMat);J.position.set(ee,o+oe,K),J.rotation.y=X,h(J,"pcm")};T(.55,1.2,-.55,.95,a+.035,0),T(.55,1.2,.55,.95,a+.035,0),T(.55,.35,s+.035,1.92,a+.45,Math.PI/2),T(.55,.35,-s-.035,1.92,a+.45,-Math.PI/2);let M=new Pe({color:14279144,metalness:.7,roughness:.35}),E=new We(.004,1.2,.04);for(let O of[-.55,.55])for(let k=0;k<22;k++){let ee=new ge(E,M);ee.position.set(O-.2625+k*.025,o+.95,a+.035+.015+.02),h(ee,"fins")}let N=new ge(new We(1.25,.04,.14),new Pe({color:11122370,metalness:.6,roughness:.4}));N.position.set(0,o+.31,a+.09),N.rotation.x=.06,h(N,"driptray");let I=new ge(new gt(.012,.012,.3,8),new Pe({color:7043720}));I.position.set(.64,o+.16,a+.09),h(I,"driptray");let B=new ge(new gt(.01,.01,.55,8),new Pe({color:12088115,metalness:.8,roughness:.3}));B.rotation.z=Math.PI/2,B.position.set(0,o+.95,a+.05),h(B);let D=new ge(new We(.72,.36,.34),new Pe({color:15922422,roughness:.5}));D.position.set(0,o+t-.3,a+.19),h(D,"evaporator");let P=new ge(new _i(.14,28),new Pe({color:5988968,metalness:.5}));P.position.set(0,o+t-.3,a+.362),h(P,"evaporator"),this.evapFan=new it;for(let O=0;O<4;O++){let k=new ge(new We(.035,.12,.01),new Pe({color:13620956}));k.position.y=.06;let ee=new it;ee.add(k),ee.rotation.z=O*Math.PI/2,this.evapFan.add(ee)}this.evapFan.position.set(0,o+t-.3,a+.37),this.scene.add(this.evapFan)}sensorDots(){this.dotGroup=new it;let e=Ya(64,64,(t,n)=>{let i=t.createRadialGradient(32,32,0,32,32,32);i.addColorStop(0,"rgba(160,255,240,1)"),i.addColorStop(.35,"rgba(20,184,166,.7)"),i.addColorStop(1,"rgba(20,184,166,0)"),t.fillStyle=i,t.fillRect(0,0,n,n)});this.dots=[];for(let t of this.sensors){let n=new ge(new Un(.045,14,10),new In({color:16777215})),i=new Ma(new Hr({map:e,depthWrite:!1,blending:Pu,transparent:!0}));i.scale.set(.22,.22,1),n.add(i),n.position.set(...t.pos),n.userData.sensor=t.id,n.userData.halo=i,n.userData.scene=t.scene,n.visible=t.scene!=="inside",this.dotGroup.add(n),this.picks.push(n),this.dots.push(n)}this.scene.add(this.dotGroup)}dimensions(){let[e,t,n]=this.geo.outer,i=this.geo.wall_t,[s,a]=this.geo.door,o=this.geo.inner;this.dimGroup=new it;let l=new gi({color:16777215}),c=(g,_,b)=>{let T=[g,_],M=b.clone().multiplyScalar(.08);T.push(g.clone().add(M),g.clone().sub(M),_.clone().add(M),_.clone().sub(M));let E=new Ye().setFromPoints([T[0],T[1],T[2],T[3],T[4],T[5]]);this.dimGroup.add(new Sa(E,l))},h=(g,_)=>{let b=document.createElement("div");b.className="lbl3d dim",b.textContent=g;let T=new Mi(b);T.position.copy(_),this.dimGroup.add(T)},u=(g,_,b)=>new w(g,_,b),d=n/2+.55,p=e/2+.75;c(u(-e/2,.02,d),u(e/2,.02,d),u(0,0,1)),h(`${e.toFixed(2)} m outside (${o[0]} m inside)`,u(0,.02,d+.12)),c(u(p,.02,-n/2),u(p,.02,n/2),u(1,0,0)),h(`${n.toFixed(2)} m (${o[2]} m inside)`,u(p+.1,.02,0)),c(u(-e/2-.35,0,n/2),u(-e/2-.35,t,n/2),u(1,0,0)),h(`${t.toFixed(2)} m (${o[1]} m inside)`,u(-e/2-.4,t/2,n/2)),c(u(-s/2,i+a+.12,n/2+.05),u(s/2,i+a+.12,n/2+.05),u(0,1,0)),h(`door ${s} \xD7 ${a} m`,u(0,i+a+.22,n/2+.05)),h(`wall: ${Math.round(i*1e3)} mm PUF, U = ${(this.cfg.design.chamber.insulation_k_W_mK/i).toFixed(2)} W/m\xB2K`,u(e/2,t+.05,n/2));let f=this.canopyInfo,v=this.geo.pv.tilt_deg,m=f.cl/2*Math.cos(v*ur);c(u(-f.cw/2-.15,f.low,m),u(-f.cw/2-.15,f.high,-m),u(1,0,0)),h(`PV tilt ${v}\xB0 facing south \xB7 ${this.geo.pv.modules} \xD7 ${this.geo.pv.module_W} W = ${this.geo.pv.array_kWp.toFixed(1)} kWp`,u(-f.cw/2-.2,(f.low+f.high)/2+.25,0));let y=new za(u(0,0,1),u(2.6,.02,1.8),.9,16765286,.22,.14);this.dimGroup.add(y),h("S (sun side)",u(2.6,.05,2.85)),this.scene.add(this.dimGroup)}airflow(){let[,e,t]=this.geo.outer,n=this.geo.wall_t,[i,s]=this.geo.door;this.door={z:t/2,y0:n,dw:i,dh:s},this.flowMax=700;let a=Ya(32,32,(h,u)=>{let d=h.createRadialGradient(16,16,0,16,16,16);d.addColorStop(0,"rgba(255,255,255,1)"),d.addColorStop(.6,"rgba(255,255,255,.6)"),d.addColorStop(1,"rgba(255,255,255,0)"),h.fillStyle=d,h.fillRect(0,0,u,u)}),o=h=>{let u=new Ye;u.setAttribute("position",new Rt(new Float32Array(this.flowMax*3),3)),u.setDrawRange(0,0);let d=new Gr({color:h,map:a,size:.06,transparent:!0,opacity:.9,depthWrite:!1,sizeAttenuation:!0}),p=new wa(u,d);return p.frustumCulled=!1,this.scene.add(p),{pts:p,list:[]}};this.warm=o(16742973),this.cold=o(5286655),this.flowAcc=0;let l=document.createElement("div");l.className="lbl3d heat",l.style.display="none",this.heatLabel=new Mi(l),this.heatLabel.position.set(0,n+s+.45,t/2+.3),this.scene.add(this.heatLabel);let c=new or(new Ye().setFromPoints([new w(-i/2,n+s/2,t/2+.02),new w(i/2,n+s/2,t/2+.02)]),new Na({color:16777215,dashSize:.06,gapSize:.04}));c.computeLineDistances(),c.visible=!1,this.neutralLine=c,this.scene.add(c),this.inLight=new Kr(14676223,0,6,1),this.inLight.position.set(0,e-.55,.35),this.scene.add(this.inLight),this.inFill=new Jr(15398143,10466244,0),this.scene.add(this.inFill)}stepAirflow(e,t){let n=this.state?.values,i=this.door,s=[this.warm,this.cold];if(!t||!n){s.forEach(c=>{c.list.length=0,c.pts.geometry.setDrawRange(0,0)}),this.heatLabel.element.style.display="none",this.neutralLine.visible=!1;return}let a=n.heat_if_open_kW,o=.45+1.6*n.v_door_if_open;for(this.flowAcc+=Math.min(this.low?140:320,9*a)*e;this.flowAcc>=1;){this.flowAcc-=1;let c=Math.random()<.5,h=c?this.warm:this.cold;if(h.list.length>=this.flowMax)continue;let u=(Math.random()-.5)*i.dw,d=c?i.y0+i.dh*(.55+Math.random()*.42):i.y0+i.dh*(.03+Math.random()*.42);h.list.push(c?{x:u,y:d,z:i.z+1.2,vz:-o,vy:.06}:{x:u,y:d,z:i.z-.9,vz:o,vy:-.25})}for(let c of s){let h=c.pts.geometry.attributes.position.array;c.list=c.list.filter(u=>(u.z+=u.vz*e,u.y=Math.max(.03,u.y+u.vy*e*(u.vz>0?u.z>i.z?1:.2:.3)),u.vz>0&&(u.x*=1+.35*e*(u.z>i.z?1:0)),u.vz<0?u.z>i.z-1.3:u.z<i.z+1.6)),c.list.forEach((u,d)=>{h[d*3]=u.x,h[d*3+1]=u.y,h[d*3+2]=u.z}),c.pts.geometry.attributes.position.needsUpdate=!0,c.pts.geometry.setDrawRange(0,c.list.length)}let l=this.heatLabel.element;l.style.display="",l.innerHTML=`Heat entering now: <b>${a.toFixed(1)} kW</b> \xB7 curtain ${n.curtain?"ON":"OFF"}<br><small>this opening ${n.last_open_s.toFixed(0)} s \u2192 ${n.last_open_kJ.toFixed(0)} kJ (= ${n.last_open_wall_minutes.toFixed(0)} min of wall heat)</small>`,this.neutralLine.visible=!0}tweenCamera(e,t,n){return new Promise(i=>{let s=this.camera.position.clone(),a=this.controls.target.clone(),o=performance.now();this.tween=()=>{let l=Math.min(1,(performance.now()-o)/(n*1e3)),c=l<.5?2*l*l:1-Math.pow(-2*l+2,2)/2;this.camera.position.lerpVectors(s,e,c),this.controls.target.lerpVectors(a,t,c),l>=1&&(this.tween=null,i())}})}async enter(){if(this.busy)return;this.busy=!0,this.forceDoor=!0,this.lastInput=performance.now()+1e9,this.controls.enabled=!1;let e=this.geo.outer[2],t=(n,i,s)=>new w(n,i,s);this.setDimsVisible(!1),this.sensorsVisible(!1),await this.tweenCamera(t(.9,1.65,e/2+3.2),t(0,1.2,e/2),2.5),await new Promise(n=>setTimeout(n,4200)),this.camera.fov=62,this.camera.updateProjectionMatrix(),await this.tweenCamera(t(0,1.6,e/2-.25),t(0,1.15,-.55),2.8),this.inside=!0,this.insideSensors(!0),this.forceDoor=!1,this.controls.enabled=!0,this.controls.minDistance=.4,this.controls.maxDistance=1.75,this.controls.enablePan=!1,this.busy=!1,this.onInside?.(!0)}async walkIn(e){if(this.busy)return;this.inside&&await this.exit();let t=this.geo.outer[2],n=this.geo.wall_t,i=new it,s=new Pe({color:15327954}),a=new Pe({color:7031346}),o=new ge(new gt(.17,.15,.75,12),s);o.position.y=1.15;let l=new ge(new gt(.14,.11,.8,10),new Pe({color:3882822}));l.position.y=.4;let c=new ge(new Un(.11,14,10),a);c.position.y=1.65;let h=new ge(new We(.42,.24,.32),new Pe({color:5939279}));h.position.set(0,1.1,-.25),i.add(o,l,c,h),i.traverse(g=>g.isMesh&&(g.castShadow=!0)),this.scene.add(i),this.busy=!0,this.controls.enabled=!1,await this.tweenCamera(new w(2.6,2.1,t/2+3.6),new w(0,1,t/2),1.5);let u=[[1.8,t/2+2.4],[0,t/2+.6],[0,t/2-.4],[-.45,-.1]],d=[u[0][0],u[0][1]];i.position.set(d[0],0,d[1]);for(let g=1;g<u.length;g++){g===2&&(this.forceDoor=!0,await new Promise(E=>setTimeout(E,900)));let _=u[g],b=Math.hypot(_[0]-d[0],_[1]-d[1]),T=b/1.1*1e3,M=performance.now();i.rotation.y=Math.atan2(_[0]-d[0],_[1]-d[1])+Math.PI,await new Promise(E=>{let N=()=>{let I=Math.min(1,(performance.now()-M)/T);i.position.set(d[0]+(_[0]-d[0])*I,Math.abs(Math.sin(I*b*6))*.03,d[1]+(_[1]-d[1])*I),I<1?requestAnimationFrame(N):E()};N()}),d=_}this.scene.remove(i);let p=n,f=this.geo.inner[0]/2-.255,v=new ge(new We(.38,.24,.5),new Pe({color:16096779,emissive:8014336,emissiveIntensity:.35}));v.position.set(-f,p+1.5+.13,-.55),v.userData.part="batch:"+e,this.picks.push(v),this.scene.add(v);let m=document.createElement("div");m.className="lbl3d heat",m.textContent=`NEW \xB7 ${e}`;let y=new Mi(m);y.position.set(-f,p+1.9,-.55),this.scene.add(y),this.newCrate?.forEach(g=>this.scene.remove(g)),this.newCrate=[v,y],this.forceDoor=!1,this.busy=!1,this.controls.enabled=!0,this.lastInput=performance.now()}sensorsVisible(e){this.dots.forEach(t=>t.visible=e&&t.userData.scene!=="inside")}insideSensors(e){this.dots.forEach(t=>{t.userData.scene!=="outside"&&(t.visible=e||t.userData.scene==="both"),e&&t.userData.scene==="outside"&&(t.visible=!1)})}async exit(){this.busy||(this.busy=!0,this.controls.enabled=!1,this.controls.minDistance=3,this.controls.maxDistance=30,this.controls.enablePan=!0,this.camera.fov=45,this.camera.updateProjectionMatrix(),await this.tweenCamera(new w(4.6,2.7,6),new w(0,1.3,0),2.5),this.inside=!1,this.forceDoor=!1,this.insideSensors(!1),this.setDimsVisible(this.dimsOn!==!1),this.sensorsVisible(!0),this.controls.enabled=!0,this.busy=!1,this.lastInput=performance.now(),this.onInside?.(!1))}pointer(){let e=new ka,t=new ie,n=this.renderer.domElement,i=a=>{let o=n.getBoundingClientRect();t.set((a.clientX-o.left)/o.width*2-1,-((a.clientY-o.top)/o.height)*2+1),e.setFromCamera(t,this.camera);let l=e.intersectObjects(this.picks,!1)[0];return l&&(l.object.userData.sensor||l.object.userData.part)?l.object:null};n.addEventListener("pointermove",a=>{this.lastInput=performance.now();let o=i(a);if(this.hoverObj&&this.hoverObj!==o&&this.hoverObj.userData.sensor&&this.hoverObj.scale.setScalar(1),this.hoverObj=o,n.style.cursor=o?"pointer":"grab",!o)return xn();o.userData.sensor?(o.scale.setScalar(1.6),Ri(us(o.userData.sensor),a.clientX,a.clientY)):Ri(ds(o.userData.part),a.clientX,a.clientY)}),n.addEventListener("pointerleave",xn);let s=null;n.addEventListener("pointerdown",a=>s=[a.clientX,a.clientY]),n.addEventListener("pointerup",a=>{if(!s||Math.hypot(a.clientX-s[0],a.clientY-s[1])>5)return;let o=i(a);o&&(xn(),o.userData.sensor?Ci(o.userData.sensor):an(o.userData.part))})}update(e,t){this.state=e,this.mode=t;let n=e.values;this.pvLabel.element.textContent=`PV ${n.P_pv.toFixed(2)} kW`,this.pvMat.emissiveIntensity=Math.min(.5,n.P_pv/3),this.curtain.visible=!!n.curtain;let i=Math.max(0,Math.min(1,n.pcm_pct/100));this.pcmMat.color.setRGB(.86-.25*i,.88-.09*i,.9+.06*i),this.pcmMat.opacity=.5+.45*i,this.sky(e,t)}sky(e,t){let n=e.sun.elevation_deg,i=e.sun.azimuth_deg,s=n<-2?"night":e.day_class==="rainy"?"monsoon":"day",a=Math.max(n,3)*ur,o=i*ur,l=new w(Math.cos(a)*Math.sin(o),Math.sin(a),-Math.cos(a)*Math.cos(o));this.sun.position.copy(l.multiplyScalar(30));let c=s==="night",h=s==="monsoon",u=!c&&n<12,d=c?727088:h?9279391:u?15775626:10472430;this.scene.background=new Te(d),this.scene.fog.color.set(d),this.scene.fog.near=h?12:25,this.scene.fog.far=h?55:90,this.sun.intensity=c?.05:h?.6:u?1.2:2.4,this.hemi.intensity=c?.4:.9,this.lamp.intensity=c?9:0,this.renderer.toneMappingExposure=c?.8:1}setLow(e){this.low=e,this.renderer.setPixelRatio(e?1:Math.min(devicePixelRatio,1.75)),this.renderer.shadowMap.enabled=!e,this.scene.traverse(t=>{t.material&&(t.material.needsUpdate=!0)}),this.resize()}setDimsVisible(e){this.dimGroup.traverse(t=>t.visible=e)}showDims(e){this.dimsOn=e,!this.inside&&!this.busy&&this.setDimsVisible(e)}setActive(e){this.active=e,e&&this.resize()}resize(){let e=this.host.clientWidth||innerWidth,t=this.host.clientHeight||innerHeight;this.camera.aspect=e/t,this.camera.updateProjectionMatrix(),this.renderer.setSize(e,t),this.labels.setSize(e,t)}frame(){if(!this.active)return;let e=Math.min(.1,this.clock.getDelta()),t=this.state?.values;if(t){let i=(this.forceDoor?95:t.door_angle||0)*ur;this.doorAngle+=(i-this.doorAngle)*Math.min(1,e*3),this.doorPivot.rotation.y=-this.doorAngle,this.fan.rotation.x+=e*(t.comp_speed_pct/100)*25,this.evapFan.rotation.z+=e*(.25+t.comp_speed_pct/100)*18,this.cups.rotation.y+=e*(t.wind||0)*2.2}let n=1+.25*Math.sin(performance.now()/300);for(let i of this.dots)i.userData.halo.scale.setScalar(.22*n);this.stepAirflow(e,this.doorAngle>.5),this.inLight.intensity=this.doorAngle>.2||this.inside?9:0,this.inFill.intensity=this.inside?.45:0,this.tween&&this.tween(),this.controls.autoRotate=!this.inside&&!this.busy&&performance.now()-this.lastInput>8e3,this.controls.update(),this.fps?.(this.renderer.info.render),this.renderer.render(this.scene,this.camera),this.labels.render(this.scene,this.camera)}}});var Md=new Uint32Array([1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298]);function Tc(r){let e=new TextEncoder().encode(r),t=e.length,n=t*8,i=t+9+63>>6<<6,s=new Uint8Array(i);s.set(e),s[t]=128;let a=new DataView(s.buffer);a.setUint32(i-4,n>>>0),a.setUint32(i-8,Math.floor(n/2**32));let o=new Uint32Array([1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225]),l=new Uint32Array(64),c=(h,u)=>h>>>u|h<<32-u;for(let h=0;h<i;h+=64){for(let _=0;_<16;_++)l[_]=a.getUint32(h+_*4);for(let _=16;_<64;_++){let b=c(l[_-15],7)^c(l[_-15],18)^l[_-15]>>>3,T=c(l[_-2],17)^c(l[_-2],19)^l[_-2]>>>10;l[_]=l[_-16]+b+l[_-7]+T>>>0}let[u,d,p,f,v,m,y,g]=o;for(let _=0;_<64;_++){let b=c(v,6)^c(v,11)^c(v,25),T=v&m^~v&y,M=g+b+T+Md[_]+l[_]>>>0,E=c(u,2)^c(u,13)^c(u,22),N=u&d^u&p^d&p,I=E+N>>>0;g=y,y=m,m=v,v=f+M>>>0,f=p,p=d,d=u,u=M+I>>>0}o[0]+=u,o[1]+=d,o[2]+=p,o[3]+=f,o[4]+=v,o[5]+=m,o[6]+=y,o[7]+=g}return[...o].map(h=>h.toString(16).padStart(8,"0")).join("")}var to="0".repeat(64),Sd=["T_min","T_avg","T_max","RH_avg","door_min","pcm_pct"];function wd(r){let e=Sd.map(t=>`${t}=${Number(r.summary[t]).toFixed(2)}`).join(";");return[r.index,r.timestamp,r.batch_ids.join(","),e,r.flag,r.prev_hash].join("|")}var rs=r=>Tc(wd(r));function Ac(r){return r.map((e,t)=>({index:e.index,ownOk:rs(e)===e.hash,linkOk:t===0?!0:e.prev_hash===r[t-1].hash}))}var Je=window.STATIC_DATA,De=Je.cols,xf=Je.n,Zt=Je.dt,ro="coldtrust-static-v1",mr=Je.windows;function fr(r){for(let[t,,n]of mr)if(r>=t&&r<t+n*Zt)return r;let e=mr.find(([t])=>t>r);return e?e[0]:mr[0][0]}function zn(r){r=fr(r);for(let[e,t,n]of mr)if(r>=e&&r<e+n*Zt)return t+Math.floor((r-e)/Zt);return 0}function ss(r){return mr.find(([,e,t])=>r>=e&&r<e+t)}var Rc=r=>{let[e,t]=ss(r);return e+(r-t)*Zt};function so(r,e){let[,t]=ss(r),n=Math.max(t,r-e),i=[];for(let s=n;s<=r;s++)i.push(s);return i}var kn=r=>String(r).padStart(2,"0");function as(r,e=!0){let t=new Date(Date.UTC(2025,0,1)+r*1e3);return`${t.getUTCFullYear()}-${kn(t.getUTCMonth()+1)}-${kn(t.getUTCDate())} ${kn(t.getUTCHours())}:${kn(t.getUTCMinutes())}`+(e?`:${kn(t.getUTCSeconds())}`:"")}var Ed=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function Cc(r){let e=new Date(Date.UTC(2025,0,1)+r*1e3);return`${kn(e.getUTCDate())} ${Ed[e.getUTCMonth()]} ${kn(e.getUTCHours())}:${kn(e.getUTCMinutes())}`}var xe=null;function ao(){try{xe=JSON.parse(localStorage.getItem(ro))}catch{xe=null}xe||(xe={blocks:[],batches:{},seq:0,lastHour:null,fault:null,orig:{}})}function Ti(){try{localStorage.setItem(ro,JSON.stringify(xe))}catch{}}ao();var no=Je.design.physics_check.threshold_K,Pc=Je.design.physics_check.persist_minutes*60,io=r=>xe.fault&&r>=xe.fault.since?xe.fault.offset:0;function Lc(r,e,t,n){xe.seq+=1;let i=as(r,!1),s=`CT-${i.slice(2,4)}${i.slice(5,7)}${i.slice(8,10)}-${String(xe.seq).padStart(3,"0")}`,a={id:s,farmer:(e||"Farmer").trim().slice(0,40),crop:t,crop_label:Je.crops[t].label,weight_kg:+n,entry_t:r,entry_time:i};return xe.batches[s]=a,Ti(),a}function Td(r,e,t,n){let i=xe.blocks.length?xe.blocks[xe.blocks.length-1].hash:to,s=o=>Math.round(o*100)/100,a={index:xe.blocks.length,timestamp:r,batch_ids:[...e].sort(),flag:n,prev_hash:i,summary:Object.fromEntries(Object.entries(t).map(([o,l])=>[o,s(l)]))};a.hash=rs(a),xe.blocks.push(a)}function Ad(r){let e=zn(r*3600),t=3600/Zt,n=[],i=[];for(let c=0;c<t;c++){let h=r*3600+c*Zt;n.push(De.T_room[e+c]+io(h)),i.push(io(h))}let s=0;for(let c=0;c<t;c++)s+=De.door_s[e+c];let a=i.some(c=>Math.abs(c)>no),o=xe.fault&&(r+1)*3600-xe.fault.since>=Pc,l=Object.values(xe.batches).filter(c=>c.entry_t<(r+1)*3600).map(c=>c.id);Td(as(r*3600,!1),l,{T_min:Math.min(...n),T_avg:n.reduce((c,h)=>c+h,0)/t,T_max:Math.max(...n),RH_avg:Je.design.setpoint.rh_room_pct,door_min:s/60,pcm_pct:De.pcm_pct[e+t-1]},a&&o?"Sensor suspicious \u2013 check":"OK")}function Ic(r){r=fr(r);let e=Math.floor(r/3600);if(xe.lastHour===null){[["grapes",5,"Ramu (Anakapalle)",120],["leafy_greens",2,"Lakshmi (Sabbavaram)",60],["milk",1,"Dairy co-op Pendurthi",80]].forEach(([s,a,o,l])=>Lc(r-a*86400,o,s,l)),xe.lastHour=e-24;let[i]=ss(zn(r));xe.lastHour=Math.max(xe.lastHour,Math.ceil(i/3600))}if(e<xe.lastHour){xe.lastHour=e,Ti();return}let t=xe.lastHour,[n]=ss(zn(r));t=Math.max(t,Math.ceil(n/3600),e-24);for(let i=t;i<e;i++)Ad(i);e!==xe.lastHour&&(xe.lastHour=e,Ti())}function oo(){let r=null,e=[];return xe.blocks.forEach((t,n)=>{let i=rs(t)===t.hash,s=t.prev_hash===(n?xe.blocks[n-1].hash:to),a=r!==null?"untrusted":i?s?"ok":"link broken":"data changed";a!=="ok"&&r===null&&(r=n),e.push(a)}),{valid:r===null,first_bad:r,status:e}}function Dc(r,e,t){let n=0,i=0,s=0,a=r.chill_injury_below_C,o=r.freeze_below_C??null;for(let u of e)n+=1/r.SL_ref_days*r.Q10**((u-r.T_ref_C)/10)*t/24,a!=null&&u<a&&(i+=t*60),o!==null&&u<o&&(s+=t*60);n=Math.min(1,n);let l=e[e.length-1],c=1/r.SL_ref_days*r.Q10**((l-r.T_ref_C)/10),h=[];return a!=null&&i>=60&&h.push(`Chilling injury risk: ${(i/60).toFixed(1)} h below ${a} C (safe range for ${r.label} is ${r.T_opt_low_C}-${r.T_opt_high_C} C).`),o!==null&&s>0&&h.push(`Freezing risk: ${s.toFixed(0)} min below ${o} C.`),{fraction_used:n,freshness_score:Math.round(1e3*(1-n))/10,remaining_days_at_ref:r.SL_ref_days*(1-n),remaining_days_at_current_T:(1-n)/c,T_ref_C:r.T_ref_C,T_now_C:l,chill_minutes:i,freeze_minutes:s,warnings:h}}function Rd(r,e){r=fr(r),Ic(r);let t=zn(r),n=e===null?Je.design.door.curtain_installed:e,i=n?"on":"off",s=De.door_s[t],a=r-Rc(t),o=s>0&&a<s,l=De[`heat_if_open_${i}`][t],c=io(r),h=xe.fault&&r>=xe.fault.since?r-xe.fault.since:0,u=Math.abs(c)>no&&h>=Pc,d={};for(let f of Je.state_fields)d[f]=De[f][t];Object.assign(d,{RH_room:Je.design.setpoint.rh_room_pct,T_batch:Number.isNaN(De.T_batch[t])||De.T_batch[t]===null?null:De.T_batch[t],grid_on:!!De.grid_on[t],backup_h:De.backup_h[t],door_open:o,door_angle:o?90:0,door_s_this_5min:s,heat_if_open_kW:l,heat_now_kW:o?l:0,heat_sensible_now_kW:o?l*(1-De.lat_frac[t]):0,heat_latent_now_kW:o?l*De.lat_frac[t]:0,v_door_if_open:De[`v_if_open_${i}`][t],v_door_top:o?De[`v_if_open_${i}`][t]:0,v_door_mid:0,v_door_bot:o?De[`v_if_open_${i}`][t]:0,last_open_kJ:l*De.last_open_s[t],last_open_wall_minutes:l*De.last_open_s[t]/Math.max(De.Q_wall[t],1e-6)/60,curtain:n,E:n?Je.design.door.curtain_effectiveness_E:0,gas_ppm:null,T_room_sensor:De.T_room[t]+c,physics_residual_K:c,sensor_suspicious:u,fault_active:!!xe.fault,physics_status:u?"Sensor suspicious \u2013 check":Math.abs(c)>no?"Disagrees with physics \u2013 watching":"OK \u2013 matches physics"});let p=oo();return{t:r,time:as(r),clock:Cc(r),label:Je.label,source:"SIMULATED",sun:{elevation_deg:De.sun_elev[t],azimuth_deg:De.sun_az[t]},day_class:Je.day_classes[De.day[t]],day_poa_kWh_m2:De.day_poa[t],values:d,ledger:{length:xe.blocks.length,valid:p.valid,batches:Object.keys(xe.batches).length},compare:{normal:{T_room:De.T_room[t],pcm_pct:De.pcm_pct[t],grid_on:!!De.grid_on[t],grid_h_so_far:De.grid_h_n[t]},smart:{T_room:De.s_T_room[t],pcm_pct:De.s_pcm_pct[t],grid_on:!!De.s_grid_on[t],grid_h_so_far:De.grid_h_s[t]},year:Je.compare_year}}}function Cd(r){let e=zn(r),t=Math.round(De.T_out[e]*4)/4,n={...Je.cycles[String(Math.min(Je.cycle_T[1],Math.max(Je.cycle_T[0],t)).toFixed(2))]},i=Math.max(.3,De.Q_coil_air[e]+De.Q_coil_pcm[e]);["Q_evap_kW","m_dot_kg_s","m_dot_g_s","P_shaft_kW","P_elec_kW","Q_cond_kW"].forEach(a=>n[a]*=i);let s=[[n.h1,n.P_evap_bar],[n.h2,n.P_cond_bar],[n.h3,n.P_cond_bar],[n.h4,n.P_evap_bar],[n.h1,n.P_evap_bar]];return{cycle:n,points:s,dome:Je.dome,design:Je.cycle_design}}function Pd(r,e,t){let n=zn(e),i=Je.crops[r],a=so(n,Math.round(t*86400/Zt)).map(c=>De.T_room[c]),o=Dc(i,a,Zt/3600),l=i.chill_injury_below_C;return{crop:r,label:i.label,days_stored:t,source:i.source,T_opt:[i.T_opt_low_C,i.T_opt_high_C],chill_below_C:l,SL_ref_days:i.SL_ref_days,T_ref_C:i.T_ref_C,Q10:i.Q10,assess:o,history_T:a.filter((c,h)=>h%12===0),chill_now:l!=null&&a[a.length-1]<l?`Room ${a[a.length-1].toFixed(1)} C is below the chilling-injury limit of ${l} C for ${i.label}.`:null}}function Ld(r,e){let t=xe.batches[r];if(!t)return null;e=fr(e>=0?e:(xe.lastHour||0)*3600);let n=Je.crops[t.crop],i=Math.max(1/24,(e-t.entry_t)/86400),s=so(zn(e),Math.round(i*86400/Zt)),a=s.map(l=>De.T_room[l]),o=Math.max(1,Math.floor(a.length/120));return{batch:t,crop:{label:n.label,T_opt:[n.T_opt_low_C,n.T_opt_high_C],SL_ref_days:n.SL_ref_days,T_ref_C:n.T_ref_C,Q10:n.Q10,source:n.source},days_stored:i,assess:Dc(n,a,Zt/3600),history_T:a.filter((l,c)=>c%o===0),blocks:xe.blocks.filter(l=>l.batch_ids.includes(r)),chain_valid:oo().valid,now:as(e,!1)}}function Id(r,e,t){let n=so(zn(e),Math.round(t*3600/Zt)).filter((s,a)=>a%3===0),i=De[r]||(r==="T_room_sensor"?De.T_room:null);return i?{quantity:r,t:n.map(s=>Cc(Rc(s)).slice(-5)),v:n.map(s=>i[s])}:{quantity:r,t:[],v:[]}}async function Dd(r){let[e,t]=r.split("?"),n=new URLSearchParams(t||""),i=(s,a=0)=>n.has(s)?+n.get(s):a;if(Je.files[e])return JSON.parse(JSON.stringify(Je.files[e]));if(e==="api/state")return Rd(i("t"),n.has("curtain")&&n.get("curtain")!=="-1"?n.get("curtain")==="1":null);if(e==="api/series")return Id(n.get("q"),i("t"),i("hours",24));if(e==="api/cycle")return Cd(i("t"));if(e==="api/crop")return Pd(n.get("key"),i("t"),i("days",2));if(e==="api/batches")return Object.values(xe.batches);if(e.startsWith("api/batch/")){let s=Ld(decodeURIComponent(e.slice(10)),i("t",-1));if(!s)throw new Error("batch not found");return s}if(e==="api/ledger"){let s=oo(),a=i("last",40),o=Math.max(0,xe.blocks.length-a);return{blocks:xe.blocks.slice(o),status:s.status.slice(o),valid:s.valid,first_bad:s.first_bad,length:xe.blocks.length,note:Je.ledger_note}}if(e==="api/health")return{ok:!0,static:!0};throw new Error(`static backup has no data for ${e}`)}async function Nd(r,e={}){if(ao(),r==="api/batch")return Ic(+e.t),Lc(+e.t,e.farmer,e.crop,e.weight_kg);if(r==="api/ledger/tamper"){let t=xe.blocks.length;if(t<3)return{error:"ledger too short"};let n=Math.max(0,t-7),i=xe.blocks[n];xe.orig[n]||(xe.orig[n]=JSON.parse(JSON.stringify(i)));let s=i.summary.T_max;return i.summary.T_max=Math.round((s-3)*100)/100,Ti(),{index:n,field:"T_max",old:s,new:i.summary.T_max,explain:`Block ${n}'s T_max was changed from ${s} to ${i.summary.T_max} \xB0C. Its hash no longer matches the copy stored in block ${n+1}, so block ${n} and every block after it are untrusted.`}}if(r==="api/ledger/reset")return Object.entries(xe.orig).forEach(([t,n])=>xe.blocks[t]=n),xe.orig={},Ti(),{ok:!0};if(r==="api/fault")return xe.fault=e.clear?null:{offset:+(e.offset||3),since:+e.t},Ti(),{fault:xe.fault};throw new Error(`static backup cannot handle ${r}`)}function Ud(){try{localStorage.removeItem(ro)}catch{}ao()}window.STATIC_API={get:Dd,post:Nd,clamp:fr,resetAll:Ud};Hn();ii();yr();ii();yr();var Hd=[255,122,61],Gd=[80,170,255],ps=class{constructor(e,t){this.spec=t,this.p=[],this.acc=0,this.heat=0,this.speed=.3,this.on=!1,this.low=!1,this.canvas=document.createElement("canvas"),this.canvas.className="airflow",e.appendChild(this.canvas),this.label=document.createElement("div"),this.label.className="flowlbl",this.label.style.left=`${(t.x0+t.x1)/2}%`,this.label.style.top=`${t.label_y}%`,e.appendChild(this.label),this.neutral=document.createElement("div"),this.neutral.className="neutral",this.neutral.style.cssText=`left:${t.x0-1}%;width:${t.x1-t.x0+2}%;top:${(t.y0+t.y1)/2}%`,this.neutral.innerHTML="<span>neutral line \xB7 \u0394p = 0</span>",e.appendChild(this.neutral)}set(e,t){this.heat=e.heat_if_open_kW,this.speed=.35+1.4*e.v_door_if_open;let n=e.heat_if_open_kW*(e.heat_latent_now_kW&&e.heat_now_kW?e.heat_latent_now_kW/e.heat_now_kW:.58);this.label.innerHTML=`Heat entering now (door open): <b>${e.heat_if_open_kW.toFixed(1)} kW</b> <span class="tag C">C</span><span class="per">this opening lasted <b>${e.last_open_s.toFixed(0)} s</b> \u2192 energy per opening <b>${e.last_open_kJ.toFixed(0)} kJ</b> (= ${e.last_open_wall_minutes.toFixed(0)} min of wall heat)</span><small>strip curtain ${t?"ON \u2013 cuts it by 85 %":"OFF"} \xB7 big kW, but only for seconds \xB7 warm air in at the top, cold air out at the bottom</small>`}resize(){let e=this.canvas.parentElement.getBoundingClientRect(),t=Math.min(devicePixelRatio||1,this.low?1:1.5);this.canvas.width=e.width*t/(this.scaleHint||1),this.canvas.height=e.height*t/(this.scaleHint||1),this.W=this.canvas.width,this.H=this.canvas.height}spawn(e){let t=e?.04+Math.random()*.42:.56+Math.random()*.4,n=this.spec.view==="outside"?!e:e;this.p.push({warm:e,u:Math.random(),v:t,d:n?0:1,dir:n?1:-1,jit:Math.random()*Math.PI*2,life:0})}step(e){if(!this.on){this.p.length&&(this.p.length=0);return}this.W||this.resize();let t=Math.min(this.low?160:360,9*this.heat);for(this.acc+=t*e;this.acc>=1;)this.acc-=1,this.spawn(Math.random()<.5);let n=this.spec,i=this.W,s=this.H,a=this.canvas.getContext("2d");a.clearRect(0,0,i,s);let o=n.x0/100*i,l=n.x1/100*i,c=n.y0/100*s,h=n.y1/100*s,u=(o+l)/2,d=l-o,p=h-c,f=n.view==="inside",v=[];for(let m of this.p){if(m.d+=m.dir*this.speed*e,m.life+=e,m.d<-.02||m.d>1.02)continue;v.push(m);let y=Math.max(0,Math.min(1,m.d)),g=u+(m.u-.5)*d*(1+1.3*y)+Math.sin(m.life*3+m.jit)*3*y,_=c+m.v*p;m.warm?_-=y*p*(f?.18:.06):_+=y*p*(f?.06:.14)+y*y*p*.05;let b=(2+6*y)*(i/1400),T=Math.min(1,m.life*3)*(m.dir>0?1-y*.75:.25+y*.75)*.75,M=m.warm?Hd:Gd;a.fillStyle=`rgba(${M[0]},${M[1]},${M[2]},${T})`,a.beginPath(),a.arc(g,_,b,0,Math.PI*2),a.fill()}this.p=v}show(e){this.on=e,this.canvas.style.display=this.label.style.display=this.neutral.style.display=e?"":"none",e&&this.resize()}};var ms=class{constructor(e,t,n,i){this.root=e,this.manifest=t,this.scenes=n,this.hot=i,this.story=n.story.filter(o=>t.A[o]),this.idx=0,this.mode="day",this.layers={},this.low=!1,this.flows={},this.caption=document.getElementById("caption"),this.dots=document.getElementById("storyDots"),this.build(),addEventListener("resize",()=>this.layout()),e.addEventListener("mousemove",o=>this.parallax(o)),e.addEventListener("wheel",o=>this.onWheel(o),{passive:!0}),document.getElementById("prevScene").onclick=()=>this.go(this.idx-1,!0),document.getElementById("nextScene").onclick=()=>this.go(this.idx+1,!0),this.enterBtn=document.createElement("button"),this.enterBtn.className="enterbtn",this.enterBtn.textContent="Enter the cold room \u25B8",this.enterBtn.onclick=()=>this.enter(),e.parentElement.appendChild(this.enterBtn),this.layout(),this.show();let s=performance.now(),a=o=>{let l=Math.min(.1,(o-s)/1e3);s=o;let c=this.flows[this.current()];c&&this.root.parentElement.classList.contains("on")&&c.step(l),requestAnimationFrame(a)};requestAnimationFrame(a)}enter(){let e=(this.scenes.enter_sequence||[]).filter(i=>this.story.includes(i));clearTimeout(this.enterTimer);let t=0,n=()=>{t>=e.length||(this.go(this.story.indexOf(e[t++])),this.enterTimer=setTimeout(n,t===1?2200:5200))};n()}build(){let e=new Set([...this.story,...Object.values(this.scenes.modes)].filter(t=>this.manifest.A[t]));for(let t of e){let n=this.manifest.A[t],i=document.createElement("div");i.className="scene",i.dataset.name=t,i.innerHTML=`<div class="kb"><img alt="${t}" src="${n.src}" loading="${t===this.story[0]?"eager":"lazy"}"><div class="hots"></div></div>`,i.aspect=n.w/n.h;let s=i.querySelector(".hots");(this.hot[t]||[]).forEach(h=>{let u=document.createElement("button");u.className="hot"+(h.part?" part":""),u.style.left=`${h.x}%`,u.style.top=`${h.y}%`,u.setAttribute("aria-label",h.label||h.sensor||h.part);let d=()=>h.sensor?us(h.sensor):ds(h.part);u.onmouseenter=p=>Ri(d(),p.clientX,p.clientY),u.onmousemove=p=>Ri(d(),p.clientX,p.clientY),u.onmouseleave=xn,u.onclick=()=>{xn(),h.sensor?Ci(h.sensor):an(h.part)},u.dataset.sensor=h.sensor||"",s.appendChild(u)});let a=i.querySelector(".kb"),o=this.scenes.pcm_panels?.[t];if(o){i.pcm=o.map(([f,v,m,y])=>{let g=document.createElement("div");return g.className="pcmtint",g.style.cssText=`left:${f}%;top:${v}%;width:${m-f}%;height:${y-v}%`,a.insertBefore(g,a.querySelector(".hots")),g});let h=document.createElement("div");h.className="pcmlbl";let[u,d,p]=o[0];h.style.left=`${Math.min(80,Math.max(20,(u+p)/2))}%`,h.style.top=`${Math.max(8,d)}%`,a.insertBefore(h,a.querySelector(".hots")),i.pcmLabel=h}(this.scenes.fins?.[t]||[]).forEach(([h,u,d,p])=>{let f=document.createElement("div");f.className="finpack",f.style.cssText=`left:${h}%;top:${u}%;width:${d-h}%;height:${p-u}%`,a.insertBefore(f,a.querySelector(".hots"))}),(this.scenes.drip_trays?.[t]||[]).forEach(([h,u,d,p])=>{let f=document.createElement("div");f.className="driptray",f.style.cssText=`left:${h}%;top:${u}%;width:${d-h}%;height:${p-u}%`,a.insertBefore(f,a.querySelector(".hots"))});let l=this.scenes.fans?.[t];if(l){let h=document.createElement("div");h.className="fanglow",h.style.cssText=`left:${l.x}%;top:${l.y}%;width:${2*l.r}%;aspect-ratio:1`,a.insertBefore(h,a.querySelector(".hots")),i.fan=h}let c=this.scenes.doorways?.[t];c&&(this.flows[t]=new ps(i.querySelector(".kb"),c)),this.root.appendChild(i),this.layers[t]=i}this.dots.innerHTML=this.story.map((t,n)=>`<i data-i="${n}"></i>`).join(""),this.dots.onclick=t=>{t.target.dataset.i&&this.go(+t.target.dataset.i,!0)}}layout(){let e=this.root.clientWidth,t=this.root.clientHeight;for(let n of Object.values(this.layers)){let i=n.aspect,s=e,a=e/i;a<t&&(a=t,s=t*i),s*=1.04,a*=1.04,n.style.width=`${s}px`,n.style.height=`${a}px`,n.style.marginLeft=`${-s/2}px`,n.style.marginTop=`${-a/2}px`}Object.values(this.flows).forEach(n=>n.resize())}parallax(e){if(this.low)return;let t=(e.clientX/innerWidth-.5)*-14,n=(e.clientY/innerHeight-.5)*-10;for(let i of Object.values(this.layers))i.style.transform=`translate(${t}px, ${n}px)`}onWheel(e){let t=performance.now();t-(this.lastWheel||0)<900||Math.abs(e.deltaY)<20||(this.lastWheel=t,this.go(this.idx+(e.deltaY>0?1:-1),!0))}go(e,t=!1){t&&clearTimeout(this.enterTimer),this.idx=Math.max(0,Math.min(this.story.length-1,e)),this.show()}goByName(e){let t=this.story.indexOf(e);t>=0&&this.go(t,!0)}addBatchSpot(e,[t,n],i){let s=this.layers.A8_interior_wide;if(!s)return;let a=s.querySelector(".hots");if(a.querySelectorAll('.newtag,.crate-cut,.hot[aria-label^="batch:"]').forEach(c=>c.remove()),i){let c=document.createElement("img");c.className="crate-cut",c.src=i,c.style.left=`${t}%`,c.style.top=`${n}%`,c.style.width="15%",a.appendChild(c)}let o=document.createElement("button");o.className="hot part",o.style.left=`${t}%`,o.style.top=`${n-6}%`,o.setAttribute("aria-label","batch:"+e),o.onclick=()=>document.dispatchEvent(new CustomEvent("openbatch",{detail:e}));let l=document.createElement("div");l.className="newtag",l.style.left=`${t}%`,l.style.top=`${n-14}%`,l.textContent=`NEW \xB7 ${e}`,a.append(o,l)}setMode(e){e!==this.mode&&(this.mode=e,this.show())}setLow(e){this.low=e;for(let[t,n]of Object.entries(this.layers)){let i=this.manifest.A[t];n.querySelector("img").src=e?i.small:i.src,e&&(n.style.transform="")}Object.values(this.flows).forEach(t=>{t.low=e,t.resize()})}current(){let e=this.story[this.idx];if(e===this.scenes.modes.day&&this.mode!=="day"){let t=this.scenes.modes[this.mode];t&&this.manifest.A[t]&&(e=t)}return e}show(){let e=this.current();for(let[i,s]of Object.entries(this.layers))s.classList.toggle("on",i===e);[...this.dots.children].forEach((i,s)=>i.classList.toggle("on",s===this.idx));let t=this.scenes.mode_captions?.[e]||this.scenes.story_captions[this.story[this.idx]]||"";this.caption.textContent=t,this.caption.style.display=t?"":"none",this.caption.classList.toggle("right",(this.scenes.caption_right||[]).includes(e));for(let[i,s]of Object.entries(this.flows))s.show(i===e);let n=e===this.story[0]||e===this.scenes.modes.night||e===this.scenes.modes.monsoon||e==="A3_exterior_side_condenser"||e==="A2_front";this.enterBtn.style.display=n?"":"none"}update(e){let t=e.values;Object.values(this.flows).forEach(i=>i.set(t,t.curtain));let n=Math.max(0,Math.min(1,t.pcm_pct/100));for(let i of Object.values(this.layers))if(i.pcm&&(i.pcm.forEach(s=>s.style.backgroundColor=`rgba(70,150,255,${(.03+.27*n).toFixed(3)})`),i.pcmLabel.innerHTML=`Wax battery <b>${t.pcm_pct.toFixed(0)} % frozen</b> \xB7 backup <b>${t.backup_h===null?"\u221E":t.backup_h.toFixed(1)+" h"}</b> <span class="tag C">C</span>`),i.fan){let s=Math.max(0,Math.min(1,t.comp_speed_pct/100));i.fan.style.opacity=(.15+.85*s).toFixed(2),i.fan.style.animationDuration=s>.02?`${(1.6-1.3*s).toFixed(2)}s`:"0s",i.fan.style.animationPlayState=s>.02?"running":"paused",i.fan.title=`Compressor ${t.comp_speed_pct.toFixed(0)} %`}this.root.querySelectorAll('.hot[data-sensor="door_switch"]').forEach(i=>i.classList.toggle("warn",!!t.door_open))}};Hn();var wt=r=>document.getElementById(r),$c=r=>`${r.slice(0,6)}\u2026${r.slice(-4)}`,fs=class{constructor(e,t){this.clock=e,this.feed=t,this.seen=new Set,this.msg="",wt("ledgerBtn").onclick=()=>this.isOpen()?this.close():this.open(),wt("ledgerClose").onclick=()=>this.close(),wt("tamperBtn").onclick=async()=>{let n=await yn("api/ledger/tamper");this.msg=n.explain?`\u2717 ${n.explain}`:"Ledger too short \u2013 let the clock run a few hours.",this.refresh(!0)},wt("resetBtn").onclick=async()=>{await yn("api/ledger/reset"),this.msg="Tamper undone \u2013 every hash matches again.",this.refresh(!0)},wt("faultBtn").onclick=async()=>{let n=wt("faultBtn").dataset.on==="1";await yn("api/fault",n?{clear:!0}:{t:this.clock.t,offset:3}),this.msg=n?"Sensor fault cleared.":"Room sensor now reads 3 \xB0C too high. The twin predicts the real value; after 15 simulated minutes the reading is flagged \u201CSensor suspicious \u2013 check\u201D, and the flag is sealed in the next block.",this.feed.poll(),this.refresh(!0)},setInterval(()=>this.isOpen()&&this.refresh(),1500),t.on(n=>this.badge(n))}isOpen(){return wt("ledgerDrawer").classList.contains("on")}open(e){e&&(this.msg=e),wt("ledgerDrawer").classList.add("on"),this.refresh(!0)}close(){wt("ledgerDrawer").classList.remove("on")}badge(e){let t=wt("ledgerBadge");t.className="lb "+(e.ledger.valid?"ok":"bad"),t.textContent=e.ledger.valid?`\u2713 ${e.ledger.length}`:"\u2717";let n=e.values.fault_active;wt("faultBtn").dataset.on=n?"1":"0",wt("faultBtn").textContent=n?"Clear sensor fault":"Inject sensor fault (+3 \xB0C)"}async refresh(e=!1){let t=await rt("api/ledger?last=14"),n=Ac(t.blocks),i=wt("ledgerStatus");i.className=t.valid?"ok":"bad",i.textContent=t.valid?`\u2713 all ${t.length} blocks verified (server and this browser agree)`:`\u2717 chain broken at block ${t.first_bad}`;let s=wt("ledgerExplain");s.textContent=this.msg,s.className="explain"+(this.msg.startsWith("\u2717")?" bad":"");let a=[];t.blocks.forEach((c,h)=>{let u=t.status[h],d=u!=="ok",p=n[h],f=!this.seen.has(c.hash);this.seen.add(c.hash),h&&a.push(`<div class="link ${d?"bad":""}" title="prev_hash = hash of the block before">${d?"\u2717":"\u2192"}</div>`),a.push(`<div class="blk ${d?"bad":""} ${c.flag!=="OK"?"flag":""} ${f&&!e?"newb":""}">
        <h4>#${c.index} \xB7 ${c.timestamp.slice(5)}</h4>
        <div>T ${c.summary.T_min.toFixed(1)} / <b>${c.summary.T_avg.toFixed(1)}</b> / ${c.summary.T_max.toFixed(1)} \xB0C</div>
        <div>door ${c.summary.door_min.toFixed(1)} min \xB7 wax ${c.summary.pcm_pct.toFixed(0)} %</div>
        <div class="ids">${c.batch_ids.length?c.batch_ids.join(" "):"\u2014"}</div>
        <div>${c.flag==="OK"?"physics check OK":"\u26A0 "+c.flag}</div>
        <div class="h">prev ${$c(c.prev_hash)}</div><div class="h">hash ${$c(c.hash)}</div>
        <div class="st ${d?"bad":"ok"}">${u==="ok"?"\u2713 verified":"\u2717 "+u}${p&&!p.ownOk?" (hash \u2260 data)":""}</div></div>`)});let o=wt("chain"),l=o.scrollLeft+o.clientWidth>=o.scrollWidth-30;o.innerHTML=a.join(""),(l||e)&&(o.scrollLeft=o.scrollWidth)}};Hn();uo();var Lt=r=>document.getElementById(r),Vd=`<svg viewBox="0 0 60 120" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="30" cy="116" rx="18" ry="3.5" fill="rgba(0,0,0,.25)"/>
  <circle cx="30" cy="14" r="9" fill="#6b4a32"/><path d="M21 12 q9 -10 18 0" fill="#222"/>
  <path d="M19 28 q11 -6 22 0 l3 42 h-28z" fill="#e9e2d2" stroke="#b9ae98"/>
  <path d="M21 70 l-2 42 h9 l3 -36 l3 36 h9 l-2 -42z" fill="#3b3f46"/>
  <rect x="9" y="40" width="42" height="22" rx="2" fill="#4f8f47" stroke="#2f5f2a"/>
  <path d="M11 44 h38 M11 50 h38 M11 56 h38" stroke="#2f5f2a" stroke-width="1.2"/>
  <ellipse cx="30" cy="40" rx="18" ry="5" fill="#3f9a3a"/>
</svg>`,Wd=[50,86],gs=class{constructor({cfg:e,manifest:t,photo:n,getModel:i,clock:s,feed:a,ledgerUI:o}){Object.assign(this,{cfg:e,manifest:t,photo:n,getModel:i,clock:s,feed:a,ledgerUI:o});let l=Lt("cropSel");Object.entries(e.crops).forEach(([u,d])=>l.insertAdjacentHTML("beforeend",`<option value="${u}">${d.label} (best ${d.T_opt[0]}\u2013${d.T_opt[1]} \xB0C)</option>`)),l.value="pomegranate",Lt("newBatchBtn").onclick=()=>Lt("batchModal").classList.add("on"),Lt("batchCancel").onclick=()=>Lt("batchModal").classList.remove("on"),Lt("batchForm").onsubmit=u=>{u.preventDefault(),this.create(new FormData(u.target))},Lt("cardModal").onclick=u=>{u.target.id==="cardModal"&&Lt("cardModal").classList.remove("on")},document.addEventListener("openbatch",u=>this.showCard(u.detail));let c=this.cut=u=>u&&t.B?.[u]?.src||null,h=n.scenes.cutouts||{};this.side=c(h.worker_side),this.back=c(h.worker_back),this.cropImg=u=>c(h.crops?.[u])||c(h.crops?.default),this.workerHTML=this.side?`<img src="${this.side}" alt="worker" style="transform:scaleX(-1)">`:Vd}buyerURL(e){if(location.protocol==="file:")return`buyer.html?b=${encodeURIComponent(e)}`;let t=location.hostname;return`http://${t==="localhost"||t==="127.0.0.1"?`${this.cfg.lan_ip}:${location.port||8e3}`:location.host}/buyer.html?b=${encodeURIComponent(e)}`}async create(e){Lt("batchModal").classList.remove("on");let t=Object.fromEntries(e.entries());t.t=this.clock.t;let n=await yn("api/batch",t);this.feed.poll(),(document.body.classList.contains("model")?"model":"photo")==="model"?await this.getModel()?.walkIn(n.id):await this.walkPhoto(n),this.showCard(n.id,!0),this.ledgerUI.open(`New batch ${n.id} is in the room. It will be sealed in the next hourly block (watch a new block appear on the right).`)}async walkPhoto(e){let t=this.photo,n=f=>new Promise(v=>setTimeout(v,f));t.goByName("A2_front"),await n(1500);let s=t.layers.A2_front.getBoundingClientRect(),a=Lt("walker");a.innerHTML=this.workerHTML,a.classList.add("on");let o=s.height*.46,l=o*(this.side?507/900:.5);a.style.width=`${l}px`,a.style.height=`${o}px`;let c=s.left+s.width*.1,h=s.left+s.width*.44,u=s.top+s.height*.88,d=(f,v,m,y=1,g=!1)=>new Promise(_=>{let b=performance.now(),T=M=>{let E=Math.min(1,(M-b)/m),N=1+(y-1)*E,I=f+(v-f)*E,B=Math.abs(Math.sin(E*Math.PI*m/380))*o*.018;a.style.width=`${l*N}px`,a.style.height=`${o*N}px`,a.style.left=`${I-l*N/2}px`,a.style.top=`${u-o*N-B-(1-N)*o*.35}px`,a.style.opacity=g?1-E:1,E<1?requestAnimationFrame(T):_()};requestAnimationFrame(T)});await d(c,h,2600),this.back&&(a.innerHTML=`<img src="${this.back}" alt="worker from behind">`);let p=s.left+s.width*.496;await d(h,p,600),await d(p,p,900,.82,!0),a.classList.remove("on"),t.goByName("A6_door_worker"),await n(3500),t.goByName("A8_interior_wide"),t.addBatchSpot(e.id,Wd,this.cropImg(e.crop)),await n(1600)}async showCard(e,t=!1){let n=await rt(`api/batch/${encodeURIComponent(e)}?t=${this.clock.t.toFixed(0)}`),i=n.batch,s=n.assess,a=this.buyerURL(e),o=s.freshness_score,l=o>70?"#22c55e":o>40?"#f59e0b":"#ef4444";Lt("cardBody").innerHTML=`
      <div class="bc"><div>
        <div class="note">${t?"New batch created":"Batch card"}</div>
        ${this.cropImg(i.crop)?`<img class="cropimg" src="${this.cropImg(i.crop)}" alt="${i.crop_label}">`:""}
        <div class="id">${i.id}</div>
        <div class="kv" style="display:grid;grid-template-columns:1fr auto;gap:4px 10px;margin-top:8px;font-size:14px">
          <span>Farmer</span><b>${i.farmer}</b><span>Crop</span><b>${i.crop_label}</b>
          <span>Weight</span><b>${i.weight_kg} kg</b><span>Entered (sim. time)</span><b>${i.entry_time}</b>
          <span>Remaining shelf life</span><b>${s.remaining_days_at_ref.toFixed(1)} days at ${n.crop.T_ref_C} \xB0C</b>
          <span>Freshness</span><b style="color:${l}">${o.toFixed(0)} / 100</b>
          <span>Ledger blocks for this batch</span><b>${n.blocks.length}</b>
          <span>Record</span><b style="color:${n.chain_valid?"#15803d":"#b91c1c"}">${n.chain_valid?"verified \u2713":"changed \u2717"}</b></div>
        ${s.warnings.map(h=>`<div class="warnbox">\u26A0 ${h}</div>`).join("")}
        <canvas id="cardHist" style="width:100%;height:100px"></canvas>
      </div><div>
        <div id="qr"></div><div class="url">${a}</div>
        <div class="note">${location.protocol==="file:"?"Static backup (no server): the buyer page opens on this laptop only \u2013 phones need the Python version.":"Buyers scan this on a phone connected to the laptop's Wi-Fi hotspot."}</div>
        <a href="buyer.html?b=${encodeURIComponent(e)}" target="_blank">Open buyer page \u25B8</a>
      </div></div>
      <div class="row"><button class="ghost" onclick="document.getElementById('cardModal').classList.remove('on')">Close</button></div>`;let c=qrcode(0,"M");c.addData(a),c.make(),Lt("qr").innerHTML=c.createSvgTag({cellSize:4,margin:2,scalable:!0}),Lt("cardModal").classList.add("on"),gr(Lt("cardHist"),{x:["entry","now"],series:[{y:n.history_T,color:"#2a78d6",label:"room T since entry"}],unit:"\xB0C",band:[2,8]})}};Hn();ii();var je=r=>document.getElementById(r),$d=[["final_00_design_journey","Design journey: plain \u2192 baffle + fans \u2192 fins"],["final_01_fins_hottest_night","Hottest night: plain vs finned panels"],["final_02_fin_calculation","Fin calculation: depth, gap, UA"],["final_07_fin_panel_drawing","Finned panel + drip tray (drawing)"],["final_03_loading_options","When should the 150 kg come in?"],["final_04_wax_115_vs_172","115 kg vs 172 kg wax"],["final_05_monthly_energy_2026","Monthly energy 2026"],["final_06_money_co2","Money and CO\u2082 saved"],["final_08_payback","Payback estimate (prices GUESS)"]],jd=[["11_heatmap_wax_solar","Wax \xD7 solar: grid backup hours per year"],["14_current_vs_recommended","Current vs recommended design"],["05_power_cut_night","Power-cut night: with vs without wax"],["12_curtain_vs_none","Strip curtain vs no curtain"],["13_forecast_vs_normal","Normal vs forecast charging"],["02_day_counts","Sunny / cloudy / rainy days 2025"],["04_pcm_battery_heatmap","Wax battery % by hour and month"],["10_monthly_energy","Monthly solar vs cooling energy"],["01_weather_monthly","Vizag sunlight 2025 vs long-term"],["09_r290_ph_diagram","R290 cycle on the P\u2013h diagram"],["08_load_breakdown","Design-point heat load"],["07_pcm_melt_front","Wax slab melt front (FTCS)"]],_s=class{constructor({cfg:e,sensors:t,feed:n}){Object.assign(this,{cfg:e,sensors:t,feed:n}),this.tab="calc",je("ccBtn").onclick=()=>this.open(),je("ccClose").onclick=()=>this.close(),je("ccTabs").onclick=i=>{let s=i.target.closest("button");s&&this.show(s.dataset.tab)},n.on(i=>{this.isOpen()&&(this.tab==="rooms"||this.tab==="sensors"||this.tab==="calc")&&this.live(i)})}isOpen(){return je("cc").classList.contains("on")}open(e){je("cc").classList.add("on"),this.show(e||this.tab)}close(){je("cc").classList.remove("on")}async show(e){this.tab=e,[...je("ccTabs").children].forEach(n=>n.classList.toggle("on",n.dataset.tab===e));let t=je("ccBody");e==="calc"&&(t.innerHTML=await this.calc()),e==="whatif"&&(t.innerHTML=await this.whatifHTML(),this.whatifWire()),e==="rooms"&&(t.innerHTML=this.roomsHTML()),e==="year"&&(t.innerHTML=this.yearHTML()),e==="sensors"&&(t.innerHTML=this.sensorsHTML()),this.feed.state&&this.live(this.feed.state)}async calc(){this.dp=this.dp||await rt("results/design_point.json");let e=`<p class="lead">Every formula with the numbers put in, at the design point (35 \xB0C, 65 % RH outside, room 5 \xB0C).
      All values are calculated by the engine (tag ${Me("C")}); design inputs are tag ${Me("E")}.</p>
      <h3>Heat entering the room, by source</h3><div id="bySource"></div><h3>Formulas</h3><table class="calc">`,t=null;for(let n of this.dp)n.value!==n.value||n.value===null||(n.group!==t&&(t=n.group,e+=`<tr class="grp"><td colspan="3">${t}</td></tr>`),e+=`<tr><td>${n.name}</td><td><code>${n.formula}</code>${n.substituted?`<br><code class="sub">= ${n.substituted}</code>`:""}</td>
        <td class="num">${Number(n.value).toPrecision(4)} ${n.unit}</td></tr>`);return e+"</table>"}bySource(e){let t=this.cfg.year_summary,n=e.values,i=[["Walls (U\xB7A\xB7\u0394T)",n.Q_wall,t.load_wall_kWh],["Door \u2013 sensible",n.Q_door-n.Q_door*(t.load_door_latent_kWh/t.load_door_kWh),t.load_door_kWh-t.load_door_latent_kWh],["Door \u2013 latent (moisture)",n.Q_door*(t.load_door_latent_kWh/t.load_door_kWh),t.load_door_latent_kWh],["Produce pull-down",n.Q_batch,t.load_product_kWh],["Respiration",n.Q_resp,t.load_resp_kWh],["Evaporator fan, lights, controller",n.Q_int,t.load_internal_kWh]],s=i.reduce((a,o)=>a+o[2],0);return`<table class="calc"><tr class="grp"><td>Source</td><td class="num">Now (kW) ${Me("C")}</td><td class="num">2026 so far (kWh)</td><td class="num">Share of year</td></tr>
      ${i.map(a=>`<tr><td>${a[0]}</td><td class="num">${a[1].toFixed(3)}</td><td class="num">${a[2].toFixed(0)}</td>
      <td class="num"><span class="sharebar"><i style="width:${(100*a[2]/s).toFixed(1)}%"></i></span>${(100*a[2]/s).toFixed(0)} %</td></tr>`).join("")}
      <tr class="grp"><td>Total</td><td class="num">${n.Q_total.toFixed(3)}</td><td class="num">${s.toFixed(0)}</td><td></td></tr></table>
      <p class="small">"Now" = this 5-minute step of the simulated 2026 (door load averaged over the 5 minutes). Year = final design, 1 Jan 2026 to today.</p>`}async whatifHTML(){this.wi=this.wi||await rt("results/whatif.json");let e=this.wi.grid,t=this.cfg.crops,n=(i,s,a,o,l)=>`<label class="sl"><span>${s}: <b id="${i}V"></b> ${l}</span>
      <input type="range" id="${i}" min="0" max="${a.length-1}" step="1" value="${Math.max(0,a.indexOf(o))}"></label>`;return`<p class="lead">Move a slider \u2013 the result comes from the engine (every slider position was calculated with the same formulas as the twin).</p>
      <div class="wi"><div class="wiIn">
        ${n("wT","Outside temperature",e.T_out,35,"\xB0C")}${n("wRH","Outside humidity",e.RH_out,65,"%")}
        ${n("wDoor","Door openings per hour",e.door_per_h,4,`(${this.wi.seconds_per_opening} s each)`)}
        ${n("wPcm","Wax (PCM) mass",e.pcm_kg,this.cfg.design.pcm.mass_kg,"kg")}
        <label class="chk2"><input type="checkbox" id="wCur" checked> Strip curtain</label>
        <label class="chk2"><input type="checkbox" id="wCloud"> Cloudy day</label>
        <label class="sl"><span>Crop</span><select id="wCrop">${Object.entries(t).map(([i,s])=>`<option value="${i}" ${i==="pomegranate"?"selected":""}>${s.label}</option>`).join("")}</select></label>
      </div><div class="wiOut" id="wiOut"></div></div><p class="small">${this.wi.note}</p>`}whatifWire(){["wT","wRH","wDoor","wPcm","wCur","wCloud","wCrop"].forEach(e=>je(e).oninput=()=>this.whatif()),this.whatif()}whatif(){let e=this.wi.grid,t=this.wi.fields,n=e.T_out[je("wT").value],i=e.RH_out[je("wRH").value],s=e.door_per_h[je("wDoor").value],a=e.pcm_kg[je("wPcm").value];je("wTV").textContent=n,je("wRHV").textContent=i,je("wDoorV").textContent=s,je("wPcmV").textContent=a;let o=`${n.toFixed(1)}|${i}|${s}|${je("wCur").checked?1:0}|${a}|${je("wCloud").checked?1:0}`,l=Object.fromEntries(t.map((m,y)=>[m,this.wi.rows[o][y]])),c=this.cfg.crops[je("wCrop").value],h=m=>1/c.SL_ref_days*c.Q10**((m-c.T_ref_C)/10),u=1/h(this.cfg.design.setpoint.target_C),d=1/h(l.T_room_night_C),p=c.chill_injury_below_C!==null&&this.cfg.design.setpoint.target_C<c.chill_injury_below_C,f=l.load_pulldown_kW>this.wi.Qmax_kW,v=(m,y,g="",_="")=>`<div class="out ${_}"><span>${m}</span><b>${y}</b><small>${g}</small></div>`;je("wiOut").innerHTML=v("Total heat load (with new batch)",ve(l.load_pulldown_kW,"kW"),f?`more than the ${this.wi.Qmax_kW} kW compressor \u2013 the wax covers the gap`:`holding load ${ve(l.load_holding_kW,"kW")}`,f?"warn":"")+v("\u2026of which door",ve(l.door_kW,"kW"),`latent (moisture) ${ve(l.door_latent_kW,"kW")}`)+v("Compressor electricity",ve(l.comp_kW,"kW"),`COP ${l.cop.toFixed(2)} (T_cond = ${n+10} \xB0C)`)+v("Wax battery after a 12 h night",`${l.pcm_after_night_pct.toFixed(0)} %`,`started full: ${l.pcm_kWh.toFixed(1)} kWh of cold`,l.pcm_after_night_pct<15?"bad":"")+v("Backup time (no sun, no grid)",`${l.backup_h.toFixed(1)} h`,`room stays near ${l.T_room_night_C.toFixed(1)} \xB0C on wax only`,l.T_room_night_C>8?"bad":"")+v(`Solar covers the day (${je("wCloud").checked?"cloudy":"sunny"})`,`${l.solar_cover_pct.toFixed(0)} %`,`${l.solar_day_kWh.toFixed(1)} kWh solar vs ${l.need_day_kWh.toFixed(1)} kWh needed`,l.solar_cover_pct<100?"warn":"")+v(`Shelf life \u2013 ${c.label}`,`${u.toFixed(0)} days`,`at 5 \xB0C; ${d.toFixed(0)} days if the room sits at ${l.T_room_night_C.toFixed(1)} \xB0C`+(p?" \xB7 \u26A0 5 \xB0C is below this crop\u2019s chilling limit":""),p?"warn":"")}roomsHTML(){return`<p class="lead">The <b>same room, same 2026 weather, same 150 kg loading</b> \u2013 left with PLAIN wax panels,
      right with FINNED wax panels (final design). Plain panels have too little surface: at night the wax cannot take the room's heat fast enough
      and the grid must help. The fins multiply the surface by 4.3 \u2013 no fan, no battery for cooling, nothing that moves.</p>
      <div class="rooms"><div class="room" id="rmN"></div><div class="room smart" id="rmS"></div></div><div id="rmY"></div>`}roomCard(e,t,n){let i=Math.max(0,Math.min(100,t.pcm_pct));return`<h3>${e}</h3><div class="rbig">${t.T_room.toFixed(1)} \xB0C</div>
      <div class="tank"><i style="height:${i}%"></i><span>${i.toFixed(0)} %<br>wax</span></div>
      <div class="kv2"><span>Power now</span><b class="${t.grid_on?"g":"s"}">${t.grid_on?"GRID (ATS)":"solar / wax"}</b>
      <span>Grid hours so far in 2026</span><b>${t.grid_h_so_far.toFixed(0)} h</b></div><p class="small">${n}</p>`}yearHTML(){let e=([t,n])=>`<figure><a href="figures/${t}.png" target="_blank"><img loading="lazy" src="figures/${t}.png" alt="${n}"></a><figcaption>${n}</figcaption></figure>`;return`<p class="lead"><b>Final design on real 2026 weather</b> (simulated, conservative sun). Click a graph to enlarge.</p>
      <div class="figs">${$d.map(e).join("")}</div>
      <p class="lead">How we chose the size (NASA POWER 2025 study, Phase 2):</p><div class="figs">
      ${jd.map(([t,n])=>`<figure><a href="figures/${t}.png" target="_blank"><img loading="lazy" src="figures/${t}.png" alt="${n}"></a><figcaption>${n}</figcaption></figure>`).join("")}</div>`}sensorsHTML(){return`<p class="lead">Every sensor: type, range, accuracy, location and protocol. Tag M = measured, C = calculated from a formula.</p>
      <table class="calc sens"><tr class="grp"><td>Sensor</td><td>Type</td><td>Range</td><td>Accuracy</td><td>Location</td><td>Protocol</td><td class="num">Now</td></tr>
      ${this.sensors.sensors.map(e=>`<tr><td>${e.name} ${Me(e.tag)}</td><td>${e.type}</td><td>${e.range}</td><td>${e.accuracy}</td><td>${e.location}</td><td>${e.protocol}</td><td class="num" data-q="${e.quantity}" data-u="${e.unit}"></td></tr>`).join("")}</table>`}live(e){if(this.tab==="calc"&&je("bySource")&&(je("bySource").innerHTML=this.bySource(e)),this.tab==="rooms"&&je("rmN")){let t=e.compare;je("rmN").innerHTML=this.roomCard("Plain wax panels",t.normal,"Flat panel face, natural convection only."),je("rmS").innerHTML=this.roomCard("Finned wax panels (final design)",t.smart,"40 mm aluminium fins, 23 mm gap: cooled air falls between the fins by itself."),je("rmY").innerHTML=`<div class="kv2 wide"><span>Whole year: grid backup hours</span><b>${t.year.normal_grid_h.toFixed(0)} h \u2192 ${t.year.smart_grid_h.toFixed(0)} h</b>
        <span>Days fully on solar + wax</span><b>${t.year.normal_days_pct.toFixed(1)} % \u2192 ${t.year.smart_days_pct.toFixed(1)} %</b></div>
        <p class="small">${e.clock} \xB7 ${e.label}. Final design: 115 kg wax with fins, 1.8 kWp, 150 kg produce loaded at 6 am.</p>`}this.tab==="sensors"&&document.querySelectorAll("#ccBody td[data-q]").forEach(t=>{let n=e.values[t.dataset.q];t.textContent=n==null?"\u2014":typeof n=="boolean"?n?"YES":"no":ve(n,t.dataset.u)})}};Hn();yr();ii();var yt=r=>document.getElementById(r),Xd=r=>new Promise(e=>setTimeout(e,r)),vs=class{constructor(e){this.app=e,this.i=-1,this.paused=!1,this.running=!1,this.timer=null;let{photo:t,clock:n,feed:i,demo:s,ledgerUI:a,control:o,batches:l}=e,c=m=>Math.floor(s.find(y=>y.why.startsWith(m)).t/86400)*86400,h=c("Hottest"),u=c("Dullest"),d=m=>{yt("curtain").checked=m,i.curtain=m,i.poll()},p=()=>i.state?.values||{},f=()=>{bn(),a.close(),o.close(),yt("cardModal").classList.remove("on")},v=e.cfg.year_summary;this.steps=[{s:9,cap:()=>"This is our solar\u2013PCM cold room for farmers near Visakhapatnam, rated for <b>150 kg</b> of fresh produce. It runs on a digital twin with the <b>real 2026 weather</b> of Vizag.",go:()=>{f(),this.app.toPhoto(),n.jump(h+5*3600),n.speed=720,t.goByName("A1_outside")}},{s:9,cap:()=>`Every glowing dot is a sensor. Outside air now: <b>${p().T_out?.toFixed(1)} \xB0C</b>, ${p().RH_out?.toFixed(0)} % humidity \u2013 this is the hottest day of 2026.`,go:()=>{t.goByName("A2_front"),Ci("t_out")}},{s:9,cap:()=>`The 1.8 kWp solar canopy faces south at 17\xB0. Right now it gives <b>${p().P_pv?.toFixed(2)} kW</b> to the R290 (propane) compressor. No battery for cooling \u2013 the wax is the storage.`,go:()=>{bn(),t.goByName("A3_exterior_side_condenser"),an("solar")}},{s:9,cap:()=>`Opening the door lets warm air in at the top and cold air out at the bottom. <b>Without the strip curtain: ${p().heat_if_open_kW?.toFixed(1)} kW</b> pours in\u2026`,go:()=>{bn(),d(!1),t.goByName("A6_door_worker")}},{s:7,cap:()=>`\u2026with the curtain only <b>${p().heat_if_open_kW?.toFixed(1)} kW</b> \u2013 and only for ${p().last_open_s?.toFixed(0)} seconds per opening.`,go:()=>d(!0)},{s:13,cap:()=>"At 6 am the farmer brings the day's 150 kg. The batch gets an ID and a QR code, and is <b>sealed into a hash-chain ledger</b> every hour.",go:async()=>{await l.create(new Map([["farmer","Demo farmer (tour)"],["crop","pomegranate"],["weight_kg","150"]]))}},{s:9,cap:()=>`Inside it is <b>${p().T_room?.toFixed(1)} \xB0C</b>. The blue wax (PCM) panels are the cold battery: <b>${p().pcm_pct?.toFixed(0)} % frozen</b>, enough for <b>${p().backup_h?.toFixed(0)} hours</b> without sun.`,go:()=>{yt("cardModal").classList.remove("on"),a.close(),t.goByName("A8_interior_wide"),an("pcm")}},{s:11,cap:()=>`Night: the compressor sleeps. <b>Aluminium fins</b> on the wax panels give <b>4.3 \xD7 more surface</b>; cooled air falls between them by itself \u2013 <b>no fan, 0 W</b>. Now ${p().G_wax_W_K?.toFixed(0)} W/K, room <b>${p().T_room?.toFixed(1)} \xB0C</b>. A drip tray catches the condensate.`,go:()=>{bn(),n.jump(h+22*3600),t.goByName("A9_interior_pcm_wall"),an("fins")}},{s:8,cap:()=>`By day the evaporator runs on R290 at \u22125 \xB0C. COP <b>${p().cop?.toFixed(2)}</b>, calculated with CoolProp from the outside temperature.`,go:()=>{bn(),n.jump(h+13*3600+86400),t.goByName("A10_interior_evaporator"),an("evaporator")}},{s:8,cap:()=>"Each crate knows its <b>remaining shelf life in days</b>, from the real temperature history of this room (Q10 model).",go:()=>{bn(),t.goByName("A8_interior_wide"),an("crate_greens")}},{s:11,cap:()=>"A dull monsoon night. The same room with <b>plain</b> and with <b>finned</b> wax panels: plain panels need the grid every night; with fins the wax alone holds 2\u20138 \xB0C.",go:()=>{bn(),n.jump(u+21*3600),t.goByName("A1_outside"),o.open("rooms")}},{s:12,cap:()=>`2026 so far: <b>${v.days_full_solar_pcm} of ${v.days} days fully on solar + wax</b>, ${v.grid_hours.toFixed(0)} grid hours. Room air above 8 \xB0C only while a fresh warm batch cools (${v.hot_load_h_per_day.toFixed(1)} h/day); all other times 0 h outside 2\u20138 \xB0C.`,go:()=>o.open("year")},{s:11,cap:()=>"Can someone cheat? We change one old temperature reading\u2026 <b>the chain turns red from that block onward</b>, and the buyer's QR page shows \u201CRecord changed \u2717\u201D.",go:async()=>{o.close(),a.open(),await Xd(1500);let m=await yn("api/ledger/tamper");a.msg=`\u2717 ${m.explain}`,a.refresh(!0)}},{s:7,cap:()=>"Thank you! Scan any batch QR code, open \u201C\u{1F4C5} Live 2026\u201D for today and tomorrow, or ask us to move a What-If slider.",go:async()=>{await yn("api/ledger/reset"),a.close(),t.goByName("A1_outside"),n.jump(h+11*3600)}}],yt("tourBtn").onclick=()=>this.running?this.stop():this.start(),yt("tourPrev").onclick=()=>this.goto(this.i-1),yt("tourNext").onclick=()=>this.goto(this.i+1),yt("tourPause").onclick=()=>this.pause(),yt("tourStop").onclick=()=>this.stop(),addEventListener("keydown",m=>{!this.running||["INPUT","SELECT","TEXTAREA"].includes(m.target.tagName)||(m.key==="ArrowRight"&&(m.stopImmediatePropagation(),this.goto(this.i+1)),m.key==="ArrowLeft"&&(m.stopImmediatePropagation(),this.goto(this.i-1)),m.key===" "&&(m.preventDefault(),this.pause()),m.key==="Escape"&&this.stop())},!0),i.on(()=>this.running&&this.render())}start(){this.running=!0,document.body.classList.add("touring"),yt("tourBtn").textContent="\u25A0 Stop tour",this.goto(0)}stop(){this.running=!1,clearTimeout(this.timer),document.body.classList.remove("touring"),yt("tourBtn").textContent="\u25B6 Start tour",yt("tourBar").classList.remove("on")}pause(){this.paused=!this.paused,yt("tourPause").textContent=this.paused?"\u25B6":"\u275A\u275A",this.paused?clearTimeout(this.timer):this.schedule()}async goto(e){if(e<0&&(e=0),e>=this.steps.length)return this.stop();clearTimeout(this.timer),this.i=e,this.t0=performance.now(),yt("tourBar").classList.add("on"),this.render();let t=this.steps[e];try{await t.go()}catch(n){console.warn("tour step",e,n)}this.render(),this.paused||this.schedule()}schedule(){clearTimeout(this.timer),this.timer=setTimeout(()=>this.goto(this.i+1),this.steps[this.i].s*1e3)}render(){if(this.i<0)return;yt("tourCap").innerHTML=this.steps[this.i].cap(),yt("tourStep").textContent=`${this.i+1} / ${this.steps.length}`;let e=this.steps.slice(0,this.i).reduce((n,i)=>n+i.s,0),t=this.steps.reduce((n,i)=>n+i.s,0);yt("tourProg").style.width=`${(100*e/t).toFixed(1)}%`}};var $e=r=>document.getElementById(r);async function mf(){let[r,e,t,n,i,s]=await Promise.all([rt("api/config"),rt("api/sensors"),rt("assets/manifest.json"),rt("assets/scenes.json"),rt("assets/hotspots.json"),rt("api/demo_days")]),a=new os(s[0].t,720),o=new ls(a);Gc(r,e,t,n,()=>o.state,()=>a.t);let l=r.year_summary||{};l.hot_load_h_per_day!==void 0&&($e("simnote").innerHTML+=` \xB7 Rated 150 kg. Room air above 8 \xB0C only while a fresh warm batch is cooling (no stored product inside): ${l.hot_load_h_per_day.toFixed(1)} h/day average. All other times: ${l.hot_other_h.toFixed(0)} h outside 2\u20138 \xB0C.`);let c=new ms($e("photoFrame"),t,n,i),h=null,u="photo",d="auto";async function p(){if(h)return h;let{Model3D:D}=await Promise.resolve().then(()=>(hd(),cd));return h=new D($e("three"),r,e,t),h.setLow($e("lowgfx").checked),h.showDims($e("dims").checked),o.state&&h.update(o.state,d),h.fps=P=>T=P,window.__model=h,h.onInside=P=>{$e("enter3d").textContent=P?"\u25C2 Back outside":"Enter the cold room \u25B8"},h}let f=new fs(a,o),v=new gs({cfg:r,manifest:t,photo:c,getModel:()=>h,clock:a,feed:o,ledgerUI:f}),m=new _s({cfg:r,sensors:e,feed:o}),y=()=>{u!=="photo"&&$e("viewSeg").querySelector("[data-view=photo]").click()};new vs({photo:c,clock:a,feed:o,demo:s,ledgerUI:f,control:m,batches:v,toPhoto:y,cfg:r});let g=D=>{document.body.classList.toggle("flat",D),$e("flat2d").checked=D;try{localStorage.setItem("ct2d",D?"1":"0")}catch{}D&&y()};$e("flat2d").onchange=D=>g(D.target.checked);let _=new URLSearchParams(location.search).get("2d")==="1";try{_=_||localStorage.getItem("ct2d")==="1"}catch{}$e("viewSeg").onclick=async D=>{let P=D.target.closest("button");P&&(u=P.dataset.view,[...$e("viewSeg").children].forEach(O=>O.classList.toggle("on",O===P)),$e("photoView").classList.toggle("on",u==="photo"),$e("modelView").classList.toggle("on",u==="model"),document.body.classList.toggle("model",u==="model"),xn(),u==="model"?(await p()).setActive(!0):h?.setActive(!1))},$e("modeSeg").onclick=D=>{let P=D.target.closest("button");if(!P)return;let O=Math.floor(a.t/86400)*86400,k=s.find(ee=>ee.why.startsWith("Dullest"));P.dataset.mode==="day"&&a.jump(O+11*3600),P.dataset.mode==="night"&&a.jump(O+22*3600),P.dataset.mode==="monsoon"&&k&&a.jump(Math.floor(k.t/86400)*86400+11*3600),o.poll(),b(P)};function b(D){[...$e("modeSeg").children].forEach(P=>P.classList.toggle("on",P===D)),setTimeout(()=>[...$e("modeSeg").children].forEach(P=>P.classList.toggle("on",P.dataset.mode==="auto")),1500)}$e("enter3d").onclick=async()=>{let D=await p();D.inside?D.exit():D.enter()};let T=null,M=0,E=performance.now();addEventListener("keydown",D=>{(D.key==="f"||D.key==="F")&&!["INPUT","SELECT","TEXTAREA"].includes(D.target.tagName)&&$e("fps").classList.toggle("on")});let N=D=>{if(M++,D-E>=1e3){if($e("fps").classList.contains("on")){let P=M*1e3/(D-E),O=`${P.toFixed(0)} fps  (${u==="model"?"3D model":"photo view"})`;O+=P>=30?"  OK":P>=20?"  try Low graphics":"  SLOW \u2013 use Low graphics",u==="model"&&T&&(O+=`
${T.calls} draw calls \xB7 ${(T.triangles/1e3).toFixed(0)}k triangles`),O+=`
screen ${innerWidth}\xD7${innerHeight} @${devicePixelRatio}x \xB7 low gfx ${$e("lowgfx").checked?"ON":"off"}`,$e("fps").textContent=O}M=0,E=D}requestAnimationFrame(N)};requestAnimationFrame(N),$e("curtain").onchange=D=>{o.curtain=D.target.checked,o.poll()},$e("dims").onchange=D=>h?.showDims(D.target.checked),$e("lowgfx").onchange=D=>{document.body.classList.toggle("lowgfx",D.target.checked),c.setLow(D.target.checked),h?.setLow(D.target.checked)},$e("play").onclick=()=>{a.playing=!a.playing,$e("play").textContent=a.playing?"\u275A\u275A":"\u25B6"},$e("speed").onchange=D=>a.speed=+D.target.value,s.forEach(D=>$e("jump").insertAdjacentHTML("beforeend",`<option value="${D.t}">${D.date}: ${D.why}</option>`)),$e("jump").onchange=D=>{D.target.value&&(a.jump(+D.target.value),o.poll()),D.target.value=""},addEventListener("keydown",D=>{u!=="photo"||D.target.tagName==="SELECT"||(D.key==="ArrowRight"&&c.go(c.idx+1,!0),D.key==="ArrowLeft"&&c.go(c.idx-1,!0))});function I(D){return D.sun.elevation_deg<-2?"night":D.day_class==="rainy"?"monsoon":"day"}o.on(D=>{Fc(D,r),c.update(D),c.setMode(I(D)),h?.update(D,d),Uc()}),o.start(),(_||window.STATIC_FORCE_2D)&&g(!0);let B=()=>{a.tick(),requestAnimationFrame(B)};B()}mf().catch(r=>{document.body.insertAdjacentHTML("beforeend",`<div style="position:fixed;inset:30% 20%;background:#fff;color:#000;padding:20px;border-radius:10px;z-index:99">
     <b>Could not start.</b> Is the server running? Start it with <code>python run.py</code>.<br><small>${r}</small></div>`),console.error(r)});})();
/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
