(() => {
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const NS="http://www.w3.org/2000/svg";
const el=(tag,attrs={},text)=>{const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;return n;};
const add=(svg,tag,attrs,text)=>svg.appendChild(el(tag,attrs,text));
function axes(svg,xLabel="Input x",yLabel="Target y"){
 svg.replaceChildren();
 for(let i=0;i<=5;i++){const x=50+i*94,y=300-i*52;add(svg,"line",{x1:x,y1:40,x2:x,y2:300,stroke:"#223348"});add(svg,"line",{x1:50,y1:y,x2:520,y2:y,stroke:"#223348"});}
 add(svg,"text",{x:265,y:337},xLabel);add(svg,"text",{x:50,y:23},yLabel);
}
const X=x=>50+470*x,Y=y=>300-260*y;
const point=(svg,x,y,color,r=4)=>add(svg,"circle",{cx:X(x),cy:Y(y),r,fill:color});
const set=(lab,key,value)=>{$$('[data-value="'+key+'"]',lab).forEach(n=>n.textContent=value);};
const number=(lab,name)=>Number($('[name="'+name+'"]',lab).value);
const track=lab=>$$('input[type="range"]',lab).forEach(input=>{const out=$('output[for="'+input.id+'"]',lab);if(out)out.textContent=Number(input.value).toFixed(input.step==='1'?0:2);});
const noisy=(i,scale=1)=>scale*(Math.sin(i*7.31)*.68+Math.cos(i*3.17)*.32);
function regression(lab){
 const svg=$("svg.plot",lab);const data=Array.from({length:18},(_,i)=>{const x=.06+i*.05;return[x,.16+.66*x+noisy(i,.07)];});
 function draw(){track(lab);const m=number(lab,"slope"),b=number(lab,"intercept");axes(svg);let mse=0,mae=0;
 data.forEach(([x,y])=>{const yp=m*x+b,e=y-yp;mse+=e*e;mae+=Math.abs(e);add(svg,"line",{x1:X(x),x2:X(x),y1:Y(y),y2:Y(Math.max(-.08,Math.min(1.08,yp))),stroke:"#ffcc7e",opacity:.65});point(svg,x,y,"#92baff");});
 const x0=Math.max(0,(-.08-b)/m),x1=Math.min(1,(1.08-b)/m);if(m>0&&x1>=x0)add(svg,"line",{x1:X(x0),y1:Y(m*x0+b),x2:X(x1),y2:Y(m*x1+b),stroke:"#a3f0c1","stroke-width":3});else if(m===0)add(svg,"line",{x1:X(0),y1:Y(b),x2:X(1),y2:Y(b),stroke:"#a3f0c1","stroke-width":3});
 set(lab,"mse",(mse/data.length).toFixed(4));set(lab,"mae",(mae/data.length).toFixed(4));set(lab,"equation","ŷ = "+m.toFixed(2)+"x + "+b.toFixed(2));
 }
 $("button[data-action=fit]",lab).addEventListener("click",()=>{const mx=data.reduce((s,p)=>s+p[0],0)/data.length,my=data.reduce((s,p)=>s+p[1],0)/data.length;const m=data.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0)/data.reduce((s,p)=>s+(p[0]-mx)**2,0);$('[name=slope]',lab).value=m;$('[name=intercept]',lab).value=my-m*mx;draw();});
 lab.addEventListener("input",draw);draw();
}
function solve(a,b){a=a.map((r,i)=>[...r,b[i]]);const n=b.length;for(let c=0;c<n;c++){let k=c;for(let j=c+1;j<n;j++)if(Math.abs(a[j][c])>Math.abs(a[k][c]))k=j;[a[c],a[k]]=[a[k],a[c]];const d=a[c][c]||1e-12;for(let j=c;j<=n;j++)a[c][j]/=d;for(let i=0;i<n;i++)if(i!==c){const q=a[i][c];for(let j=c;j<=n;j++)a[i][j]-=q*a[c][j];}}return a.map(r=>r[n]);}
function complexity(lab){
 const svg=$("svg.plot",lab),truth=x=>.48+.26*Math.sin(x*5.5);
 function draw(){track(lab);const degree=number(lab,"degree"),noise=number(lab,"noise");const split=$('[name=split]',lab);const n=split?Number(split.value):12;
 const train=Array.from({length:n},(_,i)=>{const x=.03+.94*i/(n-1);return[x,truth(x)+noisy(i,noise)];});
 const test=Array.from({length:31},(_,i)=>{const x=.015+.97*i/30;return[x,truth(x)+noisy(i+47,noise)];});
 const basis=x=>Array.from({length:degree+1},(_,k)=>(2*x-1)**k),A=Array.from({length:degree+1},()=>Array(degree+1).fill(0)),b=Array(degree+1).fill(0);
 train.forEach(([x,y])=>{const v=basis(x);v.forEach((u,i)=>{b[i]+=u*y;v.forEach((w,j)=>A[i][j]+=u*w);});});A.forEach((r,i)=>r[i]+=1e-9);
 const w=solve(A,b),predict=x=>basis(x).reduce((s,v,i)=>s+v*w[i],0);
 axes(svg);let d="";for(let i=0;i<=150;i++){const x=i/150,y=Math.max(-.09,Math.min(1.09,predict(x)));d+=(i?"L":"M")+X(x)+","+Y(y);}
 add(svg,"path",{d,fill:"none",stroke:"#a3f0c1","stroke-width":2.5});
 test.forEach(([x,y])=>add(svg,"circle",{cx:X(x),cy:Y(y),r:3,fill:"none",stroke:"#ffcc7e",opacity:.75}));train.forEach(([x,y])=>point(svg,x,y,"#92baff",4.5));
 const mse=a=>a.reduce((s,[x,y])=>s+(predict(x)-y)**2,0)/a.length;
 set(lab,"train",mse(train).toFixed(4));set(lab,"test",mse(test).toFixed(4));
 set(lab,"diagnosis",degree===1?"A straight line cannot capture the underlying curve. This is underfitting.":degree>=7?"A flexible curve can chase individual samples. Compare held-out error with training error.":"Compare both errors: a useful model captures the broad pattern without following every noisy observation.");
 }
 lab.addEventListener("input",draw);draw();
}
function classification(lab){
 const svg=$("svg.plot",lab);
 const data=Array.from({length:40},(_,i)=>{const p=.035+i*.93/39;return{p,y:((i*17+13)%41)/41<p?1:0};});
 function draw(){track(lab);const t=number(lab,"threshold");axes(svg,"Predicted probability of positive class","Actual class: upper = positive; lower = negative");
 const counts={tp:0,fp:0,tn:0,fn:0};add(svg,"rect",{x:X(t),y:40,width:470*(1-t),height:260,fill:"#a3f0c1",opacity:.055});
 data.forEach((p,i)=>{const pred=p.p>=t,y=p.y?.73+.10*Math.sin(i*2):.24+.10*Math.sin(i*2);counts[p.y?(pred?"tp":"fn"):(pred?"fp":"tn")]++;point(svg,p.p,y,p.y?"#a3f0c1":"#f7a0b5",5);});
 add(svg,"line",{x1:X(t),x2:X(t),y1:40,y2:300,stroke:"#ffcc7e","stroke-width":2,"stroke-dasharray":"5 4"});add(svg,"text",{x:60,y:320},"0");add(svg,"text",{x:505,y:320},"1");
 Object.entries(counts).forEach(([k,v])=>set(lab,k,v));const {tp,fp,fn,tn}=counts;
 set(lab,"precision",tp+fp?(tp/(tp+fp)).toFixed(2):"N/A");set(lab,"recall",tp+fn?(tp/(tp+fn)).toFixed(2):"N/A");set(lab,"accuracy",((tp+tn)/data.length).toFixed(2));
 }
 lab.addEventListener("input",draw);draw();
}
function network(lab){
 const svg=$("svg.plot",lab),sigmoid=x=>1/(1+Math.exp(-x));
 function draw(){track(lab);svg.replaceChildren();const x1=number(lab,"x1"),x2=number(lab,"x2"),gain=number(lab,"gain"),activation=$('[name=activation]',lab).value;
 const f=z=>activation==="relu"?Math.max(0,z):Math.tanh(z);
 const z=[1.2*x1-.8*x2+.2,-.7*x1+1.3*x2-.1,.9*x1+.6*x2-.4].map(v=>v*gain),h=z.map(f),score=.8*h[0]-1.1*h[1]+.7*h[2]-.2,p=sigmoid(score);
 const nodes=[[85,120,x1],[85,245,x2],[280,75,h[0]],[280,180,h[1]],[280,285,h[2]],[470,180,p]];
 const weights=[1.2,-.7,.9,-.8,1.3,.6];
 for(let i=0;i<2;i++)for(let j=0;j<3;j++)add(svg,"line",{x1:nodes[i][0],y1:nodes[i][1],x2:nodes[j+2][0],y2:nodes[j+2][1],stroke:weights[i*3+j]>0?"#a3f0c1":"#f7a0b5",opacity:.55,"stroke-width":Math.abs(weights[i*3+j])*2});
 [ .8,-1.1,.7].forEach((w,j)=>add(svg,"line",{x1:280,y1:nodes[j+2][1],x2:470,y2:180,stroke:w>0?"#a3f0c1":"#f7a0b5","stroke-width":Math.abs(w)*2,opacity:.6}));
 nodes.forEach(([x,y,v],i)=>{add(svg,"circle",{cx:x,cy:y,r:i===5?34:28,fill:"#182d3b",stroke:i===5?"#ffcc7e":"#92baff","stroke-width":2});add(svg,"text",{x,y:y+4,"text-anchor":"middle"},v.toFixed(2));});
 add(svg,"text",{x:85,y:330,"text-anchor":"middle"},"2 inputs");add(svg,"text",{x:280,y:330,"text-anchor":"middle"},"3 hidden units");add(svg,"text",{x:470,y:330,"text-anchor":"middle"},"1 probability");
 set(lab,"probability",p.toFixed(3));set(lab,"logit",score.toFixed(3));set(lab,"hidden",h.map(v=>v.toFixed(3)).join(", "));
 }
 lab.addEventListener("input",draw);lab.addEventListener("change",draw);
 $("button",lab).addEventListener("click",()=>{draw();svg.classList.remove("animate-once");void svg.getBoundingClientRect();svg.classList.add("animate-once");});
 draw();
}
function explorer(lab){
 const svg=$("svg.plot",lab);function draw(){const mode=$("select",lab).value;axes(svg);
 if(mode==="regression"){for(let i=0;i<24;i++){let x=.05+i*.039;point(svg,x,.15+.7*x+noisy(i,.09),"#92baff");}add(svg,"line",{x1:X(0),y1:Y(.15),x2:X(1),y2:Y(.85),stroke:"#a3f0c1","stroke-width":3});}
 else if(mode==="classification"){add(svg,"rect",{x:50,y:40,width:235,height:260,fill:"#a3f0c1",opacity:.06});add(svg,"line",{x1:285,x2:285,y1:40,y2:300,stroke:"#ffcc7e","stroke-dasharray":"6 5"});for(let i=0;i<36;i++){const x=.06+((i*13)%37)/42,y=.12+((i*17)%37)/48;point(svg,x,y,x+noisy(i,.1)<.5?"#a3f0c1":"#f7a0b5");}}
 else {[[.25,.3],[.73,.35],[.51,.77]].forEach(([cx,cy],j)=>{for(let i=0;i<12;i++)point(svg,cx+Math.sin(i*2.1)*.12,cy+Math.cos(i*3.1)*.12,["#a3f0c1","#92baff","#ffcc7e"][j]);});}
 const copy={regression:"Regression predicts a number. The line estimates a continuous target from an input; distances to points are prediction errors.",classification:"Classification predicts a category. A decision boundary partitions the input space; points near it may be uncertain.",clustering:"Clustering groups similar observations without target labels. These colors indicate discovered groups, not known answers."};
 set(lab,"explanation",copy[mode]);
 }$("select",lab).addEventListener("change",draw);draw();
}
const init={regression,complexity,classification,network,explorer};
$$("[data-lab]").forEach(lab=>{init[lab.dataset.lab]?.(lab);});
$$("[data-quiz]").forEach(quiz=>{const buttons=$$("button[data-correct]",quiz);buttons.forEach(button=>button.addEventListener("click",()=>{buttons.forEach(b=>b.setAttribute("aria-pressed",String(b===button)));$(".quiz-feedback",quiz).textContent=button.dataset.feedback; }));});
const motion=$("[data-motion]");if(motion){let paused=matchMedia("(prefers-reduced-motion: reduce)").matches;const apply=()=>{document.body.classList.toggle("paused",paused);motion.textContent=paused?"Motion paused":"Pause motion";motion.setAttribute("aria-pressed",String(paused));};motion.addEventListener("click",()=>{paused=!paused;apply();});apply();}
})();