import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
export default function Modal({title,onClose,children,wide=false}) {
  const ref=useRef(null);
  useEffect(()=>{const previous=document.activeElement; const dialog=ref.current; dialog.showModal(); const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old;dialog.close();previous?.focus();};},[]);
  return <dialog ref={ref} className={`modal ${wide?'modal-wide':''}`} aria-label={title} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose();}}}><button className="close-button" aria-label="Close dialog" onClick={onClose}><X size={21}/></button>{children}</dialog>;
}
