'use client';

import { useEffect, useState } from 'react';
import { MousePointer2, Play, Pause, Maximize, Folder, LayoutGrid, Plus, SlidersHorizontal, ChevronRight, Sparkles } from 'lucide-react';

export function ProductDemo() {
  const [playing,setPlaying]=useState(false);
  const [zoom,setZoom]=useState(true);
  const [time,setTime]=useState(0);
  useEffect(()=>{ if(!playing)return; const id=setInterval(()=>setTime(t=>(t+1)%24),1000); return ()=>clearInterval(id); },[playing]);
  return <div className="demo-shell" id="demo">
    <div className="demo-scene">
      <div className="scene-grain"/>
      <span className="demo-note note-top">a little focus goes a long way <span>↘</span></span>
      <div className={`sample-app ${playing?'is-playing':''} ${zoom?'with-zoom':''}`}>
        <div className="sample-title"><span className="traffic"><i/><i/><i/></span><span>Studio / Website refresh</span><SlidersHorizontal size={13}/></div>
        <div className="sample-layout"><aside className="sample-sidebar"><div className="sample-logo"><span>m</span>mellow</div><span><LayoutGrid size={13}/> Overview</span><span className="selected"><Folder size={13}/> Projects <b>4</b></span><span><Plus size={13}/> New project</span><div className="sidebar-bottom">YOUR WORKSPACE<span className="avatar-stack"><i>J</i><i>A</i><i>M</i><b>+2</b></span></div></aside>
          <div className="sample-content"><div className="sample-breadcrumb">Projects <ChevronRight size={11}/> Website refresh</div><div className="sample-heading"><div><span className="sample-overline">LET’S MAKE SOMETHING GOOD</span><h3>Website refresh<span>✳</span></h3><p>A fresh start for a familiar feeling.</p></div><span className="sample-new">+ New task</span></div>
            <div className="sample-tabs"><b>Board <span>8</span></b><span>Timeline</span><span>Files</span></div>
            <div className="kanban"><div className="kanban-column"><div className="column-title"><i/>To do <small>3</small><Plus size={11}/></div><div className="task-card"><span className="task-tag">STRATEGY</span><h4>A clearer story</h4><p>Find the words that feel like us.</p><div className="task-meta"><span>Sep 12</span><i>J</i></div></div><div className="task-card small-card"><span className="task-tag peach">DESIGN</span><h4>Explore new directions</h4><div className="color-swatches"><i/><i/><i/><i/></div></div></div><div className="kanban-column"><div className="column-title"><i className="orange"/>In progress <small>2</small><Plus size={11}/></div><div className="task-card focus-task"><div className="card-art"><div className="art-orb"/><span>Less,<br/>but better.</span><i>m.</i></div><h4>The new homepage</h4><p>Give the good stuff room to breathe.</p><div className="task-meta"><span>Sep 14</span><i>A</i></div></div></div><div className="kanban-column last-column"><div className="column-title"><i className="green"/>Done <small>3</small></div><div className="task-card"><span className="task-tag green-tag">RESEARCH</span><h4>Listen first</h4><p>What our community is saying.</p><div className="task-meta"><span>Sep 08</span><i>M</i></div></div></div></div>
          </div>
        </div><div className="demo-pointer"><MousePointer2 size={28} fill="#20251f"/><span>You</span></div>
      </div>
      <div className="focus-chip"><span className="orange-dot"/><span>Auto zoom</span><b>{playing&&zoom?'1.75':'1.0'}×</b><span className="chip-divider"/><MousePointer2 size={13}/><span>Smooth cursor</span></div>
      <span className="demo-caption">Interactive illustration · not a recorded video</span>
    </div>
    <div className="demo-controls"><button className="play-button" aria-label={playing?'Pause demo':'Play demo'} onClick={()=>setPlaying(p=>!p)}>{playing?<Pause size={17} fill="currentColor"/>:<Play size={17} fill="currentColor"/>}</button><span className="demo-time">00:{String(time).padStart(2,'0')} <span>/ 00:24</span></span><div className="demo-progress"><i style={{width:`${time/24*100}%`}}/></div><button className={`zoom-toggle ${zoom?'active':''}`} onClick={()=>setZoom(z=>!z)} aria-pressed={zoom}><Maximize size={14}/><span>Auto zoom {zoom?'on':'off'}</span></button></div>
  </div>;
}
