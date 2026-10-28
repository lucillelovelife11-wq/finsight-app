// Lightweight DOM for running every actual inline page module together, without desktop/browser access.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function pageHarness(fixture){
 const all=[],byId=new Map();let ctx;
 function match(n,selector){if(selector.startsWith('#'))return n.id===selector.slice(1);if(selector.startsWith('.'))return n.className.split(/\s+/).includes(selector.slice(1));if(selector.startsWith('[')){const key=selector.slice(1,-1);return Object.hasOwn(n.attrs,key);}return n.tagName.toLowerCase()===selector;}
 class Element{
  constructor(tag='div',attrs={}){this.tagName=tag.toUpperCase();this.attrs=attrs;this.children=[];this.parentElement=null;this.listeners={};this.style={};this._html='';this._value=attrs.value||'';this.disabled='disabled'in attrs;this.hidden='hidden'in attrs;this.selected='selected'in attrs;this.dataset={};for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=v;this.className=attrs.class||'';this.id=attrs.id||'';this.classList={toggle:(key,force)=>{const xs=new Set(this.className.split(/\s+/).filter(Boolean));if(force??!xs.has(key))xs.add(key);else xs.delete(key);this.className=[...xs].join(' ');},add:key=>this.classList.toggle(key,true),remove:key=>this.classList.toggle(key,false)};all.push(this);if(this.id)byId.set(this.id,this);}
  set value(v){this._value=String(v);}get value(){return this._value;}
  set innerHTML(html){const remove=n=>{for(const c of n.children)remove(c);if(n.id&&byId.get(n.id)===n)byId.delete(n.id);n.removed=true;};for(const c of this.children)remove(c);this.children=[];this._html=String(html);parse(this._html,this);}
  get innerHTML(){return this._html;}
  set textContent(v){this._html=String(v);this.children=[];}get textContent(){return this._html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
  appendChild(n){n.parentElement=this;this.children.push(n);if(n.id)byId.set(n.id,n);if(this.tagName==='SELECT'&&(!this._value||n.selected))this._value=n.value;return n;}
  querySelectorAll(selector){const nodes=[];const walk=n=>{for(const c of n.children){if(match(c,selector))nodes.push(c);walk(c);}};walk(this);return nodes;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}
  focus(){this.focused=true;}scrollIntoView(){}
  async click(){if(this.disabled)return;if(typeof this.onclick==='function')await this.onclick();else if(this.attrs.onclick)await vm.runInContext(this.attrs.onclick,ctx);for(const fn of this.listeners.click||[])await fn({target:this});}
  dispatchEvent(e){for(const fn of this.listeners[e.type]||[])fn({target:this});}
 }
 function parse(html,root){const stack=[root],tags=/<\/?([a-zA-Z][\w-]*)([^>]*?)>/g;let m;while((m=tags.exec(html))){if(m[0].startsWith('</')){if(stack.length>1)stack.pop();continue;}const attrs={};const re=/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;let a;while((a=re.exec(m[2])))attrs[a[1]]=a[2]??a[3]??a[4]??'';const n=new Element(m[1],attrs);stack.at(-1).appendChild(n);if(!/^(input|img|link|meta|br|hr)$/i.test(m[1])&&!m[0].endsWith('/>'))stack.push(n);}}
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),body=new Element('body');parse(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,''),body);
 const document={getElementById:id=>byId.get(id)||null,createElement:tag=>new Element(tag),querySelectorAll:s=>body.querySelectorAll(s),querySelector:s=>body.querySelector(s)};
 const events={};ctx={document,console,navigator:{},location:{protocol:'https:'},Date,URL,Blob,Event,setTimeout,clearTimeout,alert:message=>{ctx.lastAlert=message;},fetch:async()=>({ok:true,json:async()=>fixture}),addEventListener(type,fn){(events[type]??=[]).push(fn);},scrollTo(){},print(){}};ctx.window=ctx;vm.createContext(ctx);
 const errors=[];for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){try{vm.runInContext(m[1],ctx,{timeout:10000});}catch(e){errors.push(e.stack);}}
 return {ctx,errors,get:document.getElementById,run:code=>vm.runInContext(code,ctx)};
}
module.exports=pageHarness;
