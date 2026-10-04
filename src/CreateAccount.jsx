import React, {useState} from 'react';
import {ArrowRight, Gamepad2, Check, Users} from 'lucide-react';
import LocationPicker from './LocationPicker.jsx';
import {isValidLocation} from './locations.js';
import './signup.css';

export default function CreateAccount({profile, games, onCreate}) {
 const [draft,setDraft]=useState(()=>({...profile}));
 const [email,setEmail]=useState('jamie.parker@example.com');
 const [password,setPassword]=useState('TestQueue2048!');
 const [confirmation,setConfirmation]=useState('TestQueue2048!');
 const [error,setError]=useState('');
 const update=(key,value)=>setDraft(current=>({...current,[key]:value}));
 const submit=event=>{
  event.preventDefault();
  if(password!==confirmation){setError('Your passwords must match.');return;}
  if(!draft.name.trim()||!draft.handle.trim()||!draft.ign.trim()){setError('Enter your name, username, and in-game name.');return;}
  if(!isValidLocation(draft.location)||!draft.games.length)return;
  onCreate({...draft,name:draft.name.trim(),handle:draft.handle.trim(),ign:draft.ign.trim(),email:email.trim()});
 };
 return <div className="signup-page">
  <header className="topbar"><div className="brand"><span className="brand-icon"><Gamepad2 size={25}/></span>SocialQueue<span className="brand-dot">.</span></div><span className="signup-demo">Test account</span></header>
  <main className="signup-layout">
   <section className="signup-intro"><div className="eyebrow"><span/> YOUR NEXT GREAT TEAM STARTS HERE</div><h1>Find your people.<br/><span>Play your game.</span></h1><p>A few details. A whole new party. Create your player card and meet people who share your games.</p><div className="signup-preview"><img src={draft.image} alt="Test account profile"/><div><strong>{draft.name}</strong><span>@{draft.handle}</span><small><Users size={14}/> Ready for good company</small></div></div><div className="signup-perks"><span><Check size={17}/> Find nearby players</span><span><Check size={17}/> Share your favorite games</span><span><Check size={17}/> Bring your next party together</span></div></section>
   <section className="signup-card" aria-labelledby="signup-heading"><div className="eyebrow">LET’S GET YOU STARTED</div><h2 id="signup-heading">Create your account</h2><p className="signup-description">Everything is filled out for a test account. Keep these details or make them yours.</p>
    <form onSubmit={submit}><div className="form-fields">
     <label>Name<input autoComplete="name" required maxLength={35} value={draft.name} onChange={e=>update('name',e.target.value)}/></label>
     <label>Username<input autoComplete="username" required maxLength={25} value={draft.handle} onChange={e=>update('handle',e.target.value)}/></label>
     <label className="full-width">Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
     <label>Password<input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e=>{setPassword(e.target.value);setError('');}}/></label>
     <label>Confirm password<input type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={e=>{setConfirmation(e.target.value);setError('');}}/></label>
     <LocationPicker location={draft.location} onChange={location=>update('location',location)}/>
     <label>In-game name<input required value={draft.ign} onChange={e=>update('ign',e.target.value)}/></label>
     <label>Region<select value={draft.region} onChange={e=>update('region',e.target.value)}>{['North America','Europe','Asia','Oceania','South America'].map(region=><option key={region}>{region}</option>)}</select></label>
     <label>Playstyle<select value={draft.style} onChange={e=>update('style',e.target.value)}><option>Casual</option><option>Competitive</option></select></label>
     <label className="full-width">About you<textarea maxLength={350} value={draft.bio} onChange={e=>update('bio',e.target.value)}/></label>
    </div><fieldset className="signup-games"><legend>Your games</legend><div className="edit-game-chips">{games.map(game=><button type="button" key={game} aria-pressed={draft.games.includes(game)} className={draft.games.includes(game)?'chosen':''} onClick={()=>update('games',draft.games.includes(game)?draft.games.filter(item=>item!==game):[...draft.games,game])}>{game}</button>)}</div></fieldset>
    {error&&<p className="signup-error" role="alert">{error}</p>}
    {!draft.games.length&&<p className="signup-error" role="status">Choose at least one game to continue.</p>}
    <button className="primary signup-submit" disabled={!isValidLocation(draft.location)||!draft.games.length}>Create account <ArrowRight size={17}/></button><p className="signup-note">Demo account · no real registration required.</p>
    </form>
   </section>
  </main>
 </div>;
}
