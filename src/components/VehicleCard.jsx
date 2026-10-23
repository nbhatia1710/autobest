import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { money } from '../lib/seed';
export function VehicleImage({vehicle, ...props}) {
  return <img src={vehicle.image || '/media/placeholder.svg'} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} onError={e => {e.currentTarget.onerror=null; e.currentTarget.src='/media/placeholder.svg';}} {...props}/>;
}
export default function VehicleCard({vehicle, onOpen, onPurchase, busy}) {
  function tilt(e) {
    if (e.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r=e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.transform=`perspective(1000px) rotateX(${-(e.clientY-r.top-r.height/2)/r.height*9}deg) rotateY(${(e.clientX-r.left-r.width/2)/r.width*9}deg)`;
  }
  return <article className="vehicle-card" onPointerMove={tilt} onPointerLeave={e=>e.currentTarget.style.transform=''}>
    <button className="car-image-button" onClick={()=>onOpen(vehicle)} aria-label={`Explore ${vehicle.make} ${vehicle.model}`}>
      <VehicleImage vehicle={vehicle} loading="lazy"/>
      <span className="year-label">{vehicle.year}</span><span className={`stock ${vehicle.quantity===0?'sold':''}`}><i/>{vehicle.quantity===0?'Sold out':vehicle.quantity<=2?`${vehicle.quantity} left`:'Available'}</span>
      <span className="hover-caption">Click to know more <ArrowUpRight size={18}/></span>
    </button>
    <div className="car-body"><p className="eyebrow">{vehicle.make} <span>{vehicle.category}</span></p><button className="car-name" onClick={()=>onOpen(vehicle)}>{vehicle.model}<ArrowUpRight size={21}/></button>
      <p className="car-spec">{vehicle.year} <span>·</span> {vehicle.fuel || 'Fuel not listed'} <span>·</span> {vehicle.transmission || 'Transmission not listed'}</p>
      <div className="car-bottom"><div><span className="price">{money(vehicle.price)}</span><small>{vehicle.quantity} in stock</small></div><button className="purchase-link" disabled={!vehicle.quantity || busy} onClick={()=>onPurchase(vehicle)}>{busy?'Processing…':vehicle.quantity?'Purchase':'Out of stock'}{vehicle.quantity>0 && <ArrowRight size={16}/>}</button></div>
    </div>
  </article>;
}
