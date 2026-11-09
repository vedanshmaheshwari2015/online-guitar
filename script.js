const chords = [
  {name:'G',type:'Major',frets:[3,2,0,0,0,3],fingers:[2,1,0,0,0,3]},
  {name:'C',type:'Major',frets:[-1,3,2,0,1,0],fingers:[0,3,2,0,1,0]},
  {name:'D',type:'Major',frets:[-1,-1,0,2,3,2],fingers:[0,0,0,1,3,2]},
  {name:'A',type:'Major',frets:[-1,0,2,2,2,0],fingers:[0,0,1,2,3,0]},
  {name:'E',type:'Major',frets:[0,2,2,1,0,0],fingers:[0,2,3,1,0,0]},
  {name:'F',type:'Major',frets:[1,3,3,2,1,1],fingers:[1,3,4,2,1,1],barre:1},
  {name:'Am',type:'Minor',frets:[-1,0,2,2,1,0],fingers:[0,0,2,3,1,0]},
  {name:'Em',type:'Minor',frets:[0,2,2,0,0,0],fingers:[0,2,3,0,0,0]},
  {name:'Dm',type:'Minor',frets:[-1,-1,0,2,3,1],fingers:[0,0,0,2,3,1]},
  {name:'Bm',type:'Minor',frets:[-1,2,4,4,3,2],fingers:[0,1,3,4,2,1],barre:2},
  {name:'G7',type:'Seventh',frets:[3,2,0,0,0,1],fingers:[3,2,0,0,0,1]},
  {name:'C7',type:'Seventh',frets:[-1,3,2,3,1,0],fingers:[0,3,2,4,1,0]},
  {name:'D7',type:'Seventh',frets:[-1,-1,0,2,1,2],fingers:[0,0,0,2,1,3]},
  {name:'A7',type:'Seventh',frets:[-1,0,2,0,2,0],fingers:[0,0,2,0,3,0]},
  {name:'E7',type:'Seventh',frets:[0,2,0,1,0,0],fingers:[0,2,0,1,0,0]},
  {name:'Fmaj7',type:'Seventh',frets:[-1,-1,3,2,1,0],fingers:[0,0,3,2,1,0]}
];
let selected = chords[0], filter = 'All', audioContext = null, playing = false, playTimer = null, stepTimers = [], soundOn = true;
const grid=document.querySelector('#chordGrid'), search=document.querySelector('#search'), input=document.querySelector('#patternInput');
document.querySelector('#allCount').textContent=chords.length;

