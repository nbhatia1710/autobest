import { vehicles } from './seed';
import { ApiError } from './api';
import { validateVehicle } from './validation';
const key='autobest.demo.inventory.v1';
function read() { try {return JSON.parse(localStorage.getItem(key)) || structuredClone(vehicles);} catch {return structuredClone(vehicles);} }
function save(rows) {localStorage.setItem(key,JSON.stringify(rows));}
// A browser-only interaction simulator. Never enable this adapter as real authentication.
export function createDemoClient(getUser) {
  function guard(admin=false) { if(!getUser()) throw new ApiError('Please sign in.',401); if(admin && getUser().role!=='admin') throw new ApiError('Administrator access required.',403); }
  function change(id,fn,admin=false) {guard(admin); const rows=read(), index=rows.findIndex(v=>v.id===id); if(index<0) throw new ApiError('Vehicle no longer exists.',404); const updated=fn(rows[index]); if(updated) rows[index]=updated; else rows.splice(index,1); save(rows); return updated;}
  return {
    async login({email,password}) {if(!password) throw new ApiError('Enter a password.',400); return {access_token:'demo-session',user:{email,role:'customer'}};},
    async register({email}) { const accounts=JSON.parse(sessionStorage.getItem('autobest.demo.accounts')||'[]'); if(accounts.includes(email)) throw new ApiError('This email already exists. Please sign in.',409); sessionStorage.setItem('autobest.demo.accounts',JSON.stringify([...accounts,email])); return {email};},
    async list(filters={}) {guard(); return read().filter(v=>['make','model','category'].every(k=>!filters[k] || v[k].toLowerCase().includes(filters[k].toLowerCase())) && (filters.min_price==null || filters.min_price==='' || v.price>=Number(filters.min_price)) && (filters.max_price==null || filters.max_price==='' || v.price<=Number(filters.max_price)));},
    async add(value) {guard(true); const errors=validateVehicle(value); if(Object.keys(errors).length) throw new ApiError('Check the vehicle details.',400,errors); const vehicle={...value,id:crypto.randomUUID()}; save([...read(),vehicle]); return vehicle;},
    async update(id,value) {const errors=validateVehicle(value); if(Object.keys(errors).length) throw new ApiError('Check the vehicle details.',400,errors); return change(id,old=>({...old,...value,id}),true);},
    async remove(id) {return change(id,()=>null,true);},
    async purchase(id) {return change(id,v=>{if(v.quantity<1) throw new ApiError('This vehicle just sold out. Please choose another vehicle.',409); return {...v,quantity:v.quantity-1};});},
    async restock(id,quantity) {if(!Number.isSafeInteger(quantity)||quantity<1) throw new ApiError('Restock quantity must be a positive whole number.',400); return change(id,v=>({...v,quantity:v.quantity+quantity}),true);},
  };
}
