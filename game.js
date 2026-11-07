(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const screens = ['homeScreen','setupScreen','passScreen','gameScreen','endScreen'];
let mode='quick', players=[], roles=[], alive=[], round=1, totalRounds=4, signal=65;
let logs=[], actions=[], votes=[], turnOrder=[], turnIndex=0, phase='setup';
let protectionTarget=null, voteResult=null, lastRoundSummary='', personalReports={}, scores=[];
const roleData = {
 commander:{name:'কমান্ডার',icon:'⌖',team:'crew',desc:'দলের সমন্বয় করুন। আপনার সিদ্ধান্ত সিগন্যালকে স্থিতিশীল রাখে।',goal:'শেষ পর্যন্ত অন্তত ৩ জন ক্রু সদস্যকে বাঁচিয়ে রাখুন।',action:'coordinate',actionLabel:'দলকে সমন্বয় করুন',actionDesc:'দলের মনোবল বাড়িয়ে সিগন্যাল ৫% উন্নত করুন।'},
 engineer:{name:'ইঞ্জিনিয়ার',icon:'ϟ',team:'crew',desc:'কন্ট্রোল রুমের পাওয়ার ও যোগাযোগ ব্যবস্থা আপনার দায়িত্ব।',goal:'সিগন্যাল ৮০% বা তার বেশি করুন।',action:'repair',actionLabel:'সিস্টেম মেরামত',actionDesc:'সিগন্যাল ১২% বাড়ান।'},
 analyst:{name:'বিশ্লেষক',icon:'⌘',team:'crew',desc:'তথ্য, লগ ও আচরণ বিশ্লেষণ করে সন্দেহভাজন খুঁজুন।',goal:'একজন সাবোটিয়ারকে সঠিকভাবে শনাক্ত করতে সাহায্য করুন।',action:'investigate',actionLabel:'গোপন তদন্ত',actionDesc:'একজন খেলোয়াড়ের পরিচয় সম্পর্কে ব্যক্তিগত সূত্র পান।',target:true},
 security:{name:'নিরাপত্তা কর্মকর্তা',icon:'⬡',team:'crew',desc:'অ্যাক্সেস লগ ও চলাচল পর্যবেক্ষণ করুন।',goal:'সঠিক ব্যক্তির বিরুদ্ধে ভোট দিন।',action:'scan',actionLabel:'অ্যাক্সেস লগ পরীক্ষা',actionDesc:'একজনের গতিবিধি সম্পর্কে নির্ভরযোগ্য রিপোর্ট পান।',target:true},
 medic:{name:'চিকিৎসক',icon:'✚',team:'crew',desc:'জরুরি অবস্থায় একজনকে সুরক্ষা দিতে পারবেন।',goal:'আপনার সুরক্ষা যেন একটি ভোটের লক্ষ্যকে বাঁচায়।',action:'protect',actionLabel:'একজনকে সুরক্ষা দিন',actionDesc:'এই রাউন্ডে আপনার নির্বাচিত ব্যক্তি ভোটে বাদ পড়বেন না।',target:true},
 saboteur:{name:'সাবোটিয়ার',icon:'☠',team:'enemy',desc:'তুমি এই সংকট তৈরি করেছ। সিস্টেম নষ্ট করো এবং সন্দেহ অন্যদিকে ঘুরিয়ে দাও।',goal:'সিগন্যাল শূন্য করো অথবা ক্রুদের সমান/বেশি সংখ্যায় টিকে থাকো।',action:'sabotage',actionLabel:'সিগন্যাল নষ্ট করুন',actionDesc:'সিগন্যাল ১৪% কমান।'},
 double:{name:'ডাবল এজেন্ট',icon:'◉',team:'solo',desc:'তুমি কারও পুরোপুরি বিশ্বস্ত নও। নিজের নিরাপত্তাই তোমার আসল লক্ষ্য।',goal:'শেষ রাউন্ড পর্যন্ত বেঁচে থাকুন।',action:'quiet',actionLabel:'গোপন সংকেত বদলান',actionDesc:'সিগন্যাল ৬% কমান, অথবা নীরবে ৪% মেরামত করুন।'}
};
const storyEvents=[
 ['বিদ্যুৎ বিভ্রাট','কন্ট্রোল রুমের অর্ধেক আলো নিভে গেছে। ব্যাকআপ জেনারেটর চালু না হলে সিগন্যাল দুর্বল হবে।',-4],
 ['অচেনা কল','একটি অজানা নম্বর থেকে কল এসেছে: “তোমাদের মধ্যে একজন দরজা খুলেছে।”',0],
 ['CCTV ফুটেজ','রাত ১:৫২-এর ফুটেজে একজনকে সার্ভার রুমে দেখা গেছে। কিন্তু মুখটি স্পষ্ট নয়।',0],
 ['দরজা লক','সার্ভার রুমের দরজা বাইরে থেকে বন্ধ। জরুরি বিদ্যুৎ সাশ্রয় করতে হবে।',-3],
 ['ব্যাকআপ সংযোগ','পুরোনো একটি ব্যাকআপ লাইন পাওয়া গেছে। সিগন্যাল কিছুটা স্থিতিশীল হয়েছে।',5]
];
const funEvents=[
 ['চা-স্টল বিপর্যয়','কেউ জরুরি কফির বদলে ৩ লিটার দুধ অর্ডার করেছে। সন্দেহজনক!',0],
 ['ভূতের ভয়েস নোট','একটি ভয়েস নোটে শোনা গেল: “ভাই, আমি কিন্তু কিছু করি নাই।”',-2],
 ['বিরিয়ানি ষড়যন্ত্র','সার্ভারের পাসওয়ার্ডের বদলে কেউ বিরিয়ানির রেসিপি লিখেছে।',0],
 ['বসের ফোন','বস জানতে চেয়েছেন কাজ কতদূর। সবাই একসাথে বলুন: “প্রায় শেষ!”',3],
 ['চার্জ ১%','একজনের ফোনে চার্জ ১%। সেটিও কি সাবোটাজ?',-3]
];
const storyBeats=[
 'ঢাকার কেন্দ্রীয় যোগাযোগ টাওয়ার থেকে শেষ সংকেত এসেছে: “আমাদের মধ্যে একজন দরজা খুলেছে।”',
 'কন্ট্রোল রুমের দরজা লক। বাইরে থেকে সাহায্য আসছে না। কাউকে বিশ্বাস করা যাচ্ছে না।',
 'পুরোনো সার্ভারে একটি মুছে ফেলা লগ পাওয়া গেছে। সময় শেষ হওয়ার আগে সত্য বের করতে হবে।',
 'শেষ ট্রান্সমিশন চালু করতে হলে সন্দেহভাজনকে শনাক্ত করতে হবে।'
];
function show(id){screens.forEach(s=>$('#'+s).classList.toggle('active',s===id));window.scrollTo(0,0)}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2200)}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function setClock(){$('#clock').textContent=new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
setClock();setInterval(setClock,30000);
function buildInputs(){
 $('#playerCount').textContent=players.length+' জন';
 $('#playerInputs').innerHTML=players.map((p,i)=>'<div class="player-input"><span class="player-num">'+String(i+1).padStart(2,'0')+'</span><input maxlength="18" aria-label="খেলোয়াড় '+(i+1)+'" data-index="'+i+'" value="'+escapeHtml(p)+'" placeholder="খেলোয়াড়ের নাম"></div>').join('');
 $$('#playerInputs input').forEach(el=>el.addEventListener('input',e=>players[+e.target.dataset.index]=e.target.value));
}
function setup(m){
 mode=m;players=['রাফি','নাবিলা','তানভীর','মেহজাবিন','সাকিব'];
 $('#storyBrief').classList.toggle('hidden',m!=='story');
 $('#setupTitle').textContent=m==='story'?'অপারেশন শুরু করুন':m==='fun'?'হাসির ম্যাচ তৈরি করুন':'ম্যাচ তৈরি করুন';
 $('#setupDesc').textContent=m==='story'?'এই রাতের রহস্য সমাধান করতে হবে।':'সবাইকে নাম দিন। এরপর ফোনটি একে একে সবার হাতে দিন।';
 buildInputs();show('setupScreen');
}
function shuffle(a){const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
function assignRoles(){
 const n=players.length, bag=[];
 const crew=shuffle(['commander','engineer','analyst','security','medic']);
 bag.push(...crew.slice(0,n===5?4:5),'saboteur');
 if(n>=7)bag.push('double');
 if(n===8)bag.push('saboteur');
 roles=shuffle(bag).map(k=>({...roleData[k],key:k}));
}
function start(){
 players=$$('#playerInputs input').map((el,i)=>el.value.trim()||'খেলোয়াড় '+(i+1));
 if(new Set(players.map(x=>x.toLocaleLowerCase())).size!==players.length){toast('প্রত্যেকের আলাদা নাম দিন।');return}
 totalRounds=+$('#duration').value;assignRoles();
 alive=players.map((_,i)=>i);round=1;signal=65;logs=[];actions=[];votes=[];scores=players.map(()=>0);
 protectionTarget=null;voteResult=null;personalReports={};phase='reveal';
 $('#passScreen').innerHTML='';
 currentReveal(0);show('passScreen');
}
function currentReveal(i){
 const r=roles[i];
 $('#passScreen').innerHTML='<div class="section-kicker">PRIVATE ACCESS · DO NOT SHARE</div><div class="pass-lock">'+r.icon+'</div><p class="muted center">এখন ফোনটি শুধু এই খেলোয়াড় দেখবেন</p><h2 class="center">'+escapeHtml(players[i])+'</h2><div class="pass-card"><div class="pass-label">আপনার গোপন পরিচয়</div><div class="role-icon">'+r.icon+'</div><h3>'+r.name+'</h3><p>'+r.desc+'</p><div class="role-objective"><span>আপনার গোপন লক্ষ্য</span><b>'+r.goal+'</b></div></div><button class="primary-btn full" id="revealNext">'+(i===players.length-1?'সবাই প্রস্তুত, শুরু হোক':'পরিচয় লুকান এবং ফোন দিন')+' <span>✓</span></button><p class="tiny-note center">অন্য খেলোয়াড়কে আপনার পরিচয় দেখাবেন না।</p>';
 $('#revealNext').onclick=()=>{if(i+1<players.length)currentReveal(i+1);else startRound()};
}
function addLog(t){logs.unshift(t);logs=logs.slice(0,10)}
function eventForRound(){
 const list=mode==='fun'?funEvents:storyEvents;
 const e=list[(round-1)%list.length];signal=Math.max(0,Math.min(100,signal+e[2]));
 return e;
}
function startRound(){
 if(checkVictory())return;
 actions=[];votes=[];protectionTarget=null;voteResult=null;personalReports={};
 const e=eventForRound();
 addLog('রাউন্ড '+round+' শুরু। '+e[0]+'।');
 if(mode==='story')$('#eventText').textContent=storyBeats[(round-1)%storyBeats.length]+' '+e[1];
 turnOrder=shuffle([...alive]);turnIndex=0;phase='actions';
 showHandover(turnOrder[0],'গোপন অ্যাকশন শুরু হবে',()=>showActionTurn(turnOrder[0]));
}
function showHandover(pid,sub,callback){
 $('#passScreen').innerHTML='<div class="section-kicker">PASS THE DEVICE</div><div class="pass-lock">▣</div><p class="muted center">'+sub+'</p><h2 class="center">'+escapeHtml(players[pid])+'</h2><div class="pass-card center"><div class="pass-label">PRIVATE TURN</div><h3>আপনি প্রস্তুত?</h3><p>নিশ্চিত করুন অন্য কেউ স্ক্রিন দেখছে না। আপনার সিদ্ধান্ত গোপন থাকবে।</p></div><button class="primary-btn full" id="privateReady">শুধু আমার টার্ন খুলুন <span>↗</span></button>';
 $('#privateReady').onclick=callback;show('passScreen');
}
function targetOptions(exclude){
 return alive.filter(i=>i!==exclude).map(i=>'<option value="'+i+'">'+escapeHtml(players[i])+'</option>').join('');
}
function showActionTurn(pid){
 const r=roles[pid];let extra='';
 if(r.key==='analyst'||r.key==='security')extra='<label class="turn-label">যাকে পরীক্ষা করবেন<select id="turnTarget"><option value="">খেলোয়াড় নির্বাচন করুন</option>'+targetOptions(pid)+'</select></label>';
 if(r.key==='medic')extra='<label class="turn-label">যাকে সুরক্ষা দেবেন<select id="turnTarget"><option value="">খেলোয়াড় নির্বাচন করুন</option>'+alive.map(i=>'<option value="'+i+'">'+escapeHtml(players[i])+'</option>').join('')+'</select></label>';
 if(r.key==='double')extra='<div class="action-options"><label class="choice-btn"><input type="radio" name="doubleAct" value="leak" checked> সিগন্যাল ৬% কমান</label><label class="choice-btn"><input type="radio" name="doubleAct" value="hide"> নীরবে ৪% মেরামত করুন</label></div>';
 const report=personalReports[pid]?'<div class="role-objective"><span>আপনার আগের রিপোর্ট</span><b>'+personalReports[pid]+'</b></div>':'';
 $('#passScreen').innerHTML='<div class="section-kicker">PRIVATE ACTION · ROUND '+round+'</div><div class="pass-lock">'+r.icon+'</div><p class="muted center">শুধু '+escapeHtml(players[pid])+' দেখুন</p><h2 class="center">'+r.name+'</h2><div class="pass-card"><div class="pass-label">আপনার গোপন অ্যাকশন</div><h3>'+r.actionLabel+'</h3><p>'+r.actionDesc+'</p>'+extra+report+'</div><button class="primary-btn full" id="submitAction">অ্যাকশন জমা দিন <span>✓</span></button><p class="tiny-note center">জমা দেওয়ার পর আপনার সিদ্ধান্ত আর বদলানো যাবে না।</p>';
 $('#submitAction').onclick=()=>{
  const entry={pid,action:r.action};
  if(r.key==='double')entry.action=$('input[name="doubleAct"]:checked').value;
  if(r.target||r.key==='medic'){const v=$('#turnTarget').value;if(v===''){toast('একজন খেলোয়াড় নির্বাচন করুন।');return}entry.target=+v}
  actions.push(entry);turnIndex++;
  if(turnIndex<turnOrder.length){showHandover(turnOrder[turnIndex],'আপনার অ্যাকশন গোপনে জমা হয়েছে',()=>showActionTurn(turnOrder[turnIndex]))}
  else resolveActions();
 };
 show('passScreen');
}
function resolveActions(){
 let repair=0,damage=0,protect=null,summary=[];
 actions.forEach(a=>{
  const r=roles[a.pid];
  if(a.action==='coordinate'){repair+=5;scores[a.pid]+=1;summary.push(players[a.pid]+' দলের সমন্বয় করেছে')}
  if(a.action==='repair'){repair+=12;scores[a.pid]+=1;summary.push('পাওয়ার সিস্টেম মেরামতের চেষ্টা হয়েছে')}
  if(a.action==='sabotage'){damage+=14;scores[a.pid]+=2;summary.push('সিগন্যাল লাইনে নাশকতার চেষ্টা হয়েছে')}
  if(a.action==='leak'){damage+=6;scores[a.pid]+=1}
  if(a.action==='hide'){repair+=4;scores[a.pid]+=1}
  if(a.action==='protect'){protect=a.target;protectionTarget=a.target;summary.push(players[a.target]+' এর নিরাপত্তা জোরদার হয়েছে')}
  if(a.action==='investigate'||a.action==='scan'){
   const isThreat=roles[a.target].team==='enemy';
   const text=a.action==='investigate'?(isThreat?'তদন্তে অসামঞ্জস্যপূর্ণ লগ পাওয়া গেছে। লক্ষ্যটি বিপজ্জনক হতে পারে।':'তদন্তে এখনো অপরাধের নির্ভরযোগ্য প্রমাণ মেলেনি।'):(isThreat?'অ্যাক্সেস লগে সন্দেহজনক প্রবেশ নিশ্চিত।':'অ্যাক্সেস লগে সরাসরি নাশকতার প্রমাণ নেই।');
   personalReports[a.pid]=players[a.target]+': '+text;
   summary.push('একটি গোপন তদন্ত সম্পন্ন হয়েছে');
  }
 });
 if(protect!==null)damage=Math.max(0,damage-8);
 signal=Math.max(0,Math.min(100,signal+repair-damage));
 addLog('গোপন অ্যাকশন শেষ। সিগন্যাল '+(repair-damage>=0?'+':'')+(repair-damage)+'%।');
 lastRoundSummary=summary.length?summary.join(' · '):'কোনো বিশেষ অ্যাকশন ধরা পড়েনি।';
 if(checkVictory())return;
 renderGame('আলোচনা ও প্রমাণ','সব গোপন অ্যাকশন শেষ। নিজেদের সূত্র নিয়ে আলোচনা করুন, কিন্তু ব্যক্তিগত রিপোর্ট অন্যকে দেখাবেন না।');
 phase='discussion';$('#nextPhase').textContent='গোপন ভোট শুরু করুন →';show('gameScreen');
 if(checkVictory())return;
}
function renderGame(title,desc){
 const list=mode==='fun'?funEvents:storyEvents,e=list[(round-1)%list.length];
 $('#roundLabel').textContent='ROUND '+String(round).padStart(2,'0')+' / '+String(totalRounds).padStart(2,'0');
 $('#phaseTitle').textContent=title||'কন্ট্রোল রুম';
 $('#eventTitle').textContent=e[0];if(!$('#eventText').textContent||phase!=='actions')$('#eventText').textContent=desc||e[1];
 $('#signalValue').textContent=signal+'%';$('#signalBar').style.width=signal+'%';
 $('#playerBoard').innerHTML=players.map((p,i)=>'<div class="player-chip '+(alive.includes(i)?'':'dead')+'"><span class="avatar">'+(i+1)+'</span><div>'+escapeHtml(p)+'<small>'+(alive.includes(i)?'সক্রিয়':'বিচ্ছিন্ন')+'</small></div></div>').join('');
 $('#aliveCount').textContent=alive.length+' জন সক্রিয়';
 $('#phaseAction').innerHTML='<h3>সিস্টেম রিপোর্ট</h3><p>'+escapeHtml(desc||lastRoundSummary)+'</p><div class="role-objective"><span>সিগন্যাল স্ট্যাটাস</span><b>'+signal+'% · '+(signal>50?'যোগাযোগ স্থিতিশীল':signal>20?'যোগাযোগ ঝুঁকিতে':'জরুরি অবস্থা')+'</b></div>';
 $('#logList').innerHTML=logs.map(x=>'<div class="log-item">'+escapeHtml(x)+'</div>').join('');
}
function startVoting(){
 phase='voting';votes=[];turnOrder=shuffle([...alive]);turnIndex=0;
 showHandover(turnOrder[0],'এখন প্রত্যেকে গোপনে ভোট দেবেন',()=>showVoteTurn(turnOrder[0]));
}
function showVoteTurn(pid){
 $('#passScreen').innerHTML='<div class="section-kicker">SECRET BALLOT · ROUND '+round+'</div><div class="pass-lock">◎</div><p class="muted center">শুধু '+escapeHtml(players[pid])+' দেখুন</p><h2 class="center">আপনার ভোট</h2><div class="pass-card"><div class="pass-label">কাকে সন্দেহ করছেন?</div><h3>একজনকে নির্বাচন করুন</h3><p>আপনার ভোট অন্য কেউ দেখতে পাবে না। নিজের নাম বাদে যেকোনো সক্রিয় খেলোয়াড়কে ভোট দিতে পারেন।</p><div class="action-options">'+alive.filter(i=>i!==pid).map(i=>'<label class="choice-btn"><input type="radio" name="ballot" value="'+i+'"> '+escapeHtml(players[i])+'</label>').join('')+'<label class="choice-btn"><input type="radio" name="ballot" value="-1"> কাউকে নয় · Abstain</label></div></div><button class="primary-btn full" id="castVote">গোপন ভোট জমা দিন <span>✓</span></button>';
 $('#castVote').onclick=()=>{const v=$('input[name="ballot"]:checked');if(!v){toast('একটি ভোট নির্বাচন করুন।');return}votes.push({voter:pid,target:+v.value});turnIndex++;if(turnIndex<turnOrder.length)showHandover(turnOrder[turnIndex],'আপনার ভোট গোপনে জমা হয়েছে',()=>showVoteTurn(turnOrder[turnIndex]));else tallyVotes()};
 show('passScreen');
}
function tallyVotes(){
 const counts={};votes.forEach(v=>{if(v.target>=0)counts[v.target]=(counts[v.target]||0)+1});
 const max=Math.max(0,...Object.values(counts)),leaders=Object.keys(counts).filter(k=>counts[k]===max).map(Number);
 let eliminated=null,reason='';
 if(leaders.length===1&&max>0){
  const target=leaders[0];
  if(target===protectionTarget){reason=players[target]+' সবচেয়ে বেশি ভোট পেয়েছে, কিন্তু চিকিৎসকের সুরক্ষায় বেঁচে গেছে।';}
  else{eliminated=target;alive=alive.filter(i=>i!==target);reason=players[target]+' সবচেয়ে বেশি ভোট পেয়ে কন্ট্রোল রুম থেকে বহিষ্কৃত হয়েছে।';}
 }else reason=max===0?'কেউ ভোট পায়নি। কাউকে বহিষ্কার করা হয়নি।':'ভোট সমান হয়েছে। কাউকে বহিষ্কার করা হয়নি।';
 voteResult={eliminated,reason,counts,leaders};
 if(eliminated!==null){addLog(reason+' পরিচয়: '+roles[eliminated].name);if(roles[eliminated].team==='crew')signal=Math.max(0,signal-5)}
 else{addLog(reason);signal=Math.max(0,signal-3)}
 phase='result';renderGame('ভোটের ফলাফল',reason+' '+(eliminated!==null?'গোপন পরিচয়: '+roles[eliminated].name:'পরের রাউন্ডে আবার চেষ্টা করুন।'));
 $('#phaseAction').innerHTML='<h3>ভোট গণনা সম্পন্ন</h3><p>'+escapeHtml(reason)+'</p><div class="reveal-list">'+players.map((p,i)=>{const n=counts[i]||0;return '<div class="reveal-item"><b>'+escapeHtml(p)+'</b><span>'+(alive.includes(i)?'সক্রিয়':'বহিষ্কৃত')+' · '+n+' ভোট</span></div>'}).join('')+'</div>';
 $('#nextPhase').textContent='ফলাফল নিশ্চিত করুন →';show('gameScreen');
}
function checkVictory(){
 const threats=alive.filter(i=>roles[i].team==='enemy').length;
 const crew=alive.filter(i=>roles[i].team==='crew').length;
 if(signal<=0){endGame('enemy','সিগন্যাল সম্পূর্ণ বন্ধ। সাবোটিয়ারদের পরিকল্পনা সফল হয়েছে।');return true}
 if(threats===0){endGame('crew','সব সাবোটিয়ার শনাক্ত হয়েছে। ঢাকার নেটওয়ার্ক আবার চালু করা সম্ভব।');return true}
 if(threats>=crew){endGame('enemy','সাবোটিয়াররা এখন কন্ট্রোল রুমের সংখ্যাগরিষ্ঠতা পেয়েছে।');return true}
 if(alive.length<=2&&threats>0){endGame('enemy','শেষ মুহূর্তেও সাবোটিয়ারকে থামানো যায়নি।');return true}
 return false;
}
function finishRound(){
 if(checkVictory())return;
 if(round>=totalRounds){endGame('enemy','সময় শেষ। শেষ সংকেতের আগে সাবোটিয়ারদের ধরা যায়নি।');return}
 round++;startRound();
}
function endGame(winner,message){
 phase='end';const crewWon=winner==='crew';
 const doubleAlive=alive.some(i=>roles[i].team==='solo');
 $('#endSymbol').textContent=crewWon?'◈':'☠';$('#endSymbol').style.color=crewWon?'var(--cyan)':'var(--red)';
 $('#endTitle').textContent=crewWon?'সংকেত ফিরে এসেছে':'শেষ সংকেত হারিয়ে গেছে';
 $('#endText').textContent=message+(doubleAlive?' ডাবল এজেন্টও শেষ পর্যন্ত টিকে গেছে!':'');
 $('#revealList').innerHTML=players.map((p,i)=>'<div class="reveal-item"><b>'+escapeHtml(p)+'</b><span>'+roles[i].name+' · '+(alive.includes(i)?'শেষ পর্যন্ত টিকে':'বহিষ্কৃত')+'</span></div>').join('');
 show('endScreen');
}
function next(){
 if(phase==='discussion'){startVoting();return}
 if(phase==='result'){finishRound();return}
}
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>setup(b.dataset.mode)));
$('#backHome').onclick=()=>show('homeScreen');
$('#homeLink').onclick=e=>{e.preventDefault();show('homeScreen')};
$('#addPlayer').onclick=()=>{if(players.length>=8){toast('সর্বোচ্চ ৮ জন খেলতে পারবেন।');return}players.push('খেলোয়াড় '+(players.length+1));buildInputs()};
$('#removePlayer').onclick=()=>{if(players.length<=5){toast('কমপক্ষে ৫ জন লাগবে।');return}players.pop();buildInputs()};
$('#beginGame').onclick=start;
$('#nextPhase').onclick=next;
$('#playAgain').onclick=()=>setup(mode);
$('#goHome').onclick=()=>show('homeScreen');
})();