function diagram(chord){
  const positive=chord.frets.filter(x=>x>0),base=positive.length&&Math.min(...positive)>1?Math.min(...positive):1;
  const x0=19,y0=15,dx=14,dy=15;let svg='<svg class="diagram" viewBox="0 0 110 105" role="img" aria-label="'+chord.name+' chord fingering">';
  for(let s=0;s<6;s++){const f=chord.frets[s];svg+=`<text x="${x0+s*dx}" y="10" text-anchor="middle" fill="#75847b" font-size="9" font-family="sans-serif">${f<0?'×':f===0?'○':''}</text>`}
  for(let fret=0;fret<=4;fret++)svg+=`<line x1="${x0-6}" y1="${y0+fret*dy}" x2="${x0+5*dx+6}" y2="${y0+fret*dy}" stroke="${fret===0&&base===1?'#314b3f':'#dce3d9'}" stroke-width="${fret===0&&base===1?2.4:1.2}"/>`;
  for(let s=0;s<6;s++)svg+=`<line x1="${x0+s*dx}" y1="${y0}" x2="${x0+s*dx}" y2="${y0+4*dy}" stroke="#cbd5ca" stroke-width="1.2"/>`;
  if(base>1)svg+=`<text x="2" y="${y0+dy*.7}" fill="#718078" font-size="9" font-family="sans-serif">${base}fr</text>`;
  chord.frets.forEach((f,s)=>{if(f>0){const yy=y0+(f-base+.5)*dy;svg+=`<circle cx="${x0+s*dx}" cy="${yy}" r="5" fill="#47755c"/><text x="${x0+s*dx}" y="${yy+2.7}" text-anchor="middle" fill="white" font-size="7" font-family="sans-serif">${chord.fingers[s]||'•'}</text>`}});
  return svg+'</svg>';
}
function render(){const q=search.value.trim().toLowerCase();const visible=chords.filter(c=>(filter==='All'||c.type===filter)&&(`${c.name} ${c.type}`).toLowerCase().includes(q));grid.innerHTML=visible.length?visible.map(c=>`<article class="chord-card ${selected===c?'selected':''}" data-name="${c.name}" tabindex="0" aria-label="Select ${c.name} ${c.type}"><div class="chord-card-top"><div><div class="chord-name">${c.name}</div><div class="chord-type">${c.type}</div></div><button class="play-chord" aria-label="Play ${c.name} chord" data-play="${c.name}">▶</button></div>${diagram(c)}</article>`).join(''):'<div class="empty-state">No chords found. Try another name.</div>';
  grid.querySelectorAll('.chord-card').forEach(card=>{card.addEventListener('click',e=>{if(e.target.closest('[data-play]')){selectChord(chords.find(c=>c.name===card.dataset.name));playChord();return}selectChord(chords.find(c=>c.name===card.dataset.name))});card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectChord(chords.find(c=>c.name===card.dataset.name))}})});
}
function selectChord(chord){selected=chord;document.querySelector('#selectedLabel').textContent=`${chord.name} ${chord.type.toLowerCase()} selected`;render()}
function getAudio(){if(!audioContext)audioContext=new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();return audioContext}
const stringNotes=[82.41,110,146.83,196,246.94,329.63];
function pluck(frequency,when,volume=.09){
  if(!soundOn)return;
  const ctx=getAudio();
  // Karplus–Strong string model: a tiny burst of pick noise circulates in a
  // tuned delay line, gradually losing brightness and energy like a real string.
  const delay=ctx.createDelay(.1), damping=ctx.createBiquadFilter(), feedback=ctx.createGain(), output=ctx.createGain();
  delay.delayTime.setValueAtTime(1/frequency,when);
  damping.type='lowpass';damping.frequency.setValueAtTime(Math.min(6800,Math.max(1700,frequency*13)),when);damping.Q.value=.15;
  feedback.gain.setValueAtTime(.996,when);feedback.gain.setTargetAtTime(.0001,when+1.65,.28);
  output.gain.setValueAtTime(volume,when);output.gain.setTargetAtTime(.0001,when+1.5,.32);
  delay.connect(damping);damping.connect(feedback);feedback.connect(delay);delay.connect(output);output.connect(ctx.destination);
  const duration=.035,samples=Math.max(16,Math.floor(ctx.sampleRate*duration)),noise=ctx.createBuffer(1,samples,ctx.sampleRate),data=noise.getChannelData(0);
  for(let i=0;i<samples;i++){const edge=Math.min(1,i/80,(samples-1-i)/80);data[i]=(Math.random()*2-1)*Math.max(0,edge)}
  const pick=ctx.createBufferSource();pick.buffer=noise;pick.connect(delay);pick.start(when);pick.stop(when+duration);
  setTimeout(()=>{try{delay.disconnect();damping.disconnect();feedback.disconnect();output.disconnect()}catch{}},5000);
}
function playChord(direction='D',when){const ctx=getAudio();when=when??ctx.currentTime;const indexes=selected.frets.map((f,i)=>f<0?-1:i).filter(i=>i>=0);if(direction==='U')indexes.reverse();indexes.forEach((i,n)=>{const fret=selected.frets[i];pluck(stringNotes[i]*Math.pow(2,fret/12),when+n*.023,.065)})}
function steps(){return(input.value.toUpperCase().match(/[DU–—-]/g)||[]).map(x=>x==='–'||x==='—'?'–':x)}
function renderSteps(active=-1){const arr=steps();document.querySelector('#patternChips').innerHTML=arr.map((s,i)=>`<span class="step-chip ${s==='D'?'down':''} ${s==='–'?'rest':''} ${i===active?'current':''}">${s}</span>`).join('')||'<span class="field-hint">Enter D, U, or – for a rest</span>'}
function stop(){playing=false;clearTimeout(playTimer);stepTimers.forEach(clearTimeout);stepTimers=[];document.querySelector('#playIcon').textContent='▶';document.querySelector('#playText').textContent='Play pattern';renderSteps()}
function start(){const pattern=steps();if(!pattern.length)return;stop();playing=true;document.querySelector('#playIcon').textContent='■';document.querySelector('#playText').textContent='Stop pattern';const beat=60000/Number(document.querySelector('#tempo').value);let i=0;const run=()=>{if(!playing)return;const current=i%pattern.length;renderSteps(current);if(pattern[current]==='D'||pattern[current]==='U')playChord(pattern[current]);i++;playTimer=setTimeout(run,beat/2)};run()}
document.querySelector('#filters').addEventListener('click',e=>{const btn=e.target.closest('[data-filter]');if(!btn)return;filter=btn.dataset.filter;document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b===btn));render()});
search.addEventListener('input',render);input.addEventListener('input',()=>renderSteps());document.querySelector('#clearPattern').addEventListener('click',()=>{stop();input.value='';renderSteps()});document.querySelector('#playButton').addEventListener('click',()=>playing?stop():start());
document.querySelector('#tempo').addEventListener('input',e=>{document.querySelector('#tempoValue').textContent=e.target.value;if(playing)start()});
document.querySelector('#soundToggle').addEventListener('click',e=>{soundOn=!soundOn;e.currentTarget.setAttribute('aria-pressed',String(soundOn));document.querySelector('.sound-note').innerHTML=soundOn?'<span>♪</span> Sound plays in your browser':'<span>♪</span> Sound is muted'});
render();renderSteps();

const tabStrings=[{label:'e',midi:64},{label:'B',midi:59},{label:'G',midi:55},{label:'D',midi:50},{label:'A',midi:45},{label:'E',midi:40}];
let tabData=(()=>{try{const saved=JSON.parse(localStorage.getItem('string-tab-song'));if(Array.isArray(saved)&&saved.length===6&&saved.every(row=>Array.isArray(row)&&row.length>=4))return saved.map(row=>row.map(n=>Number.isInteger(n)&&n>=0&&n<=24?n:null))}catch{}return tabStrings.map((_,row)=>Array.from({length:16},(_,col)=>row===0?[0,1,3,1][col]??null:null))})();
let tabPlaying=false,tabTimer=null,tabTimers=[];
function drawTab(){const editor=document.querySelector('#tabEditor'),cols=tabData[0].length;editor.innerHTML=tabData.map((row,r)=>`<div class="tab-row" style="grid-template-columns:35px repeat(${cols},minmax(42px,1fr));min-width:${35+cols*48}px"><span class="tab-string">${tabStrings[r].label}</span>${row.map((f,c)=>`<input class="tab-cell ${c>0&&c%4===0?'measure-start':''}" inputmode="numeric" aria-label="${tabStrings[r].label} string, beat ${c+1}" maxlength="2" value="${f===null?'':f}" data-row="${r}" data-col="${c}" autocomplete="off">`).join('')}</div>`).join('');editor.querySelectorAll('.tab-cell').forEach(cell=>cell.addEventListener('input',()=>{const value=cell.value.trim();if(value===''||/^\d{1,2}$/.test(value)){const fret=value===''?null:Number(value);if(fret!==null&&fret>24){cell.classList.add('invalid');return}tabData[Number(cell.dataset.row)][Number(cell.dataset.col)]=fret;cell.classList.remove('invalid');saveTab()}else{cell.classList.add('invalid');return}drawTabChips()}));drawTabChips()}
function saveTab(){try{localStorage.setItem('string-tab-song',JSON.stringify(tabData))}catch{}}
function drawTabChips(active=-1){const cols=tabData[0]?.length||0;document.querySelector('#tabChips').innerHTML=Array.from({length:cols},(_,c)=>`<span class="step-chip ${active===c?'current':''}">${c+1}</span>`).join('')}
function stopTab(){tabPlaying=false;clearTimeout(tabTimer);tabTimers.forEach(clearTimeout);tabTimers=[];document.querySelector('#tabPlayIcon').textContent='▶';document.querySelector('#tabPlayText').textContent='Play tabs';document.querySelectorAll('.tab-cell').forEach(x=>x.classList.remove('playing'));drawTabChips()}
function startTab(){if(!tabData.some(row=>row.some(n=>n!==null)))return;stopTab();tabPlaying=true;document.querySelector('#tabPlayIcon').textContent='■';document.querySelector('#tabPlayText').textContent='Stop tabs';const tempo=Number(document.querySelector('#tabTempo').value),gap=Number(document.querySelector('#tabGap').value);const delay=60000/tempo*gap;let col=0;const run=()=>{if(!tabPlaying)return;if(col>=tabData[0].length){stopTab();return}const current=col;drawTabChips(current);document.querySelectorAll('.tab-cell').forEach(x=>x.classList.toggle('playing',Number(x.dataset.col)===current));tabData.forEach((row,r)=>{const fret=row[current];if(fret!==null)pluck(tabStrings[r].midi* Math.pow(2,fret/12),getAudio().currentTime,.085)});col++;tabTimer=setTimeout(run,delay)};run()}
document.querySelector('.mode-switch').addEventListener('click',e=>{const button=e.target.closest('[data-mode]');if(!button)return;const tabs=button.dataset.mode==='tabs';document.querySelectorAll('.mode-button').forEach(b=>b.classList.toggle('active',b===button));document.querySelector('#chordMode').hidden=tabs;document.querySelector('#tabMode').hidden=!tabs;if(tabs)stop();else stopTab()});
document.querySelector('#tabPlay').addEventListener('click',()=>tabPlaying?stopTab():startTab());
document.querySelector('#addMeasure').addEventListener('click',()=>{tabData.forEach(row=>row.push(null,null,null,null));saveTab();drawTab();document.querySelector('#tabEditor').scrollLeft=document.querySelector('#tabEditor').scrollWidth});
document.querySelector('#clearTab').addEventListener('click',()=>{stopTab();tabData=tabStrings.map(()=>Array(tabData[0].length).fill(null));saveTab();drawTab()});
document.querySelector('#tabTempo').addEventListener('input',e=>{document.querySelector('#tabTempoValue').textContent=e.target.value;if(tabPlaying)startTab()});
drawTab();
